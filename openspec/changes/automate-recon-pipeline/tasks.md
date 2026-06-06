## 1. Prerequisites + state branch

- [ ] 1.1 Confirm `X_BEARER_TOKEN`, `DISCORD_RECON_WEBHOOK_URL`, `RECON_BUDGET_CAP_USD` are set as repo Actions secrets (verify by listing names, not values)
- [ ] 1.2 Create the orphan `recon-state` branch with empty `recon-budget-state.json` (`{"month":"YYYY-MM","spent_usd":0,"last_update":""}`) and empty `recon-status.json` (`{"events":[],"recent_rounds":[]}`)
- [ ] 1.3 Document the state branch convention in CLAUDE.md so it's not accidentally deleted

## 2. Orchestrator

- [ ] 2.1 Create `scripts/recon_orchestrator.py` with argparse: `--slug`, `--all-events`, `--dry-run`
- [ ] 2.2 Implement cadence resolver: given today's date and an event's date, return the cadence band ("daily" / "2day" / "weekly" / "archived")
- [ ] 2.3 Implement eligibility check: based on cadence band + `last_pull_iso`, decide whether to pull this event in the current run
- [ ] 2.4 Implement actual pull invocation via the post-mirror skill (or, fallback if G not live, via the existing `scripts/pull_timelines.py`)
- [ ] 2.5 Implement triage via `post-mirror query triage` or fallback to the doujin-circle-recon skill
- [ ] 2.6 Implement delta computation comparing this round's pull state to the previous
- [ ] 2.7 Output a structured per-event JSON delta digest to stdout for the notifier step

## 3. Budget guard

- [ ] 3.1 Create `scripts/recon_budget_guard.py` with subcommands `check`, `record`, `month-reset`
- [ ] 3.2 `check`: reads `recon-budget-state.json` from the state branch, compares to `RECON_BUDGET_CAP_USD`, returns exit code 0 (under cap), 1 (warning 75%+), 2 (cap reached)
- [ ] 3.3 `record <usd>`: increments `spent_usd` by the given amount, writes back to state file, commits to `recon-state` branch
- [ ] 3.4 `month-reset`: if current UTC month differs from state's `month`, reset `spent_usd` to 0 and update `month`
- [ ] 3.5 Wire 75% warning Discord post (dedup per month)
- [ ] 3.6 Wire 100% hard-stop Discord post

## 4. Delta notifier

- [ ] 4.1 Create `scripts/recon_notify.py` that accepts a per-event JSON delta digest on stdin and posts to `DISCORD_RECON_WEBHOOK_URL`
- [ ] 4.2 Implement signal classification function (新刊 / お品書き / 完売 / 通販 / 加印 / 次回参加 / マシュマロ / 寄稿 / その他) against tweet text
- [ ] 4.3 Format the Discord message: event name + date, total signal count, top 3 booths with signal tags + short snippet, link to the run's commit on main
- [ ] 4.4 Skip posting on zero-delta runs (exit 0 silently)
- [ ] 4.5 Fall back gracefully if `DISCORD_RECON_WEBHOOK_URL` is missing (log warning, no fail)

## 5. Status writer

- [ ] 5.1 Create `scripts/recon_status_writer.py` that reads the post-orchestrator outputs and assembles the canonical `recon-status.json`
- [ ] 5.2 Compute per-event `cadence_band` + `last_pull_iso` + `last_round_signal_count` + `all_time_signal_count`
- [ ] 5.3 Maintain a rolling window of the last 10 rounds with event slug + ran_at + delta_count + outcome
- [ ] 5.4 Commit `recon-status.json` to the `main` branch (so GitHub Pages serves it) and commit `recon-budget-state.json` to the `recon-state` branch

## 6. GitHub Actions workflow

- [ ] 6.1 Create `.github/workflows/recon.yml`
- [ ] 6.2 Triggers: `schedule: cron '0 */6 * * *'` (every 6 hours) + `workflow_dispatch` with optional `event_slug` input
- [ ] 6.3 Jobs: single job that checks out main, sets up Python, restores `recon-state`, runs orchestrator + budget-guard + notifier + status-writer in sequence
- [ ] 6.4 Cache pip dependencies for fast warm starts
- [ ] 6.5 If orchestrator returns 0 with changes, commit + push to main
- [ ] 6.6 If anything fails persistently (3 consecutive workflow runs), post a single Discord alert "Recon pipeline is failing — check logs"

## 7. Status page

- [ ] 7.1 Create `recon-status/index.html` + `recon-status.js` + reuse `hub.css`
- [ ] 7.2 Fetch `/recon-status.json`; handle 404 gracefully
- [ ] 7.3 Render per-event table (slug, display name, event_date, cadence_band, last_pull, last_round_signal_count, all_time_signal_count)
- [ ] 7.4 Render budget gauge (cap, spent, ratio) with color coding (green < 50%, amber 50-75%, red ≥75%)
- [ ] 7.5 Render last-10-rounds table
- [ ] 7.6 Show a "status may be stale" banner if `generated_at` is older than 2× the slowest cadence (12h)
- [ ] 7.7 Add a "🔍 Recon status" link to the site root's hub footer
- [ ] 7.8 Add `/recon-status/` to the SW cache list

## 8. Validation + docs

- [ ] 8.1 Manually trigger the workflow via `workflow_dispatch` for each existing event; verify orchestrator + notifier + status writer produce expected output
- [ ] 8.2 Verify budget guard: temporarily set cap to a low value, observe 75% + 100% Discord alerts fire correctly
- [ ] 8.3 Verify status page renders correctly with real data
- [ ] 8.4 Enable the cron schedule (uncomment / commit the `schedule:` block)
- [ ] 8.5 Document the operator runbook in repo README: "How to add a new event to recon", "How to pause recon", "How to interpret status page"
- [ ] 8.6 CLAUDE.md note for future sessions about the orchestrator + state branch convention
