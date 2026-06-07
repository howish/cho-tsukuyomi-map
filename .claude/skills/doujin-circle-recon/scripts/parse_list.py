#!/usr/bin/env python3
"""Parse an official doujin circle list and emit booth scaffold JSON.

Supported organizers:
- ketcom: Shift-JIS CGI list (e.g. https://ketto.xsrv.jp/html/mimiken/clist.cgi?pr2,...)
- glfes: GirlsLoveFestival lovefes.info Excel-export HTML
  (e.g. https://www.lovefes.info/260621list.html) — filters to a
  specified genre (default 超かぐや姫！) so the same multi-genre list
  can scaffold the 集中配置企画 booth subset.

Output: JSON array of {booth_id, circle_name, author, x_handle, x_url, pixiv_url}.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request


USER_AGENT = (
    "Mozilla/5.0 (Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def parse_ketcom(url: str) -> list[dict]:
    """Parse ketcom mimiken Shift-JIS circle list.

    Layout: a <TABLE> with rows of <TR>...<TD>...</TR>, each having
    columns [updated, kanji-prefix, circle_name, author + socials, position].
    Circle name + author cells may contain <a> tags with href to homepage,
    x.com/USERNAME, pixiv.net/member.php?id=N. Position is in
    <INPUT NAME=cl VALUE="ヤオ05"> form.
    """
    raw = fetch(url)
    try:
        html = raw.decode("shift_jis", errors="replace")
    except Exception:
        html = raw.decode("cp932", errors="replace")

    # Pull each <TR>...</TR> row that has a position INPUT.
    rows = re.findall(
        r"<TR[^>]*>\s*(?:<TH[^>]*>.*?</TH>)*?(.*?)</TR>",
        html,
        re.S | re.I,
    )

    booths: list[dict] = []
    for row in rows:
        pos_m = re.search(r'NAME=cl VALUE=([^>\s]+)', row)
        if not pos_m:
            continue
        position = pos_m.group(1).strip('"\'')

        # Extract cells in order
        cells = re.findall(r"<TD[^>]*>(.*?)</TD>", row, re.S | re.I)
        if len(cells) < 4:
            continue

        # Cell layout (typical ketcom):
        #   [0] update flag (e.g. "27日更新!")
        #   [1] kana index (e.g. "<A>ヤオ</A>")
        #   [2] circle name + optional <a href=homepage>
        #   [3] author + optional social icons (x.com / pixiv)
        #   [4] position with <INPUT NAME=cl VALUE=ヤオ05>

        circle_cell = cells[2]
        author_cell = cells[3] if len(cells) >= 5 else cells[3]

        circle_name = strip_tags(circle_cell).strip()
        author_html = author_cell

        # x handle (case-insensitive — ketcom uses HREF uppercase)
        x_handle = None
        x_url = None
        m = re.search(r'href="?(https?://(?:www\.)?x\.com/([A-Za-z0-9_]+))"?',
                       author_html, re.I)
        if m:
            x_url = m.group(1)
            x_handle = m.group(2)

        # pixiv
        pixiv_url = None
        m = re.search(r'href="?(https?://(?:www\.)?pixiv\.net/member\.php\?id=\d+)"?',
                       author_html, re.I)
        if m:
            pixiv_url = m.group(1)

        # Bluesky / etc — leave for future expansion

        author = strip_tags(author_html).strip()
        # Clean trailing image alt text remnants if any
        author = re.sub(r"^\s*", "", author)

        booths.append({
            "booth_id": position,
            "circle_name": circle_name,
            "author": author,
            "x_handle": x_handle or "",
            "x_url": x_url or "",
            "pixiv_url": pixiv_url or "",
        })

    return booths


def parse_glfes(url: str, genre: str = "超かぐや姫！") -> list[dict]:
    """Parse a GirlsLoveFestival lovefes.info circle list (Excel-exported HTML).

    Row layout (when populated):
      [0] サークル名 (circle name)
      [1] booth_id (e.g. A01, B36)
      [2] 作家 (author / penname)
      [3] Webページ (optional homepage / aggregator URL)
      [4] Twitter URL
      [5] Pixiv URL
      [6] ジャンル (genre — filter target)
      [7-11] padding cells

    Twitter cell sometimes has colspan=2 absorbing the Web cell — the
    parser handles both layouts. Returns only rows whose ジャンル exactly
    matches `genre`.
    """
    raw = fetch(url)
    try:
        html = raw.decode("utf-8")
    except UnicodeDecodeError:
        html = raw.decode("utf-8", errors="replace")

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S | re.I)
    booths: list[dict] = []

    for row in rows:
        # Skip header rows or empty padding rows quickly.
        if genre not in row:
            continue

        # Expand colspan=2 by duplicating the cell into the absorbed slot
        # so positional indexing stays consistent.
        cells = re.findall(
            r"<td(?P<attrs>[^>]*)>(?P<inner>.*?)</td>", row, re.S | re.I
        )
        expanded: list[str] = []
        for attrs, inner in cells:
            colspan_m = re.search(r"colspan=(?:'|\")?(\d+)", attrs)
            span = int(colspan_m.group(1)) if colspan_m else 1
            for _ in range(span):
                expanded.append(inner)

        if len(expanded) < 7:
            continue
        circle_name = strip_tags(expanded[0]).strip()
        booth_id_raw = strip_tags(expanded[1]).strip()
        author = strip_tags(expanded[2]).strip()

        # Normalize booth_id to the project's `<letter>-<n>[/<n2>]` form
        # (matches if7-2026-05 / cho-tsukuyomi-2026-05). GLFes Excel
        # writes A01 / A0304 / B36 without hyphens or slashes.
        m = re.match(r"^([A-Z])(\d{2})(\d{2})$", booth_id_raw)
        if m:
            booth_id = f"{m.group(1)}-{m.group(2)}/{m.group(3)}"
        else:
            m = re.match(r"^([A-Z])(\d{2})$", booth_id_raw)
            booth_id = (
                f"{m.group(1)}-{m.group(2)}" if m else booth_id_raw
            )
        web_cell = expanded[3]
        x_cell = expanded[4]
        pixiv_cell = expanded[5]
        row_genre = strip_tags(expanded[6]).strip()

        if not booth_id or row_genre != genre:
            continue

        x_handle = ""
        x_url = ""
        m = re.search(
            r'href="(https?://(?:www\.)?(?:twitter|x)\.com/([A-Za-z0-9_]+))"',
            x_cell, re.I,
        )
        if m:
            x_url = m.group(1)
            x_handle = m.group(2)

        pixiv_url = ""
        m = re.search(
            r'href="(https?://(?:www\.)?pixiv\.net/(?:users|member\.php\?id=)[^"]+)"',
            pixiv_cell, re.I,
        )
        if m:
            pixiv_url = m.group(1)

        web_url = ""
        m = re.search(r'href="(https?://[^"]+)"', web_cell, re.I)
        if m:
            web_url = m.group(1)

        booths.append({
            "booth_id": booth_id,
            "circle_name": circle_name,
            "author": author,
            "x_handle": x_handle,
            "x_url": x_url,
            "pixiv_url": pixiv_url,
            "web_url": web_url,
        })
    return booths


_TAG_RE = re.compile(r"<[^>]+>")


def strip_tags(s: str) -> str:
    s = _TAG_RE.sub("", s)
    # Decode HTML entities (limited set we actually encounter)
    s = (s.replace("&amp;", "&")
           .replace("&lt;", "<")
           .replace("&gt;", ">")
           .replace("&quot;", '"')
           .replace("&nbsp;", " "))
    return s


def main():
    p = argparse.ArgumentParser(description="Parse doujin event circle list")
    p.add_argument("organizer", choices=["ketcom", "glfes"],
                   help="organizer format")
    p.add_argument("url", help="circle list URL")
    p.add_argument("--genre", default="超かぐや姫！",
                   help="(glfes only) genre filter — only rows whose ジャンル "
                        "exactly matches this are emitted")
    args = p.parse_args()

    if args.organizer == "ketcom":
        booths = parse_ketcom(args.url)
    elif args.organizer == "glfes":
        booths = parse_glfes(args.url, genre=args.genre)
    else:
        print(f"unsupported organizer: {args.organizer}", file=sys.stderr)
        sys.exit(2)

    json.dump(booths, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
