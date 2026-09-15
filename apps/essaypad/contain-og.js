// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Essaypad card: a manuscript sheet on a warm parchment desk.
 *
 * The product is a local word-progress tracker, so the picture is a ruled
 * manuscript page with the essay title, a big current/target figure, a
 * terracotta progress bar, a "daily target" panel with the weekdays-only
 * toggle, an amber deadline chip and a mini calendar with the words added
 * per day. Four real jobs (ko/en/ja/zh), each its own SVG → PNG with real
 * CJK glyphs from Noto Sans CJK; zh is never an alias of en. No photos, no
 * generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 247, g: 241, b: 232, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const serif = (lang) => `DejaVu Serif, Noto Serif CJK ${CJK[lang]}, Noto Sans CJK ${CJK[lang]}, serif`;

const INK = "#1c1917";
const MUTED = "#57534e";
const LINE = "#e4d9c8";
const LINE2 = "#d3c5ae";
const PAPER2 = "#efe6d8";
const CARD = "#fffcf7";
const TERRA = "#c2410c";
const TERRA_DEEP = "#9a3412";
const TERRA_SOFT = "#fde8dc";
const SAGE = "#15803d";
const SAGE_SOFT = "#dcfce7";
const AMBER = "#d97706";
const AMBER_SOFT = "#fef3c7";
const AMBER_INK = "#78350f";
const NOTICE = "#f6d78a";
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

/** The manuscript sheet: ruled lines, red margin, title, big figure, bar, update pill. */
function sheet(job) {
  const rules = [];
  for (let y = 70; y < 290; y += 28) rules.push(`<line x1="16" y1="${y}" x2="464" y2="${y}" stroke="${INK}" stroke-opacity="0.07" stroke-width="1"/>`);
  const pillW = Math.ceil(textWidth(job.update, 18) + 40);
  return `
  <g transform="translate(60,192)">
    <rect width="480" height="300" rx="18" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
    ${rules.join("")}
    <line x1="56" y1="0" x2="56" y2="300" stroke="${TERRA}" stroke-opacity="0.45" stroke-width="1.5"/>
    <circle cx="30" cy="40" r="5" fill="${PAPER2}" stroke="${LINE2}"/>
    <circle cx="30" cy="80" r="5" fill="${PAPER2}" stroke="${LINE2}"/>
    <circle cx="30" cy="120" r="5" fill="${PAPER2}" stroke="${LINE2}"/>
    <text x="72" y="46" font-size="24" font-weight="700" font-family="${serif(job.lang)}" fill="${INK}">${esc(job.essay)}</text>
    <text x="72" y="74" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.targetLine)}</text>
    <rect x="${72 + textWidth(job.targetLine, 15) + 14}" y="58" width="${Math.ceil(textWidth(job.deadline, 14) + 22)}" height="24" rx="12" fill="${AMBER_SOFT}"/>
    <text x="${72 + textWidth(job.targetLine, 15) + 25}" y="75" font-size="14" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(job.deadline)}</text>
    <text x="72" y="152" font-size="70" font-weight="700" font-family="${serif(job.lang)}" fill="${TERRA_DEEP}" letter-spacing="-2">1,240</text>
    <text x="${72 + 210}" y="152" font-size="22" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.ofTarget)}</text>
    <rect x="72" y="176" width="384" height="18" rx="9" fill="${PAPER2}" stroke="${LINE}"/>
    <rect x="72" y="176" width="159" height="18" rx="9" fill="${TERRA}"/>
    <text x="72" y="220" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">41%</text>
    <text x="456" y="220" text-anchor="end" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.remaining)}</text>
    <rect x="72" y="240" width="${pillW}" height="42" rx="21" fill="${TERRA}"/>
    <text x="${72 + pillW / 2}" y="267" text-anchor="middle" font-size="18" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="#fff">${esc(job.update)}</text>
    <text x="${72 + pillW + 16}" y="266" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.writeElsewhere)}</text>
  </g>`;
}

/** Daily-target panel with the weekdays toggle. */
function pace(job) {
  const w1 = Math.ceil(textWidth(job.allDays, 12) + 18);
  const w2 = Math.ceil(textWidth(job.weekdays, 12) + 18);
  return `
  <g transform="translate(570,192)">
    <rect width="300" height="144" rx="18" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
    <text x="22" y="36" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.paceLabel)}</text>
    <text x="22" y="96" font-size="54" font-weight="700" font-family="${serif(job.lang)}" fill="${INK}" letter-spacing="-2">352</text>
    <text x="${22 + 118}" y="96" font-size="16" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.perDay)}</text>
    <text x="22" y="126" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(job.daysLeft)}</text>
    <rect x="${300 - 22 - w1 - w2 - 2}" y="18" width="${w1 + w2 + 2}" height="28" rx="14" fill="${PAPER2}" stroke="${LINE2}"/>
    <text x="${300 - 22 - w2 - 1 - w1 / 2}" y="37" text-anchor="middle" font-size="12" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.allDays)}</text>
    <rect x="${300 - 22 - w2}" y="19" width="${w2}" height="26" rx="13" fill="${INK}"/>
    <text x="${300 - 22 - w2 / 2}" y="37" text-anchor="middle" font-size="12" font-weight="800" font-family="${sans(job.lang)}" fill="${PAPER2}">${esc(job.weekdays)}</text>
  </g>`;
}

/** Mini calendar: two weeks, deltas on written days, a weekend dimmed, an amber deadline. */
function calendar(job) {
  const days = [
    { n: 7, d: "+300" }, { n: 8, d: "+420" }, { n: 9 }, { n: 10, d: "+280" }, { n: 11, d: "+240" }, { n: 12, wk: true }, { n: 13, wk: true },
    { n: 14 }, { n: 15, today: true }, { n: 16 }, { n: 17 }, { n: 18 }, { n: 19, wk: true }, { n: 20, wk: true, dl: true },
  ];
  const cells = days
    .map((c, i) => {
      const x = 22 + (i % 7) * 37;
      const y = 62 + Math.floor(i / 7) * 42;
      const fill = c.d ? TERRA_SOFT : c.wk ? PAPER2 : CARD;
      const stroke = c.today ? INK : c.dl ? AMBER : LINE;
      return (
        `<rect x="${x}" y="${y}" width="33" height="36" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="${c.today || c.dl ? 2 : 1}" opacity="${c.wk && !c.dl ? 0.7 : 1}"/>` +
        `<text x="${x + 5}" y="${y + 14}" font-size="11" font-weight="800" font-family="${sans(job.lang)}" fill="${c.d ? TERRA_DEEP : MUTED}">${c.n}</text>` +
        (c.d ? `<text x="${x + 4}" y="${y + 30}" font-size="10" font-weight="800" font-family="${sans(job.lang)}" fill="${TERRA_DEEP}">${c.d}</text>` : "")
      );
    })
    .join("");
  const dows = job.dows.map((d, i) => `<text x="${22 + i * 37 + 16}" y="52" text-anchor="middle" font-size="11" font-weight="800" font-family="${sans(job.lang)}" fill="${i >= 5 ? TERRA_DEEP : MUTED}">${esc(d)}</text>`).join("");
  return `
  <g transform="translate(570,352)">
    <rect width="300" height="140" rx="18" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
    <text x="22" y="30" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.historyLabel)}</text>
    ${dows}
    ${cells}
  </g>`;
}

/** Sage "target reached / over 110%" note card on the right edge. */
function sideNote(job) {
  return `
  <g transform="translate(900,192)">
    <rect width="240" height="300" rx="18" fill="${SAGE_SOFT}" stroke="#bbf7d0" stroke-width="2"/>
    <rect x="0" y="0" width="240" height="8" rx="4" fill="${SAGE}"/>
    <text x="20" y="44" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="#166534">${esc(job.noteTitle)}</text>
    ${job.noteLines.map((l, i) => `<text x="20" y="${78 + i * 30}" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="#14532d">${esc(l)}</text>`).join("")}
    <rect x="20" y="228" width="200" height="50" rx="12" fill="${CARD}" stroke="${LINE}"/>
    <text x="32" y="249" font-size="12" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.backupLabel)}</text>
    <text x="32" y="268" font-size="12" font-weight="700" font-family="DejaVu Sans Mono, monospace" fill="${INK}">{ "app": "essaypad", "version": 1 }</text>
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
        `<rect x="${x}" y="510" width="${w}" height="34" rx="17" fill="${TERRA_SOFT}"/>` +
          `<text x="${x + 13}" y="533" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${TERRA_DEEP}">${esc(c)}</text>`,
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
      <stop offset="0" stop-color="${TERRA_SOFT}"/>
      <stop offset="1" stop-color="${SAGE_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#f7f1e8"/>
  <circle cx="1080" cy="-60" r="300" fill="url(#wash)" opacity="0.8"/>
  <circle cx="-60" cy="700" r="240" fill="${AMBER_SOFT}" opacity="0.9"/>
  <rect x="36" y="28" width="1128" height="574" rx="28" fill="${CARD}" stroke="${LINE}" stroke-width="2" opacity="0.72"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${TERRA}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${NOTICE}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${NOTICE_INK}">${esc(badge)}</text>

  <text x="70" y="138" font-size="${titleSize}" font-weight="700" font-family="${serif(job.lang)}" fill="${INK}">${esc(job.title)}</text>
  <text x="70" y="172" font-size="22" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${sheet(job)}
  ${pace(job)}
  ${calendar(job)}
  ${sideNote(job)}
  ${chips.join("")}

  <text x="60" y="578" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.footer)}</text>
  <text x="1136" y="578" text-anchor="end" font-size="16" font-weight="700" font-family="DejaVu Sans, sans-serif" fill="${TERRA_DEEP}">essaypad.try-dabble.com</text>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  const u = inner / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#f7f1e8"/>
  <g transform="translate(${pad},${pad}) scale(${u})">
    <path d="M12 8h30l10 10v38a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="${CARD}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M42 8v10h10" fill="${PAPER2}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="16" y="24" width="24" height="3" rx="1.5" fill="${INK}" opacity="0.75"/>
    <rect x="16" y="32" width="30" height="3" rx="1.5" fill="${INK}" opacity="0.45"/>
    <rect x="16" y="40" width="18" height="3" rx="1.5" fill="${INK}" opacity="0.3"/>
    <rect x="16" y="49" width="30" height="6" rx="3" fill="${PAPER2}"/>
    <rect x="16" y="49" width="18" height="6" rx="3" fill="${TERRA}"/>
    <circle cx="50" cy="50" r="7.5" fill="${SAGE}"/>
    <path d="M46.3 50.2l2.6 2.6 4.8-5.2" fill="none" stroke="#f7f1e8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
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
      title: "에세이패드",
      subtitle: "무료 로컬 에세이·프로젝트 단어 진행 기록. 목표, 선택 마감일, 직접 입력, 하루 목표.",
      badge: "데이터는 이 기기에만",
      essay: "장학금 에세이",
      targetLine: "목표 3,000",
      deadline: "마감 9월 20일",
      ofTarget: "/ 목표 3,000",
      remaining: "1,760 단어 남음",
      update: "단어 수 업데이트",
      writeElsewhere: "글은 다른 곳에서",
      paceLabel: "하루 목표",
      perDay: "단어 / 일",
      daysLeft: "집필일 5일 남음 · 마감까지 5일",
      allDays: "모든 날",
      weekdays: "평일만",
      historyLabel: "날짜별 기록",
      dows: ["월", "화", "수", "목", "금", "토", "일"],
      noteTitle: "약속",
      noteLines: ["로그인·구독 없음", "도구에 광고 없음", "안드로이드·웹에서 작동", "110% 넘으면 경고", "지난 날짜 기록"],
      backupLabel: "JSON 백업",
      chips: ["로그인 없음", "구독 없음", "주말 제외 페이스", "JSON 백업", "영원히 무료"],
      footer: "쓰는 곳은 따로, 세는 곳은 여기 · ko/en/ja/zh",
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Essaypad",
      subtitle: "Free local essay & project word-progress tracker. Target, optional deadline, manual totals, daily pace.",
      badge: "Data stays on this device",
      essay: "Scholarship essay",
      targetLine: "Target 3,000",
      deadline: "Due Sep 20",
      ofTarget: "/ target 3,000",
      remaining: "1,760 words to go",
      update: "Update words",
      writeElsewhere: "write elsewhere",
      paceLabel: "Daily target",
      perDay: "words / day",
      daysLeft: "5 write days left · 5 days to deadline",
      allDays: "All days",
      weekdays: "Weekdays",
      historyLabel: "Per-day history",
      dows: ["M", "T", "W", "T", "F", "S", "S"],
      noteTitle: "Promises",
      noteLines: ["No login, no subscription", "No ads on the tool", "Works on Android & web", "Warns past 110%", "Back-date any day"],
      backupLabel: "JSON backup",
      chips: ["No login", "No subscription", "Weekend-aware pace", "JSON backup", "Free forever"],
      footer: "Write elsewhere, count here · ko/en/ja/zh",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "エッセイパッド",
      subtitle: "無料のローカル エッセイ・プロジェクト語数進捗トラッカー。目標、任意の締切、手入力、一日のペース。",
      badge: "データはこの端末だけ",
      essay: "奨学金エッセイ",
      targetLine: "目標 3,000",
      deadline: "締切 9月20日",
      ofTarget: "/ 目標 3,000",
      remaining: "残り 1,760 語",
      update: "語数を更新",
      writeElsewhere: "文章は別の場所で",
      paceLabel: "一日の目標",
      perDay: "語 / 日",
      daysLeft: "執筆日 残り5日 · 締切まで5日",
      allDays: "すべての日",
      weekdays: "平日のみ",
      historyLabel: "日ごとの履歴",
      dows: ["月", "火", "水", "木", "金", "土", "日"],
      noteTitle: "約束",
      noteLines: ["ログイン・サブスクなし", "ツールに広告なし", "Android・ウェブで動く", "110%超で警告", "過去日付の記録"],
      backupLabel: "JSONバックアップ",
      chips: ["ログイン不要", "サブスクなし", "週末を除くペース", "JSONバックアップ", "ずっと無料"],
      footer: "書く場所は別、数える場所はここ · ko/en/ja/zh",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "作文进度板",
      subtitle: "免费本地作文/项目字数进度记录。目标、可选截止日、手动更新、每日配额。",
      badge: "数据仅在此设备",
      essay: "奖学金作文",
      targetLine: "目标 3,000",
      deadline: "截止 9月20日",
      ofTarget: "/ 目标 3,000",
      remaining: "还差 1,760 字",
      update: "更新字数",
      writeElsewhere: "文章在别处写",
      paceLabel: "每日目标",
      perDay: "字 / 天",
      daysLeft: "还剩 5 个写作日 · 距截止 5 天",
      allDays: "所有日子",
      weekdays: "仅工作日",
      historyLabel: "按日历史",
      dows: ["一", "二", "三", "四", "五", "六", "日"],
      noteTitle: "承诺",
      noteLines: ["无登录、无订阅", "工具无广告", "支持 Android 和网页", "超过 110% 提醒", "补记过去日期"],
      backupLabel: "JSON 备份",
      chips: ["无需登录", "无订阅", "可跳过周末", "JSON 备份", "永久免费"],
      footer: "在别处写，在这里数 · ko/en/ja/zh",
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
