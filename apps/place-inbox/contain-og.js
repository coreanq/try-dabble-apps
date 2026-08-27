// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * Place Inbox card: a sheet of postage stamps.
 * Saving a place is philately, not a database row — so the card is a perforated
 * sheet. The big stamp carries the name, the four small ones carry ranks 2–5,
 * and the postmark lands across the corner the way a real cancellation would.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "public");
const SAND = { r: 228, g: 218, b: 194, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const serif = (lang, latin) => `${latin ? latin + ", " : ""}Noto Serif CJK ${CJK[lang]}, serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const SHEET = "#e4dac2";
const STAMP = "#f7f1e3";
const TEAL = "#1d6f6a";
const INKY = "#17322f";
const RED = "#b8352c";
const SKY = "#c3dde0";
const GOLD = "#c9973a";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.56;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/** Punched holes along a stamp's edge, drawn in the sheet colour. */
function perforate(x, y, w, h, step = 24) {
  const out = [];
  for (let cx = x + step / 2; cx < x + w; cx += step) {
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${y}" r="7.5" fill="${SHEET}"/>`);
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${y + h}" r="7.5" fill="${SHEET}"/>`);
  }
  for (let cy = y + step / 2; cy < y + h; cy += step) {
    out.push(`<circle cx="${x}" cy="${cy.toFixed(1)}" r="7.5" fill="${SHEET}"/>`);
    out.push(`<circle cx="${x + w}" cy="${cy.toFixed(1)}" r="7.5" fill="${SHEET}"/>`);
  }
  return out.join("");
}

const MOTIFS = {
  pin: `
    <path d="M0 296 Q90 232 176 268 Q262 302 352 244 L352 360 L0 360 Z" fill="#a9c9c2"/>
    <path d="M0 330 Q104 286 196 314 Q286 342 352 306 L352 360 L0 360 Z" fill="${TEAL}"/>
    <g transform="translate(176,150)">
      <path d="M0 0 C-34 0 -52 26 -52 50 C-52 92 0 148 0 148 C0 148 52 92 52 50 C52 26 34 0 0 0 Z" fill="${RED}"/>
      <circle cx="0" cy="48" r="18" fill="${STAMP}"/>
    </g>`,
  boat: `
    <circle cx="266" cy="112" r="44" fill="#e8c98a"/>
    <path d="M62 268 L296 268 L254 330 L104 330 Z" fill="${TEAL}"/>
    <rect x="166" y="146" width="12" height="122" fill="${INKY}"/>
    <path d="M178 152 L262 258 L178 258 Z" fill="${RED}"/>
    <path d="M164 152 L92 258 L164 258 Z" fill="#a9c9c2"/>
    <path d="M0 348 Q44 330 88 348 T176 348 T264 348 T352 348" fill="none" stroke="${TEAL}" stroke-width="9" stroke-linecap="round"/>`,
  gate: `
    <path d="M0 300 Q90 250 176 276 Q262 300 352 262 L352 360 L0 360 Z" fill="#a9c9c2"/>
    <rect x="46" y="132" width="260" height="26" rx="6" fill="${RED}"/>
    <path d="M30 108 L322 108 L306 134 L46 134 Z" fill="${RED}"/>
    <rect x="80" y="158" width="26" height="176" fill="${RED}"/>
    <rect x="246" y="158" width="26" height="176" fill="${RED}"/>
    <rect x="96" y="196" width="160" height="18" fill="${RED}"/>`,
  cup: `
    <path d="M0 312 L352 312 L352 360 L0 360 Z" fill="#a9c9c2"/>
    <rect x="88" y="176" width="176" height="130" rx="18" fill="${STAMP}" stroke="${INKY}" stroke-width="10"/>
    <path d="M264 206 h34 a34 34 0 0 1 0 68 h-34" fill="none" stroke="${INKY}" stroke-width="10"/>
    <rect x="104" y="196" width="144" height="46" rx="10" fill="${TEAL}"/>
    <path d="M132 138 q16 -26 0 -52" fill="none" stroke="${TEAL}" stroke-width="9" stroke-linecap="round"/>
    <path d="M176 138 q16 -26 0 -52" fill="none" stroke="${TEAL}" stroke-width="9" stroke-linecap="round"/>
    <path d="M220 138 q16 -26 0 -52" fill="none" stroke="${TEAL}" stroke-width="9" stroke-linecap="round"/>`,
};

function miniStamp(lang, x, y, w, h, rank, caption, motif) {
  const cs = fitSize(caption, w - 120, [30, 27, 24, 21]);
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${STAMP}"/>
    ${perforate(x, y, w, h)}
    <rect x="${x + 26}" y="${y + 26}" width="${w - 52}" height="${h - 52}" fill="${SKY}"/>
    <g transform="translate(${x + 46},${y + 20}) scale(0.79)">${motif}</g>
    <rect x="${x + 26}" y="${y + h - 100}" width="${w - 52}" height="74" fill="${STAMP}"/>
    <text x="${x + 50}" y="${y + h - 52}" font-family="${mono(lang)}" font-size="${cs}" font-weight="700" fill="${INKY}">${esc(caption)}</text>
    <g transform="translate(${x + w - 74},${y + 74})">
      <circle cx="0" cy="0" r="30" fill="${STAMP}" stroke="${RED}" stroke-width="4"/>
      <text x="0" y="12" text-anchor="middle" font-family="${serif(lang, "URW Bookman")}" font-size="36" font-weight="700" fill="${RED}">${rank}</text>
    </g>
  </g>`;
}

function postmark(lang, cancel, when) {
  return `
  <g transform="translate(898,176) rotate(-14) scale(1.12)" opacity="0.9">
    <circle cx="0" cy="0" r="118" fill="none" stroke="${RED}" stroke-width="7"/>
    <circle cx="0" cy="0" r="98" fill="none" stroke="${RED}" stroke-width="3"/>
    <rect x="-98" y="-20" width="196" height="3" fill="${RED}"/>
    <rect x="-98" y="26" width="196" height="3" fill="${RED}"/>
    <text x="0" y="-32" text-anchor="middle" font-family="${mono(lang)}" font-size="27" font-weight="800" fill="${RED}">${esc(cancel)}</text>
    <text x="0" y="16" text-anchor="middle" font-family="${mono(lang)}" font-size="30" font-weight="800" fill="${RED}">${esc(when)}</text>
    <text x="0" y="62" text-anchor="middle" font-family="${mono(lang)}" font-size="21" font-weight="700" fill="${RED}">PLACE INBOX</text>
    ${[0, 1, 2, 3].map((i) => `<path d="M124 ${-42 + i * 28} q40 -14 80 0 t80 0" fill="none" stroke="${RED}" stroke-width="7" stroke-linecap="round"/>`).join("")}
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, country, rankLabel, cancel, when, captions } = job;
  const titleSize = fitSize(title, 690, [92, 80, 70, 60, 52]);
  const subSize = fitSize(subtitle, 690, [34, 30, 27, 24]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <rect width="1800" height="945" fill="${SHEET}"/>

  <g>
    <rect x="36" y="36" width="864" height="873" fill="${STAMP}"/>
    ${perforate(36, 36, 864, 873, 26)}
    <rect x="72" y="72" width="792" height="801" fill="none" stroke="${TEAL}" stroke-width="6"/>
    <rect x="88" y="88" width="760" height="769" fill="none" stroke="${TEAL}" stroke-width="2"/>

    <rect x="104" y="104" width="728" height="420" fill="${SKY}"/>
    <path d="M104 380 Q280 300 440 348 Q612 400 832 320 L832 524 L104 524 Z" fill="#a9c9c2"/>
    <path d="M104 430 Q300 372 470 412 Q640 452 832 396 L832 524 L104 524 Z" fill="${TEAL}"/>
    <circle cx="722" cy="196" r="58" fill="#e8c98a"/>
    <g transform="translate(330,214)">
      <path d="M0 0 C-40 0 -62 30 -62 58 C-62 106 0 172 0 172 C0 172 62 106 62 58 C62 30 40 0 0 0 Z" fill="${RED}"/>
      <circle cx="0" cy="56" r="21" fill="${STAMP}"/>
    </g>
    <path d="M392 388 q120 -46 232 -8" fill="none" stroke="${RED}" stroke-width="6" stroke-dasharray="16 14" stroke-linecap="round"/>

    <text x="104" y="${580 + titleSize * 0.34}" font-family="${serif(lang, "URW Bookman")}" font-size="${titleSize}" font-weight="700" fill="${INKY}">${esc(title)}</text>
    <rect x="104" y="632" width="120" height="6" fill="${RED}"/>
    <text x="104" y="${692 + subSize * 0.3}" font-family="${serif(lang)}" font-size="${subSize}" font-weight="600" fill="${TEAL}">${esc(subtitle)}</text>
    <text x="104" y="812" font-family="${mono(lang)}" font-size="24" font-weight="800" fill="${TEAL}" letter-spacing="6">${esc(country)}</text>

    <g transform="translate(700,742)">
      <rect x="0" y="0" width="132" height="86" rx="8" fill="${GOLD}"/>
      <text x="66" y="52" text-anchor="middle" font-family="${serif(lang, "URW Bookman")}" font-size="52" font-weight="700" fill="${INKY}">1</text>
      <text x="66" y="-14" text-anchor="middle" font-family="${mono(lang)}" font-size="21" font-weight="800" fill="${TEAL}">${esc(rankLabel)}</text>
    </g>
  </g>

  ${miniStamp(lang, 900, 36, 432, 436, 2, captions[0], MOTIFS.pin)}
  ${miniStamp(lang, 1332, 36, 432, 436, 3, captions[1], MOTIFS.boat)}
  ${miniStamp(lang, 900, 472, 432, 437, 4, captions[2], MOTIFS.gate)}
  ${miniStamp(lang, 1332, 472, 432, 437, 5, captions[3], MOTIFS.cup)}

  ${postmark(lang, cancel, when)}
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: SAND })
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
    {
      lang: "ko", title: "여행 받은편지함", subtitle: "왜 저장했는지까지 같이",
      country: "TRY DABBLE", rankLabel: "순위", cancel: "저장함", when: "가고 싶다",
      captions: ["전망대", "섬 배편", "오래된 절", "동네 카페"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en", title: "Place Inbox", subtitle: "Saved with the reason you saved it",
      country: "TRY DABBLE", rankLabel: "RANK", cancel: "SAVED", when: "WANT TO GO",
      captions: ["Viewpoint", "Island ferry", "Old temple", "Corner cafe"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja", title: "旅の受信箱", subtitle: "保存した理由まで一緒に",
      country: "TRY DABBLE", rankLabel: "順位", cancel: "保存", when: "行きたい",
      captions: ["展望台", "島の船", "古いお寺", "町のカフェ"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh", title: "旅行收件箱", subtitle: "连同当初收藏的理由",
      country: "TRY DABBLE", rankLabel: "排名", cancel: "已收藏", when: "很想去",
      captions: ["观景台", "海岛渡轮", "古寺", "街角咖啡"],
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
