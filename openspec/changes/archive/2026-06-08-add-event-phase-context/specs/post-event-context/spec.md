## ADDED Requirements

### Requirement: post-mirror query body annotates posts with event-relative context when an event is named

The system SHALL accept an `--event <slug>` flag on `post-mirror query body`. When set, the system MUST resolve the slug against `events.json`, then attach an `event_context` object to every post in the returned buckets. The object MUST include `time_phase`, `mentions`, and `this_event_confidence`. When `--event` is omitted, the system MUST return the existing shape unchanged.

#### Scenario: --event flag attaches event_context

- **GIVEN** the mirror has a post from `@foo` created `2026-06-07T12:00:00Z`
- **AND** `events.json` declares `tsukuyomi-square-2026-06` on `2026-06-21`
- **WHEN** the user runs `post-mirror query body --event tsukuyomi-square-2026-06 --username @foo`
- **THEN** every post in the output's buckets has an `event_context` object
- **AND** the object has the keys `time_phase`, `mentions`, `this_event_confidence`

#### Scenario: --event flag omitted preserves legacy shape

- **GIVEN** any post mirror state
- **WHEN** the user runs `post-mirror query body --username @foo` (no `--event`)
- **THEN** the output shape matches the pre-change behavior
- **AND** no `event_context` is added

### Requirement: time_phase reflects post timestamp relative to event date

The system SHALL compute `time_phase` as one of `far_pre`, `pre`, `during`, `post`, `far_post`, using the windows: `far_pre` < E−60d, `pre` [E−60d, E_start), `during` [E_start, E_end + 24h], `post` (E_end + 24h, E_end + 14d], `far_post` > E_end + 14d. Multi-day events MUST use the full date span as `[E_start, E_end]`.

#### Scenario: post on event day classified as during

- **GIVEN** event date `2026-06-21`
- **AND** post created_at `2026-06-21T14:00:00+09:00`
- **WHEN** event_context is computed
- **THEN** `time_phase == "during"`

#### Scenario: post 7 days after event classified as post

- **GIVEN** event date `2026-06-07`
- **AND** post created_at `2026-06-14T10:00:00+09:00`
- **WHEN** event_context is computed
- **THEN** `time_phase == "post"`

#### Scenario: post 90 days before event classified as far_pre

- **GIVEN** event date `2026-06-21`
- **AND** post created_at `2026-03-23T10:00:00+09:00`
- **WHEN** event_context is computed
- **THEN** `time_phase == "far_pre"`

### Requirement: mentions extraction lists every event the post references

The system SHALL scan post text for: (a) any event's declared hashtags, (b) any event's `name` or `aliases` substrings, (c) any event's booth_id pattern co-occurring within ~50 chars of an event identifier, (d) date strings resolving inside any event's `[E_start, E_end]` window. Each detected event MUST appear exactly once in the resulting `mentions: [...]` list. Empty list when nothing matches.

#### Scenario: hashtag presence adds the event to mentions

- **GIVEN** event `yaoyoro-2026-06` declares hashtag `#ヤオヨロー`
- **AND** post text contains `#ヤオヨロー`
- **WHEN** mentions are extracted
- **THEN** the mentions list contains `yaoyoro-2026-06`

#### Scenario: alias substring adds the event to mentions

- **GIVEN** event `tsukuyomi-square-2026-06` declares alias `ツクスク`
- **AND** post text contains `今日のツクスクのために`
- **WHEN** mentions are extracted
- **THEN** the mentions list contains `tsukuyomi-square-2026-06`

#### Scenario: bare booth_id without event context does not add a mention

- **GIVEN** event `tsukuyomi-square-2026-06` booth_id pattern `[A-C]-\d{2}`
- **AND** event has no `unique_booth_prefix`
- **AND** post text contains only `B-01` with no surrounding event name, hashtag, or date
- **WHEN** mentions are extracted
- **THEN** the mentions list does NOT contain `tsukuyomi-square-2026-06`

#### Scenario: unique_booth_prefix alone adds the event to mentions

- **GIVEN** event `yaoyoro-2026-06` declares `unique_booth_prefix: "ヤオ-"`
- **AND** post text contains `ヤオ-04 で頒布`
- **WHEN** mentions are extracted
- **THEN** the mentions list contains `yaoyoro-2026-06` (no co-occurrence requirement)

#### Scenario: post mentioning two events lists both

- **GIVEN** post text says `ヤオヨロー終わった、来週ツクスク`
- **WHEN** mentions are extracted
- **THEN** the mentions list contains both `yaoyoro-2026-06` AND `tsukuyomi-square-2026-06`

### Requirement: this_event_confidence combines time_phase and mentions

The system SHALL compute `this_event_confidence` per the design's truth table: `high` when mentions include this event (regardless of time_phase), `low` when mentions exclude this event but include other events AND time_phase is `pre|during|post`, `none` when mentions exclude this event AND time_phase is `far_pre|far_post`, `med` when mentions are empty AND time_phase is `pre|during|post`, `low` when mentions are empty AND time_phase is `far_pre|far_post`.

#### Scenario: yaoyoro post 14 days before tsukusquare resolves to none

- **GIVEN** target event `tsukuyomi-square-2026-06` on `2026-06-21`
- **AND** post created_at `2026-06-07T18:00:00+09:00` with text `本日ヤオヨロー完売御礼`
- **WHEN** event_context is computed
- **THEN** `time_phase == "pre"` AND `mentions == ["yaoyoro-2026-06"]`
- **AND** `this_event_confidence == "low"`

#### Scenario: cross-event post counts as high for both events

- **GIVEN** post text `ヤオヨロー終わった、来週ツクスク も参加します`
- **WHEN** event_context is computed with target `yaoyoro-2026-06`
- **THEN** `this_event_confidence == "high"`
- **WHEN** event_context is computed with target `tsukuyomi-square-2026-06`
- **THEN** `this_event_confidence == "high"`

#### Scenario: no-mention pre-window post resolves to med

- **GIVEN** target event `tsukuyomi-square-2026-06` on `2026-06-21`
- **AND** post created_at `2026-06-17T10:00:00+09:00` with text `新刊作業中`
- **WHEN** event_context is computed
- **THEN** `time_phase == "pre"` AND `mentions == []` AND `this_event_confidence == "med"`

### Requirement: top-level event_date_window is exposed alongside per-post annotations

When `--event` is set, the system SHALL include `event_date_window: [E_start, E_end]` at the top level of the response, so consumers can re-interpret `time_phase` without re-reading events.json.

#### Scenario: single-day event window shows same start and end

- **GIVEN** event `yaoyoro-2026-06` on `2026-06-07`
- **WHEN** the user queries with `--event yaoyoro-2026-06`
- **THEN** the response includes `event_date_window: ["2026-06-07", "2026-06-07"]`

#### Scenario: multi-day event window spans the dates

- **GIVEN** event `comiket-c108` with `dates: ["2026-08-15", "2026-08-16"]`
- **WHEN** the user queries with `--event comiket-c108`
- **THEN** the response includes `event_date_window: ["2026-08-15", "2026-08-16"]`
