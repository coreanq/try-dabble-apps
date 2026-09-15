// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Dictpad card: a soft-sky notepad on warm cream paper.
 *
 * The product is a talk-to-text notepad, so the picture is a ruled notepad
 * sheet with a few dictated lines (the last one still "listening" in sky
 * ink), a big coral Record control with a mic, a recognition-language pill
 * and a row of voice-punctuation chips. Four real jobs (ko/en/ja/zh), each
 * its own SVG → PNG with real CJK glyphs from Noto Sans CJK; zh is never an
 * alias of en. No photos, no generated art.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 250, g: 247, b: 240, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const serif = (lang) => `DejaVu Serif, Noto Serif CJK ${CJK[lang]}, Noto Sans CJK ${CJK[lang]}, serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#0f172a";
const MUTED = "#526073";
const LINE = "#e2dccd";
const PAPER2 = "#f1ece0";
const SKY = "#0369a1";
const SKY_DEEP = "#075985";
const SKY_SOFT = "#e0f2fe";
const CLOUD = "#bae6fd";
const RULE = "#dbeafe";
const CORAL = "#e11d48";
const CORAL_DEEP = "#be123c";
const CORAL_SOFT = "#ffe4e6";
const SAGE = "#15803d";
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

/** The notepad sheet: ruled lines, dictated text, a live sky line with a caret. */
function pad(job) {
  const rules = [];
  for (let i = 0; i < 7; i += 1) {
    const y = 78 + i * 40;
    rules.push(`<line x1="28" y1="${y}" x2="612" y2="${y}" stroke="${RULE}" stroke-width="2"/>`);
  }
  const lines = job.lines.map((l, i) => {
    const y = 68 + i * 40;
    const size = fitSize(l, 560, [24, 22, 20, 18]);
    return `<text x="34" y="${y}" font-size="${size}" font-weight="500" font-family="${serif(job.lang)}" fill="${INK}">${esc(truncate(l, size, 560))}</text>`;
  });
  const liveY = 68 + job.lines.length * 40;
  const liveSize = fitSize(job.live, 480, [24, 22, 20, 18]);
  const liveW = Math.ceil(textWidth(job.live, liveSize));
  return `
  <g transform="translate(60,196)">
    <rect width="640" height="360" rx="22" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="640" height="34" rx="22" fill="${SKY_SOFT}"/>
    <rect x="0" y="18" width="640" height="16" fill="${SKY_SOFT}"/>
    <circle cx="24" cy="17" r="5" fill="${CORAL}"/>
    <circle cx="42" cy="17" r="5" fill="${NOTICE}"/>
    <circle cx="60" cy="17" r="5" fill="${SAGE}"/>
    <text x="620" y="23" text-anchor="end" font-size="15" font-weight="800" font-family="${sans(job.lang)}" fill="${SKY_DEEP}">${esc(job.noteTitle)}</text>
    ${rules.join("")}
    ${lines.join("")}
    <text x="34" y="${liveY}" font-size="${liveSize}" font-weight="500" font-family="${serif(job.lang)}" fill="${SKY}">${esc(job.live)}</text>
    <rect x="${36 + liveW}" y="${liveY - 22}" width="3" height="28" rx="1.5" fill="${CORAL}"/>
    <text x="34" y="338" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="${SAGE}">${esc(job.saved)}</text>
    <text x="606" y="338" text-anchor="end" font-size="15" font-weight="700" font-family="${figures(job.lang)}" fill="${MUTED}">${esc(job.chars)}</text>
  </g>`;
}

/** Mic deck: status, the big coral Record pill, language pill. */
function deck(job) {
  const recW = 372;
  return `
  <g transform="translate(736,196)">
    <rect width="404" height="360" rx="22" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>
    <rect x="0" y="0" width="404" height="8" rx="4" fill="${CORAL}"/>
    <circle cx="34" cy="48" r="8" fill="${CORAL}"/>
    <circle cx="34" cy="48" r="15" fill="none" stroke="${CORAL_SOFT}" stroke-width="5"/>
    <text x="58" y="55" font-size="18" font-weight="800" font-family="${sans(job.lang)}" fill="${MUTED}" letter-spacing="1">${esc(job.status)}</text>
    <rect x="16" y="82" width="${recW}" height="86" rx="43" fill="${CORAL}" stroke="${CORAL_DEEP}" stroke-width="2"/>
    <g transform="translate(70,104)">
      <rect x="10" y="0" width="20" height="30" rx="10" fill="${WHITE}"/>
      <path d="M2 22a18 18 0 0 0 36 0M20 40v8M10 48h20" fill="none" stroke="${WHITE}" stroke-width="4" stroke-linecap="round"/>
    </g>
    <text x="${16 + recW / 2 + 28}" y="137" text-anchor="middle" font-size="34" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${WHITE}">${esc(job.record)}</text>
    <rect x="16" y="190" width="372" height="52" rx="14" fill="${PAPER2}" stroke="${LINE}" stroke-width="2"/>
    <text x="34" y="223" font-size="18" font-weight="700" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(job.langLabel)}</text>
    <text x="370" y="223" text-anchor="end" font-size="18" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${SKY_DEEP}">${esc(job.langValue)}</text>
    <text x="16" y="282" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${SKY_DEEP}">${esc(job.voiceTitle)}</text>
    ${voiceChips(job)}
  </g>`;
}

function voiceChips(job) {
  let x = 16;
  let y = 298;
  const out = [];
  for (const c of job.voice) {
    const w = Math.ceil(textWidth(c.say, 15) + 24 + 30);
    if (x + w > 392) {
      x = 16;
      y += 42;
    }
    out.push(
      `<rect x="${x}" y="${y}" width="${w}" height="34" rx="12" fill="${SKY_SOFT}" stroke="${CLOUD}" stroke-width="1.5"/>` +
        `<rect x="${x + 6}" y="${y + 5}" width="24" height="24" rx="6" fill="${WHITE}"/>` +
        `<text x="${x + 18}" y="${y + 23}" text-anchor="middle" font-size="17" font-weight="800" font-family="${serif(job.lang)}" fill="${SKY_DEEP}">${esc(c.mark)}</text>` +
        `<text x="${x + 38}" y="${y + 23}" font-size="15" font-weight="700" font-family="${sans(job.lang)}" fill="${SKY_DEEP}">${esc(c.say)}</text>`,
    );
    x += w + 8;
  }
  return out.join("");
}

function svgFor(job) {
  const titleSize = fitSize(job.title, 640, [58, 52, 46, 40]);
  const sub = truncate(job.subtitle, 23, 1060);
  const badge = job.badge;
  const chips = job.chips.reduce(
    (acc, c) => {
      const w = Math.ceil(textWidth(c, 16) + 26);
      const x = acc.x;
      acc.out.push(
        `<rect x="${x}" y="572" width="${w}" height="34" rx="17" fill="${SKY_SOFT}"/>` +
          `<text x="${x + 13}" y="595" font-size="16" font-weight="800" font-family="${sans(job.lang)}" fill="${SKY_DEEP}">${esc(c)}</text>`,
      );
      acc.x += w + 10;
      return acc;
    },
    { x: 60, out: [] },
  ).out;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${CLOUD}"/>
      <stop offset="1" stop-color="${SKY_SOFT}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#faf7f0"/>
  <circle cx="1080" cy="-40" r="320" fill="url(#wash)" opacity="0.9"/>
  <circle cx="-40" cy="680" r="260" fill="${CORAL_SOFT}" opacity="0.8"/>
  <rect x="36" y="28" width="1128" height="574" rx="28" fill="${WHITE}" stroke="${LINE}" stroke-width="2" opacity="0.6"/>
  <rect x="36" y="28" width="14" height="574" rx="7" fill="${SKY}"/>

  <rect x="70" y="52" width="${Math.ceil(textWidth(badge, 20) + 28)}" height="36" rx="18" fill="${NOTICE}"/>
  <text x="84" y="77" font-size="20" font-weight="800" font-family="${sans(job.lang)}" fill="${NOTICE_INK}">${esc(badge)}</text>

  <text x="70" y="140" font-size="${titleSize}" font-weight="800" font-family="${sans(job.lang, "DejaVu Sans")}" fill="${SKY_DEEP}">${esc(job.title)}</text>
  <text x="70" y="176" font-size="23" font-weight="600" font-family="${sans(job.lang)}" fill="${MUTED}">${esc(sub)}</text>

  ${pad(job)}
  ${deck(job)}
  ${chips.join("")}

  <text x="1136" y="596" text-anchor="end" font-size="16" font-weight="700" font-family="${figures(job.lang)}" fill="${SKY}">dictpad.try-dabble.com</text>
</svg>`;
}

function iconSvg(pad) {
  const s = 512;
  const inner = s - pad * 2;
  const u = inner / 64;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#faf7f0"/>
  <g transform="translate(${pad},${pad}) scale(${u})">
    <rect x="8" y="6" width="48" height="52" rx="8" fill="${SKY}"/>
    <rect x="12" y="10" width="40" height="44" rx="5" fill="#faf7f0"/>
    <path d="M18 22h28M18 30h28M18 38h16" stroke="${CLOUD}" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="38" y="30" width="10" height="16" rx="5" fill="${SKY}"/>
    <path d="M35 42a8 8 0 0 0 16 0M43 50v4" fill="none" stroke="${SKY}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="21" cy="47" r="5" fill="${CORAL}"/>
    <circle cx="21" cy="47" r="2" fill="${CORAL_SOFT}"/>
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
  const jobs = [
    {
      lang: "ko",
      title: "딕트패드",
      subtitle: "무료 로컬 음성 받아쓰기 메모장. 녹음 버튼, 실시간 받아쓰기, 구두점 음성 명령.",
      badge: "노트는 이 기기에만",
      noteTitle: "회의 메모 · 9월 15일",
      lines: ["오늘 회의에서 정한 것.", "다음 주 화요일까지 초안을 보내고,", "디자인 검토는 목요일에 한다."],
      live: "예산은 다시 확인해서",
      saved: "이 기기에 자동 저장됨",
      chars: "142자",
      status: "듣는 중 · ko-KR",
      record: "녹음",
      langLabel: "인식 언어",
      langValue: "한국어 (ko-KR)",
      voiceTitle: "구두점 음성 명령",
      voice: [
        { mark: ".", say: "마침표" },
        { mark: ",", say: "쉼표" },
        { mark: "↵", say: "줄바꿈" },
        { mark: "¶", say: "단락" },
      ],
      chips: ["유료 벽 없음", "광고 없음", "계정 없음", "JSON 백업", "시스템 키보드 아님"],
      files: ["og-image-ko.png", "og-image.png"],
    },
    {
      lang: "en",
      title: "Dictpad",
      subtitle: "Free local talk-to-text notepad. Tap record, speak, edit. Voice punctuation.",
      badge: "Notes stay on this device",
      noteTitle: "Meeting notes · Sep 15",
      lines: ["What we agreed today.", "Send the draft by next Tuesday,", "design review on Thursday."],
      live: "check the budget again and",
      saved: "Autosaved on this device",
      chars: "142 chars",
      status: "LISTENING · en-US",
      record: "Record",
      langLabel: "Speech language",
      langValue: "English (en-US)",
      voiceTitle: "Voice punctuation",
      voice: [
        { mark: ".", say: "period" },
        { mark: ",", say: "comma" },
        { mark: "↵", say: "new line" },
        { mark: "¶", say: "new paragraph" },
      ],
      chips: ["No paywall", "No ads", "No account", "JSON backup", "Not a system keyboard"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "ディクトパッド",
      subtitle: "無料のローカル音声入力メモ帳。録音ボタン、リアルタイム書き取り、句読点コマンド。",
      badge: "ノートはこの端末だけ",
      noteTitle: "会議メモ · 9月15日",
      lines: ["今日の会議で決めたこと。", "来週火曜までに下書きを送り、", "デザインの確認は木曜に行う。"],
      live: "予算はもう一度確認して",
      saved: "この端末に自動保存",
      chars: "142文字",
      status: "聞き取り中 · ja-JP",
      record: "録音",
      langLabel: "認識言語",
      langValue: "日本語 (ja-JP)",
      voiceTitle: "句読点の音声コマンド",
      voice: [
        { mark: "。", say: "句点" },
        { mark: "、", say: "読点" },
        { mark: "↵", say: "改行" },
        { mark: "¶", say: "段落" },
      ],
      chips: ["課金の壁なし", "広告なし", "アカウント不要", "JSONバックアップ", "システムキーボードではない"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "听写板",
      subtitle: "免费本地听写记事本。点录音、实时听写、语音标点、JSON 备份。",
      badge: "笔记仅在此设备",
      noteTitle: "会议记录 · 9月15日",
      lines: ["今天会议定下的事。", "下周二之前发出初稿，", "周四做设计评审。"],
      live: "预算再核对一遍，然后",
      saved: "已自动保存到此设备",
      chars: "142 字",
      status: "正在听 · zh-CN",
      record: "录音",
      langLabel: "识别语言",
      langValue: "中文 (zh-CN)",
      voiceTitle: "语音标点",
      voice: [
        { mark: "。", say: "句号" },
        { mark: "，", say: "逗号" },
        { mark: "↵", say: "换行" },
        { mark: "¶", say: "段落" },
      ],
      chips: ["无付费墙", "无广告", "无需账号", "JSON 备份", "不是系统输入法"],
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
