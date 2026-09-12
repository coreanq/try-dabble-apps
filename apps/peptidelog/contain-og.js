// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Peptidelog card: a clean clinic sheet in daylight.
 *
 * The product is "log the injection, do the reconstitution arithmetic, see
 * what is left in the vial", so the picture is the tracker on cool off-white:
 * a vial drawn in flat SVG with its concentration readout, a syringe with the
 * unit mark, a short dose list with site chips and a calendar strip, plus the
 * ten rotation dots. Four real jobs (ko/en/ja/zh), each its own SVG → PNG;
 * zh is never an alias of en. No photos, no generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 244, g: 247, b: 251, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#1f2f3a";
const MUTED = "#5d7080";
const LINE = "#dbe4ec";
const LINE2 = "#c5d3de";
const TEAL = "#2a7a8c";
const TEAL_DEEP = "#1f5f6e";
const TEAL_SOFT = "#dff0f3";
const TEAL_MIST = "#8fd0dc";
const LAV = "#b9a8f2";
const LAV_DEEP = "#6f5bc4";
const LAV_SOFT = "#eeeafb";
const PAPER2 = "#e9eff6";
const AMBER = "#f5c65b";
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

function truncate(text, size, maxWidth) {
  if (textWidth(text, size) <= maxWidth) return text;
  const chars = [...String(text)];
  while (chars.length > 1 && textWidth(chars.join("") + "…", size) > maxWidth) chars.pop();
  return chars.join("").trimEnd() + "…";
}

/** The vial: lavender cap, glass body, teal liquid at the given fill ratio. */
function vial(x, y, scale, fill) {
  const h = 150;
  const liquidH = Math.max(10, h * fill);
  return `
  <g transform="translate(${x},${y}) scale(${scale})">
    <rect x="22" y="0" width="56" height="18" rx="6" fill="${LAV}"/>
    <rect x="30" y="18" width="40" height="12" fill="${LINE2}"/>
    <rect x="10" y="30" width="80" height="${h + 20}" rx="18" fill="${WHITE}" stroke="${TEAL}" stroke-width="5"/>
    <rect x="16" y="${30 + 20 + (h - liquidH)}" width="68" height="${liquidH}" rx="12" fill="${TEAL_MIST}"/>
    <rect x="26" y="44" width="10" height="${h - 20}" rx="5" fill="${WHITE}" opacity="0.8"/>
  </g>`;
}

/** The syringe: barrel with tick marks, plunger, needle, and the units mark. */
function syringe(x, y, scale, marks) {
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const tx = 40 + i * 24;
    ticks.push(`<rect x="${tx}" y="${i % 5 === 0 ? 28 : 34}" width="3" height="${i % 5 === 0 ? 20 : 12}" rx="1.5" fill="${TEAL_DEEP}"/>`);
  }
  return `
  <g transform="translate(${x},${y}) scale(${scale})">
    <rect x="0" y="30" width="14" height="24" rx="3" fill="${LAV_DEEP}"/>
    <rect x="14" y="36" width="26" height="12" rx="3" fill="${LAV}"/>
    <rect x="34" y="18" width="270" height="48" rx="10" fill="${WHITE}" stroke="${TEAL}" stroke-width="5"/>
    <rect x="40" y="24" width="${marks * 24}" height="36" rx="6" fill="${TEAL_SOFT}"/>
    ${ticks.join("")}
    <rect x="304" y="34" width="20" height="16" rx="4" fill="${TEAL}"/>
    <rect x="324" y="40" width="70" height="4" rx="2" fill="${TEAL_DEEP}"/>
  </g>`;
}

/** One dose row: compound, amount, time, site chip. */
function row(lang, x, y, w, item) {
  const chipW = textWidth(item.site, 22) + 40;
  const avail = w - 60 - chipW - 44;
  const size = fitSize(item.text, avail, [28, 26, 24]);
  const shown = truncate(item.text, size, avail);
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="${w}" height="72" rx="16" fill="${WHITE}" stroke="${LINE}" stroke-width="2.5"/>
    <rect x="0" y="0" width="10" height="72" rx="5" fill="${item.color}"/>
    <text x="30" y="46" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${INK}">${esc(shown)}</text>
    <rect x="${w - chipW - 22}" y="20" width="${chipW}" height="32" rx="16" fill="${PAPER2}"/>
    <text x="${w - chipW - 22 + chipW / 2}" y="43" text-anchor="middle" font-family="${sans(lang)}" font-size="22" font-weight="700" fill="${MUTED}">${esc(item.site)}</text>
  </g>`;
}

/** The fail-fix promise line along the bottom, as pills. */
function promises(lang, items, x0, y) {
  let x = x0;
  const out = [];
  for (const label of items) {
    const size = 25;
    const w = textWidth(label, size) + 40;
    out.push(`<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="50" rx="25" fill="${WHITE}" stroke="${LINE2}" stroke-width="2.5"/>
      <text x="${w / 2}" y="34" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
    </g>`);
    x += w + 12;
  }
  return out.join("");
}

/** Ten rotation dots with the next one lit. */
function dots(x, y, next) {
  const out = [];
  for (let i = 0; i < 10; i++) {
    const cx = x + i * 34;
    out.push(`<circle cx="${cx}" cy="${y}" r="${i === next ? 13 : 9}" fill="${i === next ? TEAL : LINE2}"/>`);
  }
  return out.join("");
}

function svgFor(job) {
  const { lang, title, subtitle, badge, calcLabel, calcValue, unitsLabel, unitsValue, rows, calendarLabel, rotationLabel, disclaimer } = job;
  const titleSize = fitSize(title, 820, [84, 76, 68, 60, 54]);
  const subSize = fitSize(subtitle, 1560, [32, 30, 28, 26, 23, 20]);
  const pageY = 56 + titleSize + subSize + 40;
  const pageH = 945 - pageY - 112;
  const badgeSize = fitSize(badge, 380, [30, 27, 24, 22]);
  const badgeW = textWidth(badge, badgeSize) + 56;
  const discSize = fitSize(disclaimer, 980, [26, 24, 22, 20]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <radialGradient id="washA" cx="15%" cy="-10%" r="70%">
      <stop offset="0%" stop-color="${TEAL}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${TEAL}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="washB" cx="90%" cy="0%" r="55%">
      <stop offset="0%" stop-color="${LAV}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${LAV}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${INK}" flood-opacity="0.10"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="#f4f7fb"/>
  <rect width="1800" height="945" fill="url(#washA)"/>
  <rect width="1800" height="945" fill="url(#washB)"/>

  <!-- title block -->
  <g transform="translate(110,56)">
    <g transform="translate(0,${titleSize * 0.12}) scale(${(titleSize * 0.95) / 64})">
      <rect x="6" y="6" width="52" height="52" rx="14" fill="${TEAL}"/>
      <rect x="10" y="10" width="44" height="44" rx="11" fill="#f4f7fb"/>
      <rect x="24" y="16" width="16" height="5" rx="2" fill="${LAV}"/>
      <rect x="26" y="21" width="12" height="4" fill="#d9e6ef"/>
      <rect x="21" y="25" width="22" height="24" rx="5" fill="${WHITE}" stroke="${TEAL}" stroke-width="2"/>
      <rect x="23" y="36" width="18" height="11" rx="3" fill="${TEAL_MIST}"/>
      <rect x="26" y="29" width="3" height="14" rx="1.5" fill="${WHITE}" opacity="0.85"/>
    </g>
    <text x="${titleSize * 1.15}" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 18}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>
  <!-- sticky note: local only -->
  <g transform="translate(${1690 - badgeW},${66}) rotate(-3)">
    <rect x="0" y="0" width="${badgeW}" height="${badgeSize + 36}" rx="8" fill="${AMBER}"/>
    <text x="${badgeW / 2}" y="${badgeSize + 10}" text-anchor="middle" font-family="${sans(lang)}" font-size="${badgeSize}" font-weight="800" fill="${AMBER_INK}">${esc(badge)}</text>
  </g>

  <!-- the sheet: vial + calculator readout on the left -->
  <g transform="translate(110,${pageY})" filter="url(#shadow)">
    <rect x="0" y="0" width="640" height="${pageH}" rx="30" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="640" height="8" rx="4" fill="${TEAL_MIST}"/>
  </g>
  <g transform="translate(110,${pageY})">
    ${vial(50, 40, 1.35, 0.55)}
    <g transform="translate(240,50)">
      <rect x="0" y="0" width="360" height="86" rx="16" fill="${TEAL_SOFT}" stroke="rgba(42,122,140,0.25)" stroke-width="2"/>
      <text x="20" y="34" font-family="${sans(lang)}" font-size="22" font-weight="800" fill="${MUTED}" letter-spacing="1">${esc(calcLabel)}</text>
      <text x="20" y="72" font-family="${figures(lang)}" font-size="34" font-weight="800" fill="${TEAL_DEEP}">${esc(calcValue)}</text>
    </g>
    <g transform="translate(240,150)">
      <rect x="0" y="0" width="360" height="86" rx="16" fill="${LAV_SOFT}" stroke="${LAV}" stroke-width="2"/>
      <text x="20" y="34" font-family="${sans(lang)}" font-size="22" font-weight="800" fill="${MUTED}" letter-spacing="1">${esc(unitsLabel)}</text>
      <text x="20" y="72" font-family="${figures(lang)}" font-size="34" font-weight="800" fill="${LAV_DEEP}">${esc(unitsValue)}</text>
    </g>
    ${syringe(60, 300, 1.25, 4)}
    <text x="40" y="${pageH - 92}" font-family="${sans(lang)}" font-size="24" font-weight="800" fill="${MUTED}">${esc(rotationLabel)}</text>
    ${dots(52, pageH - 50, 2)}
  </g>

  <!-- dose list + calendar strip on the right -->
  <g transform="translate(790,${pageY})">
    ${rows.map((r, i) => row(lang, 0, i * 86, 900, r)).join("")}
    <g transform="translate(0,${rows.length * 86 + 10})">
      <text x="4" y="30" font-family="${sans(lang)}" font-size="24" font-weight="800" fill="${MUTED}">${esc(calendarLabel)}</text>
      ${[...Array(14)].map((_, i) => `<rect x="${i * 64}" y="44" width="56" height="56" rx="12" fill="${i === 9 ? TEAL : WHITE}" stroke="${i === 9 ? TEAL_DEEP : LINE}" stroke-width="2.5"/><text x="${i * 64 + 28}" y="80" text-anchor="middle" font-family="${figures(lang)}" font-size="24" font-weight="800" fill="${i === 9 ? WHITE : INK}">${i + 3}</text>${[1, 4, 6, 9, 11].includes(i) ? `<circle cx="${i * 64 + 28}" cy="92" r="4" fill="${i === 9 ? WHITE : LAV_DEEP}"/>` : ""}`).join("")}
    </g>
  </g>

  <!-- not medical advice line -->
  <g transform="translate(790,${pageY + pageH - 56})">
    <rect x="0" y="-36" width="${textWidth(disclaimer, discSize) + 48}" height="52" rx="10" fill="${LAV_SOFT}" stroke="${LAV}" stroke-width="2"/>
    <rect x="0" y="-36" width="6" height="52" rx="3" fill="${LAV}"/>
    <text x="24" y="0" font-family="${sans(lang)}" font-size="${discSize}" font-weight="800" fill="${LAV_DEEP}">${esc(disclaimer)}</text>
  </g>

  ${promises(lang, job.promises, 110, 945 - 40 - 50)}
</svg>`;
}

/** App icon: the vial on a teal tile, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dff0f3"/>
      <stop offset="100%" stop-color="#f4f7fb"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="48" y="48" width="416" height="416" rx="112" fill="${TEAL}"/>
    <rect x="80" y="80" width="352" height="352" rx="88" fill="#f4f7fb"/>
    <rect x="192" y="128" width="128" height="40" rx="16" fill="${LAV}"/>
    <rect x="208" y="168" width="96" height="32" fill="#d9e6ef"/>
    <rect x="168" y="200" width="176" height="192" rx="40" fill="${WHITE}" stroke="${TEAL}" stroke-width="16"/>
    <rect x="184" y="288" width="144" height="88" rx="24" fill="${TEAL_MIST}"/>
    <rect x="208" y="232" width="24" height="112" rx="12" fill="${WHITE}" opacity="0.85"/>
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
  const jobs = [
    {
      lang: "ko",
      title: "펩타이드로그",
      subtitle: "무료 로컬 펩타이드·주사 기록. 화합물, 재구성 계산, 용량 로그, 바이알 재고, 스케줄, 부위 로테이션, JSON 백업. 계정 없음.",
      badge: "데이터는 이 기기에만",
      calcLabel: "농도 · 5 mg + 2 mL",
      calcValue: "2.5 mg/mL",
      unitsLabel: "250 mcg → 주사기 눈금",
      unitsValue: "10 U (0.1 mL)",
      rows: [
        { text: "화합물 A · 250 mcg · 08:00", site: "복부 좌상", color: TEAL_MIST },
        { text: "화합물 B · 1 mg · 21:00", site: "왼쪽 허벅지", color: LAV },
        { text: "화합물 A · 250 mcg · 어제", site: "복부 우상", color: TEAL_MIST },
      ],
      calendarLabel: "달력 · 어느 날이든 기록·수정·삭제",
      rotationLabel: "부위 로테이션 · 다음: 복부 좌하",
      disclaimer: "의료 조언이 아닙니다 · 계산기는 산술만",
      promises: ["구독 유도 벽 없음", "어느 날짜든 기록", "잘못된 용량 수정", "화합물 무제한 무료", "산술만 · 의료 조언 아님", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Peptidelog",
      subtitle: "Free local peptide & injection tracker. Compounds, reconstitution calc, dose log, vial inventory, schedules, site rotation, JSON backup. No account.",
      badge: "Data stays on this device",
      calcLabel: "CONCENTRATION · 5 mg + 2 mL",
      calcValue: "2.5 mg/mL",
      unitsLabel: "250 mcg → SYRINGE UNITS",
      unitsValue: "10 U (0.1 mL)",
      rows: [
        { text: "Compound A · 250 mcg · 08:00", site: "Abdomen UL", color: TEAL_MIST },
        { text: "Compound B · 1 mg · 21:00", site: "Left thigh", color: LAV },
        { text: "Compound A · 250 mcg · yesterday", site: "Abdomen UR", color: TEAL_MIST },
      ],
      calendarLabel: "Calendar · log, edit or delete on any day",
      rotationLabel: "Site rotation · next: abdomen lower left",
      disclaimer: "Not medical advice · calculator is arithmetic only",
      promises: ["No subscribe wall", "Log any day", "Edit wrong doses", "Unlimited compounds free", "Arithmetic only · not medical advice", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ペプチドログ",
      subtitle: "無料のローカルペプチド・注射記録。化合物、再構成計算、用量ログ、バイアル在庫、スケジュール、部位ローテーション、JSONバックアップ。",
      badge: "データはこの端末だけ",
      calcLabel: "濃度 · 5 mg + 2 mL",
      calcValue: "2.5 mg/mL",
      unitsLabel: "250 mcg → 注射器の目盛り",
      unitsValue: "10 U (0.1 mL)",
      rows: [
        { text: "化合物A · 250 mcg · 08:00", site: "腹部 左上", color: TEAL_MIST },
        { text: "化合物B · 1 mg · 21:00", site: "左太もも", color: LAV },
        { text: "化合物A · 250 mcg · 昨日", site: "腹部 右上", color: TEAL_MIST },
      ],
      calendarLabel: "カレンダー · どの日でも記録・編集・削除",
      rotationLabel: "部位ローテーション · 次: 腹部 左下",
      disclaimer: "医療助言ではありません · 計算機は算術のみ",
      promises: ["サブスク誘導の壁なし", "どの日でも記録", "誤った用量を編集", "化合物は無制限で無料", "算術のみ · 医療助言ではない", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "肽记录",
      subtitle: "免费本地肽类与注射记录。化合物、复溶计算、剂量日志、药瓶库存、日程、部位轮换、JSON 备份。无需账号。",
      badge: "数据仅在此设备",
      calcLabel: "浓度 · 5 mg + 2 mL",
      calcValue: "2.5 mg/mL",
      unitsLabel: "250 mcg → 注射器刻度",
      unitsValue: "10 U (0.1 mL)",
      rows: [
        { text: "化合物 A · 250 mcg · 08:00", site: "腹部左上", color: TEAL_MIST },
        { text: "化合物 B · 1 mg · 21:00", site: "左大腿", color: LAV },
        { text: "化合物 A · 250 mcg · 昨天", site: "腹部右上", color: TEAL_MIST },
      ],
      calendarLabel: "日历 · 任意日期记录、修改、删除",
      rotationLabel: "部位轮换 · 下一个：腹部左下",
      disclaimer: "非医疗建议 · 计算器仅做算术",
      promises: ["没有订阅墙", "任意日期可记录", "错误剂量可修改", "化合物不限且免费", "仅做算术 · 非医疗建议", "ko/en/ja/zh"],
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
