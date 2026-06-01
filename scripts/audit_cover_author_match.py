#!/usr/bin/env python3
"""Audit booth cover_urls for author mismatch with the booth's circle handle.

Surfaces cases where the X status URL of a cover is by a DIFFERENT author
than the booth's circle (after RT canonicalization). Some are legitimate
(co-circle, 寄攤 partner, collab promo); some are wrong attribution from
recon mishaps. This is a manual-review report — no auto-fix.

Skips:
- `/i/status/` URLs (author not knowable from URL alone)
- handles in the circle's socials list (declared co-circles)
- entries in .cover_author_allowlist.json (manually-confirmed 寄攤 partners
  whose handle isn't on the circle's own socials — e.g. U-30 河豚老師)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


X_STATUS_RE = re.compile(r'^https?://(?:www\.)?(?:x\.com|twitter\.com)/([^/]+)/status/(\d+)', re.I)


def load_allowlist(root: Path) -> dict:
    p = root / '.cover_author_allowlist.json'
    if not p.is_file(): return {}
    try:
        d = json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return {}
    # Strip _doc / nested _doc keys
    return {k: v for k, v in d.items() if not k.startswith('_')}


def main():
    root = Path(__file__).parent.parent
    circles_data = json.loads((root / 'circles.json').read_text(encoding='utf-8'))
    circles_by_id = {c['id']: c for c in circles_data['circles']}
    allowlist = load_allowlist(root)

    rows = []
    for ev_dir in sorted(root.iterdir()):
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        src = data_js.read_text(encoding='utf-8')
        m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
        if not m: continue
        booths = json.loads(m.group(1))
        ev_allow = allowlist.get(ev_dir.name, {}) or {}
        for b in booths:
            circle = circles_by_id.get(b.get('circle_id'), {})
            booth_handle = (circle.get('x_handle') or '').lower()
            if not booth_handle: continue
            # Also accept any handle that's in the circle's socials (co-circles)
            partner_handles = {booth_handle}
            for s in (circle.get('socials') or []):
                h = (s.get('handle') or '').lstrip('@').lower()
                if h: partner_handles.add(h)
            # Per-booth allowlist (寄攤 partners not in circle.socials)
            booth_allow = ev_allow.get(b.get('booth_id'), {}) or {}
            for h in (booth_allow.get('handles') or []):
                partner_handles.add(h.lstrip('@').lower())
            for c in (b.get('cover_urls') or []):
                src_u = c.get('source_url', '')
                m2 = X_STATUS_RE.match(src_u)
                if not m2: continue
                src_handle = m2.group(1).lower()
                if src_handle == 'i': continue
                if src_handle in partner_handles: continue
                rows.append({
                    'event': ev_dir.name,
                    'booth_id': b['booth_id'],
                    'circle_name': circle.get('circle_name', ''),
                    'booth_handle': booth_handle,
                    'src_handle': src_handle,
                    'src_url': src_u,
                    'display_url': c.get('display_url', ''),
                })

    if not rows:
        print('✅ No cover/booth author mismatches found.')
        return
    print(f'{len(rows)} cover/booth author mismatches (manual review):\n')
    by_ev = {}
    for r in rows:
        by_ev.setdefault(r['event'], []).append(r)
    for ev, lst in by_ev.items():
        print(f'== {ev} ({len(lst)}) ==')
        for r in lst:
            print(f'  {r["booth_id"]:<10} ({r["circle_name"]} @{r["booth_handle"]})')
            print(f'    cover src: @{r["src_handle"]} → {r["src_url"]}')
            print(f'    display  : {r["display_url"]}')
        print()


if __name__ == '__main__':
    main()
