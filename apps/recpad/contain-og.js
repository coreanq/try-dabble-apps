// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Recpad card: a studio-warm desk.
 *
 * The product is record → waveform → select → clean/trim → export, so the
 * picture is a cream tape card with a teal waveform, an amber selection with
 * handles, a plum playhead, a big coral Record button, an edit toolbar and
 * the two export buttons. Four real jobs (ko/en/ja/zh), each its own SVG →
 * PNG with real CJK type; zh is never an alias of en. No photos, no
 * generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 247, g: 240, b: 230, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const serif = (lang) => `Noto Serif CJK ${CJK[lang]}, DejaVu Serif, serif`;
const mono = (lang) => `DejaVu Sans Mono, Noto Sans CJK ${CJK[lang]}, monospace`;

const CREAM = "#f7f0e6";
const CREAM2 = "#efe4d3";
const SHEET = "#fffaf3";
const INK = "#2a1f2b";
const MUTED = "#6b5a6a";
const LINE = "#e3d7c6";
const PLUM = "#4a1942";
const PLUM_DEEP = "#33102d";
const PLUM_SOFT = "#eadfe8";
const TEAL = "#0d9488";
const TEAL_DEEP = "#0f766e";
const TEAL_SOFT = "#d5f0ea";
const CORAL = "#e11d48";
const CORAL_DEEP = "#be123c";
const AMBER = "#d97706";
const AMBER_BRIGHT = "#f6c453";
const AMBER_SOFT = "#fdebc8";
const AMBER_INK = "#4a2c05";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.53;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

function truncate(text, size, maxWidth) {
  if (textWidth(text, size) <= maxWidth) return text;
  const chars = [...String(text)];
  while (chars.length > 1 && textWidth(chars.join("") + "…", size) > maxWidth) chars.pop();
  return chars.join("").trimEnd() + "…";
}

/** Deterministic waveform: three plucked notes over a soft floor, per-language seed so each card differs. */
function waveColumns(count, seed) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const cols = [];
  const onsets = [0.12 + rnd() * 0.05, 0.42 + rnd() * 0.05, 0.7 + rnd() * 0.05];
  for (let i = 0; i < count; i++) {
    const x = i / count;
    let env = 0.05 + rnd() * 0.05;
    for (const o of onsets) {
      if (x >= o) env = Math.max(env, Math.exp(-(x - o) * 7) * (0.9 + rnd() * 0.1));
    }
    const jitter = 0.65 + rnd() * 0.35;
    cols.push(Math.min(1, env * jitter));
  }
  return cols;
}

function waveform(job, x, y, w, h) {
  const count = 150;
  const colW = w / count;
  const cols = waveColumns(count, job.seed);
  const selA = Math.round(count * job.selection[0]);
  const selB = Math.round(count * job.selection[1]);
  const mid = h / 2;
  const bars = cols
    .map((v, i) => {
      const bh = Math.max(3, v * (h - 24));
      const inSel = i >= selA && i < selB;
      return `<rect x="${(i * colW + 1).toFixed(1)}" y="${(mid - bh / 2).toFixed(1)}" width="${(colW - 2).toFixed(1)}" height="${bh.toFixed(1)}" rx="1.5" fill="${inSel ? TEAL_DEEP : TEAL}"/>`;
    })
    .join("");
  const sx = selA * colW;
  const ex = selB * colW;
  const px = Math.round(count * job.playhead) * colW;
  return `
  <g transform="translate(${x},${y})">
    <rect width="${w}" height="${h}" rx="14" fill="${SHEET}" stroke="${LINE}" stroke-width="2"/>
    <line x1="0" y1="${mid}" x2="${w}" y2="${mid}" stroke="${PLUM}" stroke-opacity="0.14" stroke-width="1"/>
    <rect x="${sx}" y="0" width="${ex - sx}" height="${h}" fill="${AMBER}" fill-opacity="0.16"/>
    ${bars}
    <rect x="${sx - 1.5}" y="0" width="3" height="${h}" fill="${AMBER}"/>
    <rect x="${ex - 1.5}" y="0" width="3" height="${h}" fill="${AMBER}"/>
    <circle cx="${sx}" cy="12" r="7" fill="${AMBER}"/>
    <circle cx="${ex}" cy="12" r="7" fill="${AMBER}"/>
    <circle cx="${sx}" cy="${h - 12}" r="7" fill="${AMBER}"/>
    <circle cx="${ex}" cy="${h - 12}" r="7" fill="${AMBER}"/>
    <rect x="${px - 1.5}" y="0" width="3" height="${h}" fill="${PLUM}"/>
    <path d="M${px - 8} 0 h16 l-8 10 z" fill="${PLUM}"/>
    <rect x="${sx + 8}" y="${h - 40}" width="${Math.ceil(textWidth(job.selLabel, 15) + 18)}" height="26" rx="6" fill="${AMBER_SOFT}" stroke="${AMBER}" stroke-width="1.5"/>
    <text x="${sx + 17}" y="${h - 22}" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(job.selLabel)}</text>
  </g>`;
}

function pill(x, y, label, lang, kind) {
  const w = Math.ceil(textWidth(label, 17) + 30);
  const fill = kind === "primary" ? PLUM : kind === "teal" ? TEAL : SHEET;
  const stroke = kind === "primary" ? PLUM_DEEP : kind === "teal" ? TEAL_DEEP : LINE;
  const color = kind === "primary" || kind === "teal" ? "#fff" : INK;
  return {
    w,
    svg: `
    <rect x="${x}" y="${y}" width="${w}" height="38" rx="19" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <text x="${x + 15}" y="${y + 25}" font-size="17" font-weight="800" font-family="${sans(lang)}" fill="${color}">${esc(label)}</text>`,
  };
}

function toolbar(job, x, y, labels, kinds) {
  let cx = 0;
  const parts = labels.map((l, i) => {
    const p = pill(cx, 0, l, job.lang, kinds[i]);
    cx += p.w + 10;
    return p.svg;
  });
  return `<g transform="translate(${x},${y})">${parts.join("")}</g>`;
}

function recordButton(x, y, label, lang) {
  const w = Math.ceil(textWidth(label, 26) + 92);
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="4" width="${w}" height="68" rx="34" fill="${CORAL_DEEP}"/>
    <rect x="0" y="0" width="${w}" height="68" rx="34" fill="${CORAL}"/>
    <circle cx="36" cy="34" r="12" fill="#fff"/>
    <text x="62" y="43" font-size="26" font-weight="800" font-family="${sans(lang)}" fill="#fff">${esc(label)}</text>
  </g>`;
}

function brandMark(x, y, size) {
  const s = size;
  const bar = (bx, by, bh) => `<rect x="${s * bx}" y="${s * by}" width="${s * 0.05}" height="${s * bh}" rx="${s * 0.025}" fill="${TEAL}"/>`;
  return `
  <g transform="translate(${x},${y})">
    <rect width="${s}" height="${s}" rx="${s * 0.16}" fill="${PLUM}"/>
    <rect x="${s * 0.08}" y="${s * 0.08}" width="${s * 0.84}" height="${s * 0.84}" rx="${s * 0.1}" fill="${CREAM}"/>
    ${bar(0.17, 0.42, 0.16)}
    ${bar(0.25, 0.33, 0.34)}
    ${bar(0.33, 0.23, 0.54)}
    ${bar(0.41, 0.37, 0.26)}
    ${bar(0.49, 0.28, 0.44)}
    ${bar(0.57, 0.4, 0.2)}
    ${bar(0.65, 0.45, 0.1)}
    <circle cx="${s * 0.74}" cy="${s * 0.74}" r="${s * 0.09}" fill="${CORAL}"/>
  </g>`;
}

function svgFor(job) {
  const titleSize = fitSize(job.title, 560, [64, 56, 48, 42]);
  const sub = truncate(job.subtitle, 24, 1060);
  const badge = job.badge;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.6" fill="${PLUM}" opacity="0.05"/>
      <circle cx="4" cy="4" r="0.5" fill="${TEAL}" opacity="0.05"/>
    </pattern>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TEAL_SOFT}"/>
      <stop offset="1" stop-color="${PLUM_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${CREAM}"/>
  <rect width="1200" height="630" fill="url(#grain)"/>
  <circle cx="1060" cy="-60" r="300" fill="url(#wash)" opacity="0.7"/>
  <circle cx="-60" cy="700" r="240" fill="${AMBER_SOFT}" opacity="0.8"/>

  ${brandMark(64, 44, 84)}
  <rect x="170" y="52" width="${Math.ceil(textWidth(badge, 19) + 28)}" height="34" rx="17" fill="${AMBER_BRIGHT}"/>
  <text x="184" y="76" font-size="19" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(badge)}</text>
  <text x="170" y="${100 + titleSize * 0.55}" font-size="${titleSize}" font-weight="700" font-family="${serif(job.lang)}" fill="${PLUM}">${esc(job.title)}</text>
  <text x="64" y="192" font-size="24" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${waveform(job, 64, 222, 1072, 190)}

  ${recordButton(64, 440, job.recordLabel, job.lang)}
  ${toolbar(job, 64, 528, job.tools, ["teal", "plain", "plain", "primary"])}

  <g transform="translate(${1136 - 372},440)">
    <rect width="372" height="68" rx="16" fill="${SHEET}" stroke="${LINE}" stroke-width="2"/>
    ${(() => {
      const a = pill(14, 15, job.wavLabel, job.lang, "teal");
      const b = pill(14 + a.w + 10, 15, job.mp3Label, job.lang, "teal");
      return a.svg + b.svg;
    })()}
  </g>
  <g transform="translate(${1136 - 372},528)">
    ${job.promises
      .map((p, i) => {
        const cx = i === 0 ? 0 : job.promises.slice(0, i).reduce((acc, q) => acc + Math.ceil(textWidth(q, 16) + 40) + 8, 0);
        const w = Math.ceil(textWidth(p, 16) + 40);
        return `
        <rect x="${cx}" y="0" width="${w}" height="36" rx="18" fill="${TEAL_SOFT}"/>
        <circle cx="${cx + 18}" cy="18" r="8" fill="${SHEET}"/>
        <path d="M${cx + 13.5} 18 l3.5 3.5 l6 -7" fill="none" stroke="${TEAL_DEEP}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${cx + 32}" y="24" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${TEAL_DEEP}">${esc(p)}</text>`;
      })
      .join("")}
  </g>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="${CREAM}"/>
  ${brandMark(pad, pad, inner)}
</svg>`;
}

async function contain(buf, dest) {
  await sharp(buf)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .flatten({ background: PAPER })
    .png()
    .toFile(dest);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  const jobs = [
    {
      lang: "ko",
      seed: 11,
      title: "렉패드",
      subtitle: "무료 로컬 연습 녹음. 마이크 녹음, 노이즈 정리, 자르기, WAV·MP3 내보내기.",
      badge: "이 기기에서만 처리",
      selection: [0.4, 0.68],
      playhead: 0.47,
      selLabel: "선택 구간 0:01.6 – 0:02.7",
      recordLabel: "녹음",
      tools: ["선택 구간만 남기기", "선택 구간 삭제", "되돌리기", "노이즈 줄이기"],
      wavLabel: "WAV 내려받기",
      mp3Label: "MP3 내려받기",
      promises: ["중간 광고 없음", "계정 없음", "업로드 없음"],
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      seed: 23,
      title: "Recpad",
      subtitle: "Free local practice recorder. Mic record, noise clean, trim, export WAV or MP3.",
      badge: "On-device only",
      selection: [0.38, 0.66],
      playhead: 0.45,
      selLabel: "Selection 0:01.5 – 0:02.6",
      recordLabel: "Record",
      tools: ["Trim to selection", "Cut selection", "Undo", "Noise reduce"],
      wavLabel: "Download WAV",
      mp3Label: "Download MP3",
      promises: ["No mid-use ads", "No account", "No upload"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      seed: 37,
      title: "レックパッド",
      subtitle: "無料のローカル練習レコーダー。マイク録音、ノイズ除去、トリム、WAV/MP3書き出し。",
      badge: "この端末だけで処理",
      selection: [0.41, 0.7],
      playhead: 0.5,
      selLabel: "選択範囲 0:01.6 – 0:02.8",
      recordLabel: "録音",
      tools: ["選択範囲だけ残す", "選択範囲を削除", "元に戻す", "ノイズを減らす"],
      wavLabel: "WAVをダウンロード",
      mp3Label: "MP3をダウンロード",
      promises: ["途中の広告なし", "アカウント不要", "アップロードなし"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      seed: 53,
      title: "录音板",
      subtitle: "免费本地练习录音。麦克风录制、降噪、裁剪，导出 WAV 或 MP3。",
      badge: "仅在此设备处理",
      selection: [0.39, 0.67],
      playhead: 0.46,
      selLabel: "选区 0:01.5 – 0:02.7",
      recordLabel: "录制",
      tools: ["只保留选区", "删除选区", "撤销", "降低噪声"],
      wavLabel: "下载 WAV",
      mp3Label: "下载 MP3",
      promises: ["无中途广告", "无需账号", "不上传"],
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

  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons + og written");
}

main().catch((e) => { console.error(e); process.exit(1); });
