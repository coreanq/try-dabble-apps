// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Recipelog card: a recipe card on a warm kitchen counter.
 *
 * The product is "every recipe in one place, on this device", so the picture
 * is a cream recipe card lying on terracotta-tinted paper: a photo block with a
 * bowl, the title, a time chip, sage tag pills, three ingredient lines with
 * check boxes, and numbered steps. A small "this device only" tag sits on the
 * corner. Four real jobs (ko/en/ja/zh), each its own SVG → PNG; zh is never an
 * alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 251, g: 245, b: 234, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#33261d";
const MUTED = "#6f5d52";
const LINE = "#e6d6c2";
const LINE2 = "#d8c3a8";
const TERRA = "#c45c26";
const TERRA_DEEP = "#9a4419";
const TERRA_SOFT = "#f6e3d6";
const SAGE = "#7f9a7a";
const SAGE_SOFT = "#e3ebdf";
const AMBER = "#f2c14e";
const AMBER_INK = "#3b2a05";
const CREAM = "#fffdf8";

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

/** Faint kitchen-tile grid so the paper is not flat. */
function tiles() {
  const out = [];
  for (let x = 0; x <= 1800; x += 90) out.push(`<line x1="${x}" y1="0" x2="${x}" y2="945" stroke="${LINE}" stroke-width="1.5" opacity="0.45"/>`);
  for (let y = 0; y <= 945; y += 90) out.push(`<line x1="0" y1="${y}" x2="1800" y2="${y}" stroke="${LINE}" stroke-width="1.5" opacity="0.45"/>`);
  return out.join("");
}

/** The "photo": terracotta block with a bowl of rice and a sprig. */
function dish(x, y, w, h) {
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="24" fill="${TERRA_SOFT}"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="24" fill="url(#photolight)"/>
    <ellipse cx="${w / 2}" cy="${h * 0.66}" rx="${w * 0.34}" ry="${h * 0.12}" fill="rgba(51,38,29,0.12)"/>
    <path d="M${w * 0.18} ${h * 0.5} h${w * 0.64} a${w * 0.32} ${h * 0.28} 0 0 1 -${w * 0.64} 0z" fill="${TERRA}"/>
    <path d="M${w * 0.18} ${h * 0.5} h${w * 0.64} a${w * 0.32} ${h * 0.09} 0 0 1 -${w * 0.64} 0z" fill="${TERRA_DEEP}"/>
    <ellipse cx="${w / 2}" cy="${h * 0.47}" rx="${w * 0.27}" ry="${h * 0.075}" fill="${CREAM}"/>
    <ellipse cx="${w * 0.42}" cy="${h * 0.44}" rx="${w * 0.07}" ry="${h * 0.045}" fill="#f7e2b6"/>
    <ellipse cx="${w * 0.58}" cy="${h * 0.43}" rx="${w * 0.06}" ry="${h * 0.04}" fill="#f7e2b6"/>
    <path d="M${w * 0.5} ${h * 0.4} c 10 -30 40 -50 70 -55 c -5 30 -30 55 -70 55z" fill="${SAGE}"/>
    <path d="M${w * 0.5} ${h * 0.4} c 14 -22 36 -38 62 -46" fill="none" stroke="${SAGE_SOFT}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function pill(x, y, label, size, fill, stroke, color, lang) {
  const w = textWidth(label, size) + 40;
  return {
    w,
    svg: `<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="${size + 22}" rx="${(size + 22) / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <text x="${w / 2}" y="${size + 4}" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${color}">${esc(label)}</text>
    </g>`,
  };
}

/** The fail-fix promise line along the bottom, as pills. */
function promises(lang, items, y) {
  let x = 120;
  const out = [];
  for (const label of items) {
    const p = pill(x, y, label, 26, "#ffffff", LINE2, MUTED, lang);
    out.push(p.svg);
    x += p.w + 14;
  }
  return out.join("");
}

function svgFor(job) {
  const { lang, title, subtitle, recipeTitle, time, servings, tags, ingredients, steps, local } = job;
  const titleSize = fitSize(title, 900, [100, 88, 78, 68, 58]);
  const subSize = fitSize(subtitle, 1100, [38, 34, 31, 28, 25]);
  const rtSize = fitSize(recipeTitle, 560, [54, 48, 42, 38]);
  const localSize = fitSize(local, 300, [28, 25, 23, 21]);
  const cardTop = 110 + titleSize + subSize + 70;
  const cardH = 945 - cardTop - 40 - 90;

  let tagX = 640;
  const tagSvg = tags
    .map((t) => {
      const p = pill(tagX, 118, t, 26, SAGE_SOFT, SAGE, "#3f5a3b", lang);
      tagX += p.w + 12;
      return p.svg;
    })
    .join("");

  const ingSvg = ingredients
    .map(
      (ing, i) => `
      <g transform="translate(640,${190 + i * 52})">
        <rect x="0" y="0" width="30" height="30" rx="8" fill="#ffffff" stroke="${LINE2}" stroke-width="3"/>
        ${i === 0 ? `<path d="M7 15 l6 6 l11 -12" fill="none" stroke="${TERRA}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
        <text x="46" y="25" font-family="${sans(lang)}" font-size="30" font-weight="600" fill="${INK}">${esc(ing)}</text>
      </g>`,
    )
    .join("");

  const stepSvg = steps
    .map(
      (st, i) => `
      <g transform="translate(1110,${190 + i * 52})">
        <circle cx="15" cy="15" r="16" fill="${TERRA}"/>
        <text x="15" y="25" text-anchor="middle" font-family="${figures(lang)}" font-size="24" font-weight="700" fill="${CREAM}">${i + 1}</text>
        <text x="46" y="25" font-family="${sans(lang)}" font-size="30" font-weight="600" fill="${MUTED}">${esc(st)}</text>
      </g>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbf5ea"/>
      <stop offset="100%" stop-color="#f3e6d3"/>
    </linearGradient>
    <linearGradient id="photolight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#33261d" flood-opacity="0.16"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="url(#paper)"/>
  ${tiles()}
  <rect x="0" y="0" width="1800" height="14" fill="${TERRA}"/>

  <g transform="translate(120,110)">
    <text x="0" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 22}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>

  <!-- the recipe card -->
  <g transform="translate(120,${cardTop})" filter="url(#shadow)">
    <rect x="0" y="0" width="1560" height="${cardH}" rx="34" fill="${CREAM}" stroke="${LINE}" stroke-width="3"/>
  </g>
  <g transform="translate(120,${cardTop})">
    ${dish(40, 40, 540, cardH - 80)}

    <text x="640" y="90" font-family="${sans(lang, "URW Gothic")}" font-size="${rtSize}" font-weight="800" fill="${INK}">${esc(recipeTitle)}</text>
    <g transform="translate(1110,44)">
      <rect x="0" y="0" width="${textWidth(time, 26) + 70}" height="48" rx="24" fill="${TERRA_SOFT}" stroke="${TERRA}" stroke-width="2.5"/>
      <circle cx="26" cy="24" r="11" fill="none" stroke="${TERRA_DEEP}" stroke-width="3"/>
      <path d="M26 17 v7 h6" fill="none" stroke="${TERRA_DEEP}" stroke-width="3" stroke-linecap="round"/>
      <text x="${(textWidth(time, 26) + 70) / 2 + 12}" y="33" text-anchor="middle" font-family="${sans(lang)}" font-size="26" font-weight="700" fill="${TERRA_DEEP}">${esc(time)}</text>
    </g>
    <text x="1490" y="78" text-anchor="end" font-family="${sans(lang)}" font-size="26" font-weight="700" fill="${MUTED}">${esc(servings)}</text>
    ${tagSvg}
    ${ingSvg}
    ${stepSvg}

    <!-- corner tag: this device only -->
    <g transform="translate(${1520 - (textWidth(local, localSize) + 60)},${cardH - localSize - 70})">
      <rect x="0" y="0" width="${textWidth(local, localSize) + 60}" height="${localSize + 30}" rx="16" fill="${AMBER}"/>
      <text x="${(textWidth(local, localSize) + 60) / 2}" y="${localSize + 8}" text-anchor="middle" font-family="${sans(lang)}" font-size="${localSize}" font-weight="800" fill="${AMBER_INK}">${esc(local)}</text>
    </g>
  </g>
  ${promises(lang, job.promises, 945 - 40 - 70)}
</svg>`;
}

/** App icon: the terracotta recipe card with the sage tab, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbf5ea"/>
      <stop offset="100%" stop-color="#f3e6d3"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="32" y="144" width="48" height="224" rx="24" fill="${SAGE}"/>
    <rect x="80" y="64" width="352" height="384" rx="56" fill="${TERRA}"/>
    <rect x="120" y="104" width="272" height="304" rx="36" fill="${CREAM}"/>
    <circle cx="256" cy="216" r="72" fill="${SAGE_SOFT}"/>
    <circle cx="256" cy="216" r="44" fill="${TERRA}"/>
    <rect x="168" y="328" width="176" height="20" rx="10" fill="${SAGE}"/>
    <rect x="168" y="368" width="120" height="20" rx="10" fill="${SAGE}"/>
    <ellipse cx="256" cy="472" rx="180" ry="14" fill="rgba(51,38,29,0.12)"/>
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
      title: "레시피로그",
      subtitle: "무료 로컬 레시피 보관함. 제목·사진·시간·태그와 메모를 한곳에. 계정 없음.",
      recipeTitle: "김치볶음밥",
      time: "15분",
      servings: "2인분",
      tags: ["한식", "15분", "도시락"],
      ingredients: ["2컵 밥", "1/2컵 김치", "1큰술 참기름"],
      steps: ["팬을 달군다", "김치를 볶는다", "밥을 넣고 섞는다"],
      local: "이 기기에만 저장",
      promises: ["로그인 초기화 없음", "개수 제한 없음", "광고 없음", "직접·URL·사진", "무료", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Recipelog",
      subtitle: "Free local recipe vault. Title, photo, time, tags and notes in one place. No account.",
      recipeTitle: "Kimchi fried rice",
      time: "15 min",
      servings: "2 servings",
      tags: ["korean", "15 min", "lunchbox"],
      ingredients: ["2 cups cooked rice", "1/2 cup kimchi", "1 tbsp sesame oil"],
      steps: ["Heat the pan", "Fry the kimchi", "Add rice and toss"],
      local: "This device only",
      promises: ["No login wipe", "No catalog lock", "No ads", "Manual+URL+photo", "Free", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "レシピログ",
      subtitle: "無料のローカルレシピ保管庫。タイトル・写真・時間・タグとメモをひとつに。アカウント不要。",
      recipeTitle: "キムチチャーハン",
      time: "15分",
      servings: "2人分",
      tags: ["韓国料理", "15分", "お弁当"],
      ingredients: ["ご飯 2カップ", "キムチ 1/2カップ", "ごま油 大さじ1"],
      steps: ["フライパンを熱する", "キムチを炒める", "ご飯を加えて混ぜる"],
      local: "この端末だけ",
      promises: ["ログイン消失なし", "件数制限なし", "広告なし", "手入力・URL・写真", "無料", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "食谱日志",
      subtitle: "免费本地食谱库。标题、照片、时间、标签和笔记集中一处。无需账号。",
      recipeTitle: "泡菜炒饭",
      time: "15 分钟",
      servings: "2 份",
      tags: ["韩餐", "15分钟", "便当"],
      ingredients: ["2杯 米饭", "1/2杯 泡菜", "1大勺 香油"],
      steps: ["热锅", "炒泡菜", "加入米饭翻炒"],
      local: "仅在此设备",
      promises: ["不会因登录丢数据", "无数量上限", "无广告", "手动+网址+照片", "免费", "ko/en/ja/zh"],
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

  // Maskable art is cropped to a circle on Android, so the card gets its own
  // padded render instead of reusing the edge-to-edge icon.
  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
