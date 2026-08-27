import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.join(__dirname, "public");
const PLUM = { r: 28, g: 16, b: 22, alpha: 1 };
const FONT = "Noto Serif CJK KR, Noto Serif CJK JP, Noto Serif CJK SC, serif";
const MONO = "Courier New, ui-monospace, monospace";

function grainDots() {
  const dots = [];
  let seed = 73;
  for (let i = 0; i < 80; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.04 + (seed % 8) / 130;
    dots.push(`<circle cx="${x}" cy="${y}" r="1.15" fill="rgba(240,120,96,${o.toFixed(3)})"/>`);
  }
  return dots.join("");
}

function giftDrawer(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="210" cy="430" rx="210" ry="20" fill="rgba(0,0,0,0.35)"/>
    <rect x="28" y="8" width="364" height="390" rx="18" fill="#3a241c"/>
    <rect x="40" y="20" width="340" height="366" rx="12" fill="#5a3828"/>
    <rect x="52" y="36" width="316" height="78" rx="8" fill="#6b4330"/>
    <rect x="188" y="64" width="44" height="22" rx="11" fill="#d4a574"/>
    <rect x="196" y="70" width="28" height="10" rx="5" fill="#8a5a38"/>
    <rect x="52" y="128" width="316" height="78" rx="8" fill="#6b4330"/>
    <rect x="188" y="156" width="44" height="22" rx="11" fill="#d4a574"/>
    <rect x="196" y="162" width="28" height="10" rx="5" fill="#8a5a38"/>
    <rect x="40" y="228" width="340" height="18" rx="4" fill="#2a1812"/>
    <g transform="translate(18,246)">
      <rect x="8" y="8" width="388" height="168" rx="10" fill="#4a2c20"/>
      <rect x="20" y="20" width="364" height="144" rx="8" fill="#7a4a34"/>
      <rect x="186" y="78" width="44" height="22" rx="11" fill="#d4a574"/>
      <rect x="194" y="84" width="28" height="10" rx="5" fill="#8a5a38"/>
      <g transform="translate(118,8)">
        <rect x="0" y="22" width="168" height="118" rx="10" fill="#f07860"/>
        <rect x="68" y="22" width="32" height="118" fill="#f4e2c8"/>
        <rect x="0" y="64" width="168" height="28" fill="#f4e2c8"/>
        <path d="M68 22 C68 4, 84 -6, 100 10 C116 -6, 132 4, 132 22 Z" fill="#e05a48"/>
        <circle cx="100" cy="22" r="8" fill="#f4e2c8"/>
      </g>
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
    <radialGradient id="blush" cx="12%" cy="0%" r="50%">
      <stop offset="0%" stop-color="#f07860" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1c1016" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gold" cx="92%" cy="80%" r="40%">
      <stop offset="0%" stop-color="#d4a574" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#1c1016" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1800" height="945" fill="#1c1016"/>
  <rect width="1800" height="945" fill="url(#blush)"/>
  <rect width="1800" height="945" fill="url(#gold)"/>
  ${grainDots()}
  <rect width="1800" height="8" fill="#f07860"/>
  <text x="70" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#f8efe8">${escaped}</text>
  <rect x="70" y="${y + 22}" width="220" height="8" rx="4" fill="#f07860"/>
  <text x="70" y="${y + 72}" font-family="${FONT}" font-size="32" font-weight="600" fill="#c9a89a">${sub}</text>
  ${giftDrawer(1160, 170, 1.18)}
  <g transform="translate(78,150)">
    <rect width="156" height="36" rx="4" fill="#1c1016" stroke="#f07860" stroke-width="3"/>
    <text x="78" y="24" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="800" fill="#f07860">FOR SOMEONE</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: PLUM })
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
    { title: "선물서랍", subtitle: "아이디어를 서랍에", files: ["og-image.png", "og-image-ko.png"] },
    { title: "Gift Stash", subtitle: "Ideas in a drawer", files: ["og-image-en.png"] },
    { title: "プレゼント引き出し", subtitle: "引き出しにしまう", files: ["og-image-ja.png"] },
    { title: "礼物抽屉", subtitle: "把灵感放进抽屉", files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job.title, job.subtitle));
    for (const file of job.files) {
      await contain(buf, path.join(OUT, file));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
