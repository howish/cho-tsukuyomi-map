#!/usr/bin/env python3
"""One-shot: collapse URL-variant duplicates that point to the same account.

Same handle, different URL form:
  - twitter.com/X  ≈  x.com/X
  - threads.com/@X  ≈  threads.net/@X
  - doujin.com.tw/authors/info/X/goods  ≈  /authors/info/X
  - pixiv.net/member.php?id=N  ≈  pixiv.net/users/N
  - http://  vs  https://  /  trailing slash variants

Strategy: build a canonical key per URL. If two socials map to the same
canonical key, keep the first, drop the rest.
"""
import json
import re
from pathlib import Path


def canonical_key(url: str) -> str:
    if not url: return ''
    u = url.lower()
    # Strip scheme + www + query + fragment + trailing slash
    u = re.sub(r'^https?://', '', u)
    u = re.sub(r'^www\.', '', u)
    u = u.split('?')[0].split('#')[0].rstrip('/')
    # x.com / twitter.com → unified
    u = re.sub(r'^twitter\.com/', 'x.com/', u)
    # threads.com / threads.net → unified
    u = re.sub(r'^threads\.net/', 'threads.com/', u)
    # FB / fb.com / fb.me → unified
    u = re.sub(r'^(fb\.com|fb\.me|m\.facebook\.com)/', 'facebook.com/', u)
    # doujin_tw: strip /goods, /books, /diary tabs from author page URL
    u = re.sub(r'^doujin\.com\.tw/authors/info/([^/]+)/.*$', r'doujin.com.tw/authors/info/\1', u)
    u = re.sub(r'^doujin\.com\.tw/groups/info/(\d+)/.*$', r'doujin.com.tw/groups/info/\1', u)
    # pixiv: member.php?id=N → users/N (the canonical form)
    m = re.match(r'^pixiv\.net/member\.php$', u)
    if m:
        # query was already stripped — recover ID from original url
        idm = re.search(r'[?&]id=(\d+)', url)
        if idm:
            u = f'pixiv.net/users/{idm.group(1)}'
    # Plurk: /m/USER (mobile) → /USER
    u = re.sub(r'^plurk\.com/m/', 'plurk.com/', u)
    return u


p = Path(__file__).parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

removed = 0
for a in d['authors']:
    seen = set()
    out = []
    for s in (a.get('socials') or []):
        ck = canonical_key(s.get('url', ''))
        if ck and ck in seen:
            removed += 1
            continue
        if ck: seen.add(ck)
        out.append(s)
    a['socials'] = out

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'removed {removed} URL-variant duplicates')
