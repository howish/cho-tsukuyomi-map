## 1. Bootstrap the `post-mirror` Claude Code skill

- [ ] 1.1 Create `~/.claude/skills/post-mirror/` directory with `SKILL.md`, `bin/run.sh`, `scripts/__init__.py`
- [ ] 1.2 Write `SKILL.md` describing the skill: triggers, subcommands (`storage init`, `pull`, `query`, `r2 push/pull/status`), `$0` cost (free local infra)
- [ ] 1.3 Implement `bin/run.sh` self-locating wrapper (per feedback_self_contained_projects: `SELF="$(readlink -f "$0")"`)
- [ ] 1.4 Add a top-level requirements file (`requirements.txt`) for the skill, listing `boto3` (other deps are stdlib)
- [ ] 1.5 Add the skill to user's allowlist / register via standard Claude skill discovery so `/reload-plugins` picks it up

## 2. Skill: storage layer

- [ ] 2.1 Create `scripts/storage.py` with schema version + `connect(path)` opening the SQLite file, applying WAL + `synchronous=NORMAL`, running migrations
- [ ] 2.2 Implement migrations as a list of SQL statements keyed by version number; `pragma user_version` drives current state
- [ ] 2.3 Schema v1: tables `posts`, `users`, `media`, `pull_state` + indexes + FTS5 virtual table `posts_fts` synchronized via triggers
- [ ] 2.4 Implement `upsert_post(conn, raw_dict)`, `upsert_user`, `upsert_media` with proper transaction wrapping
- [ ] 2.5 Implement read helpers: `get_pull_state(user_id)`, `set_pull_state(...)`, `find_user_by_username(...)`
- [ ] 2.6 Unit test (in-memory SQLite): insert 1 post + 1 user + 1 media, verify FTS5 finds the post by keyword, verify upsert idempotency
- [ ] 2.7 Expose via `bin/run.sh storage init [--path /custom/mirror.sqlite]` so a caller can prepare an empty mirror anywhere

## 3. Skill: incremental fetch helpers

- [ ] 3.1 Create `scripts/incremental.py` with `pull_one(conn, username, x_bearer, ...)` that handles user-ID cache lookup, builds `start_time` from `pull_state`, calls X API via existing `~/.claude/skills/x-api/bin/run.sh`, writes returned tweets to mirror
- [ ] 3.2 Implement silent-streak back-off: skip when `silent_streak >= threshold` AND `now - last_pull_iso < 7d`; configurable threshold
- [ ] 3.3 Implement `--force-full` override (reset that call's silent_streak handling but record `force_full=true` in the pull log)
- [ ] 3.4 Expose via `bin/run.sh pull <username> [--threshold N] [--force-full]`

## 4. Skill: R2 backup sync

- [ ] 4.1 Create `scripts/r2_sync.py` with `push(conn_path)`, `pull(conn_path, force=False)`, `status(conn_path)`
- [ ] 4.2 Read R2 credentials from env (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`); validate presence; never log values
- [ ] 4.3 boto3 S3 client pointed at R2 endpoint; whole-file PUT/GET with SHA-256 round-trip verify
- [ ] 4.4 Pull refuses to overwrite a newer local without `--force` (compare SHA-256 + size)
- [ ] 4.5 Optional daily snapshots driven by `R2_RETAIN_DAILY_SNAPSHOTS` env; prune old on push
- [ ] 4.6 Expose via `bin/run.sh r2 push|pull|status [--mirror /path]`

## 5. Skill: offline query CLI

- [ ] 5.1 Create `scripts/query.py` with subcommands `triage`, `diff`, `search`, `body`
- [ ] 5.2 `triage --usernames @a,@b,... [--keywords k1,k2]`: query `posts_fts MATCH keyword_query`, group by author, output in a recon-skill-compatible format
- [ ] 5.3 `diff --usernames @a,@b,... --since <iso> [--created-since]`: SELECT posts WHERE fetched_at >= ? (or created_at) AND author IN (...)
- [ ] 5.4 `search <query> [--username @x] [--limit N]`: free-form FTS5 query optionally filtered
- [ ] 5.5 `body --username @x [--keywords ...]`: categorize matching tweets into 新刊 / お品書き / 完売 / 通販 / 次回参加 buckets, emit JSON
- [ ] 5.6 Expose via `bin/run.sh query <subcommand> ...`

## 6. Project wiring (in `cho-tsukuyomi-map` repo)

- [ ] 6.1 Create `scripts/migrate_raw_to_mirror.py` that walks every `.x-api-data-<slug>/raw/*-main-*.json` in this project and calls the skill's storage layer to upsert posts + users + media; initializes `pull_state` from each file's newest tweet
- [ ] 6.2 Refactor `scripts/pull_timelines.py` into a thin orchestrator: load the slug's data.js + circles.json, resolve each booth's @handle, call `post-mirror pull @handle` for each, leave the skill to handle state + write
- [ ] 6.3 Keep the dual-write path: `pull_timelines.py` still writes the raw JSON dump to `.x-api-data-<slug>/raw/` until verify passes
- [ ] 6.4 Update `~/.claude/skills/doujin-circle-recon/bin/run.sh` triage + diff subcommands to delegate to `post-mirror query ...` when the mirror exists
- [ ] 6.5 Update `.gitignore` for `.x-api-data/mirror.sqlite*` plus the WAL/SHM/journal companion files
- [ ] 6.6 Add `.env.example` documenting the R2 vars; gitignore `.env`

## 7. Coexistence verify

- [ ] 7.1 Run a full IF7 recon round through the new orchestrator; record total reads + cost from the X API dashboard
- [ ] 7.2 Compare mirror-derived triage output (`post-mirror query triage`) to raw-derived triage output line-by-line; document any divergence in `openspec/changes/add-x-post-mirror/verify-log.md`
- [ ] 7.3 Repeat for yaoyoro + cho-tsukuyomi
- [ ] 7.4 Document the actual cost savings observed (target $5-10/month) in the verify-log; if costs are >2x target, investigate before declaring done

## 8. Documentation + handoff

- [ ] 8.1 Update repo README with a "Recon storage" section explaining the post-mirror skill, the R2 setup, and where the project wiring lives
- [ ] 8.2 Add CLAUDE.md notes so future sessions reach for the post-mirror skill before the bare x-api skill
- [ ] 8.3 Add a memory file (`~/.claude/memory/post_mirror_skill.md`) registering the skill as a known reference (per the existing `threads_scraper_skill.md` pattern)
- [ ] 8.4 Note that raw/ deprecation is a follow-up change
