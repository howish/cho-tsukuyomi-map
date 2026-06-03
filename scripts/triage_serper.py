#!/usr/bin/env python3
"""Triage serper.dev candidate hits into HIGH/MED/LOW + auto-skip.

For each candidate URL, score by:
  - Title CONTAINS exact circle_name → strong signal
  - URL is canonical profile shape (matches profile-patterns) → strong
  - URL is post/photo/share/status (not profile root) → demote
  - URL is unrelated content from random author → reject

Output:
  - .auto-decisions.json (HIGH confidence add_social decisions)
  - filters serper-candidates to only MED+ for review-queue display
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Profile-shape regexes (URL is a profile root, not a post/photo)
PROFILE_RX = [
    (re.compile(r'^https?://(?:www\.)?(?:x|twitter)\.com/[A-Za-z0-9_]+/?$'), 'x'),
    (re.compile(r'^https?://(?:www\.)?plurk\.com/[A-Za-z0-9_]+/?$'), 'plurk'),
    (re.compile(r'^https?://(?:www\.|m\.)?(?:facebook|fb)\.(?:com|me)/[A-Za-z0-9._-]+/?$'), 'fb'),
    (re.compile(r'^https?://(?:www\.|m\.)?(?:facebook|fb)\.(?:com|me)/profile\.php\?id=\d+$'), 'fb'),
    (re.compile(r'^https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.]+/?$'), 'ig'),
    (re.compile(r'^https?://(?:www\.)?threads\.(?:com|net)/@[A-Za-z0-9_.]+/?$'), 'threads'),
    (re.compile(r'^https?://(?:www\.)?bsky\.app/profile/[^/]+/?$'), 'bsky'),
    (re.compile(r'^https?://(?:www\.)?pixiv\.net/users/\d+/?$'), 'pixiv'),
    (re.compile(r'^https?://(?:www\.)?doujin\.com\.tw/(?:authors|groups)/info/[A-Za-z0-9_]+/?'), 'doujin_tw'),
    (re.compile(r'^https?://(?:lit\.link|linktr\.ee|portaly\.cc)/[A-Za-z0-9_.-]+/?$'), 'aggregator'),
    (re.compile(r'^https?://(?:www\.)?pinkoi\.com/store/[A-Za-z0-9_-]+/?$'), 'pinkoi'),
    (re.compile(r'^https?://[A-Za-z0-9_-]+\.booth\.pm/?$'), 'booth_pm'),
    (re.compile(r'^https?://(?:www\.)?youtube\.com/@[A-Za-z0-9_.-]+/?$'), 'youtube'),
    (re.compile(r'^https?://(?:www\.)?youtube\.com/channel/[A-Za-z0-9_-]+/?$'), 'youtube'),
]

# Non-profile patterns (posts, photos, status updates) — demote
NON_PROFILE_RX = re.compile(
    r'/(?:posts|photos|photo|videos|video|status|p|reel|reels|story|stories|story_fbid)/'
    r'|/post/'
    r'|/photo\.php'
    r'|\?fbid='
    r'|/about/?$'  # FB about page (acceptable but not as good as root)
)


def is_profile_url(url: str) -> str:
    """Return canonical platform if URL is a profile root, else ''"""
    for rx, plat in PROFILE_RX:
        if rx.match(url): return plat
    return ''


def score_hit(circle_name: str, hit: dict) -> tuple[str, str]:
    """Returns (confidence, reason). confidence ∈ {high, medium, low, reject}"""
    url = hit['url']
    title = hit.get('snippet', '')
    plat = is_profile_url(url)
    is_post = bool(NON_PROFILE_RX.search(url))

    # Exact circle_name in title
    name_in_title = circle_name.strip() in title

    if plat and name_in_title:
        return ('high', f'profile {plat} + circle_name in title')
    if plat and not is_post:
        return ('medium', f'profile {plat} but circle_name not in title — verify')
    if name_in_title and not is_post:
        return ('medium', 'circle_name in title but URL not profile root')
    if is_post:
        return ('low', 'post/photo URL, not profile root')
    return ('low', 'no signal')


def main():
    d = json.loads((ROOT / '.serper-candidates.json').read_text(encoding='utf-8'))
    circles = json.loads((ROOT / 'circles.json').read_text(encoding='utf-8'))
    by_member = {}
    for c in circles['circles']:
        for mid in (c.get('members') or []):
            by_member.setdefault(mid, c)
            break

    auto_decisions = []
    triaged = {}
    stats = {'high': 0, 'medium': 0, 'low': 0, 'reject': 0}

    for aid, hits in d.items():
        c = by_member.get(aid, {})
        cname = (c.get('circle_name') or '').strip()
        if not hits:
            triaged[aid] = []
            continue
        scored = []
        for h in hits:
            conf, reason = score_hit(cname, h)
            stats[conf] = stats.get(conf, 0) + 1
            scored.append({**h, 'confidence': conf, 'reason': reason})
            if conf == 'high':
                # Emit an add_social decision for high-confidence profile hits
                auto_decisions.append({
                    'author_id': aid,
                    'decision': 'add_social',
                    'platform': h['platform'],
                    'url': h['url'],
                    'handle': '',
                })
        triaged[aid] = scored

    # Write outputs
    (ROOT / '.serper-candidates.json').write_text(
        json.dumps(triaged, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / '.auto-decisions.json').write_text(
        json.dumps(auto_decisions, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'triage stats:')
    for k in ('high', 'medium', 'low', 'reject'):
        print(f'  {k:8s} {stats.get(k, 0)}')
    print(f'\nauto-decisions emitted: {len(auto_decisions)}')
    print(f'wrote .auto-decisions.json + updated .serper-candidates.json')


if __name__ == '__main__':
    main()
