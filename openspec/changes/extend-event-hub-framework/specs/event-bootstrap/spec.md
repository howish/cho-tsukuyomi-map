## ADDED Requirements

### Requirement: Single-command event scaffolding

The system SHALL provide a `scripts/bootstrap_event.py` CLI that creates a complete event directory from one invocation.

#### Scenario: Bootstrap from ketcom format

- **WHEN** the operator runs `bootstrap_event.py --slug yaoyoro-2026-09 --organizer ketcom --url 'https://ketto.xsrv.jp/.../clist.cgi?pr2,XXX' --date 2026-09-15 --venue '立川クリエイティブスペース' --display-name 'ヤオヨロー！2'`
- **THEN** the script creates `yaoyoro-2026-09/` containing `data.js` (with parsed booths), `event.js`, `index.html`, `filters.js`, `sw.js`, `manifest.json`, `icon.svg`
- **AND** the script appends the slug to `events.json` so circles.js picks it up on next extract
- **AND** the script prints a summary: "Created 32 booths, recon-ready: yes"

#### Scenario: Bootstrap from GJS format

- **WHEN** the operator runs `bootstrap_event.py --slug if8-2026-11 --organizer gjs --url 'https://if.gjs.tw/circle-list.html' --date 2026-11-15 --venue '台北花博' --display-name 'IF8'`
- **THEN** the script fetches the official `circle-list-if.js`, parses 555+ entries, and scaffolds the event directory

#### Scenario: Bootstrap rejects unknown organizer

- **WHEN** the operator runs `bootstrap_event.py --organizer pluto --url ...`
- **THEN** the script exits non-zero with message: "Unknown organizer 'pluto'. Available: ketcom, gjs, doujin_tw"
- **AND** no event directory is created

### Requirement: Idempotent re-bootstrap

The system SHALL support re-running bootstrap against an existing event slug without destroying manual edits.

#### Scenario: Re-bootstrap preserves edited bodies

- **GIVEN** event `if8-2026-11` already exists with manual `body` edits on 30 booths
- **WHEN** the operator re-runs bootstrap_event.py with the same slug and a refreshed source URL
- **THEN** the script merges new booth entries from the source into `data.js`
- **AND** existing booths retain their `body`, `cover_urls`, and `tags` fields
- **AND** booth_id changes from the source are flagged in stdout as "booth_id changed: J-05 → J-07 (was: 嘉華 圍牆); please confirm"

#### Scenario: Re-bootstrap detects removed booths

- **WHEN** a booth that existed in a prior bootstrap is no longer in the source URL
- **THEN** the script keeps the booth entry but adds `"removed_from_source": true` to it
- **AND** prints a summary count of removed booths

### Requirement: Recon pipeline wiring

The system SHALL register newly bootstrapped events with the existing recon scripts so they can be pulled / triaged without manual intervention.

#### Scenario: New event flows into pull_timelines

- **WHEN** the operator bootstraps a new event with slug `<X>`
- **AND** then runs `python3 scripts/pull_timelines.py <X>`
- **THEN** the script finds every booth's x_handle (via circles.json lookup), pulls timelines, and writes to `.x-api-data-<X>/raw/`
- **AND** no manual code edit was needed to make this work

#### Scenario: New event flows into doujin-circle-recon skill

- **WHEN** the operator bootstraps event slug `<X>`
- **AND** then invokes `~/.claude/skills/doujin-circle-recon/bin/run.sh triage <X>`
- **THEN** the skill produces a triage digest without modifications

### Requirement: Event metadata input validation

The system SHALL validate event metadata before writing any files.

#### Scenario: Slug must be kebab-case-with-date

- **WHEN** the operator passes `--slug InvalidName`
- **THEN** the script exits with message: "Slug must match pattern `<name>-<YYYY>-<MM>` (e.g. yaoyoro-2026-09)"

#### Scenario: Date must be future or current

- **WHEN** the operator passes `--date 2024-01-15` (past)
- **THEN** the script warns "Event date is in the past — bootstrap is intended for upcoming events" but proceeds if `--allow-past` flag is also passed
