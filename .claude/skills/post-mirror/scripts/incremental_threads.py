"""Incremental Threads profile fetcher backed by the post-mirror.

Wraps the user-global `threads-scraper` skill (Playwright via shared
playwright-runtime). Threads profile scrape returns the ~20 most recent
visible posts via DOM extraction; we upsert them dedup-on-id.

Known limitations vs the X path:
- Threads profile DOM doesn't expose per-post timestamps. We use the
  pull's `fetched_at` as a proxy for `created_at`. This means
  event_phase time-bucket reasoning is approximate (post timing
  resolves to "now" rather than the actual post time). The text-
  mention extraction is unaffected — Threads posts mentioning
  ヤオヨロー / ツクスク / event hashtags still resolve correctly.
- Post `id` is derived from the URL's /post/CODE segment.
- silent_streak / back-off cadence is honored the same way as X.

A future refinement: per-post fetch (the threads-scraper post path
HAS timestamps) for the top-N most recent posts to backfill
created_at. Out of scope for the initial wiring.

Per openspec change add-event-phase-context follow-up F (post-mirror
multi-platform extension, 2026-06-08).
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import storage  # noqa: E402

THREADS_SCRAPER_RUN = (
    Path.home() / ".claude" / "skills" / "threads-scraper" / "bin" / "run.sh"
)
DEFAULT_BACK_OFF = 3
DEFAULT_BACK_OFF_MIN_DAYS = 7
PLATFORM = "threads"


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _days_since(iso_a: str, iso_b: str) -> float:
    fmt = "%Y-%m-%dT%H:%M:%SZ"
    try:
        ta = time.mktime(time.strptime(iso_a, fmt))
        tb = time.mktime(time.strptime(iso_b, fmt))
    except (ValueError, TypeError):
        return float("inf")
    return (tb - ta) / 86400.0


def _extract_post_code(link: str) -> str | None:
    if not link:
        return None
    m = re.search(r"/post/([A-Za-z0-9_-]+)", link)
    return m.group(1) if m else None


def _run_scraper(username: str) -> dict | None:
    if not THREADS_SCRAPER_RUN.is_file():
        print(f"threads-scraper missing at {THREADS_SCRAPER_RUN}",
              file=sys.stderr)
        return None
    url = f"https://www.threads.com/@{username}"
    try:
        proc = subprocess.run(
            [str(THREADS_SCRAPER_RUN), url, "--json-only"],
            capture_output=True, text=True, timeout=90,
        )
    except subprocess.TimeoutExpired:
        return None
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr)
        return None
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return None


def pull_one(conn, username: str, *, force_full: bool = False,
             back_off_threshold: int = DEFAULT_BACK_OFF) -> dict:
    """Pull one Threads user's profile timeline (no incremental cursor —
    visible page → upsert dedup)."""
    now = _now_iso()
    cached = storage.find_user_by_username(conn, PLATFORM, username)
    user_id = cached["id"] if cached else None

    if user_id and not force_full:
        state = storage.get_pull_state(conn, PLATFORM, user_id)
        if state:
            days = _days_since(state["last_pull_iso"], now)
            if (state["silent_streak"] >= back_off_threshold
                    and days < DEFAULT_BACK_OFF_MIN_DAYS):
                return {
                    "skipped": True,
                    "reason": (f"silent_streak={state['silent_streak']} ≥ "
                               f"{back_off_threshold} and {days:.1f}d < "
                               f"{DEFAULT_BACK_OFF_MIN_DAYS}d cadence"),
                    "silent_streak": state["silent_streak"],
                    "new_post_count": 0,
                }

    payload = _run_scraper(username)
    if payload is None:
        return {"skipped": True, "reason": "scraper failed", "new_post_count": 0}

    posts = payload.get("posts") or []
    resolved_username = (payload.get("username") or username).lstrip("@")

    # Upsert user (Threads has no numeric id exposed in profile scrape).
    user_raw = {
        "id": resolved_username,
        "username": resolved_username,
        "name": payload.get("title") or "",
        "bio": "",
    }
    storage.upsert_user(conn, PLATFORM, user_raw, fetched_at=now)
    user_id = resolved_username

    new_count = 0
    upserted_count = 0
    for p in posts:
        link = p.get("link") or ""
        pid = _extract_post_code(link)
        if not pid:
            continue
        post_raw = {
            "id": pid,
            "author_id": user_id,
            "created_at": now,  # approximation — see module docstring
            "text": p.get("text") or "",
        }
        existing = conn.execute(
            "SELECT 1 FROM posts WHERE platform=? AND id=?",
            (PLATFORM, pid),
        ).fetchone()
        if existing is None:
            new_count += 1
        storage.upsert_post(conn, PLATFORM, post_raw, fetched_at=now)
        upserted_count += 1
        for i, img_url in enumerate(p.get("images") or []):
            media_raw = {
                "media_key": f"{pid}_{i}",
                "type": "photo",
                "url": img_url,
            }
            storage.upsert_media(conn, PLATFORM, media_raw, post_id=pid)

    prev_state = storage.get_pull_state(conn, PLATFORM, user_id)
    if posts:
        streak = 0
    else:
        streak = (prev_state["silent_streak"] if prev_state else 0) + 1
    storage.set_pull_state(
        conn, PLATFORM, user_id,
        last_pull_iso=now, silent_streak=streak,
    )
    return {
        "skipped": False,
        "new_post_count": new_count,
        "upserted_post_count": upserted_count,
        "visible_post_count": len(posts),
        "silent_streak": streak,
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("username", help="Threads username (no @, no URL)")
    p.add_argument("--mirror", default=None)
    p.add_argument("--force-full", action="store_true")
    p.add_argument("--back-off-threshold", type=int, default=DEFAULT_BACK_OFF)
    args = p.parse_args()

    conn = storage.connect(args.mirror)
    try:
        result = pull_one(
            conn, args.username,
            force_full=args.force_full,
            back_off_threshold=args.back_off_threshold,
        )
    finally:
        conn.close()
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
