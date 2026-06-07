#!/usr/bin/env python3
"""Bootstrap a new event guide from an official circle list.

Steps:
1. parse_list.py the URL into booth records
2. Copy template files (app.js / style.css / event.js etc) from <template>
3. Write data.js with booth scaffold (body="", cover_urls=[], cps=[], tags={}, min_price=None)
4. Create .x-api-data-<slug>/raw/ for later timeline storage
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


TEMPLATE_FILES = [
    # Per-event files that get duplicated into each <slug>/ subdir.
    # Shared shell (app.js, style.css, i18n.js, icon.svg, _index_template.html
    # → built into <slug>/index.html by build_index_html.py) lives at repo root.
    #
    # NOTE: map.jpg and og.png are NOT copied from the template — they're
    # event-specific by definition. The bootstrap step generates clean
    # placeholders (see below) instead, so a newly-bootstrapped event never
    # displays the template's stale cho-tsukuyomi map / OG image.
    "event.js", "filters.js", "manifest.json", "sw.js",
]


def _write_placeholder_image(path, text, size=(1200, 630)):
    """Generate a minimal placeholder PNG/JPG with a "(REPLACE ME)" label
    so a freshly-bootstrapped event doesn't ship with the template's
    actual event visuals (which would look wrong + load slow + be
    misleading in OG previews until the maintainer swaps them in)."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        # Fall back to a tiny placeholder if Pillow is missing — the file
        # still needs to exist to avoid 404s.
        path.write_bytes(
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01"
            b"\x00\x00\xff\xdb\x00C\x00" + b"\x10" * 64 + b"\xff\xc0\x00\x0b"
            b"\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01"
            b"\x00" * 16 + b"\xff\xc4\x00\x14\x10\x01" + b"\x00" * 17
            + b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xff\xd9"
        )
        return
    img = Image.new("RGB", size, (240, 240, 250))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default(size=24)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size[0] - tw) / 2, (size[1] - th) / 2), text,
              fill=(120, 100, 160), font=font)
    if path.suffix.lower() == ".png":
        img.save(path, "PNG", optimize=True)
    else:
        img.save(path, "JPEG", quality=85, optimize=True)


def main():
    p = argparse.ArgumentParser(description="Bootstrap an event guide directory")
    p.add_argument("event_slug", help="e.g. yaoyoro-2026-06")
    p.add_argument("organizer", choices=["ketcom", "glfes"])
    p.add_argument("url", help="official circle list URL")
    # Self-locate project root: <repo>/.claude/skills/doujin-circle-recon/scripts/bootstrap.py
    # parents[0]=scripts, [1]=doujin-circle-recon, [2]=skills, [3]=.claude,
    # [4]=<repo>. The skill is project-bound (moved 2026-06-07), so the
    # repo IS the project root we want as default.
    _SELF_ROOT_DEFAULT = str(Path(__file__).resolve().parents[4])
    p.add_argument("--root", default=_SELF_ROOT_DEFAULT,
                   help=f"project root (default: self-located {_SELF_ROOT_DEFAULT})")
    p.add_argument("--template", default="cho-tsukuyomi-2026-05",
                   help="template event dir under --root to copy from")
    args = p.parse_args()

    root = Path(os.path.expanduser(args.root))
    template = root / args.template
    target = root / args.event_slug

    if not template.exists():
        print(f"template missing: {template}", file=sys.stderr)
        sys.exit(2)
    if target.exists():
        print(f"target already exists: {target}", file=sys.stderr)
        sys.exit(2)

    # 1. Parse circle list
    here = Path(__file__).parent
    parsed = subprocess.check_output(
        ["python3", str(here / "parse_list.py"), args.organizer, args.url]
    )
    booths_raw = json.loads(parsed)
    if not booths_raw:
        print("parse returned 0 booths — check URL", file=sys.stderr)
        sys.exit(2)

    # 2. Copy template files
    target.mkdir(parents=True)
    for f in TEMPLATE_FILES:
        src = template / f
        dst = target / f
        if src.exists():
            shutil.copy2(src, dst)

    # Map + OG placeholders. NEVER copy the template's actual images —
    # they're event-specific and shipping the template's would mislead
    # social share previews + look broken in-page until replaced.
    _write_placeholder_image(
        target / "map.jpg",
        f"(map.jpg: replace with {args.event_slug} venue map)",
        size=(1200, 800),
    )
    _write_placeholder_image(
        target / "og.png",
        f"(og.png: replace with {args.event_slug} key visual)",
        size=(1200, 630),
    )

    # 3. Write data.js scaffold (booth body=empty, cover_urls=empty)
    # Normalize booth_id: if prefix doesn't match a single Latin letter, insert
    # a dash so app.js's `b.booth_id.startsWith(row + '-')` filter matches
    # (e.g. "ヤオ05" → "ヤオ-05"). Single-letter prefixes like "A-02" stay.
    import re as _re
    def normalize_booth_id(bid: str) -> str:
        # If already has a dash, keep as-is
        if "-" in bid:
            return bid
        # Match a Japanese / Chinese / multi-char prefix followed by digits
        m = _re.match(r"^([^\d]+)(\d.*)$", bid)
        if m and len(m.group(1)) >= 2:  # multi-char prefix
            return f"{m.group(1)}-{m.group(2)}"
        return bid

    booths = []
    for b in booths_raw:
        booths.append({
            "booth_id": normalize_booth_id(b["booth_id"]),
            "circle_name": b["circle_name"],
            "author": b["author"],
            "x_handle": b["x_handle"],
            "x_url": b["x_url"],
            "body": "",
            "cps": [],
            "tags": {},
            "min_price": None,
            "cover_urls": [],
        })
    out_data = "window.BOOTHS = " + json.dumps(booths, ensure_ascii=False, indent=2) + ";\n"
    (target / "data.js").write_text(out_data, encoding="utf-8")

    # 4. .x-api-data-<slug>/raw/ for timelines
    api_dir = root / f".x-api-data-{args.event_slug}" / "raw"
    api_dir.mkdir(parents=True, exist_ok=True)

    # 5. Refresh circles.json/circles.js + slim data.js to circle_id refs.
    #    Delegates to repo scripts/ (the SSOT) so behavior stays consistent
    #    with manual rebuilds.
    scripts_dir = root / "scripts"
    extract = scripts_dir / "extract_circles.py"
    migrate = scripts_dir / "migrate_to_circle_ref.py"
    build_index = scripts_dir / "build_index_html.py"
    if extract.is_file() and migrate.is_file():
        print()
        print("Refreshing circles.json (SSOT) + slimming data.js...")
        subprocess.check_call(["python3", str(extract)], cwd=root)
        subprocess.check_call(["python3", str(migrate)], cwd=root)
    else:
        print()
        print(f"⚠️  {extract} / {migrate} not found — skipping circles.json refresh.")
        print(f"    Run them manually after editing event.js.")
    # 6. Generate the starter index.html ONCE from _index_template.html.
    #    Going forward the file is hand-editable per event (this script will not
    #    overwrite it on subsequent runs).
    if build_index.is_file():
        print()
        print(f"Generating starter {args.event_slug}/index.html...")
        subprocess.check_call(["python3", str(build_index), "--only", args.event_slug], cwd=root)

    print()
    print(f"bootstrapped {target}")
    print(f"  {len(booths)} booths")
    print(f"  template: {template}")
    print(f"  timeline dir: {api_dir}")
    print()
    print("NEXT STEPS:")
    print(f"  1. Edit {target}/event.js — set name/date_display/venue/entry_info/rows/etc")
    print(f"  2. Replace {target}/map.jpg with the event-specific map")
    print(f"  3. Add to events.json with slug: \"{args.event_slug}\"")
    print(f"  4. Run pull: bin/run.sh pull {args.event_slug}")
    print(f"  (circles.json/.js auto-refreshed, index.html already loads ../circles.js)")


if __name__ == "__main__":
    main()
