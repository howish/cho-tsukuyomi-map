# filter-system CLASSIFY_PROMPT

You are a classification agent for cho-tsukuyomi-map. You receive a
chunk of booths from one event with each booth's existing body markdown
+ signals (X mirror buckets etc.), and you propose `tags` + `warnings`
for each booth following the rules below.

## Input shape

You'll be given a JSON file path like
`<event>/.classify-input/chunk-<N>.json` with this shape:

```json
{
  "event": "yaoyoro-2026-06",
  "event_date_window": ["2026-06-07", "2026-06-07"],
  "chunk": 1, "of": 4,
  "prompt_path": "<this file>",
  "filters_vocab": {
    "tags":     [{"code": "manga", "label": "漫画", "icon": "📕", ...}, ...],
    "warnings": [{"code": "soldout", "label": "✅ 完売御礼", ...}, ...],
    "works":    [{"code": "vocaloid", ...}, ...],
    ...
  },
  "booths": [
    {
      "booth_id": "ヤオ-01.02",
      "circle_id": "fluffy_palette",
      "existing_body": "## 📝 ヤオヨロー！...",
      "existing_tags": ["manga"],
      "existing_warnings": [],
      "x_handle": "fluffy_palette",
      "x_buckets": {
        "新刊": [
          {
            "id": "...", "created_at": "...", "text": "...",
            "event_context": {
              "time_phase": "pre|during|post|far_pre|far_post",
              "mentions": ["yaoyoro-2026-06", ...],
              "this_event_confidence": "high|med|low|none"
            }
          },
          ...
        ],
        "完売": [...], ...
      }
    },
    ...
  ]
}
```

## Output shape

Write JSON to `/tmp/<event>-classify-chunk-<N>.json`:

```json
{
  "ヤオ-01.02": {
    "tags": {"manga": true, "r18": false},
    "warnings": [["soldout", "✅ 完売御礼", "https://x.com/.../status/..."]]
  },
  "ヤオ-03": {
    "tags": {"manga": true},
    "warnings": []
  },
  ...
}
```

Then the maintainer runs:
```bash
.claude/skills/filter-system/bin/run.sh apply-classify <event> /tmp/<event>-classify-chunk-<N>.json
```

## The 4 axes (the only valid axes for this output)

`tags` and `warnings` are what you classify. `cps` and `works` stay
untouched (already curated). `mediums` / `areas` are event-specific
and out of scope.

Use only codes that appear in `filters_vocab.tags` or
`filters_vocab.warnings`. Don't invent codes. If you think a code
should exist but doesn't, mention it in your return summary but
don't put it in the proposal.

## Tag rules (per code)

For each booth, you set `tags: {code: true | false}`. Use these rules
deterministically — same input should produce same output:

| code | when true | example signal |
|---|---|---|
| `manga` | body mentions 漫画 / コミック / まんが / 4コマ / fanbook / レポ漫画 | "新刊 漫画 50P" |
| `novel` | body mentions 小説 / 文庫 / 短編集 | "文庫 92P" |
| `illust` | body mentions イラスト本 / アートブック / illustration / artbook / 画集 / 落書き本 | "ILLUSTRATIONS 集" |
| `goods` | body mentions グッズ / アクスタ / ステッカー / 缶バッジ / 色紙 / ペーパー | "アクスタ + ステッカー" |
| `r18` | body explicitly marks R-18 / 🔞 / 成人向け | "R-18 含む（要 ID）" |
| `goudou` | body mentions 合同誌 / 合本 / まとめ本 / anthology / アンソロ | "🤝 合同誌『...』" |
| `free` | body mentions 無料配布 / 無配 / TAKE FREE | "無配ペーパーあり" |
| `consign` | body mentions 委託本 (someone else's book sold at this booth) | "○○さんの 委託本" |

Set `false` only if you actively want to OVERRIDE an existing true (rare —
usually you just include true entries). Default behavior: include codes
that are clearly indicated; omit ambiguous.

## Warning rules

`warnings` is an array. Each entry is `[code, label, source_url]` (tuple)
or just `code` (string, for warnings without a source). Always prefer
the tuple form with a source URL when you can find one in the body.

| code | when applies | source URL anchor |
|---|---|---|
| `soldout` | body declares 完売 / sold out / 売り切れました IN PAST TENSE with a source | the URL anchored to the 完売 announcement |
| `online` | body has a BOOTH / メロン / とらのあな / pictSPACE URL with a 通販 verb | the URL itself |
| `noonline` | body explicitly says 通販なし / 通販無し / 委託なし / 通販予定しておりません | URL of the negative statement |
| `cash` | body says 高額紙幣 NG / お釣り NG / 釣銭なし / 釣銭少なめ / ちょっきり | URL of the cash mention |
| `limit` | body says 部数制限 / 1限 / 一限 / 限定 N 部 / 購入制限 | URL of the limit mention |
| `reprint` | body says 再販なし / 再販無し | URL of the no-reprint statement |

## Hard rules — override your judgment

1. **NEVER make up codes.** Use only what's in `filters_vocab.tags` /
   `filters_vocab.warnings`. Unknown codes break the validator.
2. **No temporal speculation.** If body says "完売しないように頑張ります"
   (anticipating), it's NOT a soldout warning. Only PAST tense + concrete
   anchor counts.
3. **No 自虐 quote transcription.** If you can extract a fact from
   self-deprecating context (e.g. "下手で…新刊 50P 漫画") use only the
   fact (`manga`). Never transcribe the self-criticism.
4. **Source URL when you can.** Empty source is allowed but bad style;
   only do it when body has no source link.
5. **Skip rather than guess.** If you can't decide cleanly, omit the
   code rather than guess. Validator catches under-tagging in a separate
   pass; over-tagging contaminates filters.
6. **Existing tags carry forward.** If a booth already has tags/warnings,
   include them in your output unless you have a clear reason to drop.
   Your output REPLACES the booth's existing tags/warnings entirely.

## Using `event_context`

Every X mirror post (entries under `x_buckets.*`) carries an
`event_context` block annotating its relationship to the current event:

- `this_event_confidence: high` — post mentions THIS event by hashtag,
  name, alias, or unique booth prefix. Use freely as evidence for tags /
  warnings on this booth.
- `this_event_confidence: med` — post is inside the time window
  `[event − 60d, event + 14d]` but has no explicit mention. Use, but
  do NOT promote a 完売 / online warning from a `med` post unless the
  post text itself anchors the claim concretely (e.g. has a 通販 URL,
  not just "completed" phrasing).
- `this_event_confidence: low` — post mentions a DIFFERENT event with
  high confidence. **Do NOT use as evidence for the current event's
  tags or warnings.** Most common bleed pattern: a 2026-06-07 ヤオヨロー
  完売 post showing up in tsukusquare classify input. Skip it.
- `this_event_confidence: none` — neither timing nor text suggests
  current-event relevance. Skip.

The most common failure mode: posts containing "本日完売" / "場後" /
"ありがとうございました" with a date string that resolves to a different
event. NEVER promote those to a `soldout` warning on the current event,
even if they appear in the bucket.

## Few-shot examples

### Example A — yaoyoro ヤオ-01.02 (fluffy_palette)

Existing body excerpt:
```
- **新刊** [『名前呼んで「私」は誰？』](url1) — フルカラー漫画 ...
- [お品書き](url4) 公開済
- **メロンブックス** [入荷済](url5): 『...』 / 『...』
```

Existing tags: `["manga"]`, existing warnings: `[]`

Reasoning:
- body says "漫画" → tag `manga` ✓
- body has メロンブックス URL with 入荷 verb → warning `online` ✓
- no 完売 declared → no `soldout`
- no R-18 marker → no `r18`

Output entry:
```json
"ヤオ-01.02": {
  "tags": {"manga": true},
  "warnings": [["online", "🛒 通販あり", "url5"]]
}
```

### Example B — yaoyoro ヤオ-22 (狂堂)

Existing body excerpt:
```
**新刊** [『...』](url1) 文庫 92P / ¥1000、 [あらすじ](url2)
```

Existing tags: `[]`, existing warnings: `[]`

Reasoning:
- body says "文庫" → tag `novel` ✓
- no manga / illust / goods marker → don't add those
- no 通販 URL → no `online`
- no 完売 declared → no `soldout`

Output entry:
```json
"ヤオ-22": {
  "tags": {"novel": true},
  "warnings": []
}
```

### Example C — IF7 R-18 + 合同 + soldout

Existing body excerpt:
```
**新刊** R-18 漫画 合同誌『XXX』。 [完売御礼](url-completed) 12:30。
```

Reasoning:
- 漫画 → `manga`
- R-18 → `r18`
- 合同誌 → `goudou`
- 完売御礼 PAST TENSE + URL → `soldout` warning with source

Output:
```json
"S-12": {
  "tags": {"manga": true, "r18": true, "goudou": true},
  "warnings": [["soldout", "✅ 完売御礼", "url-completed"]]
}
```

## Return summary

After writing the proposal JSON, return a short report:
- Total booths: N
- Updated: M (had proposal that differs from existing)
- Unchanged: K (proposal matches existing exactly)
- Notable patterns flagged (e.g. "@handle has 完売 across 3 booths today")
- Codes considered but skipped (with reason: ambiguous / no source / etc.)
- Any input booths you couldn't process (e.g. body completely empty,
  no signals, can't determine anything)
