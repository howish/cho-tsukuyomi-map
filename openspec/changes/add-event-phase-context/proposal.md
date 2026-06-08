# Change: add-event-phase-context

## Why

Body-update agents currently see post-mirror buckets (catalog / sample / announcement / etc.) with no **temporal context** about which event a post belongs to. The result is cross-event content bleed:

- 2026-06-08 **tsukusquare body backfill** (commit `4dd9527`) populated 38 booths, several of which contain `場後 (2026-06-07 evening)` sections — but 6/7 is **yaoyoro**'s event date, not tsukusquare's (which is **6/21**). The agents pulled author's recent posts wholesale and labeled them as ツクスク content because they were the freshest.
- The same risk exists for every booth-author who participates in multiple events. As event count grows (8 events booked through 11/22), the surface area for misattribution grows quadratically.

Time alone is brittle as a cutoff — a "6/21 ツクスク 配置 A-01" announce 40 days early should still be picked up, and a 場後 reflection 3 weeks late is still legitimate. So the system needs **time as a strong prior** + **text signals as override**, not hard windows.

Without this fix, the editorial-quality work `formalize-filter-system` invested in (deterministic classifier, agent prompt rules) gets undercut by silent input contamination. The classifier follows the rules correctly, on the wrong data.

## What Changes

- **post-mirror enrichment**: `query body` accepts `--event <slug>`. It loads `events.json`, computes a `time_phase` per post (relative to that event), scans post text for event-name / hashtag / 配置 / 日付 signals, attaches a per-post `event_context` block with `time_phase`, `mentions: [event_slugs…]`, and `this_event_confidence: high | med | low | none`.
- **event.js: unique_booth_prefix**: each event optionally declares a `unique_booth_prefix` (e.g. `"ヤオ-"` for yaoyoro) that ANY post containing the prefix is unambiguously about. When a prefix is unique to one event, the mention layer treats it as a strong single-token signal (no 50-char co-occurrence requirement). Generic grid prefixes (`A-`, `B-`, `C-`) do NOT get this treatment.
- **classify-prep / body bundle**: chunked JSON now carries the `event_context` block on every post. Agent prompts (CLASSIFY_PROMPT.md + body-update prompts) gain a new section: "When `this_event_confidence` is `low` and the post mentions a different event with `high` confidence, do not use the post as a source for the current event's body / tags."
- **filter-system validate**: new check — extract date strings from booth body, flag any date that falls outside `[event.start − 60d, event.end + 60d]` as `out-of-window-date` (warn). Catches the specific failure mode that prompted this proposal.
- **Re-process tsukusquare**: existing 38 populated booths get a re-pass under the new pipeline; the remaining 42 empty booths get a fresh backfill with phase-aware signals.

## Capabilities

### New Capabilities

- `post-event-context`: enrichment layer in `post-mirror` that, given an event slug, annotates each returned post with the time relationship to that event's date(s), the events the post text mentions, and a combined confidence verdict.

### Modified Capabilities

- `booth-classification`: classify prompt + body-update prompt MUST honor the `event_context` block — specifically, must skip posts whose `mentions` exclude the current event when `this_event_confidence` is `low`.
- `filter-validation`: validator gains an `out-of-window-date` check that flags booth body content claiming a date outside the event's natural window.

(`filter-schema` and `filter-management` are unchanged.)

## Impact

- **Modified code**:
  - `.claude/skills/post-mirror/scripts/query.py` (or its `body` subcommand) — accepts `--event`, adds `event_context` to every post
  - `.claude/skills/post-mirror/SKILL.md` — document the new flag
  - `.claude/skills/filter-system/scripts/classify_prep.py` — pass `--event` through to `post-mirror query body`
  - `.claude/skills/filter-system/CLASSIFY_PROMPT.md` — new "Using event_context" section + rule
  - `.claude/skills/filter-system/scripts/validate.py` — `out-of-window-date` check
  - body-update agent prompt (in CLAUDE / Discord workflow templates) — same event_context rule
- **No data migration required**. New annotations are added at query time, not stored on the mirror. Existing booth bodies do not need to be re-extracted from the mirror — the agent re-runs use the live mirror as-is.
- **One-shot cleanup**: dispatch a re-pass over the 38 tsukusquare booths with mixed yaoyoro/tsukusquare content. Expected to revise ~6–10 of them (those with "場後 2026-06-07" sections that belong to yaoyoro instead).
- **Backwards-compatible**: when `--event` is omitted, `query body` returns the existing shape unchanged. Existing scripts and skills keep working until they opt in.

## Out of Scope

- Storing `event_context` annotations in the SQLite mirror. The mirror stays event-agnostic — the annotation is a query-time computation. Persisting it would require schema migration on every event addition.
- Auto-routing posts to "the right event" in the mirror. The mirror is still platform-keyed (`(platform, id)`); event affinity is computed at consume time.
- Cross-platform mention detection. Threads / Plurk posts are not currently in the body-update pipeline; when they are added, the same `event_context` shape extends naturally to them.
- Retroactive cleanup of yaoyoro / IF7 / cho-tsukuyomi bodies. yaoyoro was authored before the bleed risk was identified, but its content is genuinely about yaoyoro (the event the author was prepping for). Only tsukusquare needs the re-pass.
