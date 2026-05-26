/**
 * Filter configuration — CH19 (yuri Only inside IF7).
 *
 * General yuri Only — CPs span any fandom (Genshin / Bandori / Idolmaster /
 * 原創 etc), so we leave the CP list empty initially. Add per-CP filters as
 * the circle list publishes and patterns emerge.
 *
 * Tag / warning labels are written in Traditional Chinese to match the
 * site's UI language (event.js sets language: 'zh-tw').
 */
window.FILTERS_CONFIG = {
  cps: [
    {
      code: "iroyachi",
      label: "八千代×彩葉",
      icon: "🐙×🦊",
      title: "八千代 (ヤチヨ) × 彩葉 (いろは)、順序不問",
      pattern: "八千代彩葉|彩葉八千代|輝耀八千代彩葉|ヤチいろ|いろヤチ",
    },
    {
      code: "iroka",
      label: "輝耀×彩葉",
      icon: "🐰×🦊",
      title: "輝耀姬 (かぐや) × 彩葉 (いろは)、順序不問",
      pattern: "輝耀彩葉|彩葉輝耀|輝夜彩葉|彩葉輝夜|いろかぐ|かぐいろ",
    },
    {
      code: "trio-sk",
      label: "三人行",
      icon: "🌟",
      title: "三人行 (輝耀×八千代×彩葉)",
      pattern: "三人行|輝耀姬八千代彩葉|彩いろろか|ヤチかぐいろ|いろかぐヤチ",
    },
  ],

  trio_pattern: null,

  tags: [
    {
      code: "super-kaguya",
      label: "超時空輝耀姬",
      icon: "🌙",
      title: "超時空輝耀姬 (= 超かぐや姫) 関連 — Netflix『超かぐや姫！』二次創作",
      pattern: "超時空輝耀姬|超時空輝夜姬|超時空輝耀姫|超時空輝夜姫|超かぐや姫|輝耀姬|輝夜姬|輝耀姫|輝夜姫|彩葉|八千代|ヤチヨ|かぐや|いろは",
    },
    {
      code: "yuri-zone",
      label: "百合専區",
      icon: "🌸",
      title: "「いつか一緒に輝いて」CH19 百合 Only 専區 (S列) booth",
      pattern: "(?!.*)",
    },
    {
      code: "r18",
      label: "R-18",
      icon: "🔞",
      title: "R-18 含有 / 需身分證",
      pattern: "R-?18|🔞|成人向け|成人向|十八禁",
    },
    {
      code: "original",
      label: "原創",
      icon: "✨",
      title: "原創 (非二次創作)",
      pattern: "原創|オリジナル|original",
    },
    {
      code: "goudou",
      label: "合誌",
      icon: "🤝",
      title: "合誌・アンソロジー",
      pattern: "合本|合誌|合同|アンソロ|anthology",
    },
    {
      code: "free",
      label: "免費",
      icon: "🎁",
      title: "免費發放有",
      pattern: "免費發放|免費索取|無料配布|無配|TAKE FREE|FREE",
    },
    {
      code: "consign",
      label: "委託",
      icon: "📚",
      title: "委託本有",
      pattern: "委託",
    },
    {
      code: "manga",
      label: "漫畫",
      icon: "📕",
      title: "漫畫本",
      pattern: "漫畫|漫画|コミック|まんが|4コマ|四コマ|comic",
    },
    {
      code: "novel",
      label: "小說",
      icon: "📖",
      title: "小說・文庫",
      pattern: "小說|小説|文庫|短編集",
    },
    {
      code: "illust",
      label: "畫集",
      icon: "🎨",
      title: "畫集・插畫本",
      pattern: "畫集|插畫本|画集|イラスト本|アートブック|illustration|artbook",
    },
    {
      code: "goods",
      label: "週邊",
      icon: "🛍",
      title: "週邊 (壓克力立牌・貼紙・徽章 等)",
      pattern: "週邊|周边|グッズ|アクスタ|ステッカー|ポストカード|貼紙|徽章|キーホルダー|缶バッジ",
    },
  ],

  warnings: [
    {
      code: "soldout",
      label: "✅ 完售",
      class_suffix: "soldout",
      pattern: "完售|完売|sold out|售完",
    },
    {
      code: "online",
      label: "🛒 有網購",
      class_suffix: "online",
      pattern: "網購|通販|BOOTH|booth\\.pm|蝦皮|pictSPACE",
    },
    {
      code: "reprint",
      label: "⚠️ 不再版",
      class_suffix: "reprint",
      pattern: "不再版|不再印|無再版|再販なし",
    },
    {
      code: "cash",
      label: "💴 請備零錢",
      class_suffix: "cash",
      pattern: "備零錢|零錢|小鈔",
    },
    {
      code: "limit",
      label: "🎫 限購",
      class_suffix: "limit",
      pattern: "限購|限定|購買限制|部数制限",
    },
    {
      code: "noonline",
      label: "🚫 無網購",
      class_suffix: "noonline",
      pattern: "無網購|不開放網購|無通販|通販無し",
    },
  ],
};
