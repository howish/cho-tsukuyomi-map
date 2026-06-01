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
- handles in .cover_author_allowlist.json (manually-confirmed 寄攤 partners)
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

    grand_pruned = 0
    for ev_dir in sorted(root.iterdir()):
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        src = data_js.read_text(encoding='utf-8')
        m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
        if not m: continue
        prefix = src[:m.start()] + 'window.BOOTHS = '
        booths = json.loads(m.group(1))
        pruned = 0
        pruned_examples = []
        for b in booths:
            circle = circles_by_id.get(b.get('circle_id'), {})
            booth_handle = (circle.get('x_handle') or '').lower()
            if not booth_handle: continue
            partner_handles = {booth_handle}
            for s in (circle.get('socials') or []):
                h = (s.get('handle') or '').lstrip('@').lower()
                if h: partner_handles.add(h)

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
