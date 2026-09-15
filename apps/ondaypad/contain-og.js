// ESM: package.json is "type": "module"
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Ondaypad card: warm nostalgia calendar.
 * Soft apricot paper, terracotta ink, cream card, rose/gold accents.
 * Four real jobs (ko/en/ja/zh); zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 255, g: 247, b: 237, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#9a3412";
const MUTED = "#78716c";
const LINE = "#fed7aa";
const LINE2 = "#fdba74";
const PAPER2 = "#ffedd5";
const CARD = "#fefce8";
const ROSE = "#fb7185";
const ROSE_DEEP = "#e11d48";
const GOLD = "#fbbf24";
const SEPIA = "#a18072";
const NOTICE = "#fde68a";
const NOTICE_INK = "#4a2e05";

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

function truncate(text, size, maxWidth) {
  if (textWidth(text, size) <= maxWidth) return text;
  const chars = [...String(text)];
  while (chars.length > 1 && textWidth(chars.join("") + "…", size) > maxWidth) chars.pop();
  return chars.join("").trimEnd() + "…";
}

function calendarMark(x, y, s = 1) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <rect x="4" y="10" width="56" height="48" rx="10" fill="${CARD}" stroke="${INK}" stroke-width="2.2"/>
    <rect x="4" y="10" width="56" height="14" rx="8" fill="${ROSE}"/>
    <circle cx="18" cy="10" r="3.2" fill="${GOLD}"/>
    <circle cx="46" cy="10" r="3.2" fill="${GOLD}"/>
    <rect x="14" y="32" width="10" height="10" rx="2" fill="${PAPER2}" stroke="${LINE2}"/>
    <rect x="28" y="32" width="10" height="10" rx="2" fill="${ROSE}" opacity="0.85"/>
    <rect x="42" y="32" width="10" height="10" rx="2" fill="${PAPER2}" stroke="${LINE2}"/>
    <rect x="14" y="46" width="10" height="8" rx="2" fill="${PAPER2}" stroke="${LINE2}"/>
    <rect x="28" y="46" width="10" height="8" rx="2" fill="${PAPER2}" stroke="${LINE2}"/>
  </g>`;
}

function card(job) {
  const titleSize = fitSize(job.brand, 520, [44, 40, 36, 32, 28]);
  const tag = truncate(job.tagline, 18, 720);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="100%" stop-color="#ffedd5"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
  <rect x="36" y="36" width="1128" height="64" rx="28" fill="${NOTICE}"/>
  <text x="60" y="76" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${NOTICE_INK}">${esc(job.banner)}</text>
  ${calendarMark(70, 130, 1.6)}
  <text x="190" y="178" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.brand)}</text>
  <text x="190" y="220" font-size="18" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(tag)}</text>

  <!-- month grid preview -->
  <g transform="translate(70,260)">
    <rect width="420" height="280" rx="18" fill="#fff7ed" stroke="${LINE}" stroke-width="2"/>
    <text x="24" y="40" font-size="22" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.monthLabel)}</text>
    <text x="396" y="40" text-anchor="end" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${SEPIA}">${esc(job.navHint)}</text>
    ${[0,1,2,3,4,5,6].map((i) => `<circle cx="${48 + i * 52}" cy="88" r="14" fill="${i===2?'#fb7185':'#ffedd5'}" stroke="${LINE2}"/>`).join("")}
    ${[0,1,2,3,4,5,6].map((i) => `<circle cx="${48 + i * 52}" cy="140" r="14" fill="#ffedd5" stroke="${LINE2}"/>`).join("")}
    ${[0,1,2,3,4,5,6].map((i) => `<circle cx="${48 + i * 52}" cy="192" r="14" fill="${i===4?'#fbbf24':'#ffedd5'}" stroke="${LINE2}"/>`).join("")}
    <text x="24" y="250" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.gridHint)}</text>
  </g>

  <!-- across-years stack -->
  <g transform="translate(520,260)">
    <rect width="600" height="280" rx="18" fill="#fff7ed" stroke="${LINE}" stroke-width="2"/>
    <text x="24" y="40" font-size="22" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.stackTitle)}</text>
    <rect x="24" y="60" width="552" height="56" rx="12" fill="${CARD}" stroke="${LINE2}"/>
    <text x="40" y="94" font-size="16" font-weight="700" font-family="${sans(job.lang)}" fill="${ROSE_DEEP}">${esc(job.y1)}</text>
    <rect x="24" y="128" width="552" height="56" rx="12" fill="${CARD}" stroke="${LINE2}"/>
    <text x="40" y="162" font-size="16" font-weight="700" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.y2)}</text>
    <rect x="24" y="196" width="552" height="56" rx="12" fill="${CARD}" stroke="${LINE2}"/>
    <text x="40" y="230" font-size="16" font-weight="700" font-family="${sans(job.lang)}" fill="${SEPIA}">${esc(job.y3)}</text>
  </g>

  <text x="60" y="580" font-size="14" font-weight="700" font-family="DejaVu Sans Mono, monospace" fill="${INK}">{ "app": "ondaypad", "version": 1 }</text>
  <text x="1136" y="580" text-anchor="end" font-size="16" font-weight="700" font-family="DejaVu Sans, sans-serif" fill="${ROSE_DEEP}">ondaypad.try-dabble.com</text>
</svg>`;
}

const JOBS = {
  ko: {
    lang: "ko",
    brand: "온데이패드",
    tagline: "무료 로컬 향수 캘린더 · 월 그리드 · 같은 날 여러 해 메모 쌓기 · JSON 백업",
    banner: "데이터는 이 기기에만 · 로그인·광고 없음 · JSON으로 백업하세요",
    monthLabel: "2026년 9월",
    navHint: "◀ ▶",
    gridHint: "메모 있는 날은 표시됩니다",
    stackTitle: "이 날 · 여러 해",
    y1: "2026 · 엄마와 커피",
    y2: "2025 · 첫 출근",
    y3: "2024 · 이사한 날",
  },
  en: {
    lang: "en",
    brand: "Ondaypad",
    tagline: "Free local nostalgia calendar · month grid · this day across years · JSON backup",
    banner: "Stays on this device · No login · No ads · Export JSON so a lost phone is not the end",
    monthLabel: "September 2026",
    navHint: "◀ ▶",
    gridHint: "Days with notes are marked",
    stackTitle: "This day across years",
    y1: "2026 · Coffee with mom",
    y2: "2025 · First day at work",
    y3: "2024 · Moving day",
  },
  ja: {
    lang: "ja",
    brand: "オンデイパッド",
    tagline: "無料ローカル懐かしさカレンダー · 月グリッド · 同じ日の年ごとメモ · JSONバックアップ",
    banner: "データはこの端末だけ · ログイン・広告なし · JSONでバックアップ",
    monthLabel: "2026年9月",
    navHint: "◀ ▶",
    gridHint: "メモのある日はマークされます",
    stackTitle: "この日 · 年をまたいで",
    y1: "2026 · 母とコーヒー",
    y2: "2025 · 初出勤",
    y3: "2024 · 引っ越しの日",
  },
  zh: {
    lang: "zh",
    brand: "当日记事板",
    tagline: "免费本地怀旧日历 · 月网格 · 跨年同日笔记堆叠 · JSON 备份",
    banner: "仅存于此设备 · 无登录 · 无广告 · 请用 JSON 备份，以免丢手机丢数据",
    monthLabel: "2026年9月",
    navHint: "◀ ▶",
    gridHint: "有笔记的日期会标记",
    stackTitle: "这一天 · 跨年",
    y1: "2026 · 和妈妈喝咖啡",
    y2: "2025 · 第一天上班",
    y3: "2024 · 搬家那天",
  },
};

async function writePng(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function writeIcon(size, file, maskable = false) {
  const pad = maskable ? Math.round(size * 0.18) : Math.round(size * 0.12);
  const inner = size - pad * 2;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#fff7ed"/>
  <g transform="translate(${pad},${pad}) scale(${inner / 64})">
    <rect x="4" y="10" width="56" height="48" rx="10" fill="#fefce8" stroke="#9a3412" stroke-width="2.2"/>
    <rect x="4" y="10" width="56" height="14" rx="8" fill="#fb7185"/>
    <circle cx="18" cy="10" r="3.2" fill="#fbbf24"/>
    <circle cx="46" cy="10" r="3.2" fill="#fbbf24"/>
    <rect x="14" y="32" width="10" height="10" rx="2" fill="#ffedd5" stroke="#fdba74"/>
    <rect x="28" y="32" width="10" height="10" rx="2" fill="#fb7185"/>
    <rect x="42" y="32" width="10" height="10" rx="2" fill="#ffedd5" stroke="#fdba74"/>
  </g>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  for (const [lang, job] of Object.entries(JOBS)) {
    const file = path.join(OUT, `og-image-${lang}.png`);
    await writePng(card(job), file);
    console.log("wrote", file);
  }
  await writePng(card(JOBS.ko), path.join(OUT, "og-image.png"));
  await writeIcon(192, path.join(ICONS, "icon-192.png"));
  await writeIcon(512, path.join(ICONS, "icon-512.png"));
  await writeIcon(512, path.join(ICONS, "icon-maskable-512.png"), true);
  await writeIcon(180, path.join(ICONS, "apple-touch-icon.png"));
  // favicon.ico from 192
  await sharp(path.join(ICONS, "icon-192.png")).resize(32, 32).toFile(path.join(OUT, "favicon.ico"));
  console.log("icons + favicon done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
