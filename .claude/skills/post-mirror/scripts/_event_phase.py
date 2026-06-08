"""Compute event-relative context (time phase + mentions + confidence) for a post.

Pure functions, no I/O. The caller (query.py body command) feeds in a post
plus the events.json list and the target event slug; we return an
event_context dict the agent prompt can reason over.

Per openspec change add-event-phase-context.
"""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone
from typing import Iterable


# Time-phase windows (days from event start/end)
_FAR_PRE_DAYS = 60
_POST_DAYS = 14


def _parse_iso_to_date(iso: str) -> date | None:
    """Parse ISO8601 (with or without Z / offset) to a UTC date."""
    if not iso:
        return None
    s = iso.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        # Fallback: try just the date prefix
        try:
            return date.fromisoformat(iso[:10])
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).date()


def event_window(ev: dict) -> tuple[date, date] | None:
    """Return (start, end) date pair for an event, or None if unparseable.

    Supports `dates: ["start","end"]` (multi-day) or `date: "YYYY-MM-DD"`
    (single-day; start == end).
    """
    if "dates" in ev and isinstance(ev["dates"], list) and ev["dates"]:
        try:
            s = date.fromisoformat(ev["dates"][0])
            e = date.fromisoformat(ev["dates"][-1])
            return (s, e)
        except ValueError:
            return None
    if "date" in ev:
        try:
            d = date.fromisoformat(ev["date"])
            return (d, d)
        except ValueError:
            return None
    return None


def compute_time_phase(post_date: date, window: tuple[date, date]) -> str:
    """Bucket a post date relative to an event window.

    Returns one of: far_pre, pre, during, post, far_post.
    """
    start, end = window
    if post_date < start - timedelta(days=_FAR_PRE_DAYS):
        return "far_pre"
    if post_date < start:
        return "pre"
    if post_date <= end + timedelta(days=1):
        return "during"
    if post_date <= end + timedelta(days=_POST_DAYS):
        return "post"
    return "far_post"


# Dated reference regexes
# "本日 6/7", "6/7", "6月7日", "2026-06-07", "2026年6月7日", "2026/06/07"
_DATE_RES = [
    re.compile(r"(?P<y>20\d{2})[-/年](?P<m>\d{1,2})[-/月](?P<d>\d{1,2})日?"),
    re.compile(r"(?<![\d])(?P<m>\d{1,2})[/月](?P<d>\d{1,2})日?(?![\d])"),
]


def extract_date_strings(text: str, hint_year: int) -> list[date]:
    """Return all date-like strings found in text.

    Two-component dates (M/D) use hint_year. Returns deduped list.
    """
    seen: set[date] = set()
    out: list[date] = []
    for rx in _DATE_RES:
        for m in rx.finditer(text or ""):
            try:
                y = int(m.groupdict().get("y") or hint_year)
                mo = int(m.group("m"))
                d_ = int(m.group("d"))
                dt = date(y, mo, d_)
            except (ValueError, KeyError):
                continue
            if dt not in seen:
                seen.add(dt)
                out.append(dt)
    return out


def _post_mentions_event_by_text(text: str, ev: dict) -> bool:
    """Hashtag / alias / name substring match → True."""
    if not text:
        return False
    haystack = text
    haystack_lower = text.lower()

    for ht in ev.get("hashtags") or []:
        if ht and ht in haystack:
            return True

    for needle in (ev.get("name"), ev.get("short_name"), *(ev.get("aliases") or [])):
        if not needle:
            continue
        # Case-insensitive only for ASCII; CJK needles checked case-sensitive
        if needle.isascii():
            if needle.lower() in haystack_lower:
                return True
        else:
            if needle in haystack:
                return True
    return False


def _post_mentions_event_by_prefix(text: str, ev: dict) -> bool:
    """unique_booth_prefix + digits → True."""
    prefix = ev.get("unique_booth_prefix")
    if not prefix or not text:
        return False
    # Allow optional ASCII / fullwidth digit immediately after prefix
    if re.search(re.escape(prefix) + r"\d", text):
        return True
    return False


def _post_mentions_event_by_date(text: str, ev: dict, window: tuple[date, date]) -> bool:
    """A date reference that resolves inside the event's window."""
    start, end = window
    hint_year = start.year
    dates = extract_date_strings(text, hint_year)
    for d_ in dates:
        if start <= d_ <= end + timedelta(days=1):
            return True
    return False


def extract_mentions(text: str, all_events: Iterable[dict]) -> list[str]:
    """Return the deduped list of event slugs the post text references.

    Sources, ORed: hashtag, name/alias substring, unique_booth_prefix,
    date inside the event's natural window.
    """
    out: list[str] = []
    seen: set[str] = set()
    for ev in all_events:
        slug = ev.get("slug")
        if not slug:
            continue
        win = event_window(ev)
        hit = (
            _post_mentions_event_by_text(text, ev)
            or _post_mentions_event_by_prefix(text, ev)
            or (win is not None and _post_mentions_event_by_date(text, ev, win))
        )
        if hit and slug not in seen:
            seen.add(slug)
            out.append(slug)
    return out


def _confidence(target_slug: str, time_phase: str, mentions: list[str]) -> str:
    """Combine time_phase + mentions per design truth table."""
    in_phase = time_phase in ("pre", "during", "post")
    if target_slug in mentions:
        return "high"
    if mentions:
        # Other events mentioned, not this one
        return "low" if in_phase else "none"
    # No mentions
    return "med" if in_phase else "low"


def compute_event_context(
    post_text: str,
    post_created_at: str,
    target_event: dict,
    all_events: list[dict],
) -> dict | None:
    """Compute the {time_phase, mentions, this_event_confidence} block.

    Returns None if the target event has no parseable date window.
    """
    win = event_window(target_event)
    if win is None:
        return None
    post_date = _parse_iso_to_date(post_created_at)
    if post_date is None:
        # Unknown timestamp → assume far_pre (most defensive: no automatic
        # current-event attribution, mentions still considered)
        time_phase = "far_pre"
    else:
        time_phase = compute_time_phase(post_date, win)
    mentions = extract_mentions(post_text or "", all_events)
    target_slug = target_event.get("slug") or ""
    confidence = _confidence(target_slug, time_phase, mentions)
    return {
        "time_phase": time_phase,
        "mentions": mentions,
        "this_event_confidence": confidence,
    }


def find_event(all_events: list[dict], slug: str) -> dict | None:
    for ev in all_events:
        if ev.get("slug") == slug:
            return ev
    return None
