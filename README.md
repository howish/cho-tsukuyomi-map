# 同人即売会 サークルガイド — テンプレート (event-guide-template)

🌙 任意の **同人即売会 (オンリーイベント / アンソロイベント) の非公式 fan guide サイト** を 1 ファイル差し替えで作れるテンプレート。

このリポジトリは **超ツクヨミ祭 第1回 (2026-05-24 立川)** の guide として運用中：
🔗 **公開 URL**: https://howish.github.io/cho-tsukuyomi-map/ / http://yachi8000.app/

---

## 機能

- 会場マップ + 全サークル一覧 (列単位でグルーピング表示)
- 各ブースタップで作家名 / お品書き画像 (複数枚 横スワイプ) / X リンク / 価格 / 注意事項を表示
- **CP フィルター** (絵文字 + 順序不問、トリオは独立カテゴリ)
- **タグフィルター** (R-18 / 合同 / 無配 / 委託 / 漫画 / 小説 / イラスト本 / グッズ など、Union 結合)
- サークル名・作家名・X handle・ブース ID 検索
- **⭐ お気に入り** (localStorage、フィルター可)
- ブースカードに 価格ヒント (¥N〜) + 重要アラート (再販なし / ジャスト払い / 部数制限)
- レスポンシブ対応 (sticky filter、back-to-top、PWA 対応)
- モーダル内 サークル間 スワイプ ナビ + ハッシュ deep-link (#A-04 でモーダル直開)
- Web Share API / クリップボードコピー
- Open Graph + Twitter card 対応

---

## 別のイベントで使う (fork-for-your-event ガイド)

### 1. このリポをフォーク

GitHub で fork、ローカルに clone。

### 2. `event.js` を編集 — イベント基本情報

```js
window.EVENT_CONFIG = {
  name: "あなたのイベント名 第N回",
  date_display: "2026/MM/DD (日) 開催時間",
  venue: "会場名 + 階フロア",
  entry_info: "入場ルール、料金、入れ替え制等",
  official_url: "公式サイト URL",
  official_label: "公式サイト名",
  map_image: "map.jpg",
  rows: ["A", "B", "C"],   // ブース列の prefix。"あ", "い", "う" や "1", "2", "3" でも OK
  // ...
};
```

### 3. `filters.js` を編集 — CP / タグ / 注意事項を定義

```js
window.FILTERS_CONFIG = {
  cps: [
    {
      code: "shipname",
      label: "シップ表示名",
      icon: "🧡×💙",
      title: "ホバー説明",
      pattern: "正規表現で本文検出 (auto-tagging 用)"
    },
    // ...
  ],
  tags: [ /* タグ同様 */ ],
  warnings: [ /* 注意事項 */ ],
};
```

### 4. `data.js` を編集 — サークル一覧

```js
window.BOOTHS = [
  {
    booth_id: "A-01",
    circle_name: "サークル名",
    author: "作家名 (optional)",
    x_handle: "twitter_handle (optional)",
    x_url: "https://x.com/handle/status/...",
    followers: 1000,
    cover_url: "https://pbs.twimg.com/media/XXX.jpg?name=orig",
    cover_urls: ["url1", "url2"],  // 複数画像対応
    min_price: 500,                 // 価格ヒント
    body: "Markdown 形式の説明 (新刊・既刊・注意事項)",
    cps: ["shipname"],              // FILTERS_CONFIG.cps の code
    tags: { r18: false, manga: true, /* ... */ },
    warnings: [ ["limit", "🎫 部数制限"] ]
  },
  // ...
];
```

### 5. `map.jpg` を置き換え — 会場マップ画像

公式提供 / 自作のマップ画像を `map.jpg` として置く。

### 6. `og.png` を置き換え (任意) — SNS シェア用プレビュー画像

1200×630px 推奨。

### 7. GitHub Pages or Cloudflare Pages にデプロイ

#### GitHub Pages:
1. リポジトリ Settings → Pages → Source: "Deploy from a branch" / main / root → Save
2. `https://<username>.github.io/<repo>/` にアクセス

#### Cloudflare Pages:
1. Cloudflare Dashboard → Pages → "Create a project" → GitHub repo を接続
2. Build settings: なし (static site) / output dir: `/`
3. `xxxx.pages.dev` URL が発行される
4. 任意：カスタムドメイン設定

---

## ファイル構成

```
.
├── index.html       # UI shell (event-agnostic)
├── app.js           # ロジック (event-agnostic、各 config 読み込んで動的構築)
├── style.css        # スタイル (event-agnostic)
├── event.js         # イベント config (差し替え対象)
├── filters.js       # CP/tag/warning filter 定義 (差し替え対象)
├── data.js          # ブース配列 (差し替え対象)
├── map.jpg          # 会場マップ画像 (差し替え対象)
├── og.png           # OG プレビュー画像 (差し替え対象)
├── icon.svg         # PWA アイコン (差し替え可)
├── manifest.json    # PWA manifest (theme color など、event.js と整合)
└── README.md        # このファイル
```

---

## 中立 fan guide ポリシー

本テンプレートは **factual 情報** (サークル名 / 作家 / X リンク / 価格 / 注意事項) の **中立 aggregator** として設計：

- **順位付け / 完売予測 / 必訪マークなど evaluative ranking は含めない方針**
- 各サークルの評価は閲覧者・参加者が直接 X 投稿 / お品書き / 当日の作品を見て判断
- フォーク時もこの中立性を維持することを推奨

---

## 注意事項

- **非公式 fan guide** です。公式情報は事前必ず確認
- 会場マップ画像の著作権は主催者に帰属、引用範囲内での使用
- お品書き / 情報は各サークル作家の X 公開ポストから引用、誤り・更新は X リンクから原典確認推奨
- 表紙画像は X CDN (pbs.twimg.com) への hot-link → CDN 規約変更時に画像表示が壊れる可能性あり (現状 onerror フォールバック実装)

---

## Tech

- Plain HTML / CSS / vanilla JS (no framework, no build step required for basic use)
- ローカル動作：`python3 -m http.server 8000` で `http://localhost:8000/`
- GitHub Pages / Cloudflare Pages / 任意の静的ホスティングで動作

---

*Original use case: 超ツクヨミ祭 第1回 (2026-05-24) サークル guide — built 2026-05-23 by [@howish](https://github.com/howish).*
