## Context

Manual recon — pull / triage / diff — is operator-time-bound. In practice the cadence clusters around the days before an event and goes silent afterward, missing the long tail of 場後 (post-event) updates: 通販 links going live, 加印 announcements, 寄攤 cross-promos, 次回参加 plans. The recon pipeline knows what to do; the missing piece is a scheduler. GitHub Actions is the natural home: free for public repos, native to where the code lives, no operational overhead beyond a YAML.

This change becomes much more sustainable in combination with proposal G (post-mirror with incremental fetch): cron can run daily without burning the X API budget because each run only fetches what's new. Without G, this change still works but spends more aggressively against the X API budget; the budget guard caps that.

## Goals / Non-Goals

**Goals:**

- Recon runs on a cadence appropriate to each event's lifecycle (pre-event daily, post-event every 2 days, long-tail weekly, archived skipped)
- Spend stays bounded by a configurable monthly cap; soft warning at 75%, hard pause at 100%
- Meaningful new signals reach howish quickly via Discord webhook
- A public status page makes "is the pipeline alive?" answerable without DM-asking howish
- Operator can also trigger the workflow manually for one-off rounds

**Non-Goals:**

- No native search across signals on the status page (that's what the existing site + `/circles/` does)
- No per-booth fine-grained subscription routing (proposal C handles per-favorite notifications)
- No realtime alerting (cron cadence is the upper bound on latency)
- No backend — this entire change is Actions cron + commits + a Discord webhook

## Decisions

### Decision: GitHub Actions cron over a self-hosted scheduler

- **Chosen:** `.github/workflows/recon.yml` with `schedule:` blocks
- **Alternative considered:** A small VPS running systemd timers; a Cloudflare Workers cron
- **Rationale:** Code, history, and secrets all already live in GitHub. Actions has free-tier minutes well above what this workflow consumes. Zero ops overhead.

### Decision: Lifecycle-aware cadence computed inside the orchestrator

- **Chosen:** A single cron schedule (every 6 hours, say) fires the workflow; the orchestrator script inspects each event's date and decides whether to actually pull
- **Alternative considered:** Multiple cron schedules in the YAML, each targeting different event groups; per-event workflow files
- **Rationale:** Multiple cron schedules duplicate YAML and create config drift. Inside-the-orchestrator logic is testable, version-controlled in Python, and easy to extend (e.g. add a new band like "T-7 to T-0 = twice daily").

### Decision: Budget state lives in a state branch, not in main

- **Chosen:** A protected `recon-state` git branch holds `.recon-budget-state.json` + `recon-status.json`; orchestrator updates them at the end of each run
- **Alternative considered:** Commit to main; use GitHub Actions artifacts; use repository_variable API
- **Rationale:** Committing to main on every run pollutes the user-visible commit history with operator noise. Artifacts expire (default 90 days) and can't be cross-run-shared without download steps. A dedicated branch keeps state durable + version-controlled without surfacing it in main.

### Decision: Discord webhook over email

- **Chosen:** Single Discord webhook URL as a repo secret; one post per event-with-delta
- **Alternative considered:** Email via SendGrid/Resend; pure commit-log digest
- **Rationale:** howish already lives in Discord; webhooks are free and require no third-party signup. Email adds a vendor relationship for marginal benefit. The webhook absent case still works (commit message holds the digest).

### Decision: Recon-status page is fully static

- **Chosen:** Workflow writes `recon-status.json` to the deployable site root + commits + GitHub Pages picks it up; static HTML/JS at `/recon-status/` consumes it
- **Alternative considered:** Server-side rendering; pulling from Actions API at page load
- **Rationale:** Track 1 = no backend. The status page must be as cheap to serve as the rest of the site. A read-side JSON file is the simplest sufficient solution.

### Decision: Soft-fail philosophy

- **Chosen:** When something goes wrong (X API outage, missing secret, mirror inconsistency), the workflow logs and degrades — it does not fail the run unless the entire pipeline is broken
- **Alternative considered:** Strict-fail (exit non-zero on any anomaly)
- **Rationale:** Cron failures generate noise. Most anomalies are recoverable on the next round. The operator only needs to know when something is persistently broken — which means correlating multiple consecutive soft failures, not panicking on every one.

## Risks / Trade-offs

- **Risk:** Cron drift — Actions doesn't guarantee minute-precision; runs may be delayed by ~15 minutes during high-load periods
  - **Mitigation:** Cadence bands are coarse (daily / 2-day / weekly), so 15-minute drift is invisible

- **Risk:** Budget guard runs out of state on a stale state-branch fetch
  - **Mitigation:** Workflow `actions/checkout@v4` with `ref: recon-state` is deterministic; budget state file has a `month` field so a stale month value triggers a fresh-month reset rather than miscounting

- **Risk:** Discord webhook gets rotated/leaked; spam flows to the channel
  - **Mitigation:** Webhook is a repo secret, rotated via GitHub UI; workflow has no mechanism to surface the URL outside Actions

- **Risk:** Status page can be a stale snapshot if the last workflow run failed before writing
  - **Mitigation:** Status JSON has `generated_at`; page shows freshness; if older than 2× the cadence, page renders an explicit "status may be stale" banner

- **Trade-off:** Without proposal G live, the workflow is more expensive than it needs to be
  - **Acceptance:** Budget guard caps the cost. When G lands the same workflow becomes ~10x cheaper to run without YAML changes.

## Migration Plan

- Phase 0: confirm `X_BEARER_TOKEN`, `DISCORD_RECON_WEBHOOK_URL`, `RECON_BUDGET_CAP_USD` are set as repo secrets
- Phase 1: create the `recon-state` branch with empty state files
- Phase 2: ship the workflow YAML + orchestrator + budget-guard + notifier + status writer
- Phase 3: ship `/recon-status/` page
- Phase 4: manually trigger via `workflow_dispatch` once per event to validate
- Phase 5: enable the cron schedule
- Rollback: disable the cron schedule (one YAML edit) — manual runs still possible

## Open Questions

- What's the right "first-pull" behavior for a brand-new event added via proposal A's bootstrap? Should the workflow immediately run a one-shot, or wait for the first cadence tick? Probably "run on next tick" is fine; bootstrap can manually trigger if needed.
- Should the workflow auto-archive an event (remove from cron) after N days of zero delta? Convenient but easy to forget — defer to manual archival via the `recon-state` branch.
- Should commits made by the workflow use a bot account (so howish's name doesn't litter the log)? Probably yes — a `recon-bot` account commit signature would be cleaner.
