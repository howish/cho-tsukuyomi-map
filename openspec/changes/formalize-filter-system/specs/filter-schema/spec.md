## ADDED Requirements

### Requirement: Four-axis filter schema is documented authority

The system SHALL declare four orthogonal filter axes — `cps`, `tags`, `works`, `warnings` — with a documented split of responsibility, and SHALL be the only source of truth for which axis a booth code belongs in.

#### Scenario: An axis owns "what kind of thing the booth sells"

- **GIVEN** the schema documents `tags` as "format / product type" (manga / illust / novel / goods / r18 / 合同 / 無配 / 委託)
- **WHEN** a maintainer wants to add a per-booth attribute for "anthology"
- **THEN** the schema says `tags` (because anthology = 合同 = product type), not `works` (which is for series/fandom)
- **AND** the validator (see `filter-validation` capability) will flag drift if data places it elsewhere

#### Scenario: Fandom-style codes belong in `works`, not `tags`

- **GIVEN** the schema documents `works` as "series / fandom this booth makes content about" (vocaloid / hololive / 超かぐや姫 / mha / ...)
- **WHEN** a booth declares `tags: {hololive: true}` instead of `works: ['hololive']`
- **THEN** the validator flags axis mixing
- **AND** the maintainer migrates the code to the right axis or filter-manage handles it

#### Scenario: Schema requires per-entry fields

- **GIVEN** the schema specifies that every filter entry has `{code, label, icon, title}` and optional `class_suffix` (warnings only)
- **WHEN** a filters.js entry omits `icon`
- **THEN** the validator reports the missing field
- **AND** app.js's render path treats the entry as malformed

### Requirement: Filter codes follow naming conventions

The system SHALL enforce that filter codes are lowercase kebab-case ASCII (e.g. `super-kaguya`, not `SuperKaguya` or `超かぐや姫`), so that they're URL-safe, sort cleanly, and don't collide on case in any platform.

#### Scenario: Validator rejects upper-case code

- **GIVEN** a `filters.js` entry with `code: "SuperKaguya"`
- **WHEN** the validator runs
- **THEN** it reports the violation with the suggested form `super-kaguya`

#### Scenario: Validator rejects non-ASCII code

- **GIVEN** a `filters.js` entry with `code: "超かぐや姫"`
- **WHEN** the validator runs
- **THEN** it reports the violation (display strings go in `label`, not `code`)
