// ESM: package.json is "type": "module", same as the sibling Vite apps.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Playset card: the toy tray with the queue already loaded.
 *
 * The whole product is "pick only the games you want, then they play one after
 * another on their own", so the picture is a shallow tray holding a NUMBERED
 * PLAYLIST of painted blocks — 1, 2, 3, 4 — with arrows running down between
 * them and a play button at the bottom. Beside it, the three gates this app
 * does not have. Warm cream and pastel wood: not a gradient, not a fridge
 * shelf, not a carbon-copy docket.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const CREAM = { r: 253, g: 243, b: 223, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#4b3a26";
const MUTED = "#8a7458";
const SUN = "#ffcf5c";
const SUN2 = "#f6b52f";
const SKY = "#8fcfe8";
const MINT = "#9fdcc0";
const PEACH = "#ffb59d";
const LILAC = "#c9b3f0";
const GRASS = "#7cc79a";
const FELT = "#fffdf6";
const TRAY = "#fff4dd";

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

/** The dot grid of a felt play mat. */
function mat() {
  const out = [];
  for (let y = 26; y < 945; y += 46) {
    for (let x = 26; x < 1800; x += 46) {
      out.push(`<circle cx="${x}" cy="${y}" r="2.6" fill="rgba(75,58,38,0.055)"/>`);
    }
  }
  return out.join("");
}

/** One painted wooden shape from the app's own vocabulary. */
function shape(kind, fill, cx, cy, r) {
  const s = r / 27;
  const g = (body) => `<g transform="translate(${cx},${cy}) scale(${s})">${body}</g>`;
  if (kind === "circle") {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${4 * s}"/>`;
  }
  if (kind === "square") {
    return g(`<rect x="-24" y="-24" width="48" height="48" rx="7" fill="${fill}" stroke="${INK}" stroke-width="4"/>`);
  }
  if (kind === "triangle") {
    return g(`<path d="M0 -27 L26 24 H-26 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`);
  }
  if (kind === "star") {
    return g(
      `<path d="M0 -28 L9 -9 L30 -6 L15 9 L19 30 L0 20 L-19 30 L-15 9 L-30 -6 L-9 -9 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
    );
  }
  if (kind === "heart") {
    return g(
      `<path d="M0 27 C-25 10 -27 -3 -27 -9 A15 15 0 0 1 0 -16 A15 15 0 0 1 27 -9 C27 -3 25 10 0 27 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
    );
  }
  // flower
  const petals = [0, 60, 120, 180, 240, 300]
    .map(
      (d) =>
        `<ellipse cx="0" cy="-17" rx="10" ry="14" fill="${fill}" stroke="${INK}" stroke-width="3.4" transform="rotate(${d})"/>`,
    )
    .join("");
  return g(`${petals}<circle cx="0" cy="0" r="9" fill="${FELT}" stroke="${INK}" stroke-width="3.4"/>`);
}

/** One step of the queue: number chip, painted token, game name. */
function step(lang, x, y, w, n, name, kind, fill) {
  const size = fitSize(name, w - 230, [38, 34, 30, 27, 24]);
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="6" width="${w}" height="102" rx="26" fill="rgba(75,58,38,0.16)"/>
    <rect x="0" y="0" width="${w}" height="102" rx="26" fill="${FELT}" stroke="${INK}" stroke-width="5"/>
    <circle cx="56" cy="51" r="27" fill="${TRAY}" stroke="${INK}" stroke-width="4.5"/>
    <text x="56" y="65" text-anchor="middle" font-family="${sans(lang, "URW Gothic")}" font-size="34" font-weight="800" fill="${INK}">${n}</text>
    <rect x="98" y="12" width="78" height="78" rx="21" fill="${TRAY}" stroke="${INK}" stroke-width="4.5"/>
    ${shape(kind, fill, 137, 51, 26)}
    <text x="196" y="${51 + size * 0.36}" font-family="${sans(lang, "URW Gothic")}" font-size="${size}" font-weight="800" fill="${INK}">${esc(name)}</text>
  </g>`;
}

/** The arrow between two steps: this is the hand-off nobody has to do. */
function link(x, y) {
  return `
  <g transform="translate(${x},${y})">
    <path d="M0 0 v22" stroke="${SUN2}" stroke-width="8" stroke-linecap="round"/>
    <path d="M-13 16 L0 32 L13 16" fill="none" stroke="${SUN2}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/** A gate this app does not have, stamped with a cross. */
function chip(lang, x, y, text) {
  const size = 30;
  const w = textWidth(text, size) + 92;
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="4" width="${w}" height="60" rx="30" fill="rgba(75,58,38,0.14)"/>
    <rect x="0" y="0" width="${w}" height="60" rx="30" fill="#ffe7dc" stroke="#eba98e" stroke-width="4"/>
    <g transform="translate(34,30)" stroke="#c9694a" stroke-width="6" stroke-linecap="round">
      <path d="M-11 -11 L11 11"/><path d="M11 -11 L-11 11"/>
    </g>
    <text x="62" y="${30 + size * 0.36}" font-family="${sans(lang)}" font-size="${size}" font-weight="750" fill="#7a4a2e">${esc(text)}</text>
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, order, games, chips } = job;
  const titleSize = fitSize(title, 780, [104, 92, 80, 70, 60]);
  const subSize = fitSize(subtitle, 800, [38, 34, 31, 28, 25]);

  const TRAY_X = 918;
  const TRAY_W = 812;
  const STEP_X = TRAY_X + 46;
  const STEP_W = TRAY_W - 92;

  const tints = [SUN, SKY, MINT, PEACH];
  const kinds = ["heart", "square", "star", "circle"];
  const steps = games
    .map((name, i) => step(lang, STEP_X, 224 + i * 150, STEP_W, i + 1, name, kinds[i], tints[i]))
    .join("");
  const links = [0, 1, 2].map((i) => link(TRAY_X + TRAY_W / 2, 336 + i * 150)).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe6a8"/>
      <stop offset="100%" stop-color="${SUN}"/>
    </linearGradient>
    <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdf6"/>
      <stop offset="100%" stop-color="#fff2d6"/>
    </linearGradient>
  </defs>

  <rect width="1800" height="945" fill="#fdf3df"/>
  <circle cx="80" cy="-40" r="420" fill="rgba(255,255,255,0.85)"/>
  <circle cx="1790" cy="60" r="300" fill="rgba(143,207,232,0.22)"/>
  <circle cx="60" cy="960" r="330" fill="rgba(201,179,240,0.2)"/>
  <circle cx="1760" cy="930" r="300" fill="rgba(159,220,192,0.24)"/>
  ${mat()}

  <!-- the tray, with the queue already in it -->
  <g>
    <rect x="${TRAY_X}" y="118" width="${TRAY_W}" height="742" rx="54" fill="rgba(75,58,38,0.15)"/>
    <rect x="${TRAY_X}" y="108" width="${TRAY_W}" height="742" rx="54" fill="${TRAY}" stroke="${INK}" stroke-width="7"/>
    <rect x="${TRAY_X + 44}" y="140" width="${TRAY_W - 88}" height="16" rx="8" fill="${SUN}"/>
    <rect x="${TRAY_X + 44 + (TRAY_W - 88) * 0.22}" y="140" width="${(TRAY_W - 88) * 0.22}" height="16" rx="8" fill="${SKY}"/>
    <rect x="${TRAY_X + 44 + (TRAY_W - 88) * 0.44}" y="140" width="${(TRAY_W - 88) * 0.22}" height="16" rx="8" fill="${MINT}"/>
    <rect x="${TRAY_X + 44 + (TRAY_W - 88) * 0.66}" y="140" width="${(TRAY_W - 88) * 0.18}" height="16" rx="8" fill="${PEACH}"/>
    <rect x="${TRAY_X + 44 + (TRAY_W - 88) * 0.84}" y="140" width="${(TRAY_W - 88) * 0.16}" height="16" rx="8" fill="${LILAC}"/>

    <text x="${TRAY_X + TRAY_W / 2}" y="200" text-anchor="middle" font-family="${sans(lang)}" font-size="30" font-weight="800" fill="${MUTED}">${esc(order)}</text>

    ${links}
    ${steps}

    <!-- press play once; the arrows above do the rest -->
    <g transform="translate(${TRAY_X + TRAY_W / 2 - 132},${224 + games.length * 150 + 16})">
      <rect x="0" y="8" width="264" height="96" rx="34" fill="${SUN2}"/>
      <rect x="0" y="0" width="264" height="96" rx="34" fill="url(#sun)" stroke="${INK}" stroke-width="6"/>
      <path d="M104 30 L104 66 L140 48 Z" fill="${INK}"/>
      <circle cx="82" cy="48" r="9" fill="${GRASS}" stroke="${INK}" stroke-width="4"/>
      <circle cx="182" cy="48" r="9" fill="${GRASS}" stroke="${INK}" stroke-width="4"/>
    </g>
  </g>

  <!-- the name, painted on a plank leaning against the tray -->
  <g transform="translate(72,120) rotate(-1.4)">
    <rect x="0" y="10" width="${Math.min(796, textWidth(title, titleSize) + 92)}" height="${titleSize + 58}" rx="28" fill="rgba(75,58,38,0.16)"/>
    <rect x="0" y="0" width="${Math.min(796, textWidth(title, titleSize) + 92)}" height="${titleSize + 58}" rx="28" fill="url(#plank)" stroke="${INK}" stroke-width="6"/>
    <text x="46" y="${titleSize + 6}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
  </g>

  <text x="80" y="${132 + titleSize + 128}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="700" fill="${MUTED}">${esc(subtitle)}</text>

  ${chip(lang, 78, 560, chips[0])}
  ${chip(lang, 78, 648, chips[1])}
  ${chip(lang, 78, 736, chips[2])}
</svg>`;
}

/** The install icon: the tray with three blocks lined up in it. */
function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#fdf3df"/>
  <circle cx="70" cy="40" r="190" fill="rgba(255,255,255,0.9)"/>
  <circle cx="470" cy="480" r="170" fill="rgba(159,220,192,0.3)"/>
  <g>
    <rect x="48" y="128" width="416" height="286" rx="66" fill="rgba(75,58,38,0.16)"/>
    <rect x="48" y="112" width="416" height="286" rx="66" fill="${TRAY}" stroke="${INK}" stroke-width="18"/>
    <rect x="104" y="72" width="304" height="30" rx="15" fill="${PEACH}" stroke="${INK}" stroke-width="12"/>
    <rect x="104" y="196" width="104" height="128" rx="30" fill="${SUN}" stroke="${INK}" stroke-width="15"/>
    <circle cx="256" cy="260" r="58" fill="${SKY}" stroke="${INK}" stroke-width="15"/>
    <path d="M356 196 L412 318 H300 Z" fill="${MINT}" stroke="${INK}" stroke-width="15" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: CREAM })
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
      title: "놀이세트",
      subtitle: "고른 게임만, 이어서. 이 기기에만.",
      order: "이 순서대로 저절로 이어집니다",
      games: ["짝맞추기", "순서기억", "다른 것 찾기", "쉬운 덧셈"],
      chips: ["로그인 없음", "3게임 제한 없음", "구독 없음"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Playset",
      subtitle: "Only the games you pick. Then the next one.",
      order: "PLAYS IN THIS ORDER, ON ITS OWN",
      games: ["Pair matching", "Sequence memory", "Find the different one", "Easy addition"],
      chips: ["No login", "No 3-game lock", "No subscription"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "プレイセット",
      subtitle: "選んだゲームだけ、つづけて。この端末だけ。",
      order: "この順に、ひとりでにつづきます",
      games: ["ペア合わせ", "順番おぼえ", "ちがうもの探し", "かんたんな足し算"],
      chips: ["ログインなし", "3ゲーム制限なし", "サブスクなし"],
      files: ["og-image-ja.png"],
    },
    {
      // zh gets its own card. It must never be handed the English one.
      lang: "zh",
      title: "游戏套装",
      subtitle: "只玩选好的游戏，自动下一局。仅此设备。",
      order: "按这个顺序，自动接着玩",
      games: ["配对", "记顺序", "找不同", "简单加法"],
      chips: ["无需登录", "没有3局限制", "无需订阅"],
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
