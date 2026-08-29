// ESM: package.json is "type": "module".
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Storelog card: a market stall under a striped awning, with the shelf-edge
 * labels that are the whole product clipped to the rail under it. The front
 * label carries a store NAME, the STORE NO. in a red-ruled price-tag box, and
 * a line of notes — the three fields, and nothing else. A second label behind
 * it shows the list is filed A–Z, and an aisle letter chip is punched on the
 * rail.
 * The left column carries the title and the four gates this app refuses,
 * struck through, because "open a spreadsheet", "log in first", "100 documents
 * free" and "unlimited is PRO" are exactly the walls it answers.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const MARKET_RGB = { r: 217, g: 227, b: 205, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang) => `Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#23291f";
const MUTED = "#5f6b56";
const FAINT = "#8d9784";
const MARKET = "#d9e3cd";
const LABEL = "#fffdf3";
const LABEL_2 = "#f4f0dd";
const RULE = "#d3dcc5";
const AWNING = "#1d5c3f";
const AWNING_BG = "#dbeadd";
const PRICE = "#bf3b2c";
const PRICE_BG = "#fbe3dd";
const AISLE = "#ffe89a";
const AISLE_INK = "#6b4e05";

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

/** Canvas weave: the flat vertical grain of an awning in daylight. */
function weave() {
  const out = [];
  for (let x = 0; x < 1800; x += 8) {
    out.push(`<rect x="${x}" y="0" width="2" height="945" fill="rgba(35,41,31,0.03)"/>`);
  }
  return out.join("");
}

/** The aisle marker letter, punched on the rail. */
function aisleChip(letter, lang) {
  const size = fitSize(letter, 62, [58, 50, 42, 36]);
  const w = Math.max(78, Math.round(textWidth(letter, size)) + 40);
  return `
  <g>
    <rect x="4" y="6" width="${w}" height="82" rx="4" fill="rgba(35,41,31,0.3)"/>
    <rect x="0" y="0" width="${w}" height="82" rx="4" fill="${AISLE}" stroke="${INK}" stroke-width="5"/>
    <text x="${w / 2}" y="${41 + size * 0.36}" text-anchor="middle" font-family="${mono(lang)}" font-size="${size}" font-weight="800" fill="${AISLE_INK}">${esc(letter)}</text>
  </g>`;
}

/** The red-ruled price-tag box the store number sits in. */
function priceTag(job, tagWord, numberText) {
  const { lang } = job;
  const tagSize = fitSize(tagWord, 190, [24, 22, 20, 18]);
  const numSize = fitSize(numberText, 300, [48, 42, 38, 34]);
  const w = Math.max(
    280,
    Math.round(Math.max(textWidth(tagWord, tagSize), textWidth(numberText, numSize))) + 56,
  );
  return `
  <g>
    <rect x="0" y="0" width="${w}" height="112" rx="4" fill="${PRICE_BG}" stroke="${PRICE}" stroke-width="6"/>
    <text x="26" y="${34 + tagSize * 0.1}" font-family="${mono(lang)}" font-size="${tagSize}" font-weight="800" fill="${PRICE}" letter-spacing="3" opacity="0.9">${esc(tagWord)}</text>
    <text x="26" y="${88}" font-family="${mono(lang)}" font-size="${numSize}" font-weight="800" fill="${PRICE}" letter-spacing="2">${esc(numberText)}</text>
  </g>`;
}

/** The label the reader is meant to actually read. */
function frontLabel(job, w, h) {
  const { lang, storeName, numberTag, storeNumber, noteText } = job;
  const nameSize = fitSize(storeName, w - 230, [64, 56, 48, 42, 38]);
  const noteSize = fitSize(noteText, w - 200, [30, 28, 25, 22]);

  return `
  <g>
    <rect x="10" y="12" width="${w}" height="${h}" rx="5" fill="rgba(35,41,31,0.26)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="${LABEL}" stroke="${INK}" stroke-width="5"/>
    <!-- the yellow aisle strip and its punched hole -->
    <rect x="0" y="0" width="52" height="${h}" fill="${AISLE}"/>
    <line x1="52" y1="0" x2="52" y2="${h}" stroke="${INK}" stroke-width="5"/>
    <circle cx="26" cy="40" r="12" fill="${LABEL}" stroke="${INK}" stroke-width="4"/>

    <text x="88" y="${nameSize + 24}" font-family="${sans(lang)}" font-size="${nameSize}" font-weight="800" fill="${INK}">${esc(storeName)}</text>
    <g transform="translate(88,${nameSize + 48})">${priceTag(job, numberTag, storeNumber)}</g>
    <rect x="88" y="${h - 78}" width="${w - 150}" height="2.5" fill="${RULE}"/>
    <text x="88" y="${h - 30}" font-family="${sans(lang)}" font-size="${noteSize}" font-weight="600" fill="${MUTED}">${esc(noteText)}</text>
  </g>`;
}

/** The label behind: the next store down, already filed in its place. */
function backLabel(job, w, h) {
  const { lang, backName, backNumber } = job;
  const nameSize = fitSize(backName, w - 340, [44, 40, 36, 32]);
  const numSize = fitSize(backNumber, 220, [34, 30, 27, 24]);
  return `
  <g>
    <rect x="8" y="10" width="${w}" height="${h}" rx="5" fill="rgba(35,41,31,0.18)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="${LABEL_2}" stroke="${INK}" stroke-width="4"/>
    <rect x="0" y="0" width="44" height="${h}" fill="${AISLE}" opacity="0.85"/>
    <line x1="44" y1="0" x2="44" y2="${h}" stroke="${INK}" stroke-width="4"/>
    <circle cx="22" cy="32" r="10" fill="${LABEL_2}" stroke="${INK}" stroke-width="3.5"/>
    <text x="76" y="${nameSize + 22}" font-family="${sans(lang)}" font-size="${nameSize}" font-weight="800" fill="${INK}">${esc(backName)}</text>
    <rect x="76" y="${nameSize + 42}" width="${Math.round(w * 0.42)}" height="8" rx="4" fill="rgba(35,41,31,0.13)"/>
    <g transform="translate(${w - 268},${h / 2 - 30})">
      <rect x="0" y="0" width="240" height="62" rx="3" fill="${PRICE_BG}" stroke="${PRICE}" stroke-width="4"/>
      <text x="120" y="${43}" text-anchor="middle" font-family="${mono(lang)}" font-size="${numSize}" font-weight="800" fill="${PRICE}">${esc(backNumber)}</text>
    </g>
  </g>`;
}

/** The stall the labels are clipped to: an awning over a shop board. */
function stall(job, w, h) {
  const { lang, signWord } = job;
  const signSize = fitSize(signWord, w - 200, [48, 42, 36, 32]);
  const stripes = [];
  for (let x = 0; x < w; x += 76) {
    stripes.push(
      `<path d="M${x} 0 h38 v96 h-38 Z" fill="${x % 152 === 0 ? AWNING : LABEL}"/>`,
    );
  }
  const scallops = [];
  for (let x = 19; x < w; x += 38) {
    scallops.push(`<circle cx="${x}" cy="96" r="19" fill="${x % 76 === 19 ? AWNING : LABEL}"/>`);
  }
  return `
  <g>
    <rect x="12" y="16" width="${w}" height="${h}" rx="6" fill="rgba(35,41,31,0.2)"/>
    <rect x="0" y="86" width="${w}" height="${h - 86}" rx="4" fill="${AWNING_BG}" stroke="${INK}" stroke-width="6"/>
    <g clip-path="url(#awningClip)">
      ${stripes.join("")}
      ${scallops.join("")}
    </g>
    <rect x="0" y="0" width="${w}" height="115" fill="none" stroke="${INK}" stroke-width="6"/>
    <text x="${w / 2}" y="${h - 44}" text-anchor="middle" font-family="${sans(lang)}" font-size="${signSize}" font-weight="800" fill="${AWNING}" letter-spacing="4">${esc(signWord)}</text>
  </g>`;
}

/** The four gates this app refuses, struck through. */
function noChips(lang, labels) {
  let x = 0;
  let y = 0;
  const out = [];
  for (const label of labels) {
    const size = fitSize(label, 300, [28, 26, 24, 22]);
    const w = Math.round(textWidth(label, size)) + 48;
    if (x + w > 700) {
      x = 0;
      y += 76;
    }
    out.push(`
    <g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="58" rx="4" fill="${AWNING_BG}" stroke="${MUTED}" stroke-width="2.5" opacity="0.95"/>
      <text x="${w / 2}" y="${29 + size * 0.36}" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
      <path d="M4 54 L${w - 4} 4" stroke="${PRICE}" stroke-width="6" stroke-linecap="round"/>
    </g>`);
    x += w + 18;
  }
  return { svg: out.join(""), height: y + 58 };
}

function svgFor(job) {
  const { lang, title, tagline, noWords, foot, credit, aisleLetter } = job;
  const titleSize = fitSize(title, 690, [116, 100, 88, 76, 66]);
  const tagSize = fitSize(tagline, 700, [32, 29, 26, 23, 21]);
  const chips = noChips(lang, noWords);
  const footSize = fitSize(foot, 700, [28, 26, 24, 22]);
  const creditSize = fitSize(credit, 680, [24, 22, 20, 18]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="canopy" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#e8efe0"/>
      <stop offset="52%" stop-color="#d9e3cd"/>
      <stop offset="100%" stop-color="#c1d0b0"/>
    </linearGradient>
    <clipPath id="awningClip">
      <rect x="0" y="0" width="800" height="115"/>
    </clipPath>
  </defs>

  <rect width="1800" height="945" fill="url(#canopy)"/>
  ${weave()}
  <circle cx="1660" cy="60" r="240" fill="rgba(29,92,63,0.07)"/>
  <circle cx="110" cy="900" r="200" fill="rgba(191,59,44,0.05)"/>

  <!-- the stall, and the labels clipped under it -->
  <g transform="translate(930,52)">
    ${stall(job, 800, 300)}
  </g>
  <g transform="translate(1000,262)">
    ${aisleChip(aisleLetter, lang)}
  </g>
  <g transform="translate(900,330) rotate(1.4)">
    ${backLabel(job, 820, 190)}
  </g>
  <g transform="translate(872,548) rotate(-2.2)">
    ${frontLabel(job, 860, 330)}
  </g>

  <!-- the title block -->
  <g transform="translate(84,150)">
    <text x="0" y="${titleSize}" font-family="${sans(lang)}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <rect x="2" y="${titleSize + 28}" width="${Math.min(700, textWidth(title, titleSize))}" height="7" fill="${AWNING}"/>
    <text x="0" y="${titleSize + 114}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${MUTED}">${esc(tagline)}</text>
    <g transform="translate(0,${titleSize + 172})">${chips.svg}</g>
    <text x="0" y="${titleSize + 172 + chips.height + 68}" font-family="${sans(lang)}" font-size="${footSize}" font-weight="700" fill="${INK}">${esc(foot)}</text>
    <g transform="translate(0,${titleSize + 172 + chips.height + 108})">
      <rect x="0" y="18" width="560" height="3" fill="${FAINT}"/>
      <rect x="0" y="14" width="52" height="11" rx="3" fill="${PRICE}"/>
      <text x="0" y="${66 + creditSize}" font-family="${sans(lang)}" font-size="${creditSize}" font-weight="600" fill="${MUTED}">${esc(credit)}</text>
    </g>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#d9e3cd"/>
  <g transform="translate(44,66)">
    <rect x="10" y="150" width="404" height="238" rx="18" fill="#fffdf3" stroke="#23291f" stroke-width="18"/>
    <path d="M0 142 L58 24 h308 l58 118 Z" fill="#1d5c3f" stroke="#23291f" stroke-width="18" stroke-linejoin="round"/>
    <path d="M128 24 L104 142 M232 24 L220 142 M336 24 L336 142" stroke="#fffdf3" stroke-width="20"/>
    <rect x="56" y="196" width="150" height="106" rx="8" fill="#ffe89a" stroke="#23291f" stroke-width="14"/>
    <path d="M84 232 h94 M84 268 h64" stroke="#23291f" stroke-width="12" opacity="0.5"/>
    <g transform="translate(232,196) rotate(-6)">
      <path d="M4 4 h104 l44 46 -44 46 H4 Z" fill="#fbe3dd" stroke="#bf3b2c" stroke-width="14" stroke-linejoin="round"/>
      <circle cx="112" cy="50" r="12" fill="#bf3b2c"/>
    </g>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: MARKET_RGB })
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
      title: "가게록",
      tagline: "가게 이름, 매장 번호, 메모. 가나다순. 이 기기에만.",
      noWords: ["스프레드시트", "로그인", "100건 제한", "PRO 잠금"],
      foot: "탭을 닫아도 그대로 — 넣는 순간 가나다순 제자리로",
      credit: "가게 수 제한 없음 · JSON·CSV 내보내기 · 이 기기에만",
      signWord: "가게 목록",
      aisleLetter: "ㅅ",
      storeName: "성수 철물점",
      numberTag: "매장 번호",
      storeNumber: "02-1234-5678",
      noteText: "뒷문 하역 · 점장 김씨 · 월요일 휴무",
      backName: "수유 상회",
      backNumber: "1023",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Storelog",
      tagline: "Store name, store number, notes. A–Z. On this device only.",
      noWords: ["No spreadsheet", "No login", "No 100-doc cap", "No PRO unlock"],
      foot: "Close the tab — the list is still here, still filed A–Z",
      credit: "Unlimited stores · JSON and CSV export · this device only",
      signWord: "STORE LIST",
      aisleLetter: "N",
      storeName: "Northgate Hardware",
      numberTag: "STORE NO.",
      storeNumber: "1023",
      noteText: "loading dock at the back · ask for Dana · closed Mondays",
      backName: "Novak Produce",
      backNumber: "0417",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "店舗帳",
      tagline: "店名、店舗番号、メモ。あいうえお順。この端末だけ。",
      noWords: ["表計算アプリ", "ログイン", "100件の上限", "有料ロック"],
      foot: "タブを閉じても残る — 入れた瞬間にあいうえお順の位置へ",
      credit: "件数の上限なし · JSON・CSV書き出し · この端末だけに",
      signWord: "店舗一覧",
      aisleLetter: "き",
      storeName: "北口金物店",
      numberTag: "店舗番号",
      storeNumber: "03-1234-5678",
      noteText: "裏口で荷下ろし · 担当は田中さん · 月曜定休",
      backName: "木下青果店",
      backNumber: "1023",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "店录",
      tagline: "店名、门店号、备注。按字母排序。仅此设备。",
      noWords: ["电子表格", "登录", "100 条上限", "PRO 解锁"],
      foot: "关掉标签页也还在 — 加进来就排到该在的位置",
      credit: "不限门店数量 · 导出 JSON 和 CSV · 只在这台设备",
      signWord: "门店名录",
      aisleLetter: "B",
      storeName: "北门五金店",
      numberTag: "门店号",
      storeNumber: "010-1234-5678",
      noteText: "后门卸货 · 找李店长 · 周一休息",
      backName: "白桥果蔬店",
      backNumber: "1023",
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
