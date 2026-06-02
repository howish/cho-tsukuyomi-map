#!/usr/bin/env python3
"""Verify that all socials[].url and x_url in event data.js point to PROFILE pages,
not specific posts/statuses.

Run from the project root:
    python3 scripts/check_profile_links.py

Exit code 0 if all clean, 1 if any violation found.

This is the deploy-time check that pairs with scripts/normalize_socials.py:
- normalize_socials.py: convert post→profile URLs in source data
- check_profile_links.py: gate that catches regressions before they ship
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

POST_URL_PATTERNS = [
    # X status URL with a numeric tweet ID
    (re.compile(r'^https?://(?:www\.)?(?:x\.com|twitter\.com)/[^/]+/status/\d+', re.I), 'X status URL'),
    # Threads post URL
    (re.compile(r'^https?://(?:www\.)?threads\.(?:com|net)/@[^/]+/post/', re.I), 'Threads post URL'),
    # Bluesky post URL
    (re.compile(r'^https?://bsky\.app/profile/[^/]+/post/', re.I), 'Bluesky post URL'),
    # Instagram post (user/p/code) — IG profile is user/, post is user/p/code
    (re.compile(r'^https?://(?:www\.)?instagram\.com/[^/]+/p/', re.I), 'Instagram post URL'),
    # Tracking-query suffixes that should have been stripped
    (re.compile(r'\?(?:s=21|t=|hl=|igsh=|utm_)', re.I), 'tracking query param'),
]


def violations_in(url: str) -> list[str]:
    found = []
    for pat, label in POST_URL_PATTERNS:
        if pat.search(url):
            found.append(label)
    return found


def check_event_data(path: Path) -> list[tuple[str, str, str, list[str]]]:
    """Check event data.js (post-migration: x_url/socials may already be gone)."""
    src = path.read_text(encoding='utf-8')
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
    if not m: return []
    booths = json.loads(m.group(1))
    out = []
    for b in booths:
        if b.get('x_url'):
            v = violations_in(b['x_url'])
            if v: out.append((b['booth_id'], 'x_url', b['x_url'], v))
        for s in (b.get('socials') or []):
            if s and s.get('url'):
                v = violations_in(s['url'])
                if v: out.append((b['booth_id'], f"socials[{s.get('platform','?')}].url", s['url'], v))
    return out


def check_circles_json(path: Path) -> list[tuple[str, str, str, list[str]]]:
    """Check circles.json (post-normalization).

    B-big-1 (2026-06-02): URLs now live on authors[] (personal socials)
    rather than circles[] (circle-level only). Walk both arrays.
    """
    d = json.loads(path.read_text(encoding='utf-8'))
    out = []
    for c in (d.get('circles') or []):
        cid = c.get('id') or '?'
        if c.get('x_url'):
            v = violations_in(c['x_url'])
            if v: out.append((cid, 'x_url', c['x_url'], v))
        for s in (c.get('socials') or []):
            if s and s.get('url'):
                v = violations_in(s['url'])
                if v: out.append((cid, f"circle.socials[{s.get('platform','?')}].url", s['url'], v))
    for a in (d.get('authors') or []):
        aid = a.get('id') or '?'
        if a.get('x_url'):
            v = violations_in(a['x_url'])
            if v: out.append((aid, 'author.x_url', a['x_url'], v))
        for s in (a.get('socials') or []):
            if s and s.get('url'):
                v = violations_in(s['url'])
                if v: out.append((aid, f"author.socials[{s.get('platform','?')}].url", s['url'], v))
    return out


def main():
    root = Path(__file__).parent.parent
    grand_violations = 0

    # circles.json is the SSOT for circle URLs
    circles_json = root / 'circles.json'
    if circles_json.is_file():
        violations = check_circles_json(circles_json)
        if violations:
            print(f'\ncircles.json — {len(violations)} violations:')
            for cid, field, url, reasons in violations:
                print(f'  {cid} {field}: {url}')
                for r in reasons: print(f'    └─ {r}')
            grand_violations += len(violations)
        else:
            print(f'circles.json — ✅ clean')

    for ev_dir in sorted(root.iterdir()):
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        violations = check_event_data(data_js)
        if violations:
            print(f'\n{ev_dir.name}/data.js — {len(violations)} violations:')
            for bid, field, url, reasons in violations:
                print(f'  {bid} {field}: {url}')
                for r in reasons: print(f'    └─ {r}')
            grand_violations += len(violations)
        else:
            print(f'{ev_dir.name}/data.js — ✅ clean')
    if grand_violations:
        print(f'\n❌ {grand_violations} total violations. Run scripts/normalize_socials.py to fix.', file=sys.stderr)
        sys.exit(1)
    print(f'\n✅ All clean.')


if __name__ == '__main__':
    main()
