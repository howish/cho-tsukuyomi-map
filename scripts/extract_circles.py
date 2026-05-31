#!/usr/bin/env python3
"""Extract circle/author records from all event data.js into circles.json (SSOT).

After this, each event's data.js should be slimmed down via migrate_to_circle_ref.py.

ID strategy:
- Primary: x_handle (lowercased) — stable, URL-readable
- Fallback: 'c_' + sha1(circle_name + '|' + author)[:12]
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path


def load_booths(path: Path) -> list[dict]:
    src = path.read_text(encoding='utf-8')
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
    if not m:
        return []
    return json.loads(m.group(1))


def circle_id_for(b: dict) -> str:
    """Derive a stable circle ID from a booth record."""
    h = (b.get('x_handle') or '').strip().lower()
    if h:
        return h
    key = (b.get('circle_name') or '') + '|' + (b.get('author') or '')
    return 'c_' + hashlib.sha1(key.encode('utf-8')).hexdigest()[:12]


def norm_url(u: str) -> str:
    if not u: return ''
    return (u.replace('http://', '').replace('https://', '')
             .replace('www.', '').split('?')[0].split('#')[0]
             .rstrip('/').lower())


def main():
    root = Path(__file__).parent.parent
    circles: dict[str, dict] = {}

    # Pre-populate from existing circles.json — preserves circle data when
    # event data.js is already slim (only has circle_id, no embedded fields).
    # Events list is always rebuilt fresh below, so we wipe it on entry.
    existing_json = root / 'circles.json'
    if existing_json.is_file():
        try:
            ed = json.loads(existing_json.read_text(encoding='utf-8'))
            for c in (ed.get('circles') or []):
                if c.get('id'):
                    circles[c['id']] = {
                        'id': c['id'],
                        'circle_name': c.get('circle_name') or '',
                        'author': c.get('author') or '',
                        'x_handle': c.get('x_handle') or '',
                        'x_url': c.get('x_url') or '',
                        'socials': list(c.get('socials') or []),
                        'events': [],   # rebuilt from data.js below
                        '_seen_urls': {norm_url(s.get('url', '')) for s in (c.get('socials') or []) if s.get('url')},
                    }
        except Exception:
            pass

    # Load events.json to map slug → display name + date (for events list)
    events_map = {}
    events_file = root / 'events.json'
    if events_file.is_file():
        try:
            ev_data = json.loads(events_file.read_text(encoding='utf-8'))
            for e in (ev_data.get('events') or []):
                if e.get('slug'):
                    events_map[e['slug']] = {
                        'name': e.get('short_name') or e.get('name'),
                        'date': e.get('date'),
                    }
        except Exception:
            pass

    for ev_dir in sorted(root.iterdir()):
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        booths = load_booths(data_js)
        if not booths: continue
        ev_slug = ev_dir.name
        ev_meta = events_map.get(ev_slug, {'name': ev_slug, 'date': ''})
        for b in booths:
            # Prefer explicit circle_id (post-migration data.js); else derive
            cid = b.get('circle_id') or circle_id_for(b)
            if cid not in circles:
                circles[cid] = {
                    'id': cid,
                    'circle_name': b.get('circle_name') or '',
                    'author': b.get('author') or '',
                    'x_handle': b.get('x_handle') or '',
                    'x_url': b.get('x_url') or '',
                    'socials': [],
                    'events': [],
                    '_seen_urls': set(),
                }
            c = circles[cid]
            c['events'].append({
                'slug': ev_slug,
                'name': ev_meta['name'],
                'date': ev_meta['date'],
                'booth_id': b.get('booth_id') or '',
            })
            # Update fields if missing (don't clobber)
            if b.get('circle_name') and not c['circle_name']:
                c['circle_name'] = b['circle_name']
            if b.get('author') and not c['author']:
                c['author'] = b['author']
            if b.get('x_handle') and not c['x_handle']:
                c['x_handle'] = b['x_handle']
            if b.get('x_url') and not c['x_url']:
                c['x_url'] = b['x_url']
            # Implicit X social from x_handle
            all_socials = list(b.get('socials') or [])
            if b.get('x_handle'):
                all_socials.insert(0, {
                    'platform': 'x',
                    'handle': '@' + b['x_handle'],
                    'url': 'https://x.com/' + b['x_handle'],
                })
            for s in all_socials:
                if not s or not s.get('url'): continue
                n = norm_url(s['url'])
                if not n or n in c['_seen_urls']: continue
                c['_seen_urls'].add(n)
                c['socials'].append({
                    'platform': s.get('platform') or 'generic',
                    'handle': s.get('handle') or '',
                    'url': s['url'],
                })

    # Strip internal tracking + sort events chronologically + emit
    out = []
    for cid in sorted(circles.keys()):
        c = circles[cid]
        del c['_seen_urls']
        c['events'].sort(key=lambda e: e.get('date') or '')
        out.append(c)

    # SSOT: circles.json (human-edited / inspected source of truth)
    target_json = root / 'circles.json'
    target_json.write_text(
        json.dumps({'circles': out}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    print(f'wrote {target_json} — {len(out)} circles')

    # Runtime: circles.js (script-tag loadable, sync) — id-keyed lookup
    by_id = {c['id']: c for c in out}
    target_js = root / 'circles.js'
    target_js.write_text(
        '/* AUTO-GENERATED by scripts/extract_circles.py — do not edit. SSOT is circles.json */\n'
        'window.CIRCLES_BY_ID = ' +
        json.dumps(by_id, ensure_ascii=False, indent=2) + ';\n',
        encoding='utf-8',
    )
    print(f'wrote {target_js} — {len(by_id)} entries (runtime lookup)')


if __name__ == '__main__':
    main()
