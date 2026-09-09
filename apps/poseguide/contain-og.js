// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Poseguide card: a phone viewfinder in a soft rose studio.
 *
 * The product is "a silhouette over your camera, a score, a voice in your
 * ear", so the picture is a portrait viewfinder with a translucent rose
 * figure inside it, a match ring in the corner, a hand-tip chip along the
 * bottom, and the fail-fix promises as pills beside it. Four real jobs
 * (ko/en/ja/zh), each its own SVG → PNG; zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const CREAM = { r: 255, g: 247, b: 245, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#3b1f27";
const MUTED = "#7a5560";
const LINE = "#f3d3d8";
const LINE2 = "#e9b9c2";
const ROSE = "#e11d48";
const ROSE_DEEP = "#be123c";
const ROSE_SOFT = "#ffe1e6";
const CORAL = "#fb7185";
const AMBER = "#f2c14e";
const AMBER_INK = "#3b2a05";
const LEAF = "#16a34a";
const PAPER = "#fffdfb";
const CHARCOAL = "#2a2226";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.56;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/** Wrap by rough width into at most `maxLines` lines. */
function wrap(text, size, maxWidth, maxLines) {
  const words = /[⺀-￿]/.test(text) ? Array.from(text) : text.split(" ");
  const joiner = /[⺀-￿]/.test(text) ? "" : " ";
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + joiner + w : w;
    if (textWidth(next, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

/** The rose silhouette inside the viewfinder: hand-on-hip, one arm up. */
function silhouette(x, y, s, opacity) {
  return `
  <g transform="translate(${x},${y}) scale(${s})" opacity="${opacity}" fill="${ROSE}" stroke="${ROSE}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="100" cy="42" r="30" stroke="none"/>
    <polygon points="62,84 138,84 128,190 72,190" stroke-width="22"/>
    <path d="M62 90 L30 150 L70 118" fill="none" stroke-width="22"/>
    <path d="M138 90 L176 40 L150 -6" fill="none" stroke-width="22"/>
    <path d="M78 190 L70 280 L66 360" fill="none" stroke-width="24"/>
    <path d="M122 190 L140 280 L146 360" fill="none" stroke-width="24"/>
  </g>`;
}

function ring(x, y, pct, lang) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const d = (pct / 100) * c;
  return `
  <g transform="translate(${x},${y})">
    <circle cx="0" cy="0" r="${r}" fill="rgba(255,247,245,0.9)" stroke="rgba(225,29,72,0.2)" stroke-width="12"/>
    <circle cx="0" cy="0" r="${r}" fill="none" stroke="${LEAF}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${d} ${c - d}" transform="rotate(-90)"/>
    <text x="0" y="14" text-anchor="middle" font-family="${figures(lang)}" font-size="38" font-weight="700" fill="${INK}">${pct}%</text>
  </g>`;
}

function promises(lang, items, x0, y0, maxWidth) {
  let x = x0;
  let y = y0;
  const out = [];
  for (const label of items) {
    const size = 27;
    const w = textWidth(label, size) + 44;
    if (x + w > x0 + maxWidth) {
      x = x0;
      y += 66;
    }
    out.push(`<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="52" rx="26" fill="#ffffff" stroke="${LINE2}" stroke-width="2.5"/>
      <text x="${w / 2}" y="36" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
    </g>`);
    x += w + 14;
  }
  return out.join("");
}

function svgFor(job) {
  const { lang, title, subtitle, handTip, local, promises: items, poseName } = job;
  const titleSize = fitSize(title, 820, [104, 92, 80, 70, 60]);
  const subSize = 34;
  const subLines = wrap(subtitle, subSize, 900, 3);
  const localSize = fitSize(local, 420, [28, 25, 22, 20]);
  const tipLines = wrap(handTip, 24, 400, 2);

  // Viewfinder on the right: 500 x 667 (3:4) with rounded corners.
  const vfX = 1190;
  const vfY = 100;
  const vfW = 480;
  const vfH = 640;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde4e4"/>
      <stop offset="45%" stop-color="#fff7f5"/>
      <stop offset="100%" stop-color="#fbeee9"/>
    </linearGradient>
    <radialGradient id="softbox" cx="0.72" cy="0.1" r="0.7">
      <stop offset="0%" stop-color="rgba(255,255,255,0.95)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <linearGradient id="vf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2d33"/>
      <stop offset="100%" stop-color="${CHARCOAL}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="${INK}" flood-opacity="0.18"/>
    </filter>
    <clipPath id="vfclip"><rect x="${vfX}" y="${vfY}" width="${vfW}" height="${vfH}" rx="40"/></clipPath>
  </defs>

  <rect width="1800" height="945" fill="url(#wall)"/>
  <rect width="1800" height="945" fill="url(#softbox)"/>
  <!-- studio backdrop roll -->
  <rect x="1060" y="0" width="740" height="945" fill="${ROSE_SOFT}" opacity="0.45"/>
  <ellipse cx="1430" cy="880" rx="360" ry="34" fill="rgba(59,31,39,0.10)"/>

  <g transform="translate(120,110)">
    <text x="0" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    ${subLines.map((line, i) => `<text x="4" y="${titleSize + 30 + (i + 1) * (subSize + 12)}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(line)}</text>`).join("")}
  </g>

  <!-- local-only tag -->
  <g transform="translate(120,${110 + titleSize + 30 + subLines.length * (subSize + 12) + 40})">
    <rect x="0" y="0" width="${textWidth(local, localSize) + 60}" height="${localSize + 34}" rx="16" fill="${AMBER}"/>
    <text x="30" y="${localSize + 9}" font-family="${sans(lang)}" font-size="${localSize}" font-weight="800" fill="${AMBER_INK}">${esc(local)}</text>
  </g>

  ${promises(lang, items, 120, 610, 960)}

  <!-- phone viewfinder -->
  <g filter="url(#shadow)">
    <rect x="${vfX - 18}" y="${vfY - 18}" width="${vfW + 36}" height="${vfH + 36}" rx="52" fill="${PAPER}" stroke="${LINE}" stroke-width="3"/>
  </g>
  <rect x="${vfX}" y="${vfY}" width="${vfW}" height="${vfH}" rx="40" fill="url(#vf)"/>
  <g clip-path="url(#vfclip)">
    <!-- thirds guide -->
    <g stroke="rgba(255,247,245,0.28)" stroke-width="2">
      <line x1="${vfX + vfW / 3}" y1="${vfY}" x2="${vfX + vfW / 3}" y2="${vfY + vfH}"/>
      <line x1="${vfX + (2 * vfW) / 3}" y1="${vfY}" x2="${vfX + (2 * vfW) / 3}" y2="${vfY + vfH}"/>
      <line x1="${vfX}" y1="${vfY + vfH / 3}" x2="${vfX + vfW}" y2="${vfY + vfH / 3}"/>
      <line x1="${vfX}" y1="${vfY + (2 * vfH) / 3}" x2="${vfX + vfW}" y2="${vfY + (2 * vfH) / 3}"/>
    </g>
    ${silhouette(vfX + 130, vfY + 120, 1.2, 0.72)}
    <!-- live skeleton, slightly off, tinted -->
    <g fill="none" stroke-linecap="round" stroke-width="6" opacity="0.95" transform="translate(${vfX + 130},${vfY + 120}) scale(1.2)">
      <path d="M62 92 L136 92" stroke="${LEAF}"/>
      <path d="M62 92 L34 148 L74 122" stroke="${LEAF}"/>
      <path d="M136 92 L170 46 L156 -2" stroke="#f59e0b"/>
      <path d="M62 92 L72 186 M136 92 L128 186 M72 186 L128 186" stroke="${LEAF}"/>
      <path d="M78 186 L72 278 L68 356 M122 186 L138 278 L144 356" stroke="${LEAF}"/>
    </g>
    <!-- hand tip chip -->
    <g transform="translate(${vfX + 20},${vfY + vfH - 20 - (tipLines.length * 30 + 22)})">
      <rect x="0" y="0" width="${vfW - 40}" height="${tipLines.length * 30 + 22}" rx="16" fill="rgba(255,247,245,0.94)"/>
      ${tipLines.map((line, i) => `<text x="18" y="${32 + i * 30}" font-family="${sans(lang)}" font-size="24" font-weight="700" fill="${INK}">${esc(line)}</text>`).join("")}
    </g>
    <!-- pose name badge -->
    <g transform="translate(${vfX + 20},${vfY + 20})">
      <rect x="0" y="0" width="${textWidth(poseName, 26) + 40}" height="46" rx="23" fill="rgba(255,247,245,0.92)"/>
      <text x="20" y="32" font-family="${sans(lang)}" font-size="26" font-weight="800" fill="${INK}">${esc(poseName)}</text>
    </g>
  </g>
  ${ring(vfX + vfW - 78, vfY + 82, 92, lang)}
  <!-- shutter -->
  <circle cx="${vfX + vfW / 2}" cy="${vfY + vfH + 70}" r="40" fill="${ROSE}" stroke="${PAPER}" stroke-width="6"/>
  <circle cx="${vfX + vfW / 2}" cy="${vfY + vfH + 70}" r="52" fill="none" stroke="${LINE2}" stroke-width="3"/>
  <circle cx="${vfX + vfW / 2 - 130}" cy="${vfY + vfH + 70}" r="26" fill="${PAPER}" stroke="${LINE2}" stroke-width="3"/>
  <circle cx="${vfX + vfW / 2 + 130}" cy="${vfY + vfH + 70}" r="26" fill="${PAPER}" stroke="${LINE2}" stroke-width="3"/>
  <path d="M${vfX + vfW / 2 - 142} ${vfY + vfH + 70} h24 M${vfX + vfW / 2 - 130} ${vfY + vfH + 58} v24" stroke="${ROSE_DEEP}" stroke-width="4" stroke-linecap="round"/>
  <path d="M${vfX + vfW / 2 + 118} ${vfY + vfH + 62} l12 8 l-12 8 z" fill="${ROSE_DEEP}"/>
  <text x="${vfX + vfW / 2}" y="${vfY + vfH + 150}" text-anchor="middle" font-family="${sans(lang)}" font-size="24" font-weight="700" fill="${CORAL}">${esc(job.frontRear)}</text>
</svg>`;
}

/** App icon: the rose viewfinder with a figure inside, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde4e4"/>
      <stop offset="55%" stop-color="#fff7f5"/>
      <stop offset="100%" stop-color="#fbeee9"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="48" y="80" width="416" height="352" rx="80" fill="${ROSE}"/>
    <rect x="80" y="112" width="352" height="288" rx="56" fill="#fff7f5"/>
    <path d="M112 176 v-32 h32 M368 144 h32 v32 M112 336 v32 h32 M368 368 h32 v-32" fill="none" stroke="${ROSE}" stroke-width="18" stroke-linecap="round"/>
    <circle cx="256" cy="192" r="34" fill="${ROSE}"/>
    <path d="M256 232 v72 M256 248 l-56 40 M256 248 l56 -40 M256 304 l-40 64 M256 304 l40 64" fill="none" stroke="${ROSE}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="256" cy="462" rx="180" ry="16" fill="rgba(59,31,39,0.12)"/>
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
      title: "포즈가이드",
      subtitle: "설치 없는 포즈 코치. 포즈 라이브러리, 실루엣 오버레이, 매치 점수, 음성 팁, 촬영. 전·후면. 핵심 포즈 무료. 계정 없음.",
      local: "데이터는 이 기기에만 · 클라우드 AI 없음",
      handTip: "손 위치: 손가락을 허리뼈에 올려 두세요",
      poseName: "한 손 허리",
      frontRear: "전면 · 후면",
      promises: ["핵심 포즈 무료", "구독 없음", "자동 촬영 기본 꺼짐", "카메라 재시도 안내", "남성·여성 포즈", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Poseguide",
      subtitle: "Free no-install pose coach. Library, silhouette overlay, match score, voice tips, capture. Front & rear. Core poses free. No account.",
      local: "Data this device only · No cloud AI",
      handTip: "Hands: fingertips on the hip bone",
      poseName: "Hand on hip",
      frontRear: "Front · Rear",
      promises: ["Core poses free", "No subscription", "Auto-capture off by default", "Camera retry help", "Male + female poses", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ポーズガイド",
      subtitle: "インストール不要のポーズコーチ。ライブラリ、シルエット重ね、マッチ得点、音声ヒント、撮影。前後カメラ。基本ポーズ無料。アカウント不要。",
      local: "データはこの端末だけ · クラウドAIなし",
      handTip: "手の位置: 指先を腰骨に添えます",
      poseName: "片手を腰に",
      frontRear: "前面 · 背面",
      promises: ["基本ポーズ無料", "サブスクなし", "自動撮影は初期オフ", "カメラ再試行の案内", "男性・女性ポーズ", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "姿势指南",
      subtitle: "免安装姿势教练。姿势库、轮廓叠加、匹配分数、语音提示、拍照。前后摄像头。核心姿势免费。无需账号。",
      local: "数据仅在此设备 · 无云端 AI",
      handTip: "手的位置：指尖放在髋骨上",
      poseName: "单手叉腰",
      frontRear: "前置 · 后置",
      promises: ["核心姿势免费", "无订阅", "自动拍照默认关闭", "摄像头重试帮助", "男性 + 女性姿势", "ko/en/ja/zh"],
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
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
