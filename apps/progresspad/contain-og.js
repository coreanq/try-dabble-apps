// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Progresspad card: a soft greenhouse bench.
 *
 * The product is a local long-task progress pad, so the picture is the
 * active-task bench: title, hours-target badge, the big logged total, a clay
 * progress bar, the potted plant at its current stage, a "Log focus" pill,
 * plus a percent-target task chip, a short focus history with dates and
 * minutes, and a promises card. Four real jobs (ko/en/ja/zh), each its own
 * SVG → PNG with real CJK glyphs from Noto Sans CJK; zh is never an alias of
 * en. No photos, no generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 238, g: 246, b: 240, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#14532d";
const MUTED = "#78716c";
const LINE = "#d6e5da";
const LINE2 = "#bcd3c3";
const PAPER2 = "#e2efe5";
const CARD = "#fafaf9";
const CLAY = "#b45309";
const CLAY_DEEP = "#92400e";
const CLAY_SOFT = "#fdebd8";
const LEAF = "#16a34a";
const LEAF_BRIGHT = "#4ade80";
const LEAF_SOFT = "#dcfce7";
const SKY = "#bae6fd";
const SKY_SOFT = "#e0f2fe";
const SKY_INK = "#0c4a6e";
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

/** Potted plant at the "leaves" stage (about 60%). */
function plant(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <path d="M28 66h40l-4 22H32z" fill="${CLAY}"/>
    <rect x="24" y="60" width="48" height="8" rx="4" fill="#d97706"/>
    <ellipse cx="48" cy="60" rx="24" ry="4" fill="#c2410c"/>
    <ellipse cx="48" cy="61" rx="19" ry="2.6" fill="#78350f"/>
    <path d="M48 60V26" stroke="${LEAF}" stroke-width="3" stroke-linecap="round"/>
    <path d="M48 50c-8 0-12-5-12-11 7 0 12 4 12 11z" fill="${LEAF_BRIGHT}" stroke="${LEAF}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M48 46c8-1 12-6 12-12-7 0-12 5-12 12z" fill="${LEAF_BRIGHT}" stroke="${LEAF}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M48 36c-9 0-14-5-14-12 8 0 14 5 14 12z" fill="${LEAF_BRIGHT}" stroke="${LEAF}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M48 32c9-1 14-6 14-13-8 0-14 5-14 13z" fill="${LEAF_BRIGHT}" stroke="${LEAF}" stroke-width="1.5" stroke-linejoin="round"/>
  </g>`;
}

/** The bench: title, hours badge, big total, bar, plant, log pill. */
function bench(job) {
  const badgeW = Math.ceil(textWidth(job.badgeHours, 15) + 24);
  const pillW = Math.ceil(textWidth(job.logFocus, 18) + 44);
  return `
  <g transform="translate(60,192)">
    <rect width="500" height="300" rx="22" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
    <rect x="1" y="1" width="498" height="120" rx="21" fill="${LEAF_SOFT}" opacity="0.55"/>
    <text x="26" y="44" font-size="24" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.task)}</text>
    <rect x="${500 - 26 - badgeW}" y="24" width="${badgeW}" height="28" rx="14" fill="${CLAY_SOFT}" stroke="#f6d3b1"/>
    <text x="${500 - 26 - badgeW / 2}" y="43" text-anchor="middle" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${CLAY_DEEP}">${esc(job.badgeHours)}</text>
    <text x="26" y="78" font-size="13" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.loggedLabel)}</text>
    <text x="26" y="138" font-size="58" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${CLAY_DEEP}" letter-spacing="-2">${esc(job.total)}</text>
    <text x="${26 + textWidth(job.total, 58) * 0.98 + 12}" y="138" font-size="20" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.ofTarget)}</text>
    ${plant(366, 48, 1.25)}
    <text x="426" y="182" text-anchor="middle" font-size="13" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.stageName)}</text>
    <rect x="26" y="196" width="448" height="20" rx="10" fill="${PAPER2}" stroke="${LINE}"/>
    <rect x="26" y="196" width="273" height="20" rx="10" fill="${CLAY}"/>
    <text x="26" y="240" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">61%</text>
    <text x="474" y="240" text-anchor="end" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.remaining)}</text>
    <rect x="26" y="254" width="${pillW}" height="36" rx="18" fill="${CLAY}"/>
    <text x="${26 + pillW / 2}" y="278" text-anchor="middle" font-size="18" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="#fff">${esc(job.logFocus)}</text>
    <text x="${26 + pillW + 14}" y="277" font-size="13" font-weight="700" font-family="${sans(job.lang)}" fill="${LEAF}">${esc(job.neverDies)}</text>
  </g>`;
}

/** Second task chip (percent target) + short history. */
function history(job) {
  const rows = job.rows
    .map(
      (r, i) =>
        `<rect x="18" y="${58 + i * 34}" width="264" height="28" rx="9" fill="${PAPER2}" stroke="${LINE}"/>` +
        `<text x="30" y="${77 + i * 34}" font-size="13" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(r[0])}</text>` +
        `<text x="270" y="${77 + i * 34}" text-anchor="end" font-size="13" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${CLAY_DEEP}">${esc(r[1])}</text>`,
    )
    .join("");
  return `
  <g transform="translate(590,192)">
    <rect width="300" height="300" rx="22" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
    <text x="18" y="34" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.historyLabel)}</text>
    ${rows}
    <rect x="18" y="204" width="264" height="78" rx="14" fill="${SKY_SOFT}" stroke="${SKY}"/>
    <text x="32" y="230" font-size="14" font-weight="800" font-family="${sans(job.lang)}" fill="${SKY_INK}">${esc(job.task2)}</text>
    <text x="32" y="252" font-size="12" font-weight="700" font-family="${sans(job.lang)}" fill="${SKY_INK}">${esc(job.badgePercent)}</text>
    <rect x="32" y="262" width="236" height="10" rx="5" fill="#fff" stroke="${SKY}"/>
    <rect x="32" y="262" width="80" height="10" rx="5" fill="${SKY_INK}" opacity="0.7"/>
  </g>`;
}

/** Promises card on the right edge. */
function sideNote(job) {
  return `
  <g transform="translate(920,192)">
    <rect width="220" height="300" rx="22" fill="${LEAF_SOFT}" stroke="#bbf7d0" stroke-width="2"/>
    <rect x="0" y="0" width="220" height="8" rx="4" fill="${LEAF}"/>
    <text x="18" y="42" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.noteTitle)}</text>
    ${job.noteLines.map((l, i) => `<text x="18" y="${74 + i * 28}" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${INK}">${esc(l)}</text>`).join("")}
    <rect x="18" y="228" width="184" height="52" rx="12" fill="${CARD}" stroke="${LINE}"/>
    <text x="30" y="249" font-size="12" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.backupLabel)}</text>
    <text x="30" y="269" font-size="11" font-weight="700" font-family="DejaVu Sans Mono, monospace" fill="${INK}">{ "app": "progresspad", "version": 1 }</text>
  </g>`;
}

function svgFor(job) {
  const titleSize = fitSize(job.title, 620, [56, 50, 44, 40]);
  const sub = truncate(job.subtitle, 24, 1060);
  const badge = job.badge;
  const chips = job.chips.reduce(
    (acc, c) => {
      const w = Math.ceil(textWidth(c, 16) + 26);
      const x = acc.x;
      acc.out.push(
        `<rect x="${x}" y="510" width="${w}" height="34" rx="17" fill="${LEAF_SOFT}"/>` +
          `<text x="${x + 13}" y="533" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(c)}</text>`,
      );
      acc.x += w + 10;
      return acc;
    },
    { x: 60, out: [] },
  ).out;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${LEAF_BRIGHT}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${SKY}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#eef6f0"/>
  <circle cx="1080" cy="-60" r="300" fill="url(#wash)" opacity="0.8"/>
  <circle cx="-60" cy="700" r="240" fill="${CLAY_SOFT}" opacity="0.9"/>
  <rect x="36" y="28" width="1128" height="574" rx="30" fill="${CARD}" stroke="${LINE}" stroke-width="2" opacity="0.72"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${LEAF}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${NOTICE}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${NOTICE_INK}">${esc(badge)}</text>

  <text x="70" y="138" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(job.title)}</text>
  <text x="70" y="172" font-size="22" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${bench(job)}
  ${history(job)}
  ${sideNote(job)}
  ${chips.join("")}

  <text x="60" y="578" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.footer)}</text>
  <text x="1136" y="578" text-anchor="end" font-size="16" font-weight="700" font-family="DejaVu Sans, sans-serif" fill="${CLAY_DEEP}">progresspad.try-dabble.com</text>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  const u = inner / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#eef6f0"/>
  <g transform="translate(${pad},${pad}) scale(${u})">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="${CARD}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M20 46c0-9 4-15 12-18" fill="none" stroke="${LEAF}" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 28c-6-1-10-6-10-12 6 0 10 4 10 12z" fill="${LEAF_BRIGHT}" stroke="${LEAF}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M32 34c6-1 11-5 12-11-6-1-11 3-12 11z" fill="${LEAF_BRIGHT}" stroke="${LEAF}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="14" y="46" width="36" height="7" rx="3.5" fill="#e7e5e4"/>
    <rect x="14" y="46" width="24" height="7" rx="3.5" fill="${CLAY}"/>
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
      title: "프로그레스패드",
      subtitle: "무료 로컬 장기 과제 진행 기록. 시간 또는 % 목표, 날짜별 집중 분 기록, 진행 막대.",
      badge: "데이터는 이 기기에만",
      task: "논문 3장",
      badgeHours: "목표 40시간",
      loggedLabel: "기록한 집중",
      total: "24시간 20분",
      ofTarget: "/ 40시간",
      stageName: "잎",
      remaining: "15시간 40분 남음",
      logFocus: "집중 기록",
      neverDies: "함께 자랍니다 — 절대 시들지 않아요",
      historyLabel: "집중 기록",
      rows: [["9월 15일 (화) · 2장 초안", "90분"], ["9월 14일 (월)", "45분"], ["9월 12일 (토) · 자료 정리", "120분"], ["9월 10일 (목)", "60분"]],
      task2: "자격증 공부",
      badgePercent: "목표 100% · 30분 = 1%",
      noteTitle: "약속",
      noteLines: ["강제 타이머 없음", "시드는 나무 없음", "집중 중 광고 없음", "Plus 유도 없음", "로그인 없음"],
      backupLabel: "JSON 백업",
      chips: ["강제 타이머 없음", "시드는 나무 없음", "로그인 없음", "JSON 백업", "영원히 무료"],
      footer: "집중은 어디서든, 기록은 나중에 여기서 · ko/en/ja/zh",
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Progresspad",
      subtitle: "Free local long-task progress pad. Hours or percent target, focus minutes logged by date, a bar that fills.",
      badge: "Data stays on this device",
      task: "Thesis chapter 3",
      badgeHours: "40h target",
      loggedLabel: "Focus logged",
      total: "24h 20m",
      ofTarget: "/ 40h",
      stageName: "Leaves",
      remaining: "15h 40m to go",
      logFocus: "Log focus",
      neverDies: "Grows with you — never dies",
      historyLabel: "Focus history",
      rows: [["Tue, Sep 15 · chapter 2 draft", "90 min"], ["Mon, Sep 14", "45 min"], ["Sat, Sep 12 · reading", "120 min"], ["Thu, Sep 10", "60 min"]],
      task2: "Exam prep",
      badgePercent: "100% target · 30 min = 1%",
      noteTitle: "Promises",
      noteLines: ["No forced timer", "No dying tree", "No ads mid-focus", "No Plus upsell", "No login"],
      backupLabel: "JSON backup",
      chips: ["No forced timer", "No dying tree", "No login", "JSON backup", "Free forever"],
      footer: "Focus anywhere, log it here afterwards · ko/en/ja/zh",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "プログレスパッド",
      subtitle: "無料のローカル長期タスク進捗パッド。時間または％の目標、日付ごとの集中分を記録、進捗バー。",
      badge: "データはこの端末だけ",
      task: "論文3章",
      badgeHours: "目標 40時間",
      loggedLabel: "記録した集中",
      total: "24時間20分",
      ofTarget: "/ 40時間",
      stageName: "葉",
      remaining: "残り 15時間40分",
      logFocus: "集中を記録",
      neverDies: "一緒に育つ — 決して枯れない",
      historyLabel: "集中の履歴",
      rows: [["9月15日(火) · 2章の下書き", "90分"], ["9月14日(月)", "45分"], ["9月12日(土) · 資料読み", "120分"], ["9月10日(木)", "60分"]],
      task2: "資格試験の勉強",
      badgePercent: "目標 100% · 30分＝1%",
      noteTitle: "約束",
      noteLines: ["強制タイマーなし", "枯れる木なし", "集中中の広告なし", "Plus への誘導なし", "ログイン不要"],
      backupLabel: "JSONバックアップ",
      chips: ["強制タイマーなし", "枯れる木なし", "ログイン不要", "JSONバックアップ", "ずっと無料"],
      footer: "集中はどこでも、記録は後からここで · ko/en/ja/zh",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "进度板",
      subtitle: "免费本地长期任务进度板。按小时或百分比设目标，按日期记录专注分钟，进度条填充。",
      badge: "数据仅在此设备",
      task: "论文第三章",
      badgeHours: "目标 40 小时",
      loggedLabel: "已记录专注",
      total: "24小时20分",
      ofTarget: "/ 40 小时",
      stageName: "叶子",
      remaining: "还差 15小时40分",
      logFocus: "记录专注",
      neverDies: "与你一起生长 — 永不枯死",
      historyLabel: "专注历史",
      rows: [["9月15日 周二 · 第二章草稿", "90 分钟"], ["9月14日 周一", "45 分钟"], ["9月12日 周六 · 阅读资料", "120 分钟"], ["9月10日 周四", "60 分钟"]],
      task2: "备考",
      badgePercent: "目标 100% · 30 分钟 = 1%",
      noteTitle: "承诺",
      noteLines: ["无强制计时器", "无枯死树", "专注中无广告", "无 Plus 推销", "无需登录"],
      backupLabel: "JSON 备份",
      chips: ["无强制计时器", "无枯死树", "无需登录", "JSON 备份", "永久免费"],
      footer: "在哪专注都行，之后来这里记一笔 · ko/en/ja/zh",
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
