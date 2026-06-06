## ADDED Requirements

### Requirement: Discord webhook receives meaningful deltas

The system SHALL post a digest to a Discord webhook for each successful recon round that produced new signal.

#### Scenario: Webhook payload format

- **GIVEN** a recon round picked up 5 new signals across 3 booths
- **WHEN** the notifier runs
- **THEN** a Discord message is posted with: event name + date, count of new signals, top 3 booths with signal type and short snippet, link to the run's commit
- **AND** the message is single-message-length (no multi-message thread fan-out) so it doesn't spam the channel

#### Scenario: Zero-delta rounds produce no message

- **WHEN** a recon round produced zero new signals
- **THEN** no Discord post is made
- **AND** the workflow logs "no delta, skipping webhook" as a single line

#### Scenario: Multiple events run in the same workflow

- **WHEN** the workflow runs the matrix across multiple events and ≥2 of them produced deltas
- **THEN** one Discord message per event with delta is posted (not one rollup)

### Requirement: Signal classification in the notification

The system SHALL categorize each new signal into a recognized class (新刊 / お品書き / 完売 / 通販 / 加印 / 次回参加 / マシュマロ / 寄稿 / その他) when posting.

#### Scenario: Single tweet classified

- **GIVEN** a new tweet contains "新刊『八千代彩葉』再販決定"
- **WHEN** the classifier runs
- **THEN** the signal is tagged with `新刊` and `再販`
- **AND** the Discord post shows the tag prefix

#### Scenario: Unclassifiable falls through to その他

- **WHEN** a tweet doesn't match any known pattern
- **THEN** it's tagged `その他` but still included in the digest
- **AND** howish can override classification in a follow-up commit if useful

### Requirement: Webhook URL stored as a secret

The system SHALL read `DISCORD_RECON_WEBHOOK_URL` from GitHub Actions secrets and never log the value.

#### Scenario: Secret presence required

- **WHEN** the workflow starts
- **THEN** if `DISCORD_RECON_WEBHOOK_URL` is missing, the workflow logs "webhook not configured, deltas will not be posted" and proceeds with the recon work
- **AND** the workflow does not fail

#### Scenario: Secret value never logged

- **GIVEN** logging is verbose
- **THEN** the webhook URL never appears in the workflow log output
- **AND** any HTTP request log redacts the URL host + path before printing

### Requirement: Notifier degrades to commit-log fallback

The system SHALL ensure that even with no Discord webhook, the delta digest is still durable as a per-run note in the commit.

#### Scenario: Delta committed even when webhook absent

- **GIVEN** the webhook is unconfigured AND a recon round produced new signals
- **WHEN** the commit step runs
- **THEN** the commit message body includes the per-event delta digest
- **AND** howish can find the delta in `git log` later
