#!/usr/bin/env python3
"""Apply deep-clean decisions from .name-cleanup-decisions.json:
 - 'truly clean' (defined by `before` string list below): apply directly
 - all others: flag with name_source='audit_flagged' + name_audit_reason
   = `<rule_label>: → <proposed_name>[ + aliases [...]]`
   so the reviewer sees the suggestion inline in the queue card.

Idempotent on re-run.
"""
from __future__ import annotations

import json
from pathlib import Path


# Strings that match `before` EXACTLY → apply the decision directly.
# Everything else in .name-cleanup-decisions.json → review queue.
TRULY_CLEAN_BEFORES = {
    'SZKOBO袖子（此新帳為主',
    'Kizuki🦇創集繪S31',
    '南瓜｜GJ J13',
    '優萱🍬創集繪L11',
    '小河🧋創集繪小百翁S11',
    '杏仁豆腐 創集繪_L34',
    '漸絃💖GJ M31',
    '吐司🍞創集繪X02',
    '歪歪☞IF創集繪N31',
    '日日比🍍💀創集繪Q13',
    'MASAMI★創集繪【J12',
    'MaTo🦊創集繪W2526',
    '鵺空✦創集繪K28',
    '圭沂:GJ O09',
    '芥子🌱來場感謝',
    '詠真🧡集創繪 L14',
    '🐤tonton-創集繪S30',
    '偶咦♞創集繪L01',
    '千千🍋創集繪Z16',
    '冰的紅茶_創集繪_U01',
    '濕抹布-創集繪K13',
    '🏍星雪🏎創集繪N09N10🌽',
    '腐黑學 創集繪J05',
    '灰🌤️創集繪',
    'RAYRAY🐻創集繪T35',
    '猫又［歡迎約稿～～可詳談👌］',
    '•°+夜落烏啼+°• [插畫×文創×甜點］',
}


def main():
    root = Path(__file__).parent.parent.parent
    decisions = json.loads((root / '.name-cleanup-decisions.json').read_text(encoding='utf-8'))
    p = root / 'circles.json'
    d = json.loads(p.read_text(encoding='utf-8'))
    by_id = {a['id']: a for a in d['authors']}

    applied = 0
    flagged = 0
    skipped = []

    for dec in decisions:
        aid = dec['author_id']
        before = dec['before']
        a = by_id.get(aid)
        if not a:
            skipped.append((aid, 'not found'))
            continue
        # Sanity: only act if current field still matches `before`
        cur_field = dec['field']
        cur = (a.get(cur_field) or '').strip()
        if cur != before:
            # Skip if already at proposed state (idempotent), else flag for re-audit
            if cur == dec['after_name']:
                continue
            skipped.append((aid, f'{cur_field} drifted: {cur!r} != {before!r}'))
            continue

        if before in TRULY_CLEAN_BEFORES:
            # Apply directly
            a[cur_field] = dec['after_name']
            existing = list(a.get('aliases') or [])
            for al in dec.get('after_aliases') or []:
                if al not in existing:
                    existing.append(al)
            if existing: a['aliases'] = existing
            applied += 1
        else:
            # Flag for review with both human-readable reason AND
            # machine-readable suggestion (so the review UI can offer a
            # one-click "accept" button).
            if a.get('name_source') != 'audit_flagged':
                a.setdefault('name_source_prev', a.get('name_source', ''))
                a['name_source'] = 'audit_flagged'
            suggestion_text = f'→ {dec["after_name"]}'
            if dec.get('after_aliases'):
                suggestion_text += f' + aliases {dec["after_aliases"]}'
            a['name_audit_reason'] = f'{dec["rule"]}: {suggestion_text}'
            a['name_audit_suggestion'] = {
                'name': dec['after_name'],
                'aliases': list(dec.get('after_aliases') or []),
            }
            flagged += 1

    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'truly clean applied: {applied}')
    print(f'flagged for review:  {flagged}')
    print(f'total decisions:     {len(decisions)}')
    if skipped:
        print(f'skipped:             {len(skipped)}')
        for aid, why in skipped:
            print(f'  {aid}: {why}')


if __name__ == '__main__':
    main()
