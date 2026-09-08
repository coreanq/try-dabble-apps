// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Fxpad card: a window seat at cruising altitude.
 *
 * The product is "sync once, convert on the plane", so the picture is a
 * boarding-pass-shaped converter floating over a sky-to-cream gradient with a
 * paper plane drawing a dotted arc across the top. The pass shows an amount
 * going from one flag chip to another, the converted figure in mint, and the
 * unit rate underneath. A small "offline" tag sits on the corner. Four real
 * jobs (ko/en/ja/zh), each its own SVG → PNG; zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const SKY = { r: 234, g: 246, b: 241, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#17303a";
const MUTED = "#587079";
const LINE = "#cfe1da";
const LINE2 = "#b9d2c9";
const MINT = "#1f8a6b";
const MINT_DEEP = "#146b52";
const MINT_SOFT = "#d7f0e6";
const AZURE = "#4ea3d8";
const AMBER = "#f2c14e";
const AMBER_INK = "#3b2a05";
const CREAM = "#fffdf8";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rough advance width so one layout survives ko/en/ja/zh without clipping. */
function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.56;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/** Soft clouds under the plane: three overlapping ellipses each, no outline. */
function clouds() {
  const one = (x, y, s, o) => `
  <g transform="translate(${x},${y}) scale(${s})" opacity="${o}">
    <ellipse cx="0" cy="0" rx="120" ry="42" fill="#ffffff"/>
    <ellipse cx="-60" cy="12" rx="70" ry="34" fill="#ffffff"/>
    <ellipse cx="70" cy="10" rx="80" ry="36" fill="#ffffff"/>
  </g>`;
  return one(260, 300, 1.1, 0.85) + one(1500, 240, 0.9, 0.8) + one(1000, 860, 1.4, 0.55) + one(300, 900, 1.0, 0.5);
}

/** The paper plane and its dotted arc across the top of the card. */
function plane() {
  return `
  <path d="M120 250 C 500 40, 1200 40, 1560 190" fill="none" stroke="${AZURE}" stroke-width="6" stroke-dasharray="4 22" stroke-linecap="round" opacity="0.9"/>
  <g transform="translate(1560,190) rotate(18)">
    <path d="M0 0 L-92 -34 L-64 0 L-92 34 Z" fill="${CREAM}" stroke="${AZURE}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M-64 0 L-40 22 L-30 -4 Z" fill="${AZURE}"/>
  </g>`;
}

/** Small drawn flags: emoji fonts do not rasterize in librsvg, so each flag
 *  is a few shapes. Clipped to a rounded rectangle 64x44. */
function flag(code) {
  const w = 64, h = 44;
  let art = "";
  switch (code) {
    case "JP":
      art = `<rect width="${w}" height="${h}" fill="#ffffff"/><circle cx="32" cy="22" r="12" fill="#bc002d"/>`;
      break;
    case "KR":
      art = `<rect width="${w}" height="${h}" fill="#ffffff"/>
        <path d="M20 22a12 12 0 0 1 24 0a6 6 0 0 1 -12 0a6 6 0 0 0 -12 0z" fill="#cd2e3a"/>
        <path d="M44 22a12 12 0 0 1 -24 0a6 6 0 0 0 12 0a6 6 0 0 1 12 0z" fill="#0047a0"/>
        <g stroke="#000" stroke-width="2"><path d="M8 10l6 -4M10 13l6 -4M12 16l6 -4"/><path d="M50 38l-6 4M48 35l-6 4M46 32l-6 4"/><path d="M8 34l6 4M10 31l6 4M12 28l6 4"/><path d="M50 6l-6 -4M48 9l-6 -4M46 12l-6 -4"/></g>`;
      break;
    case "US":
      art = `<rect width="${w}" height="${h}" fill="#ffffff"/>` +
        Array.from({ length: 7 }, (_, i) => `<rect x="0" y="${i * (h / 13) * 2}" width="${w}" height="${h / 13}" fill="#b22234"/>`).join("") +
        `<rect width="28" height="24" fill="#3c3b6e"/>` +
        Array.from({ length: 12 }, (_, i) => `<circle cx="${5 + (i % 4) * 6}" cy="${5 + Math.floor(i / 4) * 7}" r="1.4" fill="#fff"/>`).join("");
      break;
    case "CN":
      art = `<rect width="${w}" height="${h}" fill="#de2910"/>
        <path d="M12 6l2.6 8h8.4l-6.8 5 2.6 8-6.8-5-6.8 5 2.6-8-6.8-5h8.4z" fill="#ffde00" transform="translate(2,2) scale(0.9)"/>
        <g fill="#ffde00"><circle cx="28" cy="6" r="1.8"/><circle cx="32" cy="11" r="1.8"/><circle cx="32" cy="17" r="1.8"/><circle cx="28" cy="22" r="1.8"/></g>`;
      break;
    default:
      art = `<rect width="${w}" height="${h}" fill="${MINT_SOFT}"/>`;
  }
  const id = `clip-${code}-${Math.random().toString(36).slice(2, 7)}`;
  return `<defs><clipPath id="${id}"><rect width="${w}" height="${h}" rx="8"/></clipPath></defs>
  <g clip-path="url(#${id})">${art}</g>
  <rect width="${w}" height="${h}" rx="8" fill="none" stroke="rgba(23,48,58,0.25)" stroke-width="2"/>`;
}

/** One currency chip on the pass: flag, code, and a small name. */
function chip(lang, x, y, w, info, filled) {
  const nameSize = fitSize(info.name, w - 150, [28, 26, 24, 22]);
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="${w}" height="120" rx="22" fill="${filled ? MINT_SOFT : "#ffffff"}" stroke="${filled ? "rgba(31,138,107,0.6)" : LINE2}" stroke-width="3"/>
    <g transform="translate(28,38) scale(1.15)">${flag(info.flag)}</g>
    <text x="118" y="56" font-family="${figures(lang)}" font-size="42" font-weight="700" fill="${INK}">${esc(info.code)}</text>
    <text x="118" y="96" font-family="${sans(lang)}" font-size="${nameSize}" font-weight="600" fill="${MUTED}">${esc(info.name)}</text>
  </g>`;
}

/** The fail-fix promise line along the bottom of the pass, as pills. */
function promises(lang, items, y) {
  let x = 56;
  const out = [];
  for (const label of items) {
    const size = 28;
    const w = textWidth(label, size) + 44;
    out.push(`<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="52" rx="26" fill="#ffffff" stroke="${LINE2}" stroke-width="2.5"/>
      <text x="${w / 2}" y="36" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
    </g>`);
    x += w + 16;
  }
  return out.join("");
}

function svgFor(job) {
  const { lang, title, subtitle, amount, from, to, result, unit, offline } = job;
  const titleSize = fitSize(title, 900, [104, 92, 80, 70, 60]);
  const subSize = fitSize(subtitle, 1040, [40, 36, 32, 28, 25]);
  const resultSize = fitSize(result, 700, [96, 84, 72]);
  const offSize = fitSize(offline, 300, [30, 27, 24, 22]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cfe6f4"/>
      <stop offset="42%" stop-color="#e6f3ee"/>
      <stop offset="100%" stop-color="#f6f1e6"/>
    </linearGradient>
    <linearGradient id="passlight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.9)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#17303a" flood-opacity="0.16"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="url(#sky)"/>
  ${clouds()}
  ${plane()}

  <g transform="translate(120,110)">
    <text x="0" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 26}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>

  <!-- the boarding pass -->
  <g transform="translate(120,${110 + titleSize + subSize + 80})" filter="url(#shadow)">
    <rect x="0" y="0" width="1560" height="${945 - (110 + titleSize + subSize + 80) - 70}" rx="34" fill="${CREAM}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="1560" height="${945 - (110 + titleSize + subSize + 80) - 70}" rx="34" fill="url(#passlight)"/>
    <rect x="0" y="0" width="1560" height="12" rx="6" fill="${MINT}"/>
  </g>
  <g transform="translate(120,${110 + titleSize + subSize + 80})">
    <!-- perforation between stub and body -->
    <line x1="1120" y1="30" x2="1120" y2="${945 - (110 + titleSize + subSize + 80) - 100}" stroke="${LINE2}" stroke-width="4" stroke-dasharray="4 16" stroke-linecap="round"/>

    <text x="56" y="90" font-family="${figures(lang)}" font-size="88" font-weight="700" fill="${INK}" text-anchor="start">${esc(amount)}</text>
    ${chip(lang, 56, 120, 440, from, false)}
    <g transform="translate(540,180)">
      <circle cx="0" cy="0" r="46" fill="${CREAM}" stroke="${LINE2}" stroke-width="3"/>
      <path d="M-22 -10 h36 l-12 -12 M22 10 h-36 l12 12" fill="none" stroke="${MINT_DEEP}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    ${chip(lang, 620, 120, 440, to, true)}

    <text x="56" y="${120 + 120 + 100}" font-family="${figures(lang)}" font-size="${resultSize}" font-weight="700" fill="${MINT_DEEP}">${esc(result)}</text>
    <text x="56" y="${120 + 120 + 150}" font-family="${figures(lang)}" font-size="32" font-weight="600" fill="${MUTED}">${esc(unit)}</text>
    ${promises(lang, job.promises, 120 + 120 + 190)}

    <!-- stub: offline tag -->
    <g transform="translate(1180,70)">
      <rect x="0" y="0" width="330" height="${offSize + 40}" rx="18" fill="${AMBER}"/>
      <text x="165" y="${offSize + 12}" text-anchor="middle" font-family="${sans(lang)}" font-size="${offSize}" font-weight="800" fill="${AMBER_INK}">${esc(offline)}</text>
    </g>
    <g transform="translate(1180,${offSize + 150})" fill="${LINE2}">
      ${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 24}" y="0" width="${i % 3 === 0 ? 14 : 8}" height="80" rx="3"/>`).join("")}
    </g>
  </g>
</svg>`;
}

/** App icon: the mint rate pad with the sky badge, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d9eef7"/>
      <stop offset="55%" stop-color="#eaf6f1"/>
      <stop offset="100%" stop-color="#f6f1e6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="64" y="112" width="384" height="300" rx="56" fill="${MINT}"/>
    <rect x="96" y="144" width="320" height="236" rx="40" fill="#eaf6f1"/>
    <path d="M150 330 L215 250 L262 292 L350 200" fill="none" stroke="${MINT}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M308 200 h44 v44" fill="none" stroke="${MINT}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="400" cy="118" r="70" fill="${AZURE}"/>
    <circle cx="400" cy="118" r="70" fill="none" stroke="#f7fbfd" stroke-width="10"/>
    <path d="M368 128 L392 92 L426 112 L410 146 Z" fill="#f7fbfd"/>
    <ellipse cx="256" cy="452" rx="180" ry="16" fill="rgba(23,48,58,0.12)"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: SKY })
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
  const KRW = { code: "KRW", flag: "KR" };
  const JPY = { code: "JPY", flag: "JP" };
  const USD = { code: "USD", flag: "US" };
  const CNY = { code: "CNY", flag: "CN" };
  const jobs = [
    {
      lang: "ko",
      title: "환율패드",
      subtitle: "광고 없는 오프라인 환율. 받아 두고, 비행기 안에서도 환산.",
      amount: "100,000 KRW",
      from: { ...KRW, name: "대한민국 원" },
      to: { ...JPY, name: "일본 엔" },
      result: "≈ 11,480 JPY",
      unit: "1 JPY = 8.71 KRW · 1 KRW = 0.1148 JPY",
      offline: "오프라인 환산",
      promises: ["광고 없음", "환율 캐시", "로그인 없음", "JPY 포함", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Fxpad",
      subtitle: "Ad-free offline currency converter. Sync rates, convert on the plane.",
      amount: "100 USD",
      from: { ...USD, name: "US Dollar" },
      to: { ...JPY, name: "Japanese Yen" },
      result: "≈ 15,475 JPY",
      unit: "1 USD = 154.75 JPY · 1 JPY = 0.0065 USD",
      offline: "Works offline",
      promises: ["No ads", "Rates cache", "No login", "Includes JPY", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "為替パッド",
      subtitle: "広告なしのオフライン為替。取り込んで、機内でも換算。",
      amount: "10,000 JPY",
      from: { ...JPY, name: "日本円" },
      to: { ...USD, name: "米ドル" },
      result: "≈ 64.62 USD",
      unit: "1 JPY = 0.0065 USD · 1 USD = 154.75 JPY",
      offline: "オフライン換算",
      promises: ["広告なし", "レートをキャッシュ", "ログインなし", "JPY対応", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "汇率板",
      subtitle: "无广告离线汇率。同步后，飞机上也能换算。",
      amount: "1,000 CNY",
      from: { ...CNY, name: "人民币" },
      to: { ...JPY, name: "日元" },
      result: "≈ 23,060 JPY",
      unit: "1 CNY = 23.06 JPY · 1 JPY = 0.0434 CNY",
      offline: "离线换算",
      promises: ["无广告", "汇率缓存", "无需登录", "含日元", "ko/en/ja/zh"],
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }

  const iconBuf = Buffer.from(iconSvg(0));
  await sharp(iconBuf).resize(192, 192, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-192.png"));
  await sharp(iconBuf).resize(512, 512, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-512.png"));
  await sharp(iconBuf).resize(180, 180, { fit: "cover" }).png().toFile(path.join(ICONS, "apple-touch-icon.png"));
  await sharp(iconBuf).resize(32, 32, { fit: "cover" }).png().toFile(path.join(OUT, "favicon.ico"));

  // Maskable art is cropped to a circle on Android, so the pad gets its own
  // padded render instead of reusing the edge-to-edge icon.
  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
