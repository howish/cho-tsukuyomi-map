#!/usr/bin/env python3
"""Build refreshed cover_urls for an event's booths from the post-mirror's
media table.

For each booth:
1. Resolve the primary author's X handle → user_id from the mirror
2. Find posts authored by that user in the last `--window` days that
   match event-relevant keywords (お品書き / 品書 / 表紙 / 新刊 /
   <event short name>) and have media attached
3. Take media in created_at DESC order, capped at `--max-images` items
4. Skip RTs (text starts with `RT @`) — we want the booth's own
   visual identity, not whatever they retweeted

Emits {booth_id: [{source_url, display_url}, ...]} JSON consumed by
`apply_cover_url_patches.py`.

Booths whose mirror returns no matching media in the window are NOT in
the output (the caller can decide whether to keep existing cover_urls
or wipe).
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MIRROR_PATH = ROOT / ".x-api-data" / "mirror.sqlite"

# event_phase helper (defensive: tolerate skill being absent — fall back
# to keyword-only filtering).
sys.path.insert(0, str(ROOT / ".claude" / "skills" / "post-mirror" / "scripts"))
try:
    import _event_phase as event_phase  # type: ignore
except ImportError:
    event_phase = None  # type: ignore

# Keyword priority — higher first. Each keyword is matched as a LIKE
# substring against post.text. Event-specific names (like ヤオヨロー)
# override generic ones because they pin the image to *this* event.
DEFAULT_KEYWORDS = [
    "お品書き", "品書", "おしながき",
    "表紙",
    "新刊",
    "ラインナップ",
    "頒布",
]


def load_booth_handles(slug: str) -> dict[str, str]:
    """Return {booth_id: x_handle} for every booth whose primary author
    has an X handle."""
    data_js = (ROOT / slug / "data.js").read_text(encoding="utf-8")
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$', data_js, re.S)
    booths = json.loads(m.group(1))

    circles = json.loads((ROOT / "circles.json").read_text(encoding="utf-8"))
    authors_by_id = {a["id"]: a for a in circles.get("authors", [])}
    circles_by_id = {c["id"]: c for c in circles.get("circles", [])}

    out: dict[str, str] = {}
    for b in booths:
        cid = b.get("circle_id")
        if not cid:
            continue
        c = circles_by_id.get(cid)
        members = (c or {}).get("members") or []
        if not members:
            continue
        primary = authors_by_id.get(members[0])
        if not primary:
            continue
        for s in primary.get("socials") or []:
            if s.get("platform") == "x" and s.get("url"):
                m = re.search(r"(?:x|twitter)\.com/@?([A-Za-z0-9_]{1,15})", s["url"])
                if m:
                    out[b["booth_id"]] = m.group(1)
                    break
    return out


def lookup_user_id(conn, username: str) -> str | None:
    row = conn.execute(
        "SELECT id FROM users WHERE platform='x' AND LOWER(username) = LOWER(?)",
        (username,),
    ).fetchone()
    return row[0] if row else None


_REPORT_RE = re.compile(
    r"完売|売り切れ|売切れ|撤収|設営|ありがとうございま|お疲れ様|通販受付"
    r"|ボツ案|戦利品|頂きました|いただきました"
)


def _keyword_tier(text: str) -> int:
    """Cover-likelihood tier from text. お品書き posts ARE the cover
    artifact; 表紙 posts usually show the book art; bare 新刊 mentions
    are weak (matches 完売報告 / 進捗 / 通販案内 too); an event-name-only
    match is weakest (matches 撤収報告 / レポ / 戦利品 posts).

    Sales/venue-report phrasing (完売 / 撤収 / 設営 / 通販 / thanks /
    received-gift) demotes weak matches below everything else — those
    posts carry booth photos and 戦利品 shots, not cover art. お品書き
    and 表紙 posts are immune (the strong keyword wins)."""
    if any(k in text for k in ("お品書き", "品書", "おしながき")):
        return 3
    if ("表紙" in text or "頒布" in text) and not _REPORT_RE.search(text):
        return 2
    if _REPORT_RE.search(text):
        return -1
    if any(k in text for k in ("新刊", "ラインナップ")):
        return 1
    return 0


def find_media_for_user(conn, user_id: str, username: str, since_iso: str,
                       keywords: list[str], max_images: int,
                       extra_keyword: str | None = None,
                       target_event: dict | None = None,
                       all_events: list[dict] | None = None,
                       strict_event: bool = False,
                       until_iso: str | None = None) -> list[dict] | None:
    """Return up to max_images ranked own-post media rows for a user,
    each as {source_url, display_url}. RTs filtered out.

    Ranking (NOT pure recency — a post-event run must not let 撤収報告 /
    完売報告 / 戦利品 photos displace the actual cover art):
      1. phase: posts on/before event day +1 outrank post-event posts
      2. keyword tier: お品書き > 表紙 > 新刊 > event-name-only
      3. recency as tiebreak

    When target_event + all_events are provided AND the _event_phase
    helper is importable, post text is also checked against
    event_context. The drop policy differs from body / classify because
    cover images are the booth's visual identity (book art / お品書き
    graphic) which is legitimately re-used across events even when the
    post text mentions only one of them:

      - default: drop only `none` (post is far from event window AND
        text mentions no events — likely truly unrelated)
      - `strict_event=True`: drop both `low` and `none` (also exclude
        posts that explicitly tie to a different event by name)

    The keyword filter is the first line of defense (must match
    お品書き / 表紙 / 新刊 etc. + have media). event_context is the
    secondary gate.
    """
    kw_clause_parts: list[str] = []
    kw_params: list[str] = []
    for kw in keywords:
        kw_clause_parts.append("p.text LIKE ?")
        kw_params.append(f"%{kw}%")
    if extra_keyword:
        kw_clause_parts.append("p.text LIKE ?")
        kw_params.append(f"%{extra_keyword}%")
    kw_clause = " OR ".join(kw_clause_parts)

    until_clause = "AND p.created_at <= ?" if until_iso else ""
    sql = f"""
        SELECT DISTINCT p.id, p.created_at, p.text, m.url
        FROM posts p
        JOIN media m ON m.platform = p.platform AND m.post_id = p.id
        WHERE p.user_id = ?
          AND p.platform = 'x'
          AND p.created_at >= ?
          {until_clause}
          AND p.text NOT LIKE 'RT @%'
          AND ({kw_clause})
        ORDER BY p.created_at DESC, p.id DESC, m.media_key ASC
        LIMIT 120
    """
    params = [user_id, since_iso]
    if until_iso:
        params.append(until_iso)
    params += kw_params
    rows = conn.execute(sql, params).fetchall()

    # Rank: pre/during-event posts first, then keyword tier. Recency is
    # the implicit tiebreak — SQL returns created_at DESC and Python's
    # sort is stable, so equal-ranked posts keep that order (and media
    # of one post stays adjacent in media_key order).
    event_date = (target_event or {}).get("date") or ""
    cutoff = f"{event_date}T23:59:59" if event_date else ""

    def rank(row):
        _pid, created_at, text, _url = row
        pre_or_during = not cutoff or (created_at or "")[:19] <= cutoff
        return (0 if pre_or_during else 1, -_keyword_tier(text or ""))

    had_candidates = bool(rows)
    # Report-like posts (tier -1) never become covers — a 撤収/戦利品
    # photo (often someone ELSE's book) is worse than no cover at all.
    rows = [r for r in sorted(rows, key=rank)
            if _keyword_tier(r[2] or "") >= 0]
    if had_candidates and not rows:
        return []   # explicit wipe: only report noise found

    use_event_gate = (
        event_phase is not None
        and target_event is not None
        and all_events is not None
    )

    if not rows:
        return None   # nothing matched at all: caller keeps existing

    seen_urls: set[str] = set()
    out: list[dict] = []
    for post_id, created_at, text, url in rows:
        if url in seen_urls:
            continue
        if use_event_gate:
            ec = event_phase.compute_event_context(
                text or "", created_at or "", target_event, all_events,
            )
            if ec:
                conf = ec.get("this_event_confidence")
                drop = (
                    conf == "none"
                    or (strict_event and conf == "low")
                )
                if drop:
                    continue
        seen_urls.add(url)
        out.append({
            "source_url": f"https://x.com/{username}/status/{post_id}",
            "display_url": url,
        })
        if len(out) >= max_images:
            break
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("event_slug")
    p.add_argument("--window-days", type=int, default=14,
                   help="Consider posts from N days before the event date "
                        "(default 14). Falls back to 'last N days from "
                        "now' when the event date is unknown.")
    p.add_argument("--post-grace-days", type=int, default=2,
                   help="Also admit posts up to N days AFTER the event "
                        "date (default 2) — they rank below pre-event "
                        "posts. Prevents next-event announcements from "
                        "bleeding in on late re-runs.")
    p.add_argument("--max-images", type=int, default=5)
    p.add_argument("--event-name", default=None,
                   help="Extra keyword pinning posts to this event "
                        "(e.g. ヤオヨロー). Inclusive OR with default keywords.")
    p.add_argument("--output", default=None,
                   help="Output JSON path (default: "
                        ".x-api-data-<slug>/cover-urls.json)")
    p.add_argument("--mirror", default=str(MIRROR_PATH))
    p.add_argument("--strict-event", action="store_true",
                   help="Drop posts whose this_event_confidence is low "
                        "(default: drop only 'none'). Use when you only "
                        "want covers from posts that explicitly mention "
                        "THIS event or are in its time window.")
    args = p.parse_args()

    handles = load_booth_handles(args.event_slug)
    print(f"booths with x handle: {len(handles)}", file=sys.stderr)

    # Event-context setup: load events.json + resolve target so that
    # find_media_for_user can drop posts whose this_event_confidence is
    # low/none for THIS event. Falls back to keyword-only filtering if
    # events.json is missing or the slug isn't there.
    target_event = None
    all_events: list[dict] = []
    events_json = ROOT / "events.json"
    if events_json.is_file():
        try:
            all_events = json.loads(
                events_json.read_text(encoding="utf-8")
            ).get("events", [])
        except json.JSONDecodeError:
            all_events = []
    if event_phase is not None and all_events:
        target_event = event_phase.find_event(all_events, args.event_slug)
    if event_phase is None:
        print("  (event_phase helper not importable — keyword-only mode)",
              file=sys.stderr)
    elif target_event is None:
        print(f"  (event slug '{args.event_slug}' not in events.json — "
              "keyword-only mode)", file=sys.stderr)
    else:
        print(f"  event-context gate active (target: {args.event_slug})",
              file=sys.stderr)

    # Window anchored to the EVENT date, not the run date — a re-run
    # weeks later must look at the same posts a pre-event run saw.
    event_date = (target_event or {}).get("date")
    until_iso: str | None = None
    if event_date:
        anchor = time.mktime(time.strptime(event_date, "%Y-%m-%d"))
        since_iso = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(anchor - args.window_days * 86400),
        )
        until_iso = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(anchor + (args.post_grace_days + 1) * 86400),
        )
        print(f"  window: {since_iso[:10]} .. {until_iso[:10]} "
              f"(event {event_date})", file=sys.stderr)
    else:
        since_iso = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(time.time() - args.window_days * 86400),
        )
        print(f"  window: last {args.window_days}d from now "
              "(no event date)", file=sys.stderr)

    conn = sqlite3.connect(args.mirror)
    out: dict[str, list[dict]] = {}
    no_user = no_media = covered = 0
    for booth_id, handle in handles.items():
        uid = lookup_user_id(conn, handle)
        if uid is None:
            no_user += 1
            continue
        media = find_media_for_user(
            conn, uid, handle, since_iso, DEFAULT_KEYWORDS,
            args.max_images, extra_keyword=args.event_name,
            target_event=target_event, all_events=all_events,
            strict_event=args.strict_event, until_iso=until_iso,
        )
        if media is None:
            no_media += 1
            continue
        out[booth_id] = media   # may be [] = explicit wipe (report noise only)
        covered += 1

    conn.close()

    output_path = Path(args.output) if args.output else (
        ROOT / f".x-api-data-{args.event_slug}" / "cover-urls.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(out, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"  with cover_urls update: {covered}", file=sys.stderr)
    print(f"  user missing from mirror: {no_user}", file=sys.stderr)
    print(f"  no matching media in window: {no_media}", file=sys.stderr)
    try:
        print(f"output: {output_path.relative_to(ROOT)}", file=sys.stderr)
    except ValueError:
        print(f"output: {output_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
