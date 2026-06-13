#!/usr/bin/env python3
"""Generate the C108 venue schematic (map.svg) from c108-2026-08/data.js.

Comiket publishes no reusable block-level map (booklet + login-walled
Webcatalog only, both 準備会 copyright). So we draw our own: a two-day
schematic that shows ONLY our 超かぐや姫 circles, positioned by their
reported hall / block / space. Copyright-clean, more useful than the
official map for this site's purpose, and regenerated from data.js so
it self-updates when a tbd-NN placement resolves.

Outputs (in c108-2026-08/):
  - map.svg   source of truth, crisp, version-controlled (the display map)
  - map.jpg   raster fallback (SW precache target + legacy <img> src)
  - og.png    1200x630 social card

Render step uses the shared playwright-runtime (no system rsvg/cairo).
Run:  python3 scripts/ops/build_c108_map.py [--no-raster]
"""
from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
EVENT = "c108-2026-08"

# Palette — mirrors event-shell.css vars for visual consistency.
BG = "#faf8f4"
CARD = "#ffffff"
INK = "#222222"
MUTED = "#6b6b6b"
BORDER = "#e2ded7"
ACCENT = "#6a4c93"          # かぐや purple (theme_color)
SAT = "#c8821f"            # day-1 warm gold (夏 / 月)
SUN = "#3f72a4"            # day-2 cool blue
ISLAND = "#6a4c93"
ISLAND_FILL = "#f1ecf6"

CP_LABEL = {
    "iroka": "いろかぐ", "iroyachi": "いろヤチ", "iroroka": "いろろか",
    "trio": "三人", "mikanoi": "みかのい",
}


def load_booths():
    raw = (ROOT / EVENT / "data.js").read_text(encoding="utf-8")
    booths = json.loads(raw[raw.find("=") + 1:].rstrip().rstrip(";"))
    circles = json.loads((ROOT / "circles.json").read_text(encoding="utf-8"))
    cname = {c["id"]: c["circle_name"] for c in circles["circles"]}
    authors = {a["id"]: a for a in circles["authors"]}
    cmembers = {c["id"]: c.get("members", []) for c in circles["circles"]}

    out = []
    for b in booths:
        bid = b["booth_id"]
        body = b.get("body", "")
        hall_m = re.search(r"(東\d|南\d|西\d)ホール", body)
        hall = hall_m.group(1) if hall_m else None
        day = bid.split("-")[0]
        rest = bid.split("-", 1)[1] if "-" in bid else ""
        block = space = side = None
        if day in ("土", "日"):
            m = re.match(r"([^\d]+?)(\d+)([a-zあ-んア-ンA-Za-z]*)$", rest)
            if m:
                block, space, side = m.group(1), int(m.group(2)), m.group(3)
        # author display name (first member) for notable extra label
        members = cmembers.get(b["circle_id"], [])
        author = ""
        if members:
            a = authors.get(members[0]) or {}
            author = a.get("name") or a.get("name_inferred") or ""
        # Drop inference-artifact author strings (unresolved name_inferred
        # leaks the circle name / markdown, e.g. サークル名「**くろかり**」).
        if author and (any(t in author for t in ("「", "」", "**", "サークル名"))
                       or author == cname.get(b["circle_id"])):
            author = ""
        out.append({
            "id": bid, "day": day, "hall": hall, "block": block,
            "space": space, "side": side or "",
            "circle": cname.get(b["circle_id"], b["circle_id"]),
            "author": author,
            "cps": b.get("cps", []),
        })
    return out


def esc(s):
    return html.escape(str(s), quote=True)


def text(x, y, s, size=16, fill=INK, weight="400", anchor="start",
         family="'Noto Sans CJK JP','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
         spacing=None):
    sp = f' letter-spacing="{spacing}"' if spacing else ""
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" '
            f'font-weight="{weight}" text-anchor="{anchor}" '
            f'font-family="{family}"{sp}>{esc(s)}</text>')


def rrect(x, y, w, h, r, fill, stroke="none", sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')


def cp_str(cps):
    return " · ".join(CP_LABEL.get(c, c) for c in cps)


def island_tile(x, y, w, b):
    """A circle table-tile in the island detail."""
    h = 46
    parts = [rrect(x, y, w, h, 8, CARD, BORDER, 1.2)]
    # space-number chip
    parts.append(rrect(x + 8, y + 9, 56, 28, 6, ISLAND_FILL))
    parts.append(text(x + 36, y + 28, f"{b['block']}{b['space']}",
                      size=15, fill=ISLAND, weight="700", anchor="middle"))
    parts.append(text(x + 76, y + 21, b["circle"], size=15, weight="600"))
    sub = b["author"] or ""
    cp = cp_str(b["cps"])
    line2 = "  ".join(s for s in (("◇ " + cp) if cp else "", sub) if s)
    if line2:
        parts.append(text(x + 76, y + 38, line2, size=11, fill=MUTED))
    return "".join(parts), h


def hall_card(x, y, w, title, accent, rows):
    """A small hall card: title bar + one or more circle rows."""
    rh = 40
    h = 38 + rh * len(rows) + 10
    p = [rrect(x, y, w, h, 12, CARD, BORDER, 1.2)]
    p.append(rrect(x, y, w, 30, 12, accent))
    p.append(rrect(x, y + 14, w, 16, 0, accent))  # square off bottom of bar
    p.append(text(x + 14, y + 21, title, size=15, fill="#fff", weight="700"))
    cy = y + 30 + 8
    for r in rows:
        p.append(rrect(x + 10, cy, 62, 26, 6, BG))
        p.append(text(x + 41, cy + 18, r["sp"], size=13, fill=accent,
                      weight="700", anchor="middle"))
        p.append(text(x + 82, cy + 13, r["circle"], size=14, weight="600"))
        meta = "  ".join(s for s in (cp_str(r["cps"]), r.get("author", ""))
                         if s)
        if meta:
            p.append(text(x + 82, cy + 30, meta, size=10.5, fill=MUTED))
        cy += rh
    return "".join(p), h


def legend_chip(x, y, color, label, shape="dot"):
    if shape == "island":
        mark = rrect(x, y - 11, 16, 16, 4, ISLAND_FILL, ISLAND, 1.5)
    else:
        mark = f'<circle cx="{x+8}" cy="{y-3}" r="7" fill="{color}"/>'
    return mark + text(x + 24, y + 2, label, size=14, fill=MUTED)


def build_svg(booths):
    W, H = 1600, 1040
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
         f'viewBox="0 0 {W} {H}" font-family="sans-serif">']
    s.append(rrect(0, 0, W, H, 0, BG))

    # ---- header ----
    s.append(text(56, 64, "C108", size=46, fill=ACCENT, weight="800",
                  spacing="1"))
    s.append(text(186, 64, "超かぐや姫サークル MAP", size=30, weight="700"))
    s.append(text(58, 98,
                  "2026.08.15 SAT – 08.16 SUN   ·   東京ビッグサイト  南・東・西展示棟",
                  size=17, fill=MUTED))
    # legend (top-right)
    lx = 980
    s.append(legend_chip(lx, 50, ISLAND, "超かぐや姫島 (南2)", "island"))
    s.append(legend_chip(lx + 210, 50, SAT, "土曜 単独配置"))
    s.append(legend_chip(lx + 390, 50, SUN, "日曜配置"))
    s.append(f'<line x1="56" y1="120" x2="{W-56}" y2="120" '
             f'stroke="{BORDER}" stroke-width="1.5"/>')

    # =====================================================================
    # LEFT — Saturday
    # =====================================================================
    LX = 56
    s.append(rrect(LX, 150, 70, 30, 8, SAT))
    s.append(text(LX + 35, 171, "DAY 1", size=15, fill="#fff",
                  weight="800", anchor="middle"))
    s.append(text(LX + 84, 171, "8/15 SAT", size=17, weight="700"))

    # island panel
    iy = 198
    s.append(rrect(LX, iy, 884, 58, 12, ISLAND_FILL, ISLAND, 1.5))
    s.append(text(LX + 22, iy + 26, "南2ホール ― 超かぐや姫島", size=20,
                  fill=ISLAND, weight="800"))
    isl = [b for b in booths if b["hall"] == "南2"]
    s.append(text(LX + 22, iy + 47,
                  f"{len(isl)} サークルが a・b ブロックに集結", size=13,
                  fill=MUTED))

    block_a = sorted([b for b in isl if b["block"] == "a"],
                     key=lambda b: b["space"])
    block_b = sorted([b for b in isl if b["block"] == "b"],
                     key=lambda b: b["space"])
    col_w = 420
    ay = iy + 76
    for col_x, blk, rows in ((LX, "a", block_a), (LX + 444, "b", block_b)):
        s.append(text(col_x + 4, ay, f"{blk} ブロック", size=14,
                      fill=ISLAND, weight="700"))
        ty = ay + 14
        for b in rows:
            tile, th = island_tile(col_x, ty, col_w, b)
            s.append(tile)
            ty += th + 8

    # Saturday non-island halls (南1 / 東2 / 東3)
    sat_other = [b for b in booths
                 if b["day"] == "土" and b["hall"] != "南2"]
    by_hall = {}
    for b in sat_other:
        by_hall.setdefault(b["hall"], []).append(b)
    oy = ay + 14 + len(block_a) * 54 + 24
    s.append(text(LX, oy, "南1 ／ 東2 ／ 東3 ホール (単独配置)", size=15,
                  fill=SAT, weight="700"))
    oy += 16
    ox = LX
    for hall in ("南1", "東2", "東3"):
        rows = [{"sp": f"{b['block']}{b['space']}{b['side']}",
                 "circle": b["circle"], "cps": b["cps"],
                 "author": b["author"]} for b in by_hall.get(hall, [])]
        if not rows:
            continue
        card, ch = hall_card(ox, oy, 288, hall, SAT, rows)
        s.append(card)
        ox += 298

    # =====================================================================
    # RIGHT — Sunday
    # =====================================================================
    RX = 980
    s.append(f'<line x1="{RX-20}" y1="150" x2="{RX-20}" y2="{H-90}" '
             f'stroke="{BORDER}" stroke-width="1.5"/>')
    s.append(rrect(RX, 150, 70, 30, 8, SUN))
    s.append(text(RX + 35, 171, "DAY 2", size=15, fill="#fff",
                  weight="800", anchor="middle"))
    s.append(text(RX + 84, 171, "8/16 SUN", size=17, weight="700"))

    sun = [b for b in booths if b["day"] == "日"]
    order = {"東1": 0, "西1": 1, "東3": 2, "東7": 3}
    sun.sort(key=lambda b: order.get(b["hall"], 9))
    cy = 198
    for b in sun:
        rows = [{"sp": f"{b['block']}{b['space']}{b['side']}",
                 "circle": b["circle"], "cps": b["cps"],
                 "author": b["author"]}]
        card, ch = hall_card(RX, cy, 560, b["hall"], SUN, rows)
        s.append(card)
        cy += ch + 14

    # tbd note inside Sunday column
    tbd = [b for b in booths if b["day"] == "tbd"]
    if tbd:
        cy += 6
        s.append(rrect(RX, cy, 560, 70, 12, "#fff", BORDER, 1.2, dash="5 4"))
        s.append(text(RX + 16, cy + 26, "配置スペース未確認", size=14,
                      fill=MUTED, weight="700"))
        names = " ／ ".join(b["circle"] for b in tbd)
        s.append(text(RX + 16, cy + 50,
                      f"{names}（当選済・判明次第追記）", size=13, fill=MUTED))

    # ---- footer ----
    s.append(f'<line x1="56" y1="{H-70}" x2="{W-56}" y2="{H-70}" '
             f'stroke="{BORDER}" stroke-width="1.5"/>')
    s.append(text(56, H - 42,
                  "schematic by 月見ヤチヨ ／ 配置は各サークルの当落報告より作図 ／ "
                  "非公式ファンガイド",
                  size=13, fill=MUTED))
    s.append(text(56, H - 22,
                  "コミケット会場マップは準備会の著作物のため非掲載。本図は当サイト収録 "
                  "23 サークルの位置のみを示す簡略図です。",
                  size=12, fill="#9a948c"))
    s.append(text(W - 56, H - 30, "yachi8000.app", size=15, fill=ACCENT,
                  weight="700", anchor="end"))
    s.append("</svg>")
    return "\n".join(s)


def _have_cjk_font():
    try:
        out = subprocess.run(["fc-list"], capture_output=True, text=True).stdout
        return "CJK JP" in out or "Noto Sans JP" in out or "Hiragino" in out
    except FileNotFoundError:
        return True  # no fontconfig → assume the renderer has its own fonts


def raster(svg_path, out_path, w, h, scale=2, crop=None):
    """Render SVG → PNG/JPEG via the shared playwright-runtime."""
    runtime = Path.home() / ".claude" / "skills" / "playwright-runtime" / "bin" / "python"
    if not runtime.exists():
        print(f"  (skip raster {out_path.name}: playwright-runtime missing)",
              file=sys.stderr)
        return
    if not _have_cjk_font():
        print(f"  (skip raster {out_path.name}: no CJK font — JP would be tofu. "
              "Install: apt-get download fonts-noto-cjk && dpkg-deb -x *.deb /tmp/n "
              "&& cp /tmp/n/usr/share/fonts/opentype/noto/NotoSansCJK-*.ttc ~/.fonts/ "
              "&& fc-cache -f)", file=sys.stderr)
        return
    crop_py = repr(crop) if crop else "None"
    script = f'''
import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True)
    pg = b.new_page(viewport={{"width":{w},"height":{h}}}, device_scale_factor={scale})
    pg.goto("file://{svg_path}")
    pg.wait_for_timeout(400)
    typ = "jpeg" if "{out_path}".endswith((".jpg",".jpeg")) else "png"
    kw = {{"path":"{out_path}","type":typ}}
    if typ=="jpeg": kw["quality"]=90
    crop = {crop_py}
    if crop: kw["clip"]=crop
    pg.screenshot(**kw)
    b.close()
'''
    sp = Path("/tmp/_c108_raster.py")
    sp.write_text(script)
    r = subprocess.run([str(runtime), str(sp)], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  raster {out_path.name} failed: {r.stderr[:200]}",
              file=sys.stderr)
    else:
        print(f"  rendered {out_path.name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-raster", action="store_true")
    args = ap.parse_args()

    booths = load_booths()
    svg = build_svg(booths)
    svg_path = ROOT / EVENT / "map.svg"
    svg_path.write_text(svg, encoding="utf-8")
    print(f"wrote {svg_path.relative_to(ROOT)} ({len(booths)} circles)")

    if not args.no_raster:
        # map.svg is the crisp display image (event.js map_image). map.jpg
        # is only the SW-precache / legacy-<img> fallback → modest raster.
        raster(svg_path, ROOT / EVENT / "map.jpg", 1600, 1040, scale=1)
        # OG: top band of the schematic (header + island) fits ~1.9:1
        raster(svg_path, ROOT / EVENT / "og.png", 1600, 1040, scale=1,
               crop={"x": 0, "y": 0, "width": 1600, "height": 840})


if __name__ == "__main__":
    main()
