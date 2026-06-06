#!/usr/bin/env python3
"""Group 7 verify: compare mirror-derived triage output vs raw-derived
triage output for an event, line-by-line.

Mirror path: walks each booth's @handle, runs
  `.claude/skills/post-mirror/bin/run.sh query body --username @handle`
  to get the categorized bucket JSON.
Raw path: walks `.x-api-data-<slug>/raw/*-main-*.json` directly, applies
  the same default keyword buckets, produces the same shape.

Output: a divergence catalog. For each (booth, bucket) where the two
outputs differ, log the booth_id, bucket name, posts-only-in-mirror,
posts-only-in-raw, hypothesis tag (e.g. "raw is stale", "mirror missed
RT").

The compare is intended to validate that mirror has not lost data
relative to raw across the migration boundary — divergences in the
"raw is stale" direction are expected and acceptable (mirror is the
new SSOT). Divergences in the "mirror missed signal" direction are
problems to investigate.
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

DEFAULT_BUCKETS = {
    "新刊":     ["新刊", "新作", "新本"],
    "お品書き": ["お品書き", "品書", "おしながき", "ラインナップ"],
    "完売":     ["完売", "売切", "売り切れ"],
    "通販":     ["通販", "メロン", "メロンブックス", "とらのあな", "BOOTH", "委託"],
    "次回参加": ["次回", "次イベ", "次は", "コミティア", "コミケ", "ぷにケット", "赤ブー"],
}


def load_booths(data_js_path: Path) -> list[dict]:
    raw = data_js_path.read_text(encoding="utf-8")
    m = re.search(r'window\.BOOTHS\s*=\s*(\[.*?\])\s*;?\s*$', raw, re.S)
    assert m
    return json.loads(m.group(1))


def resolve_handles(slug: str) -> list[tuple[str, str]]:
    booths = load_booths(ROOT / slug / "data.js")
    circles = json.loads((ROOT / "circles.json").read_text(encoding="utf-8"))
    authors_by_id = {a["id"]: a for a in circles.get("authors", [])}
    circles_by_id = {c["id"]: c for c in circles.get("circles", [])}
    out = []
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
            if s.get("platform") == "x" and s.get("url"):
                m = re.search(r"(?:x|twitter)\.com/@?([A-Za-z0-9_]{1,15})", s["url"])
                if m:
                    out.append((b["booth_id"], m.group(1)))
                    break
    return out


def mirror_body(handle: str) -> dict:
    """Call post-mirror query body for one handle, return parsed JSON.
    Returns {'error': ...} on failure."""
    cmd = [str(SKILL_RUN), "query", "body", "--username", handle]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    except subprocess.TimeoutExpired:
        return {"error": "timeout"}
    if proc.returncode != 0:
        return {"error": f"exit {proc.returncode}: {proc.stderr.strip()[:200]}"}
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return {"error": "non-json output"}


def raw_body(slug: str, booth_id: str, handle: str) -> dict:
    """Mimic mirror's `query body` from .x-api-data-<slug>/raw/ JSON.

    Falls back to .x-api-data/raw/ (slug-less, project-root) for cho-tsukuyomi
    which predates the slug-prefixed layout.
    """
    sanitized = booth_id.replace("/", "_").replace(".", "_").replace(" ", "_")
    candidates = [
        ROOT / f".x-api-data-{slug}" / "raw" / f"{sanitized}-main-{handle}.json",
        ROOT / ".x-api-data" / "raw" / f"{sanitized}-main-{handle}.json",
    ]
    raw_file = next((c for c in candidates if c.is_file()), None)
    if raw_file is None:
        return {"error": f"raw file missing: {sanitized}-main-{handle}.json"}
    try:
        data = json.loads(raw_file.read_text(encoding="utf-8"))
    except Exception as e:
        return {"error": f"raw parse: {e}"}

    posts = data.get("data") or []
    out_buckets: dict[str, list[dict]] = {}
    for bucket_name, kws in DEFAULT_BUCKETS.items():
        hits = []
        seen = set()
        for p in posts:
            txt = p.get("text") or ""
            for kw in kws:
                if kw in txt:
                    if p["id"] in seen:
                        break
                    seen.add(p["id"])
                    hits.append({
                        "id": str(p["id"]),
                        "created_at": p.get("created_at"),
                        "text": txt,
                        "match_keyword": kw,
                    })
                    break
        hits.sort(key=lambda r: r["created_at"] or "", reverse=True)
        out_buckets[bucket_name] = hits[:10]
    return {"username": handle, "buckets": out_buckets}


def diff_buckets(mirror: dict, raw: dict) -> dict:
    """Compare two body() outputs. Returns per-bucket divergence."""
    div = {}
    for bucket in DEFAULT_BUCKETS.keys():
        m_ids = {h["id"] for h in (mirror.get("buckets") or {}).get(bucket, [])}
        r_ids = {h["id"] for h in (raw.get("buckets") or {}).get(bucket, [])}
        only_mirror = m_ids - r_ids
        only_raw = r_ids - m_ids
        if only_mirror or only_raw:
            div[bucket] = {
                "mirror_only_count": len(only_mirror),
                "raw_only_count": len(only_raw),
                "mirror_only_ids": list(only_mirror)[:5],
                "raw_only_ids": list(only_raw)[:5],
            }
    return div


def main():
    p = argparse.ArgumentParser(
        description="Compare mirror-derived vs raw-derived triage for an event")
    p.add_argument("event_slug")
    p.add_argument("--limit", type=int, default=None,
                   help="Only process first N booths (debug)")
    p.add_argument("--json", action="store_true",
                   help="Emit full divergence catalog as JSON")
    args = p.parse_args()

    handles = resolve_handles(args.event_slug)
    if args.limit:
        handles = handles[: args.limit]
    print(f"# verify: {len(handles)} booths with x_handle for {args.event_slug}",
          file=sys.stderr)

    catalog = {
        "event": args.event_slug,
        "booth_count": len(handles),
        "summary": {
            "no_divergence": 0,
            "mirror_richer": 0,
            "raw_richer": 0,
            "both_differ": 0,
            "raw_missing": 0,
        },
        "per_booth": {},
    }

    for i, (booth_id, handle) in enumerate(handles, 1):
        m_out = mirror_body(handle)
        r_out = raw_body(args.event_slug, booth_id, handle)

        if r_out.get("error"):
            if "missing" in r_out["error"]:
                catalog["summary"]["raw_missing"] += 1
                catalog["per_booth"][booth_id] = {
                    "handle": handle,
                    "note": "raw missing",
                }
                continue
            print(f"  [{i}/{len(handles)}] {booth_id} @{handle} raw err: "
                  f"{r_out['error'][:100]}", file=sys.stderr)
            continue
        if m_out.get("error"):
            print(f"  [{i}/{len(handles)}] {booth_id} @{handle} mirror err: "
                  f"{m_out['error'][:100]}", file=sys.stderr)
            continue

        div = diff_buckets(m_out, r_out)
        if not div:
            catalog["summary"]["no_divergence"] += 1
            continue

        m_only_total = sum(d["mirror_only_count"] for d in div.values())
        r_only_total = sum(d["raw_only_count"] for d in div.values())
        if m_only_total and not r_only_total:
            catalog["summary"]["mirror_richer"] += 1
        elif r_only_total and not m_only_total:
            catalog["summary"]["raw_richer"] += 1
        else:
            catalog["summary"]["both_differ"] += 1

        catalog["per_booth"][booth_id] = {
            "handle": handle,
            "divergence": div,
        }
        print(f"  [{i}/{len(handles)}] {booth_id} @{handle} "
              f"mirror_only={m_only_total} raw_only={r_only_total}",
              file=sys.stderr)

    if args.json:
        print(json.dumps(catalog, ensure_ascii=False, indent=2))
    else:
        print(f"\n## Summary ({args.event_slug})", file=sys.stderr)
        for k, v in catalog["summary"].items():
            print(f"  {k}: {v}", file=sys.stderr)


if __name__ == "__main__":
    main()
