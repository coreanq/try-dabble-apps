// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Outcheck card: the hallway at dawn, the moment before you step out.
 *
 * The product is three taps on the way out and a clock that wipes them at
 * midnight, so the picture is a front door with a checklist plate beside it —
 * door and gas already stamped with a time, garage still waiting — and a small
 * midnight clock in the corner. Cool slate, sage checks, first light on top.
 * Four real jobs (ko/en/ja/zh), each its own SVG → PNG; zh is never an alias.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const DAWN = { r: 238, g: 243, b: 246, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const clock = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#1d2b36";
const MUTED = "#5b6b78";
const LINE = "#ccd7de";
const SAGE = "#4f8a6e";
const SAGE_DEEP = "#2f6a50";
const SAGE_SOFT = "#dcefe4";
const NIGHT = "#2b3e55";
const PEACH = "#f6dfcc";
const DOOR = "#3f5566";
const DOOR_LIGHT = "#dbe6ec";

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

/** Dust in the first light: the hall has to read as a hall, not a flat fill. */
function motes() {
  const out = [];
  let seed = 2026;
  for (let i = 0; i < 90; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 400;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.08 + (seed % 7) / 60;
    out.push(`<circle cx="${x}" cy="${y}" r="1.6" fill="rgba(255,255,255,${o.toFixed(3)})"/>`);
  }
  return out.join("");
}

/** The front door on the left: frame, leaf, four panels, a brass-free handle, deadbolt turned. */
function frontDoor() {
  return `
  <g transform="translate(120,150)">
    <rect x="-26" y="-26" width="452" height="822" rx="12" fill="#c5d2da"/>
    <rect x="-14" y="-14" width="428" height="810" rx="8" fill="#b1c0ca"/>
    <rect x="0" y="0" width="400" height="800" rx="6" fill="${DOOR}"/>
    <rect x="0" y="0" width="400" height="800" rx="6" fill="url(#doorlight)"/>
    <rect x="44" y="52" width="130" height="240" rx="6" fill="${DOOR_LIGHT}" opacity="0.92"/>
    <rect x="226" y="52" width="130" height="240" rx="6" fill="${DOOR_LIGHT}" opacity="0.92"/>
    <rect x="44" y="340" width="130" height="380" rx="6" fill="none" stroke="rgba(219,230,236,0.35)" stroke-width="6"/>
    <rect x="226" y="340" width="130" height="380" rx="6" fill="none" stroke="rgba(219,230,236,0.35)" stroke-width="6"/>
    <rect x="336" y="430" width="34" height="14" rx="7" fill="${DOOR_LIGHT}"/>
    <circle cx="353" cy="480" r="15" fill="${DOOR_LIGHT}"/>
    <rect x="349" y="466" width="8" height="28" rx="3" fill="${DOOR}"/>
    <ellipse cx="200" cy="826" rx="230" ry="20" fill="rgba(29,43,54,0.12)"/>
  </g>`;
}

/** One line on the plate: ring, label, and either a stamped time or "not yet". */
function plateRow(lang, y, label, when, done) {
  const size = fitSize(label, 520, [42, 38, 34, 30, 26]);
  return `
  <g transform="translate(0,${y})">
    <rect x="0" y="0" width="900" height="130" rx="22" fill="${done ? SAGE_SOFT : "#ffffff"}" stroke="${done ? "rgba(79,138,110,0.55)" : LINE}" stroke-width="3"/>
    <circle cx="70" cy="65" r="30" fill="${done ? SAGE : "#ffffff"}" stroke="${done ? SAGE : "#b7c5ce"}" stroke-width="5"/>
    ${done ? `<path d="M54 66l11 11 22-24" fill="none" stroke="#f4faf6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
    <text x="130" y="${done ? 60 : 78}" font-family="${sans(lang, "URW Gothic")}" font-size="${size}" font-weight="700" fill="${done ? SAGE_DEEP : INK}">${esc(label)}</text>
    ${done ? `<text x="130" y="104" font-family="${clock(lang)}" font-size="28" font-weight="600" fill="${SAGE_DEEP}">${esc(when)}</text>` : ""}
    ${!done ? `<text x="860" y="78" text-anchor="end" font-family="${clock(lang)}" font-size="28" font-weight="600" fill="${MUTED}">${esc(when)}</text>` : ""}
  </g>`;
}

/** Small clock at midnight: both hands straight up, a moon crescent beside it. */
function midnightClock(x, y, lang, label) {
  return `
  <g transform="translate(${x},${y})">
    <circle cx="0" cy="0" r="74" fill="#ffffff" stroke="${NIGHT}" stroke-width="6"/>
    <circle cx="0" cy="0" r="62" fill="none" stroke="rgba(43,62,85,0.12)" stroke-width="2"/>
    <g fill="${NIGHT}">
      <rect x="-3" y="-58" width="6" height="12" rx="2"/>
      <rect x="-3" y="46" width="6" height="12" rx="2"/>
      <rect x="46" y="-3" width="12" height="6" rx="2"/>
      <rect x="-58" y="-3" width="12" height="6" rx="2"/>
    </g>
    <rect x="-5" y="-52" width="10" height="56" rx="5" fill="${NIGHT}"/>
    <rect x="-4" y="-40" width="8" height="44" rx="4" fill="${SAGE_DEEP}"/>
    <circle cx="0" cy="0" r="8" fill="${NIGHT}"/>
    <path d="M118 -26a30 30 0 1 0 0 52a24 24 0 1 1 0 -52z" fill="${NIGHT}" opacity="0.85"/>
    <text x="0" y="118" text-anchor="middle" font-family="${sans(lang)}" font-size="28" font-weight="700" fill="${NIGHT}">${esc(label)}</text>
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, rows, reset } = job;
  const titleSize = fitSize(title, 900, [108, 96, 84, 72, 62]);
  const subSize = fitSize(subtitle, 900, [38, 34, 30, 27, 24]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7fafb"/>
      <stop offset="45%" stop-color="#eaf0f4"/>
      <stop offset="100%" stop-color="#dfe8ee"/>
    </linearGradient>
    <linearGradient id="firstlight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PEACH}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${PEACH}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="doorlight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.12)"/>
    </linearGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#wall)"/>
  <rect width="1800" height="300" fill="url(#firstlight)"/>
  ${motes()}
  <rect x="0" y="880" width="1800" height="65" fill="#d3dee5"/>
  <rect x="0" y="876" width="1800" height="6" fill="#c2cfd8"/>

  ${frontDoor()}

  <g transform="translate(700,110)">
    <text x="0" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 30}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>

  <g transform="translate(700,${110 + titleSize + subSize + 80})">
    <rect x="-30" y="-30" width="960" height="490" rx="30" fill="#fbfcfd" stroke="${LINE}" stroke-width="3"/>
    <rect x="-30" y="-30" width="960" height="490" rx="30" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1"/>
    ${plateRow(lang, 0, rows[0][0], rows[0][1], true)}
    ${plateRow(lang, 150, rows[1][0], rows[1][1], true)}
    ${plateRow(lang, 300, rows[2][0], rows[2][1], false)}
  </g>

  ${midnightClock(1640, 200, lang, reset)}
</svg>`;
}

/** App icon: the door leaf with a sage check badge, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f6e6d8"/>
      <stop offset="35%" stop-color="#eef3f6"/>
      <stop offset="100%" stop-color="#dfe8ee"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="132" y="70" width="220" height="380" rx="26" fill="${DOOR}"/>
    <rect x="160" y="98" width="164" height="324" rx="14" fill="${DOOR_LIGHT}"/>
    <rect x="178" y="118" width="128" height="120" rx="10" fill="rgba(63,85,102,0.12)"/>
    <circle cx="296" cy="290" r="18" fill="${DOOR}"/>
    <ellipse cx="242" cy="470" rx="170" ry="16" fill="rgba(29,43,54,0.12)"/>
    <circle cx="378" cy="118" r="70" fill="${SAGE}"/>
    <circle cx="378" cy="118" r="70" fill="none" stroke="#f4faf6" stroke-width="10"/>
    <path d="M342 120l24 24 46-50" fill="none" stroke="#f4faf6" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: DAWN })
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
      title: "나갔어체크",
      subtitle: "문·가스·차고를 원탭으로 확인하고 자정에 리셋",
      rows: [["문 잠금", "오전 7:42 확인"], ["가스 잠금", "오전 7:43 확인"], ["차고 닫힘", "아직"]],
      reset: "자정에 리셋",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Outcheck",
      subtitle: "One-tap door, gas and garage checks that reset at midnight",
      rows: [["Door locked", "Checked 7:42 AM"], ["Gas off", "Checked 7:43 AM"], ["Garage closed", "Not yet"]],
      reset: "Resets at midnight",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "外出チェック",
      subtitle: "ドア・ガス・ガレージをワンタップ。毎日0時にリセット",
      rows: [["ドア施錠", "7:42 確認"], ["ガスオフ", "7:43 確認"], ["ガレージ閉鎖", "まだ"]],
      reset: "0時にリセット",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "出门核对",
      subtitle: "一键确认门锁、燃气、车库，每天零点清零",
      rows: [["门锁好", "07:42 已确认"], ["燃气关好", "07:43 已确认"], ["车库关好", "还没"]],
      reset: "零点清零",
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

  // Maskable art is cropped to a circle on Android, so the door gets its own
  // padded render instead of reusing the edge-to-edge icon.
  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
