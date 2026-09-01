// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Playcue card: the stage deck at the moment a track has just finished.
 *
 * The whole product is one instant — Q1 has ended, the house is silent, and
 * nothing moves until a thumb hits GO. So the picture is a cue rack with Q1
 * flagged STOPPED, Q2 waiting in green, and the GO key lit beside them. No
 * generic gradient, no pastel toy, no album-art grid.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const HOUSE = { r: 11, g: 7, b: 16, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `DejaVu Sans Mono, Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#f5edff";
const MUTED = "#a795c4";
const AMBER = "#ffb020";
const GO = "#35e07d";
const GO_DEEP = "#0c6c3d";
const STOP = "#ff3b52";
const CYAN = "#3ad7f0";
const MAGENTA = "#ff2f8e";

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

/** Airborne haze in the followspot: the beam has to read as a beam. */
function haze() {
  const out = [];
  let seed = 4177;
  for (let i = 0; i < 150; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % 1800;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % 945;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = 0.9 + (seed % 5) / 3.4;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const o = 0.03 + (seed % 9) / 150;
    out.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="rgba(255,255,255,${o.toFixed(3)})"/>`);
  }
  return out.join("");
}

/** The lighting truss across the top, with three gelled lamps hanging off it. */
function truss() {
  const lamps = [
    { x: 330, gel: MAGENTA },
    { x: 900, gel: AMBER },
    { x: 1470, gel: CYAN },
  ];
  return `
  <g>
    <rect x="0" y="34" width="1800" height="14" fill="#2a1c42"/>
    <rect x="0" y="34" width="1800" height="4" fill="#4a3670"/>
    <path d="M0 48 L1800 48 M0 76 L1800 76" stroke="#241735" stroke-width="6"/>
    <path d="M0 48 L120 76 L240 48 L360 76 L480 48 L600 76 L720 48 L840 76 L960 48 L1080 76 L1200 48 L1320 76 L1440 48 L1560 76 L1680 48 L1800 76"
      fill="none" stroke="#241735" stroke-width="5"/>
    ${lamps
      .map(
        (l) => `
    <g transform="translate(${l.x},76)">
      <rect x="-9" y="0" width="18" height="20" fill="#2a1c42"/>
      <path d="M-32 20 L32 20 L24 74 L-24 74 Z" fill="#1d1430" stroke="#4a3670" stroke-width="3"/>
      <ellipse cx="0" cy="74" rx="24" ry="7" fill="${l.gel}"/>
      <ellipse cx="0" cy="74" rx="24" ry="7" fill="#fff" opacity="0.35"/>
    </g>`,
      )
      .join("")}
  </g>`;
}

/** One cue in the rack: lamp, Q number, name, runtime, and a state flag. */
function cueRow(y, opts, lang) {
  const { q, name, time, state, flag } = opts;
  const face =
    state === "now"
      ? { fill: "#33220f", stroke: AMBER, lamp: STOP }
      : state === "next"
        ? { fill: "#122a1f", stroke: GO, lamp: "#1f3b2d" }
        : { fill: "#1b1229", stroke: "#33244f", lamp: "#2b1f42" };
  const nameSize = fitSize(name, 470, [40, 36, 32, 28]);

  return `
  <g transform="translate(96,${y})">
    <rect x="0" y="0" width="800" height="112" rx="14" fill="${face.fill}" stroke="${face.stroke}" stroke-width="${state === "plain" ? 2 : 3}"/>
    <rect x="0" y="0" width="9" height="112" rx="4" fill="${face.stroke}"/>
    <circle cx="46" cy="56" r="11" fill="${face.lamp}"/>
    ${state === "now" ? `<circle cx="46" cy="56" r="19" fill="none" stroke="${STOP}" stroke-width="3" opacity="0.5"/>` : ""}
    <text x="78" y="66" font-family="${mono(lang)}" font-size="30" font-weight="700" fill="${state === "plain" ? MUTED : AMBER}">${esc(q)}</text>
    <text x="166" y="68" font-family="${sans(lang, "URW Gothic")}" font-size="${nameSize}" font-weight="700" fill="${state === "plain" ? MUTED : INK}">${esc(name)}</text>
    <text x="778" y="66" text-anchor="end" font-family="${mono(lang)}" font-size="28" font-weight="700" fill="${state === "next" ? GO : MUTED}">${esc(time)}</text>
    ${
      flag
        ? `<g transform="translate(${800 - textWidth(flag, 24) - 150},14)">
      <rect x="0" y="0" width="${textWidth(flag, 24) + 40}" height="38" rx="19" fill="${state === "now" ? STOP : GO}"/>
      <text x="${(textWidth(flag, 24) + 40) / 2}" y="27" text-anchor="middle" font-family="${sans(lang, "URW Gothic")}" font-size="24" font-weight="800" fill="#0b0710">${esc(flag)}</text>
    </g>`
        : ""
    }
  </g>`;
}

/** The GO key, lit and waiting. Its size in the frame is the whole argument. */
function goKey(lang, caption) {
  const capSize = fitSize(caption, 470, [36, 32, 28, 25]);
  return `
  <g transform="translate(1010,392)">
    <ellipse cx="290" cy="235" rx="330" ry="70" fill="${GO}" opacity="0.14"/>
    <rect x="0" y="26" width="580" height="330" rx="52" fill="${GO_DEEP}"/>
    <rect x="0" y="0" width="580" height="330" rx="52" fill="url(#gokey)" stroke="#a6ffd0" stroke-width="5"/>
    <rect x="34" y="26" width="512" height="96" rx="48" fill="#ffffff" opacity="0.28"/>
    <g transform="translate(290,205)">
      <text text-anchor="middle" font-family="URW Gothic, sans-serif" font-size="188" font-weight="800" letter-spacing="18" fill="#04240f">GO</text>
    </g>
    <text x="290" y="${400 + (capSize - 32)}" text-anchor="middle" font-family="${sans(lang, "URW Gothic")}" font-size="${capSize}" font-weight="800" fill="${GO}">${esc(caption)}</text>
    <path d="M290 372 L290 344 M274 358 L290 344 L306 358" stroke="${GO}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function svgFor(job) {
  const { lang, title, tagline, cues, stopFlag, nextFlag, goCaption } = job;
  const titleSize = fitSize(title, 700, [92, 80, 70, 62, 54]);
  const tagSize = fitSize(tagline, 860, [34, 30, 27, 24, 22]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="house" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1d1231"/>
      <stop offset="52%" stop-color="#0d0813"/>
      <stop offset="100%" stop-color="#070409"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="0%" r="78%">
      <stop offset="0%" stop-color="rgba(255,176,32,0.34)"/>
      <stop offset="60%" stop-color="rgba(255,176,32,0.07)"/>
      <stop offset="100%" stop-color="rgba(255,176,32,0)"/>
    </radialGradient>
    <radialGradient id="gokey" cx="50%" cy="4%" r="98%">
      <stop offset="0%" stop-color="#8dfbc0"/>
      <stop offset="46%" stop-color="#35e07d"/>
      <stop offset="100%" stop-color="#12a95c"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.14)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#house)"/>
  <path d="M1300 96 L1560 96 L1800 780 L1060 780 Z" fill="url(#beam)" opacity="0.55"/>
  <path d="M240 96 L400 96 L520 700 L60 700 Z" fill="${MAGENTA}" opacity="0.05"/>
  <rect width="1800" height="945" fill="url(#spot)"/>
  ${haze()}
  ${truss()}

  <!-- Stage floor line: the deck sits on boards, not on a gradient. -->
  <rect x="0" y="874" width="1800" height="71" fill="#0a060e"/>
  <rect x="0" y="874" width="1800" height="5" fill="${AMBER}" opacity="0.55"/>
  <g opacity="0.5">
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${i * 240 + 30}" y="882" width="180" height="10" rx="5" fill="#1a1029"/>`).join("")}
  </g>

  <text x="96" y="${196 + (titleSize - 92) * 0.4}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
  <rect x="96" y="${222 + titleSize * 0.12}" width="${Math.min(880, textWidth(title, titleSize) + 40)}" height="6" rx="3" fill="${AMBER}"/>
  <text x="96" y="${292 + titleSize * 0.12}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${AMBER}">${esc(tagline)}</text>

  ${cueRow(372, { q: "Q1", name: cues[0][0], time: cues[0][1], state: "now", flag: stopFlag }, lang)}
  ${cueRow(498, { q: "Q2", name: cues[1][0], time: cues[1][1], state: "next", flag: nextFlag }, lang)}
  ${cueRow(624, { q: "Q3", name: cues[2][0], time: cues[2][1], state: "plain" }, lang)}
  ${cueRow(750, { q: "Q4", name: cues[3][0], time: cues[3][1], state: "plain" }, lang)}

  ${goKey(lang, goCaption)}
</svg>`;
}

/** App icon: the GO key seen head on, under one warm lamp. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="k" cx="50%" cy="4%" r="98%">
      <stop offset="0%" stop-color="#8dfbc0"/>
      <stop offset="46%" stop-color="#35e07d"/>
      <stop offset="100%" stop-color="#12a95c"/>
    </radialGradient>
    <radialGradient id="sp" cx="50%" cy="0%" r="80%">
      <stop offset="0%" stop-color="rgba(255,176,32,0.42)"/>
      <stop offset="100%" stop-color="rgba(255,176,32,0)"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="#0b0710"/>
  <rect width="512" height="512" fill="url(#sp)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="46" y="52" width="420" height="26" rx="8" fill="#2a1c42"/>
    <rect x="46" y="52" width="420" height="8" rx="4" fill="#4a3670"/>
    <circle cx="122" cy="104" r="17" fill="${MAGENTA}"/>
    <circle cx="256" cy="104" r="17" fill="${AMBER}"/>
    <circle cx="390" cy="104" r="17" fill="${CYAN}"/>
    <rect x="56" y="196" width="400" height="230" rx="56" fill="${GO_DEEP}"/>
    <rect x="56" y="170" width="400" height="230" rx="56" fill="url(#k)" stroke="#a6ffd0" stroke-width="8"/>
    <rect x="86" y="192" width="340" height="64" rx="32" fill="#ffffff" opacity="0.3"/>
    <text x="256" y="352" text-anchor="middle" font-family="URW Gothic, sans-serif" font-size="150" font-weight="800" letter-spacing="10" fill="#04240f">GO</text>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: HOUSE })
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
      title: "플레이큐",
      tagline: "한 곡이 끝나면 멈춥니다. 누르면 다음. 이 기기에만.",
      cues: [
        ["오프닝 음악", "2:14"],
        ["등장 브금", "0:38"],
        ["박수 소리", "0:12"],
        ["마무리 곡", "3:05"],
      ],
      stopFlag: "끝나면 정지",
      nextFlag: "다음",
      goCaption: "눌러야 다음 곡",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Playcue",
      tagline: "It stops when the track ends. Tap for the next.",
      cues: [
        ["Opening music", "2:14"],
        ["Walk-on bed", "0:38"],
        ["Applause sting", "0:12"],
        ["Closing track", "3:05"],
      ],
      stopFlag: "STOPPED",
      nextFlag: "NEXT",
      goCaption: "Tap for the next cue",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "プレイキュー",
      tagline: "曲が終わると止まります。押せば次。",
      cues: [
        ["オープニング曲", "2:14"],
        ["登場BGM", "0:38"],
        ["拍手の音", "0:12"],
        ["エンディング曲", "3:05"],
      ],
      stopFlag: "終わったら停止",
      nextFlag: "つぎ",
      goCaption: "押せば次のキュー",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "点播下曲",
      tagline: "播完就停，点一下才下一首。仅此设备。",
      cues: [
        ["开场音乐", "2:14"],
        ["登场背景乐", "0:38"],
        ["掌声音效", "0:12"],
        ["结束曲", "3:05"],
      ],
      stopFlag: "播完即停",
      nextFlag: "下一首",
      goCaption: "点一下才播下一首",
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

  // Maskable art is cropped to a circle on Android, so the key gets its own
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
