## 1. Storage layer

- [ ] 1.1 Create `scripts/post_mirror.py` with module-level constants for schema version + file path
- [ ] 1.2 Implement `connect()` that opens `.x-api-data/mirror.sqlite`, applies WAL mode + `synchronous=NORMAL`, runs migrations
- [ ] 1.3 Implement migrations as a list of SQL statements keyed by version number; `pragma user_version` drives current state
- [ ] 1.4 Schema v1: tables `posts`, `users`, `media`, `pull_state` + indexes + FTS5 virtual table `posts_fts` synchronized via triggers
- [ ] 1.5 Implement `upsert_post(conn, raw_dict)`, `upsert_user`, `upsert_media` with proper transaction wrapping
- [ ] 1.6 Implement read helpers: `get_pull_state(user_id)`, `set_pull_state(...)`, `find_user_by_username(...)`
- [ ] 1.7 Update `.gitignore` to exclude `.x-api-data/mirror.sqlite` + `.x-api-data/mirror.sqlite-journal` + `.x-api-data/mirror.sqlite-wal` + `.x-api-data/mirror.sqlite-shm`
- [ ] 1.8 Unit test: open a fresh in-memory mirror, insert 1 post + 1 user + 1 media, verify FTS5 finds the post by keyword, verify upsert idempotency

## 2. One-shot raw → mirror migration

- [ ] 2.1 Create `scripts/migrate_raw_to_mirror.py`
- [ ] 2.2 Iterate every `.x-api-data-<slug>/raw/*-main-*.json` file
- [ ] 2.3 For each file: load JSON, upsert author user, upsert every tweet in `data` plus `includes.users` and `includes.media`
- [ ] 2.4 Initialize `pull_state` for every user with `last_pull_iso = newest tweet's created_at`, `last_tweet_id = newest tweet id`, `silent_streak = 0`
- [ ] 2.5 Print per-event row counts: "Imported X tweets from <slug> (Y unique users)"
- [ ] 2.6 Verify total row count against a hand-counted reference; spot-check 10 random tweets for byte-equivalence with their source JSON

## 3. Incremental fetch wiring

- [ ] 3.1 Refactor `scripts/pull_timelines.py` to accept the mirror as the canonical state source instead of inline scanning
- [ ] 3.2 Before each booth's pull: query `pull_state` for the user; build `start_time` argument when available
- [ ] 3.3 Invoke `~/.claude/skills/x-api/bin/run.sh timeline @handle --since <iso>` (the skill already supports `--since`)
- [ ] 3.4 Dual-write: write returned tweets to mirror + keep the existing raw JSON dump path unchanged
- [ ] 3.5 Update pull_state at the end of each pull (last_pull_iso = now, last_tweet_id = newest, silent_streak adjustment)
- [ ] 3.6 Implement back-off: skip pulls when `silent_streak >= threshold` AND `now - last_pull_iso < 7d`, log to stderr
- [ ] 3.7 Add CLI flags: `--back-off-threshold N`, `--force-full`, `--no-back-off` (escape hatch for one-off runs)
- [ ] 3.8 Cache user-ID lookups: before invoking the X API `/users/by/username/...` endpoint, check the mirror's `users` table

## 4. R2 backup sync

- [ ] 4.1 Add `boto3` to `requirements.txt`
- [ ] 4.2 Create `scripts/r2_sync.py` with subcommands `push`, `pull`, `status`
- [ ] 4.3 Read R2 credentials from env (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`); validate presence on startup
- [ ] 4.4 Implement `push`: upload local `mirror.sqlite` to `r2://<bucket>/cho-tsukuyomi-mirror/mirror.sqlite` via boto3 S3 client pointed at R2 endpoint, verify SHA-256 round-trip
- [ ] 4.5 Implement `pull`: download to local; refuse to overwrite a newer local copy without `--force`
- [ ] 4.6 Implement `status`: compare local vs R2 SHA-256 + size + last-modified
- [ ] 4.7 Wire `r2_sync push` into `pull_timelines.py` cleanup phase (skip if zero new rows; tolerate push failures with a stderr warning)
- [ ] 4.8 Implement optional daily snapshots driven by `R2_RETAIN_DAILY_SNAPSHOTS` env var; prune snapshots older than the retention window on every push
- [ ] 4.9 Update README + CLAUDE.md with a "first-time setup" section for R2 creds + `.env` template

## 5. Query CLI

- [ ] 5.1 Create `scripts/query_mirror.py` with argparse for subcommands `triage`, `diff`, `search`, `body`
- [ ] 5.2 Implement `triage <slug> [--keywords ...]`: read data.js for the slug, query `posts_fts MATCH keyword_query`, group by author, output the existing recon-skill triage format
- [ ] 5.3 Implement `diff <slug> --since <iso> [--created-since]`: SELECT posts WHERE fetched_at >= ? (or created_at) AND author IN (event roster); output in recon-skill diff format
- [ ] 5.4 Implement `search <query> [--event <slug>] [--limit N]`: free-form FTS5 query, optionally filtered by event roster
- [ ] 5.5 Implement `body <booth_id> --event <slug>`: categorize matching tweets into 新刊 / お品書き / 完売 / 通販 / 次回参加 buckets, emit JSON
- [ ] 5.6 Update `~/.claude/skills/doujin-circle-recon/bin/run.sh` triage + diff subcommands to prefer query_mirror.py when `mirror.sqlite` is present; log fall-through to API when the mirror returns nothing for a booth

## 6. Coexistence verify

- [ ] 6.1 Run a full IF7 recon round under the new incremental flow; record total reads + cost from the X API dashboard
- [ ] 6.2 Compare mirror-derived triage output (`query_mirror.py triage if7-2026-05`) to raw-derived triage output (`doujin-circle-recon triage` against raw/) line-by-line; document any divergence in `openspec/changes/add-x-post-mirror/verify-log.md`
- [ ] 6.3 Repeat for yaoyoro + cho-tsukuyomi
- [ ] 6.4 Document the actual cost savings observed (target $5-10/month) in the verify-log; if costs are >2x target, investigate before declaring done

## 7. Documentation + handoff

- [ ] 7.1 Update repo README with a "Recon storage" section explaining the mirror, the R2 setup, and the CLI surface
- [ ] 7.2 Add CLAUDE.md notes so future sessions reach for `query_mirror.py` before `x-api`
- [ ] 7.3 Note that raw/ deprecation is a follow-up change (link to a TODO or open issue)
