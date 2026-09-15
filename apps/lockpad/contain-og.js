// ESM: package.json is "type": "module"
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Lockpad card: a warm locked notebook.
 * Parchment paper, deep ink, a brass padlock, sage "open" badge, lavender tags.
 * Four real jobs (ko/en/ja/zh); zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;

const PAPER = "#f5efe6";
const PAPER2 = "#ede4d6";
const CARD = "#fbf7f0";
const INK = "#1a1625";
const MUTED = "#57534e";
const LINE = "#e7dfd2";
const LINE2 = "#d6c9b6";
const BRASS = "#b45309";
const BRASS_DEEP = "#92400e";
const BRASS_SOFT = "#f7e3c3";
const SAGE = "#3f6212";
const SAGE_SOFT = "#e6efd5";
const LAVENDER = "#7c3aed";
const LAVENDER_SOFT = "#ede4fb";
const NOTICE = "#fde68a";
const NOTICE_INK = "#4a2e05";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.58;
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

function lockMark(x, y, s = 1) {
  return `
  <g transform="translate(${x},${y}) scale(${s})">
    <rect x="10" y="5" width="44" height="54" rx="7" fill="${CARD}" stroke="${INK}" stroke-width="2"/>
    <rect x="18" y="14" width="28" height="3" rx="1.5" fill="#a8a29e"/>
    <rect x="18" y="22" width="20" height="3" rx="1.5" fill="#a8a29e"/>
    <rect x="18" y="30" width="24" height="3" rx="1.5" fill="#d6d3d1"/>
    <path d="M24 42v-7a8 8 0 0 1 16 0v7" fill="none" stroke="${BRASS}" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="19" y="40" width="26" height="18" rx="5" fill="${BRASS}"/>
    <circle cx="32" cy="48" r="2.4" fill="${PAPER}"/>
    <rect x="31" y="49" width="2" height="4.5" rx="1" fill="${PAPER}"/>
  </g>`;
}

function smallLock(x, y, color) {
  return `<g transform="translate(${x},${y}) scale(0.8)">
    <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="5" y="11" width="14" height="10" rx="3" fill="${color}"/>
  </g>`;
}

function noteRow(y, title, badge, badgeFill, badgeInk, tag, stripe, lang, locked) {
  return `
    <rect x="24" y="${y}" width="372" height="58" rx="12" fill="${CARD}" stroke="${LINE}"/>
    <rect x="24" y="${y}" width="6" height="58" rx="3" fill="${stripe}"/>
    <text x="44" y="${y + 26}" font-size="18" font-weight="800" font-family="${sans(lang)}" fill="${INK}">${esc(title)}</text>
    ${tag ? `<rect x="44" y="${y + 34}" width="${Math.max(48, textWidth(tag, 12) + 16)}" height="18" rx="9" fill="${LAVENDER_SOFT}"/>
    <text x="52" y="${y + 47}" font-size="12" font-weight="700" font-family="${sans(lang)}" fill="${LAVENDER}">${esc(tag)}</text>` : ""}
    ${badge ? `<rect x="${396 - 16 - Math.max(64, textWidth(badge, 13) + 34)}" y="${y + 18}" width="${Math.max(64, textWidth(badge, 13) + 34)}" height="22" rx="11" fill="${badgeFill}"/>
    ${locked ? smallLock(396 - 16 - Math.max(64, textWidth(badge, 13) + 34) + 6, y + 19, badgeInk) : ""}
    <text x="${396 - 16 - 10}" y="${y + 34}" text-anchor="end" font-size="13" font-weight="800" font-family="${sans(lang)}" fill="${badgeInk}">${esc(badge)}</text>` : ""}`;
}

function card(job) {
  const titleSize = fitSize(job.brand, 520, [46, 42, 38, 34, 30]);
  const tag = truncate(job.tagline, 18, 760);
  const cipher = "aGVsbG8gd29ybGQ… 9x3Kq2LmZ8vT4wNp1RfD6yH0cJ7bE5sU";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PAPER}"/>
      <stop offset="100%" stop-color="${PAPER2}"/>
    </linearGradient>
    <pattern id="rule" width="1200" height="30" patternUnits="userSpaceOnUse">
      <rect x="0" y="29" width="1200" height="1" fill="rgba(26,22,37,0.05)"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#rule)"/>
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
  <rect x="36" y="36" width="1128" height="64" rx="28" fill="${NOTICE}"/>
  <text x="60" y="76" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${NOTICE_INK}">${esc(job.banner)}</text>
  ${lockMark(64, 118, 1.7)}
  <text x="196" y="178" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.brand)}</text>
  <text x="196" y="222" font-size="18" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(tag)}</text>

  <!-- note list -->
  <g transform="translate(70,262)">
    <rect width="420" height="280" rx="18" fill="${PAPER}" stroke="${LINE}" stroke-width="2"/>
    <text x="24" y="38" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.listTitle)}</text>
    ${noteRow(54, job.n1, job.lockedBadge, BRASS_SOFT, BRASS_DEEP, job.t1, BRASS, job.lang, true)}
    ${noteRow(122, job.n2, job.openBadge, SAGE_SOFT, SAGE, job.t2, SAGE, job.lang, false)}
    ${noteRow(190, job.n3, "", "", "", job.t3, LAVENDER, job.lang, false)}
    <text x="24" y="270" font-size="13" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.searchHint)}</text>
  </g>

  <!-- unlock modal -->
  <g transform="translate(520,262)">
    <rect width="600" height="280" rx="18" fill="${PAPER}" stroke="${LINE}" stroke-width="2"/>
    <rect x="24" y="22" width="552" height="236" rx="16" fill="${CARD}" stroke="${BRASS}" stroke-width="2" stroke-dasharray="6 5"/>
    ${smallLock(276, 34, BRASS)}
    <text x="300" y="72" text-anchor="middle" font-size="22" font-weight="800" font-family="${sans(job.lang)}" fill="${INK}">${esc(job.modalTitle)}</text>
    <text x="300" y="98" text-anchor="middle" font-size="14" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.modalBody)}</text>
    <rect x="80" y="116" width="440" height="44" rx="12" fill="${PAPER}" stroke="${LINE2}" stroke-width="2"/>
    <text x="100" y="146" font-size="22" font-weight="800" font-family="DejaVu Sans, sans-serif" fill="${INK}" letter-spacing="6">••••</text>
    <text x="300" y="186" text-anchor="middle" font-size="12" font-weight="700" font-family="DejaVu Sans Mono, monospace" fill="${MUTED}">${esc(cipher)}</text>
    <rect x="200" y="204" width="200" height="40" rx="20" fill="${SAGE_SOFT}" stroke="#c5d9a3"/>
    <text x="300" y="230" text-anchor="middle" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${SAGE}">${esc(job.unlock)}</text>
  </g>

  <text x="60" y="578" font-size="14" font-weight="700" font-family="DejaVu Sans Mono, monospace" fill="${INK}">{ "app": "lockpad", "version": 1, "locked": true, "ciphertext": "…", "kdf": "PBKDF2" }</text>
  <text x="1136" y="578" text-anchor="end" font-size="16" font-weight="700" font-family="DejaVu Sans, sans-serif" fill="${BRASS}">lockpad.try-dabble.com</text>
</svg>`;
}

const JOBS = {
  ko: {
    lang: "ko",
    brand: "락패드",
    tagline: "메모별 PIN 잠금 · 잠금 해제 모달 · 유휴 자동 잠금 · 잠긴 JSON 백업 · 계정·광고·인앱결제 없음",
    banner: "메모는 이 기기에만 · 잠긴 메모는 암호문으로만 · 로그인·광고 없음 · JSON으로 백업하세요",
    listTitle: "메모",
    n1: "일기",
    n2: "여행 계획",
    n3: "장보기",
    t1: "개인",
    t2: "여행",
    t3: "집",
    lockedBadge: "잠김",
    openBadge: "열림",
    searchHint: "검색은 제목·태그만 — 잠긴 본문은 열지 않음",
    modalTitle: "잠금 해제",
    modalBody: "이 메모의 PIN을 입력하세요 · 틀리면 1초·2초·4초 대기",
    unlock: "열기",
  },
  en: {
    lang: "en",
    brand: "Lockpad",
    tagline: "Per-note PIN lock · unlock modal · idle auto-lock · locked JSON backup",
    banner: "Notes stay on this device · Locked notes are ciphertext only · No login · No ads · Export JSON to keep a copy",
    listTitle: "Notes",
    n1: "Diary",
    n2: "Trip plan",
    n3: "Groceries",
    t1: "personal",
    t2: "travel",
    t3: "home",
    lockedBadge: "Locked",
    openBadge: "Open",
    searchHint: "Search matches titles & tags — locked bodies are never opened",
    modalTitle: "Unlock",
    modalBody: "Enter the PIN for this note · wrong PIN waits 1s, 2s, 4s…",
    unlock: "Unlock",
  },
  ja: {
    lang: "ja",
    brand: "ロックパッド",
    tagline: "メモごとのPINロック · 解除モーダル · アイドル自動ロック · ロック済みJSONバックアップ · アカウント・広告・課金なし",
    banner: "メモはこの端末だけ · ロック済みメモは暗号文のみ · ログイン・広告なし · JSONでバックアップ",
    listTitle: "メモ",
    n1: "日記",
    n2: "旅行の計画",
    n3: "買い物",
    t1: "個人",
    t2: "旅行",
    t3: "家",
    lockedBadge: "ロック",
    openBadge: "開いている",
    searchHint: "検索はタイトルとタグだけ — ロック済み本文は開かない",
    modalTitle: "ロック解除",
    modalBody: "このメモの PIN を入力 · 間違えると 1秒・2秒・4秒待ち",
    unlock: "開く",
  },
  zh: {
    lang: "zh",
    brand: "加锁便签",
    tagline: "按条 PIN 锁 · 解锁弹窗 · 闲置自动上锁 · 可携带的已锁 JSON 备份 · 无账号、无广告、无内购",
    banner: "笔记只留在此设备 · 已锁笔记仅为密文 · 无登录、无广告 · 请用 JSON 备份",
    listTitle: "笔记",
    n1: "日记",
    n2: "旅行计划",
    n3: "购物清单",
    t1: "个人",
    t2: "旅行",
    t3: "家",
    lockedBadge: "已锁",
    openBadge: "已打开",
    searchHint: "搜索只看标题和标签 — 已锁正文不会被打开",
    modalTitle: "解锁",
    modalBody: "输入这条笔记的 PIN · 输错则等待 1 秒、2 秒、4 秒…",
    unlock: "解锁",
  },
};

async function writePng(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function writeIcon(size, file, maskable = false) {
  const pad = maskable ? Math.round(size * 0.18) : Math.round(size * 0.1);
  const inner = size - pad * 2;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${PAPER}"/>
  ${lockMark(pad, pad, inner / 64)}
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  for (const [lang, job] of Object.entries(JOBS)) {
    const file = path.join(OUT, `og-image-${lang}.png`);
    await writePng(card(job), file);
    console.log("wrote", file);
  }
  await writePng(card(JOBS.ko), path.join(OUT, "og-image.png"));
  await writeIcon(192, path.join(ICONS, "icon-192.png"));
  await writeIcon(512, path.join(ICONS, "icon-512.png"));
  await writeIcon(512, path.join(ICONS, "icon-maskable-512.png"), true);
  await writeIcon(180, path.join(ICONS, "apple-touch-icon.png"));
  await sharp(path.join(ICONS, "icon-192.png")).resize(32, 32).toFile(path.join(OUT, "favicon.ico"));
  console.log("icons + favicon done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
