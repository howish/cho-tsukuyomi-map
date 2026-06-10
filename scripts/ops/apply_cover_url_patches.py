#!/usr/bin/env python3
"""Apply {booth_id: [cover_url_obj, ...]} patches to <event>/data.js
with fcntl.flock serialization.

cover_url_obj shape: {"source_url": "...", "display_url": "...",
                      "kind"?: "oshinagaki"|"cover"|"announce",
                      "manual"?: true}

`kind` labels what the image IS (お品書き / 表紙 / 告知ビジュアル) so a
human scanning data.js — or the site UI — can tell at a glance.
`manual: true` marks a hand-pinned entry: apply keeps it at the front
and never lets an auto-refresh overwrite or reorder it.

Usage:
  apply_cover_url_patches.py <event_slug> <patches.json>
"""

from __future__ import annotations

import argparse
import fcntl
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("event_slug")
    p.add_argument("patches_json")
    args = p.parse_args()

    data_js = ROOT / args.event_slug / "data.js"
    if not data_js.is_file():
        print(f"error: {data_js} not found", file=sys.stderr)
        sys.exit(1)

    patches: dict[str, list[dict]] = json.loads(
        Path(args.patches_json).read_text(encoding="utf-8")
    )
    if not patches:
        print("no patches to apply", file=sys.stderr)
        sys.exit(0)

    with data_js.open("r+", encoding="utf-8") as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        try:
            raw = f.read()
            m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$', raw, re.S)
            if not m:
                print("error: unexpected data.js shape", file=sys.stderr)
                sys.exit(2)
            arr_text = m.group(1)
            arr_start, arr_end = m.span(1)
            booths = json.loads(arr_text)
            booth_by_id = {b["booth_id"]: b for b in booths}

            applied = 0
            missing: list[str] = []
            for bid, new_covers in patches.items():
                if bid not in booth_by_id:
                    missing.append(bid)
                    continue
                # Hand-pinned entries (`manual: true`) survive auto
                # refreshes: they stay at the front in their current
                # order; incoming entries append after, deduped by
                # display_url.
                existing = booth_by_id[bid].get("cover_urls") or []
                pinned = [c for c in existing
                          if isinstance(c, dict) and c.get("manual")]
                pinned_urls = {c.get("display_url") for c in pinned}
                merged = pinned + [
                    c for c in new_covers
                    if c.get("display_url") not in pinned_urls
                ]
                booth_by_id[bid]["cover_urls"] = merged
                applied += 1

            new_arr = json.dumps(booths, ensure_ascii=False, indent=2)
            new_raw = raw[:arr_start] + new_arr + raw[arr_end:]
            f.seek(0)
            f.write(new_raw)
            f.truncate()
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)

    print(f"applied {applied} cover_url patch(es)", file=sys.stderr)
    if missing:
        print(f"warn: {len(missing)} booth_id not in data.js: "
              f"{missing[:5]}{'...' if len(missing) > 5 else ''}",
              file=sys.stderr)


if __name__ == "__main__":
    main()
