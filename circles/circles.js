/**
 * Circles index — reads window.CIRCLES_BY_ID (from ../circles.js, the
 * single source of truth) and renders. No per-event data.js loading needed
 * because circles.json now embeds the events list for each circle.
 */
(function() {
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

  // Platform icon Node (Simple Icons SVG when known, emoji fallback).
  // window.platformIconNode is defined in /platform-icons.js.
  function platformIcon(platform) {
    return window.platformIconNode
      ? window.platformIconNode(platform)
      : document.createTextNode('🔗');
  }

  // Unified chip label — walks window.PROFILE_PATTERNS (single source of
  // truth, generated from author-name-resolver skill).
  function extractHandleFromUrl(url, _platform) {
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

  // Sort: multi-event first, then alphabetical
  function sortCircles(circles) {
    return circles.sort((a, b) => {
      const ad = b.events.length - a.events.length;
      if (ad !== 0) return ad;
      const an = (a.circle_name || a.id || '').toLowerCase();
      const bn = (b.circle_name || b.id || '').toLowerCase();
      return an.localeCompare(bn);
    });
  }

  // Social-chip helpers — used for both circle-level (合同 SNS) and
  // per-author socials in the 2-tier card.
  function makeChip(platform, url) {
    const id = extractHandleFromUrl(url, platform);
    const chip = el('a', {
      class: 'circle-link-chip chip-' + platform,
      href: url, target: '_blank', rel: 'noopener',
      title: platform + (id ? ' — ' + id : ''),
    });
    chip.appendChild(platformIcon(platform));
    if (id) {
      chip.appendChild(document.createTextNode(' ' + id));
    }
    return chip;
  }
  function normUrlKey(url) {
    return (url || '').replace(/^https?:\/\//, '').replace(/^www\./, '')
      .split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
  }
  function sortSocials(socials) {
    const order = s => s.platform === 'x' ? 0 : (s.platform === 'plurk' ? 1 : 2);
    return (socials || []).slice().sort((a, b) => order(a) - order(b));
  }
  function renderSocialChipRow(socials, seenKeysShared) {
    const linkRow = el('div', { class: 'circle-links' });
    sortSocials(socials).forEach(s => {
      const k = normUrlKey(s.url);
      if (!k) return;
      if (seenKeysShared && seenKeysShared.has(k)) return;
      if (seenKeysShared) seenKeysShared.add(k);
      linkRow.appendChild(makeChip(s.platform, s.url));
    });
    return linkRow;
  }

  // Decide flat-vs-2tier per howish's rule (2026-06-04):
  // - 1 member AND author display name == circle name (or empty/inferred fallback)
  //   → flat: merge circle+author socials into one row, omit member section
  // - 1 member with own socials empty (regardless of name match) → flat:
  //   the 🎪 合同 label only carries signal when contrasted with a 👤 section
  //   that has its own socials; without that, inline the chips directly
  // - else (multi-member OR 1 member with distinct identity + own socials)
  //   → 2-tier
  // Sprint Bβ (2026-06-04): edit mode NEVER flat — reviewer needs every
  // editable surface (circle aliases, circle socials, each member's rename
  // input + aliases + socials) accessible per card.
  function shouldRenderFlat(c) {
    if (isEditMode) return false;
    const members = c.memberAuthors || [];
    if (members.length !== 1) return false;
    const primary = members[0] || {};
    const displayName = primary.name || primary.name_inferred || '';
    if (!displayName || displayName === c.circle_name) return true;
    return (primary.socials || []).length === 0;
  }

  function renderRow(c) {
    const multi = c.events.length > 1;
    const flat = shouldRenderFlat(c);
    // hasSocials is from merged socials (used in flat mode for no-handle marker)
    const hasSocials = (c.socials && c.socials.length) > 0;
    const row = el('div', {
      class: 'circle-row' + (multi ? ' multi-event' : '') +
              (!hasSocials ? ' no-handle' : '') +
              (flat ? '' : ' two-tier'),
      'data-circle-id': c.id,
    });

    // Title row — circle name + aliases (+ author chip in flat mode if name differs)
    const head = el('div', { class: 'circle-row-head' });
    head.appendChild(el('span', { class: 'circle-name' }, c.circle_name || '(無名)'));
    if (c.aliases && c.aliases.length) {
      head.appendChild(el('span', { class: 'circle-aliases' },
        '(' + c.aliases.join(' / ') + ')'));
    }
    if (flat && c.author && c.author !== c.circle_name) {
      head.appendChild(el('span', { class: 'circle-author' }, c.author));
    }
    row.appendChild(head);

    if (flat) {
      // Single merged social-chip row — current behavior preserved.
      const merged = c.socials || [];
      const linkRow = renderSocialChipRow(merged, new Set());
      if (linkRow.children.length) {
        row.appendChild(linkRow);
      } else {
        row.appendChild(el('div', { class: 'circle-links no-links' }, '(SNS link なし)'));
      }
    } else {
      // 2-tier: circle header section + member section(s).
      // Track URLs across sections so we don't show the same chip twice
      // (e.g. if a circle has a social that an author also lists).
      const seenKeys = new Set();

      // Circle-level socials render directly under the circle name as a
      // chip row — no "🎪 合同" label (per howish 2026-06-04: the label
      // adds no signal; the chips ARE the circle's identity at the same
      // level as the circle name).
      const cSocials = c.circle_socials || [];
      if (cSocials.length) {
        row.appendChild(renderSocialChipRow(cSocials, seenKeys));
      }

      // Each member as its own section. In read mode skip silent members
      // (no socials) — empty 👤 sections add visual weight without info
      // value. In edit mode ALWAYS render the section so the decorator
      // has a slot to inject rename input / alias / add-social affordances
      // for every author. data-member-id lets the decorator find sections.
      (c.memberAuthors || []).forEach(m => {
        if (!isEditMode && !(m.socials || []).length) return;
        const sec = el('div', { class: 'circle-section member-section', 'data-member-id': m.id });
        const memberHead = el('div', { class: 'member-head' });
        const displayName = m.name || m.name_inferred || '(無名作家)';
        memberHead.appendChild(el('span', { class: 'section-label member-name' },
          '👤 ' + displayName));
        if (m.aliases && m.aliases.length) {
          memberHead.appendChild(el('span', { class: 'member-aliases' },
            '(' + m.aliases.join(' / ') + ')'));
        }
        sec.appendChild(memberHead);
        sec.appendChild(renderSocialChipRow(m.socials || [], seenKeys));
        row.appendChild(sec);
      });
    }

    // Event participation chips (always shown last).
    const evRow = el('div', { class: 'circle-events' });
    (c.events || []).forEach(e => {
      const chip = el('a', {
        class: 'circle-event-chip',
        href: '../' + e.slug + '/#' + e.booth_id,
        title: e.name + ' — ブース ' + e.booth_id,
      });
      chip.appendChild(el('span', { class: 'booth' }, e.booth_id));
      chip.appendChild(document.createTextNode(' '));
      chip.appendChild(el('span', { class: 'ev' }, e.name));
      evRow.appendChild(chip);
    });
    row.appendChild(evRow);
    return row;
  }

  let allCircles = [];
  // Filter state: only one base filter active, multiple event/platform filters AND-combined
  let baseFilter = 'all';
  const eventFilters = new Set();     // selected event slugs (subset)
  const platformFilters = new Set();  // selected platforms (subset)

  function passesFilters(c) {
    // Base filter
    if (baseFilter === 'multi' && c.events.length < 2) return false;
    if (baseFilter === 'no-handle' && (c.socials || []).length > 0) return false;
    // Event filter: circle must be in AT LEAST ONE selected event
    if (eventFilters.size > 0) {
      const inSelected = (c.events || []).some(e => eventFilters.has(e.slug));
      if (!inSelected) return false;
    }
    // Platform filter: circle must have AT LEAST ONE social on a selected platform
    if (platformFilters.size > 0) {
      const hasPlat = (c.socials || []).some(s => platformFilters.has(s.platform));
      if (!hasPlat) return false;
    }
    return true;
  }

  function applyFilter() {
    // Sprint Bβ.next (2026-06-04): single render path for both modes.
    // circles-edit.js wires hooks (YACHI_PASSES_FILTER, YACHI_DECORATE_CARD,
    // YACHI_PAGINATE, YACHI_UPDATE_STATS) at bootstrap; read mode leaves
    // them undefined and uses defaults.
    const q = (document.getElementById('circles-search').value || '').trim().toLowerCase();
    const list = document.getElementById('circles-list');
    list.innerHTML = '';
    const extraFilter = window.YACHI_PASSES_FILTER || (() => true);
    const decorate = window.YACHI_DECORATE_CARD;
    const paginate = window.YACHI_PAGINATE || ((arr) => arr);

    // Gather all matches first (so pagination/stats know the full count).
    const matches = [];
    for (const c of allCircles) {
      if (!passesFilters(c)) continue;
      if (!extraFilter(c)) continue;
      if (q) {
        const blob = [c.circle_name, c.author, c.id,
                      ...(c.aliases || []),
                      ...(c.events || []).map(e => e.name),
                      ...(c.socials || []).map(s => s.handle),
                      ...(c.memberAuthors || []).flatMap(m => [m.name, ...(m.aliases || [])])]
          .join(' ').toLowerCase();
        if (!blob.includes(q)) continue;
      }
      matches.push(c);
    }

    // Pagination hook returns the subset to render. Edit mode slices to
    // 20/page; read mode returns the full set.
    const visible = paginate(matches, list);

    for (const c of visible) {
      const row = renderRow(c);
      list.appendChild(row);
      if (decorate) decorate(row, c);
    }

    if (matches.length === 0) {
      list.appendChild(el('p', { class: 'empty' }, '該当するサークルなし'));
    }

    // Stats: edit-mode hook writes its own text (page/pending/etc.); read
    // mode falls back to the existing summary.
    if (window.YACHI_UPDATE_STATS) {
      window.YACHI_UPDATE_STATS({ matches, visible, total: allCircles.length });
    } else {
      const stats = document.getElementById('circles-stats');
      const multiCount = allCircles.filter(c => c.events.length > 1).length;
      stats.textContent = `${matches.length.toLocaleString()} 件表示 / 全 ${allCircles.length.toLocaleString()} サークル (${multiCount} 件が 2 event 以上)`;
    }
  }

  // Public re-render trigger — circles-edit.js calls this after mutating
  // pending state so the cards reflect the new decision overlay.
  window.YACHI_RERENDER = function() { applyFilter(); };

  function buildEventFilters(opts) {
    const attachHandlers = !opts || opts.attachHandlers !== false;
    // collect (slug, name) from all circle events, count occurrences
    const counts = new Map();
    for (const c of allCircles) {
      const seen = new Set();  // dedupe per circle (a circle has same event only once typically)
      for (const e of (c.events || [])) {
        if (seen.has(e.slug)) continue;
        seen.add(e.slug);
        const cur = counts.get(e.slug) || { slug: e.slug, name: e.name, count: 0, date: e.date };
        cur.count++;
        counts.set(e.slug, cur);
      }
    }
    const sorted = [...counts.values()].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const row = document.getElementById('filter-row-events');
    sorted.forEach(ev => {
      const btn = el('button', { class: 'filter-btn', 'data-event': ev.slug },
        `${ev.name} (${ev.count})`);
      if (attachHandlers) {
        btn.addEventListener('click', () => {
          if (eventFilters.has(ev.slug)) {
            eventFilters.delete(ev.slug);
            btn.classList.remove('active');
          } else {
            eventFilters.add(ev.slug);
            btn.classList.add('active');
          }
          applyFilter();
        });
      }
      row.appendChild(btn);
    });
  }

  function buildPlatformFilters(opts) {
    const attachHandlers = !opts || opts.attachHandlers !== false;
    const counts = new Map();
    for (const c of allCircles) {
      const seen = new Set();
      for (const s of (c.socials || [])) {
        const p = s.platform || 'generic';
        if (seen.has(p)) continue;
        seen.add(p);
        counts.set(p, (counts.get(p) || 0) + 1);
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const row = document.getElementById('filter-row-platforms');
    sorted.forEach(([p, n]) => {
      const btn = el('button', { class: 'filter-btn chip-' + p, 'data-platform': p });
      btn.appendChild(platformIcon(p));
      btn.appendChild(document.createTextNode(` ${p} (${n})`));
      if (attachHandlers) {
        btn.addEventListener('click', () => {
          if (platformFilters.has(p)) {
            platformFilters.delete(p);
            btn.classList.remove('active');
          } else {
            platformFilters.add(p);
            btn.classList.add('active');
          }
          applyFilter();
        });
      }
      row.appendChild(btn);
    });
  }

  // ---- Shared data hydration (used by both modes) ----
  // circles.json drives both the read-mode list AND the shared filter chips
  // (event/platform). Hoisted above the mode-detection block so the edit
  // branch can call hydrateCircle + buildEventFilters + buildPlatformFilters
  // without temporal-dead-zone errors.
  const CIRCLES_BY_ID = window.CIRCLES_BY_ID || {};
  const AUTHORS_BY_ID = window.AUTHORS_BY_ID || {};

  // ---- Mode detection ----
  // Single canonical URL /circles/ serves both read mode (default) and edit
  // mode (?mode=edit). Edit mode reveals the pending-decisions UI and
  // attaches edit-only handlers; /review/ is a redirect to ?mode=edit.
  // Sprint Bα (2026-06-04): both modes share the same filter UI (chip rows
  // in #shared-controls). circles.js always builds the event + platform
  // chip rows from data; in read mode it also attaches read-mode handlers
  // and renders #circles-list. In edit mode it skips handlers + render and
  // hands off to circles-edit.js, which attaches its own handlers to the
  // same chips and renders into #review-list (Bβ will unify the list too).
  const isEditMode = new URLSearchParams(location.search).get('mode') === 'edit';

  // Set body class so CSS can show/hide mode-specific filter rows
  // (filter-row-edit-only / filter-row-read-only).
  document.body.classList.add(isEditMode ? 'edit-mode' : 'read-mode');

  // Toggle the mode-link in the header (text + href) so the user can flip back.
  const modeToggle = document.getElementById('mode-toggle');
  if (modeToggle) {
    if (isEditMode) {
      modeToggle.textContent = '👁 Read mode';
      modeToggle.href = './';
    } else {
      modeToggle.textContent = '🔧 Edit mode';
      modeToggle.href = '?mode=edit';
    }
  }

  if (isEditMode) {
    // Edit mode bootstrap (Sprint Bβ 2026-06-04):
    // Both modes now share #circles-list — circles.js's renderRow draws
    // the 2-tier card and circles-edit.js decorates it via the
    // YACHI_DECORATE_CARD hook. #review-list is now redundant (deleted
    // visually); it'll be removed from HTML in Bγ.
    const editList = document.getElementById('review-list');
    if (editList) editList.hidden = true;  // not used in Bβ+; deleted in Bγ

    // Build shared filter chips (data-driven). Edit-mode click handlers are
    // attached by circles-edit.js after it loads. Hydration also feeds
    // applyFilter() below.
    allCircles = sortCircles(Object.values(CIRCLES_BY_ID).map(hydrateCircle));
    buildEventFilters({ attachHandlers: false });
    buildPlatformFilters({ attachHandlers: false });

    // Edit-mode handlers (search, filter clicks, render) are wired by
    // circles-edit.js after it loads. circles.js doesn't touch the search
    // input or run applyFilter in edit mode — its applyFilter is a no-op
    // when isEditMode is true (see check inside applyFilter).
    //
    // Sprint Bβ scope: edit mode renders into #circles-list (the SHARED
    // list container) rather than its own #review-list. The cards still
    // come from circles-edit.js's renderCircleCard for now; visual unify
    // of cards (read-mode 2-tier shape) is a follow-up sub-sprint.

    // Cache-bust: reuse this script's own ?v= so edit assets stay in sync.
    const ownScript = document.currentScript ||
      [...document.scripts].reverse().find(s => /circles\/circles\.js/.test(s.src));
    const v = ownScript
      ? (new URL(ownScript.src, location.href).searchParams.get('v') || Date.now())
      : Date.now();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'circles-edit.css?v=' + v;
    document.head.appendChild(css);
    const s1 = document.createElement('script');
    s1.src = 'ws-candidates.js?v=' + v;
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'circles-edit.js?v=' + v;
      document.body.appendChild(s2);
    };
    document.body.appendChild(s1);
    return;  // Skip read-mode-specific bootstrap (handlers + render).
  }

  // ---- Read-mode bootstrap ----
  // B-big-1 (2026-06-02): circles now have members:[author_id] and the
  // person-level fields (x_handle, author, socials) live on authors.
  // Hydrate each circle with primary-member fields so the existing render
  // code keeps working without per-line refactors.
  function hydrateCircle(c) {
    const memberIds = c.members || [];
    const memberAuthors = memberIds.map(id => AUTHORS_BY_ID[id]).filter(Boolean);
    const primary = memberAuthors[0] || {};
    // Merged socials — used for flat render + search blob + platform filter
    // count. Circle-level + every member's socials, deduped by URL.
    const seen = new Set();
    const socials = [];
    const allSourceSocials = (c.socials || []).concat(
      ...memberAuthors.map(m => m.socials || []));
    for (const s of allSourceSocials) {
      const k = s && s.url ? s.url.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() : '';
      if (!k || seen.has(k)) continue;
      seen.add(k);
      socials.push(s);
    }
    // 4-state name fallback: confirmed > inferred (often == circle name)
    return Object.assign({}, c, {
      author: primary.name || primary.name_inferred || '',
      socials,                          // merged (flat-mode + filters)
      circle_socials: c.socials || [],  // circle-level only (2-tier header)
      memberAuthors,                    // for 2-tier per-member sections
    });
  }
  allCircles = sortCircles(Object.values(CIRCLES_BY_ID).map(hydrateCircle));
  buildEventFilters();
  buildPlatformFilters();
  applyFilter();

  // Wire up search + base filters (multi/no-handle/all)
  const searchInput = document.getElementById('circles-search');
  const searchClear = document.getElementById('circles-search-clear');
  searchInput.addEventListener('input', () => {
    searchClear.hidden = !searchInput.value;
    applyFilter();
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    applyFilter();
    searchInput.focus();
  });
  document.querySelectorAll('#filter-row-base .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-row-base .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      baseFilter = btn.dataset.filter;
      applyFilter();
    });
  });
})();
