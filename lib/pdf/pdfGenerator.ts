import type { Artist } from "@/types/artist";

// ---------------------------------------------------------------------------
// Zero-dependency PDF 1.4 Generator for Wavelength Artist Management.
// Generates standard, high-quality vector PDFs (Letter size: 612 x 792 pt)
// with clean typography, tables, and vector stage plot schematics.
// Compatible with all PDF readers, iOS/Android viewers, and browsers.
// ---------------------------------------------------------------------------

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " "); // Replace non-ASCII printable chars with space for Type 1 Helvetica
}

class SimplePdf {
  private width = 612;
  private height = 792;
  private commands: string[] = [];

  constructor() {}

  // Fill RGB (0 to 1)
  fillColor(r: number, g: number, b: number) {
    this.commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  // Stroke RGB (0 to 1)
  strokeColor(r: number, g: number, b: number) {
    this.commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  lineWidth(w: number) {
    this.commands.push(`${w.toFixed(2)} w`);
  }

  rect(x: number, y: number, w: number, h: number, fill = true, stroke = false) {
    this.commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fill && stroke) this.commands.push("B");
    else if (fill) this.commands.push("f");
    else if (stroke) this.commands.push("S");
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    this.commands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  text(str: string, x: number, y: number, font: "F1" | "F2" = "F1", size = 10) {
    const escaped = escapePdfText(str);
    this.commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj ET`);
  }

  toBuffer(): Buffer {
    const streamContent = this.commands.join("\n");
    const streamLength = Buffer.byteLength(streamContent, "utf-8");

    const objects: string[] = [];

    // Obj 1: Catalog
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

    // Obj 2: Pages
    objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");

    // Obj 3: Page
    objects.push(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`
    );

    // Obj 4: Contents Stream
    objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);

    // Obj 5: Font F1 (Helvetica Regular)
    objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

    // Obj 6: Font F2 (Helvetica Bold)
    objects.push("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");

    let offset = 0;
    const bodyParts: string[] = ["%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"];
    offset += Buffer.byteLength(bodyParts[0], "utf-8");

    const xref: number[] = [0];

    for (const obj of objects) {
      xref.push(offset);
      const piece = obj + "\n";
      bodyParts.push(piece);
      offset += Buffer.byteLength(piece, "utf-8");
    }

    const xrefStart = offset;
    let xrefTable = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < xref.length; i++) {
      xrefTable += String(xref[i]).padStart(10, "0") + " 00000 n \n";
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    bodyParts.push(xrefTable);
    bodyParts.push(trailer);

    return Buffer.from(bodyParts.join(""), "utf-8");
  }
}

// ---------------------------------------------------------------------------
// 1. Technical Rider Generator
// ---------------------------------------------------------------------------

export function generateTechRiderPdf(artist: Artist): Buffer {
  const pdf = new SimplePdf();

  // Top header background
  pdf.fillColor(0.06, 0.06, 0.07); // Dark graphite
  pdf.rect(0, 712, 612, 80, true, false);

  // Gold accent rule
  pdf.fillColor(0.78, 0.62, 0.38); // Bronze gold
  pdf.rect(0, 708, 612, 4, true, false);

  // Top header text
  pdf.fillColor(0.96, 0.96, 0.96);
  pdf.text("WAVELENGTH ARTIST MANAGEMENT", 40, 755, "F2", 10);
  pdf.text("OFFICIAL TECHNICAL & HOSPITALITY RIDER", 40, 735, "F2", 15);
  pdf.fillColor(0.78, 0.62, 0.38);
  pdf.text("PRODUCTION SPECIFICATION SHEET", 400, 755, "F2", 8);

  // Artist Banner
  pdf.fillColor(0.97, 0.97, 0.98);
  pdf.rect(40, 640, 532, 55, true, true);
  pdf.strokeColor(0.88, 0.88, 0.9);
  pdf.lineWidth(1);

  pdf.fillColor(0.1, 0.1, 0.1);
  pdf.text(`ARTIST: ${artist.stageName || artist.name}`, 55, 672, "F2", 14);
  pdf.fillColor(0.4, 0.4, 0.4);
  pdf.text(`Genre: ${artist.genre || "Live Performance"}   |   Roster ID: ${artist.slug}`, 55, 654, "F1", 9);
  pdf.text(`Document Version: 2026.1   |   Valid for all upcoming tour dates`, 320, 654, "F1", 9);

  // Section 1: Performance Formats & Lineup
  pdf.fillColor(0.12, 0.12, 0.15);
  pdf.text("1. PERFORMANCE FORMATS & LINEUP REQUIREMENTS", 40, 615, "F2", 11);
  pdf.strokeColor(0.78, 0.62, 0.38);
  pdf.line(40, 608, 572, 608);

  let yPos = 590;
  const formats = artist.performanceFormats.length > 0
    ? artist.performanceFormats
    : [
        { id: "full-band", name: "Full Live Band", lineup: "Vocals, Guitars, Bass, Keys, Drums (4-5 members)", style: "High-energy live sound", suitableFor: ["Festivals", "Concert Halls"] },
        { id: "acoustic", name: "Acoustic / Trio", lineup: "Lead Vocals, Acoustic Guitar, Keys/Percussion", style: "Intimate acoustic set", suitableFor: ["Private Events", "Lounges"] },
      ];

  for (const fmt of formats.slice(0, 2)) {
    pdf.fillColor(0.15, 0.15, 0.15);
    pdf.text(`• ${fmt.name}:`, 50, yPos, "F2", 9.5);
    pdf.fillColor(0.35, 0.35, 0.35);
    pdf.text(`Lineup: ${fmt.lineup}`, 145, yPos, "F1", 9);
    yPos -= 14;
    pdf.text(`  Style & Acoustics: ${fmt.style} (Recommended for: ${fmt.suitableFor?.join(", ") || "Concerts"})`, 50, yPos, "F1", 8.5);
    yPos -= 18;
  }

  // Section 2: Audio & Technical Requirements
  yPos -= 5;
  pdf.fillColor(0.12, 0.12, 0.15);
  pdf.text("2. AUDIO & FOH (FRONT OF HOUSE) SPECIFICATIONS", 40, yPos, "F2", 11);
  pdf.strokeColor(0.78, 0.62, 0.38);
  pdf.line(40, yPos - 5, 572, yPos - 5);

  yPos -= 22;
  const techPoints = [
    "PA System: Professional tri-amped stereo sound reinforcement capable of 105dB SPL un-distorted at mix position.",
    "FOH Console: Digital console with min. 24 channels (Yamaha CL/QL series, Allen & Heath dLive, or Digico preferred).",
    "Monitoring: 4 discrete bi-amped floor wedge mixes + stereo IEM (In-Ear Monitor) transmitter support.",
    "Mics & DIs: Shure Beta 58A / SM58 for vocals, SM57 / Sennheiser e906 for instruments, BSS or Radial active DIs.",
    "Power: 3 separate 20-Amp isolated 110V/220V circuits on stage (Upstage, Stage Left, Stage Right).",
  ];

  for (const pt of techPoints) {
    pdf.fillColor(0.2, 0.2, 0.2);
    pdf.text("▪", 50, yPos, "F2", 8);
    pdf.text(pt, 62, yPos, "F1", 8.5);
    yPos -= 16;
  }

  // Section 3: Standard Input Channel List Table
  yPos -= 8;
  pdf.fillColor(0.12, 0.12, 0.15);
  pdf.text("3. INPUT CHANNEL ASSIGNMENT & PATCH LIST", 40, yPos, "F2", 11);
  pdf.strokeColor(0.78, 0.62, 0.38);
  pdf.line(40, yPos - 5, 572, yPos - 5);

  yPos -= 22;

  // Table header
  pdf.fillColor(0.9, 0.92, 0.95);
  pdf.rect(40, yPos - 3, 532, 16, true, false);
  pdf.fillColor(0.1, 0.1, 0.1);
  pdf.text("CH", 48, yPos + 2, "F2", 8);
  pdf.text("INPUT / INSTRUMENT", 80, yPos + 2, "F2", 8);
  pdf.text("TRANSDUCER / MIC", 220, yPos + 2, "F2", 8);
  pdf.text("STAND / PLACEMENT", 340, yPos + 2, "F2", 8);
  pdf.text("+48V", 450, yPos + 2, "F2", 8);
  pdf.text("MONITOR MIX", 495, yPos + 2, "F2", 8);

  const channels = [
    { ch: "01", name: "Kick Drum", mic: "Shure Beta 52A / Audix D6", stand: "Short Boom", p48: "No", mon: "Mix 4 (Drum)" },
    { ch: "02", name: "Snare Top", mic: "Shure SM57", stand: "Short Boom / Clip", p48: "No", mon: "Mix 4 (Drum)" },
    { ch: "03", name: "Hi-Hat / Perc", mic: "AKG C451 / Shure SM81", stand: "Tall Boom", p48: "Yes", mon: "Mix 4 (Drum)" },
    { ch: "04", name: "Bass Guitar", mic: "Active DI (Radial / BSS)", stand: "Stage Right Direct", p48: "Yes", mon: "Mix 3 (Bass)" },
    { ch: "05", name: "Electric Guitar", mic: "Shure SM57 / e906", stand: "Short Boom", p48: "No", mon: "Mix 2 (Guitar)" },
    { ch: "06", name: "Acoustic Guitar", mic: "Active DI Box", stand: "Center Direct", p48: "Yes", mon: "Mix 1 (Lead)" },
    { ch: "07", name: "Keyboard / Synth L", mic: "Radial Stereo DI", stand: "Stage Left Direct", p48: "Yes", mon: "Mix 2 (Keys)" },
    { ch: "08", name: "Keyboard / Synth R", mic: "Radial Stereo DI", stand: "Stage Left Direct", p48: "Yes", mon: "Mix 2 (Keys)" },
    { ch: "09", name: "Lead Vocal", mic: "Shure Beta 58A / Wireless", stand: "Tall Round Base", p48: "No", mon: "Mix 1 (Lead)" },
    { ch: "10", name: "Backing Vocal (Keys)", mic: "Shure SM58", stand: "Tall Boom", p48: "No", mon: "Mix 2 (Keys)" },
  ];

  yPos -= 16;
  for (let i = 0; i < channels.length; i++) {
    const item = channels[i];
    if (i % 2 === 0) {
      pdf.fillColor(0.97, 0.97, 0.98);
      pdf.rect(40, yPos - 2, 532, 13, true, false);
    }
    pdf.fillColor(0.2, 0.2, 0.2);
    pdf.text(item.ch, 48, yPos + 1, "F2", 7.5);
    pdf.text(item.name, 80, yPos + 1, "F1", 7.5);
    pdf.text(item.mic, 220, yPos + 1, "F1", 7.5);
    pdf.text(item.stand, 340, yPos + 1, "F1", 7.5);
    pdf.text(item.p48, 455, yPos + 1, "F1", 7.5);
    pdf.text(item.mon, 495, yPos + 1, "F1", 7.5);
    yPos -= 13;
  }

  // Footer notes & contact
  pdf.fillColor(0.95, 0.95, 0.96);
  pdf.rect(40, 48, 532, 40, true, false);
  pdf.fillColor(0.3, 0.3, 0.3);
  pdf.text("PRODUCTION CONTACT & QUESTIONS:", 50, 76, "F2", 8);
  const pressEmail = artist.contactInformation?.bookings?.email || artist.contactInformation?.press?.email || "production@wavelength.com";
  pdf.text(`Email: ${pressEmail}   |   All rider deviations must be approved in writing at least 7 days prior to show.`, 50, 60, "F1", 7.5);

  // Bottom rule
  pdf.strokeColor(0.85, 0.85, 0.85);
  pdf.line(40, 40, 572, 40);
  pdf.fillColor(0.55, 0.55, 0.55);
  pdf.text("Wavelength Artist Management  •  Confidential Technical Rider  •  Page 1 of 1", 160, 28, "F1", 7.5);

  return pdf.toBuffer();
}

// ---------------------------------------------------------------------------
// 2. Stage Plot Generator
// ---------------------------------------------------------------------------

export function generateStagePlotPdf(artist: Artist): Buffer {
  const pdf = new SimplePdf();

  // Top header background
  pdf.fillColor(0.06, 0.06, 0.07);
  pdf.rect(0, 712, 612, 80, true, false);

  // Gold accent rule
  pdf.fillColor(0.78, 0.62, 0.38);
  pdf.rect(0, 708, 612, 4, true, false);

  // Top header text
  pdf.fillColor(0.96, 0.96, 0.96);
  pdf.text("WAVELENGTH ARTIST MANAGEMENT", 40, 755, "F2", 10);
  pdf.text("OFFICIAL STAGE PLOT & TECHNICAL SCHEMATIC", 40, 735, "F2", 15);
  pdf.fillColor(0.78, 0.62, 0.38);
  pdf.text("LIVE STAGE LAYOUT", 450, 755, "F2", 8);

  // Artist info line
  pdf.fillColor(0.97, 0.97, 0.98);
  pdf.rect(40, 655, 532, 40, true, true);
  pdf.strokeColor(0.88, 0.88, 0.9);
  pdf.lineWidth(1);

  pdf.fillColor(0.1, 0.1, 0.1);
  pdf.text(`ARTIST: ${artist.stageName || artist.name}`, 55, 678, "F2", 13);
  pdf.fillColor(0.4, 0.4, 0.4);
  pdf.text(`Standard Live Band Configuration (Min Stage Size: 24ft W x 16ft D)`, 55, 664, "F1", 8.5);

  // Stage Boundary Container
  const stageX = 40;
  const stageY = 260;
  const stageW = 532;
  const stageH = 370;

  // Stage flooring / background
  pdf.fillColor(0.98, 0.98, 0.99);
  pdf.rect(stageX, stageY, stageW, stageH, true, false);

  // Stage outer boundary
  pdf.strokeColor(0.25, 0.25, 0.3);
  pdf.lineWidth(2);
  pdf.rect(stageX, stageY, stageW, stageH, false, true);

  // UPSTAGE LABEL (Back)
  pdf.fillColor(0.4, 0.4, 0.4);
  pdf.text("▲  UPSTAGE / BACK WALL (POWER DROPS 1 & 2)  ▲", 175, stageY + stageH - 18, "F2", 9);

  // DOWNSTAGE LABEL (Front / Audience)
  pdf.fillColor(0.78, 0.62, 0.38);
  pdf.rect(stageX, stageY, stageW, 20, true, false);
  pdf.fillColor(1, 1, 1);
  pdf.text("▼  DOWNSTAGE EDGE / AUDIENCE  ▼", 205, stageY + 6, "F2", 9);

  // STAGE POSITIONS & SCHEMATICS

  // 1. DRUMS (Upstage Center)
  pdf.fillColor(0.88, 0.9, 0.94);
  pdf.rect(235, 500, 140, 95, true, true);
  pdf.strokeColor(0.4, 0.5, 0.65);
  pdf.lineWidth(1);
  pdf.rect(235, 500, 140, 95, false, true);
  pdf.fillColor(0.1, 0.15, 0.25);
  pdf.text("DRUM RISER", 275, 575, "F2", 10);
  pdf.text("(8ft x 8ft x 1ft)", 280, 560, "F1", 8);
  pdf.text("• Drum Kit & Cymbals", 245, 540, "F1", 8);
  pdf.text("• Ch 1-3 Mics + Drum Monitor", 245, 525, "F1", 7.5);
  pdf.text("• AC Power Drop #1", 245, 510, "F2", 7.5);

  // 2. KEYS / SYNTH (Upstage Left / Stage Left)
  pdf.fillColor(0.92, 0.94, 0.88);
  pdf.rect(420, 430, 130, 80, true, true);
  pdf.strokeColor(0.5, 0.6, 0.4);
  pdf.rect(420, 430, 130, 80, false, true);
  pdf.fillColor(0.15, 0.25, 0.1);
  pdf.text("KEYS / SYNTH", 450, 492, "F2", 9.5);
  pdf.text("• Stereo DI (Ch 7-8)", 430, 475, "F1", 8);
  pdf.text("• Vocal Mic (Ch 10)", 430, 460, "F1", 8);
  pdf.text("• Wedge Mix #2 + AC", 430, 445, "F1", 8);

  // 3. BASS GUITAR & AMP (Stage Right)
  pdf.fillColor(0.95, 0.9, 0.9);
  pdf.rect(60, 430, 120, 80, true, true);
  pdf.strokeColor(0.65, 0.45, 0.45);
  pdf.rect(60, 430, 120, 80, false, true);
  pdf.fillColor(0.25, 0.1, 0.1);
  pdf.text("BASS RIG", 95, 492, "F2", 9.5);
  pdf.text("• Bass Amp / Cab", 70, 475, "F1", 8);
  pdf.text("• Active DI Box (Ch 4)", 70, 460, "F1", 8);
  pdf.text("• Wedge Mix #3 + AC", 70, 445, "F1", 8);

  // 4. GUITAR AMP (Upstage Right-Center)
  pdf.fillColor(0.93, 0.91, 0.96);
  pdf.rect(100, 525, 100, 55, true, true);
  pdf.strokeColor(0.55, 0.45, 0.65);
  pdf.rect(100, 525, 100, 55, false, true);
  pdf.fillColor(0.2, 0.1, 0.3);
  pdf.text("GUITAR AMP", 120, 563, "F2", 8.5);
  pdf.text("• 2x12 Combo / Cab", 110, 548, "F1", 7.5);
  pdf.text("• Mic: SM57 / e906", 110, 535, "F1", 7.5);

  // 5. LEAD VOCAL & ACOUSTIC (Downstage Center)
  pdf.fillColor(0.99, 0.94, 0.85);
  pdf.rect(235, 305, 140, 80, true, true);
  pdf.strokeColor(0.78, 0.62, 0.38);
  pdf.lineWidth(1.5);
  pdf.rect(235, 305, 140, 80, false, true);
  pdf.fillColor(0.3, 0.2, 0.05);
  pdf.text("LEAD VOCAL / FRONT", 250, 368, "F2", 9.5);
  pdf.text("• Wireless Beta 58A (Ch 9)", 245, 350, "F1", 8);
  pdf.text("• Acoustic Guitar DI (Ch 6)", 245, 335, "F1", 8);
  pdf.text("• Monitor Mix #1 (Center Wedge)", 245, 320, "F2", 7.5);

  // Monitor Wedges (Triangles/trapezoids represented cleanly)
  pdf.fillColor(0.2, 0.2, 0.2);
  pdf.rect(265, 285, 80, 14, true, false);
  pdf.fillColor(1, 1, 1);
  pdf.text("MONITOR 1 (WEDGE)", 272, 290, "F2", 6.5);

  pdf.fillColor(0.2, 0.2, 0.2);
  pdf.rect(80, 408, 80, 14, true, false);
  pdf.fillColor(1, 1, 1);
  pdf.text("MONITOR 3 (BASS)", 87, 413, "F2", 6.5);

  pdf.fillColor(0.2, 0.2, 0.2);
  pdf.rect(445, 408, 80, 14, true, false);
  pdf.fillColor(1, 1, 1);
  pdf.text("MONITOR 2 (KEYS)", 452, 413, "F2", 6.5);

  // Band Members / Lineup Legend Below Stage
  pdf.fillColor(0.12, 0.12, 0.15);
  pdf.text("STAGE PERSONNEL & BAND ROSTER", 40, 235, "F2", 10);
  pdf.strokeColor(0.78, 0.62, 0.38);
  pdf.line(40, 228, 572, 228);

  let memberY = 215;
  const members = artist.bandMembers?.length > 0
    ? artist.bandMembers
    : [
        { id: "1", name: artist.stageName || artist.name, role: "Lead Vocalist & Rhythm Guitar", photo: "", bio: "" },
        { id: "2", name: "Touring Musician", role: "Bass & Background Vocals", photo: "", bio: "" },
        { id: "3", name: "Touring Musician", role: "Keyboards & Synth", photo: "", bio: "" },
        { id: "4", name: "Touring Musician", role: "Drums & Percussion", photo: "", bio: "" },
      ];

  for (let i = 0; i < Math.min(members.length, 4); i++) {
    const m = members[i];
    pdf.fillColor(0.2, 0.2, 0.2);
    pdf.text(`Position ${i + 1}: ${m.name}`, 50, memberY, "F2", 8.5);
    pdf.fillColor(0.4, 0.4, 0.4);
    pdf.text(`— Role: ${m.role}`, 220, memberY, "F1", 8.5);
    memberY -= 14;
  }

  // Footer notes & contact
  pdf.fillColor(0.95, 0.95, 0.96);
  pdf.rect(40, 48, 532, 40, true, false);
  pdf.fillColor(0.3, 0.3, 0.3);
  pdf.text("PRODUCTION REQUIREMENTS NOTE:", 50, 76, "F2", 8);
  pdf.text("All risers, AC drops, and monitor wedges must be set, patched, and line-checked prior to artist sound check.", 50, 62, "F1", 7.5);

  // Bottom rule
  pdf.strokeColor(0.85, 0.85, 0.85);
  pdf.line(40, 40, 572, 40);
  pdf.fillColor(0.55, 0.55, 0.55);
  pdf.text("Wavelength Artist Management  •  Confidential Stage Plot  •  Page 1 of 1", 165, 28, "F1", 7.5);

  return pdf.toBuffer();
}
