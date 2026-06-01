#!/usr/bin/env python3
"""process_canon_urls.py — Path B pipeline: take a booth_id + list of canon
FB share/p/ URLs (howish-curated), walk each album, upload images to R2,
emit a draft body + cover_urls JSON for one-pass apply.

Usage:
  process_canon_urls.py <BOOTH_ID> <URL1> <URL2> ... [--cookies <path>] [--out <path>]

What it does for each URL:
  1. Scrape post text (anon HTTP — works for share/p/ via og:tags).
  2. Walk album via fb_album_walk3 (cookies + photo viewer ArrowRight).
  3. Download every photo, upload to R2 under
     booth-images/<BOOTH>/share-<slug>/<i>.jpg.
  4. Extract a title guess from text (『X』 / 《X》 / 新刊:X patterns).

Output JSON: { booth_id, posts[], draft_body, draft_cover_urls[] } —
ヤチヨ reviews + writes the final body manually using the data.

Skips profile-scroll discovery entirely; URL list is the input.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, os.path.expanduser('~/.claude/skills/fb-scraper/scripts'))
sys.path.insert(0, str(Path(__file__).parent))

import r2_upload   # local module — handles boto3 + creds + key URL helpers

WALKER_PATH = os.path.expanduser('~/.claude/skills/fb-scraper/scripts/fb_album_walk3.py')
PYRUN = os.path.expanduser('~/.claude/skills/playwright-runtime/bin/python')


def r2_client():
    return r2_upload.client()


def slug_from_share_url(url: str) -> str:
    m = re.search(r'/share/p/([A-Za-z0-9]+)', url)
    if m: return m.group(1)
    m = re.search(r'/posts/(pfbid[A-Za-z0-9]+)', url)
    if m: return m.group(1)
    import hashlib
    return 'url-' + hashlib.sha1(url.encode()).hexdigest()[:10]


def fetch_post_meta(url: str) -> dict:
    """Anon HTTP fetch + og:description / og:image parse.

    Returns {text, image_url} — both fields may be empty strings.
    og:image is the post's cover (or only) image; used as walker fallback.
    """
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; facebookexternalhit/1.1)',
        })
        html = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', 'ignore')
    except Exception as e:
        print(f'  [meta fetch fail] {url}: {e}', file=sys.stderr)
        return {'text': '', 'image_url': ''}

    def _unescape(s: str) -> str:
        s = s.replace('&amp;', '&').replace('&quot;', '"')
        s = re.sub(r'&#x([0-9A-Fa-f]+);', lambda m: chr(int(m.group(1), 16)), s)
        s = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), s)
        return s

    text = ''
    m = re.search(r'<meta[^>]+property="og:description"[^>]+content="([^"]*)"', html)
    if m: text = _unescape(m.group(1))

    image_url = ''
    m = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]*)"', html)
    if m: image_url = _unescape(m.group(1))

    return {'text': text, 'image_url': image_url}


def fetch_post_text(url: str) -> str:
    return fetch_post_meta(url)['text']


def extract_title_guess(text: str) -> str | None:
    m = re.search(r'[『「]([^』」\n]{1,40})[』」]', text)
    if m: return m.group(1)
    m = re.search(r'[《〈]([^》〉\n]{1,40})[》〉]', text)
    if m: return m.group(1)
    m = re.search(r'新刊[:：\s]+([^\s\n]{1,40})', text)
    if m: return m.group(1)
    return None


def walk_album(url: str, cookies: str) -> list[str]:
    try:
        r = subprocess.run(
            [PYRUN, WALKER_PATH, url, cookies],
            capture_output=True, text=True, timeout=180,
        )
        out = r.stdout.strip()
        json_start = out.find('{')
        if json_start < 0: return []
        j = json.loads(out[json_start:])
        return j.get('photos') or []
    except Exception as e:
        print(f'  [walker fail] {url}: {e}', file=sys.stderr)
        return []


def upload(s3, photos: list[str], booth_fs: str, slug: str) -> list[str]:
    out = []
    for i, url in enumerate(photos):
        key = f'cho-tsukuyomi-map/if7-2026-05/booth-images/{booth_fs}/share-{slug}/{i}.jpg'
        try:
            data = urllib.request.urlopen(
                urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}),
                timeout=30,
            ).read()
        except Exception as e:
            print(f'  [dl fail] {slug}/{i}: {e}', file=sys.stderr)
            continue
        tmp = Path(f'/tmp/canon-{booth_fs}-{slug}-{i}.jpg')
        tmp.write_bytes(data)
        cdn_url = r2_upload.upload(s3, tmp, key)
        out.append(cdn_url)
        print(f'  ✓ {slug}/{i}.jpg ({len(data)//1024}KB)', file=sys.stderr)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('booth_id')
    ap.add_argument('urls', nargs='+')
    # Env var first; legacy path fallback (Phase E cleanup 2026-06-01).
    ap.add_argument('--cookies', default=(
        os.environ.get('FB_COOKIES_NETSCAPE_PATH')
        or os.path.expanduser('~/project/fb-cookies.txt')))
    ap.add_argument('--out', default=None)
    args = ap.parse_args()
    booth_fs = args.booth_id.replace('/', '_')

    s3 = r2_client()
    posts = []
    for url in args.urls:
        slug = slug_from_share_url(url)
        print(f'\n== processing {slug} ({url[:60]}) ==', file=sys.stderr)
        meta = fetch_post_meta(url)
        text = meta['text']
        og_image = meta['image_url']
        title = extract_title_guess(text)
        print(f'  text snippet: {text[:120]}', file=sys.stderr)
        print(f'  title_guess: {title}', file=sys.stderr)
        photos = walk_album(url, args.cookies)
        source = 'pcb-walker'
        if not photos and og_image:
            photos = [og_image]
            source = 'og:image'
        print(f'  photos: {len(photos)} (via {source})', file=sys.stderr)
        cdn_urls = upload(s3, photos, booth_fs, slug)
        posts.append({
            'slug': slug,
            'source_url': url,
            'text': text[:1500],
            'title_guess': title,
            'image_source': source,
            'image_count': len(photos),
            'cdn_urls': cdn_urls,
        })

    # Draft body — ヤチヨ to refine
    lines = ['## 📝 CH19 出展重點']
    lines.append(f'{args.booth_id} 出展 ／ {len(posts)} 本新刊 (時間順):')
    for p in posts:
        title = p.get('title_guess') or '(title TBD — verify cover)'
        lines.append(f'- **『{title}』** (TODO: format)')
    if posts:
        lines.append('- 出處 (時間順): ' + ' / '.join(
            f'[{p.get("title_guess") or p["slug"]}]({p["source_url"]})' for p in posts
        ))
    draft_body = '\n'.join(lines)

    out = {
        'booth_id': args.booth_id,
        'posts': posts,
        'draft_body': draft_body,
        'draft_cover_urls': [
            {'source_url': p['source_url'], 'display_url': u, 'display_locked': False}
            for p in posts for u in p.get('cdn_urls', [])
        ],
        'cover_count': sum(len(p.get('cdn_urls', [])) for p in posts),
    }
    out_path = args.out or f'/tmp/canon-{booth_fs}.json'
    Path(out_path).write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f'\nwrote {out_path}', file=sys.stderr)
    print(f'== summary: {len(posts)} posts, {out["cover_count"]} covers ==', file=sys.stderr)


if __name__ == '__main__':
    main()
