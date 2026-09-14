// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Paypad card: a cream ledger with mint envelopes and a gold income chip.
 *
 * The product is a local envelope budget for irregular income, so the
 * picture is a pay stub with three landed payouts (gold), a column of
 * envelopes with their resolved amounts and share bars (mint), and a
 * buffer slip. Four real jobs (ko/en/ja/zh), each its own SVG → PNG; zh is
 * never an alias of en. No photos, no generated art, no remote assets.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 247, g: 245, b: 239, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#1e293b";
const MUTED = "#5b6473";
const LINE = "#e2dfd2";
const MINT = "#0f766e";
const MINT_DEEP = "#115e59";
const SAGE = "#bbf7d0";
const SAGE_SOFT = "#e6f6ec";
const GOLD = "#ca8a04";
const GOLD_DEEP = "#a16207";
const GOLD_SOFT = "#fef3c7";
const CORAL = "#e11d48";
const AMBER = "#f5c65b";
const AMBER_INK = "#3b2a05";
const WHITE = "#ffffff";
const PAPER2 = "#efece0";
const CAT = { savings: MINT, debt: CORAL, bills: INK, sinking: "#7c3aed", flexible: GOLD };

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.62;
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

/** Pay stub: gold-edged slip listing three landed payouts and the month total. */
function stub(job) {
  const rows = job.earnings
    .map((r, i) => {
      const y = 92 + i * 64;
      return `
      <g transform="translate(0,${y})">
        <circle cx="42" cy="22" r="16" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="2"/>
        <text x="42" y="28" text-anchor="middle" font-size="16" font-weight="800" font-family="${figures(job.lang)}" fill="${GOLD_DEEP}">＄</text>
        <text x="72" y="16" font-size="18" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(truncate(r.label, 18, 250))}</text>
        <text x="72" y="40" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(r.date)}</text>
        <text x="330" y="41" text-anchor="end" font-size="20" font-weight="800" font-family="${figures(job.lang)}" fill="${GOLD_DEEP}">${esc(r.amount)}</text>
      </g>`;
    })
    .join("");
  return `
  <g transform="translate(60,192)">
    <rect width="356" height="330" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="356" height="8" rx="4" fill="${GOLD}"/>
    <text x="26" y="46" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.stubLabel)}</text>
    <line x1="26" y1="64" x2="330" y2="64" stroke="${LINE}" stroke-dasharray="4 4"/>
    ${rows}
    <line x1="26" y1="278" x2="330" y2="278" stroke="${LINE}" stroke-dasharray="4 4"/>
    <text x="26" y="308" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.stubTotalLabel)}</text>
    <text x="330" y="308" text-anchor="end" font-size="22" font-weight="800" font-family="${figures(job.lang)}" fill="${GOLD_DEEP}">${esc(job.stubTotal)}</text>
  </g>`;
}

/** Envelope column: each row is a little envelope flap, category chip, resolved amount and a share bar. */
function envelopes(job) {
  const rows = job.envelopes
    .map((r, i) => {
      const y = 62 + i * 52;
      const bar = Math.round(300 * r.share);
      const amountW = textWidth(r.amount, 17);
      const ruleW = textWidth(r.rule, 13);
      const nameMax = 300 - amountW - ruleW - 24;
      return `
      <g transform="translate(0,${y})">
        <rect x="22" y="2" width="34" height="26" rx="5" fill="${CAT[r.cat]}"/>
        <path d="M24 5h30v8L39 23 24 13z" fill="${SAGE}" opacity="0.9"/>
        <text x="66" y="15" font-size="17" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(truncate(r.name, 17, nameMax))}</text>
        <text x="${366 - amountW - 12}" y="15" text-anchor="end" font-size="13" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(r.rule)}</text>
        <text x="366" y="15" text-anchor="end" font-size="17" font-weight="800" font-family="${figures(job.lang)}" fill="${MINT_DEEP}">${esc(r.amount)}</text>
        <rect x="66" y="24" width="300" height="8" rx="4" fill="${PAPER2}"/>
        <rect x="66" y="24" width="${bar}" height="8" rx="4" fill="${CAT[r.cat]}"/>
      </g>`;
    })
    .join("");
  return `
  <g transform="translate(444,192)">
    <rect width="388" height="330" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="388" height="8" rx="4" fill="${MINT}"/>
    <text x="22" y="42" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.envLabel)}</text>
    ${rows}
  </g>`;
}

/** Buffer slip: allocated vs buffer stacked bar and the leftover figure. */
function buffer(job) {
  const alloc = Math.round(224 * job.allocShare);
  return `
  <g transform="translate(860,192)">
    <rect width="276" height="330" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="276" height="8" rx="4" fill="${GOLD}"/>
    <text x="22" y="42" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.bufferLabel)}</text>
    <text x="22" y="86" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.allocLabel)}</text>
    <text x="22" y="112" font-size="24" font-weight="800" font-family="${figures(job.lang)}" fill="${MINT_DEEP}">${esc(job.allocValue)}</text>
    <text x="22" y="150" font-size="14" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.leftLabel)}</text>
    <text x="22" y="180" font-size="30" font-weight="800" font-family="${figures(job.lang)}" fill="${GOLD_DEEP}">${esc(job.leftValue)}</text>
    <rect x="22" y="204" width="232" height="18" rx="9" fill="${PAPER2}"/>
    <rect x="22" y="204" width="${alloc + 8}" height="18" rx="9" fill="${MINT}"/>
    <rect x="${22 + alloc + 8}" y="204" width="${232 - alloc - 8}" height="18" rx="9" fill="${GOLD}"/>
    <rect x="22" y="246" width="232" height="58" rx="12" fill="${SAGE_SOFT}"/>
    <text x="138" y="270" text-anchor="middle" font-size="14" font-weight="800" font-family="${sans(job.lang)}" fill="${MINT_DEEP}">${esc(job.autoLine1)}</text>
    <text x="138" y="292" text-anchor="middle" font-size="14" font-weight="800" font-family="${sans(job.lang)}" fill="${MINT_DEEP}">${esc(job.autoLine2)}</text>
  </g>`;
}

function svgFor(job) {
  const titleSize = fitSize(job.title, 620, [56, 50, 44, 40]);
  const sub = truncate(job.subtitle, 21, 1050);
  const badge = job.badge;
  const chips = job.chips.reduce(
    (acc, c) => {
      const w = Math.ceil(textWidth(c, 16) + 26);
      acc.out.push(
        `<rect x="${acc.x}" y="540" width="${w}" height="34" rx="17" fill="${SAGE_SOFT}"/>` +
          `<text x="${acc.x + 13}" y="563" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${MINT_DEEP}">${esc(c)}</text>`,
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
      <stop offset="0" stop-color="${SAGE}"/>
      <stop offset="1" stop-color="${GOLD_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#f7f5ef"/>
  <circle cx="1060" cy="-60" r="300" fill="url(#wash)" opacity="0.85"/>
  <circle cx="-60" cy="700" r="240" fill="${SAGE_SOFT}" opacity="0.9"/>
  <rect x="36" y="28" width="1128" height="574" rx="28" fill="${WHITE}" stroke="${LINE}" stroke-width="2" opacity="0.72"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${MINT}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${AMBER}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(badge)}</text>

  <text x="70" y="138" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${INK}">${esc(job.title)}</text>
  <text x="70" y="172" font-size="21" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${stub(job)}
  ${envelopes(job)}
  ${buffer(job)}
  ${chips.join("")}

  <text x="1136" y="563" text-anchor="end" font-size="16" font-weight="700" font-family="${figures(job.lang)}" fill="${MINT_DEEP}">paypad.try-dabble.com</text>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  const u = inner / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#f7f5ef"/>
  <g transform="translate(${pad},${pad}) scale(${u})">
    <rect x="6" y="16" width="52" height="38" rx="7" fill="${MINT}"/>
    <path d="M10 20h44v12L32 44 10 32z" fill="${SAGE}"/>
    <path d="M10 22l22 16 22-16" fill="none" stroke="${MINT}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="22" y="6" width="28" height="18" rx="3" fill="#f7f5ef" stroke="${INK}" stroke-width="2"/>
    <circle cx="36" cy="15" r="5" fill="${GOLD}"/>
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
      title: "페이패드",
      subtitle: "무료 로컬 비정기 수입 봉투 예산. 수입을 적으면 %·고정 봉투가 바로 다시 계산됩니다.",
      badge: "데이터는 이 기기에만",
      stubLabel: "이달의 수입",
      stubTotalLabel: "합계",
      stubTotal: "₩3,050,000",
      earnings: [
        { label: "클라이언트 A 정산", date: "9월 3일", amount: "₩1,800,000" },
        { label: "배달 정산", date: "9월 12일", amount: "₩450,000" },
        { label: "강의료", date: "9월 20일", amount: "₩800,000" },
      ],
      envLabel: "봉투 · 개수 무제한",
      envelopes: [
        { name: "비상금", rule: "20%", amount: "₩610,000", cat: "savings", share: 0.2 },
        { name: "월세·공과금", rule: "고정", amount: "₩900,000", cat: "bills", share: 0.3 },
        { name: "대출 상환", rule: "10%", amount: "₩305,000", cat: "debt", share: 0.1 },
        { name: "세금 적립", rule: "15%", amount: "₩457,500", cat: "sinking", share: 0.15 },
        { name: "자유 지출", rule: "10%", amount: "₩305,000", cat: "flexible", share: 0.1 },
      ],
      bufferLabel: "버퍼",
      allocLabel: "봉투 배분",
      allocValue: "₩2,577,500",
      leftLabel: "다음 급여로",
      leftValue: "₩472,500",
      allocShare: 0.85,
      autoLine1: "수입 추가 시",
      autoLine2: "자동 재계산 · 월·연 보기",
      chips: ["봉투 개수 무제한", "Plus 결제 없음", "계정 없음", "광고 없음", "JSON 백업"],
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Paypad",
      subtitle: "Free local envelope budget for irregular income. Every payout recomputes.",
      badge: "Data stays on this device",
      stubLabel: "Earnings this month",
      stubTotalLabel: "Total",
      stubTotal: "$3,050.00",
      earnings: [
        { label: "Client A invoice", date: "Sep 3", amount: "$1,800.00" },
        { label: "Delivery payout", date: "Sep 12", amount: "$450.00" },
        { label: "Workshop fee", date: "Sep 20", amount: "$800.00" },
      ],
      envLabel: "Envelopes · no cap",
      envelopes: [
        { name: "Emergency fund", rule: "20%", amount: "$610.00", cat: "savings", share: 0.2 },
        { name: "Rent & bills", rule: "fixed", amount: "$900.00", cat: "bills", share: 0.3 },
        { name: "Loan payment", rule: "10%", amount: "$305.00", cat: "debt", share: 0.1 },
        { name: "Tax set-aside", rule: "15%", amount: "$457.50", cat: "sinking", share: 0.15 },
        { name: "Flexible", rule: "10%", amount: "$305.00", cat: "flexible", share: 0.1 },
      ],
      bufferLabel: "Buffer",
      allocLabel: "Allocated",
      allocValue: "$2,577.50",
      leftLabel: "To next paycheck",
      leftValue: "$472.50",
      allocShare: 0.85,
      autoLine1: "Recomputes when",
      autoLine2: "income lands · monthly + annual",
      chips: ["No envelope cap", "No Plus paywall", "No account", "No ads", "JSON backup"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ペイパッド",
      subtitle: "無料のローカル不定期収入エンベロープ予算。入金を記録すると％封筒が即再計算。",
      badge: "データはこの端末だけ",
      stubLabel: "今月の収入",
      stubTotalLabel: "合計",
      stubTotal: "¥305,000",
      earnings: [
        { label: "クライアントA 請求", date: "9月3日", amount: "¥180,000" },
        { label: "配達の精算", date: "9月12日", amount: "¥45,000" },
        { label: "講師料", date: "9月20日", amount: "¥80,000" },
      ],
      envLabel: "封筒 · 上限なし",
      envelopes: [
        { name: "緊急資金", rule: "20%", amount: "¥61,000", cat: "savings", share: 0.2 },
        { name: "家賃・光熱費", rule: "定額", amount: "¥90,000", cat: "bills", share: 0.3 },
        { name: "ローン返済", rule: "10%", amount: "¥30,500", cat: "debt", share: 0.1 },
        { name: "税金の積立", rule: "15%", amount: "¥45,750", cat: "sinking", share: 0.15 },
        { name: "自由に使う", rule: "10%", amount: "¥30,500", cat: "flexible", share: 0.1 },
      ],
      bufferLabel: "バッファ",
      allocLabel: "振り分け済み",
      allocValue: "¥257,750",
      leftLabel: "次の給与へ",
      leftValue: "¥47,250",
      allocShare: 0.85,
      autoLine1: "収入追加で自動再計算",
      autoLine2: "月次・年次表示",
      chips: ["封筒数の上限なし", "Plus課金なし", "アカウント不要", "広告なし", "JSONバックアップ"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "薪资信封板",
      subtitle: "免费本地不定期收入信封预算。记一笔到账，百分比信封立即重算。",
      badge: "数据仅在此设备",
      stubLabel: "本月收入",
      stubTotalLabel: "合计",
      stubTotal: "¥30,500.00",
      earnings: [
        { label: "客户 A 结算", date: "9月3日", amount: "¥18,000.00" },
        { label: "外卖结算", date: "9月12日", amount: "¥4,500.00" },
        { label: "课时费", date: "9月20日", amount: "¥8,000.00" },
      ],
      envLabel: "信封 · 数量不限",
      envelopes: [
        { name: "应急金", rule: "20%", amount: "¥6,100.00", cat: "savings", share: 0.2 },
        { name: "房租与账单", rule: "固定", amount: "¥9,000.00", cat: "bills", share: 0.3 },
        { name: "贷款还款", rule: "10%", amount: "¥3,050.00", cat: "debt", share: 0.1 },
        { name: "税款预留", rule: "15%", amount: "¥4,575.00", cat: "sinking", share: 0.15 },
        { name: "灵活支出", rule: "10%", amount: "¥3,050.00", cat: "flexible", share: 0.1 },
      ],
      bufferLabel: "缓冲",
      allocLabel: "已分配",
      allocValue: "¥25,775.00",
      leftLabel: "转入下次薪水",
      leftValue: "¥4,725.00",
      allocShare: 0.85,
      autoLine1: "加收入自动重算",
      autoLine2: "月 / 年视图",
      chips: ["信封数量不限", "无 Plus 付费墙", "无需账号", "无广告", "JSON 备份"],
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
