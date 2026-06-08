"""Offline query CLI for the post-mirror.

Subcommands:
  triage  — filter posts per username by keyword bucket (digest format)
  diff    — posts authored / fetched since a given ISO timestamp
  search  — free-form keyword search (FTS5 for ASCII, LIKE for CJK)
  body    — categorize hits into 新刊 / お品書き / 完売 / 通販 / 次回参加 buckets,
            emit JSON for downstream body-update agents

All queries run against the local SQLite mirror — zero X API calls.

CJK handling: FTS5 unicode61 tokenizer doesn't split CJK well (it splits
on whitespace + punctuation, so 新刊 inside a longer post may not match
on the word boundary). We detect CJK keywords (any char ≥ U+3000) and
route them to LIKE '%kw%'; ASCII / hashtag / handle keywords go through
posts_fts MATCH.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import storage  # noqa: E402
import _event_phase as event_phase  # noqa: E402

# Default body-update keyword buckets — matches the editorial categories
# in cho-tsukuyomi-map's EDITORIAL_GUIDELINES.md
DEFAULT_BODY_BUCKETS = {
    "新刊":     ["新刊", "新作", "新本"],
    "お品書き": ["お品書き", "品書", "おしながき", "ラインナップ"],
    "完売":     ["完売", "売切", "売り切れ"],
    "通販":     ["通販", "メロン", "メロンブックス", "とらのあな", "BOOTH", "委託"],
    "次回参加": ["次回", "次イベ", "次は", "コミティア", "コミケ", "ぷにケット", "赤ブー"],
}


def _has_cjk(s: str) -> bool:
    """Return True if s contains any CJK / Japanese character."""
    return any(ord(c) >= 0x3000 for c in s)


def _split_keywords(s: str) -> list[str]:
    """Split a comma-separated keyword list, trimming whitespace."""
    return [k.strip() for k in s.split(",") if k.strip()]


def _username_to_user_id(conn, platform: str, username: str) -> str | None:
    u = storage.find_user_by_username(conn, platform, username.lstrip("@"))
    return u["id"] if u else None


def _search_one_keyword(conn, platform: str, keyword: str, user_ids: list[str] | None,
                       limit: int = 200) -> list[dict]:
    """Find posts matching a single keyword.

    FTS5 unicode61 doesn't split CJK on word boundaries — that means
    Latin keywords embedded inside CJK text (e.g. `BOOTH` inside
    `にBOOTHのリンク`) also miss because the surrounding CJK is one
    long unbroken token. So we use LIKE for everything, COLLATE NOCASE
    for case-insensitive Latin matching. Mirror sizes ~10K posts make
    LIKE fast enough; the FTS5 path is kept only for hashtag-only
    queries (#tag) where the unicode61 split is reliable.
    """
    sql = """
        SELECT p.id, p.user_id, p.created_at, p.text, u.username
        FROM posts p LEFT JOIN users u
          ON p.platform = u.platform AND p.user_id = u.id
        WHERE p.platform = ? AND p.text LIKE ? COLLATE NOCASE
    """
    params = [platform, f"%{keyword}%"]
    if user_ids:
        qs = ",".join("?" * len(user_ids))
        sql += f" AND p.user_id IN ({qs})"
        params.extend(user_ids)
    sql += " ORDER BY p.created_at DESC LIMIT ?"
    params.append(limit)
    return [dict(r) for r in conn.execute(sql, params).fetchall()]


def cmd_search(conn, args) -> int:
    """Free-form search across all posts (optionally filtered to one user)."""
    keywords = _split_keywords(args.query) if "," in args.query else [args.query]
    user_ids = None
    if args.username:
        uid = _username_to_user_id(conn, args.platform, args.username)
        if uid is None:
            print(f"unknown user: @{args.username.lstrip('@')}", file=sys.stderr)
            return 1
        user_ids = [uid]

    seen_ids: set[str] = set()
    results: list[dict] = []
    for kw in keywords:
        for row in _search_one_keyword(conn, args.platform, kw, user_ids, args.limit):
            if row["id"] in seen_ids:
                continue
            seen_ids.add(row["id"])
            results.append(row)
        if len(results) >= args.limit:
            break

    results = results[: args.limit]
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            ts = r["created_at"][:19] if r.get("created_at") else "?"
            u = r.get("username") or "?"
            txt = (r["text"] or "").replace("\n", " ")[:140]
            print(f"  {ts}  @{u}  {r['id']}")
            print(f"    {txt}")
    return 0


def cmd_diff(conn, args) -> int:
    """Posts authored (or fetched) since ISO timestamp."""
    usernames = _split_keywords(args.usernames) if args.usernames else []
    user_ids: list[str] = []
    for un in usernames:
        uid = _username_to_user_id(conn, args.platform, un)
        if uid:
            user_ids.append(uid)
        else:
            print(f"  warn: unknown user @{un.lstrip('@')}", file=sys.stderr)

    col = "fetched_at" if args.fetched_since else "created_at"
    sql = f"""
        SELECT p.id, p.user_id, p.created_at, p.fetched_at, p.text, u.username
        FROM posts p LEFT JOIN users u
          ON p.platform = u.platform AND p.user_id = u.id
        WHERE p.platform = ? AND p.{col} >= ?
    """
    params = [args.platform, args.since]
    if user_ids:
        qs = ",".join("?" * len(user_ids))
        sql += f" AND p.user_id IN ({qs})"
        params.extend(user_ids)
    sql += " ORDER BY p.created_at DESC LIMIT ?"
    params.append(args.limit)

    rows = [dict(r) for r in conn.execute(sql, params).fetchall()]
    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
    else:
        print(f"# {len(rows)} post(s) since {args.since} ({col})", file=sys.stderr)
        for r in rows:
            ts = r["created_at"][:19] if r.get("created_at") else "?"
            u = r.get("username") or "?"
            txt = (r["text"] or "").replace("\n", " ")[:140]
            print(f"  {ts}  @{u}  {r['id']}")
            print(f"    {txt}")
    return 0


def cmd_triage(conn, args) -> int:
    """Per-username digest of posts matching event keywords."""
    usernames = _split_keywords(args.usernames) if args.usernames else []
    if not usernames:
        print("triage: --usernames required", file=sys.stderr)
        return 1
    keywords = _split_keywords(args.keywords) if args.keywords else [
        "新刊", "お品書き", "完売", "通販", "次回",
    ]

    digest: dict[str, list[dict]] = {}
    for un in usernames:
        uid = _username_to_user_id(conn, args.platform, un)
        if uid is None:
            digest[un.lstrip("@")] = [{"warn": "unknown user"}]
            continue
        hits: list[dict] = []
        seen_ids: set[str] = set()
        for kw in keywords:
            for row in _search_one_keyword(conn, args.platform, kw, [uid], args.limit):
                if row["id"] in seen_ids:
                    continue
                seen_ids.add(row["id"])
                hits.append({"keyword": kw, **row})
        digest[un.lstrip("@")] = hits[: args.limit]

    if args.json:
        print(json.dumps(digest, ensure_ascii=False, indent=2))
    else:
        for un, hits in digest.items():
            print(f"\n## @{un}  ({len(hits)} hit{'s' if len(hits) != 1 else ''})")
            for h in hits:
                if "warn" in h:
                    print(f"  ⚠ {h['warn']}")
                    continue
                ts = (h.get("created_at") or "?")[:19]
                txt = (h["text"] or "").replace("\n", " ")[:140]
                print(f"  [{h['keyword']}] {ts}  {h['id']}")
                print(f"    {txt}")
    return 0


def _load_events_for(events_json_path: str | None) -> list[dict]:
    """Load events.json from the given path, or fall back to discovery.

    Discovery order: explicit --events-json arg → $CWD/events.json →
    repo-relative (.../cho-tsukuyomi-map/events.json) inferred from this
    file's location.
    """
    if events_json_path:
        p = Path(events_json_path)
    else:
        candidates = [
            Path.cwd() / "events.json",
            Path(__file__).resolve().parents[4] / "events.json",
        ]
        p = next((c for c in candidates if c.is_file()), candidates[0])
    if not p.is_file():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8")).get("events", [])
    except (json.JSONDecodeError, OSError):
        return []


def cmd_body(conn, args) -> int:
    """Categorize a single user's posts into body-update buckets.

    Output JSON shape (consumed by body-update agents):
      {
        "username": "...",
        "user_id": "...",
        "platform": "...",
        "event": "<slug>",                         # if --event set
        "event_date_window": ["YYYY-MM-DD", ...],  # if --event set
        "buckets": {
          "新刊":     [
            {
              "id": ..., "created_at": ..., "text": ...,
              "event_context": {                    # if --event set
                "time_phase": "...",
                "mentions": [...],
                "this_event_confidence": "..."
              }
            },
            ...
          ],
          ...
        }
      }
    """
    username = args.username.lstrip("@")
    uid = _username_to_user_id(conn, args.platform, username)
    if uid is None:
        print(f"body: unknown user @{username}", file=sys.stderr)
        return 1

    # Bucket definition: explicit override via --buckets <json> or default mapping
    if args.buckets:
        try:
            buckets = json.loads(args.buckets)
        except json.JSONDecodeError as e:
            print(f"--buckets must be JSON dict: {e}", file=sys.stderr)
            return 1
    else:
        buckets = DEFAULT_BODY_BUCKETS

    # Event-context setup (optional)
    target_event = None
    all_events: list[dict] = []
    event_date_window = None
    if args.event:
        all_events = _load_events_for(args.events_json)
        target_event = event_phase.find_event(all_events, args.event)
        if target_event is None:
            print(f"body: unknown event slug '{args.event}'", file=sys.stderr)
            return 1
        win = event_phase.event_window(target_event)
        if win is None:
            print(f"body: event '{args.event}' has no parseable date window",
                  file=sys.stderr)
            return 1
        event_date_window = [win[0].isoformat(), win[1].isoformat()]

    out_buckets: dict[str, list[dict]] = {}
    for bucket_name, kws in buckets.items():
        seen_ids: set[str] = set()
        bucket_hits: list[dict] = []
        for kw in kws:
            for row in _search_one_keyword(conn, args.platform, kw, [uid], args.limit):
                if row["id"] in seen_ids:
                    continue
                seen_ids.add(row["id"])
                hit = {
                    "id": row["id"],
                    "created_at": row["created_at"],
                    "text": row["text"],
                    "match_keyword": kw,
                }
                if target_event is not None:
                    ec = event_phase.compute_event_context(
                        row["text"] or "",
                        row["created_at"] or "",
                        target_event, all_events,
                    )
                    if ec is not None:
                        hit["event_context"] = ec
                bucket_hits.append(hit)
        # Sort newest first
        bucket_hits.sort(key=lambda r: r["created_at"] or "", reverse=True)
        out_buckets[bucket_name] = bucket_hits[: args.limit]

    result = {
        "username": username,
        "user_id": uid,
        "platform": args.platform,
        "buckets": out_buckets,
    }
    if args.event:
        result["event"] = args.event
        result["event_date_window"] = event_date_window
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def main():
    p = argparse.ArgumentParser(
        description="Offline mirror queries — triage / diff / search / body. No X API calls."
    )
    p.add_argument("--mirror", default=None,
                   help="Path to mirror.sqlite (default: $CWD/.x-api-data/mirror.sqlite)")
    p.add_argument("--platform", default="x")
    sub = p.add_subparsers(dest="cmd", required=True)

    triage = sub.add_parser("triage", help="Per-username digest by keyword bucket")
    triage.add_argument("--usernames", required=True,
                        help="Comma-separated list, with or without @")
    triage.add_argument("--keywords", default=None,
                        help="Comma-separated event keywords (default: 新刊,お品書き,完売,通販,次回)")
    triage.add_argument("--limit", type=int, default=5)
    triage.add_argument("--json", action="store_true")

    diff = sub.add_parser("diff", help="Posts since an ISO timestamp")
    diff.add_argument("--since", required=True,
                      help="ISO8601 UTC, e.g. 2026-06-04T00:00:00Z")
    diff.add_argument("--usernames", default=None,
                      help="Comma-separated filter (optional)")
    diff.add_argument("--fetched-since", action="store_true",
                      help="Use fetched_at instead of created_at")
    diff.add_argument("--limit", type=int, default=200)
    diff.add_argument("--json", action="store_true")

    search = sub.add_parser("search", help="Free-form keyword(s)")
    search.add_argument("query", help="One keyword or comma-separated set")
    search.add_argument("--username", default=None,
                        help="Optional filter to one user")
    search.add_argument("--limit", type=int, default=50)
    search.add_argument("--json", action="store_true")

    body = sub.add_parser("body", help="Categorize one user's posts into body-update buckets")
    body.add_argument("--username", required=True)
    body.add_argument("--buckets", default=None,
                      help="JSON dict overriding default {bucket: [keyword,...]} mapping")
    body.add_argument("--limit", type=int, default=10)
    body.add_argument("--event", default=None,
                      help="Event slug (from events.json) to annotate each post with "
                           "{time_phase, mentions, this_event_confidence}. When omitted, "
                           "output shape is unchanged (legacy).")
    body.add_argument("--events-json", default=None,
                      help="Path to events.json (default: $CWD/events.json or "
                           "repo-relative discovery)")

    args = p.parse_args()
    conn = storage.connect(args.mirror)
    try:
        if args.cmd == "triage":
            sys.exit(cmd_triage(conn, args))
        elif args.cmd == "diff":
            sys.exit(cmd_diff(conn, args))
        elif args.cmd == "search":
            sys.exit(cmd_search(conn, args))
        elif args.cmd == "body":
            sys.exit(cmd_body(conn, args))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
