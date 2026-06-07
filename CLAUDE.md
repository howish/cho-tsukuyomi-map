# cho-tsukuyomi-map — Claude project guidance

非公式 fan-guide ハブサイト (yachi8000.app)。各イベントは独立した静的サブサイト + 共通 app shell。

## 編集ガイドライン

booth body markdown を書く時は必ず [EDITORIAL_GUIDELINES.md](EDITORIAL_GUIDELINES.md) に従う。
特に以下は重要:

- **自虐 quote は転載しない** — 「下手で…」「拙作で…」みたいな作家の自己卑下表現は fact 抽出して、評価は中立に書き直す
- **推測解釈は禁止** — タイトル / フォーマット / 明示された CP / 出典 / 検証済みシリーズのみ。
  CP source が不明なら WebSearch で確認、絶対に「vibe-match」しない
- **出典 link 必須** — 「これどこ情報？」と思わせない transparency UX

## Recon pipeline — 必ず post-mirror skill 経由で

booth recon (X timeline pull、triage、search 等) は `~/.claude/skills/x-api/` を
直接叩かず、必ず project-local の `post-mirror` skill 経由で行う:

```bash
# ❌ NG: 毎回 25 tweet を bare で取り直す ($0.005/post × 25 × N booths)
~/.claude/skills/x-api/bin/run.sh timeline @handle -n 25

# ✅ OK: incremental fetch、silent-streak back-off で ~90% コスト削減
.claude/skills/post-mirror/bin/run.sh pull <username>

# ✅ OK: イベント単位の orchestrator (内部で post-mirror pull を呼ぶ)
python3 scripts/ops/pull_timelines.py <event-slug>
```

triage / diff / search はオフライン query (API call ゼロ):

```bash
.claude/skills/post-mirror/bin/run.sh query triage --usernames @a,@b
.claude/skills/post-mirror/bin/run.sh query body   --username @a   # body update agent 用 JSON
```

詳細: `.claude/skills/post-mirror/SKILL.md` /
背景の設計判断: `openspec/changes/add-x-post-mirror/`。

## OpenSpec workflow

architectural な変更は OpenSpec で `/opsx:propose <idea>` → spec review → `/opsx:apply` の流れ。
micro-iteration (UI polish / 一発 bug fix / data 補完) は今まで通り Discord で直接指示 → 即実装。

判断基準:
- 30 分以内で見える形に出来ない / 構造的に sprint 化したい → OpenSpec
- 見て直すサイクルが回せる scale → 直接

## キャッシュバスト

`index.html` の asset 参照には `?v=<timestamp>` を付けて GitHub Pages の CDN を回避する。
data.js / app.js / event-shell.css / map.jpg 等 同 origin asset を 1 つでも触ったら
**`scripts/ops/bump_cache.py` を実行**して全 index を一斉に bump する:

```bash
python3 scripts/ops/bump_cache.py
```

何やる:
- root の `index.html`、`circles/index.html`、 events.json から discover した
  全 event の `index.html` を walk
- `v=\d{10}` pattern を新しい epoch 秒に置換
- 触らなかった file は no-op、 1 個でも変更あれば「bumped <path> → v=<NEWVER>」 を print

drift 防止のため **手 sed は禁止** (一部 index 漏らすと CDN cache が food chain で
腐る + linter `scripts/audits/check_asset_versions.py` でも catch される)。

## Filter system — 4 axis (cps / tags / works / warnings)

`tags` (作品形態) と `warnings` (販売状況) は **universal vocabulary**
を root `_filters_base.js` で共有、 各 event の `filters.js` は
per-event 拡張 (CPs / works / 区分) のみ宣言。 schema authority は
[`docs/filters.md`](docs/filters.md)。

**手編集禁止** — filter 追加 / 改名 / 削除 / 軸移動は project skill
`filter-system` 経由:

```bash
.claude/skills/filter-system/bin/run.sh manage add-tag <event> <code> <label>
.claude/skills/filter-system/bin/run.sh manage rename-code <event> <old> <new>
.claude/skills/filter-system/bin/run.sh manage migrate-axis <event> --from tags --to works --auto-match
```

**booth の tags/warnings 充填** = body content を agent reasoning で
classify、 fcntl.flock 排他で apply:

```bash
.claude/skills/filter-system/bin/run.sh classify-prep <event> --chunks 4
# → agent dispatch (parallel) for each chunk per .claude/skills/filter-system/CLASSIFY_PROMPT.md
.claude/skills/filter-system/bin/run.sh apply-classify <event> /tmp/<event>-classify-chunk-N.json
```

**validator** は pre-commit hook に wire 済、 commit 時に drift 自動検出。
schema 違反 (stray code / 軸混入 / 命名違反) を transition mode で warn、
`--strict` で全 warn → error。

## 自動 scraper の禁止事項

- FB 投稿の画像は repo に commit しない (`feedback_no_repo_asset_bloat.md`)
- Threads / Plurk の R-18 画像は scrape しない
- aggregator (lit.link / linktr.ee / portaly.cc) の resolver は stdlib only、Playwright 不要

## デプロイ

- main push → GitHub Pages 自動 build
- Cloudflare Pages 経由で yachi8000.app に配信
- カスタムドメインは CNAME ファイルで固定
