#!/usr/bin/env python3
"""Regenerate each event's index.html from _index_template.html (root SSOT).

Per-event values are extracted from event.js (window.EVENT_CONFIG):
- language → <html lang="...">
- name → <title> + og:title + twitter:title
- og_description → meta description + og:description + twitter:description

Per-event override file _index_overrides.json (optional) can pin og:url / og:image
or other rare per-event tweaks if the heuristics aren't enough.

Run after editing _index_template.html or event.js metadata.
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path


PLACEHOLDER = re.compile(r'\{\{(\w+)\}\}')


def extract_event_meta(event_js: Path) -> dict:
    """Parse event.js for the window.EVENT_CONFIG values we need."""
    txt = event_js.read_text(encoding='utf-8')
    def grab(key):
        m = re.search(rf'^\s*{key}:\s*"((?:[^"\\]|\\.)*)"', txt, re.M)
        if not m: return ''
        # Unescape only JS string escapes that appear in our event.js
        # (\", \\, \n) — keep raw UTF-8 chars intact.
        return m.group(1).replace('\\"', '"').replace('\\\\', '\\').replace('\\n', '\n')
    return {
        'language': grab('language') or 'ja',
        'name': grab('name'),
        'short_name': grab('short_name'),
        'og_description': grab('og_description'),
    }


def build_html(slug: str, ev_dir: Path, template: str, ver: str) -> str:
    meta = extract_event_meta(ev_dir / 'event.js')
    overrides_file = ev_dir / '_index_overrides.json'
    overrides = {}
    if overrides_file.is_file():
        overrides = json.loads(overrides_file.read_text(encoding='utf-8'))

    title = overrides.get('title') or meta['name']
    description = overrides.get('description') or meta['og_description']
    og_url = overrides.get('og_url') or f'https://yachi8000.app/{slug}/'
    og_image = overrides.get('og_image') or f'https://yachi8000.app/{slug}/og.png'

    # Extra scripts (per-event additions like coords.js)
    extra = ''
    if (ev_dir / 'coords.js').is_file():
        extra = f'<script src="coords.js?v={ver}"></script>\n'
    extra_more = overrides.get('extra_scripts') or []
    for s in extra_more:
        extra += f'<script src="{s}?v={ver}"></script>\n'

    sub = {
        'LANG': meta['language'],
        'TITLE': title,
        'DESCRIPTION': description,
        'OG_URL': og_url,
        'OG_IMAGE': og_image,
        'VER': ver,
        'EXTRA_SCRIPTS': extra,
    }
    return PLACEHOLDER.sub(lambda m: sub.get(m.group(1), m.group(0)), template)


def main():
    root = Path(__file__).parent.parent
    template_file = root / '_index_template.html'
    if not template_file.is_file():
        print(f'missing template: {template_file}', file=sys.stderr); sys.exit(1)
    template = template_file.read_text(encoding='utf-8')

    ver = str(int(time.time()))

    for ev_dir in sorted(root.iterdir()):
        if not (ev_dir / 'event.js').is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        slug = ev_dir.name
        html = build_html(slug, ev_dir, template, ver)
        target = ev_dir / 'index.html'
        target.write_text(html, encoding='utf-8')
        print(f'wrote {slug}/index.html (v={ver})')


if __name__ == '__main__':
    main()
