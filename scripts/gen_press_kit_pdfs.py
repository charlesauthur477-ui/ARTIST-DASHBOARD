#!/usr/bin/env python3
"""Generate simple placeholder EPK PDFs for demo artists."""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "artists")

def make_epk(path, name, tagline, bio, highlights, contact_email):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    c = canvas.Canvas(path, pagesize=letter)
    w, h = letter
    bg = HexColor("#0b0a09")
    gold = HexColor("#b98d4f")
    fg = HexColor("#f4f1ea")
    muted = HexColor("#8f897d")

    c.setFillColor(bg)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(gold)
    c.setFont("Helvetica", 10)
    c.drawString(0.85 * inch, h - 0.9 * inch, "ELECTRONIC PRESS KIT")

    c.setFillColor(fg)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(0.85 * inch, h - 1.4 * inch, name)

    c.setFillColor(gold)
    c.setFont("Helvetica", 13)
    c.drawString(0.85 * inch, h - 1.75 * inch, tagline)

    c.setStrokeColor(gold)
    c.line(0.85 * inch, h - 2.0 * inch, w - 0.85 * inch, h - 2.0 * inch)

    text = c.beginText(0.85 * inch, h - 2.5 * inch)
    text.setFont("Helvetica", 10.5)
    text.setFillColor(fg)
    text.setLeading(15)
    import textwrap
    for para in bio.split("\n\n"):
        for line in textwrap.wrap(para, 92):
            text.textLine(line)
        text.textLine("")
    c.drawText(text)

    y = h - 5.6 * inch
    c.setFillColor(gold)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.85 * inch, y, "CAREER HIGHLIGHTS")
    y -= 0.28 * inch
    c.setFont("Helvetica", 10)
    c.setFillColor(fg)
    for hl in highlights:
        c.drawString(1.0 * inch, y, f"-  {hl}")
        y -= 0.24 * inch

    c.setFillColor(muted)
    c.setFont("Helvetica", 9)
    c.drawString(0.85 * inch, 0.9 * inch, f"Contact: {contact_email}")
    c.drawString(0.85 * inch, 0.72 * inch, "This is a demo press kit generated for development purposes.")

    c.showPage()
    c.save()
    print("wrote", path)


make_epk(
    os.path.join(ROOT, "aurora-noir", "press", "aurora-noir-epk.pdf"),
    "AURORA NOIR",
    "Singer / Songwriter / Live Performer",
    "Aurora Noir makes music for the hour between midnight and morning - alternative pop built on cinematic synths, live strings, and a distinctive vocal tone.\n\nSince her debut EP in 2021, she has built a devoted audience across festivals, private events, and late-night listening rooms, known equally for the atmosphere of her studio releases and the intensity of her live shows.\n\nAurora Noir is represented for concerts, weddings, corporate events, festivals, clubs, colleges, private events, and brand activations worldwide.",
    [
        "2 studio albums, 1 EP, and 8 singles released independently",
        "150+ live performances across 12 countries",
        "Featured performer at Neon Horizon Festival (2024, 2025)",
        "Music supervised for two independent feature films",
    ],
    "press@auroranoir-demo.com",
)

make_epk(
    os.path.join(ROOT, "nova-vale", "press-kit-placeholder.pdf"),
    "NOVA VALE",
    "Vocalist / Multi-Instrumentalist",
    "Nova Vale blends indie soul with neo-folk instrumentation - warm vocals, acoustic guitar, and understated electronic production.\n\nSince emerging in 2023, Nova has built an audience through intimate listening-room shows and a string of independently released singles.",
    [
        "1 EP and 4 singles released independently",
        "40+ live performances across 6 countries",
        "Featured on two boutique European festival line-ups",
    ],
    "press@novavale-demo.com",
)
