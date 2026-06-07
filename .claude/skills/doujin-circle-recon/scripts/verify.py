#!/usr/bin/env python3
"""Verify a candidate X handle is the right doujin circle.

Pulls user bio + recent timeline via x-api, prints summary, highlights
matches of --signal keyword (e.g. fandom name, event short name).

Use after WebSearch surfaces a candidate handle for a booth with no
official X link in the organizer's circle list.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def color(text, code):
    return f"\033[{code}m{text}\033[0m"


def main():
    p = argparse.ArgumentParser(description="Verify an X handle candidate")
    p.add_argument("handle", help="X handle (no @)")
    p.add_argument("--signal", action="append", help="keyword(s) to highlight; pass multiple times")
    p.add_argument("-n", "--count", type=int, default=8, help="recent tweet count for bio context")
    args = p.parse_args()

    handle = args.handle.lstrip("@")
    xapi = Path.home() / ".claude" / "skills" / "x-api" / "bin" / "run.sh"

    # 1. user lookup
    try:
        out = subprocess.check_output([str(xapi), "user", f"@{handle}"], timeout=30)
        ud = json.loads(out)
    except subprocess.CalledProcessError as e:
        print(f"ERR user lookup: {e}", file=sys.stderr); sys.exit(1)

    user = ud.get("data") or {}
    err = ud.get("errors")
    if err:
        print(f"USER NOT FOUND: {json.dumps(err, ensure_ascii=False)}", file=sys.stderr)
        sys.exit(1)
    if not user:
        print(f"empty user response: {ud}", file=sys.stderr); sys.exit(1)

    name = user.get("name", "")
    desc = user.get("description", "") or ""
    metrics = user.get("public_metrics", {})

    print(f"=== @{handle} ===")
    print(f"name:         {name}")
    print(f"followers:    {metrics.get('followers_count', '?')}  "
          f"tweet_count: {metrics.get('tweet_count', '?')}")
    print(f"description:")
    print(f"  {desc}")
    print()

    # 2. signal matching against bio
    matches_bio = []
    if args.signal:
        for sig in args.signal:
            if sig in desc:
                matches_bio.append(sig)
            if sig in name:
                matches_bio.append(sig + " (in name)")
    if matches_bio:
        print(f"BIO MATCHES: {', '.join(matches_bio)}")
    elif args.signal:
        print(f"NO BIO MATCH for any of: {args.signal}")
    print()

    # 3. recent timeline check
    try:
        out = subprocess.check_output([str(xapi), "timeline", f"@{handle}", "-n", str(args.count)], timeout=30)
        td = json.loads(out)
    except subprocess.CalledProcessError as e:
        print(f"  (timeline pull failed: {e})", file=sys.stderr)
        td = {"data": []}

    tweets = td.get("data", [])
    print(f"recent {len(tweets)} tweets:")
    matches_timeline = 0
    for t in tweets[:args.count]:
        text = t.get("text", "")
        date = t.get("created_at", "")[:10]
        hit = ""
        if args.signal:
            for sig in args.signal:
                if sig in text:
                    matches_timeline += 1
                    hit = "  [MATCH]"
                    break
        print(f"  [{date}]{hit} {text[:120].replace(chr(10), ' | ')}")

    print()
    print(f"VERDICT:")
    if args.signal:
        if matches_bio and matches_timeline:
            print(f"  STRONG: bio match + {matches_timeline} timeline matches")
        elif matches_bio or matches_timeline:
            print(f"  WEAK: only bio={bool(matches_bio)} timeline-hits={matches_timeline}")
        else:
            print(f"  NO SIGNAL — likely wrong person")
    else:
        print(f"  (pass --signal KW to auto-score)")


if __name__ == "__main__":
    main()
