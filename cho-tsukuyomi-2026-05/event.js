/**
 * Event configuration — replace these values to fork this site for a different event.
 *
 * See `data.js` for booth data and `filters.js` for CP/tag filter definitions.
 */
window.EVENT_CONFIG = {
  // Page title (also used for OG / Twitter card titles)
  name: "超ツクヨミ祭 第1回",
  short_name: "超ツクヨミ祭 ガイド",

  // Event date and hours
  date_display: "2026/05/24 (日) 11:00-15:30",

  // Venue (free-form, can include floor/building info)
  venue: "立川クリエイティブスペース (美光印刷 2F)",

  // Entry rules / important constraints shown under venue
  entry_info: "4部入れ替え制 (リストバンド配布 9:30-10:00、ランダム割当) ／ 入場 ¥1,000 (千円札用意必須)",

  // Official site link (the "公式情報は…参照" line)
  official_url: "https://sengendo.a.la9.jp/chokagutop.html",
  official_label: "超ツクヨミ祭公式 (仙弦堂)",

  // Hero / OG card image (also venue map). Place file in repo root or specify relative path.
  map_image: "map.jpg",
  map_caption: "© 公式マップ (仙弦堂・超ツクヨミ祭運営)",

  // Booth row prefixes (rendered as separate grids in this order)
  rows: ["A", "B", "C"],

  // OG / Twitter share preview
  og_image: "og.png",
  og_description: "2026/05/24 立川 超かぐや姫オンリー即売会 — 全47サークルのお品書き / 価格 / X リンク / 会場マップを 1 ページで",
  share_text: "5/24 立川 超かぐや姫オンリー即売会のサークル情報 + マップ + お品書きリンク",

  // Footer
  built_by_label: "@howish",
  built_by_url: "https://github.com/howish",
  build_date: "2026-05-23",
  github_repo: "https://github.com/howish/cho-tsukuyomi-map",
  attribution_line: "会場マップ © 仙弦堂・超ツクヨミ祭運営 ／ お品書き情報 © 各サークル作家",

  // Theme color (PWA + meta)
  theme_color: "#6a4c93",

  // localStorage key for favorites — change to avoid collision with other event sites
  favorites_key: "cho-tsukuyomi-map-favs",
};
