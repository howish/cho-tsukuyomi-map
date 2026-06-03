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

  const PLATFORM_ICON = {
    x: '𝕏', plurk: 'P', fb: 'f', ig: '📷', threads: '@', pixiv: 'px',
    bsky: '🦋', doujin_tw: '同人', aggregator: '🔗', booth_pm: '🛒',
    wix: '🌐', blog: '📝', gamer: '🎮', generic: '🔗',
  };

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
      const an = (a.circle_name || a.x_handle || '').toLowerCase();
      const bn = (b.circle_name || b.x_handle || '').toLowerCase();
      return an.localeCompare(bn);
    });
  }

  function renderRow(c) {
    const multi = c.events.length > 1;
    const row = el('div', {
      class: 'circle-row' + (multi ? ' multi-event' : '') +
              (!c.x_handle ? ' no-handle' : ''),
    });
    const head = el('div', { class: 'circle-row-head' });
    head.appendChild(el('span', { class: 'circle-name' }, c.circle_name || '(無名)'));
    if (c.author && c.author !== c.circle_name) head.appendChild(el('span', { class: 'circle-author' }, c.author));
    row.appendChild(head);

    // Social link chips — x_handle (primary author) renders as the lead X
    // chip; the rest come from socials[]. Dedup by canonical URL.
    const linkRow = el('div', { class: 'circle-links' });
    const seenChipUrls = new Set();
    function pushChip(platform, url, handle) {
      const norm = (url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
      if (!norm || seenChipUrls.has(norm)) return;
      seenChipUrls.add(norm);
      const id = extractHandleFromUrl(url, platform);
      const label = (PLATFORM_ICON[platform] || '🔗') + ' ' + id;
      linkRow.appendChild(el('a', {
        class: 'circle-link-chip chip-' + platform,
        href: url, target: '_blank', rel: 'noopener',
        title: platform + (handle ? ' / ' + handle : ''),
      }, label));
    }
    // Lead X chip from x_handle (the canonical primary author X identity)
    if (c.x_handle) {
      pushChip('x', 'https://x.com/' + c.x_handle, '@' + c.x_handle);
    }
    if (c.socials && c.socials.length) {
      const order = (s) => s.platform === 'x' ? 0 : (s.platform === 'plurk' ? 1 : 2);
      c.socials.slice().sort((a, b) => order(a) - order(b)).forEach(s => {
        pushChip(s.platform, s.url, s.handle);
      });
    }
    if (linkRow.children.length) {
      row.appendChild(linkRow);
    } else {
      row.appendChild(el('div', { class: 'circle-links no-links' }, '(SNS link なし)'));
    }

    // Event participation chips
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
    if (baseFilter === 'no-handle' && c.x_handle) return false;
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
    const q = (document.getElementById('circles-search').value || '').trim().toLowerCase();
    const list = document.getElementById('circles-list');
    list.innerHTML = '';
    let count = 0;
    for (const c of allCircles) {
      if (!passesFilters(c)) continue;
      if (q) {
        const blob = [c.circle_name, c.author, c.x_handle,
                      ...(c.events || []).map(e => e.name),
                      ...(c.socials || []).map(s => s.handle),
                      ...(c.memberAuthors || []).flatMap(m => [m.name, ...(m.aliases || [])])]
          .join(' ').toLowerCase();
        if (!blob.includes(q)) continue;
      }
      list.appendChild(renderRow(c));
      count++;
    }
    if (count === 0) {
      list.appendChild(el('p', { class: 'empty' }, '該当するサークルなし'));
    }
    const stats = document.getElementById('circles-stats');
    const multiCount = allCircles.filter(c => c.events.length > 1).length;
    stats.textContent = `${count.toLocaleString()} 件表示 / 全 ${allCircles.length.toLocaleString()} サークル (${multiCount} 件が 2 event 以上)`;
  }

  function buildEventFilters() {
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
      row.appendChild(btn);
    });
  }

  function buildPlatformFilters() {
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
      const icon = PLATFORM_ICON[p] || '🔗';
      const btn = el('button', { class: 'filter-btn chip-' + p, 'data-platform': p },
        `${icon} ${p} (${n})`);
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
      row.appendChild(btn);
    });
  }

  // ---- bootstrap ----
  // B-big-1 (2026-06-02): circles now have members:[author_id] and the
  // person-level fields (x_handle, author, socials) live on authors.
  // Hydrate each circle with primary-member fields so the existing render
  // code keeps working without per-line refactors.
  const CIRCLES_BY_ID = window.CIRCLES_BY_ID || {};
  const AUTHORS_BY_ID = window.AUTHORS_BY_ID || {};
  function hydrateCircle(c) {
    const memberIds = c.members || [];
    const memberAuthors = memberIds.map(id => AUTHORS_BY_ID[id]).filter(Boolean);
    const primary = memberAuthors[0] || {};
    const seen = new Set();
    const socials = [];
    for (const s of (primary.socials || []).concat(c.socials || [])) {
      const k = s && s.url ? s.url.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() : '';
      if (!k || seen.has(k)) continue;
      seen.add(k);
      socials.push(s);
    }
    // 4-state name fallback: confirmed > inferred (often == circle name)
    return Object.assign({}, c, {
      author: primary.name || primary.name_inferred || '',
      x_handle: primary.x_handle || '',
      x_url: primary.x_url || '',
      socials,
      memberAuthors,
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
