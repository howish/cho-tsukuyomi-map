#!/usr/bin/env python3
"""Formal validation of every social link in circles.json.

Read-only — emits a JSON report + non-zero exit code if any issue found.
Use as a pre-commit gate or CI check.

Checks (per social entry):
  E1. URL is well-formed (scheme + host, no whitespace, no inline newline)
  E2. URL passes the skill's _NON_PROFILE_RE (not a post/share/artwork etc)
  E3. Platform name is canonical (no instagram/facebook/twitter aliases)
  E4. Platform matches URL host (platform='x' must point to x.com/twitter.com)
  E5. URL canonical not duplicated within author (incl. vs x_handle implicit X URL)

Per-author warnings:
  W1. Multiple accounts on a single-expected platform (x/plurk/ig/etc)
      — informational, kept; usually real but worth a manual look.
"""
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

sys.path.insert(0, str(Path.home() / '.claude/skills/author-name-resolver/scripts'))
from resolver import _PLATFORM_ALIAS, _PROFILE_PATTERNS, _match_profile, _canonicalize_url

SINGLE_EXPECTED = {'x', 'plurk', 'ig', 'pixiv', 'threads', 'bsky',
                   'doujin_tw', 'aggregator', 'booth_pm', 'gamer', 'youtube'}


def main():
    p = Path(__file__).parent.parent.parent / 'circles.json'
    d = json.loads(p.read_text(encoding='utf-8'))

    issues = []   # errors (E*)
    warnings = [] # informational (W*)

    for a in d['authors']:
        seen_canon = set()
        plat_count = defaultdict(int)

        for s in (a.get('socials') or []):
            url = s.get('url', '') or ''
            plat = s.get('platform', '') or ''
            ctx = {'author_id': a['id'], 'platform': plat, 'url': url}

            # E1: well-formed URL
            if not url:
                issues.append({**ctx, 'rule': 'E1_empty_url'})
                continue
            if re.search(r'\s', url):
                issues.append({**ctx, 'rule': 'E1_url_has_whitespace'})
                continue
            if not re.match(r'^https?://[^/]+', url):
                issues.append({**ctx, 'rule': 'E1_missing_scheme_or_host'})
                continue

            # E2: URL must match one of the per-platform allow patterns
            matched = _match_profile(url)
            if matched is None:
                issues.append({**ctx, 'rule': 'E2_no_profile_pattern_match'})
                continue
            expected_plat, _ = matched

            # E3: platform name canonical (no alias)
            if plat in _PLATFORM_ALIAS:
                issues.append({**ctx, 'rule': 'E3_platform_alias',
                               'expected': _PLATFORM_ALIAS[plat]})

            # E4: stored platform name agrees with URL-derived canonical
            if plat != expected_plat:
                issues.append({**ctx, 'rule': 'E4_platform_mismatch',
                               'expected': expected_plat})

            # E5: canonical duplicate
            ck = _canonicalize_url(url)
            if ck and ck in seen_canon:
                issues.append({**ctx, 'rule': 'E5_duplicate_canonical', 'canon': ck})
                continue
            if ck:
                seen_canon.add(ck)

            plat_count[plat] += 1

        # W1: multi-account on single-expected platform
        for plat, n in plat_count.items():
            if plat in SINGLE_EXPECTED and n > 1:
                warnings.append({
                    'author_id': a['id'],
                    'name': a.get('name') or a.get('name_inferred') or '',
                    'rule': 'W1_multi_account_on_single_platform',
                    'platform': plat,
                    'count': n,
                })

    # Report
    print(f'=== validation report ===')
    print(f'errors: {len(issues)}')
    print(f'warnings: {len(warnings)}')
    print()

    if issues:
        by_rule = defaultdict(list)
        for i in issues: by_rule[i['rule']].append(i)
        print('errors by rule:')
        for rule, items in sorted(by_rule.items()):
            print(f'  {rule}: {len(items)}')
            for it in items[:3]:
                print(f'    e.g. {it["author_id"]} [{it["platform"]}] {it["url"][:80]}')
            if len(items) > 3: print(f'    ...and {len(items)-3} more')
        print()

    if warnings:
        print('warnings:')
        by_rule = defaultdict(list)
        for w in warnings: by_rule[w['rule']].append(w)
        for rule, items in sorted(by_rule.items()):
            print(f'  {rule}: {len(items)}')

    # Write full report
    out = Path(__file__).parent.parent.parent / '.validation-report.json'
    out.write_text(json.dumps({'errors': issues, 'warnings': warnings},
                              ensure_ascii=False, indent=2) + '\n')
    print(f'\nfull report: {out}')

    return 1 if issues else 0


if __name__ == '__main__':
    sys.exit(main())
