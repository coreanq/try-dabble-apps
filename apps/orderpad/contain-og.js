// ESM: package.json is "type": "module".
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Orderpad card: a carbon-copy order slip torn off the pad, with the yellow
 * and pink duplicates showing behind it. The slip carries exactly the fields
 * the app has — the customer as they appear in the DM, the item with the size
 * ringed the way you ring an option on paper, the address the way it arrives,
 * a green PAID stamp and a SHIPS TODAY chip. A second docket is still on the
 * pad behind it, because there is always another message.
 * The left column carries the title and the four gates this app refuses,
 * struck through, because "sign in with Meta", "create an account", "100
 * orders free" and "type it into Excel tonight" are exactly the walls a DM
 * seller hits.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const DESK_RGB = { r: 216, g: 211, b: 197, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang) => `Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#221f2c";
const MUTED = "#6b6559";
const FAINT = "#99927f";
const DESK = "#d8d3c5";
const DESK_2 = "#c5bfae";
const SHEET = "#fffdf7";
const SHEET_2 = "#f7f2e4";
const COPY_YELLOW = "#f2e2a0";
const COPY_PINK = "#f0cec9";
const RULE = "#ddd6c4";
const CARBON = "#33306e";
const CARBON_BG = "#e3e1f2";
const STAMP = "#b3202a";
const STAMP_BG = "#f8dedc";
const PAID = "#1f6b4a";
const PAID_BG = "#d9ebdf";

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

/** The faint diagonal grain a carbon sheet leaves on the counter. */
function grain() {
  const out = [];
  for (let i = -960; i < 1800; i += 9) {
    out.push(
      `<path d="M${i} 0 L${i + 960} 945" stroke="rgba(34,31,44,0.028)" stroke-width="1.6" fill="none"/>`,
    );
  }
  return out.join("");
}

/** The perforation a slip tears along. */
function perforation(w, y) {
  const dots = [];
  for (let x = 18; x < w - 12; x += 16) {
    dots.push(`<rect x="${x}" y="${y}" width="8" height="3" fill="${DESK_2}"/>`);
  }
  return dots.join("");
}

/** One field on the slip: the value written on a printed line, the caption
 *  set small underneath in the pad's own small caps. */
function field(job, x, y, w, cap, value, sizes) {
  const { lang } = job;
  const size = fitSize(value, w - 12, sizes);
  return `
  <g transform="translate(${x},${y})">
    <text x="0" y="${size}" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${INK}">${esc(value)}</text>
    <rect x="0" y="${size + 16}" width="${w}" height="2.5" fill="${RULE}"/>
    <text x="0" y="${size + 48}" font-family="${mono(lang)}" font-size="20" font-weight="800" letter-spacing="5" fill="${FAINT}">${esc(cap)}</text>
  </g>`;
}

/** The size or option, ringed the way it is ringed on a paper slip. */
function optionRing(job, text) {
  const { lang } = job;
  const size = fitSize(text, 190, [30, 27, 24, 21]);
  const w = Math.round(textWidth(text, size)) + 40;
  return `
  <g>
    <rect x="0" y="0" width="${w}" height="${size + 20}" rx="${(size + 20) / 2}" fill="none" stroke="${CARBON}" stroke-width="4"/>
    <text x="${w / 2}" y="${size + 4}" text-anchor="middle" font-family="${mono(lang)}" font-size="${size}" font-weight="800" fill="${CARBON}">${esc(text)}</text>
  </g>`;
}

/** A rubber stamp: boxed, letter-spaced, knocked a little off square. */
function rubberStamp(job, text, color, bg, rotate) {
  const { lang } = job;
  const size = fitSize(text, 260, [34, 30, 27, 24]);
  const w = Math.round(textWidth(text, size)) + 52;
  const h = size + 26;
  return `
  <g transform="rotate(${rotate})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="${bg}" stroke="${color}" stroke-width="5"/>
    <text x="${w / 2}" y="${h / 2 + size * 0.36}" text-anchor="middle" font-family="${mono(lang)}" font-size="${size}" font-weight="800" letter-spacing="4" fill="${color}">${esc(text)}</text>
  </g>`;
}

/** The ship-by chip, in its loud "today" state. */
function dueChip(job, text) {
  const { lang } = job;
  const size = fitSize(text, 300, [30, 27, 24, 21]);
  const w = Math.round(textWidth(text, size)) + 48;
  const h = size + 24;
  return `
  <g>
    <rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="${CARBON_BG}" stroke="${CARBON}" stroke-width="4"/>
    <text x="${w / 2}" y="${h / 2 + size * 0.36}" text-anchor="middle" font-family="${mono(lang)}" font-size="${size}" font-weight="800" fill="${CARBON}">${esc(text)}</text>
  </g>`;
}

/** The docket the reader is meant to actually read. */
function frontDocket(job, w, h) {
  const { lang, padWord, slipNo, custCap, custName, itemCap, itemText, optionText, addrCap, addrText, paidWord, dueWord } =
    job;
  const nameSize = fitSize(custName, w - 260, [58, 50, 44, 38]);

  return `
  <g>
    <!-- the two carbon copies still stapled under the top sheet -->
    <rect x="26" y="26" width="${w}" height="${h}" rx="5" fill="${COPY_PINK}" stroke="${INK}" stroke-width="4"/>
    <rect x="13" y="13" width="${w}" height="${h}" rx="5" fill="${COPY_YELLOW}" stroke="${INK}" stroke-width="4"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="${SHEET}" stroke="${INK}" stroke-width="5"/>

    <!-- the indigo band and the pre-printed header -->
    <rect x="0" y="0" width="${w}" height="26" fill="${CARBON}"/>
    ${perforation(w, 40)}
    <text x="34" y="${94}" font-family="${mono(lang)}" font-size="26" font-weight="800" letter-spacing="7" fill="${CARBON}">${esc(padWord)}</text>
    <text x="${w - 34}" y="${94}" text-anchor="end" font-family="${mono(lang)}" font-size="30" font-weight="800" letter-spacing="3" fill="${STAMP}">${esc(slipNo)}</text>
    <rect x="34" y="112" width="${w - 68}" height="3" fill="${INK}"/>

    <!-- the customer, written large the way a name is written on a slip -->
    <g transform="translate(34,142)">
      <text x="0" y="${nameSize}" font-family="${sans(lang)}" font-size="${nameSize}" font-weight="800" fill="${INK}">${esc(custName)}</text>
      <rect x="0" y="${nameSize + 18}" width="${w - 68}" height="2.5" fill="${RULE}"/>
      <text x="0" y="${nameSize + 50}" font-family="${mono(lang)}" font-size="20" font-weight="800" letter-spacing="5" fill="${FAINT}">${esc(custCap)}</text>
    </g>

    ${field(job, 34, 142 + nameSize + 78, w - 300, itemCap, itemText, [36, 32, 28, 25])}
    <g transform="translate(${w - 264},${142 + nameSize + 82})">${optionRing(job, optionText)}</g>

    ${field(job, 34, 142 + nameSize + 190, w - 68, addrCap, addrText, [30, 27, 24, 21])}

    <!-- what the seller marks: money in, parcel out -->
    <g transform="translate(38,${h - 108})">
      <g transform="translate(0,10)">${rubberStamp(job, paidWord, PAID, PAID_BG, -3)}</g>
      <g transform="translate(${Math.round(textWidth(paidWord, 34)) + 92},4)">${dueChip(job, dueWord)}</g>
    </g>
  </g>`;
}

/** The next docket, still on the pad behind the one being read. */
function backDocket(job, w, h) {
  const { lang, backName, backItem, unpaidWord } = job;
  const nameSize = fitSize(backName, w - 340, [40, 36, 32, 28]);
  const itemSize = fitSize(backItem, w - 340, [28, 25, 22, 20]);
  return `
  <g>
    <rect x="10" y="10" width="${w}" height="${h}" rx="5" fill="rgba(34,31,44,0.16)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="${SHEET_2}" stroke="${INK}" stroke-width="4"/>
    <rect x="0" y="0" width="${w}" height="18" fill="${CARBON}" opacity="0.75"/>
    ${perforation(w, 28)}
    <text x="30" y="${nameSize + 62}" font-family="${sans(lang)}" font-size="${nameSize}" font-weight="800" fill="${MUTED}">${esc(backName)}</text>
    <text x="30" y="${nameSize + 62 + itemSize + 22}" font-family="${sans(lang)}" font-size="${itemSize}" font-weight="600" fill="${FAINT}">${esc(backItem)}</text>
    <g transform="translate(${w - 250},${h / 2 - 6})">${rubberStamp(job, unpaidWord, STAMP, STAMP_BG, 2)}</g>
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
      <rect x="0" y="0" width="${w}" height="58" rx="4" fill="${SHEET_2}" stroke="${MUTED}" stroke-width="2.5" opacity="0.95"/>
      <text x="${w / 2}" y="${29 + size * 0.36}" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
      <path d="M4 54 L${w - 4} 4" stroke="${STAMP}" stroke-width="6" stroke-linecap="round"/>
    </g>`);
    x += w + 18;
  }
  return { svg: out.join(""), height: y + 58 };
}

function svgFor(job) {
  const { lang, title, tagline, noWords, foot, credit } = job;
  const titleSize = fitSize(title, 690, [116, 100, 88, 76, 66]);
  const tagSize = fitSize(tagline, 700, [32, 29, 26, 23, 21]);
  const chips = noChips(lang, noWords);
  const footSize = fitSize(foot, 700, [28, 26, 24, 22]);
  const creditSize = fitSize(credit, 680, [24, 22, 20, 18]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="counter" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0%" stop-color="#e6e1d5"/>
      <stop offset="54%" stop-color="#d8d3c5"/>
      <stop offset="100%" stop-color="#c3bdac"/>
    </linearGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#counter)"/>
  ${grain()}
  <circle cx="1680" cy="40" r="250" fill="rgba(51,48,110,0.07)"/>
  <circle cx="90" cy="910" r="200" fill="rgba(179,32,42,0.05)"/>

  <!-- the pad: the next docket behind, the written one in front -->
  <g transform="translate(918,58) rotate(1.6)">
    ${backDocket(job, 800, 260)}
  </g>
  <g transform="translate(852,300) rotate(-1.8)">
    ${frontDocket(job, 840, 590)}
  </g>

  <!-- the title block -->
  <g transform="translate(84,150)">
    <text x="0" y="${titleSize}" font-family="${sans(lang)}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <rect x="2" y="${titleSize + 28}" width="${Math.min(700, textWidth(title, titleSize))}" height="7" fill="${CARBON}"/>
    <text x="0" y="${titleSize + 114}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${MUTED}">${esc(tagline)}</text>
    <g transform="translate(0,${titleSize + 172})">${chips.svg}</g>
    <text x="0" y="${titleSize + 172 + chips.height + 68}" font-family="${sans(lang)}" font-size="${footSize}" font-weight="700" fill="${INK}">${esc(foot)}</text>
    <g transform="translate(0,${titleSize + 172 + chips.height + 108})">
      <rect x="0" y="18" width="560" height="3" fill="${FAINT}"/>
      <rect x="0" y="14" width="52" height="11" rx="3" fill="${STAMP}"/>
      <text x="0" y="${66 + creditSize}" font-family="${sans(lang)}" font-size="${creditSize}" font-weight="600" fill="${MUTED}">${esc(credit)}</text>
    </g>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#d8d3c5"/>
  <g transform="translate(46,52)">
    <rect x="70" y="72" width="330" height="336" rx="16" fill="#f0cec9" stroke="#221f2c" stroke-width="18"/>
    <rect x="42" y="44" width="330" height="336" rx="16" fill="#f2e2a0" stroke="#221f2c" stroke-width="18"/>
    <rect x="14" y="16" width="330" height="336" rx="16" fill="#fffdf7" stroke="#221f2c" stroke-width="20"/>
    <rect x="14" y="16" width="330" height="44" fill="#33306e"/>
    <path d="M62 136 h234 M62 196 h180 M62 256 h140" stroke="#221f2c" stroke-width="20" opacity="0.45" stroke-linecap="round"/>
    <g transform="translate(178,236) rotate(-8)">
      <rect x="0" y="0" width="150" height="86" rx="8" fill="#d9ebdf" stroke="#1f6b4a" stroke-width="16"/>
      <path d="M34 46 l24 24 L118 18" fill="none" stroke="#1f6b4a" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: DESK_RGB })
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
      title: "주문수첩",
      tagline: "고객, 상품, 입금, 발송. 이 기기에만.",
      noWords: ["메타 로그인", "회원가입", "건수 제한", "밤에 엑셀 정리"],
      foot: "DM 도중에 몇 번만 눌러 한 장 — 탭을 닫아도 그대로",
      credit: "오늘 발송·미입금만 보기 · JSON·CSV 내보내기 · 이 기기에만",
      padWord: "주문 전표",
      slipNo: "No. 0142",
      custCap: "고객",
      custName: "@minji_shop",
      itemCap: "상품",
      itemText: "리넨 원피스",
      optionText: "M / 아이보리",
      addrCap: "주소",
      addrText: "서울 마포구 성미산로 12, 301호",
      paidWord: "입금완료",
      dueWord: "오늘 발송",
      backName: "박수연",
      backItem: "코튼 셔츠 · L / 네이비",
      unpaidWord: "미입금",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Orderpad",
      tagline: "Customer, item, paid, shipped. On this device only.",
      noWords: ["No Meta login", "No sign-up", "No order cap", "No Excel at night"],
      foot: "A few taps mid-DM — close the tab, the pad is still written",
      credit: "Ship-today and unpaid filters · JSON and CSV export · this device only",
      padWord: "ORDER PAD",
      slipNo: "No. 0142",
      custCap: "CUSTOMER",
      custName: "@amara.knits",
      itemCap: "ITEM",
      itemText: "Linen dress",
      optionText: "M / ivory",
      addrCap: "ADDRESS",
      addrText: "14 Bridge Row, Flat 3, Leeds LS6",
      paidWord: "PAID",
      dueWord: "SHIPS TODAY",
      backName: "Dana R.",
      backItem: "Cotton shirt · L / navy",
      unpaidWord: "UNPAID",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "注文帳",
      tagline: "顧客、商品、入金、発送。この端末だけに。",
      noWords: ["Metaログイン", "会員登録", "件数の上限", "夜に表計算"],
      foot: "DMの途中に数タップで一枚 — タブを閉じても残る",
      credit: "今日発送・未入金だけ表示 · JSON・CSV書き出し · この端末だけに",
      padWord: "注文伝票",
      slipNo: "No. 0142",
      custCap: "顧客",
      custName: "@haru_zakka",
      itemCap: "商品",
      itemText: "リネンワンピース",
      optionText: "M / アイボリー",
      addrCap: "住所",
      addrText: "東京都世田谷区代沢3-12-4 201",
      paidWord: "入金済",
      dueWord: "本日発送",
      backName: "田中さん",
      backItem: "コットンシャツ · L / ネイビー",
      unpaidWord: "未入金",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "订货本",
      tagline: "客户、商品、付款、发货。仅此设备。",
      noWords: ["Meta 登录", "注册账号", "条数上限", "晚上补表格"],
      foot: "聊天中途点几下就写好一张 — 关掉标签页也还在",
      credit: "只看今天要发和未付款 · 导出 JSON 和 CSV · 只在这台设备",
      padWord: "订货单",
      slipNo: "No. 0142",
      custCap: "客户",
      custName: "@小满杂货",
      itemCap: "商品",
      itemText: "亚麻连衣裙",
      optionText: "M / 米白",
      addrCap: "地址",
      addrText: "上海市静安区共和新路 128 号 3 单元",
      paidWord: "已付款",
      dueWord: "今天发货",
      backName: "李小姐",
      backItem: "棉衬衫 · L / 藏青",
      unpaidWord: "未付款",
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
