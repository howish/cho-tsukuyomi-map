# 超ツクヨミ祭 第1回 サークル ガイド (非公式 fan guide)

🌙 **2026年5月24日 (日) 11:00-15:30** に立川クリエイティブスペースで開催される [超ツクヨミ祭！1](https://sengendo.a.la9.jp/chokagutop.html) (映画『超かぐや姫！』 オンリー同人即売会) の **非公式 fan guide サイト**。

🔗 **公開 URL**: https://howish.github.io/cho-tsukuyomi-map/

## 機能

- 会場マップ + 全 ~48 サークルの一覧 (A 列 / B 列 / C 列で整理)
- 各ブースをタップで作家名 / お品書き画像 / X リンク / 価格 / 注意事項を表示
- **CP フィルター** (絵文字 + 順序不問、トリオは独立カテゴリ):
  - 🦊×🐰 いろかぐ
  - 🦊×🐙 いろヤチ
  - 🦊×🌸 いろろか
  - 🌟 三人
- **タグフィルター**: 🔞R-18 / 🤝合同 / 🎁無配 / 📚委託 / 📕漫画 / 📖小説 / 🎨イラスト本 / 🛍グッズ
- **重要アラート** カード上に直接表示:
  - ⚠️ 再販なし — 当日逃すと再入手不可
  - 💴 ジャスト払い推奨 — 釣銭少なめ / 高額紙幣 NG
  - 🎫 部数制限 — 部別在庫 / 1限など
- 複数フィルター AND 結合 + サークル名/作家/X handle/ブース ID 検索
- ブースカードに **starting price** (¥N〜) ヒント表示
- 表示中ブース数の statistics (絞り込み中表示)
- レスポンシブ対応 (会場で mobile から閲覧、sticky filter で快適スクロール)
- **PWA**: ホーム画面に追加で アプリ化 (Safari「ホーム画面に追加」、Chrome「インストール」)
- **deep-link**: `#A-04` を URL に付けるとそのブースが直接開く
- **share** ボタン: Web Share API / クリップボードコピー
- **back-to-top** floating button
- アクセシビリティ: キーボード操作可能 (Tab + Enter/Space)、Esc でモーダル閉、focus ring

## CP 絵文字対応 (canon avatar 準拠)

- 🦊 = いろは (狐 avatar、canon)
- 🐰 = かぐや (兎 avatar、canon)
- 🐙 = ヤチヨ (乙姫 / ウミウシ系 海洋モチーフ、canon。fan shorthand では 🐙)
- 🌸 = 芦花 (名前の「花」 から、fan convention)

## 中立 fan guide ポリシー

本サイトは **factual 情報** (サークル名 / 作家 / X リンク / お品書きの仕様 / 注意事項 / 配置) の中立 aggregator として運営。

**順位付け / 完売予測 / 必訪マークなどの evaluative ranking は意図的に含めていません** — 各サークルの評価は閲覧者・参加者が直接 X 投稿 / お品書き / 当日の作品を見て判断するのが本筋。

## データソース

- 各サークルの **X 投稿 / お品書き画像** をベースに、2026-05-22 〜 23 に集約
- 各ブースの "🔗 X で開く" リンクから 原典確認可能
- 表紙画像は X media CDN への hot-link、原寸表示は画像クリックで X 投稿へ

## 注意事項

- **非公式 fan guide** です。公式情報は [超ツクヨミ祭公式 (仙弦堂)](https://sengendo.a.la9.jp/chokagutop.html) を最終確認に
- 会場マップ画像は © 仙弦堂・超ツクヨミ祭運営。引用範囲内での利用
- お品書き / 情報は各サークル作家の X 公開ポストから引用、誤り・更新は **X リンク** 経由で原典確認推奨
- 一部サークル (B-07 / A-03 / C-01 / C-07) は本ガイド時点で表紙画像なし、当日 listing 要確認

## 更新 / 修正

修正・追加情報あれば：
- [Issue](https://github.com/howish/cho-tsukuyomi-map/issues) を立てる
- [Pull Request](https://github.com/howish/cho-tsukuyomi-map/pulls) で `data.js` を直接更新

PR welcome 🌿

## Tech

- Plain HTML / CSS / vanilla JS (no framework)
- GitHub Pages デプロイ
- Built 2026-05-23 by [@howish](https://github.com/howish)

---

*Site generated 2026-05-23 — info reflects state at that time. Verify with venue/listing on event day.*
