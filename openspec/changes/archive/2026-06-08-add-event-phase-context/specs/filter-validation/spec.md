## ADDED Requirements

### Requirement: validator flags out-of-window date strings in booth bodies

The `filter-system validate` command SHALL scan every booth body for date strings (M/D, M月D日, YYYY-MM-DD, "本日 YYYY-MM-DD") and compute the minimum distance from each parsed date to any of the event's declared dates. When the minimum distance exceeds 60 days, the validator MUST emit an `out-of-window-date` finding (warn by default, error under `--strict`). The finding MUST identify the booth_id, the offending date string, the computed distance, and a short surrounding excerpt.

#### Scenario: a date 100+ days from the event triggers the warning

- **GIVEN** event `tsukuyomi-square-2026-06` with date `2026-06-21`
- **AND** a booth body contains the phrase `2026-01-15 の即売会で …`
- **WHEN** the user runs `filter-system validate tsukuyomi-square-2026-06`
- **THEN** the validator emits an `out-of-window-date` finding citing `2026-01-15` at distance > 60 days

#### Scenario: --strict promotes out-of-window-date to error exit

- **GIVEN** any booth body that triggers an `out-of-window-date` finding
- **WHEN** the user runs `filter-system validate <event> --strict`
- **THEN** the command exits non-zero

#### Scenario: dates inside the natural window do not flag

- **GIVEN** event `tsukuyomi-square-2026-06` with date `2026-06-21`
- **AND** a booth body contains `2026-06-21 当日 A-01 配置`
- **WHEN** the validator runs
- **THEN** no `out-of-window-date` finding is emitted for that booth

> **Note on the 60-day threshold**: this is a conservative cap intended to catch flagrantly misattributed dates (e.g. 2026-01 content in a 2026-06 event). A tighter cap would conflict with legitimate `far_pre` announcements (a 2026-06 event may legitimately mention "5/24 の超ツクで…"). The cross-event mention itself is the agent's responsibility to gate (via `this_event_confidence`); the validator is the safety net for residual leaks. Threshold can be tuned per-event later if proven too loose.
