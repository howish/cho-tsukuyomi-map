"""Single source of truth for "what are the event subdirs in this repo."

Before B2 (2026-06-07): each script that needed to iterate events
walked `root.iterdir()` + maintained its own ad-hoc skip-list
(`{'scripts', 'circles'}` in some, missing `review` / `docs` /
`openspec` / `.claude` / `tools` / `.git` etc in others — so some
scripts would try to read `openspec/data.js` if a similarly-named file
ever existed there).

After B2: `discover_events(root)` is the only blessed iterator.
Source of truth = `events.json`. An event "exists" for code purposes
when it has a `slug` AND `<root>/<slug>/event.js` is present on disk.
Info-only events (no slug, e.g. パンケーキ食べたい) are filtered out
because no internal guide exists for them yet.

Usage:
    from _events import discover_events  # add scripts/ to sys.path first

    for ev in discover_events(REPO_ROOT):
        print(ev.slug, ev.dir, ev.event_js)
        # ev.dir is Path, ev.slug is str, ev.event_js is Path
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class EventDir:
    """A discovered, on-disk event."""
    slug: str
    dir: Path
    event_js: Path
    raw: dict  # the events.json entry, in case callers need other fields


def discover_events(repo_root: Path | str) -> list[EventDir]:
    """Yield EventDir for every events.json entry that has a slug and
    a `<slug>/event.js` on disk. Sort order = events.json order
    (chronological by date in this project; deterministic).
    """
    repo_root = Path(repo_root)
    events_json = repo_root / "events.json"
    if not events_json.is_file():
        return []
    data = json.loads(events_json.read_text(encoding="utf-8"))
    out: list[EventDir] = []
    for entry in (data.get("events") or []):
        slug = entry.get("slug")
        if not slug:
            continue  # info-only listing — no internal guide built
        ev_dir = repo_root / slug
        ev_js = ev_dir / "event.js"
        if not ev_js.is_file():
            continue  # slug declared but the dir hasn't materialised yet
        out.append(EventDir(slug=slug, dir=ev_dir, event_js=ev_js, raw=entry))
    return out


def discover_event_dirs(repo_root: Path | str) -> list[Path]:
    """Convenience: just the directory Paths, sorted, for callers that
    don't need slug / event_js metadata."""
    return [ev.dir for ev in discover_events(repo_root)]
