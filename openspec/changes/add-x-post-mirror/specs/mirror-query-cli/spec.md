## ADDED Requirements

### Requirement: Offline triage by event

The system SHALL provide a `scripts/query_mirror.py triage <slug> [--keywords k1,k2,...]` command that produces an event-relevant digest without invoking the X API.

#### Scenario: Triage produces digest

- **GIVEN** the mirror contains tweets for all IF7 booths' authors
- **WHEN** the operator runs `query_mirror.py triage if7-2026-05`
- **THEN** the script reads the event's data.js to find each booth's author, queries `posts_fts` for tweets matching the event keyword set, and emits a digest to stdout
- **AND** the digest format matches the existing `doujin-circle-recon triage` skill output so downstream consumers don't break
- **AND** no `/users/` or `/users/{id}/tweets` X API call is made during this run

#### Scenario: Custom keywords override defaults

- **WHEN** the operator runs `query_mirror.py triage if7-2026-05 --keywords '完売,通販'`
- **THEN** only those two keywords drive the FTS5 query
- **AND** any default keyword list (新刊 / お品書き / 場後 etc.) is bypassed

### Requirement: Offline diff between pulls

The system SHALL provide a `query_mirror.py diff <slug> --since <iso>` command that lists tweets fetched after a given timestamp.

#### Scenario: Diff finds new tweets

- **WHEN** the operator runs `query_mirror.py diff if7-2026-05 --since 2026-06-04T00:00:00Z`
- **THEN** the script returns tweets where `fetched_at >= 2026-06-04T00:00:00Z` and the author belongs to the IF7 event
- **AND** the output is suitable for piping into downstream body-update workflows

#### Scenario: Diff with --created-since flag

- **WHEN** the operator passes `--created-since` instead of `--since`
- **THEN** the script filters by `created_at` (when the tweet was authored) instead of `fetched_at` (when the mirror saw it)
- **AND** the operator can use this to ask "what posts have happened since the event ended" regardless of pull cadence

### Requirement: Full-text search across the corpus

The system SHALL provide a `query_mirror.py search <query>` command that returns tweets matching the FTS5 expression, with optional filters for event slug and time range.

#### Scenario: Search by keyword

- **WHEN** the operator runs `query_mirror.py search '超ツクヨミ'`
- **THEN** the script returns the matching tweets in newest-first order with author handle, created_at, and snippet

#### Scenario: Search scoped to one event

- **WHEN** the operator runs `query_mirror.py search '完売' --event if7-2026-05`
- **THEN** the script restricts results to authors that appear in IF7's booth roster

### Requirement: Body extraction queries

The system SHALL provide a `query_mirror.py body <booth_id> --event <slug>` command that emits structured signals (新刊 / お品書き / 完売 etc.) for a single booth.

#### Scenario: Body signals for one booth

- **WHEN** the operator runs `query_mirror.py body S-39 --event if7-2026-05`
- **THEN** the script returns a JSON object with categorized signals: `{ "shinkan": [...], "oshinagaki": [...], "kanbai": [...], "tsuhan": [...], "next_event": [...] }` each a list of tweet excerpts
- **AND** the output is consumable by the existing body-update LLM workflow

### Requirement: CLI parity with existing recon skill

The system SHALL expose every offline-able operation that the `doujin-circle-recon` skill provides, so the skill can prefer the mirror over the X API.

#### Scenario: Skill prefers mirror

- **GIVEN** the doujin-circle-recon skill is invoked for triage / diff
- **WHEN** `mirror.sqlite` exists and is non-empty
- **THEN** the skill's subcommands first try the mirror via `query_mirror.py` and only fall through to the X API if the mirror returns no results for a given author
- **AND** the fall-through behavior is logged so the operator can see "mirror miss for @SomeBooth, falling back to API"
