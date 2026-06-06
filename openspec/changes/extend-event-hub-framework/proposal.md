## Why

Each new doujin event added to yachi8000.app (cho-tsukuyomi-2026-05, if7-2026-05, yaoyoro-2026-06) is hand-scaffolded today — event.js, data.js, filters.js, index.html, manifest.json, icon.svg, plus wiring into the recon pipeline (pull_timelines / triage / diff). As the calendar fills with ぷにケット, ツクヨミスクエア, パン食べ, 赤ブー and similar events, this duplicates effort and creates subtle drift between event scaffolds. The pattern is clear after three events — codify it.

## What Changes

- Add a `scripts/bootstrap_event.py` CLI that scaffolds a complete event directory from `(event_slug, organizer_format, source_url, event_meta_json)`
- Add pluggable organizer adapters (ketcom Shift-JIS CGI, GJS `circle-list-if.js` JSON, doujin.com.tw convention page) under `scripts/adapters/`
- Add an event template tree (`scripts/templates/event/`) — generic index.html / filters.js / sw.js / manifest.json / icon.svg with `{{slot}}` placeholders that the bootstrap fills
- Wire the recon pipeline automatically — bootstrap script registers the new event slug with `pull_timelines.py`, `extract_circles.py`, and the `doujin-circle-recon` skill so day-one workflows just work
- Document the adapter contract so future organizer formats can be plugged in with one new file

## Capabilities

### New Capabilities

- `event-bootstrap`: end-to-end CLI that turns one official URL + event metadata into a working `<slug>/` directory with circles parsed, scaffolded, and ready for body recon
- `organizer-adapters`: pluggable parser plugins for each supported circle-list source format; one Python module per organizer that exposes a single `parse(url) -> List[BoothScaffold]` function
- `event-template`: shared HTML/JS/manifest skeleton that all events inherit, with slot fills for event_slug, event display name, date, venue, official_url, theme color

### Modified Capabilities

(none yet — this is purely additive; existing events are untouched)

## Impact

- **New code**: `scripts/bootstrap_event.py`, `scripts/adapters/{ketcom,gjs,doujin_tw}.py`, `scripts/templates/event/{index.html,filters.js,sw.js,manifest.json,icon.svg}` skeleton
- **Modified**: `doujin-circle-recon` skill's `bootstrap` subcommand becomes a thin wrapper that calls `scripts/bootstrap_event.py`
- **Unchanged**: existing event directories (cho-tsukuyomi-2026-05 / if7-2026-05 / yaoyoro-2026-06) — this is for NEW events only
- **No breaking changes**: the existing recon scripts already iterate `<slug>/data.js` files, so a new event just shows up after bootstrap

## Dependencies

- (none — pure dev tooling, no backend required, no other proposal in flight is a prerequisite)

## Enables

- `automate-recon-pipeline` (E) reads the event registry the bootstrap creates, so scaffolded events flow into automated pulls without extra wiring
