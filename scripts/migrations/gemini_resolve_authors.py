#!/usr/bin/env python3
"""Resolve unresolved author SNS via Gemini CLI + Google Search grounding.

For each unresolved author (name_source='circle_name' && empty name, OR
name_source='audit_flagged'), invoke `gemini -p <query>` to ask Gemini
to find the author's FB / X / IG / Plurk / blog / aggregator URL +
display name.

Gemini's built-in Google Search grounding gives Taiwan-geo-aware results
that the generic WebSearch API misses (e.g. "遇見幸福手創館" finds the
correct FB page immediately).

Output: appends to .gemini-candidates.json (merge later into
review/ws-candidates.js via gen_ws_candidates_from_gemini.py).
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path


PROMPT_TEMPLATE = """Search Google for the social media presence of this Taiwan/JP doujin booth circle:

Circle name: {circle_name}
Existing socials: {existing_socials}
Event: {events}

Your job: find the official Facebook / X (Twitter) / Instagram / Plurk / blog / linktr.ee / portaly.cc / pinkoi URL for this circle, plus the page's display name.

Context: this is a 同人即売会 (doujin event) booth. Search for the circle name in quotes. The circle may use 手創 (handcraft), 工作室 (studio), or similar Taiwan-style names. If the circle name is ambiguous or generic, add the event name "創集繪" or "IF7" to narrow down.

Output ONLY a JSON array (no markdown, no commentary), one object per platform found:

```json
[
  {{"url": "https://www.facebook.com/...", "platform": "fb", "display_name": "...", "snippet": "why this is the right page"}}
]
```

Valid `platform` values: x, plurk, fb, ig, threads, bsky, pixiv, doujin_tw, aggregator, pinkoi, blog, generic.

If you cannot find a confident match, output `[]`.
Limit to 1-3 entries. Skip duplicates of the existing socials list.
"""


def run_gemini(prompt: str, model: str = '', timeout: int = 300) -> str:
    cmd = ['gemini', '--approval-mode', 'yolo']
    if model:
        cmd += ['-m', model]
    cmd += ['-p', prompt]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return proc.stdout
    except subprocess.TimeoutExpired:
        return ''


def extract_json(text: str) -> list:
    # Find first JSON array in output
    m = re.search(r'\[\s*(?:\{[^\[\]]*\}[\s,]*)*\]', text, re.S)
    if not m: return []
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return []


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--limit', type=int, default=0, help='Limit N authors (0 = all)')
    p.add_argument('--skip', type=int, default=0, help='Skip first N')
    p.add_argument('--out', default='.gemini-candidates.json')
    p.add_argument('--circles', default='circles.json')
    p.add_argument('--model', default='gemini-2.5-flash',
                   help='Gemini model (default flash for speed; use gemini-2.5-pro for harder cases)')
    args = p.parse_args()

    root = Path(__file__).parent.parent.parent
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
            unresolved.append({
                'id': a['id'],
                'circle_name': c.get('circle_name', ''),
                'socials': [s.get('url') for s in (a.get('socials') or [])],
                'events': [f"{e.get('slug')}:{e.get('booth_id')}" for e in (c.get('events') or [])],
            })

    if args.skip: unresolved = unresolved[args.skip:]
    if args.limit: unresolved = unresolved[:args.limit]

    print(f'processing {len(unresolved)} unresolved authors', file=sys.stderr)

    out_path = root / args.out
    existing = {}
    if out_path.is_file():
        try:
            existing = json.loads(out_path.read_text(encoding='utf-8'))
        except: pass

    for i, a in enumerate(unresolved, 1):
        if a['id'] in existing:
            print(f'  [{i}/{len(unresolved)}] {a["id"]} ({a["circle_name"]}): cached, skip', file=sys.stderr)
            continue
        prompt = PROMPT_TEMPLATE.format(
            circle_name=a['circle_name'] or '(no name)',
            existing_socials=a['socials'] or '(none)',
            events=a['events'] or '(none)',
        )
        t0 = time.time()
        out = run_gemini(prompt, model=args.model, timeout=300)
        elapsed = time.time() - t0
        hits = extract_json(out)
        # Only cache if we got results — empty result for timeout shouldn't
        # be cached (let next run retry).
        if hits or elapsed < 290:
            existing[a['id']] = hits
            out_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2),
                                encoding='utf-8')
        status = f'{len(hits)} hits' if hits else ('TIMEOUT' if elapsed >= 290 else '0 hits')
        print(f'  [{i}/{len(unresolved)}] {a["id"]} ({a["circle_name"]}): {status} ({elapsed:.1f}s)', file=sys.stderr)

    print(f'\nwrote {out_path}', file=sys.stderr)


if __name__ == '__main__':
    main()
