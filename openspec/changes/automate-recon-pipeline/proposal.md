## Why

Today howish or Yachiyo manually invoke the recon pipeline — `pull_timelines` to refresh X data, `triage` to find event-relevant posts, `diff` to see what's new since last pull. This is fine when the operator remembers, but in practice runs cluster around the days before an event then go silent. Circles update 場後 (post-event) for weeks after — 通販 links, 加印, 寄攤 cross-promos, 次回参加 plans. Missing those updates means the fan guide goes stale. Automate the cadence.

## What Changes

- Add a cron schedule (GitHub Actions workflow, since the repo lives there) that runs `pull → triage → diff` for each active event on a schedule
- Schedule tiers per event lifecycle:
  - Pre-event (T-30 days → T-0): daily
  - Post-event (T+0 → T+30 days): every 2 days
  - Long-tail (T+30 → next iteration): weekly
  - After next iteration: archived (no more pulls)
- Diff output (新規 signals only) flows to a Discord webhook for howish, and optionally to the future `notification-dispatcher` (proposal C) so favorites-subscribers also get pushed
- Budget cap: hard ceiling on X API spend per month ($5 default); pipeline self-throttles if approaching cap
- Cost / observability dashboard at `/recon-status/` showing last pull time per event, signal counts, budget usage

## Capabilities

### New Capabilities

- `scheduled-recon`: GitHub Actions workflow that runs the pull → triage → diff pipeline on a per-event schedule with lifecycle-aware cadence
- `recon-budget-guard`: opt-in spending limit on X API + auto-throttle when approaching cap
- `recon-delta-notifier`: Discord webhook (and future notification-dispatcher hook) that announces meaningful new signals as they happen
- `recon-status-dashboard`: simple page showing last-pull-time, signal counts per event, and current budget usage

### Modified Capabilities

- `pull-timelines`: refactor `scripts/pull_timelines.py` to support `--since-last-pull` (idempotent re-runs that only fetch new tweets) and `--budget-cap` argument

## Impact

- **New code**: `.github/workflows/recon.yml`, `scripts/recon_orchestrator.py`, `scripts/recon_dashboard.py`, `recon-status/{index.html,recon-status.js}`
- **Modified**: `scripts/pull_timelines.py` learns `--since-last-pull` + budget arg
- **Secrets**: GitHub Actions needs `X_BEARER_TOKEN` + `DISCORD_WEBHOOK_URL` as repo secrets
- **Cost**: ~$3-5/month X API at current pace (currently ~$1.50/month manual)
- **No breaking changes**: manual `pull_timelines` invocations still work; orchestrator is additive
