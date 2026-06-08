"""Incremental Plurk profile fetcher backed by the post-mirror.

Wraps the user-global `plurk-scraper` skill (Playwright via shared
playwright-runtime). Plurk profile scrape returns up to ~20 recent
plurks; we upsert them all and let the platform-level deduplication
on `(platform, id)` make repeated runs idempotent.

Limitations vs the X path:
- No native `since` API on plurk profile scrape; we always pull the
  visible timeline page, then upsert (dedup by post id). Plurks older
  than the visible page require pagination which the scraper doesn't
  do yet.
- silent_streak / back-off cadence is honored the same way as X.

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

PLURK_SCRAPER_RUN = (
    Path.home() / ".claude" / "skills" / "plurk-scraper" / "bin" / "run.sh"
)
DEFAULT_BACK_OFF = 3
DEFAULT_BACK_OFF_MIN_DAYS = 7
PLATFORM = "plurk"


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


def _normalize_plurk_ts(ts: str) -> str:
    """Plurk gives datetime attribute like '2026-06-08T12:34:56Z' or a
    title like '2026年06月08日 21:34'. Try ISO-parse, else fall back to
    fetched_at."""
    if not ts:
        return ""
    # Already-ISO form: pass through
    if re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", ts):
        # Strip subseconds + timezone variations to canonical Z form
        m = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})", ts)
        return m.group(1) + "Z" if m else ts
    return ""


def _run_scraper(username: str) -> dict | None:
    """Invoke plurk-scraper for the given username, return parsed JSON."""
    if not PLURK_SCRAPER_RUN.is_file():
        print(f"plurk-scraper missing at {PLURK_SCRAPER_RUN}", file=sys.stderr)
        return None
    url = f"https://www.plurk.com/{username}"
    try:
        proc = subprocess.run(
            [str(PLURK_SCRAPER_RUN), url, "--json-only"],
            capture_output=True, text=True, timeout=60,
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
    """Pull one Plurk user's profile timeline incrementally."""
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

    profile = payload.get("profile") or {}
    plurks = payload.get("plurks") or []

    # Upsert user. Plurk's stable identifier is the username — there's no
    # numeric id in the profile scrape — so we use the username for both
    # fields and dedup on (platform, id) accordingly.
    user_raw = {
        "id": username,
        "username": username,
        "name": profile.get("nick_name") or "",
        "bio": profile.get("bio") or "",
    }
    storage.upsert_user(conn, PLATFORM, user_raw, fetched_at=now)
    user_id = username

    new_count = 0
    for p in plurks:
        pid = p.get("id")
        if not pid:
            continue
        ts = _normalize_plurk_ts(p.get("timestamp") or "") or now
        post_raw = {
            "id": pid,
            "author_id": user_id,
            "created_at": ts,
            "text": p.get("text") or "",
        }
        # Detect "new" by checking whether the post already exists; if
        # not, count it as new and upsert.
        existing = conn.execute(
            "SELECT 1 FROM posts WHERE platform=? AND id=?",
            (PLATFORM, pid),
        ).fetchone()
        if existing is None:
            new_count += 1
        storage.upsert_post(conn, PLATFORM, post_raw, fetched_at=now)
        # Media — images
        for i, img_url in enumerate(p.get("images") or []):
            media_raw = {
                "media_key": f"{pid}_{i}",
                "type": "photo",
                "url": img_url,
            }
            storage.upsert_media(conn, PLATFORM, media_raw, post_id=pid)

    # Pull state — silent_streak is 0 if we got any post (visible page
    # always has the latest), increments on truly empty results.
    prev_state = storage.get_pull_state(conn, PLATFORM, user_id)
    if plurks:
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
        "visible_post_count": len(plurks),
        "silent_streak": streak,
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("username", help="Plurk username (no @, no URL)")
    p.add_argument("--mirror", default=None,
                   help="Path to mirror.sqlite "
                        "(default: $CWD/.x-api-data/mirror.sqlite)")
    p.add_argument("--force-full", action="store_true",
                   help="Bypass silent-streak back-off")
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
