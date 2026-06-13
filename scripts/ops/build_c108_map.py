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


def day_color(b):
    return SUN if b["day"] == "日" else SAT


def pin(cx, cy, n, color, r=12):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}" '
            f'stroke="#fff" stroke-width="2"/>'
            + text(cx, cy + 5, str(n), size=13, fill="#fff", weight="800",
                   anchor="middle"))


def hall_box(x, y, w, h, label, state, sub="", pins=None):
    """A hall cell in the Big Sight overview.
    state: 'island' | 'sat' | 'sun' | 'used' | 'closed' | 'corp'."""
    fill, stroke, tcol = {
        "island": (ISLAND_FILL, ISLAND, ISLAND),
        "sat": ("#fbeed5", SAT, "#8a5a12"),
        "sun": ("#dfeaf4", SUN, "#28557d"),
        "used": ("#f1efe9", "#c9c2b6", MUTED),
        "closed": ("#eceae6", "#cfcabf", "#a8a299"),
        "corp": ("#eceae6", "#cfcabf", "#a8a299"),
    }.get(state, ("#f1efe9", "#c9c2b6", MUTED))
    sw = 2 if state in ("island", "sat", "sun") else 1.2
    p = [rrect(x, y, w, h, 8, fill, stroke, sw)]
    p.append(text(x + w / 2, y + h / 2 - (6 if sub else -5), label,
                  size=20 if state == "island" else 17, fill=tcol,
                  weight="800", anchor="middle"))
    if sub:
        p.append(text(x + w / 2, y + h / 2 + 16, sub, size=11.5, fill=tcol,
                      anchor="middle"))
    if pins:
        px = x + w - 8
        for n, col in reversed(pins):
            p.append(pin(px, y + 14, n, col, r=11))
            px -= 24
    return "".join(p)


def island_strip(x, y, block, lo, hi, ours, cell=30, h=42):
    """Draw one island as a numbered cell-strip; `ours` maps space->(pin,color).
    Returns (svg, width)."""
    n = hi - lo + 1
    width = n * cell
    p = []
    # block-letter tab
    p.append(rrect(x - 44, y, 38, h, 6, ISLAND_FILL, ISLAND, 1.4))
    p.append(text(x - 25, y + h / 2 + 7, block, size=19, fill=ISLAND,
                  weight="800", anchor="middle"))
    # island bar
    p.append(rrect(x, y, width, h, 6, "#ffffff", "#c4bdb1", 1.3))
    for i, sp in enumerate(range(lo, hi + 1)):
        cx = x + i * cell
        if i > 0:
            p.append(f'<line x1="{cx}" y1="{y+4}" x2="{cx}" y2="{y+h-4}" '
                     f'stroke="#e4ded3" stroke-width="1"/>')
        if sp in ours:
            n_, col = ours[sp]
            p.append(rrect(cx + 1.5, y + 1.5, cell - 3, h - 3, 4, ISLAND))
            p.append(text(cx + cell / 2, y + h - 7, str(sp), size=9.5,
                          fill="#fff", weight="700", anchor="middle"))
            p.append(pin(cx + cell / 2, y + 15, n_, col, r=10.5))
        else:
            p.append(text(cx + cell / 2, y + h / 2 + 4, str(sp), size=9,
                          fill="#c2bbb0", anchor="middle"))
    return "".join(p), width


def index_row(x, y, n, b, w=534):
    col = day_color(b)
    loc = (f"{b['hall']} {b['block']}{b['space']}{b['side']}"
           if b["block"] else (b["hall"] or "未確認"))
    p = [pin(x + 11, y, n, col, r=10)]
    p.append(text(x + 30, y + 5, b["circle"], size=14, weight="700"))
    p.append(text(x + w, y + 5, loc, size=12.5, fill=col, weight="700",
                  anchor="end"))
    return "".join(p)


def build_svg(booths):
    W, H = 1600, 1310
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
         f'viewBox="0 0 {W} {H}" font-family="sans-serif">']
    s.append(rrect(0, 0, W, H, 0, BG))

    # ----- assign a stable index number to every circle -----
    isl = sorted([b for b in booths if b["hall"] == "南2"],
                 key=lambda b: (b["block"], b["space"]))
    sat_other = sorted([b for b in booths
                        if b["day"] == "土" and b["hall"] != "南2"],
                       key=lambda b: (b["hall"], b["space"] or 0))
    sun = sorted([b for b in booths if b["day"] == "日"],
                 key=lambda b: ({"東1": 0, "西1": 1, "東3": 2, "東7": 3}
                                .get(b["hall"], 9), b["space"] or 0))
    tbd = [b for b in booths if b["day"] == "tbd"]
    ordered = isl + sat_other + sun + tbd
    for i, b in enumerate(ordered, 1):
        b["n"] = i

    # ---- header ----
    s.append(text(56, 62, "C108", size=44, fill=ACCENT, weight="800",
                  spacing="1"))
    s.append(text(182, 62, "超かぐや姫サークル 会場マップ", size=28,
                  weight="700"))
    s.append(text(58, 94,
                  "2026.08.15 SAT – 08.16 SUN   ·   東京ビッグサイト",
                  size=16, fill=MUTED))
    lx = 1010
    s.append(rrect(lx, 39, 15, 15, 3, ISLAND_FILL, ISLAND, 1.5)
             + text(lx + 22, 51, "超かぐや姫島", size=13.5, fill=MUTED))
    s.append(f'<circle cx="{lx+168}" cy="46" r="7" fill="{SAT}"/>'
             + text(lx + 182, 51, "土曜", size=13.5, fill=MUTED))
    s.append(f'<circle cx="{lx+258}" cy="46" r="7" fill="{SUN}"/>'
             + text(lx + 272, 51, "日曜", size=13.5, fill=MUTED))
    s.append(f'<line x1="56" y1="112" x2="{W-56}" y2="112" '
             f'stroke="{BORDER}" stroke-width="1.5"/>')

    # =====================================================================
    # SECTION A — Tokyo Big Sight overview (会場全体図)
    # =====================================================================
    s.append(text(56, 150, "会場全体図", size=20, weight="800"))
    s.append(text(176, 150, "― 当サークルがいるホール", size=14, fill=MUTED))

    def hall_pins(hall, day=None):
        out = []
        for b in ordered:
            if b["hall"] == hall and (day is None or b["day"] == day):
                out.append((b["n"], day_color(b)))
        return out

    oy = 172
    # South building (bottom-left) — 南1/南2 circles, 南3/4 corp
    s.append(text(96, oy + 4, "南展示棟", size=12.5, fill=MUTED, weight="700"))
    s.append(hall_box(96, oy + 14, 150, 92, "南2", "island",
                      "超かぐや姫島 13", hall_pins("南2")[:1]))
    s.append(hall_box(256, oy + 14, 120, 92, "南1", "sat",
                      "2 サークル", hall_pins("南1")))
    s.append(hall_box(96, oy + 116, 150, 60, "南3", "corp", "企業"))
    s.append(hall_box(256, oy + 116, 120, 60, "南4", "corp", "企業"))
    # West building (mid-left)
    s.append(text(440, oy + 4, "西展示棟", size=12.5, fill=MUTED,
                  weight="700"))
    s.append(hall_box(440, oy + 14, 110, 78, "西1", "sun", "1", hall_pins("西1")))
    s.append(hall_box(558, oy + 14, 110, 78, "西2", "used", ""))
    s.append(hall_box(440, oy + 100, 110, 56, "西3", "corp", "企業"))
    s.append(hall_box(558, oy + 100, 110, 56, "西4", "corp", "企業"))
    # East building (right)
    s.append(text(820, oy + 4, "東展示棟", size=12.5, fill=MUTED,
                  weight="700"))
    s.append(hall_box(820, oy + 14, 120, 70, "東7", "sun", "1", hall_pins("東7")))
    s.append(hall_box(950, oy + 14, 120, 70, "東8", "used", ""))
    s.append(hall_box(820, oy + 94, 120, 70, "東1", "sun", "1", hall_pins("東1")))
    s.append(hall_box(950, oy + 94, 120, 70, "東2", "sat", "1", hall_pins("東2")))
    s.append(hall_box(1080, oy + 94, 120, 70, "東3", "sat", "2",
                      hall_pins("東3")))
    for i, lab in enumerate(("東4", "東5", "東6")):
        s.append(hall_box(820 + i * 130, oy + 174, 120, 50, lab, "closed",
                          "改修"))
    # entrance + tower hints
    s.append(text(1280, oy + 60, "▶ 入場ゲート", size=14, fill=MUTED,
                  weight="700"))
    s.append(text(1280, oy + 88, "(東/西南で別)", size=11.5, fill="#9a948c"))
    s.append('<path d="M 712 250 L 740 234 L 740 266 Z" fill="#d8d2c6"/>')
    s.append(text(726, 250 + 38, "会議棟", size=10, fill="#9a948c",
                  anchor="middle"))

    s.append(f'<line x1="56" y1="{oy+248}" x2="{W-56}" y2="{oy+248}" '
             f'stroke="{BORDER}" stroke-width="1.5"/>')

    # =====================================================================
    # SECTION B — 南2 floor plan (the island), left;  index, right
    # =====================================================================
    by = oy + 280            # ~452
    s.append(text(56, by, "南2ホール フロア図", size=20, weight="800",
                  fill=ISLAND))
    s.append(text(296, by, "― 超かぐや姫島 (土曜)", size=14, fill=MUTED))

    # hall outline
    hx, hyy, hw, hh = 56, by + 22, 920, 560
    s.append(rrect(hx, hyy, hw, hh, 14, "#fcfbf9", "#bcb5a8", 2))
    s.append(text(hx + 20, hyy + 30, "南2", size=22, fill="#b9b2a5",
                  weight="800"))
    # facilities
    s.append(rrect(hx + hw - 150, hyy + 16, 130, 30, 6, "#dfeaf4", SUN, 1.2)
             + text(hx + hw - 85, hyy + 36, "i / 販売", size=13, fill="#28557d",
                    weight="700", anchor="middle"))
    s.append(text(hx + hw / 2, hyy + hh - 14, "▲ 入口 (一般)", size=13,
                  fill=MUTED, weight="700", anchor="middle"))

    # context islands (plain) + our a / b islands (detailed)
    block_a = {b["space"]: (b["n"], day_color(b)) for b in isl
               if b["block"] == "a"}
    block_b = {b["space"]: (b["n"], day_color(b)) for b in isl
               if b["block"] == "b"}
    ix = hx + 90
    iy0 = hyy + 70
    # a couple of context islands above
    for k in range(2):
        s.append(rrect(ix, iy0 + k * 60, 560, 42, 6, "#f2efe9", "#d8d2c6", 1)
                 + text(ix + 280, iy0 + k * 60 + 26, "（他ジャンル島）",
                        size=12, fill="#bdb6aa", anchor="middle"))
    # our islands
    a_lo, a_hi = min(block_a), max(block_a)
    b_lo, b_hi = min(block_b), max(block_b)
    sa, wa = island_strip(ix, iy0 + 140, "a", a_lo, a_hi, block_a)
    s.append(sa)
    sb, wb = island_strip(ix, iy0 + 200, "b", b_lo, b_hi, block_b)
    s.append(sb)
    # 超かぐや姫島 bracket + rotated label
    bracket_y = iy0 + 132
    bcx, bcy = ix - 60, (bracket_y + iy0 + 254) / 2
    s.append(f'<path d="M {ix-50} {bracket_y} L {ix-58} {bracket_y} '
             f'L {ix-58} {iy0+254} L {ix-50} {iy0+254}" '
             f'stroke="{ISLAND}" stroke-width="2.5" fill="none"/>')
    s.append(f'<text x="{bcx}" y="{bcy}" '
             f'transform="rotate(-90 {bcx} {bcy})" font-size="14" '
             f'fill="{ISLAND}" font-weight="800" text-anchor="middle" '
             f'font-family="\'Noto Sans CJK JP\',sans-serif">超かぐや姫島</text>')
    # context islands below
    for k in range(2):
        yy = iy0 + 280 + k * 60
        s.append(rrect(ix, yy, 560, 42, 6, "#f2efe9", "#d8d2c6", 1)
                 + text(ix + 280, yy + 26, "（他ジャンル島）", size=12,
                        fill="#bdb6aa", anchor="middle"))

    # ---- index (right column) ----
    RX = 1010
    s.append(f'<line x1="{RX-22}" y1="{by-22}" x2="{RX-22}" y2="{H-92}" '
             f'stroke="{BORDER}" stroke-width="1.5"/>')
    s.append(text(RX, by, "サークル INDEX", size=18, weight="800"))
    s.append(text(RX + 175, by, "番号は左図に対応", size=11.5, fill=MUTED))
    ry = by + 32
    s.append(text(RX, ry, "■ 南2 超かぐや姫島", size=13.5, fill=ISLAND,
                  weight="800"))
    ry += 26
    for b in isl:
        s.append(index_row(RX, ry, b["n"], b))
        ry += 29
    ry += 10
    s.append(text(RX, ry, "■ その他ホール (土・日)", size=13.5, fill=MUTED,
                  weight="800"))
    ry += 26
    for b in sat_other + sun:
        s.append(index_row(RX, ry, b["n"], b))
        ry += 29
    if tbd:
        ry += 10
        s.append(text(RX, ry, "■ 配置スペース未確認", size=13.5, fill="#9a948c",
                      weight="800"))
        ry += 24
        for b in tbd:
            s.append(text(RX + 4, ry, f"・{b['circle']}（当選済・判明次第追記）",
                          size=12.5, fill=MUTED))
            ry += 22

    # ---- 見方 / legend box (fills left-bottom under the floor plan) ----
    gy = hyy + hh + 26
    s.append(rrect(56, gy, 920, 150, 12, "#fcfbf9", BORDER, 1.2))
    s.append(text(78, gy + 30, "見方", size=16, weight="800", fill=ACCENT))
    rows = [
        ("紫のセル", "超かぐや姫島の各サークル位置。数字は右の INDEX 番号に対応"),
        ("数字 / a・b", "スペース番号 と ブロック記号 (例: a14 = a ブロック 14)"),
        ("灰色の島", "他ジャンルのサークル島 (相対位置の目安)"),
        ("全体図の色", "● 土曜配置   ● 日曜配置 のサークルがいるホール"),
    ]
    ly = gy + 56
    for k, v in rows:
        s.append(text(92, ly, "・", size=13, fill=MUTED))
        s.append(text(108, ly, k, size=13, weight="700"))
        s.append(text(238, ly, v, size=13, fill=MUTED))
        ly += 26

    # ---- footer ----
    s.append(f'<line x1="56" y1="{H-66}" x2="{W-56}" y2="{H-66}" '
             f'stroke="{BORDER}" stroke-width="1.5"/>')
    s.append(text(56, H - 40,
                  "map by 月見ヤチヨ ／ 配置は各サークルの当落報告より作図 ／ 非公式ファンガイド",
                  size=13, fill=MUTED))
    s.append(text(56, H - 20,
                  "コミケット公式会場図は準備会の著作物のため非掲載。本図は当サイト収録 23 "
                  "サークルの位置のみを示した略図で、縮尺・島数は正確ではありません。",
                  size=11.5, fill="#9a948c"))
    s.append(text(W - 56, H - 28, "yachi8000.app", size=15, fill=ACCENT,
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
        raster(svg_path, ROOT / EVENT / "map.jpg", 1600, 1310, scale=1)
        # OG: header + 会場全体図 band → ~1.9:1 social card
        raster(svg_path, ROOT / EVENT / "og.png", 1600, 1310, scale=1,
               crop={"x": 0, "y": 0, "width": 1600, "height": 840})


if __name__ == "__main__":
    main()
