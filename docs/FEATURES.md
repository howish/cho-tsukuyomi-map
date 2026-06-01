# Feature catalog — yachi8000.app shared shell

The shared `app.js` (loaded by every event from root) provides a set of
**features** that activate based on what DOM elements an event's `index.html`
provides. Each event picks its own feature mix by including (or omitting) the
relevant DOM in its `index.html`.

There is **no per-feature config flag** — presence of the right DOM ids is the
opt-in. Features silently no-op when their DOM is missing, so an event's
index.html stays as readable HTML you can edit by hand.

## How to add a feature to an event

1. Find the feature you want below
2. Copy the listed DOM into your event's `index.html` (anywhere in `<body>`)
3. Reload — feature lights up automatically

## How to drop a feature from an event

1. Remove the listed DOM from your event's `index.html`
2. The feature is silently disabled — app.js skips it via null checks

## Starter template

New events get a default index.html with most features enabled, copied once
from `_index_template.html` by `scripts/build_index_html.py --only <slug>`
during `doujin-circle-recon bootstrap`. After that, the file is yours to edit
freely — the build script will not overwrite it without `--force`.

---

## Features

### 🏷  Header chrome

Always-on if the matching ids exist:
- `#event-title` — h1 title (injected from event.js `name`)
- `#event-info` — date_display + venue + entry_info
- `#event-disclaimer` — auto-includes official-site link

### 🔗  Share button

```html
<button class="share-btn" id="share-btn" type="button">🔗 このサイトを共有</button>
```

### 📥  Offline (SW) toggle

```html
<button class="offline-btn" id="offline-btn" type="button" hidden>📥 オフライン対応 ON</button>
<p class="offline-status" id="offline-status"></p>
```

Requires the per-event `sw.js` to exist at `<slug>/sw.js`.

### ✏️  Edit mode

```html
<button class="edit-btn" id="edit-mode-btn" type="button">✏️ 修正モード OFF</button>
<button class="edit-pending-btn" id="edit-pending-btn" type="button" hidden>
  📤 修正案を送信 (<span id="edit-pending-count">0</span>件)
</button>
```

### 📤  Edit submission panel

```html
<div class="edit-panel" id="edit-panel" hidden>
  <div class="edit-panel-backdrop" id="edit-panel-backdrop"></div>
  <div class="edit-panel-content">
    <button class="edit-panel-close" id="edit-panel-close" type="button">×</button>
    <h2 id="edit-panel-title">📤 修正案を送信</h2>
    <p id="edit-panel-summary"></p>
    <div class="edit-panel-actions">
      <!-- Pick which submission methods to expose: -->
      <button type="button" id="edit-submit-download" class="edit-submit-btn primary">💾 .md ファイルで保存</button>
      <button type="button" id="edit-submit-github" class="edit-submit-btn">🐙 GitHub Issue として送信</button>
      <button type="button" id="edit-submit-copy" class="edit-submit-btn">📋 クリップボードコピー</button>
    </div>
    <p class="edit-panel-hint" id="edit-panel-hint"></p>
    <details class="edit-preview">
      <summary id="edit-preview-summary">提出内容プレビュー</summary>
      <pre id="edit-preview-text"></pre>
    </details>
    <div class="edit-panel-danger">
      <button type="button" id="edit-clear-all" class="edit-clear-btn">🗑 すべての編集を破棄</button>
    </div>
    <p class="edit-panel-note" id="edit-panel-note"></p>
  </div>
</div>
```

You can omit individual submission buttons (e.g. drop `#edit-submit-download`
to disable the .md path for a particular event).

### 🗺  Map (basic)

```html
<section class="map-section">
  <h2 id="map-section-title">会場マップ</h2>
  <img id="venue-map" src="map.jpg" alt="会場マップ" class="venue-map">
  <p class="map-caption" id="map-caption"></p>
</section>
```

### 🔍  Map zoom + booth-highlight overlay

Wrap the `<img>` in a viewport + add the SVG overlay:

```html
<section class="map-section">
  <h2 id="map-section-title">会場マップ</h2>
  <div class="map-zoom-viewport" id="map-zoom-viewport">
    <div class="map-overlay-wrap">
      <img id="venue-map" src="map.jpg" alt="会場マップ" class="venue-map">
      <svg id="venue-map-overlay" class="venue-map-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
    </div>
    <button class="map-zoom-reset" id="map-zoom-reset" type="button" aria-label="ズーム リセット" hidden>↺</button>
    <span class="map-zoom-hint" id="map-zoom-hint">🔍 ピンチ / Ctrl+ホイール で拡大</span>
  </div>
  <p class="map-caption" id="map-caption"></p>
</section>
```

Requires `<slug>/coords.js` for booth-marker placement on the overlay.

### ⛶  Map fullscreen button

Add inside the `.map-zoom-viewport`:

```html
<button class="map-fullscreen-btn" id="map-fullscreen-btn" type="button" aria-label="全画面 / Fullscreen">⛶</button>
```

### 🔎  Search + filters

```html
<section class="filter-section" id="filter-section">
  <div class="filters">
    <div class="search-wrap">
      <input type="search" id="search-input" placeholder="サークル名 / 作家 / SNS / ブース ID 検索..." class="search-input">
      <button type="button" id="search-clear" class="search-clear" hidden>×</button>
      <button type="button" id="filter-collapse-btn" class="filter-collapse-btn" aria-pressed="false">▼ 篩選</button>
    </div>
  </div>
  <div class="filter-rows-wrap" id="filter-rows-wrap">
    <!-- Each filter row activates only when its container is present.
         You can include only the ones your event's filters.js defines. -->
    <div class="filters filters-cp" id="filters-cp">
      <span class="filter-row-label" id="filter-cp-label">CP</span>
      <button class="filter-btn active" id="filter-all-btn" data-filter="all">全部</button>
    </div>
    <div class="filters filters-work" id="filters-work">
      <span class="filter-row-label" id="filter-work-label">作品</span>
    </div>
    <div class="filters filters-medium" id="filters-medium">
      <span class="filter-row-label" id="filter-medium-label">媒介</span>
    </div>
    <div class="filters filters-tag" id="filters-tag">
      <span class="filter-row-label" id="filter-tag-label">タグ</span>
      <button class="filter-btn" id="filter-fav-btn" data-filter="fav">⭐ お気に入り</button>
    </div>
    <div class="filters filters-area" id="filters-area">
      <span class="filter-row-label" id="filter-area-label">専區</span>
    </div>
  </div>
  <div class="filter-stats" id="filter-stats"></div>
</section>
```

Drop any of the filter rows (`filters-work`, `filters-medium`, `filters-area`)
if your event doesn't need them — they'll skip silently.

**Auto-hide**: if your event's `filters.js` has an empty / undefined
`cps` / `works` / `mediums` / `tags` / `areas` list, the corresponding row
auto-hides at render time even if the DOM is present. So you can keep all 5
rows in the shared `_index_template.html` and let each event's `filters.js`
decide which rows show. The `⭐ お気に入り` button lives in `filters-tag`,
so events that need favorites should keep at least one entry in `tags`.

### 🪧  Booth grid

```html
<section class="booths-section" id="booths-section"></section>
```

Per-row grids are generated at runtime from `EVENT_CONFIG.rows`.

### 🔎  Booth detail modal

```html
<div class="modal" id="modal" hidden role="dialog">
  <div class="modal-backdrop" id="modal-backdrop"></div>
  <div class="modal-content"><div id="modal-body"></div></div>
  <button class="modal-close" id="modal-close" type="button" onclick="...">×</button>
</div>
```

### ↑  Back-to-top

```html
<button class="back-to-top" id="back-to-top" type="button" hidden>↑</button>
```

### 💛  Community credit line

```html
<p class="community-credit" id="community-credit"></p>
```

Populated when `EVENT_CONFIG.community_catalog_url` is set (links to a
community catalog / spreadsheet). **Omit this `<p>` entirely** if your event
has no community resource — leaving the empty element renders an empty
dashed-border box under the disclaimer.

### 📜  Footer

```html
<footer id="event-footer"></footer>
```

---

## When you need event-specific behaviour beyond DOM presence

For genuinely one-off features (e.g. a leaderboard for one specific event),
write a small inline `<script>` in that event's `index.html` after `app.js`:

```html
<script src="../app.js?v=..."></script>
<script>
  // Event-specific extension — runs after shared shell
  document.addEventListener('DOMContentLoaded', () => {
    // your custom code here
  });
</script>
```

This keeps the shared `app.js` clean of one-off code while letting individual
events extend behaviour without forking.
