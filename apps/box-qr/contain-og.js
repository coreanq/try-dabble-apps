// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Box QR card: the flat face of a packed moving box.
 * Corrugated kraft, a run of packing tape, and the shipping label you actually
 * scan — the label carries the contents list, so the card shows the moment the
 * app is for: standing in a room asking which box the kettle is in.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const KRAFT_BG = { r: 197, g: 150, b: 90, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;
const STENCIL = (lang) => `Nimbus Sans Narrow, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#3a2a12";
const LABEL = "#f8f4e8";
const ORANGE = "#d9701c";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.52;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

function grain() {
  const out = [];
  let seed = 43;
  for (let i = 0; i < 200; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.05 + (seed % 9) / 130;
    out.push(`<rect x="${x}" y="${y}" width="${2 + (seed % 4)}" height="2" fill="rgba(62,42,18,${o.toFixed(3)})"/>`);
  }
  return out.join("");
}

/** Finder-pattern corners plus a deterministic module field: reads as a QR. */
function qr(x, y, size) {
  const n = 25;
  const m = size / n;
  const cells = [];
  const finder = (fx, fy) => `
    <rect x="${x + fx * m}" y="${y + fy * m}" width="${m * 7}" height="${m * 7}" fill="${INK}"/>
    <rect x="${x + (fx + 1) * m}" y="${y + (fy + 1) * m}" width="${m * 5}" height="${m * 5}" fill="${LABEL}"/>
    <rect x="${x + (fx + 2) * m}" y="${y + (fy + 2) * m}" width="${m * 3}" height="${m * 3}" fill="${INK}"/>`;
  const inFinder = (r, c) =>
    (r < 8 && c < 8) || (r < 8 && c > n - 9) || (r > n - 9 && c < 8);
  let seed = 20260827;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (inFinder(r, c)) continue;
      if ((seed >> 7) % 100 < 46) {
        cells.push(`<rect x="${x + c * m}" y="${y + r * m}" width="${m}" height="${m}" fill="${INK}"/>`);
      }
    }
  }
  return `<g>${cells.join("")}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</g>`;
}

function barcode(x, y, w, h) {
  const bars = [];
  let seed = 991;
  let cx = x;
  while (cx < x + w - 6) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const bw = 3 + ((seed >> 5) % 4) * 2;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const gap = 3 + ((seed >> 9) % 3) * 2;
    bars.push(`<rect x="${cx}" y="${y}" width="${bw}" height="${h}" fill="${INK}"/>`);
    cx += bw + gap;
  }
  return bars.join("");
}

/** A torn strip of packing tape laid diagonally across a label corner. */
function cornerTape(cx, cy) {
  return `
  <g transform="translate(${cx},${cy}) rotate(-45)">
    <rect x="-92" y="-32" width="184" height="64" fill="rgba(240,214,158,0.74)"/>
    <rect x="-92" y="-32" width="184" height="3" fill="rgba(255,255,255,0.55)"/>
    <rect x="-92" y="29" width="184" height="3" fill="rgba(62,42,18,0.22)"/>
    <rect x="-92" y="-10" width="184" height="2" fill="rgba(255,255,255,0.28)"/>
  </g>`;
}

function shippingLabel(job) {
  const { lang, boxCode, contentsHead, contents, roomLabel, room, scanHint } = job;
  const x = 852;
  const y = 232;
  const w = 852;
  const h = 528;
  const lines = contents
    .map((c, i) => `
    <rect x="${x + 372}" y="${y + 200 + i * 56}" width="16" height="16" fill="${ORANGE}"/>
    <text x="${x + 404}" y="${y + 215 + i * 56}" font-family="${sans(lang)}" font-size="${fitSize(c, 420, [30, 27, 24, 21])}" font-weight="600" fill="${INK}">${esc(c)}</text>`)
    .join("");
  return `
  <g>
    <rect x="${x + 8}" y="${y + 14}" width="${w}" height="${h}" rx="4" fill="rgba(48,30,10,0.32)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${LABEL}"/>
    <rect x="${x}" y="${y}" width="${w}" height="70" fill="${INK}"/>
    <text x="${x + 88}" y="${y + 48}" font-family="${mono(lang)}" font-size="30" font-weight="800" fill="${LABEL}" letter-spacing="4">${esc(boxCode)}</text>
    <text x="${x + w - 26}" y="${y + 47}" text-anchor="end" font-family="${mono(lang)}" font-size="24" font-weight="700" fill="rgba(248,244,232,0.72)">box-qr.try-dabble.com</text>

    ${qr(x + 40, y + 108, 300)}
    <text x="${x + 190}" y="${y + 452}" text-anchor="middle" font-family="${mono(lang)}" font-size="22" font-weight="700" fill="#6f5a36">${esc(scanHint)}</text>

    <rect x="${x + 372}" y="${y + 108}" width="${w - 412}" height="3" fill="${INK}" opacity="0.35"/>
    <text x="${x + 372}" y="${y + 158}" font-family="${mono(lang)}" font-size="24" font-weight="800" fill="${ORANGE}" letter-spacing="3">${esc(contentsHead)}</text>
    ${lines}
    <text x="${x + 372}" y="${y + 424}" font-family="${mono(lang)}" font-size="22" font-weight="700" fill="#6f5a36">${esc(roomLabel)}</text>
    <text x="${x + 372}" y="${y + 462}" font-family="${sans(lang)}" font-size="34" font-weight="700" fill="${INK}">${esc(room)}</text>
    ${barcode(x + 372, y + 480, w - 412, 30)}
  </g>
  ${cornerTape(x, y)}
  ${cornerTape(x + w, y + h)}`;
}

function thisSideUp(lang, label) {
  return `
  <g transform="translate(110,108)" opacity="0.55">
    <path d="M0 60 L26 8 L52 60 L36 60 L36 96 L16 96 L16 60 Z" fill="${INK}"/>
    <path d="M70 60 L96 8 L122 60 L106 60 L106 96 L86 96 L86 60 Z" fill="${INK}"/>
    <text x="146" y="76" font-family="${mono(lang)}" font-size="30" font-weight="800" fill="${INK}" letter-spacing="4">${esc(label)}</text>
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, sideUp } = job;
  const titleSize = fitSize(title, 660, [140, 122, 104, 88, 74]);
  const subSize = fitSize(subtitle, 700, [32, 29, 26, 23]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="kraft" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#d3a76a"/>
      <stop offset="55%" stop-color="#c5965a"/>
      <stop offset="100%" stop-color="#b3833f"/>
    </linearGradient>
    <pattern id="flute" width="26" height="26" patternUnits="userSpaceOnUse">
      <rect width="13" height="26" fill="rgba(255,255,255,0.055)"/>
      <rect x="13" width="13" height="26" fill="rgba(62,42,18,0.045)"/>
    </pattern>
    <filter id="spray" x="-20%" y="-40%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="url(#kraft)"/>
  <rect width="1800" height="945" fill="url(#flute)"/>
  ${grain()}
  <rect x="0" y="856" width="1800" height="5" fill="rgba(62,42,18,0.22)"/>
  <rect x="0" y="861" width="1800" height="3" fill="rgba(255,255,255,0.14)"/>

  ${thisSideUp(lang, sideUp)}

  <g>
    <text x="110" y="${492 + titleSize * 0.3}" font-family="${STENCIL(lang)}" font-size="${titleSize}" font-weight="700" fill="rgba(58,42,18,0.45)" filter="url(#spray)">${esc(title)}</text>
    <text x="110" y="${492 + titleSize * 0.3}" font-family="${STENCIL(lang)}" font-size="${titleSize}" font-weight="700" fill="${INK}">${esc(title)}</text>
  </g>
  <rect x="110" y="${524 + titleSize * 0.3}" width="200" height="9" fill="${ORANGE}"/>
  <text x="110" y="${592 + titleSize * 0.3 + subSize * 0.3}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="rgba(58,42,18,0.82)">${esc(subtitle)}</text>

  ${shippingLabel(job)}
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
    <text x="284" y="294" text-anchor="middle" font-family="Impact, Haettenschweiler, Noto Sans CJK KR, sans-serif" font-size="22" font-weight="800" fill="#1c1408">#12</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: KRAFT_BG })
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
    {
      lang: "ko", title: "상자QR", subtitle: "‘레고’로 검색하면 어느 상자인지 나옵니다",
      sideUp: "위로", boxCode: "BOX 12 · 안방", contentsHead: "내용물",
      contents: ["전기 주전자", "레고 상자 3개", "겨울 이불"],
      roomLabel: "놓을 곳", room: "주방 · 두 번째 선반", scanHint: "상자에 붙이고 스캔",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en", title: "Box QR", subtitle: "Search “lego” and it tells you which box",
      sideUp: "THIS SIDE UP", boxCode: "BOX 12 · BEDROOM", contentsHead: "CONTENTS",
      contents: ["Electric kettle", "3 boxes of lego", "Winter duvet"],
      roomLabel: "GOES TO", room: "Kitchen · second shelf", scanHint: "Tape it on, then scan",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja", title: "箱QR", subtitle: "「レゴ」で検索すればどの箱か分かる",
      sideUp: "上", boxCode: "BOX 12 · 寝室", contentsHead: "内容物",
      contents: ["電気ケトル", "レゴ 3箱", "冬の掛け布団"],
      roomLabel: "置き場所", room: "台所 · 二段目", scanHint: "箱に貼って読み取る",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh", title: "箱子QR", subtitle: "搜「乐高」就知道在哪个箱子",
      sideUp: "向上", boxCode: "BOX 12 · 卧室", contentsHead: "内容",
      contents: ["电热水壶", "乐高 3盒", "冬季被子"],
      roomLabel: "放置处", room: "厨房 · 第二层", scanHint: "贴在箱上再扫码",
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
  const iconBuf = Buffer.from(iconSvg());
  await sharp(iconBuf).resize(192, 192, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-192.png"));
  await sharp(iconBuf).resize(512, 512, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-512.png"));
  await sharp(iconBuf).resize(180, 180, { fit: "cover" }).png().toFile(path.join(ICONS, "apple-touch-icon.png"));
  await sharp(iconBuf).resize(32, 32, { fit: "cover" }).png().toFile(path.join(OUT, "favicon.ico"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
