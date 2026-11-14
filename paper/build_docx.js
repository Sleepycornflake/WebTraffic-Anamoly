// Builds the paper as an IEEE-conference-style Word document from paper/sections/*.md.
// Usage (needs the "docx" npm package):  node paper/build_docx.js
// Output: paper/WebTraffic_Anomaly_Detection_Overview_DRAFT.docx
//
// Conversions: markdown headings -> IEEE numbering (I., II., A., B.); "Section 6.2" -> "Section VI-B";
// "Table 6.2" -> "Table VII"; "Figure 6.1" -> "Fig. 1". HTML comments (source notes) are dropped.
// Citation keys like [Liu2012] are kept and highlighted yellow, ready to be replaced with Mendeley Cite.

const fs = require("fs");
const path = require("path");
const D = require("docx");

const ROOT = path.resolve(__dirname, "..");
const SECTIONS = ["01_introduction", "02_background", "03_traditional_ml", "04_deep_learning",
  "05_comparison", "06_case_study", "07_limitations", "08_conclusion"];
const OUT = path.join(__dirname, "WebTraffic_Anomaly_Detection_Overview_DRAFT.docx");

// ---- page geometry (US Letter, IEEE conference margins) ----
const PAGE = { size: { width: 12240, height: 15840 },
  margin: { top: 1080, bottom: 1440, left: 900, right: 900 } };
const COL_SPACE = 360;
const FULL_W = 12240 - 900 - 900;              // 10440 DXA
const COL_W = (FULL_W - COL_SPACE) / 2;         // 5040 DXA = 3.5 in

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
const LETTER = " ABCDEFGHIJKLMNOP";

// ---- references (IEEE style); numbered in order of first citation ----
const REFS = {
  Ali2020: 'W. A. Ali, K. N. Manasa, M. Aljunid, M. Bendechache, and P. Sandhya, "Review of current machine learning approaches for anomaly detection in network traffic," *J. Telecommun. Digit. Econ.*, vol. 8, no. 4, pp. 64–95, 2020, doi: 10.18080/jtde.v8n4.307.',
  Landauer2023: 'M. Landauer, S. Onder, F. Skopik, and M. Wurzenberger, "Deep learning for anomaly detection in log data: A survey," *Mach. Learn. Appl.*, vol. 12, Art. no. 100470, 2023, doi: 10.1016/j.mlwa.2023.100470.',
  He2021: 'S. He, P. He, Z. Chen, T. Yang, Y. Su, and M. R. Lyu, "A survey on automated log analysis for reliability engineering," *ACM Comput. Surv.*, vol. 54, no. 6, pp. 1–37, 2021, doi: 10.1145/3460345.',
  Yadav2020: 'R. B. Yadav, P. S. Kumar, and S. V. Dhavale, "A survey on log anomaly detection using deep learning," in *Proc. 8th Int. Conf. Reliability, Infocom Technologies and Optimization (ICRITO)*, 2020, pp. 1215–1220, doi: 10.1109/ICRITO48877.2020.9197818.',
  CSIC2010: 'C. Torrano-Giménez, A. Pérez-Villegas, and G. Álvarez Marañón, "HTTP DATASET CSIC 2010," Information Security Institute, Spanish National Research Council (CSIC), 2010.',
  Jha2022: 'B. K. Jha and Nisha, "Anomaly detection for web log data analysis: A review," *Int. J. Sci. Develop. Res.*, vol. 7, no. 6, 2022.',
  Liu2012: 'F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation-based anomaly detection," *ACM Trans. Knowl. Discov. Data*, vol. 6, no. 1, pp. 1–39, 2012, doi: 10.1145/2133360.2133363.',
  Xu2023: 'H. Xu, G. Pang, Y. Wang, and Y. Wang, "Deep isolation forest for anomaly detection," *IEEE Trans. Knowl. Data Eng.*, vol. 35, no. 12, pp. 12591–12604, 2023, doi: 10.1109/TKDE.2023.3270293.',
};

// ---- read sources ----
const raw = SECTIONS.map(s => fs.readFileSync(path.join(__dirname, "sections", s + ".md"), "utf8")
  .replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, ""));
const allText = raw.join("\n");

// table and figure renumbering (global, in order of their captions)
const tableMap = {}, figMap = {};
let tn = 0, fn = 0;
for (const line of allText.split("\n")) {
  let m = line.match(/^Table (\d+\.\d+):/); if (m) tableMap[m[1]] = ROMAN[++tn];
  m = line.match(/^Figure (\d+\.\d+):/); if (m) figMap[m[1]] = String(++fn);
}
// citation order
const citeOrder = [];
for (const m of allText.matchAll(/\[([A-Z][A-Za-z]+\d{4}[^\]]*)\]/g))
  for (const k of m[1].split(/,\s*/)) if (REFS[k] && !citeOrder.includes(k)) citeOrder.push(k);

const secRef = n => { const [a, b] = n.split("."); return ROMAN[+a] + (b ? "-" + LETTER[+b] : ""); };
function fixRefs(s) {
  s = s.replace(/\b(Sections?)\s+(\d+(?:\.\d+)?(?:(?:\s*(?:,|and|or|to)\s*|\s*-\s*)\d+(?:\.\d+)?)*)/g,
    (_, w, list) => w + " " + list.replace(/(\d+(?:\.\d+)?)|(\s*-\s*)/g, (t, num) => num ? secRef(num) : "–"));
  s = s.replace(/\b(Tables?)\s+(\d+\.\d+(?:\s*(?:,|and|to)\s*\d+\.\d+)*)/g,
    (_, w, list) => w + " " + list.replace(/\d+\.\d+/g, x => tableMap[x] || x));
  s = s.replace(/\b(Figures?)\s+(\d+\.\d+(?:\s*(?:,|and|to)\s*\d+\.\d+)*)/g,
    (_, w, list) => (w === "Figure" ? "Fig." : "Figs.") + " " + list.replace(/\d+\.\d+/g, x => figMap[x] || x));
  return s;
}

// ---- inline markdown -> runs ----
function runs(text, base = {}) {
  text = fixRefs(text).replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1");
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[A-Z][A-Za-z]+\d{4}[^\]]*\])/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new D.TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith("**")) out.push(...runs(t.slice(2, -2), { ...base, bold: true }));
    else if (t.startsWith("`")) out.push(new D.TextRun({ text: t.slice(1, -1), ...base, font: "Courier New", size: (base.size || 20) - 2 }));
    else if (t.startsWith("[")) out.push(new D.TextRun({ text: t, ...base, highlight: "yellow" }));
    else out.push(...runs(t.slice(1, -1), { ...base, italics: true }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new D.TextRun({ text: text.slice(last), ...base }));
  return out;
}

const body = (text, opts = {}) => new D.Paragraph({ children: runs(text, opts.run), alignment: D.AlignmentType.JUSTIFIED,
  indent: opts.noIndent ? undefined : { firstLine: 202 }, spacing: { after: 40 }, ...opts.para });

// ---- tables ----
function makeTable(rows, width) {
  const ncol = rows[0].length;
  const len = Array(ncol).fill(4);
  for (const r of rows) r.forEach((c, i) => { len[i] = Math.max(len[i], Math.min(c.length, 60)); });
  const tot = len.reduce((a, b) => a + b, 0);
  const widths = len.map(l => Math.floor(width * l / tot));
  widths[ncol - 1] += width - widths.reduce((a, b) => a + b, 0);
  const border = { style: D.BorderStyle.SINGLE, size: 4, color: "000000" };
  return new D.Table({
    width: { size: width, type: D.WidthType.DXA }, columnWidths: widths,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: rows.map((r, ri) => new D.TableRow({ tableHeader: ri === 0, children: r.map((c, ci) => new D.TableCell({
      width: { size: widths[ci], type: D.WidthType.DXA },
      shading: ri === 0 ? { type: D.ShadingType.CLEAR, color: "auto", fill: "E7E6E6" } : undefined,
      margins: { top: 30, bottom: 30, left: 60, right: 60 },
      children: [new D.Paragraph({ children: runs(c, { size: 16, bold: ri === 0 || undefined }), spacing: { after: 0 } })],
    })) })),
  });
}
const isWide = rows => rows[0].length >= 5 || rows.some(r => r.join("").length > 110);

// ---- figures ----
function pngSize(file) { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }
function figure(file) {
  const { w, h } = pngSize(file);
  const W = 3.0 * 96;
  return new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { before: 120, after: 40 }, keepNext: true,
    children: [new D.ImageRun({ type: "png", data: fs.readFileSync(file), transformation: { width: W, height: W * h / w } })] });
}

// ---- document assembly: a list of blocks, each {wide: bool, items: [...]} ----
const blocks = [];
let cur = null;
const push = (item, wide = false) => {
  if (!cur || cur.wide !== wide) { cur = { wide, items: [] }; blocks.push(cur); }
  cur.items.push(item);
};
const front = [];  // single-column title block
let numInstance = 0;

function parseFile(text, isIntro) {
  const lines = text.split("\n");
  let para = [], table = [], pendingCaption = null, mode = "body";
  const flushPara = () => {
    if (!para.length) return;
    const t = para.join(" ").trim(); para = [];
    if (!t) return;
    if (mode === "abstract" && !/^\*\*Index Terms:\*\*/.test(t)) {
      const p = new D.Paragraph({ alignment: D.AlignmentType.JUSTIFIED, spacing: { after: 120 },
        children: [new D.TextRun({ text: "Abstract", bold: true, italics: true, size: 18 }),
          new D.TextRun({ text: "—", bold: true, size: 18 }), ...runs(t, { bold: true, size: 18 })] });
      push(p); return;
    }
    if (/^\*\*Index Terms:\*\*/.test(t)) {
      push(new D.Paragraph({ alignment: D.AlignmentType.JUSTIFIED, spacing: { after: 160 },
        children: [new D.TextRun({ text: "Index Terms", bold: true, italics: true, size: 18 }),
          new D.TextRun({ text: "—", bold: true, size: 18 }),
          ...runs(t.replace(/^\*\*Index Terms:\*\*\s*/, ""), { bold: true, size: 18 })] }));
      return;
    }
    if (/^\*[^*].*\*$/.test(t) || /^¹/.test(t))  // table notes
      { push(body(t, { run: { size: 16 }, noIndent: true, para: { spacing: { after: 120 } } }), cur && cur.wide); return; }
    push(body(t));
  };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter(r => !/^\|[\s:|-]+\|$/.test(r))
      .map(r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
    table = [];
    const wide = isWide(rows);
    if (pendingCaption) {
      push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { before: 160, after: 0 },
        children: [new D.TextRun({ text: "TABLE " + pendingCaption.num, size: 16 })] }), wide);
      push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { after: 60 },
        children: runs(pendingCaption.text, { size: 16, smallCaps: true }) }), wide);
      pendingCaption = null;
    }
    push(makeTable(rows, wide ? FULL_W : COL_W), wide);
    push(new D.Paragraph({ spacing: { after: 80 }, children: [] }), wide);
  };

  for (const line of lines) {
    if (line.startsWith("|")) { flushPara(); table.push(line.trim()); continue; }
    flushTable();
    if (!line.trim()) { flushPara(); continue; }
    let m;
    if ((m = line.match(/^# (.*)/))) {
      flushPara();
      if (isIntro) {
        front.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 200 },
          children: [new D.TextRun({ text: m[1], size: 48 })] }));
        front.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 40 },
          children: [new D.TextRun({ text: "[Author 1 name], [Author 2 name]", size: 22, highlight: "yellow" })] }));
        front.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 40 },
          children: [new D.TextRun({ text: "[Department], [Institution], [City, Country]", size: 20, italics: true, highlight: "yellow" })] }));
        front.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 320 },
          children: [new D.TextRun({ text: "[email addresses]", size: 20, highlight: "yellow" })] }));
      } else {
        const h = m[1].match(/^(\d+)\.\s*(.*)/);
        push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, alignment: D.AlignmentType.CENTER,
          children: [new D.TextRun({ text: (h ? ROMAN[+h[1]] + ". " + h[2] : m[1]), smallCaps: true })] }));
      }
      mode = "body"; continue;
    }
    if ((m = line.match(/^## (.*)/))) {
      flushPara();
      const t = m[1];
      if (t === "Abstract") { mode = "abstract"; continue; }
      mode = "body";
      let h;
      if ((h = t.match(/^(\d+)\.\s+(.*)/)))   // "1. Introduction" written as H2 in the intro file
        push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, alignment: D.AlignmentType.CENTER,
          children: [new D.TextRun({ text: ROMAN[+h[1]] + ". " + h[2], smallCaps: true })] }));
      else if ((h = t.match(/^(\d+)\.(\d+)\s+(.*)/)))
        push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_2,
          children: [new D.TextRun({ text: LETTER[+h[2]] + ". " + h[3], italics: true })] }));
      else
        push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, alignment: D.AlignmentType.CENTER,
          children: [new D.TextRun({ text: t, smallCaps: true })] }));
      continue;
    }
    if ((m = line.match(/^Table (\d+\.\d+):\s*(.*)/))) { flushPara(); pendingCaption = { num: tableMap[m[1]], text: m[2] }; continue; }
    if ((m = line.match(/^Figure (\d+\.\d+):\s*(.*?)\s*\(`([^`]+)`\)\s*$/))) {
      flushPara();
      push(figure(path.join(ROOT, m[3])));
      push(new D.Paragraph({ alignment: D.AlignmentType.JUSTIFIED, spacing: { after: 160 },
        children: [new D.TextRun({ text: "Fig. " + figMap[m[1]] + ". ", size: 16 }), ...runs(m[2], { size: 16 })] }));
      continue;
    }
    if ((m = line.match(/^- (.*)/))) {
      flushPara();
      push(new D.Paragraph({ numbering: { reference: "bul", level: 0 }, alignment: D.AlignmentType.LEFT,
        spacing: { after: 20 }, children: runs(m[1]) }));
      continue;
    }
    if ((m = line.match(/^(\d+)\. (.*)/))) {
      flushPara();
      if (m[1] === "1") numInstance++;
      push(new D.Paragraph({ numbering: { reference: "num", level: 0, instance: numInstance }, alignment: D.AlignmentType.LEFT,
        spacing: { after: 20 }, children: runs(m[2]) }));
      continue;
    }
    para.push(line.trim());
  }
  flushPara(); flushTable();
}

raw.forEach((t, i) => parseFile(t, i === 0));

// references
push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, alignment: D.AlignmentType.CENTER,
  children: [new D.TextRun({ text: "References", smallCaps: true })] }));
push(new D.Paragraph({ spacing: { after: 80 }, children: [new D.TextRun({
  text: "Provisional list in order of first citation. Replace with the Mendeley Cite bibliography (IEEE style).",
  size: 16, italics: true, highlight: "yellow" })] }));
citeOrder.forEach((k, i) => push(new D.Paragraph({ alignment: D.AlignmentType.JUSTIFIED, spacing: { after: 40 },
  indent: { left: 360, hanging: 360 },
  children: [new D.TextRun({ text: `[${i + 1}]\t`, size: 16 }), ...runs(REFS[k], { size: 16 }),
    new D.TextRun({ text: `  (key: ${k})`, size: 14, highlight: "yellow" })] })));

// ---- sections ----
const props = (cols, first) => ({ page: PAGE, type: first ? undefined : D.SectionType.CONTINUOUS,
  column: cols === 2 ? { count: 2, space: COL_SPACE, equalWidth: true } : { count: 1 } });
const sections = [{ properties: props(1, true), children: front }];
for (const b of blocks) sections.push({ properties: props(b.wide ? 1 : 2), children: b.items });

const doc = new D.Document({
  creator: "Member 2", title: "Machine Learning for Anomaly Detection in Web and API Traffic: An Overview",
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Times New Roman", size: 20, bold: false, color: "000000" },
        paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Times New Roman", size: 20, bold: false, italics: true, color: "000000" },
        paragraph: { spacing: { before: 120, after: 60 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: D.LevelFormat.BULLET, text: "•", alignment: D.AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 288, hanging: 216 } } } }] },
    { reference: "num", levels: [{ level: 0, format: D.LevelFormat.DECIMAL, text: "%1)", alignment: D.AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 288, hanging: 216 } } } }] },
  ] },
  sections,
});

D.Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, buf.length, "bytes;", tn, "tables,", fn, "figures,", citeOrder.length, "references;",
    sections.length, "sections");
});
