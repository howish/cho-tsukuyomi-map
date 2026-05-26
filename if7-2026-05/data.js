/**
 * CH19 (第19回 Comic Horizon) booth data — initial scaffold.
 *
 * 出展サークル list は GJ工作室 が公開後に追記。Past CH instance 規模は 75-120 booth。
 *
 * Source for refresh:
 *   - https://ch.gjs.tw/circle-list.html (CH19 official list)
 *   - https://if.gjs.tw/circle-list.html (IF7 full list)
 *   - https://www.plurk.com/GrandJourney (GJ工作室 Plurk 公告)
 *   - https://www.facebook.com/gjs.tw (GJ工作室 FB)
 *
 * Schema reminder:
 *   {
 *     booth_id: "A-01",
 *     circle_name: "...",
 *     author: "...",
 *     x_handle: "...",        // or plurk handle, or omit
 *     x_url: "...",           // source post URL (Plurk / FB / X — any social)
 *     cover_url / cover_urls: ["..."],
 *     min_price: 500,
 *     body: "markdown 本文",
 *     cps: ["..."],
 *     tags: { yuri: true, ... },
 *     warnings: [["code", "label", "source_url"]],
 *   }
 */
window.BOOTHS = [];
