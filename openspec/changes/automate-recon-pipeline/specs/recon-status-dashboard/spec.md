## ADDED Requirements

### Requirement: Status page at `/recon-status/`

The system SHALL provide an HTML page at `/recon-status/` that shows the current state of the recon pipeline.

#### Scenario: Page loads from a static JSON

- **WHEN** a visitor opens `https://yachi8000.app/recon-status/`
- **THEN** the page fetches `/recon-status.json` (written by the workflow) and renders:
  - Per-event: last successful pull time, signal count from last round, total signals all-time, current cadence band (daily / 2-day / weekly / archived)
  - Cumulative-spend gauge for the current month + cap
  - Last 10 rounds across all events with delta counts

#### Scenario: Page handles missing JSON gracefully

- **WHEN** `/recon-status.json` is missing (first deploy, never run, etc.)
- **THEN** the page shows a friendly "No recon data yet" message
- **AND** does not throw a JS error

### Requirement: Workflow writes status JSON every run

The system SHALL update `recon-status.json` at the end of every workflow run regardless of whether the run produced deltas.

#### Scenario: Status updated on zero-delta run

- **WHEN** a recon round completed with zero deltas
- **THEN** the per-event `last_pull_time` is still updated to the round's UTC timestamp
- **AND** the cadence band is recomputed in case the event date passed a threshold

#### Scenario: Status JSON schema

- **GIVEN** the JSON file exists
- **THEN** its shape is:
  ```
  {
    "generated_at": "ISO",
    "events": [
      {
        "slug": "...",
        "display_name": "...",
        "event_date": "...",
        "cadence_band": "daily" | "2day" | "weekly" | "archived",
        "last_pull_iso": "...",
        "last_round_signal_count": N,
        "all_time_signal_count": N
      }
    ],
    "budget": {
      "month": "YYYY-MM",
      "cap_usd": ...,
      "spent_usd": ...,
      "ratio": 0.0
    },
    "recent_rounds": [
      { "event_slug": "...", "ran_at": "...", "delta_count": N, "outcome": "ok" | "budget-paused" | "error" }
    ]
  }
  ```

### Requirement: Status page is publicly accessible

The system SHALL serve `/recon-status/` from the same static site host as the rest of yachi8000.app — no auth, no opt-in.

#### Scenario: Status page surfaced from hub

- **WHEN** a visitor opens the site root
- **THEN** a small text link "🔍 Recon status" appears in the hub footer or about section
- **AND** clicking it lands on `/recon-status/`

#### Scenario: Status JSON is also publicly fetchable

- **WHEN** a third party (developer / curious user) fetches `https://yachi8000.app/recon-status.json`
- **THEN** the JSON is served with `Content-Type: application/json` and CORS headers permissive enough for ad-hoc dashboards
