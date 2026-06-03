/**
 * Author name review queue — pairs with index.html.
 *
 * Loads window.CIRCLES_BY_ID + window.AUTHORS_BY_ID from ../circles.js
 * (SSOT). For each author with name_source='circle_name' (or all, when the
 * status filter is "all"), renders a card with the SNS profile URLs and a
 * decision form. Decisions are batched in localStorage and submitted via
 * GitHub Issue (existing 修正モード V1 pipeline) or downloaded as JSON for
 * direct apply by the author-name-resolver skill.
 */
(function () {
  const REPO = 'https://github.com/howish/cho-tsukuyomi-map';
  const STORAGE_KEY = 'review-pending-decisions-v1';
  const GH_ISSUE_BODY_CAP = 7000;  // browser URL bar safe ceiling

  const CIRCLES = window.CIRCLES_BY_ID || {};
  const AUTHORS = window.AUTHORS_BY_ID || {};
  const WS_CANDIDATES = window.WS_CANDIDATES || {};  // {author_id: [{url, platform, snippet, confidence}]}

  // ---- DOM helpers ----
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e[k] = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        if (typeof c === 'string' || typeof c === 'number') e.appendChild(document.createTextNode(String(c)));
        else e.appendChild(c);
      });
    }
    return e;
  }

  // ---- Build author → circles inverted index ----
  const AUTHOR_CIRCLES = {};
  for (const cid in CIRCLES) {
    const c = CIRCLES[cid];
    for (const aid of (c.members || [])) {
      (AUTHOR_CIRCLES[aid] = AUTHOR_CIRCLES[aid] || []).push(c);
    }
  }

  // ---- Pending decisions (localStorage) ----
  // pending[author_id] = name-decision (rename / skip), one per author.
  // pending_socials[author_id] = [{platform, url, handle}, ...] add_social ops.
  function loadPending() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { return {}; }
  }
  function loadPendingSocials() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-socials') || '{}');
    } catch (e) { return {}; }
  }
  function loadPendingRemovals() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-removals') || '{}');
    } catch (e) { return {}; }
  }
  function loadPendingAliases() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-aliases') || '{}');
    } catch (e) { return {}; }
  }
  function loadPendingAliasRemovals() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-alias-removals') || '{}');
    } catch (e) { return {}; }
  }
  function loadPendingNewMembers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-new-members') || '[]');
    } catch (e) { return []; }
  }
  function savePending(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }
  function savePendingSocials(ps) {
    localStorage.setItem(STORAGE_KEY + '-socials', JSON.stringify(ps));
  }
  function savePendingRemovals(pr) {
    localStorage.setItem(STORAGE_KEY + '-removals', JSON.stringify(pr));
  }
  function savePendingAliases(pa) {
    localStorage.setItem(STORAGE_KEY + '-aliases', JSON.stringify(pa));
  }
  function savePendingAliasRemovals(par) {
    localStorage.setItem(STORAGE_KEY + '-alias-removals', JSON.stringify(par));
  }
  function savePendingNewMembers(pn) {
    localStorage.setItem(STORAGE_KEY + '-new-members', JSON.stringify(pn));
  }
  let pending = loadPending();
  let pendingSocials = loadPendingSocials();
  let pendingRemovals = loadPendingRemovals();           // {author_id: [url, ...]}
  let pendingAliases = loadPendingAliases();             // {author_id: [alias, ...]} - to add
  let pendingAliasRemovals = loadPendingAliasRemovals(); // {author_id: [alias, ...]} - to remove
  // pendingNewMembers — flat array of {tempId, circle_id, name, source, socials[], aliases[]}
  let pendingNewMembers = loadPendingNewMembers();

  function isAliasMarkedForRemoval(aid, alias) {
    return (pendingAliasRemovals[aid] || []).includes(alias);
  }
  function toggleAliasRemoval(aid, alias) {
    const arr = pendingAliasRemovals[aid] = pendingAliasRemovals[aid] || [];
    const i = arr.indexOf(alias);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(alias);
    if (arr.length === 0) delete pendingAliasRemovals[aid];
    savePendingAliasRemovals(pendingAliasRemovals);
    render();
  }

  function isMarkedForRemoval(aid, url) {
    return (pendingRemovals[aid] || []).includes(url);
  }
  function toggleRemoval(aid, url) {
    const arr = pendingRemovals[aid] = pendingRemovals[aid] || [];
    const i = arr.indexOf(url);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(url);
    if (arr.length === 0) delete pendingRemovals[aid];
    savePendingRemovals(pendingRemovals);
    render();
  }

  // Auto-detect platform from URL host.
  const PLATFORM_FROM_HOST = [
    [/(?:^|\/\/)(?:www\.)?(?:x\.com|twitter\.com)\//, 'x'],
    [/(?:^|\/\/)(?:www\.)?plurk\.com\//, 'plurk'],
    [/(?:^|\/\/)(?:www\.)?(?:facebook\.com|fb\.com|m\.facebook\.com|fb\.me)\//, 'fb'],
    [/(?:^|\/\/)(?:www\.)?instagram\.com\//, 'ig'],
    [/(?:^|\/\/)(?:www\.)?threads\.(?:com|net)\//, 'threads'],
    [/(?:^|\/\/)bsky\.app\//, 'bsky'],
    [/(?:^|\/\/)(?:www\.)?pixiv\.net\//, 'pixiv'],
    [/(?:^|\/\/)(?:www\.)?doujin\.com\.tw\//, 'doujin_tw'],
    [/(?:^|\/\/)(?:lit\.link|linktr\.ee|portaly\.cc)\//, 'aggregator'],
    [/\.booth\.pm\//, 'booth_pm'],
    [/\.wixsite\.com\//, 'wix'],
    [/\.tumblr\.com\//, 'blog'],
    [/(?:youtube\.com|youtu\.be)\//, 'generic'],
  ];
  function detectPlatform(url) {
    if (!url) return 'generic';
    for (const [rx, plat] of PLATFORM_FROM_HOST) if (rx.test(url)) return plat;
    return 'generic';
  }
  function extractHandle(url, platform) {
    if (!url) return '';
    // Handle pattern depends on platform; pick the last meaningful path segment
    const m = url.match(/(?:^|\/)([^\/\?#]+)\/?(?:[\?#]|$)/g);
    if (!m || m.length === 0) return '';
    const last = m[m.length - 1].replace(/[\/\?#]/g, '');
    return last ? '@' + last : '';
  }

  // ---- Source dropdown options ----
  const SOURCE_OPTIONS = [
    { value: 'user', label: 'user (確定)' },
    { value: 'user_unknown', label: '不明で永続 skip (本名なし)' },
    { value: 'x_profile', label: 'x_profile' },
    { value: 'plurk_profile', label: 'plurk_profile' },
    { value: 'fb_profile', label: 'fb_profile' },
    { value: 'ig_profile', label: 'ig_profile' },
    { value: 'threads_profile', label: 'threads_profile' },
    { value: 'doujin_tw_profile', label: 'doujin_tw_profile' },
    { value: 'pixiv_profile', label: 'pixiv_profile' },
    { value: 'bsky_profile', label: 'bsky_profile' },
    { value: 'aggregator_profile', label: 'aggregator_profile' },
    { value: 'generic_profile', label: 'generic_profile' },
  ];

  // ---- Per-platform note ヤチヨ's hint ----
  const PLATFORM_NOTES = {
    plurk: 'Plurk: ページ上部 display_name (例: 珀琳圍牆@親子通信 → 珀琳圍牆) を確認',
    fb: 'FB: page title (個人名なら確定、brand 名なら skip 検討)',
    ig: 'IG: profile に display_name + @handle、ログイン要求出ても見えるはず',
    plain: 'プロファイルを開いて display_name を確認',
    threads: 'Threads: profile に display_name + bio',
    bsky: 'Bluesky: profile に display_name',
    pixiv: 'pixiv: profile に表示名',
    aggregator: 'aggregator (lit.link/linktree/portaly): brand 名表示が多い',
    doujin_tw: 'doujin.com.tw: nick + 同人誌 history 確認',
    x: 'X: profile display name',
    _none: '⚠️ SNS URL なし、recon 困難 — skip 推奨',
  };

  // ---- Author list + filters ----
  function authorList() {
    return Object.values(AUTHORS);
  }

  let filterStatus = 'unresolved';  // 'unresolved' | 'all'
  const filterEvents = new Set();   // selected event slugs (empty = all)
  const filterPlatforms = new Set(); // selected platforms (empty = all)

  function authorPrimaryPlatform(a) {
    const s = a.socials || [];
    if (s.length === 0) return '_none';
    // Prefer x if available, else first social
    const x = s.find(x => x.platform === 'x');
    return (x ? 'x' : (s[0].platform || 'generic'));
  }

  function authorPrimaryUrl(a) {
    const s = a.socials || [];
    const x = s.find(x => x.platform === 'x');
    return (x ? x.url : (s[0] && s[0].url)) || '';
  }

  function authorMatchesFilters(a) {
    // Status — "unresolved" includes both inferred-from-circle-name (the
    // skill never confirmed) AND audit_flagged (deep-cleanup audit pushed
    // an ambiguous name in here for human judgment).
    if (filterStatus === 'unresolved') {
      const unresolvedSrc = a.name_source === 'circle_name' || a.name_source === 'audit_flagged';
      if (!unresolvedSrc && !pending[a.id]) return false;
    }
    // Event
    if (filterEvents.size > 0) {
      const circles = AUTHOR_CIRCLES[a.id] || [];
      const events = new Set();
      for (const c of circles) for (const e of (c.events || [])) events.add(e.slug);
      let hit = false;
      for (const s of events) if (filterEvents.has(s)) { hit = true; break; }
      if (!hit) return false;
    }
    // Platform
    if (filterPlatforms.size > 0) {
      if (!filterPlatforms.has(authorPrimaryPlatform(a))) return false;
    }
    return true;
  }

  function authorMatchesSearch(a, q) {
    if (!q) return true;
    const blob = [
      a.id, a.name, a.name_inferred,
      ...(a.aliases || []),
      ...(AUTHOR_CIRCLES[a.id] || []).map(c => c.circle_name),
      ...(a.socials || []).map(s => s.handle || ''),
    ].filter(Boolean).join(' ').toLowerCase();
    return blob.includes(q.toLowerCase());
  }

  // ---- Card rendering ----
  function renderCard(a) {
    const decision = pending[a.id] || null;
    const cls = decision
      ? (decision.decision === 'skip' ? 'author-card skip-decision' : 'author-card has-decision')
      : 'author-card';
    const card = el('div', { class: cls });

    // Head — circle name big + current/source/author_id sub-row
    const head = el('div', { class: 'card-head' });

    // Circle line (big, prominent)
    const circles = AUTHOR_CIRCLES[a.id] || [];
    const circleLine = el('div', { class: 'card-circle-line' });
    if (circles.length) {
      circles.forEach((c, i) => {
        if (i > 0) circleLine.appendChild(document.createTextNode('・'));
        const firstEv = (c.events || [])[0];
        if (firstEv) {
          circleLine.appendChild(el('a', {
            class: 'card-circle-link',
            href: `../${firstEv.slug}/#${firstEv.booth_id}`,
            target: '_blank', rel: 'noopener',
          }, c.circle_name || c.id));
        } else {
          circleLine.appendChild(el('span', {}, c.circle_name || c.id));
        }
        const events = (c.events || []).map(e => `${e.slug.split('-')[0]} ${e.booth_id}`);
        if (events.length) {
          circleLine.appendChild(el('span', { class: 'card-circle-events' }, events.join(', ')));
        }
      });
    } else {
      circleLine.appendChild(el('span', {}, '(circle なし)'));
    }
    head.appendChild(circleLine);

    // Current state row
    const displayName = a.name || a.name_inferred || '(空)';
    const isFlagged = a.name_source === 'audit_flagged';
    const isInferred = a.name_source === 'circle_name';
    const isConfirmed = !isInferred && !isFlagged && a.name_source !== '';
    const curRow = el('div', { class: 'card-current-row' });
    curRow.appendChild(el('span', { class: 'card-current-label' }, '現:'));
    curRow.appendChild(el('span', {
      class: 'card-current-name' + (isConfirmed ? ' confirmed' : '') + (isFlagged ? ' flagged' : ''),
    }, displayName));
    curRow.appendChild(el('span', {
      class: 'card-source-tag' + (isInferred ? ' inferred' : '') + (isFlagged ? ' flagged' : ''),
    }, a.name_source || '(empty)'));
    if (isFlagged && a.name_audit_reason) {
      curRow.appendChild(el('span', {
        class: 'card-audit-reason',
        title: 'deep-cleanup audit でフラグ — 人間判断待ち',
      }, '⚠ ' + a.name_audit_reason));
    }
    curRow.appendChild(el('span', { class: 'card-author-id' }, a.id));
    head.appendChild(curRow);

    // Alias row — existing aliases (with × to remove) + pending aliases + add form
    const existingAliases = a.aliases || [];
    const pendingAdds = pendingAliases[a.id] || [];
    if (existingAliases.length || pendingAdds.length) {
      const aliasRow = el('div', { class: 'card-alias-row' });
      aliasRow.appendChild(el('span', { class: 'card-alias-label' }, '別名:'));
      existingAliases.forEach(al => {
        const marked = isAliasMarkedForRemoval(a.id, al);
        const chip = el('span', {
          class: 'alias-chip' + (marked ? ' marked-remove' : ''),
        });
        chip.appendChild(el('span', { class: 'alias-text' }, al));
        chip.appendChild(el('button', {
          type: 'button',
          class: 'alias-remove',
          title: marked ? '削除を取消' : 'この別名を削除',
          onclick: () => toggleAliasRemoval(a.id, al),
        }, marked ? '↺' : '×'));
        aliasRow.appendChild(chip);
      });
      pendingAdds.forEach((al, idx) => {
        const chip = el('span', { class: 'alias-chip pending-add' });
        chip.appendChild(el('span', { class: 'alias-text' }, '+ ' + al));
        chip.appendChild(el('button', {
          type: 'button',
          class: 'alias-remove',
          title: 'pending 追加を取消',
          onclick: () => {
            pendingAliases[a.id].splice(idx, 1);
            if (pendingAliases[a.id].length === 0) delete pendingAliases[a.id];
            savePendingAliases(pendingAliases);
            render();
          },
        }, '×'));
        aliasRow.appendChild(chip);
      });
      head.appendChild(aliasRow);
    }

    // Add-alias inline form (always available)
    const aliasAddBlock = el('div', { class: 'add-alias-block' });
    const aliasInput = el('input', {
      type: 'text',
      placeholder: '+ 別名追加 (例: 庫里、本名 etc)',
      class: 'add-alias-input',
    });
    const aliasAddBtn = el('button', {
      type: 'button',
      class: 'add-alias-btn',
      onclick: () => {
        const al = (aliasInput.value || '').trim();
        if (!al) return;
        const arr = pendingAliases[a.id] = pendingAliases[a.id] || [];
        if (al === a.name || al === a.name_inferred || arr.includes(al) || (a.aliases || []).includes(al)) {
          alert('重複している、もう登録済み');
          return;
        }
        arr.push(al);
        savePendingAliases(pendingAliases);
        aliasInput.value = '';
        render();
      },
    }, '+');
    aliasInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); aliasAddBtn.click(); }
    });
    aliasAddBlock.appendChild(aliasInput);
    aliasAddBlock.appendChild(aliasAddBtn);
    head.appendChild(aliasAddBlock);

    card.appendChild(head);

    // Probe links — all from socials[] (x_handle is gone, X URL is just
    // another socials entry now).
    const links = el('div', { class: 'card-probe-links' });

    function chipWithRemove(url, labelText) {
      const marked = isMarkedForRemoval(a.id, url);
      const wrap = el('span', {
        class: 'card-probe-link existing' + (marked ? ' marked-remove' : ''),
      });
      wrap.appendChild(el('a', {
        class: 'existing-link',
        href: url,
        target: '_blank', rel: 'noopener',
      }, labelText));
      wrap.appendChild(el('button', {
        type: 'button',
        class: 'existing-remove',
        title: marked ? '削除を取消' : 'この link を削除',
        onclick: () => toggleRemoval(a.id, url),
      }, marked ? '↺' : '×'));
      return wrap;
    }

    for (const s of (a.socials || [])) {
      if (!s.url) continue;
      const label = (s.platform || '🔗') + (s.handle ? ' ' + s.handle : '');
      links.appendChild(chipWithRemove(s.url, label));
    }
    // Pending-added socials (visually distinct)
    const adds = pendingSocials[a.id] || [];
    adds.forEach((s, idx) => {
      const wrap = el('span', { class: 'card-probe-link pending-add', title: 'pending 追加' });
      wrap.appendChild(el('a', {
        href: s.url,
        target: '_blank', rel: 'noopener',
        class: 'pending-add-link',
      }, '+ ' + s.platform + (s.handle ? ' ' + s.handle : '')));
      wrap.appendChild(el('button', {
        type: 'button',
        class: 'pending-add-remove',
        title: 'pending 追加を取消',
        onclick: () => {
          pendingSocials[a.id].splice(idx, 1);
          if (pendingSocials[a.id].length === 0) delete pendingSocials[a.id];
          savePendingSocials(pendingSocials);
          render();
        },
      }, '×'));
      links.appendChild(wrap);
    });
    if (!links.children.length) {
      links.appendChild(el('span', { class: 'card-probe-link no-links' }, '⚠️ SNS リンクなし'));
    }
    card.appendChild(links);

    // Add-social inline form (collapsed by default)
    const addBlock = el('div', { class: 'add-social-block' });
    const addToggle = el('button', {
      type: 'button',
      class: 'add-social-toggle',
      onclick: () => addBlock.classList.toggle('open'),
    }, '+ SNS link 追加');
    const addForm = el('div', { class: 'add-social-form' });

    const urlInput = el('input', {
      type: 'url',
      placeholder: 'URL (https://...)',
      class: 'add-social-url',
    });
    const platSelect = el('select', { class: 'add-social-platform' });
    const PLAT_OPTIONS = ['x', 'plurk', 'fb', 'ig', 'threads', 'bsky', 'pixiv',
      'doujin_tw', 'aggregator', 'booth_pm', 'wix', 'blog', 'gamer', 'generic'];
    for (const p of PLAT_OPTIONS) {
      platSelect.appendChild(el('option', { value: p }, p));
    }
    const handleInput = el('input', {
      type: 'text',
      placeholder: 'handle (任意、例: @foo)',
      class: 'add-social-handle',
    });
    // Auto-detect platform + handle as user types URL
    urlInput.addEventListener('input', () => {
      const u = urlInput.value.trim();
      if (u) {
        const p = detectPlatform(u);
        platSelect.value = p;
        if (!handleInput.value) handleInput.value = extractHandle(u, p);
      }
    });
    const addBtn = el('button', {
      type: 'button',
      class: 'add-social-add',
      onclick: () => {
        let u = urlInput.value.trim();
        if (!u) { alert('URL を入力してください'); return; }
        if (!/^https?:\/\//.test(u)) u = 'https://' + u;
        const platform = platSelect.value;
        const handle = handleInput.value.trim();
        (pendingSocials[a.id] = pendingSocials[a.id] || []).push({ platform, url: u, handle });
        savePendingSocials(pendingSocials);
        // Reset form
        urlInput.value = '';
        handleInput.value = '';
        addBlock.classList.remove('open');
        render();
      },
    }, '+ 追加');

    addForm.appendChild(urlInput);
    const row2 = el('div', { class: 'add-social-row' });
    row2.appendChild(platSelect);
    row2.appendChild(handleInput);
    row2.appendChild(addBtn);
    addForm.appendChild(row2);
    addBlock.appendChild(addToggle);
    addBlock.appendChild(addForm);
    card.appendChild(addBlock);

    // Yachiyo note
    const plat = authorPrimaryPlatform(a);
    const note = PLATFORM_NOTES[plat] || PLATFORM_NOTES.plain;
    card.appendChild(el('div', { class: 'card-yachiyo-note' }, '💭 ' + note));

    // WebSearch candidates (if any) — surface as clickable chips with snippet
    const wsHits = WS_CANDIDATES[a.id] || [];
    if (wsHits.length) {
      const wsBlock = el('div', { class: 'card-ws-block' });
      wsBlock.appendChild(el('div', { class: 'card-ws-label' }, '🌐 WebSearch 候補 (click で実物確認 → 下の + で追加)'));
      const list = el('div', { class: 'card-ws-list' });
      wsHits.forEach(h => {
        const item = el('div', { class: 'card-ws-item conf-' + (h.confidence || 'medium') });
        const link = el('a', {
          href: h.url, target: '_blank', rel: 'noopener',
          class: 'card-ws-link',
        }, `${h.platform || '🔗'} → ${h.url}`);
        item.appendChild(link);
        if (h.snippet) {
          item.appendChild(el('div', { class: 'card-ws-snippet' }, '💬 ' + h.snippet));
        }
        // Quick-add button: prefills the add-social form
        const addBtn = el('button', {
          type: 'button',
          class: 'card-ws-add',
          title: 'この URL を pending 追加',
          onclick: () => {
            (pendingSocials[a.id] = pendingSocials[a.id] || []).push({
              platform: h.platform || 'generic',
              url: h.url,
              handle: '',
            });
            savePendingSocials(pendingSocials);
            render();
          },
        }, '+ 追加');
        item.appendChild(addBtn);
        list.appendChild(item);
      });
      wsBlock.appendChild(list);
      card.appendChild(wsBlock);
    }

    // Decision badge or form
    if (decision) {
      const dDiv = el('div', { class: 'card-form-decision' });
      const text = el('span', { class: 'decision-text' });
      if (decision.decision === 'rename') {
        text.appendChild(document.createTextNode(`✅ → ${decision.name} (${decision.source})`));
      } else {
        text.appendChild(document.createTextNode('⏭ skip — 本名不明で永続'));
      }
      dDiv.appendChild(text);
      dDiv.appendChild(el('button', {
        class: 'remove-btn',
        type: 'button',
        onclick: () => { delete pending[a.id]; savePending(pending); render(); },
      }, '取消'));
      card.appendChild(dDiv);
    } else {
      const form = el('form', { class: 'card-form', onsubmit: (e) => e.preventDefault() });

      // Pre-fill: if audit-flagged with a structured suggestion, default
      // the input to the suggested name (one-click accept-able). Else
      // fall back to name_inferred as before.
      const suggestion = a.name_audit_suggestion || null;
      const presetName = suggestion ? suggestion.name : (a.name_inferred || '');

      const nameInput = el('input', {
        type: 'text',
        name: 'name',
        placeholder: '本人の display_name',
        value: presetName,
      });

      const sourceSelect = el('select', { name: 'source' });
      // When audit-flagged, restore the original (pre-flag) source as the
      // default — the cleanup didn't change WHERE we got the name from,
      // just normalized the value.
      const defaultSource = (a.name_source === 'audit_flagged' && a.name_source_prev) ? a.name_source_prev
        : plat === 'x' ? 'x_profile' : plat === 'plurk' ? 'plurk_profile'
        : plat === 'fb' ? 'fb_profile' : plat === 'ig' ? 'ig_profile'
        : plat === 'threads' ? 'threads_profile' : plat === 'bsky' ? 'bsky_profile'
        : plat === 'pixiv' ? 'pixiv_profile' : plat === 'doujin_tw' ? 'doujin_tw_profile'
        : plat === 'aggregator' ? 'aggregator_profile' : 'user';
      let foundOpt = false;
      for (const o of SOURCE_OPTIONS) {
        const opt = el('option', { value: o.value }, o.label);
        if (o.value === defaultSource) { opt.selected = true; foundOpt = true; }
        sourceSelect.appendChild(opt);
      }
      if (!foundOpt && defaultSource) {
        // Original source not in dropdown (e.g. fb_review_title_strip) —
        // append it so the reviewer can preserve it.
        const opt = el('option', { value: defaultSource }, defaultSource);
        opt.selected = true;
        sourceSelect.appendChild(opt);
      }

      // Row 1: name input + source select
      const row1 = el('div', { class: 'card-form-row' });
      row1.appendChild(nameInput);
      row1.appendChild(sourceSelect);
      form.appendChild(row1);

      // Row 2: confirm + skip + (if suggestion exists) one-click accept
      const actions = el('div', { class: 'card-form-actions' });
      if (suggestion) {
        // ✨ Load-suggestion button — populates the form with the proposed
        // name + aliases WITHOUT finalising. Reviewer can still edit the
        // input or remove alias chips, then click ✅ 確定 to commit.
        actions.appendChild(el('button', {
          type: 'button',
          class: 'confirm-btn accept-suggestion-btn',
          title: '提案を入力欄に反映 — 確定するには ✅ を押す',
          onclick: () => {
            nameInput.value = suggestion.name;
            // Queue suggested aliases as pending adds (dedup against
            // existing author aliases + already-queued pending adds)
            const existing = a.aliases || [];
            const alreadyPending = pendingAliases[a.id] || [];
            const adds = (suggestion.aliases || []).filter(
              al => !existing.includes(al) && !alreadyPending.includes(al)
            );
            if (adds.length) {
              pendingAliases[a.id] = alreadyPending.concat(adds);
              savePendingAliases(pendingAliases);
            }
            render();
          },
        }, '✨ 提案 反映'));
      }
      actions.appendChild(el('button', {
        type: 'button',
        class: 'confirm-btn',
        onclick: () => {
          const name = (nameInput.value || '').trim();
          const source = sourceSelect.value;
          if (source === 'user_unknown') {
            pending[a.id] = { author_id: a.id, decision: 'skip' };
          } else {
            if (!name) { alert('name を入力してください'); return; }
            pending[a.id] = { author_id: a.id, decision: 'rename', name, source };
          }
          savePending(pending);
          render();
        },
      }, '✅ 確定'));
      actions.appendChild(el('button', {
        type: 'button',
        class: 'skip-btn',
        onclick: () => {
          pending[a.id] = { author_id: a.id, decision: 'skip' };
          savePending(pending);
          render();
        },
      }, '⏭ skip'));
      form.appendChild(actions);

      card.appendChild(form);
    }

    // ---- Add-member section (合同サークル 等で 2nd author を追加) ----
    // For each circle this author belongs to, show pending new-members
    // already queued + a "+ メンバー" button to open an inline form.
    (AUTHOR_CIRCLES[a.id] || []).forEach(c => {
      const sect = el('div', { class: 'card-addmember' });
      sect.appendChild(el('div', { class: 'card-addmember-label' },
        `+ メンバー追加 to サークル「${c.circle_name || c.id}」`));

      // List queued new members for this circle
      pendingNewMembers
        .filter(m => m.circle_id === c.id)
        .forEach(m => {
          const row = el('div', { class: 'card-addmember-pending' });
          const socials_summary = (m.socials || []).map(s => `${s.platform}:${s.url.replace(/^https?:\/\//, '')}`).join(', ');
          row.appendChild(el('span', {}, `🆕 ${m.name} (${m.source})${socials_summary ? ' — ' + socials_summary : ''}`));
          row.appendChild(el('button', {
            type: 'button',
            class: 'remove-btn',
            onclick: () => {
              pendingNewMembers = pendingNewMembers.filter(x => x.tempId !== m.tempId);
              savePendingNewMembers(pendingNewMembers);
              render();
            },
          }, '×'));
          sect.appendChild(row);
        });

      // Toggle button + inline form
      const formWrap = el('div', { class: 'card-addmember-form', style: 'display:none;' });
      const nameIn = el('input', { type: 'text', placeholder: '新 author の名前' });
      const xUrlIn = el('input', { type: 'text', placeholder: 'X URL (任意, https://x.com/...)' });
      const sourceSel = el('select');
      for (const o of SOURCE_OPTIONS) {
        const opt = el('option', { value: o.value }, o.label);
        if (o.value === 'user') opt.selected = true;
        sourceSel.appendChild(opt);
      }
      const submitBtn = el('button', {
        type: 'button',
        class: 'confirm-btn',
        onclick: () => {
          const name = (nameIn.value || '').trim();
          if (!name) { alert('名前を入力してください'); return; }
          const socials = [];
          const xUrl = (xUrlIn.value || '').trim();
          if (xUrl) socials.push({ platform: 'x', url: xUrl });
          const tempId = 'new_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
          pendingNewMembers.push({
            tempId,
            circle_id: c.id,
            name,
            source: sourceSel.value,
            socials,
            aliases: [],
          });
          savePendingNewMembers(pendingNewMembers);
          nameIn.value = ''; xUrlIn.value = '';
          render();
        },
      }, '+ 追加');
      const cancelBtn = el('button', {
        type: 'button',
        class: 'skip-btn',
        onclick: () => { formWrap.style.display = 'none'; addBtn.style.display = ''; },
      }, '取消');
      const row1 = el('div', { class: 'card-addmember-row' });
      row1.appendChild(nameIn);
      row1.appendChild(sourceSel);
      formWrap.appendChild(row1);
      const row2 = el('div', { class: 'card-addmember-row' });
      row2.appendChild(xUrlIn);
      formWrap.appendChild(row2);
      const row3 = el('div', { class: 'card-addmember-row' });
      row3.appendChild(submitBtn);
      row3.appendChild(cancelBtn);
      formWrap.appendChild(row3);
      sect.appendChild(formWrap);

      const addBtn = el('button', {
        type: 'button',
        class: 'addmember-toggle-btn',
        onclick: () => {
          formWrap.style.display = '';
          addBtn.style.display = 'none';
          nameIn.focus();
        },
      }, '+ メンバー追加');
      sect.appendChild(addBtn);

      card.appendChild(sect);
    });

    return card;
  }

  // ---- Filter UI builders ----
  function buildEventFilter() {
    const counts = {};
    for (const cid in CIRCLES) {
      const c = CIRCLES[cid];
      for (const e of (c.events || [])) {
        if (!counts[e.slug]) counts[e.slug] = { slug: e.slug, name: e.name, count: 0 };
        counts[e.slug].count++;
      }
    }
    const sorted = Object.values(counts).sort((a, b) => a.slug.localeCompare(b.slug));
    const row = document.getElementById('filter-event');
    sorted.forEach(ev => {
      const btn = el('button', {
        class: 'filter-btn',
        type: 'button',
      }, `${ev.name} (${ev.count})`);
      btn.addEventListener('click', () => {
        if (filterEvents.has(ev.slug)) {
          filterEvents.delete(ev.slug);
          btn.classList.remove('active');
        } else {
          filterEvents.add(ev.slug);
          btn.classList.add('active');
        }
        render();
      });
      row.appendChild(btn);
    });
  }

  function buildPlatformFilter() {
    const counts = {};
    for (const a of authorList()) {
      const p = authorPrimaryPlatform(a);
      counts[p] = (counts[p] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const row = document.getElementById('filter-platform');
    sorted.forEach(([p, n]) => {
      const btn = el('button', {
        class: 'filter-btn',
        type: 'button',
      }, `${p} (${n})`);
      btn.addEventListener('click', () => {
        if (filterPlatforms.has(p)) {
          filterPlatforms.delete(p);
          btn.classList.remove('active');
        } else {
          filterPlatforms.add(p);
          btn.classList.add('active');
        }
        render();
      });
      row.appendChild(btn);
    });
  }

  // ---- Pending panel ----
  function renderPending() {
    const panel = document.getElementById('review-pending-panel');
    const list = document.getElementById('pending-list');
    const nameCount = Object.keys(pending).length;
    const socialCount = Object.values(pendingSocials).reduce((s, arr) => s + arr.length, 0);
    const removalCount = Object.values(pendingRemovals).reduce((s, arr) => s + arr.length, 0);
    const aliasAddCount = Object.values(pendingAliases).reduce((s, arr) => s + arr.length, 0);
    const aliasRemCount = Object.values(pendingAliasRemovals).reduce((s, arr) => s + arr.length, 0);
    const total = nameCount + socialCount + removalCount + aliasAddCount + aliasRemCount;
    document.getElementById('pending-count').textContent = total;
    list.innerHTML = '';
    if (total === 0) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    for (const aid in pending) {
      const d = pending[aid];
      const li = el('li');
      li.appendChild(el('strong', {}, aid));
      if (d.decision === 'rename') {
        li.appendChild(el('span', {}, `📝 → ${d.name} (${d.source})`));
      } else {
        li.appendChild(el('span', {}, '⏭ skip (本名不明)'));
      }
      list.appendChild(li);
    }
    for (const aid in pendingSocials) {
      for (const s of pendingSocials[aid]) {
        const li = el('li');
        li.appendChild(el('strong', {}, aid));
        li.appendChild(el('span', {}, `🔗 + ${s.platform} ${s.handle || ''} → ${s.url}`));
        list.appendChild(li);
      }
    }
    for (const aid in pendingRemovals) {
      for (const url of pendingRemovals[aid]) {
        const li = el('li');
        li.appendChild(el('strong', {}, aid));
        li.appendChild(el('span', {}, `🗑 - link → ${url}`));
        list.appendChild(li);
      }
    }
    for (const aid in pendingAliases) {
      for (const al of pendingAliases[aid]) {
        const li = el('li');
        li.appendChild(el('strong', {}, aid));
        li.appendChild(el('span', {}, `🏷️ + alias → ${al}`));
        list.appendChild(li);
      }
    }
    for (const aid in pendingAliasRemovals) {
      for (const al of pendingAliasRemovals[aid]) {
        const li = el('li');
        li.appendChild(el('strong', {}, aid));
        li.appendChild(el('span', {}, `🏷️ - alias → ${al}`));
        list.appendChild(li);
      }
    }
    for (const m of pendingNewMembers) {
      const li = el('li');
      li.appendChild(el('strong', {}, m.circle_id));
      const socials_summary = (m.socials || []).map(s => `${s.platform}:${s.url.replace(/^https?:\/\//, '')}`).join(', ');
      li.appendChild(el('span', {}, `🆕 + member → ${m.name} (${m.source})${socials_summary ? ' — ' + socials_summary : ''}`));
      list.appendChild(li);
    }
    // Size hint
    const body = buildSubmissionBody();
    const hint = document.getElementById('pending-hint');
    if (body.length > GH_ISSUE_BODY_CAP) {
      hint.textContent = `本文 ${(body.length / 1024).toFixed(1)}KB — GitHub Issue URL に入りきらないので decisions.json DL を推奨`;
    } else {
      hint.textContent = '';
    }
  }

  // ---- Submission ----
  function pendingArray() {
    const out = Object.values(pending).slice();
    for (const aid in pendingSocials) {
      for (const s of pendingSocials[aid]) {
        out.push({
          author_id: aid,
          decision: 'add_social',
          platform: s.platform,
          url: s.url,
          handle: s.handle || '',
        });
      }
    }
    for (const aid in pendingRemovals) {
      for (const url of pendingRemovals[aid]) {
        out.push({
          author_id: aid,
          decision: 'remove_social',
          url,
        });
      }
    }
    for (const aid in pendingAliases) {
      for (const alias of pendingAliases[aid]) {
        out.push({ author_id: aid, decision: 'add_alias', alias });
      }
    }
    for (const aid in pendingAliasRemovals) {
      for (const alias of pendingAliasRemovals[aid]) {
        out.push({ author_id: aid, decision: 'remove_alias', alias });
      }
    }
    for (const m of pendingNewMembers) {
      out.push({
        decision: 'add_member',
        circle_id: m.circle_id,
        name: m.name,
        source: m.source,
        socials: m.socials || [],
        aliases: m.aliases || [],
      });
    }
    return out;
  }

  function buildSubmissionBody() {
    const lines = [];
    lines.push('## Author name review decisions');
    lines.push('');
    lines.push(`生成: ${new Date().toISOString()}`);
    lines.push(`件数: ${pendingArray().length}`);
    lines.push('');
    lines.push('### decisions.json (author-name-resolver skill が apply)');
    lines.push('```json');
    lines.push(JSON.stringify(pendingArray(), null, 2));
    lines.push('```');
    lines.push('');
    lines.push('### Apply 方法');
    lines.push('```bash');
    lines.push('# 上記 JSON を decisions.json に保存して:');
    lines.push('~/.claude/skills/author-name-resolver/bin/run.sh apply \\');
    lines.push('  --circles ~/project/cho-tsukuyomi-map/circles.json \\');
    lines.push('  --from decisions.json');
    lines.push('# その後 rebuild:');
    lines.push('python3 ~/project/cho-tsukuyomi-map/scripts/extract_circles.py');
    lines.push('```');
    return lines.join('\n');
  }

  function buildGithubIssueUrl(opts) {
    const title = `Author name decisions — ${pendingArray().length} 件`;
    const body = (opts && opts.shortBody)
      ? `この issue body は URL 長制限のため省略。添付の decisions.json を確認。\n\n生成: ${new Date().toISOString()}`
      : buildSubmissionBody();
    return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  function downloadDecisions() {
    const data = pendingArray();
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').split('.')[0];
    const filename = `decisions-${data.length}items-${ts}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return filename;
  }

  // ---- Main render ----
  function render() {
    const list = document.getElementById('review-list');
    const stats = document.getElementById('review-stats');
    const q = (document.getElementById('review-search').value || '').trim();
    list.innerHTML = '';
    let shown = 0;
    const total = authorList().length;
    let unresolved = 0;
    for (const a of authorList()) {
      if (a.name_source === 'circle_name' || a.name_source === 'audit_flagged') unresolved++;
    }
    // Render in a stable order: pending first, then by inferred name
    const sorted = authorList().sort((a, b) => {
      const pa = pending[a.id] ? 0 : 1;
      const pb = pending[b.id] ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.name_inferred || a.id).localeCompare(b.name_inferred || b.id);
    });
    for (const a of sorted) {
      if (!authorMatchesFilters(a)) continue;
      if (!authorMatchesSearch(a, q)) continue;
      list.appendChild(renderCard(a));
      shown++;
      if (shown >= 500) break;  // safety cap; filter further if needed
    }
    if (shown === 0) {
      list.appendChild(el('p', { class: 'empty' }, '該当 author なし'));
    }
    stats.textContent = `${shown} 件表示 / 未確定 ${unresolved} / 全 ${total}`;
    renderPending();
  }

  // ---- Bootstrap ----
  buildEventFilter();
  buildPlatformFilter();

  // Status filter
  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStatus = btn.dataset.status;
      render();
    });
  });

  // Search
  document.getElementById('review-search').addEventListener('input', render);

  // Pending actions
  document.getElementById('submit-github').addEventListener('click', () => {
    if (pendingArray().length === 0) { alert('保留中の決定がありません'); return; }
    const body = buildSubmissionBody();
    if (body.length > GH_ISSUE_BODY_CAP) {
      const name = downloadDecisions();
      alert(`本文が大きいので ${name} を DL しました。GitHub Issue を開いたあと、issue body に添付/コピペしてください。`);
      window.open(buildGithubIssueUrl({ shortBody: true }), '_blank', 'noopener');
    } else {
      window.open(buildGithubIssueUrl(), '_blank', 'noopener');
    }
  });
  document.getElementById('submit-download').addEventListener('click', downloadDecisions);
  document.getElementById('pending-clear').addEventListener('click', () => {
    if (!confirm('保留中の決定を全クリアしますか?')) return;
    pending = {};
    pendingSocials = {};
    pendingRemovals = {};
    pendingAliases = {};
    pendingAliasRemovals = {};
    savePending(pending);
    savePendingSocials(pendingSocials);
    savePendingRemovals(pendingRemovals);
    savePendingAliases(pendingAliases);
    savePendingAliasRemovals(pendingAliasRemovals);
    render();
  });

  // Initial URL params (?event=slug&platform=plurk)
  const params = new URLSearchParams(location.search);
  if (params.get('event')) {
    const slugs = params.get('event').split(',');
    for (const s of slugs) {
      filterEvents.add(s);
      const btn = document.querySelector(`#filter-event .filter-btn`);
      // mark all matching
      document.querySelectorAll('#filter-event .filter-btn').forEach(b => {
        if (b.textContent.includes(s)) b.classList.add('active');
      });
    }
  }
  if (params.get('platform')) {
    const plats = params.get('platform').split(',');
    for (const p of plats) {
      filterPlatforms.add(p);
      document.querySelectorAll('#filter-platform .filter-btn').forEach(b => {
        if (b.textContent.startsWith(p + ' ')) b.classList.add('active');
      });
    }
  }

  render();
})();
