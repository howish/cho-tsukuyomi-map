## Why

Real X API spend for cho-tsukuyomi-map is **$81 / month** (30-day usage analytics confirmed by howish 2026-06-06), not the $1.50 cumulative figure previously assumed. Every recon pull re-fetches the same 25 most-recent tweets per booth even when the booth posted nothing new, because `pull_timelines.py` has no per-handle state for "what's the newest tweet we already have." Cost-optimization is genuine value: a properly designed local mirror + incremental fetch should reduce monthly spend to $5-10 while delivering offline triage, sub-second searches, and a foundation for the analytics work in proposal D and the delta detection in proposal C.

## What Changes

- Introduce a **local SQLite mirror** at `.x-api-data/mirror.sqlite` that stores every tweet, user, and media object the X API has ever returned for this project — the single source of truth for "what did this account say"
- Add **incremental fetch** state per user (last seen tweet id + last pull timestamp) so subsequent pulls request only what's new via X API's `start_time` parameter
- Add **silent-streak back-off** so accounts that haven't posted in N pulls drop to a lower frequency, freeing budget for active ones
- Cache user lookups (`@handle → user_id`) in the mirror so the username-resolve step happens once per handle, not once per pull
- Mirror **R2 backup**: `mirror.sqlite` is gitignored locally; a sync script pushes diffs to a Cloudflare R2 bucket on every successful pull, and pulls from R2 on a fresh clone. Local file is the working copy, R2 is durability
- Add a `query_mirror` CLI for offline triage / search / body extraction. The pull → triage → diff workflow stays the same shape but reads the mirror instead of re-hitting the API
- Existing `.x-api-data-<slug>/raw/*.json` files **co-exist** with the mirror as a verification corpus. Once we prove the mirror can reproduce existing triage/diff output bit-for-bit, the raw/ dumps can be deprecated in a follow-up change

## Capabilities

### New Capabilities

- `post-mirror-storage`: SQLite database with posts, users, media, and pull_state tables plus an FTS5 full-text index on post text. Encapsulates schema, migrations, and read/write API
- `incremental-fetch`: per-user pull state (last-seen tweet id + last-pull timestamp) drives `start_time` on X API timeline calls so only new tweets come back; with back-off logic for silent accounts
- `r2-backup-sync`: Cloudflare R2 push/pull integration that treats `mirror.sqlite` as a single object, syncs on every successful local mutation, and restores on fresh clone
- `mirror-query-cli`: offline CLI (`scripts/query_mirror.py`) that exposes triage / search / body-extraction queries against the mirror without touching the X API

### Modified Capabilities

(no existing OpenSpec capability is modified — the existing `pull_timelines.py` and `doujin-circle-recon` skill are touched as code-level integrations, not as spec'd capabilities)

## Impact

- **New code (Claude Code skill at `cho-tsukuyomi-map/.claude/skills/post-mirror/`)**: `bin/run.sh`, `scripts/storage.py`, `scripts/incremental.py`, `scripts/r2_sync.py`, `scripts/query.py`, `SKILL.md`. Initially drafted as a user-global skill at `~/.claude/skills/post-mirror/` per the hybrid layout decision; moved project-local on howish 2026-06-06 post-MVP review (only one project consumes it today, project placement keeps schema + code version-locked). See design.md.
- **New code (in this repo)**: `scripts/migrate_raw_to_mirror.py` — one-shot importer that walks this project's `.x-api-data-<slug>/raw/` and feeds the skill
- **Modified code**: `scripts/pull_timelines.py` becomes a thin orchestrator — walks each event's booth roster, calls the post-mirror skill's CLI per booth for the actual fetch + persist; `doujin-circle-recon` skill's triage/diff subcommands shell out to the post-mirror skill's `query` subcommand
- **Config**: `.env` adds `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`; documented in README
- **Dependencies**: `boto3` (R2 is S3-compatible) added to `requirements.txt`; SQLite is in Python stdlib
- **Storage growth**: ~50KB per 100 tweets; with ~50K tweets across all events, mirror is ~25MB — trivially below R2 free tier (10GB) and SQLite practical limits (TB)
- **Cost impact (target)**: monthly X API spend $81 → $5-10 (~90% reduction)
- **Migration risk**: existing raw/ dumps stay intact; mirror is additive; rollback is "stop reading from mirror" with no data loss
- **No breaking changes** to existing CLI invocations — `pull_timelines.py <slug>` still works, just smarter

## Dependencies

- (none strict — stand-alone cost optimization)
- **Enables / strengthens `automate-recon-pipeline` (E)**: with mirror + incremental fetch, the cron schedule in E can run more frequently without cost concern, and budget guard becomes "alert at 2x normal usage" instead of "throttle aggressively"
- **Enables `add-post-event-stats` (D)**: stats can query mirror directly via SQL instead of re-parsing data.js or paying X API to recompute
- **Enables `add-circle-notifications` (C, RSS variant)**: delta detection becomes a mirror diff query rather than a recon-pipeline-dependent compute

## Open Questions

- Threads/Plurk/doujin.com.tw posts — should the mirror schema accommodate them now (one platform-prefixed `id`) or stay X-only and we add a sibling table later? Decision deferred to design.md
- raw/ deprecation timing — pin to a specific verify checkpoint (proposal-level), or hand off to a follow-up change? Lean toward "this change closes when verify passes; raw/ deprecation is the next change"
