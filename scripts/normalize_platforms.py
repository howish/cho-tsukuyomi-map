#!/usr/bin/env python3
"""Normalize social platform names in circles.json.

aggregator-resolver emits platform names like 'instagram', 'facebook',
'youtube' while the rest of cho-tsukuyomi-map uses 'ig', 'fb', 'generic'.
This script aligns everything to the cho-tsukuyomi-map canonical names.
"""
import json
from pathlib import Path

ALIAS = {
    'instagram': 'ig',
    'facebook': 'fb',
    'twitter': 'x',
    'youtube': 'generic',
    'tumblr': 'blog',
    'discord': 'generic',
    'tiktok': 'generic',
    'booth': 'booth_pm',
    'marshmallow': 'generic',
    'skeb': 'generic',
    'melonbooks': 'generic',
    'toranoana': 'generic',
    'pictspace': 'generic',
}

p = Path(__file__).parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

changes = {}
for a in d['authors']:
    for s in (a.get('socials') or []):
        plat = s.get('platform', '')
        if plat in ALIAS:
            new = ALIAS[plat]
            s['platform'] = new
            key = f'{plat} → {new}'
            changes[key] = changes.get(key, 0) + 1

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('platform normalizations applied:')
for k, v in sorted(changes.items(), key=lambda kv: -kv[1]):
    print(f'  {k}: {v}')
print(f'total changes: {sum(changes.values())}')
