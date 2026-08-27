// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Omok card: a close crop of the board at the moment the game ends.
 * No headline over an illustration — the grid runs edge to edge, five black
 * stones are already connected under a vermilion marker, and the name sits on
 * a paper slip laid on the wood with a seal beside it.
 */

const OUT = path.join(import.meta.dirname, "public");
const WOOD_BG = { r: 219, g: 172, b: 107, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const serif = (lang, latin) => `${latin ? latin + ", " : ""}Noto Serif CJK ${CJK[lang]}, serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const LINE = "#4a3418";
const SLIP = "#f7f0dd";
const VERMILION = "#b8382b";
const INK = "#2a1e10";

const S = 84;
const P = (i, j) => [42 + i * S, 42 + j * S];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.58;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

function woodGrain() {
  const out = [];
  let seed = 1301;
  for (let i = 0; i < 90; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const h = 90 + (seed % 420);
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.03 + (seed % 6) / 150;
    const bow = 6 + (seed % 14);
    out.push(`<path d="M${x} ${y} q${bow} ${h / 2} 0 ${h}" fill="none" stroke="rgba(96,62,22,${o.toFixed(3)})" stroke-width="${2 + (seed % 3)}"/>`);
  }
  return out.join("");
}

function grid() {
  const out = [];
  for (let i = 0; i <= 21; i++) {
    const [x] = P(i, 0);
    out.push(`<rect x="${x - 1}" y="0" width="2.5" height="945" fill="${LINE}" opacity="0.72"/>`);
  }
  for (let j = 0; j <= 10; j++) {
    const [, y] = P(0, j);
    out.push(`<rect x="0" y="${y - 1}" width="1800" height="2.5" fill="${LINE}" opacity="0.72"/>`);
  }
  for (const [i, j] of [[3, 2], [10, 2], [17, 2], [3, 8], [10, 8], [17, 8], [10, 5]]) {
    const [x, y] = P(i, j);
    out.push(`<circle cx="${x}" cy="${y}" r="8" fill="${LINE}" opacity="0.85"/>`);
  }
  return out.join("");
}

function stone(i, j, black) {
  const [x, y] = P(i, j);
  return black
    ? `<g>
        <ellipse cx="${x}" cy="${y + 7}" rx="37" ry="12" fill="rgba(60,38,12,0.30)"/>
        <circle cx="${x}" cy="${y}" r="37" fill="url(#blackStone)"/>
        <ellipse cx="${x - 12}" cy="${y - 14}" rx="12" ry="8" fill="rgba(255,255,255,0.22)" transform="rotate(-28 ${x - 12} ${y - 14})"/>
      </g>`
    : `<g>
        <ellipse cx="${x}" cy="${y + 7}" rx="37" ry="12" fill="rgba(60,38,12,0.28)"/>
        <circle cx="${x}" cy="${y}" r="37" fill="url(#whiteStone)"/>
        <ellipse cx="${x - 12}" cy="${y - 15}" rx="13" ry="8" fill="rgba(255,255,255,0.85)" transform="rotate(-28 ${x - 12} ${y - 15})"/>
      </g>`;
}

function winMarker(a, b) {
  const [x1, y1] = P(...a);
  const [x2, y2] = P(...b);
  return `
  <g>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${VERMILION}" stroke-width="86" stroke-linecap="round" opacity="0.20"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${VERMILION}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>
  </g>`;
}

function seal(lang) {
  return `
  <g transform="translate(742,60) rotate(3)">
    <rect x="0" y="0" width="96" height="128" rx="6" fill="${VERMILION}"/>
    <rect x="8" y="8" width="80" height="112" rx="3" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="4"/>
    <text x="48" y="60" text-anchor="middle" font-family="${serif(lang)}" font-size="42" font-weight="700" fill="#fff">五</text>
    <text x="48" y="108" text-anchor="middle" font-family="${serif(lang)}" font-size="42" font-weight="700" fill="#fff">目</text>
  </g>`;
}

function slip(lang, title, subtitle, meta) {
  const titleSize = fitSize(title, 620, [104, 90, 78, 66, 56]);
  const subSize = fitSize(subtitle, 640, [34, 30, 27, 24]);
  return `
  <g transform="translate(96,566) rotate(-1.1)">
    <rect x="10" y="14" width="900" height="266" fill="rgba(52,32,10,0.28)"/>
    <rect x="0" y="0" width="900" height="266" fill="${SLIP}"/>
    <rect x="0" y="0" width="900" height="266" fill="none" stroke="rgba(74,52,24,0.35)" stroke-width="3"/>
    <rect x="22" y="22" width="900" height="0" fill="none"/>
    <rect x="0" y="0" width="14" height="266" fill="${VERMILION}"/>
    <text x="60" y="${118 + titleSize * 0.3}" font-family="${serif(lang, "URW Bookman")}" font-size="${titleSize}" font-weight="700" fill="${INK}">${esc(title)}</text>
    <text x="60" y="${188 + subSize * 0.3}" font-family="${serif(lang)}" font-size="${subSize}" font-weight="600" fill="rgba(42,30,16,0.66)">${esc(subtitle)}</text>
    <text x="60" y="242" font-family="${mono(lang)}" font-size="22" font-weight="700" fill="rgba(42,30,16,0.5)" letter-spacing="3">${esc(meta)}</text>
    ${seal(lang)}
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, meta } = job;
  const whites = [[11, 1], [12, 3], [13, 6], [15, 2], [16, 5], [18, 3], [14, 8], [10, 4], [4, 1], [3, 3]];
  const blacks = [[13, 1], [16, 2], [11, 6], [19, 5], [17, 7], [5, 2]];
  const win = [[12, 2], [13, 3], [14, 4], [15, 5], [16, 6]];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="board" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#e6bd7f"/>
      <stop offset="52%" stop-color="#dbac6b"/>
      <stop offset="100%" stop-color="#c8944f"/>
    </linearGradient>
    <radialGradient id="blackStone" cx="0.34" cy="0.3" r="0.86">
      <stop offset="0%" stop-color="#4b4740"/>
      <stop offset="52%" stop-color="#1e1c19"/>
      <stop offset="100%" stop-color="#0c0b0a"/>
    </radialGradient>
    <radialGradient id="whiteStone" cx="0.34" cy="0.3" r="0.86">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="62%" stop-color="#f4efe2"/>
      <stop offset="100%" stop-color="#d9d0bb"/>
    </radialGradient>
    <radialGradient id="vign" cx="0.5" cy="0.45" r="0.78">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(60,36,8,0.26)"/>
    </radialGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#board)"/>
  ${woodGrain()}
  ${grid()}
  ${winMarker(win[0], win[4])}
  ${whites.map(([i, j]) => stone(i, j, false)).join("")}
  ${blacks.map(([i, j]) => stone(i, j, true)).join("")}
  ${win.map(([i, j]) => stone(i, j, true)).join("")}
  <rect width="1800" height="945" fill="url(#vign)"/>
  ${slip(lang, title, subtitle, meta)}
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: WOOD_BG })
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
    { lang: "ko", title: "오목", subtitle: "먼저 다섯을 잇는 쪽이 이깁니다", meta: "혼자 · 둘이 · 브라우저에서 바로", files: ["og-image.png", "og-image-ko.png"] },
    { lang: "en", title: "Gomoku", subtitle: "First to connect five wins", meta: "SOLO · TWO PLAYER · IN THE BROWSER", files: ["og-image-en.png"] },
    { lang: "ja", title: "五目並べ", subtitle: "先に五つ並べたほうが勝ち", meta: "ひとり · ふたり · ブラウザですぐ", files: ["og-image-ja.png"] },
    { lang: "zh", title: "五子棋", subtitle: "先连成五子者胜", meta: "单人 · 双人 · 打开浏览器就下", files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
