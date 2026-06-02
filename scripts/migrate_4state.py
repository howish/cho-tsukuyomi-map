#!/usr/bin/env python3
"""One-shot: re-derive name_inferred + name_source for all authors.

State logic:
  - name != ''                         → source='user'         , inferred=''
  - name == '' and circle exists       → source='circle_name'  , inferred=circle.circle_name
  - name == '' and only x_handle       → source='x_handle'     , inferred=x_handle
  - name == '' and nothing             → source=''             , inferred=''  (orphan, leave blank)
"""
import json
from pathlib import Path

p = Path(__file__).parent.parent / 'circles.json'
d = json.loads(p.read_text(encoding='utf-8'))

# author_id → first circle that lists them as primary member
primary_circle: dict[str, dict] = {}
for c in d['circles']:
    members = c.get('members') or []
    if members and members[0] not in primary_circle:
        primary_circle[members[0]] = c

stats = {'user': 0, 'circle_name': 0, 'x_handle': 0, 'orphan': 0}
for a in d['authors']:
    name = a.get('name') or ''
    if name:
        a['name_inferred'] = ''
        a['name_source'] = 'user'
        stats['user'] += 1
        continue
    c = primary_circle.get(a['id'])
    if c and c.get('circle_name'):
        a['name'] = ''
        a['name_inferred'] = c['circle_name']
        a['name_source'] = 'circle_name'
        stats['circle_name'] += 1
    elif a.get('x_handle'):
        a['name'] = ''
        a['name_inferred'] = a['x_handle']
        a['name_source'] = 'x_handle'
        stats['x_handle'] += 1
    else:
        a['name'] = ''
        a['name_inferred'] = ''
        a['name_source'] = ''
        stats['orphan'] += 1

p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'migrated {len(d["authors"])} authors:', stats)
