# scripts/

Lifecycle-grouped Python utilities for cho-tsukuyomi-map. Per B3
(2026-06-07 structural review), files are bucketed by how often they
actually run today.

## `ops/` — hot path

Run repeatedly during normal operation. New event recon, body updates,
deploys, image processing.

| script | what it does |
|---|---|
| `apply_body_patches.py` | Apply `{booth_id: new_body}` patches to a single event's data.js, fcntl.flock-serialized for parallel agent writes |
| `apply_cover_url_patches.py` | Same shape as apply_body_patches but for `cover_urls` |
| `apply-issue.py` | Apply a GitHub Issue or a downloaded `.md` from edit mode to one event (parses [修正案], scrapes new images, re-hosts on R2, updates data.js, commits + pushes) |
| `build_event_pwa.py` | Sync per-event `sw.js` + `manifest.json` from the root `_sw_template.js` + `_manifest_template.json` |
| `build_index_html.py` | Render per-event `index.html` from `_index_template.html` (uses event.js for title / OG / lang) |
| `bump_cache.py` | Bump `?v=<epoch>` cache-buster across every event + hub + circles index |
| `extract_circles.py` | Walk event data.js + write `circles.json` + `circles.js` (the SSOT for circle + author records) |
| `extract_cover_urls.py` | Walk the post-mirror media table per booth, build refreshed cover_urls JSON for one event |
| `extract_signals.py` | Per-booth multi-platform signal aggregator (X mirror + Plurk + Threads + doujin.com.tw) → JSON for body-update agents |
| `gen_profile_patterns_js.py` | Generate `profile-patterns.js` (URL-extraction patterns) from the author-name-resolver skill |
| `pull_multiplatform.py` | Per-platform booth scraper orchestrator (plurk / threads / doujin_tw), ThreadPoolExecutor-parallel |
| `pull_timelines.py` | Event-level X timeline pull, delegates per-booth fetch to `.claude/skills/post-mirror/bin/run.sh pull` |
| `r2_image_replace.py` | Re-host a single booth cover image on R2 (used when an FB / X URL expires) |
| `r2_upload.py` | Low-level R2 PUT for ad-hoc files |

## `audits/` — recurring health checks

Read-only checks. Run before commit / before deploy / when something
looks off. Each exits non-zero on issues so they can wire into CI.

| script | checks |
|---|---|
| `audit_author_names.py` | author display-name consistency in circles.json |
| `audit_cover_author_match.py` | cover_url owner ↔ author handle mismatch |
| `audit_oversocial.py` | authors carrying >5 socials (usually a dedup miss) |
| `audit_socials.py` | broken / 404 social URLs in circles.json |
| `check_asset_versions.py` | same-origin asset refs missing `?v=` cache-bust query (the B9 linter) |
| `check_profile_links.py` | event data.js still referring to legacy `x_url` / `x_handle` fields |
| `check_r2_images.py` | data.js refs to R2 URLs that 404 on the bucket |
| `lint-booth-data.py` | per-event data.js / filters.js — required fields, schema, etc |
| `validate_socials.py` | circles.json socials shape (platform whitelist, URL format) |
| `verify_mirror_vs_raw.py` | (Group 7 of openspec G) — post-mirror query body vs raw/-derived body, divergence catalog |

## `migrations/` — one-shot / archived

Completed migrations, kept for git-blame context + idempotent re-runs.
Each header documents the migration's date / openspec change. Most
won't run again unless the migration shape gets reused for a future
schema change.

| script | when |
|---|---|
| `apply_deep_clean_v2.py` | name cleanup pass (early June) |
| `apply_name_cleanup.py` | name normalisation (early June) |
| `apply_review_decisions.py` | first round of human-reviewed author-name fixes |
| `canonicalize_rt_sources.py` | RT cover source URL → original tweet URL |
| `clean_socials.py` | dedup / normalise circles.json socials |
| `deep_clean_names.py` | author name deduplication |
| `gemini_resolve_authors.py` | bulk author-name resolution via Gemini CLI |
| `migrate_4state.py` | early 4-state status migration |
| `migrate_raw_to_mirror.py` | one-shot import of `.x-api-data*/raw/*` into the post-mirror SQLite (openspec G group 6) |
| `migrate_to_authors_split.py` | circle/author schema split |
| `migrate_to_circle_ref.py` | per-event data.js → `circle_id` FK to circles.json |
| `migrate_x_handle_to_socials.py` | x_handle → socials[] schema migration |
| `process_canon_urls.py` | FB canonical URL backfill (album walker bridge) |
| `prune_mismatched_covers.py` | drop cover_urls whose author handle ≠ circle's primary handle |
| `serper_resolve_authors.py` | bulk author resolution via Serper search |
| `triage_serper.py` | Serper response triage |

## `_events.py` — shared helper (stays at scripts/ root)

`from _events import discover_events` — single source of truth for
"what events does this repo have." Yields EventDir per events.json
entry with a slug + on-disk event.js. All ops / audits / migrations
that walk events import this; the old `for ev_dir in root.iterdir()`
+ skip-list pattern is deprecated.
