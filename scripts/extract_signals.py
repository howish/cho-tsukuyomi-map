#!/usr/bin/env python3
"""Per-booth signal aggregator for body-update agents.

For each booth in an event, gathers signals from:
- post-mirror `query body` (X timeline categorized into 新刊/お品書き/完売/通販/次回参加)
- .x-api-data-<slug>/plurk/<booth>-*.json (recent plurks)
- .x-api-data-<slug>/threads/<booth>-*.json (recent threads)
- .x-api-data-<slug>/doujin_tw/<booth>-*.json (doujin_list 完售/可購買 status)

Emits JSON: { "booths": [ {booth_id, circle_id, existing_body, x_buckets,
plurk_recent, threads_recent, doujin_tw} ] }. Body-update agents
consume this and apply diffs to data.js while respecting
EDITORIAL_GUIDELINES.md.

Skips booths with no signals (all 4 platforms empty / missing).
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL_RUN = ROOT / ".claude" / "skills" / "post-mirror" / "bin" / "run.sh"


def load_booths(data_js_path: Path) -> list[dict]:
    raw = data_js_path.read_text(encoding="utf-8")
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$', raw, re.S)
    assert m
    return json.loads(m.group(1))


def resolve_booth_handles(slug: str) -> dict[str, dict]:
    """Return {booth_id: {x_handle, plurk_handle, threads_handle, doujin_tw_url}}
    for every booth in the event, populated when the primary author has
    that platform.
    """
    booths = load_booths(ROOT / slug / "data.js")
    circles = json.loads((ROOT / "circles.json").read_text(encoding="utf-8"))
    authors_by_id = {a["id"]: a for a in circles.get("authors", [])}
    circles_by_id = {c["id"]: c for c in circles.get("circles", [])}

    out: dict[str, dict] = {}
    for b in booths:
        bid = b["booth_id"]
        entry = {
            "x_handle": None,
            "plurk_handle": None,
            "threads_handle": None,
            "doujin_tw_url": None,
        }
        cid = b.get("circle_id")
        if cid:
            c = circles_by_id.get(cid)
            members = (c or {}).get("members") or []
            if members:
                primary = authors_by_id.get(members[0])
                if primary:
                    for s in primary.get("socials") or []:
                        plat = s.get("platform")
                        url = s.get("url") or ""
                        if plat == "x":
                            m = re.search(r"(?:x|twitter)\.com/@?([A-Za-z0-9_]{1,15})", url)
                            if m:
                                entry["x_handle"] = m.group(1)
                        elif plat == "plurk":
                            m = re.search(r"plurk\.com/(?:u/)?([A-Za-z0-9_]+)", url)
                            if m:
                                entry["plurk_handle"] = m.group(1)
                        elif plat == "threads":
                            m = re.search(r"threads\.(?:com|net)/@?([A-Za-z0-9_.]+)", url)
                            if m:
                                entry["threads_handle"] = m.group(1)
                        elif plat == "doujin_tw":
                            entry["doujin_tw_url"] = url
        out[bid] = entry
    return out


def sanitize(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", s)


def load_x_buckets(handle: str) -> dict | None:
    """Call post-mirror query body. Return buckets dict or None."""
    cmd = [str(SKILL_RUN), "query", "body", "--username", handle, "--limit", "8"]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    except subprocess.TimeoutExpired:
        return None
    if proc.returncode != 0:
        return None
    try:
        d = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return None
    return d.get("buckets")


def _find_platform_file(slug: str, platform: str, booth_id: str) -> Path | None:
    """Match by booth_id prefix — sanitize differences in handle make
    direct path construction fragile. The pull_multiplatform writer
    stored one file per (booth, handle) under `<platform>/`."""
    d = ROOT / f".x-api-data-{slug}" / platform
    if not d.is_dir():
        return None
    prefix = f"{sanitize(booth_id)}-"
    for f in d.iterdir():
        if f.name.startswith(prefix) and f.name.endswith(".json"):
            return f
    return None


def load_plurk(slug: str, booth_id: str, handle: str) -> list[dict] | None:
    """Read the plurk JSON for booth, return up to 8 most-recent plurks
    (or None if file missing)."""
    f = _find_platform_file(slug, "plurk", booth_id)
    if f is None:
        return None
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return None
    plurks = d.get("plurks") or []
    out = []
    for p in plurks[:8]:
        txt = p.get("text") or ""
        if "adults-only" in txt or not txt.strip():
            continue
        out.append({
            "id": p.get("id"),
            "timestamp": p.get("timestamp"),
            "text": txt[:600],
            "link": p.get("link"),
        })
    return out or None


def load_threads(slug: str, booth_id: str, handle: str) -> list[dict] | None:
    f = _find_platform_file(slug, "threads", booth_id)
    if f is None:
        return None
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return None
    posts = d.get("posts") or []
    if not posts:
        return None
    out = []
    for p in posts[:5]:
        txt = (p.get("text") or "").strip()
        if not txt:
            continue
        out.append({
            "id": p.get("id"),
            "timestamp": p.get("timestamp"),
            "text": txt[:600],
            "link": p.get("link"),
        })
    return out or None


def load_doujin_tw(slug: str, booth_id: str, url: str) -> dict | None:
    f = _find_platform_file(slug, "doujin_tw", booth_id)
    if f is None:
        return None
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return None
    return {
        "nick_name": d.get("nick_name"),
        "doujin_count": d.get("doujin_count"),
        "description": (d.get("og") or {}).get("og:description"),
        "doujin_list": [
            {"raw": x.get("raw"), "r18": x.get("r18"), "status": x.get("status")}
            for x in (d.get("doujin_list") or [])
        ][:20],
        "social_links": d.get("social_links") or [],
        "url": d.get("url"),
    }


def main():
    p = argparse.ArgumentParser(
        description="Per-booth multi-platform signal aggregator for body-update agents")
    p.add_argument("event_slug")
    p.add_argument("--output", default=None,
                   help="Output JSON path (default: .x-api-data-<slug>/signals.json)")
    args = p.parse_args()

    slug = args.event_slug
    handles = resolve_booth_handles(slug)
    booths = load_booths(ROOT / slug / "data.js")
    body_by_bid = {b["booth_id"]: b.get("body", "") for b in booths}

    out: list[dict] = []
    counts = {"x": 0, "plurk": 0, "threads": 0, "doujin_tw": 0, "with_signal": 0}
    for bid, h in handles.items():
        entry = {"booth_id": bid, "existing_body": body_by_bid.get(bid, "")}
        has_signal = False
        if h["x_handle"]:
            buckets = load_x_buckets(h["x_handle"])
            if buckets and any(buckets.values()):
                entry["x_handle"] = h["x_handle"]
                entry["x_buckets"] = buckets
                counts["x"] += 1
                has_signal = True
        if h["plurk_handle"]:
            plurks = load_plurk(slug, bid, h["plurk_handle"])
            if plurks:
                entry["plurk_handle"] = h["plurk_handle"]
                entry["plurk_recent"] = plurks
                counts["plurk"] += 1
                has_signal = True
        if h["threads_handle"]:
            threads = load_threads(slug, bid, h["threads_handle"])
            if threads:
                entry["threads_handle"] = h["threads_handle"]
                entry["threads_recent"] = threads
                counts["threads"] += 1
                has_signal = True
        if h["doujin_tw_url"]:
            dtw = load_doujin_tw(slug, bid, h["doujin_tw_url"])
            if dtw and dtw.get("doujin_list"):
                entry["doujin_tw"] = dtw
                counts["doujin_tw"] += 1
                has_signal = True
        if has_signal:
            out.append(entry)
            counts["with_signal"] += 1

    output_path = Path(args.output) if args.output else (
        ROOT / f".x-api-data-{slug}" / "signals.json"
    )
    output_path.write_text(
        json.dumps({"event": slug, "booths": out}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"signals written: {output_path.relative_to(ROOT)}", file=sys.stderr)
    print(f"  total booths with signal: {counts['with_signal']}", file=sys.stderr)
    for plat in ("x", "plurk", "threads", "doujin_tw"):
        print(f"    {plat}: {counts[plat]}", file=sys.stderr)


if __name__ == "__main__":
    main()
