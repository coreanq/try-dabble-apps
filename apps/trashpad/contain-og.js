// ESM: package.json is "type": "module".
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Trashpad card: the pad, mid-disappearance.
 * Three tear-off sheets on a putty desk. The first is fresh, the second is
 * running out, the third is already shredding itself under a red countdown
 * stamp. The left column carries the title, the tagline and the five delete
 * timers, because "let me change the 24h" is the whole reason this app exists.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const DESK_RGB = { r: 233, g: 225, b: 205, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#201d17";
const MUTED = "#6a6152";
const PAD = "#fdf5d0";
const PAD_EDGE = "#d9c274";
const GUM = "#dcb84e";
const RULE = "#9db4cf";
const MARGIN = "#cf4a3c";
const GONE = "#b23a2e";
const FRESH = "#3f6f4a";
const SOON = "#a06a12";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rough advance width so one layout survives ko/en/ja/zh without clipping. */
function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.58;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/** Linen speckle: the desk blotter, not a gradient wallpaper. */
function speckle() {
  const out = [];
  let seed = 7717;
  for (let i = 0; i < 150; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.03 + (seed % 6) / 170;
    out.push(`<circle cx="${x}" cy="${y}" r="1.6" fill="rgba(32,29,23,${o.toFixed(3)})"/>`);
  }
  return out.join("");
}

/** A rubber date stamp, knocked off square, holding the time left. */
function stamp(lang, value, label, color, bg) {
  const vW = textWidth(value, 34);
  const lW = textWidth(label, 20);
  const w = Math.max(vW + lW + 58, 190);
  return `
  <g transform="rotate(-5)">
    <rect x="0" y="0" width="${w}" height="62" rx="5" fill="${bg}"/>
    <rect x="0" y="0" width="${w}" height="62" rx="5" fill="none" stroke="${color}" stroke-width="4"/>
    <text x="20" y="43" font-family="${mono(lang)}" font-size="34" font-weight="800" fill="${color}">${esc(value)}</text>
    <text x="${28 + vW}" y="42" font-family="${sans(lang)}" font-size="20" font-weight="700" fill="${color}" opacity="0.9">${esc(label)}</text>
  </g>`;
}

/** Scribble: the note itself, drawn as graphite strokes riding the blue rules. */
function scribble(widths, top, gap) {
  return widths
    .map(
      (w, i) =>
        `<rect x="96" y="${top + i * gap - 16}" width="${w}" height="15" rx="7" fill="rgba(32,29,23,0.62)"/>`,
    )
    .join("");
}

function rules(w, h, top, gap) {
  const out = [];
  for (let y = top; y < h - 24; y += gap) {
    out.push(`<rect x="26" y="${y}" width="${w - 52}" height="2.5" fill="${RULE}" opacity="0.55"/>`);
  }
  return out.join("");
}

/** One tear-off sheet: gum binding, deckled top, blue rules, red margin. */
function sheet(lang, opts) {
  const { x, y, w, h, rot, fade, scrib, stampNode, shred } = opts;
  const gap = 62;
  const top = 128;
  const bumps = [];
  for (let bx = 0; bx < w; bx += 30) {
    bumps.push(`<circle cx="${bx + 15}" cy="18" r="15" fill="${PAD}"/>`);
  }
  return `
  <g transform="translate(${x},${y}) rotate(${rot})" opacity="${fade}">
    <rect x="10" y="16" width="${w}" height="${h}" rx="6" fill="rgba(32,29,23,0.16)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="${PAD}" stroke="${PAD_EDGE}" stroke-width="3"/>
    <rect x="0" y="0" width="${w}" height="52" fill="${GUM}"/>
    <g>${bumps.join("")}</g>
    <rect x="0" y="52" width="${w}" height="4" fill="rgba(32,29,23,0.18)" stroke-dasharray="10 8"/>
    ${rules(w, h, top, gap)}
    <rect x="76" y="72" width="3.5" height="${h - 108}" fill="${MARGIN}" opacity="0.75"/>
    ${scribble(scrib, top, gap)}
    ${shred || ""}
    <g transform="translate(28,${h - 104})">${stampNode}</g>
  </g>`;
}

/** The bottom of the last sheet, already through the shredder. */
function shreds(w, h) {
  const out = [];
  let seed = 4211;
  for (let i = 0; i < 34; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = 10 + (seed % (w - 40));
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const drop = 6 + (seed % 190);
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const rot = (seed % 70) - 35;
    out.push(
      `<g transform="translate(${x},${h - 54 + drop}) rotate(${rot})"><rect x="0" y="0" width="38" height="13" rx="6" fill="${PAD}" stroke="${PAD_EDGE}" stroke-width="2"/></g>`,
    );
  }
  return `<rect x="10" y="${h - 58}" width="${w - 20}" height="58" fill="${DESK_HEX}"/>${out.join("")}`;
}

const DESK_HEX = "#e9e1cd";

/** The five delete timers, drawn as punch-card chips with 24h struck. */
function chips(lang, labels, activeIndex) {
  let x = 0;
  const out = [];
  labels.forEach((label, i) => {
    const w = Math.round(textWidth(label, 30)) + 44;
    const on = i === activeIndex;
    out.push(`
    <g transform="translate(${x},0)">
      <rect x="0" y="0" width="${w}" height="60" rx="3" fill="${on ? PAD : "#f1ead9"}" stroke="${on ? INK : "#c9bb9a"}" stroke-width="${on ? 3.5 : 2}"/>
      <text x="${w / 2}" y="41" text-anchor="middle" font-family="${sans(lang)}" font-size="30" font-weight="${on ? 800 : 600}" fill="${on ? INK : MUTED}">${esc(label)}</text>
    </g>`);
    x += w + 16;
  });
  return out.join("");
}

function svgFor(job) {
  const { lang, title, tagline, presets, noSave, foot, leftWord, times } = job;
  const titleSize = fitSize(title, 740, [110, 96, 84, 74, 64]);
  const tagSize = fitSize(tagline, 740, [38, 34, 30, 27, 24]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="desk" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#f2ebd9"/>
      <stop offset="55%" stop-color="#e9e1cd"/>
      <stop offset="100%" stop-color="#ddd3ba"/>
    </linearGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#desk)"/>
  ${speckle()}

  ${sheet(lang, {
    x: 866, y: 66, w: 420, h: 580, rot: -6, fade: 1,
    scrib: [244, 190, 272, 160],
    stampNode: stamp(lang, times[0], leftWord, FRESH, "#dde9d9"),
  })}

  ${sheet(lang, {
    x: 1188, y: 158, w: 396, h: 552, rot: 3, fade: 1,
    scrib: [222, 262, 172],
    stampNode: stamp(lang, times[1], leftWord, SOON, "#f6e6c2"),
  })}

  ${sheet(lang, {
    x: 1452, y: 268, w: 330, h: 470, rot: 10, fade: 0.9,
    scrib: [186, 226],
    stampNode: stamp(lang, times[2], leftWord, GONE, "#f7dcd6"),
    shred: shreds(330, 470),
  })}

  <g transform="translate(80,186)">
    <text x="0" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <rect x="2" y="${titleSize + 26}" width="${Math.min(740, textWidth(title, titleSize))}" height="7" fill="${MARGIN}"/>
    <text x="0" y="${titleSize + 112}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${MUTED}">${esc(tagline)}</text>
    <g transform="translate(0,${titleSize + 174})">${chips(lang, presets, 2)}</g>
    <g transform="translate(0,${titleSize + 282})">
      <rect x="0" y="0" width="116" height="48" rx="4" fill="#f1ead9" stroke="${MUTED}" stroke-width="3"/>
      <text x="58" y="33" text-anchor="middle" font-family="${mono(lang)}" font-size="24" font-weight="800" fill="${MUTED}" letter-spacing="2">SAVE</text>
      <path d="M-8 54 L124 -6" stroke="${GONE}" stroke-width="7" stroke-linecap="round"/>
      <text x="140" y="34" font-family="${sans(lang)}" font-size="32" font-weight="700" fill="${GONE}">${esc(noSave)}</text>
    </g>
    <text x="0" y="${titleSize + 402}" font-family="${sans(lang)}" font-size="27" font-weight="600" fill="${MUTED}" opacity="0.95">${esc(foot)}</text>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#e9e1cd"/>
  <g transform="translate(74,58)">
    <rect x="26" y="26" width="300" height="392" rx="14" fill="rgba(32,29,23,0.16)"/>
    <rect x="10" y="6" width="300" height="392" rx="14" fill="#fdf5d0" stroke="#d9c274" stroke-width="8"/>
    <rect x="10" y="6" width="300" height="46" rx="10" fill="#dcb84e"/>
    <rect x="10" y="58" width="300" height="6" fill="rgba(32,29,23,0.2)"/>
    <rect x="72" y="76" width="5" height="316" fill="#cf4a3c"/>
    <g fill="#9db4cf">
      <rect x="34" y="132" width="252" height="9" rx="4"/>
      <rect x="34" y="196" width="252" height="9" rx="4"/>
      <rect x="34" y="260" width="252" height="9" rx="4"/>
    </g>
    <g fill="rgba(32,29,23,0.6)">
      <rect x="96" y="110" width="150" height="16" rx="8"/>
      <rect x="96" y="174" width="118" height="16" rx="8"/>
      <rect x="96" y="238" width="164" height="16" rx="8"/>
    </g>
    <circle cx="262" cy="332" r="74" fill="#f7dcd6" stroke="#b23a2e" stroke-width="16"/>
    <path d="M262 288 V332 L296 352" fill="none" stroke="#b23a2e" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: DESK_RGB })
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
      title: "휴지패드",
      tagline: "적으면 남고, 시간이 지나면 지워집니다",
      presets: ["1시간", "6시간", "24시간", "48시간", "7일"],
      noSave: "저장 버튼 없음",
      foot: "계정 없음 · 구독 없음 · 이 기기에만",
      leftWord: "남음",
      times: ["23h 58m", "05h 12m", "00m 09s"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Trashpad",
      tagline: "Type it. It stays. Then it disappears.",
      presets: ["1h", "6h", "24h", "48h", "7d"],
      noSave: "No Save button",
      foot: "No account · No subscription · This device only",
      leftWord: "left",
      times: ["23h 58m", "05h 12m", "00m 09s"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "消えるメモ",
      tagline: "書けば残る。時間が来たら消える。",
      presets: ["1時間", "6時間", "24時間", "48時間", "7日"],
      noSave: "保存ボタンなし",
      foot: "アカウントなし · 定額課金なし · この端末だけ",
      leftWord: "残り",
      times: ["23h 58m", "05h 12m", "00m 09s"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "废纸便签",
      tagline: "写下来会留下，时间到了就消失。",
      presets: ["1小时", "6小时", "24小时", "48小时", "7天"],
      noSave: "没有保存按钮",
      foot: "无需账户 · 没有订阅 · 只在此设备",
      leftWord: "剩余",
      times: ["23h 58m", "05h 12m", "00m 09s"],
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
  const iconBuf = Buffer.from(iconSvg());
  await sharp(iconBuf).resize(192, 192, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-192.png"));
  await sharp(iconBuf).resize(512, 512, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-512.png"));
  await sharp(iconBuf).resize(180, 180, { fit: "cover" }).png().toFile(path.join(ICONS, "apple-touch-icon.png"));
  await sharp(iconBuf).resize(32, 32, { fit: "cover" }).png().toFile(path.join(OUT, "favicon.ico"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
