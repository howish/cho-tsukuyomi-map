/**
 * Booth → map-coordinate table for venue-map highlighting.
 *
 * Schema: { "<booth_id>": { x, y, w, h } } — all values are PERCENTAGES
 * of the map image dimensions (0..100). Rendered via SVG overlay with
 * viewBox="0 0 100 100" preserveAspectRatio="none" so the same numbers
 * work regardless of the rendered map size.
 *
 * Populate via coord-tool.html (open in a browser, click two corners of
 * a row+band, the tool auto-distributes N evenly-spaced cells, paste
 * the exported JSON back into this file).
 *
 * Empty = no overlay highlight (graceful degradation; filters still
 * work as before).
 */
window.BOOTH_COORDS = {};
