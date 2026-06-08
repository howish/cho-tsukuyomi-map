## 1. events.json metadata fill-in

`events.json` (the central event index) is the authoritative source for mention extraction since post-mirror is a Python consumer and JSON parses trivially. event.js stays UI-only.

- [ ] 1.1 Add `aliases: [...]` (Japanese / Chinese variants people actually type), `hashtags: [...]` (with `#` prefix, hashtag-syntax-as-text), and optional `unique_booth_prefix: "…-"` (only when provably unique across all known events) to each event entry in `events.json`.
  - cho-tsukuyomi-2026-05: aliases `["超ツクヨミ祭", "超ツク"]`, hashtags `["#超ツクヨミ祭"]`, no unique prefix (uses A/B/C grid).
  - yaoyoro-2026-06: aliases `["ヤオヨロー", "ヤオヨロ", "プリケット2"]`, hashtags `["#ヤオヨロー", "#プリケット2"]`, `unique_booth_prefix: "ヤオ-"`.
  - tsukuyomi-square-2026-06: aliases `["ツクヨミスクエア", "ツクスク", "ラブフェス202606", "GLFes47"]`, hashtags `["#ツクヨミスクエア", "#GLFes47", "#ラブフェス"]`, no unique prefix.
  - if7-2026-05: aliases `["創集繪", "IF7", "CH19"]`, hashtags `["#IF7", "#CH19"]`, no unique prefix.
  - Future event entries (no slug yet) get the same treatment when they get a guide.
- [ ] 1.2 `date` field is already present everywhere. For multi-day events (none yet), `dates: ["start", "end"]` may be added later — out of scope for this pass.
- [ ] 1.3 Document the new fields in `docs/filters.md` (or add a short `docs/events.md`) — these are now consumed by post-mirror.

## 2. post-mirror: event_context enrichment

- [ ] 2.1 Add `_event_phase.py` helper in `.claude/skills/post-mirror/scripts/` — exposes `compute_event_context(post, target_event, all_events) → dict`. Pure function, no I/O.
- [ ] 2.2 Implement `time_phase` window logic (far_pre / pre / during / post / far_post) per design table.
- [ ] 2.3 Implement `mentions` extraction (hashtag → name/alias → 配置 code → dated reference). Each source returns `(event_slug, strength)`; combine into a deduped list.
- [ ] 2.4 Implement `this_event_confidence` rule per design's truth table.
- [ ] 2.5 Wire `--event <slug>` into `query body` subcommand: when set, attach `event_context` to every post, and add `event_date_window` to top-level output.
- [ ] 2.6 When `--event` is omitted, output shape is identical to today (no `event_context`, no `event_date_window`). Existing callers untouched.
- [ ] 2.7 Update `.claude/skills/post-mirror/SKILL.md` with the new flag and an output example.
- [ ] 2.8 Unit-style smoke test: given the 2026-06-07 yaoyoro 場後 post in the mirror, `query body --event tsukuyomi-square-2026-06 --username <author>` returns that post with `this_event_confidence: "none"` (or `"low"` if the post explicitly mentions tsukusquare).

## 3. filter-system: pipe event slug through

- [ ] 3.1 `classify_prep.py` — `_x_buckets_for(handle)` becomes `_x_buckets_for(handle, event_slug)`, passes `--event` to post-mirror.
- [ ] 3.2 `CLASSIFY_PROMPT.md` — add the "Using `event_context`" section (text from design.md, verbatim).
- [ ] 3.3 Same prompt text added to the body-update agent prompt template (CLAUDE.md or wherever the Discord workflow stores the dispatch prompt).
- [ ] 3.4 `classify_prep.py` integration check: produced chunk-N.json files include `event_context` on every post.

## 4. filter-system validate: out-of-window-date

- [ ] 4.1 Add `_extract_dates(text)` helper in `scripts/_filter_lib.py` — regex pass over M/D, M月D日, YYYY-MM-DD, "本日 YYYY-MM-DD"; return `[(date_str, year_hint)]`.
- [ ] 4.2 In `scripts/validate.py`, add `_check_body_dates(event, booth)` — for each extracted date, compute distance to nearest event date; flag if > 60 days.
- [ ] 4.3 Severity: warn by default, error under `--strict`. Surface in validator report under a new `out-of-window-date` group.
- [ ] 4.4 Validator test: run against current `tsukuyomi-square-2026-06/data.js` (which has `2026-06-07` references) — expect warnings on the affected booths.

## 5. Dogfood: re-pass tsukusquare bodies

- [ ] 5.1 Pull fresh post-mirror state if needed (`post-mirror pull` for any handle that posted in the last ~24h).
- [ ] 5.2 `classify_prep tsukuyomi-square-2026-06 --chunks 4`. Verify `event_context` populates on posts.
- [ ] 5.3 Dispatch a body-revision agent fleet covering only the 38 booths that currently have non-empty bodies. Prompt: "review the current body against the new `event_context`-annotated buckets; remove or rewrite any section attributing 6/7 (yaoyoro) content to tsukusquare; preserve genuine tsukusquare content as-is."
- [ ] 5.4 Apply patches via `apply_body_patches.py`.
- [ ] 5.5 Run `filter-system validate tsukuyomi-square-2026-06` — `out-of-window-date` count SHOULD drop to zero (or to a tiny set of legitimate cross-event mentions).
- [ ] 5.6 Backfill remaining 42 empty booths with the new pipeline.

## 6. Optional re-pass for other events

- [ ] 6.1 Run `filter-system validate yaoyoro-2026-06` — if `out-of-window-date` findings appear, dispatch a body-revision pass for the flagged booths. Otherwise skip.
- [ ] 6.2 Same for `if7-2026-05` and `cho-tsukuyomi-2026-05` — opt-in based on validator output, not required for proposal completion.

## 7. Ship

- [ ] 7.1 `bump_cache.py` (no asset changes expected, but run to be safe).
- [ ] 7.2 Commit with summary referencing the proposal slug.
- [ ] 7.3 Push.
- [ ] 7.4 Archive the proposal: `openspec/changes/add-event-phase-context/` → `openspec/changes/archive/<date>-add-event-phase-context/`.
