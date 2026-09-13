// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * PetPlay card: a cute pet on a peach lawn.
 *
 * The product is "a digital pet with no generative AI", so the picture is
 * the pet itself drawn from the same kind of flat SVG parts the app uses: a
 * round cat with a bow on a mint lawn, a speech bubble, four needs bars and
 * the four care buttons, plus the promise pills. Four real jobs (ko/en/ja/zh),
 * each its own SVG → PNG; zh is never an alias of en. No photos, no generated
 * art, no model anywhere in this file.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 255, g: 245, b: 240, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#3b2a2a";
const MUTED = "#8a6a6a";
const LINE = "#ffe0e6";
const LINE2 = "#f7c5d0";
const BLUSH = "#ffd6e0";
const CORAL = "#fb7185";
const CORAL_DEEP = "#e11d48";
const MINT = "#2dd4bf";
const TEAL_DEEP = "#0f766e";
const SUN = "#fbbf24";
const SKY = "#60a5fa";
const PAPER2 = "#ffe9e0";
const AMBER = "#f5c65b";
const AMBER_INK = "#3b2a05";
const WHITE = "#ffffff";
const EDGE = "rgba(59,42,42,0.14)";

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

/** The pet: a round cat with pointy ears, smiling eyes, a bow and a curly tail. */
function cat(x, y, scale, primary, secondary, accent) {
  return `
  <g transform="translate(${x},${y}) scale(${scale})">
    <ellipse cx="100" cy="184" rx="52" ry="8" fill="rgba(59,42,42,0.10)"/>
    <path d="M132 150 q34 -18 10 -46" fill="none" stroke="${primary}" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="100" cy="142" rx="44" ry="37" fill="${primary}" stroke="${EDGE}"/>
    <ellipse cx="100" cy="150" rx="24" ry="22" fill="${secondary}" opacity="0.9"/>
    <ellipse cx="80" cy="176" rx="12" ry="7" fill="${primary}" stroke="${EDGE}"/>
    <ellipse cx="120" cy="176" rx="12" ry="7" fill="${primary}" stroke="${EDGE}"/>
    <g transform="translate(100,84)">
      <polygon points="-44,14 -30,-36 -8,4" fill="${primary}" stroke="${EDGE}" stroke-linejoin="round"/>
      <polygon points="44,14 30,-36 8,4" fill="${primary}" stroke="${EDGE}" stroke-linejoin="round"/>
      <polygon points="-34,8 -27,-20 -14,2" fill="${secondary}"/>
      <polygon points="34,8 27,-20 14,2" fill="${secondary}"/>
      <circle cx="0" cy="0" r="42" fill="${primary}" stroke="${EDGE}"/>
      <polygon points="-3.5,8 3.5,8 0,12" fill="#f9a8b8"/>
      <line x1="13" y1="10" x2="36" y2="7" stroke="${INK}" stroke-width="1.4" opacity="0.7" stroke-linecap="round"/>
      <line x1="13" y1="14" x2="36" y2="16" stroke="${INK}" stroke-width="1.4" opacity="0.7" stroke-linecap="round"/>
      <line x1="-13" y1="10" x2="-36" y2="7" stroke="${INK}" stroke-width="1.4" opacity="0.7" stroke-linecap="round"/>
      <line x1="-13" y1="14" x2="-36" y2="16" stroke="${INK}" stroke-width="1.4" opacity="0.7" stroke-linecap="round"/>
      <path d="M-24 -1 q8 -10 16 0" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M8 -1 q8 -10 16 0" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M-8 15 q8 9 16 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <g transform="translate(76,116)">
      <polygon points="-12,-8 0,0 -12,8" fill="${accent}" stroke="${EDGE}" stroke-linejoin="round"/>
      <polygon points="12,-8 0,0 12,8" fill="${accent}" stroke="${EDGE}" stroke-linejoin="round"/>
      <circle cx="0" cy="0" r="3.4" fill="${CORAL_DEEP}"/>
    </g>
  </g>`;
}

/** A small dog for the corner: floppy ears, collar, round eyes. */
function dog(x, y, scale, primary, secondary, accent) {
  return `
  <g transform="translate(${x},${y}) scale(${scale})">
    <ellipse cx="100" cy="146" rx="50" ry="38" fill="${primary}" stroke="${EDGE}"/>
    <ellipse cx="100" cy="154" rx="27" ry="23" fill="${secondary}" opacity="0.9"/>
    <ellipse cx="78" cy="182" rx="12" ry="7" fill="${primary}" stroke="${EDGE}"/>
    <ellipse cx="122" cy="182" rx="12" ry="7" fill="${primary}" stroke="${EDGE}"/>
    <g transform="translate(100,84)">
      <g transform="translate(-38,-7) rotate(-14)"><ellipse cx="0" cy="13" rx="13" ry="27" fill="${primary}" stroke="${EDGE}"/></g>
      <g transform="translate(38,-7) rotate(14)"><ellipse cx="0" cy="13" rx="13" ry="27" fill="${primary}" stroke="${EDGE}"/></g>
      <circle cx="0" cy="0" r="44" fill="${primary}" stroke="${EDGE}"/>
      <ellipse cx="0" cy="13" rx="15" ry="11" fill="${secondary}"/>
      <ellipse cx="0" cy="9" rx="5" ry="4" fill="${INK}"/>
      <ellipse cx="0" cy="22" rx="4" ry="5" fill="${CORAL}"/>
      <circle cx="-17" cy="-2" r="7" fill="${INK}"/><circle cx="-14" cy="-5" r="2.5" fill="${WHITE}"/>
      <circle cx="17" cy="-2" r="7" fill="${INK}"/><circle cx="20" cy="-5" r="2.5" fill="${WHITE}"/>
    </g>
    <rect x="66" y="116" width="68" height="8" rx="4" fill="${accent}" stroke="${EDGE}"/>
    <circle cx="100" cy="127" r="4.5" fill="${AMBER}" stroke="${EDGE}"/>
  </g>`;
}

/** One needs bar. */
function needBar(lang, x, y, w, label, value, color) {
  return `
  <g transform="translate(${x},${y})">
    <text x="0" y="24" font-family="${sans(lang)}" font-size="24" font-weight="800" fill="${INK}">${esc(label)}</text>
    <text x="${w}" y="24" text-anchor="end" font-family="${figures(lang)}" font-size="22" font-weight="700" fill="${MUTED}">${value}</text>
    <rect x="0" y="36" width="${w}" height="18" rx="9" fill="${PAPER2}"/>
    <rect x="0" y="36" width="${Math.max(18, (w * value) / 100)}" height="18" rx="9" fill="${color}"/>
  </g>`;
}

/** One care button. */
function careBtn(lang, x, y, w, label, fill, deep, ink) {
  const size = fitSize(label, w - 20, [26, 24, 22, 20, 18]);
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="4" width="${w}" height="66" rx="18" fill="${deep}"/>
    <rect x="0" y="0" width="${w}" height="66" rx="18" fill="${fill}" stroke="${deep}" stroke-width="2"/>
    <text x="${w / 2}" y="42" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="800" fill="${ink}">${esc(label)}</text>
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
  const { lang, title, subtitle, badge, petName, say, mood, needs, care } = job;
  const titleSize = fitSize(title, 820, [84, 76, 68, 60, 54]);
  const subSize = fitSize(subtitle, 1560, [32, 30, 28, 26, 23, 20]);
  const pageY = 56 + titleSize + subSize + 40;
  const pageH = 945 - pageY - 112;
  const badgeSize = fitSize(badge, 380, [30, 27, 24, 22]);
  const badgeW = textWidth(badge, badgeSize) + 56;
  const saySize = fitSize(say, 520, [28, 26, 24, 22, 20]);
  const sayW = textWidth(say, saySize) + 48;
  const nameSize = fitSize(petName, 300, [40, 36, 32]);
  const moodW = textWidth(mood, 24) + 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <radialGradient id="washA" cx="12%" cy="-10%" r="70%">
      <stop offset="0%" stop-color="${BLUSH}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${BLUSH}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="washB" cx="92%" cy="0%" r="55%">
      <stop offset="0%" stop-color="${MINT}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${MINT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lawn" cx="50%" cy="100%" r="70%">
      <stop offset="0%" stop-color="${MINT}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${MINT}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${CORAL_DEEP}" flood-opacity="0.10"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="#fff5f0"/>
  <rect width="1800" height="945" fill="url(#washA)"/>
  <rect width="1800" height="945" fill="url(#washB)"/>

  <!-- title block -->
  <g transform="translate(110,56)">
    <g transform="translate(0,${titleSize * 0.12}) scale(${(titleSize * 0.95) / 64})">
      <rect x="6" y="6" width="52" height="52" rx="16" fill="${BLUSH}"/>
      <polygon points="18,30 22,12 34,24" fill="${CORAL}"/>
      <polygon points="46,30 42,12 30,24" fill="${CORAL}"/>
      <circle cx="32" cy="34" r="17" fill="#fff5f0" stroke="${CORAL}" stroke-width="2.5"/>
      <circle cx="26" cy="32" r="2.4" fill="${INK}"/>
      <circle cx="38" cy="32" r="2.4" fill="${INK}"/>
      <path d="M27 39 q5 5 10 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="47" cy="47" r="6" fill="${MINT}"/>
    </g>
    <text x="${titleSize * 1.15}" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 18}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>
  <!-- sticky note: local only -->
  <g transform="translate(${1690 - badgeW},${66}) rotate(-3)">
    <rect x="0" y="0" width="${badgeW}" height="${badgeSize + 36}" rx="8" fill="${AMBER}"/>
    <text x="${badgeW / 2}" y="${badgeSize + 10}" text-anchor="middle" font-family="${sans(lang)}" font-size="${badgeSize}" font-weight="800" fill="${AMBER_INK}">${esc(badge)}</text>
  </g>

  <!-- the stage on the left -->
  <g transform="translate(110,${pageY})" filter="url(#shadow)">
    <rect x="0" y="0" width="760" height="${pageH}" rx="34" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="760" height="10" rx="5" fill="${BLUSH}"/>
  </g>
  <g transform="translate(110,${pageY})">
    <rect x="3" y="${pageH * 0.35}" width="754" height="${pageH * 0.65 - 3}" rx="30" fill="url(#lawn)"/>
    <g transform="translate(${380 - sayW / 2},30)">
      <rect x="0" y="0" width="${sayW}" height="${saySize + 28}" rx="${(saySize + 28) / 2}" fill="${WHITE}" stroke="${LINE2}" stroke-width="2.5"/>
      <text x="${sayW / 2}" y="${saySize + 8}" text-anchor="middle" font-family="${sans(lang)}" font-size="${saySize}" font-weight="700" fill="${INK}">${esc(say)}</text>
    </g>
    ${cat(200, 80, 1.9, "#4a4a4a", "#f2f2f2", MINT)}
    ${dog(560, 200, 0.95, "#c9a27a", "#fff5f0", CORAL)}
    <text x="380" y="${pageH - 52}" text-anchor="middle" font-family="${sans(lang, "URW Gothic")}" font-size="${nameSize}" font-weight="800" fill="${INK}">${esc(petName)}</text>
    <g transform="translate(${380 - moodW / 2},${pageH - 40})">
      <rect x="0" y="0" width="${moodW}" height="34" rx="17" fill="#ccfbf1"/>
      <text x="${moodW / 2}" y="24" text-anchor="middle" font-family="${sans(lang)}" font-size="22" font-weight="800" fill="${TEAL_DEEP}">${esc(mood)}</text>
    </g>
  </g>

  <!-- needs + care on the right -->
  <g transform="translate(910,${pageY})" filter="url(#shadow)">
    <rect x="0" y="0" width="780" height="${pageH}" rx="34" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
    <rect x="0" y="0" width="780" height="10" rx="5" fill="${MINT}"/>
  </g>
  <g transform="translate(910,${pageY})">
    ${needs.map((m, i) => needBar(lang, 40, 44 + i * 78, 700, m.label, m.value, m.color)).join("")}
    ${careBtn(lang, 40, 44 + needs.length * 78 + 18, 165, care[0], CORAL, CORAL_DEEP, WHITE)}
    ${careBtn(lang, 218, 44 + needs.length * 78 + 18, 165, care[1], SUN, "#d97706", "#3b2a05")}
    ${careBtn(lang, 396, 44 + needs.length * 78 + 18, 165, care[2], MINT, TEAL_DEEP, "#063f3a")}
    ${careBtn(lang, 574, 44 + needs.length * 78 + 18, 166, care[3], SKY, "#1d4ed8", WHITE)}
  </g>

  ${promises(lang, job.promises, 110, 945 - 40 - 50)}
</svg>`;
}

/** App icon: the cat face on a blush tile, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe4e9"/>
      <stop offset="100%" stop-color="#fff5f0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="48" y="48" width="416" height="416" rx="128" fill="${BLUSH}"/>
    <polygon points="144,240 176,96 272,192" fill="${CORAL}"/>
    <polygon points="368,240 336,96 240,192" fill="${CORAL}"/>
    <circle cx="256" cy="272" r="136" fill="#fff5f0" stroke="${CORAL}" stroke-width="20"/>
    <circle cx="208" cy="256" r="19" fill="${INK}"/>
    <circle cx="304" cy="256" r="19" fill="${INK}"/>
    <path d="M216 312 q40 40 80 0" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>
    <circle cx="376" cy="376" r="48" fill="${MINT}"/>
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
      title: "펫플레이",
      subtitle: "생성형 AI 없는 무료 로컬 디지털 펫. 파츠·색 또는 내 사진(기기에서 자르고 색 입힘)으로 스프라이트, 먹이·놀아주기, JSON 백업.",
      badge: "데이터는 이 기기에만",
      petName: "모찌",
      say: "최고의 하루예요!",
      mood: "행복해요",
      needs: [
        { label: "배부름", value: 82, color: CORAL },
        { label: "행복", value: 90, color: SUN },
        { label: "기운", value: 71, color: MINT },
        { label: "청결", value: 64, color: SKY },
      ],
      care: ["먹이 주기", "놀아주기", "쓰다듬기", "씻기기"],
      promises: ["꾸미기 전부 무료", "생성형 AI 없음", "탭 안에서 돌보기", "JSON 백업", "로그인 없음", "광고 없음", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "PetPlay",
      subtitle: "Free local digital pet — no generative AI. Sprite from parts or your photo (crop & tint on this device), feed and play, JSON backup.",
      badge: "Data stays on this device",
      petName: "Mochi",
      say: "Best day ever!",
      mood: "Happy",
      needs: [
        { label: "Fullness", value: 82, color: CORAL },
        { label: "Happiness", value: 90, color: SUN },
        { label: "Energy", value: 71, color: MINT },
        { label: "Clean", value: 64, color: SKY },
      ],
      care: ["Feed", "Play", "Pet", "Clean"],
      promises: ["Free custom", "No generative AI", "Care loop in-tab", "JSON backup", "No login", "No ads", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ペットプレイ",
      subtitle: "生成AIなしの無料ローカルデジタルペット。パーツと色、または自分の写真（端末で切り抜き＆色付け）でスプライト、ごはんと遊び、JSONバックアップ。",
      badge: "データはこの端末だけ",
      petName: "もち",
      say: "最高の一日！",
      mood: "ごきげん",
      needs: [
        { label: "満腹", value: 82, color: CORAL },
        { label: "幸せ", value: 90, color: SUN },
        { label: "元気", value: 71, color: MINT },
        { label: "きれい", value: 64, color: SKY },
      ],
      care: ["ごはん", "遊ぶ", "なでる", "洗う"],
      promises: ["カスタマイズ全部無料", "生成AIなし", "お世話はタブ内で", "JSONバックアップ", "ログイン不要", "広告なし", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "宠玩",
      subtitle: "无生成式 AI 的免费本地电子宠物。用部件和颜色，或自己的照片（本机裁剪上色）做精灵，喂食玩耍，JSON 备份。",
      badge: "数据仅在此设备",
      petName: "麻薯",
      say: "今天太棒了！",
      mood: "开心",
      needs: [
        { label: "饱腹", value: 82, color: CORAL },
        { label: "快乐", value: 90, color: SUN },
        { label: "精力", value: 71, color: MINT },
        { label: "清洁", value: 64, color: SKY },
      ],
      care: ["喂食", "玩耍", "抚摸", "洗澡"],
      promises: ["装扮全部免费", "无生成式 AI", "照顾循环在标签页内", "JSON 备份", "无需登录", "无广告", "ko/en/ja/zh"],
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
