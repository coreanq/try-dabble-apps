// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Subpad card: a mint receipt on a warm paper desk.
 *
 * The product is a local subscription ledger, so the picture is a receipt
 * strip listing three services with coral "days until" stamps, a calendar
 * block with renewal marks and a per-currency totals slip. Four real jobs
 * (ko/en/ja/zh), each its own SVG → PNG; zh is never an alias of en.
 * No photos, no generated art, no remote logos: tiles are initials.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 247, g: 243, b: 234, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#1e293b";
const MUTED = "#5b6473";
const LINE = "#e2dbcc";
const SAGE = "#2f6f5e";
const SAGE_DEEP = "#23564a";
const SAGE_SOFT = "#dcefe6";
const CORAL = "#e85d4c";
const CORAL_SOFT = "#fde3de";
const AMBER = "#f5c65b";
const AMBER_INK = "#3b2a05";
const WHITE = "#ffffff";
const PAPER2 = "#efe8d8";

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

/** Receipt strip: zig-zag bottom edge, three service rows. */
function receipt(job) {
  const rows = job.rows
    .map((r, i) => {
      const y = 96 + i * 78;
      return `
      <g transform="translate(0,${y})">
        <rect x="26" y="0" width="52" height="52" rx="12" fill="${r.color}"/>
        <text x="52" y="34" text-anchor="middle" font-size="${r.tile.length > 2 ? 16 : 22}" font-weight="800" font-family="${figures(job.lang)}" fill="${WHITE}">${esc(r.tile)}</text>
        <text x="94" y="22" font-size="21" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(r.name)}</text>
        <text x="94" y="45" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(r.cycle)}</text>
        <text x="392" y="22" text-anchor="end" font-size="20" font-weight="800" font-family="${figures(job.lang)}" fill="${INK}">${esc(r.price)}</text>
        <rect x="${392 - textWidth(r.due, 14) - 22}" y="29" width="${Math.ceil(textWidth(r.due, 14) + 22)}" height="22" rx="11" fill="${r.overdue ? CORAL : SAGE_SOFT}"/>
        <text x="${392 - 11}" y="45" text-anchor="end" font-size="14" font-weight="800" font-family="${sans(job.lang)}" fill="${r.overdue ? WHITE : SAGE_DEEP}">${esc(r.due)}</text>
      </g>`;
    })
    .join("");
  const zig = [];
  for (let x = 420; x >= 0; x -= 20) zig.push(`L${x},${x % 40 === 0 ? 372 : 384}`);
  return `
  <g transform="translate(60,192)">
    <path d="M0,0 H420 ${zig.join(" ")} Z" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="420" height="8" fill="${SAGE}"/>
    <text x="26" y="48" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.receiptLabel)}</text>
    <line x1="26" y1="66" x2="394" y2="66" stroke="${LINE}" stroke-dasharray="4 4"/>
    ${rows}
    <line x1="26" y1="326" x2="394" y2="326" stroke="${LINE}" stroke-dasharray="4 4"/>
    <text x="26" y="354" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${SAGE_DEEP}">${esc(job.receiptFoot)}</text>
  </g>`;
}

/** Month grid with three coral renewal marks. */
function calendar(job) {
  const cells = [];
  const marks = new Set([3, 9, 17]);
  for (let i = 0; i < 28; i += 1) {
    const cx = 24 + (i % 7) * 44;
    const cy = 70 + Math.floor(i / 7) * 44;
    const hit = marks.has(i);
    cells.push(
      `<rect x="${cx - 16}" y="${cy - 16}" width="32" height="32" rx="8" fill="${hit ? CORAL : PAPER2}"/>` +
        `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="14" font-weight="800" font-family="${figures(job.lang)}" fill="${hit ? WHITE : MUTED}">${i + 1}</text>`,
    );
  }
  return `
  <g transform="translate(520,192)">
    <rect width="332" height="240" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <text x="22" y="38" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.calendarLabel)}</text>
    ${cells.join("")}
  </g>`;
}

/** Per-currency totals slip: no merged figure, no FX. */
function totals(job) {
  const rows = job.totals
    .map(
      (r, i) => `
    <g transform="translate(22,${58 + i * 52})">
      <rect width="56" height="26" rx="13" fill="${SAGE_SOFT}"/>
      <text x="28" y="18" text-anchor="middle" font-size="14" font-weight="800" font-family="${figures(job.lang)}" fill="${SAGE_DEEP}">${esc(r.cur)}</text>
      <text x="72" y="19" font-size="20" font-weight="800" font-family="${figures(job.lang)}" fill="${INK}">${esc(r.month)}</text>
      <text x="72" y="40" font-size="13" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(r.year)}</text>
    </g>`,
    )
    .join("");
  return `
  <g transform="translate(880,192)">
    <rect width="256" height="240" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="256" height="8" rx="4" fill="${CORAL}"/>
    <text x="22" y="40" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.totalsLabel)}</text>
    ${rows}
    <text x="22" y="226" font-size="13" font-weight="700" font-family="${sans(job.lang)}" fill="${CORAL}">${esc(job.noFx)}</text>
  </g>`;
}

function svgFor(job) {
  const titleSize = fitSize(job.title, 620, [56, 50, 44, 40]);
  const sub = truncate(job.subtitle, 24, 720);
  const badge = job.badge;
  const chips = job.chips
    .map((c, i) => {
      const x = 520 + i * 0;
      return { c, x };
    })
    .reduce(
      (acc, { c }) => {
        const w = Math.ceil(textWidth(c, 16) + 26);
        const x = acc.x;
        acc.out.push(
          `<rect x="${x}" y="452" width="${w}" height="34" rx="17" fill="${SAGE_SOFT}"/>` +
            `<text x="${x + 13}" y="475" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${SAGE_DEEP}">${esc(c)}</text>`,
        );
        acc.x += w + 10;
        return acc;
      },
      { x: 520, out: [] },
    ).out;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${SAGE_SOFT}"/>
      <stop offset="1" stop-color="${CORAL_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#f7f3ea"/>
  <circle cx="1060" cy="-60" r="300" fill="url(#wash)" opacity="0.8"/>
  <circle cx="-60" cy="700" r="240" fill="${SAGE_SOFT}" opacity="0.9"/>
  <rect x="36" y="28" width="1128" height="574" rx="28" fill="${WHITE}" stroke="${LINE}" stroke-width="2" opacity="0.72"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${SAGE}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${AMBER}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(badge)}</text>

  <text x="70" y="138" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(job.title)}</text>
  <text x="70" y="172" font-size="22" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${receipt(job)}
  ${calendar(job)}
  ${totals(job)}
  ${chips.join("")}

  <text x="520" y="530" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.footer)}</text>
  <text x="520" y="560" font-size="16" font-weight="700" font-family="${figures(job.lang)}" fill="${SAGE_DEEP}">subpad.try-dabble.com</text>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  const u = inner / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#f7f3ea"/>
  <g transform="translate(${pad},${pad}) scale(${u})">
    <rect x="10" y="6" width="44" height="52" rx="6" fill="${SAGE}"/>
    <path d="M14 10h36v40l-4 -3 -4 3 -4 -3 -4 3 -4 -3 -4 3 -4 -3 -4 3z" fill="#f7f3ea"/>
    <rect x="20" y="18" width="24" height="3" rx="1.5" fill="${INK}"/>
    <rect x="20" y="26" width="16" height="3" rx="1.5" fill="${INK}" opacity="0.55"/>
    <rect x="20" y="34" width="20" height="3" rx="1.5" fill="${INK}" opacity="0.55"/>
    <circle cx="42" cy="36" r="6" fill="${CORAL}"/>
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
      title: "섭패드",
      subtitle: "무료 로컬 구독·청구 기록. 가격, 다음 갱신일, 월·연 합계, 결제 기록, 달력 내보내기.",
      badge: "데이터는 이 기기에만",
      receiptLabel: "구독 영수증",
      receiptFoot: "은행 연동 없음 · 목록 무제한",
      rows: [
        { tile: "N", color: "#e50914", name: "넷플릭스", cycle: "매월", price: "₩17,000", due: "3일 후" },
        { tile: "S", color: "#1db954", name: "스포티파이", cycle: "매월", price: "₩10,900", due: "오늘 갱신", overdue: true },
        { tile: ".com", color: "#1d4ed8", name: "도메인 갱신", cycle: "매년", price: "$12.99", due: "18일 후" },
      ],
      calendarLabel: "이달의 갱신",
      totalsLabel: "통화별 합계",
      totals: [
        { cur: "KRW", month: "₩27,900", year: "₩334,800 /년" },
        { cur: "USD", month: "$1.08", year: "$12.99 /년" },
      ],
      noFx: "환율을 지어내지 않습니다",
      chips: ["광고 없음", "계정 없음", "JSON 백업", ".ics"],
      footer: "넷플릭스·스포티파이·iCloud+·ChatGPT 템플릿 · ko/en/ja/zh",
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Subpad",
      subtitle: "Free local subscription tracker. Price, next renewal, totals per currency, history, calendar.",
      badge: "Data stays on this device",
      receiptLabel: "Subscription receipt",
      receiptFoot: "No bank link · unlimited list",
      rows: [
        { tile: "N", color: "#e50914", name: "Netflix", cycle: "Monthly", price: "$15.49", due: "In 3 days" },
        { tile: "S", color: "#1db954", name: "Spotify", cycle: "Monthly", price: "$11.99", due: "Renews today", overdue: true },
        { tile: ".com", color: "#1d4ed8", name: "Domain renewal", cycle: "Yearly", price: "€9.99", due: "In 18 days" },
      ],
      calendarLabel: "Renewals this month",
      totalsLabel: "Totals per currency",
      totals: [
        { cur: "USD", month: "$27.48", year: "$329.76 /yr" },
        { cur: "EUR", month: "€0.83", year: "€9.99 /yr" },
      ],
      noFx: "We do not invent exchange rates",
      chips: ["No ads", "No account", "JSON backup", ".ics"],
      footer: "Templates for Netflix, Spotify, iCloud+, ChatGPT · ko/en/ja/zh",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "サブパッド",
      subtitle: "無料のローカルサブスク・請求トラッカー。料金、次回更新、通貨別合計、履歴、カレンダー。",
      badge: "データはこの端末だけ",
      receiptLabel: "サブスクのレシート",
      receiptFoot: "銀行連携なし · 件数無制限",
      rows: [
        { tile: "N", color: "#e50914", name: "Netflix", cycle: "毎月", price: "¥1,590", due: "あと 3 日" },
        { tile: "S", color: "#1db954", name: "Spotify", cycle: "毎月", price: "¥980", due: "今日更新", overdue: true },
        { tile: ".com", color: "#1d4ed8", name: "ドメイン更新", cycle: "毎年", price: "$12.99", due: "あと 18 日" },
      ],
      calendarLabel: "今月の更新",
      totalsLabel: "通貨ごとの合計",
      totals: [
        { cur: "JPY", month: "¥2,570", year: "¥30,840 /年" },
        { cur: "USD", month: "$1.08", year: "$12.99 /年" },
      ],
      noFx: "為替レートは作りません",
      chips: ["広告なし", "アカウント不要", "JSONバックアップ", ".ics"],
      footer: "Netflix・Spotify・iCloud+・ChatGPT のテンプレ · ko/en/ja/zh",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "续费板",
      subtitle: "免费本地订阅/账单记录。价格、下次续费、按货币合计、付款记录、日历导出。",
      badge: "数据仅在此设备",
      receiptLabel: "订阅小票",
      receiptFoot: "无银行连接 · 列表不限数量",
      rows: [
        { tile: "N", color: "#e50914", name: "Netflix", cycle: "每月", price: "¥68.00", due: "3 天后" },
        { tile: "S", color: "#1db954", name: "Spotify", cycle: "每月", price: "HK$68", due: "今天续费", overdue: true },
        { tile: ".com", color: "#1d4ed8", name: "域名续费", cycle: "每年", price: "$12.99", due: "18 天后" },
      ],
      calendarLabel: "本月续费",
      totalsLabel: "按货币合计",
      totals: [
        { cur: "CNY", month: "¥68.00", year: "¥816.00 /年" },
        { cur: "HKD", month: "HK$68", year: "HK$816 /年" },
        { cur: "USD", month: "$1.08", year: "$12.99 /年" },
      ],
      noFx: "我们不编造汇率",
      chips: ["无广告", "无需账号", "JSON 备份", ".ics"],
      footer: "Netflix、Spotify、iCloud+、ChatGPT 模板 · ko/en/ja/zh",
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
