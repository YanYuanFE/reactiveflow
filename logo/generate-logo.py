#!/usr/bin/env python3
"""
ReactiveFlow Logo — Pulse Architecture (Final)
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

W, H = 2000, 2000
FONT_DIR = "/Users/yanyuan/.claude/skills/canvas-design/canvas-fonts"
OUT_DIR = "/Users/yanyuan/Documents/Develop/AI/pacifica-hackathon/reactiveflow/logo"
os.makedirs(OUT_DIR, exist_ok=True)

# ─── Palette ───────────────────────────────────────────────────────
BG        = (10, 8, 22)
PRIMARY   = (79, 70, 229)
PRI_MID   = (99, 102, 241)
PRI_LIGHT = (129, 140, 248)
PRI_PALE  = (199, 210, 254)
PRI_GHOST = (224, 231, 255)
WHITE     = (240, 245, 255)
MUTED     = (90, 100, 150)
FAINT     = (30, 27, 60)

# ─── Fonts ─────────────────────────────────────────────────────────
font_title = ImageFont.truetype(f"{FONT_DIR}/Outfit-Bold.ttf", 74)
font_sub   = ImageFont.truetype(f"{FONT_DIR}/GeistMono-Regular.ttf", 14)
font_anno  = ImageFont.truetype(f"{FONT_DIR}/GeistMono-Regular.ttf", 10)

CX, CY = 1000, 700
img = Image.new("RGBA", (W, H), BG + (255,))


# ═══ 1. RADIAL GLOW ═══════════════════════════════════════════════
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for r in range(550, 0, -2):
    a = int(22 * (1 - r / 550) ** 0.7)
    gd.ellipse([CX - r, CY - r, CX + r, CY + r], fill=PRIMARY + (a,))
img = Image.alpha_composite(img, glow)


# ═══ 2. DOT MATRIX ════════════════════════════════════════════════
dots = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dfd = ImageDraw.Draw(dots)
for x in range(60, W, 48):
    for y in range(60, H, 48):
        dist = math.sqrt((x - CX) ** 2 + (y - CY) ** 2)
        if 320 < dist < 680:
            fade = 1 - (dist - 320) / 360
            a = max(0, int(35 * fade))
            dfd.ellipse([x - 1, y - 1, x + 1, y + 1], fill=FAINT + (a,))
img = Image.alpha_composite(img, dots)


# ═══ 3. CONCENTRIC RINGS ══════════════════════════════════════════
rings = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(rings)
for r, a in [(175, 50), (248, 35), (338, 20)]:
    rd.ellipse([CX - r, CY - r, CX + r, CY + r], outline=PRI_MID + (a,), width=1)
img = Image.alpha_composite(img, rings)


# ═══ 4. CALIBRATION TICKS ═════════════════════════════════════════
ticks = Image.new("RGBA", (W, H), (0, 0, 0, 0))
tkd = ImageDraw.Draw(ticks)
for deg in range(0, 360, 15):
    is_major = deg % 45 == 0
    r1, r2 = 252, (272 if is_major else 262)
    a = 45 if is_major else 22
    rad = math.radians(deg)
    x1 = CX + r1 * math.cos(rad)
    y1 = CY + r1 * math.sin(rad)
    x2 = CX + r2 * math.cos(rad)
    y2 = CY + r2 * math.sin(rad)
    tkd.line([(x1, y1), (x2, y2)], fill=PRI_LIGHT + (a,), width=1)
img = Image.alpha_composite(img, ticks)


# ═══ 5. NODE VERTICES ═════════════════════════════════════════════
nodes = Image.new("RGBA", (W, H), (0, 0, 0, 0))
nd = ImageDraw.Draw(nodes)
for deg in [0, 60, 120, 180, 240, 300]:
    rad = math.radians(deg)
    dx = CX + 175 * math.cos(rad)
    dy = CY + 175 * math.sin(rad)
    nd.ellipse([dx - 5, dy - 5, dx + 5, dy + 5], fill=PRI_MID + (30,))
    nd.ellipse([dx - 2, dy - 2, dx + 2, dy + 2], fill=PRI_LIGHT + (70,))
for deg in [30, 150, 270]:
    rad = math.radians(deg)
    dx = CX + 338 * math.cos(rad)
    dy = CY + 338 * math.sin(rad)
    nd.ellipse([dx - 3, dy - 3, dx + 3, dy + 3], fill=PRI_MID + (18,))
img = Image.alpha_composite(img, nodes)


# ═══ 6. CIRCUIT TRACES ════════════════════════════════════════════
traces = Image.new("RGBA", (W, H), (0, 0, 0, 0))
trd = ImageDraw.Draw(traces)

paths = [
    [(CX + 190, CY - 8), (CX + 370, CY - 8), (CX + 370, CY - 125),
     (CX + 490, CY - 125)],
    [(CX - 190, CY + 12), (CX - 340, CY + 12), (CX - 340, CY + 95),
     (CX - 460, CY + 95)],
    [(CX + 15, CY - 210), (CX + 15, CY - 345), (CX + 115, CY - 345),
     (CX + 115, CY - 430)],
    [(CX + 45, CY + 210), (CX + 45, CY + 320), (CX + 175, CY + 320)],
]
for path in paths:
    trd.line(path, fill=PRIMARY + (35,), width=1)
    ex, ey = path[-1]
    trd.ellipse([ex - 5, ey - 5, ex + 5, ey + 5], fill=PRI_MID + (40,))
    trd.ellipse([ex - 2, ey - 2, ex + 2, ey + 2], fill=PRI_LIGHT + (80,))
    sx, sy = path[0]
    trd.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=PRI_MID + (30,))
img = Image.alpha_composite(img, traces)


# ═══ 7. BOLT DEFINITION ═══════════════════════════════════════════
s = 20
ox, oy = CX - 12 * s, CY - 12 * s

bolt_pts = [
    (ox + 3.75 * s,  oy + 13.5 * s),
    (ox + 14.25 * s, oy + 2.25 * s),
    (ox + 12 * s,    oy + 10.5 * s),
    (ox + 20.25 * s, oy + 10.5 * s),
    (ox + 9.75 * s,  oy + 21.75 * s),
    (ox + 12 * s,    oy + 13.5 * s),
]


# ═══ 8. BOLT OUTER GLOW ═══════════════════════════════════════════
outer_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(outer_glow).polygon(bolt_pts, fill=PRIMARY + (160,))
outer_glow = outer_glow.filter(ImageFilter.GaussianBlur(radius=40))
img = Image.alpha_composite(img, outer_glow)

# Tighter secondary glow
inner_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(inner_glow).polygon(bolt_pts, fill=PRI_LIGHT + (120,))
inner_glow = inner_glow.filter(ImageFilter.GaussianBlur(radius=15))
img = Image.alpha_composite(img, inner_glow)


# ═══ 9. BOLT GRADIENT FILL ════════════════════════════════════════
bolt_top = oy + 2.25 * s
bolt_bot = oy + 21.75 * s

# Create mask from bolt shape
bolt_mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(bolt_mask).polygon(bolt_pts, fill=255)

# Build gradient: PRI_GHOST (top, bright) → PRI_LIGHT (bottom, still visible)
bolt_fill = Image.new("RGBA", (W, H), (0, 0, 0, 0))
bfd = ImageDraw.Draw(bolt_fill)
for y in range(int(bolt_top), int(bolt_bot) + 1):
    t = (y - bolt_top) / (bolt_bot - bolt_top)
    t2 = t * t * (3 - 2 * t)  # smoothstep
    # Top: near-white indigo → Bottom: medium indigo (still bright!)
    r = int(PRI_GHOST[0] * (1 - t2) + PRI_LIGHT[0] * t2)
    g = int(PRI_GHOST[1] * (1 - t2) + PRI_LIGHT[1] * t2)
    b = int(PRI_GHOST[2] * (1 - t2) + PRI_LIGHT[2] * t2)
    bfd.line([(0, y), (W, y)], fill=(r, g, b, 255))

bolt_fill.putalpha(bolt_mask)
img = Image.alpha_composite(img, bolt_fill)

# Subtle edge
edge = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(edge).polygon(bolt_pts, outline=WHITE + (25,), width=1)
img = Image.alpha_composite(img, edge)


# ═══ 10. TYPOGRAPHY ═══════════════════════════════════════════════
txt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(txt)

# Horizontal rules
rule_y1, rule_y2 = 1065, 1260
rule_l, rule_r = 600, 1400
td.line([(rule_l, rule_y1), (rule_r, rule_y1)], fill=FAINT + (90,), width=1)
td.line([(rule_l, rule_y2), (rule_r, rule_y2)], fill=FAINT + (90,), width=1)

# Diamond accents
for px, py in [(rule_l, rule_y1), (rule_r, rule_y1),
               (rule_l, rule_y2), (rule_r, rule_y2)]:
    td.polygon([(px, py - 3), (px + 3, py), (px, py + 3), (px - 3, py)],
               fill=PRI_MID + (55,))

# Wordmark
td.text((CX, 1132), "ReactiveFlow", font=font_title, fill=WHITE + (255,),
        anchor="mm")

# Subtitle with letter-spacing
sub_text = "ON-CHAIN REACTIVE AUTOMATION"
sub_spacing = 3.5
chars = list(sub_text)
char_widths = [font_sub.getbbox(c)[2] - font_sub.getbbox(c)[0] for c in chars]
total_w = sum(char_widths) + sub_spacing * (len(chars) - 1)
cursor_x = CX - total_w / 2
sub_y = 1195
for ch, cw in zip(chars, char_widths):
    td.text((cursor_x, sub_y), ch, font=font_sub, fill=MUTED + (220,))
    cursor_x += cw + sub_spacing

# Corner annotations
td.text((90, 72), "RF—001", font=font_anno, fill=MUTED + (40,))
td.text((W - 90, 72), "SOMNIA NETWORK", font=font_anno, fill=MUTED + (40,),
        anchor="ra")
td.text((90, H - 72), "PULSE ARCHITECTURE", font=font_anno,
        fill=MUTED + (30,))

img = Image.alpha_composite(img, txt)


# ═══ EXPORT ════════════════════════════════════════════════════════
final = img.convert("RGB")
out_path = f"{OUT_DIR}/reactiveflow-logo.png"
final.save(out_path, "PNG")
print(f"Saved: {out_path}")

# Icon crop (512px)
margin = 60
crop_box = (CX - 250 - margin, CY - 250 - margin,
            CX + 250 + margin, CY + 250 + margin)
icon = img.crop(crop_box).resize((512, 512), Image.LANCZOS).convert("RGB")
icon.save(f"{OUT_DIR}/reactiveflow-icon-512.png", "PNG")
print(f"Icon:  {OUT_DIR}/reactiveflow-icon-512.png")
