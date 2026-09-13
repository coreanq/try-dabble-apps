// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Scrubpad card: ink on rice paper, a privacy desk.
 *
 * The product is paste → detect → stable placeholder → review → copy, so the
 * picture is a parchment sheet with cinnabar redaction stamps on the left
 * and the scrubbed copy with amber [NAME_1] tokens on the right, plus a small
 * review list. Four real jobs (ko/en/ja/zh), each its own SVG → PNG; zh is
 * never an alias of en. No photos, no generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 244, g: 239, b: 228, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const serif = (lang) => `Noto Serif CJK ${CJK[lang]}, DejaVu Serif, serif`;
const mono = (lang) => `DejaVu Sans Mono, Noto Sans CJK ${CJK[lang]}, monospace`;

const PARCHMENT = "#f4efe4";
const PARCHMENT2 = "#ebe3d2";
const SHEET = "#fffdf7";
const INK = "#1f2a26";
const MUTED = "#5f6d66";
const LINE = "#dfd6c3";
const FOREST = "#1b5e4a";
const FOREST_DEEP = "#12463a";
const FOREST_SOFT = "#dcebe3";
const CINNABAR = "#c23b22";
const CINNABAR_SOFT = "#f7ddd5";
const AMBER = "#f0c05a";
const AMBER_SOFT = "#fbedc9";
const AMBER_INK = "#3b2a05";

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

/** A sheet of text where `line.parts` mixes plain runs with redaction stamps or amber tokens. */
function sheet(job, x, y, w, h, title, lines, kind) {
  const rows = lines
    .map((line, i) => {
      let cx = 22;
      const cy = 62 + i * 34;
      const parts = line
        .map((part) => {
          if (typeof part === "string") {
            const out = `<text x="${cx}" y="${cy}" font-size="19" font-weight="600" font-family="${sans(job.lang)}" fill="${INK}">${esc(part)}</text>`;
            cx += textWidth(part, 19);
            return out;
          }
          const pw = Math.ceil(textWidth(part.text, 18) + 18);
          let out;
          if (kind === "original") {
            out = `<rect x="${cx}" y="${cy - 19}" width="${pw}" height="26" rx="5" fill="${CINNABAR_SOFT}"/>
              <rect x="${cx}" y="${cy + 6}" width="${pw}" height="3" rx="1.5" fill="${CINNABAR}"/>
              <text x="${cx + 9}" y="${cy}" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="#7a2414">${esc(part.text)}</text>`;
          } else {
            out = `<rect x="${cx}" y="${cy - 19}" width="${pw}" height="26" rx="6" fill="${AMBER_SOFT}" stroke="${AMBER}" stroke-width="1.5"/>
              <text x="${cx + 9}" y="${cy}" font-size="17" font-weight="800" font-family="${mono(job.lang)}" fill="${AMBER_INK}">${esc(part.text)}</text>`;
          }
          cx += pw + 4;
          return out;
        })
        .join("");
      return parts;
    })
    .join("");
  return `
  <g transform="translate(${x},${y})">
    <rect width="${w}" height="${h}" rx="16" fill="${SHEET}" stroke="${LINE}" stroke-width="2"/>
    <rect width="${w}" height="6" rx="3" fill="${kind === "original" ? CINNABAR : FOREST}"/>
    <text x="22" y="34" font-size="15" font-weight="800" letter-spacing="1.5" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(title)}</text>
    ${rows}
  </g>`;
}

function reviewList(job, x, y, w) {
  return `
  <g transform="translate(${x},${y})">
    <rect width="${w}" height="156" rx="16" fill="${PARCHMENT2}"/>
    <text x="20" y="32" font-size="15" font-weight="800" letter-spacing="1.5" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.reviewLabel)}</text>
    ${job.review
      .map((r, i) => {
        const cy = 64 + i * 32;
        const bw = Math.ceil(textWidth(r.badge, 12) + 16);
        return `
        <rect x="20" y="${cy - 14}" width="18" height="18" rx="4" fill="${r.on ? FOREST : SHEET}" stroke="${FOREST_DEEP}" stroke-width="1.5"/>
        ${r.on ? `<path d="M24 ${cy - 5} l4 4 l7 -8" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
        <rect x="48" y="${cy - 14}" width="${bw}" height="19" rx="4" fill="${r.badge === "KEY" || r.badge === "CARD" || r.badge === "키" || r.badge === "카드" || r.badge === "キー" || r.badge === "カード" || r.badge === "密钥" || r.badge === "卡号" ? CINNABAR_SOFT : FOREST_SOFT}"/>
        <text x="${48 + 8}" y="${cy}" font-size="12" font-weight="800" letter-spacing="1" font-family="${sans(job.lang)}" fill="${FOREST_DEEP}">${esc(r.badge)}</text>
        <text x="${48 + bw + 12}" y="${cy}" font-size="16" font-weight="600" font-family="${mono(job.lang)}" fill="${INK}" text-decoration="${r.on ? "line-through" : "none"}">${esc(r.original)}</text>
        <text x="${w - 20}" y="${cy}" text-anchor="end" font-size="15" font-weight="800" font-family="${mono(job.lang)}" fill="${AMBER_INK}">${esc(r.token)}</text>`;
      })
      .join("")}
  </g>`;
}

function stampMark(x, y, size) {
  const s = size;
  return `
  <g transform="translate(${x},${y})">
    <rect width="${s}" height="${s}" rx="${s * 0.14}" fill="${FOREST}"/>
    <rect x="${s * 0.08}" y="${s * 0.08}" width="${s * 0.84}" height="${s * 0.84}" rx="${s * 0.09}" fill="${PARCHMENT}"/>
    <rect x="${s * 0.2}" y="${s * 0.26}" width="${s * 0.6}" height="${s * 0.06}" rx="${s * 0.03}" fill="${INK}"/>
    <rect x="${s * 0.2}" y="${s * 0.42}" width="${s * 0.3}" height="${s * 0.06}" rx="${s * 0.03}" fill="${INK}"/>
    <rect x="${s * 0.55}" y="${s * 0.395}" width="${s * 0.25}" height="${s * 0.11}" rx="${s * 0.03}" fill="${CINNABAR}"/>
    <rect x="${s * 0.2}" y="${s * 0.58}" width="${s * 0.6}" height="${s * 0.06}" rx="${s * 0.03}" fill="${INK}"/>
    <rect x="${s * 0.2}" y="${s * 0.74}" width="${s * 0.18}" height="${s * 0.06}" rx="${s * 0.03}" fill="${INK}"/>
    <rect x="${s * 0.45}" y="${s * 0.715}" width="${s * 0.35}" height="${s * 0.11}" rx="${s * 0.03}" fill="${AMBER}"/>
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
      <circle cx="1" cy="1" r="0.6" fill="${INK}" opacity="0.05"/>
      <circle cx="4" cy="4" r="0.5" fill="${FOREST}" opacity="0.05"/>
    </pattern>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${FOREST_SOFT}"/>
      <stop offset="1" stop-color="${CINNABAR_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${PARCHMENT}"/>
  <rect width="1200" height="630" fill="url(#grain)"/>
  <circle cx="1060" cy="-60" r="300" fill="url(#wash)" opacity="0.6"/>
  <circle cx="-60" cy="700" r="240" fill="${AMBER_SOFT}" opacity="0.8"/>

  ${stampMark(64, 44, 84)}
  <rect x="170" y="52" width="${Math.ceil(textWidth(badge, 19) + 28)}" height="34" rx="17" fill="${AMBER}"/>
  <text x="184" y="76" font-size="19" font-weight="800" font-family="${sans(job.lang)}" fill="${AMBER_INK}">${esc(badge)}</text>
  <text x="170" y="${100 + titleSize * 0.55}" font-size="${titleSize}" font-weight="700" font-family="${serif(job.lang)}" fill="${FOREST_DEEP}">${esc(job.title)}</text>
  <text x="64" y="192" font-size="24" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${sheet(job, 64, 222, 520, 200, job.originalLabel, job.originalLines, "original")}
  <g transform="translate(596,306)">
    <path d="M0 8 h28 m-10 -10 l12 10 l-12 10" fill="none" stroke="${FOREST}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  ${sheet(job, 640, 222, 496, 200, job.scrubbedLabel, job.scrubbedLines, "scrubbed")}

  ${reviewList(job, 64, 440, 700)}

  <g transform="translate(788,440)">
    <rect width="348" height="156" rx="16" fill="${SHEET}" stroke="${LINE}" stroke-width="2"/>
    ${job.promises
      .map((p, i) => {
        const cy = 40 + i * 36;
        return `
        <circle cx="26" cy="${cy - 6}" r="9" fill="${FOREST_SOFT}"/>
        <path d="M21 ${cy - 6} l3.5 3.5 l6 -7" fill="none" stroke="${FOREST_DEEP}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="46" y="${cy}" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${INK}">${esc(p)}</text>`;
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
  <rect width="${s}" height="${s}" fill="${PARCHMENT}"/>
  ${stampMark(pad, pad, inner)}
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
      title: "스크럽패드",
      subtitle: "무료 로컬 개인정보 가리기. 붙여 넣고, 검토하고, ChatGPT·Claude에 복사.",
      badge: "이 기기에서만 처리",
      originalLabel: "원문",
      originalLines: [
        ["안녕하세요, ", { text: "김민수" }, "입니다."],
        ["메일 ", { text: "minsu@example.com" }],
        ["전화 ", { text: "010-1234-5678" }, ", 키 ", { text: "sk-…" }],
      ],
      scrubbedLabel: "가린 글",
      scrubbedLines: [
        ["안녕하세요, ", { text: "[NAME_1]" }, "입니다."],
        ["메일 ", { text: "[EMAIL_1]" }],
        ["전화 ", { text: "[PHONE_1]" }, ", 키 ", { text: "[KEY_1]" }],
      ],
      reviewLabel: "검토 목록 · 체크를 풀면 원문 유지",
      review: [
        { on: true, badge: "이름", original: "김민수", token: "[NAME_1]" },
        { on: true, badge: "이메일", original: "minsu@example.com", token: "[EMAIL_1]" },
        { on: false, badge: "전화", original: "010-1234-5678", token: "[PHONE_1]" },
      ],
      promises: ["월 $9.99 없음", "업로드 없음 · 광고 없음", "계정 없음"],
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Scrubpad",
      subtitle: "Free local PII scrubber. Paste, review, copy for ChatGPT or Claude.",
      badge: "On-device only",
      originalLabel: "ORIGINAL",
      originalLines: [
        ["Hi, I'm ", { text: "Ada Lovelace" }, "."],
        ["Email ", { text: "ada@example.com" }],
        ["Phone ", { text: "+1 202-555-0147" }, ", key ", { text: "sk-…" }],
      ],
      scrubbedLabel: "SCRUBBED",
      scrubbedLines: [
        ["Hi, I'm ", { text: "[NAME_1]" }, "."],
        ["Email ", { text: "[EMAIL_1]" }],
        ["Phone ", { text: "[PHONE_1]" }, ", key ", { text: "[KEY_1]" }],
      ],
      reviewLabel: "REVIEW LIST · UNCHECK TO KEEP THE ORIGINAL",
      review: [
        { on: true, badge: "NAME", original: "Ada Lovelace", token: "[NAME_1]" },
        { on: true, badge: "EMAIL", original: "ada@example.com", token: "[EMAIL_1]" },
        { on: false, badge: "PHONE", original: "+1 202-555-0147", token: "[PHONE_1]" },
      ],
      promises: ["No $9.99/mo", "No upload · No ads", "No account"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "スクラブパッド",
      subtitle: "無料のローカル個人情報マスク。貼って、確認して、ChatGPTやClaudeにコピー。",
      badge: "この端末だけで処理",
      originalLabel: "原文",
      originalLines: [
        ["こんにちは、", { text: "田中太郎" }, "です。"],
        ["メール ", { text: "taro@example.com" }],
        ["電話 ", { text: "090-1234-5678" }, "、キー ", { text: "sk-…" }],
      ],
      scrubbedLabel: "マスク後",
      scrubbedLines: [
        ["こんにちは、", { text: "[NAME_1]" }, "です。"],
        ["メール ", { text: "[EMAIL_1]" }],
        ["電話 ", { text: "[PHONE_1]" }, "、キー ", { text: "[KEY_1]" }],
      ],
      reviewLabel: "確認リスト · チェックを外すと原文のまま",
      review: [
        { on: true, badge: "人名", original: "田中太郎", token: "[NAME_1]" },
        { on: true, badge: "メール", original: "taro@example.com", token: "[EMAIL_1]" },
        { on: false, badge: "電話", original: "090-1234-5678", token: "[PHONE_1]" },
      ],
      promises: ["月$9.99なし", "アップロードなし · 広告なし", "アカウント不要"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "脱敏板",
      subtitle: "免费本地脱敏。粘贴、核对，再复制给 ChatGPT 或 Claude。",
      badge: "仅在此设备处理",
      originalLabel: "原文",
      originalLines: [
        ["你好，我是", { text: "张伟" }, "。"],
        ["邮箱 ", { text: "wei@example.com" }],
        ["电话 ", { text: "138 0013 8000" }, "，密钥 ", { text: "sk-…" }],
      ],
      scrubbedLabel: "脱敏后",
      scrubbedLines: [
        ["你好，我是", { text: "[NAME_1]" }, "。"],
        ["邮箱 ", { text: "[EMAIL_1]" }],
        ["电话 ", { text: "[PHONE_1]" }, "，密钥 ", { text: "[KEY_1]" }],
      ],
      reviewLabel: "核对列表 · 取消勾选即保留原文",
      review: [
        { on: true, badge: "姓名", original: "张伟", token: "[NAME_1]" },
        { on: true, badge: "邮箱", original: "wei@example.com", token: "[EMAIL_1]" },
        { on: false, badge: "电话", original: "138 0013 8000", token: "[PHONE_1]" },
      ],
      promises: ["没有 $9.99/月", "不上传 · 无广告", "无需账号"],
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
