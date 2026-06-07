## ADDED Requirements

### Requirement: First-class CLI for add / rename / remove filter codes

The system SHALL provide commands that turn "add a tag", "rename a code", "remove a code" into single operations that update both `filters.js` and any affected `data.js`, instead of free-form file editing that leaves stray refs.

#### Scenario: Add a tag with scan-and-suggest

- **GIVEN** a maintainer wants to add `tag: "anime-original"` to `tsukuyomi-square-2026-06`
- **WHEN** they run `filter-manage add-tag tsukuyomi-square-2026-06 anime-original "原案アニメ" 🎬`
- **THEN** the entry is appended to `tsukuyomi-square-2026-06/filters.js`
- **AND** the booth body classifier (see `booth-classification`) is run to suggest which existing booths should pick up the new tag
- **AND** the maintainer reviews + applies the suggestions

#### Scenario: Rename a code propagates to data

- **GIVEN** a `tag: "goudou"` exists with 8 booths using it
- **WHEN** a maintainer runs `filter-manage rename-code <event> goudou anthology`
- **THEN** `filters.js` updates the code
- **AND** every affected `data.js` booth's `tags` object key changes from `goudou` to `anthology`
- **AND** validator passes post-rename

#### Scenario: Remove a code strips stray refs

- **GIVEN** a `warning: "limit"` is being retired
- **WHEN** a maintainer runs `filter-manage remove-code <event> limit`
- **THEN** the entry is removed from `filters.js`
- **AND** every booth that had `warnings: ["limit", ...]` has the entry filtered out
- **AND** validator passes post-removal (no stray `limit` in data)

### Requirement: Add-tag scan respects axis schema

The system SHALL refuse `add-tag` for a code that already exists on a different axis (e.g. attempting to add `vocaloid` to `tags` when it already exists in `works`).

#### Scenario: Cross-axis collision rejected

- **GIVEN** `if7-2026-05/filters.js` has `works: [{code: "vocaloid", ...}]`
- **WHEN** a maintainer runs `filter-manage add-tag if7-2026-05 vocaloid ...`
- **THEN** the command refuses with `vocaloid already exists in works axis — use the works axis or rename`
