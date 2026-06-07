---
name: doujin-circle-recon
description: "Bootstrap and maintain a fan-guide site for a doujin event. Parses official circle lists (ketcom Shift-JIS format, GLFes, 仙弦堂 etc), pulls X timelines per booth, triages event-relevant posts, diffs new posts since last pull, and verifies candidate handles for booths with no public SNS link. Use when (1) a new doujin event circle list goes public and you need to bootstrap a yachi8000.app-style guide, (2) re-running recon to catch new お品書き posts in the days leading to the event, (3) resolving handle-less booths via WebSearch + verify."
---

# doujin-circle-recon

Project-local toolkit for cho-tsukuyomi-map fan-guide event recon. Moved
to project skill 2026-06-07 (was at `~/.claude/skills/doujin-circle-recon/`
until then) — only this project consumes it today and the bootstrap
defaults (`--root ~/project/cho-tsukuyomi-map`, `--template cho-tsukuyomi-2026-05`)
are hard-bound to this repo's data layout. Same pattern as post-mirror.

Wraps `x-api` for timeline / search calls, parses major TJ/JP organizer formats, and produces digests that feed into `EDITORIAL_GUIDELINES.md`-compliant body markdown.

## Subcommands

All run via `.claude/skills/doujin-circle-recon/bin/run.sh <cmd> ...`
(from the cho-tsukuyomi-map project root).

### `parse <organizer> <url>` — fetch circle list, output booth scaffold JSON

Currently supported organizers:
- `ketcom` — Shift-JIS CGI (e.g. `https://ketto.xsrv.jp/html/mimiken/clist.cgi?pr2,...`)

Output: JSON array on stdout, each entry `{booth_id, circle_name, author, x_handle, x_url}`.

```
.claude/skills/doujin-circle-recon/bin/run.sh parse ketcom \
  'https://ketto.xsrv.jp/html/mimiken/clist.cgi?pr2,%83%84%83I%83%88%83%8D%81%5B%21'
```

### `bootstrap <event_slug> <organizer> <url>` — full new-event scaffold

1. Parses the circle list
2. Creates `<event_slug>/data.js` with booth scaffold (body empty, cover_urls empty)
3. Copies template files (app.js / style.css / event.js etc) from `cho-tsukuyomi-2026-05/`
4. Creates `.x-api-data-<event_slug>/raw/` for timeline storage
5. Auto-runs `scripts/extract_circles.py` + `scripts/migrate_to_circle_ref.py`
   to refresh `circles.json` (SSOT) and slim the new event's data.js to use
   `circle_id` refs. Template's `index.html` already loads `../circles.js`,
   so the new event renders correctly once event.js is filled in.

You then hand-edit `<event_slug>/event.js` for date/venue/etc and proceed to `pull`.

### `pull <event_slug> [-n N]` — batch x-api timeline for all booth handles

Reads handles from `<event_slug>/data.js`, fetches `timeline @handle -n N` (default 25) for each, saves to `.x-api-data-<event_slug>/raw/<booth_id_sanitized>-main-<handle>.json`.

Skips booths without `x_handle`. Saves previous pull (if exists) to `.x-api-data-<event_slug>/raw-prev/` for `diff` to use.

Cost: 2 reads per handle (`$0.01`).

### `triage <event_slug> [--keywords ...]` — digest of event-relevant posts per booth

Filters each booth's saved timeline for posts matching event keywords (default: ヤオヨロー, プリケット, 超かぐや, 新刊, 既刊, 頒布, 通販, お品書き, スペース, ヤオ, 彩葉, ヤチヨ etc).

Outputs human-readable digest to stdout — booth header + top 5 relevant tweets (date, ID, text, image URLs).

### `diff <event_slug>` — show new event-relevant tweets since last `pull`

Compares current `.x-api-data-<event_slug>/raw/` vs `.x-api-data-<event_slug>/raw-prev/` and lists only tweets that are NEW and event-relevant. Useful for incremental updates.

### `search <event_slug> <handle>` — x-api search to catch older posts

Wraps `~/.claude/skills/x-api/bin/run.sh search '"<event_short_name>" from:<handle>' -n 10`. Saves to `.x-api-data-<event_slug>/search/<handle>.json`.

Useful when `timeline -n 25` rolled past an older お品書き announcement.

### `rebuild` — refresh circles.json / circles.js + slim event data.js (idempotent)

Delegates to repo `scripts/extract_circles.py` + `scripts/migrate_to_circle_ref.py` + `scripts/check_profile_links.py`. Run after manual edits to:
- circle/author info (rename, new socials, x_handle change)
- event data.js (re-extract events list per circle)

Idempotent — safe to run after any data change.

### `verify <handle> [--signal KW]` — fetch user + recent tweets for handle verification

Pulls X profile + recent timeline, prints bio + first 5 tweet snippets. Used to confirm a candidate handle found via WebSearch is actually the right doujin circle.

If `--signal KW` provided, highlights matches of that keyword (e.g. "超かぐや姫", "ヤオヨロー", "百合") in bio or recent posts — helps reject false positives like commercial accounts.

## Typical workflow

```
# Day 1 — circle list goes public
run.sh bootstrap yaoyoro-2026-06 ketcom 'https://ketto.xsrv.jp/.../clist.cgi?pr2,ヤオヨロー！'

# Hand-edit yaoyoro-2026-06/event.js for date/venue/short_name

# Pull timelines
run.sh pull yaoyoro-2026-06

# Triage to inform body writing
run.sh triage yaoyoro-2026-06

# (LLM writes data.js bodies following EDITORIAL_GUIDELINES.md)

# Day N — re-pull and diff
run.sh pull yaoyoro-2026-06
run.sh diff yaoyoro-2026-06

# (LLM updates affected booth bodies)

# Handle-less booth?
run.sh verify suspected_handle --signal 超かぐや姫
```

## Output conventions

- Stdout: JSON for `parse`, digest for `triage` / `diff`, free-form for `verify`
- Side effects: writes under `.x-api-data-<slug>/` only — never touches data.js (LLM does that with full editorial judgment)

## What this skill does NOT do

- **Write data.js bodies** — body construction needs editorial judgment per `EDITORIAL_GUIDELINES.md` (price/format schema, language, no-self-deprecation, etc). The skill produces digests; the LLM writes prose.
- **Auto-resolve handle-less booths** — WebSearch + verify is the LLM's job (false-positive rate too high for blind automation: kokageterrace 商業施設, ahonoko カノト, etc.). The skill provides `verify` to confirm candidates.
- **Run cron jobs** — invoke manually or via your own scheduler.

## Working directory assumption

All commands assume the **project root** is wherever this project skill
is installed (default: self-located via `Path(__file__).parents[4]` from
the skill's `scripts/bootstrap.py`). Pass paths relative to that root,
e.g. `yaoyoro-2026-06`. CLI accepts `--root <path>` to override.

## Cost summary

Per event bootstrap + 1 weekly recon for 4 weeks:
- 1 × bootstrap parse: $0 (HTML fetch)
- 5 × pull (~32 booths each): 5 × 32 × $0.01 = $1.60
- 5 × triage: $0 (local)
- 5 × diff: $0 (local)
- ~10 × verify / search: ~$0.10

Total: ~$1.70 per event over its lifetime. Compare with manual ad-hoc x-api calls (often $0.30/pass, with redundant fetches): same order, but much less coordination overhead.
