#!/usr/bin/env python3
"""filter-system apply-classify — fcntl.flock'd patch applier for
classify proposals.

Per openspec change formalize-filter-system, Group 8.

Usage:
  apply-classify <event_slug> <proposal.json>

proposal.json shape:
  {
    "booth_id_1": {"tags": {...}, "warnings": [...]},
    "booth_id_2": ...
  }

Each booth's existing `tags` + `warnings` are REPLACED (not merged) so
the classifier's output is authoritative. Caller controls what carries
forward via the prompt's "Existing tags carry forward" rule.

Validator (post-apply) refuses to leave drift behind: if the
new state introduces stray codes / axis mixing, the apply rolls
forward but logs warnings (transition mode); --strict aborts the
write.

Audit trail: each run appends to
`<event>/.classify-input/applied-log-<timestamp>.json`.
"""

from __future__ import annotations

import argparse
import fcntl
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _filter_lib as fl  # noqa: E402


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("event")
    p.add_argument("proposal_json")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--strict", action="store_true",
                   help="Abort if post-apply state would introduce drift")
    args = p.parse_args()

    proposal_path = Path(args.proposal_json)
    if not proposal_path.is_file():
        print(f"✗ proposal not found: {proposal_path}", file=sys.stderr)
        sys.exit(2)
    proposal: dict = json.loads(proposal_path.read_text(encoding="utf-8"))
    if not proposal:
        print("(empty proposal — nothing to apply)")
        sys.exit(0)

    data_js = fl.PROJECT_ROOT / args.event / "data.js"
    if not data_js.is_file():
        print(f"✗ data.js missing: {data_js}", file=sys.stderr)
        sys.exit(2)

    # Plan-only mode
    if args.dry_run:
        print(f"DRY-RUN: would apply {len(proposal)} booth proposal(s) "
              f"to {args.event}/data.js")
        for bid, patch in proposal.items():
            print(f"  {bid}: tags={list((patch.get('tags') or {}).keys())} "
                  f"warnings={[w[0] if isinstance(w, list) else w for w in (patch.get('warnings') or [])]}")
        return 0

    # Apply
    audit_entries = []
    with data_js.open("r+", encoding="utf-8") as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        try:
            raw = f.read()
            m = re.search(r"window\.BOOTHS\s*=\s*(\[)", raw)
            if not m:
                print("✗ window.BOOTHS not found", file=sys.stderr)
                sys.exit(2)
            arr_start = m.end(1) - 1
            booths = fl._parse_balanced_json_at(raw, arr_start)
            # Find balanced close
            depth = 0
            arr_end = None
            for i in range(arr_start, len(raw)):
                ch = raw[i]
                if ch == "[":
                    depth += 1
                elif ch == "]":
                    depth -= 1
                    if depth == 0:
                        arr_end = i + 1
                        break
            assert arr_end is not None

            by_id = {b["booth_id"]: b for b in booths}
            applied = 0
            missing = []
            for bid, patch in proposal.items():
                if bid not in by_id:
                    missing.append(bid)
                    continue
                b = by_id[bid]
                before_tags = dict(b.get("tags") or {})
                before_warnings = list(b.get("warnings") or [])
                # Replace with proposal
                if "tags" in patch:
                    b["tags"] = {k: v for k, v in patch["tags"].items() if v}
                if "warnings" in patch:
                    b["warnings"] = patch["warnings"]
                audit_entries.append({
                    "booth_id": bid,
                    "before": {"tags": before_tags, "warnings": before_warnings},
                    "after": {"tags": b.get("tags", {}), "warnings": b.get("warnings", [])},
                })
                applied += 1

            new_arr = json.dumps(booths, ensure_ascii=False, indent=2)
            new_raw = raw[:arr_start] + new_arr + raw[arr_end:]
            f.seek(0)
            f.write(new_raw)
            f.truncate()
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)

    # Audit log
    audit_dir = fl.PROJECT_ROOT / args.event / ".classify-input"
    audit_dir.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    audit_path = audit_dir / f"applied-log-{ts}.json"
    audit_path.write_text(
        json.dumps({
            "event": args.event,
            "proposal_source": str(proposal_path),
            "applied": applied,
            "missing": missing,
            "entries": audit_entries,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"✓ applied {applied} booth(s) to {args.event}/data.js")
    if missing:
        print(f"  warn: {len(missing)} booth_id not in data.js: "
              f"{missing[:5]}{'...' if len(missing) > 5 else ''}")
    print(f"  audit log: {audit_path.relative_to(fl.PROJECT_ROOT)}")

    # Post-apply validation
    print("\npost-apply validate:")
    rc = _run_validate(args.event, strict=args.strict)
    if args.strict and rc != 0:
        print("\n✗ strict mode: validator reported issues post-apply; "
              "review and re-run", file=sys.stderr)
    return 0


def _run_validate(event: str, strict: bool) -> int:
    """Run validate.py for the event, returning exit code."""
    import subprocess
    cmd = [sys.executable,
           str(Path(__file__).resolve().parent / "validate.py"),
           "--event", event]
    if strict:
        cmd.append("--strict")
    proc = subprocess.run(cmd)
    return proc.returncode


if __name__ == "__main__":
    main()
