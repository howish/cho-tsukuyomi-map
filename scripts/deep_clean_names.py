#!/usr/bin/env python3
"""Deep author-name cleanup pass.

Walks every author's `name` field (and `name_inferred` when `name` empty)
and uses a curated rule chain to identify:
  1. Event-marker noise (`創集繪S31` / `IF7` / `GJ J13` / dates / booth codes
     appended to the real name)
  2. Unclosed-paren artifacts (`SZKOBO袖子（此新帳為主` — paren cut at char
     limit, paren content is bio/alias)
  3. Bio tagline appended (`Socotaku 現代御宅的基礎知識`)
  4. Punctuation-separated alias (`PEI-SHIN,WU` / `杏。Xing` / `花開。花烙`)

For each match, emit a decision to `.name-cleanup-decisions.json` with:
  - `author_id`, `field` (name | inferred), `before`, `after_name`,
    `after_aliases`, `rule`, `reasoning`, `confidence` (high | medium | low)

Read-only — does NOT mutate circles.json. Run apply_name_cleanup_v2.py
after reviewing the decisions file.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


# Event-marker hits — strong signal that everything from match start is noise.
# Note: include `集創繪` as the common typo spelling of `創集繪` so we catch
# entries like `詠真🧡集創繪 L14`.
EVENT_MARKER = re.compile(
    r'\s*['
    r' 　_\-\.／|｜｜【\[（(:：、]?\s*'  # optional leading separator (incl colon)
    r'(?:'
    r'創集繪|集創繪|超ツクヨミ祭|ツクスク|布榖町|赤ブー|夏コミ|来場感謝|來場感謝'
    r'|GJ|IF\d?|百合フェス|GLFes|ぷにケット|感謝大家|此新帳|現代御宅'
    r'|新刊|既刊|お品書き|5/\d{1,2}|6/\d{1,2}|7/\d{1,2}|8/\d{1,2}'
    r'|＠[\d春夏秋冬]|@\d/\d|パンケーキ食べたい|為主|場內串聯'
    r'|[12]?\d月場次?|五月場次|六月場次|七月場次|八月場次'
    r'|推廣委員會|歡迎約稿|可詳談|徵稿|by\s+[A-Za-z]'
    r')'
    r'.*$'
)

# Reverse event-prefix: event-marker leading the name. Match it + any
# bracket/booth/junk right after, then the real name is what's left.
EVENT_PREFIX = re.compile(
    r'^\s*(?:創集繪|集創繪|GJ|IF\d?|超ツクヨミ祭|布榖町|赤ブー)'
    r'[^\s一-鿿぀-ヿ]{0,12}\s*'  # absorb booth code / emoji
)

# Bracket / square-bracket bio (trailing) — `name[歡迎約稿]` style.
BRACKET_BIO = re.compile(r'\s*[\[［【]\s*[^\]］】]{2,}\s*[\]］】]\s*$')

# Names that LOOK like trailing booth code but are intentional cultural
# references — preserve as-is.
PROTECTED_TRAILING = re.compile(r'\bB-612\b', re.I)  # Little Prince planet

# Trailing booth-code only (no event prefix word) — `name VW-V03` style.
# Match against alphanumeric chunks at end-of-string that look like row+col.
TRAILING_BOOTH = re.compile(
    r'(?:\s|【|\[|｜|\|)\s*'  # required preceding separator (so we don't eat a
                              # legitimate name like "BOOTH" or "A4")
    r'[A-Z]{1,3}-?\d{1,3}(?:-[A-Z]?\d{1,3})?\s*$'
)

# Unclosed left paren (full-width or half-width) — content after paren is
# usually an alias or a bio fragment cut mid-sentence.
UNCLOSED_PAREN = re.compile(r'^([^（(]+?)\s*[（(]\s*([^）)]+)$')

# "name 中文中文" style bio tagline (heuristic — base name followed by space
# then a Chinese/JP phrase ≥4 chars that smells like a self-description).
BIO_TAGLINE_KEYS = ['的基礎知識', '工作室', '推廣委員會', '出版', '同人誌', '商業誌']

# Punctuation-separated alias pair — "PEI-SHIN,WU", "杏。Xing", "花開。花烙"
PUNCT_ALIAS = re.compile(r'^([^,，。、]+?)\s*[,，。、]\s*([^,，。、]+?)$')


def _trim_trail(s: str) -> str:
    """Strip trailing separators/punctuation left over from event-marker cut."""
    return s.rstrip(' 　_-/／|｜【［〔[（(.,:：、　')


def classify(name: str) -> dict | None:
    """Return a decision dict or None if name is clean."""
    if not name: return None
    original = name

    # Rule 1a: event-marker as PREFIX (real name at end)
    m = EVENT_PREFIX.match(name)
    if m:
        tail = name[m.end():].strip(' 　_-/／|｜【[（(.,:：、x×　')
        if tail and len(tail) >= 1:
            return {
                'rule': 'event_prefix',
                'before': original,
                'after_name': tail,
                'after_aliases': [],
                'reasoning': f'event marker "{m.group(0).strip()}" leading the name — kept tail "{tail}"',
                'confidence': 'medium',  # tail might still have junk; demote
            }

    # Rule 1b: event-marker as SUFFIX (real name at start)
    m = EVENT_MARKER.search(name)
    if m:
        clean = _trim_trail(name[:m.start()])
        if clean and clean != name:
            return {
                'rule': 'event_marker',
                'before': original,
                'after_name': clean,
                'after_aliases': [],
                'reasoning': f'matched event marker "{m.group(0).strip()[:30]}" — name is everything before',
                'confidence': 'high',
            }

    # Rule 1c: bracket-suffix bio (e.g. `猫又［歡迎約稿～～可詳談👌］`)
    m = BRACKET_BIO.search(name)
    if m:
        clean = _trim_trail(name[:m.start()])
        if clean and len(clean) >= 2:
            return {
                'rule': 'bracket_bio',
                'before': original,
                'after_name': clean,
                'after_aliases': [],
                'reasoning': f'trailing bracket bio "{m.group(0).strip()[:30]}" stripped',
                'confidence': 'high',
            }

    # Rule 2: trailing booth code (no event prefix word, just A4 / VW-V03 etc)
    # Skip when the trailing chunk matches a known cultural reference.
    if not PROTECTED_TRAILING.search(name):
        m = TRAILING_BOOTH.search(name)
        if m:
            clean = _trim_trail(name[:m.start()])
            if clean and clean != name and len(clean) >= 2:
                return {
                    'rule': 'trailing_booth',
                    'before': original,
                    'after_name': clean,
                    'after_aliases': [],
                    'reasoning': f'trailing booth code "{m.group(0).strip()}" stripped',
                    'confidence': 'medium',  # demote — false-positive risk (e.g. "B-612")
                }

    # Rule 3: unclosed paren — content after paren is alias if short, else
    # bio fragment (discard).
    m = UNCLOSED_PAREN.match(name)
    if m:
        base, inside = m.group(1).strip(), m.group(2).strip()
        # If inside has bio keywords or is long → it's a cut bio fragment,
        # discard. Otherwise treat as alias.
        is_bio = any(k in inside for k in BIO_TAGLINE_KEYS) or len(inside) > 10
        if is_bio:
            return {
                'rule': 'unclosed_paren_bio',
                'before': original,
                'after_name': base,
                'after_aliases': [],
                'reasoning': f'unclosed paren, contents "{inside}" appears to be bio fragment (cut by char-limit) — discard',
                'confidence': 'high' if any(k in inside for k in BIO_TAGLINE_KEYS) else 'medium',
            }
        return {
            'rule': 'unclosed_paren_alias',
            'before': original,
            'after_name': base,
            'after_aliases': [inside],
            'reasoning': f'unclosed paren, "{inside}" treated as alias',
            'confidence': 'medium',
        }

    # Rule 4: bio tagline (trailing Chinese/JP phrase with known keyword)
    for kw in BIO_TAGLINE_KEYS:
        # Match `<base> <stuff containing kw>` where the stuff includes the kw
        # and base is at least 2 chars.
        if kw in name:
            # Split on whitespace; if the kw is in the last token, strip it
            parts = name.split()
            if len(parts) >= 2 and kw in ' '.join(parts[1:]):
                clean = parts[0].strip()
                if clean and len(clean) >= 2:
                    return {
                        'rule': 'bio_tagline',
                        'before': original,
                        'after_name': clean,
                        'after_aliases': [],
                        'reasoning': f'bio tagline "{" ".join(parts[1:])}" stripped (kw: "{kw}")',
                        'confidence': 'medium',
                    }

    # Rule 5: comma / period / 、 separator alias (e.g. "PEI-SHIN,WU")
    m = PUNCT_ALIAS.match(name)
    if m:
        left, right = m.group(1).strip(), m.group(2).strip()
        # Skip if either side has an event marker (already handled) or is too
        # short to be a name (≥2 chars).
        if len(left) >= 2 and len(right) >= 2 and not EVENT_MARKER.search(left) and not EVENT_MARKER.search(right):
            return {
                'rule': 'punct_separated_alias',
                'before': original,
                'after_name': left,
                'after_aliases': [right],
                'reasoning': f'punctuation-separated pair — left is primary name, right is alias',
                'confidence': 'low',
            }

    return None


def main():
    p = Path(__file__).parent.parent / 'circles.json'
    d = json.loads(p.read_text(encoding='utf-8'))
    decisions = []
    skipped_clean = 0
    for a in d['authors']:
        # Examine name first; if empty examine name_inferred.
        for field in ('name', 'name_inferred'):
            val = (a.get(field) or '').strip()
            if not val: continue
            decision = classify(val)
            if decision:
                decision['author_id'] = a['id']
                decision['field'] = field
                # Carry forward existing aliases so we don't lose them
                decision['existing_aliases'] = list(a.get('aliases') or [])
                decisions.append(decision)
                break  # only look at one field per author
            else:
                skipped_clean += 1
                break

    out = Path(__file__).parent.parent / '.name-cleanup-decisions.json'
    out.write_text(json.dumps(decisions, ensure_ascii=False, indent=2),
                   encoding='utf-8')

    # Summary by confidence + rule
    print(f'=== deep clean decisions ===')
    print(f'total authors examined: {len(d["authors"])}')
    print(f'clean (no decision):    {skipped_clean}')
    print(f'decisions emitted:      {len(decisions)}')
    print()
    by_rule = {}
    by_conf = {}
    for dx in decisions:
        by_rule[dx['rule']] = by_rule.get(dx['rule'], 0) + 1
        by_conf[dx['confidence']] = by_conf.get(dx['confidence'], 0) + 1
    print('by rule:')
    for r, n in sorted(by_rule.items(), key=lambda x: -x[1]):
        print(f'  {r:30s} {n:4d}')
    print()
    print('by confidence:')
    for c, n in sorted(by_conf.items(), key=lambda x: -x[1]):
        print(f'  {c:8s} {n:4d}')
    print()
    print(f'full decisions → {out}')


if __name__ == '__main__':
    main()
