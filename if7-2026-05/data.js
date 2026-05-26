/**
 * CH19 (第19回 Comic Horizon) booth data — auto-generated 2026-05-26.
 *
 * Source: https://if.gjs.tw/circle-list.html (Playwright-rendered table, 555 rows)
 * Filter: 百合 専區 (S列) + 超かぐや姫 関連 (across zones), unique
 *
 * Schema notes:
 *   - booth_id: "S-01" or "S-05/06" (dual)
 *   - x_url: first social link from source table (X / Plurk / FB / IG / etc.)
 *   - x_handle: only populated when x_url is x.com
 *   - body: markdown — desc bullets + 専區 + 連攤 + source link
 *   - tags.super-kaguya: 超かぐや姫 (超時空輝耀姬/輝夜姬) 関連
 *   - tags.yuri-zone: 百合 専區 (S列) booth
 *
 * TODO (later):
 *   - お品書き画像 (per-booth detail page にあるはず)
 *   - X-only author handle when source is FB/Plurk/IG (mostly N/A)
 */
window.BOOTHS = [
  {
    "booth_id": "J-21",
    "circle_name": "月亮代表我的心",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/share/1DmvzJRbeL/?mibextid=wwXIfr",
    "cover_url": "",
    "body": "- 超時空輝夜姬\n\n**専區**: 綜合\n\n🔗 Facebook: [https://www.facebook.com/share/1DmvzJRbeL/?mibextid=wwXIfr](https://www.facebook.com/share/1DmvzJRbeL/?mibextid=wwXIfr)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/438994861_6984599751645657_8186451966031809412_n.jpg?stp=dst-jpg_tt6&cstp=mx960x958&ctp=s720x720&_nc_cat=104&ccb=1-7&_nc_sid=3ab345&_nc_ohc=WBEG64tvz4kQ7kNvwFpjF4b&_nc_oc=AdoohumfCOhZWOFPwW-d4tJ8xSFMDA5zkvTHrVlkOwzRpHslYYAzUxiozrGvS40v3fw&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=JONT8i_PEOfi_c8rdwtFZQ&_nc_ss=7c289&oh=00_Af7CGLZDaUIiO02c-kfsNdkQvFB6RGqBn9wMr1IWJPTWZw&oe=6A1B6264",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/509615741_9576806665758273_8037407169078525822_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=9274lmXfeuQQ7kNvwER6MsF&_nc_oc=Adq21sTyecmGUr5jubZL4lIo1SqN64snN9-SSTtk5J60OYyQXfpgBhc5rCOt_yjXRnA&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=hK08zPDq80tTkhYOZQvAhw&_nc_ss=7c289&oh=00_Af5nc1dHUyh7c8CPUne_As7vHJaEmu4bsjn2dlLRwtD_Zw&oe=6A1B7DA5",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/509615741_9576806665758273_8037407169078525822_n.jpg?stp=cp6_dst-jpg_fb50_s320x320_tt6&_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=9274lmXfeuQQ7kNvwER6MsF&_nc_oc=Adq21sTyecmGUr5jubZL4lIo1SqN64snN9-SSTtk5J60OYyQXfpgBhc5rCOt_yjXRnA&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=hK08zPDq80tTkhYOZQvAhw&_nc_ss=7c289&oh=00_Af6nGPIZeMJsBtuVwHLbilXwnuQg0IEnBxcMtiTbfCWoBw&oe=6A1B7DA5",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/684159008_26088238194188526_5752530262905327171_n.jpg?stp=c0.217.1390.1390a_cp6_dst-jpg_s851x315_tt6&_nc_cat=100&ccb=1-7&_nc_sid=8a6525&_nc_ohc=IqQTl8aH4UgQ7kNvwEzkdXE&_nc_oc=AdrBFcVY4S3Mptg4FIuQ-Xn4jb-B63NoJEQtO_oxfnVvyIToCgINb1zXvFQElkNwdl0&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=hK08zPDq80tTkhYOZQvAhw&_nc_ss=7c289&oh=00_Af5HQauW2l6oqjmTtdpX29JD_4YSTzyr9ke1HYxc_uLklQ&oe=6A1B764E",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/683023386_26088238197521859_8778921023889344674_n.jpg?stp=c0.219.1384.1384a_cp6_dst-jpg_s851x315_tt6&_nc_cat=105&ccb=1-7&_nc_sid=8a6525&_nc_ohc=S4JpRu3CXe4Q7kNvwGLgH_v&_nc_oc=AdpHNyHeB3vKN3Prs-__vuvl3LtN3vUPSHMp49xEHFbTSnzdffmPPaol3JmOMsSA7VU&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=hK08zPDq80tTkhYOZQvAhw&_nc_ss=7c289&oh=00_Af4HVcyHzVYV7hcXJRt7226zQ852S2d_6eXHwa8nSjChNg&oe=6A1B63E7",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/674389671_25968767696135577_3970162458792049018_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=110&ccb=1-7&_nc_sid=8a6525&_nc_ohc=UyMkH2vq4FwQ7kNvwE6uZ7O&_nc_oc=AdoEMcB1knYNCYlS25kWPh3m4a8Ni6_ATlbNwnjGxIpdakpswZ_RRifotyaazDU1c0o&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=hK08zPDq80tTkhYOZQvAhw&_nc_ss=7c289&oh=00_Af6Kb1IYVC2xf_lRi1mB03XPZmGSEdvY2ZbRZU09gZKTfQ&oe=6A1B6E54"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "J-22",
    "circle_name": "K醬ㄉ攤",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/s092077?locale=zh_TW",
    "cover_url": "",
    "body": "- BangDream itsMyGO!!!!!\n- Lovelive\n- 超時空輝耀姬\n\n**専區**: 綜合\n\n🔗 Facebook: [https://www.facebook.com/s092077?locale=zh_TW](https://www.facebook.com/s092077?locale=zh_TW)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/289966540_2839686256177476_454345235286989128_n.jpg?stp=dst-jpg_tt6&cstp=mx921x924&ctp=s720x720&_nc_cat=107&ccb=1-7&_nc_sid=3ab345&_nc_ohc=8RpIewi9iMoQ7kNvwFtcZ0V&_nc_oc=AdqeG27ZWDI1vWQ13VyOa7kxy31Rzi7ej8Lwz-sxejxD2BBl6_43QgepAfHNqVMvb4A&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=DLrNtrUeeNKvFTWv94lIsg&_nc_ss=7c289&oh=00_Af7d8ms3ixHj7VM8_oqNR_ltsHVQYwJcx7HcjMooglxZUQ&oe=6A1B51C8",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t1.6435-9/132558514_2348645541948219_3116610108256635898_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=Bt8oRJMzW28Q7kNvwHMO-aN&_nc_oc=AdocYl0x-bguv8Kk20rF0C14PXXhsuAiH4dLQF_cVfNgP4Ron1AvtiHLwNJKJKJH6es&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=flIUWBxRKtgSJc8Bhgp_KQ&_nc_ss=7c289&oh=00_Af5kK6z49WbGA-EFkyLw7VZkfrxob0vTAGNa59kn5I5sMg&oe=6A3CEA55",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t1.6435-9/132558514_2348645541948219_3116610108256635898_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=Bt8oRJMzW28Q7kNvwHMO-aN&_nc_oc=AdocYl0x-bguv8Kk20rF0C14PXXhsuAiH4dLQF_cVfNgP4Ron1AvtiHLwNJKJKJH6es&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=flIUWBxRKtgSJc8Bhgp_KQ&_nc_ss=7c289&oh=00_Af4jnM52vsaI6joX7FNgK7Zl8YuESMEclpZ8jPvIZhBAoQ&oe=6A3CEA55",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704147420_4291372844342136_4639579229041591259_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=102&ccb=1-7&_nc_sid=09d16d&_nc_ohc=Tya7qdsMI-gQ7kNvwGKTOl-&_nc_oc=AdrUNdF3bLqLtUu79Ic-J0ffq9Fuei-JUSOPnibkTLVz5XEkgUSw0nren9W-tltSz6o&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=flIUWBxRKtgSJc8Bhgp_KQ&_nc_ss=7c289&oh=00_Af7103Vd7sV1dSbxHIj0YvAaaVZRCKsyMhew2i1PMz1evQ&oe=6A1B72AE",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/707632631_4291372841008803_7677849113455625505_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=100&ccb=1-7&_nc_sid=09d16d&_nc_ohc=s-NN9bZA6JYQ7kNvwHWH5UE&_nc_oc=AdrvBSg2k-IUC1r-wu2ytXQYk5kDxc-rvZiMkZnynoF3aTPDHTAnxi0PixigI65Sl2I&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=flIUWBxRKtgSJc8Bhgp_KQ&_nc_ss=7c289&oh=00_Af7w22pSe86t0_urEE-3cp9hUeMG156agx6FNPmeS1Y9AQ&oe=6A1B7F60",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/707509978_4291372687675485_1816970856062180511_n.jpg?stp=c0.200.1443.1443a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=09d16d&_nc_ohc=xeKgZYTWLXIQ7kNvwGE-sS2&_nc_oc=AdpQ6J3qxCLigesIP2a_N6BvApwLXYa_VlTqxszci1uijPheXHgKZPMmJNsW0gjo3OM&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=flIUWBxRKtgSJc8Bhgp_KQ&_nc_ss=7c289&oh=00_Af6pLxNFo1KbD1VhEXeLpiM_I-Uan7zL9YkV51UX23KAtg&oe=6A1B7BCE"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "J-23",
    "circle_name": "Polaris",
    "author": "",
    "x_handle": "laylay_152",
    "x_url": "https://x.com/laylay_152",
    "cover_url": "",
    "body": "- 超かぐや姫\n\n**専區**: 綜合\n\n🔗 X: [laylay_152](https://x.com/laylay_152)\n\n## 📝 CH19 出展ハイライト\n新刊 **『マーガレット [Marguerite]』** B5 右翻 / 黒白內頁 26P / 月見ヤチヨ×酒寄彩葉 (左右有意義)\n- [印量調查](https://t.co/I8Ortk3fA5)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HIcc0S6bMAAdA_f.jpg",
      "https://pbs.twimg.com/media/HIcc0S8aUAAtM1p.jpg",
      "https://pbs.twimg.com/media/HIcc0S8a0AAjsKm.jpg",
      "https://pbs.twimg.com/media/HIcc1osbEAAq_Ly.jpg",
      "https://pbs.twimg.com/media/HIccQxbbYAAh0GP.jpg",
      "https://pbs.twimg.com/media/HIaQrMdbIAAKPNJ.jpg"
    ],
    "cps": [
      "iroyachi"
    ],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": true,
      "detected_cps": [
        "iroyachi"
      ],
      "has_ch19_post": true
    }
  },
  {
    "booth_id": "J-24",
    "circle_name": "果物一途",
    "author": "",
    "x_handle": "ani77561234",
    "x_url": "https://x.com/ani77561234",
    "cover_url": "",
    "body": "- 超時空輝耀姬-大學paro同人誌\n- 超時空輝耀姬-三人行同人誌\n- miComet-同人誌\n\n**専區**: 綜合\n\n🔗 X: [ani77561234](https://x.com/ani77561234)\n\n## 📝 CH19 出展ハイライト\n新刊 2 種: **『彩葉×八千代の大学妄想學趴』** + **『輝耀×彩葉×八千代 3P本』** (R-18、当日要證件) ／ 既刊あり ／ 15:00 後 猜拳大会 (海報賞)\n- [原 tweet (@ani77561234)](https://x.com/ani77561234)",
    "cps": [
      "iroka",
      "iroyachi",
      "trio-sk"
    ],
    "tags": {
      "super-kaguya": true,
      "r18": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJPc5I2aUAENudM.jpg",
      "https://pbs.twimg.com/media/HJO_M-UboAAgRq5.jpg",
      "https://pbs.twimg.com/media/HJO_OHsaAAA7YYU.jpg",
      "https://pbs.twimg.com/media/HJLMwfTaQAAeWir.jpg",
      "https://pbs.twimg.com/media/HJLMwepbgAAiFF-.jpg",
      "https://pbs.twimg.com/media/HJLvm01aQAAfEyq.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": true,
      "detected_cps": [
        "iroka",
        "trio-sk"
      ],
      "has_ch19_post": true
    }
  },
  {
    "booth_id": "J-25",
    "circle_name": "湖底章魚音樂盒",
    "author": "",
    "x_handle": "sinyatako1",
    "x_url": "https://x.com/sinyatako1?s=21&t=hMm51tDxzSwRLbs1B1XvAA",
    "cover_url": "",
    "body": "- 世界計畫 繽紛舞台！ feat.初音未來\n- 超時空輝夜姬！\n\n**専區**: 綜合\n\n🔗 X: [sinyatako1](https://x.com/sinyatako1?s=21&t=hMm51tDxzSwRLbs1B1XvAA)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HI6o7qNa8AAO5dn.png",
      "https://pbs.twimg.com/media/HH2d7QGaAAA7_qL.jpg",
      "https://pbs.twimg.com/amplify_video_thumb/2049844777953398784/img/DcsCh-4GryoojG6Y.jpg",
      "https://pbs.twimg.com/amplify_video_thumb/2049844777957605376/img/YLTn4zq8z5IJrnTo.jpg",
      "https://pbs.twimg.com/media/HHHxpBfaEAA0evC.jpg",
      "https://pbs.twimg.com/media/HG_TftNbEAEhvUK.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "S-01",
    "circle_name": "KARAS押形",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/KARASoshigata",
    "cover_url": "",
    "body": "- 原創\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/KARASoshigata](https://www.facebook.com/KARASoshigata)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/465717132_28204283635825656_4990727034736663224_n.jpg?stp=dst-jpg_tt6&cstp=mx195x195&ctp=s195x195&_nc_cat=105&ccb=1-7&_nc_sid=3ab345&_nc_ohc=lle0A0hEIo0Q7kNvwFPm8Gf&_nc_oc=Adpz1MbXUIOcLVfOR0wCBwwJ54scgYDafRvz_1k4WNW7BBvubim0ZD51pbMRgj8TDyI&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=GtHAanygfqIydvR1MYsArQ&_nc_ss=7c289&oh=00_Af7L5jf8OtEi2PWkN-H7CWrpTKFRCU7nltEdti0wvuM-CA&oe=6A1B7C60",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/481007498_1183192119830197_4821048231862593933_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=109&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=LO8lmHYkKMkQ7kNvwET0fX-&_nc_oc=Ado5hl68Q6Ao9vb_ymJRc6XOAsVuPbj8xvtEyXLoLM5iCUzFzUEP2m1LT_5zycPvqNs&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=K5k00NAsPMFg-GFNMbLqOA&_nc_ss=7c289&oh=00_Af6h1XJ9r0bC8G-8jfZwlZ3ev9S5TE_uFPEq-ghQK5kfvw&oe=6A1B735F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/481007498_1183192119830197_4821048231862593933_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=LO8lmHYkKMkQ7kNvwET0fX-&_nc_oc=Ado5hl68Q6Ao9vb_ymJRc6XOAsVuPbj8xvtEyXLoLM5iCUzFzUEP2m1LT_5zycPvqNs&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=K5k00NAsPMFg-GFNMbLqOA&_nc_ss=7c289&oh=00_Af5Q7Slp-SYcNEtgIwRZN4djPrwrFTc_chV4wJgNqgym7g&oe=6A1B735F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/707453729_1541174744031931_1286010936786466654_n.jpg?stp=c0.79.523.523a_dst-jpg_s851x315_tt6&_nc_cat=106&ccb=1-7&_nc_sid=09d16d&_nc_ohc=tnUzHQZyNnUQ7kNvwEFBc7u&_nc_oc=AdpDCeAK6rlopcP1tJs4efHg5LNsy6jQbnjgRX7YbumWeka1a_BFig4JYdifEFmeS88&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=K5k00NAsPMFg-GFNMbLqOA&_nc_ss=7c289&oh=00_Af4vY3pWA-iT9daSpMgThc8f3jwatazK71NUIc_-qD6iDw&oe=6A1B7A32",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704564958_1539394940876578_2199438075999189227_n.jpg?stp=c538.0.924.924a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=8a6525&_nc_ohc=X7DS8f1g2mgQ7kNvwHuO-yY&_nc_oc=AdoEGqcJvWKkVG6RDqPJfNZwnKENa_AMH8nfunnO8TA9X3iefS1iOoBdjBjLDeEn59o&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=K5k00NAsPMFg-GFNMbLqOA&_nc_ss=7c289&oh=00_Af5HWGmZ0ZwoBldojcTDr-a29mQU8vbmd0qxSU_X0ov2Kw&oe=6A1B774B",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704267317_1539395014209904_8868254798644334016_n.jpg?stp=c0.538.1389.1389a_dst-jpg_s851x315_tt6&_nc_cat=106&ccb=1-7&_nc_sid=8a6525&_nc_ohc=msxZXtTItRoQ7kNvwFrNJaE&_nc_oc=Adr3mFDsJ6Z9x2lbyi50M7a9gEOIqri8QRr49tcy-gh2hCBlUrtEeDU6dQP8Wa04Y3Y&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=K5k00NAsPMFg-GFNMbLqOA&_nc_ss=7c289&oh=00_Af6RBbK_XN3cnuwpVBDFK4f-mvNDKEiMw2g3nUshXRfzzQ&oe=6A1B7193"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-02",
    "circle_name": "包伯尼幼兒園",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/li.chun.ba.ba.da.xia/",
    "cover_url": "",
    "body": "- 原創-快樂老鼠\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 Facebook: [https://www.facebook.com/li.chun.ba.ba.da.xia/](https://www.facebook.com/li.chun.ba.ba.da.xia/)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 0,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-03",
    "circle_name": "角角吉",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/jiao.ji.327793/",
    "cover_url": "",
    "body": "- MyGO!!!!!\n- AveMujica\n- 原創-記憶裡的昆蟲小姐\n\n**専區**: 百合\n**連攤**: ╣\n\n🔗 Facebook: [https://www.facebook.com/jiao.ji.327793/](https://www.facebook.com/jiao.ji.327793/)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/696531995_1910596129593776_7077135748663358811_n.jpg?stp=cp6_dst-jpg_tt6&cstp=mx1438x1438&ctp=s720x720&_nc_cat=107&ccb=1-7&_nc_sid=3ab345&_nc_ohc=S2jUIyrb3HwQ7kNvwF3P5bm&_nc_oc=AdqH6xhpowsF91oV04lHC33Uo_m5bc-g3BHmVxnwomR8qY5WmChIq1Pd5TOYmQeG6lI&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=yFif46Xvw27qnh5UX5oLUA&_nc_ss=7c289&oh=00_Af5ZrTYQIz1YI2ma0VBeNicJxoJYbE-of-hRPc6F44OMBg&oe=6A1B66D5",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/486839654_1603969660256426_208189422168825105_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=f1oHfb6a2iUQ7kNvwE9qjcE&_nc_oc=Adq-S4Lkm6qdupfPSS3yTHPZs78Npws07GmnDjmSbd8uvs27mogBC75wer61clCGdVQ&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Yau_-BsOoLYjKwx25xztjw&_nc_ss=7c289&oh=00_Af489tDS9i8-nebTiGsMHCbDyK2NwjkgNIP-s13L7e1iLw&oe=6A1B78C5",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/486839654_1603969660256426_208189422168825105_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=f1oHfb6a2iUQ7kNvwE9qjcE&_nc_oc=Adq-S4Lkm6qdupfPSS3yTHPZs78Npws07GmnDjmSbd8uvs27mogBC75wer61clCGdVQ&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Yau_-BsOoLYjKwx25xztjw&_nc_ss=7c289&oh=00_Af5leoyxs8jEpZfhTNrcYdp_atInz9-cxLokeJ2pEmFauw&oe=6A1B78C5",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705906530_1919289748724414_1589844795947872084_n.jpg?stp=c404.0.1240.1240a_cp6_dst-jpg_s851x315_tt6&_nc_cat=109&ccb=1-7&_nc_sid=8a6525&_nc_ohc=pFBnAydxMkkQ7kNvwHiYkZd&_nc_oc=AdoWJFkRHqsLBndlgoon1E0lIsLYz2jmayetvyMF7bTMW8OionCFUtIqU2n4etIEtl4&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Yau_-BsOoLYjKwx25xztjw&_nc_ss=7c289&oh=00_Af5rHHyj3SKelJnstcSrngRq78R1GURIuhyORNa4vbJZUg&oe=6A1B5456",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705968728_1918631718790217_7751617319850831750_n.jpg?stp=c0.200.1443.1443a_dst-jpg_s851x315_tt6&_nc_cat=100&ccb=1-7&_nc_sid=09d16d&_nc_ohc=-32e3zmtcEYQ7kNvwELK9XL&_nc_oc=AdpWOIk2Zyz8dGoYfFolZx8NhaG7ih-WDhU3Ixat78eMM8k9tZ3aB8fc-grxooQXhZ0&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Yau_-BsOoLYjKwx25xztjw&_nc_ss=7c289&oh=00_Af6yGtQkTHTi9Xj35_TZrUAucgeSzVkcE26YPMycYfSn-A&oe=6A1B693D",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705341207_1918631658790223_7831318360524746051_n.jpg?stp=c0.200.1443.1443a_dst-jpg_s851x315_tt6&_nc_cat=109&ccb=1-7&_nc_sid=09d16d&_nc_ohc=j7359YsVKwoQ7kNvwEvXbsa&_nc_oc=Adp6ttZNQ-YWfE8S4OhI7nxGjpxwmGbRZUjU6KkMbs-q0JsL19Cu78b1TOR67mdKzdg&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Yau_-BsOoLYjKwx25xztjw&_nc_ss=7c289&oh=00_Af7EseWDztIKUO6hlJ1W6ZgIY3EDGhMYZnkGKMjppc3d9Q&oe=6A1B4EDA"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-04",
    "circle_name": "夜行飛船",
    "author": "",
    "x_handle": "",
    "x_url": "https://lit.link/zh-tw/witlhgti",
    "cover_url": "",
    "body": "- 原創-《世界末日&後日談》\n- 原創-《魔女的坩堝不加石榴花》\n- 原創-《證件照相機生存守則》\n\n**専區**: 百合\n**連攤**: ╣\n\n🔗 lit.link: [https://lit.link/zh-tw/witlhgti](https://lit.link/zh-tw/witlhgti)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://prd.storage.lit.link/images/creators/acded1cf-dac3-4fe4-ad09-420473b6741f/ogp/ogp_image.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "aggregator",
      "image_count_avail": 1,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-05/06",
    "circle_name": "山鐘塔第三防衛機關",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/shi.zhong.394980/",
    "cover_url": "",
    "body": "- 原創-魚\n- 原創-夜晚的泳池深不見底\n- 原創-和頭上有發光披薩圈圈的女孩子交朋友的十種方法\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 Facebook: [https://www.facebook.com/shi.zhong.394980/](https://www.facebook.com/shi.zhong.394980/)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/671838076_1702716270894266_7797378627684218549_n.jpg?stp=dst-jpg_tt6&cstp=mx1382x1382&ctp=s720x720&_nc_cat=104&ccb=1-7&_nc_sid=3ab345&_nc_ohc=me4CLBDPFgAQ7kNvwEUHEbR&_nc_oc=AdokYJaIdoK0K7buOv4gnD_oH__BH63LxSMLL7tIMgv9CM0-skSJM6Hug7rWsDCxOdE&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=drgeIgxN0CX2voE0-LdoDQ&_nc_ss=7c289&oh=00_Af6HJtDh2Cx85tL4RMRMWN1sq5G9wjNrT8naulP-DXCWEQ&oe=6A1B62E7",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/672692641_1706150200550873_1877149018290808809_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=5tPUzwYWDCsQ7kNvwF4x_xM&_nc_oc=Adp61iGuXgoHW2BXTpCVdP7Ri59WoumM97VJ9eYnU3DOM-DCtc237Yevk0VflKjGPrc&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=FAXLOO7qzq3qwegT3KImCw&_nc_ss=7c289&oh=00_Af6puAsp9PCvqYZHIWRfN_pJ96x5BgaFcoXxPG5gZSfWYw&oe=6A1B7761",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/672692641_1706150200550873_1877149018290808809_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=5tPUzwYWDCsQ7kNvwF4x_xM&_nc_oc=Adp61iGuXgoHW2BXTpCVdP7Ri59WoumM97VJ9eYnU3DOM-DCtc237Yevk0VflKjGPrc&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=FAXLOO7qzq3qwegT3KImCw&_nc_ss=7c289&oh=00_Af7hAhNFKkrztWcLEvOH7yXDT_wynuUS1gcYtpO9QUTxbQ&oe=6A1B7761",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/672692641_1706150200550873_1877149018290808809_n.jpg?stp=c302.0.1444.1444a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=578376&_nc_ohc=5tPUzwYWDCsQ7kNvwF4x_xM&_nc_oc=Adp61iGuXgoHW2BXTpCVdP7Ri59WoumM97VJ9eYnU3DOM-DCtc237Yevk0VflKjGPrc&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=FAXLOO7qzq3qwegT3KImCw&_nc_ss=7c289&oh=00_Af7kn8JxxdIaXVR_DeeICkOvamxnKKOKuJP2QGUMMgcYSQ&oe=6A1B7761",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704811785_1734839954348564_3711969988161513989_n.jpg?stp=c256.0.1536.1536a_dst-jpg_s851x315_tt6&_nc_cat=109&ccb=1-7&_nc_sid=8a6525&_nc_ohc=fnWxqX_z-K0Q7kNvwH1YynL&_nc_oc=Ado-aiQkW5XIn56E39eahCHBlZoiGUo2IniKBXaGGfv9cvS7vcdMXqYf2pDtQgNE5sg&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=FAXLOO7qzq3qwegT3KImCw&_nc_ss=7c289&oh=00_Af4_zGb5Gz1E7WWZKZeyZa7WsH2QPrAGy-jMiTctkQxBFw&oe=6A1B570E",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704869151_1734270611072165_2618881203150703032_n.jpg?stp=c256.0.1536.1536a_dst-jpg_s851x315_tt6&_nc_cat=106&ccb=1-7&_nc_sid=8a6525&_nc_ohc=94YcFtfmqLwQ7kNvwGKFDK9&_nc_oc=Adq4oPy0rX8vf5NEqnBH5RMRch4VfEVY_i5fTV_usHIlzSz6zoN3CQNSjk4TjB0YhOM&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=FAXLOO7qzq3qwegT3KImCw&_nc_ss=7c289&oh=00_Af74x3JLFXvvUXpl2_vxMRxkn-O82g3on3eSV2NHJC6HMg&oe=6A1B7266"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-07",
    "circle_name": "阿靡緹柚潔",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/loveliver0827",
    "cover_url": "",
    "body": "- 原創-MEMORIES BETWEEN MARU&HIME\n- 原創-MOMENTS BETWEEN MARU&HIME\n- 原創-MARUHIME戀愛中\n\n**専區**: 百合\n\n🔗 Plurk: [loveliver0827](https://www.plurk.com/loveliver0827)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 0,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-08",
    "circle_name": "TMPB Project",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/s22393",
    "cover_url": "",
    "body": "- 原創-為你的身體哀悼/禱告\n\n**専區**: 百合\n\n🔗 Plurk: [s22393](https://www.plurk.com/s22393)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_60JszmPFdmaPLoPDZBLuU5.jpg",
      "https://images.plurk.com/mx_5rg5JYd6mB06heEgTEde34.jpg",
      "https://images.plurk.com/mx_5Sa4IwUb0JIvohxiANFUJ3.jpg",
      "https://images.plurk.com/mx_5XRXsnBLbiFtqjJXkhINUe.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 4,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-09",
    "circle_name": "勝者早餐大冰紅",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/renyinaloha",
    "cover_url": "",
    "body": "- 原創漫畫_Bride of the Forest\n\n**専區**: 百合\n\n🔗 Plurk: [renyinaloha](https://www.plurk.com/renyinaloha)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "original": true,
      "manga": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_21MqY3fJSEaMBZMdKVa8SZ.jpg",
      "https://images.plurk.com/mx_4YaaL49kudI6qlu1EM8BSo.jpg",
      "https://images.plurk.com/mx_5DNjkqnv7cQRQYwwKsXKav.jpg",
      "https://images.plurk.com/mx_671DEtDVblPmYI15CRRWdN.jpg",
      "https://images.plurk.com/mx_20kBdNyM7cTd6ZDVHzn8HA.jpg",
      "https://images.plurk.com/mx_7FB3BKeeunp2GSWipoWZbR.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-10",
    "circle_name": "Majuchime",
    "author": "",
    "x_handle": "Chihlun42",
    "x_url": "https://x.com/Chihlun42",
    "cover_url": "",
    "body": "- 原創短篇漫畫\n- BanG Dream! Ave Mujica\n\n**専區**: 百合\n\n🔗 X: [Chihlun42](https://x.com/Chihlun42)",
    "tags": {
      "original": true,
      "manga": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HIY91BYaEAAUy6D.jpg",
      "https://pbs.twimg.com/amplify_video_thumb/2055281524560601088/img/6EuZ69T49UPm4avD.jpg",
      "https://pbs.twimg.com/media/HIArk1FbwAAnAry.jpg",
      "https://pbs.twimg.com/media/HGxnG5GagAAMAM9.jpg",
      "https://pbs.twimg.com/media/HFtXlQ7bwAApVPO.jpg",
      "https://pbs.twimg.com/media/HFtXlQ7aYAE7iQt.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-11",
    "circle_name": "芒果汁加珍珠",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/p/3i2nll7mkt",
    "cover_url": "",
    "body": "- PSYCHO-PASS心靈判官\n- 原創-奇異果企鵝\n- 原創-日本擺攤心得本\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 Plurk: [p](https://www.plurk.com/p/3i2nll7mkt)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/5xLNqFmErVvciO8YJ4RGsQ.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 1,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-12",
    "circle_name": "台灣百合漫畫研究",
    "author": "",
    "x_handle": "",
    "x_url": "https://linktr.ee/taiwanlilyproject",
    "cover_url": "",
    "body": "- 原創-百合研究筆記\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 Linktree: [https://linktr.ee/taiwanlilyproject](https://linktr.ee/taiwanlilyproject)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://linktr.ee/og/image/taiwanlilyproject.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "aggregator",
      "image_count_avail": 1,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-13/14",
    "circle_name": "花開。花烙",
    "author": "",
    "x_handle": "",
    "x_url": "https://blossoming-faded.blog/",
    "cover_url": "",
    "body": "- 原創-再生花\n- 原創-以愛之名\n- 死亡愛麗絲同人小說-正義のゾウフ\n\n**専區**: 百合\n\n🔗 出處: [https://blossoming-faded.blog/](https://blossoming-faded.blog/)",
    "tags": {
      "original": true,
      "novel": true,
      "yuri-zone": true
    },
    "warnings": []
  },
  {
    "booth_id": "S-15",
    "circle_name": "非黑即白",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/akomari",
    "cover_url": "",
    "body": "- 原創--綻妄 - IseeU Psychosis -\n- 二創--片羽カタハネ\n\n**専區**: 百合\n\n🔗 Plurk: [akomari](https://www.plurk.com/akomari)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_2tHFLGZPOw7qexT9IjQmQW.jpg",
      "https://images.plurk.com/mx_1MBsn9j6kBdMCt7iMK7BzL.jpg",
      "https://images.plurk.com/mx_4plyd13ZxK5NNtdjRLAKoS.jpg",
      "https://images.plurk.com/mx_2eA5btq1vfV690eHyXRPnB.jpg",
      "https://images.plurk.com/mx_720QR3zUynYbydho04JIQa.jpg",
      "https://images.plurk.com/mx_1QRy7tWXUJfD5UJvTPe5Yc.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-16",
    "circle_name": "洛洛麵包舖",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/share/1DirLS4LyR/?mibextid=wwXIfr",
    "cover_url": "",
    "body": "- 原創-那個聖女過於溫柔\n- 我怎麼可能成為妳的戀人，不行不行\n- Ave mujica\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/share/1DirLS4LyR/?mibextid=wwXIfr](https://www.facebook.com/share/1DirLS4LyR/?mibextid=wwXIfr)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/528119226_1068895792100761_3272971971962279392_n.jpg?stp=dst-jpg_tt6&cstp=mx960x958&ctp=s720x720&_nc_cat=100&ccb=1-7&_nc_sid=3ab345&_nc_ohc=v-d_DbOnagkQ7kNvwGjO3Xm&_nc_oc=AdrCl_fz8JhnLfP97wH9Rrc0X4jCucHlj4xgthL1fkABD8fBW56wJL-f_7aliurQy70&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=BsDJYmP4EDqnWDZ0I9Sz6w&_nc_ss=7c289&oh=00_Af5DQ7rmv_T9ClW-fnYKI9FRe57sjOlFYivajt9iCzqWwQ&oe=6A1B56A6",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/566239888_1131012665889073_6573918325966312306_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=V_LBXm3iV1oQ7kNvwFj6QS3&_nc_oc=AdoxJZmKxKCeJMbX05WNOK8t7futLmM9ZFcWxw5u0Bb74QrjJAm1uvlLdCFC7grncf0&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=R2Wl24PIVMSWHzYuXXuxHQ&_nc_ss=7c289&oh=00_Af5lQD-2Bl9tBt6RDtegTpVcxnz5iwV0fok1itpvCCDq-g&oe=6A1B7F0F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/566239888_1131012665889073_6573918325966312306_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=V_LBXm3iV1oQ7kNvwFj6QS3&_nc_oc=AdoxJZmKxKCeJMbX05WNOK8t7futLmM9ZFcWxw5u0Bb74QrjJAm1uvlLdCFC7grncf0&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=R2Wl24PIVMSWHzYuXXuxHQ&_nc_ss=7c289&oh=00_Af5OmkqnxRz2NKdWNesbK0CZmOK8aY5igNptuclsmJYcEw&oe=6A1B7F0F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/528119226_1068895792100761_3272971971962279392_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=100&ccb=1-7&_nc_sid=1d2534&_nc_ohc=v-d_DbOnagkQ7kNvwGjO3Xm&_nc_oc=AdrCl_fz8JhnLfP97wH9Rrc0X4jCucHlj4xgthL1fkABD8fBW56wJL-f_7aliurQy70&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=RU05EiPxHAgBgNCan-0QrA&_nc_ss=7c289&oh=00_Af6GR75kLX6OwFw1E2CdV54cVptETQsYzIOKKnPMkPcXQw&oe=6A1B56A6",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/700015105_1556042116091453_556967644044633446_n.jpg?stp=cp0_dst-jpg_p80x80_tt6&_nc_cat=107&ccb=1-7&_nc_sid=1d2534&_nc_ohc=a2TGusi1MeoQ7kNvwERcLfe&_nc_oc=AdpO7JHqjFoJoSK_MY74Jt7EDHoBsQ-xyNeaflS_Ibm_hQBYghDeg3fwXwfRiZIas9A&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=RU05EiPxHAgBgNCan-0QrA&_nc_ss=7c289&oh=00_Af47GZJIRjUIo33wtUxt6o_8z77oYftxUk-gjqkaON4wzA&oe=6A1B7063",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/669745847_1266283239028681_2701105959622973079_n.jpg?stp=c408.0.640.640a_cp6_dst-jpg_s851x315_tt6&_nc_cat=105&ccb=1-7&_nc_sid=8a6525&_nc_ohc=P3Vvz-wERasQ7kNvwFsrOyo&_nc_oc=Adrar6fBrPAe9pHk3973ivU_Xa5xAQEP0Vw5_oaMGAkqA62T5Y_AtssEx1OR8TiZEX8&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=R2Wl24PIVMSWHzYuXXuxHQ&_nc_ss=7c289&oh=00_Af61HCeyHRElNEzh9eJbUkaq0NF8ANe64Wuoj6B3JywH-A&oe=6A1B6865"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-17",
    "circle_name": "工坊·夏至千里",
    "author": "",
    "x_handle": "",
    "x_url": "https://home.gamer.com.tw/profile/index.php?&owner=summerkmth",
    "cover_url": "",
    "body": "- 原創-超取魅魔\n- Vtuber\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 出處: [https://home.gamer.com.tw/profile/index.php?&owner=summerkmth](https://home.gamer.com.tw/profile/index.php?&owner=summerkmth)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": []
  },
  {
    "booth_id": "S-18",
    "circle_name": "百元肉肉",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.pixiv.net/users/612797",
    "cover_url": "",
    "body": "- 搖曳露營\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 出處: [https://www.pixiv.net/users/612797](https://www.pixiv.net/users/612797)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": []
  },
  {
    "booth_id": "S-19/20",
    "circle_name": "陽台有好康",
    "author": "",
    "x_handle": "Kokokoro__",
    "x_url": "https://x.com/Kokokoro__",
    "cover_url": "",
    "body": "- GBC\n- 原創\n\n**専區**: 百合\n\n🔗 X: [Kokokoro__](https://x.com/Kokokoro__)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJLoZVVawAAaC1E.jpg",
      "https://pbs.twimg.com/media/HJOYatAbEAAAPfX.png",
      "https://pbs.twimg.com/media/HJNzkhHbIAArUNz.png",
      "https://pbs.twimg.com/media/HJDqB11acAAUwXo.jpg",
      "https://pbs.twimg.com/media/HI56aWtbwAA1lxY.jpg",
      "https://pbs.twimg.com/media/HI58z6maUAAmOW1.png"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-21",
    "circle_name": "好米味",
    "author": "",
    "x_handle": "komerice_lo",
    "x_url": "https://x.com/komerice_lo",
    "cover_url": "",
    "body": "- 週に一度クラスメイトを買う話\n- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 X: [komerice_lo](https://x.com/komerice_lo)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HIhh-EHbgAAtRCd.jpg",
      "https://pbs.twimg.com/media/HIhh-EEaQAAar24.jpg",
      "https://pbs.twimg.com/media/HILnAgbbgAA8pJ4.jpg",
      "https://pbs.twimg.com/media/HILnAgVbwAAsfb_.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "S-22",
    "circle_name": "shioisland",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.instagram.com/shioisland?igsh=djZ3Y3JpOGg3bTJq&utm_source=qr",
    "cover_url": "",
    "body": "- 原創-Madder & Teal\n\n**専區**: 百合\n\n🔗 Instagram: [shioisland](https://www.instagram.com/shioisland?igsh=djZ3Y3JpOGg3bTJq&utm_source=qr)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/673787943_17949834672073958_4883280061865672670_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gFciKydC_UPTxuePNZlpOu60tLZcRUFi2Q6-IvxilrzOpXwUFvyZlO_QIF7KQ0nuHo&_nc_ohc=4gbixls-umoQ7kNvwGPgO2d&_nc_gid=bRMXcSmVZX6uEl1pCogc8Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af5jlAIxv9WJNaYZff4dgummGoY_A-_Hc9LGfu3k3xHdcA&oe=6A1B4A20&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/703111659_17952798927073958_8515893167774958598_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gFciKydC_UPTxuePNZlpOu60tLZcRUFi2Q6-IvxilrzOpXwUFvyZlO_QIF7KQ0nuHo&_nc_ohc=c0ICCmd1z5sQ7kNvwG1lPO_&_nc_gid=bRMXcSmVZX6uEl1pCogc8Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af7imdbj6-KJGl4xg7quaI9UWcbewh7DmvoL0eQPMw0cRA&oe=6A1B6DA5&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/545198190_17926530207073958_3560381864523489687_n.jpg?stp=dst-jpg_e35_s640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gFciKydC_UPTxuePNZlpOu60tLZcRUFi2Q6-IvxilrzOpXwUFvyZlO_QIF7KQ0nuHo&_nc_ohc=yMwdwGR7rFsQ7kNvwFC0tz9&_nc_gid=bRMXcSmVZX6uEl1pCogc8Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af7hW43axXJ0Tbr7tdL1Amc4bDam860FbqXgC-LUoN1DHw&oe=6A1B5502&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/705859843_17953143309073958_345032151709275046_n.jpg?stp=dst-jpg_e35_s640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gFciKydC_UPTxuePNZlpOu60tLZcRUFi2Q6-IvxilrzOpXwUFvyZlO_QIF7KQ0nuHo&_nc_ohc=OhaP7COQX-cQ7kNvwHN-_Bh&_nc_gid=bRMXcSmVZX6uEl1pCogc8Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af4vu46W20-Q_9LWUm28p0tIuE0jtRbVbT27l6G-XJesSg&oe=6A1B543F&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/702465714_17952448725073958_9190010183139597190_n.jpg?stp=dst-jpg_e35_s640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gFciKydC_UPTxuePNZlpOu60tLZcRUFi2Q6-IvxilrzOpXwUFvyZlO_QIF7KQ0nuHo&_nc_ohc=a-1G63GTjuYQ7kNvwF2FbdE&_nc_gid=bRMXcSmVZX6uEl1pCogc8Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af68-AcSTZwvdtLOVgnB2ByZg8E7LBjDgKpGMqSLSzaaeQ&oe=6A1B76B0&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/696244551_17951872890073958_2916698398064060533_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gFciKydC_UPTxuePNZlpOu60tLZcRUFi2Q6-IvxilrzOpXwUFvyZlO_QIF7KQ0nuHo&_nc_ohc=L26_7u4eNVsQ7kNvwFLqnM2&_nc_gid=bRMXcSmVZX6uEl1pCogc8Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af6jKvwc9KWQJ31vVuU_5yFVmyIJJ6bcTsiuNAZMuKnZnQ&oe=6A1B5735&_nc_sid=8b3546"
    ],
    "_meta_scrape": {
      "platform_used": "ig",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-23/24",
    "circle_name": "N.D.S.L.",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.doujin.com.tw/groups/info/365/books",
    "cover_url": "",
    "body": "- hololive\n- 都市傳說解體中心\n- 迷宮飯\n\n**専區**: 百合\n\n🔗 doujin.com.tw: [https://www.doujin.com.tw/groups/info/365/books](https://www.doujin.com.tw/groups/info/365/books)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://www.doujin.com.tw/uploads/groups/63/87/63872eca02b5b2c3ba1cd522c33bf7fa_120.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "doujin_tw",
      "image_count_avail": 1,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-25",
    "circle_name": "美栗",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/people/%E8%91%9B%E7%BE%8E%E6%A0%97/61561221459878/",
    "cover_url": "",
    "body": "- hololive\n- Ave mujica\n- 迷宮飯\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/people/%E8%91%9B%E7%BE%8E%E6%A0%97/61561221459878/](https://www.facebook.com/people/%E8%91%9B%E7%BE%8E%E6%A0%97/61561221459878/)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/449848896_122109329912374048_4555487471179681012_n.jpg?stp=dst-jpg_tt6&cstp=mx1200x1200&ctp=s720x720&_nc_cat=102&ccb=1-7&_nc_sid=3ab345&_nc_ohc=i93fv4z64ekQ7kNvwFl5GYO&_nc_oc=Adrhjk3emSOJEZuI55LAzjThNlbQX2QD9TJYJf7gn12jJ7efflTPb_9piQs-szcv5-g&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=F6YJk7UR0EVMSSqj2S3h4Q&_nc_ss=7c289&oh=00_Af5bHi2J_W-Xwew-Go4iOUJTYn5Pmk3UayF59qur-I0XBQ&oe=6A1B77A6",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/469223971_122138367464374048_7952960902622342273_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=ZqY6CmFSb4EQ7kNvwH17W5D&_nc_oc=AdrEeS6Le6NWMB88Da1dY7t5pN2NHs2GLkKfJhO6GIIyaRkX2bS-TuUlzT21iFNyKDw&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=4GzsD7tVvJ0cjy5s49fniQ&_nc_ss=7c289&oh=00_Af6whJyManxoWqvabfzrtdFlSOFoyvy-VT44dtugr-Q9uw&oe=6A1B7247",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/469223971_122138367464374048_7952960902622342273_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=ZqY6CmFSb4EQ7kNvwH17W5D&_nc_oc=AdrEeS6Le6NWMB88Da1dY7t5pN2NHs2GLkKfJhO6GIIyaRkX2bS-TuUlzT21iFNyKDw&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=4GzsD7tVvJ0cjy5s49fniQ&_nc_ss=7c289&oh=00_Af7OgWjPbaeJOKmTpvQZLy6UPlPPrLgGWzY3CpzNE-wsSA&oe=6A1B7247",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/449848896_122109329912374048_4555487471179681012_n.jpg?stp=c343.79.487.487a_cp0_dst-jpg_s80x80_tt6&_nc_cat=102&ccb=1-7&_nc_sid=1d2534&_nc_ohc=i93fv4z64ekQ7kNvwFl5GYO&_nc_oc=Adrhjk3emSOJEZuI55LAzjThNlbQX2QD9TJYJf7gn12jJ7efflTPb_9piQs-szcv5-g&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6frbm3kUMethST_1gOZpgg&_nc_ss=7c289&oh=00_Af75dTcnX8jH2wHDWiBVMr0DE9Lq8SzUieMTszmgyXi2Sg&oe=6A1B77A6",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/708121998_122222599946374048_3648635380275421174_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=X7HcQo9FCOEQ7kNvwGOK7kc&_nc_oc=Adr38rBnhPUbJO4dWOE9o65lvzfAa5HPaJ1gczZlwZ5qeNIC4KWMpGsTuCK0GBYVDhw&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6frbm3kUMethST_1gOZpgg&_nc_ss=7c289&oh=00_Af7qCGozR0WcvCo6GBWdNFGNFVaLoxqk9TPH9t0bRjTCrQ&oe=6A1B7D51",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/708155447_122222599940374048_5355539746233865103_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_ohc=QHYZwJQ8_M8Q7kNvwFOe5bt&_nc_oc=AdpSmMcnpXzNRn2Ht7okoo4kwUZ-fDSvAY-1dmebJ-ydbj6SrXeXTBO_3VHmU7y-qOA&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6frbm3kUMethST_1gOZpgg&_nc_ss=7c289&oh=00_Af78bjM2XO-KMbshl7KgDfWmB_2zq6ayr2wfW0RD6vHkRA&oe=6A1B5141"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-26",
    "circle_name": "馬鈴薯燉肉",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/abcs628945",
    "cover_url": "",
    "body": "- 母雞卡祥初\n- 迷宮飯法瑪\n- 輝耀姬八千代彩葉\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 Plurk: [abcs628945](https://www.plurk.com/abcs628945)\n\n## 📝 CH19 出展ハイライト\n主に **Ave Mujica 祥初 (祥子×初華)** R-18 印量調查中 ／ 既刊に **輝耀姫八千代彩葉** (= iroyachi) あり\n- [印量調查 plurk](https://www.plurk.com/abcs628945)",
    "cps": [
      "iroyachi"
    ],
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true,
      "r18": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_240x0nXyQ9h41GSN5oLDGb.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "plurk",
      "hand_note": true,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "S-27",
    "circle_name": "台北祥初女",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/pipi.yaya.90",
    "cover_url": "",
    "body": "- BanG Dream! Ave Mujica\n\n**専區**: 百合\n**連攤**: ╣\n\n🔗 Facebook: [https://www.facebook.com/pipi.yaya.90](https://www.facebook.com/pipi.yaya.90)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/687041349_1551116750051789_4612131896520821789_n.jpg?stp=dst-jpg_tt6&cstp=mx1469x1469&ctp=s720x720&_nc_cat=106&ccb=1-7&_nc_sid=3ab345&_nc_ohc=D7TUgmym_z4Q7kNvwGPM_GL&_nc_oc=AdoGph-d_RCrCO2fwXKGNjWSJ0xBCVkQRDFyQ8Kkvo4fRpwfUjnIxMRBb0i3HPvrBt4&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=IAT4SGQEIU2ksEk8jCeCRQ&_nc_ss=7c289&oh=00_Af5LhP3UtkC73ZT6g5iI78bNvE24UquugfBBx3TCDsjNDw&oe=6A1B5F07",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/708289811_1573133197850144_52192218144670608_n.jpg?stp=c0.198.1448.1448a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=8a6525&_nc_ohc=lpbENvdqfe0Q7kNvwG04Upj&_nc_oc=AdrGis6fMpkyn5qWUI1exBOE4tUgompFWMqmqkWyZGfB0yw90ToOXaaaQfxnzKIN7c8&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=oFy-2kWernQklSep1GuoeA&_nc_ss=7c289&oh=00_Af7DufB3dir9o-DM1OWy9IHzYyBA4ZBlRd5oQ8YJ0FMULA&oe=6A1B7859",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/701004039_1566460861850711_8409976543667556245_n.jpg?stp=c185.0.1108.1108a_dst-jpg_s851x315_tt6&_nc_cat=102&ccb=1-7&_nc_sid=8a6525&_nc_ohc=4QsRwmV2tmsQ7kNvwFobGnX&_nc_oc=AdqnIKP5X_Vx2bYMFCose2nlkDtaW2Qg3Bg7zBzIuXU1bUBHDUWYXDSB5QJeHd3Oz8c&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=oFy-2kWernQklSep1GuoeA&_nc_ss=7c289&oh=00_Af7DHNUA7LHnG4hr1Q2yYGuXSovfJ6pdeYrQWYmO7VZqRw&oe=6A1B640E",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/700135329_1564721625357968_5176537278275150459_n.jpg?stp=c0.169.1536.1536a_dst-jpg_s851x315_tt6&_nc_cat=108&ccb=1-7&_nc_sid=8a6525&_nc_ohc=JDL0T9s7s3sQ7kNvwFVKZnr&_nc_oc=Adq1_6r9Oka8OG2Tf2Wl921Y2YzBD2TdhL9LH9SAmv4T3HjAbcxIG_IZWmCRIrwAX34&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=oFy-2kWernQklSep1GuoeA&_nc_ss=7c289&oh=00_Af4jh76QzhlmUaL_Xg9QMQWWSosD_cI3kDRMv60jGVtOYw&oe=6A1B6ADA",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/687041349_1551116750051789_4612131896520821789_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=106&ccb=1-7&_nc_sid=1d2534&_nc_ohc=D7TUgmym_z4Q7kNvwGPM_GL&_nc_oc=AdoGph-d_RCrCO2fwXKGNjWSJ0xBCVkQRDFyQ8Kkvo4fRpwfUjnIxMRBb0i3HPvrBt4&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=m-2Klbu_UF5S_M4s_HWoVg&_nc_ss=7c289&oh=00_Af4EqKd-7BOZ5zICm_Jl24qcN8GGF6DNLUpor2R7G_TrqA&oe=6A1B5F07",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/490754901_1250401870123280_8351960396937369682_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=105&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=q7D_emFR3TwQ7kNvwGrm6ey&_nc_oc=AdqOPzfCrbbEllvHHsls3n7lsl-SxNCdnyuz7yV5dQgljSDINje72pRfcBycLlaFii8&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=oFy-2kWernQklSep1GuoeA&_nc_ss=7c289&oh=00_Af4qVL22Jqv-ENGPx7RQXQ-mNQGXR-YAHEkQkj7ByC37Yg&oe=6A1B6C12"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-28",
    "circle_name": "應許之地",
    "author": "",
    "x_handle": "Liugozekino",
    "x_url": "https://x.com/Liugozekino",
    "cover_url": "",
    "body": "- Ave mujica\n- 偶像大師百萬\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 X: [Liugozekino](https://x.com/Liugozekino)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJPYGKkbIAA5rSF.jpg",
      "https://pbs.twimg.com/media/HJPp-1Qa8AA98an.jpg",
      "https://pbs.twimg.com/media/HJPnhO_aEAEK0n7.jpg",
      "https://pbs.twimg.com/media/HJPRctqaQAALRxw.jpg",
      "https://pbs.twimg.com/media/HJL_uQ0bUAAept9.png",
      "https://pbs.twimg.com/media/GtiLcPxa8AA1BCt.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-29",
    "circle_name": "瘋貓食堂",
    "author": "",
    "x_handle": "Crazycat_47",
    "x_url": "https://x.com/Crazycat_47",
    "cover_url": "",
    "body": "- 緋染天空\n- 水星的魔女\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 X: [Crazycat_47](https://x.com/Crazycat_47)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJPiqQobEAAa3gl.jpg",
      "https://pbs.twimg.com/media/HJOoCo5aAAAPX9i.jpg",
      "https://pbs.twimg.com/media/HJFu2Lba0AAG6Wk.jpg",
      "https://pbs.twimg.com/media/HJHaNE1aMAAGLx-.jpg",
      "https://pbs.twimg.com/media/HJHNdBOboAAc5kz.png",
      "https://pbs.twimg.com/media/HJHM73NawAATFAu.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-30",
    "circle_name": "西宿舍洗衣間",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/spton",
    "cover_url": "",
    "body": "- 水星的魔女\n- 小魔女學園\n\n**専區**: 百合\n**連攤**: ╣\n\n🔗 Plurk: [spton](https://www.plurk.com/spton)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_F79Ikzo67nh7iW0zqLQOg.jpg",
      "https://images.plurk.com/mx_54CK63adC9HAfSC6q8AzFR.jpg",
      "https://images.plurk.com/mx_7g391JscF10WF32sm6wKj2.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 3,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-31",
    "circle_name": "INSIDE LAB",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/ToMato182",
    "cover_url": "",
    "body": "- 奧術\n- 原創-INSIDE LAB\n- She-Ra\n\n**専區**: 百合\n**連攤**: ╣\n\n🔗 Plurk: [ToMato182](https://www.plurk.com/ToMato182)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_Ws8fQj7ScHW3WWx4HuxDg.jpg",
      "https://images.plurk.com/mx_4Jz1L9WlEWv8E72oNtkwQT.jpg",
      "https://images.plurk.com/mx_3qjKs07SfkOEjJYt5cEOEB.jpg",
      "https://images.plurk.com/mx_5YzB1PIWuHKtn0PUaiOA3Y.jpg",
      "https://images.plurk.com/mx_3Qs3rTdAQUjEbAwSeG0ViS.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 5,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-32",
    "circle_name": "いろはに甘い節分",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/caramel06",
    "cover_url": "",
    "body": "- HoloLive\n- BanG Dream! (MyGO+Ave Mujica)\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 Plurk: [caramel06](https://www.plurk.com/caramel06)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_3sRJpy3RE3JCmuWBtlBa4M.jpg",
      "https://images.plurk.com/mx_6G0giDUfgHO7kVgR2wNEMl.jpg",
      "https://images.plurk.com/mx_6S89Fyy59DYiZqUfyPYfFM.jpg",
      "https://images.plurk.com/mx_4logDWJjxouc1UIMzvP1Ul.jpg",
      "https://images.plurk.com/mx_1m9uSjjfZPPMJmcQlKxGAT.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 5,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-33/34",
    "circle_name": "依舊笑容紙不住",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/r_bish",
    "cover_url": "",
    "body": "- Girls Band Cry\n- MyGO!!!!!\n- Ave Mujica\n\n**専區**: 百合\n\n🔗 Plurk: [r_bish](https://www.plurk.com/r_bish)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_1Yp4fx4whTiFrVXI4KQjrz.jpg",
      "https://images.plurk.com/mx_39Xqp1hcmgBT0IwddWlvhI.jpg",
      "https://images.plurk.com/mx_6u7lgDMWT0WwkBrzLF7l9k.jpg",
      "https://images.plurk.com/mx_pNLytSI9GKAn4l3X4iSX4.jpg",
      "https://images.plurk.com/mx_6LIf9RGimINLhiFOLzr4H1.jpg",
      "https://images.plurk.com/mx_2AVaGlDmilQGwOP2bUBEnE.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-35/36",
    "circle_name": "歐油希歡樂產業",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/ouyouxi2020",
    "cover_url": "",
    "body": "- 緋染天空\n- 賽馬娘 Pretty Derby\n- 超時空輝耀姬！\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 Plurk: [ouyouxi2020](https://www.plurk.com/ouyouxi2020)\n\n## 📝 CH19 出展ハイライト\n創集繪 新品照公開済、S3536 で 合攤 ／ #緋染天空 + 賽馬娘 + **超時空輝耀姫** マルチ fandom",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_68b989lkjN1vAuyNhjLe9K.jpg",
      "https://images.plurk.com/mx_6c6aiCF2q2CWKz3dRPqdaH.jpg",
      "https://images.plurk.com/mx_7qHDveYGMnfNYe1jwDbIjv.jpg",
      "https://images.plurk.com/mx_1hGLROikL7TqQEr43k2WKO.jpg",
      "https://images.plurk.com/mx_D08KnqHnFGedPwZkpRm0o.jpg",
      "https://images.plurk.com/mx_KaHdRyKz8QoCIyxembDHv.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "plurk",
      "hand_note": true,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "S-37/38",
    "circle_name": "小花",
    "author": "",
    "x_handle": "pomeka35",
    "x_url": "https://x.com/pomeka35",
    "cover_url": "",
    "body": "- hololive\n- MyGo!!!!!\n- 超時空輝夜姬\n\n**専區**: 百合\n**連攤**: ╣\n\n🔗 X: [pomeka35](https://x.com/pomeka35)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HIHw2hfaUAAD5Ad.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "S-39",
    "circle_name": "玥炭繪館@比名子的山珍海味",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/maoyuue",
    "cover_url": "",
    "body": "- 非人少女\n- Ave Mujica\n- 少女歌劇\n\n**専區**: 百合\n**連攤**: ╣\n\n🔗 Facebook: [https://www.facebook.com/maoyuue](https://www.facebook.com/maoyuue)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/488496990_1263786622417014_1963117893048205618_n.jpg?stp=dst-jpg_tt6&cstp=mx1200x1200&ctp=s720x720&_nc_cat=102&ccb=1-7&_nc_sid=3ab345&_nc_ohc=mGb48m_LpL4Q7kNvwGQ2t6w&_nc_oc=AdoCVRG4cGOF1bKcfA1G1gcKcq8MAZbXBcHz4ebgqLFJIChISAHBlycBc2FdJ9KL1Io&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=u1ff4fijAIipSqYXawCtqw&_nc_ss=7c289&oh=00_Af4IbECRbsQFISHpSp_BjLfcgMwuiGeip-NdQI0H8uWUzg&oe=6A1B6001",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/493456445_1287336906728652_7442421216914842948_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=KuSGo3wY8QkQ7kNvwFjfY79&_nc_oc=Adr9lS0DAzRQOywQgOX7Uppk2t17vio4ilGJCroCTfwtDG3Oqyc-4EUw8J3Pm9NSrh4&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=SO5T75u3Vxxu8TitLUPiIw&_nc_ss=7c289&oh=00_Af6iiKh7K1IskIm_p18qsG5M-Y-gEGW--tQtPpNKElc3Xg&oe=6A1B7E11",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/493456445_1287336906728652_7442421216914842948_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=KuSGo3wY8QkQ7kNvwFjfY79&_nc_oc=Adr9lS0DAzRQOywQgOX7Uppk2t17vio4ilGJCroCTfwtDG3Oqyc-4EUw8J3Pm9NSrh4&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=SO5T75u3Vxxu8TitLUPiIw&_nc_ss=7c289&oh=00_Af5qtDGsHvuRISeNxiplMq6SUx17NV5ealW_77vSTacqlA&oe=6A1B7E11",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/488496990_1263786622417014_1963117893048205618_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=102&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=mGb48m_LpL4Q7kNvwGQ2t6w&_nc_oc=AdoCVRG4cGOF1bKcfA1G1gcKcq8MAZbXBcHz4ebgqLFJIChISAHBlycBc2FdJ9KL1Io&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=gOPZwQDAuqPeV_fZVt1QZw&_nc_ss=7c289&oh=00_Af4U4H8RX3saaai_1uYgH-oW647O-omhqwS1xQxwsytx7g&oe=6A1B6001",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/704636863_1644223604373312_6951024391135652067_n.jpg?stp=c0.193.1414.1414a_dst-jpg_s851x315_tt6&_nc_cat=104&ccb=1-7&_nc_sid=09d16d&_nc_ohc=CkXbjbWFt4gQ7kNvwF9MCzv&_nc_oc=AdpT0W8GqbwiJrQB2_DLyECL_ZOLxwndLBRDBLE0mBYRXdzlUNW-pD182HHWADeKCYo&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=SO5T75u3Vxxu8TitLUPiIw&_nc_ss=7c289&oh=00_Af6Kq77R8osiDgQgXbAsT-OsdJM-YQbcE7to7lv9si7_LQ&oe=6A1B5706",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/704507095_1641722901290049_6460247251996711636_n.jpg?stp=c0.136.286.286a_dst-jpg_s286x286_tt6&_nc_cat=101&ccb=1-7&_nc_sid=8a6525&_nc_ohc=KINKx2aIBKgQ7kNvwG4idIJ&_nc_oc=AdpuMPRsgpGHWJMpYH3BsTkS1iKTLRUDThXofNPKwkTpb9mVcabSNx8xAC6NGwuCtTs&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=SO5T75u3Vxxu8TitLUPiIw&_nc_ss=7c289&oh=00_Af6vaUu8aPV5pz2h3gxiVSM10pUO7ysIqFu8o-g-NTqokg&oe=6A1B6E6B"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-40",
    "circle_name": "No Yuri, No Life.",
    "author": "",
    "x_handle": "",
    "x_url": "https://portaly.cc/raker.natsume.0701",
    "cover_url": "",
    "body": "- FLOWERS (Innocent Grey)\n- 莉可麗絲\n- 少女歌劇\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 Portaly: [https://portaly.cc/raker.natsume.0701](https://portaly.cc/raker.natsume.0701)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://img.portaly.cc/HHIVEWh-c1r53lRVFpCFiMZyr9egmFlhqLwwi7TIDaI/rs:fill:1200/q:90/aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9wb3J0YWx5LWNhOWUxLmFwcHNwb3QuY29tL28vRkRuQVdHSGVNRkJjTzRXWXRVTHYlMkZhdmF0YXI_YWx0PW1lZGlhJnRva2VuPWJjNTQ3Y2YyLWU1ZDktNGEzNC04ZWY0LTIwMGMxZGU2YWZhZA"
    ],
    "_meta_scrape": {
      "platform_used": "aggregator",
      "image_count_avail": 1,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "S-41",
    "circle_name": "塔邦棒棒",
    "author": "",
    "x_handle": "",
    "x_url": "https://bsky.app/profile/taboom002.bsky.social",
    "cover_url": "",
    "body": "- 莉可麗絲\n\n**専區**: 百合\n\n🔗 出處: [https://bsky.app/profile/taboom002.bsky.social](https://bsky.app/profile/taboom002.bsky.social)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": []
  },
  {
    "booth_id": "S-42",
    "circle_name": "烏烏烏大維",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/kuan.wei.lin.372350",
    "cover_url": "",
    "body": "- 孤獨搖滾\n- 魔法少女的魔女審判\n- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/kuan.wei.lin.372350](https://www.facebook.com/kuan.wei.lin.372350)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/474928042_4147862685489705_6480764299972559371_n.jpg?stp=dst-jpg_tt6&cstp=mx667x713&ctp=s667x713&_nc_cat=103&ccb=1-7&_nc_sid=3ab345&_nc_ohc=HtToUaq2Am4Q7kNvwGmQGA1&_nc_oc=AdohyImiDpr78_eH40Xey1YfgikLapIiu2HEGB6A5-9bIQ-1r1qL1UPVyLFTmDmg0eA&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=7865dGwGH29OdQfaNUX0VQ&_nc_ss=7c289&oh=00_Af6D2cOo4tj0qqQDtThtKtZSIxWpdxbhme8GC2SiiSmtdA&oe=6A1B4CAE",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/597290207_4460428690899768_8356449818437476023_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=HzNfTF3Hz50Q7kNvwEWnFgg&_nc_oc=Adqb5FP5j-vE8ydSeqg79kfdqwFgn_d4R367sTo346HMHPOdtIfK_Z3PkrnRYJ5PQCM&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=kbczmDYYOcbAUlV_akMepA&_nc_ss=7c289&oh=00_Af7QBs9TKH8zRPH01GMEKwbzNPlzwlJwLxb6IQwKpQNF8w&oe=6A1B5632",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/597290207_4460428690899768_8356449818437476023_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=HzNfTF3Hz50Q7kNvwEWnFgg&_nc_oc=Adqb5FP5j-vE8ydSeqg79kfdqwFgn_d4R367sTo346HMHPOdtIfK_Z3PkrnRYJ5PQCM&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=kbczmDYYOcbAUlV_akMepA&_nc_ss=7c289&oh=00_Af7hBr57VfqKjrgbGqhhMpsJimNHbfQ1g8G4t7NAc5U2iQ&oe=6A1B5632",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/699227969_4614290242180278_2603242533289062353_n.jpg?stp=c130.0.422.422a_dst-jpg_s851x315_tt6&_nc_cat=103&ccb=1-7&_nc_sid=8a6525&_nc_ohc=KCifZR0VEUkQ7kNvwEERkNc&_nc_oc=AdrGlYtfvS--FcmbGuGVUK_1qi2VfSjqaKw21YWgLacwwFzYcS9kjQ9L_Hnj2iTNoRY&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=kbczmDYYOcbAUlV_akMepA&_nc_ss=7c289&oh=00_Af4AHBUzN-5oWRpW4agNuVx8j6cDrg91mL39wk6AVNd_Hg&oe=6A1B752A",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/699110960_4613379015604734_339696990960199844_n.jpg?stp=c0.186.1308.1308a_dst-jpg_s851x315_tt6&_nc_cat=104&ccb=1-7&_nc_sid=09d16d&_nc_ohc=EE9x7M7c7_8Q7kNvwH5_xqS&_nc_oc=AdrDxdDqey5_VOQrber9stpL7bhaPA3zQkdAgBDOSbfSLW1f2bhHBRGl6lzI9vcILRE&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=kbczmDYYOcbAUlV_akMepA&_nc_ss=7c289&oh=00_Af7U7w6BnS_bCxV2UDGqTi9TySFngEq5Exlz5Q5fjRQFTQ&oe=6A1B6CA6",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/699056768_4610546465887989_7717504306890415253_n.jpg?stp=c0.17.828.828a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=8a6525&_nc_ohc=3xn7RUFjRcYQ7kNvwFumqfM&_nc_oc=AdpWInXmYhuGyuTJOTv5FL9BAlQ8TE-MKSraMeSeXFJSoh0YLe3HNxjSoB_vYLQc8HY&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=kbczmDYYOcbAUlV_akMepA&_nc_ss=7c289&oh=00_Af4_E8HdkBBvQCfLZFjMCz6fh33CTBoqzhsUdrYkyfoFgA&oe=6A1B51BF"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "S-43/44",
    "circle_name": "壊孤児",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/na.zhi.lu/",
    "cover_url": "",
    "body": "- BanG Dream! It's MyGO!!!!!\n- 魔法少女的魔女審判\n- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/na.zhi.lu/](https://www.facebook.com/na.zhi.lu/)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/532932808_24240425342320308_1756070851162147306_n.jpg?stp=dst-jpg_tt6&cstp=mx400x400&ctp=s400x400&_nc_cat=105&ccb=1-7&_nc_sid=3ab345&_nc_ohc=BCRgbrs8o6MQ7kNvwH4JzZp&_nc_oc=Adrrn2cieXty1wrjXxjAKWk9yZghPJ9H2eqq7C1EBF-Lwv3Wv1vtTF98FVMQF6PPhhk&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=rXpnIf8ihiFM2GaJdGZNkA&_nc_ss=7c289&oh=00_Af5fpcVK_EZjTXdUiW2ZMLHjD1ioCocfonRGzp6nKpWtQQ&oe=6A1B59C6",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/676436100_26374924158870405_5715769226397168202_n.png?stp=dst-png_fb50_s320x320&_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=ezFASgGzVXgQ7kNvwGp74uT&_nc_oc=Adp4mpFOqyxKsF--C7CzJNEJtzSwDAd9RI6EL5X3_Opi8jSS2Vampq3WMR4Szwcxh8Q&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=lzANTMz0BPRFfu6qRUGC2A&_nc_ss=7c289&oh=00_Af5Gqb76Zlw7zZQcztdecnqys5TLsIiVAfxDh6ugbQ5yYQ&oe=6A1B8009",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/676436100_26374924158870405_5715769226397168202_n.png?_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=ezFASgGzVXgQ7kNvwGp74uT&_nc_oc=Adp4mpFOqyxKsF--C7CzJNEJtzSwDAd9RI6EL5X3_Opi8jSS2Vampq3WMR4Szwcxh8Q&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=lzANTMz0BPRFfu6qRUGC2A&_nc_ss=7c289&oh=00_Af7dG4rgB2fOTxN69Mmv5BmkTx6Q9nJ9WsYIhKCA0ASxeQ&oe=6A1B8009",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/707005467_26773029925726491_5133719072051062279_n.jpg?stp=c7.0.570.569a_dst-jpg_s851x315_tt6&_nc_cat=105&ccb=1-7&_nc_sid=09d16d&_nc_ohc=7k8nOVAzHI0Q7kNvwFwaD46&_nc_oc=AdrOBwcex-YSG3dVtcNMjk2-RVCLkBQc4LOiylRbcblziBFO_EWbpeqza4tzwOCvzpo&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=lzANTMz0BPRFfu6qRUGC2A&_nc_ss=7c289&oh=00_Af7aRB__yglNIbd-vskH3UEMYNhNj4AhD91PO80zJfdW-w&oe=6A1B5371",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/708345536_26767180299644787_1633997036726412362_n.jpg?stp=c0.200.1443.1443a_dst-jpg_s851x315_tt6&_nc_cat=103&ccb=1-7&_nc_sid=8a6525&_nc_ohc=vriV7yFWCGQQ7kNvwEVkG_Y&_nc_oc=AdoYkzDAoABxNkp4myxKm_VVjKSE33J7TZDmvDpDtM2x0n_mMOeA8pzryAvDgPw_i30&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=lzANTMz0BPRFfu6qRUGC2A&_nc_ss=7c289&oh=00_Af6v3SJItzXvIgoW1bEqCtzFhJSAz8c_zY1RvjXVLqZwuA&oe=6A1B57C7",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/706990467_26767180262978124_8315100085704614778_n.jpg?stp=c0.200.1443.1443a_dst-jpg_s851x315_tt6&_nc_cat=104&ccb=1-7&_nc_sid=8a6525&_nc_ohc=Juqujv4hiQAQ7kNvwEueLAI&_nc_oc=Adqt8gRKysTor_-pzdi1kIv3QQCAMVwpESbLihJPJM88BtBJakf7kSRRqmDl0UPXrNc&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=lzANTMz0BPRFfu6qRUGC2A&_nc_ss=7c289&oh=00_Af7daFJ5Y1_dLpMShlUke-17W9VJw11cBcqonwc_eC0qfw&oe=6A1B6F0A"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-01",
    "circle_name": "黑夜與金月",
    "author": "",
    "x_handle": "kourui_07",
    "x_url": "https://x.com/kourui_07",
    "cover_url": "",
    "body": "- BanG Dream!｜海希｜海希初\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 X: [kourui_07](https://x.com/kourui_07)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJJq6hJaUAAJxb4.jpg",
      "https://pbs.twimg.com/media/HJJq6g1bsAAH9sa.jpg",
      "https://pbs.twimg.com/media/HJId5KuawAAB0yA.jpg",
      "https://pbs.twimg.com/amplify_video_thumb/2058559468497948672/img/n8JuRUwRmF56OzSx.jpg",
      "https://pbs.twimg.com/media/HJFxPSzacAAPYa1.jpg",
      "https://pbs.twimg.com/media/HJFIBUgasAAsFAp.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-02",
    "circle_name": "大金毛很可愛",
    "author": "",
    "x_handle": "kimiJUNN",
    "x_url": "https://x.com/kimiJUNN",
    "cover_url": "",
    "body": "- Ave Mujica-初祥\n- 蓮ノ空-梢花\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 X: [kimiJUNN](https://x.com/kimiJUNN)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJLEeUVaQAANSwY.jpg",
      "https://pbs.twimg.com/media/HJKQrsAbYAASeBH.jpg",
      "https://pbs.twimg.com/media/HJGGJc5acAADbKu.jpg",
      "https://pbs.twimg.com/media/HJBInIMaoAEB3ru.jpg",
      "https://pbs.twimg.com/media/HI_Mi_wbEAAm6UL.jpg",
      "https://pbs.twimg.com/media/HI4N6TaaQAAP7KM.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-03",
    "circle_name": "要樂奈不要已讀我",
    "author": "",
    "x_handle": "",
    "x_url": "https://lit.link/zh-tw/x_milllllla_x_nekohige",
    "cover_url": "",
    "body": "- BanG Dream!It’s mygo!!!!!\n- Bang Dream!Avemujica\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 lit.link: [https://lit.link/zh-tw/x_milllllla_x_nekohige](https://lit.link/zh-tw/x_milllllla_x_nekohige)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://prd.storage.lit.link/images/creators/533a8af2-bde2-4f15-9ca4-1a65e6817b81/ogp/ogp_image.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "aggregator",
      "image_count_avail": 1,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-04",
    "circle_name": "奇魚果大王",
    "author": "",
    "x_handle": "yuyuyang0402",
    "x_url": "https://x.com/yuyuyang0402",
    "cover_url": "",
    "body": "- BanG Dream! It's MyGO!!!!!\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 X: [yuyuyang0402](https://x.com/yuyuyang0402)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJFuLM7bQAADV3C.jpg",
      "https://pbs.twimg.com/media/HI1wnYibcAE5K1v.jpg",
      "https://pbs.twimg.com/media/Gupr3m7WwAAd0d0.jpg",
      "https://pbs.twimg.com/media/HIxdqG5aEAAUmGn.jpg",
      "https://pbs.twimg.com/media/HIm93XfbUAArjVo.jpg",
      "https://pbs.twimg.com/media/HIm93XdacAAgkv5.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-05",
    "circle_name": "老P股",
    "author": "",
    "x_handle": "pesirxy",
    "x_url": "https://x.com/pesirxy?s=21",
    "cover_url": "",
    "body": "- BanG Dream! It's MyGO!!!!!\n- BanG Dream! Ave Mujica\n\n**専區**: 百合\n\n🔗 X: [pesirxy](https://x.com/pesirxy?s=21)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HIApDzYb0AAvjvp.jpg",
      "https://pbs.twimg.com/media/HIApDzWboAANOmO.jpg",
      "https://pbs.twimg.com/media/HIApDzXaAAAnybc.jpg",
      "https://pbs.twimg.com/media/HIApDzXbIAAT6fj.jpg",
      "https://pbs.twimg.com/media/HHT0a0AbkAA-GOA.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 5,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-06",
    "circle_name": "歐耶歐耶天素羅",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.doujin.com.tw/authors/info/sakuracoffee",
    "cover_url": "",
    "body": "- Avemujica\n- MyGO!!!!!\n- 秘密的偶像公主\n\n**専區**: 百合\n\n🔗 doujin.com.tw: [https://www.doujin.com.tw/authors/info/sakuracoffee](https://www.doujin.com.tw/authors/info/sakuracoffee)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "_meta_scrape": {
      "platform_used": "doujin_tw",
      "image_count_avail": 0,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-07/08",
    "circle_name": "紡星社",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/61573677164059/",
    "cover_url": "",
    "body": "- BanG Dream! It's MyGO!!!!!\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/61573677164059/](https://www.facebook.com/61573677164059/)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/486568420_122115314636789238_3484670825149280389_n.jpg?stp=dst-jpg_tt6&cstp=mx1316x1316&ctp=s720x720&_nc_cat=100&ccb=1-7&_nc_sid=3ab345&_nc_ohc=Xmr4S7igyDkQ7kNvwH5zVh6&_nc_oc=Adrf7SIzqzsa8T_8MawFR7qm8Db0AdVhUxD_7xMQPfROinIrjSy5pwus7n2jsEESf80&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=5fpGVWHclW5izu_s3t-rtA&_nc_ss=7c289&oh=00_Af43T35cO5mi1YRsHnqW-cfc_3xIfnuo78vWy3gNxMFxvA&oe=6A1B4DD5",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/555617405_122160018638789238_1769401803120561222_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=wwjgvYuCzIkQ7kNvwFyPSY6&_nc_oc=AdpOEBr2lX33MpumTXqIAstZk-TfwVQMIhxe5tf05S1iyy59u20BVOpxm7t7NMP6OlI&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=rL43ddAXiwsPnpFxjtKd3Q&_nc_ss=7c289&oh=00_Af4bfbOtTIfriluQ1At1QxylZIsPryG_t6zeX30DiYZ1Xw&oe=6A1B609D",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/555617405_122160018638789238_1769401803120561222_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=wwjgvYuCzIkQ7kNvwFyPSY6&_nc_oc=AdpOEBr2lX33MpumTXqIAstZk-TfwVQMIhxe5tf05S1iyy59u20BVOpxm7t7NMP6OlI&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=rL43ddAXiwsPnpFxjtKd3Q&_nc_ss=7c289&oh=00_Af4sw3EXs5lMCn9XIBgZrP5-YpkdDNBkNFbynLAcOhPdSg&oe=6A1B609D",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/625346428_122179755770789238_3537676803140803039_n.jpg?stp=c0.225.1365.1365a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=09d16d&_nc_ohc=UH88uadajEcQ7kNvwEuVBIQ&_nc_oc=AdrfRLAxfLMFxkmipRcJTGq5UlO4hEbjDtR1qdsAy55HosXNabK-9IGEVNYAOnLfKyU&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=rL43ddAXiwsPnpFxjtKd3Q&_nc_ss=7c289&oh=00_Af4o8cmjYRJ-1FfHiiVaiAxpTg1cqTC7xnOtXNOOfdODvQ&oe=6A1B7E52",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/486568420_122115314636789238_3484670825149280389_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=100&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=Xmr4S7igyDkQ7kNvwH5zVh6&_nc_oc=Adrf7SIzqzsa8T_8MawFR7qm8Db0AdVhUxD_7xMQPfROinIrjSy5pwus7n2jsEESf80&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6G2ZXIRthlHv2l_Yor-e2A&_nc_ss=7c289&oh=00_Af7OfiQUs0BFMn17vD_iyCqSDhCM8aIQbxNTSRCo91ugdA&oe=6A1B4DD5",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/655663937_122186702018789238_7377683546371673749_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_ohc=1pIPFPUkVlUQ7kNvwHbLTPw&_nc_oc=AdqVGtl_P09GecsK6BA8jNAuTXOSO7Y7lGQWoSEZ4gOsgRevgX2PKgyNvZ-EWJ7QpnQ&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=6G2ZXIRthlHv2l_Yor-e2A&_nc_ss=7c289&oh=00_Af4MZnHO9BohGzeobTxgKpc6hfVcOBL33FyxYLWHyOAJgg&oe=6A1B4ECF"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-09",
    "circle_name": "Super ASERI 超級焦躁",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.threads.com/@creauset_x13a",
    "cover_url": "",
    "body": "- BanG Dream! Ave Mujica\n- BanG Dream! It's MyGO!!!!!\n\n**専區**: 百合\n\n🔗 Threads: [creauset_x13a](https://www.threads.com/@creauset_x13a)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/688950635_17900412843434552_8225522233036207848_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=105&ig_cache_key=Mzg5MzIyMDE0NDQyMDQyOTg5NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTI4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=CJ9mwR_q8ckQ7kNvwFryg_Y&_nc_oc=AdqH8jLQ9Qx_g3ck6NAfFJ5g-1lSPZM1RnQV5XHwwVTdlp_Vpsg6aUrN8eLrHOR0rIE&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=I5_GTX8kg8efnhuhffnY-g&_nc_ss=7a22e&oh=00_Af5XqQK1EVnvyM9LSlA2I8mXUmOEfgWdkSey63LdqN4jrg&oe=6A1B6D13",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/685673288_17900412870434552_6678240514696885606_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=Mzg5MzIyMDE0NDA3NjQ5NDA2Ng%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuOTEwLnNkci5yZWd1bGFyX3Bob3RvLkMzIn0%3D&_nc_ohc=SCinAfNPZhEQ7kNvwGgYNn8&_nc_oc=Adp6FOiv0ZnMyZzfyq6vnKEwc5y8gsx63gz5sHgVZKzLIB2eQUGBCDOV27OdX-z1IAo&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=I5_GTX8kg8efnhuhffnY-g&_nc_ss=7a22e&oh=00_Af5eUHJZI2cPQlKZ4RwXhqjV21FWvtIEFgnCU32i9aTK6A&oe=6A1B6242",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/686999676_17900413203434552_1573183505831343683_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=110&ig_cache_key=Mzg5MzIyMDE0MTIxNTk5MzUxMQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuNDkwLnNkci5yZWd1bGFyX3Bob3RvLkMzIn0%3D&_nc_ohc=t_TwKpi4S_YQ7kNvwFUHbfn&_nc_oc=Adr-YxCNbvIzJUrbMcJVIMCe5qPH9HWxeJF1m6U-jBOpLcepaZ1_rKfbyCnrlmPaLq0&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-1.fna&_nc_gid=I5_GTX8kg8efnhuhffnY-g&_nc_ss=7a22e&oh=00_Af45ZcbG55y9EiOGh5FUJJzpj7gOayqlWRKitgMmF0iAAg&oe=6A1B5FF5",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/705968350_17902890264434552_1448668069146030946_n.jpg?stp=cp6_dst-jpegr_e35_tt6&_nc_cat=105&ig_cache_key=MzkwNDg4MTY2NTI2NTMyMDE4Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuNDA5Ni5oZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=YFBliEyQDyMQ7kNvwGCXfSU&_nc_oc=AdqjNGwPB8uYWRzr5iJ-CkaZb5X8vbuqPZilcydh1IfyfaCZoL919uP4qcFkh1oZ_MY&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=I5_GTX8kg8efnhuhffnY-g&_nc_ss=7a22e&oh=00_Af7yngFV77ECBxvQdeDV6eEZrkrigbDkVqh_LlLE5Zk8hw&oe=6A1B519D&se=-1",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/706317807_17963705436113450_4404166963493974356_n.jpg?stp=cp6_dst-jpegr_e35_tt6&_nc_cat=105&ig_cache_key=MzkwNDEzNTgxNTE5NTMxNTY5MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMzA3Mi5oZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=MB5IoFw3jycQ7kNvwGfnBOY&_nc_oc=Ado_M6bN5gBBPiRMfGL8ZG9_20LxzjtYD7nQfmLGdvMC-Pp4pXB02S8CvL2dM78KrNs&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=z5-f9Qct2EME_vCEGmRJBA&_nc_ss=7a22e&oh=00_Af6YnXjglv3-3_wvN-f7tIlJReNNkJ-D6ME2RRKQHW3mlg&oe=6A1B8213&se=-1",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/705988813_17902870881434552_7469861005015773188_n.jpg?stp=cp6_dst-jpegr_e35_tt6&_nc_cat=108&ig_cache_key=MzkwNDc5ODA5NTU2MTcxNTQxNA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuNDA5Ni5oZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=nOeniJMU2_wQ7kNvwFJjFQM&_nc_oc=AdquZH-W4TBg1WWvGV8tc6JwIKxGSXt4J-YLH2dG4ToOJix0MfRGrO2ev4jg4kLdnEo&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=z5-f9Qct2EME_vCEGmRJBA&_nc_ss=7a22e&oh=00_Af61eElRN__kzskC0awI0plQLDDkj_WQKpLYuVOyTQt_uQ&oe=6A1B654B&se=-1"
    ],
    "_meta_scrape": {
      "platform_used": "threads",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-10",
    "circle_name": "悶騷的盤子",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/profile.php?id=61558258981354",
    "cover_url": "",
    "body": "- gbc\n- BanG Dream!\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/profile.php?id=61558258981354](https://www.facebook.com/profile.php?id=61558258981354)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/537568958_122202072464275299_4372398049661573073_n.jpg?stp=dst-jpg_tt6&cstp=mx395x396&ctp=s395x396&_nc_cat=106&ccb=1-7&_nc_sid=3ab345&_nc_ohc=K-btsNArGm4Q7kNvwEbDaWc&_nc_oc=AdrycMDk1EOy8H9e4jFnQcMoXwRWuvCeZBh3yaVXKNWw7A5pqeD2qXCQNyiFgMmdmkY&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=v-z_Zk6H_DSCTbDpDQfL3Q&_nc_ss=7c289&oh=00_Af6ojyRzSKTDhJR3C-tiem1pRdwq-8erw0ap5tqeeaGEoA&oe=6A1B4C55",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/472818117_1502184793737177_127155223248542986_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=nNKoZlZbvKcQ7kNvwFQUykM&_nc_oc=AdpV5SY4f9FFUqeQdBtHi38URa1z1mbG0DjAIy0TuBufJCOG02i7kjat1C9HnRsgou0&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=3ZiUJjl4sxCRO7VBsFlv3g&_nc_ss=7c289&oh=00_Af71-ZqdtBIQ6JKQ_OpI_wlBXWb3byy7jTruFaxR7Klt1A&oe=6A1B4C1F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/472818117_1502184793737177_127155223248542986_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=nNKoZlZbvKcQ7kNvwFQUykM&_nc_oc=AdpV5SY4f9FFUqeQdBtHi38URa1z1mbG0DjAIy0TuBufJCOG02i7kjat1C9HnRsgou0&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=3ZiUJjl4sxCRO7VBsFlv3g&_nc_ss=7c289&oh=00_Af4PE_-5GPLizcuuLX7X_lEEkAr9kaDwjcHv0CnP06G-ag&oe=6A1B4C1F",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/705502385_122235542864275299_4185824214322928819_n.jpg?stp=c0.197.1450.1450a_dst-jpg_s851x315_tt6&_nc_cat=101&ccb=1-7&_nc_sid=09d16d&_nc_ohc=r_nsP8r_QL8Q7kNvwHB-PoJ&_nc_oc=AdpSVjFUqch22KG0FNnIbva9z8tOPANJK7KTR-YrvsO6Ph6d3J-keiS5DU3Ri8Vqahk&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=3ZiUJjl4sxCRO7VBsFlv3g&_nc_ss=7c289&oh=00_Af5NxxoHDrENMX0BlO1H1Ls9qwEGoRPkHu0D1hCZXzkSJQ&oe=6A1B5EC7",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704528947_122235542750275299_2644909648052760600_n.jpg?stp=c0.197.1450.1450a_dst-jpg_s851x315_tt6&_nc_cat=110&ccb=1-7&_nc_sid=09d16d&_nc_ohc=kMLxFXLyZcYQ7kNvwG5JDZf&_nc_oc=AdqXdjOrx-XcgcxOeD6H0IWJ-EN8Nhnhj_orfbivzeWrvhbOPIb1S-C_hlrKJIeQKrw&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=3ZiUJjl4sxCRO7VBsFlv3g&_nc_ss=7c289&oh=00_Af4Va1fGj9WHd7eZyrVm85a0qcckrUrBt0FFwXJUC7seBA&oe=6A1B76FD",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/706198615_122235542720275299_3374868518546193833_n.jpg?stp=c0.197.1450.1450a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=09d16d&_nc_ohc=RNYownrM1CkQ7kNvwGpHt9N&_nc_oc=AdpzseaFZ0EOdQoF-ILrJeOgVlM0Nxb92B5Q1L95ab7b1Wle5hxmyaRRd4TczD9m4yg&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=3ZiUJjl4sxCRO7VBsFlv3g&_nc_ss=7c289&oh=00_Af7rQCpOVTmKsjLspkr6vPHWYZye4-1zJ96tQxVOV1Ty4A&oe=6A1B7382"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-11",
    "circle_name": "白河夜船",
    "author": "",
    "x_handle": "amane61115",
    "x_url": "https://x.com/amane61115",
    "cover_url": "",
    "body": "- 蓮ノ空女学院スクールアイドルクラブ\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 X: [amane61115](https://x.com/amane61115)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HI-gE5maUAAyUFP.jpg",
      "https://pbs.twimg.com/media/HI2hxiaa8AAZAPg.jpg",
      "https://pbs.twimg.com/media/HG3f7VsaAAADmMY.jpg",
      "https://pbs.twimg.com/media/HGYnNwRa0AAjc5a.jpg",
      "https://pbs.twimg.com/media/HGRmWcyacAAJwnW.jpg",
      "https://pbs.twimg.com/media/HGPn4VqagAA1jo2.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-12",
    "circle_name": "有這樣的喜樂蒂你幾點回家？",
    "author": "",
    "x_handle": "hikari863126 ",
    "x_url": "https://x.com/hikari863126 ",
    "cover_url": "",
    "body": "- lovelive蓮之空\n- lovelive蓮之空 聲優\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 X: [hikari863126 ](https://x.com/hikari863126 )\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJPKEwDasAA8Jea.jpg",
      "https://pbs.twimg.com/media/HJKxdVta0AA_DWq.jpg",
      "https://pbs.twimg.com/media/HJLEeUVaQAANSwY.jpg",
      "https://pbs.twimg.com/media/HJKQrsAbYAASeBH.jpg",
      "https://pbs.twimg.com/media/HJFs8i7bQAAlWzc.jpg",
      "https://pbs.twimg.com/media/HI655KKa4AA1pNC.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-13",
    "circle_name": "阿里阿巴巴阿千千",
    "author": "",
    "x_handle": "rbaba_cain2",
    "x_url": "https://x.com/rbaba_cain2",
    "cover_url": "",
    "body": "- lovelive\n- 少女歌劇\n- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 X: [rbaba_cain2](https://x.com/rbaba_cain2)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJERNOIasAAqJUE.jpg",
      "https://pbs.twimg.com/media/HIwZPnxboAAYfWA.jpg",
      "https://pbs.twimg.com/media/HIdidH6acAAOkIE.jpg",
      "https://pbs.twimg.com/media/HIcbEwibwAAAaMu.jpg",
      "https://pbs.twimg.com/media/HIcbEwhaMAA0Opy.jpg",
      "https://pbs.twimg.com/media/F-w11NPXoAA2vfK.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-14",
    "circle_name": "しろはす",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/Polymilktea",
    "cover_url": "",
    "body": "- LOVELIVE 蓮之空女學院學園偶像俱樂部\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/Polymilktea](https://www.facebook.com/Polymilktea)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/659169572_990181626683329_3639919229237731811_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2028&ctp=s720x720&_nc_cat=103&ccb=1-7&_nc_sid=3ab345&_nc_ohc=PdCkX7GmbEMQ7kNvwFwJ-k5&_nc_oc=AdrzjgtN-rlOP-MMjnXw06GzyPt3d_RA9NhyLW_xNkE1tAFhJn5Ojma1P49SR7P9rKE&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=0IOhfYZ_Cwldnns3kZj8dA&_nc_ss=7c289&oh=00_Af6C2uHNafZmD1AfHsYzou51uqg6zIyti7-yDL48Rr0O4g&oe=6A1B762E",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/672682293_1004351571933001_5878906530023665893_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=103&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=yB-NLLQeU0cQ7kNvwGREV9x&_nc_oc=AdongKTej6_bplpRXXBpnEZUd9A7oUXotwm6aTmC0TWkhOiKD2FnUpRndQVFcPfSK5k&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=jQlzuAYiyEYuXDLBifSA5Q&_nc_ss=7c289&oh=00_Af7iRMRd_51diD3coyJtrUUox6DLSGDDS8xs0uY00p2ndQ&oe=6A1B503E",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/672682293_1004351571933001_5878906530023665893_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=yB-NLLQeU0cQ7kNvwGREV9x&_nc_oc=AdongKTej6_bplpRXXBpnEZUd9A7oUXotwm6aTmC0TWkhOiKD2FnUpRndQVFcPfSK5k&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=jQlzuAYiyEYuXDLBifSA5Q&_nc_ss=7c289&oh=00_Af7vKpYvPl5OvgAG0tlHKtyKOseDbNjLbdTwPcmk4UdBqw&oe=6A1B503E",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/659169572_990181626683329_3639919229237731811_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=103&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=PdCkX7GmbEMQ7kNvwFwJ-k5&_nc_oc=AdrzjgtN-rlOP-MMjnXw06GzyPt3d_RA9NhyLW_xNkE1tAFhJn5Ojma1P49SR7P9rKE&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=sDf5rU69ShOCMw3B0MQwjQ&_nc_ss=7c289&oh=00_Af7llcoPA_2cQx5qwxh_sW4VBfV2ndGW0Av-FpSMfAH9hw&oe=6A1B762E",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704186954_1034394998928658_3808296960599407656_n.jpg?stp=c0.296.1152.1152a_dst-jpg_s851x315_tt6&_nc_cat=106&ccb=1-7&_nc_sid=8a6525&_nc_ohc=8cHFOk2XTX0Q7kNvwFGlV3Q&_nc_oc=AdrLMYkwu3mOJn8rxwxEP2B03UNitf-rh_KW5qhLr5RJsgef86FB4oFD4884eUPNiLA&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=jQlzuAYiyEYuXDLBifSA5Q&_nc_ss=7c289&oh=00_Af7tQ40n_f5CpnPg9GEHFVcw8MpiEIJyRK-xa0VaAEw10g&oe=6A1B7D12",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/701009526_1026495356385289_1566816177679212981_n.jpg?stp=c448.0.1152.1152a_dst-jpg_s851x315_tt6&_nc_cat=107&ccb=1-7&_nc_sid=8a6525&_nc_ohc=zvuiS-4z-j0Q7kNvwE2oV_f&_nc_oc=AdqBkFFu0WXLHtDJm56eE7XAm6QPtXEOA-fxwKjEgLtg5SMSWTw4aJ4m-RUFXuXZ77s&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=jQlzuAYiyEYuXDLBifSA5Q&_nc_ss=7c289&oh=00_Af7ukZ2eC8CPYNnpHohN3pkr1w55eZX8DItNwc0Vg-JK-w&oe=6A1B7271"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-15",
    "circle_name": "飛行熊咪貓商會",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/profile.php?id=61551985430535#",
    "cover_url": "",
    "body": "- 蓮之空女學院學園偶像俱樂部\n- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/profile.php?id=61551985430535#](https://www.facebook.com/profile.php?id=61551985430535#)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/442507247_122174891936066181_6655357521814431745_n.jpg?stp=dst-jpg_tt6&cstp=mx400x400&ctp=s400x400&_nc_cat=109&ccb=1-7&_nc_sid=3ab345&_nc_ohc=loIu_mF5l5YQ7kNvwHn8Xm5&_nc_oc=Adpr1ZL1xlmoz_ncpJ6cJTuhXErQia23GIxJ23hm1C96Gp02SExcbpt_yJ0MK_K4uUE&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=m3iJUePlbhQhhL16v3EgGQ&_nc_ss=7c289&oh=00_Af7sEkNuwgivuYRCtTT93rqC-jRus1qNzosSj3aplqpLjQ&oe=6A1B5C25",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/476345062_122229035816066181_4736274761333440239_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=Otcmdb3ahmAQ7kNvwF-y8Wr&_nc_oc=Adp1c0NPU7s-oZ0A1R04Danf9F4OsDXKWO5qH428TSjCc5Vxm0AgsGabfLTeh64FMoQ&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=hQDmssHunu2ZVHWzIW0b3g&_nc_ss=7c289&oh=00_Af4691Ebdpf9VtBhYMGmcex6Nvm56Ra8qKVlna1WYml4Lg&oe=6A1B7029",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/476345062_122229035816066181_4736274761333440239_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=Otcmdb3ahmAQ7kNvwF-y8Wr&_nc_oc=Adp1c0NPU7s-oZ0A1R04Danf9F4OsDXKWO5qH428TSjCc5Vxm0AgsGabfLTeh64FMoQ&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=hQDmssHunu2ZVHWzIW0b3g&_nc_ss=7c289&oh=00_Af6jPOQDnqwlviO95XeTDCLlsZxGHqXzPg9WCmeUu5quXA&oe=6A1B7029",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/607500450_122285662904066181_5998126088106212258_n.jpg?stp=c0.160.1562.1562a_dst-jpg_s851x315_tt6&_nc_cat=110&ccb=1-7&_nc_sid=09d16d&_nc_ohc=Dk7CpOFbV_8Q7kNvwFReAHC&_nc_oc=AdruvCTxoeamB3AIdWHS5jO4W9j64ohl5utI6T53JoB7RXg-5DyEaaFwNm0AKkuSq3k&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=hQDmssHunu2ZVHWzIW0b3g&_nc_ss=7c289&oh=00_Af5XClVCwnOgvckaEPGRrHvXF0uy_h6y1LoyzkKpnQfDCQ&oe=6A1B533F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/558180562_122273024216066181_4786017200294790960_n.jpg?stp=c0.169.1536.1536a_dst-jpg_s851x315_tt6&_nc_cat=102&ccb=1-7&_nc_sid=09d16d&_nc_ohc=v099RI4dGt4Q7kNvwGaI3Dl&_nc_oc=Adq2CRa482eRoRevFKGQd95dZXuJxpnfnk-ZwYMJjOR2Jw-PK7JWV3hewqNlVD0kfBE&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=hQDmssHunu2ZVHWzIW0b3g&_nc_ss=7c289&oh=00_Af4ccrBMEhZJ0lBPrOl69FlUSrGDyxdVkxKrE7d6T7pR3Q&oe=6A1B690B",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/538596548_122267202908066181_3897309089880715167_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=106&ccb=1-7&_nc_sid=8a6525&_nc_ohc=BROwE7VHYBwQ7kNvwEinhQX&_nc_oc=AdrKG-TKevXqWUoCaQrqPsmvGbVLd3vLZVxY9ds2Psy5EsnDnd198k8WXGH6CPkgugw&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=hQDmssHunu2ZVHWzIW0b3g&_nc_ss=7c289&oh=00_Af5tWm6a22j1vnHRqtllQvmFb8p2fW4U8WfB3ND8OkThiA&oe=6A1B5536"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-16",
    "circle_name": "七色蘑菇燴飯",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/7iromushrooms",
    "cover_url": "",
    "body": "- Lovelive!虹咲學園學園偶像同好會\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/7iromushrooms](https://www.facebook.com/7iromushrooms)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/359077373_755674736560172_9166981782962328335_n.jpg?stp=dst-jpg_tt6&cstp=mx309x302&ctp=s309x302&_nc_cat=111&ccb=1-7&_nc_sid=3ab345&_nc_ohc=JVV9fKq6PCAQ7kNvwHNw8KI&_nc_oc=Adqdg79kia9UhYpGw4s4E7byPWZiUpWhdipirQApkd2TzXCfMRgjKn41NlZZZ3T2eJs&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=52dkqbKXi4Em5kpjNXmDjg&_nc_ss=7c289&oh=00_Af4B1nUVDayFKWhVq96ES-a7vE2MyKi78os9gr-oUXMxPg&oe=6A1B49F3",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/300218335_3280591758878309_5611142797221443396_n.png?stp=dst-png_fb50_s320x320&_nc_cat=109&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=ev_gVd6S9WIQ7kNvwGYClwF&_nc_oc=AdqVa14MS9gLmGqbf6DvGIafcbdAaDr1Ci0iOzv2Gt9rPHhm6vWhBc-5aSH_yEbPe8E&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=dFffF1z_FcKohxggD2t61g&_nc_ss=7c289&oh=00_Af6Uo78y73Dcp2vng30-r49Klfgis6odLasCCLmRhz4CaQ&oe=6A1B60D5",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/300218335_3280591758878309_5611142797221443396_n.png?_nc_cat=109&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=ev_gVd6S9WIQ7kNvwGYClwF&_nc_oc=AdqVa14MS9gLmGqbf6DvGIafcbdAaDr1Ci0iOzv2Gt9rPHhm6vWhBc-5aSH_yEbPe8E&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=dFffF1z_FcKohxggD2t61g&_nc_ss=7c289&oh=00_Af6Ond1aYHRR8dzcWKBTtMAQDSwDhXsL3Zdmn2zLT_5H4g&oe=6A1B60D5",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/700854064_1561146846012953_5953171056703685325_n.jpg?stp=c0.111.800.800a_dst-jpg_s851x315_tt6&_nc_cat=102&ccb=1-7&_nc_sid=09d16d&_nc_ohc=OyU7xu43JZ8Q7kNvwE4upcK&_nc_oc=AdpDji0FSMWidxbMb1qqlGQkn7UAXhXk0K0kNv5H0DZ9i_A7xQTKadh4rgA-lpeEt8I&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=dFffF1z_FcKohxggD2t61g&_nc_ss=7c289&oh=00_Af5bdDsiJhoVuUvMgFiX_P8kygY71ENEIUGX4DyQw_3G7Q&oe=6A1B54F3",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/701342859_1561146829346288_1006153160058642925_n.jpg?stp=c0.111.800.800a_dst-jpg_s851x315_tt6&_nc_cat=102&ccb=1-7&_nc_sid=09d16d&_nc_ohc=u0Qm8nbUiCoQ7kNvwFsd2Gu&_nc_oc=AdrvuAiHZZtrRFmKeoUMdoT7eETDcFKfNv4ha9h0V1UbTRGOTNz4rglK__A7vXhb_k4&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=dFffF1z_FcKohxggD2t61g&_nc_ss=7c289&oh=00_Af41z5qpDvW4Yx0b-x_EQ3gYKEFf4F49GlOA-WzryDdKLQ&oe=6A1B638C",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/700642165_1561146752679629_7396830640449166108_n.jpg?stp=c0.111.800.800a_dst-jpg_s851x315_tt6&_nc_cat=101&ccb=1-7&_nc_sid=09d16d&_nc_ohc=CV12Xb870z4Q7kNvwETKudz&_nc_oc=Adps5M2lpYnwS1yagosRV1olao9BYTB1q3QorAgu-oQgQ3134s2pr2j-RBUdVzKmGKc&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=dFffF1z_FcKohxggD2t61g&_nc_ss=7c289&oh=00_Af6WacJtuIPbFBwOW0KjMH912YrhnNLLuSMAxFmvYWSO_g&oe=6A1B6352"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-17",
    "circle_name": "夜触人身",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/yetsubody",
    "cover_url": "",
    "body": "- Ave mujica\n- FGO\n- 機動戰士鋼彈水星の魔女\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/yetsubody](https://www.facebook.com/yetsubody)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/495174531_1028974496035826_442098158925720579_n.jpg?stp=dst-jpg_tt6&cstp=mx960x960&ctp=s720x720&_nc_cat=108&ccb=1-7&_nc_sid=3ab345&_nc_ohc=u8Xupn-_4N4Q7kNvwE2g2rh&_nc_oc=Adp9rbufu0t3kv8B8CN-5xnv2FoicYZxsmrdO3LCpWMBxyZylYBYVP3MZDAikpDpxrk&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=Ll1CVtnYarnkY-CC78XyBQ&_nc_ss=7c289&oh=00_Af7-LdDXIfXP65-8_j9ppgrf8RzBcie4CyKOfmqv9r01Vg&oe=6A1B786A",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/481224847_979730070960269_7930197099915147987_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=5BFU6Hiir6sQ7kNvwE8DoaJ&_nc_oc=AdpJjjCC30-_uoHNmJm0Uy2oFUAunz6z1gnBdcia4_j7PuYncYVlgWzqfJPDoaXIYjQ&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=65hRB4EsgUoKySbdIkeD5g&_nc_ss=7c289&oh=00_Af6BX7FbUGlsnCcink3qybzMDu_PSpv2QCKAxtYkObGIzw&oe=6A1B78B9",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/481224847_979730070960269_7930197099915147987_n.jpg?stp=dst-jpg_p640x640_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=5BFU6Hiir6sQ7kNvwE8DoaJ&_nc_oc=AdpJjjCC30-_uoHNmJm0Uy2oFUAunz6z1gnBdcia4_j7PuYncYVlgWzqfJPDoaXIYjQ&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=65hRB4EsgUoKySbdIkeD5g&_nc_ss=7c289&oh=00_Af7Pi03v6buTXNj2nsbqdOsnVGEJusZzn0fqWuWkyEvICA&oe=6A1B78B9",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/658964479_1283270937272846_4018378752311719135_n.jpg?stp=c0.169.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=109&ccb=1-7&_nc_sid=8a6525&_nc_ohc=uNLl1-MwxL0Q7kNvwGShTe4&_nc_oc=AdrCBvFu9q4XcLdRpXOJBKG8s0XzrVs3wV1O7vqZFXDT0nyh90IsHvD7OX1rgisd-rY&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=65hRB4EsgUoKySbdIkeD5g&_nc_ss=7c289&oh=00_Af4IsvrpxLcGw0rBMROmiAj24c3oiyjs5OI2MY-MlxUI-Q&oe=6A1B71D2",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/659489422_1283270910606182_8131469682624498326_n.jpg?stp=c0.169.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=104&ccb=1-7&_nc_sid=8a6525&_nc_ohc=20H9IUIuemwQ7kNvwEvOYvw&_nc_oc=AdrcZIwsgeby19k8mlU6wrH1rwyuYpEBQMteFdurZFDY6HfqpSICy13n6P7_4X6v98c&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=65hRB4EsgUoKySbdIkeD5g&_nc_ss=7c289&oh=00_Af6VsZQOO_e4f66_5bUVeH1SWH-wE18EwaqfcOob-MZjfg&oe=6A1B49B5",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/658362361_1281360597463880_8620662953548357105_n.jpg?stp=c332.0.1147.1147a_cp6_dst-jpg_s851x315_tt6&_nc_cat=107&ccb=1-7&_nc_sid=8a6525&_nc_ohc=R7cijaoV9HMQ7kNvwE1Tdfv&_nc_oc=Adohv0nWcRZN08yhzSlVuVR9KCnQIK0YkGodW-GG163fb9T2ltkZoez84vzpuAy1CPE&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=65hRB4EsgUoKySbdIkeD5g&_nc_ss=7c289&oh=00_Af425rOk4mgCa17eDD26EcQ7QC1fsp7A453Yv8XUliZz3Q&oe=6A1B4B8F"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-18",
    "circle_name": "陽光女子百合團",
    "author": "",
    "x_handle": "rito_yu6039",
    "x_url": "https://x.com/rito_yu6039?s=21&t=B2bmzWyenr-f9o6UBHdH8w",
    "cover_url": "",
    "body": "- Ave  mujica\n- 水星的魔女\n\n**専區**: 百合\n\n🔗 X: [rito_yu6039](https://x.com/rito_yu6039?s=21&t=B2bmzWyenr-f9o6UBHdH8w)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJF5Ufqa0AAe2PN.jpg",
      "https://pbs.twimg.com/media/HJF5UfsaEAAQn-G.jpg",
      "https://pbs.twimg.com/media/HJId5KuawAAB0yA.jpg",
      "https://pbs.twimg.com/media/HJLUqNSbQAAbX7W.jpg",
      "https://pbs.twimg.com/media/HJFdYkNbwAEhk4r.jpg",
      "https://pbs.twimg.com/media/HJFdYkRaMAAw8zd.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-19/20",
    "circle_name": "青雨アメ",
    "author": "",
    "x_handle": "",
    "x_url": "https://portaly.cc/ame_aou",
    "cover_url": "",
    "body": "- Ave Mujica\n- 孤獨搖滾\n- 原創- 1000 BLUE\n\n**専區**: 百合\n\n🔗 Portaly: [https://portaly.cc/ame_aou](https://portaly.cc/ame_aou)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://img.portaly.cc/1c7BHA1chOX5bpzcfJiiQg5eot_GeDZZia2-gYeM2ds/rs:fill:1200/q:90/aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9wb3J0YWx5LWNhOWUxLmFwcHNwb3QuY29tL28vRFRYd21waFA1U0p6akN2NmV2NE4lMkZhdmF0YXI_YWx0PW1lZGlhJnRva2VuPTY0ZTcwY2E0LTYwMzktNGI2MS05N2M1LWVmMWQ2ZDQ5NzE2Yg"
    ],
    "_meta_scrape": {
      "platform_used": "aggregator",
      "image_count_avail": 1,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-21/22",
    "circle_name": "台北人",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/kun.salamander.3/",
    "cover_url": "",
    "body": "- MyGO!!!!!\n- AveMujica\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/kun.salamander.3/](https://www.facebook.com/kun.salamander.3/)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/361656522_1327687478180751_1210737903779518856_n.jpg?stp=dst-jpg_tt6&cstp=mx980x980&ctp=s720x720&_nc_cat=106&ccb=1-7&_nc_sid=3ab345&_nc_ohc=gxNex6H-VIwQ7kNvwEdpw6j&_nc_oc=Adp-egJiUUlboIDKf4Dzmm_bn6c-7Q72sbuKSvGTjVQB8rRZBMvrn3Lk_pmG_rYmN3I&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6v1QzOR-P7LKwJY1AhNW3w&_nc_ss=7c289&oh=00_Af6KOvG0omAvv_4qgZmPejTJWda4Cw-EW9JP7zHWVrWrcQ&oe=6A1B4B7F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/481178050_1705596653723163_6859337699794527528_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=iOL-Ah6MdmIQ7kNvwFjkUUQ&_nc_oc=Adrrvh6BCks2XUo-eu_Zn5aJxyVocwuPyNSTkBbkL9c1f5Fr7pU-P-aF4In9o_9Cug8&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Go6qe6ZCN-9-dXZ3jrC1mg&_nc_ss=7c289&oh=00_Af5MehNfd41H5JudZbuy1nmA3UseiPpTI2rH2zumAy6B8w&oe=6A1B75A0",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/481178050_1705596653723163_6859337699794527528_n.jpg?stp=cp6_dst-jpg_fb50_s320x320_tt6&_nc_cat=110&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=iOL-Ah6MdmIQ7kNvwFjkUUQ&_nc_oc=Adrrvh6BCks2XUo-eu_Zn5aJxyVocwuPyNSTkBbkL9c1f5Fr7pU-P-aF4In9o_9Cug8&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Go6qe6ZCN-9-dXZ3jrC1mg&_nc_ss=7c289&oh=00_Af4QudpIMzdd4yONUYoXVp5dtoOpjCKtyjZ1SFIJy4SCGQ&oe=6A1B75A0",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/707174829_2083841842565307_3138477584443804377_n.jpg?stp=c323.0.754.754a_dst-jpg_s851x315_tt6&_nc_cat=106&ccb=1-7&_nc_sid=09d16d&_nc_ohc=ar-JMVPHCl0Q7kNvwECObkC&_nc_oc=Adq7-5gOtYFQSIof0khXskgBIeU632_5VQ8rEQjT5kdyotwML_843s3ulAcLPuuBN4g&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Go6qe6ZCN-9-dXZ3jrC1mg&_nc_ss=7c289&oh=00_Af6Ev6i93GQxm7bnkxnza4Z9KabJXcAU-9WiOBfv3KXy5w&oe=6A1B5EBA",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/707506638_2082938685988956_5752915570285112926_n.jpg?stp=c133.0.867.867a_dst-jpg_s851x315_tt6&_nc_cat=110&ccb=1-7&_nc_sid=09d16d&_nc_ohc=6bncbaS2b5sQ7kNvwE_gSXI&_nc_oc=Ado_pzRMuV-DPtadzBclbx3unGBV8yLaqsXMb1C_VGCThe5EnZPkM9kOitQnCDqu3Tw&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Go6qe6ZCN-9-dXZ3jrC1mg&_nc_ss=7c289&oh=00_Af4wBV8jYaf42HTTzKYWfpMubRwYtpU6aKJIKtWIegS3Jw&oe=6A1B7617",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/703461095_2079314803018011_3484504892230242664_n.jpg?stp=c0.169.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=100&ccb=1-7&_nc_sid=8a6525&_nc_ohc=yH9rnVSMXowQ7kNvwGtbCNL&_nc_oc=Adq1jnuJLlPN0Puz-0kPgludz9zXBesmzXrFCQvLnrT9LZfn8p0DVN2Zd_VRT2bjB4E&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Go6qe6ZCN-9-dXZ3jrC1mg&_nc_ss=7c289&oh=00_Af6WQSVc2uTl5lKi9ZsprDDoj2CPlz8BPlTSb0KAmxYHfA&oe=6A1B5BC2"
    ],
    "_meta_scrape": {
      "platform_used": "fb",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-23/24",
    "circle_name": "木子的百合花園",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/MuziYuri/",
    "cover_url": "",
    "body": "- 新刊-超時空輝耀姬\n- 原創-如何與蛇女交尾?\n- 原創-倉鼠少女也想談戀愛\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/MuziYuri/](https://www.facebook.com/MuziYuri/)",
    "tags": {
      "original": true,
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t1.6435-1/52682029_1172324666276283_5797723748110958592_n.jpg?stp=dst-jpg_tt6&cstp=mx584x584&ctp=s584x584&_nc_cat=103&ccb=1-7&_nc_sid=3ab345&_nc_ohc=iyMhFK6pEHsQ7kNvwFr7sG-&_nc_oc=AdpDNIQ8bYcW-DUaBHJ38I-ueIRnrzHz1fSTYK3RPn5pZJ_fUv57unwe-G759jUOtMU&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=ZsU2iWleFPUEcho1zvrSCQ&_nc_ss=7c289&oh=00_Af5w8Ar9VEAP-tRky8-_DkmLxpNIEC1RmvSzHbFW5MJpKA&oe=6A3CEE15",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t1.6435-1/52682029_1172324666276283_5797723748110958592_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=103&ccb=1-7&_nc_sid=1d2534&_nc_ohc=iyMhFK6pEHsQ7kNvwFr7sG-&_nc_oc=AdpDNIQ8bYcW-DUaBHJ38I-ueIRnrzHz1fSTYK3RPn5pZJ_fUv57unwe-G759jUOtMU&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=_eyIDi5GbiupyuLPIqnbKw&_nc_ss=7c289&oh=00_Af6gi8PduxH1Xdmcsmw9XqQ5SeSM_RO_-l_RTZUNDkM_Vw&oe=6A3CEE15",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/544425395_3176970689144994_6978022998550232065_n.jpg?stp=dst-jpg_p843x403_tt6&_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=ubAzyn1qO8QQ7kNvwFh4Ukx&_nc_oc=Adp1SWx9uWFR4n5Dh3pRmuCsEL5espU5K_0qKKq4IN1b9D3QsLSTmXyFua8v8uFLmSo&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=_eyIDi5GbiupyuLPIqnbKw&_nc_ss=7c289&oh=00_Af6H0_l28yJ7qIDp3fVKchtis014Ub4wneWOdZcdrvzCYA&oe=6A1B5060",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/598979860_3289963807845681_1589118359615241749_n.jpg?stp=dst-jpg_p843x403_tt6&_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_ohc=Lp2kyWdXLFAQ7kNvwHIaiMU&_nc_oc=AdoJV-w4WDh-_ZQD58X3mO7I4Sup8XLCNU5iAQxcMinAlOEgqdGplPDtA4TMQcc6ebA&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=_eyIDi5GbiupyuLPIqnbKw&_nc_ss=7c289&oh=00_Af46lyZXgKWIx3lZ8tB-ajygZW6n8Uzkj2cQA1_i4p4OdA&oe=6A1B7667",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/598691167_3289963801179015_628621903460802269_n.jpg?stp=dst-jpg_p843x403_tt6&_nc_cat=102&ccb=1-7&_nc_sid=127cfc&_nc_ohc=jFesI47MV_AQ7kNvwEVaZDo&_nc_oc=AdoyMEA5e4z8WmaXvgf6YKvYwKhGf6EeEq1iUBFG9i8S4VQY46rkHi48KnlK321xJOA&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=_eyIDi5GbiupyuLPIqnbKw&_nc_ss=7c289&oh=00_Af51poSofibTlB6AbKW1PGLLdbjlGG2MjMB6ep0RUz1ijw&oe=6A1B4D29",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/600360296_3289963804512348_6740723560996169357_n.jpg?stp=dst-jpg_p843x403_tt6&_nc_cat=100&ccb=1-7&_nc_sid=127cfc&_nc_ohc=biEiTKnMYhMQ7kNvwGssC4y&_nc_oc=AdqLmPIKUCmpjCLPKgo7eGxpt4D0oMOC5x-lsqKwIZ2YtDY4ySQfX9p683pCXI390qM&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=_eyIDi5GbiupyuLPIqnbKw&_nc_ss=7c289&oh=00_Af71Gw1b4LxoU-ZBg3ORlx2ESDUuXhZIod-WrNffywSXTw&oe=6A1B5BE7"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-25/26",
    "circle_name": "人工降雨",
    "author": "",
    "x_handle": "ManMadeRain",
    "x_url": "https://x.com/ManMadeRain",
    "cover_url": "",
    "body": "- 蔚藍檔案 - 星野與陽奈的學園交流會漫畫\n- 蔚藍檔案 - 奧利斯小隊周邊\n- 原創 - Unlimited Rematch\n\n**専區**: 百合\n\n🔗 X: [ManMadeRain](https://x.com/ManMadeRain)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "original": true,
      "manga": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJPBJMEakAAcOiL.jpg",
      "https://pbs.twimg.com/media/HJLM-dlbkAAK04q.jpg",
      "https://pbs.twimg.com/media/HJNvcleaIAAHPWx.jpg",
      "https://pbs.twimg.com/media/HAUu3NTWkAAdyEP.jpg",
      "https://pbs.twimg.com/media/HJFjrIbbEAAggHO.jpg",
      "https://pbs.twimg.com/media/HI_6ZaEbcAEBt4U.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-27",
    "circle_name": "香香又色色的",
    "author": "",
    "x_handle": "",
    "x_url": "https://instagram.com/arayo__0616",
    "cover_url": "",
    "body": "- 原創百合漫畫（新刊）-天使們低語的漫長告別\n- 蔚藍檔案\n- Hololive\n\n**専區**: 百合\n\n🔗 Instagram: [arayo__0616](https://instagram.com/arayo__0616)",
    "tags": {
      "original": true,
      "manga": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/670455830_18100456759972673_9169235712174538881_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-2.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2gEjbjfxUTYpL12O63yrZ4LiqDAt8IDgSHXvUaatDNJJJ0CjHjhtJBRJ3VRSUnaT4Ec&_nc_ohc=qEiARLzprlMQ7kNvwHVLvlL&_nc_gid=-MSlS29sgYp-ih1jpr406Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af7EyGiTKhgo72uCD8F7azB6oMPFo75tXSnUWRNzv7Fmvg&oe=6A1B5835&_nc_sid=8b3546",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/656654770_18098589421972673_7009640727753502432_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-2.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2gEjbjfxUTYpL12O63yrZ4LiqDAt8IDgSHXvUaatDNJJJ0CjHjhtJBRJ3VRSUnaT4Ec&_nc_ohc=FaBZRodhHakQ7kNvwE77xof&_nc_gid=-MSlS29sgYp-ih1jpr406Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af7Q2qYDW6TfGNxR2XFCV5qz1iSfTG3-dT-o3XhR9E1Whw&oe=6A1B6D53&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.71878-15/657307695_730066660190498_2008871607220643840_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gEjbjfxUTYpL12O63yrZ4LiqDAt8IDgSHXvUaatDNJJJ0CjHjhtJBRJ3VRSUnaT4Ec&_nc_ohc=YrH9wkqkxSsQ7kNvwGsAEak&_nc_gid=-MSlS29sgYp-ih1jpr406Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af4GRIG_llGv1tkVB1gJpG31_ghW24JMUhaSlAjV-BxPlA&oe=6A1B5B59&_nc_sid=8b3546",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.71878-15/652787428_1232872445725876_6607269132376389249_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=instagram.ftpe20-2.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2gEjbjfxUTYpL12O63yrZ4LiqDAt8IDgSHXvUaatDNJJJ0CjHjhtJBRJ3VRSUnaT4Ec&_nc_ohc=qRG9XLV0ZXIQ7kNvwGPC1J5&_nc_gid=-MSlS29sgYp-ih1jpr406Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af6WaMpfsv7SNC2GoUi5wBjiRGziVQrqzmZL-JHUAXtX6g&oe=6A1B5741&_nc_sid=8b3546",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.71878-15/652815138_2863959560601620_930757679027175250_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=instagram.ftpe20-2.fna.fbcdn.net&_nc_cat=108&_nc_oc=Q6cZ2gEjbjfxUTYpL12O63yrZ4LiqDAt8IDgSHXvUaatDNJJJ0CjHjhtJBRJ3VRSUnaT4Ec&_nc_ohc=G3m8lGLTO_4Q7kNvwHnn60-&_nc_gid=-MSlS29sgYp-ih1jpr406Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af78ruYOQHNGZfdBvu6n18ukbkjztfE9lli4G4uz8SMNbA&oe=6A1B5A65&_nc_sid=8b3546",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/652303370_18097200817972673_8712483285336867154_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-2.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2gEjbjfxUTYpL12O63yrZ4LiqDAt8IDgSHXvUaatDNJJJ0CjHjhtJBRJ3VRSUnaT4Ec&_nc_ohc=Gm9k9iwVuvkQ7kNvwEkteDy&_nc_gid=-MSlS29sgYp-ih1jpr406Q&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af55LRcJ0eI5zVq6Bt-e2bdT9z7O-ZvDSVDRak5M8mn-JQ&oe=6A1B7AE0&_nc_sid=8b3546"
    ],
    "_meta_scrape": {
      "platform_used": "ig",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-28",
    "circle_name": "烏鴉",
    "author": "",
    "x_handle": "",
    "x_url": "https://kvoid000.wixsite.com/corvus",
    "cover_url": "",
    "body": "- HololiveMyth\n- 睦祥(mygo, AveMujica)\n- fate\n\n**専區**: 百合\n\n🔗 出處: [https://kvoid000.wixsite.com/corvus](https://kvoid000.wixsite.com/corvus)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": []
  },
  {
    "booth_id": "T-29",
    "circle_name": "不安定星系",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/karupisu_planet",
    "cover_url": "",
    "body": "- 東方project\n- 空之境界\n- 暗喻幻想\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 Plurk: [karupisu_planet](https://www.plurk.com/karupisu_planet)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_65TQSJpuhVQ4sEYMEG6fYN.jpg",
      "https://images.plurk.com/mx_1nTVTLXz9FZLQhG9Ne5xvm.jpg",
      "https://images.plurk.com/mx_4acXEXmgo1t2lQkgdmGVHT.jpg",
      "https://images.plurk.com/mx_6CwQbdZgsKBKbxNzkL5gcv.jpg",
      "https://images.plurk.com/mx_JDd1Q3OJUOHNRiRSgmIMR.jpg",
      "https://images.plurk.com/mx_6CmWF7NOeFSZYod54s2Oa7.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "plurk",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-30",
    "circle_name": "錯落交織 Interweave",
    "author": "",
    "x_handle": "",
    "x_url": "https://interweave.booth.pm/",
    "cover_url": "",
    "body": "- 東方Project\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 出處: [https://interweave.booth.pm/](https://interweave.booth.pm/)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": []
  },
  {
    "booth_id": "T-31",
    "circle_name": "Kakela＊Hane+孤僻少女",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.doujin.com.tw/authors/info/x20285/books",
    "cover_url": "",
    "body": "- 東方PROJECT\n- 超時空輝耀姬\n- 鋼管公主\n\n**専區**: 百合\n\n🔗 doujin.com.tw: [https://www.doujin.com.tw/authors/info/x20285/books](https://www.doujin.com.tw/authors/info/x20285/books)\n\n## 📝 CH19 出展ハイライト\n安奈Anna (105 件 doujin の長年作家)。社群: [Plurk @hane_anna](https://www.plurk.com/hane_anna) / [Pixiv 130351](https://www.pixiv.net/member.php?id=130351)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "_meta_scrape_sk": {
      "platform_used": "doujin_tw",
      "hand_note": true,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-32",
    "circle_name": "魚燒",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/yuclovers",
    "cover_url": "",
    "body": "- It's MyGO!!!!! 《BanG Dream!》\n- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/yuclovers](https://www.facebook.com/yuclovers)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-1/373717595_6802485923106120_3317333230818211355_n.jpg?stp=dst-jpg_tt6&cstp=mx443x443&ctp=s443x443&_nc_cat=102&ccb=1-7&_nc_sid=3ab345&_nc_ohc=KGwyLrkpMq0Q7kNvwHbelgq&_nc_oc=AdpADpRikBJzfMdAgkojiQyIq9RC0hjS0URHkKwY6unkdIwBdgWfOQ2tsXGNEzWBJtQ&_nc_zt=24&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Sv_lHNBffEYJ8uEIvs7T_A&_nc_ss=7c289&oh=00_Af7mTdpgwJdXa5dstQj4bDaz3jKfKY9k-zAYeK9tiwS-Yw&oe=6A1B6832",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/502728807_23955498710711574_459412244152266301_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=8CatQGYXiW4Q7kNvwEhZvxN&_nc_oc=AdrHAr60ED0b8nlJW1Epq9z19ljKAILO213aI2RkgRw7IsQI0X0UjeEpsJA1p_SBrdA&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=z2YcapUz62kCPo46fk-LOA&_nc_ss=7c289&oh=00_Af551PR6VR6SZ4sm2FoOg4jBIH7HrjqyoBLVc9cIl4ynMQ&oe=6A1B4FD6",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/502728807_23955498710711574_459412244152266301_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=8CatQGYXiW4Q7kNvwEhZvxN&_nc_oc=AdrHAr60ED0b8nlJW1Epq9z19ljKAILO213aI2RkgRw7IsQI0X0UjeEpsJA1p_SBrdA&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=z2YcapUz62kCPo46fk-LOA&_nc_ss=7c289&oh=00_Af7HNHs2qD5S1dngXibktV3GS1VZER8Qz4PA_MEyEuZM3A&oe=6A1B4FD6",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/703745738_27229070056687740_2325492114983266551_n.jpg?stp=c0.198.1447.1447a_dst-jpg_s851x315_tt6&_nc_cat=102&ccb=1-7&_nc_sid=09d16d&_nc_ohc=SNKGwEZEtLQQ7kNvwGXXinx&_nc_oc=AdqXC4Bbi9FlUhDyMVSpZTRM7GAoTDN5DXeFysENQCIbWahb7K7dzE1VqCEFfFA9GQk&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=z2YcapUz62kCPo46fk-LOA&_nc_ss=7c289&oh=00_Af7c28PCHBYBpwKEou-MmRJlNghdxeMuqdXHCzMVHYRp7w&oe=6A1B79F4",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/704667267_27225026860425393_840879984238467666_n.jpg?stp=c0.200.1443.1443a_dst-jpg_s851x315_tt6&_nc_cat=107&ccb=1-7&_nc_sid=09d16d&_nc_ohc=qcTgfyWfJiwQ7kNvwEdqeys&_nc_oc=AdqjYqT55kpdkW12tbBO0rxfNMVdxXtzOMUXb-wOmE9rai7OZb9nW4MNjf8geXutS2M&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=z2YcapUz62kCPo46fk-LOA&_nc_ss=7c289&oh=00_Af79jTimiFEILlhhbwjNGxCrlpCqf3u1m4z0oHfclEabHw&oe=6A1B6443",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/703811982_27225026540425425_7631065773458675812_n.jpg?stp=c0.200.1443.1443a_dst-jpg_s851x315_tt6&_nc_cat=109&ccb=1-7&_nc_sid=09d16d&_nc_ohc=T4vzw_bafsAQ7kNvwEwCRjF&_nc_oc=AdqolaUUhSLZquRQOe2bUwEIWcHBedbwveIIyiSxgAtZZY5J3wQ8_Zc2xF15b3yAv9o&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=z2YcapUz62kCPo46fk-LOA&_nc_ss=7c289&oh=00_Af4QePIa8XMqmXxTsatwqFkP-UlOES_YojnH9LTrD8dguA&oe=6A1B6F66"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-33/34",
    "circle_name": "有百合人生就不是灰的",
    "author": "",
    "x_handle": "gray170220",
    "x_url": "https://x.com/gray170220",
    "cover_url": "",
    "body": "- Ave Mujica\n- MyGO!!!!!\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 X: [gray170220](https://x.com/gray170220)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/EXoy4k2UMAAWK4-.jpg",
      "https://pbs.twimg.com/media/EXoy4lYU0AEy0zw.jpg",
      "https://pbs.twimg.com/media/EXoy4lYUMAA0jZU.jpg",
      "https://pbs.twimg.com/media/EXoy4ljUEAAldhz.jpg",
      "https://pbs.twimg.com/media/HJN4VAxbIAA5uYX.jpg",
      "https://pbs.twimg.com/media/HJN4VAyaUAAGZeO.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-35",
    "circle_name": "Ray的饗食天堂",
    "author": "",
    "x_handle": "yoyoray20001996",
    "x_url": "https://x.com/yoyoray20001996",
    "cover_url": "",
    "body": "- BanG Dream! Ave Mujica\n- BanG Dream! It's MyGO!!!!!\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 X: [yoyoray20001996](https://x.com/yoyoray20001996)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJPnhO_aEAEK0n7.jpg",
      "https://pbs.twimg.com/media/HJPnNtzaUAAcM4-.jpg",
      "https://pbs.twimg.com/media/HJPXGQpbIAAcPXt.jpg",
      "https://pbs.twimg.com/media/HJPf4mzbYAAkAAo.jpg",
      "https://pbs.twimg.com/media/GyYYQiea4AAnk1l.jpg",
      "https://pbs.twimg.com/media/HJN74SFa0AA7lYl.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-36",
    "circle_name": "絕讚發霉中",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/tentaclespet/",
    "cover_url": "",
    "body": "- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 Facebook: [https://www.facebook.com/tentaclespet/](https://www.facebook.com/tentaclespet/)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/302084692_571175828136890_6368601485629209051_n.jpg?stp=dst-jpg_tt6&cstp=mx720x614&ctp=s720x614&_nc_cat=105&ccb=1-7&_nc_sid=3ab345&_nc_ohc=MK6xmWxk1vwQ7kNvwHIdahL&_nc_oc=Adofb1iH1i3nEwhV8zeBp6mQRN40IfWv_PACSy87oaeGPmMFfo2q5EhSpn2VbjIqiJ4&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=98UHbwgYgSOOG0ZivifWhA&_nc_ss=7c289&oh=00_Af5fIRE83ydGu05WMyS0IREWlBZJ2pvtg7zZ9dxc33Yqqw&oe=6A1B6AEC",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/705137504_1518119546775842_809330798951185237_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=101&ccb=1-7&_nc_sid=09d16d&_nc_ohc=OYNxU4sNUVsQ7kNvwF0X1Ie&_nc_oc=AdpHO8mt_YJgWMxOgmUL0kPUarFVxz7lNE3yR6NHk5emZDOrO-CRHzziUduIPFqECak&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=T3fx64UKmFb9iDtt1SGxUQ&_nc_ss=7c289&oh=00_Af6mZFlhKqPRSBV9z_L5S78jpZNesmPh-ZuGR1lx0CASAw&oe=6A1B5683",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704812748_1518119513442512_4414768635120115641_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=09d16d&_nc_ohc=nRGJSIg-rqUQ7kNvwHIsLpb&_nc_oc=Adr9Iw6rM0obdbGtCJihITl_AGdWXf4YYQuc9q4C00HFSUc2j-mGa3BQxkfhPueleEc&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=T3fx64UKmFb9iDtt1SGxUQ&_nc_ss=7c289&oh=00_Af4WeJZguHUVVAC5JQDtKK1zEeJ0yZ2glP0ZJxmbUGT9IQ&oe=6A1B4B4F",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705194264_1518119400109190_8331739752333941882_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=100&ccb=1-7&_nc_sid=09d16d&_nc_ohc=DHS8fkBlqwwQ7kNvwHPD75n&_nc_oc=Adq0f8lvFL-yMpGJQmCr0ibpxZrxWl2jx8LqSLd6W7q02-MP8Gp-7abSM_ppQttJZwE&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=T3fx64UKmFb9iDtt1SGxUQ&_nc_ss=7c289&oh=00_Af5dsTWB-5NVQ8RKfQB1XODNVcxPNXzSWmipsvdCXmFk4w&oe=6A1B757A",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705374524_1518119470109183_5846528922500521859_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=109&ccb=1-7&_nc_sid=09d16d&_nc_ohc=Fv_gHQuM9KwQ7kNvwGkOD2G&_nc_oc=Ado-mRdFgxoD-zK-Y5-AmWtgQiDLFumLgLXwCGQqDyjRa97iD83FDBUroGOw5hx7W6M&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=T3fx64UKmFb9iDtt1SGxUQ&_nc_ss=7c289&oh=00_Af5hlFk9UQTM4FK3NRXIauIeIzMGDE75EyrsE4i93F-LsA&oe=6A1B79B6",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705194288_1518119363442527_2704007449247028610_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=111&ccb=1-7&_nc_sid=09d16d&_nc_ohc=KBre4UsuN5YQ7kNvwHoz2EV&_nc_oc=AdoW-WEfCQqByeDV_VL66oEg3VS9qYW1hKyWZHyobdtNrB1inhgRE73cZCCuZIqbgnY&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=T3fx64UKmFb9iDtt1SGxUQ&_nc_ss=7c289&oh=00_Af6XCcJB9RVJGyDKRI3nx4H304eUndUTnHTBW6KThTqzMQ&oe=6A1B4E95"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-37",
    "circle_name": "廢柴小R",
    "author": "",
    "x_handle": "rissole715",
    "x_url": "https://x.com/rissole715?s=21",
    "cover_url": "",
    "body": "- ave mujica\n- 超時空輝耀姬\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 X: [rissole715](https://x.com/rissole715?s=21)\n\n## ✨ CH19 出展 signal (作家の最新 post 由)\n> RT @Mochian0819: #創集繪 #AveMujica #初祥 #輝耀姬 #超かぐや姫 哈囉各位！我是陌千，品書來了！一年一度的創集繪就在下禮拜啦！ 這場5/30在花博爭豔館的同人展是我的出刊一周年，看看我的品書，我的本子直接暴增到六本(好誇張)🥹 這次人在U21……\n[source](https://x.com/i/status/2059229808400511323)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJNpjPgbYAA4EiG.jpg",
      "https://pbs.twimg.com/media/HJL1KzYbQAAXlOd.png",
      "https://pbs.twimg.com/amplify_video_thumb/2058867736017874944/img/dV05R88QgNcDBJ4X.jpg",
      "https://pbs.twimg.com/media/G3I5USta4AAzVjy.jpg",
      "https://pbs.twimg.com/media/G3I5VkNbQAAiwlv.jpg",
      "https://pbs.twimg.com/media/G3I5VkLaIAAMtIy.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": true
    }
  },
  {
    "booth_id": "T-38",
    "circle_name": "黑黑黑",
    "author": "",
    "x_handle": "KuroAjrtineico",
    "x_url": "https://x.com/KuroAjrtineico",
    "cover_url": "",
    "body": "- BanGDream！-AveMujica\n- BanGDream！-AveMujica\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 X: [KuroAjrtineico](https://x.com/KuroAjrtineico)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://pbs.twimg.com/media/HJLUpJFaYAAjSt4.png",
      "https://pbs.twimg.com/media/HJE_LN8bAAA-2ok.png",
      "https://pbs.twimg.com/media/HI6uCKPa4AAMm28.png",
      "https://pbs.twimg.com/media/HIwJEMJacAA5Xql.jpg",
      "https://pbs.twimg.com/media/HIwJBsybMAAVf72.jpg",
      "https://pbs.twimg.com/media/HIqub-xbgAAKMEL.jpg"
    ],
    "_meta_scrape": {
      "platform_used": "x",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-39",
    "circle_name": "迷途羔羊",
    "author": "",
    "x_handle": "",
    "x_url": "https://bsky.app/profile/nkpa.bsky.social",
    "cover_url": "",
    "body": "- 無期迷途\n- 超時空輝耀姬\n\n**専區**: 百合\n\n🔗 出處: [https://bsky.app/profile/nkpa.bsky.social](https://bsky.app/profile/nkpa.bsky.social)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": []
  },
  {
    "booth_id": "T-40",
    "circle_name": "多多",
    "author": "",
    "x_handle": "",
    "x_url": "https://lit.link/zh-tw/yeijijia",
    "cover_url": "",
    "body": "- mygo\n- 超時空輝耀姬\n- 魔女裁判\n\n**専區**: 百合\n\n🔗 lit.link: [https://lit.link/zh-tw/yeijijia](https://lit.link/zh-tw/yeijijia)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://prd.storage.lit.link/images/creators/baddcf9a-1208-4e3d-acae-85db8d65c203/ogp/ogp_image.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "aggregator",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "T-41",
    "circle_name": "翼之影",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/haneko0216",
    "cover_url": "",
    "body": "- 超時空輝耀姬！\n- 魔法少女的魔女審判\n\n**専區**: 百合\n\n🔗 Plurk: [haneko0216](https://www.plurk.com/haneko0216)\n\n## 📝 CH19 出展ハイライト\n**超時空輝耀姫 (輝耀 + 彩葉) 壓克力立牌** (= iroka pair acrylic stand、二創公告前下印で限定・加印なし)。崩壊3 紺海三角塗鴉本など 他 fandom 多数も\n- [近況 plurk](https://www.plurk.com/haneko0216)",
    "tags": {
      "yuri-zone": true,
      "super-kaguya": true,
      "goods": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_4YdGrKKgzzvyRF9VUh6C4U.jpg",
      "https://images.plurk.com/mx_15AIitI9UVc4NfAMIzk6ib.jpg",
      "https://images.plurk.com/mx_7mTdtqwp2yAyOiX1BDSE5P.jpg",
      "https://images.plurk.com/mx_3tWvlkY89UayVb67e2lszo.jpg",
      "https://images.plurk.com/mx_1nmQqXS6zs5rG6jrh6AHvg.jpg",
      "https://images.plurk.com/mx_6mqHvRnQK11Sh3WeX0noXJ.jpg"
    ],
    "cps": [
      "iroka"
    ],
    "_meta_scrape_sk": {
      "platform_used": "plurk",
      "hand_note": true,
      "detected_cps": [],
      "has_ch19_post": true
    }
  },
  {
    "booth_id": "T-42",
    "circle_name": "百合餓狼之盟",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.instagram.com/lunoestory.novel/",
    "cover_url": "",
    "body": "- 無期迷途\n- 原創\n\n**専區**: 百合\n**連攤**: ╗\n\n🔗 Instagram: [lunoestory.novel](https://www.instagram.com/lunoestory.novel/)\n\n\n✨ **最新動態確認**: 創集繪/CH19/5月30日 言及あり (作家の最新 post 由)",
    "tags": {
      "original": true,
      "yuri-zone": true
    },
    "warnings": [],
    "cover_urls": [
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/629741206_18056098718682894_7103231552467688906_n.jpg?stp=dst-jpg_e35_s640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2gFtDE73GYH8sUa5eMREOvZ5vGaKCtH3bJzJgfebxhQ4fxgoTqbzxTLGgnlKuaNAipU&_nc_ohc=QOvwB5K_LWYQ7kNvwEPeE93&_nc_gid=CkY9cdNnimFjppgqua8IIA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af6p1Ms7fATGQmTHdfaL-qN995b77kwM9X7o4ms0JmotKw&oe=6A1B806F&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/603083876_18050654306682894_6367625018113894079_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2gFtDE73GYH8sUa5eMREOvZ5vGaKCtH3bJzJgfebxhQ4fxgoTqbzxTLGgnlKuaNAipU&_nc_ohc=dkDtkfFkkMgQ7kNvwEWAlBC&_nc_gid=CkY9cdNnimFjppgqua8IIA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af4DDHgx4FwhjOkhJrfaj_S9C8iTFav_OclTgAqDb6B3uQ&oe=6A1B6DCB&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/516753540_18031149905682894_3626081011543192635_n.jpg?stp=dst-jpg_e35_s640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2gFtDE73GYH8sUa5eMREOvZ5vGaKCtH3bJzJgfebxhQ4fxgoTqbzxTLGgnlKuaNAipU&_nc_ohc=kmLzgQc8JC8Q7kNvwGhjems&_nc_gid=CkY9cdNnimFjppgqua8IIA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af7QnizZjEA86SL63XaD_7M0c8EnjLolK9ItZvpEl50hjQ&oe=6A1B61EB&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/703503417_18068923529682894_5001611692809300531_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2gFtDE73GYH8sUa5eMREOvZ5vGaKCtH3bJzJgfebxhQ4fxgoTqbzxTLGgnlKuaNAipU&_nc_ohc=ModIVNx8bF8Q7kNvwFsyXnf&_nc_gid=CkY9cdNnimFjppgqua8IIA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af5SFBudLDLXmFhM3dIsIH7Yy1YlOvPzwbWNeSR-PFHc8A&oe=6A1B652A&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/684551696_18067124312682894_4373529783330128031_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2gFtDE73GYH8sUa5eMREOvZ5vGaKCtH3bJzJgfebxhQ4fxgoTqbzxTLGgnlKuaNAipU&_nc_ohc=Xl11dX-8a78Q7kNvwH5Tkrg&_nc_gid=CkY9cdNnimFjppgqua8IIA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af7yo86xKk491HIUdvvyJPSfPQOFggVExS96Suhi3y5f7Q&oe=6A1B4D31&_nc_sid=8b3546",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/684879462_18066802409682894_1630043848733895424_n.jpg?stp=dst-jpg_e15_s640x640_tt6&_nc_ht=instagram.ftpe20-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2gFtDE73GYH8sUa5eMREOvZ5vGaKCtH3bJzJgfebxhQ4fxgoTqbzxTLGgnlKuaNAipU&_nc_ohc=7KZUZnw25GsQ7kNvwGZ_yoP&_nc_gid=CkY9cdNnimFjppgqua8IIA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af4KBCzOrsrvQDXVSsipVwuyXbcwNTV1gh8gveaNlYn1mA&oe=6A1B6DEA&_nc_sid=8b3546"
    ],
    "_meta_scrape": {
      "platform_used": "ig",
      "image_count_avail": 6,
      "commerce_count_avail": 0
    }
  },
  {
    "booth_id": "T-43/44",
    "circle_name": "你也是舞台少女？",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/Irene309w/",
    "cover_url": "",
    "body": "- 超時空輝耀姬！\n- BanG Dream!\n- 原創-原創百合合本Vol.3\n\n**専區**: 百合\n**連攤**: ╝\n\n🔗 Facebook: [https://www.facebook.com/Irene309w/](https://www.facebook.com/Irene309w/)",
    "tags": {
      "original": true,
      "goudou": true,
      "yuri-zone": true,
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/339739224_1179155515990704_5074472924111380137_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x2048&ctp=s720x720&_nc_cat=103&ccb=1-7&_nc_sid=3ab345&_nc_ohc=sGt0S-YckYkQ7kNvwHKpT7E&_nc_oc=AdrM1TjKyLjmT6v9fBR3W6IoEE9siwlBK4wdmRG_Kx_kAiFOD1qsKl-p9Am7H5eEXE0&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=1pB_w8-d0WGT9zeA1Eq-IA&_nc_ss=7c289&oh=00_Af6a7HhG3tPNuJOJ6ktrnGRfnoSXZXvcf3x_wB8FHC0S1Q&oe=6A1B5633",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/670399314_1543272024470787_2137434678625689147_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=fxQdhAVBggMQ7kNvwGfMEom&_nc_oc=AdpXygYH_FqTrUqFema-_YtNDlovVL_qom_G0u3UFAQqjS7CvCQvZ7PxaYIQpvHePCk&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=tDt9ko5zKEkXUI6KhxhNVQ&_nc_ss=7c289&oh=00_Af4b-Zjc814YGnsWJh4iVbEnPl0v9WaF0NSLCpX7suJ-gA&oe=6A1B67B4",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/670399314_1543272024470787_2137434678625689147_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=fxQdhAVBggMQ7kNvwGfMEom&_nc_oc=AdpXygYH_FqTrUqFema-_YtNDlovVL_qom_G0u3UFAQqjS7CvCQvZ7PxaYIQpvHePCk&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=tDt9ko5zKEkXUI6KhxhNVQ&_nc_ss=7c289&oh=00_Af6Ov5N7ooYVqqSWPw0YvL7GwoIozhaMqgiMVbpmGgnOEQ&oe=6A1B67B4",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/339739224_1179155515990704_5074472924111380137_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=103&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=sGt0S-YckYkQ7kNvwHKpT7E&_nc_oc=AdrM1TjKyLjmT6v9fBR3W6IoEE9siwlBK4wdmRG_Kx_kAiFOD1qsKl-p9Am7H5eEXE0&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=y-aN5DEsrpeZ-sykiyVUEw&_nc_ss=7c289&oh=00_Af5JMDnl1ij5Hy9rNc77QSa-B2fjGovxhhCxV_FAJGA1cQ&oe=6A1B5633",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705989025_1583932510404738_2930161910964476610_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=TJDHUmxDzUMQ7kNvwE8Sboh&_nc_oc=AdqLRajtHYBk2uCMWvvX0O8meD2i5aeKNKuK3jCsPtZzCO_9Nn3oOKx655toWdjpMm0&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=y-aN5DEsrpeZ-sykiyVUEw&_nc_ss=7c289&oh=00_Af4bekRl4CEZ7mD7MjFy5YMO08jSQK0GlrCHdN_pYIk73w&oe=6A1B6E77",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/699738592_1576704637794192_6616897473271200323_n.jpg?stp=c0.198.1448.1448a_dst-jpg_s851x315_tt6&_nc_cat=105&ccb=1-7&_nc_sid=09d16d&_nc_ohc=CCIZTqg6y5kQ7kNvwFRNnj0&_nc_oc=AdqoWfm4SeOkP07MVf7fmAaXgDTASCXFuTmEOJCuFei6bwgY6pYqPrxSibycBnBQYFg&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=tDt9ko5zKEkXUI6KhxhNVQ&_nc_ss=7c289&oh=00_Af7kHY9bxvCZA0OuIB6YmKMkLu_fRkrg5TBHYs_jv1ZYWg&oe=6A1B58E0"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "U-21/22",
    "circle_name": "日初翱祥-陌千",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.threads.com/@mochian0819?hl=zh-tw",
    "cover_url": "",
    "body": "- BanG Dream! Ave Mujica\n- BanG Dream! It's MyGO!!!!!\n- 超時空輝耀姬\n\n**専區**: 綜合\n**連攤**: ╝\n\n🔗 Threads: [mochian0819](https://www.threads.com/@mochian0819?hl=zh-tw)\n\n## 📝 CH19 出展ハイライト\n新刊 **『蝕』** (Ave Mujica 初祥初) 1 萬字加筆、布丁井老師封面 ／ 5/28 22:00 [@karas_oshigata](https://www.threads.com/@karas_oshigata) 老師頻道で 直播予定 ／ 超時空輝耀姫 関連 community post 多数\n- [原 thread](https://www.threads.com/@mochian0819/post/DXzAS81ktnR)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/683661942_17900252013430847_8581241086532948468_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ig_cache_key=Mzg4NzQ1MjIwNTYyNDc3NzE2OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=2t6XRms8aloQ7kNvwHPRr66&_nc_oc=AdqsAc-CnyNS-hsJUlNSY1Rn3pl440EOY6kLYaPM9VS8v7f6CC-Aql_rxU0IYAlXP7w&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=W3P7559sYFHqWiFDDG34_g&_nc_ss=7a22e&oh=00_Af4nyfLaGc_L65Y6ky-LN4LCRimRB0SlIbB00hjg4TXbwg&oe=6A1B6ED5",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/706812340_17904259380430847_189404045007151268_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzkwNTU1NjY4NjE0OTE3OTExOA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTY3Mi5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=ugyy3DCT9-MQ7kNvwHqm6zx&_nc_oc=Ado5QFkPRGpLzXgFurrVwDr4RGkJwS2pkUpAcO-WedBk33HfAeDm42vOMkBkHg59fyg&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=W3P7559sYFHqWiFDDG34_g&_nc_ss=7a22e&oh=00_Af6lt9PD4xEuZ4JxtD9QKeB3-12YC_JenVt8YehVT7oisg&oe=6A1B5A43",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/707992165_17928200277317985_7443816089321494266_n.webp?_nc_cat=101&ig_cache_key=MzkwNDg5OTc3ODA0ODgyNDY0Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=lL3KCaJprmEQ7kNvwHPD8xS&_nc_oc=Ado7wdUUYl-frhfyjRZv-D21wQ_xxTZxtj3vRGw7iUsqNss_Ym_ODiwBwWC5YWHChmY&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=W3P7559sYFHqWiFDDG34_g&_nc_ss=7a22e&oh=00_Af6NjoYso64YLiqr7joT7GkllbLNSc9WQF7zQKum5_6wvQ&oe=6A1B6123",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/706752922_17928200265317985_5875719793894617001_n.webp?_nc_cat=108&ig_cache_key=MzkwNDg5OTc3Nzk5MDE1MjQzMw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=DoJ4K_il7GMQ7kNvwE_aT4e&_nc_oc=Adpey6lO7IQbRiVE4kZhZNFOGMpu-5UItttNdrcJJrqY3kZ3ghS1FuUWS3psap3_dIk&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=W3P7559sYFHqWiFDDG34_g&_nc_ss=7a22e&oh=00_Af64FJgFfosbqkstdS0bEsD2jM7JnLiEkpRdGbUImQxXxg&oe=6A1B80EE",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/704955596_17928200259317985_5684919354102865629_n.webp?_nc_cat=111&ig_cache_key=MzkwNDg5OTc3ODA0ODg2NTYxMg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=efuLGoOb4GIQ7kNvwESu1j2&_nc_oc=Adqjf09_81rfPj_3t2lx3IhiS9zeUFDfz3H1zE7lvDcmyQg7N_6zO7a-4gR7_gDLRcQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-1.fna&_nc_gid=W3P7559sYFHqWiFDDG34_g&_nc_ss=7a22e&oh=00_Af6CHWBR3m_4ihDBeA96E350rBMPvctHV0Sv6K164iYhAw&oe=6A1B5734",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/706965499_17928200274317985_8758848555045697386_n.webp?_nc_cat=104&ig_cache_key=MzkwNDg5OTc3ODA0ODg2MzU3Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=5sjt2JvNciQQ7kNvwE8mZDJ&_nc_oc=AdoFBOy_YSSF-rfjW1InwckmIPXQp5DDtN2pOmaOKW-09NulOnVRfIpi2buQ52LX_CM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=W3P7559sYFHqWiFDDG34_g&_nc_ss=7a22e&oh=00_Af7FVvrsQZhAsvNbFf38sLUDou8GAO3tWLYGwpOeLT4c3w&oe=6A1B6F75"
    ],
    "_meta_scrape_sk": {
      "platform_used": "threads",
      "hand_note": true,
      "detected_cps": [],
      "has_ch19_post": true
    }
  },
  {
    "booth_id": "U-23",
    "circle_name": "貓專用牛乳",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/mikan888/",
    "cover_url": "",
    "body": "- 超時空輝耀姬\n- 請問您今天要來點兔子嗎？\n- Lycoris Recoil 莉可麗絲\n\n**専區**: 綜合\n\n🔗 Facebook: [https://www.facebook.com/mikan888/](https://www.facebook.com/mikan888/)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/530518982_1311860710513433_1461755793416276799_n.jpg?stp=dst-jpg_tt6&cstp=mx2041x2038&ctp=s720x720&_nc_cat=101&ccb=1-7&_nc_sid=3ab345&_nc_ohc=O1gxBEkJagYQ7kNvwHGkM8Y&_nc_oc=AdoHKhlEYYdFVb6NExvxB096XgR6dY6eM8Mw84IzbQ0NST31VOaJWzNG7AqGegtjKdA&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=aVbNvgsCyFMXeIH9l5A-vQ&_nc_ss=7c289&oh=00_Af6eN7Fuaoh3o6LCL_P-DfndxiP40imT7oUhIv-pFRum9g&oe=6A1B7ED7",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/530518982_1311860710513433_1461755793416276799_n.jpg?stp=cp0_dst-jpg_s80x80_tt6&_nc_cat=101&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=O1gxBEkJagYQ7kNvwHGkM8Y&_nc_oc=AdoHKhlEYYdFVb6NExvxB096XgR6dY6eM8Mw84IzbQ0NST31VOaJWzNG7AqGegtjKdA&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=w51lxvTelXWH5PTXFGHP5A&_nc_ss=7c289&oh=00_Af6Der7HAlnb8ztFnlL5wS8UtwlmdA3V4b_YBHk8IkskpQ&oe=6A1B7ED7",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/704782945_1544247640608071_4749741119156422739_n.jpg?stp=dst-jpg_p552x414_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=d-8OEO_YOmYQ7kNvwGzpjdH&_nc_oc=AdpYMY4jkMPzGPtG5u33EHLtmSVtRfsM-WZt0ln4ytwl2VHezNEiHcprOguRpDBZkes&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=w51lxvTelXWH5PTXFGHP5A&_nc_ss=7c289&oh=00_Af4NhXKqHvlSfUDkIG8oVtM1PsbuOu-ChmZ5PWzqvR7Fcw&oe=6A1B4939",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/705521260_1544247637274738_3219822290556636098_n.jpg?stp=dst-jpg_p552x414_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=5X1VFOAl1u4Q7kNvwFktJP4&_nc_oc=AdrsaqyI3erKXW7Tm6Tfs2Kaf03vMYmY2RUhqADAFKV4e5SdjkoeoXXDB1BLsqIwSaY&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=w51lxvTelXWH5PTXFGHP5A&_nc_ss=7c289&oh=00_Af54IT-WJfPl5oovn4nU0ebVbLrem-NrAjBwKxjCxdaUBQ&oe=6A1B51B6",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/705920556_1544247670608068_68418574430706855_n.jpg?stp=dst-jpg_p552x414_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=o6ZcKI4sfmEQ7kNvwFLzN3y&_nc_oc=AdrnpPBQ1GN8WiQj_xHnG1VwKsI0T99tHaAjauJDkzl7OndvY8Sqo74zDfTnYtr436w&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=w51lxvTelXWH5PTXFGHP5A&_nc_ss=7c289&oh=00_Af4mQMgtjv3m4P5mWIjSmzp5OB2p2e9TMOXNdYWxCwjoew&oe=6A1B654E",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/705920556_1544247670608068_68418574430706855_n.jpg?stp=c0.364.946.946a_dst-jpg_s851x315_tt6&_nc_cat=101&ccb=1-7&_nc_sid=8a6525&_nc_ohc=o6ZcKI4sfmEQ7kNvwFLzN3y&_nc_oc=AdrnpPBQ1GN8WiQj_xHnG1VwKsI0T99tHaAjauJDkzl7OndvY8Sqo74zDfTnYtr436w&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=GkFRojmjnLBrYcycHEtroA&_nc_ss=7c289&oh=00_Af4hGdiazqloHdc-9shJ0iiBOxKIl32Sm-n9dIWozjdcXg&oe=6A1B654E"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "U-24",
    "circle_name": "腰痛黃瓜",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.threads.com/@kyuuri991205",
    "cover_url": "",
    "body": "- 超時空輝耀姬\n- 少女樂團吶喊吧\n\n**専區**: 綜合\n\n🔗 Threads: [kyuuri991205](https://www.threads.com/@kyuuri991205)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/702620140_17875437087656554_1485655112802953689_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=104&ig_cache_key=MzkwMzQ4OTg1MDEwOTE5MjczMw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTM3OC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=CrRfP7dV99gQ7kNvwFxOQqC&_nc_oc=AdpH3W5309woDsEFPIq_HzPvc6iZ6uf5E41yy1RNRxxo5bI319bcBukzP49UK-PRAJ0&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=p1MP3O8KR-DnRhhHT7Z_hA&_nc_ss=7a22e&oh=00_Af6ZHEwkPY7sNrP42lP6o1RClSJY3-Hu2kjugK1pnnuYPA&oe=6A1B5E62",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/703762077_17875238235656554_6460523699297493911_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=100&ig_cache_key=MzkwMjczODI0OTAxMDQ5NDE0NQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTM3OC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=ydpHXdGEkQYQ7kNvwHsg7b3&_nc_oc=AdquZn7sPwdxNcOHzrjmIc7jQwwE5Eap-MqsG6pZ7l8PRy1fZJa1ifzku0IALmadUM8&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-1.fna&_nc_gid=0Nb7c_anJc5NdddZRk_Thg&_nc_ss=7a22e&oh=00_Af7KKBWDcABJ-JjFv0Ok2Hb0P5Y0gq1S0NOka9wudKRcSA&oe=6A1B7BF7",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/703646521_17875238244656554_4523841871980125162_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ig_cache_key=MzkwMjczODI0OTA3NzYxNjI1Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTM3OC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=twFyFc2zunkQ7kNvwE1qo2h&_nc_oc=AdosUmiyKzsxuJe-7t6mZ1DYZMrtSCAQavAwj4l73r9mKCFxBgOlZMKPtm0V9aBKr_M&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=0Nb7c_anJc5NdddZRk_Thg&_nc_ss=7a22e&oh=00_Af5rxpjekYbeI38MvOvTbK6uhxUw0w_NfHKVxlahslqg9g&oe=6A1B53F5",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/703708362_17875066272656554_9090656000016550793_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ig_cache_key=MzkwMjA2MzYyNTA1MDMzNjY2NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuOTYyLnNkci5yZWd1bGFyX3Bob3RvLkMzIn0%3D&_nc_ohc=7945MMxq-PkQ7kNvwH4DwKh&_nc_oc=AdqQ9hoXfVgncH7zVRbWl9d0ueVGANT0H-cCTqQ1lq3133ZTlSmh7o3LaUmz-BBoo3E&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=0Nb7c_anJc5NdddZRk_Thg&_nc_ss=7a22e&oh=00_Af60WbP97qxvlemEZMsvlpamD8CJCE8v4AMdPplvHCAZ5A&oe=6A1B5CB2",
      "https://instagram.ftpe20-2.fna.fbcdn.net/v/t51.82787-15/702213035_17874852888656554_8438156579111494_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ig_cache_key=MzkwMTI2OTM3OTM2NDAxMjQwOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMjUyMy5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=tyJ6BZh4XuIQ7kNvwHC7Boy&_nc_oc=Adr8FTNe8e2RJ3SRcLzHRJCjQb3ghJ8Cf0MbXo-I1_b1vpU69XSHHJFQcu-ggDyGlaA&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-2.fna&_nc_gid=0Nb7c_anJc5NdddZRk_Thg&_nc_ss=7a22e&oh=00_Af6i-4kIYUWKWaEqUWTxCWIlu9mkUeDdDShWv4dvCmLIug&oe=6A1B50CF",
      "https://instagram.ftpe20-1.fna.fbcdn.net/v/t51.82787-15/703811789_17874677184656554_5283844102481929430_n.webp?_nc_cat=102&ig_cache_key=MzkwMDU5Mzg0ODE5MjcxMTUzMw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMjQ2OS5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=gWnU4NiLvv8Q7kNvwGUCFoY&_nc_oc=AdpAhkdqPwPGv3h2Yj9BMtWYJoGOs5o2BF9Txx-P5qq36ea8yDPc37j4lsZVCXskp7E&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.ftpe20-1.fna&_nc_gid=0Nb7c_anJc5NdddZRk_Thg&_nc_ss=7a22e&oh=00_Af6Jx49pKFdMNKSbOUOs8rTNzS4GmIJPtQ-i_V512P5_AA&oe=6A1B5DCB"
    ],
    "_meta_scrape_sk": {
      "platform_used": "threads",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "U-25/26",
    "circle_name": "Mo子宅屋",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/BLUE1OR2?locale=zh_TW",
    "cover_url": "",
    "body": "- MYGO\n- 金牌得主\n- 超時空輝耀姬\n\n**専區**: 綜合\n\n🔗 Facebook: [https://www.facebook.com/BLUE1OR2?locale=zh_TW](https://www.facebook.com/BLUE1OR2?locale=zh_TW)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/571356144_1400735312060097_1464275783197363384_n.jpg?stp=dst-jpg_tt6&cstp=mx330x316&ctp=s330x316&_nc_cat=104&ccb=1-7&_nc_sid=3ab345&_nc_ohc=AxMIxEMQv8sQ7kNvwEHfezI&_nc_oc=AdpPUrhZNEZDVR8lllkVPhXdITSB2lKewm_1WjaliA76qXaDjI7SwP7tevm3uMSqNwo&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=qCfuiqJJI3ybGAQp04HaPA&_nc_ss=7c289&oh=00_Af4QJch7EFJHE1m2fqjCptubS0QC315UpsJXM_OJ_e9u2A&oe=6A1B6793",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/574649048_1400735552060073_746480761466309610_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=BSby1hwXDx4Q7kNvwHzCFGl&_nc_oc=Adr2ftEvftdJ4SzCJAWWvO-cj0coGq2Yt6fFpzlzqU_hfDaujqFO-JGLSnsNbocWdZ8&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=P7PmIzPr4v2FNiIR1VP8UQ&_nc_ss=7c289&oh=00_Af4_idbVcbCwWSdFGUeqKnpd6maVN6HTUw-VF-X1qizyDw&oe=6A1B67B4",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/574649048_1400735552060073_746480761466309610_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=110&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=BSby1hwXDx4Q7kNvwHzCFGl&_nc_oc=Adr2ftEvftdJ4SzCJAWWvO-cj0coGq2Yt6fFpzlzqU_hfDaujqFO-JGLSnsNbocWdZ8&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=P7PmIzPr4v2FNiIR1VP8UQ&_nc_ss=7c289&oh=00_Af4tov2LXQSwDKcnoOZTsVuvAy2xxDIGOdFbdpTyD705Gw&oe=6A1B67B4",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/701874540_1572676254866001_2756393479238732326_n.jpg?stp=c0.201.1438.1438a_dst-jpg_s851x315_tt6&_nc_cat=102&ccb=1-7&_nc_sid=09d16d&_nc_ohc=kar7U4358VgQ7kNvwH2hFAE&_nc_oc=AdrBl2t8sEmTeCgd5szFiKD_tu1oodTXYJsVX-BOhknpJwqZvqOylcb8Nx7qTUnBPRQ&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=P7PmIzPr4v2FNiIR1VP8UQ&_nc_ss=7c289&oh=00_Af6eMRQADWhW5HrZ_fqwwsLW1DLxcBoz2tm4ZDmq9Z_rtg&oe=6A1B6C05",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/699713666_1571753388291621_4666791011479760124_n.jpg?stp=c171.0.1706.1706a_dst-jpg_s851x315_tt6&_nc_cat=104&ccb=1-7&_nc_sid=09d16d&_nc_ohc=hEZpmu8bF68Q7kNvwG0DI2F&_nc_oc=Adqgav-C9cpxYDFdJufIvko0CtM8SMLwj_JvlTA-GVjD9IUAUzKxp2F8eiYTfUglfy8&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=P7PmIzPr4v2FNiIR1VP8UQ&_nc_ss=7c289&oh=00_Af50ABL4DUh6ExbnBdSOVlLfTrzBTvHjz2YAzJyTWw_GiQ&oe=6A1B57F7",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/699355197_1570849721715321_5185094034370049462_n.jpg?stp=c0.194.1460.1460a_dst-jpg_s851x315_tt6&_nc_cat=110&ccb=1-7&_nc_sid=09d16d&_nc_ohc=h4oRfL9LMxkQ7kNvwFSp2YM&_nc_oc=AdpQmdJolOwPQi1EcA15jOFMy2f322w2My0sEjt4ecAfcruOPiKUif3EjBfarp5LJhs&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=P7PmIzPr4v2FNiIR1VP8UQ&_nc_ss=7c289&oh=00_Af4DlcVA3bpSZm5JPsSlvn39IK6wwdS0ghKinp6lAK8QSg&oe=6A1B60E4"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "U-27",
    "circle_name": "玦聚-Jadeverse",
    "author": "",
    "x_handle": "",
    "x_url": "https://lit.link/en/jadeverse",
    "cover_url": "",
    "body": "- 超時空輝耀姬！\n\n**専區**: 綜合\n**連攤**: ╗\n\n🔗 lit.link: [https://lit.link/en/jadeverse](https://lit.link/en/jadeverse)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://prd.storage.lit.link/images/creators/d7225ce7-7230-49a6-a650-bb4e61b47252/ogp/ogp_image.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "aggregator",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "U-28",
    "circle_name": "四季更迭的翻車魚",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/MOLAMOLAComics",
    "cover_url": "",
    "body": "- 超時空輝耀姬\n- 賽馬娘\n\n**専區**: 綜合\n**連攤**: ╝\n\n🔗 Facebook: [https://www.facebook.com/MOLAMOLAComics](https://www.facebook.com/MOLAMOLAComics)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/257484580_433099444924585_365525407614215155_n.jpg?stp=dst-jpg_tt6&cstp=mx1018x1018&ctp=s720x720&_nc_cat=103&ccb=1-7&_nc_sid=3ab345&_nc_ohc=YqbuKvT2PZQQ7kNvwFe8Dz-&_nc_oc=AdqMBvjEaodIGRAjAxTmuRPAHfmw8HkNofsBJ_BvePnpSNIPAVAPJOMmpQEA2BmTgZk&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=s5rZbRVbHO9ZJYTb4s3jkQ&_nc_ss=7c289&oh=00_Af6G-KEd4ypY2JQU7ORP3Dn4eYnusle9obGhuFo7bJnXrw&oe=6A1B672B",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/473317531_1159810645586791_1819061923292995998_n.jpg?stp=dst-jpg_fb50_s320x320_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=3mqEOgqTEaMQ7kNvwHGB1qB&_nc_oc=AdqpkHuHRFvia8VIwsGigN288dDkgr-srDb4pEmf-MHfNoRWOy8HAE10BlfQ_KpLf5o&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6gniNTaf6aMU-uT86Zq8bQ&_nc_ss=7c289&oh=00_Af7cmTkjO5D8ifNSSHt_nwYbW_5PelHqZ-ukifry_0T-XA&oe=6A1B5672",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/473317531_1159810645586791_1819061923292995998_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=3mqEOgqTEaMQ7kNvwHGB1qB&_nc_oc=AdqpkHuHRFvia8VIwsGigN288dDkgr-srDb4pEmf-MHfNoRWOy8HAE10BlfQ_KpLf5o&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6gniNTaf6aMU-uT86Zq8bQ&_nc_ss=7c289&oh=00_Af7Oe5Kxo6XxYgVNDxRO7wpcZ96ZIHt1JSTXk6Kcy9q2YA&oe=6A1B5672",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/639353754_1225524919774301_1133402732431947457_n.jpg?stp=c299.0.1451.1451a_dst-jpg_s851x315_tt6&_nc_cat=106&ccb=1-7&_nc_sid=8a6525&_nc_ohc=OECMJtb4O2YQ7kNvwFWYUCQ&_nc_oc=Adra1hTNzTwz7qoW28QSxBSJm6v8mJWPuwhvIBQ0Kse2ONT0-MqEzsFVyZXhnb5dQAY&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=6gniNTaf6aMU-uT86Zq8bQ&_nc_ss=7c289&oh=00_Af6aCh5gIOeizD0tiLnoGLDxtTNeAfaCIv553wSU9cMM9Q&oe=6A1B7004",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/627970051_1213592880967505_8850670787706011641_n.jpg?stp=c0.169.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=107&ccb=1-7&_nc_sid=8a6525&_nc_ohc=3716SfKyTDcQ7kNvwGAGsuP&_nc_oc=AdonZCTkU6YDOTHdRrpBiP7EYWEA_ztpzrd3cMCEmviGiCxOXbdCvxSX2eYJdgnmuXU&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=6gniNTaf6aMU-uT86Zq8bQ&_nc_ss=7c289&oh=00_Af70J9CL-E_aZFY-ma2ryNYlYU-yyJkCK4Q46R1xnKGFdg&oe=6A1B7DC6",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/629229079_1213575574302569_4543156374976523174_n.jpg?stp=c0.169.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=101&ccb=1-7&_nc_sid=8a6525&_nc_ohc=4ueniyfmcj0Q7kNvwH_Nl1_&_nc_oc=Adollv8zD-hxI6IJmTBQmVspxyIC9-hzRsWtl5uz89m-266bR-wYs_4X88bi4v1UDlo&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=6gniNTaf6aMU-uT86Zq8bQ&_nc_ss=7c289&oh=00_Af5HW08Ie1eP3hgN9xOThzYorW3QaPULCuWi_a-JlGNlNw&oe=6A1B660C"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "U-29",
    "circle_name": "勝利早餐店",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.plurk.com/choco6644",
    "cover_url": "",
    "body": "- 超時空輝耀姬\n\n**専區**: 綜合\n\n🔗 Plurk: [choco6644](https://www.plurk.com/choco6644)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://images.plurk.com/mx_3jC2URYPkiI0YEB5mR4hID.jpg",
      "https://images.plurk.com/mx_1Tf1ALqL5g1MP5m0dl0dk.jpg",
      "https://images.plurk.com/mx_22eeTAlShXxDBdAaSSwnov.jpg",
      "https://images.plurk.com/mx_3fUJR0GKRpJjWg1dQcGgLg.jpg",
      "https://images.plurk.com/mx_2oUFaoK33aBvRS6EQ1YB4e.jpg",
      "https://images.plurk.com/mx_2wev4t6aVMysjT48Rug6Ka.jpg"
    ],
    "_meta_scrape_sk": {
      "platform_used": "plurk",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  },
  {
    "booth_id": "U-30",
    "circle_name": "太呱章了",
    "author": "",
    "x_handle": "melon2943",
    "x_url": "https://x.com/melon2943",
    "cover_url": "",
    "body": "- BanG Dream! Ave Mujica\n- 超時空輝耀姬！\n\n**専區**: 綜合\n\n🔗 X: [melon2943](https://x.com/melon2943)\n\n## 📝 CH19 出展ハイライト\n5月 百合 Only (CH19) 出展、菟子老師 寄攤 ／ 出すのは **超時空輝耀姫** の本\n- [印量調查](https://x.com/melon2943)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "_meta_scrape_sk": {
      "platform_used": "x",
      "hand_note": true,
      "detected_cps": [],
      "has_ch19_post": true
    }
  },
  {
    "booth_id": "Y-11",
    "circle_name": "古藤工作室 by MOMO",
    "author": "",
    "x_handle": "",
    "x_url": "https://www.facebook.com/gutenmomo",
    "cover_url": "",
    "body": "- 蔚藍檔案\n- 超時空輝耀姬！\n- Hololive EN\n\n**専區**: 綜合\n\n🔗 Facebook: [https://www.facebook.com/gutenmomo](https://www.facebook.com/gutenmomo)",
    "tags": {
      "super-kaguya": true
    },
    "warnings": [],
    "cover_urls": [
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/526732883_605850779244706_4703623759316140668_n.jpg?stp=dst-jpg_tt6&cstp=mx450x450&ctp=s450x450&_nc_cat=105&ccb=1-7&_nc_sid=3ab345&_nc_ohc=BCjGWfWUvccQ7kNvwHt_q5R&_nc_oc=AdoEB2tuEXbNiUu-zwOSgm8v1YFPWdnyj6905dS8Wdswjcl-VGeeS4i5AVImS424zqA&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=6dOfeeyzwAwyTG4gmiaPPA&_nc_ss=7c289&oh=00_Af5sAHzpWe-rd7DGu9SW0pJOuFJNsKGzcNl2uOsAWOm2EA&oe=6A1B57D6",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-1/526732883_605850779244706_4703623759316140668_n.jpg?stp=c0.33.417.417a_cp0_dst-jpg_s80x80_tt6&_nc_cat=105&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=BCjGWfWUvccQ7kNvwHt_q5R&_nc_oc=AdoEB2tuEXbNiUu-zwOSgm8v1YFPWdnyj6905dS8Wdswjcl-VGeeS4i5AVImS424zqA&_nc_zt=24&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=qs2_z9Ou4yTkpOMDqqq2jg&_nc_ss=7c289&oh=00_Af7r7fpyZn20kfsAUPGKSQMv-h-XphOHQozIqctVhd284w&oe=6A1B57D6",
      "https://scontent.ftpe20-2.fna.fbcdn.net/v/t39.30808-6/686186375_818882191274896_7967419785887994827_n.jpg?stp=cp6_dst-jpg_p960x960_tt6&_nc_cat=108&ccb=1-7&_nc_sid=833d8c&_nc_ohc=dWPtcRyhS9UQ7kNvwFl6mc-&_nc_oc=AdoemO4Oati0ckxwSK6eIc3CzzE9v6sXG3tJ0GtJgd8iCIuhfJFsfPEyPsC5PWVWlhE&_nc_zt=23&_nc_ht=scontent.ftpe20-2.fna&_nc_gid=qs2_z9Ou4yTkpOMDqqq2jg&_nc_ss=7c289&oh=00_Af6QEyWDsfEb8Pit5jgAx-_yKq7DgqlQC14W39l3yrB6rw&oe=6A1B4C32",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/689136680_818893904607058_1533796866268593017_n.jpg?stp=cp6_dst-jpg_p960x960_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=JJV0BiWkvyAQ7kNvwGW2sQl&_nc_oc=AdqryGWIl8t_S8NWWzz21Zp0-ALq0D8wPYYvNyFMl1Q3GzJAFxLM7DTBnb5KT3NW9nU&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=qs2_z9Ou4yTkpOMDqqq2jg&_nc_ss=7c289&oh=00_Af4hcgldpnGOstZtyWdBV0jnqBtna2eC6pNnqUkAQ54R0A&oe=6A1B4EB6",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/689036461_818893887940393_6063837578982116135_n.jpg?stp=cp6_dst-jpg_p960x960_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=BeIMZPMNh0UQ7kNvwF0Jhj2&_nc_oc=AdqRFbqLpPUBMyDGXTZsF4ldsxVn6cdUV3nbk-wA_EgnqpVZQ0CrSbGcJ5chR6b0Z7k&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=qs2_z9Ou4yTkpOMDqqq2jg&_nc_ss=7c289&oh=00_Af4pJlwJupZc6Ek2KDZfZdssZ1-10gE8Jo2o260aGI6qZw&oe=6A1B5594",
      "https://scontent.ftpe20-1.fna.fbcdn.net/v/t39.30808-6/689136680_818893904607058_1533796866268593017_n.jpg?stp=c0.169.1536.1536a_cp6_dst-jpg_s851x315_tt6&_nc_cat=100&ccb=1-7&_nc_sid=8a6525&_nc_ohc=JJV0BiWkvyAQ7kNvwGW2sQl&_nc_oc=AdqryGWIl8t_S8NWWzz21Zp0-ALq0D8wPYYvNyFMl1Q3GzJAFxLM7DTBnb5KT3NW9nU&_nc_zt=23&_nc_ht=scontent.ftpe20-1.fna&_nc_gid=Unjv4C_qaWT0-X_ODiNAgA&_nc_ss=7c289&oh=00_Af6sQm5nfYuzOLPQ0ybt_BuUBmXluxpw_sJ_14Sm7NoiYQ&oe=6A1B4EB6"
    ],
    "_meta_scrape_sk": {
      "platform_used": "fb",
      "hand_note": false,
      "detected_cps": [],
      "has_ch19_post": false
    }
  }
];
