// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(import.meta.dirname, "public");
const NIGHT = { r: 15, g: 15, b: 26, alpha: 1 };
const FONT = "Noto Serif CJK KR, Noto Serif CJK JP, Noto Serif CJK SC, serif";
const MONO = "Courier New, ui-monospace, monospace";

function grainDots() {
  const dots = [];
  let seed = 37;
  for (let i = 0; i < 110; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.18 + (seed % 10) / 40;
    const r = 0.8 + (seed % 5) / 4;
    dots.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="rgba(240,244,255,${o.toFixed(3)})"/>`);
  }
  return dots.join("");
}

function block(x, y, w, h, fill, top) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>
    <rect x="${x}" y="${y}" width="${w}" height="10" fill="${top}"/>
    <rect x="${x}" y="${y}" width="8" height="${h}" fill="rgba(255,255,255,0.08)"/>
  `;
}

function stackedBlocks(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="210" cy="430" rx="200" ry="18" fill="rgba(120,160,255,0.12)"/>
    <circle cx="340" cy="46" r="38" fill="#c4a574"/>
    <ellipse cx="340" cy="46" rx="62" ry="10" fill="none" stroke="#f4d27a" stroke-width="6"/>
    <circle cx="392" cy="92" r="14" fill="#5b8def"/>
    ${block(20, 300, 150, 70, "#3d3558", "#6a5f8a")}
    ${block(200, 248, 130, 70, "#2a3d6a", "#4a6aa8")}
    ${block(120, 168, 120, 64, "#3a2a4a", "#7a4a78")}
    ${block(280, 120, 110, 58, "#1e3a4a", "#3a7a7a")}
    <g transform="translate(168, 86)">
      <rect x="18" y="52" width="10" height="18" fill="#c45c6a"/>
      <rect x="48" y="52" width="10" height="18" fill="#c45c6a"/>
      <rect x="8" y="8" width="60" height="48" fill="#f07888"/>
      <rect x="8" y="8" width="60" height="10" fill="#ffb0ba"/>
      <rect x="18" y="22" width="12" height="12" fill="#fff8ee"/>
      <rect x="46" y="22" width="12" height="12" fill="#fff8ee"/>
      <rect x="20" y="24" width="6" height="6" fill="#1a1020"/>
      <rect x="48" y="24" width="6" height="6" fill="#1a1020"/>
      <rect x="-4" y="28" width="12" height="10" fill="#f07888"/>
      <rect x="68" y="20" width="12" height="10" fill="#f07888"/>
    </g>
    <g transform="translate(40, 286)">
      <polygon points="12,0 24,18 0,18" fill="#9aa3ad"/>
      <polygon points="36,0 48,18 24,18" fill="#9aa3ad"/>
      <polygon points="60,0 72,18 48,18" fill="#9aa3ad"/>
    </g>
  </g>`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function titleSize(title) {
  const n = [...title].length;
  if (n <= 4) return 128;
  if (n <= 7) return 100;
  if (n <= 10) return 86;
  return 72;
}

function svgFor(title, subtitle) {
  const escaped = esc(title);
  const sub = esc(subtitle || "");
  const fontSize = titleSize(title);
  const y = 500;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#141428"/>
      <stop offset="100%" stop-color="#0f0f1a"/>
    </linearGradient>
    <radialGradient id="moon" cx="80%" cy="12%" r="30%">
      <stop offset="0%" stop-color="#5b4a88" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#0f0f1a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1800" height="945" fill="url(#night)"/>
  <rect width="1800" height="945" fill="url(#moon)"/>
  ${grainDots()}
  <rect width="1800" height="8" fill="#f07888"/>
  <text x="70" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#f4f1ea">${escaped}</text>
  <rect x="70" y="${y + 22}" width="220" height="8" rx="4" fill="#f07888"/>
  <text x="70" y="${y + 72}" font-family="${FONT}" font-size="32" font-weight="600" fill="#9aa3ad">${sub}</text>
  ${stackedBlocks(1160, 200, 1.22)}
  <g transform="translate(78,150)">
    <rect width="168" height="36" rx="4" fill="#0f0f1a" stroke="#f07888" stroke-width="3"/>
    <text x="84" y="24" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="800" fill="#f07888">4 THEMES</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: NIGHT })
    .png()
    .toFile(output);
  const m = await sharp(output).metadata();
  if (m.width !== 1200 || m.height !== 630) {
    throw new Error(`bad og size ${output} ${m.width}x${m.height}`);
  }
  console.log(output, m.width, m.height);
}

// The PWA icon is the marquee mark: three blocks, a coin and a jumper, drawn
// on a 32px grid and blown up with nearest-neighbour so it stays pixel art at
// 192 and 512.
const ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect width="32" height="32" fill="#0d0d18"/>
  <rect x="1" y="24" width="12" height="7" fill="#c2703a"/>
  <rect x="19" y="18" width="12" height="7" fill="#c2703a"/>
  <rect x="1" y="24" width="12" height="2" fill="#6cd47c"/>
  <rect x="19" y="18" width="12" height="2" fill="#6cd47c"/>
  <rect x="14" y="29" width="2" height="2" fill="#f0688a"/>
  <rect x="17" y="29" width="2" height="2" fill="#f0688a"/>
  <rect x="24" y="7" width="4" height="4" fill="#ffd23f"/>
  <rect x="10" y="12" width="6" height="6" fill="#59a5ff"/>
  <rect x="9" y="18" width="2" height="4" fill="#59a5ff"/>
  <rect x="15" y="18" width="2" height="4" fill="#59a5ff"/>
  <rect x="11" y="14" width="2" height="2" fill="#eef1ff"/>
  <rect x="14" y="14" width="1" height="2" fill="#eef1ff"/>
  <rect x="4" y="6" width="1" height="1" fill="#eef1ff"/>
  <rect x="28" y="26" width="1" height="1" fill="#eef1ff"/>
</svg>`;

async function icon(size, output) {
  await sharp(Buffer.from(ICON_SVG), { density: 384 })
    .resize(size, size, { kernel: "nearest" })
    .png()
    .toFile(output);
  console.log(output, size + "x" + size);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    { title: "블록점퍼", subtitle: "네 테마 점프", files: ["og-image.png", "og-image-ko.png"] },
    { title: "Block Jumper", subtitle: "Four-theme jumper", files: ["og-image-en.png"] },
    { title: "ブロックジャンパー", subtitle: "4つのテーマ", files: ["og-image-ja.png"] },
    { title: "方块跳跃者", subtitle: "四大主题跳跃", files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job.title, job.subtitle));
    for (const file of job.files) {
      await contain(buf, path.join(OUT, file));
    }
  }
  await icon(192, path.join(OUT, "icon-192.png"));
  await icon(512, path.join(OUT, "icon-512.png"));
}

main().catch((e) => { console.error(e); process.exit(1); });
