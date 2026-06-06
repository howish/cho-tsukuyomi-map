---
name: post-mirror
description: Local SQLite mirror for fetched social posts in cho-tsukuyomi-map. Use when (1) you need to fetch X tweets cheaply via incremental pull, (2) running offline triage/diff/search against past pulls, (3) backing up the mirror to R2 between sessions. Multi-platform schema (platform column) future-ready for Plurk / Threads / FB; only X code path is implemented today. Backed by SQLite + FTS5 + pull_state with silent-streak back-off. ~90% X API spend reduction vs. naive timeline re-fetches.
---

# post-mirror — local SQLite SSOT for fetched social posts

Project-local skill for cho-tsukuyomi-map's recon pipeline. Sits behind
`scripts/pull_timelines.py` (the orchestrator). The X code path is
implemented today; Plurk / Threads / FB code paths can plug in via the
same schema (`platform` column on every table) without migration if a
future need arises — multi-platform was kept structural-only, not a
commitment to ship those code paths now.

**Placement history:** initially drafted as a user-global skill under
`~/.claude/skills/post-mirror/` (per the proposal G design.md hybrid
layout). Moved to project skill at `cho-tsukuyomi-map/.claude/skills/`
per howish 2026-06-06 review — only one project consumes it today, and
project-local placement keeps the code version-locked with the schema
that produced its mirror.

## When to use

- A recon round needs to be cheap (use `pull` instead of bare x-api timeline)
- Triage / diff / search needs to run offline (no API call)
- The mirror needs to be backed up / restored across machines (R2 sync)

## Entry point

```bash
cho-tsukuyomi-map/.claude/skills/post-mirror/bin/run.sh <subcommand> [...args]
```

## Subcommands

### `pull <username>` — incremental X timeline fetch

```bash
bin/run.sh pull RinHuei
bin/run.sh pull RinHuei --mirror /custom/mirror.sqlite
bin/run.sh pull RinHuei --force-full --limit 50
```

Reads `pull_state` for `<username>` from the mirror; calls x-api timeline with
`--since <last_pull_iso>` so only new tweets come back. Updates posts / users /
user_snapshots / pull_state in one transaction. Output: JSON result with
`new_post_count`, `silent_streak`, `skipped`/`reason`.

Flags:
- `--mirror PATH` — default `$CWD/.x-api-data/mirror.sqlite`
- `--limit N` — max tweets per call (default 25)
- `--force-full` — bypass back-off cadence; does NOT reset silent_streak
- `--back-off-threshold N` — streak ≥ N silent pulls + < 7 days since last → skip (default 3)

### `query <subcommand> ...` — offline mirror queries (no API call)

```bash
bin/run.sh query triage --usernames @a,@b --keywords 新刊,お品書き
bin/run.sh query diff   --usernames @a,@b --since 2026-06-04T00:00:00Z
bin/run.sh query search '完売 文庫' --limit 20
bin/run.sh query body   --username @a --keywords 新刊,お品書き,完売,通販,次回参加
```

CJK keywords use LIKE fallback (FTS5 unicode61 doesn't split CJK well);
ASCII / hashtag / handle queries use FTS5 MATCH. `body` categorizes hits
into 新刊 / お品書き / 完売 / 通販 / 次回参加 buckets and emits JSON for
body-update agents to consume.

### `r2 <subcommand>` — R2 backup sync

```bash
bin/run.sh r2 push   [--mirror PATH]
bin/run.sh r2 pull   [--mirror PATH] [--force]
bin/run.sh r2 status [--mirror PATH]
```

Requires env: `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`. Optional: `R2_RETAIN_DAILY_SNAPSHOTS=7` to keep
N rolling daily snapshots (`snapshots/mirror-YYYY-MM-DD.sqlite`) alongside
the latest `mirror.sqlite`. `pull --force` overrides the
"refuse-overwrite-newer-local" check.

### `storage init` — create an empty mirror

```bash
bin/run.sh storage init
bin/run.sh storage init --mirror /custom/path.sqlite
```

### `tests` — run unit tests

```bash
bin/run.sh tests
```

### `help`

Print usage.

## Files

```
cho-tsukuyomi-map/.claude/skills/post-mirror/
  SKILL.md
  bin/run.sh                   — entry wrapper (self-locating)
  scripts/
    storage.py                 — SQLite + FTS5 + multi-platform schema
    incremental.py             — `pull` subcommand impl (X today)
    query.py                   — `query` subcommand impl (offline)
    r2_sync.py                 — `r2` subcommand impl (boto3)
  tests/
    test_storage.py            — 9 tests, pure stdlib
  requirements.txt             — boto3 (rest is stdlib)
```

## Cost

Free local infra. The actual X API spend it controls is $0.005/post-read
on Pay-Per-Use Basic tier; with incremental fetch the effective cost
drops ~90% vs. naive 25-tweet re-fetches. R2 spend is ~$0/month for a
sub-10MB mirror at Cloudflare's free tier limits.

## Dependencies

- Python 3.10+
- `boto3` (R2 sync only — install via `pip install -r requirements.txt`)
- `x-api` skill (`~/.claude/skills/x-api/bin/run.sh`) for the X pull code path
- All other deps: stdlib

## What this skill does NOT do

- Plurk / Threads / FB pull code paths (schema ready, code path X-only)
- Cron scheduling / orchestration (project responsibility — see `scripts/pull_timelines.py`)
- Body markdown generation (project responsibility — body-update agents
  consume `query body` JSON output)

## Lineage

Built per cho-tsukuyomi-map openspec change `add-x-post-mirror`
(2026-06-06). The 5 open-question decisions from that change are
baked in:

1. Multi-platform schema from day one
2. raw_json round-trip required (future raw/ deprecation enabled)
3. R2 retention 7 days default (when R2 lands)
4. Rich users + user_snapshots history
5. silent_streak preserved across --force-full
