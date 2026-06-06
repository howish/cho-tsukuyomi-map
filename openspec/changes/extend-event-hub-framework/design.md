## Context

Three doujin events are live in yachi8000.app today — `cho-tsukuyomi-2026-05`, `if7-2026-05`, `yaoyoro-2026-06`. Each was hand-scaffolded: per-event `index.html` copied + edited, `event.js` written, `data.js` populated from a one-off parsing script run, `filters.js` tuned for the event's tag set, manifest + icon assembled. Average human time per event: ~2 hours just for the scaffold, before any recon body work.

Two more events are imminent (ぷにケット 2026-06-14, ツクヨミスクエア 2026-06-21), and the calendar continues to fill (パン食べ 2026-07-26, 赤ブー 2026-08-30). The cost of the manual scaffold becomes prohibitive after ~5 events because subtle drift accumulates: one event's `sw.js` learns to cache something the others don't, one event's filter chip palette diverges from the others, one event forgets to add an entry to `events.json` and silently misses the cross-event circle index. Codify the pattern that's now clear from three examples.

Current code already shows the pattern: `scripts/extract_circles.py` iterates `<slug>/data.js` files generically, the `doujin-circle-recon` skill's `bootstrap` subcommand calls into the per-organizer parser, the `circles.json` resolution doesn't care which event a booth came from. The shared substrate is in place; only the scaffolding step is bespoke.

## Goals / Non-Goals

**Goals:**

- One command turns one official URL + event metadata into a working event directory
- Adding support for a new organizer format costs one new Python file under `scripts/adapters/`
- Existing events (cho-tsukuyomi / IF7 / yaoyoro) remain bit-for-bit unchanged
- Operators can refresh the template across all events without touching event-specific data
- The framework is a CLI used during development — it does not run in any production hot path

**Non-Goals:**

- No GUI for event creation (CLI is sufficient and version-controllable)
- No automatic schedule scraping from organizer pages (event metadata stays operator-supplied)
- No retroactive rebuild of existing event directories from current templates (they're already correct; refresh path is opt-in per slug)
- No support for organizers that require login or CAPTCHA (out of scope; only public, anonymous-readable sources)
- Not a generator for non-doujin event types (focused on this site's domain)

## Decisions

### Decision: Python over Node for the CLI

- **Chosen:** Python 3.10+, single-file CLI under `scripts/bootstrap_event.py`
- **Alternative considered:** Node script under `scripts/` to match the frontend JS toolchain
- **Rationale:** All existing recon + apply scripts are Python (`extract_circles.py`, `apply_review_decisions.py`, `pull_timelines.py`). The bootstrap script reads + writes circles.json and data.js, so reusing those module conventions keeps the toolchain coherent. The doujin-circle-recon skill is also Python-shelled.

### Decision: Plugin discovery via explicit import, not auto-load

- **Chosen:** Each adapter is registered in a hand-edited dict at the top of `bootstrap_event.py`: `ADAPTERS = {'ketcom': ketcom.parse, 'gjs': gjs.parse, 'doujin_tw': doujin_tw.parse}`
- **Alternative considered:** Auto-discover via `os.listdir('scripts/adapters/')` + dynamic import
- **Rationale:** Explicit is better — when reading the source it's immediately clear which organizers are supported. Adding a new adapter is a 2-line change (import + dict entry). Auto-discovery introduces hidden coupling that's easy to break with a stray `__pycache__` file.

### Decision: Jinja2 for template rendering

- **Chosen:** Jinja2 templates with `{{slot}}` placeholders, escaped where needed
- **Alternative considered:** Python str.format or simple string replacement
- **Rationale:** Jinja2 handles HTML / JS escaping properly, supports conditionals (e.g. "only emit this `<script>` tag if the event has a stats subpage"), and is already familiar to most maintainers. Cost: one new pip dependency for the dev environment, which is acceptable since the CLI runs locally only.

### Decision: Idempotent re-bootstrap with hand-edit detection

- **Chosen:** Bootstrap stores a hash of generated content per file in `<slug>/.bootstrap-state.json`; `--refresh-template` compares current file contents to the stored hash and skips files the operator modified
- **Alternative considered:** Always regenerate, force operator to git-stash before re-bootstrap
- **Rationale:** The operator workflow is "I tweaked icon.svg and the title in event.js by hand". Forcing a stash dance for what should be a routine template update creates friction that incentivizes operators to never refresh. State file gives a safe, reversible upgrade path. Cost: one extra small JSON file per event slug.

### Decision: Source URL retained in event.js

- **Chosen:** `event.js` exports `recon_source_url` alongside `official_url`. The bootstrap script writes the value passed to `--url`; future `--refresh-source` runs read it back.
- **Alternative considered:** Don't persist the source URL; require the operator to pass it every time
- **Rationale:** Most events have one canonical source page. Persisting it makes `--refresh-source <slug>` a single-flag invocation, drastically simplifying the weekly recon cadence.

### Decision: Booth-id reconciliation

- **Chosen:** On re-bootstrap, the script matches existing booths to source-fetched ones primarily by `circle_name`, secondarily by `link`. If neither matches, the booth is treated as new. Removed-from-source booths get an annotation but are not deleted.
- **Alternative considered:** Match by booth_id alone
- **Rationale:** Organizers sometimes renumber booths last-minute. Matching by stable identity (circle_name + social link) preserves the operator's manual work even when booth IDs shift. The annotation approach lets the operator decide whether to drop or keep removed booths.

## Risks / Trade-offs

- **Risk:** A template change has an undetected breaking effect on existing events
  - **Mitigation:** `--refresh-template` runs against one event at a time and emits a diff; operator reviews before committing. Plus existing events have been hand-tested and won't be auto-refreshed.

- **Risk:** An adapter silently returns malformed data (e.g. missing booth_id), and bootstrap writes a corrupted data.js
  - **Mitigation:** Schema-validate every adapter return value with a `BoothScaffold` TypedDict + manual assertion (booth_id required, circle_name required, link nullable). Fail the whole bootstrap if any row fails validation; print the row index and field that failed.

- **Risk:** Jinja2 escaping rules surprise the operator (e.g. interpolating an HTML title that contains `&`)
  - **Mitigation:** Default to autoescape for HTML files, raw-string for JS files, explicit `| safe` filter where needed; integration test against a known-good event's output to catch regressions.

- **Risk:** Re-bootstrap on an event with hand-edited data.js loses manual recon work
  - **Mitigation:** data.js is treated as operator-owned post-bootstrap; bootstrap only ever appends/merges into it, never overwrites. Re-bootstrap from source explicitly says "merging X new booths from source"; operator can abort if surprised.

- **Trade-off:** Jinja2 dependency increases environment setup cost slightly
  - **Acceptance:** One pip install, documented in README. Adapter dependencies (e.g. `requests`, `beautifulsoup4`) are already in the project.

## Migration Plan

- This is purely additive. No deploy / rollback complexity.
- Existing events stay as-is; they were hand-scaffolded and don't need to be re-bootstrapped retroactively.
- Operator workflow change: future events use `bootstrap_event.py` instead of copy-paste-edit.
- Documentation update: README adds a "Adding a new event" section pointing at the CLI.

## Open Questions

- Should `bootstrap_event.py` also generate the `<slug>/sw.js` cache list, or does that stay manual? Current `sw.js` files have explicit cache entries; auto-generating from a directory walk would centralize the pattern but couples the bootstrap to the runtime cache strategy.
- Where does the optional "stats" subpage from proposal D live in the template? If D ships, the template needs an opt-in slot for it.
- Should organizer adapters live in a shared package eventually (e.g. published to PyPI) so other fan-guide projects can reuse them, or stay local to this repo?
