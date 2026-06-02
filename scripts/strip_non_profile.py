#!/usr/bin/env python3
"""One-shot: remove non-profile URLs from author.socials.

Posts / artworks / videos / shares aren't profile pages — they create
noise chips that don't help users find the artist's main socials.
Same regex set as audit_socials.py.
"""
import json
import re
from pathlib import Path

NON_PROFILE_RE = [
    re.compile(r'instagram\.com/(p|reel)/'),
    re.compile(r'facebook\.com/share/'),
    re.compile(r'facebook\.com/[^/]+/posts/'),
    re.compile(r'facebook\.com/photo'),
    re.compile(r'facebook\.com/events/'),
    re.compile(r'facebook\.com/groups/'),
    re.compile(r'youtube\.com/(watch|shorts)/'),
    re.compile(r'youtu\.be/'),
    re.compile(r'pixiv\.net/(artworks|novel)/'),
    re.compile(r'embed\.pixiv\.net'),
    re.compile(r'doujin\.com\.tw/(books|goods|uploads)/'),
    re.compile(r'discord\.gg/'),
    re.compile(r'discord\.com/invite/'),
    re.compile(r'(x|twitter)\.com/[^/]+/status/'),
    re.compile(r'threads\.(com|net)/@[^/]+/post/'),
]

p = Path(__file__).parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

removed = 0
for a in d['authors']:
    before = len(a.get('socials') or [])
    a['socials'] = [s for s in (a.get('socials') or [])
                    if not any(rx.search(s.get('url', '')) for rx in NON_PROFILE_RE)]
    removed += before - len(a['socials'])

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'removed {removed} non-profile URLs from socials')
