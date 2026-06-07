#!/usr/bin/env python3
"""One-shot migration: drop author.x_handle / x_url fields, ensure X URL
lives in socials[] instead.

After this runs:
  - Every author with x_handle has a `{platform:'x', url:'https://x.com/<h>'}`
    entry in socials[] (if not already present)
  - x_handle, x_url fields removed from author schema
  - author.id values are preserved (no key migration) — id stays whatever
    extract_circles.py originally computed

This decouples "identity field" from "primary platform". The id is just an
opaque key; the X URL becomes one social among many.
"""
import json
import re
from pathlib import Path


def norm(u: str) -> str:
    if not u: return ''
    return (u.replace('http://','').replace('https://','')
            .replace('www.','').split('?')[0].split('#')[0]
            .rstrip('/').lower())


p = Path(__file__).parent.parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

added = 0
dropped = 0
for a in d['authors']:
    x_handle = a.get('x_handle', '').strip()
    if x_handle:
        x_url = a.get('x_url') or f'https://x.com/{x_handle}'
        existing = {norm(s.get('url','')) for s in (a.get('socials') or [])}
        if norm(x_url) not in existing:
            a.setdefault('socials', []).insert(0, {'platform': 'x', 'url': x_url})
            added += 1
    # Drop fields whether or not x_handle existed
    if 'x_handle' in a:
        del a['x_handle']
        dropped += 1
    if 'x_url' in a:
        del a['x_url']

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'added X URL to socials: {added} authors')
print(f'dropped x_handle field:  {dropped} authors')
