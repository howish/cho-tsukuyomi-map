#!/usr/bin/env python3
"""Rebuild circles.json + circles.js + slim event data.js (idempotent).

Runs scripts/extract_circles.py + scripts/migrate_to_circle_ref.py in the
project root. Use after manually editing event data.js to refresh the SSOT.
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description="Rebuild circles.json + slim data.js")
    p.add_argument("--root", default="~/project/cho-tsukuyomi-map")
    args = p.parse_args()

    root = Path(os.path.expanduser(args.root))
    scripts = root / "scripts"
    extract = scripts / "extract_circles.py"
    migrate = scripts / "migrate_to_circle_ref.py"
    check = scripts / "check_profile_links.py"
    build_index = scripts / "build_index_html.py"

    for s in (extract, migrate):
        if not s.is_file():
            print(f"error: {s} not found", file=sys.stderr)
            sys.exit(2)

    subprocess.check_call(["python3", str(extract)], cwd=root)
    subprocess.check_call(["python3", str(migrate)], cwd=root)
    # Canonicalize RT-pointing cover source_urls (RT → original tweet URL).
    # Idempotent — re-runs are a no-op if already canonical.
    canonicalize = scripts / "canonicalize_rt_sources.py"
    if canonicalize.is_file():
        subprocess.check_call(["python3", str(canonicalize)], cwd=root)
    # Audit (NOT auto-prune) covers whose X status URL is by a different
    # author than the booth's circle. Some mismatches are legitimate 寄攤
    # partners — manual review is the policy (Yachiyo decides per case),
    # supported by .cover_author_allowlist.json for confirmed-legitimate
    # entries. Earlier we ran prune_mismatched_covers.py here, but it
    # would have nuked the U-30 河豚老師 寄攤 cover too.
    audit = scripts / "audit_cover_author_match.py"
    if audit.is_file():
        subprocess.check_call(["python3", str(audit)], cwd=root)
    # NOTE: index.html is NOT regenerated here. Each event's index.html is
    # hand-edited (after bootstrap) so features can be turned on/off per event.
    # Use `scripts/build_index_html.py --only <slug> --force` if you need to
    # rebuild a specific event from the starter template.
    # Cache-bust bumped only if circles.js etc. changed (always touched here).
    bump = scripts / "bump_cache.py"
    if bump.is_file():
        subprocess.check_call(["python3", str(bump)], cwd=root)
    if check.is_file():
        subprocess.check_call(["python3", str(check)], cwd=root)
    # R2 image health check — HEAD-requests every images.yachi8000.app
    # display_url to catch 404s (typo'd path, deleted file, etc).
    # Non-zero exit triggers warning but doesn't fail the build (network).
    check_r2 = scripts / "check_r2_images.py"
    if check_r2.is_file():
        try:
            subprocess.check_call(["python3", str(check_r2), "--quiet"], cwd=root)
        except subprocess.CalledProcessError as e:
            print(f"⚠️  R2 image check found broken URLs (exit {e.returncode}) — "
                  "run `python3 scripts/check_r2_images.py` for details",
                  file=sys.stderr)


if __name__ == "__main__":
    main()
