#!/usr/bin/env python3
"""Lint: catch same-origin asset references that aren't cache-busted.

The cho-tsukuyomi-map site relies on `?v=<timestamp>` query strings on
every same-origin asset URL to invalidate browser + Cloudflare edge
caches on deploy. When a reference slips through without the query
(like `map.jpg` did 2026-06-07), the asset sticks around in caches
indefinitely and end users have to manually clear cache to see updates.

This linter walks the repo and reports HTML / JS / CSS files that
reference a same-origin asset without a `?v=` query (or other obvious
cache-busting hint like a content hash in the filename).

Exit code 1 if any issues are found, 0 if clean — wire into pre-commit
or CI when ready.

Run:
  python3 scripts/check_asset_versions.py
  python3 scripts/check_asset_versions.py --fix    # auto-prefix `?v={{VER}}`
                                                   # in _index_template.html only
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# File-suffix-based extension allowlist of asset types worth versioning.
VERSIONED_SUFFIXES = {
    ".js", ".css", ".json", ".webmanifest",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".mp4", ".webm",
    ".woff", ".woff2", ".ttf", ".otf",
    ".html",  # event sub-pages link to each other (less critical but consistent)
}

# Skip these dirs / glob patterns entirely (scratch / 3rd party / generated).
SKIP_DIRS = {
    ".git", "node_modules", "__pycache__",
    ".x-api-data", ".scrape-data",
    ".name-resolver",
    "openspec",  # spec docs aren't shipped
    ".claude",   # skills + agent config aren't shipped
}

# Reference patterns to scan, paired with the regex that extracts the URL.
HTML_PATTERNS = [
    re.compile(r'\bsrc=["\']([^"\']+)["\']', re.I),
    re.compile(r'\bhref=["\']([^"\']+)["\']', re.I),
    re.compile(r'\bdata-src=["\']([^"\']+)["\']', re.I),
]

JS_PATTERNS = [
    # `m.src = "foo.jpg"` / `.href = "foo"` / loadScript("foo.js") etc.
    re.compile(r"""\.(?:src|href)\s*=\s*['"]([^'"]+)['"]"""),
    re.compile(r"""loadScript\s*\(\s*['"]([^'"]+)['"]"""),
    # `fetch('events.json')` style — many of these are JSON we want versioned too
    re.compile(r"""\bfetch\s*\(\s*['"]([^'"]+)['"]"""),
]

CSS_PATTERNS = [
    re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)"""),
]


def is_same_origin(url: str) -> bool:
    """Return True if the URL is a same-origin asset (relative path or
    same-host absolute path). Excludes external URLs, schemes, anchors,
    template placeholders."""
    if not url:
        return False
    if url.startswith(("http://", "https://", "//", "data:", "blob:",
                       "javascript:", "mailto:", "#", "tel:")):
        return False
    if "{{" in url or "${" in url:  # template / interpolation
        return False
    return True


def needs_versioning(url: str) -> bool:
    """Return True if this same-origin URL is missing a `?v=...` query."""
    # Drop the query string for suffix check.
    path = url.split("?", 1)[0]
    suffix = "." + path.rsplit(".", 1)[-1].lower() if "." in path else ""
    if suffix not in VERSIONED_SUFFIXES:
        return False
    # Already has a ?v=... — good.
    if "?v=" in url or "&v=" in url:
        return False
    # Template placeholder in the query — also good (build_index_html.py
    # will substitute).
    if "?v={{VER}}" in url or "?v=${" in url:
        return False
    # Filename already has a content hash (e.g. `app.abc123.js`) — good.
    # Heuristic: 6+ hex chars between dots before the suffix.
    if re.search(r"\.[0-9a-f]{6,}\.", path):
        return False
    return True


def scan_file(path: Path, patterns: list[re.Pattern]) -> list[tuple[int, str]]:
    """Scan one file, return list of (line_number, url) for offenders."""
    out: list[tuple[int, str]] = []
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return out
    for i, line in enumerate(text.splitlines(), start=1):
        # Skip comment-y lines quickly (still catches real refs in comments,
        # but those are rare false-positives we can ignore).
        for pat in patterns:
            for url in pat.findall(line):
                if not is_same_origin(url):
                    continue
                if not needs_versioning(url):
                    continue
                out.append((i, url))
    return out


def walk_files(root: Path):
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--root", default=str(ROOT))
    p.add_argument("--quiet", action="store_true",
                   help="Only print the offending file:line:url lines, "
                        "skip the summary header")
    args = p.parse_args()

    root = Path(args.root).resolve()
    issues = 0
    by_file: dict[Path, list[tuple[int, str]]] = {}

    for f in walk_files(root):
        if f.suffix.lower() == ".html":
            hits = scan_file(f, HTML_PATTERNS)
        elif f.suffix.lower() == ".js":
            hits = scan_file(f, JS_PATTERNS)
        elif f.suffix.lower() == ".css":
            hits = scan_file(f, CSS_PATTERNS)
        else:
            continue
        if hits:
            by_file[f] = hits
            issues += len(hits)

    if not args.quiet:
        if issues == 0:
            print("✓ all same-origin asset refs are cache-busted")
            return 0
        print(f"✗ {issues} unversioned asset reference(s) "
              f"across {len(by_file)} file(s):\n")
    for f, hits in sorted(by_file.items()):
        rel = f.relative_to(root)
        for line_no, url in hits:
            print(f"{rel}:{line_no}: {url}")
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
