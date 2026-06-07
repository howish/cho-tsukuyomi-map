#!/usr/bin/env python3
"""filter-system classify-prep — emit per-booth signal bundle JSON for
parallel-dispatched classification agents.

Per openspec change formalize-filter-system, Group 6.

Walks an event's booths, gathers existing body + tags + warnings +
signals (X mirror buckets via post-mirror query body), pairs with
the merged filters vocabulary, splits into chunks. Each chunk JSON
is the input to one dispatched classify agent.

The agent reads `<skill>/CLASSIFY_PROMPT.md` for the rules, produces
a `{booth_id: {tags, warnings}}` proposal, writes to /tmp/<event>-
classify-chunk-<n>.json. Then `apply-classify` writes patches to
data.js.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _filter_lib as fl  # noqa: E402


POST_MIRROR_RUN = (
    fl.PROJECT_ROOT / ".claude" / "skills" / "post-mirror" / "bin" / "run.sh"
)


def _x_buckets_for(handle: str) -> dict | None:
    """Call post-mirror's `query body` for the handle, return buckets
    dict or None on missing/error."""
    if not POST_MIRROR_RUN.is_file():
        return None
    try:
        proc = subprocess.run(
            [str(POST_MIRROR_RUN), "query", "body", "--username", handle,
             "--limit", "8"],
            capture_output=True, text=True, timeout=30,
        )
    except subprocess.TimeoutExpired:
        return None
    if proc.returncode != 0:
        return None
    try:
        return json.loads(proc.stdout).get("buckets")
    except json.JSONDecodeError:
        return None


def _resolve_x_handle(slug: str, booth_id: str) -> str | None:
    """Read circles.json to find the booth's primary X handle."""
    circles_path = fl.PROJECT_ROOT / "circles.json"
    if not circles_path.is_file():
        return None
    circles = json.loads(circles_path.read_text(encoding="utf-8"))
    authors_by_id = {a["id"]: a for a in circles.get("authors", [])}
    circles_by_id = {c["id"]: c for c in circles.get("circles", [])}
    data_js = fl.PROJECT_ROOT / slug / "data.js"
    raw = data_js.read_text(encoding="utf-8")
    m = re.search(r"window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$", raw, re.S)
    if not m:
        return None
    booths = json.loads(m.group(1))
    for b in booths:
        if b.get("booth_id") != booth_id:
            continue
        cid = b.get("circle_id")
        if not cid:
            return None
        c = circles_by_id.get(cid)
        members = (c or {}).get("members") or []
        if not members:
            return None
        primary = authors_by_id.get(members[0])
        if not primary:
            return None
        for s in primary.get("socials") or []:
            if s.get("platform") == "x" and s.get("url"):
                m2 = re.search(
                    r"(?:x|twitter)\.com/@?([A-Za-z0-9_]{1,15})",
                    s["url"],
                )
                if m2:
                    return m2.group(1)
        return None
    return None


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("event")
    p.add_argument("--chunks", type=int, default=4,
                   help="Split into roughly N chunks (default 4)")
    p.add_argument("--out-dir", default=None,
                   help="Output dir (default: <event>/.classify-input/)")
    args = p.parse_args()

    slug = args.event
    out_dir = (Path(args.out_dir) if args.out_dir
               else fl.PROJECT_ROOT / slug / ".classify-input")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Wipe stale chunk files (best-effort) so we don't re-feed agents
    # outdated input bundles.
    for old in out_dir.glob("chunk-*.json"):
        old.unlink()

    booths = fl.load_event_booths(slug)
    filters = fl.load_event_filters(slug, include_base=True)
    vocab = {
        axis: [
            {"code": e.code, "label": e.label, "icon": e.icon,
             "title": e.title}
            for e in filters.get(axis, [])
        ]
        for axis in ("cps", "tags", "works", "warnings", "mediums", "areas")
    }

    bundles = []
    for b in booths:
        bid = b["booth_id"]
        existing_tags = list((b.get("tags") or {}).keys())
        existing_warnings = []
        for w in (b.get("warnings") or []):
            existing_warnings.append(w[0] if isinstance(w, list) else w)
        entry = {
            "booth_id": bid,
            "circle_id": b.get("circle_id"),
            "existing_body": b.get("body", ""),
            "existing_tags": existing_tags,
            "existing_warnings": existing_warnings,
        }
        # Signals: pull X mirror buckets when handle resolvable.
        handle = _resolve_x_handle(slug, bid)
        if handle:
            entry["x_handle"] = handle
            x_buckets = _x_buckets_for(handle)
            if x_buckets and any(x_buckets.values()):
                entry["x_buckets"] = x_buckets
        bundles.append(entry)

    # Chunk
    n = max(1, args.chunks)
    per = (len(bundles) + n - 1) // n
    written = []
    for i in range(n):
        chunk = bundles[i * per:(i + 1) * per]
        if not chunk:
            continue
        out = {
            "event": slug,
            "chunk": i + 1,
            "of": n,
            "prompt_path": str(
                fl.PROJECT_ROOT / ".claude" / "skills" / "filter-system"
                / "CLASSIFY_PROMPT.md"
            ),
            "filters_vocab": vocab,
            "booths": chunk,
        }
        path = out_dir / f"chunk-{i + 1}.json"
        path.write_text(
            json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        written.append(path)

    print(f"classify-prep: {slug} → {len(bundles)} booths in {len(written)} chunk(s)",
          file=sys.stderr)
    for p in written:
        rel = p.relative_to(fl.PROJECT_ROOT)
        print(f"  {rel}", file=sys.stderr)
    print(f"prompt: {fl.PROJECT_ROOT / '.claude/skills/filter-system/CLASSIFY_PROMPT.md'}",
          file=sys.stderr)


if __name__ == "__main__":
    main()
