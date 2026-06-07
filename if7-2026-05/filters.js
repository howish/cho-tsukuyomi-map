/**
 * Event-specific filter overrides. The universal vocabulary (tags +
 * warnings) lives in `_filters_base.js` at repo root and is merged
 * by app.js before this file loads.
 *
 * IF7 is zh-tw: tags entries with codes matching the base provide
 * zh-tw label overrides (漫畫 / 小說 / etc.) — same axis, per-event
 * override wins per app.js mergeFilters() rule.
 *
 * Schema authority: docs/filters.md
 * Validator: .claude/skills/filter-system/bin/run.sh validate
 */
window.FILTERS_CONFIG = {
  "cps": [
    {
      "code": "iroyachi",
      "label": "八千代×彩葉",
      "icon": "🐙×🦊",
      "title": "八千代 (ヤチヨ) × 彩葉 (いろは)、順序不問"
    },
    {
      "code": "iroka",
      "label": "輝耀×彩葉",
      "icon": "🐰×🦊",
      "title": "輝耀姬 (かぐや) × 彩葉 (いろは)、順序不問"
    },
    {
      "code": "trio-sk",
      "label": "三人行",
      "icon": "🌟",
      "title": "三人行 (輝耀×八千代×彩葉)"
    }
  ],
  "works": [
    {
      "code": "super-kaguya",
      "label": "超時空輝耀姬",
      "icon": "🌙",
      "title": "超時空輝耀姬 (= 超かぐや姫) 関連 — Netflix『超かぐや姫！』二次創作"
    },
    {
      "code": "original",
      "label": "原創",
      "icon": "✨",
      "title": "原創 (非二次創作)"
    },
    {
      "code": "bandori",
      "label": "BanG Dream!",
      "icon": "🎸",
      "title": "BanG Dream! (バンドリ!) 系列"
    },
    {
      "code": "mygo",
      "label": "MyGO!!!!!",
      "icon": "🎤",
      "title": "MyGO!!!!! (BanG Dream! 内分類)"
    },
    {
      "code": "avemujica",
      "label": "Ave Mujica",
      "icon": "🎭",
      "title": "Ave Mujica (BanG Dream! 内分類)"
    },
    {
      "code": "lovelive",
      "label": "Lovelive",
      "icon": "🌟",
      "title": "Lovelive 系列 (μ's / Aqours / 蓮ノ空 等)"
    },
    {
      "code": "gakumas",
      "label": "學園偶像大師",
      "icon": "💎",
      "title": "學園偶像大師 (学マス / 学園アイドルマスター)"
    },
    {
      "code": "idolmaster",
      "label": "偶像大師",
      "icon": "🎀",
      "title": "アイドルマスター 系列"
    },
    {
      "code": "vocaloid",
      "label": "VOCALOID",
      "icon": "🎼",
      "title": "VOCALOID / 世界計畫 (Project Sekai) / 初音未來"
    },
    {
      "code": "rev-girl",
      "label": "少女歌劇",
      "icon": "🌹",
      "title": "少女☆歌劇 レヴュースタァライト"
    },
    {
      "code": "lycoris",
      "label": "莉可麗絲",
      "icon": "☕",
      "title": "リコリス・リコイル (Lycoris Recoil)"
    },
    {
      "code": "frieren",
      "label": "葬送的芙莉蓮",
      "icon": "🌿",
      "title": "葬送のフリーレン / 葬送的芙莉蓮"
    },
    {
      "code": "uma-musume",
      "label": "賽馬娘",
      "icon": "🐎",
      "title": "ウマ娘 プリティーダービー"
    },
    {
      "code": "kami-ina-botan",
      "label": "上伊那牡丹",
      "icon": "🍶",
      "title": "上伊那ぼたん、酔へる姿は百合の花"
    },
    {
      "code": "witch-mercury",
      "label": "水星の魔女",
      "icon": "🚀",
      "title": "機動戦士ガンダム 水星の魔女 (Gundam: The Witch from Mercury)"
    },
    {
      "code": "bocchi-rock",
      "label": "孤獨搖滾",
      "icon": "🎶",
      "title": "ぼっち・ざ・ろっく! (Bocchi the Rock)"
    },
    {
      "code": "love-deepspace",
      "label": "戀與深空",
      "icon": "💫",
      "title": "戀與深空 (Love and Deepspace)"
    },
    {
      "code": "demon-slayer",
      "label": "鬼滅之刃",
      "icon": "🗡",
      "title": "鬼滅の刃 (Demon Slayer)"
    },
    {
      "code": "haikyuu",
      "label": "排球少年",
      "icon": "🏐",
      "title": "ハイキュー!! (Haikyuu)"
    },
    {
      "code": "jjk",
      "label": "咒術迴戰",
      "icon": "👁",
      "title": "呪術廻戦 (Jujutsu Kaisen)"
    },
    {
      "code": "mha",
      "label": "我的英雄學院",
      "icon": "💥",
      "title": "僕のヒーローアカデミア (My Hero Academia)"
    },
    {
      "code": "jojo",
      "label": "JOJO",
      "icon": "⭐",
      "title": "JoJoの奇妙な冒険"
    },
    {
      "code": "chainsawman",
      "label": "鏈鋸人",
      "icon": "⚔",
      "title": "チェンソーマン (Chainsaw Man)"
    },
    {
      "code": "mahoutsukai",
      "label": "庫洛魔法使",
      "icon": "🃏",
      "title": "カードキャプターさくら"
    },
    {
      "code": "sailor-moon",
      "label": "美少女戰士",
      "icon": "🌜",
      "title": "セーラームーン"
    },
    {
      "code": "aot",
      "label": "進擊的巨人",
      "icon": "🛡",
      "title": "進撃の巨人 (Attack on Titan)"
    },
    {
      "code": "conan",
      "label": "名偵探柯南",
      "icon": "🔎",
      "title": "名探偵コナン (Detective Conan)"
    },
    {
      "code": "dungeon-meshi",
      "label": "迷宮飯",
      "icon": "🍖",
      "title": "ダンジョン飯 (Delicious in Dungeon)"
    },
    {
      "code": "precure",
      "label": "光之美少女",
      "icon": "🌈",
      "title": "プリキュア (Pretty Cure)"
    },
    {
      "code": "blue-archive",
      "label": "蔚藍檔案",
      "icon": "🌐",
      "title": "ブルーアーカイブ (Blue Archive)"
    },
    {
      "code": "arknights",
      "label": "明日方舟",
      "icon": "🏰",
      "title": "アークナイツ (Arknights)"
    },
    {
      "code": "fate",
      "label": "Fate 系列",
      "icon": "🌹",
      "title": "Fate / FGO / Stay Night 等"
    },
    {
      "code": "monhun",
      "label": "魔物獵人",
      "icon": "🐲",
      "title": "モンスターハンター (Monster Hunter)"
    },
    {
      "code": "harry-potter",
      "label": "哈利波特",
      "icon": "⚡",
      "title": "Harry Potter"
    },
    {
      "code": "one-piece",
      "label": "ONE PIECE",
      "icon": "🏴‍☠",
      "title": "ONE PIECE (海賊王)"
    },
    {
      "code": "genshin",
      "label": "原神",
      "icon": "🌀",
      "title": "原神 (Genshin Impact)"
    },
    {
      "code": "hsr",
      "label": "崩壞:星穹鐵道",
      "icon": "🚂",
      "title": "崩壊:スターレイル (Honkai: Star Rail)"
    },
    {
      "code": "zzz",
      "label": "絕區零",
      "icon": "🤖",
      "title": "ゼンレスゾーンゼロ (Zenless Zone Zero)"
    },
    {
      "code": "pokemon",
      "label": "寶可夢",
      "icon": "🎯",
      "title": "ポケモン (Pokemon)"
    },
    {
      "code": "touken",
      "label": "刀劍亂舞",
      "icon": "⚔",
      "title": "刀剣乱舞"
    },
    {
      "code": "shounen-jump",
      "label": "新石紀",
      "icon": "🪨",
      "title": "Dr. STONE (新石紀)"
    },
    {
      "code": "shingeki",
      "label": "新世界狂歡",
      "icon": "🎪",
      "title": "新世界狂歡 (Wind Breaker / 等)"
    },
    {
      "code": "touhou",
      "label": "東方Project",
      "icon": "🍵",
      "title": "東方 Project (秘封 / 紅魔郷 等含む)"
    },
    {
      "code": "hetalia",
      "label": "銀魂",
      "icon": "🥈",
      "title": "銀魂 (Gintama)"
    },
    {
      "code": "hxh",
      "label": "HUNTER×HUNTER",
      "icon": "🦊",
      "title": "HUNTER × HUNTER 獵人"
    },
    {
      "code": "hololive",
      "label": "hololive",
      "icon": "🐾",
      "title": "hololive (含 EN / Myth)"
    },
    {
      "code": "nijisanji",
      "label": "彩虹社",
      "icon": "🌈",
      "title": "彩虹社 / にじさんじ (Nijisanji)"
    },
    {
      "code": "vtuber-jp",
      "label": "VTuber 汎用",
      "icon": "📺",
      "title": "VTuber 一般"
    },
    {
      "code": "plave",
      "label": "PLAVE",
      "icon": "🎮",
      "title": "PLAVE (K-VTuber)"
    }
  ],
  "tags": [
    {
      "code": "manga",
      "label": "漫畫",
      "icon": "📕",
      "title": "漫畫本"
    },
    {
      "code": "novel",
      "label": "小說",
      "icon": "📖",
      "title": "小說・文庫"
    },
    {
      "code": "illust",
      "label": "畫集",
      "icon": "🎨",
      "title": "畫集・插畫本"
    },
    {
      "code": "goods",
      "label": "週邊",
      "icon": "🛍",
      "title": "週邊 (壓克力立牌・貼紙・徽章 等)"
    },
    {
      "code": "goudou",
      "label": "合誌",
      "icon": "🤝",
      "title": "合誌・アンソロジー"
    }
  ],
  "warnings": [],
  "areas": [
    {
      "code": "綜合",
      "label": "綜合",
      "icon": "🎪",
      "title": "綜合 (一般 zone)"
    },
    {
      "code": "百合",
      "label": "百合 Only",
      "icon": "🌸",
      "title": "百合 専區 (CH19 yuri Only)"
    },
    {
      "code": "VW",
      "label": "VW Only",
      "icon": "🎭",
      "title": "VW (V/W) 専區"
    },
    {
      "code": "偶大",
      "label": "偶大 Only",
      "icon": "🎤",
      "title": "學園偶像大師 専區"
    },
    {
      "code": "特攤",
      "label": "特攤",
      "icon": "✨",
      "title": "特攤 (organiser-curated 特別 booth)"
    }
  ]
};
