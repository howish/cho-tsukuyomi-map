#!/usr/bin/env python3
"""Audit author name field for deep-cleanup categories.

Read-only — outputs counts + samples per category. No mutations.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


def main():
    p = Path(__file__).parent.parent.parent / 'circles.json'
    d = json.loads(p.read_text(encoding='utf-8'))
    authors = d['authors']
    circles_by_first_member: dict[str, dict] = {}
    for c in d['circles']:
        for mid in (c.get('members') or []):
            circles_by_first_member.setdefault(mid, c)
            break

    cats = defaultdict(list)

    for a in authors:
        aid = a['id']
        name = a.get('name', '') or ''
        inferred = a.get('name_inferred', '') or ''
        source = a.get('name_source', '') or ''
        aliases = a.get('aliases', []) or []
        socials = a.get('socials', []) or []
        circle = circles_by_first_member.get(aid)
        cname = (circle or {}).get('circle_name', '') if circle else ''

        # --- Empty name ---
        if not name:
            if inferred:
                cats['A_empty_name_with_inferred'].append((aid, inferred, source))
            else:
                cats['A_empty_name_no_inferred'].append((aid, source))
            continue

        # --- Whitespace anomalies ---
        if name != name.strip():
            cats['D_whitespace_edges'].append((aid, repr(name)))
        if re.search(r'\s{2,}', name):
            cats['E_multiple_spaces'].append((aid, repr(name)))

        # --- @ prefix (looks like a handle, not a name) ---
        if name.lstrip().startswith('@'):
            cats['C_at_prefix'].append((aid, name))

        # --- URL / scheme in name ---
        if re.search(r'https?://|www\.|\.com|\.tw|\.jp|\.net', name, re.I):
            cats['F_url_in_name'].append((aid, name))

        # --- Slash / ampersand separators (probably multiple authors) ---
        if re.search(r'[／/＆&]|·| / | ・ ', name):
            # but exclude single-char slashes in legit names — heuristic: 3+ alnum on each side
            sep_match = re.search(r'\s*[／/＆&·]\s*', name)
            if sep_match:
                parts = re.split(r'\s*[／/＆&·]\s*', name)
                if len(parts) >= 2 and all(len(p.strip()) >= 2 for p in parts):
                    cats['H_multi_via_separator'].append((aid, name, parts))

        # --- Parenthetical content (could be alias / profession / note) ---
        m = re.search(r'^(.+?)\s*[（(]\s*(.+?)\s*[）)]\s*$', name)
        if m:
            base, paren = m.group(1).strip(), m.group(2).strip()
            cats['G_parenthetical'].append((aid, name, base, paren))

        # --- Name == circle_name (brand case, expected) ---
        if cname and name == cname:
            cats['I_name_eq_circle'].append((aid, name))

        # --- Name == inferred (redundant) ---
        if inferred and name == inferred:
            cats['B_name_eq_inferred'].append((aid, name))

        # --- Placeholder / junk text ---
        if re.fullmatch(r'[?？\-_。、・*]+|@@+|n/?a|na|null|none|unknown|ニックネーム|あなたの名前|サークル名|名前|name', name, re.I):
            cats['K_placeholder'].append((aid, name))

        # --- Suspicious characters (control chars) ---
        if any(ord(c) < 0x20 or ord(c) == 0x7f for c in name):
            cats['L_control_chars'].append((aid, repr(name)))

        # --- Surrogate-pair garble (from old Plurk extraction bug) ---
        if re.search(r'[\ud800-\udfff]', name):
            cats['L_surrogate_garble'].append((aid, repr(name)))

        # --- Trailing punct / special ---
        if re.search(r'[。、！？!?]+$', name):
            cats['N_trailing_punct'].append((aid, name))

        # --- Trailing emoji (often artistic flair but sometimes scraped junk) ---
        if re.search(r'[☀-➿\U0001f300-\U0001fadf]\s*$', name):
            cats['O_trailing_emoji'].append((aid, name))

        # --- Very long names (>30 chars usually = bio fragment captured by mistake) ---
        if len(name) > 30:
            cats['P_overlong'].append((aid, name, len(name)))

        # --- Name with status tag (e.g. "山田太郎 [既刊] [新刊]" or "山田 (5/31〆)") ---
        if re.search(r'\[[^\]]+\]|【[^】]+】', name):
            cats['Q_bracket_tag'].append((aid, name))

    # name_source distribution
    src_counter = Counter(a.get('name_source', '') for a in authors)

    # Print report
    print('=== author name audit ===')
    print(f'total authors: {len(authors)}\n')
    print('name_source distribution:')
    for src, n in src_counter.most_common():
        print(f'  {src or "(empty)":18s} {n:4d}')
    print()
    print('cleanup categories:')
    for cat in sorted(cats.keys()):
        items = cats[cat]
        print(f'  {cat:35s} {len(items):4d}')
    print()
    print('=== samples (up to 5 per category) ===')
    for cat in sorted(cats.keys()):
        items = cats[cat]
        if not items: continue
        print(f'\n--- {cat} ({len(items)}) ---')
        for item in items[:5]:
            print(f'  {item}')

    # Dump full lists to JSON for follow-up
    out = Path(__file__).parent.parent.parent / '.author-audit.json'
    out.write_text(json.dumps({k: v for k, v in cats.items()}, ensure_ascii=False, indent=2),
                   encoding='utf-8')
    print(f'\nfull audit → {out}')


if __name__ == '__main__':
    main()
