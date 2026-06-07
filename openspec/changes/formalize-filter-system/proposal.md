## Why

The booth `tags` + `warnings` system has accumulated drift across 4 events without an enforcing process:

- **Empty events**: yaoyoro-2026-06 (34 booths) and tsukuyomi-square-2026-06 (80 booths) ship with **zero** tags / warnings populated. The B5 fix (2026-06-06) removed the regex auto-detect because of false positives, but no formal replacement existed — body update agents have been ad-hoc deciding what to tag.
- **IF7 axis mixing**: `if7-2026-05/filters.js` declares a `works: [49 entries]` axis for fandoms (`vocaloid`, `genshin`, `hololive`...) but the booth data has **57+ fandom codes inside `tags`**, not `works`. App.js silently renders them but the filter UI shows nothing.
- **Stray codes**: cho-tsukuyomi `warnings` has a `free` code that's not in any filters.js definition. IF7 `tags` has `super-kaguya`, `soldout`, `online` that don't match the schema. No validator catches this.
- **No add/remove flow**: To add a new tag, someone hand-edits `filters.js`, then either runs nothing (legacy code in data goes uncategorized) or hand-edits all booth data. Removing a tag leaves stray code refs in data.
- **Dead config**: `pattern` regex fields persist on tag + warning definitions but no code reads them (B5 removed warnings auto-detect; tags never had auto-detect).
- **No skill for content → tags/warnings**: body-update agents (parallel dispatch pattern from yaoyoro 2026-06-06) sometimes write tag/warning entries inline, sometimes don't. No deterministic reproducible step.

The cost of this drift will compound: each new event without process discipline adds another "field of grass" that future cross-event analytics, the proposed circle-notifications system (proposal C), and the post-event stats page (proposal D) will have to handle as special-case noise.

## What Changes

- **Validator skill**: project-local `filter-validator` skill (or audit script) that walks every event's data.js + filters.js, reports stray codes, schema violations (tags ↔ works axis confusion), missing filter definitions for in-use codes, drift between events for shared vocabulary
- **Schema documentation**: `docs/filters.md` (or `_filters_schema.md`) formalizes the 4 axes (cps / tags / works / warnings), what each axis is for, code naming rules, required fields per entry
- **Classifier skill**: project-local `booth-classifier` skill that takes one booth's body + signals, applies a documented deterministic rule table to propose tags + warnings, emits a JSON proposal compatible with `apply_body_patches.py` shape
- **Add/remove flow skill** (or scripts): `filter-manage` skill that handles "add a tag to event X", "rename code", "remove code (with data cleanup)" as first-class commands instead of free-form file editing
- **Cross-event shared vocabulary**: lift universal tags (`manga`, `novel`, `illust`, `goods`, `r18`, `goudou`, `free`, `consign`) into a root `_filters_base.js`; per-event `filters.js` declares only event-specific extensions (CPs / works / areas). This is review item B6, previously deferred until N≥6 events — formalization makes it natural to do now.
- **Cleanup of dead config**: remove `pattern` field from tags + warnings filter definitions (no code reads them anymore)
- **Backfill of empty events**: run the classifier skill against yaoyoro + tsukuyomi-square booths to populate tags/warnings from existing body content

## Capabilities

### New Capabilities

- `filter-schema`: declarative schema for the 4 filter axes (cps / tags / works / warnings) — what fields each entry has, code naming rules, axis responsibility split, validation rules
- `filter-validation`: audit any event's filters.js + data.js for: stray codes, axis mixing, drift from shared base vocabulary, missing required filter entries. Exit non-zero on issues. Wired into the pre-commit hook
- `booth-classification`: deterministic content → tags/warnings rules. Same booth body in → same proposal out. Documented per-axis rule table; explicit fallthrough to "human review required" for ambiguous cases
- `filter-management`: add / rename / remove filter codes as commands instead of file edits. Add includes "scan existing data to suggest matches"; remove includes "strip stray refs from data"

### Modified Capabilities

(none — this is greenfield process formalization)

## Impact

- **New code (project-local skills)**:
  - `.claude/skills/filter-validator/` — schema + audit
  - `.claude/skills/booth-classifier/` — deterministic content rules
  - `.claude/skills/filter-manage/` — add/rename/remove flow
- **New docs**: `docs/filters.md` — schema authority
- **New file**: `_filters_base.js` (root) — universal tag vocabulary, replaces per-event duplication
- **Modified code**:
  - `<event>/filters.js` (4): switch from full copies to "import base + extend" pattern
  - `app.js`: load `_filters_base.js` before per-event `filters.js`, merge
  - `cho-tsukuyomi-2026-05/data.js`: stray `free` warning code mapped to a real filter or removed
  - `if7-2026-05/data.js`: migrate 57+ fandom codes from `tags` to `works` axis (largest data touch)
  - `yaoyoro-2026-06/data.js`: classifier pass populates 34 booths' tags/warnings from existing body
  - `tsukuyomi-square-2026-06/data.js`: classifier pass populates 80 booths (once they have body content)
  - `scripts/git-hooks/pre-commit`: wire `filter-validator` skill into the lint chain
- **Dependencies**: none new — all Python stdlib + existing post-mirror skill for signal lookup
- **No breaking changes** to public site — `data.js` shape unchanged, only the values inside `tags` / `warnings` get cleaned + populated; users see better filter coverage, no URL or schema migration
- **Audit trail**: each classifier run emits a per-booth log of "which rule fired" so a re-run produces identical output and a wrong rule is easy to trace + fix

## Dependencies

- Builds on the post-mirror skill (G) for body + signal lookup — classifier reads `query body` JSON
- Independent of the backend platform proposal (F)
- Independent of automate-recon-pipeline (E) — but E will benefit from a clean classifier step in its automation chain
- Should land before proposal C (circle-notifications) and D (post-event-stats), both of which want clean tag/warning data to operate over

## Open questions (to resolve in design.md before tasks.md)

1. **Skill split: 1 monolith or 3 separate?** — filter-validator + booth-classifier + filter-manage are conceptually distinct but small. One skill with 3 subcommands vs three separate skills.
2. **Classifier rule format** — Python dict, JSON, YAML, separate `_classifier_rules.py` per event? Trade-off: per-event customization vs cross-event consistency.
3. **Where do "shared base" filters live?** — `_filters_base.js` at root, OR a single `filters.json` SSOT that build_index_html-style renders to per-event JS? The latter is cleaner but adds a build step.
4. **Migration of IF7 tags → works** — does the classifier auto-propose or does it require human review for each booth?
5. **Stray codes**: silently drop, warn, or block validator?
