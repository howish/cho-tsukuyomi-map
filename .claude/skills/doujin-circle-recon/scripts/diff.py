#!/usr/bin/env python3
"""Show event-relevant tweets that are NEW since the last pull.

Compares raw/ vs raw-prev/ (saved by pull_timelines.py). For each new
tweet that matches the keyword filter, prints booth+text+image URLs.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

from triage import DEFAULT_KEYWORDS


def collect_ids(dir_path: Path) -> set[str]:
    ids = set()
    if not dir_path.exists():
        return ids
    for f in dir_path.glob("*-main-*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        for t in d.get("data", []):
            ids.add(t.get("id"))
    return ids


def main():
    p = argparse.ArgumentParser(description="Diff new event-relevant tweets vs previous pull")
    p.add_argument("event_slug")
    p.add_argument("--root", default="~/project/cho-tsukuyomi-map")
    p.add_argument("--keywords", action="append")
    p.add_argument("--event-keywords", action="append")
    args = p.parse_args()

    kws = list(DEFAULT_KEYWORDS)
    if args.event_keywords: kws = args.event_keywords + kws
    if args.keywords: kws.extend(args.keywords)
    pattern = re.compile("|".join(re.escape(k) for k in kws))

    api_dir = Path(os.path.expanduser(args.root)) / f".x-api-data-{args.event_slug}"
    raw = api_dir / "raw"
    prev = api_dir / "raw-prev"

    if not raw.exists():
        print(f"no current pull: {raw}", file=sys.stderr); sys.exit(2)
    if not prev.exists():
        print(f"no previous pull baseline: {prev} — run pull twice for diff to work", file=sys.stderr)
        sys.exit(2)

    prev_ids = collect_ids(prev)
    print(f"# baseline tweet IDs: {len(prev_ids)}", file=sys.stderr)

    new_count = 0
    for f in sorted(raw.glob("*-main-*.json")):
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

        relevant_new = []
        for t in tweets:
            tid = t.get("id")
            if not tid or tid in prev_ids:
                continue
            text = t.get("text", "")
            if not pattern.search(text):
                continue
            urls = []
            for k in t.get("attachments", {}).get("media_keys", []):
                m = media_by_key.get(k, {})
                u = m.get("url") or m.get("preview_image_url")
                if u and m.get("type") == "photo":
                    urls.append(u)
            relevant_new.append((t.get("created_at","")[:10], tid, text, urls))

        if not relevant_new:
            continue
        new_count += len(relevant_new)
        print(f"\n===== {booth} @{handle} ({len(relevant_new)} new) =====")
        for date, tid, text, urls in relevant_new:
            text_s = text[:400].replace("\n", " | ")
            print(f"  [{date}] {tid}")
            print(f"  > {text_s}")
            for u in urls:
                print(f"    🖼  {u}")

    print(f"\n# TOTAL NEW relevant tweets: {new_count}", file=sys.stderr)


if __name__ == "__main__":
    main()
