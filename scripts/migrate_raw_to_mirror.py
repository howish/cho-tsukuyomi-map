#!/usr/bin/env python3
"""One-shot importer: walks .x-api-data-<slug>/raw/*-main-*.json files and
populates the post-mirror skill's SQLite store.

Per howish 2026-06-06: this is project-scope code that knows the local
raw/ layout. The actual storage logic lives in the post-mirror skill.
"""

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL_SCRIPTS = ROOT / ".claude" / "skills" / "post-mirror" / "scripts"
sys.path.insert(0, str(SKILL_SCRIPTS))

import storage  # noqa: E402


def _iso_now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def import_one(conn, raw_file: Path, platform: str = "x") -> dict:
    """Import one raw JSON dump into the mirror.

    Returns counts of inserted rows by table.
    """
    try:
        data = json.loads(raw_file.read_text(encoding="utf-8"))
    except Exception as e:
        return {"file": str(raw_file), "error": str(e)}

    # Use the dump file's mtime as fetched_at to preserve chronology.
    try:
        fetched_at = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ", time.gmtime(raw_file.stat().st_mtime)
        )
    except OSError:
        fetched_at = _iso_now()

    # users in includes
    users_in = (data.get("includes") or {}).get("users") or []
    user_count = 0
    for u in users_in:
        storage.upsert_user(conn, platform, u, fetched_at=fetched_at)
        user_count += 1

    # posts
    posts = data.get("data") or []
    post_count = 0
    newest_id = None
    for p in posts:
        storage.upsert_post(conn, platform, p, fetched_at=fetched_at)
        post_count += 1
        if newest_id is None or (p.get("id") and p["id"] > newest_id):
            newest_id = str(p["id"])

    # media — same pattern as incremental.py (lookup keys per-post)
    media_in = (data.get("includes") or {}).get("media") or []
    media_by_key = {m.get("media_key"): m for m in media_in if m.get("media_key")}
    media_count = 0
    for p in posts:
        keys = (p.get("attachments") or {}).get("media_keys") or []
        for k in keys:
            mm = media_by_key.get(k)
            if mm:
                storage.upsert_media(conn, platform, mm, post_id=str(p["id"]))
                media_count += 1

    # initialize pull_state per author (filename pattern: <booth>-main-<handle>.json
    # → author_id is in includes.users[0].id usually)
    state_count = 0
    if posts and users_in:
        author = users_in[0]
        user_id = str(author.get("id"))
        # Use the newest post's created_at as last_pull_iso so subsequent
        # incremental fetches use it as start_time. Falls back to fetched_at.
        latest_created = None
        for p in posts:
            ca = p.get("created_at")
            if ca and (latest_created is None or ca > latest_created):
                latest_created = ca
        last_pull_iso = latest_created or fetched_at
        storage.set_pull_state(
            conn, platform, user_id,
            last_pull_iso=last_pull_iso,
            last_post_id=newest_id,
            silent_streak=0,
        )
        state_count = 1

    return {
        "file": str(raw_file.relative_to(ROOT)),
        "posts": post_count,
        "users": user_count,
        "media": media_count,
        "states": state_count,
    }


def main():
    p = argparse.ArgumentParser(
        description="Import all .x-api-data-*/raw/*-main-*.json into the post-mirror"
    )
    p.add_argument("--mirror", default=str(ROOT / ".x-api-data" / "mirror.sqlite"))
    p.add_argument("--platform", default="x")
    p.add_argument("--limit", type=int, default=None,
                   help="Stop after N files (debug)")
    args = p.parse_args()

    conn = storage.connect(args.mirror)

    raw_files = sorted(ROOT.glob(".x-api-data-*/raw/*-main-*.json"))
    print(f"Found {len(raw_files)} raw files under cho-tsukuyomi-map/.x-api-data-*/raw/")
    if args.limit:
        raw_files = raw_files[: args.limit]

    totals = {"posts": 0, "users": 0, "media": 0, "states": 0, "errors": 0}
    by_event = {}
    for i, f in enumerate(raw_files, 1):
        result = import_one(conn, f, platform=args.platform)
        if "error" in result:
            totals["errors"] += 1
            print(f"  [{i}/{len(raw_files)}] ERR {f.relative_to(ROOT)}: {result['error']}")
            continue
        for k in ("posts", "users", "media", "states"):
            totals[k] += result[k]
        ev = f.parent.parent.name  # .x-api-data-<slug>
        by_event.setdefault(ev, 0)
        by_event[ev] += result["posts"]

    conn.close()

    print(f"\nTotals:")
    print(f"  posts:  {totals['posts']:,}")
    print(f"  users:  {totals['users']:,}")
    print(f"  media:  {totals['media']:,}")
    print(f"  states: {totals['states']:,}")
    print(f"  errors: {totals['errors']:,}")
    print(f"\nBy event:")
    for ev, n in sorted(by_event.items()):
        print(f"  {ev}: {n:,} posts")
    print(f"\nMirror: {args.mirror}")


if __name__ == "__main__":
    main()
