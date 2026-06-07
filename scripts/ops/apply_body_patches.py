#!/usr/bin/env python3
"""Apply {booth_id: new_body} patches to <event>/data.js with fcntl.flock
serialization so parallel body-update agents don't clobber each other.

The data.js file is parsed via the same `window.BOOTHS = [...]` regex
used elsewhere; the file is rewritten preserving the literal
`window.BOOTHS = ` prefix and the trailing `;`.

Usage:
  apply_body_patches.py <event_slug> <patches.json>

patches.json shape:
  { "booth_id_1": "new body markdown", "booth_id_2": "...", ... }

A booth_id absent from patches.json is left untouched. A booth_id in
patches.json but not in data.js is reported as a warning and skipped.
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

    patches: dict[str, str] = json.loads(
        Path(args.patches_json).read_text(encoding="utf-8")
    )
    if not patches:
        print("no patches to apply", file=sys.stderr)
        sys.exit(0)

    # Hold the lock across the entire read-modify-write so parallel
    # agents see a consistent state.
    with data_js.open("r+", encoding="utf-8") as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        try:
            raw = f.read()
            # Match: <prefix>window.BOOTHS = [...]<suffix>
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
            for bid, new_body in patches.items():
                if bid not in booth_by_id:
                    missing.append(bid)
                    continue
                booth_by_id[bid]["body"] = new_body
                applied += 1

            # Re-serialize the array only; preserve everything before
            # window.BOOTHS = (comment block) and after the closing ].
            new_arr = json.dumps(booths, ensure_ascii=False, indent=2)
            new_raw = raw[:arr_start] + new_arr + raw[arr_end:]

            f.seek(0)
            f.write(new_raw)
            f.truncate()
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)

    print(f"applied {applied} patch(es)", file=sys.stderr)
    if missing:
        print(f"warn: {len(missing)} booth_id not in data.js: "
              f"{missing[:5]}{'...' if len(missing) > 5 else ''}",
              file=sys.stderr)


if __name__ == "__main__":
    main()
