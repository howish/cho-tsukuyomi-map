#!/usr/bin/env python3
"""Run x-api search to catch older posts that timeline -n 25 might have missed.

Example: a booth's お品書き was posted 3 weeks ago and rolled past the 25-tweet
window. `search '"<event_kw>" from:handle'` recovers it.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description="x-api search wrapper for one handle")
    p.add_argument("event_slug")
    p.add_argument("handle", help="X handle (no @)")
    p.add_argument("-q", "--query", default=None,
                   help="event keyword to search (default: ヤオヨロー if slug starts yaoyoro, "
                        "else 創集繪 if if7, else 超かぐや姫). Pass --query for any other.")
    p.add_argument("-n", "--count", type=int, default=10)
    p.add_argument("--root", default="~/project/cho-tsukuyomi-map")
    args = p.parse_args()

    handle = args.handle.lstrip("@")
    if args.query:
        kw = args.query
    elif args.event_slug.startswith("yaoyoro"):
        kw = "ヤオヨロー"
    elif args.event_slug.startswith("if7"):
        kw = "創集繪"
    elif args.event_slug.startswith("cho-tsukuyomi"):
        kw = "超ツクヨミ祭"
    elif args.event_slug.startswith("pantabe") or args.event_slug.startswith("panta"):
        kw = "パンケーキ食べたい"
    else:
        kw = "超かぐや姫"

    query = f'"{kw}" from:{handle}'

    out_dir = Path(os.path.expanduser(args.root)) / f".x-api-data-{args.event_slug}" / "search"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{handle}.json"

    xapi = Path.home() / ".claude" / "skills" / "x-api" / "bin" / "run.sh"
    cmd = [str(xapi), "search", query, "-n", str(args.count)]
    print(f"# {' '.join(cmd)} → {out_file}", file=sys.stderr)

    try:
        out = subprocess.check_output(cmd, timeout=60)
        out_file.write_bytes(out)
        sys.stdout.buffer.write(out)
    except subprocess.CalledProcessError as e:
        print(f"ERR: x-api search failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
