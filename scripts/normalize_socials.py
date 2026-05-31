#!/usr/bin/env python3
"""Normalize socials[].url and x_url in all event data.js files to PROFILE URL form.

This is the single source of truth for chip rendering — the runtime
template no longer needs to re-derive profile URLs.

Run from the project root:
    python3 scripts/normalize_socials.py
"""
import json, re, os, sys
from pathlib import Path

PROFILE_RULES = [
    # (platform/host regex on full URL, full URL → profile URL)
    (re.compile(r'^(https?://(?:www\.)?(?:x\.com|twitter\.com))/([A-Za-z0-9_]+)(?:/status/.*)?(?:\?.*)?(?:#.*)?$', re.I),
     lambda m: f"{m.group(1)}/{m.group(2)}"),
    (re.compile(r'^(https?://(?:www\.)?threads\.(?:com|net))/(@[A-Za-z0-9_.]+)(?:/post/.*)?(?:\?.*)?(?:#.*)?$', re.I),
     lambda m: f"{m.group(1)}/{m.group(2)}"),
    (re.compile(r'^(https?://(?:www\.)?instagram\.com)/([A-Za-z0-9_.]+)(?:/p/.*)?/?(?:\?.*)?(?:#.*)?$', re.I),
     lambda m: f"{m.group(1)}/{m.group(2)}/" if m.group(2) not in ('p', 'reel', 'reels') else None),
    (re.compile(r'^(https?://bsky\.app/profile/[^/]+)(?:/post/.*)?(?:\?.*)?(?:#.*)?$', re.I),
     lambda m: m.group(1)),
]

def to_profile(url: str) -> str | None:
    """Return profile URL if convertible; None if URL is post-only (FB share/p, Plurk /p/)."""
    if not url:
        return url
    for pat, fn in PROFILE_RULES:
        m = pat.match(url)
        if m:
            result = fn(m)
            return result if result else url
    return url  # Plurk / FB share / etc. — leave as-is

def fix_file(path: Path) -> tuple[int, int]:
    """Returns (changed, total_urls)."""
    src = path.read_text(encoding='utf-8')
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
    if not m:
        print(f'skip {path}: no window.BOOTHS', file=sys.stderr)
        return (0, 0)
    prefix = src[:m.start()] + 'window.BOOTHS = '
    booths = json.loads(m.group(1))
    changed = 0; total = 0
    for b in booths:
        if b.get('x_url'):
            total += 1
            new = to_profile(b['x_url'])
            if new != b['x_url']:
                b['x_url'] = new; changed += 1
        for s in (b.get('socials') or []):
            if not s or not s.get('url'): continue
            total += 1
            new = to_profile(s['url'])
            if new != s['url']:
                s['url'] = new; changed += 1
    if changed:
        out = prefix + json.dumps(booths, ensure_ascii=False, indent=2) + ';\n'
        path.write_text(out, encoding='utf-8')
    return (changed, total)

def main():
    root = Path(__file__).parent.parent
    grand_changed = 0; grand_total = 0
    for ev_dir in sorted(root.iterdir()):
        data_js = ev_dir / 'data.js'
        if not data_js.is_file(): continue
        if ev_dir.name in {'scripts', 'circles'}: continue
        ch, total = fix_file(data_js)
        grand_changed += ch; grand_total += total
        print(f'{ev_dir.name}/data.js: {ch}/{total} URLs normalized')
    print(f'\nTOTAL: {grand_changed}/{grand_total}')

if __name__ == '__main__':
    main()
