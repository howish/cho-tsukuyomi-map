#!/usr/bin/env python3
"""Migrate event data.js to use circle_id references instead of embedded circle fields.

Removes from each booth: circle_name, author, x_handle, x_url, socials
(those now live in circles.json — single source of truth).

Adds: circle_id (FK to circles.json).

Run AFTER extract_circles.py. Run from project root.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path


def circle_id_for(b: dict) -> str:
    # If already migrated, trust the existing circle_id
    if b.get('circle_id'):
        return b['circle_id']
    h = (b.get('x_handle') or '').strip().lower()
    if h:
        return h
    key = (b.get('circle_name') or '') + '|' + (b.get('author') or '')
    return 'c_' + hashlib.sha1(key.encode('utf-8')).hexdigest()[:12]


# Fields to strip after migration
EMBEDDED_CIRCLE_FIELDS = {'circle_name', 'author', 'x_handle', 'x_url', 'socials', 'pixiv_url'}


def migrate_file(path: Path) -> int:
    """Returns count of booths migrated."""
    src = path.read_text(encoding='utf-8')
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
    if not m:
        print(f'skip {path}: no window.BOOTHS', file=sys.stderr)
        return 0
    prefix = src[:m.start()] + 'window.BOOTHS = '
    booths = json.loads(m.group(1))

    for b in booths:
        cid = circle_id_for(b)
        # Insert circle_id at start for readability (preserve booth_id first)
        new_b = {}
        for k, v in b.items():
            if k == 'booth_id':
                new_b['booth_id'] = v
                new_b['circle_id'] = cid
                continue
            if k in EMBEDDED_CIRCLE_FIELDS:
                continue  # drop
            if k == 'circle_id':
                continue  # already inserted above
            new_b[k] = v
        b.clear()
        b.update(new_b)

    out = prefix + json.dumps(booths, ensure_ascii=False, indent=2) + ';\n'
    path.write_text(out, encoding='utf-8')
    return len(booths)


def main():
    root = Path(__file__).parent.parent.parent
    # Verify circles.json exists
    if not (root / 'circles.json').is_file():
        print('error: circles.json not found — run extract_circles.py first', file=sys.stderr)
        sys.exit(1)
    grand_total = 0
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from _events import discover_events
    for ev in discover_events(root):
        data_js = ev.dir / 'data.js'
        if not data_js.is_file(): continue
        n = migrate_file(data_js)
        print(f'{ev.slug}/data.js: {n} booths migrated')
        grand_total += n
    print(f'\nTOTAL: {grand_total} booths now reference circles.json')


if __name__ == '__main__':
    main()
