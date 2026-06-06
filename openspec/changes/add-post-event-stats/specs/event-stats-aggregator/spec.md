## ADDED Requirements

### Requirement: Single command produces per-event stats.json

The system SHALL provide a `scripts/compute_event_stats.py <slug>` command that aggregates data.js + circles.json + (when present) the post-mirror into a `<slug>/stats.json` file.

#### Scenario: Run against an event with data

- **WHEN** the operator runs `scripts/compute_event_stats.py if7-2026-05`
- **THEN** the script writes `if7-2026-05/stats.json` containing every metric defined by the schema below
- **AND** the file is valid JSON loadable by the page renderer
- **AND** rerunning with no new inputs produces a byte-identical output (deterministic)

#### Scenario: Run against a slug with no data.js

- **WHEN** the operator runs `scripts/compute_event_stats.py nonexistent-slug`
- **THEN** the script exits non-zero with a clear "data.js not found" error
- **AND** no `stats.json` is written

### Requirement: Canonical metrics schema

The `stats.json` SHALL include the following top-level keys, computed per event:

- `summary`: total booths, total members, total events the venue hosted before, coverage (% of booths with recon body content)
- `sellout`: count and percentage of circles whose body contains 完売 / 完售 keywords; broken down by booth row (J/K/L/...)
- `new_vs_existing_books`: count of 新刊 mentions vs 既刊 mentions across all bodies
- `cp_distribution`: top 20 CPs (couplings) by booth count; long-tail summarized
- `theme_distribution`: top 20 themes / series by booth count
- `platform_distribution`: count of circles by primary social platform (X / Plurk / FB / IG / Threads / doujin_tw / aggregator / generic)
- `multi_event_circles`: list of circles appearing in 2+ events on the site (cross-event continuity signal)
- `recon_coverage_notes`: caveats on data freshness and any per-row sampling gaps

#### Scenario: Metrics schema is documented in code

- **GIVEN** the operator opens `scripts/compute_event_stats.py`
- **THEN** the metric definitions live as named functions with docstrings (e.g. `def compute_sellout(booths) -> dict`) so future contributors can add or refine without re-reading the whole script

#### Scenario: Missing data is reported, not silently dropped

- **WHEN** a metric depends on input that isn't present (e.g. 完売 detection needs body text but body is empty for 50 booths)
- **THEN** the metric is computed against what's available and the `recon_coverage_notes` field lists what was skipped and why

### Requirement: Re-use of the post-mirror when present

When the post-mirror skill is installed and contains rows for this event's authors, the aggregator SHALL prefer SQL queries against the mirror over re-parsing body markdown for raw-tweet-derived metrics.

#### Scenario: Mirror present accelerates 完売 detection

- **GIVEN** `~/.claude/skills/post-mirror/` is installed and the mirror contains tweets from IF7 authors
- **WHEN** `compute_event_stats.py if7-2026-05` runs
- **THEN** the aggregator queries `posts_fts MATCH '完売 OR 完售'` filtered to event authors instead of grepping body markdown
- **AND** the result includes a `_meta.source` field noting "mirror" so downstream consumers know the provenance

#### Scenario: Mirror absent — fallback to body markdown

- **WHEN** the mirror is not installed or empty
- **THEN** the aggregator falls back to scanning body markdown in data.js
- **AND** `_meta.source` reports "body-markdown"
- **AND** the metric values are still produced (degraded coverage but never failure)

### Requirement: Hook for incremental refresh

The system SHALL detect whether the input has changed since the last run and skip recomputation if not.

#### Scenario: Up-to-date short-circuit

- **GIVEN** `<slug>/stats.json` exists and a `<slug>/.stats-state.json` records the SHA-256 of data.js + circles.json at the time of the last run
- **WHEN** `compute_event_stats.py <slug>` runs and the input SHAs match
- **THEN** the script exits 0 with message "stats up-to-date" and does no further work

#### Scenario: --force ignores the cache

- **WHEN** the operator runs `compute_event_stats.py <slug> --force`
- **THEN** recomputation happens regardless of cache state
