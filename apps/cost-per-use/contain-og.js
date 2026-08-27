import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.join(__dirname, "public");
const NAVY = { r: 11, g: 18, b: 32, alpha: 1 };
const FONT = "Noto Serif CJK KR, Noto Serif CJK JP, Noto Serif CJK SC, serif";
const MONO = "Courier New, ui-monospace, monospace";

function grainDots() {
  const dots = [];
  let seed = 61;
  for (let i = 0; i < 80; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.05 + (seed % 8) / 120;
    dots.push(`<circle cx="${x}" cy="${y}" r="1.15" fill="rgba(212,168,48,${o.toFixed(3)})"/>`);
  }
  return dots.join("");
}

function wonTag(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="170" cy="430" rx="180" ry="20" fill="rgba(0,0,0,0.35)"/>
    <path d="M168 8 C168 8, 168 52, 168 72" fill="none" stroke="#d4a830" stroke-width="8" stroke-linecap="round"/>
    <circle cx="168" cy="8" r="12" fill="#f4d27a"/>
    <g transform="rotate(-12 168 230)">
      <path d="M48 88
               C48 72, 64 58, 88 58
               L248 58
               C272 58, 288 72, 288 88
               L288 368
               C288 390, 268 408, 244 408
               L92 408
               C68 408, 48 390, 48 368 Z" fill="#d4a830"/>
      <path d="M62 96
               C62 84, 74 74, 92 74
               L244 74
               C262 74, 274 84, 274 96
               L274 356
               C274 374, 258 388, 240 388
               L96 388
               C78 388, 62 374, 62 356 Z" fill="#0b1220"/>
      <circle cx="168" cy="108" r="16" fill="none" stroke="#d4a830" stroke-width="7"/>
      <circle cx="168" cy="108" r="6" fill="#0b1220"/>
      <text x="168" y="268" text-anchor="middle" font-family="${FONT}" font-size="148" font-weight="700" fill="#f4d27a">₩</text>
      <rect x="98" y="308" width="140" height="36" rx="8" fill="#d4a830"/>
      <text x="168" y="334" text-anchor="middle" font-family="${MONO}" font-size="18" font-weight="800" fill="#0b1220">PER USE</text>
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
  return 68;
}

function svgFor(title, subtitle) {
  const escaped = esc(title);
  const sub = esc(subtitle || "");
  const fontSize = titleSize(title);
  const y = 500;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <radialGradient id="glow" cx="18%" cy="0%" r="55%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#0b1220" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gold" cx="90%" cy="80%" r="40%">
      <stop offset="0%" stop-color="#d4a830" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#0b1220" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1800" height="945" fill="#0b1220"/>
  <rect width="1800" height="945" fill="url(#glow)"/>
  <rect width="1800" height="945" fill="url(#gold)"/>
  ${grainDots()}
  <rect width="1800" height="8" fill="#d4a830"/>
  <text x="70" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#f1f5f9">${escaped}</text>
  <rect x="70" y="${y + 22}" width="220" height="8" rx="4" fill="#d4a830"/>
  <text x="70" y="${y + 72}" font-family="${FONT}" font-size="32" font-weight="600" fill="#94a3b8">${sub}</text>
  ${wonTag(1180, 170, 1.22)}
  <g transform="translate(78,150)">
    <rect width="148" height="36" rx="4" fill="#0b1220" stroke="#d4a830" stroke-width="3"/>
    <text x="74" y="24" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="800" fill="#d4a830">₩ / DAY</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: NAVY })
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
    { title: "사용단가 계산기", subtitle: "하루·1회 사용 비용", files: ["og-image.png", "og-image-ko.png"] },
    { title: "Cost-per-use Calculator", subtitle: "Daily & per-use cost", files: ["og-image-en.png"] },
    { title: "1回あたり費用計算機", subtitle: "1日・1回の費用", files: ["og-image-ja.png"] },
    { title: "单次使用成本计算器", subtitle: "每天·每次的真实成本", files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job.title, job.subtitle));
    for (const file of job.files) {
      await contain(buf, path.join(OUT, file));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
