# 編集ガイドライン — fan guide 共通

このサイトは「**中立 fan guide**」 として運営しています。各サークルの情報を
**作家本人の発信ベース** で、最小限の整形で集約することが目的です。
評価ランキング・完売予測・主観的論評は含めず、読者がブースを発見・選択する
ための **ファクト寄り** の編集方針を採用しています。

本ガイドラインは超ツクヨミ祭！1 (2026-05-24) で煮詰めた基準を、今後の
別イベント (超ツクヨミ祭1.5 / ヤオヨロー! / パンケーキ食べたい！等) でも
使い回せる形でまとめたものです。

---

## 1. 残すもの (= ファクト)

各 booth の body markdown に含めるべき情報:

- **本タイトル** (フル表記、『 』 で囲む)
- **フォーマット** — 例: `B5 / 40P / フルカラー / ¥1,500 / 全年齢`
- **一行 description** — 作家の発信文をそのまま圧縮したもの (作風説明・あらすじ要旨)
- **🛒 通販 / 委託 URLs** — メロンブックス / とらのあな / BOOTH / pictSPACE 等の
  実在販売ページ (直接 URL、shortener 経由は最終 URL に resolve)
- **🚫 通販なし declarations** — 作家が明示した「通販予定なし」「お取り置きのみ」
- **📊 完売タイムライン** — 第N部 → 全完売 の事実時系列 + 各 tweet link
- **🎯 次回参加** — concrete date + event name + 委託先 (link 必須)
- **⚠️ 部数制限 / 💴 ジャスト払い / 🎁 無配** — 作家が明示した会場 attention

## 2. 切るもの (= ノイズ / editorializing)

以下は **入れない**:

- **表紙ビジュアル description** ("表紙：かぐや (緑目) + ヤチヨ (中央マイク blonde) + 彩葉風 (右、ハート小ボックス抱き)")
  → 表紙画像が cover_urls にあるので冗長
- **サブテキスト / inset コマ** 詳細
- **editorializing 形容** — 「お得度高」「ネタ枠」「わちゃわちゃ」「ドタバタ」「とっておきの」「驚異の」「魔性の女」
- **推測・解釈** — 「= 〜示唆」「= 続編匂わせ」「= 〇〇punning」「= 2 重意味」
- **メタ annotation** — 「サークル名「〜」確定 (yyyy-mm-dd)」「配置 〇-XX 確定、map 付き sample image で確認済」
- **character glossary** — 「🦊=いろは / 🐰=かぐや / 🐙=ヤチヨ canon avatar」
  (本編知ってる読者には冗長、知らない読者には未消化)
- **作家自身の自虐 quote** — 「練度が足りない」「ビビった」「下手で」「自信ない」
  (`feedback_fan_guide_no_negative_quotes.md` 参照、forward-looking で書き直し)
- **stats** — 「34k follower」「人気サークル」 (主観評価に近い)
- **空 preamble** — 「参戦確認」「お品書き未公開」「詳細仕様 未確定」
  (本当に空なら一行で要約: 「コピ本 1 種、価格未公開」 etc)
- **地域 / 経歴 detail** — 「茨城在住イラストレーター」「商業作家ベテラン」 (※商業作家の **連載タイトル** は読者参考になるので keep)

## 3. format / 構文

- **markdown** で書く (app.js の `mdToHtml` が `**bold**`・`[text](url)`・bare URL 自動 link をサポート)
- **emoji prefix** で section を視覚区別:
  - `📊 完売タイムライン`
  - `🎯 次回参加`
  - `📦 メロンブックス 通販` / `📦 とらのあな 委託`
  - `🛒 通販あり` / `🚫 通販なし`
  - `🔁 再販予定`
  - `💌 マシュマロ感想受付`
  - `📝 サークルレポ note`
  - `📖 pixiv 投稿`
  - `🔜 続刊予告`
  - `⚠️ 注意事項`
- 各 section は **空行で区切る** (modal の縦読みやすさ)
- **link 化必須** — 上の `🎯 次回参加` / `📊 タイムライン` / 引用 quote は、必ず source tweet を `[text](URL)` で wrap
- **inline ピンポイント link** OK ([title](url) を文中に混ぜる)

## 4. tweet attribution

ファクトの **出典 tweet を `[text](URL)` で wrap** — 「これどこ情報？」 と読者が
思った瞬間に click で source 確認できることを目指す。

例:
```markdown
🎯 **次回参加**：[6/21 ツクヨミスクエア](https://x.com/handle/status/...)
📊 **完売タイムライン**：[第一部](https://x.com/.../status/A) → [第二部](https://x.com/.../status/B) → [全完売 / 撤収](https://x.com/.../status/C)
```

**警告 chip (warnings)** にも `[code, label, source_url]` の 3 要素タプルで
出典 URL を保持。app.js は URL ある warning は clickable な `<a>` で render する。

## 5. 完売タイムラインの link 先選定

- **全完売 chip** (✅ 完売御礼) のリンクは:
  1. 「完売御礼」「全完売」「完売&撤収」「撤収しました」のいずれかを含む tweet を **優先**
  2. 該当なしの場合は、最も**遅い時刻** の 完売 tweet を選択
- **partial 完売** (第N部完売) は単独で chip 化しない、body の 📊 完売タイムライン
  section に時系列で並べる

## 6. 画像追加 (cover_urls)

カルーセルに追加するのは:
- **お品書き** (本体 + 修正版)
- **本表紙** (新刊・既刊どちらでも)
- **サンプルページ** (本文の一部)
- **FA** (お品書き が無い booth 限定で 1〜2 枚、 booth identity 補完用)

追加しないもの:
- 設営写真 / 戦利品 / 差し入れ / タワー / 食べ物 / 当日卓 / 帰宅 photo
- イベント flyer / 次回参加申込画像
- 友人作品の写真
- 「新刊届きました」のような単純な箱写真
- 色紙単品の写真 (本人色紙ノベルティのみ、本ではないため)

### 6.1 優先順位 / カルーセル順序

1. **お品書き** (本体 → 修正版)
2. **本表紙** (新刊 → 既刊)
3. **サンプルページ** (本文の一部)
4. **FA** (お品書き 無い booth のみ、 補完目的)

→ カルーセルは **「全体俯瞰 → 個別商品 → 中身覗き見」** の順序、 読者が
booth を一瞥して何売ってるか把握できるように。

### 6.2 複数本 booth の構成

booth に新刊 N 冊 ある場合:
- **お品書き 1 枚 + 各本表紙 1 枚 ずつ** (= 1 + N 枚)
- 既刊・寄稿本も多い場合は **お品書き優先**、 既刊表紙は 1〜2 枚 selective
- 本ごとにサンプル ページ を入れたい場合は §6.1 の順位で各本タプル: 表紙→サンプル

### 6.3 source_url と display_url の使い分け

`cover_urls` の各 entry は `{ source_url, display_url, display_locked? }`:

- **`source_url`**: 出典 **post の URL** (tweet / plurk / threads / FB 投稿 URL)
  - ❌ 画像 直 URL を入れない (`https://pbs.twimg.com/media/...`)
  - ✅ 該当画像を含む 元 post の URL を入れる (例: `https://x.com/handle/status/123`)
  - 読者が画像をタップ → 元 post の文脈 (キャプション・スレッド・反応) に飛べる
- **`display_url`**: 実際に表示する 画像 URL
  - X / Threads / IG / Plurk: 各 CDN の orig URL を **直貼り** (R2 不要)
  - **FB のみ**: hot-link block 対策で R2 経由 (詳細 §6.4)
- **`display_locked: true`** (任意): R2 / image-proxy / mosaic / cross-fade 等
  **手作業で 加工した cover** を 「更新時に display_url を上書きしない」 保護フラグ。
  apply-issue.py の R2 orphan 検出 を bypass。

### 6.4 R2 ホストは「自動 expiry CDN 系」 用

R2 (`images.yachi8000.app/...`) を使うのは **CDN URL が自動的に expire する platform** に限定:

| Platform | CDN | 期限 | R2 使う？ |
|---|---|---|---|
| FB | `scontent-*.fb.cdn.net` | hot-link block + 期限 | **YES** |
| Threads | `instagram.f*.fbcdn.net` | `oe=` token ~2ヶ月 | **YES** |
| IG | `instagram.f*.fbcdn.net` | `oe=` token ~2ヶ月 | **YES** |
| X (Twitter) | `pbs.twimg.com` | 期限なし (post 削除時のみ消失) | NO |
| Plurk | `images.plurk.com` | 期限なし | NO |
| Bluesky | `cdn.bsky.app` | 期限なし | NO |
| pixiv | `i.pximg.net` | hot-link block (referrer 必要) — R2 にミラーする選択肢あり | TBD |

それ以外 (X / Plurk / Bsky) は **直 CDN リンクで OK** — anonymous fetch 可能 + URL stable。
post-deletion 時は cover も消えるが、 それは著者意図として受け入れる (= 故意 archive は
しない、 残したい場合は手動 R2 アップで `display_locked: true`)。

過去 event (cho-tsukuyomi-2026-05 / if7-2026-05) で X/Plurk/Bsky を R2 化していた entry は
**順次 直 URL に戻す** (新規 event は §6.4 適用)。 FB/Threads/IG はそのまま R2 維持。

## 7. 自虐 quote 排除

作家が自分の作品を貶める表現 (「全然顔が安定しない」「ビビって早々に焼け野原」
「練度が足りない」 etc) は、**事実部分だけ抽出して forward-looking に書き直す**。

例:
- ❌ 「小説頒布数の経験からビビって 1 部時点で早々に焼け野原」 (本人 reflection)
- ✅ 「次回は増刷で再挑戦」 + source link

## 8. 生 quote 禁止 — factual summary + 出典 link で置換

作家本人の post 文を **そのまま 引用ブロック (`> ...`) でコピペするのは禁止**。
読者から見ると「fan guide が原文を切り取って勝手に文脈付けてる」 ように
読めて、 不信感を招く。 代わりに:

- 商品 (本タイトル / 規格 / 価格 / CP) + 当日 attention (特典 / 限定 / 競標 etc) を
  **factual summary** として 1 ~ 2 行で抽出
- 出典は末尾に `- [原 post](url)` 形式で **明示的 link 化**

例:
```markdown
❌  ## 📝 作家お品書き / まとめ post
    > 【0507】滑壘領小蛋糕！！！順便強制大家看我填OC表格(?)
    > 叭叭叭！不放過任何機會順便宣傳—— 05/30IF創集繪將帶著這本去擺攤
    [出典 post](https://...)

✅  ## 📝 CH19 出展ハイライト
    新刊 **『Bride of the Forest』** 持込
    - [原 post (出展告知)](https://...)
```

`§7 自虐 quote 排除` と合わせて、 「**作家の事実発信を中立 fan guide voice で
再パッケージ**」 が基本姿勢。

## 9. body の言語は event audience に合わせる

event.js の `language` が指す言語 = booth body の prose 言語。 zh-tw 設定の event
(TW 即売会) で booth body を JP 文法で書くと、 modal 詳細を開いた現地読者から
すると「日本人向け fan guide にウチらの booth が並んでる」 違和感になる。

- **prose は ZH-tw**: 「持込」→ 「帶來」 / 「受付中」→ 「開放中」 / 「次回参加」→
  「下次參加」 / 「〜の間」→ 「〜之間」 / 「~た済」→ 「已~」 / particle (は/が/を/に) は drop
- **作家本人が JP で発信した book title (e.g. 『マーガレット』, 『大学妄想學趴』) は
  そのまま JP** — それは作家の選んだタイトル、 翻訳しない
- **共有 CJK 漢字 (新刊 / 通販 / 委託 / 既刊 / 印量調查 / 攤位 etc) は両言語で同じ意味
  なので OK**
- **超かぐや姫 関連 character / 作品名は localized title** (`memory/cho_kaguya_localized_titles.md`
  参照): かぐや → 輝耀姬 / 輝夜姬、 八千代彩葉 → 八千代彩葉 (CP 名)

例:
```markdown
❌ T29 出展 ／ 既刊 『十度寢』 (東方 蓮メリ) 持込予定 ／ 通販 + 電子書 並行中
✅ T29 出展 ／ 既刊 『十度寢』 (東方 蓮メリ) 預計帶來 ／ 通販 + 電子書 並行中

❌ 新刊 ういさき 本 (吸血鬼 初華 × 貴族大小姐 祥子) ／ 印量調查 受付中
✅ 新刊 ういさき 本 (吸血鬼 初華 × 貴族大小姐 祥子) ／ 印量調查 開放中
```

JP event (e.g. 超ツクヨミ祭 cho-tsukuyomi-2026-05) では逆に prose を JP で書くのが
正しい。 event ごとに language 設定 + body 言語が一致するように。

## 10. 編集 workflow

1. **作家本人の event 期間 tweet** を一次 source として読む (`.x-api-data/raw/` 等に保存)
2. **規定 schema** に沿って body markdown を書く / refine する
3. **修正モード** (`✏️ 修正モード` toggle) で公開後の修正が possible
4. **修正 Issue 経由 で gather → 維持者 (= ヤチヨ運用) が review → apply**

公開後に違和感あった場合は、修正モードから Issue 送信 → review → 適用 の
fan-contribution path を活用すること。

## 11. body section ordering (固定)

booth body は **以下の順** で section を並べる (空 section は省略、 中身ある section だけ書く):

1. `## 📝 <event_short_name> 出展重點` (新刊・既刊・特典・無配・サンプル等、ここに集約)
2. `## 📦 既刊 委託通販` (メロン/とら/BOOTH/pictSPACE/通販リンク群)
3. `## 🎯 次回参加` (concrete date + event 名 + 委託先 link)
4. `## ⚠️ 注意事項` (R-18 / 部数制限 / ジャスト払い / 配置変更 等)
5. `## 🎪 場後 (YYYY-MM-DD evening)` (完売 / 通販上架 / 場後告知、 イベント後にのみ追加)
6. `出處: [...](...) / [...](...)` (最終 行、 source tweet/post link を `/` 区切りで列挙)

複数 section ある場合は **空行で区切る**。 `出處:` line は必ず body の最後。

## 12. price / format 表記 schema

新刊・既刊の format は **slash 区切り** で固定:

```
B5 / 40P / フルカラー / ¥800 / R-18
```

順序: **サイズ / ページ数 / 装丁・色 / 価格 / 年齢制限**
- サイズ: B5 / A5 / B6 / A4 / 文庫 等
- ページ数: NNP (P 必須)
- 装丁・色: 「フルカラー」「モノクロ」「特殊装丁」「4色+蛍光ピンク」 等。 無ければ省略
- 価格: ¥NNN (JP event) / NT NNN (TW event) — 通貨記号 + 数値、 円表記なし
- 年齢制限: 「全年齢」「R-18」「R-15」 — 全年齢なら省略可

例:
```markdown
- **新刊**『〇〇』 B5 / 40P / フルカラー / ¥1,500
- **新刊**『△△』 B5 / 20P / 4色+蛍光ピンク / ¥400 / R-18
- 既刊『□□』 A5 / 16P / モノクロ / ¥500
```

## 13. 情報未確定 case の short form

「お品書き未公開」「直近 X 活動なし」「進捗報告のみ」のような **meta annotation
は §2 違反** (空 preamble に近い)。 代わりに 1 行 short form で済ます:

```markdown
詳細は当日告知待ち、 [@handle X profile](https://x.com/handle)
```

または

```markdown
詳細は当日告知待ち、 source 情報なし
```

handle 無し booth (公式 SNS 未公開) は:

```markdown
公式 SNS handle 情報なし、 詳細不明
```

これで `## 📝 出展重點` section 1 行で完結する。 「最近活動してない」 等の
評価判定は読者に委ねる。

## 14. 別 event 適用時の checklist

新しいイベントを fork するときは:
1. このガイドラインを **そのまま継承** (event-agnostic)
2. **event.js** の filter keys (CP / tag / warning code) は event 固有
3. **data.js** の booth 本体 — 上の "残すもの" を埋める、 §11 section ordering / §12 price schema / §13 short form に従う
4. **filters.js** に新 warning 追加が必要なら更新 (前例: `soldout` / `online` / `limit` / `noonline`)

ガイドライン自体への **改訂 PR** は歓迎。実際に運用してみて見えてきた
ノイズ pattern や、新しい signal type (例: 6/14 ぷにケットで導入されるかもしれない
新 convention) があれば追記する。

## 15. booth schema 拡張: 寄攤 / 委託 partners (Phase B-small, 2026-06-02)

**問題**: 「1 circle = 1 author = 1 booth」 の暗黙前提では、 寄攤 (consignment、 1 booth で他作家の本を併売) や 合本 (1冊 N作家) を first-class に扱えなかった。 cover_url の author mismatch audit で誤検出が出ていた (T-35 のKー雪一寄攤、 U-30 の河豚老師寄攤 等)。

**Phase B-small 解 — booth に optional な配列フィールド** (object 形式、 multi-platform 対応):

```json
{
  "booth_id": "U-30",
  "circle_id": "melon2943",
  "consignment_partners": [
    {"platform": "x", "handle": "_icpfo1", "name": "河豚老師"},
    {"platform": "threads", "handle": "usagi._.novelist", "name": "菟子老師"}
  ],
  ...
}
```

**field 形式**:
- `platform`: `x` / `threads` / `plurk` / `bsky` / `pixiv` / `fb` / `ig`
- `handle`: platform 上の handle (no `@` prefix、 X は lowercase preferred)
- `name`: 表示名 (optional、 未指定なら circles.json lookup で X handle のみ自動補完)

**legacy 形式** (Phase A、 2026-06-01 〜 2026-06-02 朝):
- `consignment_partners: ["_icpfo1"]` の bare string 配列も後方互換でサポート
- platform 推定: 文字列単体は X handle として扱う
- 既存 entry は object 形式に migrate 推奨 (script + chip UI 両方とも互換だが、 新規追加は object 形式で)

**semantics**:
- 配列は **per-event / per-booth** — circle の永続的な属性ではなく、 「この event でこの booth が一時的に carry する寄攤作家」 を意味する
- 円形的な partner (常時 co-circle、 S-37/38 等) は `circles.json` の `socials` list に入れる方が長期的に正解
- 短期 / 一回限り (寄攤、 委託、 collab promo) はここに入れる

**運用効果**:
- `audit_cover_author_match.py` + `prune_mismatched_covers.py` が `platform="x"` entries を partner_handles として認識
- legacy の `.cover_author_allowlist.json` は廃止 (Phase A migration 完了済)
- modal の chip UI: platform-specific URL prefix (`x.com/` / `threads.com/@` / `plurk.com/` etc.) でクリック → 正しい profile へ
- 今後 寄攤 のある booth は body 内に `寄攤: @handle (作品名)` と書き、 同時に `consignment_partners` に object として追加する

**未対応 (Phase B-big-2 候補)**:
- 合本 (1冊 N作家) の contributors 表現 — まだ body text only
- books[] 別 table の導入 (合本に N authors を first-class で関連付け)

## 16. author 分離 (Phase B-big-1, 2026-06-02)

**問題**: 旧 schema では 1 circle に 1 author 暗黙紐付けされ、 同一作家・複数 circle 名義や multi-author circle (e.g. 百合餓狼之盟 — 小艾＋蕗舟＋寄售) を first-class に表現できなかった。

**新 schema**: `circles.json` に top-level 2 array:

```json
{
  "circles": [
    {"id": "kourui_07", "circle_name": "黑夜與金月", "members": ["kourui_07"], "socials": [], "events": [...]}
  ],
  "authors": [
    {"id": "kourui_07", "name": "kourui", "x_handle": "kourui_07", "x_url": "...", "socials": [...]}
  ]
}
```

**field 分離**:
- `circles[].members[]`: author ID 配列。 solo = 1、 multi-author = N。 順序 = primary first
- `circles[].socials[]`: circle-level (FB page、 blog、 commerce link 等)。 solo case はほぼ空
- `authors[].socials[]`: 個人 socials (X / pixiv / personal blog 等)、 person-level identity
- `authors[].x_handle` / `x_url`: 個人 X 識別
- `authors[].name` / `name_inferred` / `name_source`: **4-state schema** (下記 §16.1)

### 16.1 author.name の 4 状態 (2026-06-02)

「circle 名と作家名が同じか分からない」 が頻繁に起きる。 default で circle 名を author name に流し込むと、 後から本当の名前判明した時 「これ確認済? 推測?」 区別不能になり incremental update が chaos 化。

**4 状態 schema**:
```json
{
  "id": "ウサホリ_id",
  "name": "",                       // 確定情報 (user 入力済)
  "name_inferred": "ウサホリ",       // 推測値 (= circle 名 or x_handle、 display fallback)
  "name_source": "circle_name"     // "user" | "circle_name" | "x_handle" | ""
}
```

| 状態 | name | name_inferred | name_source | 意味 |
|---|---|---|---|---|
| **ない** | (entry 非存在) | — | — | author 概念が circle に無い (rare) |
| **まだ知らない** | `""` | `""` | `""` | author 存在は確実、 名前未特定 |
| **推測した** | `""` | 何か | `"circle_name"` / `"x_handle"` | 推測値あり、 未確認 |
| **確定** | 何か | `""` (移動済) | `"user"` | 確認済 |

**display fallback** (UI):
```
name || name_inferred || circle_name || id
```
→ user は何かしらの名前を見るが、 開発者は schema 上で「これ確認済 vs 推測」 を区別できる

**migration** (`2026-06-02 実行済`):
- 元 `c.author` が set されてた 67 case → `name=<value>, name_inferred="", name_source="user"`
- 元 `c.author` が空 (default で circle_name に流し込まれてた) 567 case → `name="", name_inferred=<circle_name>, name_source="circle_name"`
- ghost contributors (books から、 circle 無し) 28 case → 既存 name そのまま

**今後の運用**:
- 新 author 追加時、 確実な名前は `name` に、 推測は `name_inferred` に
- 名前判明したら `name_inferred` → `name` に格上げ (rule of thumb: source = "user" に変更も)
- 自動 derivation (extract_circles.py) は default で `name=""` 維持 — 安易に「埋めた」 感を出さない

**派生 query**: `name == "" && name_source == "circle_name"` で 「要確認 author」 一覧抽出可能。 将来 audit script に「未確認率」 metric 追加候補。

**ID 規約**:
- author.id = X handle (lowercase) を主 / なければ `a_<hash>`
- circle.id = primary member の X handle (lowercase) を主 / なければ `c_<hash>`
- 1:1 solo case: circle.id == author.id (URL 互換性のため意図的)

**runtime export** (`circles.js`):
- `window.CIRCLES_BY_ID`: circle 全件 (含 members[])
- `window.AUTHORS_BY_ID`: author 全件 (含 socials)
- app.js / circles/circles.js が hydrate 時に primary member の field を booth/circle に展開、 既存 render code が透過動作

**multi-author circle の追加方法**:
```json
"members": ["main_author_id", "guest_author_id"]
```
新 author を `authors[]` に追加、 circle.members に append。 mechanical migration では識別困難な case (e.g., 百合餓狼之盟 / S-37/38 小花 / U-21/22 日初翱祥 等) は順次 manual update。

**audit / prune の挙動**:
- `audit_cover_author_match.py` + `prune_mismatched_covers.py` は circle.members を全 iterate、 各 author.x_handle + author.socials の handle を partner_handles として収集
- + circle.socials (circle-level)
- + booth.consignment_partners (Phase B-small)

**migration script**: `scripts/migrate_to_authors_split.py` (one-time、 2026-06-02 実行済)。 以後 `extract_circles.py` が canonical extractor、 認識済 circle.members を respect しつつ event lists を re-build。

**未対応**:
- 同一作家・複数 circle 名義の merge は author.id 共有で表現可能、 ただし mechanical 検出には NLP / 手動 review 必要 (B-big-1 で schema は ready、 個別 case を識別したら author.id を統合)

## 17. books[] 別 table (Phase B-big-2, 2026-06-02)

**問題**: 合本 (1冊 N 作家合著) は circle 単位では表現できない (1 circle が出版する書籍 1 つに複数作家 contributors)。 body text の中 だけに「12 作家合著: A, B, C...」 と書かれてて、 検索 / cross-link 不可能だった。

**新 schema**: `circles.json` の top-level に `books[]` 追加:

```json
{
  "circles": [...],
  "authors": [...],
  "books": [
    {
      "id": "cpk_remix",
      "title": "『CPK《Remix》』",
      "circle_id": "c_84f117140304",   // 発行 circle (寄攤 元 でも OK)
      "contributors": ["a_xxx", "a_yyy", ...],   // author IDs
      "event_ids": ["if7-2026-05"],
      "format": "A5/98P/全年齡",
      "price": 250, "currency": "NT",
      "kind": "anthology",             // "anthology" | "single"
      "cps": ["iroka", "iroyachi"], "tags": ["super-kaguya"],
      "note": "..."                    // optional 説明
    }
  ]
}
```

**ghost author**:
- contributors のうち X handle わからない case は **hash-derived author id** (`a_<sha8>`) で minimal entry 作成 (name のみ、 socials 空)
- 後で handle 判明したら author entry 充実、 id 共有で他の book / circle と link

**runtime export** (`circles.js`):
- `window.BOOKS_BY_CIRCLE`: `{circle_id: [book, book, ...]}` 形式 (booth modal が circle_id key で即 lookup できる用)
- 全 books array は circles.json で SSOT、 runtime には inverted index のみ

**UI**:
- modal の meta section 直後に `📚 発行合本` section
- `<details>` で expandable、 default closed
- 各 book: title / format / price + contributor chip list (X handle あれば click → profile)
- contributor chip は author table から name + x_url を resolve

**初期 dataset** (4 既知合本):
- T-16 `mofu_mofu_paradise` (5 作家)
- T-30 `flawless_dreamers` (5 作家)
- T-36 `cpk_remix` (12 作家)
- T-42 `mbcc_kyokuchou_to_kanojo` (6 作家)

合計 661 authors (628 = 既存 + 33 = ghost)、 4 books。

**Workflow** (新 合本 追加時):
1. circles.json の `books` array に新 entry 直 push (id 重複避け)
2. 必要なら新 contributor を `authors` array に append (ghost OK)
3. `python3 scripts/extract_circles.py` で `circles.js` 再生成
4. modal で自動表示

**未対応 (Phase B-big-3 候補?)**:
- author page (`/author/<id>/`) で 「contributed to: 合本 A, B...」 cross-event list
- 既存 booth.body 内の「作家群: ...」 text を books[] に migrate (自動化困難、 segment manual)

---

**Maintainer**: [@howish](https://github.com/howish) ／ **Fan-guide 運営協力**: 月見ヤチヨ (Lunami Yachiyo)
