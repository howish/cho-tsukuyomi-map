## ADDED Requirements

### Requirement: Deterministic content → tags/warnings classifier

The system SHALL provide a deterministic classifier skill that takes one booth's body + signals and emits a `{tags: {...}, warnings: [...]}` proposal by applying a documented rule table. Same input MUST produce the same output across runs.

#### Scenario: Body containing "完売" + source URL produces soldout warning

- **GIVEN** a booth's body contains `[完売御礼](https://x.com/handle/status/123)`
- **WHEN** the classifier runs
- **THEN** the proposal contains `warnings: [["soldout", "✅ 完売御礼", "https://x.com/handle/status/123"]]`
- **AND** a re-run on the same body produces the identical proposal

#### Scenario: Body containing "通販" with a BOOTH URL produces online warning

- **GIVEN** body has `[通販開始](https://example.booth.pm/)` and the rule table says "BOOTH URL → online warning"
- **WHEN** the classifier runs
- **THEN** proposal has `warnings: [["online", "🛒 通販あり", "https://example.booth.pm/"]]`

#### Scenario: Ambiguous body falls through to "needs review"

- **GIVEN** a body says "完売しないように頑張ります" (anticipating, not confirming sold-out)
- **WHEN** the classifier runs
- **THEN** the proposal does NOT add a soldout warning
- **AND** the per-booth log notes `ambiguous: "完売" appears but no source URL anchor → skip`

### Requirement: Classifier emits per-booth rule trace

The system SHALL log, for each classification decision, which rule fired (or which rule was considered and rejected). The log is the audit trail for "why was this booth tagged this way" and the basis for fixing a wrong rule.

#### Scenario: Trace captures fired rule

- **GIVEN** the classifier proposes `tags: {manga: true}` for a booth
- **WHEN** the run completes
- **THEN** the trace shows `B-04: tag manga ← rule "body mentions 漫画 or コミック"`
- **AND** the trace is written alongside the proposal JSON (same directory)

#### Scenario: Trace captures rejected rule

- **GIVEN** the classifier considers `warnings: ["online"]` for a booth but no BOOTH URL is in body
- **WHEN** the run completes
- **THEN** the trace shows `B-04: warning online ← REJECTED (rule requires source URL on the BOOTH mention)`

### Requirement: Classifier output is compatible with apply_body_patches.py shape

The system SHALL emit proposals in a JSON shape that `scripts/ops/apply_body_patches.py` (or a sibling `apply_tag_warning_patches.py`) can consume directly, so the classifier integrates with the existing fcntl.flock-serialized apply pipeline.

#### Scenario: Proposal applies via existing patch pipeline

- **GIVEN** the classifier writes `/tmp/yaoyoro-tag-proposals.json`
- **WHEN** `python3 scripts/ops/apply_tag_warning_patches.py yaoyoro-2026-06 /tmp/yaoyoro-tag-proposals.json` runs
- **THEN** the patches land in `yaoyoro-2026-06/data.js` with the same fcntl.flock serialization the body patches use
