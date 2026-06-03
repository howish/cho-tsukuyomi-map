#!/usr/bin/env python3
"""Master socials cleanup — single script replacing the legacy dedup/strip
one-shots. Walks every author and applies the same sanitization logic the
author-name-resolver `apply` gateway uses, so the data ends up in the
state any future enrichment would produce.

Replaces (now removed):
  - scripts/dedupe_socials.py        x_handle vs socials X-URL dupes
  - scripts/dedupe_url_variants.py   twitter.com↔x.com, threads.com↔.net
  - scripts/normalize_platforms.py   instagram→ig, facebook→fb, etc
  - scripts/strip_non_profile.py     post/share/artwork URLs

Run after any data import that bypassed the skill's apply path (e.g. raw
JSON edits, legacy enrichment script runs).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / '.claude/skills/author-name-resolver/scripts'))
from resolver import _sanitize_social, _canonicalize_url

p = Path(__file__).parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

stripped = 0
relabeled = 0
deduped = 0
for a in d['authors']:
    # 1. Sanitize each social entry (normalize platform, filter non-profile)
    cleaned = []
    for s in (a.get('socials') or []):
        result = _sanitize_social(s.get('platform', ''), s.get('url', ''), s.get('handle', ''))
        if result is None:
            stripped += 1
            continue
        platform, url, handle = result
        if platform != s.get('platform') or url != s.get('url'):
            relabeled += 1
        cleaned.append({'platform': platform, 'url': url, 'handle': handle})

    # 2. Dedup against canonical URL (+ x_handle implicit X URL)
    seen = set()
    if a.get('x_handle'):
        seen.add(_canonicalize_url(f'https://x.com/{a["x_handle"]}'))
    deduped_list = []
    for s in cleaned:
        ck = _canonicalize_url(s['url'])
        if not ck or ck in seen:
            deduped += 1
            continue
        seen.add(ck)
        deduped_list.append(s)
    a['socials'] = deduped_list

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'cleaned circles.json:')
print(f'  non-profile stripped: {stripped}')
print(f'  platform/url normalized: {relabeled}')
print(f'  duplicates removed: {deduped}')
print(f'  total socials now: {sum(len(a.get("socials") or []) for a in d["authors"])}')
