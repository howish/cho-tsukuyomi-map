#!/usr/bin/env python3
"""Apply the 15 audit-approved name cleanups + flag 3 ambiguous cases
for human review (name_source → 'audit_flagged').

Idempotent: re-running is a no-op if no entry matches the 'before' value.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


# (author_id, new_name, new_aliases_to_add, expected_before_name_or_None)
# expected_before is for safety — skip if name already differs (e.g. user
# already corrected it mid-flight).
FIXES = [
    # Whitespace trim
    ('a_a2dfa5ddf3c3', '環繞著土星的光環', [], '環繞著土星的光環 '),
    # Parenthetical → primary + alias
    ('a_f07d27e70f07', 'URA', ['うら'], 'URA（うら）'),
    # Slash separator
    ('a_321c4eff19f6', 'Agathe', ['阿嘎特.奇美拉'], 'Agathe/阿嘎特.奇美拉'),
    ('a_4474c820a1fa', 'AK', ['安愷'], 'AK/安愷'),
    ('a_853d18d7d481', 'AM000', ['小豆'], 'AM000/小豆'),
    ('a_c7b2a43f3e88', '九夏', ['Irene309'], '九夏／Irene309'),
    ('a_f66041decf36', '尾椎狗', ['00286'], '尾椎狗/00286'),
    ('a_ff9f5a241606', '綠錐', ['泲淳', 'ㄚ淳', 'ru'], '綠錐/泲淳/ㄚ淳/ru'),
    # Pipe separator
    ('a_4203793f2381', '王葳', ['Wei Wang'], '王       葳 | Wei Wang'),
    ('a_85447c5b4ad5', 'aPriori', ['ア・プリオリ'], 'aPriori  ｜ア・プリオリ'),
    # Event-status noise stripped
    ('a_ade7fd39106e', '泰茲', [], '泰茲¥5/30創集繪L8-10'),
    ('kei_megumi_', '恵海けい', [], '恵海けい＠5/24超ツクヨミ祭_6/21ツクスク_8月夏コミ'),
    ('mitsukiriko', 'みつきりこ🐈', [], 'みつきりこ🐈5/24 B-07'),
    ('teruru_sakura', 'さくらてるる🌸', [], 'さくらてるる🌸7/26 パンケーキ食べたい'),
]

# Ambiguous cases — push into the review queue by switching name_source
# to 'audit_flagged'. Keeps the existing `name` value so reviewers can see
# what's there and decide whether to split, accept, or rewrite.
DEFER_TO_REVIEW = [
    ('a_092280c25bda', '工坊·夏至千里', 'subtitle_vs_alias'),
    ('a_5898bca19572', '絨毛點 / 手作飾品', 'subtitle_vs_alias'),
    ('a_55be2db3317c', '⣿⣿ 安   全   渡   夏  ②⓪②③ ⣿⣿', 'heavy_decoration'),
]


def main():
    p = Path(__file__).parent.parent / 'circles.json'
    d = json.loads(p.read_text(encoding='utf-8'))

    by_id = {a['id']: a for a in d['authors']}

    applied = 0
    skipped = []
    for aid, new_name, add_aliases, expected_before in FIXES:
        a = by_id.get(aid)
        if not a:
            skipped.append((aid, 'not found'))
            continue
        cur = a.get('name', '') or ''
        if expected_before is not None and cur != expected_before:
            if cur == new_name:
                # Already applied — skip silently
                continue
            skipped.append((aid, f'name moved: {cur!r} != expected {expected_before!r}'))
            continue
        a['name'] = new_name
        existing_aliases = list(a.get('aliases') or [])
        for alias in add_aliases:
            if alias not in existing_aliases:
                existing_aliases.append(alias)
        if existing_aliases:
            a['aliases'] = existing_aliases
        applied += 1

    flagged = 0
    for aid, expected_name, reason in DEFER_TO_REVIEW:
        a = by_id.get(aid)
        if not a:
            skipped.append((aid, 'not found (defer)'))
            continue
        cur = a.get('name', '') or ''
        if cur != expected_name:
            skipped.append((aid, f'name moved: {cur!r} != expected {expected_name!r}'))
            continue
        # Stash original source + reason in side fields so reviewers see what
        # the auditor flagged; name_source = 'audit_flagged' makes the entry
        # appear in the review queue's "unresolved" bucket.
        if a.get('name_source') != 'audit_flagged':
            a.setdefault('name_source_prev', a.get('name_source', ''))
            a['name_source'] = 'audit_flagged'
        a['name_audit_reason'] = reason
        flagged += 1

    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'applied fixes:   {applied} / {len(FIXES)}')
    print(f'flagged review:  {flagged} / {len(DEFER_TO_REVIEW)}')
    if skipped:
        print(f'skipped:         {len(skipped)}')
        for aid, why in skipped:
            print(f'  {aid}: {why}')


if __name__ == '__main__':
    main()
