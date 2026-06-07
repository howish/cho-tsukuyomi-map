#!/usr/bin/env python3
"""Generate event index.html from _index_template.html (starter template).

By default this is a ONE-SHOT bootstrap helper: each event's index.html is
hand-editable after creation, and this script SKIPS events that already have
one (won't clobber hand edits).

Use cases:
- New event setup: `--only <slug>` to populate the starter index.html
- Reset to template: `--force` to overwrite (use sparingly — wipes per-event
  customisations to DOM / inline scripts)

Per-event values are extracted from event.js (window.EVENT_CONFIG):
- language → <html lang="...">
- name → <title> + og:title + twitter:title
- og_description → meta description + og:description + twitter:description

Per-event override file _index_overrides.json (optional) can pin og:url / og:image
or other rare per-event tweaks.
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
    import argparse
    p = argparse.ArgumentParser(
        description="Generate event index.html from _index_template.html.\n\n"
                    "Default: skips events that already have index.html (treats them as "
                    "hand-edited / authoritative). Use --force to overwrite, or "
                    "--only <slug> to scope to one event (typical: bootstrap one-shot)."
    )
    p.add_argument('--only', metavar='SLUG',
                   help='Only generate this slug (others skipped)')
    p.add_argument('--force', action='store_true',
                   help='Overwrite even if <slug>/index.html already exists '
                        '(default: skip to respect hand edits)')
    args = p.parse_args()

    root = Path(__file__).parent.parent.parent
    template_file = root / '_index_template.html'
    if not template_file.is_file():
        print(f'missing template: {template_file}', file=sys.stderr); sys.exit(1)
    template = template_file.read_text(encoding='utf-8')

    ver = str(int(time.time()))

    sys.path.insert(0, str(Path(__file__).parent.parent))
    from _events import discover_events
    for ev in discover_events(root):
        if args.only and ev.slug != args.only: continue
        target = ev.dir / 'index.html'
        if target.exists() and not args.force and not args.only:
            print(f'skip {ev.slug}/index.html (exists; --force to overwrite)')
            continue
        html = build_html(ev.slug, ev.dir, template, ver)
        target.write_text(html, encoding='utf-8')
        print(f'wrote {ev.slug}/index.html (v={ver})')


if __name__ == '__main__':
    main()
