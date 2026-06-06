# add-x-post-mirror verify log

Group 7 coexistence verification — running mirror-derived recon output
against raw-derived output and recording divergences.

## Verify methodology

For each event slug, `scripts/verify_mirror_vs_raw.py <slug>` runs
`post-mirror query body --username @handle` for every booth's primary
X handle, then mimics the same bucket logic against
`.x-api-data-<slug>/raw/*-main-*.json` and diffs.

Pass criterion: `raw_richer == 0` (mirror has every post raw saw).
`mirror_richer` is expected and good (incremental pulls bring in newer
posts). `both_differ` may indicate a top-N trim artifact when mirror's
bucket has more total hits than raw's and the newer ones push older
ones off the limit window.

## Round 1 results — 2026-06-06 ~15:30 UTC

### cho-tsukuyomi-2026-05 (48 booths)

| Bucket | Count |
|---|---|
| no_divergence | 43 |
| mirror_richer | 1 |
| **raw_richer** | **0** ✅ |
| both_differ | 4 (trim artifact — mirror's top-10 cut off older raw hits) |
| raw_missing | 0 |

cho-tsukuyomi was initially showing 48 raw_missing because the
migration script's glob (`.x-api-data-*/raw/`) missed
`.x-api-data/raw/` (slug-less, the cho-tsukuyomi-only era's layout).
Fixed migration to walk both, then re-ran — 2,715 posts brought in.

### if7-2026-05 (94 booths)

| Bucket | Count |
|---|---|
| no_divergence | 80 |
| mirror_richer | 13 |
| **raw_richer** | **0** ✅ |
| both_differ | 0 |
| raw_missing | 1 |

Fresh full incremental pull this round: 532 new posts, 93/94 booths
(1 skipped due to API error, retryable).

### yaoyoro-2026-06 (33 booths)

| Bucket | Count |
|---|---|
| no_divergence | 6 |
| mirror_richer | 23 |
| **raw_richer** | **0** ✅ |
| both_differ | 3 (trim artifact) |
| raw_missing | 1 |

Two rounds run earlier today (12-day gap + 20-min gap) — mirror is much
richer than raw which is from 6/4.

## Bugs found + fixed during verify

1. **storage.find_user_by_username case-sensitive** — `username = ?` matched
   exact casing, missed `LOWER(@BattaHandmade) → LOWER(@battahandmade)` lookups.
   Fixed to `LOWER(username) = LOWER(?)`.
2. **FTS5 unicode61 missed Latin keywords inside CJK** — `BOOTH` in
   `にBOOTHのリンク` is one continuous CJK-Latin token to unicode61, so
   `MATCH BOOTH` returned 0. Switched `_search_one_keyword` to
   LIKE everywhere with `COLLATE NOCASE`. FTS5 still works for pure
   hashtag (#tag) queries via posts_fts directly.
3. **migrate_raw_to_mirror.py glob too narrow** — `.x-api-data-*/raw/`
   missed the cho-tsukuyomi-only era's `.x-api-data/raw/`. Added the
   second glob.
4. **upsert_user UNIQUE violation during bulk import** — when multiple raw
   files for one user shared an mtime, the snapshot insert hit
   `UNIQUE (user_id, platform, fetched_at)`. Added `ON CONFLICT DO NOTHING`
   to the snapshot insert.

## Multi-platform recon (IF7 round, parallel with X)

Run in parallel with the X mirror pull:

| Platform | Booths attempted | OK | Skipped | Elapsed |
|---|---|---|---|---|
| doujin.com.tw | 36 | 36 | 0 | 33.6s |
| Threads | 39 | 36 | 3 (Playwright traceback) | 458s |
| Plurk | 171 | 166 | 5 (`/u/<name>` URL form unrecognized + R18 wall) | 861s |
| X mirror | 94 | 93 | 1 | ~10 min |

Output:
- doujin.com.tw / Plurk / Threads JSON dumps under `.x-api-data-if7-2026-05/<platform>/`
- X tweets in the SQLite mirror (`.x-api-data/mirror.sqlite`, 4,408 → likely higher after re-migration)

## Cost recap (X API)

| Round | Reads | Cost | Notes |
|---|---|---|---|
| yaoyoro 1st (mirror, 12-day) | 648 | $3.24 | first round after migration |
| yaoyoro 2nd (mirror, 20-min) | 30 | $0.15 | 96% reduction vs bare |
| IF7 1st (mirror, 2-day) | 532 | $2.66 | this round |

Cumulative today: ~$6.05. Naive bare-fetch equivalent would have been
$4.13 × 3 = $12.39 → mirror saves ~50% in eve-of-event high-activity
window; closer to 90% in normal cadence (validated via yaoyoro 2nd).

## Status

✅ **Group 7 verify pass** — mirror SSOT is sound for all 3 events.
   No `raw_richer` cases. Trim-artifact `both_differ` cases are
   expected mechanics, not data loss.

## raw/ deprecation gate

Conditions to consider raw/ deprecation:
- ✅ Mirror is SSOT for all events (X today)
- ✅ raw_json round-trip preserved per upsert (storage v1)
- ✅ Verify pass on all 3 events (above)
- [ ] One full body-update cycle using only `post-mirror query body` JSON
      (no recon skill / raw/ fallback) — coming next with IF7 body update

When that last box is checked, follow-up openspec change
`archive-x-raw-dumps` can remove `.x-api-data-<slug>/raw/` from the
pipeline. Mirror + R2 backup is then the only persistence layer.
