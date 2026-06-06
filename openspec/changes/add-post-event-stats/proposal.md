## Why

After an event ends, the recon pipeline keeps collecting signals — 完売 announcements, 場後通販 links, 加印 notices, 寄攤 cross-promos. Today these flow into per-booth body markdown but nothing surfaces the aggregate picture: how many circles sold out same-day, which CPs were over-represented, which platforms had highest signal density, how new-vs-existing books split out. This information is valuable to circles planning their next event ("are 百合 booths actually doing well?") and to fans deciding which event to attend. Surface it.

## What Changes

- Add `/<event-slug>/stats/` page that renders per-event aggregates from data.js + body markdown
- Pre-compute aggregates server-side (one-shot Python script that writes a `stats.json` per event)
- Categories: 完売率 (sold-out % of circles), 新刊 vs 既刊 ratio, CP distribution, theme/series rankings, platform breakdown (X / Plurk / Threads / etc.), regional distribution, multi-event recurring circles
- Add cross-event comparison: same metrics over the 3+ events on the site, so a circle can see "我々のような S 列 booth は IF7 で X% 完売だった" trends
- Visualizations: simple bar / pie charts via inline SVG (no chart library dep), tables where charts would mislead

## Capabilities

### New Capabilities

- `event-stats-aggregator`: Python script that reads data.js + circles.json + body markdown and emits `stats.json` per event with all the metric calculations
- `stats-page-renderer`: HTML/JS that consumes stats.json and renders charts + tables; lives under each event's directory at `<slug>/stats/`
- `cross-event-trends`: aggregate-of-aggregates page at `/stats/` that compares metrics across all events for trend visibility

### Modified Capabilities

(none — purely additive; nothing existing changes)

## Impact

- **New code**: `scripts/compute_event_stats.py`, `<slug>/stats/{index.html,stats.js,stats.css}`, `/stats/{index.html,stats.js}` (cross-event)
- **Generated**: `<slug>/stats.json` per event (regenerated whenever data.js changes — wire into the existing rebuild flow)
- **Modified**: event index.html gets a "📊 Stats" link in nav; hub index.html gets a "/stats/" CTA
- **No breaking changes**: stats is read-only aggregation; nothing depends on it
- **Sensitivity**: 完売 is partially manual (parsed from body markdown 完売 keywords); coverage will be uneven across events — be honest about that in the UI ("recon coverage: X% of booths")

## Dependencies

- (none — pure read-side feature, pre-compute → static deploy, no backend, no other proposal in flight is a prerequisite)
- **Soft dependency on `automate-recon-pipeline` (E) for fresh data**: stats are derived from data.js + body markdown, which the recon pipeline fills. Without E, stats reflect whatever manual recon has been done — still useful, just slower to update.
