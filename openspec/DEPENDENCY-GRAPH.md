# Proposal Dependency Graph

Drafted 2026-06-06 (revised same day to add 7th proposal). As of this
writing the proposals stand at:
- A `extend-event-hub-framework` — all 4 artifacts complete, apply-ready
- G `add-x-post-mirror` — proposal only (added 2026-06-06 after cost reality check)
- B, C, D, E, F — proposal.md only

This document captures the ordering constraints between them so the
sequence of "what to ship first" is clear.

## Graph

```
A. extend-event-hub-framework    [no deps]
                                          \
                                           → enables → E (event registry)

G. add-x-post-mirror             [no deps] — cost optimization foundation
                                  ↓
                                  +→ enables → E (sustainable cron cadence)
                                  +→ enables → D (SQL stats queries)
                                  +→ enables → C-RSS variant (mirror diff)

D. add-post-event-stats          [no deps]
                                  ↑
                                  | (soft: fresher data + SQL access)
                                  |
                                  E + G

E. automate-recon-pipeline       [no strict deps]
                                  |
                                  | (soft: G for cost sustainability)
                                  | (soft: F for backend delta routing)
                                  ↓

F. add-backend-platform          [no deps] — backend foundation
                                  ↓
                                  +→ enables → B (submission queue)
                                  +→ enables → C-push variant
                                                 ↑
                                                 | (strict: needs delta stream)
                                                 |
                                                 E

B. add-submission-form           [F strict, fallback: Discord webhook only]
C. add-circle-notifications      [F + E strict, fallback: RSS via static + G]
```

## Ordering options

### Track 1 — Pure static, fastest to ship

1. **A** event-hub-framework (any time, independent)
2. **G** add-x-post-mirror — slot before E so cron cadence is cost-safe
3. **D** post-event-stats (any time, independent)
4. **E** automate-recon-pipeline (GH Actions cron only — no backend used)

This delivers automation + new-event scaffolding + stats + cost-sustainable
recon with zero backend introduced. B and C land as fallbacks: Discord
webhook for B, RSS feed for C.

### Track 2 — Backend foundation, full feature set

1. **F** add-backend-platform — must land first
2. **E** automate-recon-pipeline (parallel with F, then optional backend wiring)
3. **A** event-hub-framework + **D** post-event-stats (independent, any time)
4. **B** add-submission-form — needs F live
5. **C** add-circle-notifications — needs F + E live

This delivers the full push-notification + moderated-submissions
experience but introduces ongoing backend ops cost.

### Track 3 — Hybrid

Start with Track 1 (Static MVP), promote individual features to
backend-backed versions as they prove valuable.

## Reading each proposal

Every proposal `.md` now has explicit `## Dependencies` (strict +
soft) and `## Enables` sections so the graph stays in sync with the
actual proposal contents. The diagram above is a summary view.

## Status (as of 2026-06-06)

All 6 proposals: `proposal.md` only — specs/, design.md, tasks.md
not yet written. Pick a track + proposal order before advancing to
the spec phase for any of them.
