/**
 * Hub landing page — fetches events.json and renders the event list.
 *
 * Each event card links to /<slug>/ which contains the event-specific
 * guide (event.js / filters.js / data.js / map.jpg / app.js).
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

  fetch('events.json?v=' + Date.now())
    .then(r => r.json())
    .then(d => render(d.events || []))
    .catch(err => {
      const list = document.getElementById('event-list');
      list.innerHTML = '<p class="error">イベント一覧の読み込みに失敗しました。</p>';
      console.error(err);
    });

  function render(events) {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    if (events.length === 0) {
      list.appendChild(el('p', { class: 'empty' }, '登録イベントはまだありません。'));
      return;
    }
    // sort: upcoming first (chronological), then past (reverse chronological)
    const now = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(e => e.status === 'upcoming' || e.date >= now)
      .sort((a, b) => a.date.localeCompare(b.date));
    const past = events.filter(e => !(e.status === 'upcoming' || e.date >= now))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (upcoming.length) {
      list.appendChild(el('h3', { class: 'group-title' }, '🎯 開催予定 / 開催中'));
      upcoming.forEach(e => list.appendChild(eventCard(e)));
    }
    if (past.length) {
      list.appendChild(el('h3', { class: 'group-title' }, '📚 開催済 (archive)'));
      past.forEach(e => list.appendChild(eventCard(e)));
    }
  }

  function eventCard(e) {
    const link = el('a', {
      class: 'event-card status-' + (e.status || 'unknown'),
      href: e.slug + '/',
    });
    link.appendChild(el('div', { class: 'event-icon' }, e.icon || '🎪'));
    const body = el('div', { class: 'event-body' });
    body.appendChild(el('div', { class: 'event-name' }, e.name));
    if (e.fandom) {
      body.appendChild(el('div', { class: 'event-fandom' }, e.fandom));
    }
    const meta = el('div', { class: 'event-meta' });
    if (e.date_display) meta.appendChild(el('span', { class: 'event-date' }, '📅 ' + e.date_display));
    if (e.venue) meta.appendChild(el('span', { class: 'event-venue' }, '📍 ' + e.venue));
    body.appendChild(meta);
    if (e.summary) {
      body.appendChild(el('div', { class: 'event-summary' }, e.summary));
    }
    if (e.official_url) {
      const ext = el('div', { class: 'event-official' });
      ext.appendChild(el('a', {
        href: e.official_url, target: '_blank', rel: 'noopener',
        onclick: 'event.stopPropagation()',
      }, '🔗 ' + (e.official_label || '公式サイト')));
      body.appendChild(ext);
    }
    link.appendChild(body);
    return link;
  }
})();
