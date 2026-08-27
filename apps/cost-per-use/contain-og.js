// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * Cost-per-use card: a bookkeeper's ledger page.
 * The app divides a price by the times you actually used the thing, so the card
 * is a ruled ledger with real columns. The bottom row is the answer, ringed in
 * oxblood the way anyone doing this by hand would ring it.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "public");
const PAPER_BG = { r: 244, g: 234, b: 212, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const serif = (lang, latin) => `${latin ? latin + ", " : ""}Noto Serif CJK ${CJK[lang]}, serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#2e2a20";
const BLUE = "#a9bfd0";
const RED = "#bf4b38";
const OXBLOOD = "#8c2f22";
const GOLD = "#b8892b";
const MUTED = "#7d7361";

const COL_PRICE = 1270;
const COL_USES = 1530;
const COL_PER = 1756;

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

function fibre() {
  const out = [];
  let seed = 7;
  for (let i = 0; i < 150; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.03 + (seed % 7) / 180;
    out.push(`<rect x="${x}" y="${y}" width="${2 + (seed % 5)}" height="2" fill="rgba(70,58,36,${o.toFixed(3)})"/>`);
  }
  return out.join("");
}

function ledgerLines() {
  const out = [];
  for (let y = 330; y <= 912; y += 62) {
    out.push(`<rect x="0" y="${y}" width="1800" height="2" fill="${BLUE}"/>`);
  }
  for (const x of [1000, 1300, 1560]) {
    out.push(`<rect x="${x}" y="268" width="2" height="677" fill="${RED}" opacity="0.62"/>`);
  }
  out.push(`<rect x="132" y="0" width="3" height="945" fill="${RED}" opacity="0.55"/>`);
  out.push(`<rect x="142" y="0" width="2" height="945" fill="${RED}" opacity="0.3"/>`);
  return out.join("");
}

function row(lang, y, cols, opts = {}) {
  const { bold, size = 32 } = opts;
  const nameSize = fitSize(cols[0], 830, [size, size - 4, size - 8, size - 12]);
  return `
    <text x="164" y="${y}" font-family="${serif(lang)}" font-size="${nameSize}" font-weight="${bold ? 700 : 500}" fill="${INK}">${esc(cols[0])}</text>
    <text x="${COL_PRICE}" y="${y}" text-anchor="end" font-family="${mono(lang)}" font-size="${size - 2}" font-weight="600" fill="${INK}">${esc(cols[1])}</text>
    <text x="${COL_USES}" y="${y}" text-anchor="end" font-family="${mono(lang)}" font-size="${size - 2}" font-weight="600" fill="${MUTED}">${esc(cols[2])}</text>
    <text x="${COL_PER}" y="${y}" text-anchor="end" font-family="${mono(lang)}" font-size="${size - 2}" font-weight="800" fill="${INK}">${esc(cols[3])}</text>`;
}

function stamp(lang, label) {
  const w = textWidth(label, 30) + 76;
  return `
  <g transform="translate(1470,116) rotate(-7)" opacity="0.86">
    <rect x="${-w / 2}" y="-46" width="${w}" height="92" rx="10" fill="none" stroke="${OXBLOOD}" stroke-width="6"/>
    <rect x="${-w / 2 + 12}" y="-34" width="${w - 24}" height="68" rx="6" fill="none" stroke="${OXBLOOD}" stroke-width="2"/>
    <text x="0" y="12" text-anchor="middle" font-family="${mono(lang)}" font-size="30" font-weight="800" fill="${OXBLOOD}">${esc(label)}</text>
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, heads, rows, answer, note, stampLabel } = job;
  const titleSize = fitSize(title, 900, [82, 72, 62, 54, 48]);
  const subSize = fitSize(subtitle, 940, [32, 29, 26, 23]);
  const answerFigure = answer[3];
  const figSize = 56;
  const figW = textWidth(answerFigure, figSize);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <rect width="1800" height="945" fill="#f4ead4"/>
  ${fibre()}
  <rect x="0" y="0" width="1800" height="252" fill="#ecdfc0"/>
  ${ledgerLines()}
  <rect x="0" y="252" width="1800" height="5" fill="${OXBLOOD}"/>
  <rect x="0" y="263" width="1800" height="2" fill="${OXBLOOD}" opacity="0.6"/>

  <text x="164" y="${112 + titleSize * 0.3}" font-family="${serif(lang, "URW Bookman")}" font-size="${titleSize}" font-weight="700" fill="${INK}">${esc(title)}</text>
  <text x="164" y="${196 + subSize * 0.3}" font-family="${serif(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  ${stamp(lang, stampLabel)}

  <text x="164" y="310" font-family="${mono(lang)}" font-size="23" font-weight="800" fill="${OXBLOOD}" letter-spacing="3">${esc(heads[0])}</text>
  <text x="${COL_PRICE}" y="310" text-anchor="end" font-family="${mono(lang)}" font-size="23" font-weight="800" fill="${OXBLOOD}" letter-spacing="3">${esc(heads[1])}</text>
  <text x="${COL_USES}" y="310" text-anchor="end" font-family="${mono(lang)}" font-size="23" font-weight="800" fill="${OXBLOOD}" letter-spacing="3">${esc(heads[2])}</text>
  <text x="${COL_PER}" y="310" text-anchor="end" font-family="${mono(lang)}" font-size="23" font-weight="800" fill="${OXBLOOD}" letter-spacing="3">${esc(heads[3])}</text>

  ${row(lang, 386, rows[0])}
  ${row(lang, 448, rows[1])}
  ${row(lang, 510, rows[2])}

  <rect x="164" y="546" width="1592" height="3" fill="${INK}" opacity="0.55"/>
  <rect x="164" y="554" width="1592" height="2" fill="${INK}" opacity="0.35"/>

  <text x="164" y="${634}" font-family="${serif(lang)}" font-size="${fitSize(answer[0], 830, [40, 36, 32, 28])}" font-weight="700" fill="${INK}">${esc(answer[0])}</text>
  <text x="${COL_PRICE}" y="634" text-anchor="end" font-family="${mono(lang)}" font-size="34" font-weight="600" fill="${INK}">${esc(answer[1])}</text>
  <text x="${COL_USES}" y="634" text-anchor="end" font-family="${mono(lang)}" font-size="34" font-weight="600" fill="${MUTED}">${esc(answer[2])}</text>
  <text x="${COL_PER}" y="${640}" text-anchor="end" font-family="${mono(lang)}" font-size="${figSize}" font-weight="800" fill="${OXBLOOD}">${esc(answerFigure)}</text>

  <g transform="translate(${COL_PER - figW / 2},616) rotate(-3)">
    <ellipse cx="0" cy="0" rx="${figW / 2 + 34}" ry="56" fill="none" stroke="${OXBLOOD}" stroke-width="5"/>
    <path d="M${-(figW / 2 + 30)} 14 A ${figW / 2 + 30} 52 0 0 0 ${figW / 2 + 22} -22" fill="none" stroke="${OXBLOOD}" stroke-width="3" opacity="0.6"/>
  </g>

  <path d="M1180 792 C1330 800, 1480 782, ${COL_PER - figW / 2 + 40} 700" fill="none" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
  <path d="M${COL_PER - figW / 2 + 34} 690 l-6 34 l34 -12 Z" fill="${GOLD}"/>
  <text x="1160" y="802" text-anchor="end" font-family="${serif(lang, "Z003")}" font-size="38" font-style="italic" font-weight="600" fill="${GOLD}">${esc(note)}</text>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: PAPER_BG })
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
      lang: "ko", title: "사용단가 계산기", subtitle: "가격이 아니라, 한 번 쓸 때의 값",
      heads: ["항목", "가격", "사용 횟수", "1회 비용"], stampLabel: "사용단가",
      rows: [
        ["겨울 코트", "189,000원", "312회", "606원"],
        ["에스프레소 머신", "420,000원", "740회", "568원"],
        ["러닝화", "139,000원", "260회", "535원"],
      ],
      answer: ["무선 헤드폰", "349,000원", "1,120회", "312원"],
      note: "실제로 알고 싶던 숫자",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en", title: "Cost-per-use", subtitle: "Not the price — what one use costs",
      heads: ["ITEM", "PRICE", "USES", "PER USE"], stampLabel: "PER USE",
      rows: [
        ["Winter coat", "$149.00", "312", "$0.48"],
        ["Espresso machine", "$320.00", "740", "$0.43"],
        ["Running shoes", "$110.00", "260", "$0.42"],
      ],
      answer: ["Wireless headphones", "$279.00", "1,120", "$0.25"],
      note: "the number you actually wanted",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja", title: "1回あたり費用計算機", subtitle: "値段ではなく、一度使うたびの値",
      heads: ["項目", "価格", "使用回数", "1回あたり"], stampLabel: "1回あたり",
      rows: [
        ["冬のコート", "19,800円", "312回", "63円"],
        ["エスプレッソマシン", "42,000円", "740回", "57円"],
        ["ランニングシューズ", "13,900円", "260回", "53円"],
      ],
      answer: ["ワイヤレスヘッドホン", "34,900円", "1,120回", "31円"],
      note: "本当に知りたかった数字",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh", title: "单次使用成本", subtitle: "看的不是价格，是用一次要多少",
      heads: ["项目", "价格", "使用次数", "每次成本"], stampLabel: "每次成本",
      rows: [
        ["冬季大衣", "¥980", "312次", "¥3.14"],
        ["意式咖啡机", "¥2,180", "740次", "¥2.95"],
        ["跑鞋", "¥720", "260次", "¥2.77"],
      ],
      answer: ["无线耳机", "¥1,890", "1,120次", "¥1.69"],
      note: "你真正想知道的数字",
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
