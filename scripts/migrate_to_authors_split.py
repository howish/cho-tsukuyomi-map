#!/usr/bin/env python3
"""B-big-1 migration: split circles.json into circles[] + authors[].

Current shape (Phase A/A.5):
  circles: [{id, circle_name, author, x_handle, x_url, socials, events}]

New shape (B-big-1):
  circles: [{id, circle_name, members: [author_id], socials, events}]
    - socials here = circle-level only (FB page, blog) — usually empty in
      solo case after migration
  authors: [{id, name, x_handle, x_url, socials, pixiv_url}]
    - One author per row, may participate in multiple circles
    - id = derived from x_handle (lowercase) or hash of (name + circle id)

Initial migration: mechanical 1:1 mapping for the 633 circles. Most are
solo (1 circle = 1 author), so:
  - author.id = circle.id (preserve URLs and lookup keys)
  - author.name = circle.author or circle.circle_name
  - author.x_handle = circle.x_handle
  - author.socials = circle.socials (moved from circle to author)
  - circle.members = [author.id]
  - circle.socials = []  (cleared — was personal socials, now lives on author)

Multi-author circles are NOT auto-detected. After this migration, add
additional members manually as they're discovered:
  circle.members.append("other_author_id")

Idempotent. Run once to migrate, then extract_circles.py keeps both files
in sync going forward.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def author_id_for(circle: dict) -> str:
    """Derive an author ID — usually the X handle (lowercase), else hash."""
    h = (circle.get('x_handle') or '').strip().lower()
    if h:
        return h
    name = (circle.get('author') or circle.get('circle_name') or '').strip()
    cid = circle.get('id') or ''
    key = f'{name}|{cid}'.encode('utf-8')
    return 'a_' + hashlib.sha1(key).hexdigest()[:12]


def main() -> int:
    circles_path = ROOT / 'circles.json'
    if not circles_path.is_file():
        print('error: circles.json not found', file=sys.stderr)
        return 2
    data = json.loads(circles_path.read_text(encoding='utf-8'))
    circles = data.get('circles', [])

    if any('members' in c for c in circles):
        print('error: circles.json already has members — already migrated?',
              file=sys.stderr)
        return 2

    authors_by_id: dict[str, dict] = {}
    new_circles: list[dict] = []

    for c in circles:
        aid = author_id_for(c)
        # Build author record (deduped — same author may appear across circles
        # in future, but the 1:1 init keeps each author unique-per-circle)
        if aid not in authors_by_id:
            authors_by_id[aid] = {
                'id': aid,
                'name': (c.get('author') or c.get('circle_name') or aid),
                'x_handle': c.get('x_handle', ''),
                'x_url': c.get('x_url', ''),
                'socials': list(c.get('socials') or []),
            }
            if c.get('pixiv_url'):
                authors_by_id[aid]['pixiv_url'] = c['pixiv_url']
        # Rebuild circle in new shape
        new_c = {
            'id': c['id'],
            'circle_name': c.get('circle_name', ''),
            'members': [aid],
            'socials': [],   # circle-level — empty for solo (personal socials moved to author)
            'events': c.get('events', []),
        }
        new_circles.append(new_c)

    authors = list(authors_by_id.values())
    out = {
        'circles': new_circles,
        'authors': authors,
    }
    circles_path.write_text(
        json.dumps(out, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    print(f'wrote {circles_path}')
    print(f'  circles: {len(new_circles)}')
    print(f'  authors: {len(authors)}')
    print(f'  (1:1 mapping — manual member additions required for multi-author circles)')

    return 0


if __name__ == '__main__':
    sys.exit(main())
