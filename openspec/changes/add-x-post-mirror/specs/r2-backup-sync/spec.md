## ADDED Requirements

### Requirement: R2 push after successful local mutations

The system SHALL push `mirror.sqlite` to a configured Cloudflare R2 bucket within 60 seconds of a successful local write that resulted in new or updated rows.

#### Scenario: Push after pull adds new tweets

- **GIVEN** R2 credentials are present in `.env`
- **AND** `pull_timelines.py` has just completed a recon round that inserted ≥1 new tweet
- **WHEN** the pull script's cleanup phase runs
- **THEN** `mirror.sqlite` is uploaded to `r2://<bucket>/<key>/mirror.sqlite` overwriting the previous object
- **AND** the local SHA-256 of the file matches the SHA-256 returned by R2's PutObject response

#### Scenario: No push when no writes occurred

- **GIVEN** a pull round completed with 0 new tweets across all booths
- **THEN** no R2 upload is performed (save the network call + the operation count)

#### Scenario: Push failure does not block local operation

- **GIVEN** R2 is unreachable (network down, credentials wrong)
- **WHEN** the push step runs
- **THEN** the failure is logged to stderr with the boto3 error
- **AND** the local `mirror.sqlite` retains the new rows
- **AND** the next successful pull retries the upload

### Requirement: R2 pull on fresh clone

The system SHALL provide a way to restore `mirror.sqlite` from R2 when a fresh checkout has no local copy.

#### Scenario: Fresh clone restore

- **GIVEN** a fresh `git clone` with no `.x-api-data/mirror.sqlite` present
- **AND** R2 credentials are configured in `.env`
- **WHEN** the operator runs `scripts/r2_sync.py pull`
- **THEN** the file is downloaded from R2 into `.x-api-data/mirror.sqlite`
- **AND** subsequent triage / pull commands see the restored mirror

#### Scenario: Pull refuses to overwrite local changes

- **GIVEN** a local `mirror.sqlite` exists with a SHA-256 newer than (or different from) the R2 copy
- **WHEN** the operator runs `scripts/r2_sync.py pull` without `--force`
- **THEN** the script refuses and prints "Local mirror differs from R2 — pass --force to overwrite"
- **AND** the operator can resolve manually (e.g. push local first if local is newer)

### Requirement: Credentials live outside the repo

The system SHALL read R2 credentials from environment variables, sourced from a project-local `.env` that is gitignored.

#### Scenario: Required vars validated on startup

- **WHEN** `scripts/r2_sync.py` is invoked
- **THEN** it checks for `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` in the environment
- **AND** if any is missing, exits non-zero with a clear list of missing names
- **AND** never logs the secret values to stdout/stderr

#### Scenario: .env is gitignored

- **GIVEN** the repository's `.gitignore` includes `.env`
- **WHEN** a developer creates `.env` with R2 credentials
- **THEN** `git status` does not show it as tracked or untracked-staged

### Requirement: Single-object backup strategy

The system SHALL treat `mirror.sqlite` as a single opaque object in R2 — no row-level sync, no chunked upload, no automatic versioning.

#### Scenario: Whole-file replacement

- **WHEN** R2 push runs
- **THEN** the entire `mirror.sqlite` file (currently ~25MB at full scale, well under R2's free-tier object size limit) is uploaded as one PUT
- **AND** the prior R2 object is overwritten in place

#### Scenario: Optional snapshot retention

- **GIVEN** the operator has set `R2_RETAIN_DAILY_SNAPSHOTS=7` in `.env`
- **WHEN** R2 push runs
- **THEN** in addition to overwriting `mirror.sqlite`, a copy is uploaded to `r2://<bucket>/<key>/snapshots/YYYY-MM-DD.sqlite`
- **AND** snapshots older than 7 days are deleted on each push
