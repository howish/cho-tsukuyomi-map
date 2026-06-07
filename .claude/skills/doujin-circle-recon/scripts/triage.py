#!/usr/bin/env python3
"""Triage pulled timelines: filter event-relevant tweets, emit a human digest.

Output format (stdout):
=== <booth_id> @<handle> ===
  [YYYY-MM-DD] <tweet_id>
  > <text>
    🖼 <image_url>
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
from pathlib import Path


DEFAULT_KEYWORDS = [
    # Generic doujin signals
    "新刊", "既刊", "頒布", "無料配布", "無配", "通販", "委託",
    "お品書き", "品書き", "ジャスト", "部数",
    # Platform / shop
    "メロン", "メロンブックス", "とらのあな", "BOOTH", "pictSPACE", "myship",
    # Event-time
    "撤収", "完売", "搬入", "設営", "スペース",
]


def main():
    p = argparse.ArgumentParser(description="Filter event-relevant tweets per booth")
    p.add_argument("event_slug")
    p.add_argument("--root", default="~/project/cho-tsukuyomi-map")
    p.add_argument("--keywords", action="append",
                   help="extra keywords (additive). Use multiple times.")
    p.add_argument("--event-keywords", action="append",
                   help="event-specific keywords (e.g. ヤオヨロ プリケット 創集繪)")
    p.add_argument("--top", type=int, default=6,
                   help="max relevant tweets per booth (default 6)")
    args = p.parse_args()

    kws = list(DEFAULT_KEYWORDS)
    if args.event_keywords:
        kws = args.event_keywords + kws
    if args.keywords:
        kws.extend(args.keywords)
    pattern = re.compile("|".join(re.escape(k) for k in kws))

    raw_dir = Path(os.path.expanduser(args.root)) / f".x-api-data-{args.event_slug}" / "raw"
    if not raw_dir.exists():
        print(f"no timeline dir: {raw_dir}", file=sys.stderr)
        sys.exit(2)

    files = sorted(raw_dir.glob("*-main-*.json"))
    if not files:
        print(f"no timelines in {raw_dir}", file=sys.stderr)
        sys.exit(2)

    for f in files:
        # Parse filename: <booth>-main-<handle>.json
        stem = f.stem
        try:
            booth, handle = stem.split("-main-", 1)
        except ValueError:
            continue
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue

        tweets = d.get("data", [])
        media_by_key = {m.get("media_key"): m for m in d.get("includes", {}).get("media", [])}

        relevant = []
        for t in tweets:
            text = t.get("text", "")
            if not pattern.search(text):
                continue
            urls = []
            for k in t.get("attachments", {}).get("media_keys", []):
                m = media_by_key.get(k, {})
                u = m.get("url") or m.get("preview_image_url")
                if u and m.get("type") == "photo":
                    urls.append(u)
            relevant.append((t.get("created_at", "")[:10], t.get("id", ""), text, urls))

        print(f"\n===== {booth} @{handle} =====")
        if not relevant:
            # Fall back: 3 most recent tweets unfiltered (signal that handle is active)
            print(f"  [no event-relevant tweets; showing 3 most recent]")
            for t in tweets[:3]:
                urls = []
                for k in t.get("attachments", {}).get("media_keys", []):
                    m = media_by_key.get(k, {})
                    u = m.get("url") or m.get("preview_image_url")
                    if u and m.get("type") == "photo":
                        urls.append(u)
                text = t.get("text", "")[:200].replace("\n", " | ")
                print(f'  [{t.get("created_at","")[:10]}] {t.get("id","")} — {text}')
                for u in urls: print(f"    🖼  {u}")
            continue
        for date, tid, text, urls in relevant[:args.top]:
            text_s = text[:400].replace("\n", " | ")
            print(f"  [{date}] {tid}")
            print(f"  > {text_s}")
            for u in urls:
                print(f"    🖼  {u}")


if __name__ == "__main__":
    main()
