// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Listenpad card: a listening booth.
 *
 * The product is a drill player for one audio file, so the picture is the
 * deck itself: a navy booth with a teal waveform, an amber A–B band with its
 * markers, a scrubber with time labels, the four big teal short-rewind
 * buttons, a white Play pill and the speed chips. Headphones sit in the
 * corner. Four real jobs (ko/en/ja/zh), each its own SVG → PNG with real CJK
 * glyphs from Noto Sans CJK; zh is never an alias of en. No photos, no
 * generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 245, g: 242, b: 234, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans Mono, DejaVu Sans, Noto Sans CJK ${CJK[lang]}, monospace`;

const INK = "#0f172a";
const MUTED = "#526073";
const LINE = "#e0dbcf";
const NAVY = "#0f172a";
const NAVY2 = "#1e293b";
const NAVY3 = "#334155";
const NAVY_MUTED = "#94a3b8";
const TEAL = "#14b8a6";
const TEAL_DEEP = "#0f766e";
const TEAL_SOFT = "#ccfbf1";
const CYAN = "#06b6d4";
const AMBER = "#f59e0b";
const AMBER_DEEP = "#b45309";
const AMBER_INK = "#78350f";
const NOTICE = "#fcd34d";
const NOTICE_INK = "#3b2a05";
const WHITE = "#ffffff";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.6;
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

/** Deterministic waveform bars; the played part is bright, the A–B band amber. */
function waveform(job) {
  const x0 = 36;
  const x1 = 1044;
  const n = 96;
  const step = (x1 - x0) / n;
  const midY = 96;
  const played = job.playedFrac;
  const aFrac = job.aFrac;
  const bFrac = job.bFrac;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const f = i / n;
    const h = 10 + 34 * Math.abs(Math.sin(i * 0.53)) + 22 * Math.abs(Math.cos(i * 1.31 + 0.4)) + 8 * Math.abs(Math.sin(i * 3.7));
    const inLoop = f >= aFrac && f <= bFrac;
    const fill = inLoop ? AMBER : f <= played ? TEAL : NAVY3;
    const opacity = inLoop ? 0.95 : f <= played ? 0.95 : 0.9;
    out.push(`<rect x="${(x0 + i * step).toFixed(1)}" y="${(midY - h / 2).toFixed(1)}" width="${(step - 3).toFixed(1)}" height="${h.toFixed(1)}" rx="2.5" fill="${fill}" opacity="${opacity}"/>`);
  }
  const ax = x0 + (x1 - x0) * aFrac;
  const bx = x0 + (x1 - x0) * bFrac;
  out.push(`<rect x="${ax.toFixed(1)}" y="30" width="${(bx - ax).toFixed(1)}" height="132" fill="${AMBER}" opacity="0.12" rx="6"/>`);
  for (const [x, label] of [[ax, "A"], [bx, "B"]]) {
    out.push(`<rect x="${(x - 1.5).toFixed(1)}" y="30" width="3" height="132" fill="${AMBER}"/>`);
    out.push(`<rect x="${(x - 16).toFixed(1)}" y="8" width="32" height="26" rx="7" fill="${AMBER}"/>`);
    out.push(`<text x="${x.toFixed(1)}" y="27" text-anchor="middle" font-size="18" font-weight="800" font-family="${figures(job.lang)}" fill="${AMBER_INK}">${label}</text>`);
  }
  // scrubber under the wave
  const px = x0 + (x1 - x0) * played;
  out.push(`<rect x="${x0}" y="176" width="${x1 - x0}" height="8" rx="4" fill="${NAVY3}"/>`);
  out.push(`<rect x="${x0}" y="176" width="${(px - x0).toFixed(1)}" height="8" rx="4" fill="${TEAL}"/>`);
  out.push(`<circle cx="${px.toFixed(1)}" cy="180" r="12" fill="${WHITE}" stroke="${TEAL}" stroke-width="4"/>`);
  out.push(`<text x="${x0}" y="212" font-size="18" font-weight="800" font-family="${figures(job.lang)}" fill="${WHITE}">${esc(job.timeNow)}</text>`);
  out.push(`<text x="${x1}" y="212" text-anchor="end" font-size="18" font-weight="700" font-family="${figures(job.lang)}" fill="${NAVY_MUTED}">${esc(job.timeAll)}</text>`);
  out.push(`<text x="${((ax + bx) / 2).toFixed(1)}" y="212" text-anchor="middle" font-size="17" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${AMBER}">${esc(job.loopLabel)}</text>`);
  return out.join("");
}

/** The transport row: four teal rewind pills, the white Play pill, speed chips. */
function transport(job) {
  const out = [];
  let x = 36;
  const y = 232;
  for (const n of [1, 2, 3, 4]) {
    const w = 106;
    const on = n === job.rewindOn;
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="76" rx="18" fill="${TEAL}" stroke="${on ? WHITE : TEAL_DEEP}" stroke-width="${on ? 4 : 2}"/>`);
    out.push(`<path d="M${x + 22} ${y + 38}l14 -9v18zM${x + 36} ${y + 38}l14 -9v18z" fill="#042f2e"/>`);
    out.push(`<text x="${x + 76}" y="${y + 48}" text-anchor="middle" font-size="30" font-weight="800" font-family="${figures(job.lang)}" fill="#042f2e">${n}s</text>`);
    x += w + 10;
  }
  // play pill
  const px = 512;
  const pw = 226;
  out.push(`<rect x="${px}" y="${y}" width="${pw}" height="76" rx="38" fill="${WHITE}"/>`);
  out.push(`<path d="M${px + 34} ${y + 22}v32l26 -16z" fill="${NAVY}"/>`);
  out.push(`<text x="${px + 76}" y="${y + 49}" font-size="30" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${NAVY}">${esc(job.play)}</text>`);
  // speed chips
  let sx = 760;
  for (const s of job.speeds) {
    const w = Math.ceil(textWidth(s.label, 22) + 26);
    out.push(`<rect x="${sx}" y="${y + 8}" width="${w}" height="60" rx="14" fill="${s.on ? WHITE : "rgba(255,255,255,0.08)"}" stroke="${s.on ? WHITE : NAVY3}" stroke-width="2"/>`);
    out.push(`<text x="${sx + w / 2}" y="${y + 46}" text-anchor="middle" font-size="22" font-weight="800" font-family="${figures(job.lang)}" fill="${s.on ? NAVY : NAVY_MUTED}">${esc(s.label)}</text>`);
    sx += w + 8;
  }
  return out.join("");
}

function headphones(x, y, s) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <path d="M12 44v-12a24 24 0 0 1 48 0v12" fill="none" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/>
    <rect x="4" y="36" width="18" height="26" rx="7" fill="${TEAL}" stroke="${NAVY}" stroke-width="3"/>
    <rect x="50" y="36" width="18" height="26" rx="7" fill="${TEAL}" stroke="${NAVY}" stroke-width="3"/>
  </g>`;
}

function svgFor(job) {
  const titleSize = fitSize(job.title, 640, [58, 52, 46, 40]);
  const sub = truncate(job.subtitle, 23, 980);
  const badge = job.badge;
  const chips = job.chips.reduce(
    (acc, c) => {
      const w = Math.ceil(textWidth(c, 16) + 26);
      const x = acc.x;
      acc.out.push(
        `<rect x="${x}" y="572" width="${w}" height="34" rx="17" fill="${TEAL_SOFT}"/>` +
          `<text x="${x + 13}" y="595" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${TEAL_DEEP}">${esc(c)}</text>`,
      );
      acc.x += w + 10;
      return acc;
    },
    { x: 60, out: [] },
  ).out;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="booth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY2}"/>
      <stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TEAL}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${CYAN}" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#f5f2ea"/>
  <circle cx="1090" cy="-30" r="300" fill="url(#wash)"/>
  <circle cx="-30" cy="680" r="240" fill="${AMBER}" opacity="0.16"/>
  <rect x="36" y="28" width="1128" height="574" rx="28" fill="${WHITE}" stroke="${LINE}" stroke-width="2" opacity="0.6"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${NAVY}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${NOTICE}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${NOTICE_INK}">${esc(badge)}</text>

  <text x="70" y="140" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${NAVY}">${esc(job.title)}</text>
  <text x="70" y="176" font-size="23" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>
  ${headphones(1040, 52, 1.5)}

  <g transform="translate(60,206)">
    <rect width="1080" height="340" rx="26" fill="url(#booth)"/>
    <rect x="0" y="0" width="1080" height="6" rx="3" fill="${TEAL}" opacity="0.8"/>
    ${waveform(job)}
    ${transport(job)}
  </g>
  ${chips.join("")}

  <text x="1136" y="596" text-anchor="end" font-size="16" font-weight="700" font-family="${figures(job.lang)}" fill="${TEAL_DEEP}">listenpad.try-dabble.com</text>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  const u = inner / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#f5f2ea"/>
  <g transform="translate(${pad},${pad}) scale(${u})">
    <rect x="6" y="6" width="52" height="52" rx="14" fill="${NAVY}"/>
    <path d="M17 40v-8a15 15 0 0 1 30 0v8" fill="none" stroke="${TEAL}" stroke-width="4" stroke-linecap="round"/>
    <rect x="13" y="35" width="10" height="15" rx="4" fill="${TEAL}"/>
    <rect x="41" y="35" width="10" height="15" rx="4" fill="${TEAL}"/>
    <path d="M31 46l-6 4.5 6 4.5zM38 46l-6 4.5 6 4.5z" fill="${AMBER}"/>
  </g>
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
  const shared = { playedFrac: 0.46, aFrac: 0.31, bFrac: 0.47, rewindOn: 2, timeNow: "2:07", timeAll: "4:35" };
  const jobs = [
    {
      ...shared,
      lang: "ko",
      title: "리슨패드",
      subtitle: "무료 로컬 언어 듣기 플레이어. 한 탭 짧은 되감기, A–B 구간 반복, 배속.",
      badge: "오디오는 이 기기에만",
      loopLabel: "A–B 반복 중 1:25 – 2:09",
      play: "재생",
      speeds: [{ label: "0.75×", on: true }, { label: "0.9×" }, { label: "1×" }],
      chips: ["로그인 없음", "업로드 없음", "되감기·구간반복 무료", "1–4초 되감기", "광고 없음"],
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      ...shared,
      lang: "en",
      title: "Listenpad",
      subtitle: "Free local language-listening player. One-tap short rewind, A–B loop, speed.",
      badge: "Audio stays on this device",
      loopLabel: "Looping A–B 1:25 – 2:09",
      play: "Play",
      speeds: [{ label: "0.75×", on: true }, { label: "0.9×" }, { label: "1×" }],
      chips: ["No login", "No upload", "Rewind & loop free", "Short 1–4s rewind", "No ads"],
      files: ["og-image-en.png"],
    },
    {
      ...shared,
      lang: "ja",
      title: "リッスンパッド",
      subtitle: "無料のローカル語学リスニングプレーヤー。ワンタップ短戻し、A–Bループ、速度調整。",
      badge: "音声はこの端末だけ",
      loopLabel: "A–Bループ中 1:25 – 2:09",
      play: "再生",
      speeds: [{ label: "0.75×", on: true }, { label: "0.9×" }, { label: "1×" }],
      chips: ["ログイン不要", "アップロードなし", "戻し・ループ無料", "1–4秒の短戻し", "広告なし"],
      files: ["og-image-ja.png"],
    },
    {
      ...shared,
      lang: "zh",
      title: "听力练习板",
      subtitle: "免费本地听力练习播放器。一键短回退、A–B 循环、变速。",
      badge: "音频仅在此设备",
      loopLabel: "A–B 循环中 1:25 – 2:09",
      play: "播放",
      speeds: [{ label: "0.75×", on: true }, { label: "0.9×" }, { label: "1×" }],
      chips: ["无需登录", "无上传", "回退与循环免费", "1–4 秒短回退", "无广告"],
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
