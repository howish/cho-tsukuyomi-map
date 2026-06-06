## ADDED Requirements

### Requirement: GitHub Actions workflow drives the cadence

The system SHALL provide a `.github/workflows/recon.yml` workflow that runs the recon pipeline (pull → triage → diff) on a schedule, one matrix job per active event.

#### Scenario: Workflow runs on cron

- **GIVEN** the workflow declares a `schedule:` block with cron expressions
- **WHEN** the scheduled time arrives
- **THEN** GitHub Actions checks out the repo, sets up Python + dependencies, runs the orchestrator script for each event, and posts the per-event delta to a configured Discord webhook
- **AND** if the orchestrator script returns non-zero, the workflow exits non-zero and a Discord alert is posted

#### Scenario: Manual dispatch

- **WHEN** howish manually triggers the workflow via `workflow_dispatch` with an optional `event_slug` input
- **THEN** the workflow runs for that one event (or all events if no input)
- **AND** howish does not need to push a commit to invoke recon

### Requirement: Lifecycle-aware cadence per event

The system SHALL adjust the cron cadence per event based on the event's date, so events close to or just after their date get pulled more frequently than long-tail events.

#### Scenario: Pre-event cadence (T-30 to T-0 days)

- **GIVEN** an event date is 14 days away
- **WHEN** the cron resolver computes today's eligible events
- **THEN** this event is included in the daily pull schedule

#### Scenario: Post-event cadence (T+0 to T+30 days)

- **GIVEN** an event date was 10 days ago
- **THEN** the event is included in the every-2-days pull schedule

#### Scenario: Long-tail cadence (T+30 to next iteration)

- **GIVEN** an event date was 60 days ago and the next-iteration event is not yet announced
- **THEN** the event is included in the weekly pull schedule

#### Scenario: Archived events skipped

- **GIVEN** an event has been replaced by its next iteration AND the new iteration is at least 30 days past
- **WHEN** the cron resolver runs
- **THEN** the archived event is not pulled

### Requirement: Orchestrator script

The system SHALL provide `scripts/recon_orchestrator.py` that the workflow invokes with `<slug>`; the script encapsulates pull → triage → diff → commit-if-changed flow.

#### Scenario: Orchestrator pulls then triages then diffs

- **WHEN** `scripts/recon_orchestrator.py <slug>` runs
- **THEN** it invokes the post-mirror skill's `pull` for each booth handle (using G's incremental fetch path), then `query triage`, then a delta computation comparing the latest pull to the prior pull state
- **AND** it writes the delta digest to a temp file consumable by the notifier step

#### Scenario: Orchestrator commits resulting data changes

- **GIVEN** the recon round produced changes to `circles.json` / `<slug>/data.js` / `<slug>/stats.json`
- **WHEN** the orchestrator's commit step runs
- **THEN** changes are committed with a message like `recon: <slug> pull <date> — N new tweets, M body updates` and pushed to main
- **AND** the post-mirror R2 backup is also pushed if G is live

#### Scenario: Orchestrator emits no commit when nothing changed

- **WHEN** a recon round produces zero new signal
- **THEN** no commit is made and the workflow logs a single line "no delta for <slug>"
