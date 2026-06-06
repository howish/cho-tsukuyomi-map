## ADDED Requirements

### Requirement: Cross-event page at `/stats/`

The system SHALL provide a top-level page at `/stats/` that compares metrics across every event with computed stats.

#### Scenario: Cross-event page enumerates available stats

- **GIVEN** events `cho-tsukuyomi-2026-05`, `if7-2026-05`, `yaoyoro-2026-06` each have `stats.json`
- **WHEN** a visitor opens `https://yachi8000.app/stats/`
- **THEN** the page fetches each event's `stats.json` and renders comparable metrics side by side
- **AND** events without `stats.json` are omitted from the comparison

### Requirement: Recurring-circle visibility

The page SHALL highlight circles that appear in multiple events ("multi-event circles") as the most useful cross-event signal.

#### Scenario: Multi-event circles list

- **WHEN** the page renders
- **THEN** a section lists every circle that appears in ≥2 events, sorted by participation count descending
- **AND** each row links to the circle's row in `/circles/` for deep dive
- **AND** the count includes the per-event booth IDs (so a visitor sees "ほっぺ食堂: 超ツク C-04, IF7 J-15, ヤオヨロー ヤオ-01")

#### Scenario: Single-event circles excluded

- **GIVEN** circle X has appeared in exactly 1 event
- **THEN** circle X is not shown in the multi-event section

### Requirement: Trend visualizations across time

The page SHALL render small line / bar charts comparing event-over-event:

- 完売率 trend
- 新刊 vs 既刊 ratio trend
- Total booth count trend
- Top-CP shifts (e.g. ヤチヨ × 彩葉 booth count per event)

#### Scenario: Sellout rate trend chart

- **WHEN** the page renders the sellout trend
- **THEN** an inline SVG line chart plots one point per event, x-axis = event date, y-axis = sellout %
- **AND** the chart degrades gracefully when only 1 event is available (renders as a single labeled dot)

#### Scenario: CP shift chart highlights movement

- **WHEN** a particular CP has gained or lost ≥3 booths between consecutive events
- **THEN** that CP gets called out in a "movement" section with a brief textual summary
- **AND** the summary identifies whether the count went up or down

### Requirement: Cross-event page is read-only and static-friendly

The page SHALL avoid any backend or server-side rendering — every visit serves static HTML/JS/JSON.

#### Scenario: Built into static deploy

- **GIVEN** the deploy pipeline serves the site from GitHub Pages
- **WHEN** the operator runs `scripts/compute_event_stats.py --all-events` then commits the resulting `stats.json` files
- **THEN** the next deploy serves `/stats/` with the updated trends without any runtime computation
