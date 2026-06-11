/**
 * Event configuration — コミックマーケット108 (C108) 2026/08/15-16 東京ビッグサイト.
 *
 * 超かぐや姫！関連サークルのみを収録する C108 抜粋ガイド (全コミケガイドではない)。
 * サークルリストの出典は各サークルの当落報告ポスト (2026-06-05/06) — 公式
 * Webカタログ (https://webcatalog.circle.ms/) と突合のこと。
 *
 * booth_id 規約: <曜日>-<ブロック><番号> (例: 土-a14a / 日-ア15ab)。
 * Comiket のブロック記号は開催日内で一意なのでホール名は body 側に記載。
 * スペース未確認サークルは tbd-NN を仮 ID とし、判明次第置換する。
 */
window.EVENT_CONFIG = {
  language: "ja",
  currency_symbol: "¥",

  name: "C108 超かぐや姫関連サークル",
  short_name: "C108 超かぐや姫ガイド",

  date_display: "2026/08/15 (土)・16 (日)",

  venue: "東京ビッグサイト (東1〜3・南1〜2ホール / 東4〜6は改修工事で閉鎖)",

  entry_info: "一般入場 10:30〜 (アーリー/通常リストバンド等は公式の入場方式に従う)",

  official_url: "https://www.comiket.co.jp/info-a/C108/C108Info.html",
  official_label: "コミックマーケット108 公式インフォメーション",

  map_image: "map.jpg",
  map_caption: "会場マップは公式発表待ち (placeholder)",

  // 1日目 (土) / 2日目 (日) / スペース未確認 (tbd)
  rows: ["土", "日", "tbd"],

  og_image: "og.png",
  og_description: "2026/8/15-16 東京ビッグサイト C108 — 超かぐや姫！関連サークルの配置・新刊予定・X リンクを 1 ページで",
  share_text: "C108 (夏コミ) の超かぐや姫関連サークル情報",

  built_by_label: "@howish",
  built_by_url: "https://github.com/howish",
  build_date: "2026-06-11",
  github_repo: "https://github.com/howish/cho-tsukuyomi-map",
  attribution_line: "配置情報 © 各サークルの当落報告 ／ 開催情報 © コミックマーケット準備会",

  theme_color: "#6a4c93",

  favorites_key: "c108-2026-08-favs",
};
