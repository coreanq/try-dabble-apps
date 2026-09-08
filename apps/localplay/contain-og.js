// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Localplay card: a cream room, an indigo deck with a turning disc on the
 * left, and a short track list on the right with one row lit. The product is
 * "your own MP3s, offline, no ads", so the picture is a player, not a store:
 * no price tags, no cloud, no logos. Four real jobs (ko/en/ja/zh), each its
 * own SVG → PNG; zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const CREAM = { r: 247, g: 243, b: 234, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const clock = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#22214a";
const MUTED = "#5d5c7a";
const LINE = "#ddd6c8";
const INDIGO = "#3b3a8f";
const INDIGO_INK = "#1c1b4d";
const VIOLET = "#7c6fe0";
const VIOLET_SOFT = "#e6e2fb";
const VIOLET_GLOW = "#b9b0f5";
const AMBER = "#f2b84b";
const ROSE = "#d9536f";
const PAPER = "#fffdf8";

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

/** The deck: indigo slab, disc with grooves, title lines, seek bar, keys. */
function deck(lang, now) {
  const [title, sub, elapsed, total] = now;
  const titleSize = fitSize(title, 520, [46, 42, 38, 34, 30]);
  return `
  <g transform="translate(90,250)">
    <rect x="0" y="0" width="700" height="600" rx="40" fill="url(#deck)"/>
    <rect x="0" y="0" width="700" height="600" rx="40" fill="url(#lamp)"/>
    <rect x="1" y="1" width="698" height="598" rx="39" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>

    <g transform="translate(150,190)">
      <circle cx="0" cy="0" r="112" fill="#14133a"/>
      <circle cx="0" cy="0" r="112" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      ${[100, 88, 76, 64, 52].map((r) => `<circle cx="0" cy="0" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`).join("")}
      <path d="M-90 -60 A 108 108 0 0 1 -30 -104" fill="none" stroke="${VIOLET_GLOW}" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
      <path d="M40 100 A 108 108 0 0 1 96 40" fill="none" stroke="${VIOLET_GLOW}" stroke-width="8" stroke-linecap="round" opacity="0.4"/>
      <circle cx="0" cy="0" r="36" fill="${INDIGO}"/>
      <circle cx="0" cy="0" r="32" fill="${PAPER}"/>
      <circle cx="0" cy="0" r="7" fill="${INDIGO}"/>
    </g>

    <g transform="translate(300,130)">
      <text x="0" y="0" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="700" fill="${PAPER}">${esc(title)}</text>
      <text x="0" y="52" font-family="${sans(lang)}" font-size="28" font-weight="600" fill="${VIOLET_GLOW}">${esc(sub)}</text>
    </g>

    <g transform="translate(60,360)">
      <rect x="0" y="0" width="580" height="8" rx="4" fill="rgba(255,255,255,0.18)"/>
      <rect x="0" y="0" width="230" height="8" rx="4" fill="${VIOLET_GLOW}"/>
      <circle cx="230" cy="4" r="14" fill="${PAPER}" stroke="${VIOLET}" stroke-width="4"/>
      <text x="0" y="44" font-family="${clock(lang)}" font-size="24" font-weight="700" fill="rgba(247,243,234,0.85)">${esc(elapsed)}</text>
      <text x="580" y="44" text-anchor="end" font-family="${clock(lang)}" font-size="24" font-weight="700" fill="rgba(247,243,234,0.85)">${esc(total)}</text>
    </g>

    <g transform="translate(350,500)">
      <!-- shuffle -->
      <g transform="translate(-260,0)">
        <circle cx="0" cy="0" r="38" fill="rgba(185,176,245,0.28)" stroke="${VIOLET_GLOW}" stroke-width="3"/>
        <path d="M-16 -10h8l16 20h8M-16 10h8l16 -20h8M12 -14l6 4 -6 4M12 6l6 4 -6 4" fill="none" stroke="${PAPER}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <!-- prev -->
      <g transform="translate(-140,0)">
        <circle cx="0" cy="0" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
        <path d="M-14 -14v28M14 -14L-6 0l20 14z" fill="${PAPER}" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round"/>
      </g>
      <!-- play -->
      <circle cx="0" cy="0" r="56" fill="${AMBER}"/>
      <path d="M-16 -26v52l44 -26z" fill="${INDIGO_INK}" stroke="${INDIGO_INK}" stroke-width="6" stroke-linejoin="round"/>
      <!-- next -->
      <g transform="translate(140,0)">
        <circle cx="0" cy="0" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
        <path d="M14 -14v28M-14 -14L6 0l-20 14z" fill="${PAPER}" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round"/>
      </g>
      <!-- repeat -->
      <g transform="translate(260,0)">
        <circle cx="0" cy="0" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
        <path d="M-16 -4a16 16 0 0 1 16 -14h16M16 4a16 16 0 0 1 -16 14h-16M10 -24l8 6 -8 6M-10 24l-8 -6 8 -6" fill="none" stroke="${PAPER}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>
  </g>`;
}

/** One row on the list: number disc, title, artist, runtime. */
function listRow(lang, y, row, on) {
  const [title, artist, time] = row;
  const size = fitSize(title, 520, [34, 31, 28, 26, 24]);
  return `
  <g transform="translate(0,${y})">
    <rect x="0" y="0" width="820" height="112" rx="22" fill="${on ? VIOLET_SOFT : "#ffffff"}" stroke="${on ? "rgba(124,111,224,0.6)" : LINE}" stroke-width="3"/>
    <circle cx="60" cy="56" r="26" fill="${on ? INDIGO : "#efe9dc"}"/>
    ${on
      ? `<path d="M52 44v24l20 -12z" fill="${PAPER}"/>`
      : `<text x="60" y="65" text-anchor="middle" font-family="${clock(lang)}" font-size="22" font-weight="700" fill="${MUTED}">${esc(row[3])}</text>`}
    <text x="110" y="50" font-family="${sans(lang, "URW Gothic")}" font-size="${size}" font-weight="700" fill="${on ? "#2a2970" : INK}">${esc(title)}</text>
    <text x="110" y="86" font-family="${sans(lang)}" font-size="22" font-weight="600" fill="${MUTED}">${esc(artist)}</text>
    <text x="790" y="66" text-anchor="end" font-family="${clock(lang)}" font-size="22" font-weight="700" fill="${MUTED}">${esc(time)}</text>
    <path transform="translate(720,42)" d="M12 22s-9-6.2-9-13a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.8-9 13-9 13z" fill="${on ? ROSE : "none"}" stroke="${on ? ROSE : "#c9c1b1"}" stroke-width="2.5"/>
  </g>`;
}

function svgFor(job) {
  const { lang, title, subtitle, now, rows, tabs } = job;
  const titleSize = fitSize(title, 860, [104, 92, 80, 70, 60]);
  const subSize = fitSize(subtitle, 860, [34, 31, 28, 26, 24]);

  let tabX = 0;
  const tabSvg = tabs
    .map((label, i) => {
      const w = Math.round(textWidth(label, 26) + 56);
      const x = tabX;
      tabX += w + 14;
      const on = i === 0;
      return `<g transform="translate(${x},0)">
        <rect x="0" y="0" width="${w}" height="56" rx="28" fill="${on ? INDIGO : PAPER}" stroke="${on ? INDIGO : "#c9c1b1"}" stroke-width="3"/>
        <text x="${w / 2}" y="37" text-anchor="middle" font-family="${sans(lang)}" font-size="26" font-weight="700" fill="${on ? PAPER : MUTED}">${esc(label)}</text>
      </g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf7f0"/>
      <stop offset="60%" stop-color="#f7f3ea"/>
      <stop offset="100%" stop-color="#efe8d9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0" r="0.7">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="deck" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2f2e86"/>
      <stop offset="70%" stop-color="#22214a"/>
      <stop offset="100%" stop-color="#1c1b4d"/>
    </linearGradient>
    <radialGradient id="lamp" cx="1" cy="0" r="0.9">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#wall)"/>
  <rect width="1800" height="600" fill="url(#glow)"/>
  <rect x="0" y="880" width="1800" height="65" fill="#e6dfcf"/>
  <rect x="0" y="876" width="1800" height="6" fill="#d6cdb9"/>

  <g transform="translate(90,70)">
    <g transform="translate(0,${titleSize * 0.15})">
      <circle cx="${titleSize * 0.5}" cy="${titleSize * 0.36}" r="${titleSize * 0.46}" fill="${INDIGO}"/>
      <circle cx="${titleSize * 0.5}" cy="${titleSize * 0.36}" r="${titleSize * 0.3}" fill="none" stroke="${VIOLET_GLOW}" stroke-width="3" opacity="0.7"/>
      <circle cx="${titleSize * 0.5}" cy="${titleSize * 0.36}" r="${titleSize * 0.13}" fill="${PAPER}"/>
      <circle cx="${titleSize * 0.5}" cy="${titleSize * 0.36}" r="${titleSize * 0.045}" fill="${INDIGO}"/>
      <path transform="translate(${titleSize * 0.62},${titleSize * -0.08}) scale(${titleSize / 64})" d="M0 0l8 3.5v18a5 5 0 1 1-3-4.6V6.8l-5-2.1z" fill="${AMBER}"/>
    </g>
    <text x="${titleSize * 1.15}" y="${titleSize * 0.82}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
  </g>
  <text x="94" y="${70 + titleSize + subSize + 18}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>

  ${deck(lang, now)}

  <g transform="translate(870,250)">
    ${tabSvg}
    <g transform="translate(0,90)">
      ${listRow(lang, 0, rows[0], false)}
      ${listRow(lang, 128, rows[1], true)}
      ${listRow(lang, 256, rows[2], false)}
      ${listRow(lang, 384, rows[3], false)}
    </g>
  </g>
</svg>`;
}

/** App icon: the disc with an amber note, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ebe6fb"/>
      <stop offset="45%" stop-color="#f7f3ea"/>
      <stop offset="100%" stop-color="#efe8d9"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <circle cx="256" cy="256" r="216" fill="${INDIGO}"/>
    <circle cx="256" cy="256" r="166" fill="none" stroke="${VIOLET_GLOW}" stroke-width="10" opacity="0.7"/>
    <circle cx="256" cy="256" r="120" fill="none" stroke="${VIOLET_GLOW}" stroke-width="10" opacity="0.5"/>
    <circle cx="256" cy="256" r="64" fill="${PAPER}"/>
    <circle cx="256" cy="256" r="20" fill="${INDIGO}"/>
    <path transform="translate(300,40) scale(5.2)" d="M0 0l8 3.5v18a5 5 0 1 1-3-4.6V6.8l-5-2.1z" fill="${AMBER}" stroke="${PAPER}" stroke-width="1.2"/>
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
      title: "로컬플레이",
      subtitle: "내 MP3를 골라 라이브러리로. 재생목록·셔플·반복. 로그인·구독·광고 없음.",
      now: ["밤편지", "아이유 · Palette", "1:12", "4:13"],
      tabs: ["곡", "앨범", "아티스트", "재생목록"],
      rows: [
        ["봄날", "방탄소년단", "4:34", "1"],
        ["밤편지", "아이유", "4:13", "2"],
        ["좋은 날", "아이유", "3:52", "3"],
        ["사건의 지평선", "윤하", "5:02", "4"],
      ],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Localplay",
      subtitle: "Pick local MP3s into a library. Playlists, shuffle, repeat. No login, no ads.",
      now: ["Blue Train", "John Coltrane · Blue Train", "1:12", "10:43"],
      tabs: ["Tracks", "Albums", "Artists", "Playlists"],
      rows: [
        ["So What", "Miles Davis", "9:22", "1"],
        ["Blue Train", "John Coltrane", "10:43", "2"],
        ["Take Five", "Dave Brubeck", "5:24", "3"],
        ["My Favorite Things", "John Coltrane", "13:41", "4"],
      ],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ローカルプレイ",
      subtitle: "端末のMP3を選んでライブラリに。プレイリスト・シャッフル・リピート。広告なし。",
      now: ["夜に駆ける", "YOASOBI · THE BOOK", "1:12", "4:23"],
      tabs: ["曲", "アルバム", "アーティスト", "プレイリスト"],
      rows: [
        ["Lemon", "米津玄師", "4:16", "1"],
        ["夜に駆ける", "YOASOBI", "4:23", "2"],
        ["群青", "YOASOBI", "4:10", "3"],
        ["Pretender", "Official髭男dism", "5:27", "4"],
      ],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "本地播放",
      subtitle: "把手机里的 MP3 选进曲库。播放列表、随机、循环。无需登录，无广告。",
      now: ["晴天", "周杰伦 · 叶惠美", "1:12", "4:29"],
      tabs: ["曲目", "专辑", "歌手", "播放列表"],
      rows: [
        ["七里香", "周杰伦", "4:59", "1"],
        ["晴天", "周杰伦", "4:29", "2"],
        ["夜曲", "周杰伦", "3:46", "3"],
        ["光年之外", "邓紫棋", "3:55", "4"],
      ],
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

  // Maskable art is cropped to a circle on Android, so the disc gets its own
  // padded render instead of reusing the edge-to-edge icon.
  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
