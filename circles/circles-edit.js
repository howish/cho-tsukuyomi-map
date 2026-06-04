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

  // Sprint Bγ-polish E (2026-06-04): event/platform filter state lives in
  // circles.js and drives both modes. Edit mode only owns status filter.
  let filterStatus = 'unresolved';  // 'unresolved' | 'all'
  let currentPage = 0;
  const PAGE_SIZE = 20;

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
    // Sprint Bγ-polish E (2026-06-04): event + platform filtering now done
    // at circle level by circles.js's passesFilters. This function only
    // enforces the edit-only status filter.
    if (filterStatus === 'unresolved') {
      const unresolvedSrc = a.name_source === 'circle_name' || a.name_source === 'audit_flagged';
      if (!unresolvedSrc && !pending[a.id]) return false;
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



  // Sprint Bγ-polish E (2026-06-04): event/platform filter handlers are
  // now wired by circles.js once (state shared between modes). circles-edit.js
  // hooks YACHI_ON_FILTER_CHANGE to reset its pagination on filter changes.

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

  // ---- Decorator for circles.js's 2-tier card (Sprint Bβ.next 2026-06-04) ----
  // circles.js owns the visual card shape (circle name + circle.socials chips
  // + 👤 member sections). This decorator augments each card in place with
  // edit-mode action UI: aliases (×/+), socials (×/+), per-member rename
  // input + source dropdown + confirm/skip/remove buttons.
  // Re-render after a mutation goes through render() → renderPending() +
  // YACHI_RERENDER() → applyFilter() → renderRow + decorateCard.
  function decorateCard(card, c) {
    // "all-confirmed" tint
    const newMembersForCircle = pendingNewMembers.filter(m => m.circle_id === c.id);
    const members = c.memberAuthors || [];
    const existingAllOk = members.length > 0 && members.every(a => {
      const p = pending[a.id];
      return p && p.confirmed;
    });
    const newAllOk = newMembersForCircle.every(m => m.confirmed);
    if (existingAllOk && newAllOk) card.classList.add('all-confirmed');

    decorateCircleHead(card, c);
    decorateCircleSocials(card, c);
    members.forEach(a => {
      const sec = card.querySelector(`.circle-section.member-section[data-member-id="${cssEscape(a.id)}"]`);
      if (sec) decorateMember(sec, a, c);
    });

    // Sprint Bγ-polish B (2026-06-04): render any pending new-member drafts
    // for this circle as additional member sections, then offer the
    // "+ 新メンバー追加" button.
    // Per howish 2026-06-04: both new-member sections AND the add button
    // sit ABOVE the .circle-events row (events stay last in the card).
    const eventsRow = card.querySelector(':scope > .circle-events');
    newMembersForCircle.forEach(m => {
      const sec = el('div', { class: 'circle-section member-section new-member-section' });
      if (m.confirmed) sec.classList.add('has-decision');
      else if (m.name) sec.classList.add('is-draft');
      decorateNewMember(sec, m, c);
      if (eventsRow) card.insertBefore(sec, eventsRow);
      else card.appendChild(sec);
    });
    appendAddMemberButton(card, c);
  }

  // Small helper — escape characters in a string so it's safe to embed in
  // an attribute selector. CSS.escape is the standard but absent in JSDOM
  // older versions; fall back to a regex.
  function cssEscape(s) {
    if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
  }

  function decorateCircleHead(card, c) {
    const head = card.querySelector(':scope > .circle-row-head');
    if (!head) return;
    const savedAliases = c.aliases || [];
    const pendingAdds = pendingCircleAliases[c.id] || [];
    const pendingRemoves = pendingCircleAliasRemovals[c.id] || [];

    const aliasRow = el('div', { class: 'circle-alias-row' });
    aliasRow.appendChild(el('span', { class: 'circle-alias-label' }, '別名:'));

    savedAliases.forEach(al => {
      const marked = pendingRemoves.includes(al);
      const chip = el('span', { class: 'alias-chip' + (marked ? ' marked-remove' : '') });
      chip.appendChild(el('span', { class: 'alias-text' }, al));
      chip.appendChild(el('button', {
        type: 'button', class: 'alias-remove',
        title: marked ? '削除を取消' : 'この別名を削除',
        onclick: () => {
          const arr = pendingCircleAliasRemovals[c.id] = pendingCircleAliasRemovals[c.id] || [];
          const i = arr.indexOf(al);
          if (i >= 0) arr.splice(i, 1); else arr.push(al);
          if (arr.length === 0) delete pendingCircleAliasRemovals[c.id];
          savePendingCircleAliasRemovals(pendingCircleAliasRemovals);
          render();
        },
      }, marked ? '↺' : '×'));
      aliasRow.appendChild(chip);
    });

    pendingAdds.forEach((al, idx) => {
      const chip = el('span', { class: 'alias-chip pending-add' });
      chip.appendChild(el('span', { class: 'alias-text' }, '+ ' + al));
      chip.appendChild(el('button', {
        type: 'button', class: 'alias-remove',
        title: 'pending 追加を取消',
        onclick: () => {
          pendingCircleAliases[c.id].splice(idx, 1);
          if (pendingCircleAliases[c.id].length === 0) delete pendingCircleAliases[c.id];
          savePendingCircleAliases(pendingCircleAliases);
          render();
        },
      }, '×'));
      aliasRow.appendChild(chip);
    });

    const aliasInput = el('input', {
      type: 'text', placeholder: '+ 別名追加', class: 'add-alias-input',
    });
    const aliasBtn = el('button', {
      type: 'button', class: 'add-alias-btn',
      onclick: () => {
        const v = (aliasInput.value || '').trim();
        if (!v) return;
        const arr = pendingCircleAliases[c.id] = pendingCircleAliases[c.id] || [];
        if (v === c.circle_name || (c.aliases || []).includes(v) || arr.includes(v)) {
          alert('重複している、もう登録済み');
          return;
        }
        arr.push(v);
        savePendingCircleAliases(pendingCircleAliases);
        aliasInput.value = '';
        render();
      },
    }, '+');
    aliasInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); aliasBtn.click(); }
    });
    aliasRow.appendChild(aliasInput);
    aliasRow.appendChild(aliasBtn);
    head.appendChild(aliasRow);
  }

  function decorateCircleSocials(card, c) {
    // Find or insert the chip row directly under .circle-row-head.
    let chipRow = card.querySelector(':scope > .circle-row-head + .circle-links');
    if (!chipRow) {
      // Insert an empty chip row right after .circle-row-head
      chipRow = el('div', { class: 'circle-links' });
      const head = card.querySelector(':scope > .circle-row-head');
      if (head && head.nextSibling) card.insertBefore(chipRow, head.nextSibling);
      else card.appendChild(chipRow);
    }

    // Augment existing circle social chips with × button
    chipRow.querySelectorAll('.circle-link-chip').forEach(chip => {
      const url = chip.getAttribute('href');
      if (!url) return;
      // Only augment chips that came from circle.socials (not member socials)
      // — the renderSocialChipRow output for the circle-socials section is
      // the first .circle-links child, member chips are inside member-sections.
      const marked = (pendingRemovals[c.id] || []).includes(url);  // shared bag for now (Bγ may add per-circle-social removal)
      // Skip if button already added
      if (chip.querySelector('.existing-remove')) return;
      chip.appendChild(el('button', {
        type: 'button', class: 'existing-remove',
        title: 'この合同 SNS を削除',
        onclick: (e) => {
          e.preventDefault();
          // Mark via pendingCircleSocials-removal scheme (placeholder — Bγ refines)
          const arr = pendingRemovals[c.id] = pendingRemovals[c.id] || [];
          const i = arr.indexOf(url);
          if (i >= 0) arr.splice(i, 1); else arr.push(url);
          if (arr.length === 0) delete pendingRemovals[c.id];
          savePendingRemovals(pendingRemovals);
          render();
        },
      }, '×'));
    });

    // Append pending-add circle socials as chips
    (pendingCircleSocials[c.id] || []).forEach((s, idx) => {
      const chip = el('a', {
        class: 'circle-link-chip pending-add chip-' + s.platform,
        href: s.url, target: '_blank', rel: 'noopener',
      });
      chip.appendChild(document.createTextNode('+ ' + s.platform + (s.handle ? ' ' + s.handle : '')));
      chip.appendChild(el('button', {
        type: 'button', class: 'pending-add-remove',
        onclick: (e) => {
          e.preventDefault();
          pendingCircleSocials[c.id].splice(idx, 1);
          if (pendingCircleSocials[c.id].length === 0) delete pendingCircleSocials[c.id];
          savePendingCircleSocials(pendingCircleSocials);
          render();
        },
      }, '×'));
      chipRow.appendChild(chip);
    });

    appendAddSocialForm(card, chipRow, 'circle', c);
  }

  function decorateMember(sec, a, c) {
    const decision = pending[a.id] || null;
    const isDraft = decision && !decision.confirmed && decision.decision !== 'skip' && decision.decision !== 'remove_member';
    const isSkip = decision && decision.decision === 'skip';
    const isRemove = decision && decision.decision === 'remove_member';
    const isConfirmed = decision && decision.confirmed && decision.decision === 'rename';
    if (isSkip) sec.classList.add('skip-decision');
    else if (isRemove) sec.classList.add('remove-decision');
    else if (isConfirmed) sec.classList.add('has-decision');
    else if (isDraft) sec.classList.add('is-draft');

    const head = sec.querySelector(':scope > .member-head');

    // Per howish 2026-06-04: drop the duplicated member-name text in edit
    // mode — the name input below carries the editable value. Keep just
    // the 👤 marker so the role stays visually anchored.
    if (head) {
      const nameSpan = head.querySelector(':scope > .member-name');
      if (nameSpan) nameSpan.textContent = '👤';
    }

    // Name + source row (skip for skip/remove states)
    let nameInput = null, sourceSelect = null;
    if (head && !isSkip && !isRemove) {
      let presetName;
      if (decision && decision.name != null) presetName = decision.name;
      else if (a.name_audit_suggestion && a.name_audit_suggestion.name) presetName = a.name_audit_suggestion.name;
      else presetName = a.name || a.name_inferred || '';

      nameInput = el('input', {
        type: 'text', placeholder: '本人の display_name', value: presetName,
        class: 'card-name-input',
      });
      sourceSelect = el('select', { class: 'card-source-select' });
      const plat = authorPrimaryPlatform(a);
      const defaultSource = (decision && decision.source) ? decision.source
        : (a.name_source === 'audit_flagged' && a.name_source_prev) ? a.name_source_prev
        : plat === 'x' ? 'x_profile' : plat === 'plurk' ? 'plurk_profile'
        : plat === 'fb' ? 'fb_profile' : plat === 'ig' ? 'ig_profile'
        : plat === 'threads' ? 'threads_profile' : plat === 'pixiv' ? 'pixiv_profile'
        : plat === 'doujin_tw' ? 'doujin_tw_profile' : plat === 'aggregator' ? 'aggregator_profile'
        : 'user';
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
      nameInput.addEventListener('input', () => {
        const v = nameInput.value;
        if (!v) { delete pending[a.id]; }
        else {
          pending[a.id] = Object.assign({}, pending[a.id] || {},
            { author_id: a.id, decision: 'rename', name: v,
              source: sourceSelect.value, confirmed: false });
        }
        savePending(pending);
        renderPending();
      });
      sourceSelect.addEventListener('change', () => {
        if (nameInput.value) {
          pending[a.id] = Object.assign({}, pending[a.id] || {},
            { author_id: a.id, decision: 'rename', name: nameInput.value,
              source: sourceSelect.value, confirmed: false });
          savePending(pending);
          renderPending();
        }
      });
      const nameRow = el('div', { class: 'card-form-row card-name-row' });
      nameRow.appendChild(nameInput);
      nameRow.appendChild(sourceSelect);
      head.appendChild(nameRow);

      // Action buttons row is built here but APPENDED TO THE SECTION at the
      // very end (after aliases, socials, WS candidates) per howish
      // 2026-06-04 — keeps the head focused on identity (name + source).
      var actions = el('div', { class: 'card-form-actions' });
      // ✅ Confirm — toggleable (click again to un-confirm back to draft).
      var confirmBtn = el('button', {
        type: 'button', class: 'confirm-btn' + (isConfirmed ? ' is-confirmed' : ''),
        title: isConfirmed ? 'もう一度押して draft に戻す' : '名前と source を確定',
      }, isConfirmed ? '✅ 確定済 (取消)' : '✅ 確定');
      confirmBtn.addEventListener('click', () => {
        if (isConfirmed) {
          // Toggle back to draft — keep name/source intact, just unmark
          pending[a.id] = Object.assign({}, pending[a.id], { confirmed: false });
          savePending(pending);
        } else {
          const name = (nameInput.value || '').trim();
          if (!name) { alert('名前を入力してください'); return; }
          pending[a.id] = { author_id: a.id, decision: 'rename', name,
                            source: sourceSelect.value, confirmed: true };
          savePending(pending);
        }
        render();
      });
      actions.appendChild(confirmBtn);
      // ✨ Suggestion bulk-accept (Sprint Bγ-polish C) — only when an audit
      // suggestion exists and the reviewer hasn't confirmed yet.
      var suggestion = a.name_audit_suggestion;
      if (suggestion && suggestion.name && !isConfirmed) {
        var sugBtn = el('button', {
          type: 'button', class: 'accept-suggestion-btn',
          title: suggestion.reason ? '理由: ' + suggestion.reason : '監査候補を採用',
        }, '✨ 候補採用');
        sugBtn.addEventListener('click', () => {
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
          nameInput.dispatchEvent(new Event('input'));
          render();
        });
        actions.appendChild(sugBtn);
      }
      // 🗑 remove_member
      var removeBtn = el('button', {
        type: 'button', class: 'remove-btn',
      }, '🗑 削除');
      removeBtn.addEventListener('click', () => {
        if (!confirm(`Author「${a.name || a.name_inferred || a.id}」を circle から削除しますか？`)) return;
        pending[a.id] = { author_id: a.id, decision: 'remove_member',
                          circle_id: c.id, confirmed: true };
        savePending(pending);
        render();
      });
      actions.appendChild(removeBtn);
      // ↩ revert (if any pending — fully clears the decision incl. draft state)
      if (decision) {
        var revertBtn = el('button', {
          type: 'button', class: 'revert-btn',
        }, '↩ 取消');
        revertBtn.addEventListener('click', () => {
          delete pending[a.id];
          savePending(pending);
          render();
        });
        actions.appendChild(revertBtn);
      }
      // actions row is appended to sec AFTER socials/WS — see end of fn.
    }

    // Member alias row (saved + pending + add input)
    // Per howish 2026-06-04: append IMMEDIATELY after member-head so the
    // "name + source" + "aliases" + "socials" groups are visually
    // sequenced. The afterEl-aware appendAddSocialForm relies on chip
    // row position, so we insert this row BEFORE the chip row.
    const savedAliases = a.aliases || [];
    const pendingMemAdds = pendingAliases[a.id] || [];
    const aliasRow = el('div', { class: 'card-alias-row' });
    aliasRow.appendChild(el('span', { class: 'card-alias-label' }, '別名:'));
    savedAliases.forEach(al => {
      const marked = isAliasMarkedForRemoval(a.id, al);
      const chip = el('span', { class: 'alias-chip' + (marked ? ' marked-remove' : '') });
      chip.appendChild(el('span', { class: 'alias-text' }, al));
      chip.appendChild(el('button', {
        type: 'button', class: 'alias-remove',
        title: marked ? '削除を取消' : 'この別名を削除',
        onclick: () => toggleAliasRemoval(a.id, al),
      }, marked ? '↺' : '×'));
      aliasRow.appendChild(chip);
    });
    pendingMemAdds.forEach((al, idx) => {
      const chip = el('span', { class: 'alias-chip pending-add' });
      chip.appendChild(el('span', { class: 'alias-text' }, '+ ' + al));
      chip.appendChild(el('button', {
        type: 'button', class: 'alias-remove',
        onclick: () => {
          pendingAliases[a.id].splice(idx, 1);
          if (pendingAliases[a.id].length === 0) delete pendingAliases[a.id];
          savePendingAliases(pendingAliases);
          render();
        },
      }, '×'));
      aliasRow.appendChild(chip);
    });
    const mAliasInput = el('input', {
      type: 'text', placeholder: '+ 別名追加', class: 'add-alias-input',
    });
    const mAliasBtn = el('button', {
      type: 'button', class: 'add-alias-btn',
      onclick: () => {
        const v = (mAliasInput.value || '').trim();
        if (!v) return;
        const arr = pendingAliases[a.id] = pendingAliases[a.id] || [];
        if (v === a.name || v === a.name_inferred || arr.includes(v) || (a.aliases || []).includes(v)) {
          alert('重複している、もう登録済み');
          return;
        }
        arr.push(v);
        savePendingAliases(pendingAliases);
        mAliasInput.value = '';
        render();
      },
    }, '+');
    mAliasInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); mAliasBtn.click(); }
    });
    aliasRow.appendChild(mAliasInput);
    aliasRow.appendChild(mAliasBtn);
    // Insert aliasRow BEFORE the chip row so the order is:
    //   member-head (name+source) → aliases edit → socials chips → ...
    const _chipRowForAlias = sec.querySelector(':scope > .circle-links');
    if (_chipRowForAlias) sec.insertBefore(aliasRow, _chipRowForAlias);
    else sec.appendChild(aliasRow);

    // Augment existing member social chips with × button
    const memberChipRow = sec.querySelector(':scope > .circle-links');
    if (memberChipRow) {
      memberChipRow.querySelectorAll('.circle-link-chip').forEach(chip => {
        const url = chip.getAttribute('href');
        if (!url) return;
        const marked = isMarkedForRemoval(a.id, url);
        chip.classList.toggle('marked-remove', marked);
        if (chip.querySelector('.existing-remove')) return;
        chip.appendChild(el('button', {
          type: 'button', class: 'existing-remove',
          title: marked ? '削除を取消' : 'この link を削除',
          onclick: (e) => { e.preventDefault(); toggleRemoval(a.id, url); },
        }, marked ? '↺' : '×'));
      });
      // Append pending-add chips
      (pendingSocials[a.id] || []).forEach((s, idx) => {
        const chip = el('a', {
          class: 'circle-link-chip pending-add chip-' + s.platform,
          href: s.url, target: '_blank', rel: 'noopener',
        });
        chip.appendChild(document.createTextNode('+ ' + s.platform + (s.handle ? ' ' + s.handle : '')));
        chip.appendChild(el('button', {
          type: 'button', class: 'pending-add-remove',
          onclick: (e) => {
            e.preventDefault();
            pendingSocials[a.id].splice(idx, 1);
            if (pendingSocials[a.id].length === 0) delete pendingSocials[a.id];
            savePendingSocials(pendingSocials);
            render();
          },
        }, '×'));
        memberChipRow.appendChild(chip);
      });
      appendAddSocialForm(sec, memberChipRow, 'member', a);
    }

    // WS (WebSearch) candidates — surface as "🌐 候補" block at end of section
    decorateMemberWSCandidates(sec, a);

    // Action buttons row at the absolute bottom of the section (per howish
    // 2026-06-04). `actions` was built at the head section above; we
    // defer its placement to here so it sits below all the editing
    // affordances (aliases, socials, WS candidates).
    if (typeof actions !== 'undefined' && actions) sec.appendChild(actions);
  }

  // WS candidate decoration — moved from old renderAuthorPanel (Sprint Bγ
  // 2026-06-04). Surfaces window.WS_CANDIDATES[a.id] entries that:
  //   - match window.PROFILE_PATTERNS (profile-shaped URLs only — no posts)
  //   - aren't already in a.socials or pendingSocials
  //   - aren't dismissed (× 違う)
  // Each candidate gets a [+ 採用] and [× 違う] button.
  function decorateMemberWSCandidates(sec, a) {
    function normWsUrl(u) {
      return (u || '').toLowerCase()
        .replace(/^https?:\/\//, '').replace(/^www\./, '')
        .split('?')[0].split('#')[0].replace(/\/+$/, '');
    }
    const PROFILE_PATTERNS = window.PROFILE_PATTERNS || [];
    function isAllowedProfileUrl(url) {
      if (!url) return false;
      for (const p of PROFILE_PATTERNS) {
        try { if (new RegExp(p.regex).test(url)) return true; } catch (e) {}
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
      if (!isAllowedProfileUrl(h.url)) return false;
      const n = normWsUrl(h.url);
      return !registeredNorms.has(n) && !dismissedNorms.has(n);
    });
    if (!wsHits.length) return;

    const wsBlock = el('div', { class: 'card-ws-block' });
    wsBlock.appendChild(el('div', { class: 'card-ws-label' },
      '🌐 WebSearch 候補 (click で実物確認 → 「+ 採用」or 「× 違う」)'));
    const list = el('div', { class: 'card-ws-list' });
    wsHits.forEach(h => {
      const item = el('div', { class: 'card-ws-item conf-' + (h.confidence || 'medium') });
      item.appendChild(el('a', {
        href: h.url, target: '_blank', rel: 'noopener', class: 'card-ws-link',
      }, `${h.platform || '🔗'} → ${h.url}`));
      if (h.snippet) item.appendChild(el('div', { class: 'card-ws-snippet' }, '💬 ' + h.snippet));
      const btnRow = el('div', { class: 'card-ws-btn-row' });
      btnRow.appendChild(el('button', {
        type: 'button', class: 'card-ws-add',
        title: 'この URL を pending 追加',
        onclick: () => {
          (pendingSocials[a.id] = pendingSocials[a.id] || []).push({
            platform: h.platform || 'generic', url: h.url, handle: '',
          });
          savePendingSocials(pendingSocials);
          render();
        },
      }, '+ 採用'));
      btnRow.appendChild(el('button', {
        type: 'button', class: 'card-ws-dismiss',
        title: '違う人 — この候補を非表示',
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
    sec.appendChild(wsBlock);
  }

  // Unified add-social form factory — used for both circle and member contexts.
  // `kind` is 'circle' (writes to pendingCircleSocials[c.id]) or 'member'
  // (writes to pendingSocials[a.id]); `entity` is the corresponding object.
  // If `afterEl` is provided, the add-social block is inserted right after
  // it (so the affordance sits adjacent to the chip row). Otherwise it's
  // appended to the container.
  function appendAddSocialForm(container, afterEl, kind, entity) {
    const addBlock = el('div', { class: 'add-social-block' });
    const addToggle = el('button', {
      type: 'button', class: 'add-social-toggle',
      onclick: () => addBlock.classList.toggle('open'),
    }, kind === 'circle' ? '+ 合同 SNS 追加' : '+ SNS 追加');
    const addForm = el('div', { class: 'add-social-form' });
    const urlInput = el('input', {
      type: 'url', placeholder: 'URL (https://...)', class: 'add-social-url',
    });
    const platSelect = el('select', { class: 'add-social-platform' });
    const PLAT_OPTIONS = ['x', 'plurk', 'fb', 'ig', 'threads', 'bsky', 'pixiv',
      'doujin_tw', 'aggregator', 'booth_pm', 'wix', 'blog', 'gamer', 'generic'];
    for (const p of PLAT_OPTIONS) {
      platSelect.appendChild(el('option', { value: p }, p));
    }
    const handleInput = el('input', {
      type: 'text', placeholder: 'handle (任意)', class: 'add-social-handle',
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
      type: 'button', class: 'add-social-add',
      onclick: () => {
        let u = urlInput.value.trim();
        if (!u) { alert('URL を入力してください'); return; }
        if (!/^https?:\/\//.test(u)) u = 'https://' + u;
        const platform = platSelect.value;
        const handle = handleInput.value.trim();
        if (kind === 'circle') {
          const arr = pendingCircleSocials[entity.id] = pendingCircleSocials[entity.id] || [];
          if (arr.some(s => s.url === u) || (entity.socials || []).some(s => s.url === u)) {
            alert('重複している'); return;
          }
          arr.push({ platform, url: u, handle });
          savePendingCircleSocials(pendingCircleSocials);
        } else if (kind === 'new-member') {
          entity.socials = entity.socials || [];
          if (entity.socials.some(s => s.url === u)) {
            alert('重複している'); return;
          }
          entity.socials.push({ platform, url: u, handle });
          savePendingNewMembers(pendingNewMembers);
        } else {
          const arr = pendingSocials[entity.id] = pendingSocials[entity.id] || [];
          if (arr.some(s => s.url === u) || (entity.socials || []).some(s => s.url === u)) {
            alert('重複している'); return;
          }
          arr.push({ platform, url: u, handle });
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
    if (afterEl && afterEl.parentNode === container && afterEl.nextSibling) {
      container.insertBefore(addBlock, afterEl.nextSibling);
    } else if (afterEl && afterEl.parentNode === container) {
      container.appendChild(addBlock);  // afterEl is last child — append works
    } else {
      container.appendChild(addBlock);
    }
  }

  // Sprint Bγ-polish B (2026-06-04): + 新メンバー追加 button + new-member
  // section decorator. Used when a circle's roster needs a member that
  // doesn't yet exist as an Author record (e.g. collective member becomes
  // visible mid-cycle).
  function appendAddMemberButton(card, c) {
    const btn = el('button', {
      type: 'button', class: 'add-member-btn',
    }, '+ 新メンバー追加');
    btn.addEventListener('click', () => {
      const tempId = 'new_' + Math.random().toString(36).slice(2, 10);
      pendingNewMembers.push({
        tempId, circle_id: c.id, name: '', source: 'user',
        aliases: [], socials: [], confirmed: false,
      });
      savePendingNewMembers(pendingNewMembers);
      render();
    });
    // Insert ABOVE the .circle-events row so the affordance sits with the
    // members it'll add to (per howish 2026-06-04). If no events row exists
    // (shouldn't happen but be safe), append to card.
    const events = card.querySelector(':scope > .circle-events');
    if (events) card.insertBefore(btn, events);
    else card.appendChild(btn);
  }

  function decorateNewMember(sec, m, c) {
    const head = el('div', { class: 'member-head' });
    head.appendChild(el('span', { class: 'section-label member-name' }, '👤 (新規)'));

    const nameInput = el('input', {
      type: 'text', placeholder: '本人の display_name', value: m.name || '',
      class: 'card-name-input',
    });
    const sourceSelect = el('select', { class: 'card-source-select' });
    for (const o of SOURCE_OPTIONS) {
      const opt = el('option', { value: o.value }, o.label);
      if (o.value === (m.source || 'user')) opt.selected = true;
      sourceSelect.appendChild(opt);
    }
    nameInput.addEventListener('input', () => {
      m.name = nameInput.value;
      m.confirmed = false;
      savePendingNewMembers(pendingNewMembers);
      renderPending();
    });
    sourceSelect.addEventListener('change', () => {
      m.source = sourceSelect.value;
      m.confirmed = false;
      savePendingNewMembers(pendingNewMembers);
      renderPending();
    });
    const nameRow = el('div', { class: 'card-form-row card-name-row' });
    nameRow.appendChild(nameInput);
    nameRow.appendChild(sourceSelect);
    head.appendChild(nameRow);

    // Action row built here, appended at section bottom after socials.
    const actions = el('div', { class: 'card-form-actions' });
    const confirmBtn = el('button', {
      type: 'button', class: 'confirm-btn' + (m.confirmed ? ' is-confirmed' : ''),
      title: m.confirmed ? 'もう一度押して draft に戻す' : '新規メンバーを確定',
    }, m.confirmed ? '✅ 確定済 (取消)' : '✅ 確定');
    confirmBtn.addEventListener('click', () => {
      if (m.confirmed) {
        m.confirmed = false;
      } else {
        if (!m.name || !m.name.trim()) { alert('名前を入力してください'); return; }
        m.confirmed = true;
      }
      savePendingNewMembers(pendingNewMembers);
      render();
    });
    actions.appendChild(confirmBtn);
    const newRemoveBtn = el('button', {
      type: 'button', class: 'remove-btn',
    }, '🗑 削除');
    newRemoveBtn.addEventListener('click', () => {
      if (!confirm('この新規メンバーを削除しますか？')) return;
      pendingNewMembers = pendingNewMembers.filter(x => x.tempId !== m.tempId);
      savePendingNewMembers(pendingNewMembers);
      render();
    });
    actions.appendChild(newRemoveBtn);
    sec.appendChild(head);

    // Aliases (m.aliases — direct mutation)
    const aliasRow = el('div', { class: 'card-alias-row' });
    aliasRow.appendChild(el('span', { class: 'card-alias-label' }, '別名:'));
    (m.aliases || []).forEach((al, idx) => {
      const chip = el('span', { class: 'alias-chip' });
      chip.appendChild(el('span', { class: 'alias-text' }, al));
      chip.appendChild(el('button', {
        type: 'button', class: 'alias-remove',
        onclick: () => {
          m.aliases.splice(idx, 1);
          savePendingNewMembers(pendingNewMembers);
          render();
        },
      }, '×'));
      aliasRow.appendChild(chip);
    });
    const aliasInput = el('input', { type: 'text', placeholder: '+ 別名', class: 'add-alias-input' });
    const aliasBtn = el('button', {
      type: 'button', class: 'add-alias-btn',
      onclick: () => {
        const v = (aliasInput.value || '').trim();
        if (!v) return;
        m.aliases = m.aliases || [];
        if (m.aliases.includes(v)) { alert('重複'); return; }
        m.aliases.push(v);
        savePendingNewMembers(pendingNewMembers);
        aliasInput.value = '';
        render();
      },
    }, '+');
    aliasInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); aliasBtn.click(); }
    });
    aliasRow.appendChild(aliasInput);
    aliasRow.appendChild(aliasBtn);
    sec.appendChild(aliasRow);

    // Socials chip row + add form
    const chipRow = el('div', { class: 'circle-links' });
    (m.socials || []).forEach((s, idx) => {
      const chip = el('a', {
        class: 'circle-link-chip chip-' + s.platform,
        href: s.url, target: '_blank', rel: 'noopener',
      });
      chip.appendChild(document.createTextNode(s.platform + (s.handle ? ' ' + s.handle : '')));
      chip.appendChild(el('button', {
        type: 'button', class: 'existing-remove',
        onclick: (e) => {
          e.preventDefault();
          m.socials.splice(idx, 1);
          savePendingNewMembers(pendingNewMembers);
          render();
        },
      }, '×'));
      chipRow.appendChild(chip);
    });
    sec.appendChild(chipRow);
    appendAddSocialForm(sec, chipRow, 'new-member', m);
    // Action row (✅ 確定 / 🗑 削除) sits at the absolute bottom of the
    // section per howish 2026-06-04.
    sec.appendChild(actions);
  }

  // ---- Edit-mode hooks for circles.js applyFilter ----
  // YACHI_PASSES_FILTER: a circle shows if ANY of its members passes the
  // edit-mode author-level filters (status/event/platform/search). circles.js
  // also runs its own search blob check (over hydrated circle fields), so
  // this hook only enforces the status filter (the edit-only one).
  function setupHooks() {
    window.YACHI_PASSES_FILTER = function(c) {
      const members = c.memberAuthors || [];
      const hasPendingNewMember = pendingNewMembers.some(m => m.circle_id === c.id);
      if (!members.length) return hasPendingNewMember;
      const anyMatch = members.some(a => authorMatchesFilters(a));
      return anyMatch || hasPendingNewMember;
    };

    window.YACHI_DECORATE_CARD = decorateCard;

    // YACHI_PAGINATE: edit mode shows 20/page; read mode has no pagination
    // (this hook isn't set in read mode). Appends pagination nav as a child
    // of `list`, returns the visible subset.
    window.YACHI_PAGINATE = function(matches, list) {
      const totalCircles = matches.length;
      const totalPages = Math.max(1, Math.ceil(totalCircles / PAGE_SIZE));
      if (currentPage >= totalPages) currentPage = totalPages - 1;
      if (currentPage < 0) currentPage = 0;
      const startIdx = currentPage * PAGE_SIZE;
      const endIdx = Math.min(startIdx + PAGE_SIZE, totalCircles);

      // Pagination nav scheduled to be appended AFTER cards by applyFilter,
      // but applyFilter appends our return to list in order. Easier: build
      // nav now, append after the function call (we can't here without DOM
      // mutation). Use a microtask to defer.
      Promise.resolve().then(() => {
        if (totalPages > 1) {
          const nav = el('div', { class: 'review-pagination' });
          function pageBtn(label, targetPage, disabled, active) {
            const cls = 'page-btn' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
            return el('button', {
              type: 'button', class: cls,
              onclick: () => { if (!disabled && !active) { currentPage = targetPage; render(); window.scrollTo(0, 0); } },
            }, label);
          }
          nav.appendChild(pageBtn('← prev', currentPage - 1, currentPage === 0, false));
          const pageNums = [];
          for (let p = 0; p < totalPages; p++) {
            if (p === 0 || p === totalPages - 1 || (p >= currentPage - 2 && p <= currentPage + 2)) {
              pageNums.push(p);
            } else if (pageNums[pageNums.length - 1] !== '…') {
              pageNums.push('…');
            }
          }
          pageNums.forEach(p => {
            if (p === '…') nav.appendChild(el('span', { class: 'page-ellipsis' }, '…'));
            else nav.appendChild(pageBtn(String(p + 1), p, false, p === currentPage));
          });
          nav.appendChild(pageBtn('next →', currentPage + 1, currentPage === totalPages - 1, false));
          list.appendChild(nav);
        }
      });
      return matches.slice(startIdx, endIdx);
    };

    // YACHI_UPDATE_STATS: edit-mode stats text overrides read-mode default.
    window.YACHI_UPDATE_STATS = function({ matches, visible, total }) {
      const stats = document.getElementById('circles-stats');
      if (!stats) return;
      const totalCircles = matches.length;
      const totalPages = Math.max(1, Math.ceil(totalCircles / PAGE_SIZE));
      const startIdx = currentPage * PAGE_SIZE;
      const endIdx = Math.min(startIdx + PAGE_SIZE, totalCircles);
      const totalAuthors = authorList().length;
      let unresolved = 0;
      for (const a of authorList()) {
        if (a.name_source === 'circle_name' || a.name_source === 'audit_flagged') unresolved++;
      }
      const showingRange = totalCircles ? `${startIdx + 1}–${endIdx}` : '0';
      stats.textContent =
        `${showingRange} / ${totalCircles} circles 表示 (page ${currentPage + 1}/${totalPages}) — ` +
        `未確定 author ${unresolved} / 全 author ${totalAuthors}`;
    };
  }

  // render() — thin wrapper: refresh pending panel + re-run the shared
  // applyFilter (which calls our decorator on each card).
  function render() {
    renderPending();
    if (window.YACHI_RERENDER) window.YACHI_RERENDER();
  }

  // ---- Bootstrap ----
  // Wire edit-mode hooks BEFORE the first applyFilter call so circles.js's
  // render path uses our pagination/decorator/stats.
  setupHooks();

  // Reset pagination whenever any shared filter changes (circles.js calls
  // this hook on event/platform/base/search changes; read mode resets its
  // own readPage internally).
  window.YACHI_ON_FILTER_CHANGE = function() { currentPage = 0; };

  // Status filter (edit-only chip row #filter-row-status)
  document.querySelectorAll('#filter-row-status [data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-row-status [data-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStatus = btn.dataset.status;
      currentPage = 0;
      render();
    });
  });

  // Search — shared #circles-search input drives both modes. Reset to page 0
  // when the query changes (edit-mode pagination concept).
  const searchInput = document.getElementById('circles-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentPage = 0;
      render();
    });
  }

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

  render();
})();
