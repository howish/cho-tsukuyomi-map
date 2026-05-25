# 同人即売会 サークルガイド ハブ (yachi8000.app)

🌙 **同人即売会の非公式 fan guide を集めたハブサイト**。

🔗 **公開 URL**: http://yachi8000.app/ / https://howish.github.io/cho-tsukuyomi-map/

---

## 構成

```
yachi8000.app/
├── /                                ← 🏠 トップ：イベント一覧
├── /cho-tsukuyomi-2026-05/          ← 超ツクヨミ祭 第1回 (2026-05-24)
└── /<future-event-slug>/            ← 未来のイベントを追加する場所
```

各イベントは独立した静的サイトで、共通の app shell (`event.js` + `filters.js` + `data.js` + `app.js` + `style.css` + `map.jpg`) を持つ。

---

## ファイル構成

```
.
├── index.html             # 🏠 ハブトップ (イベント一覧)
├── hub.js                 # ハブのロジック (events.json 読んで render)
├── hub.css                # ハブ専用スタイル
├── events.json            # 全イベントメタデータ (slug, name, date, status...)
├── CNAME                  # カスタムドメイン (yachi8000.app)
├── README.md
└── cho-tsukuyomi-2026-05/  ← 1 イベント = 1 サブディレクトリ
    ├── index.html         # event-agnostic UI shell
    ├── app.js             # ロジック (event.js + filters.js + data.js を読んで動的構築)
    ├── style.css
    ├── event.js           # イベント config (差し替え対象)
    ├── filters.js         # CP/タグ/警告 フィルター定義 (差し替え対象)
    ├── data.js            # ブース配列 (差し替え対象)
    ├── map.jpg            # 会場マップ
    ├── og.png             # OG プレビュー画像
    ├── manifest.json      # PWA manifest
    └── icon.svg
```

---

## 新しいイベントを追加する手順

### 1. 既存イベントのサブディレクトリをコピー (テンプレートとして使う)

```bash
cp -r cho-tsukuyomi-2026-05 my-new-event-2026-XX
```

### 2. `my-new-event-2026-XX/event.js` を編集

```js
window.EVENT_CONFIG = {
  name: "あなたのイベント名 第N回",
  date_display: "2026/MM/DD (日) 開催時間",
  venue: "会場名 + 階フロア",
  entry_info: "入場ルール、料金、入れ替え制等",
  official_url: "公式サイト URL",
  official_label: "公式サイト名",
  map_image: "map.jpg",
  rows: ["A", "B", "C"],   // 列 prefix (任意の文字)
  // ...
};
```

### 3. `my-new-event-2026-XX/filters.js` を編集

CP / タグ / 注意事項 を 各イベントの作風に合わせて自由定義。
正規表現で本文から auto-detect する仕組み。

### 4. `my-new-event-2026-XX/data.js` を編集

ブース配列を入れ替え。各 booth record の schema：

```js
{
  booth_id: "A-01",
  circle_name: "...",
  author: "...",
  x_handle: "...",
  x_url: "https://x.com/.../status/...",
  cover_url: "https://pbs.twimg.com/media/XXX.jpg?name=orig",
  cover_urls: ["...", "..."],     // 複数画像対応
  min_price: 500,
  body: "Markdown 形式 本文",
  cps: ["shipname"],
  tags: { r18: false, manga: true, /* ... */ },
  warnings: [ ["limit", "🎫 部数制限"] ]
}
```

### 5. `my-new-event-2026-XX/map.jpg` を入れ替え

### 6. ルートの `events.json` に新エントリ追加

```json
{
  "events": [
    {
      "slug": "my-new-event-2026-XX",
      "name": "あなたのイベント名 第N回",
      "date": "2026-XX-XX",
      "date_display": "2026/XX/XX",
      "venue": "会場名",
      "fandom": "対象作品",
      "status": "upcoming",
      "official_url": "...",
      "official_label": "公式",
      "icon": "🎪",
      "summary": "短い概要"
    }
  ]
}
```

`status` は `"upcoming"` / `"past"` のいずれか、もしくは省略で日付ベースで自動判定。

### 7. Commit + push

GitHub Pages / Cloudflare Pages が自動で再ビルド → 公開反映。

---

## 機能

### ハブトップ
- イベント一覧 (開催予定 / 開催済 の自動グルーピング)
- 各イベントカードに 日付・会場・対象作品 表示
- クリックでサブサイトへ

### 各イベント guide
- 会場マップ + 全サークル一覧 (列単位グループ)
- 各ブースタップで お品書き画像 (複数枚 横スワイプ) / X リンク / 価格 / 注意事項
- **CP フィルター** (絵文字 + 順序不問、トリオは独立、Union 結合)
- **タグフィルター** (R-18 / 合同 / 無配 / 委託 / 漫画 / 小説 / イラスト本 / グッズ)
- サークル名・作家・X handle・ブース ID 検索
- **⭐ お気に入り** (localStorage、フィルター可)
- 価格ヒント (¥N〜) + 重要アラート (再販なし / ジャスト払い / 部数制限)
- レスポンシブ + sticky filter + back-to-top + PWA
- モーダル内 サークル間 スワイプ ナビ + ハッシュ deep-link (`#A-04` でモーダル直開)
- Web Share API / クリップボードコピー / OG + Twitter card

---

## 中立 fan guide ポリシー

本サイトは **factual 情報** (サークル名 / 作家 / X リンク / 価格 / 注意事項) の **中立 aggregator** として運営：

- **順位付け / 完売予測 / 必訪マークなど evaluative ranking は含めない方針**
- 各サークルの評価は閲覧者・参加者が直接 X 投稿 / お品書き / 当日の作品を見て判断するのが本筋
- フォーク / 追加時もこの中立性維持を推奨

---

## デプロイ

### GitHub Pages
リポ Settings → Pages → Source: `main` ブランチ / `root` → Save
→ `https://<username>.github.io/<repo>/`

### Cloudflare Pages (カスタムドメイン推奨)
Cloudflare Dashboard → Pages → GitHub repo 接続
→ Build settings: なし (static)、Output: `/`
→ Custom domain で `yachi8000.app` 等を設定

---

## Tech

- Plain HTML / CSS / vanilla JS (no framework, no build step)
- ローカル動作：`python3 -m http.server 8000`
- GitHub Pages + Cloudflare Pages で動作確認済

---

*Original use case: 超ツクヨミ祭 第1回 (2026-05-24) サークル guide — built 2026-05-23 by [@howish](https://github.com/howish). Hub-ified 2026-05-25 for future events.*
