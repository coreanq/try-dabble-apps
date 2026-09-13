// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Gymac card: a gym whiteboard in daylight.
 *
 * The product is "log the sets, see the PR, hit the macros", so the picture
 * is the tracker on warm cream: a flat SVG dumbbell, a session sheet with set
 * rows, a PR readout in teal, four macro bars against targets, and a scale
 * with a weigh-in. Four real jobs (ko/en/ja/zh), each its own SVG → PNG; zh
 * is never an alias of en. No photos, no generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 255, g: 248, b: 243, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#2a1f1a";
const MUTED = "#7a655a";
const LINE = "#f0dfd4";
const LINE2 = "#e4cbbb";
const CORAL = "#e85d4c";
const CORAL_DEEP = "#c9402f";
const CORAL_SOFT = "#fde4df";
const ORANGE = "#f97316";
const ORANGE_SOFT = "#ffedd5";
const TEAL = "#0d9488";
const TEAL_DEEP = "#0b6f66";
const TEAL_SOFT = "#d7f2ee";
const GOLD = "#c9a227";
const PAPER2 = "#fdeee4";
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

/** The dumbbell: bar, two teal plates each side, coral collars. */
function dumbbell(x, y, scale) {
  return `
  <g transform="translate(${x},${y}) scale(${scale})">
    <rect x="0" y="44" width="300" height="16" rx="8" fill="${INK}"/>
    <rect x="34" y="14" width="30" height="76" rx="8" fill="${TEAL}"/>
    <rect x="66" y="4" width="34" height="96" rx="9" fill="${TEAL_DEEP}"/>
    <rect x="200" y="4" width="34" height="96" rx="9" fill="${TEAL_DEEP}"/>
    <rect x="236" y="14" width="30" height="76" rx="8" fill="${TEAL}"/>
    <rect x="14" y="30" width="18" height="44" rx="5" fill="${CORAL}"/>
    <rect x="268" y="30" width="18" height="44" rx="5" fill="${CORAL}"/>
  </g>`;
}

/** One set row on the session sheet. */
function setRow(lang, x, y, w, n, weight, reps) {
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="${w}" height="56" rx="12" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <text x="22" y="38" font-family="${figures(lang)}" font-size="26" font-weight="800" fill="${MUTED}">${n}</text>
    <rect x="70" y="8" width="${(w - 150) / 2}" height="40" rx="9" fill="${PAPER2}"/>
    <text x="${70 + (w - 150) / 4}" y="37" text-anchor="middle" font-family="${figures(lang)}" font-size="26" font-weight="800" fill="${INK}">${esc(weight)}</text>
    <rect x="${80 + (w - 150) / 2}" y="8" width="${(w - 150) / 2}" height="40" rx="9" fill="${PAPER2}"/>
    <text x="${80 + (w - 150) / 2 + (w - 150) / 4}" y="37" text-anchor="middle" font-family="${figures(lang)}" font-size="26" font-weight="800" fill="${INK}">${esc(reps)}</text>
  </g>`;
}

/** Macro bar with a label and value/target. */
function macroBar(lang, x, y, w, label, value, target, color) {
  const ratio = Math.min(1, value / target);
  return `
  <g transform="translate(${x},${y})">
    <text x="0" y="24" font-family="${sans(lang)}" font-size="24" font-weight="800" fill="${INK}">${esc(label)}</text>
    <text x="${w}" y="24" text-anchor="end" font-family="${figures(lang)}" font-size="22" font-weight="700" fill="${MUTED}">${value} / ${target}</text>
    <rect x="0" y="36" width="${w}" height="16" rx="8" fill="${PAPER2}"/>
    <rect x="0" y="36" width="${Math.max(16, w * ratio)}" height="16" rx="8" fill="${color}"/>
  </g>`;
}

/** Small scale glyph for the weigh-in tile. */
function scaleGlyph(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <rect x="0" y="0" width="64" height="64" rx="14" fill="${WHITE}" stroke="${LINE2}" stroke-width="3"/>
    <rect x="14" y="12" width="36" height="20" rx="6" fill="${TEAL_SOFT}" stroke="${TEAL}" stroke-width="3"/>
    <rect x="30" y="16" width="4" height="10" rx="2" fill="${CORAL}"/>
    <rect x="10" y="40" width="44" height="12" rx="6" fill="${PAPER2}"/>
  </g>`;
}

/** Apple glyph for the foods tile. */
function appleGlyph(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <rect x="0" y="0" width="64" height="64" rx="14" fill="${WHITE}" stroke="${LINE2}" stroke-width="3"/>
    <circle cx="26" cy="38" r="15" fill="${CORAL}"/>
    <circle cx="40" cy="38" r="15" fill="${CORAL}"/>
    <rect x="31" y="14" width="4" height="12" rx="2" fill="${INK}"/>
    <ellipse cx="41" cy="18" rx="8" ry="4" fill="${TEAL}" transform="rotate(-30 41 18)"/>
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

function svgFor(job) {
  const { lang, title, subtitle, badge, sessionLabel, exercise, sets, prLabel, prValue, e1rmLabel, e1rmValue, macros, weighLabel, weighValue, foodLabel, foodValue } = job;
  const titleSize = fitSize(title, 820, [84, 76, 68, 60, 54]);
  const subSize = fitSize(subtitle, 1560, [32, 30, 28, 26, 23, 20]);
  const pageY = 56 + titleSize + subSize + 40;
  const pageH = 945 - pageY - 112;
  const badgeSize = fitSize(badge, 380, [30, 27, 24, 22]);
  const badgeW = textWidth(badge, badgeSize) + 56;
  const exSize = fitSize(exercise, 560, [34, 30, 27, 24]);
  const exShown = truncate(exercise, exSize, 560);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <radialGradient id="washA" cx="15%" cy="-10%" r="70%">
      <stop offset="0%" stop-color="${CORAL}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${CORAL}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="washB" cx="90%" cy="0%" r="55%">
      <stop offset="0%" stop-color="${ORANGE}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${ORANGE}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${INK}" flood-opacity="0.10"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="#fff8f3"/>
  <rect width="1800" height="945" fill="url(#washA)"/>
  <rect width="1800" height="945" fill="url(#washB)"/>

  <!-- title block -->
  <g transform="translate(110,56)">
    <g transform="translate(0,${titleSize * 0.12}) scale(${(titleSize * 0.95) / 64})">
      <rect x="6" y="6" width="52" height="52" rx="14" fill="${CORAL}"/>
      <rect x="10" y="10" width="44" height="44" rx="11" fill="#fff8f3"/>
      <rect x="26" y="30" width="12" height="4" rx="2" fill="${INK}"/>
      <rect x="16" y="24" width="7" height="16" rx="2.5" fill="${TEAL}"/>
      <rect x="41" y="24" width="7" height="16" rx="2.5" fill="${TEAL}"/>
      <rect x="12" y="27" width="4" height="10" rx="1.5" fill="${CORAL}"/>
      <rect x="48" y="27" width="4" height="10" rx="1.5" fill="${CORAL}"/>
    </g>
    <text x="${titleSize * 1.15}" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 18}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>
  <!-- sticky note: local only -->
  <g transform="translate(${1690 - badgeW},${66}) rotate(-3)">
    <rect x="0" y="0" width="${badgeW}" height="${badgeSize + 36}" rx="8" fill="${AMBER}"/>
    <text x="${badgeW / 2}" y="${badgeSize + 10}" text-anchor="middle" font-family="${sans(lang)}" font-size="${badgeSize}" font-weight="800" fill="${AMBER_INK}">${esc(badge)}</text>
  </g>

  <!-- the session sheet on the left -->
  <g transform="translate(110,${pageY})" filter="url(#shadow)">
    <rect x="0" y="0" width="760" height="${pageH}" rx="30" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="760" height="8" rx="4" fill="${CORAL}"/>
  </g>
  <g transform="translate(110,${pageY})">
    ${dumbbell(430, 34, 1.0)}
    <text x="40" y="64" font-family="${sans(lang)}" font-size="24" font-weight="800" fill="${MUTED}" letter-spacing="1">${esc(sessionLabel)}</text>
    <text x="40" y="${64 + exSize + 14}" font-family="${sans(lang)}" font-size="${exSize}" font-weight="800" fill="${INK}">${esc(exShown)}</text>
    ${sets.map((s, i) => setRow(lang, 40, 150 + i * 64, 680, i + 1, s[0], s[1])).join("")}
    <g transform="translate(40,${150 + sets.length * 64 + 16})">
      <rect x="0" y="0" width="330" height="86" rx="16" fill="${TEAL_SOFT}" stroke="rgba(13,148,136,0.3)" stroke-width="2"/>
      <text x="20" y="34" font-family="${sans(lang)}" font-size="22" font-weight="800" fill="${MUTED}" letter-spacing="1">${esc(prLabel)}</text>
      <text x="20" y="72" font-family="${figures(lang)}" font-size="34" font-weight="800" fill="${TEAL_DEEP}">${esc(prValue)}</text>
    </g>
    <g transform="translate(390,${150 + sets.length * 64 + 16})">
      <rect x="0" y="0" width="330" height="86" rx="16" fill="${CORAL_SOFT}" stroke="rgba(232,93,76,0.3)" stroke-width="2"/>
      <text x="20" y="34" font-family="${sans(lang)}" font-size="22" font-weight="800" fill="${MUTED}" letter-spacing="1">${esc(e1rmLabel)}</text>
      <text x="20" y="72" font-family="${figures(lang)}" font-size="34" font-weight="800" fill="${CORAL_DEEP}">${esc(e1rmValue)}</text>
    </g>
  </g>

  <!-- macros + weigh-in + foods on the right -->
  <g transform="translate(910,${pageY})" filter="url(#shadow)">
    <rect x="0" y="0" width="780" height="${pageH}" rx="30" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="780" height="8" rx="4" fill="${ORANGE}"/>
  </g>
  <g transform="translate(910,${pageY})">
    ${macros.map((m, i) => macroBar(lang, 40, 44 + i * 78, 700, m.label, m.value, m.target, m.color)).join("")}
    <g transform="translate(40,${44 + macros.length * 78 + 10})">
      <rect x="0" y="0" width="340" height="96" rx="16" fill="${PAPER2}"/>
      ${scaleGlyph(14, 16, 1.0)}
      <text x="92" y="40" font-family="${sans(lang)}" font-size="22" font-weight="800" fill="${MUTED}">${esc(weighLabel)}</text>
      <text x="92" y="76" font-family="${figures(lang)}" font-size="30" font-weight="800" fill="${TEAL_DEEP}">${esc(weighValue)}</text>
    </g>
    <g transform="translate(400,${44 + macros.length * 78 + 10})">
      <rect x="0" y="0" width="340" height="96" rx="16" fill="${ORANGE_SOFT}"/>
      ${appleGlyph(14, 16, 1.0)}
      <text x="92" y="40" font-family="${sans(lang)}" font-size="22" font-weight="800" fill="${MUTED}">${esc(foodLabel)}</text>
      <text x="92" y="76" font-family="${figures(lang)}" font-size="${fitSize(foodValue, 232, [28, 26, 24, 22, 20])}" font-weight="800" fill="#9a3412">${esc(foodValue)}</text>
    </g>
  </g>

  ${promises(lang, job.promises, 110, 945 - 40 - 50)}
</svg>`;
}

/** App icon: the dumbbell on a coral tile, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde4df"/>
      <stop offset="100%" stop-color="#fff8f3"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="48" y="48" width="416" height="416" rx="112" fill="${CORAL}"/>
    <rect x="80" y="80" width="352" height="352" rx="88" fill="#fff8f3"/>
    <rect x="208" y="240" width="96" height="32" rx="16" fill="${INK}"/>
    <rect x="128" y="192" width="56" height="128" rx="20" fill="${TEAL}"/>
    <rect x="328" y="192" width="56" height="128" rx="20" fill="${TEAL}"/>
    <rect x="96" y="216" width="32" height="80" rx="12" fill="${CORAL}"/>
    <rect x="384" y="216" width="32" height="80" rx="12" fill="${CORAL}"/>
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
  const SETS = [["60 kg", "8"], ["60 kg", "8"], ["62.5 kg", "6"]];
  const jobs = [
    {
      lang: "ko",
      title: "자이맥",
      subtitle: "무료 로컬 헬스·매크로 기록. 운동(세트×횟수×중량), 하루 칼로리·P/C/F, 체중, PR, 커스텀 음식, JSON 백업. 계정 없음.",
      badge: "데이터는 이 기기에만",
      sessionLabel: "오늘 · 가슴·삼두",
      exercise: "벤치프레스",
      sets: SETS,
      prLabel: "최고 중량",
      prValue: "62.5 kg × 6",
      e1rmLabel: "추정 1RM",
      e1rmValue: "75 kg",
      macros: [
        { label: "칼로리", value: 1840, target: 2630, color: CORAL },
        { label: "단백질", value: 128, target: 150, color: TEAL },
        { label: "탄수화물", value: 210, target: 344, color: ORANGE },
        { label: "지방", value: 52, target: 73, color: GOLD },
      ],
      weighLabel: "체중 · 오늘",
      weighValue: "75.0 kg",
      foodLabel: "내 음식",
      foodValue: "닭가슴살 100g × 1.5",
      promises: ["로그인 없음", "루틴·기록 잠금 없음", "전체 기록 무료", "JSON 백업", "광고 없음", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Gymac",
      subtitle: "Free local gym + macro tracker. Sets × reps × weight, daily calories and P/C/F, weigh-ins, PR history, custom foods, JSON backup. No account.",
      badge: "Data stays on this device",
      sessionLabel: "TODAY · PUSH DAY",
      exercise: "Bench Press",
      sets: SETS,
      prLabel: "HEAVIEST",
      prValue: "62.5 kg × 6",
      e1rmLabel: "EST. 1RM",
      e1rmValue: "75 kg",
      macros: [
        { label: "Calories", value: 1840, target: 2630, color: CORAL },
        { label: "Protein", value: 128, target: 150, color: TEAL },
        { label: "Carbs", value: 210, target: 344, color: ORANGE },
        { label: "Fat", value: 52, target: 73, color: GOLD },
      ],
      weighLabel: "Weigh-in · today",
      weighValue: "75.0 kg",
      foodLabel: "My foods",
      foodValue: "Chicken 100g × 1.5",
      promises: ["No login", "No catalog lock", "Full history free", "JSON backup", "No ads", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ジャイマック",
      subtitle: "無料のローカルジム＆マクロ記録。種目（セット×回数×重量）、1日カロリーとP/C/F、体重、PR、カスタム食品、JSONバックアップ。",
      badge: "データはこの端末だけ",
      sessionLabel: "今日 · 胸・三頭",
      exercise: "ベンチプレス",
      sets: SETS,
      prLabel: "最重量",
      prValue: "62.5 kg × 6",
      e1rmLabel: "推定1RM",
      e1rmValue: "75 kg",
      macros: [
        { label: "カロリー", value: 1840, target: 2630, color: CORAL },
        { label: "タンパク質", value: 128, target: 150, color: TEAL },
        { label: "炭水化物", value: 210, target: 344, color: ORANGE },
        { label: "脂質", value: 52, target: 73, color: GOLD },
      ],
      weighLabel: "体重 · 今日",
      weighValue: "75.0 kg",
      foodLabel: "マイ食品",
      foodValue: "鶏むね 100g × 1.5",
      promises: ["ログイン不要", "ルーティン・履歴ロックなし", "全履歴が無料", "JSONバックアップ", "広告なし", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "健身记",
      subtitle: "免费本地健身与宏量营养记录。动作（组×次数×重量）、每日热量与蛋白/碳/脂、体重、PR、自定义食物、JSON 备份。无需账号。",
      badge: "数据仅在此设备",
      sessionLabel: "今天 · 推日",
      exercise: "卧推",
      sets: SETS,
      prLabel: "最重",
      prValue: "62.5 kg × 6",
      e1rmLabel: "估算 1RM",
      e1rmValue: "75 kg",
      macros: [
        { label: "热量", value: 1840, target: 2630, color: CORAL },
        { label: "蛋白质", value: 128, target: 150, color: TEAL },
        { label: "碳水", value: 210, target: 344, color: ORANGE },
        { label: "脂肪", value: 52, target: 73, color: GOLD },
      ],
      weighLabel: "体重 · 今天",
      weighValue: "75.0 kg",
      foodLabel: "我的食物",
      foodValue: "鸡胸 100g × 1.5",
      promises: ["无需登录", "计划/历史不锁定", "完整历史免费", "JSON 备份", "无广告", "ko/en/ja/zh"],
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
