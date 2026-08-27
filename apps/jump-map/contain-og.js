// ESM: package.json is "type": "module" since the Vite rewrite.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Block Jumper card: one frame of the game, drawn on the game's own grid.
 * Four theme columns run left to right — underground, ground, sky, space — with
 * dithered seams between them, and the runner is caught mid-arc over the seam.
 * Everything snaps to a 15px cell and renders with crispEdges: no soft shapes.
 */

const OUT = path.join(import.meta.dirname, "public");
const NIGHT = { r: 20, g: 16, b: 34, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const U = 15;
const PANEL = "#f2f0ff";
const INK = "#191430";
const HERO = "#ffd23f";
const HERO_DK = "#e0921c";
const PINK = "#f0688a";

const BANDS = [
  { x0: 0, x1: 456, sky: "#241d3a", deep: "#171227", plat: "#7d5aa8", cap: "#c79bf0" },
  { x0: 456, x1: 900, sky: "#7cc0e8", deep: "#5aa7d6", plat: "#8a5a34", cap: "#6cbf5a" },
  { x0: 900, x1: 1344, sky: "#bfe4f7", deep: "#9ed2f0", plat: "#e8eef7", cap: "#ffffff" },
  { x0: 1344, x1: 1800, sky: "#141a33", deep: "#0d1226", plat: "#4a56b8", cap: "#8fa0ff" },
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.58;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

const snap = (v) => Math.round(v / U) * U;

function px(x, y, w, h, fill, opacity) {
  return `<rect x="${snap(x)}" y="${snap(y)}" width="${snap(w)}" height="${snap(h)}" fill="${fill}"${opacity ? ` opacity="${opacity}"` : ""}/>`;
}

/** Bayer-dithered seam: how a pixel game blends two palettes. */
function dither(x, fromFill, toFill) {
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const cols = 8;
  const out = [];
  for (let c = 0; c < cols; c++) {
    const density = (c + 1) / (cols + 1);
    for (let r = 0; r < 63; r++) {
      const on = density > (BAYER[r % 4][c % 4] + 0.5) / 16;
      out.push(px(x + (c - cols / 2) * U, r * U, U, U, on ? toFill : fromFill));
    }
  }
  return out.join("");
}

function stars(x0, x1, seed0) {
  const out = [];
  let seed = seed0;
  for (let i = 0; i < 42; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = x0 + (seed % (x1 - x0));
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 780;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    out.push(px(x, y, U, U, "#eef1ff", seed % 4 === 0 ? 0.9 : 0.35));
  }
  return out.join("");
}

/** A platform: outlined body with a bright cap row, the way the game draws it. */
function platform(x, y, cells, band) {
  const w = cells * U;
  return `
    ${px(x - U, y - U, w + U * 2, U * 5 + U * 2, INK, 0.55)}
    ${px(x, y, w, U * 5, band.plat)}
    ${px(x, y, w, U, band.cap)}
    ${px(x, y + U, w, U, "rgba(255,255,255,0.18)")}
    ${px(x, y + U * 4, w, U, "rgba(0,0,0,0.30)")}`;
}

/** The floor each theme column stands on. */
function floor(band) {
  return `
    ${px(band.x0, 855, band.x1 - band.x0, 90, band.plat)}
    ${px(band.x0, 855, band.x1 - band.x0, U, band.cap)}
    ${px(band.x0, 855 + U, band.x1 - band.x0, U, "rgba(255,255,255,0.14)")}`;
}

function runner(x, y) {
  return `
  <g>
    ${px(x - U, y - U, U * 6, U * 6, INK, 0.5)}
    ${px(x, y, U * 4, U * 4, HERO)}
    ${px(x, y + U * 3, U * 4, U, HERO_DK)}
    ${px(x + U, y + U, U, U, INK)}
    ${px(x + U * 3, y + U, U, U, INK)}
    ${px(x + U, y + U * 2, U * 2, U, INK)}
    ${px(x - U, y + U * 4, U, U * 2, HERO_DK)}
    ${px(x + U * 4, y + U * 4, U, U * 2, HERO_DK)}
  </g>`;
}

function arc(points) {
  return points
    .map(([x, y], i) => px(x, y, U, U, HERO, 0.22 + i * 0.18))
    .join("");
}

function crystal(x, y, h, fill) {
  return `
    ${px(x, y, U * 2, h, fill)}
    ${px(x + U * 2, y + U * 2, U * 2, h - U * 2, fill)}
    ${px(x, y, U, U, "#ffffff", 0.5)}
    ${px(x, y + h - U, U * 4, U, "rgba(0,0,0,0.30)")}`;
}

function panel(lang, title, subtitle) {
  const w = 645;
  const titleSize = fitSize(title, w - 96, [74, 64, 56, 48, 42]);
  const subSize = fitSize(subtitle, w - 96, [28, 25, 22, 20]);
  const h = 234;
  const x = 60;
  const y = 618;
  return `
  <g>
    ${px(x + U, y + U, w, h, "#000000", 0.45)}
    ${px(x, y, w, h, PANEL)}
    ${px(x, y, w, U, INK)}
    ${px(x, y + h - U, w, U, INK)}
    ${px(x, y, U, h, INK)}
    ${px(x + w - U, y, U, h, INK)}
    ${px(x + U * 2, y + U * 2, w - U * 4, U, "#ffffff")}
    <text x="${x + 46}" y="${y + 112 + titleSize * 0.3}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="700" fill="${INK}">${esc(title)}</text>
    <text x="${x + 48}" y="${y + 180 + subSize * 0.3}" font-family="${mono(lang)}" font-size="${subSize}" font-weight="700" fill="#5b5480">${esc(subtitle)}</text>
  </g>`;
}

function themeTag(lang, band, label, dark) {
  const size = 24;
  const w = textWidth(label, size) + 42;
  const cx = (band.x0 + band.x1) / 2;
  return `
  <g>
    ${px(cx - w / 2, 54, w, 54, dark ? "rgba(10,8,22,0.55)" : "rgba(255,255,255,0.62)")}
    <text x="${cx}" y="90" text-anchor="middle" font-family="${mono(lang)}" font-size="${size}" font-weight="800" fill="${dark ? "#dfe4ff" : INK}">${esc(label)}</text>
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, themes } = job;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945" shape-rendering="crispEdges">
  ${BANDS.map((b) => px(b.x0, 0, b.x1 - b.x0, 945, b.sky)).join("")}
  ${dither(456, BANDS[0].sky, BANDS[1].sky)}
  ${dither(900, BANDS[1].sky, BANDS[2].sky)}
  ${dither(1344, BANDS[2].sky, BANDS[3].sky)}
  ${stars(0, 456, 8807)}
  ${stars(1344, 1800, 5501)}

  ${px(1560, 150, U * 6, U * 6, "#f0a35a")}
  ${px(1575, 135, U * 4, U, "#f0a35a")}
  ${px(1575, 240, U * 4, U, "#f0a35a")}
  ${px(1500, 195, U * 12, U, HERO, 0.65)}

  ${px(975, 165, U * 5, U * 3, "#ffffff", 0.9)}
  ${px(1005, 150, U * 6, U * 3, "#ffffff", 0.9)}
  ${px(1155, 270, U * 4, U * 2, "#ffffff", 0.75)}

  ${BANDS.map((b) => floor(b)).join("")}

  ${crystal(120, 435, U * 8, "#c79bf0")}
  ${crystal(255, 510, U * 6, "#8f6ec9")}
  ${crystal(345, 390, U * 7, "#c79bf0")}
  ${px(60, 240, U * 3, U * 2, "#3a2f56")}
  ${px(300, 195, U * 4, U * 2, "#3a2f56")}
  ${px(180, 660, U * 2, U * 2, "#3a2f56")}

  ${platform(510, 570, 6, BANDS[1])}
  ${platform(720, 735, 9, BANDS[1])}
  ${platform(930, 615, 8, BANDS[2])}
  ${platform(1155, 495, 8, BANDS[2])}
  ${platform(1395, 375, 8, BANDS[3])}
  ${platform(1650, 270, 7, BANDS[3])}

  ${px(555, 495, U * 3, U * 3, HERO)}
  ${px(570, 510, U, U, INK)}
  ${px(990, 540, U * 3, U * 3, PINK)}
  ${px(1005, 555, U, U, INK)}
  ${px(1440, 300, U * 3, U * 3, HERO)}
  ${px(1455, 315, U, U, INK)}

  ${arc([[1200, 450], [1245, 405], [1275, 360], [1305, 315]])}
  ${runner(1335, 255)}

  ${themeTag(lang, BANDS[0], themes[0], true)}
  ${themeTag(lang, BANDS[1], themes[1], false)}
  ${themeTag(lang, BANDS[2], themes[2], false)}
  ${themeTag(lang, BANDS[3], themes[3], true)}

  ${panel(lang, title, subtitle)}
</svg>`;
}

const ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect width="32" height="32" fill="#0d0d18"/>
  <rect x="1" y="24" width="12" height="7" fill="#c2703a"/>
  <rect x="19" y="18" width="12" height="7" fill="#c2703a"/>
  <rect x="1" y="24" width="12" height="2" fill="#6cd47c"/>
  <rect x="19" y="18" width="12" height="2" fill="#6cd47c"/>
  <rect x="14" y="29" width="2" height="2" fill="#f0688a"/>
  <rect x="17" y="29" width="2" height="2" fill="#f0688a"/>
  <rect x="24" y="7" width="4" height="4" fill="#ffd23f"/>
  <rect x="10" y="12" width="6" height="6" fill="#59a5ff"/>
  <rect x="9" y="18" width="2" height="4" fill="#59a5ff"/>
  <rect x="15" y="18" width="2" height="4" fill="#59a5ff"/>
  <rect x="11" y="14" width="2" height="2" fill="#eef1ff"/>
  <rect x="14" y="14" width="1" height="2" fill="#eef1ff"/>
  <rect x="4" y="6" width="1" height="1" fill="#eef1ff"/>
  <rect x="28" y="26" width="1" height="1" fill="#eef1ff"/>
</svg>`;

async function icon(size, output) {
  await sharp(Buffer.from(ICON_SVG), { density: 384 })
    .resize(size, size, { kernel: "nearest" })
    .png()
    .toFile(output);
  console.log(output, size + "x" + size);
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: NIGHT })
    .png()
    .toFile(output);
  const m = await sharp(output).metadata();
  if (m.width !== 1200 || m.height !== 630) {
    throw new Error(`bad og size ${output} ${m.width}x${m.height}`);
  }
  console.log(output, m.width, m.height);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    { lang: "ko", title: "블록점퍼", subtitle: "떨어져도 다시 올라섭니다", themes: ["지하", "땅", "하늘", "우주"], files: ["og-image.png", "og-image-ko.png"] },
    { lang: "en", title: "Block Jumper", subtitle: "Fall, land, keep going", themes: ["UNDER", "GROUND", "SKY", "SPACE"], files: ["og-image-en.png"] },
    { lang: "ja", title: "ブロックジャンパー", subtitle: "落ちてもまた登れる", themes: ["地下", "地上", "空", "宇宙"], files: ["og-image-ja.png"] },
    { lang: "zh", title: "方块跳跃者", subtitle: "掉下去也能再站上来", themes: ["地下", "地面", "天空", "宇宙"], files: ["og-image-zh.png"] },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
  await icon(192, path.join(OUT, "icon-192.png"));
  await icon(512, path.join(OUT, "icon-512.png"));
}

main().catch((e) => { console.error(e); process.exit(1); });
