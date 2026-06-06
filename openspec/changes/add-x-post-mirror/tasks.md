## 1. Bootstrap the `post-mirror` Claude Code skill

- [x] 1.1 Create `cho-tsukuyomi-map/.claude/skills/post-mirror/` directory with `SKILL.md`, `bin/run.sh`, `scripts/` (project-local per howish 2026-06-06 placement review, see design.md)
- [x] 1.2 Write `SKILL.md` describing the skill: triggers, subcommands (`storage init`, `pull`, `query`, `r2 push/pull/status`), `$0` cost (free local infra)
- [x] 1.3 Implement `bin/run.sh` self-locating wrapper (per feedback_self_contained_projects: `SELF="$(readlink -f "$0")"`)
- [x] 1.4 Add a top-level requirements file (`requirements.txt`) for the skill, listing `boto3` (other deps are stdlib)
- [x] 1.5 Skill auto-discovered by CC via project `.claude/skills/` — `/reload-plugins` picks it up

## 2. Skill: storage layer

- [x] 2.1 Create `scripts/storage.py` with schema version + `connect(path)` opening the SQLite file, applying WAL + `synchronous=NORMAL`, running migrations
- [x] 2.2 Implement migrations as a list of SQL statements keyed by version number; `pragma user_version` drives current state
- [x] 2.3 Schema v1: tables `posts`, `users`, `user_snapshots`, `media`, `pull_state` with `platform` column on each + composite PRIMARY KEYs `(platform, id)` + indexes + FTS5 virtual table `posts_fts` synchronized via triggers (per howish 2026-06-06: multi-platform from day one)
- [x] 2.4 Implement `upsert_post(conn, platform, raw_dict)`, `upsert_user(conn, platform, raw_dict)` — the latter appends a `user_snapshots` row only when a tracked field (name / bio / follower_count / following_count / verified) differs from the most recent snapshot
- [x] 2.5 Implement `upsert_media(conn, platform, raw_dict)` with proper transaction wrapping
- [x] 2.6 Implement read helpers: `get_pull_state(platform, user_id)`, `set_pull_state(...)`, `find_user_by_username(platform, username)`, `get_user_snapshots(user_id, platform, since=None)`
- [x] 2.7 Unit test (in-memory SQLite): insert 1 post + 1 user + 1 media, verify FTS5 finds the post by keyword, verify upsert idempotency
- [x] 2.8 Unit test: upsert same user twice with same fields → 1 snapshot row; upsert with changed follower_count → 2 snapshot rows; verify history query returns both in time order
- [x] 2.9 Expose via `bin/run.sh storage init [--path /custom/mirror.sqlite]` so a caller can prepare an empty mirror anywhere

## 3. Skill: incremental fetch helpers

- [x] 3.1 Create `scripts/incremental.py` with `pull_one(conn, username, x_bearer, ...)` that handles user-ID cache lookup, builds `start_time` from `pull_state`, calls X API via existing `~/.claude/skills/x-api/bin/run.sh`, writes returned tweets to mirror
- [x] 3.2 Implement silent-streak back-off: skip when `silent_streak >= threshold` AND `now - last_pull_iso < 7d`; configurable threshold
- [x] 3.3 Implement `--force-full` override (bypasses back-off but preserves streak per spec, see design.md)
- [x] 3.4 Expose via `bin/run.sh pull <username> [--threshold N] [--force-full]`

## 4. Skill: R2 backup sync

- [x] 4.1 Create `scripts/r2_sync.py` with `push(conn_path)`, `pull(conn_path, force=False)`, `status(conn_path)`
- [x] 4.2 Read R2 credentials from env (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`); validate presence; never log values
- [x] 4.3 boto3 S3 client pointed at R2 endpoint; whole-file PUT/GET with SHA-256 round-trip verify
- [x] 4.4 Pull refuses to overwrite a newer local without `--force` (compare SHA-256 + mtime)
- [x] 4.5 Optional daily snapshots driven by `R2_RETAIN_DAILY_SNAPSHOTS` env; prune old on push
- [x] 4.6 Expose via `bin/run.sh r2 push|pull|status [--mirror /path]`

## 5. Skill: offline query CLI

- [x] 5.1 Create `scripts/query.py` with subcommands `triage`, `diff`, `search`, `body`
- [x] 5.2 `triage --usernames @a,@b,... [--keywords k1,k2]`: route CJK to LIKE, ASCII to FTS5 MATCH, group by author, digest format
- [x] 5.3 `diff --since <iso> [--usernames ...] [--fetched-since]`: SELECT posts WHERE (fetched_at or created_at) >= ? AND author IN (...)
- [x] 5.4 `search <query> [--username @x] [--limit N]`: free-form keyword search with CJK LIKE / ASCII FTS5 routing
- [x] 5.5 `body --username @x [--buckets <json>] [--limit N]`: categorize matching tweets into 新刊 / お品書き / 完売 / 通販 / 次回参加 buckets, emit JSON
- [x] 5.6 Expose via `bin/run.sh query <subcommand> ...`

## 6. Project wiring (in `cho-tsukuyomi-map` repo)

- [x] 6.1 Create `scripts/migrate_raw_to_mirror.py` that walks every `.x-api-data-<slug>/raw/*-main-*.json` in this project and calls the skill's storage layer to upsert posts + users + media; initializes `pull_state` from each file's newest tweet
- [x] 6.2 Refactor `scripts/pull_timelines.py` into a thin orchestrator: load the slug's data.js + circles.json, resolve each booth's @handle, call `post-mirror pull @handle` for each, leave the skill to handle state + write
- [x] 6.3 Dual-write made opt-in via `--with-raw-dump` (mirror is SSOT, raw/ becomes verify-corpus snapshot)
- [ ] 6.4 Update `~/.claude/skills/doujin-circle-recon/bin/run.sh` triage + diff subcommands to delegate to `post-mirror query ...` when the mirror exists (deferred — recon skill still works against raw/, project orchestrator already on mirror)
- [x] 6.5 Update `.gitignore` for `.x-api-data/mirror.sqlite*` plus the WAL/SHM/journal companion files
- [x] 6.6 Add `.env.example` documenting the R2 vars; gitignore `.env`

## 7. Coexistence verify

- [ ] 7.1 Run a full IF7 recon round through the new orchestrator; record total reads + cost from the X API dashboard
- [ ] 7.2 Compare mirror-derived triage output (`post-mirror query triage`) to raw-derived triage output line-by-line; document any divergence in `openspec/changes/add-x-post-mirror/verify-log.md`
- [ ] 7.3 Repeat for yaoyoro + cho-tsukuyomi (yaoyoro already validated cost-wise: 1st round $3.24, 2nd round $0.15 = 96% reduction vs bare)
- [ ] 7.4 Document the actual cost savings observed (target $5-10/month) in the verify-log; if costs are >2x target, investigate before declaring done

## 8. Documentation + handoff

- [x] 8.1 Update repo README with a "Recon storage" section explaining the post-mirror skill, the R2 setup, and where the project wiring lives
- [x] 8.2 Add CLAUDE.md notes so future sessions reach for the post-mirror skill before the bare x-api skill
- [x] 8.3 Add a memory file (`~/.claude/memory/post_mirror_skill.md`) registering the skill as a known reference
- [x] 8.4 Raw/ deprecation is a follow-up change — gated on Group 7 verify passing on all 3 events
