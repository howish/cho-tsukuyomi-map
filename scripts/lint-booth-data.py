#!/usr/bin/env python3
"""Audit if7-2026-05/data.js against if7-2026-05/filters.js.

Catches stale or invalid references — codes used on a booth that no
longer (or never) exist as a filter chip, mismatched categories, etc.

Usage:  python3 scripts/lint-booth-data.py [PATH/data.js] [PATH/filters.js]

Exit 0 = clean, exit 1 = at least one finding. Findings are printed
grouped by category, with `BOOTH_ID — CIRCLE_NAME: detail` per line so
they're easy to fix in the editor or in a follow-up commit.
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path


def slice_js_array(text: str, var_name: str) -> str:
    """Extract a JS array literal by name with bracket-balanced parsing.

    Handles strings (with escapes) so unbalanced brackets inside string
    contents don't break the count.
    """
    m = re.search(rf'{re.escape(var_name)}\s*=\s*\[', text)
    if not m:
        raise ValueError(f'{var_name} = [...] not found')
    start = m.end() - 1
    depth = 0
    in_str = False
    quote = None
    esc = False
    i = start
    while i < len(text):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == quote:
                in_str = False
        else:
            if c == '"' or c == "'":
                in_str = True; quote = c
            elif c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
        i += 1
    raise ValueError(f'unbalanced {var_name} array')


def parse_filters_config(filters_js: str) -> dict:
    """Parse FILTERS_CONFIG entries by extracting each list.

    FILTERS_CONFIG is JS, not JSON — needs minimal coercion for the
    fields we care about (code, label). We parse each list separately
    using bracket-balanced slicing + a relaxed token scanner.
    """
    config = {'cps': [], 'works': [], 'mediums': [], 'tags': [], 'areas': [], 'warnings': []}
    for key in config:
        m = re.search(rf'{key}\s*:\s*\[', filters_js)
        if not m:
            continue
        start = m.end() - 1
        depth = 0
        in_str = False
        quote = None
        esc = False
        i = start
        end = start
        while i < len(filters_js):
            c = filters_js[i]
            if in_str:
                if esc:
                    esc = False
                elif c == '\\':
                    esc = True
                elif c == quote:
                    in_str = False
            else:
                if c == '"' or c == "'":
                    in_str = True; quote = c
                elif c == '[':
                    depth += 1
                elif c == ']':
                    depth -= 1
                    if depth == 0:
                        end = i
                        break
            i += 1
        block = filters_js[start:end + 1]
        # Pull each `code: "..."` (or `code: '...'`) value
        for cm in re.finditer(r'code\s*:\s*(["\'])([^"\']+)\1', block):
            config[key].append(cm.group(2))
    return config


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('data_js', nargs='?', default='if7-2026-05/data.js')
    ap.add_argument('filters_js', nargs='?', default='if7-2026-05/filters.js')
    args = ap.parse_args()

    data_text = Path(args.data_js).read_text()
    filters_text = Path(args.filters_js).read_text()

    boots = json.loads(slice_js_array(data_text, 'BOOTHS'))
    cfg = parse_filters_config(filters_text)
    print(f'Loaded {len(boots)} booths · filters: '
          + ' '.join(f'{k}={len(v)}' for k, v in cfg.items()))

    valid_cps = set(cfg['cps'])
    valid_works = set(cfg['works'])
    valid_mediums = set(cfg['mediums'])
    valid_tags = set(cfg['tags'])
    valid_areas = set(cfg['areas'])
    valid_warnings = set(cfg['warnings'])
    valid_tag_like = valid_works | valid_mediums | valid_tags
    valid_all_tagish = valid_tag_like | valid_cps | {'r18'}

    findings = {
        'unknown_cp':       [],
        'unknown_tag_code': [],
        'unknown_area':     [],
        'unknown_warning':  [],
        'cp_in_tags':       [],
        'work_in_cps':      [],
        'medium_in_cps':    [],
        'duplicate_codes':  [],
        'missing_tags_obj': [],
    }

    for b in boots:
        bid = b.get('booth_id', '<?>')
        cn = b.get('circle_name', '')
        label = f'{bid} — {cn}'

        cps_list = b.get('cps') or []
        if not isinstance(cps_list, list):
            findings['unknown_cp'].append(f'{label}: cps field is not a list (got {type(cps_list).__name__})')
            cps_list = []
        if len(cps_list) != len(set(cps_list)):
            findings['duplicate_codes'].append(f'{label}: cps has duplicates {cps_list}')
        for c in cps_list:
            if c in valid_works:
                findings['work_in_cps'].append(f'{label}: "{c}" is a work code, should be in tags')
            elif c in valid_mediums:
                findings['medium_in_cps'].append(f'{label}: "{c}" is a medium code, should be in tags')
            elif c not in valid_cps:
                findings['unknown_cp'].append(f'{label}: cps "{c}" not in FILTERS_CONFIG.cps')

        tags_obj = b.get('tags')
        if tags_obj is None:
            findings['missing_tags_obj'].append(label)
            tags_obj = {}
        elif not isinstance(tags_obj, dict):
            findings['unknown_tag_code'].append(f'{label}: tags is not an object (got {type(tags_obj).__name__})')
            tags_obj = {}

        active_codes = [k for k, v in tags_obj.items() if v]
        for code in active_codes:
            if code in valid_cps:
                findings['cp_in_tags'].append(f'{label}: tag "{code}" is a CP code, should be in cps[]')
            elif code not in valid_tag_like:
                findings['unknown_tag_code'].append(f'{label}: tag "{code}" not in FILTERS_CONFIG (works/mediums/tags)')

        area = b.get('area')
        if area and area not in valid_areas:
            findings['unknown_area'].append(f'{label}: area "{area}" not in FILTERS_CONFIG.areas')

        warnings = b.get('warnings') or []
        if not isinstance(warnings, list):
            findings['unknown_warning'].append(f'{label}: warnings field not a list')
        else:
            for w in warnings:
                # warnings can be a string code OR a [code, …] tuple
                if isinstance(w, list):
                    code = w[0] if w else None
                elif isinstance(w, str):
                    code = w
                else:
                    code = None
                if code and code not in valid_warnings:
                    findings['unknown_warning'].append(f'{label}: warning "{code}" not in FILTERS_CONFIG.warnings')

    total = sum(len(v) for v in findings.values())
    print(f'\n=== Audit results: {total} findings ===\n')
    LABELS = {
        'unknown_cp':       'Unknown CP code (cps[] entry not in FILTERS_CONFIG.cps)',
        'unknown_tag_code': 'Unknown tag code (not in works/mediums/tags)',
        'unknown_area':     'Unknown area value',
        'unknown_warning':  'Unknown warning code',
        'cp_in_tags':       'CP code stored in tags{} instead of cps[]',
        'work_in_cps':      'Work code stored in cps[] instead of tags{}',
        'medium_in_cps':    'Medium code stored in cps[] instead of tags{}',
        'duplicate_codes':  'Duplicate codes inside cps[]',
        'missing_tags_obj': 'Booth missing tags{} object',
    }
    for k, label in LABELS.items():
        items = findings[k]
        if not items:
            continue
        print(f'-- {label} ({len(items)}):')
        for it in items:
            print(f'   {it}')
        print()

    sys.exit(1 if total else 0)


if __name__ == '__main__':
    main()
