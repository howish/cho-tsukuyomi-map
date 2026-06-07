#!/usr/bin/env python3
"""Pull x-api timeline for every booth with x_handle in <slug>/data.js.

Saves to .x-api-data-<slug>/raw/<booth_id_sanitized>-main-<handle>.json.
On re-run, copies previous .raw/ to raw-prev/ so diff.py can use it.
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


def load_booths(data_js_path: Path) -> list[dict]:
    raw = data_js_path.read_text(encoding="utf-8")
    # Some data.js files have a /** ... */ JSDoc-style header. Strip it +
    # locate `window.BOOTHS = [...]` block regardless of position.
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$', raw, re.S)
    assert m, f"unexpected data.js shape — no window.BOOTHS = [...] found"
    return json.loads(m.group(1))


def sanitize(booth_id: str) -> str:
    return booth_id.replace("/", "_").replace(".", "_").replace(" ", "_")


def main():
    p = argparse.ArgumentParser(description="Pull x-api timelines for all booth handles")
    p.add_argument("event_slug")
    p.add_argument("-n", "--count", type=int, default=25, help="tweets per handle (default 25)")
    p.add_argument("--root", default="~/project/cho-tsukuyomi-map")
    p.add_argument("--skip-existing", action="store_true",
                   help="skip handles already pulled this session (don't refresh)")
    args = p.parse_args()

    root = Path(os.path.expanduser(args.root))
    data_js = root / args.event_slug / "data.js"
    booths = load_booths(data_js)

    # Post-migration: booths use circle_id refs and no longer carry
    # x_handle directly. Resolve via circles.json → circle.members[0] →
    # author.socials → x URL → handle. Fall back to booth.x_handle if the
    # legacy field is still set.
    circles_json = root / "circles.json"
    x_handle_by_booth = {}
    if circles_json.is_file():
        d = json.loads(circles_json.read_text(encoding="utf-8"))
        authors_by_id = {a["id"]: a for a in d.get("authors", [])}
        circles_by_id = {c["id"]: c for c in d.get("circles", [])}
        for b in booths:
            cid = b.get("circle_id")
            if not cid: continue
            c = circles_by_id.get(cid)
            if not c: continue
            members = c.get("members") or []
            if not members: continue
            primary = authors_by_id.get(members[0])
            if not primary: continue
            for s in (primary.get("socials") or []):
                if s.get("platform") == "x" and s.get("url"):
                    m = re.search(r"(?:x|twitter)\.com/@?([A-Za-z0-9_]{1,15})", s["url"])
                    if m:
                        x_handle_by_booth[b["booth_id"]] = m.group(1)
                        break

    handles = []
    for b in booths:
        h = b.get("x_handle") or x_handle_by_booth.get(b["booth_id"])
        if h:
            handles.append((b["booth_id"], h))
    print(f"booths with x_handle: {len(handles)} / {len(booths)} (via circles.json lookup)", file=sys.stderr)

    api_dir = root / f".x-api-data-{args.event_slug}"
    raw = api_dir / "raw"
    raw_prev = api_dir / "raw-prev"
    raw.mkdir(parents=True, exist_ok=True)

    # Move current raw → prev for diff support
    if not args.skip_existing and raw.exists() and any(raw.iterdir()):
        if raw_prev.exists():
            shutil.rmtree(raw_prev)
        shutil.copytree(raw, raw_prev)
        print(f"  saved baseline: {raw_prev}", file=sys.stderr)

    xapi = Path.home() / ".claude" / "skills" / "x-api" / "bin" / "run.sh"

    for i, (booth_id, handle) in enumerate(handles, 1):
        outfile = raw / f"{sanitize(booth_id)}-main-{handle}.json"
        if args.skip_existing and outfile.exists():
            print(f"  [{i}/{len(handles)}] {booth_id} @{handle} SKIP", file=sys.stderr)
            continue
        cmd = [str(xapi), "timeline", f"@{handle}", "-n", str(args.count)]
        try:
            out = subprocess.check_output(cmd, timeout=60)
            outfile.write_bytes(out)
            # Sanity: ensure data array present
            try:
                d = json.loads(out)
                n = len(d.get("data", []))
                print(f"  [{i}/{len(handles)}] {booth_id} @{handle} → {n} tweets", file=sys.stderr)
            except json.JSONDecodeError:
                print(f"  [{i}/{len(handles)}] {booth_id} @{handle} ERR: non-JSON response", file=sys.stderr)
        except subprocess.CalledProcessError as e:
            print(f"  [{i}/{len(handles)}] {booth_id} @{handle} ERR: {e}", file=sys.stderr)
        except subprocess.TimeoutExpired:
            print(f"  [{i}/{len(handles)}] {booth_id} @{handle} TIMEOUT", file=sys.stderr)

    print(f"DONE. timelines in {raw}", file=sys.stderr)


if __name__ == "__main__":
    main()
