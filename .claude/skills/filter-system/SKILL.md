---
name: filter-system
description: Manage the 4-axis filter system (cps / tags / works / warnings) for cho-tsukuyomi-map events. Use when (1) auditing tag/warning drift across events, (2) backfilling tags/warnings for booths via the classifier flow (dispatched agent + apply pipeline), (3) adding / renaming / removing filter codes safely (without leaving stray refs), (4) wiring filter validation into pre-commit. Scoped to cho-tsukuyomi-map project; not designed for cross-project reuse.
---

# filter-system — codified filter vocabulary + classification pipeline

Project-local skill that formalizes the 4-axis filter system
(`cps`, `tags`, `works`, `warnings`) and the process of populating
booth `tags` / `warnings` from body content + signals.

Built per openspec change `formalize-filter-system` (2026-06-07).
Same shape as `post-mirror` — 1 skill, multiple subcommands, all
self-locating from `bin/run.sh`.

## Subcommands

```bash
.claude/skills/filter-system/bin/run.sh <subcommand> [...args]
```

### `validate` — schema + drift audit

```bash
bin/run.sh validate                    # walk all events
bin/run.sh validate --event yaoyoro-2026-06
bin/run.sh validate --strict           # exit non-zero on warnings too (CI mode)
```

Reports stray codes, axis mixing, schema violations, dead `pattern`
fields, cross-event drift. Wired into `scripts/git-hooks/pre-commit`
when any `filters.js` or `data.js` is staged. Transition mode: warns
on existing drift, blocks new commits that introduce drift.

### `classify-prep <event>` — emit per-booth signal bundle for agent classification

```bash
bin/run.sh classify-prep yaoyoro-2026-06 [--chunks 4]
```

Walks the event's booths, gathers existing body + signals (X mirror
buckets + Plurk / Threads / doujin.com.tw), pairs with the merged
filters vocabulary, splits into chunks for parallel-agent dispatch.
Output: `<event>/.classify-input/chunk-<N>.json` per chunk + the
prompt template path. Agent reasoning runs OUT of this skill (the
session orchestrating classify dispatches general-purpose subagents
with the chunk + `CLASSIFY_PROMPT.md`).

### `apply-classify <event> <proposal.json>` — fcntl.flock'd patch applier

```bash
bin/run.sh apply-classify yaoyoro-2026-06 /tmp/yaoyoro-classify-chunk-1.json
```

Applies `{booth_id: {tags, warnings}}` proposals to `<event>/data.js`
with the same serialization pattern as `apply_body_patches.py`. Writes
an audit log per run.

### `manage <subcommand> ...` — add / rename / remove filter codes

```bash
bin/run.sh manage add-tag yaoyoro-2026-06 anime-original "原案アニメ" 🎬
bin/run.sh manage rename-code yaoyoro-2026-06 goudou anthology
bin/run.sh manage remove-code yaoyoro-2026-06 limit --cleanup
bin/run.sh manage migrate-axis if7-2026-05 --from tags --to works vocaloid
bin/run.sh manage <any-subcommand> --dry-run
```

First-class commands that update `filters.js` + every affected
`data.js` atomically (within one event's file pair; not across git).
Cross-axis collision is refused.

## Files

```
cho-tsukuyomi-map/.claude/skills/filter-system/
  SKILL.md
  CLASSIFY_PROMPT.md         — agent prompt template for classify (few-shot examples)
  bin/run.sh                 — self-locating dispatcher
  scripts/
    _filter_lib.py           — shared helpers (parse filters.js, load data.js, axis dispatch)
    validate.py              — `validate` subcommand
    classify_prep.py         — `classify-prep` subcommand
    apply_classify.py        — `apply-classify` subcommand
    manage.py                — `manage` subcommand
```

## Lineage

- Builds on `post-mirror` (openspec G) for the per-booth signal bundle
  that `classify-prep` aggregates
- Builds on B3 (`scripts/ops/extract_signals.py`) for the signal extraction
- Builds on B9 (`scripts/git-hooks/pre-commit`) for the lint integration
- Independent of F (backend) and A (events/ subdir — cancelled)

## What this skill does NOT do

- LLM reasoning for classification (deliberately delegated to dispatched
  agents — keeps the script deterministic + audit-able)
- Filter UI rendering (that's app.js's job)
- Per-booth body markdown editing (that's `apply_body_patches.py`)
