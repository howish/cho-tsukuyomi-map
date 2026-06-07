#!/usr/bin/env python3
"""Audit authors with too many socials — likely aggregator over-fetch
contamination (portaly.cc / linktr.ee scrapes that grabbed every linked
account on the page, including unrelated markets/collaborators).

For each author with >= N socials:
  - Extract the "primary handle" candidate (most common token across URLs
    when split by / and _)
  - Flag socials whose URL doesn't share the primary handle as suspicious
  - Output report sorted by suspicious-count descending
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path


def url_handle(url: str) -> str:
    """Extract the trailing path segment that looks like a handle."""
    m = re.search(r'/(@?[A-Za-z0-9_.-]+)/?$', url.rstrip('/'))
    if not m: return ''
    h = m.group(1).lstrip('@')
    # FB profile.php?id=N → use the ID
    if h.startswith('profile.php'):
        idm = re.search(r'id=(\d+)', url)
        return idm.group(1) if idm else ''
    return h.lower()


def tokenize(h: str) -> set:
    """Break a handle into tokens by _, ., - separators."""
    return set(re.split(r'[._-]+', h.lower())) - {''}


def main():
    root = Path(__file__).parent.parent.parent
    d = json.loads((root / 'circles.json').read_text(encoding='utf-8'))
    by_member = {}
    for c in d['circles']:
        for mid in (c.get('members') or []):
            by_member.setdefault(mid, c)
            break

    flagged = []
    threshold = 6  # only audit authors with 6+ socials
    for a in d['authors']:
        socials = a.get('socials') or []
        if len(socials) < threshold: continue
        c = by_member.get(a['id'])
        cname = (c.get('circle_name') or '').strip() if c else ''

        # Token frequency across all handles
        tokens = Counter()
        for s in socials:
            for tok in tokenize(url_handle(s.get('url', ''))):
                if len(tok) >= 3:
                    tokens[tok] += 1

        # Primary token = most-common token covering ≥ half the socials
        primary = ''
        if tokens:
            top, n = tokens.most_common(1)[0]
            if n >= max(2, len(socials) // 3):
                primary = top

        suspicious = []
        clean = []
        for s in socials:
            h = url_handle(s.get('url', ''))
            toks = tokenize(h)
            if primary and primary in toks:
                clean.append(s)
            else:
                suspicious.append(s)

        if suspicious:
            flagged.append({
                'author_id': a['id'],
                'name': a.get('name') or a.get('name_inferred') or cname,
                'circle_name': cname,
                'total_socials': len(socials),
                'primary_token': primary,
                'clean_count': len(clean),
                'suspicious_count': len(suspicious),
                'suspicious_urls': [s.get('url') for s in suspicious],
                'clean_urls': [s.get('url') for s in clean],
            })

    flagged.sort(key=lambda x: x['suspicious_count'], reverse=True)
    print(f'audit threshold: {threshold}+ socials per author')
    print(f'flagged authors: {len(flagged)}\n')
    for f in flagged[:30]:
        print(f"{f['name']} (id: {f['author_id']}) — {f['total_socials']} total, primary='{f['primary_token']}'")
        print(f"  clean ({f['clean_count']}): {f['clean_urls']}")
        print(f"  suspicious ({f['suspicious_count']}): {f['suspicious_urls']}")
        print()
    out = root / '.oversocial-audit.json'
    out.write_text(json.dumps(flagged, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'\nfull report → {out}')


if __name__ == '__main__':
    main()
