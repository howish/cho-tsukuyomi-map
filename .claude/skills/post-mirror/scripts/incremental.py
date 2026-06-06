"""Incremental X timeline fetcher backed by the post-mirror.

Wraps the existing x-api skill's `timeline` subcommand: uses the mirror's
`pull_state` table to pass `--since <last_pull_iso>` so only new tweets
come back. Updates pull_state + silent_streak per the design.md decisions
(streak preserved across --force-full per howish 2026-06-06).
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Import the storage layer via the skill's local scripts directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import storage  # noqa: E402

X_API_RUN = Path.home() / ".claude" / "skills" / "x-api" / "bin" / "run.sh"
DEFAULT_BACK_OFF = 3
DEFAULT_BACK_OFF_MIN_DAYS = 7  # don't go longer than weekly even when silent
DEFAULT_TWEET_LIMIT = 25


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _days_since(iso_a: str, iso_b: str) -> float:
    """Days from iso_a to iso_b (iso_b - iso_a). Both UTC ISO8601 Z."""
    fmt = "%Y-%m-%dT%H:%M:%SZ"
    try:
        ta = time.mktime(time.strptime(iso_a, fmt))
        tb = time.mktime(time.strptime(iso_b, fmt))
    except (ValueError, TypeError):
        return float("inf")
    return (tb - ta) / 86400.0


def pull_one(
    conn,
    username: str,
    *,
    platform: str = "x",
    limit: int = DEFAULT_TWEET_LIMIT,
    back_off_threshold: int = DEFAULT_BACK_OFF,
    force_full: bool = False,
) -> dict:
    """Pull one user's timeline incrementally; return a result dict.

    Result keys:
      - skipped: True if back-off skipped this call (or user lookup failed)
      - new_post_count: int, number of new posts inserted
      - silent_streak: post-call streak
      - reason: when skipped, why
    """
    now = _now_iso()

    # First: check the mirror's users table for the user_id (avoid the
    # extra /users/by/username API call when we already know who this is).
    cached_user = storage.find_user_by_username(conn, platform, username)
    user_id = cached_user["id"] if cached_user else None

    # Pull state lookup — also check back-off eligibility unless force_full.
    state = storage.get_pull_state(conn, platform, user_id) if user_id else None
    if state and not force_full:
        days = _days_since(state["last_pull_iso"], now)
        if (state["silent_streak"] >= back_off_threshold
                and days < DEFAULT_BACK_OFF_MIN_DAYS):
            return {
                "skipped": True,
                "reason": (
                    f"silent_streak={state['silent_streak']} ≥ "
                    f"{back_off_threshold} and {days:.1f}d < "
                    f"{DEFAULT_BACK_OFF_MIN_DAYS}d minimum cadence"
                ),
                "new_post_count": 0,
                "silent_streak": state["silent_streak"],
            }

    # Build the x-api timeline call.
    cmd = [str(X_API_RUN), "timeline", f"@{username}", "-n", str(limit)]
    if state and not force_full:
        cmd.extend(["--since", state["last_pull_iso"]])

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except subprocess.TimeoutExpired:
        return {
            "skipped": True,
            "reason": "x-api timeline call timed out (60s)",
            "new_post_count": 0,
            "silent_streak": state["silent_streak"] if state else 0,
        }
    if proc.returncode != 0:
        return {
            "skipped": True,
            "reason": f"x-api error: {proc.stderr.strip()[:200]}",
            "new_post_count": 0,
            "silent_streak": state["silent_streak"] if state else 0,
        }

    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return {
            "skipped": True,
            "reason": "x-api returned non-JSON output",
            "new_post_count": 0,
            "silent_streak": state["silent_streak"] if state else 0,
        }

    # Upsert users (includes.users + main author).
    users_in = (data.get("includes") or {}).get("users") or []
    for u in users_in:
        storage.upsert_user(conn, platform, u, fetched_at=now)
        if u.get("username", "").lower() == username.lower():
            user_id = str(u["id"])

    # Upsert posts.
    posts = data.get("data") or []
    new_count = 0
    latest_post_id = state["last_post_id"] if state else None
    for p in posts:
        storage.upsert_post(conn, platform, p, fetched_at=now)
        new_count += 1
        # Track newest post id by sortable order (created_at lexical works for ISO)
        if (latest_post_id is None
                or (p.get("id") and p["id"] > latest_post_id)):
            latest_post_id = str(p["id"])

    # Upsert media.
    media_in = (data.get("includes") or {}).get("media") or []
    # We don't have post_id linkage in `includes.media`; X API returns
    # the media via `attachments.media_keys` on each post. Walk posts.
    media_by_key = {m.get("media_key"): m for m in media_in if m.get("media_key")}
    for p in posts:
        keys = (p.get("attachments") or {}).get("media_keys") or []
        for k in keys:
            mm = media_by_key.get(k)
            if mm:
                storage.upsert_media(conn, platform, mm, post_id=str(p["id"]))

    # Update pull state.
    # silent_streak rules (per howish 2026-06-06):
    #   - new posts returned → reset streak to 0
    #   - zero new posts → increment streak by 1
    #   - --force-full does NOT reset streak independently of result
    prior_streak = state["silent_streak"] if state else 0
    new_streak = 0 if new_count > 0 else (prior_streak + 1)

    if user_id:
        storage.set_pull_state(
            conn, platform, user_id,
            last_pull_iso=now,
            last_post_id=latest_post_id,
            silent_streak=new_streak,
        )

    return {
        "skipped": False,
        "new_post_count": new_count,
        "silent_streak": new_streak,
        "user_id": user_id,
    }


def main():
    p = argparse.ArgumentParser(
        description="Pull one X user's timeline into the post-mirror, "
                    "skipping already-seen tweets via pull_state.")
    p.add_argument("username", help="X username (with or without @)")
    p.add_argument("--platform", default="x")
    p.add_argument("--limit", type=int, default=DEFAULT_TWEET_LIMIT)
    p.add_argument("--mirror", default=None,
                   help="Path to mirror.sqlite (default: $CWD/.x-api-data/mirror.sqlite)")
    p.add_argument("--back-off-threshold", type=int, default=DEFAULT_BACK_OFF)
    p.add_argument("--force-full", action="store_true")
    args = p.parse_args()

    username = args.username.lstrip("@")
    conn = storage.connect(args.mirror)
    try:
        result = pull_one(
            conn, username,
            platform=args.platform,
            limit=args.limit,
            back_off_threshold=args.back_off_threshold,
            force_full=args.force_full,
        )
    finally:
        conn.close()

    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
