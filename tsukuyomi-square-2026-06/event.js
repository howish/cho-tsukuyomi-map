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
  name: "ツクヨミスクエア 第1回 (GLFes47 内 超かぐや姫 百合 ONLY)",
  short_name: "ツクヨミスクエア 1",

  // Event date and hours
  date_display: "2026/06/21 (日)",

  // Venue (free-form, can include floor/building info)
  venue: "大田区産業プラザPiO 大展示ホール (GirlsLoveFestival47 内集中配置)",

  // Entry rules / important constraints shown under venue
  entry_info: "GLFes47 (ラブフェス202606) 内 集中配置企画。 一般参加は前売・当日入場券 (passmarket)",

  // Official site link (the "公式情報は…参照" line)
  official_url: "https://www.lovefes.info/260621list.html",
  official_label: "ラブフェス202606 公式サークルリスト",

  // Hero / OG card image (also venue map). Place file in repo root or specify relative path.
  map_image: "map.jpg",
  map_caption: "© 公式マップ (GirlsLoveFestival)",

  // Booth row prefixes (rendered as separate grids in this order)
  rows: ["A", "B", "C"],

  // OG / Twitter share preview
  og_image: "og.png",
  og_description: "2026/06/21 大田区産業プラザPiO 超かぐや姫 百合 ONLY「ツクヨミスクエア 第1回」 全80サークルのガイド / X リンク / 配置を 1 ページで",
  share_text: "6/21 大田区 PiO 超かぐや姫 百合 ONLY「ツクヨミスクエア 第1回」のサークル情報",

  // Footer
  built_by_label: "@howish",
  built_by_url: "https://github.com/howish",
  build_date: "2026-06-07",
  github_repo: "https://github.com/howish/cho-tsukuyomi-map",
  attribution_line: "公式サークルリスト © GirlsLoveFestival 運営 ／ お品書き情報 © 各サークル作家",

  // Theme color (PWA + meta)
  theme_color: "#6a4c93",

  // localStorage key for favorites — change to avoid collision with other event sites
  favorites_key: "tsukuyomi-square-2026-06-favs",
};
