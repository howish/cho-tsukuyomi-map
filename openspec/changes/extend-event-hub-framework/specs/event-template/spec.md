## ADDED Requirements

### Requirement: Single template tree drives all events

The system SHALL maintain a single template directory at `scripts/templates/event/` that the bootstrap script copies into every new event slug, with `{{slot}}` placeholders for per-event values.

#### Scenario: Template files exist

- **GIVEN** the bootstrap script runs
- **THEN** it copies the following from `scripts/templates/event/` into the new slug directory: `index.html`, `filters.js`, `sw.js`, `manifest.json`, `icon.svg`
- **AND** the operator does not need to manually duplicate any of these

#### Scenario: Slot fills are explicit

- **GIVEN** a template file contains placeholders like `{{event_slug}}`, `{{event_display_name}}`, `{{event_date}}`, `{{event_venue}}`, `{{official_url}}`, `{{theme_color}}`
- **WHEN** the bootstrap script renders the template
- **THEN** every placeholder is replaced with a real value supplied via CLI flags or computed from inputs
- **AND** if a required placeholder has no input, the script fails fast with a clear error listing the missing fields

### Requirement: Template changes propagate via documented refresh path

The system SHALL document how operators apply template updates to existing events.

#### Scenario: Operator updates the template's index.html

- **GIVEN** the operator modifies `scripts/templates/event/index.html` (e.g. adds a new analytics snippet)
- **WHEN** the operator runs `bootstrap_event.py --refresh-template <slug>` against each existing event
- **THEN** the script re-renders ONLY the template-owned files (those without manual edits since bootstrap) and skips any file the operator has touched
- **AND** prints a diff summary of what changed

### Requirement: event.js stays per-event, generated once

The system SHALL treat `<slug>/event.js` as per-event metadata (date, venue, organizer, recon_source_url, official_url) generated once at bootstrap and considered manually-edited afterward.

#### Scenario: Bootstrap creates initial event.js

- **WHEN** bootstrap runs with `--date 2026-09-15 --venue '立川' --display-name 'X' --official-url 'https://...'`
- **THEN** `<slug>/event.js` is written with all those values populated and stored in a stable shape
- **AND** future `--refresh-template` runs do not overwrite event.js

#### Scenario: Operator can edit event.js post-bootstrap

- **GIVEN** the operator hand-edits `<slug>/event.js` to fix a date or venue
- **WHEN** the operator re-runs bootstrap_event.py with the same slug
- **THEN** event.js is preserved unchanged

### Requirement: Generated icon.svg defaults to event-theme placeholder

The system SHALL emit a placeholder `icon.svg` per event that the operator can later replace with custom art.

#### Scenario: Default icon is rendered

- **WHEN** bootstrap runs
- **THEN** `<slug>/icon.svg` is a simple themed placeholder showing the event short name on the event's theme color background
- **AND** the file is small (< 2KB) and standalone

#### Scenario: Operator overrides with custom SVG

- **GIVEN** the operator replaces `<slug>/icon.svg` with custom art
- **WHEN** the operator re-runs `--refresh-template`
- **THEN** the custom `icon.svg` is preserved
