// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Timerpad card: a studio clock on cool linen.
 *
 * The product is countdown + Pomodoro + HIIT + stopwatch, so the picture is
 * a cobalt clock face, vermilion/teal interval bars, a Pomodoro strip and
 * lap stamps. Four real jobs (ko/en/ja/zh), each its own SVG → PNG; zh is
 * never an alias of en. No photos, no generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 238, g: 243, b: 248, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#1a2332";
const MUTED = "#5b6b7c";
const LINE = "#d5deea";
const COBALT = "#2f6fed";
const COBALT_DEEP = "#1d4ed8";
const COBALT_SOFT = "#dbe7ff";
const WORK = "#e05a33";
const WORK_SOFT = "#ffe1d6";
const REST = "#1a9b7e";
const REST_SOFT = "#d5f4ec";
const AMBER = "#f5c65b";
const AMBER_INK = "#3b2a05";
const WHITE = "#ffffff";
const PAPER2 = "#e1e9f3";

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

function clockFace() {
  return `
  <g transform="translate(86,168)">
    <circle cx="150" cy="150" r="148" fill="${COBALT}"/>
    <circle cx="150" cy="150" r="128" fill="${WHITE}"/>
    <circle cx="150" cy="150" r="118" fill="${PAPER2}"/>
    <circle cx="150" cy="150" r="6" fill="${INK}"/>
    <rect x="146.5" y="48" width="7" height="92" rx="3.5" fill="${INK}"/>
    <g transform="translate(150,150) rotate(72)">
      <rect x="-3.5" y="-8" width="78" height="10" rx="5" fill="${WORK}"/>
    </g>
    <text x="150" y="214" text-anchor="middle" font-size="28" font-weight="800" font-family="${figures("en")}" fill="${INK}">24:17</text>
  </g>`;
}

function svgFor(job) {
  const titleSize = fitSize(job.title, 620, [64, 56, 48, 42]);
  const sub = truncate(job.subtitle, 26, 640);
  const badge = job.badge;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COBALT_SOFT}"/>
      <stop offset="1" stop-color="${WORK_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#eef3f8"/>
  <circle cx="1040" cy="-40" r="280" fill="url(#wash)" opacity="0.7"/>
  <circle cx="-40" cy="680" r="220" fill="${REST_SOFT}" opacity="0.8"/>
  <rect x="36" y="28" width="1128" height="574" rx="28" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${COBALT}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${AMBER}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(badge)}</text>

  <text x="70" y="140" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(job.title)}</text>
  <text x="70" y="182" font-size="24" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${clockFace()}

  <g transform="translate(430,210)">
    <rect width="700" height="150" rx="18" fill="${PAPER2}"/>
    <text x="22" y="36" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.intervalLabel)}</text>
    ${job.bars.map((b, i) => {
      const x = 22 + i * 108;
      return `<g transform="translate(${x},54)">
        <rect width="96" height="72" rx="12" fill="${b.work ? WORK_SOFT : REST_SOFT}"/>
        <rect width="96" height="10" rx="5" fill="${b.work ? WORK : REST}"/>
        <text x="48" y="42" text-anchor="middle" font-size="22" font-weight="800" font-family="${figures(job.lang)}" fill="${INK}">${esc(b.time)}</text>
        <text x="48" y="62" text-anchor="middle" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(b.label)}</text>
      </g>`;
    }).join("")}
  </g>

  <g transform="translate(430,380)">
    <rect width="340" height="176" rx="18" fill="${WHITE}" stroke="${LINE}"/>
    <text x="20" y="36" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.pomoLabel)}</text>
    <text x="20" y="92" font-size="40" font-weight="800" font-family="${figures(job.lang)}" fill="${INK}">${esc(job.pomoValue)}</text>
    <text x="20" y="128" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${COBALT_DEEP}">${esc(job.pomoSub)}</text>
    <rect x="20" y="146" width="300" height="10" rx="5" fill="${COBALT_SOFT}"/>
    <rect x="20" y="146" width="168" height="10" rx="5" fill="${COBALT}"/>
  </g>

  <g transform="translate(790,380)">
    <rect width="340" height="176" rx="18" fill="${WHITE}" stroke="${LINE}"/>
    <text x="20" y="36" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.lapLabel)}</text>
    ${job.laps.map((lap, i) => `
      <text x="20" y="${72 + i * 32}" font-size="20" font-weight="700" font-family="${sans(job.lang)}" fill="${INK}">${esc(lap.name)}</text>
      <text x="310" y="${72 + i * 32}" text-anchor="end" font-size="20" font-weight="800" font-family="${figures(job.lang)}" fill="${WORK}">${esc(lap.time)}</text>
    `).join("")}
  </g>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#eef3f8"/>
  <g transform="translate(${pad},${pad})">
    <circle cx="${inner / 2}" cy="${inner / 2}" r="${inner / 2}" fill="${COBALT}"/>
    <circle cx="${inner / 2}" cy="${inner / 2}" r="${inner * 0.38}" fill="#eef3f8"/>
    <circle cx="${inner / 2}" cy="${inner / 2}" r="${inner * 0.04}" fill="${INK}"/>
    <rect x="${inner / 2 - inner * 0.025}" y="${inner * 0.18}" width="${inner * 0.05}" height="${inner * 0.28}" rx="${inner * 0.02}" fill="${INK}"/>
    <g transform="translate(${inner / 2},${inner / 2}) rotate(70)">
      <rect x="0" y="${-inner * 0.03}" width="${inner * 0.28}" height="${inner * 0.06}" rx="${inner * 0.03}" fill="${WORK}"/>
    </g>
  </g>
</svg>`;
}

async function contain(buf, dest) {
  await sharp(buf)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .flatten({ background: PAPER })
    .png()
    .toFile(dest);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  const jobs = [
    {
      lang: "ko",
      title: "타이머패드",
      subtitle: "무료 로컬 HIIT·포모도로·스톱워치. 편집 가능한 프리셋, 랩, 루틴 저장.",
      badge: "데이터는 이 기기에만",
      intervalLabel: "HIIT · 편집 가능",
      bars: [
        { work: true, time: "0:40", label: "운동" },
        { work: false, time: "0:20", label: "휴식" },
        { work: true, time: "0:40", label: "운동" },
        { work: false, time: "0:20", label: "휴식" },
        { work: true, time: "0:40", label: "운동" },
        { work: false, time: "0:20", label: "휴식" },
      ],
      pomoLabel: "포모도로",
      pomoValue: "24:17",
      pomoSub: "라운드 2 / 4 · 모두 편집",
      lapLabel: "스톱워치 랩",
      laps: [
        { name: "랩 1", time: "1:12.40" },
        { name: "랩 2", time: "2:28.05" },
        { name: "랩 3", time: "3:41.88" },
      ],
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Timerpad",
      subtitle: "Free local HIIT, Pomodoro and stopwatch. Editable presets, laps, saved routines.",
      badge: "Data stays on this device",
      intervalLabel: "HIIT · fully editable",
      bars: [
        { work: true, time: "0:40", label: "Work" },
        { work: false, time: "0:20", label: "Rest" },
        { work: true, time: "0:40", label: "Work" },
        { work: false, time: "0:20", label: "Rest" },
        { work: true, time: "0:40", label: "Work" },
        { work: false, time: "0:20", label: "Rest" },
      ],
      pomoLabel: "Pomodoro",
      pomoValue: "24:17",
      pomoSub: "Round 2 / 4 · all editable",
      lapLabel: "Stopwatch laps",
      laps: [
        { name: "Lap 1", time: "1:12.40" },
        { name: "Lap 2", time: "2:28.05" },
        { name: "Lap 3", time: "3:41.88" },
      ],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "タイマーパッド",
      subtitle: "無料のローカルHIIT・ポモドーロ・ストップウォッチ。編集できるプリセット。",
      badge: "データはこの端末だけ",
      intervalLabel: "HIIT · 編集できる",
      bars: [
        { work: true, time: "0:40", label: "運動" },
        { work: false, time: "0:20", label: "休憩" },
        { work: true, time: "0:40", label: "運動" },
        { work: false, time: "0:20", label: "休憩" },
        { work: true, time: "0:40", label: "運動" },
        { work: false, time: "0:20", label: "休憩" },
      ],
      pomoLabel: "ポモドーロ",
      pomoValue: "24:17",
      pomoSub: "ラウンド 2 / 4 · すべて編集可",
      lapLabel: "ストップウォッチのラップ",
      laps: [
        { name: "ラップ 1", time: "1:12.40" },
        { name: "ラップ 2", time: "2:28.05" },
        { name: "ラップ 3", time: "3:41.88" },
      ],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "计时板",
      subtitle: "免费本地 HIIT、番茄钟与秒表。可编辑预设、计圈、保存套路。",
      badge: "数据仅在此设备",
      intervalLabel: "HIIT · 全部可改",
      bars: [
        { work: true, time: "0:40", label: "运动" },
        { work: false, time: "0:20", label: "休息" },
        { work: true, time: "0:40", label: "运动" },
        { work: false, time: "0:20", label: "休息" },
        { work: true, time: "0:40", label: "运动" },
        { work: false, time: "0:20", label: "休息" },
      ],
      pomoLabel: "番茄钟",
      pomoValue: "24:17",
      pomoSub: "第 2 / 4 轮 · 全部可改",
      lapLabel: "秒表计圈",
      laps: [
        { name: "第 1 圈", time: "1:12.40" },
        { name: "第 2 圈", time: "2:28.05" },
        { name: "第 3 圈", time: "3:41.88" },
      ],
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

  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons + og written");
}

main().catch((e) => { console.error(e); process.exit(1); });
