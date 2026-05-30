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

  // 作品 (works) — specific series / IP. Filter by which 二次創作 fandom
  // a booth focuses on, or "原創" as the absence-of-IP marker.
  // List intentionally extensive — the sweep that converts body bullets
  // → work-tags pre-populates a `tags.<code>` flag on each booth, so a
  // user clicking a work chip lights up every booth that mentioned the
  // series in its scaffold body.
  works: [
    { code: "super-kaguya", label: "超時空輝耀姬", icon: "🌙", title: "超時空輝耀姬 (= 超かぐや姫) 関連 — Netflix『超かぐや姫！』二次創作" },
    { code: "original", label: "原創", icon: "✨", title: "原創 (非二次創作)" },
    { code: "bandori", label: "BanG Dream!", icon: "🎸", title: "BanG Dream! (バンドリ!) 系列" },
    { code: "mygo", label: "MyGO!!!!!", icon: "🎤", title: "MyGO!!!!! (BanG Dream! 内分類)" },
    { code: "avemujica", label: "Ave Mujica", icon: "🎭", title: "Ave Mujica (BanG Dream! 内分類)" },
    { code: "lovelive", label: "Lovelive", icon: "🌟", title: "Lovelive 系列 (μ's / Aqours / 蓮ノ空 等)" },
    { code: "gakumas", label: "學園偶像大師", icon: "💎", title: "學園偶像大師 (学マス / 学園アイドルマスター)" },
    { code: "idolmaster", label: "偶像大師", icon: "🎀", title: "アイドルマスター 系列" },
    { code: "vocaloid", label: "VOCALOID", icon: "🎼", title: "VOCALOID / 世界計畫 (Project Sekai) / 初音未來" },
    { code: "rev-girl", label: "少女歌劇", icon: "🌹", title: "少女☆歌劇 レヴュースタァライト" },
    { code: "lycoris", label: "莉可麗絲", icon: "☕", title: "リコリス・リコイル (Lycoris Recoil)" },
    { code: "frieren", label: "葬送的芙莉蓮", icon: "🌿", title: "葬送のフリーレン / 葬送的芙莉蓮" },
    { code: "uma-musume", label: "賽馬娘", icon: "🐎", title: "ウマ娘 プリティーダービー" },
    { code: "kami-ina-botan", label: "上伊那牡丹", icon: "🍶", title: "上伊那ぼたん、酔へる姿は百合の花" },
    { code: "witch-mercury", label: "水星の魔女", icon: "🚀", title: "機動戦士ガンダム 水星の魔女 (Gundam: The Witch from Mercury)" },
    { code: "bocchi-rock", label: "孤獨搖滾", icon: "🎶", title: "ぼっち・ざ・ろっく! (Bocchi the Rock)" },
    { code: "love-deepspace", label: "戀與深空", icon: "💫", title: "戀與深空 (Love and Deepspace)" },
    { code: "demon-slayer", label: "鬼滅之刃", icon: "🗡", title: "鬼滅の刃 (Demon Slayer)" },
    { code: "haikyuu", label: "排球少年", icon: "🏐", title: "ハイキュー!! (Haikyuu)" },
    { code: "jjk", label: "咒術迴戰", icon: "👁", title: "呪術廻戦 (Jujutsu Kaisen)" },
    { code: "mha", label: "我的英雄學院", icon: "💥", title: "僕のヒーローアカデミア (My Hero Academia)" },
    { code: "jojo", label: "JOJO", icon: "⭐", title: "JoJoの奇妙な冒険" },
    { code: "chainsawman", label: "鏈鋸人", icon: "⚔", title: "チェンソーマン (Chainsaw Man)" },
    { code: "mahoutsukai", label: "庫洛魔法使", icon: "🃏", title: "カードキャプターさくら" },
    { code: "sailor-moon", label: "美少女戰士", icon: "🌜", title: "セーラームーン" },
    { code: "aot", label: "進擊的巨人", icon: "🛡", title: "進撃の巨人 (Attack on Titan)" },
    { code: "conan", label: "名偵探柯南", icon: "🔎", title: "名探偵コナン (Detective Conan)" },
    { code: "dungeon-meshi", label: "迷宮飯", icon: "🍖", title: "ダンジョン飯 (Delicious in Dungeon)" },
    { code: "precure", label: "光之美少女", icon: "🌈", title: "プリキュア (Pretty Cure)" },
    { code: "blue-archive", label: "蔚藍檔案", icon: "🌐", title: "ブルーアーカイブ (Blue Archive)" },
    { code: "arknights", label: "明日方舟", icon: "🏰", title: "アークナイツ (Arknights)" },
    { code: "fate", label: "Fate 系列", icon: "🌹", title: "Fate / FGO / Stay Night 等" },
    { code: "monhun", label: "魔物獵人", icon: "🐲", title: "モンスターハンター (Monster Hunter)" },
    { code: "harry-potter", label: "哈利波特", icon: "⚡", title: "Harry Potter" },
    { code: "one-piece", label: "ONE PIECE", icon: "🏴‍☠", title: "ONE PIECE (海賊王)" },
    { code: "genshin", label: "原神", icon: "🌀", title: "原神 (Genshin Impact)" },
    { code: "hsr", label: "崩壞:星穹鐵道", icon: "🚂", title: "崩壊:スターレイル (Honkai: Star Rail)" },
    { code: "zzz", label: "絕區零", icon: "🤖", title: "ゼンレスゾーンゼロ (Zenless Zone Zero)" },
    { code: "pokemon", label: "寶可夢", icon: "🎯", title: "ポケモン (Pokemon)" },
    { code: "touken", label: "刀劍亂舞", icon: "⚔", title: "刀剣乱舞" },
    { code: "shounen-jump", label: "新石紀", icon: "🪨", title: "Dr. STONE (新石紀)" },
    { code: "shingeki", label: "新世界狂歡", icon: "🎪", title: "新世界狂歡 (Wind Breaker / 等)" },
    { code: "touhou", label: "東方Project", icon: "🍵", title: "東方 Project (秘封 / 紅魔郷 等含む)" },
    { code: "hetalia", label: "銀魂", icon: "🥈", title: "銀魂 (Gintama)" },
    { code: "hxh", label: "HUNTER×HUNTER", icon: "🦊", title: "HUNTER × HUNTER 獵人" },
    { code: "hololive", label: "hololive", icon: "🐾", title: "hololive (含 EN / Myth)" },
    { code: "nijisanji", label: "彩虹社", icon: "🌈", title: "彩虹社 / にじさんじ (Nijisanji)" },
    { code: "vtuber-jp", label: "VTuber 汎用", icon: "📺", title: "VTuber 一般" },
    { code: "plave", label: "PLAVE", icon: "🎮", title: "PLAVE (K-VTuber)" },
  ],

  // 媒介 (medium) — what kind of thing the booth sells. Books split by
  // format,周邊 lumps all 立牌 / 吊飾 / 貼紙 等.
  mediums: [
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
    {
      code: "goudou",
      label: "合誌",
      icon: "🤝",
      title: "合誌・アンソロジー",
      pattern: "合本|合誌|合同|アンソロ|anthology",
    },
  ],

  // タグ — generic flags that don't belong to a specific work or medium.
  tags: [
    {
      code: "r18",
      label: "R-18",
      icon: "🔞",
      title: "R-18 含有 / 需身分證",
      pattern: "R-?18|🔞|成人向け|成人向|十八禁",
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

  // Area = the venue zone IF7 organisers assign per booth (綜合 / 百合 /
  // VW / 偶大 / 特攤). Matched against booth.area as a separate filter
  // category — distinct from CPs / themes / warnings.
  areas: [
    { code: "綜合", label: "綜合", icon: "🎪", title: "綜合 (一般 zone)" },
    { code: "百合", label: "百合 Only", icon: "🌸", title: "百合 専區 (CH19 yuri Only)" },
    { code: "VW", label: "VW Only", icon: "🎭", title: "VW (V/W) 専區" },
    { code: "偶大", label: "偶大 Only", icon: "🎤", title: "學園偶像大師 専區" },
    { code: "特攤", label: "特攤", icon: "✨", title: "特攤 (organiser-curated 特別 booth)" },
  ],
};
