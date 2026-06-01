#!/usr/bin/env python3
"""Resolve RT-pointing cover source_urls to the ORIGINAL tweet URL.

Background:
  When we built the image→post reverse map, each timeline contained both the
  author's own posts AND retweets they made. If two booths' timelines both
  contained the same image (one as original, one as RT), whichever scan ran
  first won — sometimes leaving a cover source_url pointing to a RT rather
  than the original post.

This pass walks all `.x-api-data*/raw/` timelines, builds a:
    {tweet_id: {'is_rt': bool, 'original_url': str|None}}
table, then rewrites any cover_urls[].source_url that points to a RT into
the canonical original URL.

Run after `extract_circles.py` + `migrate_to_circle_ref.py` (the canonical
rebuild order).
"""
from __future__ import annotations

import glob
import json
import re
import sys
from pathlib import Path


X_STATUS_RE = re.compile(r'^https?://(?:www\.)?(?:x\.com|twitter\.com)/[^/]+/status/(\d+)', re.I)


def build_tweet_info(root: Path) -> dict[str, dict]:
    """Walk all timeline JSON files and build a tweet_id → metadata map."""
    info: dict[str, dict] = {}
    paths = []
    for d in root.glob('.x-api-data*'):
        # Only pull *-main-*.json (timeline pulls) — skip scratch JSON like
        # refresh-queue.json / source-links.json that have different schemas.
        paths.extend(d.rglob('*-main-*.json'))
    for f in paths:
        try:
            d = json.loads(f.read_text(encoding='utf-8'))
        except Exception:
            continue
        if not isinstance(d, dict): continue
        users = {u['id']: u.get('username') for u in d.get('includes', {}).get('users', []) if u}
        inc_tweets = {t['id']: t for t in d.get('includes', {}).get('tweets', [])}
        for t in d.get('data', []):
            tid = t['id']
            is_rt = t.get('text', '').startswith('RT @')
            orig_url = None
            if is_rt:
                for ref in (t.get('referenced_tweets') or []):
                    if ref.get('type') == 'retweeted':
                        orig_id = ref['id']
                        orig_t = inc_tweets.get(orig_id, {})
                        orig_author = users.get(orig_t.get('author_id'))
                        if orig_author:
                            orig_url = f'https://x.com/{orig_author}/status/{orig_id}'
                        else:
                            orig_url = f'https://x.com/i/status/{orig_id}'
                        break
            # Don't clobber a non-RT registration with an RT one
            existing = info.get(tid)
            if existing and not existing['is_rt'] and is_rt:
                continue
            info[tid] = {'is_rt': is_rt, 'original_url': orig_url}
    return info


def canonicalize_event(path: Path, info: dict[str, dict]) -> int:
    """Returns count of URLs rewritten in this event's data.js."""
    src = path.read_text(encoding='utf-8')
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
    if not m: return 0
    prefix = src[:m.start()] + 'window.BOOTHS = '
    booths = json.loads(m.group(1))

    fixed = 0
    for b in booths:
        for c in (b.get('cover_urls') or []):
            src_u = c.get('source_url', '')
            m2 = X_STATUS_RE.match(src_u)
            if not m2: continue
            tid = m2.group(1)
            meta = info.get(tid)
            if not meta or not meta['is_rt'] or not meta['original_url']:
                continue
            # Rewrite to the canonical original
            c['source_url'] = meta['original_url']
            fixed += 1
    if fixed:
        out = prefix + json.dumps(booths, ensure_ascii=False, indent=2) + ';\n'
        path.write_text(out, encoding='utf-8')
    return fixed


def main():
    root = Path(__file__).parent.parent
    info = build_tweet_info(root)
    print(f'tweet info: {len(info)} entries, {sum(1 for v in info.values() if v["is_rt"])} RTs')

    grand = 0
    for ev_dir in sorted(root.iterdir()):
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        n = canonicalize_event(data_js, info)
        if n:
            print(f'{ev_dir.name}/data.js: {n} cover source_url RT→original')
        grand += n
    print(f'\nTOTAL canonicalized: {grand}')


if __name__ == '__main__':
    main()
