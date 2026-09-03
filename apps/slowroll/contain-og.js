// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Slowroll card: the desk at the moment a roll has just been sealed.
 *
 * The whole product is a wait. So the picture is the yellow plastic camera
 * with its counter reading 24, a sealed film canister beside it, and a big
 * darkroom readout counting down from three days. No gallery, no thumbnails,
 * no pastel toy, no purple stage.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const DESK = { r: 43, g: 33, b: 24, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `DejaVu Sans Mono, Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const CREAM = "#f5e9cf";
const SAND = "#c9b48e";
const BODY = "#f2b632";
const BODY_DEEP = "#8a5f12";
const GRIP = "#2a2118";
const RED = "#d2452e";
const SAFELIGHT = "#ff7a1a";
const GLOW = "#ff9a4a";

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

/** Film grain over the whole card: this is a print, not a screenshot. */
function grain() {
  const out = [];
  let seed = 2026;
  for (let i = 0; i < 420; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.04 + (seed % 7) / 120;
    out.push(`<circle cx="${x}" cy="${y}" r="1.3" fill="rgba(255,236,200,${o.toFixed(3)})"/>`);
  }
  return out.join("");
}

/** Sprocket strip along the top edge of the card. */
function sprockets() {
  const holes = [];
  for (let x = 24; x < 1800; x += 56) {
    holes.push(`<rect x="${x}" y="14" width="30" height="22" rx="5" fill="#f2b632" opacity="0.85"/>`);
  }
  return `<g><rect x="0" y="0" width="1800" height="50" fill="#1a1410"/>${holes.join("")}</g>`;
}

/** The camera, three-quarter front. Counter reads what the roll has left. */
function camera(x, y, counter) {
  return `
  <g transform="translate(${x},${y})">
    <ellipse cx="300" cy="392" rx="330" ry="30" fill="rgba(0,0,0,0.45)"/>
    <!-- top plate: finder, name, dial, wheel -->
    <rect x="150" y="0" width="120" height="46" rx="10" fill="${GRIP}"/>
    <rect x="470" y="10" width="34" height="60" rx="8" fill="#3d3126"/>
    <!-- body -->
    <rect x="0" y="40" width="600" height="340" rx="42" fill="${BODY}" stroke="${BODY_DEEP}" stroke-width="6"/>
    <rect x="0" y="40" width="600" height="80" rx="42" fill="rgba(255,255,255,0.22)"/>
    <rect x="470" y="40" width="130" height="340" rx="42" fill="${GRIP}"/>
    <rect x="470" y="40" width="60" height="340" fill="${GRIP}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<rect x="490" y="${70 + i * 24}" width="96" height="8" rx="4" fill="rgba(255,255,255,0.07)"/>`).join("")}
    <!-- sprocket strip down the left -->
    <rect x="8" y="48" width="44" height="324" rx="8" fill="${GRIP}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="20" y="${64 + i * 34}" width="20" height="16" rx="4" fill="${BODY}" opacity="0.9"/>`).join("")}
    <!-- finder window -->
    <rect x="80" y="70" width="70" height="44" rx="8" fill="#2f5f77" stroke="${GRIP}" stroke-width="5"/>
    <rect x="86" y="76" width="30" height="14" rx="4" fill="rgba(255,255,255,0.45)"/>
    <!-- lens -->
    <circle cx="300" cy="230" r="118" fill="${GRIP}"/>
    <circle cx="300" cy="230" r="98" fill="#3d3126"/>
    <circle cx="300" cy="230" r="72" fill="#1a1410"/>
    <circle cx="300" cy="230" r="50" fill="#0d0b09"/>
    <circle cx="276" cy="204" r="16" fill="rgba(245,233,207,0.55)"/>
    <circle cx="322" cy="252" r="7" fill="rgba(245,233,207,0.3)"/>
    <!-- shutter -->
    <circle cx="420" cy="86" r="34" fill="${GRIP}"/>
    <circle cx="420" cy="80" r="28" fill="#d9d4c7"/>
    <circle cx="420" cy="80" r="21" fill="${RED}"/>
    <circle cx="412" cy="72" r="6" fill="rgba(255,255,255,0.45)"/>
    <!-- counter dial -->
    <circle cx="200" cy="330" r="46" fill="#8f8a7c"/>
    <circle cx="200" cy="330" r="40" fill="#d9d4c7"/>
    <circle cx="200" cy="330" r="32" fill="#12100c"/>
    <rect x="198" y="292" width="4" height="10" fill="${RED}"/>
    <text x="200" y="342" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="34" font-weight="700" fill="${CREAM}">${esc(counter)}</text>
  </g>`;
}

/** The sealed canister with a padlock. */
function canister(x, y) {
  return `
  <g transform="translate(${x},${y})">
    <ellipse cx="70" cy="238" rx="90" ry="14" fill="rgba(0,0,0,0.4)"/>
    <rect x="46" y="-26" width="48" height="30" rx="6" fill="#8f8a7c"/>
    <rect x="0" y="0" width="140" height="230" rx="18" fill="#3d3126" stroke="#1a1410" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="8" y="${14 + i * 22}" width="124" height="6" rx="3" fill="rgba(255,255,255,0.06)"/>`).join("")}
    <rect x="14" y="62" width="112" height="100" rx="6" fill="${BODY}"/>
    <rect x="14" y="62" width="112" height="14" fill="${GRIP}" opacity="0.85"/>
    <rect x="14" y="148" width="112" height="14" fill="${GRIP}" opacity="0.85"/>
    <text x="70" y="126" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="42" font-weight="700" fill="${GRIP}">24</text>
    <!-- padlock -->
    <g transform="translate(96,150)">
      <circle cx="30" cy="30" r="40" fill="${SAFELIGHT}"/>
      <path d="M17 26 v-8 a13 13 0 0 1 26 0 v8" fill="none" stroke="${GRIP}" stroke-width="6" stroke-linecap="round"/>
      <rect x="10" y="26" width="40" height="30" rx="6" fill="${GRIP}"/>
      <circle cx="30" cy="40" r="4" fill="${SAFELIGHT}"/>
    </g>
  </g>`;
}

/** The darkroom readout: four cells, big mono digits, one label under each. */
function readout(x, y, lang, units, caption) {
  const cells = [["2", units[0]], ["23", units[1]], ["59", units[2]], ["57", units[3]]];
  const cw = 190;
  return `
  <g transform="translate(${x},${y})">
    <rect x="-24" y="-30" width="${cw * 4 + 48}" height="236" rx="24" fill="#0e0302" stroke="#5a2313" stroke-width="4"/>
    <rect x="-24" y="-30" width="${cw * 4 + 48}" height="236" rx="24" fill="url(#safeglow)"/>
    ${cells
      .map(
        ([n, u], i) => `
    <text x="${i * cw + cw / 2}" y="94" text-anchor="middle" font-family="${mono(lang)}" font-size="108" font-weight="700" fill="${GLOW}">${esc(n)}</text>
    <text x="${i * cw + cw / 2}" y="150" text-anchor="middle" font-family="${sans(lang)}" font-size="${fitSize(u, cw - 20, [30, 26, 22])}" font-weight="700" fill="#c9865a">${esc(u)}</text>`,
      )
      .join("")}
    <circle cx="-4" cy="-4" r="9" fill="${SAFELIGHT}"/>
    <circle cx="-4" cy="-4" r="18" fill="${SAFELIGHT}" opacity="0.25"/>
    <text x="24" y="4" font-family="${sans(lang)}" font-size="26" font-weight="800" letter-spacing="4" fill="${GLOW}">${esc(caption)}</text>
  </g>`;
}

function svgFor(job) {
  const { lang, title, tagline, chips, units, caption } = job;
  const titleSize = fitSize(title, 760, [110, 96, 84, 72, 62]);
  const tagSize = fitSize(tagline, 800, [34, 30, 27, 24, 22]);

  const chipRow = (() => {
    let x = 96;
    const parts = [];
    for (const c of chips) {
      const w = textWidth(c, 26) + 44;
      parts.push(`
      <rect x="${x}" y="0" width="${w}" height="50" rx="25" fill="rgba(242,182,50,0.12)" stroke="rgba(242,182,50,0.5)" stroke-width="2"/>
      <text x="${x + w / 2}" y="34" text-anchor="middle" font-family="${sans(lang)}" font-size="26" font-weight="700" fill="#ffd76a">${esc(c)}</text>`);
      x += w + 14;
    }
    return parts.join("");
  })();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2c1f"/>
      <stop offset="55%" stop-color="#2b2118"/>
      <stop offset="100%" stop-color="#1c1610"/>
    </linearGradient>
    <radialGradient id="lamp" cx="12%" cy="0%" r="70%">
      <stop offset="0%" stop-color="rgba(242,182,50,0.30)"/>
      <stop offset="100%" stop-color="rgba(242,182,50,0)"/>
    </radialGradient>
    <radialGradient id="safe" cx="82%" cy="100%" r="70%">
      <stop offset="0%" stop-color="rgba(255,122,26,0.30)"/>
      <stop offset="100%" stop-color="rgba(255,122,26,0)"/>
    </radialGradient>
    <radialGradient id="safeglow" cx="50%" cy="0%" r="90%">
      <stop offset="0%" stop-color="rgba(255,122,26,0.22)"/>
      <stop offset="100%" stop-color="rgba(255,122,26,0)"/>
    </radialGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#desk)"/>
  <rect width="1800" height="945" fill="url(#lamp)"/>
  <rect width="1800" height="945" fill="url(#safe)"/>
  ${grain()}
  ${sprockets()}

  <text x="96" y="${210 + (titleSize - 110) * 0.4}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${CREAM}">${esc(title)}</text>
  <rect x="96" y="${236 + titleSize * 0.12}" width="${Math.min(820, textWidth(title, titleSize) + 40)}" height="7" rx="3" fill="${BODY}"/>
  <text x="96" y="${306 + titleSize * 0.12}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${SAND}">${esc(tagline)}</text>

  <g transform="translate(0,${350 + titleSize * 0.12})">${chipRow}</g>

  ${camera(96, 480, "24")}
  ${canister(760, 560)}
  ${readout(1010, 560, lang, units, caption)}
</svg>`;
}

/** App icon: the camera front, counter reading 24, under one warm lamp. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="lp" cx="20%" cy="0%" r="90%">
      <stop offset="0%" stop-color="rgba(242,182,50,0.35)"/>
      <stop offset="100%" stop-color="rgba(242,182,50,0)"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="#2b2118"/>
  <rect width="512" height="512" fill="url(#lp)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="176" y="86" width="110" height="40" rx="10" fill="${GRIP}"/>
    <rect x="36" y="116" width="440" height="300" rx="44" fill="${BODY}" stroke="${BODY_DEEP}" stroke-width="8"/>
    <rect x="36" y="116" width="440" height="70" rx="44" fill="rgba(255,255,255,0.22)"/>
    <rect x="356" y="116" width="120" height="300" rx="44" fill="${GRIP}"/>
    <rect x="356" y="116" width="60" height="300" fill="${GRIP}"/>
    <rect x="44" y="124" width="36" height="284" rx="8" fill="${GRIP}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="54" y="${138 + i * 34}" width="16" height="14" rx="3" fill="${BODY}"/>`).join("")}
    <rect x="98" y="146" width="56" height="36" rx="7" fill="#2f5f77" stroke="${GRIP}" stroke-width="5"/>
    <circle cx="230" cy="280" r="96" fill="${GRIP}"/>
    <circle cx="230" cy="280" r="76" fill="#3d3126"/>
    <circle cx="230" cy="280" r="54" fill="#1a1410"/>
    <circle cx="212" cy="260" r="13" fill="rgba(245,233,207,0.55)"/>
    <circle cx="318" cy="156" r="30" fill="${GRIP}"/>
    <circle cx="318" cy="150" r="24" fill="#d9d4c7"/>
    <circle cx="318" cy="150" r="17" fill="${RED}"/>
    <circle cx="410" cy="330" r="46" fill="#8f8a7c"/>
    <circle cx="410" cy="330" r="38" fill="#d9d4c7"/>
    <circle cx="410" cy="330" r="30" fill="#12100c"/>
    <rect x="408" y="296" width="4" height="9" fill="${RED}"/>
    <text x="410" y="342" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="32" font-weight="700" fill="${CREAM}">24</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: DESK })
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
      title: "슬로우롤",
      tagline: "롤을 채우고 3일 기다리면 한 번에 현상됩니다. 미리보기는 없습니다.",
      chips: ["로그인 없음", "업로드 없음", "촬영 중 미리보기 없음", "3일 실제 잠금"],
      units: ["일", "시간", "분", "초"],
      caption: "현상까지",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Slowroll",
      tagline: "Fill the roll, wait three days, and it all develops at once. No preview.",
      chips: ["No login", "No upload", "No preview while shooting", "Real 3-day lock"],
      units: ["days", "hours", "minutes", "seconds"],
      caption: "DEVELOPS IN",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "スローロール",
      tagline: "ロールを撮り切って3日待つと、まとめて現像。プレビューはありません。",
      chips: ["ログインなし", "アップロードなし", "撮影中のプレビューなし", "3日の本当のロック"],
      units: ["日", "時間", "分", "秒"],
      caption: "現像まで",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "慢卷",
      tagline: "拍满一卷，等三天，一次性冲洗完成。没有预览。",
      chips: ["无需登录", "不上传", "拍摄中不预览", "3天真正锁定"],
      units: ["天", "小时", "分", "秒"],
      caption: "距冲洗还有",
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

  // Maskable art is cropped to a circle on Android, so the camera gets its own
  // padded render instead of reusing the edge-to-edge icon.
  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
