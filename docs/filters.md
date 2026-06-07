# Filter system schema

Authority document for the cho-tsukuyomi-map filter vocabulary. Read
this before adding / renaming / removing filter codes, or before
deciding which axis a code belongs to.

Per openspec change `formalize-filter-system` (2026-06-07).

## The 4 axes

Each booth carries codes across 4 orthogonal axes. The axes have
non-overlapping responsibilities — a code belongs to exactly one axis.

| axis | meaning | example codes | booth field shape |
|---|---|---|---|
| `cps` | カップリング (pairing) — which CP this booth's work centers on | `iroka`, `iroyachi`, `trio`, `mikanoi` | `b.cps: ["iroka", "iroyachi"]` (array) |
| `tags` | 形式・属性 (product type / attribute) — what kind of thing the booth makes | `manga`, `novel`, `illust`, `goods`, `r18`, `goudou`, `free`, `consign` | `b.tags: {manga: true, r18: true}` (object, truthy) |
| `works` | 作品・ジャンル (series / fandom) — what IP / fandom the booth makes content about | `super-kaguya`, `vocaloid`, `hololive`, `mha`, `original` | (today: lives inside `b.tags` — see "axis migration" below) |
| `warnings` | 販売状況・注意事項 (sales status / safety note) — caller-relevant warnings | `soldout`, `online`, `noonline`, `cash`, `limit`, `reprint` | `b.warnings: ["soldout"]` or `b.warnings: [["soldout", "✅ 完売御礼", "https://..."]]` (array of strings or [code, label, source_url] tuples) |

Two more axes exist for events that need them, declared in
`<event>/filters.js` but absent from this schema's 4-axis core:

- `mediums` — narrower medium classification (used by IF7 only — 5 entries)
- `areas` — venue zone tag (used by IF7 only — 5 entries: 綜合 / 百合 / VW / 偶大 / 特攤)

These are per-event-only and don't get a shared base.

## Per-entry schema

A filter entry (one tag, one warning, etc.) is a `{key: value}` map
with these fields:

| field | required | example | notes |
|---|---|---|---|
| `code` | yes | `"manga"` | lowercase ASCII alphanumeric + `-` only (kebab-case). URL-safe, sort-stable, case-collision-free. Validator rejects non-conformant codes. |
| `label` | yes | `"漫画"` | Display string. Free Unicode. The visible chip text in filter UI. |
| `icon` | recommended | `"📕"` | Emoji or short string. Renders before label in chips. Cards render icon-only when label space is tight. |
| `title` | recommended | `"漫画"` | Tooltip on hover. Often duplicates label; useful when label is icon-only. |
| `class_suffix` | warnings only | `"soldout"` | Used by warnings to derive `warn-<suffix>` CSS class for color theming. |

Optional fields (today's data has them but the validator warns —
they're being retired):

| field | status | reason |
|---|---|---|
| `pattern` | DEPRECATED (warn) | Was regex for auto-detect; removed per B5 (2026-06-06) because of false positives. Should be stripped from all entries. |

## Code naming rules

```
^[a-z0-9][a-z0-9-]*$
```

- All lowercase (`manga`, not `Manga`)
- ASCII alphanumeric + `-` separator only (no underscores, no `.`, no full-width)
- No leading hyphen
- No Japanese / Chinese characters in `code` (those go in `label`)

Why: codes appear in URLs (filter deep-links), DOM data attributes,
filenames (R2 keys, chunk JSON), sort orders. Locale-stable ASCII
avoids case-collision and platform inconsistencies.

**Exception:** the `areas` axis uses the code as the display label
by design (e.g. IF7 has 綜合 / 百合 / VW / 偶大 / 特攤 as both code
and label). Validator skips the code-naming check for this axis. If
a future event needs ASCII area codes + separate labels, that's the
right time to revisit the exception.

## Axis responsibility — how to decide

When you have a candidate code, ask:

1. **Is this a couple / pairing of characters?** → `cps`
2. **Is this a series / fandom / IP this booth makes content about?** → `works`
3. **Is this a state of the sale or a warning the caller needs to know?** → `warnings`
4. **Anything else (format / attribute / kind of product)** → `tags`

The most common drift: fandom codes landing in `tags` (e.g. IF7 today
has 50+ booths with `tags: {hololive: true}` when `hololive` belongs
in `works`). The validator catches this and the
`filter-system manage migrate-axis` command moves them.

## Shared base vocabulary vs per-event vocabulary

| axis | shared base allowed? | per-event extension? |
|---|---|---|
| `cps` | no — every event has its own pairings | yes |
| `tags` | yes — universal product-type vocabulary (`manga`, `novel`, `illust`, `goods`, `r18`, `goudou`, `free`, `consign`) | yes — per-event can extend and override |
| `works` | no — fandoms are event-scoped (different events care about different IPs) | yes |
| `warnings` | yes — universal sales-status vocabulary (`soldout`, `online`, `noonline`, `cash`, `limit`, `reprint`) | yes — per-event can extend and override |
| `mediums` | no | yes |
| `areas` | no | yes |

Where the base lives: `_filters_base.js` at repo root. `app.js` loads
the base before each per-event `<event>/filters.js`, then merges
arrays so per-event entries with the same `code` override the base
(rare; document why in a comment when you do).

## Axis migration

The `manage migrate-axis` subcommand moves a code from one axis to
another (e.g. IF7's `tags.vocaloid` → `works.vocaloid`). Atomic
within one event's `filters.js` + `data.js`. Run validator before +
after.

## Add / rename / remove flow

Use the `filter-system manage` subcommand instead of hand-editing:

```bash
# Add a tag, optionally classify existing booths to suggest matches
.claude/skills/filter-system/bin/run.sh manage add-tag <event> <code> <label> <icon>

# Rename a code (updates filters.js + every booth's data.js ref)
.claude/skills/filter-system/bin/run.sh manage rename-code <event> <old> <new>

# Remove a code (--cleanup strips stray refs from data, refuses without flag)
.claude/skills/filter-system/bin/run.sh manage remove-code <event> <code> --cleanup

# Move a code from one axis to another (the IF7 mass-migration case)
.claude/skills/filter-system/bin/run.sh manage migrate-axis <event> --from tags --to works <code>
```

All commands support `--dry-run` to preview without writing.

## Validator behavior

Run anytime: `.claude/skills/filter-system/bin/run.sh validate`.

Wired into the pre-commit hook (`scripts/git-hooks/pre-commit`) so
filter-related commits get checked automatically.

| check | transition severity | strict severity |
|---|---|---|
| stray code (in data, not defined in any filters axis) | warn | error |
| axis mixing (in `tags` but defined in `works`, etc.) | warn | error |
| schema missing required field | error | error |
| code naming violation | warn | error |
| dead `pattern` field | warn | error |
| cross-event drift in shared vocabulary | warn | warn |

Exit codes: 0 clean / 1 warns only / 2 errors.

`--strict` promotes warns → errors (for CI / "clean state" assertions).
