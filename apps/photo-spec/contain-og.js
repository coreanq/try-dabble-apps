// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * Photo Spec card: a self-healing cutting mat with the prints laid out on it.
 * Every element is a measuring instrument — mat grid, top ruler, crop marks,
 * and a drafting title block instead of a headline, because the app's whole job
 * is hitting an exact size in mm, px and KB.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "public");
const MAT = { r: 46, g: 76, b: 65, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const PAPER = "#f4f6f4";
const AMBER = "#f2b134";
const LINE = "rgba(255,255,255,0.72)";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.6;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

function matGrid() {
  const out = [];
  for (let x = 0; x <= 1800; x += 45) {
    const major = x % 225 === 0;
    out.push(`<rect x="${x}" y="76" width="${major ? 2 : 1}" height="869" fill="rgba(255,255,255,${major ? 0.16 : 0.075})"/>`);
  }
  for (let y = 76; y <= 945; y += 45) {
    const major = (y - 76) % 225 === 0;
    out.push(`<rect x="0" y="${y}" width="1800" height="${major ? 2 : 1}" fill="rgba(255,255,255,${major ? 0.16 : 0.075})"/>`);
  }
  for (let i = -6; i < 10; i++) {
    out.push(`<line x1="${i * 225}" y1="945" x2="${i * 225 + 869}" y2="76" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>`);
  }
  return out.join("");
}

function ruler(lang) {
  const ticks = [];
  for (let x = 0; x <= 1800; x += 22.5) {
    const n = Math.round(x / 22.5);
    const big = n % 8 === 0;
    const mid = n % 4 === 0;
    ticks.push(`<rect x="${x}" y="${big ? 30 : mid ? 42 : 52}" width="2" height="${big ? 46 : mid ? 34 : 24}" fill="rgba(255,255,255,0.55)"/>`);
    if (big) ticks.push(`<text x="${x + 8}" y="26" font-family="${mono(lang)}" font-size="18" font-weight="700" fill="rgba(255,255,255,0.45)">${n * 5}</text>`);
  }
  return `<g><rect x="0" y="0" width="1800" height="76" fill="rgba(255,255,255,0.06)"/>${ticks.join("")}<rect x="0" y="74" width="1800" height="2" fill="rgba(255,255,255,0.3)"/></g>`;
}

function cropMarks(x, y, w, h, color) {
  const m = 22;
  const L = 34;
  const s = 3;
  const corner = (cx, cy, dx, dy) => `
    <rect x="${cx}" y="${cy}" width="${L * dx > 0 ? L : s}" height="${L * dx > 0 ? s : L}" fill="${color}"/>`;
  return `
  <g>
    <rect x="${x - m - L}" y="${y - m}" width="${L}" height="${s}" fill="${color}"/>
    <rect x="${x - m}" y="${y - m - L}" width="${s}" height="${L}" fill="${color}"/>
    <rect x="${x + w + m}" y="${y - m}" width="${L}" height="${s}" fill="${color}"/>
    <rect x="${x + w + m}" y="${y - m - L}" width="${s}" height="${L}" fill="${color}"/>
    <rect x="${x - m - L}" y="${y + h + m}" width="${L}" height="${s}" fill="${color}"/>
    <rect x="${x - m}" y="${y + h + m}" width="${s}" height="${L}" fill="${color}"/>
    <rect x="${x + w + m}" y="${y + h + m}" width="${L}" height="${s}" fill="${color}"/>
    <rect x="${x + w + m}" y="${y + h + m}" width="${s}" height="${L}" fill="${color}"/>
  </g>`;
}

/** A print on the mat: white border, sitter, crop marks and the size under it. */
function print(lang, x, y, w, h, rot, caption, active, kind = "face") {
  const b = Math.round(w * 0.055);
  const iw = w - b * 2;
  const ih = h - b * 2;
  const cs = fitSize(caption, w + 60, [24, 21, 19, 17]);
  return `
  <g transform="translate(${x},${y}) rotate(${rot})">
    <rect x="6" y="10" width="${w}" height="${h}" rx="3" fill="rgba(8,20,16,0.35)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${PAPER}"/>
    <rect x="${b}" y="${b}" width="${iw}" height="${ih}" fill="#cfdbe2"/>
    ${kind === "sign"
      ? `<path d="M${b + iw * 0.08} ${b + ih * 0.72} C${b + iw * 0.2} ${b + ih * 0.18}, ${b + iw * 0.3} ${b + ih * 0.9}, ${b + iw * 0.42} ${b + ih * 0.44} S${b + iw * 0.58} ${b + ih * 0.9}, ${b + iw * 0.7} ${b + ih * 0.4} S${b + iw * 0.86} ${b + ih * 0.82}, ${b + iw * 0.94} ${b + ih * 0.52}" fill="none" stroke="#42566b" stroke-width="${Math.max(4, ih * 0.07)}" stroke-linecap="round"/>`
      : `<circle cx="${b + iw / 2}" cy="${b + ih * 0.36}" r="${iw * 0.19}" fill="#7d8f9c"/>
    <path d="M${b + iw * 0.12} ${b + ih} Q${b + iw / 2} ${b + ih * 0.56} ${b + iw * 0.88} ${b + ih} Z" fill="#7d8f9c"/>`}
    ${cropMarks(0, 0, w, h, active ? AMBER : "rgba(255,255,255,0.42)")}
    ${active ? `<rect x="-4" y="-4" width="${w + 8}" height="${h + 8}" fill="none" stroke="${AMBER}" stroke-width="4"/>` : ""}
    <text x="${w / 2}" y="${h + 76}" text-anchor="middle" font-family="${mono(lang)}" font-size="${cs}" font-weight="700" fill="${active ? AMBER : LINE}">${esc(caption)}</text>
  </g>`;
}

/** Drafting title block: the sheet's identity, in cells, not a headline. */
function titleBlock(lang, title, subtitle, cells) {
  const w = 812;
  const titleSize = fitSize(title, w - 60, [76, 66, 58, 50, 44]);
  const subSize = fitSize(subtitle, w - 60, [28, 25, 22, 20]);
  const cellW = w / 3;
  return `
  <g transform="translate(88,660)">
    <rect x="0" y="0" width="${w}" height="252" fill="rgba(12,26,22,0.86)"/>
    <rect x="0" y="0" width="${w}" height="252" fill="none" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="${w}" height="52" fill="none" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="188" width="${w}" height="64" fill="none" stroke="${LINE}" stroke-width="3"/>
    <text x="20" y="35" font-family="${mono(lang)}" font-size="22" font-weight="800" fill="${AMBER}" letter-spacing="4">TRY DABBLE</text>
    <text x="${w - 20}" y="35" text-anchor="end" font-family="${mono(lang)}" font-size="22" font-weight="700" fill="rgba(255,255,255,0.55)">photo-spec.try-dabble.com</text>
    <text x="20" y="${52 + 78}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="700" fill="${PAPER}">${esc(title)}</text>
    <text x="20" y="${52 + 78 + 46}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="rgba(255,255,255,0.62)">${esc(subtitle)}</text>
    ${cells.map((c, i) => `
    <g transform="translate(${i * cellW},188)">
      ${i > 0 ? `<rect x="0" y="0" width="3" height="64" fill="${LINE}"/>` : ""}
      <text x="20" y="26" font-family="${mono(lang)}" font-size="17" font-weight="700" fill="rgba(255,255,255,0.5)" letter-spacing="2">${esc(c[0])}</text>
      <text x="20" y="52" font-family="${mono(lang)}" font-size="24" font-weight="800" fill="${AMBER}">${esc(c[1])}</text>
    </g>`).join("")}
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, cells, prints } = job;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <radialGradient id="matbg" cx="0.42" cy="0.36" r="0.86">
      <stop offset="0%" stop-color="#37594c"/>
      <stop offset="100%" stop-color="#254036"/>
    </radialGradient>
  </defs>
  <rect width="1800" height="945" fill="url(#matbg)"/>
  ${matGrid()}
  ${ruler(lang)}

  ${print(lang, 176, 140, 334, 430, -3, prints[0], true)}
  ${print(lang, 812, 196, 250, 322, 2.5, prints[1], false)}
  ${print(lang, 1150, 168, 268, 268, -1.5, prints[2], false)}
  ${print(lang, 1414, 636, 306, 102, 3, prints[3], false, "sign")}

  ${titleBlock(lang, title, subtitle, cells)}
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: MAT })
    .png()
    .toFile(output);
  const m = await sharp(output).metadata();
  if (m.width !== 1200 || m.height !== 630) {
    throw new Error(`bad og size ${output} ${m.width}x${m.height}`);
  }
  console.log(output, m.width, m.height);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    {
      lang: "ko", title: "사진 규격", subtitle: "픽셀과 KB까지 정확히 맞춥니다",
      cells: [["규격", "35×45mm"], ["픽셀", "413×531"], ["용량", "≤ 200KB"]],
      prints: ["여권 35×45mm", "이력서 30×40mm", "비자 51×51mm", "사인 6×2cm"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en", title: "Photo Spec", subtitle: "Exact pixels, exact kilobytes",
      cells: [["SIZE", "35×45mm"], ["PIXELS", "413×531"], ["WEIGHT", "≤ 200KB"]],
      prints: ["Passport 35×45mm", "Resume 30×40mm", "Visa 51×51mm", "Signature 6×2cm"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja", title: "写真規格", subtitle: "ピクセルもKBもぴったりに",
      cells: [["寸法", "35×45mm"], ["画素", "413×531"], ["容量", "≤ 200KB"]],
      prints: ["パスポート 35×45mm", "履歴書 30×40mm", "ビザ 51×51mm", "署名 6×2cm"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh", title: "照片规格", subtitle: "像素和 KB 都对得上",
      cells: [["尺寸", "35×45mm"], ["像素", "413×531"], ["大小", "≤ 200KB"]],
      prints: ["护照 35×45mm", "简历 30×40mm", "签证 51×51mm", "签名 6×2cm"],
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
