## ADDED Requirements

### Requirement: Per-user pull state drives start_time

The system SHALL maintain per-user pull state (`last_pull_iso`, `last_tweet_id`, `silent_streak`) and pass it to the X API timeline call so subsequent pulls return only tweets newer than the last known post.

#### Scenario: First-ever pull

- **GIVEN** the mirror has no `pull_state` row for user `@RinHuei`
- **WHEN** `pull_timelines.py` pulls this user
- **THEN** the call is made without `start_time` and falls back to the default limit (25)
- **AND** all returned tweets are inserted, and `pull_state` is created with `last_pull_iso = now`, `last_tweet_id = newest_returned_id`, `silent_streak = 0`

#### Scenario: Incremental pull skips already-seen tweets

- **GIVEN** the mirror's `pull_state` for `@RinHuei` has `last_pull_iso = "2026-06-05T10:00:00Z"`
- **WHEN** `pull_timelines.py` pulls this user the next day
- **THEN** the X API call includes `start_time = "2026-06-05T10:00:00Z"`
- **AND** only tweets posted after that timestamp are returned
- **AND** `pull_state.last_pull_iso` is updated to the new pull moment regardless of result count

#### Scenario: Empty pull updates state without adding rows

- **GIVEN** `@RinHuei` has posted nothing since the last pull
- **WHEN** the pull runs
- **THEN** zero rows are inserted into `posts`
- **AND** `pull_state.last_pull_iso` advances to the new pull moment
- **AND** `pull_state.silent_streak` increments by 1

### Requirement: Silent-streak back-off

The system SHALL skip pulling users whose silent-streak exceeds a configurable threshold on cadences faster than weekly.

#### Scenario: Silent streak triggers skip

- **GIVEN** `@SomeBooth` has `silent_streak = 3` (no new tweets in the last 3 pulls)
- **AND** the back-off threshold is 3 with weekly minimum cadence
- **WHEN** the daily pull job runs less than 7 days since the last pull for this user
- **THEN** `pull_timelines.py` skips this user without an API call
- **AND** logs to stderr `"skip silent: @SomeBooth (streak=3, next eligible 2026-06-12)"`

#### Scenario: Silent streak resets on new tweet

- **GIVEN** `@SomeBooth` has `silent_streak = 5`
- **WHEN** a pull finally returns 1 new tweet
- **THEN** `silent_streak` is reset to 0
- **AND** the user returns to the normal cadence

### Requirement: User-ID cache eliminates redundant lookups

The system SHALL look up `@handle → user_id` exactly once per handle by checking the mirror's `users` table before invoking the X API username resolver.

#### Scenario: Lookup hits cache

- **GIVEN** the `users` table has a row with `username = "RinHuei"` and `id = "12345"`
- **WHEN** `pull_timelines.py` is asked to pull `@RinHuei`
- **THEN** no `/users/by/username/RinHuei` API call is made; the resolver returns the cached id
- **AND** the call savings reduce X API spend by 1 read per pull per handle

#### Scenario: Lookup misses cache and populates it

- **GIVEN** the `users` table has no row for `@NewHandle`
- **WHEN** `pull_timelines.py` is asked to pull `@NewHandle`
- **THEN** the API resolves the username, the returned user object is upserted to `users`, and subsequent pulls hit the cache

### Requirement: Configurable pull policy

The system SHALL expose pull cadence + back-off configuration via simple flags or a small TOML/JSON file rather than hard-coded constants.

#### Scenario: Operator overrides back-off threshold

- **WHEN** the operator runs `pull_timelines.py <slug> --back-off-threshold 5`
- **THEN** users do not get skipped until their silent-streak exceeds 5
- **AND** the original default of 3 remains in effect for unflagged runs

#### Scenario: Operator forces a full re-fetch

- **WHEN** the operator runs `pull_timelines.py <slug> --force-full`
- **THEN** the script ignores `pull_state.last_pull_iso` for that run (no `start_time` argument), requests the default tweet count for every booth, and updates state at the end
- **AND** the operator can use this to recover when mirror state becomes inconsistent

#### Scenario: --force-full preserves silent_streak

- **GIVEN** `@SilentBooth` has `silent_streak = 4` (back-off active)
- **WHEN** the operator runs `pull_timelines.py <slug> --force-full`
- **THEN** the user IS pulled (the back-off check is bypassed by --force-full)
- **AND** the `silent_streak` counter is NOT reset to 0 by the act of force-full alone — it only resets if the forced pull actually returns ≥1 new post
- **AND** if the forced pull returns zero new posts, `silent_streak` increments to 5 as usual
- **AND** rationale: `silent_streak` reflects the user's actual posting activity, not operator intent; resetting on every force-full would defeat back-off (a cron with periodic force-full would never enter back-off)
