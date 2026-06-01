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


X_STATUS_RE = re.compile(r'^https?://(?:www\.)?(?:x\.com|twitter\.com)/([^/]+)/status/(\d+)', re.I)


def build_tweet_info(root: Path) -> dict[str, dict]:
    """Walk all timeline JSON files and build a tweet_id → metadata map.

    For each tweet we record:
      - canonical_author: the username this tweet should be attributed to
        (= original author for RTs, self-author for normal posts)
      - canonical_url:    https://x.com/<canonical_author>/status/<id>
                          (or /i/status/<id> if author cannot be resolved)
      - is_rt:            whether the tweet itself is a retweet
    """
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

        def register(tid: str, author: str | None, is_rt: bool):
            url = f'https://x.com/{author}/status/{tid}' if author else f'https://x.com/i/status/{tid}'
            existing = info.get(tid)
            # Prefer a non-RT registration with a known author over RT/unknown
            if existing:
                if existing['canonical_author'] and not author: return
                if not existing['is_rt'] and is_rt: return
            info[tid] = {
                'is_rt': is_rt,
                'canonical_url': url,
                'canonical_author': author or '',
            }

        for t in d.get('data', []):
            tid = t['id']
            is_rt = t.get('text', '').startswith('RT @')
            self_author = users.get(t.get('author_id'))
            if is_rt:
                # Resolve to original
                for ref in (t.get('referenced_tweets') or []):
                    if ref.get('type') == 'retweeted':
                        orig_id = ref['id']
                        orig_t = inc_tweets.get(orig_id, {})
                        orig_author = users.get(orig_t.get('author_id'))
                        # Register original tweet under its own ID
                        register(orig_id, orig_author, False)
                        # Also record the RT itself so we can rewrite if encountered
                        register(tid, self_author, True)
                        break
                else:
                    register(tid, self_author, is_rt)
            else:
                register(tid, self_author, False)
        # Also walk includes.tweets (referenced originals from RTs/quotes)
        for it in d.get('includes', {}).get('tweets', []):
            register(it['id'], users.get(it.get('author_id')), False)
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
            cur_handle, tid = m2.group(1), m2.group(2)
            meta = info.get(tid)
            if not meta or not meta.get('canonical_url'):
                continue
            if meta['canonical_url'] == src_u:
                continue   # already canonical
            # Rewrite: resolves both RT (cur_handle ≠ original author) and
            # generic /i/status/ (cur_handle = "i") to the real author URL.
            c['source_url'] = meta['canonical_url']
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
