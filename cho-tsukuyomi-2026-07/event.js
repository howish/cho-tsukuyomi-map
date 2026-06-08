/**
 * Event configuration — 超ツクヨミ祭 1.5 (2026/07/05 立川).
 *
 * See `data.js` for booth data and `filters.js` for CP/tag filter definitions.
 *
 * NOTE: 会場マップ / 配置 / 入場条件 は公式 (仙弦堂) の発表待ち。
 * booth_id は circlecut 番号 (cc101..cc198) を仮の安定 ID として使用、
 * 公式 配置 が出たら data.js の booth_id を A-NN / B-NN 形式に置換する。
 */
window.EVENT_CONFIG = {
  // UI language — picks the dict from i18n.js (window.I18N_STRINGS).
  language: "ja",

  // Currency symbol shown on booth cards (price field).
  currency_symbol: "¥",

  // Page title (also used for OG / Twitter card titles)
  name: "超ツクヨミ祭 1.5",
  short_name: "超ツクヨミ祭 1.5 ガイド",

  // Event date and hours (公式 発表待ち — 暫定)
  date_display: "2026/07/05 (土)",

  // Venue (公式 発表待ち — 仮表記、 第1回と同じ立川クリエイティブスペース想定)
  venue: "立川クリエイティブスペース (詳細は公式発表待ち)",

  // Entry rules / important constraints shown under venue
  entry_info: "入場条件は仙弦堂 公式発表待ち",

  // Official site link (the "公式情報は…参照" line)
  official_url: "https://sengendo.a.la9.jp/chokagucirclelist15.html",
  official_label: "超ツクヨミ祭 1.5 サークルリスト (仙弦堂)",

  // Hero / OG card image. 公式マップ未公開のため第1回 map を暫定流用。
  map_image: "map.jpg",
  map_caption: "© 第1回 マップ (暫定流用) — 1.5 公式マップ未公開",

  // Booth row prefixes — cc<NUM> 形式の暫定 ID なので "cc" のみ
  rows: ["cc"],

  // OG / Twitter share preview
  og_image: "og.png",
  og_description: "2026/07/05 立川 超かぐや姫オンリー即売会 「超ツクヨミ祭 1.5」 — 全43サークルのお品書き / X リンクを 1 ページで",
  share_text: "7/5 立川 超ツクヨミ祭 1.5 のサークル情報",

  // Footer
  built_by_label: "@howish",
  built_by_url: "https://github.com/howish",
  build_date: "2026-06-08",
  github_repo: "https://github.com/howish/cho-tsukuyomi-map",
  attribution_line: "公式サークルリスト © 仙弦堂・超ツクヨミ祭運営 ／ お品書き情報 © 各サークル作家",

  // Theme color (PWA + meta)
  theme_color: "#6a4c93",

  // localStorage key for favorites
  favorites_key: "cho-tsukuyomi-2026-07-favs",
};
