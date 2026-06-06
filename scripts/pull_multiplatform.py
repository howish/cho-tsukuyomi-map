#!/usr/bin/env python3
"""Per-platform booth scraper orchestrator (Plurk / Threads / doujin.com.tw).

Walks an event's booth roster, resolves the primary author's profile URL
per platform via circles.json, and dispatches the appropriate scraper skill
to fetch the public profile feed. Saves the scraper's JSON output to
`.x-api-data-<slug>/<platform>/<booth_id_sanitized>-<handle>.json`.

Mirror-skill-style incremental fetch is NOT supported here — these
scrapers don't track since/start_time. Each run does a full per-booth
profile scrape. The mirror SSOT today is X-only.

Internal parallelism: ThreadPoolExecutor with configurable workers
(default 5) — runs N booth scrapes concurrently per platform.

Usage:
  pull_multiplatform.py <event_slug> --platform plurk
  pull_multiplatform.py <event_slug> --platform threads --workers 3
  pull_multiplatform.py <event_slug> --platform doujin_tw
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SCRAPER_BIN = {
    "plurk":     Path.home() / ".claude" / "skills" / "plurk-scraper" / "bin" / "run.sh",
    "threads":   Path.home() / ".claude" / "skills" / "threads-scraper" / "bin" / "run.sh",
    "doujin_tw": Path.home() / ".claude" / "skills" / "doujin-tw-scraper" / "bin" / "run.sh",
}

# Per-platform timeout for a single scrape (seconds).
PLATFORM_TIMEOUT = {
    "plurk":     90,
    "threads":   90,
    "doujin_tw": 60,
}


def load_booths(data_js_path: Path) -> list[dict]:
    raw = data_js_path.read_text(encoding="utf-8")
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$', raw, re.S)
    assert m, f"unexpected data.js shape — no window.BOOTHS = [...] found"
    return json.loads(m.group(1))


def sanitize(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", s)


def resolve_targets(root: Path, slug: str, platform: str) -> list[tuple[str, str]]:
    """Return (booth_id, profile_url) for every booth with a primary
    author handle on the requested platform.
    """
    booths = load_booths(root / slug / "data.js")
    circles = json.loads((root / "circles.json").read_text(encoding="utf-8"))
    authors_by_id = {a["id"]: a for a in circles.get("authors", [])}
    circles_by_id = {c["id"]: c for c in circles.get("circles", [])}

    targets: list[tuple[str, str]] = []
    for b in booths:
        cid = b.get("circle_id")
        if not cid:
            continue
        c = circles_by_id.get(cid)
        if not c:
            continue
        members = c.get("members") or []
        if not members:
            continue
        primary = authors_by_id.get(members[0])
        if not primary:
            continue
        for s in primary.get("socials") or []:
            if s.get("platform") == platform and s.get("url"):
                targets.append((b["booth_id"], s["url"]))
                break
    return targets


def scrape_one(platform: str, booth_id: str, url: str,
               out_dir: Path) -> dict:
    """Invoke the scraper for one booth. Returns a result dict."""
    bin_path = SCRAPER_BIN[platform]
    timeout = PLATFORM_TIMEOUT[platform]
    # Derive a stable handle slug from the URL for the output filename.
    handle = sanitize(url.rsplit("/", 1)[-1] or "unknown")[:40]
    outfile = out_dir / f"{sanitize(booth_id)}-{handle}.json"

    cmd = [str(bin_path), url, "--json-only"]
    try:
        proc = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return {"booth": booth_id, "url": url, "skipped": True,
                "reason": f"timeout ({timeout}s)"}
    if proc.returncode != 0:
        return {"booth": booth_id, "url": url, "skipped": True,
                "reason": f"scraper exit {proc.returncode}: "
                          f"{proc.stderr.strip()[:200]}"}
    if not proc.stdout.strip():
        return {"booth": booth_id, "url": url, "skipped": True,
                "reason": "empty stdout"}
    try:
        outfile.write_text(proc.stdout, encoding="utf-8")
    except OSError as e:
        return {"booth": booth_id, "url": url, "skipped": True,
                "reason": f"write failed: {e}"}
    return {"booth": booth_id, "url": url, "skipped": False,
            "outfile": str(outfile.relative_to(ROOT)),
            "stdout_bytes": len(proc.stdout)}


def main():
    p = argparse.ArgumentParser(
        description="Per-platform booth scraper orchestrator")
    p.add_argument("event_slug")
    p.add_argument("--platform", required=True,
                   choices=list(SCRAPER_BIN.keys()))
    p.add_argument("--workers", type=int, default=5,
                   help="Concurrent scrapes per platform (default 5)")
    p.add_argument("--root", default=str(ROOT))
    p.add_argument("--limit", type=int, default=None,
                   help="Only process first N booths (debug)")
    p.add_argument("--skip-existing", action="store_true",
                   help="Skip booths whose output file already exists")
    args = p.parse_args()

    root = Path(os.path.expanduser(args.root))
    slug = args.event_slug
    platform = args.platform

    targets = resolve_targets(root, slug, platform)
    if args.limit:
        targets = targets[: args.limit]
    out_dir = root / f".x-api-data-{slug}" / platform
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.skip_existing:
        keep = []
        for booth_id, url in targets:
            handle = sanitize(url.rsplit("/", 1)[-1] or "unknown")[:40]
            outfile = out_dir / f"{sanitize(booth_id)}-{handle}.json"
            if not outfile.is_file():
                keep.append((booth_id, url))
        skipped_existing = len(targets) - len(keep)
        targets = keep
        if skipped_existing:
            print(f"  skip-existing: skipped {skipped_existing}",
                  file=sys.stderr)

    print(f"[{platform}] {len(targets)} booth(s) to scrape (workers={args.workers})",
          file=sys.stderr)

    start = time.time()
    pulled = skipped = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {
            ex.submit(scrape_one, platform, booth_id, url, out_dir):
                (i, booth_id, url)
            for i, (booth_id, url) in enumerate(targets, 1)
        }
        for fut in concurrent.futures.as_completed(futures):
            i, booth_id, url = futures[fut]
            try:
                result = fut.result()
            except Exception as e:
                print(f"  [{i}/{len(targets)}] {booth_id} EXC: {e}",
                      file=sys.stderr)
                skipped += 1
                continue
            if result.get("skipped"):
                print(f"  [{i}/{len(targets)}] {booth_id} SKIP "
                      f"({result.get('reason', '?')[:80]})",
                      file=sys.stderr)
                skipped += 1
                continue
            pulled += 1
            print(f"  [{i}/{len(targets)}] {booth_id} ok "
                  f"({result['stdout_bytes']} bytes)", file=sys.stderr)

    elapsed = time.time() - start
    print(f"\n[{platform}] DONE pulled={pulled} skipped={skipped} "
          f"in {elapsed:.1f}s ({out_dir.relative_to(ROOT)})", file=sys.stderr)


if __name__ == "__main__":
    main()
