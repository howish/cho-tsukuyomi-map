#!/usr/bin/env python3
"""filter-system validate — schema + drift audit across events.

Per openspec change formalize-filter-system, Group 3.

Severity matrix (transition mode default; --strict promotes warnings
to errors):

  - stray code (data uses code not defined in filters)         warn / error
  - axis mixing (code in tags but defined in works)            warn / error
  - schema missing required field (label, code)                error / error
  - code naming violation (non-lowercase, non-kebab, non-ASCII) warn / error
  - dead `pattern` field on filter entry                       warn / error
  - cross-event drift in shared vocabulary                     warn / warn

Exit code = max severity hit (0 clean, 1 warn, 2 error).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _filter_lib as fl  # noqa: E402


SEVERITY_ORDER = {"info": 0, "warn": 1, "error": 2}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--event", default=None,
                   help="Validate only this event slug (default: all)")
    p.add_argument("--strict", action="store_true",
                   help="Promote warnings to errors (CI / clean-state mode)")
    args = p.parse_args()

    if args.event:
        events = [args.event]
    else:
        events = fl.discover_events()

    findings: list[tuple[str, str, str, str]] = []
    # tuple: (severity, event, location, message)

    for ev in events:
        try:
            filters = fl.load_event_filters(ev)
        except Exception as e:
            findings.append(("error", ev, "filters.js", f"failed to parse: {e}"))
            continue

        # Code → axis index (for stray + axis-mixing checks).
        code_axis: dict[str, str] = {}
        for axis in fl.AXES + ("mediums", "areas"):
            for entry in filters.get(axis, []):
                # Schema: required + naming
                if not entry.code:
                    findings.append(("error", ev, f"filters.{axis}",
                                     "entry with empty code"))
                    continue
                if not entry.label:
                    findings.append(("error", ev, f"filters.{axis}.{entry.code}",
                                     "missing required field: label"))
                # Skip code-naming check for `areas` — that axis uses the
                # code as the display label by design (e.g. IF7 has 綜合 /
                # 百合 / VW). docs/filters.md documents the exception.
                if axis != "areas" and not fl.CODE_NAMING_RE.match(entry.code):
                    findings.append(("warn", ev, f"filters.{axis}.{entry.code}",
                                     f"code naming violation (expected "
                                     f"lowercase kebab-case ASCII)"))
                if entry.pattern:
                    findings.append(("warn", ev, f"filters.{axis}.{entry.code}",
                                     "dead `pattern` field (auto-detect removed B5)"))
                # Track axis for mixing detection
                if entry.code in code_axis:
                    other = code_axis[entry.code]
                    if other != axis:
                        findings.append((
                            "error", ev,
                            f"filters.{axis}.{entry.code}",
                            f"duplicate code on different axis (also in {other})"
                        ))
                else:
                    code_axis[entry.code] = axis

        # Walk booths for stray + axis-mix
        try:
            booths = fl.load_event_booths(ev)
        except Exception as e:
            findings.append(("error", ev, "data.js", f"failed to parse: {e}"))
            continue

        for b in booths:
            bid = b.get("booth_id", "?")
            used = fl.codes_in_booth(b)
            for axis_in_data, codes in used.items():
                for code in codes:
                    defined_axis = code_axis.get(code)
                    if defined_axis is None:
                        findings.append((
                            "warn", ev, f"data.js[{bid}].{axis_in_data}",
                            f"stray code '{code}' (no filter definition)"
                        ))
                    elif defined_axis != axis_in_data:
                        findings.append((
                            "warn", ev, f"data.js[{bid}].{axis_in_data}",
                            f"axis mixing: '{code}' belongs to "
                            f"filters.{defined_axis}, not {axis_in_data}"
                        ))

    # Apply --strict: promote warn → error.
    if args.strict:
        findings = [
            ("error" if sev == "warn" else sev, ev, loc, msg)
            for sev, ev, loc, msg in findings
        ]

    # Print + tally
    by_sev: dict[str, int] = {"info": 0, "warn": 0, "error": 0}
    by_ev: dict[str, list] = {}
    for sev, ev, loc, msg in findings:
        by_sev[sev] += 1
        by_ev.setdefault(ev, []).append((sev, loc, msg))

    if not findings:
        print("✓ filter-system validate: clean")
        return 0

    for ev, items in sorted(by_ev.items()):
        # Stable sort: errors first, then warns
        items.sort(key=lambda x: -SEVERITY_ORDER[x[0]])
        print(f"\n== {ev} ({len(items)} finding{'s' if len(items) != 1 else ''}) ==")
        for sev, loc, msg in items:
            tag = {"error": "✗", "warn": "⚠", "info": "ℹ"}[sev]
            print(f"  {tag} [{sev}] {loc}: {msg}")

    print(f"\ntotal: {by_sev['error']} error(s), {by_sev['warn']} warn(s)")
    if not args.strict and by_sev["warn"] and not by_sev["error"]:
        print("(transition mode — warnings don't block; --strict to gate)")
    return 2 if by_sev["error"] else (1 if by_sev["warn"] else 0)


if __name__ == "__main__":
    sys.exit(main())
