#!/usr/bin/env python3
"""Render per-event sw.js + manifest.json from root-level templates.

Before B1 (2026-06-07): each of the 4 events had its own `sw.js` (~120
LOC) and `manifest.json` (12 LOC) as full copies of the template. The
SW files had silently drifted — `if7-2026-05/sw.js` was on
`CACHE_NAME='event-cache-v6'` with a `cache:'no-cache'` revalidation
tweak, while the other three were still on `v4` without the fix. No
one re-synced them when a fix landed on one.

After B1: the canonical source is `_sw_template.js` + `_manifest_template.json`
at repo root. This script copies them into each event dir whose entry
in events.json has a slug. The rendered files stay committed so
GitHub Pages still serves them statically.

Run:
  python3 scripts/build_event_pwa.py            # sync all events
  python3 scripts/build_event_pwa.py --only yaoyoro-2026-06
  python3 scripts/build_event_pwa.py --check    # report drift only, no writes
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _events import discover_events  # noqa: E402


PWA_FILES = ["sw.js", "manifest.json"]
TEMPLATE_MAP = {
    "sw.js": "_sw_template.js",
    "manifest.json": "_manifest_template.json",
}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--only", metavar="SLUG",
                   help="Only sync this slug")
    p.add_argument("--check", action="store_true",
                   help="Report drift only, don't write")
    args = p.parse_args()

    root = Path(__file__).resolve().parent.parent
    templates = {fn: (root / tmpl) for fn, tmpl in TEMPLATE_MAP.items()}
    missing = [t for t in templates.values() if not t.is_file()]
    if missing:
        print(f"error: missing template(s): {missing}", file=sys.stderr)
        sys.exit(1)

    drift = 0
    synced = 0
    for ev in discover_events(root):
        if args.only and ev.slug != args.only:
            continue
        for fn in PWA_FILES:
            src = templates[fn]
            dst = ev.dir / fn
            src_bytes = src.read_bytes()
            if dst.is_file() and dst.read_bytes() == src_bytes:
                continue
            drift += 1
            if args.check:
                print(f"drift: {ev.slug}/{fn} (template differs)")
                continue
            dst.write_bytes(src_bytes)
            print(f"wrote {ev.slug}/{fn} (from {src.name})")
            synced += 1

    if args.check:
        if drift == 0:
            print("✓ all per-event sw.js + manifest.json match templates")
            return 0
        print(f"\n✗ {drift} drift(s); rerun without --check to sync")
        return 1
    if synced == 0:
        print("✓ no changes needed (templates already match all events)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
