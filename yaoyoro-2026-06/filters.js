/**
 * Filter configuration — define CP (couple/pairing) filters and tag filters
 * for your event. Each entry has:
 *   - code: short identifier (used in data-filter attribute)
 *   - label: text shown on filter button
 *   - icon: emoji prefix for visual identification
 *   - title: hover tooltip explanation
 *   - pattern: regex string to detect this tag in booth body text (used by
 *     the optional auto-tagging script `tools/tag.py`)
 *
 * Replace these entries with the CPs/tags relevant to your event.
 *
 * `trio_pattern` is an exclusive override — if the booth body matches this,
 * only "trio" CP is assigned (individual pair CPs are skipped).
 */
window.FILTERS_CONFIG = {
  cps: [
    {
      code: "iroka",
      label: "いろかぐ",
      icon: "🦊×🐰",
      title: "いろは × かぐや、順序不問",
      pattern: "いろかぐ|かぐいろ|(彩葉|いろは)\\s*×\\s*かぐや|かぐや\\s*×\\s*(彩葉|いろは)",
    },
    {
      code: "iroyachi",
      label: "いろヤチ",
      icon: "🦊×🐙",
      title: "いろは × ヤチヨ、順序不問",
      pattern: "いろヤチ|ヤチいろ|(彩葉|いろは)\\s*×\\s*ヤチヨ|ヤチヨ\\s*×\\s*(彩葉|いろは)",
    },
    {
      code: "iroroka",
      label: "いろろか",
      icon: "🦊×🌸",
      title: "いろは × 芦花、順序不問",
      pattern: "いろろか|ろかいろ|(芦花|ろか)\\s*×\\s*(彩葉|いろは)|(彩葉|いろは)\\s*×\\s*(芦花|ろか)",
    },
    {
      code: "trio",
      label: "三人",
      icon: "🌟",
      title: "三人 (いろかぐヤチ または 4人以上)",
      // trio is detected via trio_pattern below — leave pattern as wildcard or matching shorthand
      pattern: "三人|三人組",
    },
    {
      code: "mikanoi",
      label: "みかのい",
      icon: "👹×🐯",
      title: "みかのい (帝 × 乃依)",
      pattern: "みかのい|帝\\s*×\\s*乃依|乃依\\s*×\\s*帝",
    },
  ],
  // If body matches trio_pattern, ONLY 'trio' CP code is assigned
  // (skip individual pair CPs). Set to null to disable exclusive trio.
  trio_pattern: "三人|ヤチいろかぐ|いろかぐヤチ|ヤチかぐいろ|かぐヤチいろ|いろハーレム|ハーレム|3 ?CP|三 CP",

  tags: [
    {
      code: "r18",
      label: "R-18",
      icon: "🔞",
      title: "R-18 含む / 要 ID",
      pattern: "R-?18|🔞|成人向け",
    },
    {
      code: "goudou",
      label: "合同",
      icon: "🤝",
      title: "合同誌・まとめ本",
      pattern: "合同|合本|まとめ本|anthology|アンソロ",
    },
    {
      code: "free",
      label: "無配",
      icon: "🎁",
      title: "無料配布あり",
      pattern: "無料配布|無配|TAKE FREE",
    },
    {
      code: "consign",
      label: "委託",
      icon: "📚",
      title: "委託本あり",
      pattern: "委託",
    },
    {
      code: "manga",
      label: "漫画",
      icon: "📕",
      title: "漫画",
      pattern: "漫画|コミック|まんが|4コマ|四コマ|レポ漫画|レポ本|fanbook",
    },
    {
      code: "novel",
      label: "小説",
      icon: "📖",
      title: "小説",
      pattern: "小説|文庫|短編集",
    },
    {
      code: "illust",
      label: "イラスト本",
      icon: "🎨",
      title: "イラスト本・アートブック",
      pattern: "イラスト本|アートブック|illustration|artbook|らくがき本|画集|落書き本|ILLUSTRATIONS",
    },
    {
      code: "goods",
      label: "グッズ",
      icon: "🛍",
      title: "グッズ・アクスタ・ステッカー等",
      pattern: "グッズ|アクスタ|ステッカー|ポストカード|キーホルダー|缶バッジ|色紙|ペーパー",
    },
  ],

  // Warning vocabulary — code → label / chip class lookup. data.js opts
  // a booth into a warning by adding the bare string code (e.g. "soldout")
  // to its `warnings` array, or a tuple `[code, label, sourceUrl]`. Auto-
  // detect from body text was removed 2026-06-06 (howish: too many false
  // positives), so warnings are manual-only now.
  warnings: [
    { code: "soldout",  label: "✅ 完売御礼",         class_suffix: "soldout" },
    { code: "online",   label: "🛒 通販あり",         class_suffix: "online" },
    { code: "reprint",  label: "⚠️ 再販なし",         class_suffix: "reprint" },
    { code: "cash",     label: "💴 ジャスト払い推奨", class_suffix: "cash" },
    { code: "limit",    label: "🎫 部数制限",         class_suffix: "limit" },
    { code: "noonline", label: "🚫 通販なし",         class_suffix: "noonline" },
  ],
};
