## ADDED Requirements

### Requirement: Validator walks every event and reports drift

The system SHALL provide a validator that walks every event's `filters.js` + `data.js`, checks schema compliance, and reports stray codes, axis mixing, and drift from shared base vocabulary. Exit code is non-zero when any issue is found.

#### Scenario: Stray code in booth data triggers error

- **GIVEN** `cho-tsukuyomi-2026-05/data.js` has a booth with `warnings: ["free"]`
- **AND** `cho-tsukuyomi-2026-05/filters.js` defines no warning with `code: "free"`
- **WHEN** the validator runs
- **THEN** it reports `cho-tsukuyomi-2026-05: stray warning code "free" used by booth A-04 (no filter definition)`
- **AND** exits non-zero

#### Scenario: Axis mixing flagged

- **GIVEN** `if7-2026-05/filters.js` defines a `works` axis with entry `code: "vocaloid"`
- **AND** an IF7 booth has `tags: {vocaloid: true}` instead of `works: ["vocaloid"]`
- **WHEN** the validator runs
- **THEN** it reports `if7-2026-05: axis mixing — booth S-12 has "vocaloid" in tags but the filters.js defines it under works`

#### Scenario: Schema fields validated

- **GIVEN** a filter entry missing the `icon` field
- **WHEN** the validator runs
- **THEN** it reports the missing field with line number

### Requirement: Validator runs in pre-commit hook

The system SHALL wire the validator into `scripts/git-hooks/pre-commit` so drift is caught before commit, not after deploy.

#### Scenario: Pre-commit blocks on validator failure

- **GIVEN** a developer stages a change to `tsukuyomi-square-2026-06/data.js` that introduces a stray code
- **WHEN** they attempt to commit
- **THEN** the pre-commit hook runs the validator
- **AND** the commit is blocked with the validator's report inlined

#### Scenario: Validator skips when no filter-related file staged

- **GIVEN** a commit that only touches `README.md`
- **WHEN** the pre-commit hook runs
- **THEN** the validator step is skipped (no `filters.js` / `data.js` in stage)
- **AND** the commit proceeds
