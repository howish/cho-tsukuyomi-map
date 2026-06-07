#!/usr/bin/env python3
"""Health-check all R2-hosted display_urls (images.yachi8000.app) in event data.js.

Walks every event's data.js, collects cover_urls + body image URLs whose host is
images.yachi8000.app, and HEAD-requests each. Reports any non-200 responses.

Run after rebuild (or as a CI/test step) to catch broken R2 mirrors before users
see them.

Causes of breakage:
- R2 file deleted (orphan cleanup, manual purge)
- display_url typo (wrong index, e.g. /1.jpg when only /0.jpg exists)
- Event slug typo / booth_id mismatch in path
- Source post deleted upstream → R2 mirror later removed

Exit codes:
- 0: all R2 URLs return 200
- 1: one or more 404 (or non-200); printed for manual review
"""
from __future__ import annotations

import argparse
import concurrent.futures as futures
import json
import re
import sys
import urllib.request
from pathlib import Path
from urllib.error import HTTPError, URLError


R2_HOST = 'images.yachi8000.app'
R2_URL_RE = re.compile(rf'https?://{re.escape(R2_HOST)}/[^\s)\'"<>]+', re.I)


def collect_r2_urls(root: Path) -> list[tuple[str, str, str]]:
    """Returns list of (event_slug, where, url) tuples — where = 'cover[i]' / 'body'."""
    found: list[tuple[str, str, str]] = []
    import sys as _sys
    _sys.path.insert(0, str(Path(__file__).parent.parent))
    from _events import discover_events
    for ev in discover_events(root):
        ev_dir = ev.dir
        data_js = ev_dir / 'data.js'
        if not data_js.is_file():
            continue
        src = data_js.read_text(encoding='utf-8')
        m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\]);?\s*\Z', src, re.S)
        if not m:
            continue
        try:
            booths = json.loads(m.group(1))
        except Exception:
            continue
        for b in booths:
            bid = b.get('booth_id', '?')
            for i, c in enumerate(b.get('cover_urls') or []):
                du = c.get('display_url', '') or ''
                if R2_HOST in du:
                    found.append((ev_dir.name, f'{bid}.cover[{i}]', du))
            body = b.get('body', '') or ''
            for m2 in R2_URL_RE.finditer(body):
                found.append((ev_dir.name, f'{bid}.body', m2.group(0)))
    return found


UA = 'Mozilla/5.0 (compatible; cho-tsukuyomi-map-r2-checker/1.0)'


def head_url(url: str, timeout: float = 8.0) -> tuple[str, int | None, str | None]:
    """Returns (url, status_code_or_None, error_msg).

    Cloudflare returns 403 for HEAD with default Python-urllib UA — set a
    browser-ish UA. Falls back to GET (Range: 0-0) if HEAD itself is blocked.
    """
    headers = {'User-Agent': UA, 'Accept': '*/*'}
    for method in ('HEAD', 'GET'):
        req = urllib.request.Request(url, method=method, headers=dict(headers))
        if method == 'GET':
            req.add_header('Range', 'bytes=0-0')   # 1-byte fetch is enough
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return (url, resp.status, None)
        except HTTPError as e:
            # 405 / 403 → retry with GET; otherwise return the status
            if method == 'HEAD' and e.code in (403, 405):
                continue
            return (url, e.code, None)
        except URLError as e:
            return (url, None, str(e.reason))
        except Exception as e:
            return (url, None, str(e))
    return (url, None, 'both HEAD and GET failed')


def main() -> int:
    p = argparse.ArgumentParser(description='Check R2-hosted images for 404 / errors')
    p.add_argument('--root', default=str(Path(__file__).parent.parent.parent),
                   help='Project root containing event dirs')
    p.add_argument('--workers', type=int, default=16,
                   help='Parallel HEAD requests (default 16)')
    p.add_argument('--quiet', action='store_true', help='Only print broken URLs')
    args = p.parse_args()

    root = Path(args.root)
    urls = collect_r2_urls(root)
    if not args.quiet:
        print(f'Checking {len(urls)} R2 URLs across {len(set(u[0] for u in urls))} events...')

    # Dedup URLs (same URL may be referenced multiple places) → check once
    by_url: dict[str, list[tuple[str, str]]] = {}
    for ev, where, url in urls:
        by_url.setdefault(url, []).append((ev, where))

    broken = []
    with futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        results = list(ex.map(head_url, by_url.keys()))
    for url, status, err in results:
        if status == 200:
            continue
        for ev, where in by_url[url]:
            broken.append((ev, where, url, status, err))

    if not broken:
        if not args.quiet:
            print(f'✅ All {len(by_url)} R2 URLs return 200.')
        return 0

    print(f'\n❌ {len(broken)} broken R2 URL(s):\n')
    by_ev: dict[str, list] = {}
    for row in broken:
        by_ev.setdefault(row[0], []).append(row)
    for ev, rows in sorted(by_ev.items()):
        print(f'== {ev} ({len(rows)} broken) ==')
        for ev2, where, url, status, err in rows:
            tag = f'HTTP {status}' if status else f'err: {err}'
            print(f'  [{tag:<10}] {where:<25} {url}')
        print()
    return 1


if __name__ == '__main__':
    sys.exit(main())
