/**
 * Event-guide template — runtime logic.
 *
 * Reads three globals injected by other scripts:
 *   - window.EVENT_CONFIG  (event.js)    — event metadata + UI labels
 *   - window.FILTERS_CONFIG (filters.js) — CP / tag / warning filter definitions
 *   - window.BOOTHS         (data.js)    — booth array
 *
 * Render flow:
 *   1. Apply EVENT_CONFIG to <head> meta + header / footer / manifest links
 *   2. Generate filter buttons from FILTERS_CONFIG.cps and .tags
 *   3. Generate per-row booth grids based on EVENT_CONFIG.rows
 *   4. Render each booth card, with computed cps/tags/warnings already on the data
 */
(function() {
  const EVENT = window.EVENT_CONFIG || {};
  // Merge the shared base vocabulary (`_filters_base.js` at repo root,
  // loaded before this per-event file) with the per-event FILTERS_CONFIG.
  // Per openspec change formalize-filter-system (2026-06-07):
  //   - tags + warnings have universal base entries; per-event can add
  //     or override entries with the same `code` (override wins)
  //   - cps / works / mediums / areas stay per-event-only
  //   - if _filters_base.js isn't loaded (legacy / standalone), this
  //     reduces to the old behavior
  const FILTERS = (function mergeFilters() {
    const base = window.FILTERS_BASE || { tags: [], warnings: [] };
    const ev   = window.FILTERS_CONFIG || { cps: [], tags: [], warnings: [] };
    const mergeAxis = (a, b) => {
      const byCode = new Map();
      (a || []).forEach(e => byCode.set(e.code, e));
      (b || []).forEach(e => byCode.set(e.code, e));   // per-event overrides
      return [...byCode.values()];
    };
    return {
      cps:      ev.cps      || [],
      tags:     mergeAxis(base.tags, ev.tags),
      works:    ev.works    || [],
      mediums:  ev.mediums  || [],
      areas:    ev.areas    || [],
      warnings: mergeAxis(base.warnings, ev.warnings),
    };
  })();

  // ---- i18n lookup ----
  // EVENT.language picks the language dict from window.I18N_STRINGS.
  // Missing keys fall back to 'ja' (the original language of this template).
  const I18N = window.I18N_STRINGS || { ja: {}, 'zh-tw': {} };
  const LANG = (EVENT.language && I18N[EVENT.language]) ? EVENT.language : 'ja';
  function T(id, params) {
    const dict = I18N[LANG] || {};
    const fallback = I18N.ja || {};
    let s = (dict[id] != null) ? dict[id] : (fallback[id] != null ? fallback[id] : id);
    if (params) {
      for (const k in params) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
      }
    }
    return s;
  }
  // Set <html lang="..."> to match
  try { document.documentElement.setAttribute('lang', LANG); } catch (e) {}

  // Currency symbol from event config (default ¥, can be NT$, $, etc.)
  const CURRENCY = EVENT.currency_symbol || '¥';

  // Build lookup maps from filter config (replaces old hardcoded CP_ICON / TAG_ICON)
  const CP_ICON = {};
  (FILTERS.cps || []).forEach(c => { CP_ICON[c.code] = c.icon; });
  const TAG_ICON = {};
  (FILTERS.tags || []).forEach(t => { TAG_ICON[t.code] = t.icon; });

  // Booth-row prefixes (e.g. ['A', 'B', 'C'])
  const ROWS = EVENT.rows && EVENT.rows.length ? EVENT.rows : ['A', 'B', 'C'];

  // ---- Apply event metadata to page chrome ----
  function applyEventMetadata() {
    if (EVENT.name) document.title = EVENT.name + T('page_title_suffix');
    const h1 = document.getElementById('event-title');
    if (h1) h1.textContent = '🌙 ' + (EVENT.name || T('event_fallback_name'));
    const info = document.getElementById('event-info');
    if (info) {
      info.innerHTML = '';
      if (EVENT.date_display) {
        info.appendChild(el('strong', null, EVENT.date_display));
        info.appendChild(document.createTextNode(T('info_separator')));
        if (EVENT.venue) {
          const mapUrl = EVENT.venue_map_url ||
            ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(EVENT.venue));
          info.appendChild(el('a', {
            href: mapUrl, target: '_blank', rel: 'noopener', class: 'event-venue-link',
            title: '📍 Google マップで開く',
          }, '📍 ' + EVENT.venue));
        }
      }
      if (EVENT.entry_info) {
        info.appendChild(el('br'));
        info.appendChild(document.createTextNode(EVENT.entry_info));
      }
    }
    const disc = document.getElementById('event-disclaimer');
    if (disc && EVENT.official_url) {
      disc.innerHTML = T('disclaimer_html_prefix') +
        `<a href="${escapeAttr(EVENT.official_url)}" target="_blank" rel="noopener">${escapeHtml(EVENT.official_label || EVENT.name)}</a>` +
        T('disclaimer_html_suffix');
    }
    const credit = document.getElementById('community-credit');
    if (credit) {
      if (EVENT.community_catalog_url) {
        credit.innerHTML = T('community_credit_html_prefix') +
          `<a href="${escapeAttr(EVENT.community_catalog_url)}" target="_blank" rel="noopener">${escapeHtml(T('community_credit_html_link_label'))}</a>` +
          T('community_credit_html_suffix');
      } else {
        // No community catalog declared for this event → drop the
        // template element entirely so it doesn't occupy header space
        // as an empty block (the .community-credit:empty CSS rule below
        // also handles the pre-JS paint, but removing makes the DOM
        // honest).
        credit.remove();
      }
    }
    const mapSection = document.querySelector('.map-section');
    if (EVENT.map_image) {
      const m = document.getElementById('venue-map');
      if (m) {
        // Preserve any ?v=... cache-bust query the template injected on
        // the original src — otherwise overwriting m.src to a bare
        // "map.jpg" strips it and the browser keeps serving an older
        // cached image on every later deploy of just the map file.
        const prev = new URL(m.src, location.href);
        const next = new URL(EVENT.map_image, location.href);
        if (!next.search && prev.search) next.search = prev.search;
        m.src = next.pathname + next.search;
        // Escape hatch: if the map fails to load AND a SW is controlling
        // this page, it's almost always because the SW (or its predecessor)
        // cached a 404 from a previous deploy window. Hard-reset by
        // unregistering all SWs + dropping all caches + reloading once.
        // sessionStorage guard prevents infinite reload.
        m.addEventListener('error', () => doMapStuckHardReset(), { once: true });
      }
    } else if (mapSection) {
      // No map image configured — hide the section entirely so we don't
      // 404 on the default map.jpg src.
      mapSection.hidden = true;
    }
    const cap = document.getElementById('map-caption');
    if (cap) cap.textContent = EVENT.map_caption || '';

    // Update OG / Twitter meta
    const ogTitle = (EVENT.name || T('event_fallback_name')) + T('og_title_suffix');
    setMeta('og:title', ogTitle);
    setMeta('og:description', EVENT.og_description || '');
    setMeta('og:image', EVENT.og_image || 'og.png');
    setMeta('twitter:title', ogTitle);
    setMeta('twitter:description', EVENT.og_description || '');
    setMeta('twitter:image', EVENT.og_image || 'og.png');
    // theme-color
    if (EVENT.theme_color) {
      let tc = document.querySelector('meta[name="theme-color"]');
      if (!tc) {
        tc = document.createElement('meta');
        tc.setAttribute('name', 'theme-color');
        document.head.appendChild(tc);
      }
      tc.setAttribute('content', EVENT.theme_color);
    }

    // Footer
    const footer = document.getElementById('event-footer');
    if (footer) {
      const built = EVENT.built_by_label
        ? T('footer_built_by_html', { url: escapeAttr(EVENT.built_by_url || '#'), label: escapeHtml(EVENT.built_by_label) }) +
          (EVENT.build_date ? T('footer_build_date', { date: escapeHtml(EVENT.build_date) }) : '')
        : '';
      const repo = EVENT.github_repo
        ? T('footer_repo_html', { url: escapeAttr(EVENT.github_repo) })
        : '';
      const eventName = escapeHtml(EVENT.name || T('event_fallback_name'));
      footer.innerHTML =
        '<p>' + T('footer_intro_html', { eventName, guideLabel: T('footer_guide_label') }) +
        T('footer_source_line') +
        built + '</p>' +
        '<p class="footer-meta">' + repo + (EVENT.attribution_line ? escapeHtml(EVENT.attribution_line) : '') + '</p>';
    }
  }

  function setMeta(prop, content) {
    let m = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
    if (m && content) m.setAttribute('content', content);
  }

  // Emergency reset for the "SW cached a 404 and won't let go" case.
  // Triggered when venue-map img fires `error`. Only runs once per session.
  function doMapStuckHardReset() {
    if (sessionStorage.getItem('sw-hard-reset') === '1') return;
    sessionStorage.setItem('sw-hard-reset', '1');
    const cleanup = [];
    if ('serviceWorker' in navigator) {
      cleanup.push(navigator.serviceWorker.getRegistrations()
        .then(regs => Promise.all(regs.map(r => r.unregister())))
        .catch(() => {}));
    }
    if (window.caches) {
      cleanup.push(caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .catch(() => {}));
    }
    Promise.all(cleanup).then(() => location.reload());
  }

  // Apply T() to static UI elements baked into index.html (button text, aria,
  // placeholders, alt text). The HTML defaults are JP fallbacks for first
  // paint / no-JS crawlers; this overwrites them with the EVENT.language dict.
  // Skips edit-mode-btn / offline-btn since their own IIFE init writes the
  // toggle-state-aware text right after this runs.
  function applyStaticI18n() {
    const spec = {
      'share-btn':           { text: 'share_btn' },
      'edit-pending-btn':    { html: 'edit_pending_btn_html' },
      'edit-panel-close':    { aria: 'edit_panel_close_aria' },
      'edit-panel-title':    { text: 'edit_panel_title' },
      'edit-preview-summary':{ text: 'edit_panel_preview_summary' },
      'edit-panel-note':     { text: 'edit_panel_note' },
      'edit-clear-all':      { text: 'edit_clear_all_btn' },
      'edit-submit-download':{ text: 'edit_submit_download' },
      'edit-submit-github':  { text: 'edit_submit_github' },
      'edit-submit-copy':    { text: 'edit_submit_copy' },
      'map-section-title':   { text: 'map_section_title' },
      'venue-map':           { alt: 'venue_map_alt' },
      'search-input':        { placeholder: 'search_placeholder' },
      'search-clear':        { aria: 'search_clear_aria' },
      'filter-cp-label':     { text: 'filter_cp_label' },
      'filter-tag-label':    { text: 'filter_tag_label' },
      'filter-all-btn':      { text: 'filter_all' },
      'filter-fav-btn':      { text: 'filter_fav', title: 'filter_fav_title' },
      'back-to-top':         { aria: 'back_to_top_aria' },
      'modal-close':         { aria: 'modal_close_aria' },
    };
    for (const id in spec) {
      const el = document.getElementById(id);
      if (!el) continue;
      const s = spec[id];
      if (s.text)        el.textContent = T(s.text);
      if (s.html)        el.innerHTML   = T(s.html);
      if (s.aria)        el.setAttribute('aria-label', T(s.aria));
      if (s.title)       el.setAttribute('title',      T(s.title));
      if (s.alt)         el.setAttribute('alt',        T(s.alt));
      if (s.placeholder) el.setAttribute('placeholder', T(s.placeholder));
    }
  }

  // Map each booth-tag code to the FILTERS_CONFIG category it belongs to
  // so renderCard can emit `work:` / `medium:` / `tag:` prefixes correctly.
  const TAG_CATEGORY = {};
  (FILTERS.works || []).forEach(w => { TAG_CATEGORY[w.code] = 'work'; });
  (FILTERS.mediums || []).forEach(m => { TAG_CATEGORY[m.code] = 'medium'; });
  (FILTERS.tags || []).forEach(t => { TAG_CATEGORY[t.code] = 'tag'; });

  // ---- Build filter UI from FILTERS_CONFIG ----
  function buildFilterButtons() {
    function paintRow(rowId, items, tokenPrefix) {
      const row = document.getElementById(rowId);
      if (!row) return;
      // Hide the entire row when this event's filters.js doesn't define
      // anything for this category. Lets one shared shell serve events that
      // only need cps+tags (small fandoms) and events that use the full
      // cps+works+mediums+tags+areas (large multi-fandom guides).
      if (!items || !items.length) {
        row.hidden = true;
        return;
      }
      items.forEach(it => {
        const btn = el('button', {
          class: 'filter-btn',
          'data-filter': tokenPrefix + ':' + it.code,
          title: it.title || it.label,
        }, `${it.icon} ${it.label}`);
        row.appendChild(btn);
      });
    }
    paintRow('filters-cp', FILTERS.cps, 'cp');
    paintRow('filters-work', FILTERS.works, 'work');
    paintRow('filters-medium', FILTERS.mediums, 'medium');
    paintRow('filters-tag', FILTERS.tags, 'tag');
    paintRow('filters-area', FILTERS.areas, 'area');
  }

  // ---- Build per-row booth grid containers ----
  function buildBoothGrids() {
    const section = document.getElementById('booths-section');
    if (!section) return;
    ROWS.forEach(row => {
      const h = el('h2', { class: 'row-title', 'data-row': row }, T('row_label', { row }));
      section.appendChild(h);
      section.appendChild(el('div', { class: 'booth-grid', id: 'grid-' + row }));
    });
  }

  // Hide row-title h2 when every card in the next-sibling .booth-grid is
  // display:none (i.e. nothing matches the current filter). Re-run after
  // each applyFilters() pass.
  function syncRowTitleVisibility() {
    document.querySelectorAll('.row-title').forEach(h => {
      const grid = h.nextElementSibling;
      if (!grid || !grid.classList.contains('booth-grid')) return;
      const anyVisible = Array.from(grid.querySelectorAll('.booth-card'))
        .some(c => c.style.display !== 'none');
      h.style.display = anyVisible ? '' : 'none';
    });
  }

  // Hide filter chips that wouldn't reveal any booth from the current view.
  // Within a category the chips OR together, so adding a chip in an active
  // category only widens — we hide it when its added booths × the other
  // categories' AND constraints + the search query yield zero. Across
  // categories the chips AND together, so adding one in a new category
  // narrows from the current set; we hide it when no currently-visible
  // booth has the chip's token. Already-active chips and the universal
  // "all" / "fav" controls always stay visible so the user can untoggle.
  function syncChipVisibility() {
    const groups = groupActiveFilters();
    const allCards = Array.from(document.querySelectorAll('.booth-card'));
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      const token = btn.dataset.filter;
      if (token === 'all' || token === 'fav') return;          // always visible
      if (activeFilters.has(token)) { btn.style.display = ''; return; }
      const idx = token.indexOf(':');
      const cat = idx >= 0 ? token.slice(0, idx) : token;
      const otherCats = Object.keys(groups).filter(c => c !== cat);
      const reachable = allCards.some(card => {
        const tokens = (card.dataset.filters || '').split(',');
        if (!tokens.includes(token)) return false;
        for (const c of otherCats) {
          if (!groups[c].some(f => tokens.includes(f))) return false;
        }
        const cardSearch = card.dataset.search || '';
        if (currentSearch && !cardSearch.includes(currentSearch)) return false;
        return true;
      });
      btn.style.display = reachable ? '' : 'none';
    });
  }

  // ---- Favorites in localStorage ----
  const FAV_KEY = EVENT.favorites_key || 'event-guide-template-favs';
  function loadFavs() {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveFavs(favs) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favs))); }
    catch (e) {}
  }
  const favs = loadFavs();

  // Hydrate booths with circle + author data (B-big-1 schema, 2026-06-02):
  // circles.js exports both CIRCLES_BY_ID and AUTHORS_BY_ID. Each circle has
  // members: [author_id]. Solo circle (most common) = 1 member. The first
  // member is the primary author whose name fills b.author for card display;
  // full member records (with socials) are stored in b.members for the
  // modal to render per-member identity groups.
  const CIRCLES_BY_ID = window.CIRCLES_BY_ID || {};
  const AUTHORS_BY_ID = window.AUTHORS_BY_ID || {};
  const booths = (window.BOOTHS || []).slice().map(b => {
    const c = CIRCLES_BY_ID[b.circle_id] || {};
    const memberIds = c.members || [];
    const memberAuthors = memberIds.map(id => AUTHORS_BY_ID[id]).filter(Boolean);
    const primaryAuthor = memberAuthors[0] || {};
    // 4-state name resolution: confirmed > inferred > circle_name > id.
    // primaryAuthor.name === confirmed; .name_inferred === guess (often
    // equals circle_name when the author is the brand).
    const displayAuthor = primaryAuthor.name
      || primaryAuthor.name_inferred
      || '';
    return Object.assign({
      circle_name: c.circle_name || '',
      circle_aliases: c.aliases || [],          // 別名 (多言語 / 旧名 / 略称)
      circle_socials: c.socials || [],          // 合同 SNS (per-circle, not per-author)
      author: displayAuthor,
      members: memberAuthors,                  // full author records — chips read from here
    }, b);
  }).sort((a, b) => a.booth_id.localeCompare(b.booth_id));

  // Compute warnings into [code, label, sourceUrl?] tuples at load time so
  // the render code can iterate uniformly. data.js stores warnings as
  // bare strings (e.g. "soldout") OR tuples (legacy). Lookup table comes
  // from FILTERS.warnings.
  //
  // Auto-detect from body via FILTERS.warnings[].pattern was removed
  // 2026-06-06 (howish): regex-on-body produced too many false positives
  // (forward-looking 完売 announcements / quoted phrases in unrelated
  // context). Warnings are now manual-only — populate per-booth in data.js
  // (or via 修正モード in the browser) to add a chip.
  (function computeBoothWarnings() {
    const warningDefs = (FILTERS.warnings || []);
    const byCode = {};
    warningDefs.forEach(w => { byCode[w.code] = w; });
    for (const b of booths) {
      const existing = b.warnings || [];
      const out = [];
      const seen = new Set();
      for (const w of existing) {
        if (Array.isArray(w)) {
          // legacy tuple — pass through (may carry sourceUrl as w[2])
          const code = w[0];
          if (!seen.has(code)) { seen.add(code); out.push(w); }
        } else if (typeof w === 'string') {
          const def = byCode[w];
          if (def && !seen.has(w)) {
            seen.add(w);
            out.push([w, def.label]);
          }
        }
      }
      b.warnings = out;
    }
  })();

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      });
    }
    return e;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function renderCard(b) {
    const cps = b.cps || [];
    const tags = b.tags || {};
    const works = b.works || [];  // post formalize-filter-system axis-migration
    const activeTags = Object.keys(tags).filter(k => tags[k]);
    const filterTokens = [
      ...cps.map(c => 'cp:' + c),
      ...works.map(w => 'work:' + w),
      ...activeTags.map(t => (TAG_CATEGORY[t] || 'tag') + ':' + t),
    ];
    if (b.area) filterTokens.push('area:' + b.area);
    const isFav = favs.has(b.booth_id);
    const card = el('div', {
      class: 'booth-card' + (isFav ? ' favored' : ''),
      id: 'booth-' + b.booth_id.toLowerCase(),
      'data-booth-id': b.booth_id,
      'data-filters': filterTokens.join(',') + (isFav ? ',fav' : ''),
      'data-search': [b.booth_id, b.circle_name, b.author,
        ...(b.members || []).flatMap(m => [m.name, ...(m.aliases || []),
                                            ...(m.socials || []).map(s => s.url)])
      ].filter(Boolean).join(' ').toLowerCase(),
      role: 'button',
      tabindex: '0',
      'aria-label': T('card_aria', { boothId: b.booth_id, circle: b.circle_name || '', author: b.author || '' })
    });
    const star = el('button', {
      type: 'button',
      class: 'fav-star',
      title: T('fav_star_title'),
      'aria-label': T('fav_aria'),
      'aria-pressed': isFav ? 'true' : 'false',
    }, isFav ? '★' : '☆');
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = b.booth_id;
      if (favs.has(id)) {
        favs.delete(id);
        card.classList.remove('favored');
        star.textContent = '☆';
        star.setAttribute('aria-pressed', 'false');
        const tokens = (card.dataset.filters || '').split(',').filter(t => t !== 'fav');
        card.dataset.filters = tokens.join(',');
      } else {
        favs.add(id);
        card.classList.add('favored');
        star.textContent = '★';
        star.setAttribute('aria-pressed', 'true');
        const tokens = (card.dataset.filters || '').split(',');
        if (!tokens.includes('fav')) tokens.push('fav');
        card.dataset.filters = tokens.filter(Boolean).join(',');
      }
      saveFavs(favs);
      applyFilters();
    });
    card.appendChild(star);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(b);
      }
    });
    const tagBar = el('div', { class: 'booth-tags' });
    cps.forEach(c => {
      if (CP_ICON[c]) tagBar.appendChild(el('span', { class: 'tag', title: c }, CP_ICON[c]));
    });
    activeTags.forEach(t => {
      if (TAG_ICON[t]) tagBar.appendChild(el('span', { class: 'tag', title: t }, TAG_ICON[t]));
    });
    card.appendChild(tagBar);
    card.appendChild(el('div', { class: 'booth-id' }, b.booth_id));
    if (b.circle_name) {
      card.appendChild(el('div', { class: 'booth-name' }, b.circle_name));
    }
    if (b.author && b.author !== b.circle_name) {
      card.appendChild(el('div', { class: 'booth-author' }, b.author));
    }
    if (b.min_price) {
      card.appendChild(el('div', { class: 'booth-price' }, T('price_template', { n: b.min_price.toLocaleString() })));
    }
    if (b.warnings && b.warnings.length) {
      const wBar = el('div', { class: 'booth-warnings' });
      // Card-level warnings stay as non-clickable spans (taps go to modal)
      b.warnings.forEach(([code, label]) => {
        wBar.appendChild(el('span', { class: 'booth-warning warn-' + code }, label));
      });
      card.appendChild(wBar);
    }
    card.addEventListener('click', () => openModal(b));
    return card;
  }

  // Detect the social platform of an outbound URL — returns an i18n source key
  // (modal_source_* lookup). Used to label the "Open in {platform}" modal button.
  function detectSourceType(url) {
    if (!url) return 'generic';
    if (/(?:^|\/\/)(?:www\.)?(?:x\.com|twitter\.com)\//.test(url)) return 'x';
    if (/plurk\.com\//.test(url)) return 'plurk';
    if (/(?:^|\/\/)(?:www\.)?(?:facebook\.com|fb\.com|m\.facebook\.com|fb\.me)\//.test(url)) return 'fb';
    if (/(?:^|\/\/)(?:www\.)?instagram\.com\//.test(url)) return 'ig';
    if (/(?:^|\/\/)(?:www\.)?threads\.(?:com|net)\//.test(url)) return 'threads';
    if (/doujin\.com\.tw\//.test(url)) return 'doujin_tw';
    if (/(?:lit\.link|linktr\.ee|portaly\.cc)\//.test(url)) return 'aggregator';
    if (/pixiv\.net\//.test(url)) return 'pixiv';
    if (/bsky\.app\//.test(url)) return 'bsky';
    if (/booth\.pm\//.test(url)) return 'booth_pm';
    if (/marshmallow-qa\.com\//.test(url)) return 'marshmallow';
    if (/patreon\.com\//.test(url)) return 'patreon';
    if (/(?:home\.gamer\.com\.tw|gamer\.com\.tw|bahamut)\//.test(url)) return 'gamer';
    if (/wixsite\.com|wix\.com/.test(url)) return 'wix';
    if (/blog/.test(url)) return 'blog';
    return 'generic';
  }

  // Platform icon — real brand mark (Simple Icons SVG path) when known,
  // emoji fallback otherwise. Returns a Node, not a string (callers
  // appendChild directly).
  function platformIcon(platform) {
    return window.platformIconNode
      ? window.platformIconNode(platform)
      : document.createTextNode('🔗');
  }

  function mdToHtml(md) {
    let s = escapeHtml(md);
    // Block-level transforms first (need raw line-start ^)
    // Headings — ATX-style, h4 first to avoid #### being matched by ##
    s = s.replace(/^####\s+(.+)$/gm, '<h5>$1</h5>');
    s = s.replace(/^###\s+(.+)$/gm, '<h4>$1</h4>');
    s = s.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');
    // Blockquote (single-line, treat each `> ` line independently)
    s = s.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    // Unordered list items — collect consecutive `- ` lines into a single <ul>
    s = s.replace(/(?:^- .+(?:\n|$))+/gm, (match) => {
      const items = match.trimEnd().split('\n').map(line => '<li>' + line.replace(/^- /, '') + '</li>').join('');
      return '<ul>' + items + '</ul>';
    });
    // Inline transforms
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[\[(.+?)\]\]/g, '<em>$1</em>');
    // [text](url) markdown links — must run before the bare-URL auto-link below
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/(?<!["'>])(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  let currentBoothIdx = -1;

  function navigateBooth(direction) {
    const visible = booths.filter(b => {
      const card = document.getElementById('booth-' + b.booth_id.toLowerCase());
      return card && card.style.display !== 'none';
    });
    if (visible.length === 0) return;
    let idx = visible.findIndex(b => b.booth_id === booths[currentBoothIdx]?.booth_id);
    if (idx === -1) idx = 0;
    const newIdx = (idx + direction + visible.length) % visible.length;
    openModal(visible[newIdx]);
  }

  function openModal(b) {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    currentBoothIdx = booths.findIndex(x => x.booth_id === b.booth_id);
    try { history.replaceState(null, '', '#' + b.booth_id); } catch (e) {}

    const navBar = el('div', { class: 'modal-nav' });
    const prevBtn = el('button', {
      type: 'button', class: 'modal-nav-btn',
      'aria-label': T('modal_prev_label'), title: T('modal_prev_title'),
    }, T('modal_prev_btn'));
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateBooth(-1); });
    const nextBtn = el('button', {
      type: 'button', class: 'modal-nav-btn',
      'aria-label': T('modal_next_label'), title: T('modal_next_title'),
    }, T('modal_next_btn'));
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateBooth(1); });
    navBar.appendChild(prevBtn);
    navBar.appendChild(nextBtn);
    body.appendChild(navBar);

    {
      const h3 = el('h3', null, `${b.booth_id} ${b.circle_name || ''}`);
      // Surface circle aliases inline (多言語 / 旧名 / 略称) as small dim text
      if (Array.isArray(b.circle_aliases) && b.circle_aliases.length) {
        h3.appendChild(el('span', { class: 'modal-circle-aliases' },
          ' (' + b.circle_aliases.join(' / ') + ')'));
      }
      body.appendChild(h3);
    }

    const meta = el('div', { class: 'modal-meta' });
    if (b.followers != null) {
      meta.appendChild(el('span', null, T('modal_followers', { n: b.followers.toLocaleString() })));
    }
    // Per-member identity group: name + that member's SNS chips together.
    // Replaces the older "author chip + separate SNS chips" split — that
    // split caused redundancy (author chip linked to X, X SNS chip linked
    // to same X). 4-state name resolution applies: confirmed > inferred.
    // Skip the name span when it just repeats circle_name (h3 already
    // shows it) — chips still render under the (anonymous) group.
    const seenSocialUrls = new Set();
    function normSocialUrl(u) {
      if (!u) return '';
      return u
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[?#].*$/, '')         // strip query string + fragment — many
                                        // catalog imports have ?s=21, &utm=,
                                        // ?igsh= etc. tacked on the same profile
        .replace(/\/+$/, '')
        .toLowerCase();
    }
    function extractHandleFromUrl(url) {
      if (!url) return '';
      const patterns = window.PROFILE_PATTERNS || [];
      for (const {regex, fmt} of patterns) {
        const m = url.match(new RegExp(regex));
        if (m && m.groups && m.groups.handle) {
          return fmt.replace('{}', m.groups.handle);
        }
      }
      const hostMatch = url.match(/^https?:\/\/([^\/]+)/);
      return hostMatch ? hostMatch[1].replace(/^www\./, '') : url;
    }
    // Circle-level socials (合同 SNS) — render BEFORE per-member groups so
    // the joint identity reads first. Counts toward seenSocialUrls dedup.
    // No "🎪 合同" label per howish 2026-06-06 — chip styling alone reads as
    // the joint identity; the textual label was redundant.
    if (Array.isArray(b.circle_socials) && b.circle_socials.length) {
      const cGroup = el('div', { class: 'author-group circle-group' });
      for (const s of b.circle_socials) {
        if (!s || !s.url) continue;
        const platform = s.platform || detectSourceType(s.url);
        const norm = normSocialUrl(s.url);
        if (!norm || seenSocialUrls.has(norm)) continue;
        seenSocialUrls.add(norm);
        const handle = extractHandleFromUrl(s.url);
        const platLabel = T('modal_source_' + platform);
        cGroup.appendChild(el('a', {
          href: s.url, target: '_blank', rel: 'noopener',
          class: 'social-chip social-chip-' + platform,
          title: handle ? `${platLabel} — ${handle}` : platLabel,
        }, platformIcon(platform)));
      }
      if (cGroup.children.length > 0) meta.appendChild(cGroup);
    }
    const memberRecords = Array.isArray(b.members) && b.members.length
      ? b.members
      : (b.author ? [{name: b.author}] : []);
    memberRecords.forEach(m => {
      const group = el('div', { class: 'author-group' });
      const confirmedName = m.name || '';
      const inferredName = m.name_inferred || '';
      const displayName = confirmedName || inferredName;
      const isInferred = !confirmedName && !!inferredName;
      // Name span — only when it adds info beyond the h3 circle_name.
      if (displayName && displayName !== b.circle_name) {
        const aliases = (m.aliases || []).filter(Boolean);
        const fullName = aliases.length
          ? `${displayName} (${aliases.join(' / ')})`
          : displayName;
        group.appendChild(el('span', {
          class: 'author-name' + (isInferred ? ' inferred' : ''),
          title: aliases.length ? `別名: ${aliases.join(', ')}` : '',
        }, fullName));
      }
      // SNS chips for THIS member's socials — icon-only (handle goes in
      // tooltip). Name is already shown by the .author-name span (or by
      // the h3 when it == circle_name), so chips just mark "they're on X".
      // Global dedupe across members so a co-owned URL doesn't double-render.
      for (const s of (m.socials || [])) {
        if (!s || !s.url) continue;
        const platform = s.platform || detectSourceType(s.url);
        const norm = normSocialUrl(s.url);
        if (!norm || seenSocialUrls.has(norm)) continue;
        seenSocialUrls.add(norm);
        const handle = extractHandleFromUrl(s.url);
        const platLabel = T('modal_source_' + platform);
        group.appendChild(el('a', {
          href: s.url, target: '_blank', rel: 'noopener',
          class: 'social-chip social-chip-' + platform,
          title: handle ? `${platLabel} — ${handle}` : platLabel,
        }, platformIcon(platform)));
      }
      if (group.children.length) meta.appendChild(group);
    });
    // Phase B-small (2026-06-02): 寄攤 / 委託 partners — chip styling alone
    // differentiates from primary author. Schema accepts either bare strings
    // (legacy X-only) or {platform, handle, name?} objects (multi-platform).
    if (Array.isArray(b.consignment_partners) && b.consignment_partners.length) {
      const PLATFORM_URL_PREFIX = {
        x: 'https://x.com/',
        threads: 'https://www.threads.com/@',
        plurk: 'https://www.plurk.com/',
        bsky: 'https://bsky.app/profile/',
        pixiv: 'https://www.pixiv.net/users/',
        fb: 'https://www.facebook.com/',
        ig: 'https://www.instagram.com/',
      };
      b.consignment_partners.forEach(entry => {
        let platform = 'x';
        let handle = '';
        let name = '';
        if (typeof entry === 'string') {
          handle = entry.replace(/^@/, '');
        } else if (entry && typeof entry === 'object') {
          platform = entry.platform || 'x';
          handle = String(entry.handle || '').replace(/^@/, '');
          name = entry.name || '';
        }
        if (!handle) return;
        // Name fallback: explicit > CIRCLES_BY_ID lookup (X handles only) > none
        if (!name && platform === 'x') {
          const c = CIRCLES_BY_ID[handle.toLowerCase()];
          if (c && c.circle_name) name = c.circle_name;
        }
        const platLabel = platform === 'x' ? '@' + handle :
                          platform + ':' + handle;
        const label = name ? `${name} ${platLabel}` : platLabel;
        const prefix = PLATFORM_URL_PREFIX[platform] || 'https://x.com/';
        meta.appendChild(el('a', {
          href: prefix + handle, target: '_blank', rel: 'noopener',
          class: 'author-chip consignment',
          title: T('modal_consignment_title') || '寄攤 / 委託 partner',
        }, label));
      });
    }
    const isFavNow = favs.has(b.booth_id);
    const modalFav = el('button', {
      type: 'button',
      class: 'modal-fav' + (isFavNow ? ' favored' : ''),
      'aria-pressed': isFavNow ? 'true' : 'false',
      'aria-label': T('fav_aria'),
    }, isFavNow ? T('modal_fav_on') : T('modal_fav_off'));
    modalFav.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = b.booth_id;
      const card = document.getElementById('booth-' + id.toLowerCase());
      const cardStar = card ? card.querySelector('.fav-star') : null;
      if (favs.has(id)) {
        favs.delete(id);
        modalFav.classList.remove('favored');
        modalFav.textContent = T('modal_fav_off');
        modalFav.setAttribute('aria-pressed', 'false');
        if (card) {
          card.classList.remove('favored');
          card.dataset.filters = (card.dataset.filters || '').split(',').filter(t => t !== 'fav').join(',');
          if (cardStar) { cardStar.textContent = '☆'; cardStar.setAttribute('aria-pressed', 'false'); }
        }
      } else {
        favs.add(id);
        modalFav.classList.add('favored');
        modalFav.textContent = T('modal_fav_on');
        modalFav.setAttribute('aria-pressed', 'true');
        if (card) {
          card.classList.add('favored');
          const tokens = (card.dataset.filters || '').split(',').filter(Boolean);
          if (!tokens.includes('fav')) tokens.push('fav');
          card.dataset.filters = tokens.join(',');
          if (cardStar) { cardStar.textContent = '★'; cardStar.setAttribute('aria-pressed', 'true'); }
        }
      }
      saveFavs(favs);
      applyFilters();
    });
    meta.appendChild(modalFav);
    body.appendChild(meta);

    // Anthology books published by this booth's circle (B-big-2 schema,
    // 2026-06-02). Shows "発行合本: 『title』 (N contributors)" with each
    // book linking to a contributor breakdown popover (future) — for now
    // expandable <details> with the contributor list.
    const BOOKS_BY_CIRCLE = window.BOOKS_BY_CIRCLE || {};
    const AUTHORS_BY_ID2 = window.AUTHORS_BY_ID || {};
    const circleBooks = BOOKS_BY_CIRCLE[b.circle_id] || [];
    if (circleBooks.length) {
      const anthoSection = el('div', { class: 'modal-anthology' });
      anthoSection.appendChild(el('h4', { class: 'anthology-header' },
        T('modal_anthology_header') || '📚 発行合本 / Anthology'));
      circleBooks.forEach(bk => {
        const wrap = el('details', { class: 'anthology-book' });
        const summary = el('summary', null,
          `${bk.title}` +
          (bk.format ? ` — ${bk.format}` : '') +
          (bk.price ? ` / ${bk.currency || ''} ${bk.price}` : '') +
          ` · ${bk.contributors ? bk.contributors.length : 0} 作家`
        );
        wrap.appendChild(summary);
        if (bk.note) {
          wrap.appendChild(el('p', { class: 'anthology-note' }, bk.note));
        }
        if (bk.contributors && bk.contributors.length) {
          const ulist = el('div', { class: 'anthology-contributors' });
          bk.contributors.forEach(aid => {
            const a = AUTHORS_BY_ID2[aid];
            if (!a) return;
            const name = a.name || a.name_inferred || aid;
            const xSocial = (a.socials || []).find(s => s.platform === 'x');
            if (xSocial && xSocial.url) {
              ulist.appendChild(el('a', {
                href: xSocial.url, target: '_blank', rel: 'noopener',
                class: 'anthology-contributor-chip',
              }, name));
            } else {
              ulist.appendChild(el('span', { class: 'anthology-contributor-chip' }, name));
            }
          });
          wrap.appendChild(ulist);
        }
        anthoSection.appendChild(wrap);
      });
      body.appendChild(anthoSection);
    }

    // (Old "X で開く" / "Plurk で開く" big button removed — the social chips
    // above now expose the same link with platform-specific colour and
    // handle, so the standalone button was redundant.)

    // Warning chips inside the modal — each becomes a link to source tweet
    // when a 3rd-element URL is present in the warnings tuple.
    if (b.warnings && b.warnings.length) {
      const wRow = el('div', { class: 'modal-warnings' });
      b.warnings.forEach((w) => {
        const code = w[0], label = w[1], source = w[2];
        const cls = 'booth-warning warn-' + code;
        if (source) {
          wRow.appendChild(el('a', {
            class: cls + ' warn-link',
            href: source, target: '_blank', rel: 'noopener',
            title: T('modal_warn_source_title'),
          }, label));
        } else {
          wRow.appendChild(el('span', { class: cls }, label));
        }
      });
      body.appendChild(wRow);
    }

    const closeBottom = el('button', {
      type: 'button', class: 'modal-close-bottom', 'aria-label': T('modal_close_aria')
    }, T('modal_close_bottom'));
    closeBottom.addEventListener('click', closeModal);

    // Normalize cover_urls to [{source_url, display_url}, ...] shape.
    // Legacy data: array of strings OR singleton b.cover_url. Convert in-flight.
    const rawCovers = (b.cover_urls && b.cover_urls.length)
      ? b.cover_urls
      : (b.cover_url ? [b.cover_url] : []);
    const photos = rawCovers.map(p => (typeof p === 'string')
      ? { source_url: p, display_url: p }
      : { source_url: p.source_url || p.display_url, display_url: p.display_url || p.source_url });
    // Holder for the carousel area — populated below for view mode, and
    // re-rendered in edit mode whenever rowsState mutates so overlay
    // controls reflect pending order/deletion.
    const carouselHolder = el('div', { class: 'cover-carousel-holder' });
    body.appendChild(carouselHolder);
    function renderViewCarousel() {
      carouselHolder.textContent = '';
      if (!photos.length) return;
      const carousel = el('div', { class: 'cover-carousel' });
      photos.forEach((p, i) => {
        const display = p.display_url || p.source_url;
        const source  = p.source_url  || p.display_url;
        const thumbUrl = /\?name=/.test(display)
          ? display.replace(/\?name=[^&]+/, '?name=small')
          : (/pbs\.twimg\.com/.test(display) ? display + '?name=small' : display);
        const coverLink = el('a', {
          href: source, target: '_blank', rel: 'noopener',
          class: 'cover-link cover-slide',
          title: 'タップして source post を開く / Open source',
        });
        const img = el('img', {
          src: thumbUrl,
          alt: T('cover_img_alt', { i: i + 1, n: photos.length }),
          class: 'cover-img', loading: i === 0 ? 'eager' : 'lazy',
          referrerpolicy: 'no-referrer'
        });
        img.addEventListener('error', () => {
          const fallback = el('div', { class: 'cover-fallback' }, T('cover_load_failed'));
          coverLink.replaceChild(fallback, img);
        });
        coverLink.appendChild(img);
        carousel.appendChild(coverLink);
      });
      carouselHolder.appendChild(carousel);
      if (photos.length > 1) {
        carouselHolder.appendChild(el('p', { class: 'carousel-hint' }, T('carousel_hint', { n: photos.length })));
      }
    }
    // For view mode: render now. For edit mode: will be replaced below.
    renderViewCarousel();

    const bodyDiv = el('div', { class: 'modal-body-md' });
    if (editMode && editMode.isEnabled) {
      // Render as editable textareas in edit mode.
      // setPending merges so editing body doesn't wipe cover_urls and vice versa.
      const pending = editMode.getPending(b.booth_id);
      const currentText = (pending && pending.body !== undefined) ? pending.body : (b.body || '');
      // Editor: per-row UI (one card per cover). Each cover is normalized
      // to {source_url, display_url, display_locked} so we can drive both
      // input fields + the explicit lock toggle from one shape.
      const normalizeCover = (p) => typeof p === 'string'
        ? { source_url: p, display_url: p, display_locked: false }
        : { source_url: p.source_url || p.display_url || '',
            display_url: p.display_url || null,
            display_locked: !!p.display_locked };
      const currentCovers = (pending && pending.cover_urls !== undefined)
        ? pending.cover_urls.map(normalizeCover)
        : (b.cover_urls || (b.cover_url ? [b.cover_url] : [])).map(normalizeCover);

      // --- Body editor ---
      const editLabel = el('div', { class: 'edit-mode-banner' }, T('edit_mode_banner'));
      bodyDiv.appendChild(editLabel);
      const ta = el('textarea', { class: 'edit-body-textarea', rows: '14' });
      ta.value = currentText;
      bodyDiv.appendChild(ta);
      const actionRow = el('div', { class: 'edit-action-row' });
      const saveBtn = el('button', { type: 'button', class: 'edit-save-btn' }, T('edit_save_btn'));
      saveBtn.addEventListener('click', () => {
        const newBody = ta.value;
        const existing = editMode.getPending(b.booth_id) || {};
        if (newBody === (b.body || '')) {
          delete existing.body; delete existing.original_body;
          if (existing.cover_urls === undefined) editMode.clearPending(b.booth_id);
          else editMode.setPending(b.booth_id, existing);
          saveBtn.textContent = T('edit_save_unchanged');
        } else {
          existing.body = newBody;
          existing.original_body = b.body || '';
          editMode.setPending(b.booth_id, existing);
          saveBtn.textContent = T('edit_save_done');
        }
        editMode.refreshCounter();
        setTimeout(() => { saveBtn.textContent = T('edit_save_btn'); }, 1800);
      });
      const revertBtn = el('button', { type: 'button', class: 'edit-revert-btn' }, T('edit_revert_btn'));
      revertBtn.addEventListener('click', () => {
        ta.value = b.body || '';
        const existing = editMode.getPending(b.booth_id) || {};
        delete existing.body; delete existing.original_body;
        if (existing.cover_urls === undefined) editMode.clearPending(b.booth_id);
        else editMode.setPending(b.booth_id, existing);
        editMode.refreshCounter();
      });
      actionRow.appendChild(saveBtn);
      actionRow.appendChild(revertBtn);
      bodyDiv.appendChild(actionRow);

      // --- Images editor ---
      // Primary UI: overlay controls on the carousel itself (◀/▶ reorder,
      // × delete, [i/N] index) for one-tap mobile editing.
      // Advanced (collapsed by default): per-cover row form with source/display
      // URL inputs + explicit lock toggle. Lock toggle distinguishes:
      //   - 🔓 auto: pipeline can regenerate display_url if source changes
      //   - 🔒 locked: pipeline never overwrites display_url
      //
      // All cover-edit elements go into imgEditWrapper, which is
      // prepended to bodyDiv at the end so cover edit appears ABOVE
      // body edit in the modal layout.
      const imgEditWrapper = el('div', { class: 'edit-images-wrapper' });
      const imgLabel = el('div', { class: 'edit-mode-banner' }, T('edit_images_banner'));
      imgEditWrapper.appendChild(imgLabel);

      const origCovers = (b.cover_urls || (b.cover_url ? [b.cover_url] : [])).map(normalizeCover);
      const origSnapshot = JSON.stringify(origCovers);

      // Wrap row UI in <details> so the rich URL/lock fields are accessible
      // but out of the way by default. Mobile users do most ordering on the
      // overlay carousel; advanced URL surgery goes here.
      const advancedDetails = el('details', { class: 'edit-images-advanced' });
      const advancedSummary = el('summary', { class: 'edit-images-advanced-summary' }, T('edit_images_advanced_summary'));
      advancedDetails.appendChild(advancedSummary);

      const imgList = el('div', { class: 'edit-images-list' });
      const rowsState = [];

      // --- Overlay carousel render ---
      // Mirrors rowsState. Each slide gets ◀ × ▶ overlays + [i/N] index.
      // Re-rendered on any mutation so the user always sees current order.
      // Tracks the slide the user was viewing before a rebuild so we can
      // restore scroll position. Updated by overlay handlers (which know the
      // moved/removed cover's new index) and by scroll events on the
      // carousel itself (so the position survives unrelated re-renders too).
      let lastFocusIdx = 0;
      function readCurrentScrollIdx() {
        const c = carouselHolder.querySelector('.cover-carousel');
        if (!c || !c.children.length) return 0;
        const first = c.children[0];
        const w = first.getBoundingClientRect().width;
        if (w <= 0) return 0;
        return Math.round(c.scrollLeft / w);
      }
      function scrollToIdx(idx) {
        const c = carouselHolder.querySelector('.cover-carousel');
        if (!c || !c.children[idx]) return;
        // Use instant behavior so the snap doesn't visually flash to 0.
        c.scrollTo({ left: c.children[idx].offsetLeft, behavior: 'instant' });
      }
      function renderEditCarousel(scrollTargetIdx) {
        // Default target: whatever the user was last looking at.
        const target = (scrollTargetIdx != null) ? scrollTargetIdx : lastFocusIdx;
        carouselHolder.textContent = '';
        const carousel = el('div', { class: 'cover-carousel cover-carousel-edit' });
        if (!rowsState.length) {
          carousel.appendChild(el('div', { class: 'cover-slide cover-slide-edit' },
            el('p', { class: 'edit-images-empty' }, T('edit_images_empty'))));
        }
        rowsState.forEach((s, i) => {
          const display = (s.dispInput && s.dispInput.value.trim()) || (s.srcInput && s.srcInput.value.trim()) || '';
          const thumbUrl = display && /\?name=/.test(display)
            ? display.replace(/\?name=[^&]+/, '?name=small')
            : (display && /pbs\.twimg\.com/.test(display) ? display + '?name=small' : display);
          const slide = el('div', { class: 'cover-slide cover-slide-edit' });
          const frame = el('div', { class: 'cover-edit-frame' });
          if (thumbUrl) {
            const img = el('img', {
              src: thumbUrl,
              alt: T('cover_img_alt', { i: i + 1, n: rowsState.length }),
              class: 'cover-img', loading: i === 0 ? 'eager' : 'lazy',
              referrerpolicy: 'no-referrer',
            });
            img.addEventListener('error', () => {
              const fallback = el('div', { class: 'cover-fallback' }, T('cover_load_failed'));
              frame.replaceChild(fallback, img);
            });
            frame.appendChild(img);
          } else {
            frame.appendChild(el('div', { class: 'cover-edit-empty-thumb' }, T('edit_images_empty_thumb')));
          }
          // Overlay: index + delete (top corners)
          const idxBadge = el('span', { class: 'cover-edit-idx' }, `${i + 1}/${rowsState.length}`);
          frame.appendChild(idxBadge);
          const delBtn = el('button', {
            type: 'button', class: 'cover-edit-del',
            title: T('edit_image_remove'), 'aria-label': T('edit_image_remove'),
          }, '×');
          delBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const idx = rowsState.indexOf(s);
            if (idx < 0) return;
            rowsState.splice(idx, 1);
            s.row.remove();
            refreshIndices();
            // Stay on the same index (now showing what was next) — clamp.
            const tgt = Math.max(0, Math.min(idx, rowsState.length));
            renderEditCarousel(tgt);
          });
          frame.appendChild(delBtn);
          // Overlay: ◀ ▶ reorder (edge buttons, hidden when not applicable)
          const leftBtn = el('button', {
            type: 'button', class: 'cover-edit-arrow cover-edit-arrow-left',
            title: T('edit_image_move_left_tooltip'), 'aria-label': T('edit_image_move_left_tooltip'),
          }, '◀');
          if (i === 0) leftBtn.disabled = true;
          leftBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const idx = rowsState.indexOf(s);
            if (idx <= 0) return;
            [rowsState[idx - 1], rowsState[idx]] = [rowsState[idx], rowsState[idx - 1]];
            imgList.insertBefore(s.row, rowsState[idx].row);
            refreshIndices();
            // Follow the moved cover — it's now at idx-1.
            renderEditCarousel(idx - 1);
          });
          const rightBtn = el('button', {
            type: 'button', class: 'cover-edit-arrow cover-edit-arrow-right',
            title: T('edit_image_move_right_tooltip'), 'aria-label': T('edit_image_move_right_tooltip'),
          }, '▶');
          if (i >= rowsState.length - 1) rightBtn.disabled = true;
          rightBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const idx = rowsState.indexOf(s);
            if (idx < 0 || idx >= rowsState.length - 1) return;
            [rowsState[idx], rowsState[idx + 1]] = [rowsState[idx + 1], rowsState[idx]];
            imgList.insertBefore(rowsState[idx].row, s.row);
            refreshIndices();
            // Follow the moved cover — it's now at idx+1.
            renderEditCarousel(idx + 1);
          });
          frame.appendChild(leftBtn);
          frame.appendChild(rightBtn);
          slide.appendChild(frame);
          carousel.appendChild(slide);
        });
        // Trailing "+ add" slide
        const addSlide = el('div', { class: 'cover-slide cover-slide-edit cover-slide-add' });
        const addInner = el('button', {
          type: 'button', class: 'cover-edit-add-slide',
          title: T('edit_image_add'), 'aria-label': T('edit_image_add'),
        }, '+');
        addInner.addEventListener('click', () => {
          const cov = { source_url: '', display_url: '', display_locked: false };
          const s = makeRow(cov);
          rowsState.push(s);
          imgList.appendChild(s.row);
          refreshIndices();
          // Land on the newly added slot (now at length-1).
          renderEditCarousel(rowsState.length - 1);
          // Open advanced section so user can paste URL into the new row
          advancedDetails.open = true;
          if (s.srcInput) s.srcInput.focus();
        });
        addSlide.appendChild(addInner);
        carousel.appendChild(addSlide);
        carouselHolder.appendChild(carousel);
        carouselHolder.appendChild(el('p', { class: 'carousel-hint' }, T('edit_carousel_hint')));
        // Track scroll position so the next rebuild can land on the same slide.
        let scrollRaf = null;
        carousel.addEventListener('scroll', () => {
          if (scrollRaf) return;
          scrollRaf = requestAnimationFrame(() => {
            scrollRaf = null;
            lastFocusIdx = readCurrentScrollIdx();
          });
        });
        // Restore scroll position after the layout has committed.
        const clamped = Math.max(0, Math.min(target, carousel.children.length - 1));
        lastFocusIdx = clamped;
        requestAnimationFrame(() => scrollToIdx(clamped));
      }
      // Tracks the row currently being dragged. Module-level closure so all
      // rows share visibility; reset on dragend or successful drop.
      let draggingState = null;

      // Forward declaration so makeRow can reference refreshIndices.
      function refreshIndices() {
        rowsState.forEach((s, i) => {
          s.indexLabel.textContent = T('edit_image_row_label', { n: i + 1 });
        });
      }

      function makeRow(cover) {
        const row = el('div', { class: 'edit-images-row' });
        const state = { row, locked: !!cover.display_locked };

        const header = el('div', { class: 'edit-images-row-header' });
        // Drag handle: ⋮⋮ grip icon, draggable initiates HTML5 drag.
        // ↑↓ buttons stay as accessible/mobile-friendly fallback.
        const dragHandle = el('span', {
          class: 'edit-images-drag-handle',
          title: T('edit_image_drag_tooltip'),
          draggable: 'true',
        }, '⋮⋮');
        state.indexLabel = el('span', { class: 'edit-images-row-idx' }, '');
        const upBtn = el('button', {
          type: 'button', class: 'edit-images-move-btn', title: T('edit_image_move_up_tooltip'),
        }, '↑');
        const downBtn = el('button', {
          type: 'button', class: 'edit-images-move-btn', title: T('edit_image_move_down_tooltip'),
        }, '↓');
        upBtn.addEventListener('click', () => {
          const idx = rowsState.indexOf(state);
          if (idx <= 0) return;
          rowsState[idx] = rowsState[idx - 1];
          rowsState[idx - 1] = state;
          imgList.insertBefore(row, rowsState[idx].row);
          refreshIndices();
          renderEditCarousel(idx - 1);
        });
        downBtn.addEventListener('click', () => {
          const idx = rowsState.indexOf(state);
          if (idx < 0 || idx >= rowsState.length - 1) return;
          rowsState[idx] = rowsState[idx + 1];
          rowsState[idx + 1] = state;
          imgList.insertBefore(rowsState[idx].row, row);
          refreshIndices();
          renderEditCarousel(idx + 1);
        });

        dragHandle.addEventListener('dragstart', (e) => {
          draggingState = state;
          e.dataTransfer.effectAllowed = 'move';
          // Firefox requires setData to initiate drag.
          try { e.dataTransfer.setData('text/plain', ''); } catch (_) {}
          row.classList.add('dragging');
        });
        dragHandle.addEventListener('dragend', () => {
          row.classList.remove('dragging');
          rowsState.forEach(s => s.row.classList.remove('drop-before', 'drop-after'));
          draggingState = null;
        });
        row.addEventListener('dragover', (e) => {
          if (!draggingState || draggingState === state) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = row.getBoundingClientRect();
          const before = e.clientY < rect.top + rect.height / 2;
          row.classList.toggle('drop-before', before);
          row.classList.toggle('drop-after', !before);
        });
        row.addEventListener('dragleave', (e) => {
          // Only clear when leaving the row itself, not a child element.
          if (e.target === row) {
            row.classList.remove('drop-before', 'drop-after');
          }
        });
        row.addEventListener('drop', (e) => {
          if (!draggingState || draggingState === state) return;
          e.preventDefault();
          row.classList.remove('drop-before', 'drop-after');
          const rect = row.getBoundingClientRect();
          const before = e.clientY < rect.top + rect.height / 2;
          const srcIdx = rowsState.indexOf(draggingState);
          if (srcIdx < 0) return;
          rowsState.splice(srcIdx, 1);
          draggingState.row.remove();
          const tgtIdx = rowsState.indexOf(state);
          const insertIdx = before ? tgtIdx : tgtIdx + 1;
          rowsState.splice(insertIdx, 0, draggingState);
          if (before) imgList.insertBefore(draggingState.row, row);
          else if (row.nextSibling) imgList.insertBefore(draggingState.row, row.nextSibling);
          else imgList.appendChild(draggingState.row);
          refreshIndices();
          renderEditCarousel(rowsState.indexOf(draggingState));
        });

        const removeBtn = el('button', {
          type: 'button', class: 'edit-images-remove-btn',
        }, T('edit_image_remove'));
        removeBtn.addEventListener('click', () => {
          const idx = rowsState.indexOf(state);
          if (idx >= 0) rowsState.splice(idx, 1);
          row.remove();
          refreshIndices();
          renderEditCarousel(Math.max(0, Math.min(idx, rowsState.length)));
        });
        header.appendChild(dragHandle);
        header.appendChild(state.indexLabel);
        header.appendChild(upBtn);
        header.appendChild(downBtn);
        header.appendChild(removeBtn);
        row.appendChild(header);

        const srcField = el('div', { class: 'edit-images-row-field' });
        srcField.appendChild(el('label', null, T('edit_image_source_label')));
        state.srcInput = el('input', {
          type: 'text', class: 'edit-images-row-input',
          placeholder: T('edit_source_placeholder'),
        });
        state.srcInput.value = cover.source_url || '';
        srcField.appendChild(state.srcInput);
        row.appendChild(srcField);

        const dispField = el('div', { class: 'edit-images-row-field' });
        dispField.appendChild(el('label', null, T('edit_image_display_label')));
        const dispLine = el('div', { class: 'edit-images-row-dispLine' });
        state.dispInput = el('input', {
          type: 'text', class: 'edit-images-row-input',
          placeholder: T('edit_display_placeholder'),
        });
        state.dispInput.value = cover.display_url || '';
        // Live-refresh the overlay carousel thumbnail when URL fields change.
        const refreshCarouselDebounced = (() => {
          let t = null;
          return () => { if (t) clearTimeout(t); t = setTimeout(renderEditCarousel, 350); };
        })();
        state.srcInput.addEventListener('input', refreshCarouselDebounced);
        state.dispInput.addEventListener('input', refreshCarouselDebounced);
        state.lockBtn = el('button', { type: 'button', class: 'edit-images-lock-btn', title: T('edit_image_lock_tooltip') });
        function refreshLockBtn() {
          state.lockBtn.textContent = state.locked ? T('edit_image_lock_locked') : T('edit_image_lock_auto');
          state.lockBtn.classList.toggle('locked', state.locked);
        }
        state.lockBtn.addEventListener('click', () => {
          state.locked = !state.locked;
          refreshLockBtn();
        });
        refreshLockBtn();
        dispLine.appendChild(state.dispInput);
        dispLine.appendChild(state.lockBtn);
        dispField.appendChild(dispLine);
        row.appendChild(dispField);

        return state;
      }

      currentCovers.forEach(c => {
        const s = makeRow(c);
        rowsState.push(s);
        imgList.appendChild(s.row);
      });
      refreshIndices();
      advancedDetails.appendChild(imgList);

      const addBtn = el('button', { type: 'button', class: 'edit-images-add-btn' }, T('edit_image_add'));
      addBtn.addEventListener('click', () => {
        const s = makeRow({ source_url: '', display_url: '', display_locked: false });
        rowsState.push(s);
        imgList.appendChild(s.row);
        refreshIndices();
        renderEditCarousel();
        s.srcInput.focus();
      });
      advancedDetails.appendChild(addBtn);
      imgEditWrapper.appendChild(advancedDetails);

      // Initial overlay carousel render (replaces the view-mode carousel).
      renderEditCarousel();

      const imgActionRow = el('div', { class: 'edit-action-row' });
      const imgSaveBtn = el('button', { type: 'button', class: 'edit-save-btn' }, T('edit_save_btn'));
      imgSaveBtn.addEventListener('click', () => {
        const newCovers = [];
        rowsState.forEach(s => {
          const src = s.srcInput.value.trim();
          if (!src) return;  // skip empty rows
          const disp = s.dispInput.value.trim();
          newCovers.push({
            source_url: src,
            display_url: disp || null,
            display_locked: !!s.locked,
          });
        });
        const existing = editMode.getPending(b.booth_id) || {};
        if (JSON.stringify(newCovers) === origSnapshot) {
          delete existing.cover_urls; delete existing.original_cover_urls;
          if (existing.body === undefined) editMode.clearPending(b.booth_id);
          else editMode.setPending(b.booth_id, existing);
          imgSaveBtn.textContent = T('edit_save_unchanged');
        } else {
          existing.cover_urls = newCovers;
          existing.original_cover_urls = origCovers;
          editMode.setPending(b.booth_id, existing);
          imgSaveBtn.textContent = T('edit_save_done');
        }
        editMode.refreshCounter();
        setTimeout(() => { imgSaveBtn.textContent = T('edit_save_btn'); }, 1800);
      });
      const imgRevertBtn = el('button', { type: 'button', class: 'edit-revert-btn' }, T('edit_revert_btn'));
      imgRevertBtn.addEventListener('click', () => {
        // Wipe DOM rows + state, rebuild from orig covers
        rowsState.forEach(s => s.row.remove());
        rowsState.length = 0;
        origCovers.forEach(c => {
          const s = makeRow(c);
          rowsState.push(s);
          imgList.appendChild(s.row);
        });
        refreshIndices();
        renderEditCarousel();
        const existing = editMode.getPending(b.booth_id) || {};
        delete existing.cover_urls; delete existing.original_cover_urls;
        if (existing.body === undefined) editMode.clearPending(b.booth_id);
        else editMode.setPending(b.booth_id, existing);
        editMode.refreshCounter();
      });
      imgActionRow.appendChild(imgSaveBtn);
      imgActionRow.appendChild(imgRevertBtn);
      imgEditWrapper.appendChild(imgActionRow);
      // Place the cover edit section ABOVE the body editor (which was
      // already appended to bodyDiv earlier in this branch).
      bodyDiv.insertBefore(imgEditWrapper, bodyDiv.firstChild);
    } else {
      bodyDiv.innerHTML = mdToHtml(b.body || '');
    }
    body.appendChild(bodyDiv);

    if (b.alts && b.alts.length) {
      body.appendChild(el('h4', null, T('modal_alts_heading')));
      b.alts.forEach(a => {
        const altDiv = el('div', { class: 'modal-body-md', style: 'border-top:1px dashed #ccc;margin-top:0.8rem;padding-top:0.8rem;' });
        let alt_html = `<strong>${escapeHtml(a.circle_name || '')}</strong>`;
        if (a.author) alt_html += ` (${escapeHtml(a.author)})`;
        // (legacy alt entries omit X link — was a.x_url/a.x_handle on data.js
        // alt records; unused since alt is rare and data.js never populates it)
        alt_html += '<br>' + mdToHtml(a.body || '');
        altDiv.innerHTML = alt_html;
        body.appendChild(altDiv);
      });
    }

    body.appendChild(closeBottom);

    const modal = document.getElementById('modal');
    modal.hidden = false;
    modal.style.display = '';
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const closeBtn = document.getElementById('modal-close');
      if (closeBtn) closeBtn.focus();
    }, 50);
  }

  function closeModal() {
    const m = document.getElementById('modal');
    m.hidden = true;
    m.style.display = 'none';
    document.body.style.overflow = '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }

  // ===== Initialize (after applying metadata + building UI shell) =====
  applyEventMetadata();
  applyStaticI18n();
  buildFilterButtons();
  buildBoothGrids();

  // ---- Collapsible filter panel ----
  (function setupFilterCollapse() {
    const section = document.getElementById('filter-section');
    const btn = document.getElementById('filter-collapse-btn');
    if (!section || !btn) return;
    const COLLAPSE_KEY = (EVENT.favorites_key || 'event-guide-template') + '-filter-collapsed';
    function apply(collapsed) {
      section.classList.toggle('collapsed', collapsed);
      btn.textContent = collapsed ? '▲ 篩選' : '▼ 篩選';
      btn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    }
    let collapsed = false;
    try { collapsed = localStorage.getItem(COLLAPSE_KEY) === '1'; } catch (e) {}
    apply(collapsed);
    btn.addEventListener('click', () => {
      collapsed = !collapsed;
      try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch (e) {}
      apply(collapsed);
    });
  })();

  // Render booths grouped by row
  ROWS.forEach(row => {
    const grid = document.getElementById('grid-' + row);
    if (!grid) return;
    booths
      .filter(b => b.booth_id.startsWith(row + '-'))
      .forEach(b => grid.appendChild(renderCard(b)));
  });

  // Filter selection is persisted in localStorage the same way favorites
  // are — once a user customises their chip set we don't reset it on the
  // next visit. EVENT.default_filters only seeds the first load (when no
  // entry exists at all); a saved empty array stays empty.
  const FILTER_KEY = (EVENT.favorites_key || 'event-guide-template') + '-filters';
  function loadFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      if (raw == null) return new Set(EVENT.default_filters || []);
      return new Set(JSON.parse(raw));
    } catch (e) { return new Set(EVENT.default_filters || []); }
  }
  function saveFilters() {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(Array.from(activeFilters))); }
    catch (e) {}
  }
  let activeFilters = loadFilters();
  let currentSearch = '';
  if (activeFilters.size) {
    // Sync filter buttons + remove "all" highlight to match seeded state.
    requestAnimationFrame(() => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      activeFilters.forEach(f => {
        const btn = document.querySelector('.filter-btn[data-filter="' + f + '"]');
        if (btn) btn.classList.add('active');
      });
      const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
      if (allBtn) allBtn.classList.remove('active');
    });
  }

  // Group active filters by category prefix so we can apply
  //   (cp:a OR cp:b) AND (tag:c OR tag:d) AND (area:e OR area:f) ...
  // — intersection between categories, union within. Tokens without a
  // colon (e.g. "fav") form their own implicit category.
  function groupActiveFilters() {
    const groups = {};
    activeFilters.forEach(f => {
      const idx = f.indexOf(':');
      const cat = idx >= 0 ? f.slice(0, idx) : f;
      (groups[cat] = groups[cat] || []).push(f);
    });
    return groups;
  }

  function applyFilters() {
    let visible = 0;
    const visibleBoothIds = [];
    const allCards = document.querySelectorAll('.booth-card');
    const groups = groupActiveFilters();
    const groupCats = Object.keys(groups);
    allCards.forEach(card => {
      const tokens = (card.dataset.filters || '').split(',');
      const search = card.dataset.search || '';
      const filterOK = activeFilters.size === 0 ||
        groupCats.every(cat => groups[cat].some(f => tokens.includes(f)));
      const searchOK = !currentSearch || search.includes(currentSearch);
      const show = filterOK && searchOK;
      card.style.display = show ? '' : 'none';
      if (show) {
        visible++;
        if (card.dataset.boothId) visibleBoothIds.push(card.dataset.boothId);
      }
    });
    const stats = document.getElementById('filter-stats');
    const isFiltered = activeFilters.size > 0 || currentSearch;
    if (stats) {
      const total = allCards.length;
      stats.textContent = isFiltered
        ? T('stats_filtered', { visible, total })
        : T('stats_total', { total });
      stats.classList.toggle('filtered', isFiltered);
    }
    updateMapOverlay(isFiltered ? visibleBoothIds : null);
    syncRowTitleVisibility();
    syncChipVisibility();
  }

  // Coords logic:
  // - cellsForBooth(b) → list of canonical cell IDs (uses explicit `cells`
  //   field when present, falls back to slash-parsing for legacy / unpatched).
  // - rectForCells(cells, coords) → union bounding rect, or null if no
  //   cell has coords.
  // - cellsForGroup("S-[02,06]") → expand range to ["S-02",...,"S-06"].
  function cellsForBooth(b) {
    if (b.cells && b.cells.length) return b.cells;
    const id = b.booth_id || '';
    const m = id.match(/^([A-Z])-(\d+)\/(\d+)$/);
    if (!m) return [id];
    const [, row, a, c] = m;
    const pad = (n) => String(n).padStart(2, '0');
    return [row + '-' + pad(a), row + '-' + pad(c)];
  }
  function rectForCells(cells, coords) {
    const cs = cells.map(c => coords[c]).filter(Boolean);
    if (!cs.length) return null;
    const x = Math.min(...cs.map(c => c.x));
    const y = Math.min(...cs.map(c => c.y));
    const w = Math.max(...cs.map(c => c.x + c.w)) - x;
    const h = Math.max(...cs.map(c => c.y + c.h)) - y;
    return { x, y, w, h };
  }
  function cellsForGroup(groupStr) {
    const m = groupStr && groupStr.match(/^([A-Z])-\[(\d+),(\d+)\]$/);
    if (!m) return [];
    const [, row, lo, hi] = m;
    const out = [];
    for (let i = parseInt(lo, 10); i <= parseInt(hi, 10); i++) {
      out.push(row + '-' + String(i).padStart(2, '0'));
    }
    return out;
  }

  // Click-targets layer — invisible per-booth rects covering every cell
  // so all booths are clickable regardless of filter state. Rendered
  // once after BOOTH_COORDS becomes available.
  function renderClickTargets() {
    const svg = document.getElementById('venue-map-overlay');
    if (!svg) return;
    const old = svg.querySelector('g.click-targets');
    if (old) old.remove();
    const ns = 'http://www.w3.org/2000/svg';
    const coords = window.BOOTH_COORDS || {};
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'click-targets');
    booths.forEach(b => {
      const cells = cellsForBooth(b);
      const r = rectForCells(cells, coords);
      if (!r) return;
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', r.x);
      rect.setAttribute('y', r.y);
      rect.setAttribute('width', r.w);
      rect.setAttribute('height', r.h);
      rect.setAttribute('class', 'click-target');
      rect.setAttribute('data-booth-id', b.booth_id);
      g.appendChild(rect);
    });
    // Insert at the very front so highlights/groups paint on top.
    svg.insertBefore(g, svg.firstChild);
  }

  // Filter overlay — group dashed borders + match highlights, redrawn
  // on every filter / search change. Pass null to clear.
  function updateMapOverlay(boothIds) {
    const svg = document.getElementById('venue-map-overlay');
    if (!svg) return;
    const old = svg.querySelector('g.filter-overlay');
    if (old) old.remove();
    if (!boothIds || !boothIds.length) return;
    const coords = window.BOOTH_COORDS || {};
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'filter-overlay');
    const visibleSet = new Set(boothIds);
    const visibleBooths = booths.filter(b => visibleSet.has(b.booth_id));
    // Group dashed borders first (drawn under matches)
    const groupsSeen = new Set();
    visibleBooths.forEach(b => {
      if (!b.group || groupsSeen.has(b.group)) return;
      groupsSeen.add(b.group);
      const r = rectForCells(cellsForGroup(b.group), coords);
      if (!r) return;
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', r.x);
      rect.setAttribute('y', r.y);
      rect.setAttribute('width', r.w);
      rect.setAttribute('height', r.h);
      rect.setAttribute('class', 'group');
      rect.setAttribute('data-group', b.group);
      g.appendChild(rect);
    });
    // Match highlights
    visibleBooths.forEach(b => {
      const r = rectForCells(cellsForBooth(b), coords);
      if (!r) return;
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', r.x);
      rect.setAttribute('y', r.y);
      rect.setAttribute('width', r.w);
      rect.setAttribute('height', r.h);
      rect.setAttribute('class', 'match');
      rect.setAttribute('data-booth-id', b.booth_id);
      g.appendChild(rect);
    });
    svg.appendChild(g);
  }

  // Popup machinery — click a click-target rect → tooltip with booth
  // summary; click 詳しく見る → scroll booth card + pulse (clears
  // filter if the card is currently hidden so the scroll lands on
  // something visible).
  let activeMapPopup = null;
  function dismissMapPopup() {
    if (activeMapPopup) {
      activeMapPopup.remove();
      activeMapPopup = null;
    }
  }
  function openBoothDetail(boothId) {
    const b = booths.find(x => x.booth_id === boothId);
    if (b) openModal(b);
  }
  function showMapPopup(boothId, ev) {
    dismissMapPopup();
    const b = booths.find(x => x.booth_id === boothId);
    if (!b) return;
    // Anchor the popup to the zoom viewport (not the scaled wrap) so it
    // stays at normal size and doesn't translate with the map.
    const wrap = document.getElementById('map-zoom-viewport') ||
                 document.querySelector('.map-overlay-wrap');
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const firstCover = (b.cover_urls || [])[0];
    const thumbUrl = firstCover ? (typeof firstCover === 'string' ? firstCover : (firstCover.display_url || firstCover.source_url)) : '';
    const popup = document.createElement('div');
    popup.className = 'map-popup';
    popup.setAttribute('role', 'button');
    popup.setAttribute('tabindex', '0');
    popup.innerHTML =
      '<button class="popup-close" type="button" aria-label="' + escapeAttr(T('popup_close_label')) + '">×</button>' +
      '<div class="popup-header">' +
        '<span class="popup-id">' + escapeHtml(b.booth_id) + '</span>' +
        '<span class="popup-name">' + escapeHtml(b.circle_name || '?') + '</span>' +
      '</div>' +
      (b.author ? '<div class="popup-author">' + escapeHtml(b.author) + '</div>' : '') +
      (thumbUrl
        ? '<img class="popup-thumb" src="' + escapeAttr(thumbUrl) + '" alt="" loading="lazy">'
        : '<div class="popup-no-thumb">' + escapeHtml(T('popup_go_to_card')) + '</div>');
    // Position near click, clamped to the wrap.
    const x = ev.clientX - wrapRect.left;
    const y = ev.clientY - wrapRect.top;
    const popupW = 240, popupH = 240;
    popup.style.left = Math.max(4, Math.min(x + 10, wrapRect.width - popupW)) + 'px';
    popup.style.top  = Math.max(4, Math.min(y + 10, wrapRect.height - popupH)) + 'px';
    wrap.appendChild(popup);
    activeMapPopup = popup;
    // Close button: dismiss only, don't trigger scroll.
    popup.querySelector('.popup-close').addEventListener('click', (e) => {
      e.stopPropagation();
      dismissMapPopup();
    });
    // Whole popup body click → open the booth detail modal.
    // If the map is in fullscreen, exit first — otherwise the modal opens
    // behind the z-index 9999 fullscreen overlay and looks like nothing
    // happened.
    popup.addEventListener('click', () => {
      const id = boothId;
      dismissMapPopup();
      const viewport = document.getElementById('map-zoom-viewport');
      if (viewport && viewport.classList.contains('fullscreen')) {
        const fsBtn = document.getElementById('map-fullscreen-btn');
        if (fsBtn) fsBtn.click();
      }
      openBoothDetail(id);
    });
  }
  // Click delegation on the SVG (capture-target rects only).
  const _mapSvg = document.getElementById('venue-map-overlay');
  if (_mapSvg) {
    _mapSvg.addEventListener('click', (e) => {
      const tgt = e.target && e.target.closest && e.target.closest('rect.click-target');
      if (!tgt) return;
      const id = tgt.getAttribute('data-booth-id');
      if (!id) return;
      e.stopPropagation();
      showMapPopup(id, e);
    });
  }
  // Outside-click dismiss (skip when click is on the popup itself or a click-target).
  document.addEventListener('click', (e) => {
    if (!activeMapPopup) return;
    if (e.target.closest && (e.target.closest('.map-popup') || e.target.closest('rect.click-target'))) return;
    dismissMapPopup();
  });

  renderClickTargets();
  applyFilters();

  // Map zoom — inline pinch / Ctrl+wheel + drag pan. The viewport clips
  // the transformed wrap; click-targets continue to work because they
  // live inside the transformed element (SVG scales with it). To keep
  // booth click reliable, any drag that crosses a small movement
  // threshold swallows the synthetic click on release.
  (function setupMapZoom() {
    const viewport = document.getElementById('map-zoom-viewport');
    const wrap = viewport && viewport.querySelector('.map-overlay-wrap');
    const resetBtn = document.getElementById('map-zoom-reset');
    const hint = document.getElementById('map-zoom-hint');
    const fsBtn = document.getElementById('map-fullscreen-btn');
    if (!viewport || !wrap) return;

    // Fullscreen toggle — pseudo-fullscreen via CSS (works on iOS Safari
    // too, unlike the browser Fullscreen API which has quirks on mobile).
    if (fsBtn) {
      const exitOnEsc = (e) => {
        if (e.key === 'Escape' && viewport.classList.contains('fullscreen')) {
          toggleFullscreen(false);
        }
      };
      function toggleFullscreen(on) {
        const next = on !== undefined ? on : !viewport.classList.contains('fullscreen');
        viewport.classList.toggle('fullscreen', next);
        fsBtn.textContent = next ? '✕' : '⛶';
        fsBtn.setAttribute('aria-label', next ? '全画面を閉じる / Exit fullscreen' : '全画面 / Fullscreen');
        document.body.style.overflow = next ? 'hidden' : '';
        if (next) document.addEventListener('keydown', exitOnEsc);
        else document.removeEventListener('keydown', exitOnEsc);
        // Recenter the zoomed transform after the viewport size changed.
        setTimeout(() => { try { clampPan(); apply(); } catch (e) {} }, 50);
      }
      fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });
    }

    const MIN_SCALE = 1, MAX_SCALE = 6, EPS = 0.005;
    const z = { scale: 1, tx: 0, ty: 0 };

    function clampPan() {
      const vw = viewport.clientWidth, vh = viewport.clientHeight;
      const sw = wrap.offsetWidth * z.scale;
      const sh = wrap.offsetHeight * z.scale;
      if (sw <= vw) z.tx = (vw - sw) / 2;
      else z.tx = Math.max(vw - sw, Math.min(0, z.tx));
      if (sh <= vh) z.ty = (vh - sh) / 2;
      else z.ty = Math.max(vh - sh, Math.min(0, z.ty));
    }
    function apply() {
      wrap.style.transform = `translate(${z.tx}px, ${z.ty}px) scale(${z.scale})`;
      const zoomed = z.scale > 1 + EPS;
      wrap.classList.toggle('zoomed', zoomed);
      if (resetBtn) resetBtn.hidden = !zoomed;
      if (hint) hint.classList.toggle('hidden', zoomed);
    }
    function zoomAt(newScale, px, py) {
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      // World point under cursor at current zoom
      const wx = (px - z.tx) / z.scale;
      const wy = (py - z.ty) / z.scale;
      z.scale = newScale;
      z.tx = px - wx * newScale;
      z.ty = py - wy * newScale;
      clampPan();
      apply();
    }
    function reset() { z.scale = 1; z.tx = 0; z.ty = 0; apply(); }
    if (resetBtn) resetBtn.addEventListener('click', reset);

    // Wheel zoom — require modifier (Ctrl/Cmd) so we don't hijack page scroll.
    viewport.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(z.scale * factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    // Touch handlers — pinch zoom + single-finger pan when zoomed in.
    // Track movement so we can suppress the booth-popup click on release.
    let t = null;
    function viewportPoint(clientX, clientY) {
      const rect = viewport.getBoundingClientRect();
      return [clientX - rect.left, clientY - rect.top];
    }
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        t = { mode: 'pinch', startDist: dist, startScale: z.scale,
              cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2,
              moved: true };
      } else if (e.touches.length === 1 && z.scale > 1 + EPS) {
        const a = e.touches[0];
        t = { mode: 'pan', startX: a.clientX, startY: a.clientY,
              startTx: z.tx, startTy: z.ty, moved: false };
      } else {
        t = null;
      }
    }, { passive: true });
    viewport.addEventListener('touchmove', (e) => {
      if (!t) return;
      if (t.mode === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        const a = e.touches[0], b = e.touches[1];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const [px, py] = viewportPoint(t.cx, t.cy);
        zoomAt(t.startScale * (dist / t.startDist), px, py);
      } else if (t.mode === 'pan' && e.touches.length === 1) {
        const a = e.touches[0];
        const dx = a.clientX - t.startX, dy = a.clientY - t.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          t.moved = true;
          e.preventDefault();
          z.tx = t.startTx + dx;
          z.ty = t.startTy + dy;
          clampPan();
          apply();
        }
      }
    }, { passive: false });
    viewport.addEventListener('touchend', () => {
      // Swallow the synthetic click that follows a pan / pinch.
      if (t && t.moved) {
        const swallow = (ev) => { ev.stopPropagation(); };
        viewport.addEventListener('click', swallow, { capture: true, once: true });
      }
      t = null;
    });

    // Mouse drag (when zoomed). Only react to primary button.
    let drag = null;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (z.scale <= 1 + EPS) return;
      drag = { startX: e.clientX, startY: e.clientY,
               startTx: z.tx, startTy: z.ty, moved: false };
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
      wrap.classList.add('dragging');
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
      if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) drag.moved = true;
      if (drag.moved) {
        z.tx = drag.startTx + dx;
        z.ty = drag.startTy + dy;
        clampPan();
        apply();
      }
    });
    viewport.addEventListener('pointerup', (e) => {
      if (!drag) return;
      if (drag.moved) {
        const swallow = (ev) => { ev.stopPropagation(); };
        viewport.addEventListener('click', swallow, { capture: true, once: true });
      }
      wrap.classList.remove('dragging');
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
      drag = null;
    });

    apply();
    // Re-clamp on viewport resize.
    window.addEventListener('resize', () => { clampPan(); apply(); });
  })();

  function handleFilterClick(btn) {
    const f = btn.dataset.filter;
    if (f === 'all') {
      activeFilters.clear();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    } else {
      if (activeFilters.has(f)) {
        activeFilters.delete(f);
        btn.classList.remove('active');
      } else {
        activeFilters.add(f);
        btn.classList.add('active');
      }
      if (activeFilters.size > 0) {
        document.querySelector('.filter-btn[data-filter="all"]').classList.remove('active');
      } else {
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
      }
    }
    saveFilters();
    applyFilters();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.filter-btn');
    if (btn) {
      e.preventDefault();
      handleFilterClick(btn);
    }
  });

  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      if (searchClear) searchClear.hidden = !currentSearch;
      applyFilters();
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentSearch = '';
      searchClear.hidden = true;
      applyFilters();
      searchInput.focus();
    });
  }

  // Swipe gesture on modal-body to navigate prev/next (avoid carousel area)
  (function() {
    const modal = document.getElementById('modal');
    let sx = 0, sy = 0, swiping = false;
    modal.addEventListener('touchstart', (e) => {
      if (modal.hidden) return;
      if (e.target.closest('.cover-carousel')) { swiping = false; return; }
      if (e.target.closest('.modal-nav-btn')) { swiping = false; return; }
      if (e.target.closest('.modal-close')) { swiping = false; return; }
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });
    modal.addEventListener('touchend', (e) => {
      if (modal.hidden || !swiping) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        navigateBooth(dx > 0 ? -1 : 1);
      }
      swiping = false;
    }, { passive: true });
  })();

  ['click', 'touchend', 'pointerup'].forEach(ev => {
    document.getElementById('modal-close').addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  });
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('modal').hidden) closeModal();
  });

  // Share button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const url = location.origin + location.pathname;
      const eventName = EVENT.name || T('event_fallback_name');
      const title = T('share_dialog_title', { eventName });
      const text = EVENT.share_text || T('share_text_fallback', { eventName });
      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          shareBtn.textContent = T('share_btn_copied');
          shareBtn.classList.add('copied');
          setTimeout(() => {
            shareBtn.textContent = T('share_btn');
            shareBtn.classList.remove('copied');
          }, 2500);
        } else {
          prompt(url, url);
        }
      } catch (e) {}
    });
  }

  // Back-to-top
  const backTop = document.getElementById('back-to-top');
  if (backTop) {
    window.addEventListener('scroll', () => {
      backTop.hidden = window.scrollY < 400;
    }, { passive: true });
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Deep-link
  const rowsAlpha = ROWS.join('');  // e.g. "ABC" — used in hash regex
  const hashPattern = new RegExp(`^#([${rowsAlpha}]-\\d+)$`, 'i');
  function openFromHash() {
    const m = location.hash.match(hashPattern);
    if (!m) return;
    const target = m[1].toUpperCase();
    const b = booths.find(x => x.booth_id === target);
    if (b) setTimeout(() => openModal(b), 100);
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  // ===== Edit Mode (V1: body markdown only) =====
  // Toggle in header → modal body becomes <textarea> → save to localStorage →
  // "Submit" panel generates a GitHub Issue URL prefilled with the diff or
  // copies it to clipboard for distribution via other channels.
  const editMode = (function() {
    // Note: STATE_KEY must NOT share the EDITS_PREFIX or listPending() will
    // count it as a booth edit (the bug that showed "1件" pending immediately).
    const STATE_KEY = (EVENT.favorites_key || 'event-guide') + '-editmode';
    const EDITS_PREFIX = (EVENT.favorites_key || 'event-guide') + '-edit-';
    const btn = document.getElementById('edit-mode-btn');
    const pendingBtn = document.getElementById('edit-pending-btn');
    const pendingCountSpan = document.getElementById('edit-pending-count');

    let enabled = localStorage.getItem(STATE_KEY) === '1';

    function setMode(on) {
      enabled = !!on;
      localStorage.setItem(STATE_KEY, enabled ? '1' : '0');
      if (btn) {
        btn.textContent = enabled ? T('edit_mode_on') : T('edit_mode_off');
        btn.classList.toggle('active', enabled);
      }
      // Re-open current modal if open, to switch render mode
      const modal = document.getElementById('modal');
      if (!modal.hidden && currentBoothIdx >= 0) {
        const cur = booths[currentBoothIdx];
        if (cur) openModal(cur);
      }
    }

    function listPending() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(EDITS_PREFIX)) {
          try { out.push({ key: k, booth_id: k.slice(EDITS_PREFIX.length), edit: JSON.parse(localStorage.getItem(k)) }); }
          catch (e) {}
        }
      }
      return out;
    }

    function getPending(boothId) {
      const raw = localStorage.getItem(EDITS_PREFIX + boothId);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function setPending(boothId, edit) {
      localStorage.setItem(EDITS_PREFIX + boothId, JSON.stringify({ ...edit, _ts: new Date().toISOString() }));
    }

    function clearPending(boothId) {
      localStorage.removeItem(EDITS_PREFIX + boothId);
    }

    function clearAll() {
      listPending().forEach(p => localStorage.removeItem(p.key));
      refreshCounter();
    }

    function refreshCounter() {
      const n = listPending().length;
      if (pendingCountSpan) pendingCountSpan.textContent = String(n);
      if (pendingBtn) pendingBtn.hidden = (n === 0);
    }

    function buildSubmissionText() {
      const items = listPending().sort((a, b) => a.booth_id.localeCompare(b.booth_id));
      const eventName = EVENT.name || T('event_fallback_name');
      const lines = [
        '# ' + T('edit_submission_doc_title', { event: eventName }),
        ``,
        T('edit_submission_count_label', { count: items.length }),
        T('edit_submission_time_label', { ts: new Date().toISOString() }),
        ``,
        `---`,
        ``,
      ];
      for (const it of items) {
        const b = booths.find(x => x.booth_id === it.booth_id);
        const title = b ? `${it.booth_id} ${b.circle_name || ''}` : it.booth_id;
        lines.push(`## ${title}`);
        lines.push('');
        if (it.edit.body !== undefined) {
          lines.push('### ' + T('edit_submission_body_before'));
          lines.push('```markdown');
          lines.push(it.edit.original_body || '');
          lines.push('```');
          lines.push('');
          lines.push('### ' + T('edit_submission_body_after'));
          lines.push('```markdown');
          lines.push(it.edit.body || '');
          lines.push('```');
          lines.push('');
        }
        if (it.edit.cover_urls !== undefined) {
          // Emit one block per cover: source on line 1, display URL on
          // line 2 with a [locked] / [auto] / [pending] marker. The
          // display URL is the per-entry identity — without it, two
          // entries that share a source URL (eg an album with multiple
          // images) become indistinguishable in the diff and the
          // maintainer can't tell which one was kept vs dropped.
          //   [locked]  → custom-pinned, pipeline must not overwrite
          //   [auto]    → display_url present, pipeline may regenerate
          //   [pending] → display_url null, awaiting pipeline upload
          const fmtCover = (p) => {
            if (typeof p === 'string') return [p, '  display: ' + p + ' [auto]'];
            const src = p.source_url || p.display_url || '';
            const d = p.display_url || '';
            const tag = p.display_locked ? '[locked]' : (d ? '[auto]' : '[pending]');
            return [src, '  display: ' + (d || '(pending)') + ' ' + tag];
          };
          lines.push('### ' + T('edit_submission_images_before'));
          lines.push('```');
          (it.edit.original_cover_urls || []).forEach(u => fmtCover(u).forEach(l => lines.push(l)));
          lines.push('```');
          lines.push('');
          lines.push('### ' + T('edit_submission_images_after'));
          lines.push('```');
          (it.edit.cover_urls || []).forEach(u => fmtCover(u).forEach(l => lines.push(l)));
          lines.push('```');
          lines.push('');
        }
        lines.push('---');
        lines.push('');
      }
      return lines.join('\n');
    }

    function openPanel() {
      const panel = document.getElementById('edit-panel');
      const summary = document.getElementById('edit-panel-summary');
      const preview = document.getElementById('edit-preview-text');
      const items = listPending();
      summary.textContent = T('edit_panel_summary', {
        count: items.length,
        ids: items.map(p => p.booth_id).join(', ')
      });
      preview.textContent = buildSubmissionText();
      refreshPanelHint();
      panel.hidden = false;
      panel.style.display = '';
    }

    function closePanel() {
      const p = document.getElementById('edit-panel');
      p.hidden = true;
      p.style.display = 'none';  // hidden attribute is overridden by .edit-panel{display:flex}
    }

    function buildGithubIssueUrl(opts) {
      const repo = (EVENT.github_repo || 'https://github.com/howish/cho-tsukuyomi-map').replace(/\/$/, '');
      const title = T('edit_submission_github_title', { count: listPending().length });
      const body = (opts && opts.shortBody)
        ? T('edit_submission_attach_note') + '\n\n' + T('edit_submission_footer')
        : buildSubmissionText() + '\n\n' + T('edit_submission_footer');
      return `${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    }

    function downloadSubmissionFile() {
      const text = buildSubmissionText();
      // YYYYMMDD-HHMMSS
      const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T','-').split('.')[0];
      const count = listPending().length;
      const ev = (EVENT.event_id || EVENT.slug || 'event');
      const filename = `${ev}-fix-${count}booths-${ts}.md`;
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke later to let the download initiate.
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return filename;
    }

    function refreshPanelHint() {
      const hintEl = document.getElementById('edit-panel-hint');
      if (!hintEl) return;
      const len = buildSubmissionText().length;
      // GitHub Issue body via URL is gated by browser URL length (~8K safe).
      // Above that, recommend the .md download path.
      if (len > 7000) {
        hintEl.textContent = T('edit_submission_too_large_hint', { kb: (len / 1024).toFixed(1) });
        hintEl.className = 'edit-panel-hint warn';
      } else {
        hintEl.textContent = '';
        hintEl.className = 'edit-panel-hint';
      }
    }

    // Wire up event handlers (once)
    if (btn) btn.addEventListener('click', () => setMode(!enabled));
    if (pendingBtn) pendingBtn.addEventListener('click', openPanel);
    const panelClose = document.getElementById('edit-panel-close');
    if (panelClose) panelClose.addEventListener('click', closePanel);
    const panelBackdrop = document.getElementById('edit-panel-backdrop');
    if (panelBackdrop) panelBackdrop.addEventListener('click', closePanel);

    const submitDownload = document.getElementById('edit-submit-download');
    if (submitDownload) submitDownload.addEventListener('click', () => {
      const name = downloadSubmissionFile();
      submitDownload.textContent = T('edit_submit_download_done', { name });
      setTimeout(() => { submitDownload.textContent = T('edit_submit_download'); }, 2200);
    });
    const submitGithub = document.getElementById('edit-submit-github');
    if (submitGithub) submitGithub.addEventListener('click', () => {
      const len = buildSubmissionText().length;
      // Above the URL-fill ceiling: also trigger a download so the user
      // can drag-drop the .md into the issue body manually.
      if (len > 7000) {
        const name = downloadSubmissionFile();
        alert(T('edit_submission_attach_alert', { name }));
        window.open(buildGithubIssueUrl({ shortBody: true }), '_blank', 'noopener');
      } else {
        window.open(buildGithubIssueUrl(), '_blank', 'noopener');
      }
    });
    const submitCopy = document.getElementById('edit-submit-copy');
    if (submitCopy) submitCopy.addEventListener('click', async () => {
      const text = buildSubmissionText();
      try {
        await navigator.clipboard.writeText(text);
        submitCopy.textContent = T('edit_submit_copy_done');
        setTimeout(() => { submitCopy.textContent = T('edit_submit_copy'); }, 1800);
      } catch (e) {
        // Clipboard API failed — likely too long. Offer the download path
        // instead of dumping a truncated prompt() blob.
        if (text.length > 5000) {
          const name = downloadSubmissionFile();
          alert(T('edit_submit_copy_too_large', { name }));
        } else {
          prompt(T('edit_submit_copy_fallback'), text.slice(0, 2000));
        }
      }
    });
    const clearAllBtn = document.getElementById('edit-clear-all');
    if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
      if (!confirm(T('edit_clear_all_confirm'))) return;
      clearAll();
      closePanel();
    });

    // Migration: clean up any stale "<prefix>-edit-mode" key that earlier
    // builds wrote (the prefix collision bug). Match the legacy STATE_KEY
    // explicitly so we don't trash a hypothetical real "mode" booth_id edit.
    const LEGACY_KEY = (EVENT.favorites_key || 'event-guide') + '-edit-mode';
    if (localStorage.getItem(LEGACY_KEY) !== null) {
      const v = localStorage.getItem(LEGACY_KEY);
      // Only delete if it looks like the old toggle state (raw '0'/'1'), not a JSON edit
      if (v === '0' || v === '1') localStorage.removeItem(LEGACY_KEY);
    }

    // Initialize button state + counter on load
    setMode(enabled);
    refreshCounter();
    // Ensure panel is actually hidden on load (CSS display:flex overrides [hidden])
    closePanel();

    return { getPending, setPending, clearPending, refreshCounter, get isEnabled() { return enabled; } };
  })();

  // ===== Service Worker / Offline Mode =====
  // Registers sw.js (scoped to this event subdirectory) and wires the
  // "📥 オフライン対応" button: tap once to pre-cache the whole event
  // (HTML/CSS/JS + map + every booth cover image), tap again to clear.
  // State is persisted in localStorage so the button reflects truth on
  // a fresh page load.
  (function setupOfflineMode() {
    const btn = document.getElementById('offline-btn');
    const status = document.getElementById('offline-status');
    if (!btn) return;
    if (!('serviceWorker' in navigator)) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;

    const OFFLINE_KEY = (EVENT.favorites_key || 'event-guide') + '-offline-ready';
    let uiState = 'idle'; // idle | caching | ready

    function setLabel(s, text) {
      uiState = s;
      btn.classList.remove('caching', 'ready');
      if (s === 'idle') {
        btn.textContent = text || T('offline_btn_idle');
      } else if (s === 'caching') {
        btn.classList.add('caching');
        btn.textContent = text || T('offline_btn_caching');
      } else if (s === 'ready') {
        btn.classList.add('ready');
        btn.textContent = text || T('offline_btn_ready');
      }
    }

    function setStatus(text) { if (status) status.textContent = text || ''; }

    function collectAssetUrls() {
      const urls = new Set();
      // Page shell — relative URLs so they match against this event scope.
      // Per-event files live under <slug>/, shared shell files live at ../
      ['', 'index.html', 'event.js', 'filters.js', 'data.js',
       'manifest.json', 'map.jpg', 'og.png'].forEach(u => urls.add(u));
      ['../app.js', '../event-shell.css', '../i18n.js', '../icon.svg', '../circles.js']
        .forEach(u => urls.add(u));
      // Booth cover images — both original and ?name=small thumbnail variants
      booths.forEach(b => {
        const covers = b.cover_urls && b.cover_urls.length
          ? b.cover_urls
          : (b.cover_url ? [b.cover_url] : []);
        covers.forEach(url => {
          urls.add(url);
          const thumb = /\?name=/.test(url)
            ? url.replace(/\?name=[^&]+/, '?name=small')
            : url + '?name=small';
          urls.add(thumb);
        });
      });
      return Array.from(urls);
    }

    async function getSWTarget() {
      if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
      const reg = await navigator.serviceWorker.ready;
      return reg.active;
    }

    // Track whether a SW was already controlling at page-load time. If yes,
    // any subsequent activation is a takeover (e.g. CACHE_NAME bumped v1→v2);
    // we reload once so the live page actually uses the new SW and stale
    // cached responses (like a previously-404'd map.jpg) get re-fetched.
    // If no, this is a first-ever visit — don't reload (nothing to refresh).
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      if (localStorage.getItem(OFFLINE_KEY) === '1') {
        setLabel('ready');
      } else {
        setLabel('idle');
      }
      const reloadOnTakeover = (newSW) => {
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'activated' && hadController && !sessionStorage.getItem('sw-reloaded')) {
            sessionStorage.setItem('sw-reloaded', '1');
            location.reload();
          }
        });
      };
      if (reg.installing) reloadOnTakeover(reg.installing);
      reg.addEventListener('updatefound', () => {
        if (reg.installing) reloadOnTakeover(reg.installing);
      });
      // Proactively check for SW updates on every page load
      reg.update().catch(() => {});
    }).catch((err) => {
      console.warn('SW register failed:', err);
      btn.disabled = true;
      btn.textContent = T('offline_btn_unsupported');
    });

    navigator.serviceWorker.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.event === 'cache-progress') {
        const denom = d.total || 1;
        const pct = Math.round((d.done + d.failed) / denom * 100);
        setLabel('caching', T('offline_btn_caching_progress', {
          done: d.done + d.failed, total: d.total, pct
        }));
      } else if (d.event === 'cache-done') {
        localStorage.setItem(OFFLINE_KEY, '1');
        setLabel('ready');
        setStatus(d.failed > 0
          ? T('offline_status_partial', { done: d.done, failed: d.failed })
          : T('offline_status_full', { done: d.done }));
      } else if (d.event === 'cache-cleared') {
        localStorage.removeItem(OFFLINE_KEY);
        setLabel('idle');
        setStatus(T('offline_status_cleared'));
      } else if (d.event === 'cache-error') {
        setLabel('idle');
        setStatus(T('offline_status_error', { message: d.message }));
      }
    });

    btn.addEventListener('click', async () => {
      if (uiState === 'caching') return;
      if (uiState === 'idle') {
        const target = await getSWTarget();
        if (!target) {
          setStatus(T('offline_status_sw_not_ready'));
          return;
        }
        const urls = collectAssetUrls();
        setLabel('caching', T('offline_btn_caching_progress', { done: 0, total: urls.length, pct: 0 }));
        setStatus(T('offline_status_caching_start', { count: urls.length }));
        target.postMessage({ action: 'cache-event', payload: { urls } });
      } else if (uiState === 'ready') {
        if (!confirm(T('offline_confirm_clear'))) return;
        const target = await getSWTarget();
        if (target) target.postMessage({ action: 'clear-event' });
      }
    });
  })();
})();
