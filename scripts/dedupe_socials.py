#!/usr/bin/env python3
"""One-shot: remove duplicate X-URL entries from socials when they overlap
with author.x_handle (which already implies the X URL).

Run once after the social enrichment phase to clean up. extract_circles.py
preserves the cleanup since duplicates won't re-emerge from booth data
(booth data has x_handle but not duplicate socials entries).
"""
import json
import re
from pathlib import Path


def norm(u: str) -> str:
    if not u: return ''
    return (u.replace('http://', '').replace('https://', '')
            .replace('www.', '').split('?')[0].split('#')[0]
            .rstrip('/').lower())


p = Path(__file__).parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

removed = 0
for a in d['authors']:
    if not a.get('x_handle'): continue
    x_url_norm = norm(f'https://x.com/{a["x_handle"]}')
    socials = a.get('socials') or []
    before = len(socials)
    a['socials'] = [s for s in socials if norm(s.get('url', '')) != x_url_norm]
    removed += before - len(a['socials'])

# Also dedup within socials by normalized URL (defensive — should be 0 now)
within_removed = 0
for a in d['authors']:
    seen = set()
    out = []
    for s in (a.get('socials') or []):
        n = norm(s.get('url', ''))
        if n and n in seen:
            within_removed += 1
            continue
        if n: seen.add(n)
        out.append(s)
    a['socials'] = out

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'removed {removed} x_handle dupes from socials')
print(f'removed {within_removed} within-socials dupes')
