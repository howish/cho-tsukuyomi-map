(function() {
  const CP_ICON = {
    iroka: '🦊×🐰',
    iroyachi: '🦊×🐙',
    iroroka: '🦊×🌸',
    kaguyachi: '🐰×🐙',
    trio: '🌟',
    harem: '🌹',
    mikanoi: '👹×🐯',
  };
  const TAG_ICON = {
    r18: '🔞',
    consign: '📚',
    goudou: '🤝',
    free: '🎁',
    novel: '📖',
    manga: '📕',
    illust: '🎨',
    goods: '🛍',
  };

  // Favorites stored in localStorage (set of booth IDs)
  const FAV_KEY = 'cho-tsukuyomi-map-favs';
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
    // Favorite star (top-right of card)
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

  let currentBoothIdx = -1;

  function navigateBooth(direction) {
    // Navigate through CURRENTLY VISIBLE booths (respecting filter+search)
    const visible = booths.filter(b => {
      const card = document.getElementById('booth-' + b.booth_id.toLowerCase());
      return card && card.style.display !== 'none';
    });
    if (visible.length === 0) return;
    // find current in visible
    let idx = visible.findIndex(b => b.booth_id === booths[currentBoothIdx]?.booth_id);
    if (idx === -1) idx = 0;
    const newIdx = (idx + direction + visible.length) % visible.length;
    openModal(visible[newIdx]);
  }

  function openModal(b) {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    currentBoothIdx = booths.findIndex(x => x.booth_id === b.booth_id);
    // Update URL hash for shareable deep-link (no page reload)
    try { history.replaceState(null, '', '#' + b.booth_id); } catch (e) {}

    // Prev/Next navigation bar at top
    const navBar = el('div', { class: 'modal-nav' });
    const prevBtn = el('button', {
      type: 'button',
      class: 'modal-nav-btn',
      'aria-label': '前のサークル',
      title: '前のサークル (左スワイプ)',
    }, '← 前');
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateBooth(-1); });
    const nextBtn = el('button', {
      type: 'button',
      class: 'modal-nav-btn',
      'aria-label': '次のサークル',
      title: '次のサークル (右スワイプ)',
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

    // Backup close button at end of modal body — always reachable after scrolling
    const closeBottom = el('button', {
      type: 'button',
      class: 'modal-close-bottom',
      'aria-label': '閉じる'
    }, '✕ 閉じる');
    closeBottom.addEventListener('click', closeModal);

    // Multi-image carousel — cover_urls array (or fall back to cover_url single)
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
          href: b.x_url || url,
          target: '_blank',
          rel: 'noopener',
          class: 'cover-link cover-slide'
        });
        const img = el('img', {
          src: thumbUrl,
          alt: `お品書き / 表紙 ${i+1}/${photos.length}`,
          class: 'cover-img',
          loading: i === 0 ? 'eager' : 'lazy',
          referrerpolicy: 'no-referrer'
        });
        img.addEventListener('error', () => {
          const fallback = el('div', { class: 'cover-fallback' }, [
            '🔗 画像読み込み失敗 — X 投稿で確認 →'
          ]);
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

    // Backup close button always last so reachable after any content
    body.appendChild(closeBottom);

    const modal = document.getElementById('modal');
    modal.hidden = false;
    modal.style.display = ''; // clear any inline display:none from previous close
    document.body.style.overflow = 'hidden';
    // Focus close button so Escape / Enter work immediately
    setTimeout(() => {
      const closeBtn = document.getElementById('modal-close');
      if (closeBtn) closeBtn.focus();
    }, 50);
  }

  function closeModal() {
    const m = document.getElementById('modal');
    m.hidden = true;
    m.style.display = 'none'; // belt-and-suspenders, in case CSS [hidden] doesn't win
    document.body.style.overflow = '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }

  // Render booths grouped by row
  ['A', 'B', 'C'].forEach(row => {
    const grid = document.getElementById('grid-' + row);
    booths
      .filter(b => b.booth_id.startsWith(row + '-'))
      .forEach(b => grid.appendChild(renderCard(b)));
  });

  // Filter + search (multi-filter, additive across CP/Tag rows, "all" resets)
  // NB: must declare before applyFilters() initial call to avoid TDZ
  let activeFilters = new Set(); // empty = show all
  let currentSearch = '';

  function applyFilters() {
    let visible = 0;
    const allCards = document.querySelectorAll('.booth-card');
    allCards.forEach(card => {
      const tokens = (card.dataset.filters || '').split(',');
      const search = card.dataset.search || '';
      const filterOK = activeFilters.size === 0 ||
        Array.from(activeFilters).every(f => tokens.includes(f));
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

  // Initial stats render (called after activeFilters/currentSearch declared)
  applyFilters();

  // Event delegation on document — more robust than per-button bindings
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
      // ignore swipes that started on the image carousel (let carousel handle)
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
      // significant horizontal swipe, not mostly vertical scroll
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        navigateBooth(dx > 0 ? -1 : 1);
      }
      swiping = false;
    }, { passive: true });
  })();

  // Bind close on multiple events to be resilient against mobile click quirks
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

  // Share button: Web Share API with copy-to-clipboard fallback
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const url = location.origin + location.pathname;
      const title = '超ツクヨミ祭 第1回 サークルガイド (非公式)';
      const text = '5/24 立川 超かぐや姫オンリー即売会のサークル情報 + マップ + お品書きリンク';
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
      } catch (e) {
        // user cancelled — silent
      }
    });
  }

  // Back-to-top button: show after scrolling 400px
  const backTop = document.getElementById('back-to-top');
  if (backTop) {
    window.addEventListener('scroll', () => {
      backTop.hidden = window.scrollY < 400;
    }, { passive: true });
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Deep-link: if URL has hash like #A-04 on load, open that booth's modal
  function openFromHash() {
    const m = location.hash.match(/^#([ABC]-\d{2})$/i);
    if (!m) return;
    const target = m[1].toUpperCase();
    const b = booths.find(x => x.booth_id === target);
    if (b) {
      // Slight delay to ensure DOM ready
      setTimeout(() => openModal(b), 100);
    }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
