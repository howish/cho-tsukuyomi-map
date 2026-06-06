#!/usr/bin/env python3
"""Pull x-api timelines for every booth with x_handle, via the post-mirror skill.

Per howish 2026-06-06: this script becomes a thin orchestrator that
walks each event's booth roster and delegates the actual fetch +
persist to the post-mirror skill's incremental pull. Dual-writes a
raw JSON dump per booth (existing behavior preserved) so triage / diff
consumers keep working during the verify window.

Replaces the earlier doujin-circle-recon skill's pull_timelines.py at
project level. The skill copy stays as a fallback for cross-project use.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POST_MIRROR_RUN = ROOT / ".claude" / "skills" / "post-mirror" / "bin" / "run.sh"
POST_MIRROR_SCRIPTS = ROOT / ".claude" / "skills" / "post-mirror" / "scripts"


def load_booths(data_js_path: Path) -> list[dict]:
    raw = data_js_path.read_text(encoding="utf-8")
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$', raw, re.S)
    assert m, f"unexpected data.js shape — no window.BOOTHS = [...] found"
    return json.loads(m.group(1))


def sanitize(booth_id: str) -> str:
    return booth_id.replace("/", "_").replace(".", "_").replace(" ", "_")


def resolve_handles(root: Path, slug: str) -> list[tuple[str, str]]:
    """Returns (booth_id, x_handle) tuples for every booth that has an X
    handle, resolved via circles.json members[0].socials → X URL.
    """
    data_js = root / slug / "data.js"
    booths = load_booths(data_js)

    circles_json = root / "circles.json"
    x_handle_by_booth: dict[str, str] = {}
    if circles_json.is_file():
        d = json.loads(circles_json.read_text(encoding="utf-8"))
        authors_by_id = {a["id"]: a for a in d.get("authors", [])}
        circles_by_id = {c["id"]: c for c in d.get("circles", [])}
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
            for s in (primary.get("socials") or []):
                if s.get("platform") == "x" and s.get("url"):
                    m = re.search(r"(?:x|twitter)\.com/@?([A-Za-z0-9_]{1,15})", s["url"])
                    if m:
                        x_handle_by_booth[b["booth_id"]] = m.group(1)
                        break

    handles: list[tuple[str, str]] = []
    for b in booths:
        h = b.get("x_handle") or x_handle_by_booth.get(b["booth_id"])
        if h:
            handles.append((b["booth_id"], h))
    return handles


def call_post_mirror_pull(username: str, force_full: bool, mirror_path: Path) -> dict:
    """Invoke ~/.claude/skills/post-mirror/bin/run.sh pull <username>.

    Returns the parsed JSON result. Raises if the call fails or output
    is unparseable.
    """
    cmd = [str(POST_MIRROR_RUN), "pull", username, "--mirror", str(mirror_path)]
    if force_full:
        cmd.append("--force-full")
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if proc.returncode != 0:
        raise RuntimeError(f"post-mirror pull failed: {proc.stderr.strip()[:200]}")
    return json.loads(proc.stdout)


def main():
    p = argparse.ArgumentParser(
        description="Pull X timelines for every booth via the post-mirror skill"
    )
    p.add_argument("event_slug")
    p.add_argument("-n", "--count", type=int, default=25,
                   help="tweets per handle (default 25)")
    p.add_argument("--root", default=str(ROOT))
    p.add_argument("--skip-existing", action="store_true",
                   help="(legacy) skip handles already pulled this session")
    p.add_argument("--force-full", action="store_true",
                   help="bypass post-mirror back-off cadence")
    # Dual-write to raw/ is OPT-IN per howish 2026-06-06 (cost-first
    # interpretation of the "hybrid write" design decision): the mirror
    # is the SSOT going forward; raw/ becomes a verify-corpus snapshot
    # captured only when explicitly requested. Without --with-raw-dump
    # we don't pay the extra x-api timeline call.
    p.add_argument("--with-raw-dump", action="store_true",
                   help="also dump latest 25 tweets to .x-api-data-<slug>/raw/ "
                        "(verify corpus; costs +1 timeline call per booth)")
    args = p.parse_args()

    root = Path(os.path.expanduser(args.root))
    slug = args.event_slug
    handles = resolve_handles(root, slug)
    print(f"booths with x_handle: {len(handles)} (via circles.json)", file=sys.stderr)

    api_dir = root / f".x-api-data-{slug}"
    raw = api_dir / "raw"
    raw_prev = api_dir / "raw-prev"
    raw.mkdir(parents=True, exist_ok=True)
    mirror_path = root / ".x-api-data" / "mirror.sqlite"

    # Move current raw → prev for diff support (legacy behavior preserved)
    if not args.skip_existing and args.with_raw_dump and raw.exists() and any(raw.iterdir()):
        if raw_prev.exists():
            shutil.rmtree(raw_prev)
        shutil.copytree(raw, raw_prev)
        print(f"  saved baseline: {raw_prev}", file=sys.stderr)

    pulled = 0
    skipped = 0
    new_posts_total = 0

    for i, (booth_id, handle) in enumerate(handles, 1):
        outfile = raw / f"{sanitize(booth_id)}-main-{handle}.json"
        try:
            result = call_post_mirror_pull(handle, args.force_full, mirror_path)
        except Exception as e:
            print(f"  [{i}/{len(handles)}] {booth_id} @{handle} ERR: {e}", file=sys.stderr)
            continue

        if result.get("skipped"):
            print(f"  [{i}/{len(handles)}] {booth_id} @{handle} SKIP "
                  f"({result.get('reason', '?')})", file=sys.stderr)
            skipped += 1
            continue

        n_new = result.get("new_post_count", 0)
        new_posts_total += n_new
        pulled += 1
        print(f"  [{i}/{len(handles)}] {booth_id} @{handle} → {n_new} new "
              f"(streak={result.get('silent_streak', '?')})", file=sys.stderr)

        # Dual-write: also dump the latest 25 tweets to raw/ for legacy
        # consumers (triage/diff that still read .x-api-data-<slug>/raw/).
        # We use the x-api skill to fetch the same window — since the
        # incremental call may have returned 0 new posts, we want the
        # current view written out anyway for the verify corpus.
        if args.with_raw_dump:
            xapi = Path.home() / ".claude" / "skills" / "x-api" / "bin" / "run.sh"
            try:
                out = subprocess.check_output(
                    [str(xapi), "timeline", f"@{handle}", "-n", str(args.count)],
                    timeout=60,
                )
                outfile.write_bytes(out)
            except Exception as e:
                # Non-fatal — mirror has the canonical data.
                print(f"    raw/ dual-write failed: {e}", file=sys.stderr)

    print(f"\nDONE. pulled={pulled} skipped={skipped} "
          f"total_new_posts={new_posts_total}", file=sys.stderr)
    print(f"  mirror: {mirror_path}", file=sys.stderr)
    if args.with_raw_dump:
        print(f"  raw/:   {raw}", file=sys.stderr)


if __name__ == "__main__":
    main()
