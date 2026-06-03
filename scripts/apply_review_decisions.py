#!/usr/bin/env python3
"""Apply a decisions-NNNitems-*.json batch from the review queue to
circles.json. Each decision is one of:

  - rename:     {author_id, decision: "rename", name, source}
  - add_alias:  {author_id, decision: "add_alias", alias}
  - add_social: {author_id, decision: "add_social", platform, url, handle?}
  - skip:       {author_id, decision: "skip"}  (no-op, just clears flag)

On rename: also clears audit_flagged metadata (name_audit_reason,
name_audit_suggestion, name_source_prev) since the author is now resolved.

Idempotent: re-running with the same decisions has no further effect.

Usage:
  scripts/apply_review_decisions.py <decisions.json>
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def norm_url(u: str) -> str:
    if not u: return ''
    return (u.replace('http://', '').replace('https://', '')
             .replace('www.', '').split('?')[0].split('#')[0]
             .rstrip('/').lower())


def main():
    if len(sys.argv) != 2:
        print('usage: apply_review_decisions.py <decisions.json>', file=sys.stderr)
        sys.exit(2)

    decisions = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    root = Path(__file__).parent.parent
    p = root / 'circles.json'
    d = json.loads(p.read_text(encoding='utf-8'))
    by_id = {a['id']: a for a in d['authors']}

    counts = {'rename': 0, 'add_alias': 0, 'add_social': 0, 'skip': 0, 'skipped': 0}
    notes = []

    for dec in decisions:
        aid = dec.get('author_id')
        a = by_id.get(aid)
        if not a:
            notes.append(f'  {aid}: not found, skipped')
            counts['skipped'] += 1
            continue
        kind = dec.get('decision')

        if kind == 'rename':
            a['name'] = dec.get('name') or ''
            a['name_source'] = dec.get('source') or 'user'
            # Author is now resolved — clear audit-flag artifacts
            for k in ('name_audit_reason', 'name_audit_suggestion', 'name_source_prev'):
                if k in a: del a[k]
            counts['rename'] += 1

        elif kind == 'add_alias':
            alias = (dec.get('alias') or '').strip()
            if not alias:
                notes.append(f'  {aid}: add_alias empty, skipped')
                counts['skipped'] += 1
                continue
            existing = list(a.get('aliases') or [])
            if alias not in existing:
                existing.append(alias)
                a['aliases'] = existing
            counts['add_alias'] += 1

        elif kind == 'add_social':
            url = (dec.get('url') or '').strip()
            plat = dec.get('platform') or 'generic'
            if not url:
                notes.append(f'  {aid}: add_social empty url, skipped')
                counts['skipped'] += 1
                continue
            seen = {norm_url(s.get('url', '')) for s in (a.get('socials') or [])}
            if norm_url(url) in seen:
                continue  # already present, idempotent
            socials = list(a.get('socials') or [])
            entry = {'platform': plat, 'url': url}
            # Don't store stored-handle — URL is single source of truth per
            # platform-icons.js / profile-patterns.js convention.
            socials.append(entry)
            a['socials'] = socials
            counts['add_social'] += 1

        elif kind == 'skip':
            # Author still unknown — just clear the audit-flag (keep
            # name_source as whatever it was) without setting a name.
            for k in ('name_audit_reason', 'name_audit_suggestion'):
                if k in a: del a[k]
            if a.get('name_source') == 'audit_flagged' and a.get('name_source_prev'):
                a['name_source'] = a['name_source_prev']
                del a['name_source_prev']
            counts['skip'] += 1

        else:
            notes.append(f'  {aid}: unknown decision kind {kind!r}, skipped')
            counts['skipped'] += 1

    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'applied:')
    for k, n in counts.items():
        print(f'  {k:10s} {n}')
    if notes:
        print('notes:')
        for n in notes: print(n)


if __name__ == '__main__':
    main()
