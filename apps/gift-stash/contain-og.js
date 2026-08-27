// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * Gift Stash card: the card itself is the wrapping paper.
 * A ribbon runs down it, the bow ties off a cord, and the cord carries the gift
 * tag that holds the name. The screenshots you saved are stacked beside the
 * ribbon, because that is what the app actually turns into gift ideas.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "public");
const BLUSH = { r: 251, g: 228, b: 220, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const serif = (lang, latin) => `${latin ? latin + ", " : ""}Noto Serif CJK ${CJK[lang]}, serif`;
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const CORAL = "#e2624f";
const CORAL_DK = "#c04a3a";
const CREAM = "#fff8f3";
const GOLD = "#c9922f";
const PLUM = "#4a2230";
const MINT = "#8fbfae";

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

function ribbon() {
  return `
  <g>
    <rect x="1186" y="0" width="20" height="945" fill="rgba(74,34,48,0.10)"/>
    <rect x="1206" y="0" width="196" height="945" fill="${CORAL}"/>
    <rect x="1206" y="0" width="196" height="945" fill="url(#satin)"/>
    <rect x="1206" y="0" width="6" height="945" fill="${CORAL_DK}"/>
    <rect x="1396" y="0" width="6" height="945" fill="${CORAL_DK}"/>
  </g>`;
}

function bow() {
  return `
  <g transform="translate(1304,246)">
    <path d="M-14 -8 C-150 -132 -270 -70 -232 12 C-200 80 -84 66 -14 12 Z" fill="${CORAL_DK}"/>
    <path d="M14 -8 C150 -132 270 -70 232 12 C200 80 84 66 14 12 Z" fill="${CORAL_DK}"/>
    <path d="M-14 -6 C-140 -118 -246 -62 -212 8 C-184 66 -80 54 -14 10 Z" fill="#ef7a63"/>
    <path d="M14 -6 C140 -118 246 -62 212 8 C184 66 80 54 14 10 Z" fill="#ef7a63"/>
    <path d="M-26 14 C-96 116 -140 150 -178 190 L-108 178 C-70 128 -44 70 -26 14 Z" fill="${CORAL_DK}"/>
    <path d="M26 14 C96 116 140 150 178 190 L108 178 C70 128 44 70 26 14 Z" fill="${CORAL_DK}"/>
    <ellipse cx="0" cy="4" rx="44" ry="36" fill="${CORAL}"/>
    <ellipse cx="-12" cy="-6" rx="16" ry="11" fill="rgba(255,255,255,0.35)"/>
  </g>`;
}

/** Screenshots waiting to become gift ideas. */
function shots(lang, labels) {
  return labels
    .map((label, i) => {
      const x = 1418 + i * 44;
      const y = 498 + i * 62;
      const rot = -6 + i * 5;
      const front = i === labels.length - 1;
      const ls = fitSize(label, 208, [24, 21, 19, 17]);
      return `
  <g transform="translate(${x},${y}) rotate(${rot})">
    <rect x="5" y="8" width="252" height="196" rx="14" fill="rgba(74,34,48,0.16)"/>
    <rect x="0" y="0" width="252" height="196" rx="14" fill="${CREAM}"/>
    <rect x="16" y="16" width="220" height="108" rx="8" fill="${i === 0 ? MINT : i === 1 ? "#f3c9a1" : "#c9b6d6"}"/>
    <circle cx="60" cy="70" r="20" fill="rgba(255,255,255,0.6)"/>
    ${front ? `<text x="16" y="164" font-family="${mono(lang)}" font-size="${ls}" font-weight="700" fill="${PLUM}">${esc(label)}</text>` : ""}
  </g>`;
    })
    .join("");
}

function svgFor(job) {
  const { lang, title, subtitle, eyebrow, people, dueLabel, shotLabels } = job;
  const titleSize = fitSize(title, 700, [96, 84, 72, 62, 54]);
  const subSize = fitSize(subtitle, 720, [34, 30, 27, 24]);

  let px = 0;
  const pills = people
    .map((p) => {
      const w = textWidth(p, 26) + 72;
      const g = `
      <g transform="translate(${px},0)">
        <rect x="0" y="0" width="${w}" height="54" rx="27" fill="#f6e2d8"/>
        <circle cx="27" cy="27" r="13" fill="${CORAL}"/>
        <text x="52" y="36" font-family="${sans(lang)}" font-size="26" font-weight="700" fill="${PLUM}">${esc(p)}</text>
      </g>`;
      px += w + 16;
      return g;
    })
    .join("");
  const dueW = textWidth(dueLabel, 26) + 46;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <pattern id="wrap" width="132" height="132" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="132" height="132" fill="#fbe4dc"/>
      <rect x="0" y="0" width="34" height="132" fill="#f6cfc3"/>
      <circle cx="68" cy="34" r="7" fill="#eba898"/>
      <circle cx="102" cy="98" r="5" fill="#d9a441" opacity="0.75"/>
    </pattern>
    <linearGradient id="satin" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(0,0,0,0.14)"/>
      <stop offset="34%" stop-color="rgba(255,255,255,0.30)"/>
      <stop offset="62%" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.16)"/>
    </linearGradient>
    <filter id="tagshadow" x="-30%" y="-30%" width="180%" height="180%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#4a2230" flood-opacity="0.28"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="url(#wrap)"/>
  ${ribbon()}
  ${shots(lang, shotLabels)}
  ${bow()}

  <path d="M1288 268 C1064 476 596 478 176 392" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>
  <path d="M1288 268 C1070 462 600 462 176 380" fill="none" stroke="#e6bd6b" stroke-width="3" stroke-linecap="round"/>

  <g transform="translate(96,326) rotate(-4)" filter="url(#tagshadow)">
    <path d="M116 0 H864 A26 26 0 0 1 890 26 V400 A26 26 0 0 1 864 426 H26 A26 26 0 0 1 0 400 V116 Z" fill="${CREAM}"/>
    <circle cx="78" cy="76" r="26" fill="url(#wrap)"/>
    <circle cx="78" cy="76" r="26" fill="none" stroke="${GOLD}" stroke-width="7"/>
    <text x="150" y="80" font-family="${mono(lang)}" font-size="24" font-weight="800" fill="${GOLD}" letter-spacing="5">${esc(eyebrow)}</text>
    <text x="150" y="${168 + titleSize * 0.32}" font-family="${serif(lang, "URW Bookman")}" font-size="${titleSize}" font-weight="700" fill="${PLUM}">${esc(title)}</text>
    <text x="150" y="${248 + subSize * 0.3}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="rgba(74,34,48,0.66)">${esc(subtitle)}</text>
    <rect x="150" y="292" width="700" height="2" fill="rgba(74,34,48,0.14)"/>
    <g transform="translate(150,332)">
      ${pills}
      <g transform="translate(${px + 10},0)">
        <rect x="0" y="0" width="${dueW}" height="54" rx="12" fill="${GOLD}"/>
        <text x="${dueW / 2}" y="36" text-anchor="middle" font-family="${mono(lang)}" font-size="26" font-weight="800" fill="${CREAM}">${esc(dueLabel)}</text>
      </g>
    </g>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: BLUSH })
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
      lang: "ko", title: "선물 서랍", subtitle: "스크린샷을 사람에게 붙여 둡니다",
      eyebrow: "TO", people: ["엄마", "동생", "지수"], dueLabel: "생일 D-12",
      shotLabels: ["머그컵", "니트 목도리", "무선 이어폰"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en", title: "Gift Stash", subtitle: "Tag a screenshot to the person it suits",
      eyebrow: "TO", people: ["Mom", "Ben", "Ada"], dueLabel: "BIRTHDAY D-12",
      shotLabels: ["Stoneware mug", "Wool scarf", "Earbuds"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja", title: "プレゼント引き出し", subtitle: "スクショを贈る相手に貼っておく",
      eyebrow: "TO", people: ["母", "弟", "友"], dueLabel: "誕生日 D-12",
      shotLabels: ["マグカップ", "ウールマフラー", "イヤホン"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh", title: "礼物抽屉", subtitle: "把截图贴到合适的人身上",
      eyebrow: "TO", people: ["妈妈", "弟弟", "小夏"], dueLabel: "生日 D-12",
      shotLabels: ["陶瓷马克杯", "羊毛围巾", "无线耳机"],
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
