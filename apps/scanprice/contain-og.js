// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Scanprice card: the aisle, at shelf height.
 * The picture is the thing the app replaces — a scan window held over a real
 * EAN-13 barcode, with the yellow shelf sticker showing today's price flagged
 * off its corner and the two older prices, each with its shop and its date,
 * stacked underneath. The bars are the genuine encoding of the number printed
 * below them, not decoration.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const AISLE = { r: 223, g: 228, b: 231, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#141a1f";
const MUTED = "#5c6a73";
const STICKER = "#ffe01a";
const STICKER_2 = "#ffc400";
const STICKER_INK = "#1c1600";
const SCAN = "#101519";
const LASER = "#ff3b30";
const TAG = "#0b5cab";
const UP = "#c62828";
const DOWN = "#17703a";
const RULE = "#ccd5da";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rough advance width so one layout survives ko/en/ja/zh without clipping. */
function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.58;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/* ------------------------------------------------------- a real EAN-13 */

const L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
const G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
const R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
const PARITY = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];

function modules(code) {
  const parity = PARITY[Number(code[0])];
  let out = "101";
  for (let i = 1; i <= 6; i++) out += (parity[i - 1] === "L" ? L : G)[Number(code[i])];
  out += "01010";
  for (let i = 7; i <= 12; i++) out += R[Number(code[i])];
  return `${out}101`;
}

/** The bars, drawn white on the dark glass of the scan window. */
function barcode(code, x, y, w, h, fill) {
  const mods = modules(code);
  const unit = w / mods.length;
  const out = [];
  let i = 0;
  while (i < mods.length) {
    if (mods[i] === "1") {
      let j = i;
      while (j < mods.length && mods[j] === "1") j++;
      const guard = i === 0 || i === mods.length - 3 || i === Math.floor(mods.length / 2) - 2;
      out.push(
        `<rect x="${(x + i * unit).toFixed(2)}" y="${y}" width="${((j - i) * unit).toFixed(2)}" height="${guard ? h + 22 : h}" fill="${fill}"/>`,
      );
      i = j;
    } else {
      i++;
    }
  }
  return out.join("");
}

/* ------------------------------------------------------------- the parts */

/** Overhead strip light plus the uprights of the gondola behind the shelf. */
function aisle() {
  const uprights = [];
  for (let x = 60; x < 1800; x += 92) {
    uprights.push(`<rect x="${x}" y="0" width="3" height="945" fill="rgba(20,26,31,0.045)"/>`);
  }
  return `
  <rect width="1800" height="945" fill="#dfe4e7"/>
  ${uprights.join("")}
  <rect width="1800" height="230" fill="url(#lamp)"/>
  <rect y="866" width="1800" height="79" fill="rgba(20,26,31,0.09)"/>
  <rect y="862" width="1800" height="6" fill="#c6d0d6"/>`;
}

/** The viewfinder: dark glass, yellow corner brackets, the laser across it. */
function scanWindow(x, y, w, h, code, lang, formats) {
  const b = 34;
  const t = 8;
  const bracket = (bx, by, hFlipX, hFlipY) => `
    <rect x="${hFlipX ? bx - b : bx}" y="${hFlipY ? by - t : by}" width="${b}" height="${t}" fill="${STICKER}"/>
    <rect x="${hFlipX ? bx - t : bx}" y="${hFlipY ? by - b : by}" width="${t}" height="${b}" fill="${STICKER}"/>`;
  return `
  <g>
    <rect x="${x + 8}" y="${y + 10}" width="${w}" height="${h}" rx="12" fill="rgba(20,26,31,0.24)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${SCAN}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="url(#glass)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="${INK}" stroke-width="5"/>
    ${bracket(x + 26, y + 26, false, false)}
    ${bracket(x + w - 26, y + 26, true, false)}
    ${bracket(x + 26, y + h - 26, false, true)}
    ${bracket(x + w - 26, y + h - 26, true, true)}
    ${barcode(code, x + 82, y + 96, w - 164, 168, "#f4f7f8")}
    <text x="${x + w / 2}" y="${y + 322}" text-anchor="middle" font-family="${mono(lang)}" font-size="34" font-weight="700" letter-spacing="9" fill="#f4f7f8">${esc(code.slice(0, 1))} ${esc(code.slice(1, 7))} ${esc(code.slice(7))}</text>
    <rect x="${x + 60}" y="${y + 178}" width="${w - 120}" height="6" rx="3" fill="${LASER}"/>
    <rect x="${x + 60}" y="${y + 170}" width="${w - 120}" height="22" rx="11" fill="${LASER}" opacity="0.28"/>
    <text x="${x + 82}" y="${y + h - 40}" font-family="${mono(lang)}" font-size="22" font-weight="700" letter-spacing="2" fill="rgba(255,255,255,0.55)">${esc(formats)}</text>
  </g>`;
}

/** The price gun sticker, knocked off square, flagged off the window corner. */
function sticker(x, y, cap, value, lang) {
  const valueSize = fitSize(value, 300, [104, 92, 80, 70]);
  const w = Math.max(300, textWidth(value, valueSize) + 92);
  return `
  <g transform="translate(${x},${y}) rotate(-3.2)">
    <rect x="7" y="9" width="${w}" height="176" rx="6" fill="rgba(20,26,31,0.3)"/>
    <rect x="0" y="0" width="${w}" height="176" rx="6" fill="url(#lemon)" stroke="${INK}" stroke-width="6"/>
    <text x="30" y="52" font-family="${mono(lang)}" font-size="27" font-weight="800" letter-spacing="7" fill="rgba(28,22,0,0.62)">${esc(cap)}</text>
    <text x="30" y="142" font-family="${sans(lang, "Avenir Next Condensed")}" font-size="${valueSize}" font-weight="800" fill="${STICKER_INK}">${esc(value)}</text>
  </g>`;
}

/** One older price, as it appears in the history: price, shop stamp, date and
 *  how far it moved. */
function historyRow(y, row, lang) {
  const [price, store, date, delta, dir] = row;
  const deltaFill = dir === "up" ? UP : DOWN;
  const storeW = Math.min(320, textWidth(store, 27) + 40);
  return `
  <g transform="translate(80,${y})">
    <rect x="0" y="0" width="770" height="86" rx="4" fill="#f2f5f7" stroke="${RULE}" stroke-width="2"/>
    <rect x="0" y="0" width="11" height="86" fill="${STICKER_2}"/>
    <text x="34" y="58" font-family="${sans(lang, "Avenir Next Condensed")}" font-size="44" font-weight="800" fill="${INK}">${esc(price)}</text>
    <g transform="translate(232,26)">
      <rect x="0" y="0" width="${storeW}" height="36" rx="3" fill="#dfeaf7" stroke="${TAG}" stroke-width="2.5"/>
      <text x="${storeW / 2}" y="27" text-anchor="middle" font-family="${mono(lang)}" font-size="25" font-weight="800" fill="${TAG}">${esc(store)}</text>
    </g>
    <text x="${252 + storeW}" y="53" font-family="${mono(lang)}" font-size="26" font-weight="700" fill="${MUTED}">${esc(date)}</text>
    <text x="746" y="55" text-anchor="end" font-family="${mono(lang)}" font-size="28" font-weight="800" fill="${deltaFill}">${dir === "up" ? "▲" : "▼"} ${esc(delta)}</text>
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, code, lastCap, price, rows } = job;
  const titleSize = fitSize(title, 720, [104, 92, 80, 70, 60]);
  const subSize = fitSize(subtitle, 740, [34, 31, 28, 25]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="lamp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.92)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <radialGradient id="glass" cx="50%" cy="-8%" r="120%">
      <stop offset="0%" stop-color="#22303a"/>
      <stop offset="62%" stop-color="#101519"/>
    </radialGradient>
    <linearGradient id="lemon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${STICKER}"/>
      <stop offset="100%" stop-color="${STICKER_2}"/>
    </linearGradient>
  </defs>

  ${aisle()}

  <!-- The shelf ticket the title is printed on, clipped into its yellow rail. -->
  <g>
    <rect x="86" y="106" width="782" height="${titleSize + 132}" rx="4" fill="rgba(20,26,31,0.2)"/>
    <rect x="80" y="96" width="782" height="${titleSize + 132}" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
    <rect x="80" y="96" width="26" height="${titleSize + 132}" fill="url(#lemon)"/>
    <rect x="106" y="96" width="4" height="${titleSize + 132}" fill="${INK}"/>
    <text x="146" y="${96 + titleSize + 34}" font-family="${sans(lang, "Avenir Next Condensed")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <rect x="146" y="${96 + titleSize + 62}" width="676" height="3" fill="${RULE}"/>
    <text x="146" y="${96 + titleSize + 108}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>

  ${scanWindow(940, 120, 780, 470, code, lang, "EAN-13 · UPC-A · EAN-8")}
  ${sticker(1380, 528, lastCap, price, lang)}

  ${rows.map((row, i) => historyRow(382 + i * 104, row, lang)).join("")}
</svg>`;
}

/** App icon: the scan window with a lemon price sticker in it. */
function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#dfe4e7"/>
  <rect x="44" y="72" width="424" height="368" rx="26" fill="#101519" stroke="#141a1f" stroke-width="14"/>
  <g fill="#ffe01a">
    <rect x="76" y="104" width="86" height="20"/>
    <rect x="76" y="104" width="20" height="86"/>
    <rect x="350" y="104" width="86" height="20"/>
    <rect x="416" y="104" width="20" height="86"/>
    <rect x="76" y="388" width="86" height="20"/>
    <rect x="76" y="322" width="20" height="86"/>
    <rect x="350" y="388" width="86" height="20"/>
    <rect x="416" y="322" width="20" height="86"/>
  </g>
  <g fill="#f4f7f8">
    <rect x="118" y="168" width="18" height="150"/>
    <rect x="146" y="168" width="9" height="150"/>
    <rect x="167" y="168" width="24" height="150"/>
    <rect x="201" y="168" width="9" height="150"/>
    <rect x="222" y="168" width="15" height="150"/>
  </g>
  <g transform="translate(262,176) rotate(-4)">
    <rect x="0" y="0" width="140" height="140" rx="10" fill="#ffe01a" stroke="#141a1f" stroke-width="14"/>
    <rect x="26" y="42" width="88" height="18" fill="#1c1600"/>
    <rect x="26" y="80" width="60" height="18" fill="#1c1600"/>
  </g>
  <rect x="96" y="243" width="320" height="14" fill="#ff3b30"/>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: AISLE })
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
      title: "스캔가격",
      subtitle: "찍고, 적고, 다시 찍으면 예전 가격",
      code: "8801234567893",
      lastCap: "이번",
      price: "3,900",
      rows: [
        ["3,600", "동네마트", "3월 4일", "400", "down"],
        ["4,200", "큰마트", "6월 2일", "600", "up"],
        ["3,900", "동네마트", "8월 30일", "300", "down"],
      ],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Scanprice",
      subtitle: "Scan it. Log the price. Scan again to see what you paid.",
      code: "5012345678900",
      lastCap: "NOW",
      price: "3.90",
      rows: [
        ["3.60", "CORNER", "4 Mar", "0.40", "down"],
        ["4.20", "BIG MART", "2 Jun", "0.60", "up"],
        ["3.90", "CORNER", "30 Aug", "0.30", "down"],
      ],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "スキャン価格",
      subtitle: "撮って、書いて、もう一度撮れば前の値段",
      code: "4901234567894",
      lastCap: "今回",
      price: "298",
      rows: [
        ["268", "駅前", "3月4日", "40", "down"],
        ["328", "大型店", "6月2日", "60", "up"],
        ["298", "駅前", "8月30日", "30", "down"],
      ],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "扫码记价",
      subtitle: "扫码记下价格，再扫就能看到上次多少钱",
      code: "6901234567892",
      lastCap: "这次",
      price: "9.9",
      rows: [
        ["8.9", "小区店", "3月4日", "1.0", "down"],
        ["11.5", "大超市", "6月2日", "2.6", "up"],
        ["9.9", "小区店", "8月30日", "1.6", "down"],
      ],
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
