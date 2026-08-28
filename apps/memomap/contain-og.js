// ESM: package.json is "type": "module".
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Memomap card: a page of a travel journal with the map folded into it.
 * The right half is a map sheet — coast, graticule, a dashed route threading
 * three red pins, a taped snapshot and a handwritten memo strip. The left
 * column carries the serif title and the four things this app does NOT have,
 * struck through, because "registration required" and "my energy went to 0
 * after an update" are the complaints this app exists to answer.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER_RGB = { r: 242, g: 230, b: 207, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const serif = (lang) => `Noto Serif CJK ${CJK[lang]}, serif`;
const sans = (lang) => `Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#33291d";
const MUTED = "#7c6a51";
const PAPER = "#f6ecd8";
const VELLUM = "#fbf5e8";
const LINE = "#d8c7a4";
const SEA = "#b9d3d6";
const LAND = "#eadfc6";
const ROUTE = "#b4472e";
const ROUTE_DARK = "#8f3520";
const STAMP = "#2f6b62";
const GOLD = "#b98a2c";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rough advance width so one layout survives ko/en/ja/zh without clipping. */
function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.55;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/** Foxing: the brown speckle old paper picks up at the edges. */
function foxing() {
  const out = [];
  let seed = 90211;
  for (let i = 0; i < 130; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = 1.2 + (seed % 22) / 10;
    const o = 0.025 + (seed % 5) / 180;
    out.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="rgba(120,84,40,${o.toFixed(3)})"/>`);
  }
  return out.join("");
}

/** The printed graticule of a paper map. */
function graticule(x, y, w, h, step) {
  const out = [];
  for (let gx = x + step; gx < x + w; gx += step) {
    out.push(`<rect x="${gx}" y="${y}" width="1.6" height="${h}" fill="${INK}" opacity="0.09"/>`);
  }
  for (let gy = y + step; gy < y + h; gy += step) {
    out.push(`<rect x="${x}" y="${gy}" width="${w}" height="1.6" fill="${INK}" opacity="0.09"/>`);
  }
  return out.join("");
}

/** One map pin, drawn at (x, y) with its point on the ground. */
function pin(x, y, scale, fill) {
  return `
  <g transform="translate(${x},${y}) scale(${scale}) translate(-26,-68)">
    <ellipse cx="26" cy="68" rx="15" ry="5" fill="rgba(51,41,29,0.22)"/>
    <path d="M26 3 C38.6 3 48.8 13 48.8 25.8 C48.8 42.8 26 65 26 65 S3.2 42.8 3.2 25.8 C3.2 13 13.4 3 26 3 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="26" cy="25.4" r="8.6" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
  </g>`;
}

/** A snapshot taped to the map, with a little scene printed on it. */
function snapshot(x, y, rot) {
  return `
  <g transform="translate(${x},${y}) rotate(${rot})">
    <rect x="6" y="9" width="226" height="242" fill="rgba(51,41,29,0.2)"/>
    <rect x="0" y="0" width="226" height="242" fill="#fffdf6" stroke="#cfbb92" stroke-width="3"/>
    <rect x="14" y="14" width="198" height="164" fill="#cfe0dd"/>
    <path d="M14 178 V132 l44 -44 40 40 30 -30 60 60 v20 Z" fill="#7f9c86"/>
    <path d="M14 178 v-14 l38 -34 34 34 34 -34 52 48 v0 Z" fill="#5f7f6a" opacity="0.85"/>
    <circle cx="172" cy="52" r="20" fill="#e8c169"/>
    <path d="M14 178 h198" stroke="#a4926f" stroke-width="3"/>
    <rect x="24" y="196" width="120" height="9" rx="4" fill="rgba(51,41,29,0.42)"/>
    <rect x="24" y="216" width="82" height="9" rx="4" fill="rgba(51,41,29,0.24)"/>
    <rect x="72" y="-16" width="86" height="32" fill="rgba(240,193,75,0.62)" stroke="rgba(185,135,26,0.5)" stroke-width="2"/>
  </g>`;
}

/** The memo strip: one ruled line of handwriting beside a pin. */
function memoStrip(lang, x, y, rot, text) {
  const size = fitSize(text, 300, [26, 24, 22, 20, 18]);
  return `
  <g transform="translate(${x},${y}) rotate(${rot})">
    <rect x="5" y="7" width="340" height="96" fill="rgba(51,41,29,0.18)"/>
    <rect x="0" y="0" width="340" height="96" fill="${VELLUM}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="7" height="96" fill="${ROUTE}"/>
    <rect x="24" y="60" width="292" height="2" fill="${LINE}"/>
    <text x="24" y="52" font-family="${serif(lang)}" font-size="${size}" fill="${INK}">${esc(text)}</text>
    <text x="24" y="82" font-family="${mono(lang)}" font-size="17" fill="${MUTED}" letter-spacing="1">37.5665° N, 126.9780° E</text>
  </g>`;
}

/** Compass rose, drawn as an engraved star. */
function compass(x, y, r) {
  const star = (len, wide, fill) =>
    `<path d="M0 ${-len} L${wide} 0 L0 ${len} L${-wide} 0 Z" fill="${fill}"/>`;
  return `
  <g transform="translate(${x},${y})" opacity="0.9">
    <circle cx="0" cy="0" r="${r}" fill="none" stroke="${INK}" stroke-width="3" opacity="0.5"/>
    <circle cx="0" cy="0" r="${r - 12}" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.35"/>
    <g transform="rotate(45)">${star(r - 16, 9, "rgba(51,41,29,0.35)")}</g>
    <g transform="rotate(135)">${star(r - 16, 9, "rgba(51,41,29,0.35)")}</g>
    <g transform="rotate(90)">${star(r - 4, 12, "rgba(51,41,29,0.55)")}</g>
    ${star(r - 4, 12, ROUTE)}
    <circle cx="0" cy="0" r="7" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
  </g>`;
}

/** A postmark: the private stamp in the corner of the card. */
function postmark(lang, x, y, word) {
  const size = fitSize(word, 150, [32, 28, 24, 21]);
  return `
  <g transform="translate(${x},${y}) rotate(-12)" opacity="0.92">
    <circle cx="0" cy="0" r="76" fill="none" stroke="${STAMP}" stroke-width="6"/>
    <circle cx="0" cy="0" r="62" fill="none" stroke="${STAMP}" stroke-width="2.5"/>
    <text x="0" y="${size * 0.36}" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="800" fill="${STAMP}">${esc(word)}</text>
    <rect x="-58" y="26" width="116" height="3" fill="${STAMP}" opacity="0.8"/>
    <rect x="-58" y="-32" width="116" height="3" fill="${STAMP}" opacity="0.8"/>
  </g>`;
}

/** The four things this app does not have, struck through. */
function noChips(lang, labels) {
  let x = 0;
  let y = 0;
  const out = [];
  for (const label of labels) {
    const size = fitSize(label, 300, [28, 26, 24, 22]);
    const w = Math.round(textWidth(label, size)) + 48;
    if (x + w > 720) {
      x = 0;
      y += 76;
    }
    out.push(`
    <g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="58" rx="4" fill="#efe1c6" stroke="${MUTED}" stroke-width="2.5" opacity="0.9"/>
      <text x="${w / 2}" y="${29 + size * 0.36}" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
      <path d="M4 54 L${w - 4} 4" stroke="${ROUTE}" stroke-width="6" stroke-linecap="round"/>
    </g>`);
    x += w + 18;
  }
  return { svg: out.join(""), height: y + 58 };
}

function svgFor(job) {
  const { lang, title, tagline, noWords, foot, credit, memo, stampWord } = job;
  const titleSize = fitSize(title, 690, [116, 100, 88, 76, 66]);
  const tagSize = fitSize(tagline, 700, [36, 32, 29, 26, 23]);
  const chips = noChips(lang, noWords);
  const footSize = fitSize(foot, 700, [28, 26, 24, 22]);
  const creditSize = fitSize(credit, 680, [24, 22, 20, 18]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="#fbf4e5"/>
      <stop offset="55%" stop-color="#f2e6cf"/>
      <stop offset="100%" stop-color="#e6d7ba"/>
    </linearGradient>
    <clipPath id="sheet">
      <rect x="900" y="58" width="836" height="828" rx="6"/>
    </clipPath>
  </defs>

  <rect width="1800" height="945" fill="url(#paper)"/>
  ${foxing()}

  <!-- the map sheet -->
  <g>
    <rect x="912" y="72" width="836" height="828" rx="6" fill="rgba(51,41,29,0.16)"/>
    <g clip-path="url(#sheet)">
      <rect x="900" y="58" width="836" height="828" fill="${SEA}"/>
      <!-- coast: land takes the sheet, water cuts in from the bottom right -->
      <path d="M900 58 H1736 V470 C1640 470 1600 540 1520 566 C1432 594 1386 690 1290 704 C1188 718 1120 660 1030 690 C980 706 936 760 900 764 Z" fill="${LAND}"/>
      <path d="M900 58 H1736 V470 C1640 470 1600 540 1520 566 C1432 594 1386 690 1290 704 C1188 718 1120 660 1030 690 C980 706 936 760 900 764 Z" fill="none" stroke="${STAMP}" stroke-width="4" opacity="0.5"/>
      <path d="M1736 512 C1650 512 1614 578 1540 606 C1452 638 1408 728 1312 744 C1210 760 1136 700 1046 730" fill="none" stroke="${STAMP}" stroke-width="2.5" opacity="0.3"/>
      ${graticule(900, 58, 836, 828, 92)}
      <!-- roads -->
      <path d="M900 300 C1050 268 1180 330 1330 296 S1620 250 1736 286" fill="none" stroke="#d9c9a4" stroke-width="9" stroke-linecap="round"/>
      <path d="M1120 58 C1146 220 1096 340 1150 470 S1236 700 1210 886" fill="none" stroke="#d9c9a4" stroke-width="7" stroke-linecap="round"/>
      <!-- the route: three places, in the order they were pinned -->
      <path d="M1044 236 C1150 320 1180 420 1330 430 C1466 440 1500 560 1420 668" fill="none" stroke="${ROUTE}" stroke-width="7" stroke-linecap="round" stroke-dasharray="18 16" opacity="0.85"/>
      ${pin(1044, 236, 1.05, ROUTE)}
      ${pin(1330, 430, 0.9, ROUTE)}
      ${pin(1420, 668, 1.15, ROUTE_DARK)}
      ${snapshot(1440, 96, 5)}
      ${memoStrip(lang, 976, 470, -2.5, memo)}
      ${compass(1040, 812, 62)}
    </g>
    <rect x="900" y="58" width="836" height="828" rx="6" fill="none" stroke="${INK}" stroke-width="5"/>
    <rect x="913" y="71" width="810" height="802" rx="3" fill="none" stroke="${INK}" stroke-width="2" opacity="0.45"/>
    ${postmark(lang, 1614, 790, stampWord)}
  </g>

  <!-- the title block -->
  <g transform="translate(84,166)">
    <text x="0" y="${titleSize}" font-family="${serif(lang)}" font-size="${titleSize}" font-weight="700" fill="${INK}">${esc(title)}</text>
    <rect x="2" y="${titleSize + 28}" width="${Math.min(700, textWidth(title, titleSize))}" height="7" fill="${ROUTE}"/>
    <text x="0" y="${titleSize + 116}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${MUTED}">${esc(tagline)}</text>
    <g transform="translate(0,${titleSize + 176})">${chips.svg}</g>
    <text x="0" y="${titleSize + 176 + chips.height + 68}" font-family="${sans(lang)}" font-size="${footSize}" font-weight="700" fill="${INK}">${esc(foot)}</text>
    <g transform="translate(0,${titleSize + 176 + chips.height + 116})">
      <path d="M6 22 C90 -8, 190 46, 286 18 S470 -6, 560 26" fill="none" stroke="${ROUTE}" stroke-width="4" stroke-linecap="round" stroke-dasharray="12 11" opacity="0.75"/>
      ${pin(600, 34, 0.42, ROUTE)}
      <text x="0" y="${74 + creditSize}" font-family="${sans(lang)}" font-size="${creditSize}" font-weight="600" fill="${MUTED}">${esc(credit)}</text>
    </g>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#f2e6cf"/>
  <g transform="translate(30,64)">
    <path d="M22 92 L156 44 L296 92 L430 44 V320 L296 368 L156 320 L22 368 Z" fill="#f6ecd8" stroke="#33291d" stroke-width="14" stroke-linejoin="round"/>
    <path d="M156 44 V320 M296 92 V368" stroke="#33291d" stroke-width="9" stroke-dasharray="18 16"/>
    <path d="M46 214 C112 168 186 258 268 200 S382 160 410 196" fill="none" stroke="#2f6b62" stroke-width="12" stroke-linecap="round" stroke-dasharray="24 22"/>
    <path d="M352 84 l16 34 34 16 -34 16 -16 34 -16 -34 -34 -16 34 -16 Z" fill="#b98a2c"/>
    <path d="M128 128 c40 0 72 32 72 72 c0 52 -72 118 -72 118 s-72 -66 -72 -118 c0 -40 32 -72 72 -72 Z" fill="#b4472e" stroke="#33291d" stroke-width="14" stroke-linejoin="round"/>
    <circle cx="128" cy="200" r="26" fill="#f6ecd8"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: PAPER_RGB })
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
      lang: "ko",
      title: "기억지도",
      tagline: "다녀온 곳에 핀과 한 줄, 이 기기에만",
      noWords: ["로그인", "스태미나", "사진 개수 제한", "구독"],
      foot: "핀 · 한 줄 메모 · 사진 한 장 — 이 기기에만",
      credit: "무료 OpenStreetMap 지도 · API 키 없음",
      memo: "그 골목 국숫집, 다시 오기",
      stampWord: "비공개",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Memomap",
      tagline: "Pins, a short note, a photo. Private, on this device.",
      noWords: ["No login", "No stamina", "No photo cap", "No subscription"],
      foot: "A pin, one line, one photo — on this device only",
      credit: "Free OpenStreetMap tiles · no API key",
      memo: "That noodle place. Come back.",
      stampWord: "PRIVATE",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "視える記憶",
      tagline: "行った場所にピンと一行。この端末だけに。",
      noWords: ["ログインなし", "スタミナなし", "写真枚数制限なし", "定額課金なし"],
      foot: "ピンと一行、写真一枚 — この端末だけに",
      credit: "無料のOpenStreetMap地図 · APIキー不要",
      memo: "あの路地のそば屋、また来る",
      stampWord: "非公開",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "记忆地图",
      tagline: "去过的地方，一枚针一句话，只留在这台设备。",
      noWords: ["无需登录", "没有体力值", "不限照片数量", "没有订阅"],
      foot: "一枚针、一句话、一张照片 — 只在这台设备",
      credit: "免费 OpenStreetMap 地图 · 无需 API 密钥",
      memo: "那条巷子的面馆，还要再来",
      stampWord: "私密",
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
