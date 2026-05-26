/**
 * Event configuration — 第19回 Comic Horizon (CH19), 百合 Only inside 第7回 創集繪 (IF7).
 *
 * 主催 GJ工作室。台湾 domestic 同人即售會、主要使用語言は中文 (繁体)。
 * 公式: https://ch.gjs.tw/ (CH19) / https://if.gjs.tw/ (parent IF7)
 *
 * NOTE: 出展サークル list は event 直前公開のため、初期 ship 時は data.js は
 * placeholder。list 公開後 (2026-05 中旬 〜 直前) に refresh する。
 */
window.EVENT_CONFIG = {
  // UI language — picks the dict from i18n.js. 'zh-tw' for Taiwan event.
  language: "zh-tw",

  // Currency symbol for booth price display
  currency_symbol: "NT$",

  name: "第19回 Comic Horizon (百合 Only)",
  short_name: "CH19 攤位指南",

  date_display: "2026/05/30 (六) 10:00-16:30",

  venue: "台北花博公園 爭艷館 — 第7回 創集繪 (IF7) 場內 Petit Only",

  // Free-form constraints / pricing notes (Taiwan 同人 typically uses 套票
  // for entry; CH-specific rules TBA per organiser)
  entry_info: "入場費以 IF7 主辦方公告為準 (詳官網)",

  official_url: "https://ch.gjs.tw/",
  official_label: "Comic Horizon 19 官網 (GJ工作室)",

  // Venue map — full IF7 2026/05/30 official map, resized to ≤2000px.
  map_image: "map.jpg",
  map_caption: "© IF7 official 場館配置圖 (GJ工作室)",

  // Booth row prefixes — only the rows we actually populate (yuri S列 +
  // 超かぐや姫 dispersed across J/T/U/Y).
  rows: ["S", "J", "T", "U", "Y"],

  // OG / Twitter share preview
  og_image: "og.png",
  og_description: "2026/05/30 台北花博 第7回 創集繪 (IF7) 場內 — 第19回 Comic Horizon 百合 Only 攤位指南 (非官方 fan guide)",
  share_text: "5/30 台北 IF7 場內 — Comic Horizon 19 百合 Only 攤位資訊 + 地圖",

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
