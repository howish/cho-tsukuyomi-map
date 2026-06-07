#!/usr/bin/env python3
"""Delete cover_urls entries whose X status URL is by a different author than
the booth's circle (after RT canonicalization + partner-socials inclusion).

Rationale: during recon, retweets were sometimes mis-attributed to the
booth's circle. Those covers actually belong to another author's post (a
friend / unrelated person who RT'd a tangentially-related image). Best
fix is to drop the cover entry — the booth keeps its remaining covers and
the wrong image stops being shown under the booth's name.

Skips:
- /i/status/ URLs (author not resolvable)
- author handles in the circle.socials list (legitimate co-circles)
- handles in booth.consignment_partners[] (Phase A schema, per-event 寄攤)
- Non-X cover URLs (FB / Plurk / IG / Threads / Bsky / direct image)

Idempotent. Run after canonicalize_rt_sources.py.

**Note**: As of 2026-06-01, this script is NOT wired into the rebuild
pipeline. Policy shifted to manual review (Yachiyo per-case judgment) —
the rebuild instead runs audit_cover_author_match.py. Keep this script
around for occasional bulk-prune after confirming all flagged entries
are genuinely wrong attribution.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


X_STATUS_RE = re.compile(r'^https?://(?:www\.)?(?:x\.com|twitter\.com)/([^/]+)/status/(\d+)', re.I)


def main():
    root = Path(__file__).parent.parent
    circles_data = json.loads((root / 'circles.json').read_text(encoding='utf-8'))
    circles_by_id = {c['id']: c for c in circles_data['circles']}
    authors_by_id = {a['id']: a for a in circles_data.get('authors', [])}

    grand_pruned = 0
    import sys as _sys
    _sys.path.insert(0, str(Path(__file__).parent))
    from _events import discover_events
    for ev in discover_events(root):
        ev_dir = ev.dir
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        src = data_js.read_text(encoding='utf-8')
        m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
        if not m: continue
        prefix = src[:m.start()] + 'window.BOOTHS = '
        booths = json.loads(m.group(1))
        pruned = 0
        pruned_examples = []
        for b in booths:
            circle = circles_by_id.get(b.get('circle_id'), {})
            # Primary author = first member (B-big-1 schema)
            primary_author = (authors_by_id.get((circle.get('members') or [None])[0]) or {}) if circle.get('members') else {}
            booth_handle = (primary_author.get('x_handle') or '').lower()
            if not booth_handle: continue
            partner_handles = {booth_handle}
            # All members' handles + their socials
            for aid in (circle.get('members') or []):
                a = authors_by_id.get(aid) or {}
                h = (a.get('x_handle') or '').lstrip('@').lower()
                if h: partner_handles.add(h)
                for s in (a.get('socials') or []):
                    sh = (s.get('handle') or '').lstrip('@').lower()
                    if sh: partner_handles.add(sh)
            # Circle-level socials (FB page, blog, etc.)
            for s in (circle.get('socials') or []):
                h = (s.get('handle') or '').lstrip('@').lower()
                if h: partner_handles.add(h)
            # Phase B-small schema: per-booth 寄攤 / 委託 partners.
            # Bare-string entries (legacy) or {platform, handle, name?} objects.
            for entry in (b.get('consignment_partners') or []):
                if isinstance(entry, str):
                    partner_handles.add(entry.lstrip('@').lower())
                elif isinstance(entry, dict) and entry.get('platform') == 'x':
                    h = entry.get('handle') or ''
                    if h:
                        partner_handles.add(h.lstrip('@').lower())

            kept = []
            for c in (b.get('cover_urls') or []):
                src_u = c.get('source_url', '')
                m2 = X_STATUS_RE.match(src_u)
                if not m2:
                    kept.append(c); continue
                src_handle = m2.group(1).lower()
                if src_handle == 'i' or src_handle in partner_handles:
                    kept.append(c); continue
                pruned += 1
                if len(pruned_examples) < 5:
                    pruned_examples.append((b['booth_id'], src_handle, src_u))
            b['cover_urls'] = kept

        if pruned:
            print(f'{ev_dir.name}/data.js: pruned {pruned} mismatched covers')
            for ex in pruned_examples:
                print(f'  {ex[0]} @{ex[1]} {ex[2]}')
            out = prefix + json.dumps(booths, ensure_ascii=False, indent=2) + ';\n'
            data_js.write_text(out, encoding='utf-8')
        grand_pruned += pruned
    print(f'\nTOTAL pruned: {grand_pruned}')


if __name__ == '__main__':
    main()
