## 1. Build the aggregator

- [ ] 1.1 Create `scripts/compute_event_stats.py` with argparse: `<slug>` positional, `--all-events`, `--force`, `--mirror-path` flags
- [ ] 1.2 Implement input loaders: parse `<slug>/data.js`, load `circles.json`, optional connect to post-mirror via the skill API
- [ ] 1.3 Implement `compute_summary(booths) -> dict` (total booths, members, recon coverage %)
- [ ] 1.4 Implement `compute_sellout(booths, mirror_or_markdown) -> dict` (count + row-breakdown of 完売/完售-tagged booths)
- [ ] 1.5 Implement `compute_new_vs_existing(booths) -> dict` (新刊 vs 既刊 mention ratio across body markdown)
- [ ] 1.6 Implement `compute_cp_distribution(booths, top_n=20) -> list` (CP from booth.cps[] + body parsing)
- [ ] 1.7 Implement `compute_theme_distribution(booths, top_n=20) -> list` (themes from body bullet lines)
- [ ] 1.8 Implement `compute_platform_distribution(circles_for_event) -> dict` (count by primary platform across all members)
- [ ] 1.9 Implement `compute_multi_event_circles(event_slug, all_circles) -> list` (circles whose .events[] includes the current slug AND ≥1 other)
- [ ] 1.10 Implement coverage notes aggregation: list any per-metric skip reasons
- [ ] 1.11 Write `<slug>/stats.json` with all top-level keys + `_meta.computed_at` ISO timestamp + `_meta.source` ('mirror' or 'body-markdown')
- [ ] 1.12 Implement `--all-events` to iterate every `<*>/data.js` in the repo and emit/refresh each stats.json
- [ ] 1.13 Implement SHA-256 input cache via `<slug>/.stats-state.json`; short-circuit when unchanged unless `--force`

## 2. Build per-event renderer

- [ ] 2.1 Create `cho-tsukuyomi-2026-05/stats/` `if7-2026-05/stats/` `yaoyoro-2026-06/stats/` directories with `index.html`, `stats.js`, `stats.css`
- [ ] 2.2 `stats.js` fetches `../stats.json`; handles 404 with friendly message
- [ ] 2.3 Render summary card (total booths, coverage %, last computed ts)
- [ ] 2.4 Render 完売 bar chart (horizontal, one bar per row-letter)
- [ ] 2.5 Render 新刊 vs 既刊 stacked pair
- [ ] 2.6 Render CP distribution top 20 horizontal bar chart
- [ ] 2.7 Render platform donut chart with legend
- [ ] 2.8 Render multi-event circles table with event links
- [ ] 2.9 Render coverage notes banner (amber bg) when present
- [ ] 2.10 Add "← back to event guide" link

## 3. Build cross-event renderer

- [ ] 3.1 Create `stats/` directory at site root with `index.html`, `stats.js`, `stats.css`
- [ ] 3.2 `stats.js` enumerates `<*>/stats.json` files; skip events without
- [ ] 3.3 Render multi-event circles section (sorted by participation count desc, with per-event booth IDs)
- [ ] 3.4 Render sellout trend line chart across events
- [ ] 3.5 Render new vs existing trend across events
- [ ] 3.6 Render booth count trend
- [ ] 3.7 Render CP shift "movement" section for CPs gaining/losing ≥3 booths

## 4. Hub + per-event nav integration

- [ ] 4.1 Add "📊 Stats" link to each event's `<slug>/index.html` header (conditional on stats.json existing)
- [ ] 4.2 Update root `index.html` to add a "📊 Stats" badge on each event card that has stats
- [ ] 4.3 Add `/stats/` to the SW cache lists

## 5. Mirror-backed acceleration (post-G)

- [ ] 5.1 When `~/.claude/skills/post-mirror/` is present, switch `compute_sellout` to call `post-mirror query search '完売 OR 完售' --usernames @...`
- [ ] 5.2 Similarly switch `compute_new_vs_existing` and any other tweet-text-derived metric
- [ ] 5.3 Compare mirror-backed vs markdown-backed outputs for at least 1 event; document any divergence in a verify-log

## 6. Documentation

- [ ] 6.1 Add a "Computing stats" section to repo README
- [ ] 6.2 Document the keyword list + metric definitions in `scripts/compute_event_stats.py` docstrings
- [ ] 6.3 CLAUDE.md note for future sessions about the `--all-events` workflow
