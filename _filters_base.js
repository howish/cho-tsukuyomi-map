/**
 * Shared filter base — universal vocabulary lifted out of per-event
 * filters.js per openspec change formalize-filter-system (2026-06-07).
 *
 * Schema authority: docs/filters.md
 *
 * What's shared here:
 *   - `tags`: product-type / attribute (manga, novel, illust, goods, r18,
 *     goudou, free, consign) — universal across all doujin events
 *   - `warnings`: sales-status (soldout, online, reprint, cash, limit,
 *     noonline) — universal warning vocabulary
 *
 * What stays per-event:
 *   - `cps`: pairings differ by fandom
 *   - `works`: fandoms differ by event
 *   - `mediums` / `areas`: event-specific
 *   - per-event overrides for tags / warnings: allowed but discouraged;
 *     document why in a comment on the override
 *
 * Loaded before per-event `<slug>/filters.js`; app.js merges arrays so
 * per-event entries with the same `code` override the base.
 *
 * No `pattern` field — that was retired in B5 (2026-06-06) and is
 * flagged as dead config by the validator.
 */
window.FILTERS_BASE = {
  tags: [
    { code: "r18",     label: "R-18",          icon: "🔞", title: "R-18 含む / 要 ID" },
    { code: "goudou",  label: "合同",          icon: "🤝", title: "合同誌・まとめ本" },
    { code: "free",    label: "無配",          icon: "🎁", title: "無料配布あり" },
    { code: "consign", label: "委託",          icon: "📚", title: "委託本あり" },
    { code: "manga",   label: "漫画",          icon: "📕", title: "漫画" },
    { code: "novel",   label: "小説",          icon: "📖", title: "小説" },
    { code: "illust",  label: "イラスト本",    icon: "🎨", title: "イラスト本・アートブック" },
    { code: "goods",   label: "グッズ",        icon: "🛍", title: "グッズ・アクスタ・ステッカー等" },
  ],

  warnings: [
    { code: "soldout",  label: "✅ 完売御礼",         class_suffix: "soldout" },
    { code: "online",   label: "🛒 通販あり",         class_suffix: "online" },
    { code: "reprint",  label: "⚠️ 再販なし",         class_suffix: "reprint" },
    { code: "cash",     label: "💴 ジャスト払い推奨", class_suffix: "cash" },
    { code: "limit",    label: "🎫 部数制限",         class_suffix: "limit" },
    { code: "noonline", label: "🚫 通販なし",         class_suffix: "noonline" },
  ],
};
