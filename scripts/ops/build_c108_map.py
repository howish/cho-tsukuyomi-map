#!/usr/bin/env python3
"""Generate C108's multi-sub-map venue system from c108-2026-08/data.js.

Comiket's venue spans several buildings across two days — one image
can't show it usefully, and the official block-level map is copyright-
locked (booklet + login-walled Webcatalog). So we draw our own, split
by 展示棟 (exhibition building):

  map-overview.svg  Tokyo Big Sight building locator (clickable → tab)
  map-minami.svg    南展示棟 — 南1 + 南2 (超かぐや姫島) floor plan
  map-higashi.svg   東展示棟 — 東1/東2/東3/東7
  map-nishi.svg     西展示棟 — 西1

…plus submaps.js: the tab config + per-sub-map BOOTH_COORDS (percent
of each image) + areaCoords (overview building regions) + boothArea
(booth → building, for the auto-mode scope filter). app.js's existing
coords-overlay makes the booths clickable on whichever sub-map is shown.

map.jpg / og.png are rastered from the overview (SW-precache + social
card). Regenerate after a tbd-NN placement resolves.

Render uses the shared playwright-runtime + a CJK font (see
_have_cjk_font). Run:  python3 scripts/ops/build_c108_map.py
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

BG = "#faf8f4"
CARD = "#ffffff"
INK = "#222222"
MUTED = "#6b6b6b"
BORDER = "#e2ded7"
ACCENT = "#6a4c93"
SAT = "#c8821f"
SUN = "#3f72a4"
ISLAND = "#6a4c93"
ISLAND_FILL = "#f1ecf6"
FONT = "'Noto Sans CJK JP','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif"

CP_LABEL = {"iroka": "いろかぐ", "iroyachi": "いろヤチ", "iroroka": "いろろか",
            "trio": "三人", "mikanoi": "みかのい"}

# 展示棟 grouping
BUILDINGS = {
    "minami": {"label": "南展示棟", "halls": ["南1", "南2"]},
    "higashi": {"label": "東展示棟", "halls": ["東1", "東2", "東3", "東7"]},
    "nishi": {"label": "西展示棟", "halls": ["西1"]},
}
HALL_BUILDING = {h: bid for bid, v in BUILDINGS.items() for h in v["halls"]}


# --------------------------------------------------------------------------
def load_booths():
    raw = (ROOT / EVENT / "data.js").read_text(encoding="utf-8")
    booths = json.loads(raw[raw.find("=") + 1:].rstrip().rstrip(";"))
    circles = json.loads((ROOT / "circles.json").read_text(encoding="utf-8"))
    cname = {c["id"]: c["circle_name"] for c in circles["circles"]}
    cmembers = {c["id"]: c.get("members", []) for c in circles["circles"]}
    authors = {a["id"]: a for a in circles["authors"]}
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
        members = cmembers.get(b["circle_id"], [])
        author = ""
        if members:
            a = authors.get(members[0]) or {}
            author = a.get("name") or a.get("name_inferred") or ""
        if author and (any(t in author for t in ("「", "」", "**", "サークル名"))
                       or author == cname.get(b["circle_id"])):
            author = ""
        out.append({
            "id": bid, "day": day, "hall": hall, "block": block,
            "space": space, "side": side or "",
            "circle": cname.get(b["circle_id"], b["circle_id"]),
            "author": author, "cps": b.get("cps", []),
            "building": HALL_BUILDING.get(hall),
        })
    return out


def esc(s):
    return html.escape(str(s), quote=True)


def text(x, y, s, size=16, fill=INK, weight="400", anchor="start", spacing=None):
    sp = f' letter-spacing="{spacing}"' if spacing else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" '
            f'font-weight="{weight}" text-anchor="{anchor}" '
            f'font-family="{FONT}"{sp}>{esc(s)}</text>')


def rrect(x, y, w, h, r, fill, stroke="none", sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
            f'rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')


def cp_str(cps):
    return " · ".join(CP_LABEL.get(c, c) for c in cps)


def pct(v, total):
    return round(v / total * 100, 3)


def svg_open(W, H):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}" font-family="sans-serif">'
            + rrect(0, 0, W, H, 0, BG)]


def submap_header(s, title, sub):
    s.append(text(40, 50, title, size=26, fill=ISLAND, weight="800"))
    if sub:
        s.append(text(40 + len(title) * 27, 50, sub, size=15, fill=MUTED))
    # day legend
    s.append(f'<circle cx="{1300}" cy="42" r="7" fill="{SAT}"/>'
             + text(1314, 47, "土曜", size=13, fill=MUTED))
    s.append(f'<circle cx="{1380}" cy="42" r="7" fill="{SUN}"/>'
             + text(1394, 47, "日曜", size=13, fill=MUTED))
    s.append(f'<line x1="40" y1="68" x2="1400" y2="68" stroke="{BORDER}" '
             f'stroke-width="1.5"/>')


def footer(s, W, H):
    s.append(f'<line x1="40" y1="{H-44}" x2="{W-40}" y2="{H-44}" '
             f'stroke="{BORDER}" stroke-width="1.2"/>')
    s.append(text(40, H - 22,
                  "非公式ファンガイド ／ 配置は各サークルの当落報告より作図 ／ 公式会場図は準備会著作物のため非掲載・縮尺は不正確",
                  size=11.5, fill="#9a948c"))
    s.append(text(W - 40, H - 22, "yachi8000.app", size=13, fill=ACCENT,
                  weight="700", anchor="end"))


def rtext(x, y, deg, s, size, fill, weight="400"):
    return (f'<text x="{x:.1f}" y="{y:.1f}" transform="rotate({deg} {x:.1f} '
            f'{y:.1f})" font-size="{size}" fill="{fill}" font-weight="{weight}" '
            f'text-anchor="start" font-family="{FONT}">{esc(s)}</text>')


def booth_cell(x, y, w, h, b, coords, W, H, day_col, label=None,
               name=True, sz=13, name_max=14):
    """A filled booth cell; records its rect (percent) into coords[id]."""
    p = [rrect(x, y, w, h, 6, day_col, "#ffffff", 1.5)]
    label = label if label is not None else f"{b['block']}{b['space']}{b['side']}"
    p.append(text(x + w / 2, y + (h / 2 - 3 if name else h / 2 + 5), label,
                  size=sz, fill="#fff", weight="800", anchor="middle"))
    if name:
        nm = b["circle"]
        if len(nm) > name_max:
            nm = nm[:name_max - 1] + "…"
        p.append(text(x + w / 2, y + h / 2 + 15, nm, size=11, fill="#fff",
                      anchor="middle"))
    coords[b["id"]] = {"x": pct(x, W), "y": pct(y, H),
                       "w": pct(w, W), "h": pct(h, H)}
    return "".join(p)


def day_col(b):
    return SUN if b["day"] == "日" else SAT


# --------------------------------------------------------------------------
def build_overview(booths):
    W, H = 1440, 500
    s = svg_open(W, H)
    submap_header(s, "会場全体図", "― 展示棟をタップで切替")
    area = {}

    def building_box(x, y, w, h, bid):
        info = BUILDINGS[bid]
        bb = [bb for bb in booths if bb["building"] == bid]
        days = {b["day"] for b in bb}
        fill, stroke, tc = ((ISLAND_FILL, ISLAND, ISLAND) if bid == "minami"
                            else (("#fbeed5", SAT, "#8a5a12") if "土" in days
                                  else ("#dfeaf4", SUN, "#28557d")))
        out = [rrect(x, y, w, h, 14, fill, stroke, 2.5)]
        out.append(text(x + 20, y + 38, info["label"], size=22, fill=tc,
                        weight="800"))
        out.append(text(x + w - 18, y + 38, f"{len(bb)} サークル", size=14,
                        fill=tc, weight="700", anchor="end"))
        # hall chips
        hx = x + 20
        for hall in info["halls"]:
            n = len([b for b in bb if b["hall"] == hall])
            cw = 96
            out.append(rrect(hx, y + 56, cw, 56, 8, "#fff", stroke, 1.3))
            out.append(text(hx + cw / 2, y + 82, hall, size=17, fill=tc,
                            weight="800", anchor="middle"))
            if hall == "南2":
                out.append(text(hx + cw / 2, y + 100, "超かぐや姫島", size=9.5,
                                fill=ISLAND, anchor="middle"))
            else:
                out.append(text(hx + cw / 2, y + 100, f"{n}", size=11,
                                fill=MUTED, anchor="middle"))
            hx += cw + 12
        out.append(text(x + w / 2, y + h - 14, "▶ タップで開く", size=12,
                        fill=tc, weight="700", anchor="middle"))
        area[bid] = {"x": pct(x, W), "y": pct(y, H),
                     "w": pct(w, W), "h": pct(h, H)}
        return "".join(out)

    s.append(building_box(40, 110, 520, 250, "minami"))
    s.append(building_box(580, 110, 470, 250, "higashi"))
    s.append(building_box(1070, 110, 330, 250, "nishi"))
    # closed halls note
    s.append(text(40, 398, "※ 東4〜6ホールは改修工事のため C108 では使用不可",
                  size=13, fill="#9a948c"))
    s.append(text(40, 424, "※ 各展示棟をタップすると、その棟の島机フロア図に切り替わります。"
                  "マップ上のサークルを押すと詳細カードが開きます。",
                  size=13, fill=MUTED))
    footer(s, W, H)
    s.append("</svg>")
    return "\n".join(s), area


def build_minami(booths):
    W, H = 1440, 940
    s = svg_open(W, H)
    submap_header(s, "南展示棟", "― 南2 超かぐや姫島 ＋ 南1")
    coords = {}
    isl = [b for b in booths if b["hall"] == "南2"]
    a = {b["space"]: b for b in isl if b["block"] == "a"}
    bb = {b["space"]: b for b in isl if b["block"] == "b"}

    # 南2 hall outline
    hx, hy, hw, hh = 40, 92, 1360, 600
    s.append(rrect(hx, hy, hw, hh, 14, "#fcfbf9", "#bcb5a8", 2))
    s.append(text(hx + 22, hy + 36, "南2", size=24, fill="#b9b2a5", weight="800")
             + text(hx + 90, hy + 36, "ホール ― 超かぐや姫島 13 サークル",
                    size=15, fill=ISLAND, weight="700"))
    s.append(rrect(hx + hw - 156, hy + 16, 138, 30, 6, "#dfeaf4", SUN, 1.2)
             + text(hx + hw - 87, hy + 36, "i / 販売", size=13, fill="#28557d",
                    weight="700", anchor="middle"))
    s.append(text(hx + hw / 2, hy + hh - 16, "▲ 入口 (一般)", size=13,
                  fill=MUTED, weight="700", anchor="middle"))

    # island cell strips (a, b), cells = space numbers
    def strip(block_map, blk, y):
        lo, hi = min(block_map), max(block_map)
        cell = 44
        x0 = hx + 120
        out = [rrect(x0 - 50, y, 40, 56, 6, ISLAND_FILL, ISLAND, 1.4)
               + text(x0 - 30, y + 36, blk, size=20, fill=ISLAND,
                      weight="800", anchor="middle")]
        for i, sp in enumerate(range(lo, hi + 1)):
            cx = x0 + i * cell
            if sp in block_map:
                b = block_map[sp]
                out.append(booth_cell(cx, y, cell - 3, 56, b, coords, W, H,
                                      day_col(b), label=f"{sp}{b['side']}",
                                      name=False, sz=13))
                nm = b["circle"]
                if len(nm) > 8:
                    nm = nm[:8] + "…"
                # hang the name down-right (rotate clockwise) so adjacent
                # labels run parallel and never collide
                out.append(rtext(cx + 8, y + 62, 40, nm, 10.5, INK, "600"))
            else:
                out.append(rrect(cx, y, cell - 3, 56, 5, "#fff", "#ddd6ca", 1)
                           + text(cx + (cell - 3) / 2, y + 33, str(sp),
                                  size=10, fill="#c2bbb0", anchor="middle"))
        return "".join(out)

    s.append(rrect(hx + 70, hy + 92, 1180, 40, 6, "#f2efe9", "#d8d2c6", 1)
             + text(hx + 70 + 590, hy + 116, "（他ジャンル島）", size=12,
                    fill="#bdb6aa", anchor="middle"))
    s.append(strip(a, "a", hy + 162))
    s.append(strip(bb, "b", hy + 298))
    s.append(rrect(hx + 70, hy + 432, 1180, 40, 6, "#f2efe9", "#d8d2c6", 1)
             + text(hx + 70 + 590, hy + 456, "（他ジャンル島）", size=12,
                    fill="#bdb6aa", anchor="middle"))

    # 南1 — separate strip of two tables, below the hall box
    s.append(text(hx, hy + hh + 50, "南1ホール", size=17, fill=SAT,
                  weight="800"))
    m1 = sorted([b for b in booths if b["hall"] == "南1"],
                key=lambda b: b["space"])
    cx = hx + 130
    for b in m1:
        s.append(booth_cell(cx, hy + hh + 24, 180, 56, b, coords, W, H,
                            day_col(b), name=True, sz=14))
        cx += 200
    footer(s, W, H)
    s.append("</svg>")
    return "\n".join(s), coords


def build_simple_halls(booths, building, title):
    """East / West: a row of hall boxes, each with its booth cell(s)."""
    W = 1440
    halls = [h for h in BUILDINGS[building]["halls"]
             if any(b["hall"] == h for b in booths)]
    rows = [(h, sorted([b for b in booths if b["hall"] == h],
                       key=lambda b: b["space"])) for h in halls]
    maxn = max((len(r[1]) for r in rows), default=1)
    H = 140 + maxn * 84 + 60
    s = svg_open(W, H)
    submap_header(s, title, f"― {len(halls)} ホール")
    bw = (1400 - 40 - (len(rows) - 1) * 24) / max(len(rows), 1)
    coords = {}
    x = 40
    for hall, bs in rows:
        ch = 56 + len(bs) * 84
        accent = SUN if all(b["day"] == "日" for b in bs) else SAT
        s.append(rrect(x, 96, bw, ch, 12, "#fcfbf9", "#bcb5a8", 1.6))
        s.append(rrect(x, 96, bw, 38, 12, accent)
                 + rrect(x, 114, bw, 20, 0, accent))
        s.append(text(x + 16, 121, hall + "ホール", size=16, fill="#fff",
                      weight="800"))
        cy = 150
        cw = min(bw - 36, 360)
        cox = x + (bw - cw) / 2
        for b in bs:
            s.append(booth_cell(cox, cy, cw, 64, b, coords, W, H,
                                day_col(b), name=True, sz=15, name_max=18))
            cy += 84
        x += bw + 24
    footer(s, W, H)
    s.append("</svg>")
    return "\n".join(s), coords


# --------------------------------------------------------------------------
def write_maps_js(area_coords, sub_coords):
    """Data only (no behaviour). Consumed by c108-2026-08/area-map.js, which
    swaps the displayed map per the existing area filter. `default.regions`
    are the overview's clickable building rects (→ activate area filter)."""
    cfg = {"default": {"image": "map-overview.svg", "regions": area_coords}}
    for bid in ("minami", "higashi", "nishi"):
        cfg[bid] = {"image": f"map-{bid}.svg", "coords": sub_coords[bid]}
    js = ("/* Auto-generated by scripts/ops/build_c108_map.py — do not hand-edit.\n"
          "   Per-area map data (image + booth coords). Behaviour lives in\n"
          "   area-map.js; building scope is the standard area filter. */\n"
          "window.AREA_MAPS = " + json.dumps(cfg, ensure_ascii=False, indent=1)
          + ";\n")
    (ROOT / EVENT / "maps.js").write_text(js, encoding="utf-8")


# --------------------------------------------------------------------------
def _have_cjk_font():
    try:
        out = subprocess.run(["fc-list"], capture_output=True, text=True).stdout
        return "CJK JP" in out or "Noto Sans JP" in out or "Hiragino" in out
    except FileNotFoundError:
        return True


def raster(svg_path, out_path, w, h, scale=1, crop=None):
    runtime = Path.home() / ".claude" / "skills" / "playwright-runtime" / "bin" / "python"
    if not runtime.exists():
        print(f"  (skip raster {out_path.name}: runtime missing)", file=sys.stderr)
        return
    if not _have_cjk_font():
        print(f"  (skip raster {out_path.name}: no CJK font — apt-get download "
              "fonts-noto-cjk → ~/.fonts → fc-cache)", file=sys.stderr)
        return
    crop_py = repr(crop) if crop else "None"
    script = f'''
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True)
    pg = b.new_page(viewport={{"width":{w},"height":{h}}}, device_scale_factor={scale})
    pg.goto("file://{svg_path}")
    pg.wait_for_timeout(400)
    typ = "jpeg" if "{out_path}".endswith((".jpg",".jpeg")) else "png"
    kw = {{"path":"{out_path}","type":typ}}
    if typ=="jpeg": kw["quality"]=88
    crop = {crop_py}
    if crop: kw["clip"]=crop
    pg.screenshot(**kw)
    b.close()
'''
    sp = Path("/tmp/_c108_raster.py")
    sp.write_text(script)
    r = subprocess.run([str(runtime), str(sp)], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  raster {out_path.name} failed: {r.stderr[:200]}", file=sys.stderr)
    else:
        print(f"  rendered {out_path.name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-raster", action="store_true")
    args = ap.parse_args()
    booths = load_booths()

    ov_svg, area = build_overview(booths)
    mi_svg, mi_co = build_minami(booths)
    hi_svg, hi_co = build_simple_halls(booths, "higashi", "東展示棟")
    ni_svg, ni_co = build_simple_halls(booths, "nishi", "西展示棟")

    for name, svg in (("map-overview.svg", ov_svg), ("map-minami.svg", mi_svg),
                      ("map-higashi.svg", hi_svg), ("map-nishi.svg", ni_svg)):
        (ROOT / EVENT / name).write_text(svg, encoding="utf-8")
    write_maps_js(area, {"minami": mi_co, "higashi": hi_co, "nishi": ni_co})
    print(f"wrote 4 sub-maps + maps.js ({len(booths)} circles, "
          f"{sum(len(c) for c in (mi_co, hi_co, ni_co))} placed)")

    if not args.no_raster:
        ov_path = ROOT / EVENT / "map-overview.svg"
        raster(ov_path, ROOT / EVENT / "map.jpg", 1440, 500, scale=2)
        raster(ov_path, ROOT / EVENT / "og.png", 1440, 500, scale=1,
               crop={"x": 0, "y": 0, "width": 1440, "height": 500})


if __name__ == "__main__":
    main()
