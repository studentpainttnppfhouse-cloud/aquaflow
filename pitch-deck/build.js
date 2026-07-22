const pptxgen = require("pptxgenjs");
const p = new pptxgen();

// ---- Canvas: 1920x1080 -> 13.333 x 7.5 in ----
p.defineLayout({ name: "AQUA", width: 13.333, height: 7.5 });
p.layout = "AQUA";
const W = 13.333, H = 7.5;
const px = (n) => (n * W) / 1920; // px(1920)=W

// ---- Palette (no #) ----
const C = {
  khlong: "0F3D3E",
  paddy: "1B7A6B",
  gauge: "D62828",
  drought: "E3B23C",
  sluice: "EDEEE9",
  ink: "0A1F20",
  // tints of palette members (not new hues) for low-emphasis text
  onDarkDim: "6FA093",   // lightened khlong/paddy
  onLightDim: "5C7A72",  // darkened paddy
  panelDark: "13494A",   // khlong, one step up
  panelLight: "E3E5DE",  // sluice, one step down
};

// ---- Fonts ----
const F = { disp: "Chakra Petch", body: "Anuphan", mono: "IBM Plex Mono" };

const TOTAL = 19;

// ---------- Gauge rail (the motif) ----------
function rail(s, n, dark) {
  const top = px(70), bot = H - px(70), rh = bot - top;
  const rx = px(48), rw = px(14);
  const trackColor = dark ? C.panelDark : C.panelLight;
  const numColor = dark ? C.sluice : C.ink;
  const dimNum = dark ? C.onDarkDim : C.onLightDim;
  // track
  s.addShape(p.ShapeType.rect, { x: rx, y: top, w: rw, h: rh, fill: { color: trackColor }, line: { type: "none" } });
  // gradations (ticks) every 10%
  for (let i = 0; i <= 10; i++) {
    const y = bot - (i / 10) * rh;
    const long = i % 5 === 0;
    s.addShape(p.ShapeType.line, {
      x: rx + rw, y, w: long ? px(20) : px(11), h: 0,
      line: { color: dimNum, width: long ? 1.2 : 0.7 },
    });
  }
  // water fill rising with slide number
  const frac = n / TOTAL;
  const fh = frac * rh;
  s.addShape(p.ShapeType.rect, { x: rx, y: bot - fh, w: rw, h: fh, fill: { color: C.paddy }, line: { type: "none" } });
  // water surface line
  s.addShape(p.ShapeType.line, { x: rx - px(4), y: bot - fh, w: rw + px(8), h: 0, line: { color: C.drought, width: 1.6 } });
  // fixed flood line near top (the red gauge line)
  const floodY = top + rh * 0.08;
  s.addShape(p.ShapeType.line, { x: rx - px(6), y: floodY, w: rw + px(12), h: 0, line: { color: C.gauge, width: 2.2, dashType: "dash" } });
  // reading: slide number as gauge reading, beside water surface
  s.addText(String(n).padStart(2, "0"), {
    x: rx + rw + px(6), y: bot - fh - px(30), w: px(120), h: px(60),
    fontFace: F.mono, fontSize: 15, bold: true, color: numColor, align: "left", valign: "middle", margin: 0,
  });
  s.addText(`/${TOTAL}`, {
    x: rx + rw + px(6), y: bot - fh + px(16), w: px(120), h: px(34),
    fontFace: F.mono, fontSize: 9, color: dimNum, align: "left", valign: "middle", margin: 0, charSpacing: 2,
  });
}

// ---------- layered offset section header ----------
function header(s, thai, en, dark, y) {
  const x = px(180);
  const solid = dark ? C.sluice : C.khlong;
  const ghost = dark ? C.panelDark : C.panelLight;
  const yy = y == null ? px(120) : y;
  const opt = { fontFace: F.disp, bold: true, fontSize: 46, align: "left", valign: "top", margin: 0, charSpacing: -1, w: px(1500), h: px(150) };
  // ghost copy (offset 8px)
  s.addText(thai, { ...opt, x: x + px(8), y: yy + px(8), color: ghost });
  // solid copy
  s.addText(thai, { ...opt, x, y: yy, color: solid });
  if (en) s.addText(en, {
    x, y: yy + px(120), w: px(1500), h: px(40),
    fontFace: F.mono, fontSize: 13, color: dark ? C.onDarkDim : C.paddy, charSpacing: 3, align: "left", margin: 0,
  });
}

function bg(s, color) {
  s.background = { color };
}

// Thai detection — IBM Plex Mono has no Thai glyphs, so any Thai string must use Anuphan.
const hasThai = (t) => /[฀-๿]/.test(String(t));

// caption/label helper (mono for Latin, Anuphan for Thai/mixed)
function label(s, txt, o) {
  const face = hasThai(txt) ? F.body : F.mono;
  s.addText(txt, { fontFace: face, fontSize: 11, charSpacing: hasThai(txt) ? 1 : 3, align: "left", margin: 0, ...o });
}

// =====================================================================
// 01 — WORDMARK
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 1, true);
  s.addText("ชลชาญ", { x: px(180), y: px(330), w: px(1600), h: px(320), fontFace: F.disp, bold: true, fontSize: 150, color: C.sluice, align: "center", valign: "middle", margin: 0, charSpacing: -2 });
  s.addText("AquaFlow", { x: px(180), y: px(650), w: px(1600), h: px(90), fontFace: F.mono, fontSize: 30, color: C.drought, align: "center", valign: "middle", margin: 0, charSpacing: 14 });
  label(s, "ระบบประสานงานสูบน้ำและประตูระบายน้ำ · กรุงเทพมหานคร", { x: px(180), y: px(760), w: px(1600), h: px(40), color: C.onDarkDim, align: "center" });
  s.addNotes("ชลชาญ / AquaFlow. Let the name sit ~3 seconds while you introduce the team. No tagline read aloud.");
}

// =====================================================================
// 02 — PROBLEM (two facets, one statistic each)
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.sluice);
  rail(s, 2, false);
  header(s, "ปัญหา", "PROBLEM", false, px(90));
  const colY = px(320), colH = px(430);
  // left col
  const lx = px(200), cw = px(720);
  label(s, "น้ำ · COORDINATION", { x: lx, y: colY, w: cw, h: px(40), color: C.paddy });
  s.addText("~190", { x: lx, y: colY + px(40), w: cw, h: px(180), fontFace: F.mono, bold: true, fontSize: 130, color: C.khlong, align: "left", valign: "middle", margin: 0 });
  s.addText("สถานีสูบน้ำและประตูระบายน้ำทั่วกรุงเทพฯ ต่างคนต่างสูบ — สวนจังหวะน้ำขึ้นของแม่น้ำเจ้าพระยา ระบายน้ำเขตหนึ่งลงอีกเขต", {
    x: lx, y: colY + px(230), w: cw, h: px(150), fontFace: F.body, fontSize: 21, color: C.ink, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.35,
  });
  // divider
  s.addShape(p.ShapeType.line, { x: px(985), y: colY, w: 0, h: colH, line: { color: C.panelLight, width: 1.4 } });
  // right col
  const rxx = px(1050), rcw = px(760);
  label(s, "เงิน · CONSEQUENCE", { x: rxx, y: colY, w: rcw, h: px(40), color: C.paddy });
  s.addText("1.44", { x: rxx, y: colY + px(40), w: rcw, h: px(180), fontFace: F.mono, bold: true, fontSize: 130, color: C.gauge, align: "left", valign: "middle", margin: 0 });
  s.addText("ล้านล้านบาท", { x: rxx, y: colY + px(215), w: rcw, h: px(50), fontFace: F.body, bold: true, fontSize: 26, color: C.gauge, align: "left", margin: 0 });
  s.addText("ความเสียหายจากมหาอุทกภัย 2554 — ต้นทุนของการระบายน้ำที่ไม่ประสานกัน", {
    x: rxx, y: colY + px(275), w: rcw, h: px(120), fontFace: F.body, fontSize: 21, color: C.ink, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.35,
  });
  label(s, "ที่มา: สำนักการระบายน้ำ กทม. · World Bank (2012)", { x: px(200), y: H - px(90), w: px(1600), h: px(34), color: C.onLightDim });
  s.addNotes("One statistic per column. Left = the coordination gap (190 independent stations). Right = the cost of not coordinating (2011 flood, ~1.44 trillion THB, World Bank). Gauge red used once, on the money figure.");
}

// =====================================================================
// 03 — BORROWED VOICE (photo slot -> khlong bg, replace with operator photo)
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 3, true);
  label(s, "เสียงจากพื้นที่ · BORROWED VOICE", { x: px(200), y: px(150), w: px(1400), h: px(40), color: C.drought });
  s.addText("“เวลาฝนลงพร้อมกันหลายเขต เราสั่งสูบทีละสถานีทางวิทยุ — กว่าจะรู้ว่าปลายน้ำรับไม่ไหว อีกเขตก็ท่วมไปแล้ว”", {
    x: px(200), y: px(300), w: px(1480), h: px(300), fontFace: F.disp, bold: true, fontSize: 40, color: C.sluice, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.3,
  });
  s.addText("— [ตัวอย่างเสียงจากพื้นที่ · แทนที่ด้วยบทสัมภาษณ์จริงจากเจ้าหน้าที่สำนักการระบายน้ำ ก่อนพิตช์]", {
    x: px(200), y: px(640), w: px(1480), h: px(60), fontFace: F.body, fontSize: 20, italic: true, color: C.onDarkDim, align: "left", margin: 0,
  });
  s.addNotes("Placeholder quote — replace with ONE real interview before pitching (per brief). A real operator/resident quote is worth 10x a written one. Photo slot: drop operator/command-center photo full-bleed behind the scrim.");
}

// =====================================================================
// 04 — PURE IMAGE (breathing slide) — zero text
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 4, true);
  // Flooded city at dusk — full-bleed composition. horizon at 52%.
  const horizon = H * 0.52;
  // dusk glow band just above the horizon (drought, faint)
  s.addShape(p.ShapeType.rect, { x: 0, y: horizon - px(150), w: W, h: px(150), fill: { color: C.drought, transparency: 82 }, line: { type: "none" } });
  s.addShape(p.ShapeType.rect, { x: 0, y: horizon - px(70), w: W, h: px(70), fill: { color: C.drought, transparency: 68 }, line: { type: "none" } });
  // skyline silhouette sitting on the horizon
  const bld = [[0.10,150,90],[0.16,240,110],[0.23,180,80],[0.30,320,120],[0.40,220,100],[0.52,380,140],[0.63,260,110],[0.72,300,120],[0.82,200,90],[0.90,150,80]];
  bld.forEach(([fx,h,w]) => {
    const bx = W * fx - px(w) / 2, by = horizon - px(h);
    s.addShape(p.ShapeType.rect, { x: bx, y: by, w: px(w), h: px(h), fill: { color: "0A2E2F" }, line: { type: "none" } });
    // reflection in the water (fainter, inverted)
    s.addShape(p.ShapeType.rect, { x: bx, y: horizon, w: px(w), h: px(h * 0.5), fill: { color: "0A2E2F", transparency: 55 }, line: { type: "none" } });
  });
  // water plane
  s.addShape(p.ShapeType.rect, { x: 0, y: horizon, w: W, h: H - horizon, fill: { color: C.paddy, transparency: 30 }, line: { type: "none" } });
  // clean ripple lines
  for (let i = 1; i <= 3; i++) s.addShape(p.ShapeType.line, { x: px(220), y: horizon + i * px(120), w: W - px(440), h: 0, line: { color: C.sluice, width: 0.75, transparency: 72 } });
  // staff gauge pole standing in the flood (motif) — left of centre
  const px0 = px(520), pw = px(46), ptop = horizon - px(260), pbot = H - px(70);
  s.addShape(p.ShapeType.rect, { x: px0, y: ptop, w: pw, h: pbot - ptop, fill: { color: C.sluice }, line: { color: C.ink, width: 1 } });
  const bands = 12, ph = pbot - ptop;
  for (let i = 0; i < bands; i++) if (i % 2 === 0) s.addShape(p.ShapeType.rect, { x: px0, y: ptop + (i / bands) * ph, w: pw, h: ph / bands, fill: { color: C.gauge }, line: { type: "none" } });
  // waterline across the pole + red flood line above it
  s.addShape(p.ShapeType.line, { x: px0 - px(60), y: horizon, w: px(160), h: 0, line: { color: C.drought, width: 2.4 } });
  s.addShape(p.ShapeType.line, { x: px0 - px(60), y: ptop + ph * 0.22, w: px(160), h: 0, line: { color: C.gauge, width: 2.4, dashType: "dash" } });
  s.addNotes("Zero text. The breath before the pivot — a flooded city at dusk with the gauge pole submerged past its flood line. Optional: replace with the full-bleed Higgsfield photo (flood.png, image #1 in IMAGES.md).");
}

// =====================================================================
// 05 — THE PIVOT
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 5, true);
  s.addText("แล้วเราจะทำอะไรได้บ้าง?", { x: px(180), y: px(420), w: px(1600), h: px(220), fontFace: F.disp, bold: true, fontSize: 60, color: C.sluice, align: "center", valign: "middle", margin: 0, charSpacing: -1 });
  s.addText("So what can we actually do?", { x: px(180), y: px(650), w: px(1600), h: px(60), fontFace: F.mono, fontSize: 20, color: C.onDarkDim, align: "center", margin: 0, charSpacing: 4 });
  s.addNotes("The hinge of the deck. Ask it, then let it sit — force the room to attempt an answer before you give one. Do not rush off this slide.");
}

// =====================================================================
// 06 / 07 / 08 — PROCESS (one sentence each)
// =====================================================================
function process(n, marker, thai, en) {
  const s = p.addSlide(); bg(s, C.sluice);
  rail(s, n, false);
  // big marker number
  s.addText(marker, { x: px(180), y: px(140), w: px(400), h: px(260), fontFace: F.mono, bold: true, fontSize: 150, color: C.panelLight, align: "left", valign: "top", margin: 0 });
  label(s, "วิธีการ · PROCESS", { x: px(200), y: px(150), w: px(600), h: px(40), color: C.paddy });
  s.addText(thai, { x: px(200), y: px(430), w: px(1420), h: px(260), fontFace: F.disp, bold: true, fontSize: 34, color: C.khlong, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.3 });
  s.addText(en, { x: px(200), y: H - px(150), w: px(1400), h: px(70), fontFace: F.body, fontSize: 20, italic: true, color: C.onLightDim, align: "left", margin: 0, lineSpacingMultiple: 1.3 });
  return s;
}
{
  const s = process(6, "01", "รวม ~190 สถานีที่ต่างคนต่างสูบ มาไว้ในแผนที่เครือข่ายเดียว เห็นสถานะน้ำทั้งเมืองพร้อมกัน",
    "We pull ~190 independently-run pump stations and floodgates into one live network map.");
  s.addNotes("Process 01 — one sentence, the map carries the rest. Test: can a judge repeat all three steps back after one viewing?");
}
{
  const s = process(7, "02", "ตัวจัดแผนอ่านฝนพยากรณ์รายสถานี + จังหวะน้ำขึ้นลง แล้วจัดคิวสูบแบบประสาน ไม่ให้ทุกสถานีระบายลงจุดเดียวพร้อมกัน",
    "The planner reads per-station rain forecast + tide, then staggers pumping so stations sharing a downstream node never dump at once.");
  s.addNotes("Process 02 — the coordination rule (anti 'move-the-flood-elsewhere').");
}
{
  const s = process(8, "03", "เจ้าหน้าที่กด ‘ดูเหตุผล’ แล้ว ‘อนุมัติ’ — หรือให้ทำกึ่งอัตโนมัติ ประชาชนเห็นผลในแอปทันที แดง → เขียว",
    "The operator taps ‘see why’ then ‘approve’ — or pre-authorizes semi-auto. Citizens watch their district ease red → green, live.");
  s.addNotes("Process 03 — human-in-the-loop + the citizen mirror. Same shared live state, two honest views.");
}

// =====================================================================
// 09 — APPLICATION divider
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 9, true);
  header(s, "แอปพลิเคชัน", "APPLICATION", true, px(430));
  s.addNotes("Divider. Two words. Sets up the product screens.");
}

// =====================================================================
// 10 — UI SCREENS (mock command center + citizen app) — zero body text
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.sluice);
  rail(s, 10, false);
  // --- desktop HUD panel ---
  const dx = px(230), dy = px(150), dw = px(1000), dh = px(620);
  s.addShape(p.ShapeType.roundRect, { x: dx, y: dy, w: dw, h: dh, rectRadius: 0.08, fill: { color: C.khlong }, line: { color: C.panelDark, width: 1 }, shadow: { type: "outer", color: "0A1F20", opacity: 0.35, blur: 10, offset: 4, angle: 90 } });
  // top status bar
  s.addShape(p.ShapeType.rect, { x: dx, y: dy, w: dw, h: px(56), fill: { color: C.panelDark }, line: { type: "none" } });
  s.addText("ศูนย์ควบคุม · CONTROL CENTER", { x: dx + px(24), y: dy, w: px(600), h: px(56), fontFace: F.body, fontSize: 12, color: C.sluice, valign: "middle", align: "left", margin: 0, charSpacing: 2 });
  s.addShape(p.ShapeType.ellipse, { x: dx + dw - px(60), y: dy + px(20), w: px(16), h: px(16), fill: { color: C.paddy }, line: { type: "none" } });
  // map area with nodes + flow lines
  const mx = dx + px(24), my = dy + px(80), mw = px(620), mh = px(420);
  s.addShape(p.ShapeType.roundRect, { x: mx, y: my, w: mw, h: mh, rectRadius: 0.04, fill: { color: "0C3335" }, line: { color: C.panelDark, width: 1 } });
  const nodes = [[0.2,0.3],[0.5,0.2],[0.75,0.4],[0.35,0.6],[0.6,0.7],[0.85,0.72]];
  // flow lines
  s.addShape(p.ShapeType.line, { x: mx + mw*0.2, y: my + mh*0.3, w: mw*0.3, h: mh*0.3, line: { color: C.paddy, width: 1.4, dashType: "dash" } });
  s.addShape(p.ShapeType.line, { x: mx + mw*0.5, y: my + mh*0.2, w: mw*0.25, h: mh*0.2, line: { color: C.paddy, width: 1.4, dashType: "dash" } });
  s.addShape(p.ShapeType.line, { x: mx + mw*0.35, y: my + mh*0.6, w: mw*0.25, h: mh*0.1, line: { color: C.drought, width: 1.4, dashType: "dash" } });
  nodes.forEach(([fx,fy],i) => {
    const col = i===2 ? C.gauge : (i===4 ? C.drought : C.paddy);
    s.addShape(p.ShapeType.ellipse, { x: mx + mw*fx - px(11), y: my + mh*fy - px(11), w: px(22), h: px(22), fill: { color: col }, line: { color: C.sluice, width: 1 } });
  });
  // right rail: stat chips + AI rec card
  const rx = dx + px(672), rw = px(304);
  const chips = [["สถานีในระบบ","190"],["กำลังสูบ","6"],["ระดับเฉลี่ย","58%"],["ฝน 3 ชม.","32mm"]];
  chips.forEach((c,i)=>{
    const cxp = rx + (i%2)*(rw/2 + px(6)), cyp = my + Math.floor(i/2)*(px(84));
    s.addShape(p.ShapeType.roundRect, { x: cxp, y: cyp, w: rw/2 - px(6), h: px(72), rectRadius: 0.06, fill: { color: C.panelDark }, line: { color: "1f5a5b", width: 1 } });
    s.addText(c[1], { x: cxp+px(12), y: cyp+px(8), w: rw/2-px(24), h: px(38), fontFace: F.mono, bold: true, fontSize: 20, color: (i===1?C.drought:C.sluice), align: "left", margin: 0 });
    s.addText(c[0], { x: cxp+px(12), y: cyp+px(44), w: rw/2-px(24), h: px(24), fontFace: F.body, fontSize: 8, color: C.onDarkDim, align: "left", margin: 0, charSpacing: 1 });
  });
  // AI rec card
  const ay = my + px(180);
  s.addShape(p.ShapeType.roundRect, { x: rx, y: ay, w: rw, h: px(240), rectRadius: 0.05, fill: { color: C.panelDark }, line: { color: "1f5a5b", width: 1 } });
  s.addText("แผนประสานงาน · AI PLAN", { x: rx+px(14), y: ay+px(10), w: rw-px(28), h: px(24), fontFace: F.body, fontSize: 9, color: C.drought, align: "left", margin: 0, charSpacing: 1 });
  const recs = [["พระโขนง","สูบ",C.paddy],["มักกะสัน","รอ · น้ำขึ้น",C.drought],["แสนแสบ","สูบ",C.paddy]];
  recs.forEach((r,i)=>{
    const ry = ay + px(44) + i*px(58);
    s.addShape(p.ShapeType.roundRect, { x: rx+px(12), y: ry, w: rw-px(24), h: px(48), rectRadius: 0.08, fill: { color: C.khlong }, line: { color: r[2], width: 1 } });
    s.addText(r[0], { x: rx+px(22), y: ry, w: px(140), h: px(48), fontFace: F.body, fontSize: 13, color: C.sluice, valign: "middle", align: "left", margin: 0 });
    s.addText(r[1], { x: rx+rw-px(150), y: ry, w: px(130), h: px(48), fontFace: F.body, fontSize: 10, bold: true, color: r[2], valign: "middle", align: "right", margin: 0 });
  });
  // gauge cluster row (bottom of desktop)
  const gy = my + mh + px(16);
  ["City Risk","Net Avg","River"].forEach((g,i)=>{
    const gx = mx + i*(mw/3);
    s.addShape(p.ShapeType.roundRect, { x: gx, y: gy, w: mw/3 - px(10), h: px(40), rectRadius: 0.1, fill: { color: C.panelDark }, line: { type:"none" } });
    const fillw = (mw/3 - px(10)) * [0.7,0.55,0.62][i];
    s.addShape(p.ShapeType.roundRect, { x: gx, y: gy, w: fillw, h: px(40), rectRadius: 0.1, fill: { color: [C.gauge,C.paddy,C.drought][i] }, line: { type:"none" } });
    s.addText(g, { x: gx+px(10), y: gy, w: mw/3-px(20), h: px(40), fontFace: F.mono, fontSize: 9, color: C.sluice, valign:"middle", align:"left", margin:0 });
  });
  // --- citizen phone ---
  const phx = px(1290), phy = px(180), phw = px(320), phh = px(560);
  s.addShape(p.ShapeType.roundRect, { x: phx, y: phy, w: phw, h: phh, rectRadius: 0.12, fill: { color: C.sluice }, line: { color: C.ink, width: 2 }, shadow: { type: "outer", color: "0A1F20", opacity: 0.3, blur: 10, offset: 4, angle: 90 } });
  // status hero (green now — after approve)
  s.addShape(p.ShapeType.roundRect, { x: phx+px(16), y: phy+px(20), w: phw-px(32), h: px(150), rectRadius: 0.08, fill: { color: C.paddy }, line: { type:"none" } });
  s.addText("เขตของคุณ", { x: phx+px(30), y: phy+px(34), w: phw-px(60), h: px(30), fontFace: F.body, fontSize: 12, color: C.sluice, align:"left", margin:0 });
  s.addText("ปลอดภัย", { x: phx+px(30), y: phy+px(64), w: phw-px(60), h: px(56), fontFace: F.disp, bold:true, fontSize: 34, color: C.sluice, align:"left", margin:0 });
  s.addText("🛟 ศูนย์ควบคุมกำลังเร่งระบายน้ำ", { x: phx+px(30), y: phy+px(126), w: phw-px(60), h: px(30), fontFace: F.body, fontSize: 11, color: C.sluice, align:"left", margin:0 });
  // canal list rows
  ["คลองแสนแสบ 42%","คลองพระโขนง 55%","คลองลาดพร้าว 38%"].forEach((t,i)=>{
    const ly = phy+px(190)+i*px(64);
    s.addShape(p.ShapeType.roundRect, { x: phx+px(16), y: ly, w: phw-px(32), h: px(52), rectRadius: 0.1, fill: { color: C.panelLight }, line: { type:"none" } });
    s.addText(t, { x: phx+px(28), y: ly, w: phw-px(56), h: px(52), fontFace: F.body, fontSize: 13, color: C.ink, valign:"middle", align:"left", margin:0 });
  });
  s.addNotes("Zero body text (only in-mock UI labels). Show, don't describe. Replace with real screenshots of the Control Center (dark HUD) and the Citizen app in phone frames.");
}

// =====================================================================
// 11 — HOW THE MODEL WORKS (Data / Model / Result)
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 11, true);
  header(s, "AI นี้ทำงานยังไง", "HOW THE MODEL ACTUALLY WORKS", true, px(90));
  const blocks = [
    ["ข้อมูล · DATA", "Open-Meteo (ฝนรายสถานี, สด) · Marine/WorldTides (น้ำขึ้นลง) · ThaiWater HII (ระดับคลองจริง) — ทุกค่าติดป้ายที่มา: สด / แคช / จำลอง", C.paddy],
    ["โมเดล · MODEL", "ตัวจัดแผนเชิงกฎที่โปร่งใส (heuristic v1) — รู้จังหวะน้ำ, ฝนล่วงหน้า 3 ชม., ประสานข้ามสถานี ออกแบบให้ ML/RL มาแทนได้ในอินเทอร์เฟซเดียว", C.drought],
    ["ผลลัพธ์ · RESULT", "กฎ ‘ห้ามย้ายน้ำท่วมไปเขตอื่น’ กันไม่ให้สถานีปลายน้ำเดียวกันสูบพร้อมกัน + รอเมื่อแม่น้ำไม่มีที่ว่าง", C.gauge],
  ];
  const bw = px(520), gap = px(40), y0 = px(320), bh = px(360);
  blocks.forEach((b,i)=>{
    const x = px(200) + i*(bw+gap);
    s.addShape(p.ShapeType.roundRect, { x, y: y0, w: bw, h: bh, rectRadius: 0.04, fill: { color: C.panelDark }, line: { color: b[2], width: 1.4 } });
    s.addShape(p.ShapeType.ellipse, { x: x+px(28), y: y0+px(28), w: px(20), h: px(20), fill: { color: b[2] }, line: {type:"none"} });
    s.addText(b[0], { x: x+px(64), y: y0+px(24), w: bw-px(90), h: px(30), fontFace: F.body, fontSize: 13, bold:true, color: b[2], align:"left", valign:"middle", margin:0, charSpacing:2 });
    s.addText(b[1], { x: x+px(28), y: y0+px(80), w: bw-px(56), h: px(260), fontFace: F.body, fontSize: 16, color: C.sluice, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.34 });
  });
  s.addText("หมายเหตุตามจริง: “AI” นี้คือ heuristic ที่โปร่งใส ไม่ใช่กล่องดำ — [เติมตัวเลขจริง: % การย้ายน้ำท่วมข้ามเขตที่ลดได้ เทียบ baseline สูบตามเวลา]", {
    x: px(200), y: y0+bh+px(24), w: px(1600), h: px(60), fontFace: F.body, fontSize: 16, italic:true, color: C.drought, align:"left", margin:0, lineSpacingMultiple:1.3,
  });
  s.addNotes("The objection pre-handler: 'is this really AI or an if-statement with an LLM sticker?' Answer honestly — it's a transparent, ML-replaceable planner. Run the smallest test to fill the RESULT number before pitching.");
}

// =====================================================================
// 12 — COMPARISON TABLE
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.sluice);
  rail(s, 12, false);
  header(s, "เทียบทางเลือกอื่น", "COMPETITIVE COMPARISON", false, px(80));
  const cols = ["", "ชลชาญ", "SCADA แยกสถานี", "สั่งการทางวิทยุ", "ไม่ทำอะไร"];
  const rows = [
    ["ประสานงานข้ามสถานี", "✓", "✕", "~", "✕"],
    ["รู้จังหวะน้ำขึ้นน้ำลง", "✓", "~", "~", "✕"],
    ["โปร่งใส · เห็นเหตุผล AI", "✓", "✕", "~", "✕"],
    ["แอปประชาชนเรียลไทม์", "✓", "✕", "✕", "✕"],
    ["ต้นทุน", "ซอฟต์แวร์", "สูง/สถานี", "แรงคน", "น้ำท่วม"],
  ];
  const tx = px(200), ty = px(300), tw = px(1620);
  const cW = [px(360), px(330), px(320), px(300), px(310)];
  const rH = px(74);
  let cx0 = tx;
  const colX = cW.map((w)=>{ const x=cx0; cx0+=w; return x; });
  // header row
  cols.forEach((c,i)=>{
    const isUs = i===1;
    s.addShape(p.ShapeType.rect, { x: colX[i], y: ty, w: cW[i], h: rH, fill: { color: isUs ? C.khlong : C.paddy }, line: { color: C.sluice, width: 1 } });
    s.addText(c, { x: colX[i]+px(10), y: ty, w: cW[i]-px(20), h: rH, fontFace: F.disp, bold:true, fontSize: 16, color: C.sluice, align: i===0?"left":"center", valign:"middle", margin:0 });
  });
  rows.forEach((r,ri)=>{
    const y = ty + rH*(ri+1);
    r.forEach((cell,ci)=>{
      const isUs = ci===1;
      const fill = ci===0 ? C.panelLight : (isUs ? "DDEDE7" : "FFFFFF");
      s.addShape(p.ShapeType.rect, { x: colX[ci], y, w: cW[ci], h: rH, fill: { color: fill }, line: { color: C.panelLight, width: 1 } });
      let color = C.ink, face = F.body, sym = cell;
      if (cell==="✓"){ color = isUs ? C.gauge : C.paddy; face="Arial"; }
      else if (cell==="✕"){ color = C.onLightDim; face="Arial"; }
      else if (cell==="~"){ color = C.drought; face="Arial"; }
      s.addText(sym, { x: colX[ci]+px(10), y, w: cW[ci]-px(20), h: rH, fontFace: face, bold: isUs, fontSize: (cell.length<=1?20:15), color, align: ci===0?"left":"center", valign:"middle", margin:0 });
    });
  });
  label(s, "‘ไม่ทำอะไร’ คือคู่แข่งจริงเสมอ · ‘doing nothing’ is always the real competitor", { x: px(200), y: H - px(80), w: px(1600), h: px(34), color: C.onLightDim });
  s.addNotes("Name real alternatives, include 'do nothing'. Your winning cells (ชลชาญ column) in gauge red. Swap SCADA/radio for the actual incumbent systems you find.");
}

// =====================================================================
// 13 — PURE IMAGE (product in context) — zero text
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 13, true);
  // Product in context — the citizen app in a real canal, easing red -> green. horizon at 60%.
  const horizon = H * 0.60;
  // calm canal water
  s.addShape(p.ShapeType.rect, { x: 0, y: horizon, w: W, h: H - horizon, fill: { color: C.paddy, transparency: 26 }, line: { type: "none" } });
  s.addShape(p.ShapeType.rect, { x: 0, y: horizon - px(60), w: W, h: px(60), fill: { color: C.paddy, transparency: 62 }, line: { type: "none" } });
  for (let i = 1; i <= 3; i++) s.addShape(p.ShapeType.line, { x: px(160), y: horizon + i * px(110), w: W - px(320), h: 0, line: { color: C.sluice, width: 0.75, transparency: 74 } });
  // staff gauge pole in the canal (motif), left
  const gpx = px(360), gpw = px(40), gtop = horizon - px(300), gbot = H - px(90), gph = gbot - gtop;
  s.addShape(p.ShapeType.rect, { x: gpx, y: gtop, w: gpw, h: gph, fill: { color: C.sluice }, line: { color: C.ink, width: 1 } });
  for (let i = 0; i < 12; i++) if (i % 2 === 0) s.addShape(p.ShapeType.rect, { x: gpx, y: gtop + (i / 12) * gph, w: gpw, h: gph / 12, fill: { color: C.gauge }, line: { type: "none" } });
  s.addShape(p.ShapeType.line, { x: gpx - px(46), y: horizon, w: px(132), h: 0, line: { color: C.drought, width: 2.2 } });
  // citizen phone, centre-right, held over the water — the product
  const cxp = px(1010), cyp = px(150), cw = px(380), ch = px(680);
  s.addShape(p.ShapeType.roundRect, { x: cxp, y: cyp, w: cw, h: ch, rectRadius: 0.11, fill: { color: C.sluice }, line: { color: C.ink, width: 2 }, shadow: { type: "outer", color: "000000", opacity: 0.45, blur: 16, offset: 7, angle: 90 } });
  // status hero easing to green (safe)
  s.addShape(p.ShapeType.roundRect, { x: cxp + px(22), y: cyp + px(26), w: cw - px(44), h: px(190), rectRadius: 0.08, fill: { color: C.paddy }, line: { type: "none" } });
  s.addShape(p.ShapeType.rect, { x: cxp + px(22), y: cyp + px(26), w: (cw - px(44)) * 0.28, h: px(190), fill: { color: C.gauge }, line: { type: "none" } });
  // canal list rows
  for (let i = 0; i < 4; i++) {
    const ly = cyp + px(240) + i * px(96);
    s.addShape(p.ShapeType.roundRect, { x: cxp + px(22), y: ly, w: cw - px(44), h: px(76), rectRadius: 0.1, fill: { color: C.panelLight }, line: { type: "none" } });
    s.addShape(p.ShapeType.rect, { x: cxp + px(22), y: ly, w: (cw - px(44)) * [0.42, 0.55, 0.30, 0.48][i], h: px(76), fill: { color: [C.drought, C.gauge, C.paddy, C.drought][i], transparency: 30 }, line: { type: "none" } });
  }
  s.addNotes("Zero text. The citizen app in a real canal — the district easing red -> green beside the gauge pole. Optional: replace with the Higgsfield gauge-pole photo (image #2 in IMAGES.md).");
}

// =====================================================================
// 14 — UNIT ECONOMICS ("software over concrete")
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.sluice);
  rail(s, 14, false);
  header(s, "ตัวเลข", "UNIT ECONOMICS · SOFTWARE OVER CONCRETE", false, px(70));
  // scenario bar
  const sbx = px(200), sby = px(280), sbw = px(1620), sbh = px(84);
  s.addShape(p.ShapeType.roundRect, { x: sbx, y: sby, w: sbw, h: sbh, rectRadius: 0.06, fill: { color: C.drought }, line: {type:"none"} });
  s.addText([
    { text: "สถานการณ์:  ", options: { bold:true, color: C.ink } },
    { text: "พายุฝนเย็นถล่มฝั่งตะวันออก — 6 สถานีที่ลงปลายน้ำเดียวกันขึ้นแตะระดับเฝ้าระวัง 62% พร้อมกัน", options: { color: C.ink } },
  ], { x: sbx+px(24), y: sby, w: sbw-px(48), h: sbh, fontFace: F.body, fontSize: 18, valign:"middle", align:"left", margin:0, lineSpacingMultiple:1.2 });
  // left: costs
  const lx = px(200), ly = px(420), lw = px(760), lh = px(300);
  s.addText("ต้นทุน · SOFTWARE LAYER", { x: lx, y: ly, w: lw, h: px(34), fontFace: F.body, fontSize: 12, bold:true, color: C.paddy, align:"left", margin:0, charSpacing:2 });
  const costs = [["พัฒนา + ติดตั้งเลเยอร์ประสานงาน","[X]"],["เชื่อม API ข้อมูลรัฐ (มีอยู่/ฟรี)","0"],["ดูแลระบบ + โฮสต์ / ปี","[X]"],["รวมปีแรก","[X]"]];
  costs.forEach((c,i)=>{
    const y = ly+px(46)+i*px(58); const last = i===costs.length-1;
    s.addShape(p.ShapeType.rect, { x: lx, y, w: lw, h: px(50), fill: { color: last ? C.khlong : "FFFFFF" }, line: { color: C.panelLight, width: 1 } });
    s.addText(c[0], { x: lx+px(16), y, w: lw-px(160), h: px(50), fontFace: F.body, fontSize: 16, bold:last, color: last?C.sluice:C.ink, valign:"middle", align:"left", margin:0 });
    s.addText(c[1], { x: lx+lw-px(150), y, w: px(134), h: px(50), fontFace: F.mono, fontSize: 16, bold:true, color: last?C.drought:C.ink, valign:"middle", align:"right", margin:0 });
  });
  // right: returns / framing
  const rxx = px(1050), rw = px(770);
  s.addText("ผลตอบแทน · WHY IT PENCILS", { x: rxx, y: ly, w: rw, h: px(34), fontFace: F.body, fontSize: 12, bold:true, color: C.paddy, align:"left", margin:0, charSpacing:2 });
  s.addText("อุโมงค์ / สถานีสูบใหม่", { x: rxx, y: ly+px(50), w: rw, h: px(40), fontFace: F.body, fontSize: 18, color: C.ink, align:"left", margin:0 });
  s.addText("‘พันล้านบาท’ / โครงการ", { x: rxx, y: ly+px(88), w: rw, h: px(70), fontFace: F.body, bold:true, fontSize: 26, color: C.gauge, align:"left", margin:0 });
  s.addText("ชลชาญประสานสินทรัพย์เดิม ~190 แห่งให้ทำงานร่วมกัน — เพิ่มความจุระบายได้โดยไม่ต้องเทคอนกรีตใหม่", {
    x: rxx, y: ly+px(182), w: rw, h: px(110), fontFace: F.body, fontSize: 18, color: C.ink, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.34,
  });
  s.addNotes("Software over concrete: the whole thesis. Show real software costs (incl. maintenance/hosting), and frame against the billion-baht cost of new physical infrastructure. Fill [X] with your real figures before pitching.");
}

// =====================================================================
// 15 — SCALE (three ascending gauge bars)
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 15, true);
  header(s, "การขยายผล", "SCALE", true, px(80));
  const tiers = [["1 สถานี","1 station",0.34,C.paddy],["1 เขต","1 district",0.62,C.drought],["ทั้งกรุงเทพฯ","whole city · ~190",0.94,C.gauge]];
  const baseY = H - px(180), maxH = px(430), bw = px(300), gap = px(120);
  const x0 = px(360);
  tiers.forEach((t,i)=>{
    const x = x0 + i*(bw+gap);
    const bh = maxH * t[2];
    // bar
    s.addShape(p.ShapeType.rect, { x, y: baseY-bh, w: bw, h: bh, fill: { color: t[3] }, line: {type:"none"} });
    // gradations on bar
    for (let g=1; g<Math.floor(bh/px(46)); g++) s.addShape(p.ShapeType.line, { x, y: baseY-g*px(46), w: bw, h:0, line:{ color: C.khlong, width:1.4, transparency:20 } });
    s.addText(t[0], { x: x-px(20), y: baseY+px(16), w: bw+px(40), h: px(44), fontFace: F.disp, bold:true, fontSize: 20, color: C.sluice, align:"center", margin:0 });
    s.addText(t[1], { x: x-px(20), y: baseY+px(60), w: bw+px(40), h: px(30), fontFace: F.mono, fontSize: 11, color: C.onDarkDim, align:"center", margin:0, charSpacing:2 });
    // value chip on top
    s.addText("[X]", { x, y: baseY-bh-px(52), w: bw, h: px(44), fontFace: F.mono, bold:true, fontSize: 24, color: t[3]===C.gauge?C.drought:C.sluice, align:"center", margin:0 });
  });
  s.addText("น้ำที่ประสานระบายได้ · ครัวเรือนที่ได้ประโยชน์ · ทุนที่ต้องใช้  — [เติมตัวเลขต่อระดับ]", {
    x: px(200), y: px(300), w: px(1500), h: px(40), fontFace: F.body, fontSize: 17, color: C.onDarkDim, align:"left", margin:0,
  });
  s.addNotes("Answer 'does this get bigger or stay a science project?' The city scale is real (~190 stations). Fill the [X] values with your projected water/households/capex per tier.");
}

// =====================================================================
// 16 — RISKS & ASSUMPTIONS
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.sluice);
  rail(s, 16, false);
  header(s, "ความเสี่ยงและข้อสมมติ", "RISKS & ASSUMPTIONS", false, px(80));
  const items = [
    ["พิกัดสถานีเป็นค่าประมาณ · ยังไม่มี telemetry รายปั๊ม", "อะแดปเตอร์ดึงพิกัดทางการจาก data.bangkok.go.th มาแทนเมื่อเข้าถึงได้ — และติดป้ายที่มาบอกความจริงทุกค่า"],
    ["บาง API (ThaiWater / CKAN) ติด CORS หรือล่ม", "ทุกแหล่งมี fallback เป็น snapshot ที่คอมมิตไว้ ระบบไม่มีวันดับกลางเดโม + ป้าย ‘แคช / จำลอง’"],
    ["เจ้าหน้าที่ไม่เชื่อคำแนะนำของ AI", "ทุกคำแนะนำกด ‘ดูเหตุผล’ เห็นตรรกะได้ + คนเป็นผู้อนุมัติเสมอ (human-in-the-loop)"],
  ];
  const y0 = px(310), rh = px(130), rw = px(1620);
  items.forEach((it,i)=>{
    const y = y0 + i*(rh+px(20));
    s.addShape(p.ShapeType.roundRect, { x: px(200), y, w: rw, h: rh, rectRadius: 0.05, fill: { color: "FFFFFF" }, line: { color: C.panelLight, width: 1 } });
    // risk dot
    s.addShape(p.ShapeType.ellipse, { x: px(224), y: y+px(24), w: px(18), h: px(18), fill: { color: C.gauge }, line:{type:"none"} });
    s.addText(it[0], { x: px(268), y: y+px(16), w: rw-px(120), h: px(46), fontFace: F.disp, bold:true, fontSize: 20, color: C.khlong, align:"left", valign:"middle", margin:0 });
    s.addText([
      { text: "→  ", options: { color: C.paddy, bold:true } },
      { text: it[1], options: { color: C.ink } },
    ], { x: px(268), y: y+px(66), w: rw-px(120), h: px(54), fontFace: F.body, fontSize: 16, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.28 });
  });
  s.addNotes("Naming your own holes reads as senior. These three are the real honesty caveats from the project README. If cutting for 5 min, hold this as a backup slide and deploy it when a judge asks about a risk.");
}

// =====================================================================
// 17 — TEAM
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.sluice);
  rail(s, 17, false);
  header(s, "ทีม", "TEAM", false, px(80));
  const n = 4, cw = px(360), gap = px(40), y0 = px(320), ch = px(400);
  const x0 = px(200);
  for (let i=0;i<n;i++){
    const x = x0 + i*(cw+gap);
    s.addShape(p.ShapeType.roundRect, { x, y: y0, w: cw, h: ch, rectRadius: 0.04, fill: { color: "FFFFFF" }, line: { color: C.panelLight, width: 1 } });
    // photo placeholder (gauge-banded circle)
    s.addShape(p.ShapeType.ellipse, { x: x+cw/2-px(70), y: y0+px(30), w: px(140), h: px(140), fill: { color: C.khlong }, line: { color: C.paddy, width: 2 } });
    s.addText("รูป", { x: x+cw/2-px(70), y: y0+px(30), w: px(140), h: px(140), fontFace: F.body, fontSize: 12, color: C.onDarkDim, align:"center", valign:"middle", margin:0 });
    s.addText("[ชื่อ]", { x: x+px(20), y: y0+px(190), w: cw-px(40), h: px(40), fontFace: F.disp, bold:true, fontSize: 22, color: C.khlong, align:"center", margin:0 });
    s.addText("[บทบาท]", { x: x+px(20), y: y0+px(232), w: cw-px(40), h: px(34), fontFace: F.body, fontSize: 12, color: C.paddy, align:"center", margin:0, charSpacing:2 });
    s.addText("[หลักฐานว่าทำได้จริง — สิ่งที่เคยสร้าง/แข่ง/ทำสำเร็จ]", { x: x+px(24), y: y0+px(276), w: cw-px(48), h: px(110), fontFace: F.body, fontSize: 14, color: C.ink, align:"center", valign:"top", margin:0, lineSpacingMultiple:1.3 });
  }
  s.addNotes("Photo, name, role, and ONE proof point each — the evidence this team can build it. Same crop/background/lighting for all photos: consistency reads as competence.");
}

// =====================================================================
// 18 — THE ASK
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 18, true);
  label(s, "สิ่งที่เราขอ · THE ASK", { x: px(200), y: px(140), w: px(1400), h: px(40), color: C.drought });
  const lines = [
    ["เราต้องการ", "พื้นที่นำร่องกับสำนักการระบายน้ำ กทม. + เมนทอร์ด้านชลศาสตร์"],
    ["เพื่อ", "เชื่อมข้อมูลสถานีจริง และทดสอบแผนประสานงานในเหตุการณ์ฝนจริง"],
    ["ภายใน 90 วัน", "พิสูจน์ว่าการประสานลดการย้ายน้ำท่วมข้ามเขตได้จริง 1 ลุ่มน้ำ"],
  ];
  const y0 = px(255);
  lines.forEach((l,i)=>{
    const y = y0 + i*px(185);
    s.addText(l[0], { x: px(200), y, w: px(430), h: px(120), fontFace: F.body, bold:true, fontSize: 26, color: C.drought, align:"left", valign:"top", margin:0 });
    s.addText(l[1], { x: px(640), y: y-px(6), w: px(1180), h: px(150), fontFace: F.disp, bold:true, fontSize: 30, color: C.sluice, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.15 });
  });
  s.addNotes("A deck that ends without an ask ends on a shrug. Concrete, measurable, 90-day. This is where the judges' hands go up.");
}

// =====================================================================
// 19 — Q&A close
// =====================================================================
{
  const s = p.addSlide(); bg(s, C.khlong);
  rail(s, 19, true); // water at full height
  s.addText("ถาม–ตอบ", { x: px(180), y: px(430), w: px(1600), h: px(180), fontFace: F.disp, bold:true, fontSize: 88, color: C.sluice, align:"center", valign:"middle", margin:0 });
  s.addText("Q&A", { x: px(180), y: px(620), w: px(1600), h: px(60), fontFace: F.mono, fontSize: 20, color: C.onDarkDim, align:"center", margin:0, charSpacing:8 });
  // small wordmark corner
  s.addText("ชลชาญ · AquaFlow", { x: W - px(560), y: H - px(90), w: px(500), h: px(40), fontFace: F.body, fontSize: 12, color: C.onDarkDim, align:"right", margin:0, charSpacing:2 });
  s.addNotes("Close on the visual — the gauge rail is now full, the water has risen through the whole deck. Backup slide 16 (risks) lives after this.");
}

p.writeFile({ fileName: "AquaFlow-ชลชาญ-PitchDeck.pptx" }).then((f) => console.log("WROTE", f));
