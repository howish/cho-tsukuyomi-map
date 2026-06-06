## ADDED Requirements

### Requirement: Single SQLite file as SSOT

The system SHALL persist every fetched X API tweet, user, and media object in a single SQLite file at `.x-api-data/mirror.sqlite` that serves as the canonical source of "what did the API ever return."

#### Scenario: Mirror created on first write

- **WHEN** the storage layer is invoked for the first time (no `mirror.sqlite` exists)
- **THEN** the layer creates the file with the schema applied and writes `pragma user_version = <current_schema_version>`

#### Scenario: Existing mirror loaded

- **WHEN** the storage layer is invoked and the file exists
- **THEN** the layer connects and verifies `pragma user_version` matches the expected schema version
- **AND** if the schema version is lower, the layer runs any pending migrations before accepting writes

#### Scenario: Mirror file lives outside git

- **GIVEN** `.gitignore` includes `.x-api-data/mirror.sqlite` and `.x-api-data/mirror.sqlite-journal`
- **WHEN** `git status` is run on a fresh checkout after a pull
- **THEN** the mirror file does not appear as a tracked or untracked change

### Requirement: Canonical schema

The mirror SHALL define tables `posts`, `users`, `user_snapshots`, `media`, and `pull_state` plus an FTS5 virtual table `posts_fts` mirroring `posts.text`. Per howish 2026-06-06: schema includes a `platform` column from day one so future Plurk/Threads/FB code paths can plug in without migration, even though only the X code path is implemented in this change.

#### Scenario: Posts table shape

- **GIVEN** the schema is applied
- **THEN** `posts` has columns: `id TEXT NOT NULL`, `platform TEXT NOT NULL`, `user_id TEXT NOT NULL`, `created_at TEXT NOT NULL`, `text TEXT NOT NULL`, `in_reply_to_user_id TEXT NULL`, `raw_json TEXT NOT NULL`, `fetched_at TEXT NOT NULL`, with composite PRIMARY KEY `(platform, id)` so the same id space can coexist across platforms
- **AND** an index on `(platform, user_id, created_at DESC)` exists for "latest by user" lookups

#### Scenario: Users table shape (current state)

- **GIVEN** the schema is applied
- **THEN** `users` has columns: `id TEXT NOT NULL`, `platform TEXT NOT NULL`, `username TEXT NOT NULL`, `name TEXT NULL`, `bio TEXT NULL`, `follower_count INTEGER NULL`, `following_count INTEGER NULL`, `verified INTEGER NULL`, `raw_json TEXT NOT NULL`, `fetched_at TEXT NOT NULL`, with composite PRIMARY KEY `(platform, id)` and UNIQUE constraint on `(platform, username)`
- **AND** each row holds the most recent observation; per-fetch history lives in `user_snapshots`

#### Scenario: User snapshots table shape (history)

- **GIVEN** the schema is applied
- **THEN** `user_snapshots` has columns: `rowid INTEGER PRIMARY KEY AUTOINCREMENT`, `user_id TEXT NOT NULL`, `platform TEXT NOT NULL`, `fetched_at TEXT NOT NULL`, `name TEXT NULL`, `bio TEXT NULL`, `follower_count INTEGER NULL`, `following_count INTEGER NULL`, `verified INTEGER NULL`, `raw_json TEXT NOT NULL`, with UNIQUE constraint on `(user_id, platform, fetched_at)` and FOREIGN KEY `(user_id, platform)` REFERENCES `users(id, platform)`
- **AND** an index on `(user_id, fetched_at DESC)` enables "follower trend for @X" queries

#### Scenario: New row appended on user upsert when fields changed

- **GIVEN** the current `users` row for `@RinHuei` has `follower_count = 1000`
- **WHEN** a new pull observes `follower_count = 1010`
- **THEN** the storage layer updates the `users` row to the new values
- **AND** appends a new `user_snapshots` row capturing the observation at the pull's `fetched_at`
- **AND** if no tracked field (name / bio / follower_count / following_count / verified) changed from the most recent snapshot, no new snapshots row is inserted (avoid bloat from identical observations)

#### Scenario: Media table shape

- **GIVEN** the schema is applied
- **THEN** `media` has columns: `media_key TEXT NOT NULL`, `platform TEXT NOT NULL`, `post_id TEXT NOT NULL`, `type TEXT NOT NULL`, `url TEXT NULL`, `raw_json TEXT NOT NULL`, with composite PRIMARY KEY `(platform, media_key)` and FOREIGN KEY `(platform, post_id)` REFERENCES `posts(platform, id)`

#### Scenario: Pull state table shape

- **GIVEN** the schema is applied
- **THEN** `pull_state` has columns: `user_id TEXT NOT NULL`, `platform TEXT NOT NULL`, `last_pull_iso TEXT NOT NULL`, `last_post_id TEXT NULL`, `silent_streak INTEGER NOT NULL DEFAULT 0`, with composite PRIMARY KEY `(platform, user_id)` and FOREIGN KEY `(platform, user_id)` REFERENCES `users(platform, id)`

#### Scenario: Full-text search availability

- **GIVEN** the schema is applied
- **WHEN** a caller runs `SELECT id FROM posts_fts WHERE posts_fts MATCH '新刊'`
- **THEN** the query returns matching tweet ids without scanning the full table

### Requirement: Idempotent upsert semantics

The system SHALL allow callers to insert the same tweet, user, or media object multiple times without raising errors or duplicating rows.

#### Scenario: Re-inserting a tweet

- **GIVEN** the mirror already contains a tweet with `id = "1234"`
- **WHEN** the storage layer is asked to insert the same tweet again (e.g. due to pagination overlap)
- **THEN** the existing row is updated with the latest `raw_json` and `fetched_at`
- **AND** no UNIQUE-violation error is raised

#### Scenario: User upsert preserves first-seen fields

- **GIVEN** a user `@RinHuei` is already in the mirror
- **WHEN** the storage layer is asked to upsert the user record
- **THEN** the row's `raw_json` and `fetched_at` are refreshed but the primary `id` is unchanged

### Requirement: Bulk-write performance

The system SHALL support inserting thousands of tweets in a single transaction without significant performance degradation.

#### Scenario: Migration of existing raw/ dumps

- **WHEN** the one-shot migrator runs against ~50K tweets across all raw/ JSON dumps
- **THEN** the entire ingest completes within 60 seconds on a development laptop
- **AND** the resulting mirror is well-formed and queryable

#### Scenario: Atomic batch insert

- **GIVEN** a recon pull returns 100 new tweets from one user
- **WHEN** the storage layer writes them
- **THEN** the writes happen inside one transaction; either all 100 land or none do
