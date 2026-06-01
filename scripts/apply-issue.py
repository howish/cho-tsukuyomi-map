#!/usr/bin/env python3
"""apply-issue.py — apply a GitHub Issue [修正案] to a cho-tsukuyomi-map event.

Replaces the ad-hoc "yachiyo manually parses the issue and stitches together
bash + python + boto3 inline" workflow with a structured one-shot pipeline.

Designed against the bug classes discovered during issues #6–#9:

  1. **Identity collapse** — when two cover entries share a source URL (eg
     an FB album with 2 images), the old diff format "display: (auto)"
     erased per-entry identity. The new edit-mode diff emits the actual
     display_url on every line; this parser reads it.
  2. **Locked URL silently ignored** — howish locks specific display_urls
     to pin "this exact image is the right one" but the old parser dropped
     the `display: ... [locked]` lines. This script reads them, downloads
     the external URL (eg cdn.bsky.app, which expires in weeks), re-hosts
     on R2, and preserves display_locked: true in data.js.
  3. **Order-based drop** — when trimming 2 → 1 entries sharing a source,
     keeping by array index hit the wrong one. This script matches by
     display_url identity.
  4. **R2 orphan keys** — drops without R2 delete leave dead keys around.
     This script enumerates orphans from the diff.

Usage:
  scripts/apply-issue.py <issue_number> [--event if7-2026-05] [--dry-run]

  --dry-run prints the plan without touching R2, data.js, or git. Always
  inspect dry-run output before a real apply.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

# Self-locate: <repo>/scripts/apply-issue.py
SCRIPT = Path(__file__).resolve()
REPO = SCRIPT.parent.parent
SKILLS = Path.home() / '.claude' / 'skills'

R2_ENDPOINT = 'https://4662c50948d1cc7d260c159b4d666df7.r2.cloudflarestorage.com'
R2_BUCKET = 'yachi8000-images'
CDN_BASE = 'https://images.yachi8000.app'

# Pattern hints for tagging an entry's display URL
LOCKED = 'locked'
AUTO = 'auto'
PENDING = 'pending'


# ---------- Issue parsing ----------

ENTRY_RE = re.compile(
    r'^(?P<src>https?://\S+)\s*\n'
    r'(?:\s+display:\s+(?P<disp>\S+)\s+\[(?P<tag>locked|auto|pending)\])?',
    re.MULTILINE
)


def parse_block(block: str):
    """Parse a before/after block — yields {source_url, display_url, tag}.
    Tolerant of either the new format (with display: + tag) or the old
    bare-URL format (treated as pending)."""
    out = []
    lines = block.strip().split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line.startswith('http'):
            i += 1
            continue
        src = line
        disp, tag = None, PENDING
        if i + 1 < len(lines):
            m = re.match(r'\s+display:\s+(\(pending\)|\(auto\)|\S+)\s+\[(locked|auto|pending)\]', lines[i + 1])
            if m:
                d = m.group(1)
                tag = m.group(2)
                if d not in ('(pending)', '(auto)'):
                    disp = d
                i += 1
        out.append({'source_url': src, 'display_url': disp, 'tag': tag})
        i += 1
    return out


def parse_issue(text: str):
    """Returns [{booth_id, circle, before:[Entry], after:[Entry]}]."""
    sections = re.split(r'\n## ', text)
    out = []
    for section in sections[1:]:
        first = section.split('\n', 1)[0]
        m = re.match(r'([A-Z]-\d+(?:/\d+)?)\s+(.+)', first)
        if not m:
            continue
        booth_id = m.group(1)
        circle = m.group(2).strip()
        before_m = re.search(r'### images / cover_urls \(before\)\n```\n(.*?)\n```', section, re.S)
        after_m = re.search(r'### images / cover_urls \(after\)\n```\n(.*?)\n```', section, re.S)
        if not before_m and not after_m:
            continue
        out.append({
            'booth_id': booth_id,
            'circle': circle,
            'before': parse_block(before_m.group(1)) if before_m else [],
            'after': parse_block(after_m.group(1)) if after_m else [],
        })
    return out


# ---------- Op classification ----------

def diff_entries(before, after):
    """Identity is (source_url, display_url) — a 2-image album with same
    source still distinguishes via display_url."""
    def key(e):
        return (e['source_url'], e['display_url'])
    before_keys = {key(e): e for e in before}
    after_keys = {key(e): e for e in after}
    dropped = [e for k, e in before_keys.items() if k not in after_keys]
    kept = [e for k, e in before_keys.items() if k in after_keys]
    added = [e for k, e in after_keys.items() if k not in before_keys]
    return dropped, kept, added


# ---------- Platform routing ----------

PLATFORM_RE = [
    ('x_status', re.compile(r'(?:x|twitter)\.com/[^/]+/status/(\d+)')),
    ('x_status_alt', re.compile(r'(?:x|twitter)\.com/i/status/(\d+)')),
    ('threads_post', re.compile(r'threads\.(?:com|net)/@([^/]+)/post/([A-Za-z0-9_-]+)')),
    ('fb_share', re.compile(r'facebook\.com/share/p/([A-Za-z0-9_-]+)')),
    ('fb_post', re.compile(r'facebook\.com/([^/]+)/posts/([\w_]+)')),
    ('plurk_post', re.compile(r'plurk\.com/p/([A-Za-z0-9]+)')),
    ('bsky_post', re.compile(r'bsky\.app/profile/([^/]+)/post/(\w+)')),
]


def classify_url(url: str):
    for name, pat in PLATFORM_RE:
        m = pat.search(url)
        if m:
            return name, m.groups()
    return 'unknown', ()


def r2_path_for(booth_fs: str, source_url: str) -> str:
    """Pick the per-entry R2 prefix based on source URL — matches the
    convention used across earlier batches so the same source URL re-
    populates the same prefix on re-runs (idempotent)."""
    kind, parts = classify_url(source_url)
    if kind == 'fb_share':
        return f'cho-tsukuyomi-map/{EVENT}/booth-images/{booth_fs}/share-{parts[0]}'
    if kind == 'fb_post':
        return f'cho-tsukuyomi-map/{EVENT}/booth-images/{booth_fs}/{parts[0]}-{parts[1][:12]}'
    if kind in ('x_status', 'x_status_alt'):
        return f'cho-tsukuyomi-map/{EVENT}/matome/{booth_fs}/x-{parts[0]}'
    if kind == 'threads_post':
        return f'cho-tsukuyomi-map/{EVENT}/matome/{booth_fs}/threads-{parts[1]}'
    if kind == 'plurk_post':
        return f'cho-tsukuyomi-map/{EVENT}/matome/{booth_fs}/plurk-{parts[0]}'
    if kind == 'bsky_post':
        return f'cho-tsukuyomi-map/{EVENT}/matome/{booth_fs}/bsky-{parts[1]}'
    return f'cho-tsukuyomi-map/{EVENT}/matome/{booth_fs}/misc'


# ---------- Scrapers (delegate to existing skills) ----------

def _natkey(fn):
    nums = re.findall(r'\d+', fn)
    return tuple(int(n) for n in nums) if nums else (0,)


def scrape_x_status(status_ids: list, tmpdir: Path) -> dict:
    """Bulk-fetch via x-api. Returns {status_id: [local_paths]}."""
    if not status_ids:
        return {}
    cmd = [str(SKILLS / 'x-api/bin/run.sh'), 'tweets'] + status_ids
    out = subprocess.run(cmd, capture_output=True, timeout=60)
    try:
        d = json.loads(out.stdout.decode())
    except json.JSONDecodeError:
        return {}
    tweets = d.get('data', [])
    media = {m['media_key']: m for m in d.get('includes', {}).get('media', [])}
    by_id = {}
    for t in tweets:
        keys = (t.get('attachments') or {}).get('media_keys', [])
        local = []
        for i, k in enumerate(keys):
            m = media.get(k, {})
            u = m.get('url') or m.get('preview_image_url')
            if not u:
                continue
            try:
                data = urllib.request.urlopen(
                    urllib.request.Request(u + '?name=orig', headers={'User-Agent': 'Mozilla/5.0'}),
                    timeout=30,
                ).read()
                fn = tmpdir / f'x-{t["id"]}-{i}.jpg'
                fn.write_bytes(data)
                local.append(fn)
            except Exception as e:
                print(f'  [x {t["id"]}-{i}] download fail: {e}', file=sys.stderr)
        by_id[str(t['id'])] = local
    return by_id


def scrape_threads_post(handle: str, code: str, tmpdir: Path, cookies: Path):
    args = [str(SKILLS / 'threads-scraper/bin/run.sh'),
            f'https://www.threads.com/@{handle}/post/{code}',
            '-o', str(tmpdir), '--download-images', '--timeout', '25']
    if cookies and cookies.exists():
        args += ['--cookies', str(cookies)]
    subprocess.run(args, capture_output=True, timeout=90)
    dir_ = tmpdir / f'threads_{code}'
    if not dir_.exists():
        return []
    files = sorted([f for f in dir_.iterdir() if f.name.startswith('img_main_')], key=lambda p: _natkey(p.name))
    return files


def scrape_plurk_post(code: str, tmpdir: Path):
    """Try og:image first (fast stdlib), fall back to Playwright DOM walk
    if og only gives 1 image (the per-post body often has more)."""
    # Stdlib path
    out = subprocess.run(
        [str(SKILLS / 'plurk-scraper/bin/run.sh'),
         f'https://www.plurk.com/p/{code}', '--json-only', '--timeout', '20'],
        capture_output=True, timeout=45,
    )
    try:
        d = json.loads(out.stdout.decode())
    except Exception:
        d = {}
    img_urls = d.get('all_images') or ([d['main_image']] if d.get('main_image') else [])
    if len(img_urls) <= 1:
        # Playwright fallback — DOM walk for body images.
        # We don't import playwright here (system python lacks it);
        # we shell out to the playwright-runtime python below.
        helper = tmpdir / 'plurk_walk.py'
        helper.write_text(f'''
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(user_agent="Mozilla/5.0 Chrome/131", viewport={{"width":1280,"height":900}})
    page = ctx.new_page()
    page.goto("https://www.plurk.com/p/{code}", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(2500)
    imgs = page.evaluate("""() => {{
        const out = new Set();
        document.querySelectorAll('img').forEach(img => {{
            const s = img.src || '';
            if (/images\\.plurk\\.com/.test(s) && !/\\/mx_/.test(s)) out.add(s);
        }});
        return [...out];
    }}""")
    import sys, json; print(json.dumps(imgs))
    b.close()
''')
        try:
            o = subprocess.run([str(SKILLS / 'playwright-runtime/bin/python'), str(helper)],
                              capture_output=True, timeout=60)
            walked = json.loads(o.stdout.decode())
            if len(walked) > len(img_urls):
                img_urls = walked
        except Exception as e:
            print(f'  [plurk {code}] DOM walk fail: {e}', file=sys.stderr)

    local = []
    for i, u in enumerate(img_urls):
        try:
            data = urllib.request.urlopen(
                urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30
            ).read()
            fn = tmpdir / f'plurk-{code}-{i}.jpg'
            fn.write_bytes(data)
            local.append(fn)
        except Exception as e:
            print(f'  [plurk {code}-{i}] download fail: {e}', file=sys.stderr)
    return local


def scrape_fb_share(code: str, tmpdir: Path, cookies: Path):
    """FB share posts via fb_album_walk3 (canonical path).

    Calls ~/.claude/skills/fb-scraper/scripts/fb_album_walk3.py which:
      - Navigates share/p/<code> → captures redirect to story.php?story_fbid=N
      - Finds the pcb.<story_fbid> anchor and clicks (the canonical multi-image
        carousel marker) — this guarantees we open THIS post's viewer, not
        a sidebar/related-post image
      - ArrowRight walks, dedupes by photo_id from t39 URLs

    If no pcb anchor (single-image post), returns empty → caller falls back
    to og:image (or, in practice, gets display_url=None for caller to fill).

    Returns list of local file paths (full-res, in album order).
    """
    walker = SKILLS / 'fb-scraper/scripts/fb_album_walk3.py'
    share_url = f'https://www.facebook.com/share/p/{code}/'
    o = subprocess.run(
        [str(SKILLS / 'playwright-runtime/bin/python'), str(walker), share_url, str(cookies)],
        capture_output=True, timeout=180,
    )
    try:
        d = json.loads(o.stdout.decode())
    except Exception as e:
        print(f'  [fb share {code}] walk parse fail: {e}', file=sys.stderr)
        return []
    urls = d.get('photos', []) or []
    # Single-image posts have no pcb anchor → walker returns empty.
    # Fall back to og:image fetched via the FB crawler UA (anon-accessible
    # because FB itself needs to serve previews to external link unfurlers).
    if not urls:
        try:
            html = urllib.request.urlopen(
                urllib.request.Request(share_url, headers={'User-Agent': 'facebookexternalhit/1.1'}),
                timeout=20,
            ).read().decode('utf-8', errors='ignore')
            m = re.search(r'property="og:image"\s+content="([^"]+)"', html)
            if m:
                og = m.group(1).replace('&amp;', '&')
                urls = [og]
                print(f'  [fb share {code}] no album, using og:image fallback', file=sys.stderr)
        except Exception as e:
            print(f'  [fb share {code}] og:image fallback fail: {e}', file=sys.stderr)
    files = []
    out_dir = tmpdir / f'fb-{code}'
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, u in enumerate(urls):
        try:
            data = urllib.request.urlopen(
                urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30
            ).read()
            fn = out_dir / f'{i}.jpg'
            fn.write_bytes(data)
            files.append(fn)
        except Exception as e:
            print(f'  [fb share {code}-{i}] download fail: {e}', file=sys.stderr)
    return files


def scrape_bsky_post(handle: str, code: str, tmpdir: Path):
    helper = tmpdir / f'bsky_{code}.py'
    helper.write_text(f'''
from playwright.sync_api import sync_playwright
import urllib.request, json, os
out_dir = r"{tmpdir}/bsky-{code}"
os.makedirs(out_dir, exist_ok=True)
files = []
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True)
    ctx = b.new_context(user_agent="Mozilla/5.0 Chrome/131", viewport={{"width":1280,"height":900}})
    page = ctx.new_page()
    page.goto("https://bsky.app/profile/{handle}/post/{code}", wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(3000)
    imgs = page.evaluate(r"""() => {{
        const out = [];
        document.querySelectorAll('img').forEach(img => {{
            const s = img.src || '';
            if (!/cdn\\.bsky\\.app.*\\/img\\/feed_(fullsize|thumbnail)/.test(s)) return;
            const w = img.naturalWidth || img.width || 0, h = img.naturalHeight || img.height || 0;
            if (w * h < 250000) return;
            out.push({{u: s.replace('/feed_thumbnail/', '/feed_fullsize/'), w, h}});
        }});
        out.sort((a,b) => (b.w*b.h)-(a.w*a.h));
        const seen = new Set();
        return out.filter(x => {{ if (seen.has(x.u)) return false; seen.add(x.u); return true; }});
    }}""")
    for i, im in enumerate(imgs):
        try:
            d = urllib.request.urlopen(urllib.request.Request(im['u'], headers={{'User-Agent':'Mozilla/5.0'}}), timeout=25).read()
            fn = f"{{out_dir}}/{{i}}.jpg"; open(fn,"wb").write(d); files.append(fn)
        except Exception: pass
    b.close()
print(json.dumps(files))
''')
    o = subprocess.run([str(SKILLS / 'playwright-runtime/bin/python'), str(helper)],
                       capture_output=True, timeout=90)
    try:
        return [Path(p) for p in json.loads(o.stdout.decode())]
    except Exception:
        return []


def download_external(url: str, tmpdir: Path, hint: str = 'img') -> Path | None:
    """Direct download of an external CDN URL (used for locked-display
    URLs that already point at the right image)."""
    try:
        data = urllib.request.urlopen(
            urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30
        ).read()
        # Use a stable hash from URL so re-runs land on the same R2 key
        import hashlib
        h = hashlib.sha1(url.encode()).hexdigest()[:12]
        fn = tmpdir / f'{hint}-{h}.jpg'
        fn.write_bytes(data)
        return fn
    except Exception as e:
        print(f'  [external] download fail {url[:60]}: {e}', file=sys.stderr)
        return None


# ---------- R2 client ----------

def r2_client():
    import boto3
    from botocore.client import Config
    # Lazily load credentials from ~/.bashrc — same convention as the
    # existing fb-cookies / x-api flow.
    if not os.environ.get('R2_ACCESS_KEY_ID'):
        bashrc = Path.home() / '.bashrc'
        if bashrc.exists():
            for line in bashrc.read_text().splitlines():
                m = re.match(r'export (R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY)="([^"]+)"', line)
                if m:
                    os.environ[m.group(1)] = m.group(2)
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4'),
        region_name='auto',
    )


def r2_upload(s3, local: Path, key: str):
    ct = 'image/webp' if local.suffix == '.webp' else 'image/jpeg'
    s3.upload_file(str(local), R2_BUCKET, key,
                   ExtraArgs={'ContentType': ct, 'CacheControl': 'public, max-age=31536000, immutable'})
    return f'{CDN_BASE}/{key}'


def r2_delete_key(s3, key: str):
    try:
        s3.delete_object(Bucket=R2_BUCKET, Key=key)
        return True
    except Exception:
        return False


# ---------- Main orchestrator ----------

EVENT = 'if7-2026-05'  # set per --event flag


def main():
    global EVENT
    ap = argparse.ArgumentParser(description='Apply a [修正案] issue to cho-tsukuyomi-map')
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument('issue_number', type=int, nargs='?',
                     help='GitHub issue number (omit when using --file)')
    src.add_argument('--file', type=str,
                     help='Apply from a local .md file (download path from edit mode)')
    ap.add_argument('--event', default='if7-2026-05')
    ap.add_argument('--dry-run', action='store_true', help='Print the plan, no R2/data.js/git mutations')
    # Cookies: env var first (FB_COOKIES_NETSCAPE_PATH / THREADS_COOKIES_NETSCAPE_PATH),
    # then legacy ~/project/{fb,threads}-cookies.txt fallback for back-compat.
    ap.add_argument('--fb-cookies', default=(
        os.environ.get('FB_COOKIES_NETSCAPE_PATH')
        or str(Path.home() / 'project' / 'fb-cookies.txt')))
    ap.add_argument('--threads-cookies', default=(
        os.environ.get('THREADS_COOKIES_NETSCAPE_PATH')
        or str(Path.home() / 'project' / 'threads-cookies.txt')))
    args = ap.parse_args()
    EVENT = args.event

    fb_cookies = Path(args.fb_cookies) if Path(args.fb_cookies).exists() else None
    threads_cookies = Path(args.threads_cookies) if Path(args.threads_cookies).exists() else None

    repo_str = str(REPO)
    if args.file:
        fp = Path(args.file).expanduser().resolve()
        if not fp.exists():
            print(f'!! file not found: {fp}'); sys.exit(2)
        issue_text = fp.read_text()
        src_label = f'file:{fp.name}'
    else:
        issue_text = subprocess.check_output(
            ['gh', 'issue', 'view', str(args.issue_number), '--repo', 'howish/cho-tsukuyomi-map'],
            cwd=repo_str,
        ).decode()
        src_label = f'Issue #{args.issue_number}'
    sections = parse_issue(issue_text)
    print(f'\n=== {src_label}: {len(sections)} booth ops ===\n')

    data_path = REPO / args.event / 'data.js'
    raw = data_path.read_text()
    a = raw.index('['); z = raw.rindex(']')
    arr = json.loads(raw[a:z + 1])
    booths_by_id = {b['booth_id']: b for b in arr}

    tmpdir = Path(tempfile.mkdtemp(prefix='apply-issue-'))
    print(f'  scratch dir: {tmpdir}\n')

    s3 = None
    if not args.dry_run:
        s3 = r2_client()

    plan = []
    for sec in sections:
        b = booths_by_id.get(sec['booth_id'])
        if not b:
            print(f'  ⚠ {sec["booth_id"]} not in data.js, skip')
            continue
        booth_fs = sec['booth_id'].replace('/', '_')
        dropped, kept, added = diff_entries(sec['before'], sec['after'])
        plan.append({'booth': sec['booth_id'], 'circle': sec['circle'],
                     'dropped': dropped, 'kept': kept, 'added': added,
                     'after': sec['after'],
                     'booth_fs': booth_fs})

        print(f'  {sec["booth_id"]} ({sec["circle"]})')
        print(f'    before {len(sec["before"])} → after {len(sec["after"])}  (drop {len(dropped)}, keep {len(kept)}, add {len(added)})')
        for e in added:
            print(f'    + {e["source_url"][:60]:<60s} [{e["tag"]}]'
                  + (f' disp={e["display_url"][:50]}...' if e['display_url'] else ''))
        for e in dropped:
            print(f'    - {e["source_url"][:60]:<60s} disp={(e["display_url"] or "")[-40:]}')

    if args.dry_run:
        print(f'\n=== DRY RUN — no changes applied ===\n')
        return

    print(f'\n=== Executing ===\n')

    # Group X status URLs across booths for a single bulk x-api call
    x_status_to_fetch = set()
    for op in plan:
        for e in op['added']:
            kind, parts = classify_url(e['source_url'])
            if kind in ('x_status', 'x_status_alt') and e['tag'] in (PENDING, AUTO) and not (e['display_url'] and 'images.yachi8000.app' in e['display_url']):
                x_status_to_fetch.add(parts[0])
    x_files = scrape_x_status(list(x_status_to_fetch), tmpdir) if x_status_to_fetch else {}

    for op in plan:
        b = booths_by_id[op['booth']]
        booth_fs = op['booth_fs']

        # Drop R2 keys for dropped entries that point at our CDN
        for e in op['dropped']:
            d = e['display_url']
            if d and CDN_BASE in d:
                key = d.replace(CDN_BASE + '/', '')
                if r2_delete_key(s3, key):
                    print(f'  - r2 delete {key}')

        new_cover_urls = []

        # Walk after-list in order so user-specified order is preserved.
        # For each entry: if it's "kept" (was in before too) carry verbatim;
        # else it's an "add" — scrape source, emit at this position.
        kept_keys = {(e['source_url'], e['display_url']) for e in op['kept']}

        for e in op['after']:
            ekey = (e['source_url'], e['display_url'])
            if ekey in kept_keys:
                # Carry kept entry verbatim
                new_cover_urls.append({
                    'source_url': e['source_url'],
                    'display_url': e['display_url'],
                    'display_locked': e['tag'] == LOCKED,
                })
                continue
            # Treat as added at this position
            src = e['source_url']
            display = e['display_url']
            tag = e['tag']

            # Case A: locked display URL already pointing at our CDN → carry verbatim
            if tag == LOCKED and display and CDN_BASE in display:
                new_cover_urls.append({'source_url': src, 'display_url': display, 'display_locked': True})
                continue

            # Case B: locked external URL (eg cdn.bsky.app, scontent...) → download + rehost on R2
            if tag == LOCKED and display:
                local = download_external(display, tmpdir, hint=booth_fs)
                if not local:
                    print(f'  ⚠ {op["booth"]}: locked URL fetch failed; appending as display=None')
                    new_cover_urls.append({'source_url': src, 'display_url': None, 'display_locked': True})
                    continue
                prefix = r2_path_for(booth_fs, src) + '/locked'
                # Use the SHA1-prefixed filename as the R2 key index so re-runs are idempotent
                key = f'{prefix}/{local.name}'
                url = r2_upload(s3, local, key)
                print(f'  + r2 upload locked {key}')
                new_cover_urls.append({'source_url': src, 'display_url': url, 'display_locked': True})
                continue

            # Case C: auto/pending — scrape source URL, upload all images
            kind, parts = classify_url(src)
            local_files = []
            if kind in ('x_status', 'x_status_alt'):
                local_files = x_files.get(parts[0], [])
            elif kind == 'threads_post':
                local_files = scrape_threads_post(parts[0], parts[1], tmpdir, threads_cookies)
            elif kind == 'fb_share':
                local_files = scrape_fb_share(parts[0], tmpdir, fb_cookies)
            elif kind == 'plurk_post':
                local_files = scrape_plurk_post(parts[0], tmpdir)
            elif kind == 'bsky_post':
                local_files = scrape_bsky_post(parts[0], parts[1], tmpdir)
            else:
                print(f'  ⚠ {op["booth"]}: unknown source {src[:60]} — emitting display=None')
                new_cover_urls.append({'source_url': src, 'display_url': None, 'display_locked': False})
                continue

            if not local_files:
                print(f'  ⚠ {op["booth"]}: {kind} scrape returned 0 files; emitting display=None')
                new_cover_urls.append({'source_url': src, 'display_url': None, 'display_locked': False})
                continue

            prefix = r2_path_for(booth_fs, src)
            for i, f in enumerate(local_files):
                ext = f.suffix or '.jpg'
                key = f'{prefix}/{i}{ext}'
                url = r2_upload(s3, f, key)
                new_cover_urls.append({'source_url': src, 'display_url': url, 'display_locked': False})
            print(f'  + {op["booth"]}: {kind} added {len(local_files)} via {prefix}')

        b['cover_urls'] = new_cover_urls
        print(f'  = {op["booth"]}: cover_urls = {len(new_cover_urls)}')

    data_path.write_text(raw[:a] + json.dumps(arr, ensure_ascii=False, indent=2) + raw[z + 1:])

    # Bump cache-bust in index.html
    index_path = REPO / args.event / 'index.html'
    if index_path.exists():
        import time
        new_ts = str(int(time.time()))
        idx = index_path.read_text()
        idx = re.sub(r'v=\d{10}', f'v={new_ts}', idx)
        index_path.write_text(idx)

    # Commit + push
    subprocess.run(['git', 'add', f'{args.event}/data.js', f'{args.event}/index.html'],
                   cwd=repo_str, check=True)
    if args.file:
        header = f'Apply edit-mode fix file ({Path(args.file).name}) via scripts/apply-issue.py'
        footer = ''
    else:
        header = f'Apply Issue #{args.issue_number} via scripts/apply-issue.py'
        footer = f'Closes #{args.issue_number}.\n\n'
    msg = f'''{header}

{len(plan)} booth op(s) processed automatically. Per-entry identity via
display_url; locked external URLs re-hosted on R2 with display_locked
preserved; dropped entries' R2 keys deleted.

{footer}Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'''
    subprocess.run(['git', 'commit', '-m', msg], cwd=repo_str, check=True)
    subprocess.run(['git', 'push'], cwd=repo_str, check=True)
    if args.file:
        print(f'\n✓ pushed. ({src_label})')
    else:
        print(f'\n✓ pushed. issue #{args.issue_number} auto-closes via commit message.')


if __name__ == '__main__':
    main()
