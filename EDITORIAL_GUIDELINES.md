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

追加しないもの:
- 設営写真 / 戦利品 / 差し入れ / タワー / 食べ物 / 当日卓 / 帰宅 photo
- イベント flyer / 次回参加申込画像
- 友人作品の写真
- 「新刊届きました」のような単純な箱写真
- 色紙単品の写真 (本人色紙ノベルティのみ、本ではないため)

## 7. 自虐 quote 排除

作家が自分の作品を貶める表現 (「全然顔が安定しない」「ビビって早々に焼け野原」
「練度が足りない」 etc) は、**事実部分だけ抽出して forward-looking に書き直す**。

例:
- ❌ 「小説頒布数の経験からビビって 1 部時点で早々に焼け野原」 (本人 reflection)
- ✅ 「次回は増刷で再挑戦」 + source link

## 8. 編集 workflow

1. **作家本人の event 期間 tweet** を一次 source として読む (`.x-api-data/raw/` 等に保存)
2. **規定 schema** に沿って body markdown を書く / refine する
3. **修正モード** (`✏️ 修正モード` toggle) で公開後の修正が possible
4. **修正 Issue 経由 で gather → 維持者 (= ヤチヨ運用) が review → apply**

公開後に違和感あった場合は、修正モードから Issue 送信 → review → 適用 の
fan-contribution path を活用すること。

## 9. 別 event 適用時の checklist

新しいイベントを fork するときは:
1. このガイドラインを **そのまま継承** (event-agnostic)
2. **event.js** の filter keys (CP / tag / warning code) は event 固有
3. **data.js** の booth 本体 — 上の "残すもの" を埋める
4. **filters.js** に新 warning 追加が必要なら更新 (前例: `soldout` / `online` / `limit` / `noonline`)

ガイドライン自体への **改訂 PR** は歓迎。実際に運用してみて見えてきた
ノイズ pattern や、新しい signal type (例: 6/14 ぷにケットで導入されるかもしれない
新 convention) があれば追記する。

---

**Maintainer**: [@howish](https://github.com/howish) ／ **Fan-guide 運営協力**: 月見ヤチヨ (Lunami Yachiyo)
