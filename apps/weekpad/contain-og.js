// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Weekpad card: a fresh page in a weekly planner.
 *
 * The product is "a small budget per category, reset every week", so the
 * picture is a planner page on pale mint paper: a teal tab with the week and
 * its date range, a seven-day strip, and three category rows each carrying a
 * progress rail with spent / planned and the remaining figure. One rail is
 * over budget and turns coral. Four real jobs (ko/en/ja/zh), each its own
 * SVG → PNG; zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 242, g: 250, b: 247, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#12333a";
const MUTED = "#527078";
const LINE = "#cfe6df";
const LINE2 = "#b5d9cf";
const TEAL = "#0d9488";
const TEAL_DEEP = "#0f766e";
const TEAL_SOFT = "#d8f3ec";
const PAPER2 = "#e6f4ee";
const CORAL = "#d9534f";
const CORAL_SOFT = "#fbe3e1";
const AMBER = "#f2c14e";
const AMBER_INK = "#3b2a05";
const WHITE = "#ffffff";

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

/** Faint ruled lines across the paper. */
function ruled() {
  const out = [];
  for (let y = 60; y < 945; y += 44) {
    out.push(`<line x1="0" y1="${y}" x2="1800" y2="${y}" stroke="${TEAL}" stroke-opacity="0.08" stroke-width="2"/>`);
  }
  return out.join("");
}

/** The seven-day strip under the planner tab. */
function dayStrip(lang, x, y, days, todayIndex) {
  const cellW = 118;
  return days
    .map((d, i) => {
      const today = i === todayIndex;
      return `
  <g transform="translate(${x + i * (cellW + 10)},${y})">
    <rect x="0" y="0" width="${cellW}" height="76" rx="14" fill="${today ? TEAL : WHITE}" stroke="${today ? TEAL_DEEP : LINE}" stroke-width="3"/>
    <text x="${cellW / 2}" y="30" text-anchor="middle" font-family="${sans(lang)}" font-size="22" font-weight="700" fill="${today ? TEAL_SOFT : MUTED}">${esc(d.name)}</text>
    <text x="${cellW / 2}" y="64" text-anchor="middle" font-family="${figures(lang)}" font-size="30" font-weight="700" fill="${today ? WHITE : INK}">${esc(d.num)}</text>
  </g>`;
    })
    .join("");
}

/** One category row: name, badge, rail, spent / planned and remaining. */
function row(lang, x, y, w, item) {
  const over = item.ratio > 1;
  const fill = Math.min(1, item.ratio);
  const railW = w - 80;
  const nameSize = fitSize(item.name, w * 0.5, [36, 32, 29, 26]);
  const remSize = fitSize(item.remaining, w * 0.42, [36, 32, 29, 26]);
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="${w}" height="116" rx="20" fill="${over ? "#fff6f5" : WHITE}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="12" height="116" rx="6" fill="${item.color}"/>
    <text x="40" y="44" font-family="${sans(lang)}" font-size="${nameSize}" font-weight="700" fill="${INK}">${esc(item.name)}</text>
    <text x="${w - 32}" y="44" text-anchor="end" font-family="${sans(lang)}" font-size="${remSize}" font-weight="700" fill="${over ? CORAL : TEAL_DEEP}">${esc(item.remaining)}</text>
    <rect x="40" y="62" width="${railW}" height="18" rx="9" fill="${PAPER2}" stroke="${LINE}" stroke-width="2"/>
    <rect x="40" y="62" width="${Math.max(18, railW * fill)}" height="18" rx="9" fill="${over ? CORAL : item.color}"/>
    <text x="40" y="104" font-family="${figures(lang)}" font-size="25" font-weight="600" fill="${MUTED}">${esc(item.nums)}</text>
  </g>`;
}

/** The fail-fix promise line along the bottom, as pills. */
function promises(lang, items, x0, y) {
  let x = x0;
  const out = [];
  for (const label of items) {
    const size = 27;
    const w = textWidth(label, size) + 44;
    out.push(`<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="52" rx="26" fill="${WHITE}" stroke="${LINE2}" stroke-width="2.5"/>
      <text x="${w / 2}" y="36" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
    </g>`);
    x += w + 14;
  }
  return out.join("");
}

function svgFor(job) {
  const { lang, title, subtitle, weekLabel, range, days, todayIndex, rows, badge } = job;
  const titleSize = fitSize(title, 820, [88, 80, 72, 64, 56]);
  const subSize = fitSize(subtitle, 1560, [34, 31, 28, 26, 23, 20]);
  const pageY = 60 + titleSize + subSize + 46;
  const pageH = 945 - pageY - 56;
  const badgeSize = fitSize(badge, 380, [30, 27, 24, 22]);
  const badgeW = textWidth(badge, badgeSize) + 56;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e2f3ec"/>
      <stop offset="30%" stop-color="#f2faf7"/>
      <stop offset="100%" stop-color="#f2faf7"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${TEAL_DEEP}"/>
      <stop offset="100%" stop-color="${TEAL}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${INK}" flood-opacity="0.14"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="url(#paper)"/>
  ${ruled()}

  <!-- title block -->
  <g transform="translate(110,60)">
    <text x="0" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 18}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>
  <!-- sticky note: local only -->
  <g transform="translate(${1690 - badgeW},${70}) rotate(-3)">
    <rect x="0" y="0" width="${badgeW}" height="${badgeSize + 36}" rx="8" fill="${AMBER}"/>
    <text x="${badgeW / 2}" y="${badgeSize + 10}" text-anchor="middle" font-family="${sans(lang)}" font-size="${badgeSize}" font-weight="800" fill="${AMBER_INK}">${esc(badge)}</text>
  </g>

  <!-- the planner page -->
  <g transform="translate(110,${pageY})" filter="url(#shadow)">
    <rect x="0" y="0" width="1580" height="${pageH}" rx="30" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
  </g>
  <g transform="translate(110,${pageY})">
    <!-- teal tab with the week label and range -->
    <rect x="0" y="0" width="1580" height="80" rx="30" fill="url(#band)"/>
    <rect x="0" y="44" width="1580" height="36" fill="url(#band)"/>
    ${Array.from({ length: 22 }, (_, i) => `<circle cx="${60 + i * 68}" cy="11" r="5.5" fill="#ffffff" fill-opacity="0.55"/>`).join("")}
    <text x="40" y="56" font-family="${sans(lang)}" font-size="34" font-weight="800" fill="${WHITE}">${esc(weekLabel)}</text>
    <text x="1540" y="56" text-anchor="end" font-family="${figures(lang)}" font-size="30" font-weight="700" fill="${TEAL_SOFT}">${esc(range)}</text>

    ${dayStrip(lang, 40, 96, days, todayIndex)}

    ${rows.map((r, i) => row(lang, 40, 190 + i * 128, 1500, r)).join("")}
  </g>

  ${promises(lang, job.promises, 110, 945 - 40 - 52)}
</svg>`;
}

/** App icon: the teal planner page with a spiral top, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e2f3ec"/>
      <stop offset="100%" stop-color="#f2faf7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="64" y="84" width="384" height="360" rx="64" fill="${TEAL}"/>
    <path d="M64 148 a64 64 0 0 1 64 -64 h256 a64 64 0 0 1 64 64 v48 H64 z" fill="${TEAL_DEEP}"/>
    <rect x="96" y="212" width="320" height="200" rx="40" fill="#f2faf7"/>
    <circle cx="160" cy="76" r="24" fill="#f2faf7"/>
    <circle cx="352" cy="76" r="24" fill="#f2faf7"/>
    <rect x="136" y="258" width="104" height="30" rx="15" fill="${TEAL}"/>
    <rect x="136" y="322" width="240" height="30" rx="15" fill="#a7e6d7"/>
    <rect x="136" y="322" width="150" height="30" rx="15" fill="${TEAL}"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: PAPER })
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
  const nums = ["7", "8", "9", "10", "11", "12", "13"];
  const jobs = [
    {
      lang: "ko",
      title: "위크패드",
      subtitle: "무료 주간 지출 패드. 카테고리별 미니 예산, 지출 기록, 남은 금액. 매주 자동 리셋. 계정 없음.",
      weekLabel: "이번 주 · 37주차",
      range: "9월 7일 – 9월 13일",
      days: ["월", "화", "수", "목", "금", "토", "일"].map((name, i) => ({ name, num: nums[i] })),
      todayIndex: 2,
      badge: "데이터는 이 기기에만",
      rows: [
        { name: "식비", color: TEAL, ratio: 0.53, remaining: "₩37,500 남음", nums: "지출 ₩42,500 · 계획 ₩80,000" },
        { name: "커피", color: "#2f7fb8", ratio: 1.33, remaining: "₩5,000 초과", nums: "지출 ₩20,000 · 계획 ₩15,000" },
        { name: "교통", color: "#c4712b", ratio: 0.3, remaining: "₩21,000 남음", nums: "지출 ₩9,000 · 계획 ₩30,000" },
      ],
      promises: ["여는 광고 없음", "주간 결제 없음", "JSON 백업", "로그인 없음", "무료", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Weekpad",
      subtitle: "Free weekly spending pad. Mini-budgets per category, expense log, progress and remaining. Resets each week.",
      weekLabel: "This week · Week 37",
      range: "Sep 7 – Sep 13",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => ({ name, num: nums[i] })),
      todayIndex: 2,
      badge: "Data stays on this device",
      rows: [
        { name: "Groceries", color: TEAL, ratio: 0.53, remaining: "$37.25 left", nums: "Spent $42.75 · Planned $80.00" },
        { name: "Coffee", color: "#2f7fb8", ratio: 1.33, remaining: "Over by $5.00", nums: "Spent $20.00 · Planned $15.00" },
        { name: "Transit", color: "#c4712b", ratio: 0.3, remaining: "$21.00 left", nums: "Spent $9.00 · Planned $30.00" },
      ],
      promises: ["No opening ads", "No weekly IAP", "JSON backup", "No login", "Free", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ウィークパッド",
      subtitle: "無料の週間支出パッド。カテゴリごとのミニ予算、支出ログ、残り金額。毎週自動リセット。アカウント不要。",
      weekLabel: "今週 · 第37週",
      range: "9月7日 – 9月13日",
      days: ["月", "火", "水", "木", "金", "土", "日"].map((name, i) => ({ name, num: nums[i] })),
      todayIndex: 2,
      badge: "データはこの端末だけ",
      rows: [
        { name: "食費", color: TEAL, ratio: 0.53, remaining: "残り ¥3,750", nums: "支出 ¥4,250 · 予算 ¥8,000" },
        { name: "コーヒー", color: "#2f7fb8", ratio: 1.33, remaining: "¥500 超過", nums: "支出 ¥2,000 · 予算 ¥1,500" },
        { name: "交通", color: "#c4712b", ratio: 0.3, remaining: "残り ¥2,100", nums: "支出 ¥900 · 予算 ¥3,000" },
      ],
      promises: ["起動時の広告なし", "週額課金なし", "JSONバックアップ", "ログインなし", "無料", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "周预算板",
      subtitle: "免费周支出板。按类别设迷你预算、记开支、看进度和剩余。每周自动重置。无需账号。",
      weekLabel: "本周 · 第 37 周",
      range: "9月7日 – 9月13日",
      days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((name, i) => ({ name, num: nums[i] })),
      todayIndex: 2,
      badge: "数据仅在此设备",
      rows: [
        { name: "买菜", color: TEAL, ratio: 0.53, remaining: "剩余 ¥375", nums: "已花 ¥425 · 预算 ¥800" },
        { name: "咖啡", color: "#2f7fb8", ratio: 1.33, remaining: "超支 ¥50", nums: "已花 ¥200 · 预算 ¥150" },
        { name: "交通", color: "#c4712b", ratio: 0.3, remaining: "剩余 ¥210", nums: "已花 ¥90 · 预算 ¥300" },
      ],
      promises: ["无开屏广告", "无周付费", "JSON 备份", "无需登录", "免费", "ko/en/ja/zh"],
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

  // Maskable art is cropped to a circle on Android, so the page gets its own
  // padded render instead of reusing the edge-to-edge icon.
  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
