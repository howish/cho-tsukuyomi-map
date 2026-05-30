/**
 * Event configuration — 第7回 創集繪 (IF7), with 第19回 Comic Horizon (CH19)
 * 百合 Only as one of the sub-events inside.
 *
 * 主催 GJ工作室。台湾 domestic 同人即售會、主要使用語言は中文 (繁体)。
 * 公式: https://if.gjs.tw/ (IF7) / https://ch.gjs.tw/ (CH19 百合 ONLY 専區)
 *
 * NOTE: 出展サークル list は event 直前公開のため、初期 ship 時は data.js は
 * placeholder。list 公開後 (2026-05 中旬 〜 直前) に refresh する。
 */
window.EVENT_CONFIG = {
  // UI language — picks the dict from i18n.js. 'zh-tw' for Taiwan event.
  language: "zh-tw",

  // Currency symbol for booth price display
  currency_symbol: "NT$",

  name: "第7回 創集繪 (IF7)",
  short_name: "IF7 攤位指南",

  date_display: "2026/05/30 (六) 10:00-16:30",

  venue: "台北花博公園 爭艷館 — 第7回 創集繪 (含 第19回 Comic Horizon 百合 ONLY 専區)",

  // Free-form constraints / pricing notes
  entry_info: "入場費以 IF7 主辦方公告為準 (詳官網)",

  official_url: "https://if.gjs.tw/",
  official_label: "第7回 創集繪 (IF7) 官網 (GJ工作室)",

  // Community-curated gsheet (open-submit) catalog. Originally a 百合 ONLY
  // 専區 community list; later cross-referenced with the IF7 official
  // 555-booth catalog for full coverage.
  community_catalog_url: "https://docs.google.com/spreadsheets/d/1kUH2rfe9enYuSUquL6eR_qbxnI8NRbeY8COO9G0GAIM/",

  // Venue map — full IF7 2026/05/30 official map, resized to ≤2000px.
  map_image: "map.jpg",
  map_caption: "© IF7 official 場館配置圖 (GJ工作室)",

  // Booth row prefixes — only the rows we actually populate (yuri S列 +
  // 超かぐや姫 dispersed across J/T/U/Y).
  rows: ["特", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],

  // Tag / CP filter codes to apply by default on first load (empty / unset
  // = no default, all booths shown). Used here so a fan landing for
  // 超かぐや姫 sees only the 超時空輝耀姬 picks until they untoggle.
  // NB: must include the "tag:" / "cp:" prefix that filter buttons use
  // (see app.js buildFilterButtons).
  default_filters: ["work:super-kaguya"],

  // OG / Twitter share preview
  og_image: "og.png",
  og_description: "2026/05/30 台北花博 第7回 創集繪 (IF7) — 全 555 攤位資訊 + 地圖 + 篩選 (含 CH19 百合 ONLY 専區・偶大・VW・BIO 等 専區) — 非官方 fan guide",
  share_text: "5/30 台北 第7回 創集繪 (IF7) — 555 攤位資訊 + 地圖 + 作品/CP 篩選",

  // Footer
  built_by_label: "@howish",
  built_by_url: "https://github.com/howish",
  build_date: "2026-05-26",
  github_repo: "https://github.com/howish/cho-tsukuyomi-map",
  attribution_line: "場館地圖 © 第7回 創集繪 (GJ工作室)／攤位資訊 © 各圈作者",

  // Theme color — yuri-ish soft pink
  theme_color: "#e8556b",

  // localStorage key for favorites — unique per event to avoid collision
  favorites_key: "if7-ch19-favs",
};
