#!/usr/bin/env python3
"""Apply a decisions-NNNitems-*.json batch from the review queue to
circles.json. Each decision is one of:

  - rename:     {author_id, decision: "rename", name, source}
  - add_alias:  {author_id, decision: "add_alias", alias}
  - add_social: {author_id, decision: "add_social", platform, url, handle?}
  - add_member: {circle_id, decision: "add_member", name, source,
                 socials: [{platform, url}], aliases?: [...]}
  - add_circle_social: {circle_id, decision: "add_circle_social",
                        platform, url}   (合同 SNS — appends to circle.socials[])
  - skip:       {author_id, decision: "skip"}  (no-op, just clears flag)

On rename: also clears audit_flagged metadata (name_audit_reason,
name_audit_suggestion, name_source_prev) since the author is now resolved.

On add_member: creates a new author record (id derived from X handle if
present, else hash of name+circle_id), appends to circle.members[], and
sets the new author's name/source/socials.

Idempotent: re-running with the same decisions has no further effect.

Usage:
  scripts/apply_review_decisions.py <decisions.json>
"""
from __future__ import annotations

import hashlib
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

    counts = {'rename': 0, 'add_alias': 0, 'add_social': 0, 'add_member': 0, 'add_circle_social': 0, 'skip': 0, 'skipped': 0}
    notes = []
    circles_by_id = {c['id']: c for c in d['circles']}

    def gen_author_id(name: str, x_handle: str, circle_id: str) -> str:
        h = (x_handle or '').strip().lower()
        if h: return h
        key = f'{name}|{circle_id}'.encode('utf-8')
        return 'a_' + hashlib.sha1(key).hexdigest()[:12]

    for dec in decisions:
        kind = dec.get('decision')

        # add_member is the only decision type keyed by circle_id, not author_id
        if kind == 'add_member':
            cid = dec.get('circle_id')
            c = circles_by_id.get(cid)
            if not c:
                notes.append(f'  add_member: circle {cid} not found, skipped')
                counts['skipped'] += 1
                continue
            name = (dec.get('name') or '').strip()
            if not name:
                notes.append(f'  add_member to {cid}: empty name, skipped')
                counts['skipped'] += 1
                continue
            # Derive ID: prefer X handle if a socials[] entry is X
            socials_in = list(dec.get('socials') or [])
            x_handle = ''
            for s in socials_in:
                if s.get('platform') == 'x' and s.get('url'):
                    m = re.search(r'(?:x|twitter)\.com/@?([A-Za-z0-9_]{1,15})', s['url'])
                    if m: x_handle = m.group(1).lower(); break
            new_aid = gen_author_id(name, x_handle, cid)
            # Idempotency: if this id already a member, skip
            if new_aid in (c.get('members') or []):
                continue
            # Create author record
            if new_aid not in by_id:
                new_author = {
                    'id': new_aid,
                    'name': name,
                    'name_inferred': '',
                    'name_source': dec.get('source') or 'user',
                    'aliases': list(dec.get('aliases') or []),
                    'socials': [],
                }
                seen = set()
                for s in socials_in:
                    url = (s.get('url') or '').strip()
                    if not url or norm_url(url) in seen: continue
                    seen.add(norm_url(url))
                    new_author['socials'].append({
                        'platform': s.get('platform') or 'generic',
                        'url': url,
                    })
                d['authors'].append(new_author)
                by_id[new_aid] = new_author
            c.setdefault('members', []).append(new_aid)
            counts['add_member'] += 1
            continue

        if kind == 'add_circle_social':
            cid = dec.get('circle_id')
            c = circles_by_id.get(cid)
            if not c:
                notes.append(f'  add_circle_social: circle {cid} not found, skipped')
                counts['skipped'] += 1
                continue
            url = (dec.get('url') or '').strip()
            plat = dec.get('platform') or 'generic'
            if not url:
                notes.append(f'  add_circle_social to {cid}: empty url, skipped')
                counts['skipped'] += 1
                continue
            seen = {norm_url(s.get('url', '')) for s in (c.get('socials') or [])}
            if norm_url(url) in seen:
                continue  # already present
            c.setdefault('socials', []).append({'platform': plat, 'url': url})
            counts['add_circle_social'] += 1
            continue

        aid = dec.get('author_id')
        a = by_id.get(aid)
        if not a:
            notes.append(f'  {aid}: not found, skipped')
            counts['skipped'] += 1
            continue

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
