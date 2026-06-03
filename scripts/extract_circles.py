#!/usr/bin/env python3
"""Extract circle + author records into circles.json (SSOT).

Phase B-big-1 (2026-06-02): circles.json has two top-level arrays:
  - circles: [{id, circle_name, members: [author_id], socials, events}]
  - authors: [{id, name, name_inferred, name_source, aliases, socials, pixiv_url?}]

A circle has 1+ members. Solo circle = 1 member (most common). Multi-author
circles list all members. Same author across multiple circles → same
author.id in each circle's members.

Author identity:
  - Primary: x_handle (lowercased) — stable, URL-readable
  - Fallback: 'a_' + sha1(name + '|' + circle_id)[:12]

Circle identity (unchanged from earlier):
  - Primary: x_handle (lowercased) of the first/primary member
  - Fallback: 'c_' + sha1(circle_name + '|' + author)[:12]

Idempotent: if circles.json already has both circles[] and authors[],
preserves them across runs (only events lists are rebuilt fresh).
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
    h = (b.get('x_handle') or '').strip().lower()
    if h:
        return h
    key = (b.get('circle_name') or '') + '|' + (b.get('author') or '')
    return 'c_' + hashlib.sha1(key.encode('utf-8')).hexdigest()[:12]


def author_id_for(name: str, x_handle: str, circle_id: str) -> str:
    h = (x_handle or '').strip().lower()
    if h:
        return h
    key = f'{name or ""}|{circle_id or ""}'.encode('utf-8')
    return 'a_' + hashlib.sha1(key).hexdigest()[:12]


def norm_url(u: str) -> str:
    if not u: return ''
    return (u.replace('http://', '').replace('https://', '')
             .replace('www.', '').split('?')[0].split('#')[0]
             .rstrip('/').lower())


def main():
    root = Path(__file__).parent.parent

    # Pre-load existing circles + authors + books from circles.json. The
    # events list for each circle is wiped on entry (rebuilt fresh below).
    # Books are preserved as-is (manually curated; no auto-derivation yet).
    circles: dict[str, dict] = {}
    authors: dict[str, dict] = {}
    books: list[dict] = []
    existing_json = root / 'circles.json'
    if existing_json.is_file():
        try:
            ed = json.loads(existing_json.read_text(encoding='utf-8'))
            books = list(ed.get('books') or [])
            for c in (ed.get('circles') or []):
                if not c.get('id'): continue
                circles[c['id']] = {
                    'id': c['id'],
                    'circle_name': c.get('circle_name') or '',
                    'members': list(c.get('members') or []),
                    'socials': list(c.get('socials') or []),
                    'events': [],
                    '_seen_urls': {norm_url(s.get('url', '')) for s in (c.get('socials') or []) if s.get('url')},
                }
            for a in (ed.get('authors') or []):
                if not a.get('id'): continue
                authors[a['id']] = {
                    'id': a['id'],
                    'name': a.get('name') or '',
                    'name_inferred': a.get('name_inferred') or '',
                    'name_source': a.get('name_source') or '',
                    'aliases': list(a.get('aliases') or []),
                    'socials': list(a.get('socials') or []),
                    '_seen_urls': {norm_url(s.get('url', '')) for s in (a.get('socials') or []) if s.get('url')},
                }
                if a.get('pixiv_url'):
                    authors[a['id']]['pixiv_url'] = a['pixiv_url']
        except Exception as e:
            print(f'warn: pre-load failed: {e}', file=sys.stderr)

    # Load events.json for slug → display
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

    # Walk all event data.js — collect circle + author + event references
    for ev_dir in sorted(root.iterdir()):
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        booths = load_booths(data_js)
        if not booths: continue
        ev_slug = ev_dir.name
        ev_meta = events_map.get(ev_slug, {'name': ev_slug, 'date': ''})
        for b in booths:
            cid = b.get('circle_id') or circle_id_for(b)
            if cid not in circles:
                circles[cid] = {
                    'id': cid,
                    'circle_name': b.get('circle_name') or '',
                    'members': [],
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
            if b.get('circle_name') and not c['circle_name']:
                c['circle_name'] = b['circle_name']

            # Determine the primary author for this booth's circle.
            # If circle.members already populated (from pre-load or earlier event),
            # use the first member. Otherwise derive from booth fields.
            if c['members']:
                primary_aid = c['members'][0]
            else:
                primary_aid = author_id_for(
                    b.get('author') or b.get('circle_name') or '',
                    b.get('x_handle') or '',
                    cid,
                )
                c['members'].append(primary_aid)

            # Ensure author record exists (4-state schema, 2026-06-02):
            #   name:           confirmed name (empty if not yet known)
            #   name_inferred:  best guess (circle_name / x_handle), display fallback
            #   name_source:    "user" | "circle_name" | "x_handle" | ""
            # If new derivation lacks an explicit b['author'], leave name=""
            # and store the circle_name guess in name_inferred. Future runs
            # don't overwrite an explicit user-set name.
            if primary_aid not in authors:
                if b.get('author'):
                    name = b['author']; inferred = ''; source = 'user'
                elif b.get('circle_name'):
                    name = ''; inferred = b['circle_name']; source = 'circle_name'
                elif b.get('x_handle'):
                    name = ''; inferred = b['x_handle']; source = 'x_handle'
                else:
                    name = ''; inferred = primary_aid; source = 'x_handle'
                authors[primary_aid] = {
                    'id': primary_aid,
                    'name': name,
                    'name_inferred': inferred,
                    'name_source': source,
                    'socials': [],
                    '_seen_urls': set(),
                }
            a = authors[primary_aid]
            # Promote inferred → confirmed if a later booth has explicit author
            if b.get('author') and not a.get('name'):
                a['name'] = b['author']
                a['name_inferred'] = ''
                a['name_source'] = 'user'

            # Booth-embedded socials get accumulated onto the author (personal
            # socials). Implicit X social from x_handle is added as a regular
            # socials entry (x_handle field itself is no longer stored).
            booth_socials = list(b.get('socials') or [])
            if b.get('x_handle'):
                booth_socials.insert(0, {
                    'platform': 'x',
                    'url': 'https://x.com/' + b['x_handle'],
                })
            for s in booth_socials:
                if not s or not s.get('url'): continue
                n = norm_url(s['url'])
                if not n or n in a['_seen_urls']: continue
                a['_seen_urls'].add(n)
                a['socials'].append({
                    'platform': s.get('platform') or 'generic',
                    'handle': s.get('handle') or '',
                    'url': s['url'],
                })

    # Emit — strip internal tracking + sort events
    circle_out = []
    for cid in sorted(circles.keys()):
        c = circles[cid]
        c.pop('_seen_urls', None)
        c['events'].sort(key=lambda e: e.get('date') or '')
        circle_out.append(c)

    author_out = []
    for aid in sorted(authors.keys()):
        a = authors[aid]
        a.pop('_seen_urls', None)
        author_out.append(a)

    out_obj = {'circles': circle_out, 'authors': author_out}
    if books:
        out_obj['books'] = books
    target_json = root / 'circles.json'
    target_json.write_text(
        json.dumps(out_obj, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    print(f'wrote {target_json} — {len(circle_out)} circles, {len(author_out)} authors, {len(books)} books')

    # Runtime lookup: circles.js exports CIRCLES_BY_ID + AUTHORS_BY_ID + BOOKS_BY_CIRCLE
    # (BY_CIRCLE inverted index lets the modal show "books published by this circle"
    # without scanning the full books[] array per booth.)
    circles_by_id = {c['id']: c for c in circle_out}
    authors_by_id = {a['id']: a for a in author_out}
    books_by_circle: dict[str, list[dict]] = {}
    for bk in books:
        cid = bk.get('circle_id')
        if cid:
            books_by_circle.setdefault(cid, []).append(bk)
    target_js = root / 'circles.js'
    target_js.write_text(
        '/* AUTO-GENERATED by scripts/extract_circles.py — do not edit. SSOT is circles.json */\n'
        'window.CIRCLES_BY_ID = ' +
        json.dumps(circles_by_id, ensure_ascii=False, indent=2) + ';\n'
        'window.AUTHORS_BY_ID = ' +
        json.dumps(authors_by_id, ensure_ascii=False, indent=2) + ';\n'
        'window.BOOKS_BY_CIRCLE = ' +
        json.dumps(books_by_circle, ensure_ascii=False, indent=2) + ';\n',
        encoding='utf-8',
    )
    print(f'wrote {target_js} — {len(circles_by_id)} circles + {len(authors_by_id)} authors + {len(books)} books (runtime)')


if __name__ == '__main__':
    main()
