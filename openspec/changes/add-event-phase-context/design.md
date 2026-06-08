# Design: add-event-phase-context

## Overview

Two data structures, one rule for the agent.

1. **`time_phase`** — chronological bucket of a post relative to an event date.
2. **`mentions`** — events the post text refers to (by name, hashtag, dated reference, or 配置 code).
3. **`this_event_confidence`** — a `high | med | low | none` verdict combining the two, attached to each post.

The agent uses #3 directly. The data layer never **drops** a post; it annotates. The agent decides whether to **use** the post.

## time_phase definition

Given event date `E` (single-day events) or window `[E_start, E_end]` (multi-day):

| Phase     | Window relative to event                  | Editorial meaning                  |
|-----------|-------------------------------------------|------------------------------------|
| `far_pre` | post.created_at < E − 60d                 | not yet event-prepping             |
| `pre`     | E − 60d ≤ post.created_at < E_start       | new-book / 配置 / 通販準備 announce |
| `during`  | E_start ≤ post.created_at ≤ E_end + 24h   | 当日 report, 完売 timing           |
| `post`    | E_end + 24h < post.created_at ≤ E_end + 14d | 場後 reflection, 通販開始       |
| `far_post`| post.created_at > E_end + 14d             | likely talking about the next thing |

The windows are heuristic priors, not hard cuts. The agent gets `time_phase` as a hint, but never treats it alone as proof of attribution.

## mentions extraction

`mentions` is a list of `event_slug` strings the post text refers to. Extraction sources, in order of decreasing strength:

1. **Hashtag**: each event's `event.js` exposes `hashtags: [...]`. Direct hashtag presence → strong mention.
2. **Official name**: substring match against `event.name` and any `aliases: [...]`. e.g. "ヤオヨロー", "ツクスク", "超ツク", "IF7".
3. **配置 code**: each event's `event.js` may declare `unique_booth_prefix` (e.g. `"ヤオ-"` for yaoyoro). If a post text contains the unique prefix followed by digits (e.g. `ヤオ-04`), that event gets a strong mention with no co-occurrence requirement. For events that share generic grid prefixes (`A-`, `B-`, `C-`), the booth code MUST co-occur within ~50 chars of an event identifier (name / hashtag / date) to count as a mention. Bare `B-01` alone does not produce a mention for any generic-grid event.
4. **Dated reference**: regex over Japanese date strings ("6/7", "6月7日", "2026年6月7日") that resolve to a known event's date window.

If none of the above hits, `mentions` is empty.

## this_event_confidence rule

Combining `time_phase` and `mentions`:

| time_phase | mentions includes this event | mentions includes only other events | mentions empty |
|------------|------------------------------|--------------------------------------|----------------|
| `pre` / `during` / `post` | **high** | **low** | **med** |
| `far_pre` / `far_post` | **high** | **none** | **low** |

Key cases this captures:

- **The original failure**: a yaoyoro 場後 post made 2026-06-07 — `time_phase=far_pre` relative to tsukusquare (6/21), `mentions=[yaoyoro-2026-06]`. Result: `none`. Agent skips for tsukusquare body.
- **Early-bird announce**: a tsukusquare 配置 announce 50 days early — `time_phase=pre`, `mentions=[tsukusquare-2026-06]`. Result: `high`. Used.
- **No-signal recent post**: a generic "新刊作業中" post 5 days before tsukusquare — `time_phase=pre`, `mentions=[]`. Result: `med`. Agent may use it with hedged wording.
- **Cross-event explicit**: "ヤオヨロー終わった、来週ツクスク！" — `mentions=[yaoyoro, tsukusquare]`. For tsukusquare query, "includes this event" → `high`. For yaoyoro query, also `high`. Same post legitimately shared.

## Output shape

`post-mirror query body --event tsukuyomi-square-2026-06 --username @foo` returns:

```json
{
  "username": "foo",
  "event": "tsukuyomi-square-2026-06",
  "event_date_window": ["2026-06-21", "2026-06-21"],
  "buckets": {
    "catalog": [
      {
        "id": "1234",
        "text": "...",
        "created_at": "2026-06-07T12:34:56Z",
        "url": "https://x.com/foo/status/1234",
        "event_context": {
          "time_phase": "far_pre",
          "mentions": ["yaoyoro-2026-06"],
          "this_event_confidence": "none"
        }
      },
      ...
    ],
    "sample": [...],
    ...
  }
}
```

Existing consumers that don't read `event_context` keep working — the field is purely additive.

## Agent prompt change

`CLASSIFY_PROMPT.md` and the body-update prompt template both gain a new section:

> ### Using `event_context`
>
> Every post in `buckets.*` carries an `event_context` block:
>
> - `this_event_confidence: high` — use freely.
> - `this_event_confidence: med` — use, but don't make claims about specific dates or 配置 unless the post text states them clearly. Prefer hedged wording ("予定", "～みたい").
> - `this_event_confidence: low` — the post mentions a different event by name. **Do not use as a source for the current event's body.** It may still inform circle voice / general activity, but don't attribute its content to the current event.
> - `this_event_confidence: none` — neither timing nor text suggests current-event relevance. Skip.
>
> Phrases like "場後", "本日完売", "当日", "ありがとうございました" describing a date that resolves to a different event MUST NOT appear in the current event's body, even if the post that uses them shows up in the bucket. This is the most common bleed direction.

## Validator: out-of-window-date

`scripts/validate.py` gains a check that:

1. Walks every booth's `body`
2. Regex-extracts date strings (M/D, M月D日, YYYY-MM-DD, "本日 YYYY-MM-DD")
3. For each date `D`, computes the smallest distance to any of the current event's dates
4. If distance > 60 days → emits `out-of-window-date` warn with the booth_id, date string, distance, and surrounding sentence

Severity: warn in default, error in `--strict`. Wired into pre-commit when data.js is staged. Catches the failure mode that prompted this proposal even if the agent ignores the new prompt rules.

## Edge cases

- **Multi-day events** (e.g. CH19, future C108 hub): `event.date` becomes `event.dates: ["YYYY-MM-DD", "YYYY-MM-DD"]`. `time_phase` uses min/max as the window. yaoyoro / tsukusquare / IF7 stay single-day.
- **Events with sibling identity** (超ツク 1 vs 1.5): hashtags and aliases must disambiguate. We add `hashtags: ["超ツクヨミ祭1"]` etc. to event.js to keep matches sharp.
- **Posts with quoted older content** (X "quote tweet"): only the outer text is scanned for `mentions`. We don't recursively check the quoted tweet — too noisy.
- **`mentions` matches the current event by booth_id pattern collision**: e.g. tsukusquare has B-01, IF7 also has B-01. Resolution: `mentions` requires the 配置 code to co-occur within ~50 chars of a recognizable event identifier (name / hashtag / date). Bare "B-01" alone does not produce a mention.
- **Events not yet in events.json** (rumored / WIP): they don't contribute to `mentions`. Posts about them register as "no mention" → `med` or `none` based on time. Acceptable.

## Migration path

1. Land the data-layer change behind the `--event` flag. Existing scripts unaffected.
2. Update `classify_prep.py` to always pass `--event`.
3. Update CLASSIFY_PROMPT.md + body-update prompt template (in CLAUDE.md / Discord workflow docs).
4. Re-pass the 38 tsukusquare booths. Diff-check the resulting bodies, look for `2026-06-07` references; that's the measurable signal of fix-or-not.
5. Backfill the remaining 42 tsukusquare booths under the new pipeline.

## Not in scope (deferred)

- **Mirror schema storage of `event_context`**: would require migration every time an event is added. Query-time computation is cheap (~1ms per post for the regex set).
- **Threads / Plurk integration**: same `event_context` shape will extend, but those platforms aren't in the body-update pipeline yet. Will be added when the unified-mirror story for them lands.
- **Auto-correction of existing bodies**: humans (Yachiyo + howish) still own the final read on what stays in a body. Validator just flags.
