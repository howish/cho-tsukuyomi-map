## ADDED Requirements

### Requirement: Monthly X API spend cap

The system SHALL track cumulative X API reads across scheduled recon rounds within a calendar month and refuse further pulls when a configured cap is reached.

#### Scenario: Under-cap pulls proceed

- **GIVEN** the cap is $20 / month and cumulative spend is $5
- **WHEN** the workflow runs
- **THEN** the pull proceeds normally and the cumulative counter is updated by the pull's actual read cost

#### Scenario: Cap reached blocks further reads

- **GIVEN** cumulative spend reaches the configured cap
- **WHEN** the workflow tries to start a new pull
- **THEN** the orchestrator skips the X API call, logs a clear "budget cap reached: paused recon for the rest of this month", and posts a single Discord alert
- **AND** the workflow exits 0 (this is expected behavior, not failure)

#### Scenario: New month resets the counter

- **GIVEN** a fresh UTC month starts
- **WHEN** the cumulative counter is read on the first run of the new month
- **THEN** the counter is reset to $0 and pulls resume normally

### Requirement: Spend tracker persists across runs

The system SHALL persist the cumulative-spend state across GitHub Actions invocations.

#### Scenario: State lives in repo or artifact

- **WHEN** a workflow run completes
- **THEN** the updated `<.recon-budget-state.json>` file (with month + cumulative + last-update ISO) is either committed to a non-public state branch OR uploaded as a workflow artifact that the next run downloads
- **AND** the state is not lost between runs

### Requirement: Configurable cap via env

The system SHALL allow howish to set the monthly cap via a single environment variable or repo secret without editing code.

#### Scenario: Cap set in repo settings

- **GIVEN** `RECON_BUDGET_CAP_USD` is set to "30" in the repo's GitHub Actions secrets
- **WHEN** the workflow reads its config
- **THEN** the cap is interpreted as $30 / month

#### Scenario: Missing cap defaults to a conservative value

- **WHEN** `RECON_BUDGET_CAP_USD` is not set
- **THEN** the orchestrator defaults to $5 / month and prints a one-line warning so the operator notices and sets it explicitly

### Requirement: Soft-pause warning before hard stop

The system SHALL alert howish via Discord webhook when spend crosses 75% of the cap, so corrective action (e.g. raise cap, defer to next month, accept the pause) is possible.

#### Scenario: 75% warning

- **GIVEN** cap is $20 and cumulative crosses $15
- **WHEN** the workflow's post-pull bookkeeping runs
- **THEN** a Discord message says "Recon budget at 75% ($15 of $20). Next pull might exceed cap."
- **AND** the message is sent at most once per month (deduplicate by month)

#### Scenario: 100% hard stop

- **GIVEN** the cap has been reached
- **WHEN** the workflow attempts another pull
- **THEN** a Discord message says "Recon budget cap reached for <YYYY-MM>. Pulls paused until next month."
- **AND** the next-month reset re-enables pulls without further intervention
