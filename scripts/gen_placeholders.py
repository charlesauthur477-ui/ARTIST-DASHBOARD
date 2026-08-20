#!/usr/bin/env python3
"""Generate premium-looking demo placeholder images for the artist dashboard.
All images are procedurally generated (gradients + noise + typography) — no
scraped or copyrighted photography. Safe to replace with real assets later.
"""
import os
import random
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

random.seed(42)

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "artists")

FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]

def get_font(size, bold=True):
    for p in FONT_PATHS:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

PALETTES = {
    "noir": [(10, 10, 12), (26, 22, 20), (46, 38, 30), (18, 16, 22)],
    "bronze": [(20, 16, 14), (58, 40, 24), (120, 84, 44), (30, 24, 18)],
    "cinema": [(8, 10, 16), (24, 20, 30), (60, 30, 40), (14, 12, 18)],
    "nova": [(6, 12, 18), (16, 30, 42), (30, 70, 90), (10, 18, 26)],
}

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def radial_gradient(w, h, palette, cx=0.5, cy=0.35, seed=0):
    rnd = random.Random(seed)
    c1, c2, c3, c4 = palette
    base = Image.new("RGB", (w, h), c1)
    px = base.load()
    max_d = math.hypot(max(cx, 1 - cx) * w, max(cy, 1 - cy) * h)
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            d = math.hypot(x - cx * w, y - cy * h) / max_d
            t = min(1.0, d)
            col = lerp(c2, c1, t)
            if t < 0.35:
                col = lerp(c3, c2, t / 0.35)
            px[x, y] = col
            if x + 1 < w:
                px[x + 1, y] = col
            if y + 1 < h:
                px[x, y + 1] = col
            if x + 1 < w and y + 1 < h:
                px[x + 1, y + 1] = col
    # vignette
    vign = Image.new("L", (w, h), 0)
    vd = ImageDraw.Draw(vign)
    vd.ellipse([-w * 0.3, -h * 0.3, w * 1.3, h * 1.3], fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(w * 0.08))
    dark = Image.new("RGB", (w, h), c4)
    base = Image.composite(base, dark, vign)
    return base

def add_grain(img, amount=10, seed=0):
    rnd = random.Random(seed)
    w, h = img.size
    noise = Image.effect_noise((w, h), amount).convert("L")
    noise_rgb = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(img, noise_rgb, 0.035)

def add_light_streaks(img, seed=0, color=(255, 235, 200)):
    rnd = random.Random(seed)
    w, h = img.size
    overlay = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for _ in range(3):
        x = rnd.randint(0, w)
        y0 = rnd.randint(-int(h * 0.2), int(h * 0.3))
        length = rnd.randint(int(h * 0.6), int(h * 1.2))
        width = rnd.randint(60, 220)
        angle = rnd.uniform(-0.25, 0.25)
        pts = []
        steps = 40
        for i in range(steps + 1):
            t = i / steps
            yy = y0 + length * t
            xx = x + math.sin(angle) * length * t
            pts.append((xx, yy))
        overlay_layer = Image.new("L", (w, h), 0)
        od = ImageDraw.Draw(overlay_layer)
        od.line(pts, fill=90, width=width)
        overlay_layer = overlay_layer.filter(ImageFilter.GaussianBlur(width * 0.4))
        colimg = Image.new("RGB", (w, h), color)
        overlay = Image.composite(colimg, overlay, overlay_layer)
    return Image.blend(img, overlay, 0.06)

def draw_center_mark(draw, w, h, label, seed=0, palette=None):
    rnd = random.Random(seed)
    # abstract silhouette-like shape as a stand-in for a subject
    cx, cy = w * 0.5, h * 0.42
    col = (255, 255, 255)
    # soft glow ellipse
    pass

def make_image(w, h, palette_key, seed, label_top=None, label_mid=None, label_bottom=None,
               font_scale=1.0, streaks=True, out=None, monochrome_tint=None):
    palette = PALETTES[palette_key]
    cx = 0.5 + random.Random(seed).uniform(-0.12, 0.12)
    cy = 0.32 + random.Random(seed + 1).uniform(-0.08, 0.1)
    img = radial_gradient(w, h, palette, cx=cx, cy=cy, seed=seed)
    if streaks:
        img = add_light_streaks(img, seed=seed, color=(255, 226, 190) if palette_key != "nova" else (170, 220, 255))
    img = add_grain(img, seed=seed)
    if monochrome_tint:
        img = ImageEnhance.Color(img).enhance(0.85)
    draw = ImageDraw.Draw(img, "RGBA")

    # subtle abstract "figure" silhouette (soft blurred ellipse cluster) as a
    # tasteful stand-in for a portrait, avoiding any real photography
    fig_layer = Image.new("L", (w, h), 0)
    fd = ImageDraw.Draw(fig_layer)
    fx, fy = w * cx, h * (cy + 0.28)
    fd.ellipse([fx - w * 0.16, fy - h * 0.28, fx + w * 0.16, fy + h * 0.05], fill=140)
    fd.ellipse([fx - w * 0.10, fy - h * 0.40, fx + w * 0.10, fy - h * 0.14], fill=170)
    fig_layer = fig_layer.filter(ImageFilter.GaussianBlur(w * 0.02))
    dark_fig = Image.new("RGB", (w, h), (4, 4, 6))
    img = Image.composite(dark_fig, img, fig_layer)

    draw = ImageDraw.Draw(img, "RGBA")
    # bottom gradient for text legibility
    grad = Image.new("L", (1, h), 0)
    for y in range(h):
        t = y / h
        val = int(255 * max(0, (t - 0.55) / 0.45) ** 1.4) if t > 0.55 else 0
        grad.putpixel((0, y), val)
    grad = grad.resize((w, h))
    black = Image.new("RGB", (w, h), (0, 0, 0))
    img = Image.composite(black, img, grad)

    draw = ImageDraw.Draw(img, "RGBA")
    pad = int(w * 0.06)
    if label_top:
        f = get_font(int(h * 0.028 * font_scale))
        draw.text((pad, pad), label_top.upper(), font=f, fill=(230, 220, 205, 210))
    if label_mid:
        f = get_font(int(h * 0.09 * font_scale))
        draw.text((pad, h * 0.72), label_mid.upper(), font=f, fill=(250, 248, 244, 255))
    if label_bottom:
        f = get_font(int(h * 0.03 * font_scale))
        draw.text((pad, h * 0.72 + int(h * 0.11 * font_scale)), label_bottom, font=f, fill=(200, 190, 178, 220))

    img = img.filter(ImageFilter.SMOOTH)
    if out:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        img.save(out, quality=90)
        print("wrote", out)
    return img

def make_square(size, palette_key, seed, title, subtitle, out):
    img = make_image(size, size, palette_key, seed, label_mid=title, label_bottom=subtitle, streaks=True, out=None)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, quality=90)
    print("wrote", out)

def make_portrait(w, h, palette_key, seed, name, role, out):
    img = make_image(w, h, palette_key, seed, label_mid=name, label_bottom=role, font_scale=0.6, streaks=False, out=None)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, quality=90)
    print("wrote", out)


# ---------------------------------------------------------------------------
# AURORA NOIR assets
# ---------------------------------------------------------------------------
A = os.path.join(ROOT, "aurora-noir")

make_image(1920, 2400, "noir", 1, label_top="Aurora Noir · Live in Cinematic Light",
           label_mid="Aurora Noir", label_bottom="Singer · Songwriter · Live Performer",
           out=os.path.join(A, "hero.jpg"))

make_image(1600, 2000, "noir", 2, label_mid="Aurora Noir", label_bottom="Profile",
           out=os.path.join(A, "profile.jpg"))

make_image(1600, 900, "bronze", 3, label_top="Editorial", label_mid="About", label_bottom="Aurora Noir",
           out=os.path.join(A, "about.jpg"))

# Albums / EP / Singles artwork (square)
make_square(1200, "noir", 10, "Midnight Static", "Album", os.path.join(A, "music", "midnight-static.jpg"))
make_square(1200, "bronze", 11, "Glass Season", "Album", os.path.join(A, "music", "glass-season.jpg"))
make_square(1200, "cinema", 12, "Afterglow", "EP", os.path.join(A, "music", "afterglow-ep.jpg"))
make_square(1200, "noir", 13, "Paper Moons", "Single", os.path.join(A, "music", "paper-moons.jpg"))
make_square(1200, "bronze", 14, "Static & Silk", "Single", os.path.join(A, "music", "static-and-silk.jpg"))
make_square(1200, "cinema", 15, "Low Light", "Single", os.path.join(A, "music", "low-light.jpg"))

# Video posters
make_image(1600, 900, "noir", 20, label_top="Featured Performance", label_mid="Watch Live",
           label_bottom="Glass Season — Live Session", out=os.path.join(A, "video-featured.jpg"))
make_image(1600, 900, "cinema", 21, label_top="Live Session", label_mid="Acoustic Set",
           label_bottom="Paper Moons — Stripped", out=os.path.join(A, "video-acoustic.jpg"))
make_image(1600, 900, "bronze", 22, label_top="Behind The Scenes", label_mid="Studio",
           label_bottom="Making Midnight Static", out=os.path.join(A, "video-studio.jpg"))

# Gallery (mixed categories)
gallery_specs = [
    (1, "noir", "Live"), (2, "bronze", "Live"), (3, "cinema", "Live"),
    (4, "noir", "Editorial"), (5, "bronze", "Editorial"), (6, "cinema", "Editorial"),
    (7, "noir", "Studio"), (8, "bronze", "Studio"),
    (9, "cinema", "Backstage"), (10, "noir", "Backstage"),
    (11, "bronze", "Events"), (12, "cinema", "Events"),
]
for i, pal, cat in gallery_specs:
    make_image(1400, 1750 if i % 3 else 1050, pal, 100 + i, label_top=cat,
               streaks=(i % 2 == 0), out=os.path.join(A, "gallery", f"gallery-{i:02d}.jpg"))

# Band members
band = [
    ("Aurora Noir", "Lead Vocals", "noir", 200),
    ("Alex Morgan", "Guitar", "bronze", 201),
    ("Jordan Blake", "Bass", "cinema", 202),
    ("Ethan Cole", "Drums", "noir", 203),
    ("Maya Reed", "Keys", "bronze", 204),
]
for name, role, pal, seed in band:
    slug = name.lower().replace(" ", "-")
    make_portrait(1000, 1250, pal, seed, name, role, os.path.join(A, "band", f"{slug}.jpg"))

# Press
make_image(1600, 900, "noir", 300, label_top="Press Kit", label_mid="Aurora Noir",
           label_bottom="Electronic Press Kit — 2026", out=os.path.join(A, "press", "press-hero.jpg"))
for i in range(1, 5):
    make_image(1400, 1750, "bronze" if i % 2 else "cinema", 310 + i, label_top="Press Photo",
               out=os.path.join(A, "press", f"press-{i:02d}.jpg"))

# Open Graph
make_image(1200, 630, "noir", 400, label_top="Aurora Noir", label_mid="Aurora Noir",
           label_bottom="Singer · Songwriter · Live Performer", out=os.path.join(A, "og.jpg"))

# ---------------------------------------------------------------------------
# NOVA VALE assets (second artist — lighter, minimal amount to prove multi-artist)
# ---------------------------------------------------------------------------
N = os.path.join(ROOT, "nova-vale")
make_image(1920, 2400, "nova", 500, label_top="Nova Vale · Indie Soul",
           label_mid="Nova Vale", label_bottom="Vocalist · Multi-Instrumentalist",
           out=os.path.join(N, "hero.jpg"))
make_image(1600, 2000, "nova", 501, label_mid="Nova Vale", label_bottom="Profile",
           out=os.path.join(N, "profile.jpg"))
make_image(1600, 900, "nova", 502, label_top="Editorial", label_mid="About", label_bottom="Nova Vale",
           out=os.path.join(N, "about.jpg"))
make_square(1200, "nova", 510, "Sea Glass", "EP", os.path.join(N, "music", "sea-glass.jpg"))
make_square(1200, "nova", 511, "Halflight", "Single", os.path.join(N, "music", "halflight.jpg"))
make_image(1600, 900, "nova", 520, label_top="Featured Performance", label_mid="Watch Live",
           label_bottom="Sea Glass — Live Session", out=os.path.join(N, "video-featured.jpg"))
for i in range(1, 7):
    make_image(1400, 1750 if i % 2 else 1050, "nova", 530 + i, label_top="Gallery",
               out=os.path.join(N, "gallery", f"gallery-{i:02d}.jpg"))
make_image(1200, 630, "nova", 540, label_top="Nova Vale", label_mid="Nova Vale",
           label_bottom="Vocalist · Multi-Instrumentalist", out=os.path.join(N, "og.jpg"))

# Platform / management placeholder
make_image(1920, 1080, "cinema", 600, label_top="Artist Management", label_mid="Our Artists",
           label_bottom="Premium representation for touring musicians",
           out=os.path.join(ROOT, "..", "platform-hero.jpg"))

print("Done generating placeholder assets.")
