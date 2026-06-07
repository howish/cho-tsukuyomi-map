#!/usr/bin/env python3
"""1-shot R2 image replacement — fetch source → upload → return cache-busted URL.

The pattern that hits often: a R2-mirrored cover image either (a) was never
correctly uploaded in the first place (404), or (b) was uploaded but is the
wrong image (e.g. fb-scraper grabbed a sidebar / dummy). This tool:

  1. Looks up the cover_urls entry in data.js by event slug + booth_id + cover index
  2. Re-fetches the original image from `source_url` (via fb-scraper / direct
     download for X / Threads / Plurk / Bsky)
  3. Uploads to R2 at the existing key
  4. Sets display_url with `?v=<sha8>` cache-buster (sha8 of new content)
  5. Writes back to data.js (unless --dry-run)

CLI:
  scripts/r2_image_replace.py --event if7-2026-05 --booth T-23/24 --cover 0
  scripts/r2_image_replace.py --event if7-2026-05 --booth T-23/24 --cover 0 --dry-run
  scripts/r2_image_replace.py --display-url <full-cdn-url>   # auto-find in data.js

This is the 1-shot version of the manual recipe used for T-23/24 on 2026-06-01.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT / 'scripts'))

import r2_upload   # local module


SKILLS = Path.home() / '.claude/skills'
FB_SCRAPER = SKILLS / 'fb-scraper/bin/run.sh'


# ---------- data.js helpers ----------

def load_booths(event_slug: str) -> tuple[list, str, Path]:
    path = PROJECT / event_slug / 'data.js'
    src = path.read_text(encoding='utf-8')
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
    if not m:
        raise ValueError(f'no window.BOOTHS found in {path}')
    prefix = src[:m.start()] + 'window.BOOTHS = '
    booths = json.loads(m.group(1))
    return booths, prefix, path


def save_booths(booths, prefix, path: Path) -> None:
    path.write_text(prefix + json.dumps(booths, ensure_ascii=False, indent=2) + ';\n',
                    encoding='utf-8')


def find_cover_by_display_url(display_url: str) -> tuple[str, str, int]:
    """Find (event_slug, booth_id, cover_index) for a given display_url.

    Strips any ?v= cache-buster suffix to match.
    """
    base = display_url.split('?')[0]
    import sys as _sys
    _sys.path.insert(0, str(Path(__file__).parent.parent))
    from _events import discover_events
    for ev in discover_events(PROJECT):
        if not (ev.dir / 'data.js').is_file():
            continue
        try:
            booths, _, _ = load_booths(ev.slug)
        except Exception:
            continue
        for b in booths:
            for i, c in enumerate(b.get('cover_urls') or []):
                du = (c.get('display_url') or '').split('?')[0]
                if du == base:
                    return ev.slug, b['booth_id'], i
    raise ValueError(f'display_url not found in any event data.js: {display_url}')


# ---------- image fetch ----------

def fetch_image_to_temp(source_url: str, cookies: str | None = None) -> Path:
    """Re-fetch the source image (FB share post via fb-scraper, else direct).

    Returns local temp file path of the downloaded image.
    """
    tmp = Path(tempfile.mkdtemp(prefix='r2_replace_'))
    if 'facebook.com' in source_url:
        # Use the fb-scraper dispatcher which auto-routes share/post → Playwright
        env = os.environ.copy()
        if cookies:
            env['FB_COOKIES_NETSCAPE_PATH'] = cookies
        out = subprocess.run(
            [str(FB_SCRAPER), source_url, '--json-only'],
            capture_output=True, timeout=240, env=env,
        )
        try:
            d = json.loads(out.stdout.decode())
        except Exception as e:
            raise RuntimeError(f'fb-scraper output not JSON: {e}\nstderr: {out.stderr.decode()[:500]}')
        photos = d.get('photos') or []
        if not photos:
            raise RuntimeError(
                f'fb-scraper returned no photos for {source_url}. '
                f'blocked={d.get("blocked")} '
                f'photos_fallback_error={d.get("photos_fallback_error")}'
            )
        # Take the first photo (= main image for single-image posts, first of carousel)
        img_url = photos[0]
        out_path = tmp / '0.jpg'
        data = urllib.request.urlopen(
            urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'}),
            timeout=30,
        ).read()
        out_path.write_bytes(data)
        return out_path

    # Other platforms (X/Threads/Plurk/Bsky CDN URLs): direct download with browser UA
    out_path = tmp / '0.jpg'
    data = urllib.request.urlopen(
        urllib.request.Request(source_url, headers={'User-Agent': 'Mozilla/5.0'}),
        timeout=30,
    ).read()
    out_path.write_bytes(data)
    return out_path


# ---------- main flow ----------

def replace(event_slug: str, booth_id: str, cover_idx: int,
            dry_run: bool = False, cookies: str | None = None) -> dict:
    booths, prefix, path = load_booths(event_slug)
    booth = next((b for b in booths if b.get('booth_id') == booth_id), None)
    if not booth:
        raise ValueError(f'booth not found: {event_slug}/{booth_id}')
    covers = booth.get('cover_urls') or []
    if cover_idx >= len(covers):
        raise ValueError(f'cover index {cover_idx} out of range (have {len(covers)})')
    cover = covers[cover_idx]
    source_url = cover.get('source_url')
    display_url = cover.get('display_url', '')
    if not source_url or not display_url:
        raise ValueError(f'cover missing source_url / display_url: {cover}')
    r2_key = r2_upload.key_from_cdn_url(display_url)
    if not r2_key:
        raise ValueError(f'display_url is not on the R2 CDN: {display_url}')

    print(f'== {event_slug} / {booth_id} cover[{cover_idx}] ==', file=sys.stderr)
    print(f'  source: {source_url}', file=sys.stderr)
    print(f'  r2 key: {r2_key}', file=sys.stderr)
    print(f'  current display_url: {display_url}', file=sys.stderr)

    print('  fetching new content...', file=sys.stderr)
    local = fetch_image_to_temp(source_url, cookies=cookies)
    content = local.read_bytes()
    new_hash = hashlib.sha256(content).hexdigest()[:8]
    print(f'  fetched {len(content)} bytes, sha8={new_hash}', file=sys.stderr)

    new_display = f'{r2_upload.CDN_BASE}/{r2_key}?v={new_hash}'

    if dry_run:
        print(f'  DRY-RUN: would upload + set display_url to {new_display}', file=sys.stderr)
        return {'changed': True, 'dry_run': True,
                'new_display_url': new_display, 'sha8': new_hash}

    s3 = r2_upload.client()
    r2_upload.upload(s3, local, r2_key)
    print(f'  uploaded to R2', file=sys.stderr)

    cover['display_url'] = new_display
    save_booths(booths, prefix, path)
    print(f'  wrote data.js', file=sys.stderr)
    return {'changed': True, 'dry_run': False,
            'new_display_url': new_display, 'sha8': new_hash}


def main():
    p = argparse.ArgumentParser(description='Re-fetch + re-upload a R2-mirrored cover image with cache-bust')
    grp = p.add_mutually_exclusive_group(required=True)
    grp.add_argument('--display-url', help='Cover display_url (auto-finds event/booth/index)')
    grp.add_argument('--event', help='Event slug (use with --booth and --cover)')
    p.add_argument('--booth', help='Booth ID (e.g. T-23/24)')
    p.add_argument('--cover', type=int, default=0, help='Cover index (default 0)')
    p.add_argument('--dry-run', action='store_true', help='Print plan without uploading or writing data.js')
    p.add_argument('--cookies', default=os.environ.get('FB_COOKIES_NETSCAPE_PATH'),
                   help='FB cookies file (also reads FB_COOKIES_NETSCAPE_PATH)')
    args = p.parse_args()

    if args.display_url:
        event, booth, idx = find_cover_by_display_url(args.display_url)
    else:
        if not args.booth:
            p.error('--booth required when using --event')
        event, booth, idx = args.event, args.booth, args.cover

    result = replace(event, booth, idx, dry_run=args.dry_run, cookies=args.cookies)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
