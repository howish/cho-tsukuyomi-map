"""Shared helpers for filter-system subcommands.

Parses `window.FILTERS_CONFIG = {...}` from per-event `filters.js`
and `window.BOOTHS = [...]` from per-event `data.js`. Light-touch JSON
parsing (no full JS engine) — the project's filter files are
JSON-shaped on purpose so this works.

Per openspec change formalize-filter-system (2026-06-07).
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

# Project root resolution from this file's location:
# .claude/skills/filter-system/scripts/_filter_lib.py
# parents[4] = repo root
PROJECT_ROOT = Path(__file__).resolve().parents[4]

# 4-axis schema — the contract this skill enforces.
AXES = ("cps", "tags", "works", "warnings")
SHARED_AXES = ("tags", "warnings")  # eligible for shared base extension
PER_EVENT_AXES = ("cps", "works", "mediums", "areas")  # always per-event only

REQUIRED_FIELDS = {"code", "label"}
RECOMMENDED_FIELDS = {"icon", "title"}
WARNING_OPTIONAL_FIELD = "class_suffix"

# Code naming rule: lowercase ASCII alphanumeric + `-` only.
# Aligns with URL safety, sort stability, cross-platform case.
CODE_NAMING_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


@dataclass(frozen=True)
class FilterEntry:
    """One entry in a filters axis (e.g. one tag, one warning)."""
    code: str
    label: str
    icon: str = ""
    title: str = ""
    class_suffix: str = ""
    pattern: str = ""           # dead config — should be cleaned up
    raw: dict | None = None     # original dict from filters.js


def _entries_from(axis_list) -> list[FilterEntry]:
    return [
        FilterEntry(
            code=e.get("code", ""),
            label=e.get("label", ""),
            icon=e.get("icon", ""),
            title=e.get("title", ""),
            class_suffix=e.get("class_suffix", ""),
            pattern=e.get("pattern", ""),
            raw=e,
        )
        for e in (axis_list or []) if isinstance(e, dict)
    ]


def load_base_filters() -> dict[str, list[FilterEntry]]:
    """Parse root `_filters_base.js`, return per-axis FilterEntry list.
    Returns empty axes if the file is absent."""
    path = PROJECT_ROOT / "_filters_base.js"
    if not path.is_file():
        return {"tags": [], "warnings": []}
    text = path.read_text(encoding="utf-8")
    obj = _slice_js_object(text, "FILTERS_BASE")
    out: dict[str, list[FilterEntry]] = {}
    for axis in ("tags", "warnings"):
        out[axis] = _entries_from(obj.get(axis))
    return out


def load_event_filters(event_slug: str, include_base: bool = True) -> dict[str, list[FilterEntry]]:
    """Parse `<event>/filters.js`, return per-axis list of FilterEntry.

    By default merges with `_filters_base.js` so the result reflects what
    app.js's runtime merge produces. Pass `include_base=False` to see
    per-event-only entries (useful for "what does THIS event override"
    introspection)."""
    path = PROJECT_ROOT / event_slug / "filters.js"
    if not path.is_file():
        raise FileNotFoundError(f"filters.js missing: {path}")
    text = path.read_text(encoding="utf-8")
    obj = _slice_js_object(text, "FILTERS_CONFIG")
    per_event: dict[str, list[FilterEntry]] = {}
    for axis in ("cps", "tags", "works", "warnings", "mediums", "areas"):
        per_event[axis] = _entries_from(obj.get(axis))
    if not include_base:
        return per_event
    base = load_base_filters()
    # Merge base + per-event for shared axes (tags, warnings).
    # Per-event entries with the same code OVERRIDE the base — matches
    # app.js's mergeFilters() runtime behavior.
    merged = dict(per_event)
    for axis in ("tags", "warnings"):
        by_code: dict[str, FilterEntry] = {}
        for entry in base.get(axis, []):
            by_code[entry.code] = entry
        for entry in per_event.get(axis, []):
            by_code[entry.code] = entry
        merged[axis] = list(by_code.values())
    return merged


def load_event_booths(event_slug: str) -> list[dict]:
    """Parse `<event>/data.js`, return list of booth dicts."""
    path = PROJECT_ROOT / event_slug / "data.js"
    if not path.is_file():
        raise FileNotFoundError(f"data.js missing: {path}")
    text = path.read_text(encoding="utf-8")
    return _slice_js_array(text, "BOOTHS")


def discover_events() -> list[str]:
    """Use the project's events SSOT (events.json) to enumerate slugs.
    Defers to scripts/_events.py — single import point."""
    sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
    from _events import discover_events as _de  # noqa: E402
    return [ev.slug for ev in _de(PROJECT_ROOT)]


# ---------- parsers ----------

def _slice_js_array(text: str, name: str) -> list:
    """Find `window.<name> = [...]` and json.loads the array."""
    m = re.search(rf"window\.{re.escape(name)}\s*=\s*(\[)", text)
    if not m:
        raise ValueError(f"window.{name} = [...] not found")
    return _parse_balanced_json_at(text, m.end(1) - 1)


def _slice_js_object(text: str, name: str) -> dict:
    """Find `window.<name> = {...}` and json.loads the object."""
    m = re.search(rf"window\.{re.escape(name)}\s*=\s*(\{{)", text)
    if not m:
        raise ValueError(f"window.{name} = {{...}} not found")
    return _parse_balanced_json_at(text, m.end(1) - 1)


def _parse_balanced_json_at(text: str, start: int):
    """Read a JSON-ish value beginning at `start` (which must be `{` or `[`),
    matching the balanced close. Converts JS-style unquoted property names
    to JSON-quoted ones before parsing.

    The project's filters.js uses `key: value` (unquoted, JS object
    literal style). data.js uses `"key": value` (proper JSON). The
    unquoted-key preprocessor handles both transparently — proper JSON
    is unchanged by the regex.
    """
    open_ch = text[start]
    close_ch = {"{": "}", "[": "]"}[open_ch]
    depth = 0
    in_str = False
    escape = False
    end = None
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == open_ch:
                depth += 1
            elif ch == close_ch:
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
    if end is None:
        raise ValueError(f"unbalanced {open_ch}{close_ch} starting at {start}")
    raw = text[start:end]
    raw = _js_to_json_lite(raw)
    return json.loads(raw)


def _js_to_json_lite(s: str) -> str:
    """Apply the minimal JS→JSON transformations the project files need:
    strip `// ...` and `/* ... */` comments (but not inside strings),
    quote unquoted property keys, drop trailing commas before `}` / `]`.
    Robust enough for filters.js / data.js shape; not a full JS parser."""
    # Strip single-line `// ...` comments (but not inside strings — naive
    # check: only treat as comment if `//` is not preceded by `:` from a
    # URL literal). For our files, comments only appear in code positions,
    # never inside string values, so this naive split is safe.
    out_lines = []
    for line in s.split("\n"):
        # Find `//` not inside a string.
        in_str = False
        escape = False
        cut = None
        for i, ch in enumerate(line):
            if in_str:
                if escape: escape = False
                elif ch == "\\": escape = True
                elif ch == '"': in_str = False
            else:
                if ch == '"':
                    in_str = True
                elif ch == "/" and i + 1 < len(line) and line[i + 1] == "/":
                    cut = i
                    break
        out_lines.append(line[:cut] if cut is not None else line)
    s = "\n".join(out_lines)
    # Strip `/* ... */` blocks (multi-line OK)
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    # Quote JS-style unquoted property names. Pattern: after `{` / `,`
    # / start-of-line + indent, an identifier followed by `:`. This
    # handles both indented multi-line (`\n  key: value`) and inline
    # (`{ key: "x", key: "y" }`) styles.
    s = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:',
               r'\1"\2":', s)
    # Also handle the very first key when the object opens without a
    # leading `{` on the same line as `key:` (e.g. multi-line top-level).
    s = re.sub(r'^(\s+)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":',
               s, flags=re.M)
    # Strip JS-style trailing commas before `}` or `]`.
    s = re.sub(r',(\s*[}\]])', r'\1', s)
    return s


# ---------- code introspection ----------

def load_events_index() -> list[dict]:
    """Return the parsed `events.json` events list, or [] if missing."""
    path = PROJECT_ROOT / "events.json"
    if not path.is_file():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8")).get("events", [])
    except (json.JSONDecodeError, OSError):
        return []


def event_date_window(event_slug: str) -> tuple[date, date] | None:
    """Look up an event slug in events.json, return (start, end) dates.

    Supports `dates: ["YYYY-MM-DD", "YYYY-MM-DD"]` (multi-day) or
    `date: "YYYY-MM-DD"` (single — start == end).
    """
    for ev in load_events_index():
        if ev.get("slug") != event_slug:
            continue
        if ev.get("dates"):
            try:
                return (date.fromisoformat(ev["dates"][0]),
                        date.fromisoformat(ev["dates"][-1]))
            except (ValueError, TypeError):
                return None
        if ev.get("date"):
            try:
                d = date.fromisoformat(ev["date"])
                return (d, d)
            except (ValueError, TypeError):
                return None
        return None
    return None


# Regexes for date-string extraction from booth body markdown.
# Order matters: longest forms first (so 2026-06-07 wins over 6-07).
# The bare M/D slash form is intentionally NOT included — "1/3" / "2/3"
# in editorial markdown overwhelmingly means "part 1 of 3" (fraction
# / chapter index), not "January 3rd". The Japanese 月/日 form is
# unambiguous and stays.
_DATE_PATTERNS = [
    # 2026-06-07 / 2026/06/07 / 2026年6月7日
    re.compile(r"(?P<y>20\d{2})[-/年](?P<m>\d{1,2})[-/月](?P<d>\d{1,2})日?"),
    # 6月7日 — unambiguous JP date marker, no year
    re.compile(r"(?<![\d])(?P<m>\d{1,2})月(?P<d>\d{1,2})日(?![\d])"),
]


def extract_body_dates(text: str, hint_year: int) -> list[tuple[date, str]]:
    """Return [(parsed_date, raw_match_text), ...] for date-like strings.

    Deduped on parsed date. M/D forms use hint_year. Invalid month/day
    combinations (e.g. 2/30) are skipped silently.
    """
    seen: set[date] = set()
    out: list[tuple[date, str]] = []
    for rx in _DATE_PATTERNS:
        for m in rx.finditer(text or ""):
            gd = m.groupdict()
            try:
                y = int(gd.get("y") or hint_year)
                mo = int(gd["m"])
                dd = int(gd["d"])
                d_ = date(y, mo, dd)
            except (ValueError, KeyError, TypeError):
                continue
            if d_ in seen:
                continue
            seen.add(d_)
            out.append((d_, m.group(0)))
    return out


def codes_in_booth(booth: dict) -> dict[str, list[str]]:
    """Return per-axis list of codes the booth actually uses.

    Schema today:
      booth.cps = ["code", ...] (list of strings)
      booth.tags = {"code": true, ...} (object of truthy)
      booth.warnings = ["code" | [code, label, source_url], ...]
      booth.area = "code" (single string, optional)
      (no booth.works field today — fandoms live in booth.tags currently,
      which is the axis-mixing drift this skill exists to fix)
    """
    out: dict[str, list[str]] = {a: [] for a in AXES}
    for c in (booth.get("cps") or []):
        out["cps"].append(c)
    for code, on in (booth.get("tags") or {}).items():
        if on:
            out["tags"].append(code)
    for w in (booth.get("warnings") or []):
        if isinstance(w, list):
            out["warnings"].append(w[0])
        elif isinstance(w, str):
            out["warnings"].append(w)
    # works: not in current data shape; the axis mixing means works
    # codes live in booth.tags. Validator surfaces this.
    return out
