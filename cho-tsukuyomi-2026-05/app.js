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
  const FILTERS = window.FILTERS_CONFIG || { cps: [], tags: [], warnings: [] };

  // Build lookup maps from filter config (replaces old hardcoded CP_ICON / TAG_ICON)
  const CP_ICON = {};
  (FILTERS.cps || []).forEach(c => { CP_ICON[c.code] = c.icon; });
  const TAG_ICON = {};
  (FILTERS.tags || []).forEach(t => { TAG_ICON[t.code] = t.icon; });

  // Booth-row prefixes (e.g. ['A', 'B', 'C'])
  const ROWS = EVENT.rows && EVENT.rows.length ? EVENT.rows : ['A', 'B', 'C'];

  // ---- Apply event metadata to page chrome ----
  function applyEventMetadata() {
    if (EVENT.name) document.title = `${EVENT.name} サークル ガイド`;
    const h1 = document.getElementById('event-title');
    if (h1) h1.textContent = '🌙 ' + (EVENT.name || '同人即売会');
    const info = document.getElementById('event-info');
    if (info) {
      info.innerHTML = '';
      if (EVENT.date_display) {
        info.appendChild(el('strong', null, EVENT.date_display));
        info.appendChild(document.createTextNode(' ／ ' + (EVENT.venue || '')));
      }
      if (EVENT.entry_info) {
        info.appendChild(el('br'));
        info.appendChild(document.createTextNode(EVENT.entry_info));
      }
    }
    const disc = document.getElementById('event-disclaimer');
    if (disc && EVENT.official_url) {
      disc.innerHTML = '🍃 <strong>非公式 fan guide</strong> ／ 公式情報は ' +
        `<a href="${escapeAttr(EVENT.official_url)}" target="_blank" rel="noopener">${escapeHtml(EVENT.official_label || EVENT.name)}</a> 参照。 ` +
        'サークル情報は各作家の X 投稿より引用、誤りや更新は X リンクから原ポストでご確認ください。';
    }
    if (EVENT.map_image) {
      const m = document.getElementById('venue-map');
      if (m) m.src = EVENT.map_image;
    }
    const cap = document.getElementById('map-caption');
    if (cap) cap.textContent = EVENT.map_caption || '';

    // Update OG / Twitter meta
    setMeta('og:title', `${EVENT.name} サークルガイド (非公式)`);
    setMeta('og:description', EVENT.og_description || '');
    setMeta('og:image', EVENT.og_image || 'og.png');
    setMeta('twitter:title', `${EVENT.name} サークルガイド (非公式)`);
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
        ? `Built by <a href="${escapeAttr(EVENT.built_by_url || '#')}" target="_blank" rel="noopener">${escapeHtml(EVENT.built_by_label)}</a>${EVENT.build_date ? ' ／ ' + escapeHtml(EVENT.build_date) : ''}`
        : '';
      const repo = EVENT.github_repo
        ? `情報誤り・新規追加：<a href="${escapeAttr(EVENT.github_repo)}" target="_blank" rel="noopener">GitHub repo</a> に PR / Issue 歓迎<br>`
        : '';
      footer.innerHTML =
        `<p>🌙 <strong>${escapeHtml(EVENT.name || '同人即売会')} サークルガイド</strong> — 非公式 fan guide<br>` +
        '情報は各サークル作家の X 公開ポストから集約、表紙画像は X CDN リンク (画像クリックで X 投稿で原寸表示)<br>' +
        built + '</p>' +
        '<p class="footer-meta">' + repo + (EVENT.attribution_line ? escapeHtml(EVENT.attribution_line) : '') + '</p>';
    }
  }

  function setMeta(prop, content) {
    let m = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
    if (m && content) m.setAttribute('content', content);
  }

  // ---- Build filter UI from FILTERS_CONFIG ----
  function buildFilterButtons() {
    const cpRow = document.getElementById('filters-cp');
    const tagRow = document.getElementById('filters-tag');
    if (cpRow) {
      (FILTERS.cps || []).forEach(c => {
        const btn = el('button', {
          class: 'filter-btn',
          'data-filter': 'cp:' + c.code,
          title: c.title || c.label,
        }, `${c.icon} ${c.label}`);
        cpRow.appendChild(btn);
      });
    }
    if (tagRow) {
      (FILTERS.tags || []).forEach(t => {
        const btn = el('button', {
          class: 'filter-btn',
          'data-filter': 'tag:' + t.code,
          title: t.title || t.label,
        }, `${t.icon} ${t.label}`);
        tagRow.appendChild(btn);
      });
    }
  }

  // ---- Build per-row booth grid containers ----
  function buildBoothGrids() {
    const section = document.getElementById('booths-section');
    if (!section) return;
    ROWS.forEach(row => {
      section.appendChild(el('h2', { class: 'row-title' }, `${row} 列`));
      section.appendChild(el('div', { class: 'booth-grid', id: 'grid-' + row }));
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

  const booths = (window.BOOTHS || []).slice().sort((a, b) => {
    return a.booth_id.localeCompare(b.booth_id);
  });

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
    const activeTags = Object.keys(tags).filter(k => tags[k]);
    const filterTokens = [
      ...cps.map(c => 'cp:' + c),
      ...activeTags.map(t => 'tag:' + t),
    ];
    const isFav = favs.has(b.booth_id);
    const card = el('div', {
      class: 'booth-card' + (isFav ? ' favored' : ''),
      id: 'booth-' + b.booth_id.toLowerCase(),
      'data-filters': filterTokens.join(',') + (isFav ? ',fav' : ''),
      'data-search': [b.booth_id, b.circle_name, b.author, b.x_handle].filter(Boolean).join(' ').toLowerCase(),
      role: 'button',
      tabindex: '0',
      'aria-label': `${b.booth_id} ${b.circle_name || ''} ${b.author || ''} の詳細を開く`
    });
    const star = el('button', {
      type: 'button',
      class: 'fav-star',
      title: 'お気に入りに追加 / 解除',
      'aria-label': 'お気に入りトグル',
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
    if (b.author) {
      card.appendChild(el('div', { class: 'booth-author' }, b.author));
    }
    if (b.min_price) {
      card.appendChild(el('div', { class: 'booth-price' }, '¥' + b.min_price.toLocaleString() + '〜'));
    }
    if (b.warnings && b.warnings.length) {
      const wBar = el('div', { class: 'booth-warnings' });
      b.warnings.forEach(([code, label]) => {
        wBar.appendChild(el('span', { class: 'booth-warning warn-' + code }, label));
      });
      card.appendChild(wBar);
    }
    card.addEventListener('click', () => openModal(b));
    return card;
  }

  function mdToHtml(md) {
    let s = escapeHtml(md);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[\[(.+?)\]\]/g, '<em>$1</em>');
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
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
      'aria-label': '前のサークル', title: '前のサークル (左スワイプ)',
    }, '← 前');
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateBooth(-1); });
    const nextBtn = el('button', {
      type: 'button', class: 'modal-nav-btn',
      'aria-label': '次のサークル', title: '次のサークル (右スワイプ)',
    }, '次 →');
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateBooth(1); });
    navBar.appendChild(prevBtn);
    navBar.appendChild(nextBtn);
    body.appendChild(navBar);

    body.appendChild(el('h3', null, `${b.booth_id} ${b.circle_name || ''}`));
    if (b.author) {
      body.appendChild(el('div', { class: 'modal-author' }, b.author));
    }

    const meta = el('div', { class: 'modal-meta' });
    if (b.followers != null) {
      meta.appendChild(el('span', null, `${b.followers.toLocaleString()} followers`));
    }
    if (b.x_handle) {
      meta.appendChild(el('a', {
        href: 'https://x.com/' + b.x_handle,
        target: '_blank', rel: 'noopener', class: 'handle-link',
      }, '@' + b.x_handle));
    }
    const isFavNow = favs.has(b.booth_id);
    const modalFav = el('button', {
      type: 'button',
      class: 'modal-fav' + (isFavNow ? ' favored' : ''),
      'aria-pressed': isFavNow ? 'true' : 'false',
      'aria-label': 'お気に入りトグル',
    }, isFavNow ? '★ お気に入り済' : '☆ お気に入り追加');
    modalFav.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = b.booth_id;
      const card = document.getElementById('booth-' + id.toLowerCase());
      const cardStar = card ? card.querySelector('.fav-star') : null;
      if (favs.has(id)) {
        favs.delete(id);
        modalFav.classList.remove('favored');
        modalFav.textContent = '☆ お気に入り追加';
        modalFav.setAttribute('aria-pressed', 'false');
        if (card) {
          card.classList.remove('favored');
          card.dataset.filters = (card.dataset.filters || '').split(',').filter(t => t !== 'fav').join(',');
          if (cardStar) { cardStar.textContent = '☆'; cardStar.setAttribute('aria-pressed', 'false'); }
        }
      } else {
        favs.add(id);
        modalFav.classList.add('favored');
        modalFav.textContent = '★ お気に入り済';
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

    if (b.x_url) {
      body.appendChild(el('a', {
        class: 'x-link', href: b.x_url, target: '_blank', rel: 'noopener'
      }, '🔗 X で開く (お品書き原典)'));
    }

    const closeBottom = el('button', {
      type: 'button', class: 'modal-close-bottom', 'aria-label': '閉じる'
    }, '✕ 閉じる');
    closeBottom.addEventListener('click', closeModal);

    const photos = b.cover_urls && b.cover_urls.length
      ? b.cover_urls
      : (b.cover_url ? [b.cover_url] : []);
    if (photos.length) {
      const carousel = el('div', { class: 'cover-carousel' });
      photos.forEach((url, i) => {
        const thumbUrl = /\?name=/.test(url)
          ? url.replace(/\?name=[^&]+/, '?name=small')
          : url + '?name=small';
        const coverLink = el('a', {
          href: b.x_url || url, target: '_blank', rel: 'noopener',
          class: 'cover-link cover-slide'
        });
        const img = el('img', {
          src: thumbUrl,
          alt: `お品書き / 表紙 ${i+1}/${photos.length}`,
          class: 'cover-img', loading: i === 0 ? 'eager' : 'lazy',
          referrerpolicy: 'no-referrer'
        });
        img.addEventListener('error', () => {
          const fallback = el('div', { class: 'cover-fallback' }, '🔗 画像読み込み失敗 — X 投稿で確認 →');
          coverLink.replaceChild(fallback, img);
        });
        coverLink.appendChild(img);
        carousel.appendChild(coverLink);
      });
      body.appendChild(carousel);
      if (photos.length > 1) {
        body.appendChild(el('p', { class: 'carousel-hint' }, `← 横にスワイプで全 ${photos.length} 枚 →`));
      }
    }

    const bodyDiv = el('div', { class: 'modal-body-md' });
    bodyDiv.innerHTML = mdToHtml(b.body || '');
    body.appendChild(bodyDiv);

    if (b.alts && b.alts.length) {
      body.appendChild(el('h4', null, '同じブースの他メンバー'));
      b.alts.forEach(a => {
        const altDiv = el('div', { class: 'modal-body-md', style: 'border-top:1px dashed #ccc;margin-top:0.8rem;padding-top:0.8rem;' });
        let alt_html = `<strong>${escapeHtml(a.circle_name || '')}</strong>`;
        if (a.author) alt_html += ` (${escapeHtml(a.author)})`;
        if (a.x_url) alt_html += ` <a href="${escapeAttr(a.x_url)}" target="_blank" rel="noopener">@${escapeHtml(a.x_handle)}</a>`;
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
  buildFilterButtons();
  buildBoothGrids();

  // Render booths grouped by row
  ROWS.forEach(row => {
    const grid = document.getElementById('grid-' + row);
    if (!grid) return;
    booths
      .filter(b => b.booth_id.startsWith(row + '-'))
      .forEach(b => grid.appendChild(renderCard(b)));
  });

  let activeFilters = new Set();
  let currentSearch = '';

  function applyFilters() {
    let visible = 0;
    const allCards = document.querySelectorAll('.booth-card');
    allCards.forEach(card => {
      const tokens = (card.dataset.filters || '').split(',');
      const search = card.dataset.search || '';
      const filterOK = activeFilters.size === 0 ||
        Array.from(activeFilters).some(f => tokens.includes(f));
      const searchOK = !currentSearch || search.includes(currentSearch);
      const show = filterOK && searchOK;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    const stats = document.getElementById('filter-stats');
    if (stats) {
      const total = allCards.length;
      const isFiltered = activeFilters.size > 0 || currentSearch;
      stats.textContent = isFiltered
        ? `表示中 ${visible} / 全 ${total} ブース (絞り込み中)`
        : `全 ${total} ブース`;
      stats.classList.toggle('filtered', isFiltered);
    }
  }

  applyFilters();

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
      const title = `${EVENT.name || '同人即売会'} サークルガイド (非公式)`;
      const text = EVENT.share_text || (EVENT.name || '') + ' サークル情報 + マップ';
      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          shareBtn.textContent = '✅ URL コピー済み';
          shareBtn.classList.add('copied');
          setTimeout(() => {
            shareBtn.textContent = '🔗 このサイトを共有';
            shareBtn.classList.remove('copied');
          }, 2500);
        } else {
          prompt('URL を選択してコピー：', url);
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
})();
