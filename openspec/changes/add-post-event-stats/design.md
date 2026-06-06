## Context

After three events (cho-tsukuyomi-2026-05, IF7-2026-05, yaoyoro-2026-06), the recon pipeline has produced ~600 booth body markdown blocks and the post-mirror (proposal G) is on track to be the canonical store of every fetched tweet. None of that signal aggregates into an event-level picture today — there's no per-event "completion rate" / "platform breakdown" / "popular CPs" view, and no cross-event "which circles keep coming back" view. Per-booth scroll is the only navigation.

Both kinds of view are intrinsically interesting (the aggregated story isn't visible in any one booth) and serve different audiences:
- Circle authors planning next year's booth want to see which row / theme / CP cluster performed best
- Visitors deciding which event to attend want to see scale + variety signals
- howish (and any operator) wants a quick "how complete is recon coverage?" gauge before deciding to refresh

Track 1 means this must work without a backend. That's fine — all data needed for stats already lives in the project (data.js + circles.json + body markdown + the future mirror) and can be pre-computed and shipped statically.

## Goals / Non-Goals

**Goals:**

- Per-event aggregate view available at `<slug>/stats/`
- Cross-event trend view available at `/stats/`
- Pre-computed JSON committed to the repo; zero backend, zero runtime compute
- Honest about coverage gaps; never silently fabricate metrics
- Re-use the post-mirror when present (for fast 完売 / 通販 detection); fall back to body markdown when not

**Non-Goals:**

- No interactive filtering / drill-down ("show me only S列") — first cut is static views; interactivity can come later
- No write path — stats are read-only artifacts of upstream data
- No backend, no realtime; "fresh" stats mean "the operator re-ran compute_event_stats.py and committed"
- No per-author / per-CP detail pages (the cross-event view links into `/circles/` for that)

## Decisions

### Decision: Pre-compute server-side, ship static JSON

- **Chosen:** `scripts/compute_event_stats.py <slug>` writes `<slug>/stats.json`; the page is plain HTML/JS that fetches the JSON and renders
- **Alternative considered:** Compute in the browser at page load (read data.js + scan body for keywords)
- **Rationale:** data.js is ~5MB at IF7 scale; doing keyword scans + aggregation in the browser is wasteful and slow. Pre-compute keeps page load fast (~50KB stats.json) and lets us do richer queries (FTS5 against the mirror) that browsers can't.

### Decision: Inline SVG, no chart library

- **Chosen:** Hand-rolled SVG for bar / donut / line charts
- **Alternative considered:** Chart.js / d3 / similar
- **Rationale:** The chart types we need (bar, donut, simple line) are trivial to emit as SVG. Adding a chart library is the kind of dependency creep that makes a tiny static site feel heavy. Visitors get instant render with no script load. If the chart vocabulary grows beyond what's worth hand-rolling, we can revisit.

### Decision: Re-use post-mirror via SQL when present, degrade to markdown otherwise

- **Chosen:** Aggregator probes for `~/.claude/skills/post-mirror/` at startup; if present, uses `post-mirror query` for raw-tweet-derived metrics (完売 / 通販 / 加印 keyword counts). Otherwise greps body markdown.
- **Alternative considered:** Hard dependency on the mirror; or only ever use body markdown
- **Rationale:** Soft dependency keeps proposal D shippable even if G hasn't landed yet (just slower for mirror-backed metrics). When G is live, the same aggregator gets faster and more accurate without code changes.

### Decision: Idempotent + cached via SHA-256 of inputs

- **Chosen:** A small `.stats-state.json` per event records SHA-256 of data.js + circles.json. The aggregator short-circuits if inputs haven't changed.
- **Alternative considered:** Always recompute
- **Rationale:** Stats computation is cheap (~seconds for IF7 scale), but a CI workflow that runs on every commit gets noisy if we always re-emit identical JSON. Cache makes the workflow boring in the good case.

### Decision: Top-level `/stats/` lives at site root, not in any one event

- **Chosen:** `cho-tsukuyomi-map/stats/` directory with `index.html` + `stats.js` consuming all events' `stats.json` files
- **Alternative considered:** No top-level page; just per-event stats subpages
- **Rationale:** Cross-event trends are different from per-event aggregates; they need their own page so the structure of the site reflects the structure of the analysis. The hub already advertises `/circles/` and individual event guides; `/stats/` slots in naturally.

## Risks / Trade-offs

- **Risk:** Keyword-based 完売 detection has both false positives (someone tweets "売り切れない for sure" sarcastically) and false negatives (booth sold out but never tweeted about it)
  - **Mitigation:** Use a curated keyword list with rationale documented in code; surface the limitation in the page's coverage banner

- **Risk:** Stats.json becomes stale because nobody re-ran the aggregator
  - **Mitigation:** Wire the aggregator into the recon pipeline (proposal E) so every successful recon round also regenerates affected stats; show the last-computed timestamp on the page so visitors see the freshness

- **Risk:** Inline SVG charts look ugly at unusual aspect ratios
  - **Mitigation:** Test at multiple viewport widths; use simple, robust chart designs that degrade well (e.g. don't stack bars at narrow widths)

- **Trade-off:** Per-event re-run cost grows with mirror size
  - **Acceptance:** SQLite + FTS5 queries against ~50K tweets is sub-second; aggregator still runs in seconds; acceptable

## Migration Plan

- Phase 1: build `compute_event_stats.py` + body-markdown fallback path; emit `stats.json` for all 3 existing events
- Phase 2: build the per-event renderer (`<slug>/stats/`)
- Phase 3: build the cross-event renderer (`/stats/`)
- Phase 4: wire mirror-backed acceleration once G is live; verify metrics match between mirror and markdown paths during a transition window
- Rollback: delete `stats.json` files + the renderer pages; no other site behavior changes

## Open Questions

- Should `compute_event_stats.py --all-events` rebuild every stats.json + the cross-event trend output in one command, or are those separate? Lean toward one command with `--only <slug>` for the per-event case.
- Should the trend page expose a "data quality" gauge per event (e.g. "82% coverage")? Probably yes — visitors should know which events are well-recon'd vs gappy.
- Where do the keyword definitions live? Inline constants are fine for v1; if they grow, a small `metrics.toml` may be warranted later.
