import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.join(__dirname, "public");
const SKY = { r: 212, g: 228, b: 240, alpha: 1 };
const FONT = "Noto Serif CJK KR, Noto Serif CJK JP, Noto Serif CJK SC, serif";
const MONO = "Courier New, ui-monospace, monospace";

function grainDots() {
  const dots = [];
  let seed = 29;
  for (let i = 0; i < 80; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.05 + (seed % 8) / 120;
    dots.push(`<circle cx="${x}" cy="${y}" r="1.15" fill="rgba(26,51,85,${o.toFixed(3)})"/>`);
  }
  return dots.join("");
}

function mapGrid() {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const x = 80 + i * 150;
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="945" stroke="rgba(26,51,85,0.08)" stroke-width="1.5"/>`);
  }
  for (let j = 0; j < 8; j++) {
    const y = 40 + j * 120;
    lines.push(`<line x1="0" y1="${y}" x2="1800" y2="${y}" stroke="rgba(26,51,85,0.08)" stroke-width="1.5"/>`);
  }
  return lines.join("");
}

function postcardPin(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="210" cy="360" rx="200" ry="20" fill="rgba(26,51,85,0.14)"/>
    <g transform="translate(36,28) rotate(-8)">
      <rect x="18" y="18" width="380" height="260" rx="10" fill="#c5b8a4"/>
    </g>
    <g transform="translate(0,0) rotate(-4)">
      <rect x="0" y="0" width="400" height="270" rx="12" fill="#fff8ee" stroke="#1a3355" stroke-width="4"/>
      <rect x="18" y="18" width="164" height="120" rx="8" fill="#d4e4f0"/>
      <path d="M28 128 L70 70 L110 104 L142 58 L172 128 Z" fill="#7aa3b8"/>
      <circle cx="56" cy="52" r="14" fill="#f4d27a"/>
      <rect x="200" y="28" width="168" height="12" rx="6" fill="#1a3355" opacity="0.55"/>
      <rect x="200" y="52" width="132" height="10" rx="5" fill="#1a3355" opacity="0.28"/>
      <rect x="200" y="74" width="148" height="10" rx="5" fill="#1a3355" opacity="0.22"/>
      <line x1="200" y1="150" x2="364" y2="150" stroke="#1a3355" stroke-width="2" stroke-dasharray="6 8" opacity="0.35"/>
      <rect x="292" y="168" width="72" height="72" rx="6" fill="#f4d27a" stroke="#c45c26" stroke-width="3"/>
      <text x="328" y="198" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="800" fill="#8e3e16">POST</text>
      <text x="328" y="218" text-anchor="middle" font-family="${MONO}" font-size="16" font-weight="800" fill="#c45c26">✈</text>
      <path d="M40 210 C90 168, 160 230, 230 188" fill="none" stroke="#c0392b" stroke-width="3" stroke-dasharray="5 7" stroke-linecap="round"/>
    </g>
    <g transform="translate(168,96)">
      <path d="M0,-62 C28,-62 46,-40 46,-18 C46,10 0,58 0,58 C0,58 -46,10 -46,-18 C-46,-40 -28,-62 0,-62 Z" fill="#c0392b"/>
      <circle cx="0" cy="-24" r="16" fill="#fff8ee"/>
      <circle cx="0" cy="-24" r="7" fill="#c0392b"/>
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
  const y = 520;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e4eef6"/>
      <stop offset="100%" stop-color="#d4e4f0"/>
    </linearGradient>
  </defs>
  <rect width="1800" height="945" fill="url(#sky)"/>
  ${mapGrid()}
  ${grainDots()}
  <rect width="1800" height="10" fill="#1a3355"/>
  <text x="70" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#1a3355">${escaped}</text>
  <rect x="70" y="${y + 22}" width="220" height="8" rx="4" fill="#c0392b"/>
  <text x="70" y="${y + 72}" font-family="${FONT}" font-size="32" font-weight="600" fill="#3d5a73">${sub}</text>
  ${postcardPin(1140, 230, 1.22)}
  <g transform="translate(78,150)">
    <rect width="148" height="36" rx="4" fill="#fff8ee" stroke="#1a3355" stroke-width="3"/>
    <text x="74" y="24" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="800" fill="#1a3355">RANK 1–5</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: SKY })
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
    { title: "여행받은편지함", subtitle: "여행 저장함", files: ["og-image.png", "og-image-ko.png"] },
    { title: "Place Inbox", subtitle: "Travel saves", files: ["og-image-en.png"] },
    { title: "旅の受信箱", subtitle: "旅の保存箱", files: ["og-image-ja.png"] },
    { title: "旅行收件箱", subtitle: "旅行保存箱", files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job.title, job.subtitle));
    for (const file of job.files) {
      await contain(buf, path.join(OUT, file));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
