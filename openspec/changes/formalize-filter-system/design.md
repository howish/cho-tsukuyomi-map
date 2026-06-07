## Context

cho-tsukuyomi-map's tag + warning system has drifted across 4 events without an enforcing process:

- yaoyoro-2026-06 (34 booths) and tsukuyomi-square-2026-06 (80 booths) ship with empty tags/warnings — the B5 fix (2026-06-06) removed the previously-broken regex auto-detect but no replacement landed
- if7-2026-05 has 57+ fandom codes inside `tags` that should be on the `works` axis (axis mixing, silently rendered, filter chips missing)
- Stray codes (`free` warning in cho data, `super-kaguya` tag in IF7 data) exist without filter definitions — app.js renders them but the filter UI shows nothing
- `pattern` regex fields on tag + warning definitions persist as dead config post-B5
- No formal add/rename/remove flow for filter codes; every change is hand-editing across filters.js + data.js

Proposal G (post-mirror) gave us cheap signal aggregation per booth; proposal F (backend) is a different scaling decision. This proposal sits between them: a process layer that turns booth signals + body content into clean, validated tag/warning data, with codified vocabulary management.

## Open questions — RESOLVED (howish + ヤチヨ 2026-06-07)

### 1. Skill split: 1 monolith or 3 separate?

**Resolved:** 1 skill `filter-system` with subcommands. Same shape as `post-mirror` (1 skill / multiple subcommands). Shared helpers (filter parser, data.js loader, axis dispatch) live as Python modules consumed by every subcommand; one SKILL.md describes the surface.

Subcommands:
- `validate` — schema + drift audit (script-only)
- `classify-prep <event>` — emit per-booth signal bundle JSON for agent input (script-only)
- `apply-classify <event> <proposal.json>` — fcntl.flock'd patch applier (script-only)
- `manage <add-tag | rename-code | remove-code> ...` — first-class filters.js+data.js mutator (script-only)

### 2. Classifier rule format

**Resolved:** Classification is an **agent task**, not a script. The skill provides scaffolding (signal bundle + apply pipeline), the agent (LLM, parallel-dispatched per chunk) does the reasoning. The "rule table" downgrades to an **agent prompt template** at `<skill>/CLASSIFY_PROMPT.md` (Markdown, with few-shot examples).

Pure-static classification was over-promised in the initial proposal — keyword regex misses temporal / intent / judgment nuance (the same false-positive problem B5 retired). The honest split:

- **Script-handles**: structural matches (URL → warning, explicit keyword → tag), schema / vocabulary, apply pipeline, audit trail
- **Agent-handles**: reasoning under ambiguity (is this 完売 declarative or anticipatory? is this booth's hololive mention primary or incidental?)

The output shape (JSON proposal) is the contract between agent and apply script — same as the body-update flow in yaoyoro 2026-06-06.

### 3. Shared base vocabulary location

**Resolved:** `_filters_base.js` (root) + app.js merge. Minimal-infrastructure path: no new build step, base file loaded before per-event `filters.js`, app.js merges arrays into `FILTERS_CONFIG` at runtime.

Alternative (`filters.json` SSOT + `build_filters.py` render → per-event `filters.js`) considered but rejected: would mean another build step on top of `build_index_html` / `build_event_pwa`, and the per-event `filters.js` files become generated artifacts (lose hand-editability). Worth revisiting if "which event has this entry" debugging gets painful, not now.

Merge rules:
- `cps`: per-event only (no shared base — every event has its own pairings)
- `tags`: shared base + per-event extension; per-event entry with same `code` overrides base
- `works`: per-event only (fandoms are event-scoped)
- `warnings`: shared base + per-event extension; per-event override allowed for label / icon if any event truly differs
- `mediums`, `areas`: per-event only

### 4. IF7 tags → works migration

**Resolved:** Semi-automatic. The `manage migrate-axis` subcommand handles **exact-match cases** automatically (a code in `tags` that exists as a `works` entry → move it). Ambiguous cases (a code in `tags` with no matching `works` entry, or where context suggests it's both) get flagged for the classification agent's per-booth pass.

Concrete IF7 plan:
- `vocaloid`, `hololive`, `genshin`, `hsr`, `mygo`, `avemujica`, ...all 49 `works` entries that also appear in `tags`: auto-migrate
- `super-kaguya` (tag with no works entry): keep as a tag for now, validator flags as undefined-code, separate decision needed
- ~5 stray codes (`soldout`, `online` in tags): clearly miscategorised, manage flags them for cleanup

### 5. Stray code handling

**Resolved:** Transition mode — `validate` exits **warn** on existing stray codes (so initial integration doesn't gridlock the repo) and **block** on commits that introduce new stray codes (so drift doesn't grow). A `--strict` flag treats all warnings as errors (CI / "clean state" assertion).

Initial validator run output:
- `transition: 12 stray codes carried forward from before formalization (allowed for 1 commit window)`
- After cleanup commits: validator should print 0 warnings, 0 errors

## Decision: classification chunks + apply shape

The classify pass mirrors the yaoyoro body-update pattern from 2026-06-06:

1. `filter-system classify-prep <event>` emits one bundle per chunk:
   - `<chunk>.booths[*].existing_body`, `existing_tags`, `existing_warnings`
   - `<chunk>.booths[*].signals` (X mirror buckets + Plurk recent + Threads recent + doujin.com.tw status)
   - `<chunk>.filters_vocab` (the merged base + per-event filter dict)
2. A parallel-dispatched agent (general-purpose subagent) reads the bundle, reads `CLASSIFY_PROMPT.md`, emits `{booth_id: {tags: {...}, warnings: [...]}}` proposals to `/tmp/<event>-classify-chunk-<n>.json`
3. `filter-system apply-classify <event> /tmp/<event>-classify-chunk-<n>.json` writes patches to `data.js` with fcntl.flock serialization
4. `filter-system validate` confirms post-apply state is clean

This same flow handles initial backfill (yaoyoro / tsukuyomi-square empty events) AND incremental updates (new body content arrives → re-classify just the affected booths).

## Decision: filter-validator rules (initial set)

The validator implements these checks, exit code is the max severity hit:

| check | severity (transition / strict) | what it catches |
|---|---|---|
| stray code in data.js (no filter definition) | warn / error | `cho data has warnings: ["free"]` but no warning entry with code `free` |
| axis mixing (code in wrong axis given filter definitions) | warn / error | IF7 booth has `tags: {vocaloid: true}` when `vocaloid` is in `works` |
| schema missing required field | error / error | `filters.js` entry without `label` |
| code naming violates rules (non-lowercase, non-kebab-case, non-ASCII) | warn / error | `code: "SuperKaguya"` or `code: "超かぐや姫"` |
| filter definition with `pattern` field (dead config) | warn / error | leftover regex pattern in filters.js entries |
| cross-event drift for shared vocabulary | warn / warn | base says `manga` icon is `📕`, event override says `📗` without per-event reason documented |

## Decision: code rename / remove safety

`manage rename-code <event> <old> <new>`:
- Validate `<old>` exists in `<event>/filters.js`
- Validate `<new>` doesn't already exist (cross-axis check too — see Q4)
- Update `<event>/filters.js` entry
- Walk `<event>/data.js`, replace every booth's tag/warning ref from `<old>` to `<new>`
- Run validator post-rename, exit non-zero if anything's still inconsistent

`manage remove-code <event> <code>`:
- Validate booths still using `<code>` → list them, refuse with `--force`-only override
- (or with `--cleanup`) strip the code from every booth then remove the filter entry

These are atomic with respect to filters.js + data.js but NOT atomic with respect to git (a partial run can leave half-applied state). Add a `--dry-run` that prints the plan first.

## Risks / trade-offs

- **Agent classify cost** — every classify-prep chunk dispatched to an agent is real LLM spend. Mitigation: classify is run per-event-per-batch, not continuously. Estimated: 4 events × 50-555 booths / 30 per chunk × ~5 agent runs = ~30 dispatched agents over the project's lifetime, ~10K tokens each = ~$5 total. Cheap compared to the X API budget.
- **Agent non-determinism** — same body, different classify run, might propose slightly different tags. Mitigation: `CLASSIFY_PROMPT.md` few-shot examples pin behavior; apply step requires human acknowledgement; per-booth trace logs what the agent decided + why.
- **Migration noise** — IF7 migration touches all 555 booths (any with `tags: {vocaloid: true}` etc.). Single mass commit with clear summary recommended over scattered drift over time.
- **`pattern` field cleanup** affects 4 `filters.js` files; bulk strip is mechanical.

## Lineage

- Builds on G (post-mirror) for the per-booth signal bundle that classify-prep aggregates
- Builds on B3 (scripts/ layout) — `filter-system` skill scripts can call back into `scripts/ops/` for `extract_signals` etc.
- Builds on B9 (pre-commit hook) — validator wires into the existing hook chain
- Independent of F (backend) and A (events/ subdir cancelled)
