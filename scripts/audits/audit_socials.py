#!/usr/bin/env python3
"""Audit author.socials for:
  1. Non-profile URLs (posts / artworks / videos / shares — not profile pages)
  2. Platform-name mismatches (handled by normalize_platforms.py)

Lists offenders so you can decide whether to filter/remove them.
"""
import json
import re
from pathlib import Path
from collections import Counter

# URL patterns that are NOT profile/SNS pages but specific posts/items.
NON_PROFILE_RE = [
    # Instagram
    (re.compile(r'instagram\.com/p/'),     'ig_post'),
    (re.compile(r'instagram\.com/reel/'),  'ig_reel'),
    # Facebook
    (re.compile(r'facebook\.com/share/'),  'fb_share'),
    (re.compile(r'facebook\.com/[^/]+/posts/'), 'fb_post'),
    (re.compile(r'facebook\.com/photo'),   'fb_photo'),
    (re.compile(r'facebook\.com/events/'), 'fb_event'),
    (re.compile(r'facebook\.com/groups/'), 'fb_group'),
    # YouTube — videos vs channels
    (re.compile(r'youtube\.com/watch'),    'yt_video'),
    (re.compile(r'youtube\.com/shorts/'),  'yt_short'),
    (re.compile(r'youtu\.be/'),            'yt_video'),
    # Pixiv non-profile
    (re.compile(r'pixiv\.net/artworks/'),  'pixiv_artwork'),
    (re.compile(r'pixiv\.net/novel/'),     'pixiv_novel'),
    (re.compile(r'embed\.pixiv\.net'),     'pixiv_embed'),
    # Doujin_tw non-profile (books/goods are products, uploads are images)
    (re.compile(r'doujin\.com\.tw/books/'),  'dtw_book'),
    (re.compile(r'doujin\.com\.tw/goods/'),  'dtw_goods'),
    (re.compile(r'doujin\.com\.tw/uploads/'),'dtw_image'),
    # Discord — invite links, not user profiles
    (re.compile(r'discord\.gg/'),           'discord_invite'),
    (re.compile(r'discord\.com/invite/'),   'discord_invite'),
    # X/Twitter — status URLs
    (re.compile(r'x\.com/[^/]+/status/'),   'x_post'),
    (re.compile(r'twitter\.com/[^/]+/status/'), 'x_post'),
    # Threads posts
    (re.compile(r'threads\.com/@[^/]+/post/'), 'threads_post'),
    (re.compile(r'threads\.net/@[^/]+/post/'), 'threads_post'),
]

p = Path(__file__).parent.parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

offenders = []
kind_counter = Counter()
for a in d['authors']:
    for s in (a.get('socials') or []):
        url = s.get('url', '')
        if not url: continue
        for rx, kind in NON_PROFILE_RE:
            if rx.search(url):
                offenders.append((a['id'], kind, s.get('platform', ''), url))
                kind_counter[kind] += 1
                break

print(f'non-profile URLs found: {len(offenders)}')
print()
print('by kind:')
for k, n in kind_counter.most_common():
    print(f'  {k}: {n}')

print()
print('sample (10):')
for aid, kind, plat, url in offenders[:10]:
    print(f'  [{kind}] {aid} plat={plat} url={url}')
