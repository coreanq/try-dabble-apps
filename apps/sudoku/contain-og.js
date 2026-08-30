// ESM: package.json is "type": "module", same as the sibling Vite apps.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Sudoku 3D card: a walnut board on a dark desk, seen from slightly above —
 * the same near-top-down angle the game's own camera uses (board-camera.ts
 * puts it at [0, 10, 4] looking at the origin). A 3×3 box grid of cream
 * ceramic wells sits in the walnut, a handful of them holding ink-numbered
 * tiles, and one tile hangs just above an empty well, about to be set down.
 * Dark and wooden, not omok's washi paper, not jump-map's pixel night, not
 * playset's cream toy tray.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const CANVAS_BG = { r: 0x18, g: 0x12, b: 0x0f, alpha: 1 };

// game-theme.ts: gameColors. Only these five plus their board-tone siblings —
// no color outside this set.
const CANVAS = "#18120f";
const WALNUT = "#5b321f";
const WALNUT_DARK = "#2d1a12";
const WALNUT_LIGHT = "#8a5535";
const CREAM = "#f7f0e2";
const INK = "#34251e";
const VERMILION = "#a7342d";

const CJK = { ko: "KR", ja: "JP" };
const serif = (lang, latin) =>
  `${latin ? latin + ", " : ""}Noto Serif CJK ${CJK[lang] ?? "KR"}, Georgia, serif`;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rough advance width so one layout survives ko/en/ja without clipping. */
function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.58;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/** Start offsets (centred on 0) for 9 cells grouped into 3×3 boxes. */
function axisPositions(cell, gap, boxGap) {
  const starts = [0];
  for (let i = 1; i < 9; i += 1) {
    starts.push(starts[i - 1] + cell + (i % 3 === 0 ? boxGap : gap));
  }
  const span = starts[8] + cell;
  return { starts: starts.map((s) => s - span / 2), span };
}

/** One ceramic tile: cream body, soft walnut shadow, ink digit. */
function tile(x, y, size, digit, lang, extraRotate = 0) {
  const rx = size * 0.16;
  const rot = extraRotate ? ` rotate(${extraRotate})` : "";
  return `
  <g transform="translate(${x},${y})${rot}">
    <rect x="${-size / 2 + 2.5}" y="${-size / 2 + 3.5}" width="${size}" height="${size}" rx="${rx}" fill="${WALNUT_DARK}" opacity="0.4"/>
    <rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="${rx}" fill="${CREAM}"/>
    <text x="0" y="${size * 0.32}" text-anchor="middle" font-family="${serif(lang, "Georgia")}" font-size="${size * 0.62}" font-weight="700" fill="${INK}">${digit}</text>
  </g>`;
}

/** A plain empty well: the cream cell with no tile seated in it. */
function well(x, y, size) {
  const rx = size * 0.16;
  return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" rx="${rx}" fill="${CREAM}"/>`;
}

/** The board illustration: walnut frame, 3×3 box grid, tiles, one descending. */
function board(lang) {
  const CELL = 52;
  const GAP = 5;
  const BOX_GAP = 15;
  const FRAME_PAD = 40;
  const WELL_SIZE = CELL - 3;
  const TILE_SIZE = CELL - 2;

  const cols = axisPositions(CELL, GAP, BOX_GAP);
  const rows = axisPositions(CELL, GAP, BOX_GAP);
  const frameSize = cols.span + FRAME_PAD * 2;
  const half = frameSize / 2;

  // A given puzzle-like scatter — not solved, just plausible.
  const givens = [
    { r: 0, c: 1, d: 4 },
    { r: 0, c: 6, d: 9 },
    { r: 1, c: 3, d: 7 },
    { r: 3, c: 0, d: 2 },
    { r: 3, c: 7, d: 5 },
    { r: 5, c: 5, d: 8 },
    { r: 6, c: 2, d: 3 },
    { r: 7, c: 6, d: 1 },
    { r: 8, c: 4, d: 6 },
  ];
  const fallingCell = { r: 4, c: 4, d: 5 };

  const wells = [];
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      wells.push(well(cols.starts[c] + CELL / 2, rows.starts[r] + CELL / 2, WELL_SIZE));
    }
  }

  const tiles = givens
    .map(({ r, c, d }) => tile(cols.starts[c] + CELL / 2, rows.starts[r] + CELL / 2, TILE_SIZE, d, lang))
    .join("");

  const fx = cols.starts[fallingCell.c] + CELL / 2;
  const fy = rows.starts[fallingCell.r] + CELL / 2;

  // Box-boundary separators: darker walnut bars, thicker than the wood
  // showing between ordinary cells within a box.
  const vSeparators = [2, 5]
    .map((i) => {
      const x = (cols.starts[i] + CELL + cols.starts[i + 1]) / 2;
      return `<rect x="${x - 3.5}" y="${rows.starts[0] - 6}" width="7" height="${rows.span + 12}" rx="3.5" fill="${WALNUT_DARK}"/>`;
    })
    .join("");
  const hSeparators = [2, 5]
    .map((i) => {
      const y = (rows.starts[i] + CELL + rows.starts[i + 1]) / 2;
      return `<rect x="${cols.starts[0] - 6}" y="${y - 3.5}" width="${cols.span + 12}" height="7" rx="3.5" fill="${WALNUT_DARK}"/>`;
    })
    .join("");

  return `
  <g transform="translate(1300,478) rotate(-6)">
    <!-- board thickness, peeking out bottom-right of the frame -->
    <rect x="${-half + 14}" y="${-half + 14}" width="${frameSize}" height="${frameSize}" rx="30" fill="${WALNUT_DARK}"/>
    <!-- walnut frame -->
    <rect x="${-half}" y="${-half}" width="${frameSize}" height="${frameSize}" rx="30" fill="url(#walnutGrain)" stroke="${WALNUT_DARK}" stroke-width="3"/>
    <rect x="${-half + 8}" y="${-half + 8}" width="${frameSize - 16}" height="${frameSize - 16}" rx="22" fill="none" stroke="${WALNUT_DARK}" stroke-width="2" opacity="0.35"/>

    ${wells.join("")}
    ${vSeparators}
    ${hSeparators}
    ${tiles}

    <!-- the landing shadow, a single soft contact shadow on the empty well -->
    <ellipse cx="${fx}" cy="${fy}" rx="24" ry="17" fill="${WALNUT_DARK}" opacity="0.22"/>

    <!-- a couple of motion ticks trailing the falling tile -->
    <path d="M ${fx - 38} ${fy - 96} q 8 14 2 26" fill="none" stroke="${CREAM}" stroke-width="3" stroke-linecap="round" opacity="0.28"/>
    <path d="M ${fx - 20} ${fy - 108} q 7 12 2 22" fill="none" stroke="${CREAM}" stroke-width="3" stroke-linecap="round" opacity="0.2"/>

    ${tile(fx - 8, fy - 74, TILE_SIZE + 8, fallingCell.d, lang, 8)}
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle } = job;
  const titleSize = fitSize(title, 700, [136, 118, 102, 88]);
  const subSize = fitSize(subtitle, 700, [42, 38, 34, 30, 27]);
  const titleY = 420;
  const subY = titleY + titleSize * 0.62 + 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="walnutGrain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${WALNUT_LIGHT}"/>
      <stop offset="52%" stop-color="${WALNUT}"/>
      <stop offset="100%" stop-color="${WALNUT_DARK}"/>
    </linearGradient>
    <radialGradient id="deskGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${WALNUT}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${WALNUT}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1800" height="945" fill="${CANVAS}"/>
  <ellipse cx="1300" cy="478" rx="620" ry="560" fill="url(#deskGlow)"/>

  <rect x="96" y="${titleY - 96}" width="14" height="${titleSize * 0.94}" rx="7" fill="${VERMILION}"/>

  <text x="128" y="${titleY}" font-family="${serif(lang, "Georgia")}" font-size="${titleSize}" font-weight="700" fill="${WALNUT_DARK}" opacity="0.45">${esc(title)}</text>
  <text x="124" y="${titleY - 3}" font-family="${serif(lang, "Georgia")}" font-size="${titleSize}" font-weight="700" fill="${CREAM}">${esc(title)}</text>

  <text x="128" y="${subY}" font-family="${serif(lang, "Georgia")}" font-size="${subSize}" font-weight="400" fill="${CREAM}" opacity="0.75">${esc(subtitle)}</text>

  ${board(lang)}
</svg>`;
}

/** The install icon: just the 3×3 box grid, bold and cream-on-walnut, so it
 * still reads at favicon size — a full 9×9 grid turns to mud under 32px. */
function iconSvg() {
  const CELL = 118;
  const SEP = 18;
  const FRAME_PAD = 34;
  const span = CELL * 3 + SEP * 2;
  const half = span / 2 + FRAME_PAD;
  const starts = [-span / 2, -span / 2 + CELL + SEP, -span / 2 + (CELL + SEP) * 2];

  const cells = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      cells.push(well(starts[c] + CELL / 2, starts[r] + CELL / 2, CELL));
    }
  }
  const digits = [
    { r: 0, c: 2, d: 9 },
    { r: 1, c: 1, d: 5 },
    { r: 2, c: 0, d: 2 },
  ]
    .map(({ r, c, d }) => tile(starts[c] + CELL / 2, starts[r] + CELL / 2, CELL - 10, d, "en"))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="walnutGrain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${WALNUT_LIGHT}"/>
      <stop offset="52%" stop-color="${WALNUT}"/>
      <stop offset="100%" stop-color="${WALNUT_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="${CANVAS}"/>
  <g transform="translate(256,256)">
    <rect x="${-half}" y="${-half}" width="${span + FRAME_PAD * 2}" height="${span + FRAME_PAD * 2}" rx="46" fill="url(#walnutGrain)" stroke="${WALNUT_DARK}" stroke-width="5"/>
    ${cells.join("")}
    ${digits}
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: CANVAS_BG })
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
      title: "스도쿠 3D",
      subtitle: "원목 보드와 세라믹 타일",
      file: "og-image.png",
    },
    {
      lang: "en",
      title: "3D Sudoku",
      subtitle: "A wooden board, ceramic tiles",
      file: "og-image-en.png",
    },
    {
      lang: "ja",
      title: "3D数独",
      subtitle: "木製ボードとセラミックタイル",
      file: "og-image-ja.png",
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    await contain(buf, path.join(OUT, job.file));
  }

  const iconBuf = Buffer.from(iconSvg());
  await sharp(iconBuf).resize(192, 192, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-192.png"));
  await sharp(iconBuf).resize(512, 512, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-512.png"));
  await sharp(iconBuf).resize(180, 180, { fit: "cover" }).png().toFile(path.join(ICONS, "apple-touch-icon.png"));
  await sharp(iconBuf).resize(32, 32, { fit: "cover" }).png().toFile(path.join(OUT, "favicon.ico"));
  console.log("icons written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
