/**
 * Circles index — runtime aggregation across all event guides.
 *
 * 1. Fetch ../events.json
 * 2. For each event with a slug, fetch <slug>/data.js (raw JS, eval the
 *    window.BOOTHS assignment inside an isolated context)
 * 3. Group booths by x_handle (fallback: circle_name + author)
 * 4. Render list with search + multi-event filter
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

  // Eval a remote data.js (which sets window.BOOTHS) in an isolated scope —
  // we don't want it to mutate our real `window`. Use Function constructor
  // with a sandbox object.
  function evalDataJs(src) {
    const sandbox = {};
    const fn = new Function('window', src);
    fn(sandbox);
    return sandbox.BOOTHS || [];
  }

  function fetchText(url) {
    return fetch(url, { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
      return r.text();
    });
  }

  function loadEventBooths(ev) {
    return fetchText('../' + ev.slug + '/data.js?v=' + Date.now())
      .then(src => ({ ev, booths: evalDataJs(src) }))
      .catch(err => {
        console.warn('skip', ev.slug, err);
        return { ev, booths: [] };
      });
  }

  function aggregateCircles(eventGroups) {
    // Key by x_handle (lowercase) → circle data
    // Fallback key: circle_name|author
    const byKey = new Map();
    for (const { ev, booths } of eventGroups) {
      for (const b of booths) {
        const key = (b.x_handle && b.x_handle.toLowerCase()) ||
                    (b.circle_name + '|' + (b.author || ''));
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            circle_name: b.circle_name,
            author: b.author,
            x_handle: b.x_handle || '',
            x_url: b.x_url || '',
            events: [],
          });
        }
        const entry = byKey.get(key);
        // Prefer latest non-empty value (later events update)
        if (b.circle_name && !entry.circle_name) entry.circle_name = b.circle_name;
        if (b.author && !entry.author) entry.author = b.author;
        if (b.x_handle && !entry.x_handle) entry.x_handle = b.x_handle;
        if (b.x_url && !entry.x_url) entry.x_url = b.x_url;
        entry.events.push({
          slug: ev.slug,
          name: ev.short_name || ev.name,
          date: ev.date,
          booth_id: b.booth_id,
        });
      }
    }
    return [...byKey.values()];
  }

  // Sort: multi-event first, then alphabetical (circle_name then handle)
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
    if (c.x_handle) {
      const handleSpan = el('span', { class: 'circle-handle' });
      handleSpan.appendChild(el('a', {
        href: c.x_url || ('https://x.com/' + c.x_handle),
        target: '_blank', rel: 'noopener',
      }, '@' + c.x_handle));
      head.appendChild(handleSpan);
    } else {
      head.appendChild(el('span', { class: 'circle-handle' }, '(SNS handle なし)'));
    }
    row.appendChild(head);

    const evRow = el('div', { class: 'circle-events' });
    // chronological order (oldest first)
    c.events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    for (const e of c.events) {
      const chip = el('a', {
        class: 'circle-event-chip',
        href: '../' + e.slug + '/#' + e.booth_id,
        title: e.name + ' — ブース ' + e.booth_id,
      });
      chip.appendChild(el('span', { class: 'booth' }, e.booth_id));
      chip.appendChild(document.createTextNode(' '));
      chip.appendChild(el('span', { class: 'ev' }, e.name));
      evRow.appendChild(chip);
    }
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
        const blob = [c.circle_name, c.author, c.x_handle, ...c.events.map(e => e.name)]
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
  fetch('../events.json?v=' + Date.now())
    .then(r => r.json())
    .then(d => {
      const events = (d.events || []).filter(e => e.slug);
      return Promise.all(events.map(loadEventBooths));
    })
    .then(eventGroups => {
      allCircles = sortCircles(aggregateCircles(eventGroups));
      applyFilter();
    })
    .catch(err => {
      const list = document.getElementById('circles-list');
      list.innerHTML = '<p class="error">サークル一覧の読み込みに失敗しました。</p>';
      console.error(err);
    });

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
