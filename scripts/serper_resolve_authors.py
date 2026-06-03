#!/usr/bin/env python3
"""Resolve unresolved author SNS via Serper.dev (Google Search API).

Far faster + cheaper than Gemini grounding (~1s/query vs ~90s, $0.02/query
vs ~$0.014 + 90s latency). Returns real Google.tw search results with
TW geo bias so we see the same top hits as howish does on their phone.

For each unresolved author:
  - Build query: circle_name (+ "創集繪" if generic / common collision)
  - Call serper.dev/search with gl=tw, hl=zh-tw
  - Extract URLs matching SNS platform patterns
  - Filter out URLs already in author.socials
  - Output 1-5 candidate hits per author

Output: .serper-candidates.json (same shape as ws-candidates.js so
the merge script can consume both).

Requires SERPER_DEV_API_KEY env var.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path


SERPER_URL = 'https://google.serper.dev/search'

# URL pattern → platform classifier (subset of profile-patterns.js for
# search-result classification — only need to know what platform a URL is).
PLATFORM_RX = [
    (re.compile(r'(?:^|/)(?:x|twitter)\.com/'), 'x'),
    (re.compile(r'(?:^|/)plurk\.com/'), 'plurk'),
    (re.compile(r'(?:^|/)(?:m\.|www\.)?(?:facebook|fb)\.(?:com|me)/'), 'fb'),
    (re.compile(r'(?:^|/)(?:www\.)?instagram\.com/'), 'ig'),
    (re.compile(r'(?:^|/)(?:www\.)?threads\.(?:com|net)/'), 'threads'),
    (re.compile(r'(?:^|/)(?:www\.)?bsky\.app/'), 'bsky'),
    (re.compile(r'(?:^|/)(?:www\.)?pixiv\.net/'), 'pixiv'),
    (re.compile(r'(?:^|/)(?:www\.)?doujin\.com\.tw/'), 'doujin_tw'),
    (re.compile(r'(?:^|/)(?:lit\.link|linktr\.ee|portaly\.cc)/'), 'aggregator'),
    (re.compile(r'(?:^|/)(?:www\.)?pinkoi\.com/'), 'pinkoi'),
    (re.compile(r'(?:^|/)(?:[a-z0-9-]+)\.booth\.pm/'), 'booth_pm'),
    (re.compile(r'(?:^|/)(?:[a-z0-9-]+)\.wixsite\.com/'), 'wix'),
    (re.compile(r'(?:youtube\.com|youtu\.be)/'), 'youtube'),
]


def classify_url(url: str) -> str:
    for rx, plat in PLATFORM_RX:
        if rx.search(url): return plat
    return ''


def norm_url(url: str) -> str:
    if not url: return ''
    return (url.lower()
        .replace('http://', '').replace('https://', '').replace('www.', '')
        .split('?')[0].split('#')[0].rstrip('/'))


def serper_search(api_key: str, query: str, gl='tw', hl='zh-tw', num=10) -> dict:
    body = json.dumps({'q': query, 'gl': gl, 'hl': hl, 'num': num}).encode('utf-8')
    req = urllib.request.Request(
        SERPER_URL, data=body,
        headers={'X-API-KEY': api_key, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--limit', type=int, default=0)
    p.add_argument('--out', default='.serper-candidates.json')
    p.add_argument('--circles', default='circles.json')
    args = p.parse_args()

    api_key = os.environ.get('SERPER_DEV_API_KEY')
    if not api_key:
        print('error: SERPER_DEV_API_KEY env var not set', file=sys.stderr)
        sys.exit(2)

    root = Path(__file__).parent.parent
    d = json.loads((root / args.circles).read_text(encoding='utf-8'))

    by_member = {}
    for c in d['circles']:
        for mid in (c.get('members') or []):
            by_member.setdefault(mid, c)
            break

    unresolved = []
    for a in d['authors']:
        if a.get('name_source') == 'audit_flagged' or (a.get('name_source') == 'circle_name' and not a.get('name')):
            c = by_member.get(a['id'])
            if not c: continue
            unresolved.append({'id': a['id'], 'circle_name': c.get('circle_name', ''),
                               'socials': [s.get('url') for s in (a.get('socials') or [])]})
    if args.limit: unresolved = unresolved[:args.limit]

    print(f'processing {len(unresolved)} unresolved authors', file=sys.stderr)
    out_path = root / args.out
    results = {}
    if out_path.is_file():
        try: results = json.loads(out_path.read_text(encoding='utf-8'))
        except: pass

    for i, a in enumerate(unresolved, 1):
        if a['id'] in results:
            print(f'  [{i}/{len(unresolved)}] {a["id"]} ({a["circle_name"]}): cached', file=sys.stderr)
            continue
        query = f'"{a["circle_name"]}"' if a['circle_name'] else ''
        if not query:
            results[a['id']] = []
            continue
        try:
            t0 = time.time()
            resp = serper_search(api_key, query)
            elapsed = time.time() - t0
        except (urllib.error.URLError, urllib.error.HTTPError) as e:
            print(f'  [{i}/{len(unresolved)}] {a["id"]}: ERR {e}', file=sys.stderr)
            results[a['id']] = []
            time.sleep(2)
            continue

        existing_norm = {norm_url(u) for u in a['socials']}
        hits = []
        for o in (resp.get('organic') or []):
            url = o.get('link', '')
            plat = classify_url(url)
            if not plat: continue
            if norm_url(url) in existing_norm: continue
            # Avoid duplicate same-platform from same site
            if any(h['url'] == url for h in hits): continue
            hits.append({
                'url': url,
                'platform': plat,
                'snippet': (o.get('title') or '')[:80] + ' — ' + (o.get('snippet') or '')[:140],
                'confidence': 'high' if o.get('position', 99) <= 3 else 'medium',
            })
            if len(hits) >= 5: break

        results[a['id']] = hits
        out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'  [{i}/{len(unresolved)}] {a["id"]} ({a["circle_name"]}): {len(hits)} hits ({elapsed:.2f}s)', file=sys.stderr)

    print(f'\nwrote {out_path}', file=sys.stderr)


if __name__ == '__main__':
    main()
