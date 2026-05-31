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
    if (c.author) head.appendChild(el('span', { class: 'circle-author' }, c.author));
    row.appendChild(head);

    // Social link chips
    if (c.socials && c.socials.length) {
      const linkRow = el('div', { class: 'circle-links' });
      const order = (s) => s.platform === 'x' ? 0 : (s.platform === 'plurk' ? 1 : 2);
      c.socials.slice().sort((a, b) => order(a) - order(b)).forEach(s => {
        const label = (PLATFORM_ICON[s.platform] || '🔗') +
                      (s.handle ? ' ' + s.handle : ' ' + (s.platform || 'link'));
        linkRow.appendChild(el('a', {
          class: 'circle-link-chip chip-' + s.platform,
          href: s.url, target: '_blank', rel: 'noopener',
          title: s.platform + (s.handle ? ' / ' + s.handle : ''),
        }, label));
      });
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
  let currentFilter = 'all';

  function applyFilter() {
    const q = (document.getElementById('circles-search').value || '').trim().toLowerCase();
    const list = document.getElementById('circles-list');
    list.innerHTML = '';
    let count = 0;
    for (const c of allCircles) {
      if (currentFilter === 'multi' && c.events.length < 2) continue;
      if (q) {
        const blob = [c.circle_name, c.author, c.x_handle,
                      ...(c.events || []).map(e => e.name)]
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

  // ---- bootstrap ----
  const CIRCLES_BY_ID = window.CIRCLES_BY_ID || {};
  allCircles = sortCircles(Object.values(CIRCLES_BY_ID));
  applyFilter();

  // Wire up search + filters
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
  document.querySelectorAll('.circles-filter-row .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.circles-filter-row .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilter();
    });
  });
})();
