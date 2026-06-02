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
  function loadPending() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { return {}; }
  }
  function savePending(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }
  let pending = loadPending();

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
    if (a.x_handle) return 'x';
    const s = a.socials || [];
    if (s.length === 0) return '_none';
    return s[0].platform || 'generic';
  }

  function authorPrimaryUrl(a) {
    if (a.x_handle) return 'https://x.com/' + a.x_handle;
    const s = a.socials || [];
    return (s[0] && s[0].url) || '';
  }

  function authorMatchesFilters(a) {
    // Status
    if (filterStatus === 'unresolved') {
      if (a.name_source !== 'circle_name' && !pending[a.id]) return false;
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
      a.id, a.name, a.name_inferred, a.x_handle,
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
    const isConfirmed = a.name_source !== 'circle_name' && a.name_source !== '';
    const curRow = el('div', { class: 'card-current-row' });
    curRow.appendChild(el('span', { class: 'card-current-label' }, '現:'));
    curRow.appendChild(el('span', {
      class: 'card-current-name' + (isConfirmed ? ' confirmed' : ''),
    }, displayName));
    curRow.appendChild(el('span', {
      class: 'card-source-tag' + (a.name_source === 'circle_name' ? ' inferred' : ''),
    }, a.name_source || '(empty)'));
    curRow.appendChild(el('span', { class: 'card-author-id' }, a.id));
    head.appendChild(curRow);

    card.appendChild(head);

    // Probe links — all socials + x_handle
    const links = el('div', { class: 'card-probe-links' });
    if (a.x_handle) {
      links.appendChild(el('a', {
        class: 'card-probe-link',
        href: 'https://x.com/' + a.x_handle,
        target: '_blank', rel: 'noopener',
      }, '𝕏 @' + a.x_handle));
    }
    for (const s of (a.socials || [])) {
      if (!s.url) continue;
      const label = (s.platform || '🔗') + (s.handle ? ' ' + s.handle : '');
      links.appendChild(el('a', {
        class: 'card-probe-link',
        href: s.url,
        target: '_blank', rel: 'noopener',
      }, label));
    }
    if (!links.children.length) {
      links.appendChild(el('span', { class: 'card-probe-link' }, '⚠️ SNS リンクなし'));
    }
    card.appendChild(links);

    // Yachiyo note
    const plat = authorPrimaryPlatform(a);
    const note = PLATFORM_NOTES[plat] || PLATFORM_NOTES.plain;
    card.appendChild(el('div', { class: 'card-yachiyo-note' }, '💭 ' + note));

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

      const nameInput = el('input', {
        type: 'text',
        name: 'name',
        placeholder: '本人の display_name',
        value: a.name_inferred || '',
      });

      const sourceSelect = el('select', { name: 'source' });
      const defaultSource = plat === 'x' ? 'x_profile' : plat === 'plurk' ? 'plurk_profile'
        : plat === 'fb' ? 'fb_profile' : plat === 'ig' ? 'ig_profile'
        : plat === 'threads' ? 'threads_profile' : plat === 'bsky' ? 'bsky_profile'
        : plat === 'pixiv' ? 'pixiv_profile' : plat === 'doujin_tw' ? 'doujin_tw_profile'
        : plat === 'aggregator' ? 'aggregator_profile' : 'user';
      for (const o of SOURCE_OPTIONS) {
        const opt = el('option', { value: o.value }, o.label);
        if (o.value === defaultSource) opt.selected = true;
        sourceSelect.appendChild(opt);
      }

      // Row 1: name input + source select
      const row1 = el('div', { class: 'card-form-row' });
      row1.appendChild(nameInput);
      row1.appendChild(sourceSelect);
      form.appendChild(row1);

      // Row 2: confirm + skip
      const actions = el('div', { class: 'card-form-actions' });
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
    const count = Object.keys(pending).length;
    document.getElementById('pending-count').textContent = count;
    list.innerHTML = '';
    if (count === 0) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    for (const aid in pending) {
      const d = pending[aid];
      const li = el('li');
      li.appendChild(el('strong', {}, aid));
      if (d.decision === 'rename') {
        li.appendChild(el('span', {}, `→ ${d.name} (${d.source})`));
      } else {
        li.appendChild(el('span', {}, '→ skip (本名不明)'));
      }
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
    return Object.values(pending);
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
      if (a.name_source === 'circle_name') unresolved++;
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
    savePending(pending);
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
