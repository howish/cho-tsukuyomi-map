## MODIFIED Requirements

### Requirement: classify-prep passes the event slug through to post-mirror

The system SHALL invoke `post-mirror query body` with `--event <slug>` whenever it fetches X buckets for an event's booths. The resulting `event_context` block on every post MUST be preserved verbatim in the per-chunk JSON bundles. Bundles SHALL also carry `event_date_window` at the top level so the agent can re-interpret `time_phase` without external lookups.

#### Scenario: classify-prep bundle carries event_context

- **GIVEN** an event slug `yaoyoro-2026-06`
- **WHEN** the user runs `filter-system classify-prep yaoyoro-2026-06 --chunks 4`
- **THEN** each `chunk-N.json` contains booths whose `x_buckets.*` posts include the `event_context` object
- **AND** the chunk JSON has `event_date_window` at the top level

### Requirement: classify + body-update prompts honor this_event_confidence

The system's classification prompt (`CLASSIFY_PROMPT.md`) and body-update prompt template MUST include a "Using `event_context`" section stating: (a) `high` posts may be used freely, (b) `med` posts may be used but with hedged wording, (c) `low` posts MUST NOT be used as evidence for the current event's body or tags, (d) `none` posts MUST be skipped. The prompt MUST explicitly call out the failure mode "場後 / 当日 / 本日完売 phrasing tied to a date that resolves to a different event" and instruct agents not to copy such phrasing into the current event's body.

#### Scenario: prompt rejects low-confidence cross-event content

- **GIVEN** the classify prompt and a post with `this_event_confidence: "low"` whose text says `本日 2026-06-07 完売御礼`
- **AND** the current event is `tsukuyomi-square-2026-06` (date `2026-06-21`)
- **WHEN** the agent applies prompt rules
- **THEN** the agent's output does NOT include `本日完売` or `2026-06-07` in the tsukusquare booth's body
- **AND** the agent does NOT add a `soldout` warning sourced from that post

#### Scenario: prompt accepts high-confidence content regardless of timing

- **GIVEN** the classify prompt and a post 45 days before event date with text `6/21 ツクスク A-01 新刊『○○』予定`
- **AND** the post's `this_event_confidence == "high"`
- **WHEN** the agent applies prompt rules
- **THEN** the agent may use the post as evidence for the booth's body

#### Scenario: prompt hedges on medium-confidence content

- **GIVEN** a post with `this_event_confidence: "med"` saying `新刊作業中`
- **WHEN** the agent applies prompt rules
- **THEN** the agent may mention "新刊作業中" but does NOT claim a confirmed new book until other evidence corroborates
