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
  function loadPendingCircleSocials() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-circle-socials') || '{}');
    } catch (e) { return {}; }
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
  function savePendingCircleSocials(pcs) {
    localStorage.setItem(STORAGE_KEY + '-circle-socials', JSON.stringify(pcs));
  }
  function loadDismissedWs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-dismissed-ws') || '{}');
    } catch (e) { return {}; }
  }
  function loadPendingCircleAliases() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-circle-aliases') || '{}');
    } catch (e) { return {}; }
  }
  function loadPendingCircleAliasRemovals() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY + '-circle-alias-removals') || '{}');
    } catch (e) { return {}; }
  }
  function saveDismissedWs(dw) {
    localStorage.setItem(STORAGE_KEY + '-dismissed-ws', JSON.stringify(dw));
  }
  function savePendingCircleAliases(pca) {
    localStorage.setItem(STORAGE_KEY + '-circle-aliases', JSON.stringify(pca));
  }
  function savePendingCircleAliasRemovals(pcar) {
    localStorage.setItem(STORAGE_KEY + '-circle-alias-removals', JSON.stringify(pcar));
  }
  let pending = loadPending();
  let pendingSocials = loadPendingSocials();
  let pendingRemovals = loadPendingRemovals();           // {author_id: [url, ...]}
  let pendingAliases = loadPendingAliases();             // {author_id: [alias, ...]} - to add
  let pendingAliasRemovals = loadPendingAliasRemovals(); // {author_id: [alias, ...]} - to remove
  // pendingNewMembers — flat array of {tempId, circle_id, name, source, socials[], aliases[]}
  let pendingNewMembers = loadPendingNewMembers();
  // pendingCircleSocials — {circle_id: [{platform, url}, ...]} for circle-level SNS
  let pendingCircleSocials = loadPendingCircleSocials();
  // dismissedWsCandidates — {author_id: [url, ...]} URLs that user said
  // "not this person" on WebSearch candidates list (hides them from queue)
  let dismissedWsCandidates = loadDismissedWs();
  // pendingCircleAliases — {circle_id: [alias, ...]} to add on apply
  let pendingCircleAliases = loadPendingCircleAliases();
  // pendingCircleAliasRemovals — {circle_id: [alias, ...]} to remove on apply
  let pendingCircleAliasRemovals = loadPendingCircleAliasRemovals();

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
  let currentPage = 0;
  const PAGE_SIZE = 20;
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

  // ---- Unified author-panel rendering ----
  // Single function for BOTH existing-author cards (Author 1 = default) and
  // pending-new-member drafts (Author 2+ added via 「+ メンバー追加」). The
  // shape is identical; state-access branches by `isNew`:
  //   - existing: reads from author record + pending decision overlay
  //   - new:      reads from m (pendingNewMembers entry); mutations write
  //               directly via savePendingNewMembers()
  // Action buttons differ: existing has ✅/⏭/✨, new has 🗑.
  //
  // opts = { author?, newMember?, authorNum, isDefault }
  function renderAuthorPanel(opts) {
    const isNew = !!opts.newMember;
    const a = opts.author;
    const m = opts.newMember;
    const authorNum = opts.authorNum;
    const isDefault = opts.isDefault;

    const decision = !isNew ? (pending[a.id] || null) : null;
    // Unified state model (parallel for existing + new):
    //   - draft:     pending exists but confirmed=false → yellow tint
    //   - confirmed: pending && confirmed=true (rename or remove) → green
    //   - skip:      decision==='skip' (always confirmed)        → gray
    //   - untouched: neither pending nor entry → no tint
    const isDraft = isNew ? (m && m.name && !m.confirmed)
      : (decision && !decision.confirmed && decision.decision !== 'skip' && decision.decision !== 'remove_member');
    const isSkip = !isNew && decision && decision.decision === 'skip';
    const isRemove = !isNew && decision && decision.decision === 'remove_member';
    const isConfirmed = isNew ? (m && m.confirmed)
      : (decision && decision.confirmed && decision.decision === 'rename');
    let cls = 'author-panel';
    if (isSkip) cls += ' skip-decision';
    else if (isRemove) cls += ' remove-decision';
    else if (isConfirmed) cls += ' has-decision';
    else if (isDraft) cls += ' is-draft';
    const card = el('div', { class: cls });

    // Author label — `(default)` for existing first, `(新規)` for new
    card.appendChild(el('div', { class: 'author-panel-label' },
      `👤 Author ${authorNum}` + (isNew ? ' (新規)' : (isDefault ? ' (default)' : ''))));

    // ---- Name + source inputs (built early so they can be inserted high in
    // the panel — right after current-state row, before aliases). Only when
    // the panel isn't a skip/remove state. Auto-save = draft on every keystroke.
    const suggestion = !isNew ? (a.name_audit_suggestion || null) : null;
    let nameInput = null;
    let sourceSelect = null;
    let nameSourceRow = null;
    if (!isSkip && !isRemove) {
      // Preset name: existing → pending.name > suggestion > inferred; new → m.name
      let presetName;
      if (isNew) presetName = m.name || '';
      else if (decision && decision.name != null) presetName = decision.name;
      else if (suggestion) presetName = suggestion.name;
      else presetName = a.name_inferred || '';

      nameInput = el('input', {
        type: 'text', name: 'name', placeholder: '本人の display_name', value: presetName,
      });
      nameInput.addEventListener('input', () => {
        if (isNew) {
          m.name = nameInput.value;
          m.confirmed = false;
          savePendingNewMembers(pendingNewMembers);
        } else {
          const v = nameInput.value;
          if (!v) { delete pending[a.id]; }
          else {
            pending[a.id] = Object.assign({}, pending[a.id] || {},
              { author_id: a.id, decision: 'rename', name: v,
                source: sourceSelect.value, confirmed: false });
          }
          savePending(pending);
        }
      });

      sourceSelect = el('select', { name: 'source' });
      const plat = !isNew ? authorPrimaryPlatform(a) : 'user';
      const defaultSource = isNew
        ? (m.source || 'user')
        : (decision && decision.source) ? decision.source
        : (a.name_source === 'audit_flagged' && a.name_source_prev) ? a.name_source_prev
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
        const opt = el('option', { value: defaultSource }, defaultSource);
        opt.selected = true;
        sourceSelect.appendChild(opt);
      }
      sourceSelect.addEventListener('change', () => {
        if (isNew) {
          m.source = sourceSelect.value;
          m.confirmed = false;
          savePendingNewMembers(pendingNewMembers);
        } else if (nameInput.value) {
          pending[a.id] = Object.assign({}, pending[a.id] || {},
            { author_id: a.id, decision: 'rename', name: nameInput.value,
              source: sourceSelect.value, confirmed: false });
          savePending(pending);
        }
      });

      nameSourceRow = el('div', { class: 'card-form-row card-name-row' });
      nameSourceRow.appendChild(nameInput);
      nameSourceRow.appendChild(sourceSelect);
    }

    const head = el('div', { class: 'card-head' });

    // Current state row — only for existing authors (no saved state yet for new)
    if (!isNew) {
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
    }

    // Insert name + source row HIGH in the panel (right after current
    // state, before aliases) — howish prefers the primary input near the
    // top so the eye lands on it after reading 「現:」.
    if (nameSourceRow) head.appendChild(nameSourceRow);

    // ---- Alias section (unified) ----
    // existing: union(savedAliases [toggle-remove], pendingAliases [cancel])
    // new:      m.aliases only [direct delete]
    const savedAliases = isNew ? [] : (a.aliases || []);
    const pendingAdds = isNew ? (m.aliases || []) : (pendingAliases[a.id] || []);
    if (savedAliases.length || pendingAdds.length) {
      const aliasRow = el('div', { class: 'card-alias-row' });
      aliasRow.appendChild(el('span', { class: 'card-alias-label' }, '別名:'));
      savedAliases.forEach(al => {
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
        // For new members, render chips like saved (no pending-add styling)
        // so the panel looks identical to a finalized Author 1 (howish 要望)。
        const chip = el('span', { class: 'alias-chip' + (isNew ? '' : ' pending-add') });
        chip.appendChild(el('span', { class: 'alias-text' }, isNew ? al : ('+ ' + al)));
        chip.appendChild(el('button', {
          type: 'button',
          class: 'alias-remove',
          title: isNew ? 'この別名を削除' : 'pending 追加を取消',
          onclick: () => {
            if (isNew) {
              m.aliases.splice(idx, 1);
              savePendingNewMembers(pendingNewMembers);
            } else {
              pendingAliases[a.id].splice(idx, 1);
              if (pendingAliases[a.id].length === 0) delete pendingAliases[a.id];
              savePendingAliases(pendingAliases);
            }
            render();
          },
        }, '×'));
        aliasRow.appendChild(chip);
      });
      head.appendChild(aliasRow);
    }

    // Add-alias inline form (unified)
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
        if (isNew) {
          m.aliases = m.aliases || [];
          if (m.aliases.includes(al)) { alert('重複している、もう登録済み'); return; }
          m.aliases.push(al);
          savePendingNewMembers(pendingNewMembers);
        } else {
          const arr = pendingAliases[a.id] = pendingAliases[a.id] || [];
          if (al === a.name || al === a.name_inferred || arr.includes(al) || (a.aliases || []).includes(al)) {
            alert('重複している、もう登録済み');
            return;
          }
          arr.push(al);
          savePendingAliases(pendingAliases);
        }
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

    // ---- Socials section (unified) ----
    const links = el('div', { class: 'card-probe-links' });
    const savedSocials = isNew ? [] : (a.socials || []);
    const pendingSocAdds = isNew ? (m.socials || []) : (pendingSocials[a.id] || []);

    savedSocials.forEach(s => {
      if (!s.url) return;
      const label = (s.platform || '🔗') + (s.handle ? ' ' + s.handle : '');
      const marked = isMarkedForRemoval(a.id, s.url);
      const wrap = el('span', {
        class: 'card-probe-link existing' + (marked ? ' marked-remove' : ''),
      });
      wrap.appendChild(el('a', {
        class: 'existing-link',
        href: s.url, target: '_blank', rel: 'noopener',
      }, label));
      wrap.appendChild(el('button', {
        type: 'button', class: 'existing-remove',
        title: marked ? '削除を取消' : 'この link を削除',
        onclick: () => toggleRemoval(a.id, s.url),
      }, marked ? '↺' : '×'));
      links.appendChild(wrap);
    });
    pendingSocAdds.forEach((s, idx) => {
      // For new members, render chips like saved socials (existing styling)
      // so the panel looks identical to a finalized Author 1. For existing
      // authors, pending-add styling distinguishes "queued but not committed".
      const wrap = el('span', {
        class: isNew ? 'card-probe-link existing' : 'card-probe-link pending-add',
        title: isNew ? 'この link を削除' : 'pending 追加',
      });
      wrap.appendChild(el('a', {
        href: s.url,
        target: '_blank', rel: 'noopener',
        class: isNew ? 'existing-link' : 'pending-add-link',
      }, (isNew ? '' : '+ ') + s.platform + (s.handle ? ' ' + s.handle : '')));
      wrap.appendChild(el('button', {
        type: 'button',
        class: isNew ? 'existing-remove' : 'pending-add-remove',
        title: isNew ? 'この link を削除' : 'pending 追加を取消',
        onclick: () => {
          if (isNew) {
            m.socials.splice(idx, 1);
            savePendingNewMembers(pendingNewMembers);
          } else {
            pendingSocials[a.id].splice(idx, 1);
            if (pendingSocials[a.id].length === 0) delete pendingSocials[a.id];
            savePendingSocials(pendingSocials);
          }
          render();
        },
      }, '×'));
      links.appendChild(wrap);
    });
    if (!links.children.length) {
      links.appendChild(el('span', { class: 'card-probe-link no-links' }, '⚠️ SNS リンクなし'));
    }
    card.appendChild(links);

    // Add-social inline form (unified, collapsed by default)
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
    urlInput.addEventListener('input', () => {
      const u = urlInput.value.trim();
      if (u) {
        const p = detectPlatform(u);
        platSelect.value = p;
        if (!handleInput.value) handleInput.value = extractHandle(u, p);
      }
    });
    const addSocBtn = el('button', {
      type: 'button',
      class: 'add-social-add',
      onclick: () => {
        let u = urlInput.value.trim();
        if (!u) { alert('URL を入力してください'); return; }
        if (!/^https?:\/\//.test(u)) u = 'https://' + u;
        const platform = platSelect.value;
        const handle = handleInput.value.trim();
        if (isNew) {
          m.socials = m.socials || [];
          if (m.socials.some(s => s.url === u)) { alert('重複している'); return; }
          m.socials.push({ platform, url: u, handle });
          savePendingNewMembers(pendingNewMembers);
        } else {
          (pendingSocials[a.id] = pendingSocials[a.id] || []).push({ platform, url: u, handle });
          savePendingSocials(pendingSocials);
        }
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
    row2.appendChild(addSocBtn);
    addForm.appendChild(row2);
    addBlock.appendChild(addToggle);
    addBlock.appendChild(addForm);
    card.appendChild(addBlock);

    // Yachiyo note + WebSearch hits — existing-author only (no value for
    // a freshly-typed draft, since the user is the source).
    if (!isNew) {
      const plat = authorPrimaryPlatform(a);
      const note = PLATFORM_NOTES[plat] || PLATFORM_NOTES.plain;
      card.appendChild(el('div', { class: 'card-yachiyo-note' }, '💭 ' + note));

      // Filter WebSearch candidates: drop URLs already in author.socials,
      // already queued in pendingSocials, dismissed by reviewer, OR are
      // post/photo/status URLs (not the author's profile root — howish
      // can't verify "is this them" from a single post).
      function normWsUrl(u) {
        return (u || '').toLowerCase()
          .replace(/^https?:\/\//, '').replace(/^www\./, '')
          .split('?')[0].split('#')[0].replace(/\/+$/, '');
      }
      // Filter chain: drop URLs not matching the project allow-list
      // (window.PROFILE_PATTERNS — the same patterns used to validate
      // saved socials). This rejects post URLs, photo URLs, and any URL
      // that doesn't match a known platform's profile shape.
      const PROFILE_PATTERNS = window.PROFILE_PATTERNS || [];
      function isAllowedProfileUrl(url) {
        if (!url) return false;
        for (const p of PROFILE_PATTERNS) {
          try {
            if (new RegExp(p.regex).test(url)) return true;
          } catch (e) {}
        }
        return false;
      }
      const registeredNorms = new Set(
        ((a.socials || []).map(s => normWsUrl(s.url || '')))
          .concat((pendingSocials[a.id] || []).map(s => normWsUrl(s.url || '')))
      );
      const dismissedNorms = new Set(
        (dismissedWsCandidates[a.id] || []).map(normWsUrl)
      );
      const wsHits = (WS_CANDIDATES[a.id] || []).filter(h => {
        if (!isAllowedProfileUrl(h.url)) return false;  // allow-list
        const n = normWsUrl(h.url);
        if (registeredNorms.has(n) || dismissedNorms.has(n)) return false;
        return true;
      });
      if (wsHits.length) {
        const wsBlock = el('div', { class: 'card-ws-block' });
        wsBlock.appendChild(el('div', { class: 'card-ws-label' },
          '🌐 WebSearch 候補 (click で実物確認 → 「+ 採用」or 「× 違う」)'));
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
          const btnRow = el('div', { class: 'card-ws-btn-row' });
          btnRow.appendChild(el('button', {
            type: 'button',
            class: 'card-ws-add',
            title: 'この URL を pending 追加 (要本人 page 確認)',
            onclick: () => {
              (pendingSocials[a.id] = pendingSocials[a.id] || []).push({
                platform: h.platform || 'generic',
                url: h.url,
                handle: '',
              });
              savePendingSocials(pendingSocials);
              render();
            },
          }, '+ 採用'));
          btnRow.appendChild(el('button', {
            type: 'button',
            class: 'card-ws-dismiss',
            title: '違う人 — この候補を非表示にする',
            onclick: () => {
              (dismissedWsCandidates[a.id] = dismissedWsCandidates[a.id] || []).push(h.url);
              saveDismissedWs(dismissedWsCandidates);
              render();
            },
          }, '× 違う'));
          item.appendChild(btnRow);
          list.appendChild(item);
        });
        wsBlock.appendChild(list);
        card.appendChild(wsBlock);
      }
    }

    // ---- Decision / action area ----
    // ---- Unified action area ----
    // Both existing and new authors render the same way: editable name +
    // source inputs (auto-save as draft) + 🗑 削除 button. ✅/⏭/取消 live
    // at circle level only.
    //
    // For existing skip/remove states, show a small status pill instead
    // of inputs (those decisions are immediate, no draft step).
    if (isSkip || isRemove) {
      const dDiv = el('div', { class: 'card-form-decision' });
      dDiv.appendChild(el('span', { class: 'decision-text' },
        isSkip ? '⏭ skip — 本名不明で永続' : '🗑 remove_member — apply で circle から除外'));
      card.appendChild(dDiv);
    } else {
      // Name + source row already inserted high in the panel. Only the
      // 🗑 削除 button lives down here.
      const form = el('form', { class: 'card-form', onsubmit: (e) => e.preventDefault() });
      const actions = el('div', { class: 'card-form-actions' });
      actions.appendChild(el('button', {
        type: 'button',
        class: 'skip-btn',
        onclick: () => {
          if (isNew) {
            if (!confirm('この新規メンバーを削除しますか？')) return;
            pendingNewMembers = pendingNewMembers.filter(x => x.tempId !== m.tempId);
            savePendingNewMembers(pendingNewMembers);
          } else {
            if (!confirm(`Author「${a.name || a.name_inferred || a.id}」を circle から削除しますか？(apply 時に circle.members[] から外れる)`)) return;
            pending[a.id] = { author_id: a.id, decision: 'remove_member',
                              circle_id: opts.circle.id, confirmed: true };
            savePending(pending);
          }
          render();
        },
      }, '🗑 削除'));
      form.appendChild(actions);
      card.appendChild(form);

      // Register handlers so circle-level bulk bar can drive ✨/✅/⏭/↩
      if (opts.committer) {
        opts.committer.push({
          isNew,
          authorId: !isNew ? a.id : null,
          tempId: isNew ? m.tempId : null,
          hasSuggestion: !!suggestion,
          isConfirmed: !!isConfirmed,
          isDraft: !!isDraft,
          applySuggestion: () => {
            if (!suggestion) return;
            nameInput.value = suggestion.name;
            const existing = a.aliases || [];
            const alreadyPending = pendingAliases[a.id] || [];
            const adds = (suggestion.aliases || []).filter(
              al => !existing.includes(al) && !alreadyPending.includes(al)
            );
            if (adds.length) {
              pendingAliases[a.id] = alreadyPending.concat(adds);
              savePendingAliases(pendingAliases);
            }
            // Trigger auto-save of the name change
            nameInput.dispatchEvent(new Event('input'));
          },
          confirm: () => {
            // Promote draft → confirmed. Reads input value at click time.
            if (isNew) {
              if (!m.name || !m.name.trim()) return false;
              m.confirmed = true;
              savePendingNewMembers(pendingNewMembers);
              return true;
            }
            const name = (nameInput.value || '').trim();
            if (!name) return false;
            pending[a.id] = { author_id: a.id, decision: 'rename', name,
                              source: sourceSelect.value, confirmed: true };
            savePending(pending);
            return true;
          },
          skip: () => {
            if (isNew) return;  // skip not meaningful for a draft new-member
            pending[a.id] = { author_id: a.id, decision: 'skip', confirmed: true };
            savePending(pending);
          },
          revert: () => {
            if (isNew) {
              m.confirmed = false;
              savePendingNewMembers(pendingNewMembers);
            } else {
              delete pending[a.id];
              savePending(pending);
            }
          },
        });
      }
    }

    return card;
  }


  // ---- Circle-card rendering ----
  // Wraps one or more author panels under a circle header + circle-level
  // SNS section + "+ メンバー追加" affordance. This is the outer container
  // the main loop produces.
  function renderCircleCard(circle, members) {
    // Green tint when every author (existing + pending new) has a
    // CONFIRMED state. Drafts (not yet confirmed) don't qualify.
    const newMembersForCircle = pendingNewMembers.filter(m => m.circle_id === circle.id);
    const existingAllOk = members.length > 0 && members.every(a => {
      const p = pending[a.id];
      return p && p.confirmed;  // rename/skip/remove all need confirmed
    });
    const newAllOk = newMembersForCircle.every(m => m.confirmed);
    const allConfirmed = existingAllOk && newAllOk;
    const card = el('div', { class: 'circle-card' + (allConfirmed ? ' all-confirmed' : '') });

    // Circle header — name + booth/events + jump link
    const head = el('div', { class: 'circle-card-head' });
    const titleRow = el('div', { class: 'circle-card-title-row' });
    const firstEv = (circle.events || [])[0];
    if (firstEv) {
      titleRow.appendChild(el('a', {
        class: 'circle-card-name',
        href: `../${firstEv.slug}/#${firstEv.booth_id}`,
        target: '_blank', rel: 'noopener',
      }, '🎪 ' + (circle.circle_name || circle.id)));
    } else {
      titleRow.appendChild(el('span', { class: 'circle-card-name' }, '🎪 ' + (circle.circle_name || circle.id)));
    }
    const events = (circle.events || []).map(e => `${e.slug.split('-')[0]} ${e.booth_id}`);
    if (events.length) {
      titleRow.appendChild(el('span', { class: 'circle-card-events' }, events.join(' · ')));
    }
    head.appendChild(titleRow);

    // Circle aliases — saved + pending adds + pending removals, plus an
    // add input. Mirrors the per-author alias section.
    const savedCAliases = circle.aliases || [];
    const pendingCAliasAdds = pendingCircleAliases[circle.id] || [];
    const pendingCAliasRemoves = pendingCircleAliasRemovals[circle.id] || [];
    if (savedCAliases.length || pendingCAliasAdds.length || true) {
      const aliasRow = el('div', { class: 'circle-alias-row' });
      aliasRow.appendChild(el('span', { class: 'circle-alias-label' }, '別名:'));
      savedCAliases.forEach(al => {
        const marked = pendingCAliasRemoves.includes(al);
        const chip = el('span', { class: 'alias-chip' + (marked ? ' marked-remove' : '') });
        chip.appendChild(el('span', { class: 'alias-text' }, al));
        chip.appendChild(el('button', {
          type: 'button', class: 'alias-remove',
          title: marked ? '削除を取消' : 'この別名を削除',
          onclick: () => {
            const arr = pendingCircleAliasRemovals[circle.id] = pendingCircleAliasRemovals[circle.id] || [];
            const i = arr.indexOf(al);
            if (i >= 0) arr.splice(i, 1);
            else arr.push(al);
            if (arr.length === 0) delete pendingCircleAliasRemovals[circle.id];
            savePendingCircleAliasRemovals(pendingCircleAliasRemovals);
            render();
          },
        }, marked ? '↺' : '×'));
        aliasRow.appendChild(chip);
      });
      pendingCAliasAdds.forEach((al, idx) => {
        const chip = el('span', { class: 'alias-chip pending-add' });
        chip.appendChild(el('span', { class: 'alias-text' }, '+ ' + al));
        chip.appendChild(el('button', {
          type: 'button', class: 'alias-remove',
          title: 'pending 追加を取消',
          onclick: () => {
            pendingCircleAliases[circle.id].splice(idx, 1);
            if (pendingCircleAliases[circle.id].length === 0) delete pendingCircleAliases[circle.id];
            savePendingCircleAliases(pendingCircleAliases);
            render();
          },
        }, '×'));
        aliasRow.appendChild(chip);
      });
      // Add input
      const cAliasInput = el('input', {
        type: 'text', placeholder: '+ 別名追加 (例: 英名 / 旧名 / 略称)', class: 'add-alias-input',
      });
      const cAliasBtn = el('button', {
        type: 'button', class: 'add-alias-btn',
        onclick: () => {
          const v = (cAliasInput.value || '').trim();
          if (!v) return;
          const arr = pendingCircleAliases[circle.id] = pendingCircleAliases[circle.id] || [];
          if (v === circle.circle_name || (circle.aliases || []).includes(v) || arr.includes(v)) {
            alert('重複している、もう登録済み');
            return;
          }
          arr.push(v);
          savePendingCircleAliases(pendingCircleAliases);
          cAliasInput.value = '';
          render();
        },
      }, '+');
      cAliasInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); cAliasBtn.click(); }
      });
      aliasRow.appendChild(cAliasInput);
      aliasRow.appendChild(cAliasBtn);
      head.appendChild(aliasRow);
    }
    card.appendChild(head);

    // Circle-level socials (合同 SNS) — reuses the same chip + form shape
    // as the per-author socials section so howish reads them at a glance.
    const cLabel = el('div', { class: 'circle-socials-heading' }, '🎪 合同 SNS:');
    card.appendChild(cLabel);

    const cLinks = el('div', { class: 'card-probe-links' });
    (circle.socials || []).forEach(s => {
      if (!s.url) return;
      const label = (s.platform || '🔗') + (s.handle ? ' ' + s.handle : '');
      const wrap = el('span', { class: 'card-probe-link existing' });
      wrap.appendChild(el('a', {
        class: 'existing-link', href: s.url, target: '_blank', rel: 'noopener',
      }, label));
      // Remove from circle.socials? Not yet — needs a remove_circle_social
      // decision type. For now circle socials are append-only via review queue.
      cLinks.appendChild(wrap);
    });
    (pendingCircleSocials[circle.id] || []).forEach((s, idx) => {
      const wrap = el('span', { class: 'card-probe-link pending-add', title: 'pending 追加' });
      wrap.appendChild(el('a', {
        href: s.url, target: '_blank', rel: 'noopener',
        class: 'pending-add-link',
      }, '+ ' + s.platform + (s.handle ? ' ' + s.handle : '')));
      wrap.appendChild(el('button', {
        type: 'button',
        class: 'pending-add-remove',
        title: 'pending 追加を取消',
        onclick: () => {
          pendingCircleSocials[circle.id].splice(idx, 1);
          if (pendingCircleSocials[circle.id].length === 0) delete pendingCircleSocials[circle.id];
          savePendingCircleSocials(pendingCircleSocials);
          render();
        },
      }, '×'));
      cLinks.appendChild(wrap);
    });
    if (!cLinks.children.length) {
      cLinks.appendChild(el('span', { class: 'card-probe-link no-links' }, '(合同 SNS なし)'));
    }
    card.appendChild(cLinks);

    // Add form — matches the author-panel `+ SNS link 追加` collapsed pattern
    const cAddBlock = el('div', { class: 'add-social-block' });
    const cAddToggle = el('button', {
      type: 'button', class: 'add-social-toggle',
      onclick: () => cAddBlock.classList.toggle('open'),
    }, '+ 合同 SNS 追加');
    const cAddForm = el('div', { class: 'add-social-form' });
    const cUrlInput = el('input', { type: 'url', placeholder: 'URL (https://...)', class: 'add-social-url' });
    const cPlatSel = el('select', { class: 'add-social-platform' });
    const C_PLAT_OPTIONS = ['x', 'plurk', 'fb', 'ig', 'threads', 'bsky', 'pixiv',
      'doujin_tw', 'aggregator', 'booth_pm', 'wix', 'blog', 'gamer', 'generic'];
    for (const p of C_PLAT_OPTIONS) {
      cPlatSel.appendChild(el('option', { value: p }, p));
    }
    const cHandleInput = el('input', { type: 'text', placeholder: 'handle (任意)', class: 'add-social-handle' });
    cUrlInput.addEventListener('input', () => {
      const u = cUrlInput.value.trim();
      if (u) {
        const p = detectPlatform(u);
        cPlatSel.value = p;
        if (!cHandleInput.value) cHandleInput.value = extractHandle(u, p);
      }
    });
    const cAddBtn = el('button', {
      type: 'button', class: 'add-social-add',
      onclick: () => {
        let u = cUrlInput.value.trim();
        if (!u) { alert('URL を入力してください'); return; }
        if (!/^https?:\/\//.test(u)) u = 'https://' + u;
        const platform = cPlatSel.value;
        const handle = cHandleInput.value.trim();
        const arr = pendingCircleSocials[circle.id] = pendingCircleSocials[circle.id] || [];
        if (arr.some(s => s.url === u) || (circle.socials || []).some(s => s.url === u)) {
          alert('重複している'); return;
        }
        arr.push({ platform, url: u, handle });
        savePendingCircleSocials(pendingCircleSocials);
        cUrlInput.value = '';
        cHandleInput.value = '';
        cAddBlock.classList.remove('open');
        render();
      },
    }, '+ 追加');
    cAddForm.appendChild(cUrlInput);
    const cRow2 = el('div', { class: 'add-social-row' });
    cRow2.appendChild(cPlatSel);
    cRow2.appendChild(cHandleInput);
    cRow2.appendChild(cAddBtn);
    cAddForm.appendChild(cRow2);
    cAddBlock.appendChild(cAddToggle);
    cAddBlock.appendChild(cAddForm);
    card.appendChild(cAddBlock);

    // Members — unified renderAuthorPanel for both existing authors AND
    // pending new-member drafts. Existing-author panels register their
    // commit handlers with `committers` so the circle-level bulk action
    // bar at the bottom can drive ✅/⏭/✨ across all members in one go.
    const committers = [];
    const membersWrap = el('div', { class: 'circle-card-members' });
    members.forEach((a, i) => {
      membersWrap.appendChild(renderAuthorPanel({
        author: a, circle, authorNum: i + 1, isDefault: i === 0,
        committer: committers,
      }));
    });
    pendingNewMembers.filter(m => m.circle_id === circle.id).forEach((m, i) => {
      membersWrap.appendChild(renderAuthorPanel({
        newMember: m, circle, authorNum: members.length + i + 1, isDefault: false,
        committer: committers,
      }));
    });

    card.appendChild(membersWrap);

    // Add-member section at the bottom of the circle card
    const addSect = el('div', { class: 'circle-addmember' });
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
      type: 'button', class: 'confirm-btn',
      onclick: () => {
        const name = (nameIn.value || '').trim();
        if (!name) { alert('名前を入力してください'); return; }
        const socials = [];
        const xUrl = (xUrlIn.value || '').trim();
        if (xUrl) socials.push({ platform: 'x', url: xUrl });
        const tempId = 'new_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        pendingNewMembers.push({
          tempId, circle_id: circle.id, name,
          source: sourceSel.value, socials, aliases: [],
        });
        savePendingNewMembers(pendingNewMembers);
        nameIn.value = ''; xUrlIn.value = '';
        render();
      },
    }, '+ 追加');
    const cancelBtn = el('button', {
      type: 'button', class: 'skip-btn',
      onclick: () => { formWrap.style.display = 'none'; addBtn.style.display = ''; },
    }, '取消');
    const row1 = el('div', { class: 'card-addmember-row' });
    row1.appendChild(nameIn); row1.appendChild(sourceSel);
    formWrap.appendChild(row1);
    const row2 = el('div', { class: 'card-addmember-row' });
    row2.appendChild(xUrlIn);
    formWrap.appendChild(row2);
    const row3 = el('div', { class: 'card-addmember-row' });
    row3.appendChild(submitBtn); row3.appendChild(cancelBtn);
    formWrap.appendChild(row3);
    addSect.appendChild(formWrap);
    const addBtn = el('button', {
      type: 'button', class: 'addmember-toggle-btn',
      onclick: () => {
        formWrap.style.display = '';
        addBtn.style.display = 'none';
        nameIn.focus();
      },
    }, '+ メンバー追加');
    addSect.appendChild(addBtn);
    card.appendChild(addSect);

    // ---- Circle-level bulk action bar ----
    // 確定 / 取消 / skip / 提案反映 are all circle-level operations (per
    // howish — author level has no decision verbs, just edit + 🗑).
    if (committers.length) {
      const bar = el('div', { class: 'circle-action-bar' });
      const hasAnySuggestion = committers.some(c => c.hasSuggestion);
      const hasAnyDraft = committers.some(c => c.isDraft);
      const hasAnyConfirmed = committers.some(c => c.isConfirmed);

      if (hasAnySuggestion) {
        bar.appendChild(el('button', {
          type: 'button',
          class: 'confirm-btn accept-suggestion-btn',
          title: '全 flagged author の deep-clean 提案を input に流す (draft)',
          onclick: () => {
            committers.forEach(c => { if (c.hasSuggestion) c.applySuggestion(); });
            render();
          },
        }, '✨ 提案 反映 all'));
      }
      bar.appendChild(el('button', {
        type: 'button',
        class: 'confirm-btn',
        title: '全 author の draft を確定 (outgoing decisions に含める)',
        onclick: () => {
          let okCount = 0;
          committers.forEach(c => { if (c.confirm()) okCount++; });
          if (okCount === 0) alert('確定できる author がいません (name 空)');
          render();
        },
      }, '✅ 確定 all'));
      bar.appendChild(el('button', {
        type: 'button',
        class: 'skip-btn',
        title: '全 author を skip (本名不明扱い、existing のみ)',
        onclick: () => {
          if (!confirm('このサークル全 author を skip にしますか？')) return;
          committers.forEach(c => c.skip());
          render();
        },
      }, '⏭ skip all'));
      if (hasAnyConfirmed || hasAnyDraft) {
        bar.appendChild(el('button', {
          type: 'button',
          class: 'revert-btn',
          title: '全 author の pending state を取消 (existing → 削除、new → draft 化)',
          onclick: () => {
            if (!confirm('このサークルの pending state を全部取消しますか？')) return;
            committers.forEach(c => c.revert());
            render();
          },
        }, '↩ 取消 all'));
      }
      card.appendChild(bar);
    }

    return card;
  }

  // Auto-detect platform from URL host (mirrors PLATFORM_FROM_HOST above
  // — separate helper because addCircleSocial needs it).
  function detectPlatformFromUrl(url) {
    for (const [rx, p] of PLATFORM_FROM_HOST) {
      if (rx.test(url)) return p;
    }
    return 'generic';
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
        currentPage = 0;
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
        currentPage = 0;
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
      const conf = d.confirmed ? '✅' : '✏️ draft';
      if (d.decision === 'rename') {
        li.appendChild(el('span', {}, `${conf} 📝 → ${d.name} (${d.source})`));
      } else if (d.decision === 'remove_member') {
        li.appendChild(el('span', {}, `${conf} 🗑 remove_member`));
      } else {
        li.appendChild(el('span', {}, `${conf} ⏭ skip (本名不明)`));
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
      const conf = m.confirmed ? '✅' : '✏️ draft';
      li.appendChild(el('span', {}, `${conf} 🆕 + member → ${m.name || '(空)'} (${m.source})${socials_summary ? ' — ' + socials_summary : ''}`));
      list.appendChild(li);
    }
    for (const cid in pendingCircleSocials) {
      for (const s of pendingCircleSocials[cid]) {
        const li = el('li');
        li.appendChild(el('strong', {}, cid));
        li.appendChild(el('span', {}, `🔗 + circle SNS → ${s.platform} ${s.url}`));
        list.appendChild(li);
      }
    }
    for (const cid in pendingCircleAliases) {
      for (const al of pendingCircleAliases[cid]) {
        const li = el('li');
        li.appendChild(el('strong', {}, cid));
        li.appendChild(el('span', {}, `🏷️ + circle alias → ${al}`));
        list.appendChild(li);
      }
    }
    for (const cid in pendingCircleAliasRemovals) {
      for (const al of pendingCircleAliasRemovals[cid]) {
        const li = el('li');
        li.appendChild(el('strong', {}, cid));
        li.appendChild(el('span', {}, `🏷️ - circle alias → ${al}`));
        list.appendChild(li);
      }
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
  // Only `confirmed === true` entries are emitted; drafts stay out.
  function pendingArray() {
    const out = [];
    for (const aid in pending) {
      const d = pending[aid];
      if (!d.confirmed) continue;  // skip drafts
      // Strip the `confirmed` flag from outgoing (apply script doesn't need it)
      const { confirmed, ...rest } = d;
      out.push(rest);
    }
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
      if (!m.confirmed) continue;  // skip drafts
      out.push({
        decision: 'add_member',
        circle_id: m.circle_id,
        name: m.name,
        source: m.source,
        socials: m.socials || [],
        aliases: m.aliases || [],
      });
    }
    for (const cid in pendingCircleSocials) {
      for (const s of pendingCircleSocials[cid]) {
        out.push({
          decision: 'add_circle_social',
          circle_id: cid,
          platform: s.platform,
          url: s.url,
        });
      }
    }
    for (const cid in pendingCircleAliases) {
      for (const alias of pendingCircleAliases[cid]) {
        out.push({ decision: 'add_circle_alias', circle_id: cid, alias });
      }
    }
    for (const cid in pendingCircleAliasRemovals) {
      for (const alias of pendingCircleAliasRemovals[cid]) {
        out.push({ decision: 'remove_circle_alias', circle_id: cid, alias });
      }
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
  // Iterates circles (not authors flat) so each card groups all members of
  // a circle under one container. Filters: a circle shows if ANY of its
  // members passes the author-level filters + search.
  function render() {
    const list = document.getElementById('review-list');
    const stats = document.getElementById('review-stats');
    const q = (document.getElementById('review-search').value || '').trim();
    list.innerHTML = '';
    const total = authorList().length;
    let unresolved = 0;
    for (const a of authorList()) {
      if (a.name_source === 'circle_name' || a.name_source === 'audit_flagged') unresolved++;
    }

    // Gather circles that have at least one member matching filters/search.
    // Skip circles whose members are all clean AND no pending new-member is
    // queued for this circle.
    const circleHits = [];
    const seenCircleIds = new Set();
    for (const cid in CIRCLES) {
      const circle = CIRCLES[cid];
      const memberIds = circle.members || [];
      const memberAuthors = memberIds.map(mid => AUTHORS[mid]).filter(Boolean);
      const anyMatch = memberAuthors.some(a => authorMatchesFilters(a) && authorMatchesSearch(a, q));
      const hasPendingNewMember = pendingNewMembers.some(m => m.circle_id === cid);
      if (!anyMatch && !hasPendingNewMember) continue;
      if (seenCircleIds.has(cid)) continue;
      seenCircleIds.add(cid);
      // Sort key: any-pending-decision-or-new-member → 0, else 1
      const hasPending = memberAuthors.some(a => pending[a.id]) || hasPendingNewMember;
      circleHits.push({ circle, memberAuthors, sortKey: hasPending ? 0 : 1 });
    }
    circleHits.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return (a.circle.circle_name || a.circle.id).localeCompare(b.circle.circle_name || b.circle.id);
    });

    const totalCircles = circleHits.length;
    const totalPages = Math.max(1, Math.ceil(totalCircles / PAGE_SIZE));
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;
    const startIdx = currentPage * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, totalCircles);
    const pageHits = circleHits.slice(startIdx, endIdx);

    for (const { circle, memberAuthors } of pageHits) {
      list.appendChild(renderCircleCard(circle, memberAuthors));
    }
    if (totalCircles === 0) {
      list.appendChild(el('p', { class: 'empty' }, '該当サークルなし'));
    } else if (totalPages > 1) {
      // Page nav at bottom
      const nav = el('div', { class: 'review-pagination' });
      function pageBtn(label, targetPage, disabled, active) {
        const cls = 'page-btn' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
        const btn = el('button', {
          type: 'button', class: cls,
          onclick: () => { if (!disabled && !active) { currentPage = targetPage; render(); window.scrollTo(0, 0); } },
        }, label);
        return btn;
      }
      nav.appendChild(pageBtn('← prev', currentPage - 1, currentPage === 0, false));
      // Page numbers (compact: first, ..., current ± 2, ..., last)
      const pageNums = [];
      for (let p = 0; p < totalPages; p++) {
        if (p === 0 || p === totalPages - 1 || (p >= currentPage - 2 && p <= currentPage + 2)) {
          pageNums.push(p);
        } else if (pageNums[pageNums.length - 1] !== '…') {
          pageNums.push('…');
        }
      }
      pageNums.forEach(p => {
        if (p === '…') {
          nav.appendChild(el('span', { class: 'page-ellipsis' }, '…'));
        } else {
          nav.appendChild(pageBtn(String(p + 1), p, false, p === currentPage));
        }
      });
      nav.appendChild(pageBtn('next →', currentPage + 1, currentPage === totalPages - 1, false));
      list.appendChild(nav);
    }
    const showingRange = totalCircles ? `${startIdx + 1}–${endIdx}` : '0';
    stats.textContent = `${showingRange} / ${totalCircles} circles 表示 (page ${currentPage + 1}/${totalPages}) — 未確定 author ${unresolved} / 全 author ${total}`;
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
      currentPage = 0;
      render();
    });
  });

  // Search — reset to page 0 when query changes
  document.getElementById('review-search').addEventListener('input', () => {
    currentPage = 0;
    render();
  });

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
