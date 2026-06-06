## ADDED Requirements

### Requirement: Per-event stats page at `<slug>/stats/`

The system SHALL provide an HTML/JS page at `<slug>/stats/` that fetches `<slug>/stats.json` and renders the metrics.

#### Scenario: Page loads stats.json

- **WHEN** a visitor opens `https://yachi8000.app/if7-2026-05/stats/`
- **THEN** the page fetches `../stats.json` and renders all top-level sections
- **AND** if `stats.json` is missing or malformed, the page shows a friendly "Stats are not yet available for this event" message rather than a JS error

#### Scenario: Page is consistent with the event guide

- **GIVEN** the parent event guide at `<slug>/` uses the project's shared `hub.css` + per-event theme color
- **THEN** the stats page reuses the same CSS variables and looks like a natural sub-page
- **AND** a "← back to event guide" link sits at the top

### Requirement: Inline SVG visualizations

The page SHALL render charts via inline SVG (no chart library dependency).

#### Scenario: Bar chart for CP distribution

- **WHEN** rendering the top 20 CPs
- **THEN** the page emits an SVG `<svg>` block with one `<rect>` per CP, horizontally laid out with labels
- **AND** the bar lengths are proportional to the CP's booth count
- **AND** the rendering does not pull any external script

#### Scenario: Pie/donut chart for platform distribution

- **WHEN** rendering platform shares
- **THEN** the page emits an SVG donut chart with one segment per platform
- **AND** the legend lists each platform name + percentage

#### Scenario: Tables where charts mislead

- **WHEN** the data is best expressed as a ranked list (e.g. multi-event circles, themes with ≤3 booths each)
- **THEN** the page renders a `<table>` with explicit column headers, not a chart

### Requirement: Honest about coverage

The page SHALL surface any caveats from the aggregator's `recon_coverage_notes` field.

#### Scenario: Coverage banner appears when notes exist

- **GIVEN** `stats.json` includes `recon_coverage_notes: ["50 booths lack body content", "完売 detection scanned 482 of 555 booths"]`
- **WHEN** the page renders
- **THEN** a banner at the top of the page lists those caveats so visitors understand the data's limits
- **AND** the banner is styled distinctly (e.g. amber background) so it doesn't blend into the rest of the page

#### Scenario: No banner when notes are empty

- **WHEN** `recon_coverage_notes` is an empty list
- **THEN** no banner is rendered

### Requirement: Page integrates into the event nav

The system SHALL add a "📊 Stats" link to each event's `<slug>/index.html` header that points at the stats page.

#### Scenario: Link visible on event guide

- **WHEN** a visitor opens `<slug>/`
- **THEN** the header nav contains a "📊 Stats" link
- **AND** the link is only present for events where `<slug>/stats.json` exists (skip for events without computed stats)

#### Scenario: Hub root advertises stats

- **WHEN** a visitor opens the site root `/`
- **THEN** events that have stats computed display a small "📊 Stats" badge next to their hub card
