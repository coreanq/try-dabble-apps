// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(import.meta.dirname, "public");
const OLIVE = { r: 48, g: 46, b: 32, alpha: 1 };
const FONT = "Noto Serif CJK KR, Noto Serif CJK JP, Noto Serif CJK SC, serif";
const MONO = "Courier New, ui-monospace, monospace";

function grainDots() {
  const dots = [];
  let seed = 19;
  for (let i = 0; i < 90; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.04 + (seed % 8) / 120;
    dots.push(`<circle cx="${x}" cy="${y}" r="1.2" fill="rgba(212,184,110,${o.toFixed(3)})"/>`);
  }
  return dots.join("");
}

function stone(cx, cy, color) {
  const fill = color === "black" ? "#1a1814" : "#f6efe2";
  const hi = color === "black" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.85)";
  const rim = color === "black" ? "#0a0908" : "#d8cbb0";
  return `
    <circle cx="${cx}" cy="${cy}" r="16" fill="rgba(0,0,0,0.22)"/>
    <circle cx="${cx}" cy="${cy - 2}" r="16" fill="${fill}" stroke="${rim}" stroke-width="1.5"/>
    <ellipse cx="${cx - 4}" cy="${cy - 7}" rx="5" ry="3.2" fill="${hi}"/>
  `;
}

function woodBoard(x, y, s) {
  const lines = [];
  const origin = 36;
  const step = 36;
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const p = origin + i * step;
    lines.push(`<line x1="${origin}" y1="${p}" x2="${origin + n * step}" y2="${p}" stroke="#5a3e1b" stroke-width="1.6"/>`);
    lines.push(`<line x1="${p}" y1="${origin}" x2="${p}" y2="${origin + n * step}" stroke="#5a3e1b" stroke-width="1.6"/>`);
  }
  const blacks = [[3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [2, 5], [6, 3]];
  const whites = [[3, 4], [4, 5], [5, 4], [5, 6], [6, 5], [4, 3]];
  const stones = [
    ...blacks.map(([c, r]) => stone(origin + c * step, origin + r * step, "black")),
    ...whites.map(([c, r]) => stone(origin + c * step, origin + r * step, "white")),
  ].join("");
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="216" cy="456" rx="210" ry="18" fill="rgba(0,0,0,0.32)"/>
    <rect x="0" y="0" width="432" height="432" rx="18" fill="#8a6230"/>
    <rect x="14" y="14" width="404" height="404" rx="10" fill="#d4b06a"/>
    <rect x="14" y="14" width="404" height="404" rx="10" fill="url(#woodgrain)" opacity="0.35"/>
    ${lines.join("")}
    <circle cx="${origin + 2 * step}" cy="${origin + 2 * step}" r="3" fill="#5a3e1b"/>
    <circle cx="${origin + 8 * step}" cy="${origin + 2 * step}" r="3" fill="#5a3e1b"/>
    <circle cx="${origin + 5 * step}" cy="${origin + 5 * step}" r="3" fill="#5a3e1b"/>
    <circle cx="${origin + 2 * step}" cy="${origin + 8 * step}" r="3" fill="#5a3e1b"/>
    <circle cx="${origin + 8 * step}" cy="${origin + 8 * step}" r="3" fill="#5a3e1b"/>
    ${stones}
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
    <linearGradient id="olive" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3c3a28"/>
      <stop offset="100%" stop-color="#302e20"/>
    </linearGradient>
    <linearGradient id="woodgrain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0d08a"/>
      <stop offset="50%" stop-color="#c49650"/>
      <stop offset="100%" stop-color="#e0bc78"/>
    </linearGradient>
  </defs>
  <rect width="1800" height="945" fill="url(#olive)"/>
  ${grainDots()}
  <rect width="1800" height="8" fill="#d4b06a"/>
  <text x="70" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#f3e6c4">${escaped}</text>
  <rect x="70" y="${y + 22}" width="220" height="8" rx="4" fill="#d4b06a"/>
  <text x="70" y="${y + 72}" font-family="${FONT}" font-size="32" font-weight="600" fill="#c4b48a">${sub}</text>
  ${woodBoard(1180, 190, 1.12)}
  <g transform="translate(78,150)">
    <rect width="132" height="36" rx="4" fill="#302e20" stroke="#d4b06a" stroke-width="3"/>
    <text x="66" y="24" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="800" fill="#d4b06a">15 × 15</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: OLIVE })
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
    { title: "오목", subtitle: "다섯을 잇다", files: ["og-image.png", "og-image-ko.png"] },
    { title: "Gomoku", subtitle: "Five in a row", files: ["og-image-en.png"] },
    { title: "五目並べ", subtitle: "五つを並べる", files: ["og-image-ja.png"] },
    { title: "五子棋", subtitle: "连成五子", files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job.title, job.subtitle));
    for (const file of job.files) {
      await contain(buf, path.join(OUT, file));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
