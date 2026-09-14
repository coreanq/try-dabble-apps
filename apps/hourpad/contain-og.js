// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Hourpad card: a timesheet on a cool paper desk.
 *
 * The product is a local work-hours tracker, so the picture is a punch clock
 * that is "working" (indigo), a today strip with work / amber break segments,
 * a weekly bar against the 40 h target and a teal overtime-bank chip. Four
 * real jobs (ko/en/ja/zh), each its own SVG → PNG with real CJK glyphs from
 * Noto Sans CJK; zh is never an alias of en. No photos, no generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 238, g: 242, b: 247, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#1e293b";
const MUTED = "#5b6473";
const LINE = "#d8dee9";
const PAPER2 = "#e2e8f0";
const INDIGO = "#3730a3";
const INDIGO_DEEP = "#312e81";
const INDIGO_SOFT = "#e0e7ff";
const AMBER = "#d97706";
const AMBER_SOFT = "#fef3c7";
const AMBER_INK = "#78350f";
const TEAL = "#0f766e";
const TEAL_SOFT = "#ccfbf1";
const TEAL_INK = "#134e4a";
const NOTICE = "#fcd34d";
const NOTICE_INK = "#3b2a05";
const WHITE = "#ffffff";

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

/** Punch clock card: status, big elapsed figure, three pills. */
function clock(job) {
  const pills = [
    { label: job.checkIn, fill: INDIGO, ink: WHITE },
    { label: job.breakBtn, fill: AMBER, ink: WHITE },
    { label: job.checkOut, fill: PAPER2, ink: INK },
  ];
  let x = 26;
  const pillSvg = pills
    .map((p) => {
      const w = Math.ceil(textWidth(p.label, 17) + 34);
      const s = `<rect x="${x}" y="212" width="${w}" height="40" rx="20" fill="${p.fill}"/>` +
        `<text x="${x + w / 2}" y="238" text-anchor="middle" font-size="17" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${p.ink}">${esc(p.label)}</text>`;
      x += w + 10;
      return s;
    })
    .join("");
  return `
  <g transform="translate(60,192)">
    <rect width="420" height="280" rx="20" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="8" height="280" rx="4" fill="${INDIGO}"/>
    <circle cx="36" cy="46" r="7" fill="${INDIGO}"/>
    <circle cx="36" cy="46" r="12" fill="none" stroke="${INDIGO_SOFT}" stroke-width="4"/>
    <text x="56" y="52" font-size="17" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}" letter-spacing="1">${esc(job.status)}</text>
    <text x="26" y="132" font-size="72" font-weight="800" font-family="${figures(job.lang)}" fill="${INK}" letter-spacing="-3">3:47:12</text>
    <text x="26" y="176" font-size="17" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.task)}</text>
    ${pillSvg}
  </g>`;
}

/** Today strip: a horizontal timeline with indigo work blocks and an amber break. */
function today(job) {
  const blocks = [
    { x: 0, w: 120, kind: "work" },
    { x: 120, w: 34, kind: "break" },
    { x: 154, w: 132, kind: "work" },
  ];
  const bars = blocks
    .map((b) => `<rect x="${22 + b.x}" y="60" width="${b.w}" height="26" rx="6" fill="${b.kind === "work" ? INDIGO : AMBER}"/>`)
    .join("");
  return `
  <g transform="translate(520,192)">
    <rect width="332" height="132" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <text x="22" y="36" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.todayLabel)}</text>
    ${bars}
    <text x="22" y="114" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${INDIGO}">${esc(job.todayWork)}</text>
    <text x="310" y="114" text-anchor="end" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER}">${esc(job.todayBreak)}</text>
  </g>`;
}

/** Week bar vs target. */
function week(job) {
  return `
  <g transform="translate(520,340)">
    <rect width="332" height="132" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <text x="22" y="36" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.weekLabel)}</text>
    <rect x="22" y="54" width="288" height="18" rx="9" fill="${PAPER2}"/>
    <rect x="22" y="54" width="246" height="18" rx="9" fill="${INDIGO}"/>
    <line x1="264" y1="46" x2="264" y2="80" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/>
    <text x="22" y="108" font-size="15" font-weight="800" font-family="${figures(job.lang)}" fill="${INK}">${esc(job.weekWork)}</text>
    <text x="310" y="108" text-anchor="end" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.weekTarget)}</text>
  </g>`;
}

/** Teal overtime bank chip with the carry-over arrow. */
function bank(job) {
  return `
  <g transform="translate(880,192)">
    <rect width="256" height="280" rx="18" fill="${TEAL_SOFT}" stroke="#99f6e4" stroke-width="2"/>
    <rect x="0" y="0" width="256" height="8" rx="4" fill="${TEAL}"/>
    <text x="22" y="44" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${TEAL_INK}">${esc(job.bankLabel)}</text>
    <text x="22" y="112" font-size="54" font-weight="800" font-family="${figures(job.lang)}" fill="${TEAL_INK}" letter-spacing="-2">+3h 20m</text>
    <text x="22" y="150" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="${TEAL}">${esc(job.bankFrom)}</text>
    <path d="M22 190 H190" stroke="${TEAL}" stroke-width="4" stroke-linecap="round"/>
    <path d="M176 176 L194 190 L176 204" fill="none" stroke="${TEAL}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="22" y="236" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${TEAL_INK}">${esc(job.bankNext)}</text>
    <text x="22" y="262" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${TEAL}">${esc(job.bankFree)}</text>
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
        `<rect x="${x}" y="492" width="${w}" height="34" rx="17" fill="${INDIGO_SOFT}"/>` +
          `<text x="${x + 13}" y="515" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${INDIGO_DEEP}">${esc(c)}</text>`,
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
      <stop offset="0" stop-color="${INDIGO_SOFT}"/>
      <stop offset="1" stop-color="${TEAL_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#eef2f7"/>
  <circle cx="1060" cy="-60" r="300" fill="url(#wash)" opacity="0.85"/>
  <circle cx="-60" cy="700" r="240" fill="${AMBER_SOFT}" opacity="0.9"/>
  <rect x="36" y="28" width="1128" height="574" rx="28" fill="${WHITE}" stroke="${LINE}" stroke-width="2" opacity="0.72"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${INDIGO}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${NOTICE}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${NOTICE_INK}">${esc(badge)}</text>

  <text x="70" y="138" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(job.title)}</text>
  <text x="70" y="172" font-size="22" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${clock(job)}
  ${today(job)}
  ${week(job)}
  ${bank(job)}
  ${chips.join("")}

  <text x="60" y="560" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.footer)}</text>
  <text x="1136" y="560" text-anchor="end" font-size="16" font-weight="700" font-family="${figures(job.lang)}" fill="${INDIGO}">hourpad.try-dabble.com</text>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  const u = inner / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#eef2f7"/>
  <g transform="translate(${pad},${pad}) scale(${u})">
    <rect x="6" y="8" width="52" height="48" rx="8" fill="${INDIGO}"/>
    <rect x="12" y="14" width="40" height="5" rx="2.5" fill="#eef2f7" opacity="0.55"/>
    <circle cx="28" cy="36" r="13" fill="#eef2f7"/>
    <path d="M28 27v9l6 4" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M28 36l-5 -3" fill="none" stroke="${AMBER}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="28" cy="36" r="1.8" fill="${INK}"/>
    <rect x="44" y="40" width="10" height="10" rx="3" fill="${TEAL}"/>
    <path d="M46.5 45l2 2 3.5 -4" fill="none" stroke="${TEAL_SOFT}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
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
      title: "아워패드",
      subtitle: "무료 로컬 근무 시간 기록. 출근·휴식·퇴근, 일·주 합계, 목표 시간, 초과 근무 뱅크.",
      badge: "데이터는 이 기기에만",
      status: "근무 중 · 09:02부터",
      task: "작업: 고객 보고서",
      checkIn: "출근",
      breakBtn: "휴식",
      checkOut: "퇴근",
      todayLabel: "오늘",
      todayWork: "근무 6h 40m",
      todayBreak: "휴식 45m",
      weekLabel: "이번 주 · 목표 40h",
      weekWork: "34h 10m",
      weekTarget: "남음 5h 50m",
      bankLabel: "초과 근무 뱅크",
      bankFrom: "지난주에서 넘어옴",
      bankNext: "다음 주로 이월",
      bankFree: "무료 · 잠금 없음",
      chips: ["광고 없음", "계정 없음", "휴식 무료", "JSON 백업", "백그라운드 후에도 정직"],
      footer: "회사 시스템 없음 · 로그인 없음 · ko/en/ja/zh",
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Hourpad",
      subtitle: "Free local work-hours tracker. Check in, breaks, check out, weekly target, overtime bank.",
      badge: "Data stays on this device",
      status: "WORKING · since 09:02",
      task: "Task: client report",
      checkIn: "Check in",
      breakBtn: "Break",
      checkOut: "Check out",
      todayLabel: "Today",
      todayWork: "Work 6h 40m",
      todayBreak: "Break 45m",
      weekLabel: "This week · target 40h",
      weekWork: "34h 10m",
      weekTarget: "5h 50m remaining",
      bankLabel: "Overtime bank",
      bankFrom: "carried from last week",
      bankNext: "rolls into next week",
      bankFree: "free · nothing locked",
      chips: ["No ads", "No account", "Breaks free", "JSON backup", "Honest after background"],
      footer: "No company system · no login · ko/en/ja/zh",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "アワーパッド",
      subtitle: "無料のローカル勤務時間トラッカー。出勤・休憩・退勤、日・週合計、目標時間、残業バンク。",
      badge: "データはこの端末だけ",
      status: "勤務中 · 09:02 から",
      task: "作業: 顧客レポート",
      checkIn: "出勤",
      breakBtn: "休憩",
      checkOut: "退勤",
      todayLabel: "今日",
      todayWork: "勤務 6h 40m",
      todayBreak: "休憩 45m",
      weekLabel: "今週 · 目標 40h",
      weekWork: "34h 10m",
      weekTarget: "残り 5h 50m",
      bankLabel: "残業バンク",
      bankFrom: "先週から繰り越し",
      bankNext: "翌週へ繰り越し",
      bankFree: "無料 · ロックなし",
      chips: ["広告なし", "アカウント不要", "休憩は無料", "JSONバックアップ", "裏に回しても正直"],
      footer: "会社のシステム不要 · ログイン不要 · ko/en/ja/zh",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "工时板",
      subtitle: "免费本地工时记录。上班、休息、下班，日/周合计，目标工时，加班库。",
      badge: "数据仅在此设备",
      status: "工作中 · 自 09:02",
      task: "任务：客户报告",
      checkIn: "上班",
      breakBtn: "休息",
      checkOut: "下班",
      todayLabel: "今天",
      todayWork: "工作 6h 40m",
      todayBreak: "休息 45m",
      weekLabel: "本周 · 目标 40h",
      weekWork: "34h 10m",
      weekTarget: "剩余 5h 50m",
      bankLabel: "加班库",
      bankFrom: "从上周滚入",
      bankNext: "滚入下周",
      bankFree: "免费 · 无锁定",
      chips: ["无广告", "无需账号", "休息免费", "JSON 备份", "后台后仍准确"],
      footer: "无公司系统 · 无登录 · ko/en/ja/zh",
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
