/**
 * Event-specific filter overrides. The universal vocabulary (tags +
 * warnings) lives in `_filters_base.js` at repo root and is merged
 * by app.js before this file loads.
 *
 * What stays here:
 *   - cps: per-event pairings
 *   - tags: per-event additions / overrides (entries with the same
 *     `code` as a base entry override the base; document why)
 *   - works / mediums / areas: per-event only
 *   - warnings: per-event additions / overrides
 *
 * Schema authority: docs/filters.md
 * Validator: .claude/skills/filter-system/bin/run.sh validate
 */
window.FILTERS_CONFIG = {
  "cps": [
    {
      "code": "iroka",
      "label": "いろかぐ",
      "icon": "🦊×🐰",
      "title": "いろは × かぐや、順序不問"
    },
    {
      "code": "iroyachi",
      "label": "いろヤチ",
      "icon": "🦊×🐙",
      "title": "いろは × ヤチヨ、順序不問"
    },
    {
      "code": "iroroka",
      "label": "いろろか",
      "icon": "🦊×🌸",
      "title": "いろは × 芦花、順序不問"
    },
    {
      "code": "trio",
      "label": "三人",
      "icon": "🌟",
      "title": "三人 (いろかぐヤチ または 4人以上)"
    },
    {
      "code": "mikanoi",
      "label": "みかのい",
      "icon": "👹×🐯",
      "title": "みかのい (帝 × 乃依)"
    }
  ],
  "tags": [],
  "warnings": []
};
