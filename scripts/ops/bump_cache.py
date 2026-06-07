#!/usr/bin/env python3
"""Bump the ?v=<epoch> cache-buster on every event index.html + hub + circles.

Run after editing any shared shell file (app.js / style.css / i18n.js /
circles.js / hub.css / circles/circles.js) so browsers and CDN re-fetch the
new version on next load.
"""
from __future__ import annotations
import re, sys, time
from pathlib import Path


def main():
    root = Path(__file__).parent.parent.parent
    ver = str(int(time.time()))
    patt = re.compile(r'v=\d{10}')
    targets = [root / 'index.html', root / 'circles' / 'index.html']
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from _events import discover_events
    for ev in discover_events(root):
        if (ev.dir / 'index.html').is_file():
            targets.append(ev.dir / 'index.html')

    for t in targets:
        if not t.is_file():
            print(f'skip {t.relative_to(root)} (missing)'); continue
        src = t.read_text(encoding='utf-8')
        new = patt.sub(f'v={ver}', src)
        if new != src:
            t.write_text(new, encoding='utf-8')
            print(f'bumped {t.relative_to(root)} → v={ver}')
        else:
            print(f'no-op {t.relative_to(root)} (no ?v= patterns found)')


if __name__ == '__main__':
    main()
