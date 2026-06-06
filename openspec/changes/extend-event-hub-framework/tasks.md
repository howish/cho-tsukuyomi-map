## 1. Scaffold the CLI module

- [ ] 1.1 Create `scripts/bootstrap_event.py` with argparse skeleton (flags: --slug, --organizer, --url, --date, --venue, --display-name, --official-url, --theme-color, --refresh-template, --refresh-source, --allow-past)
- [ ] 1.2 Add Jinja2 to `requirements.txt` (or document install if no requirements file exists)
- [ ] 1.3 Implement slug validation (kebab-case + `-YYYY-MM` suffix pattern)
- [ ] 1.4 Implement date validation (warn-but-proceed-on-past-with-flag)

## 2. Build the adapter contract + first two adapters

- [ ] 2.1 Create `scripts/adapters/__init__.py` defining the `BoothScaffold` TypedDict
- [ ] 2.2 Implement `scripts/adapters/ketcom.py` (Shift-JIS CGI parser, mirrors the existing recon skill's ketcom logic)
- [ ] 2.3 Implement `scripts/adapters/gjs.py` (extract `var circleData = [...]` from `circle-list-if.js`; reuse the parser written for the IF7 social-restore patch)
- [ ] 2.4 Implement `scripts/adapters/doujin_tw.py` (BeautifulSoup parser for convention pages)
- [ ] 2.5 Wire ADAPTERS dict in `bootstrap_event.py` with explicit imports
- [ ] 2.6 Add a unit test (`tests/test_adapters.py`) that runs each adapter against a fixture HTML/JS snapshot stored under `tests/fixtures/`

## 3. Build the template tree

- [ ] 3.1 Create `scripts/templates/event/` directory
- [ ] 3.2 Copy `if7-2026-05/index.html` into the template, replacing event-specific values with `{{slot}}` placeholders (event_slug, event_display_name, event_date, event_venue, official_url, theme_color, og_description)
- [ ] 3.3 Repeat 3.2 for `filters.js` (slot: tag list)
- [ ] 3.4 Repeat 3.2 for `sw.js` (slot: cache name + cache list; cache list stays manual for now per open question)
- [ ] 3.5 Repeat 3.2 for `manifest.json` (slot: short_name, theme_color, name)
- [ ] 3.6 Write a placeholder `icon.svg` template (slot: event short name + theme color)
- [ ] 3.7 Write the `event.js` template (slot: every metadata field)

## 4. Implement the render + merge engine

- [ ] 4.1 Implement template render via Jinja2 with HTML autoescape, write to slug directory
- [ ] 4.2 Implement `<slug>/.bootstrap-state.json` writer (records SHA-256 of every generated file)
- [ ] 4.3 Implement hand-edit detection (compare current file SHA to stored SHA; mark as "operator-touched" if different)
- [ ] 4.4 Implement initial bootstrap path: fail if slug directory already exists (without --refresh flag)
- [ ] 4.5 Implement `--refresh-template`: rerender all template files except operator-touched ones; print summary diff
- [ ] 4.6 Implement booth merge logic for data.js: match by circle_name → link → new booth; preserve manual fields (body, cover_urls, tags, cps); annotate removed-from-source booths
- [ ] 4.7 Implement `--refresh-source`: re-fetch source URL stored in event.js, run adapter, merge into data.js
- [ ] 4.8 Append slug to root-level `events.json` (idempotent — skip if already present)

## 5. Wire recon pipeline integration

- [ ] 5.1 Verify `scripts/extract_circles.py` picks up the new event directory automatically (it iterates `<slug>/data.js` by glob — no change needed; verify manually with a test bootstrap)
- [ ] 5.2 Verify `scripts/pull_timelines.py` resolves x_handles for the new event via circles.json lookup (already does — verify only)
- [ ] 5.3 Update `~/.claude/skills/doujin-circle-recon/bin/run.sh bootstrap` to delegate to `bootstrap_event.py` (thin wrapper that translates skill flags to CLI flags)

## 6. End-to-end validation

- [ ] 6.1 Bootstrap a throwaway event (`test-event-2026-12`) against a small ketcom URL; verify generated directory is well-formed and loads in browser
- [ ] 6.2 Bootstrap a throwaway event against the IF7 GJS source; verify ~555 booths land in data.js, circle_names render correctly
- [ ] 6.3 Manually edit one booth's body in the test event's data.js, then run `--refresh-source` — verify the body is preserved
- [ ] 6.4 Add a new template slot (e.g. analytics snippet) and run `--refresh-template` against the test event — verify it propagates; run against a non-test event — verify operator-touched files are skipped
- [ ] 6.5 Delete the test event directory + entry from events.json (cleanup)

## 7. Documentation

- [ ] 7.1 Add a "Adding a new event" section to the repo README pointing at the CLI with worked example
- [ ] 7.2 Document the adapter contract in `scripts/adapters/README.md` with a "how to add a new organizer" recipe
- [ ] 7.3 Add a CLAUDE.md note for future sessions about the bootstrap_event.py workflow so it gets discovered next time a new event is needed
