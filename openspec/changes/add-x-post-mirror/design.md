## Context

X API spend hit $81 over the May 7–June 6 window (1.08K requests yielding 15.41K post-reads, ~397 user lookups). The dominant cost driver is `pull_timelines.py` re-fetching the most-recent 25 tweets per booth on every recon round, regardless of whether the booth posted anything new since the last pull. With 96 IF7 booths × 25 tweets × ~25 reads each, a single full recon round is roughly $12-15. Multiply across cho-tsukuyomi + IF7 + yaoyoro plus refresh rounds before / after events, the $81/month number tracks.

The waste is structural: there is no per-handle "what's the newest tweet we already have" state. Adding that state — plus passing `start_time` to the X API timeline endpoint, which already supports it — flips the model from "fetch a fixed window every time" to "fetch only what's new since the last visit." For a booth that posts twice a week, daily incremental pulls cost ~2 reads instead of 25.

A complementary observation: every triage / diff invocation today re-parses the per-booth raw JSON dumps under `.x-api-data-<slug>/raw/`. That's correct but throws away easy structure — tweet text is sitting in JSON arrays without any cross-handle index, FTS, or temporal querying. Treating the corpus as a real database (SQLite + FTS5) gives massive UX wins on triage / diff / stats with no marginal cost since the data has to live somewhere anyway. Putting both ideas together: a mirror DB is both the cost optimization (incremental fetch state lives there) and the query speedup.

## Goals / Non-Goals

**Goals:**

- Reduce monthly X API spend by ~90% (target $5-10/month from current $81/month)
- Make triage / diff / search / body-extraction queries instant and offline
- Survive machine loss via R2 backup with `< 1 minute` recovery to a fresh checkout
- Maintain bit-for-bit compatibility with existing raw/ dump consumers during a verification window
- Provide a structured corpus that proposals D (stats) and C-RSS (delta) can build on without re-fetching

**Non-Goals:**

- No multi-platform mirror in this change — Threads / Plurk / doujin.com.tw stay separate for now. Schema is chosen so we can extend later, but this change is X-only
- No deprecation of `.x-api-data-<slug>/raw/*.json` here — coexistence until verify passes, deprecation deferred to a follow-up change
- No multi-machine simultaneous-write coordination — single-writer assumed (R2 sync is "push the result of one machine's work," not bidirectional replication)
- No row-level diff sync — `mirror.sqlite` is treated as one opaque object in R2

## Decisions

### Decision: SQLite (not DuckDB, not Parquet, not server DB)

- **Chosen:** SQLite with FTS5 extension, single file at `.x-api-data/mirror.sqlite`
- **Alternative considered:** DuckDB for analytical query speed; Parquet for columnar compression; PostgreSQL for "real" DB feel
- **Rationale:** SQLite is in Python stdlib (zero dependency). FTS5 covers the search use case without a search engine. The corpus scale (~50K rows total) sits comfortably inside SQLite's no-tuning sweet spot — DuckDB and Parquet's advantages don't surface until 100K+ rows or columnar analytical loads. A server DB introduces an entire operational footprint that this fan-guide project shouldn't need.

### Decision: One file, gitignored, R2 for durability

- **Chosen:** `.x-api-data/mirror.sqlite` gitignored, pushed to Cloudflare R2 after every successful write
- **Alternative considered:** Track in git (history + portability) vs git-lfs (size-friendly tracked) vs local-only
- **Rationale:** Tracking in git would balloon the repo history every recon round (the file changes every pull). git-lfs introduces a bandwidth cost on every clone. Local-only loses the file on machine death. R2 cleanly separates "code in git, data in object storage" with negligible cost (free tier covers this 100x over). howish confirmed R2 + gitignored 2026-06-06.

### Decision: start_time over since_id for incremental fetch

- **Chosen:** Use `start_time = pull_state.last_pull_iso` in X API timeline calls
- **Alternative considered:** Use `since_id = pull_state.last_tweet_id` (also supported by X API)
- **Rationale:** `start_time` works even when the most recent tweet was deleted (since_id of a deleted tweet returns errors). Time-based bounds are also more intuitive and survive mirror corruption (operator can reset state to "1 month ago" and pull whatever's missing). We still record `last_tweet_id` for diagnostic purposes — but the fetch driver is the timestamp.

### Decision: Silent-streak back-off with per-streak cadence

- **Chosen:** Track `silent_streak` per user, skip on daily cadence if `streak >= 3` until at least 7 days have passed since last pull; reset to 0 on any new tweet
- **Alternative considered:** Fixed cadence per booth (e.g. weekly, configured manually); no back-off
- **Rationale:** Many booths post once a month or less. Pulling them daily wastes ~30 reads per booth per month. The back-off rule is simple (no per-booth config drift), self-correcting (active booths stay active), and easy to override (`--force-full` flag). 3-streak threshold means a couple of quiet days don't trigger the cooldown; 7-day minimum cadence guarantees we never silently miss a comeback for more than a week.

### Decision: User-ID cache via the same `users` table

- **Chosen:** Persist user objects (id, username, name, raw_json) on first lookup; subsequent pulls skip the `/users/by/username/...` X API call
- **Alternative considered:** Separate user_id cache file (JSON), or store user_id on each circle in circles.json
- **Rationale:** The `users` table has to exist anyway for foreign-key targeting. Reusing it as the cache means there's only one place to look. Storing on circles.json was rejected because circles.json is generated from data.js — mixing fetched X metadata in would couple the SSOTs.

### Decision: Hybrid write — mirror first, raw/ dump second

- **Chosen:** During the coexistence window, `pull_timelines.py` writes incoming data both to the mirror and to the existing `.x-api-data-<slug>/raw/*.json` files
- **Alternative considered:** Cut over immediately (mirror-only); separate migration sprint
- **Rationale:** Dual-write keeps raw/ as a verification corpus — triage / diff can be run from both paths and the outputs compared. If they diverge, we have evidence in hand. The cost is a tiny disk IO bump; the safety value is high.

### Decision: Hybrid skill + project layout (universal infra in a Claude Code skill, project wiring stays in repo)

- **Chosen:** The mirror itself lives in `~/.claude/skills/post-mirror/` as a Claude Code skill — storage, incremental fetch helpers, R2 sync, query CLI. The cho-tsukuyomi-map project's `scripts/pull_timelines.py` becomes a thin orchestrator that walks each event's booth roster and delegates the actual fetch + persist work to the skill's CLI. (howish 2026-06-06)
- **Alternative considered:**
  - Pure project `scripts/x_mirror/` sub-module (no skill split)
  - Pure skill (no project changes, skill walks event data.js directly)
- **Rationale:** The mirror's core surface (SQLite + FTS + R2 + query CLI) is universal infrastructure — the same pattern applies to future Plurk / Threads / Bluesky mirrors and to other projects entirely (hermes-* archives, kaguya-escape report archives). It belongs alongside `x-api`, `plurk-scraper`, `threads-scraper` as a reusable Claude Code skill. The recon work that USES the mirror — knowing which @handle belongs to which booth in this event, what "event-relevant" means — is this project's business logic and stays in this repo.
- **Skill name:** `post-mirror` (not `x-post-mirror`) so future Plurk / Threads adapters can plug into the same skill via per-platform modules.

### Decision: query_mirror.py CLI shape matches doujin-circle-recon skill

- **Chosen:** `query_mirror.py triage <slug>` and `query_mirror.py diff <slug>` produce the same output shape as the existing recon skill's commands
- **Alternative considered:** A more SQL-centric CLI (`query_mirror.py sql "..."`) that operators learn to compose
- **Rationale:** Keep existing downstream consumers (the LLM body-extraction loop, howish's mental model) working without changes. SQL is still accessible — `sqlite3 .x-api-data/mirror.sqlite` is one shell command away.

## Risks / Trade-offs

- **Risk:** R2 sync delay leaves a window where a fresh clone misses the last hour of recon
  - **Mitigation:** Push within 60 seconds of write; document the "last-known-good" recovery story (operator can re-pull missing data from X if needed, paying a one-off cost)

- **Risk:** SQLite file corruption (truncated write during power loss, disk error)
  - **Mitigation:** WAL mode + `PRAGMA synchronous = NORMAL`; daily R2 snapshot retention (configurable) so we can roll back

- **Risk:** Schema migrations break on a mirror created by an older version of the storage layer
  - **Mitigation:** `pragma user_version` versioning + idempotent migration steps run on every connect; integration test that opens a known-old mirror and verifies migration succeeds

- **Risk:** Dual-write window mishandles edge cases (one write succeeds, the other fails) and divergence creeps in
  - **Mitigation:** Treat raw/ dump as the verification corpus, not a redundant source; the verify phase compares mirror-derived triage output against raw-derived output for byte-equivalence

- **Risk:** Back-off accidentally skips a high-priority booth (e.g. an event announces the day-of)
  - **Mitigation:** `--force-full` flag; the 7-day-cadence cap ensures we never miss longer than a week

- **Trade-off:** boto3 dependency for R2 sync
  - **Acceptance:** small, well-maintained, common in Python tooling; cost is one pip install

## Migration Plan

- **Phase 0 — design + sanity check:** This document + the spec validate.
- **Phase 1 — storage layer + one-shot import:**
  - Build `scripts/post_mirror.py` + schema migrations
  - Build `scripts/migrate_raw_to_mirror.py` that ingests every `.x-api-data-<slug>/raw/*.json`
  - Verify mirror row counts match raw JSON counts; spot-check 10 random tweets for byte-equivalence
- **Phase 2 — incremental fetch:**
  - Wire `pull_timelines.py` to read pull_state + pass `start_time`
  - Wire dual-write (mirror + raw/)
  - Run one full recon round, observe X API spend drop on the X dashboard
- **Phase 3 — R2 sync:**
  - Build `scripts/r2_sync.py`
  - Wire into pull pipeline
  - Test push/pull round trip
- **Phase 4 — query CLI:**
  - Build `scripts/query_mirror.py` (triage / diff / search / body)
  - Verify same output as existing recon skill's commands against raw/
- **Phase 5 — coexistence verify:**
  - Run real recon rounds; compare mirror-triage output to raw-triage output
  - Document any divergence in a `verify-log.md`
- **Follow-up change (out of scope here):** raw/ deprecation once verify clean

**Rollback:** Stop reading from mirror (revert `pull_timelines.py` to its previous shape). The mirror file becomes inert; raw/ continues to work as it does today. No data loss.

## Open Questions

- Should the mirror's `users` table also carry the bio + follower count snapshot, or only the minimum (id + username + name) needed for user-ID cache? Adding more invites coupling between recon and stats; minimum is cheaper to maintain. Lean toward minimum + raw_json (anything else is in raw_json anyway and queryable later).
- Should `silent_streak` reset on `--force-full`? Probably yes — operator explicitly asked for the round, treat it as a "real" pull. Confirm in task 5.
- R2 daily snapshot retention default — 7 days? 30 days? At ~25MB per snapshot × 30 days = 750MB, still well under R2 free tier. Default to 7 to keep things tidy; let operators opt into longer.
