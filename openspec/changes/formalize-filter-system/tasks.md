## 1. Bootstrap the `filter-system` project skill

- [ ] 1.1 Create `.claude/skills/filter-system/` directory with `SKILL.md`, `bin/run.sh` (self-locating, post-mirror style), `scripts/` for the Python implementations
- [ ] 1.2 Write `SKILL.md` describing the surface — when to use, subcommands (validate / classify-prep / apply-classify / manage), examples, links to design.md
- [ ] 1.3 Implement `bin/run.sh` as a self-locating dispatcher to `scripts/{validate,classify_prep,apply_classify,manage}.py`
- [ ] 1.4 Add `scripts/_filter_lib.py` for the shared helpers (filter parse, data.js loader, axis dispatch) — imported by every subcommand

## 2. Schema documentation

- [ ] 2.1 Write `docs/filters.md` describing the 4-axis schema (cps / tags / works / warnings) — what each axis means, what kind of code belongs in each, per-entry required fields (`code`, `label`, `icon`, `title`; `class_suffix` for warnings only), code naming rules (lowercase kebab-case ASCII)
- [ ] 2.2 Reference docs/filters.md from CLAUDE.md (so future-Claude sessions read it before touching filters)

## 3. Skill: validate

- [ ] 3.1 `scripts/validate.py` parses `_filters_base.js` + every event's `filters.js` + `data.js` and emits a structured report
- [ ] 3.2 Check: stray code (booth uses code not defined in any axis's filter entries) — severity warn (transition) / error (--strict)
- [ ] 3.3 Check: axis mixing (code in `tags` but exists as `works` entry, etc.) — severity warn / error
- [ ] 3.4 Check: schema field missing / invalid (no label, code naming violation) — severity error / error
- [ ] 3.5 Check: dead `pattern` field present — severity warn / error
- [ ] 3.6 Check: cross-event drift for shared vocabulary — severity warn / warn
- [ ] 3.7 Expose `bin/run.sh validate [--event <slug>] [--strict]`
- [ ] 3.8 Wire into `scripts/git-hooks/pre-commit` (run when any filters.js or data.js is staged)

## 4. Shared base vocabulary

- [ ] 4.1 Create `_filters_base.js` (root) with the universal subset of `tags` (manga / novel / illust / goods / r18 / goudou / free / consign) and `warnings` (soldout / online / reprint / cash / limit / noonline)
- [ ] 4.2 Each event's `filters.js` switches from a full duplicate to "shared base is loaded already, here are this event's CPs / works / mediums / areas / overrides". For tags + warnings, per-event extension is allowed; per-event override of a base code is allowed with a documented reason.
- [ ] 4.3 `app.js` load order: `_filters_base.js` → `<slug>/filters.js`; merge logic on `FILTERS_CONFIG` so per-event `tags` / `warnings` extend (and per-`code` override) the base.
- [ ] 4.4 `_index_template.html` loads `_filters_base.js?v={{VER}}` before `filters.js`; `build_index_html.py --force` rolls out the new tag across all events.

## 5. Skill: manage (add / rename / remove)

- [ ] 5.1 `scripts/manage.py` with `add-tag`, `add-warning`, `add-work`, `rename-code`, `remove-code`, `migrate-axis` subcommands
- [ ] 5.2 `add-*` updates `filters.js`, refuses cross-axis collision (Q4 decision), optionally invokes classify-prep + dispatched agent to suggest matches
- [ ] 5.3 `rename-code` updates `filters.js` entry + walks `data.js` to replace every booth ref; runs validator post-rename
- [ ] 5.4 `remove-code` requires `--cleanup` flag if booths still reference; strips from data + filters atomically
- [ ] 5.5 `migrate-axis <event> --from tags --to works <code>` for the IF7 mass-migration use case — moves the code's filter entry to the new axis + rewrites every booth's data shape
- [ ] 5.6 All commands support `--dry-run`
- [ ] 5.7 Expose `bin/run.sh manage <subcommand> ...`

## 6. Skill: classify-prep

- [ ] 6.1 `scripts/classify_prep.py` walks an event's booths, for each gathers existing `body`, existing `tags` + `warnings`, multi-platform signals (delegated to `extract_signals.py` from B3 ops/), and the merged filters vocabulary
- [ ] 6.2 Chunk the output (~25-40 booths per chunk) into `<event>/.classify-input/chunk-<n>.json`
- [ ] 6.3 Include the agent prompt template path (`<skill>/CLASSIFY_PROMPT.md`) in each chunk's metadata so the dispatched agent loads it
- [ ] 6.4 Expose `bin/run.sh classify-prep <event> [--chunks N]`

## 7. Agent prompt template

- [ ] 7.1 Write `.claude/skills/filter-system/CLASSIFY_PROMPT.md` — instructions for the dispatched classify agent: input shape, output shape, the 4-axis schema, few-shot examples (3+ booths showing body → tags/warnings reasoning), hard rules (no self-deprecating quotes, no axis mixing, etc.)
- [ ] 7.2 Document the dispatch pattern in the skill's SKILL.md so the orchestrator (a session that wants to run a classify pass) knows how to launch agents in parallel — Agent tool, general-purpose subagent_type, prompt skeleton

## 8. Skill: apply-classify

- [ ] 8.1 `scripts/apply_classify.py` takes a JSON proposal of `{booth_id: {tags, warnings}}` and applies to `<event>/data.js` with fcntl.flock serialization (same pattern as `apply_body_patches.py`)
- [ ] 8.2 Per-booth audit trail: append to `<event>/.classify-input/applied-log-<timestamp>.json` documenting what changed for each booth
- [ ] 8.3 Run validator after apply, refuse to write if post-apply state violates schema (strict mode)
- [ ] 8.4 Expose `bin/run.sh apply-classify <event> <proposal.json>`

## 9. Cleanup of existing drift

- [ ] 9.1 Strip dead `pattern` field from all per-event filters.js files
- [ ] 9.2 Resolve cho-tsukuyomi `free` warning code (decide: add to filters.js as `🎁 無配 (free)` or migrate to `tags.free`)
- [ ] 9.3 Resolve IF7 `super-kaguya` tag (likely add to `works` entry list)
- [ ] 9.4 Run `manage migrate-axis if7-2026-05 --from tags --to works` for every code where IF7 tags has it AND works has the entry (the ~30+ confirmed auto cases per Q4)
- [ ] 9.5 Run `validate --strict` on all 4 events — must exit 0

## 10. Backfill of empty events

- [ ] 10.1 `classify-prep yaoyoro-2026-06` → dispatch 2-3 parallel agents → collect proposals → `apply-classify`
- [ ] 10.2 Same for `tsukuyomi-square-2026-06` (after its body content lands from a future pull pass)
- [ ] 10.3 Validate both events end-state — 0 stray, 0 axis mixing

## 11. Documentation + handoff

- [ ] 11.1 Update repo README with a "Filter system" section linking docs/filters.md + the skill
- [ ] 11.2 Update CLAUDE.md to mention the new skill + the pre-commit hook gating
- [ ] 11.3 Update `scripts/README.md` if any of the lifecycle bucketing changes
