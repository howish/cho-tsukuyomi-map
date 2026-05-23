(function() {
  const booths = (window.BOOTHS || []).slice().sort((a, b) => {
    return a.booth_id.localeCompare(b.booth_id);
  });

  // Factual tags computed from body content
  function deriveFlags(b) {
    const body = (b.body || '') + (b.alts ? b.alts.map(a => a.body).join(' ') : '');
    return {
      new: /新刊/.test(body),
      r18: /R-?18|🔞|成人向け/.test(body),
      cash: /現金のみ|高額紙幣\s*NG|お釣り\s*NG/i.test(body),
      consign: /委託/.test(body),
    };
  }

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

  function renderCard(b) {
    const flags = deriveFlags(b);
    const card = el('div', {
      class: 'booth-card',
      'data-flags': Object.keys(flags).filter(k => flags[k]).join(','),
      'data-search': [b.circle_name, b.author, b.x_handle].filter(Boolean).join(' ').toLowerCase()
    });
    const tagBar = el('div', { class: 'booth-tags' });
    if (flags.new) tagBar.appendChild(el('span', { class: 'tag tag-new', title: '新刊あり' }, '🆕'));
    if (flags.r18) tagBar.appendChild(el('span', { class: 'tag tag-r18', title: 'R-18 含む' }, '🔞'));
    if (flags.cash) tagBar.appendChild(el('span', { class: 'tag tag-cash', title: '現金・高額紙幣 NG 系' }, '💴'));
    if (flags.consign) tagBar.appendChild(el('span', { class: 'tag tag-consign', title: '委託本あり' }, '📚'));
    card.appendChild(tagBar);
    card.appendChild(el('div', { class: 'booth-id' }, b.booth_id));
    if (b.circle_name) {
      card.appendChild(el('div', { class: 'booth-name' }, b.circle_name));
    }
    if (b.author) {
      card.appendChild(el('div', { class: 'booth-author' }, b.author));
    }
    card.addEventListener('click', () => openModal(b));
    return card;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Minimal markdown to HTML: bold, links, wikilinks (strip)
  function mdToHtml(md) {
    let s = escapeHtml(md);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[\[(.+?)\]\]/g, '<em>$1</em>');
    // Plain http/https URLs → links
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  function openModal(b) {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';

    body.appendChild(el('h3', null, `${b.booth_id} ${b.circle_name || ''}`));
    if (b.author) {
      body.appendChild(el('div', { class: 'modal-author' }, b.author));
    }

    const meta = el('div', { class: 'modal-meta' });
    if (b.followers != null) {
      meta.appendChild(el('span', null, `${b.followers.toLocaleString()} followers`));
    }
    if (b.x_handle) {
      meta.appendChild(el('span', null, '@' + b.x_handle));
    }
    body.appendChild(meta);

    if (b.x_url) {
      const link = el('a', {
        class: 'x-link',
        href: b.x_url,
        target: '_blank',
        rel: 'noopener'
      }, '🔗 X で開く (お品書き原典)');
      body.appendChild(link);
    }

    const bodyDiv = el('div', { class: 'modal-body-md' });
    bodyDiv.innerHTML = mdToHtml(b.body || '');
    body.appendChild(bodyDiv);

    if (b.alts && b.alts.length) {
      const altsTitle = el('h4', null, '同じブースの他メンバー');
      body.appendChild(altsTitle);
      b.alts.forEach(a => {
        const altDiv = el('div', { class: 'modal-body-md', style: 'border-top:1px dashed #ccc;margin-top:0.8rem;padding-top:0.8rem;' });
        let alt_html = `<strong>${escapeHtml(a.circle_name || '')}</strong>`;
        if (a.author) alt_html += ` (${escapeHtml(a.author)})`;
        if (a.x_url) alt_html += ` <a href="${escapeHtml(a.x_url)}" target="_blank" rel="noopener">@${escapeHtml(a.x_handle)}</a>`;
        alt_html += '<br>' + mdToHtml(a.body || '');
        altDiv.innerHTML = alt_html;
        body.appendChild(altDiv);
      });
    }

    document.getElementById('modal').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal').hidden = true;
    document.body.style.overflow = '';
  }

  // Render booths grouped by row
  ['A', 'B', 'C'].forEach(row => {
    const grid = document.getElementById('grid-' + row);
    booths
      .filter(b => b.booth_id.startsWith(row + '-'))
      .forEach(b => grid.appendChild(renderCard(b)));
  });

  // Filter + search
  let currentFlag = 'all';
  let currentSearch = '';

  function applyFilters() {
    document.querySelectorAll('.booth-card').forEach(card => {
      const flags = (card.dataset.flags || '').split(',');
      const search = card.dataset.search || '';
      const flagOK = currentFlag === 'all' || flags.includes(currentFlag);
      const searchOK = !currentSearch || search.includes(currentSearch);
      card.style.display = (flagOK && searchOK) ? '' : 'none';
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFlag = btn.dataset.flag;
      applyFilters();
    });
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('modal').hidden) closeModal();
  });
})();
