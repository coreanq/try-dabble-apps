const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT = path.join(__dirname, "public");
const GRAY = { r: 232, g: 230, b: 226, alpha: 1 };
const FONT = "Noto Serif CJK KR, Noto Serif CJK JP, Noto Serif CJK SC, serif";
const MONO = "Courier New, ui-monospace, monospace";

function grainDots() {
  const dots = [];
  let seed = 53;
  for (let i = 0; i < 80; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.04 + (seed % 8) / 130;
    dots.push(`<circle cx="${x}" cy="${y}" r="1.15" fill="rgba(70,68,64,${o.toFixed(3)})"/>`);
  }
  return dots.join("");
}

function idPhotoFrame(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="170" cy="430" rx="190" ry="20" fill="rgba(60,58,54,0.16)"/>
    <rect x="8" y="8" width="324" height="404" rx="10" fill="#cfcbc4" stroke="#8a8680" stroke-width="3"/>
    <rect x="28" y="28" width="284" height="364" rx="4" fill="#f4f2ee"/>
    <rect x="40" y="40" width="260" height="340" fill="#d8d4ce"/>
    <rect x="40" y="40" width="260" height="210" fill="#c8d0d6"/>
    <ellipse cx="170" cy="168" rx="62" ry="74" fill="#6e6a64"/>
    <ellipse cx="170" cy="156" rx="48" ry="56" fill="#8a8680"/>
    <path d="M92 380 C96 292, 244 292, 248 380 Z" fill="#4a4844"/>
    <path d="M108 380 C114 318, 226 318, 232 380 Z" fill="#5c5a56"/>
    <rect x="40" y="40" width="260" height="340" fill="none" stroke="#3a3834" stroke-width="3"/>
    <g fill="none" stroke="#3a3834" stroke-width="6" stroke-linecap="square">
      <path d="M28 62 L28 28 L62 28"/>
      <path d="M278 28 L312 28 L312 62"/>
      <path d="M28 358 L28 392 L62 392"/>
      <path d="M278 392 L312 392 L312 358"/>
    </g>
    <rect x="96" y="392" width="148" height="28" rx="4" fill="#3a3834"/>
    <text x="170" y="412" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="800" fill="#f4f2ee">3.5 × 4.5</text>
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
    <linearGradient id="studio" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0eeea"/>
      <stop offset="100%" stop-color="#e8e6e2"/>
    </linearGradient>
  </defs>
  <rect width="1800" height="945" fill="url(#studio)"/>
  ${grainDots()}
  <rect width="1800" height="10" fill="#6b6660"/>
  <text x="70" y="${y}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#2a2824">${escaped}</text>
  <rect x="70" y="${y + 22}" width="220" height="8" rx="4" fill="#6b6660"/>
  <text x="70" y="${y + 72}" font-family="${FONT}" font-size="32" font-weight="600" fill="#6b6660">${sub}</text>
  ${idPhotoFrame(1220, 200, 1.18)}
  <g transform="translate(78,150)">
    <rect width="168" height="36" rx="4" fill="#f4f2ee" stroke="#6b6660" stroke-width="3"/>
    <text x="84" y="24" text-anchor="middle" font-family="${MONO}" font-size="15" font-weight="800" fill="#3a3834">ID PHOTO</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: GRAY })
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
    { title: "사진규격", subtitle: "픽셀과 KB에 맞추기", files: ["og-image.png", "og-image-ko.png"] },
    { title: "Photo Spec", subtitle: "Fit to pixels & KB", files: ["og-image-en.png"] },
    { title: "写真規格", subtitle: "ピクセルとKBに合わせる", files: ["og-image-ja.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job.title, job.subtitle));
    for (const file of job.files) {
      await contain(buf, path.join(OUT, file));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
