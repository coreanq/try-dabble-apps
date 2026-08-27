const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT = path.join(__dirname, "public");
const ICONS = path.join(OUT, "icons");
const KRAFT = { r: 214, g: 184, b: 132, alpha: 1 };
const FONT = "Noto Sans CJK KR, Noto Sans CJK JP, Noto Sans CJK SC, Impact, sans-serif";
const STENCIL = "Impact, Haettenschweiler, Noto Sans CJK KR, sans-serif";
const MONO = "Noto Sans Mono CJK KR, Courier New, ui-monospace, monospace";

function grainDots() {
  const dots = [];
  let seed = 41;
  for (let i = 0; i < 110; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.035 + (seed % 8) / 140;
    dots.push(`<circle cx="${x}" cy="${y}" r="1.15" fill="rgba(62,42,18,${o.toFixed(3)})"/>`);
  }
  return dots.join("");
}

function fakeQr(x, y, size) {
  const cells = 11;
  const g = size / cells;
  const bits = [
    "11111110111",
    "10000010101",
    "10111010111",
    "10111010001",
    "10111010101",
    "10000010111",
    "11111110101",
    "00000000111",
    "11010111001",
    "10101010111",
    "11101110101",
  ];
  const rects = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (bits[r][c] === "1") {
        rects.push(`<rect x="${(x + c * g).toFixed(2)}" y="${(y + r * g).toFixed(2)}" width="${(g * 0.94).toFixed(2)}" height="${(g * 0.94).toFixed(2)}" fill="#1c1408"/>`);
      }
    }
  }
  return `<g>${rects.join("")}</g>`;
}

function movingBox(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="210" cy="318" rx="188" ry="22" fill="rgba(62,42,18,0.18)"/>
    <polygon points="70,118 250,70 390,118 210,176" fill="#c48a48"/>
    <polygon points="70,118 210,176 210,300 70,236" fill="#a56b32"/>
    <polygon points="210,176 390,118 390,236 210,300" fill="#d2a05c"/>
    <polygon points="70,118 160,92 250,70 210,118" fill="#b97a3c"/>
    <polygon points="250,70 340,96 390,118 300,140" fill="#e0b36a"/>
    <line x1="210" y1="176" x2="210" y2="300" stroke="#7a4c22" stroke-width="3"/>
    <rect x="88" y="160" width="100" height="86" rx="4" fill="#f7f1e2" stroke="#3e2a12" stroke-width="3"/>
    ${fakeQr(100, 168, 48)}
    <text x="138" y="232" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="800" fill="#3e2a12">BOX 12</text>
    <g transform="translate(286,196) rotate(-18)">
      <rect x="-46" y="-22" width="92" height="44" rx="4" fill="#f4efe3" stroke="#9a1f1f" stroke-width="4"/>
      <text x="0" y="6" text-anchor="middle" font-family="${STENCIL}" font-size="16" font-weight="800" fill="#9a1f1f">FRAGILE</text>
    </g>
    <rect x="248" y="248" width="86" height="28" rx="3" fill="#f0b429" stroke="#3e2a12" stroke-width="2"/>
    <text x="291" y="267" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="800" fill="#3e2a12">#12</text>
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
  if (n <= 4) return 118;
  if (n <= 7) return 96;
  if (n <= 10) return 82;
  return 70;
}

function svgFor(title, subtitle) {
  const escaped = esc(title);
  const sub = esc(subtitle || "");
  const fontSize = titleSize(title);
  const y = 500;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8d3a8"/>
      <stop offset="100%" stop-color="#d6b884"/>
    </linearGradient>
    <linearGradient id="flap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c48a48"/>
      <stop offset="100%" stop-color="#a56b32"/>
    </linearGradient>
    <pattern id="corrugate" width="14" height="14" patternUnits="userSpaceOnUse">
      <path d="M0 14 L14 0" stroke="rgba(92,58,22,0.08)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1800" height="945" fill="url(#paper)"/>
  <rect width="1800" height="945" fill="url(#corrugate)"/>
  ${grainDots()}
  <rect width="1800" height="108" fill="url(#flap)"/>
  <rect y="108" width="1800" height="14" fill="#f0b429"/>
  <rect y="122" width="1800" height="6" fill="#3e2a12"/>
  <text x="72" y="72" font-family="${MONO}" font-size="28" font-weight="800" fill="#f7f1e2" letter-spacing="6">FRAGILE · THIS WAY UP</text>
  <text x="72" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="800" fill="#1c1408">${escaped}</text>
  <rect x="72" y="${y + 18}" width="240" height="10" rx="2" fill="#f0b429"/>
  <text x="72" y="${y + 72}" font-family="${FONT}" font-size="34" font-weight="700" fill="#5c3a16">${sub}</text>
  ${movingBox(1080, 250, 1.42)}
  <g transform="translate(72,168)">
    <rect width="168" height="40" rx="3" fill="#f7f1e2" stroke="#3e2a12" stroke-width="3"/>
    <text x="84" y="27" text-anchor="middle" font-family="${MONO}" font-size="16" font-weight="800" fill="#3e2a12">NO ACCOUNT</text>
  </g>
  <g transform="translate(256,168)">
    <rect width="148" height="40" rx="3" fill="#f7f1e2" stroke="#3d5c34" stroke-width="3"/>
    <text x="74" y="27" text-anchor="middle" font-family="${MONO}" font-size="16" font-weight="800" fill="#3d5c34">NO CAP</text>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#d6b884"/>
  <rect y="0" width="512" height="52" fill="#a56b32"/>
  <rect y="52" width="512" height="10" fill="#f0b429"/>
  <g transform="translate(56,86)">
    <ellipse cx="200" cy="368" rx="186" ry="20" fill="rgba(62,42,18,0.16)"/>
    <polygon points="40,128 200,64 360,128 200,200" fill="#c48a48"/>
    <polygon points="40,128 200,200 200,360 40,280" fill="#a56b32"/>
    <polygon points="200,200 360,128 360,280 200,360" fill="#d2a05c"/>
    <rect x="64" y="214" width="108" height="78" rx="6" fill="#f7f1e2" stroke="#3e2a12" stroke-width="5"/>
    <g transform="translate(76,226)">
      <rect width="14" height="14" fill="#1c1408"/>
      <rect x="20" width="14" height="14" fill="#1c1408"/>
      <rect x="60" width="14" height="14" fill="#1c1408"/>
      <rect y="20" width="14" height="14" fill="#1c1408"/>
      <rect x="40" y="20" width="14" height="14" fill="#1c1408"/>
      <rect x="70" y="20" width="14" height="14" fill="#1c1408"/>
      <rect y="40" width="14" height="14" fill="#1c1408"/>
      <rect x="20" y="40" width="14" height="14" fill="#1c1408"/>
      <rect x="50" y="40" width="14" height="14" fill="#1c1408"/>
      <rect x="20" y="10" width="8" height="8" fill="#1c1408"/>
    </g>
    <rect x="236" y="268" width="96" height="36" rx="4" fill="#f0b429" stroke="#3e2a12" stroke-width="3"/>
    <text x="284" y="294" text-anchor="middle" font-family="${STENCIL}" font-size="22" font-weight="800" fill="#1c1408">#12</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: KRAFT })
    .png()
    .toFile(output);
  const m = await sharp(output).metadata();
  if (m.width !== 1200 || m.height !== 630) {
    throw new Error(`bad og size ${output} ${m.width}x${m.height}`);
  }
  console.log(output, m.width, m.height);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  const jobs = [
    { title: "상자QR", subtitle: "짐이 어느 상자인지", files: ["og-image.png", "og-image-ko.png"] },
    { title: "Box QR", subtitle: "Which box has it", files: ["og-image-en.png"] },
    { title: "箱QR", subtitle: "どの箱にあるか", files: ["og-image-ja.png"] },
    { title: "箱子QR", subtitle: "东西在哪箱", files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job.title, job.subtitle));
    for (const file of job.files) {
      await contain(buf, path.join(OUT, file));
    }
  }
  const iconBuf = Buffer.from(iconSvg());
  await sharp(iconBuf).resize(192, 192, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-192.png"));
  await sharp(iconBuf).resize(512, 512, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-512.png"));
  await sharp(iconBuf).resize(180, 180, { fit: "cover" }).png().toFile(path.join(ICONS, "apple-touch-icon.png"));
  await sharp(iconBuf).resize(32, 32, { fit: "cover" }).png().toFile(path.join(OUT, "favicon.ico"));
  const i192 = await sharp(path.join(ICONS, "icon-192.png")).metadata();
  const i512 = await sharp(path.join(ICONS, "icon-512.png")).metadata();
  const i180 = await sharp(path.join(ICONS, "apple-touch-icon.png")).metadata();
  console.log("icons", i192.width, i192.height, i512.width, i512.height, i180.width, i180.height);
}

main().catch((e) => { console.error(e); process.exit(1); });
