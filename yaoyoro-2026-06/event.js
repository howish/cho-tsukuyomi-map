/**
 * Event configuration — replace these values to fork this site for a different event.
 *
 * See `data.js` for booth data and `filters.js` for CP/tag filter definitions.
 */
window.EVENT_CONFIG = {
  // UI language — picks the dict from i18n.js (window.I18N_STRINGS).
  // Supported: 'ja', 'zh-tw'. Missing keys fall back to 'ja'.
  language: "ja",

  // Currency symbol shown on booth cards (price field).
  currency_symbol: "¥",

  // Page title (also used for OG / Twitter card titles)
  name: "ヤオヨロー！ (プリケット2 内 超かぐや姫!only)",
  short_name: "ヤオヨロー！ ガイド",

  // Event date and hours
  date_display: "2026/06/07 (日) 12:00-15:30",

  // Venue (free-form, can include floor/building info)
  venue: "大田区産業プラザPiO 1F 大展示ホール (ヤオ列)",

  // Entry rules / important constraints shown under venue
  entry_info: "時間帯チケット制 (PassMarket 5/26 04:00 〜 6/7 09:00 販売) — A時間 10:00- ¥1,500 / B時間 13:00- ¥1,000 / C時間 14:00- ¥500 ／ 一般入場 12:00〜",

  // Official site link (the "公式情報は…参照" line)
  official_url: "https://ketto.com/ya/",
  official_label: "ヤオヨロー！ 公式 (ケットコム)",

  // Hero / OG card image (also venue map). Place file in repo root or specify relative path.
  map_image: "map.jpg",
  map_caption: "© 公式マップ (ケットコム・プリケット2)",

  // Booth row prefixes (rendered as separate grids in this order)
  rows: ["ヤオ"],

  // OG / Twitter share preview
  og_image: "og.png",
  og_description: "2026/06/07 大田区産業プラザPiO 超かぐや姫オンリー専區「ヤオヨロー！」 全34サークルのガイド / X リンク / 配置図を 1 ページで",
  share_text: "6/7 ヤオヨロー！ (プリケット2 内 超かぐや姫オンリー) のサークル情報 + マップ",

  // Footer
  built_by_label: "@howish",
  built_by_url: "https://github.com/howish",
  build_date: "2026-05-31",
  github_repo: "https://github.com/howish/cho-tsukuyomi-map",
  attribution_line: "会場マップ © ケットコム・プリケット2 ／ お品書き情報 © 各サークル作家",

  // Theme color (PWA + meta)
  theme_color: "#6a4c93",

  // localStorage key for favorites — change to avoid collision with other event sites
  favorites_key: "yaoyoro-2026-06-favs",
};
