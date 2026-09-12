// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Affirmpad card: a sunrise page in an affirmation journal.
 *
 * The product is "one sentence up big, tap once per repetition", so the
 * picture is the practice stage on cream paper under a dawn wash: a topic
 * pill, the affirmation set large, the tap count with its goal rail, and the
 * round lavender tap button with undo beside it. A short list of other lines
 * with stars sits underneath. Four real jobs (ko/en/ja/zh), each its own
 * SVG → PNG; zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 250, g: 247, b: 242, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#2e2547";
const MUTED = "#6f6485";
const LINE = "#e6ddf0";
const LINE2 = "#d4c6e6";
const LAV = "#a78bfa";
const LAV_DEEP = "#7c5cd6";
const LAV_SOFT = "#ede7fb";
const BLUSH = "#f6c8d0";
const BLUSH_DEEP = "#d98ba0";
const PAPER2 = "#f3ecf8";
const AMBER = "#f5c65b";
const AMBER_INK = "#3b2a05";
const WHITE = "#ffffff";

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

/** Cut a sentence to fit, with an ellipsis, so the topic pill never collides. */
function truncate(text, size, maxWidth) {
  if (textWidth(text, size) <= maxWidth) return text;
  const chars = [...String(text)];
  while (chars.length > 1 && textWidth(chars.join("") + "…", size) > maxWidth) chars.pop();
  return chars.join("").trimEnd() + "…";
}

/** One line in the list under the stage: star, sentence, topic pill. */
function row(lang, x, y, w, item) {
  const pillW = textWidth(item.topic, 22) + 40;
  const avail = w - 80 - pillW - 44;
  const size = fitSize(item.text, avail, [28, 26, 24]);
  const shown = truncate(item.text, size, avail);
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="${w}" height="72" rx="18" fill="${WHITE}" stroke="${LINE}" stroke-width="2.5"/>
    <rect x="0" y="0" width="10" height="72" rx="5" fill="${item.color}"/>
    <path transform="translate(30,20) scale(1.35)" d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="${item.fav ? AMBER : "none"}" stroke="${item.fav ? AMBER : LINE2}" stroke-width="1.6" stroke-linejoin="round"/>
    <text x="80" y="46" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${INK}">${esc(shown)}</text>
    <rect x="${w - pillW - 22}" y="20" width="${pillW}" height="32" rx="16" fill="${PAPER2}"/>
    <circle cx="${w - pillW - 22 + 18}" cy="36" r="6" fill="${item.color}"/>
    <text x="${w - pillW - 22 + 32}" y="44" font-family="${sans(lang)}" font-size="22" font-weight="700" fill="${MUTED}">${esc(item.topic)}</text>
  </g>`;
}

/** The fail-fix promise line along the bottom, as pills. */
function promises(lang, items, x0, y) {
  let x = x0;
  const out = [];
  for (const label of items) {
    const size = 26;
    const w = textWidth(label, size) + 42;
    out.push(`<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="50" rx="25" fill="${WHITE}" stroke="${LINE2}" stroke-width="2.5"/>
      <text x="${w / 2}" y="35" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
    </g>`);
    x += w + 12;
  }
  return out.join("");
}

function svgFor(job) {
  const { lang, title, subtitle, topic, line, count, goalLabel, tapLabel, undoLabel, rows, badge } = job;
  const titleSize = fitSize(title, 820, [84, 76, 68, 60, 54]);
  const subSize = fitSize(subtitle, 1560, [32, 30, 28, 26, 23, 20]);
  const pageY = 56 + titleSize + subSize + 40;
  const pageH = 945 - pageY - 112;
  const badgeSize = fitSize(badge, 380, [30, 27, 24, 22]);
  const badgeW = textWidth(badge, badgeSize) + 56;
  const lineSize = fitSize(line, 900, [58, 52, 46, 40, 36]);
  const topicW = textWidth(topic, 26) + 60;
  const ratio = count / 10;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <radialGradient id="dawnA" cx="50%" cy="-10%" r="75%">
      <stop offset="0%" stop-color="${LAV}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${LAV}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dawnB" cx="82%" cy="6%" r="55%">
      <stop offset="0%" stop-color="${BLUSH}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${BLUSH}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="tap" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#c4b0ff"/>
      <stop offset="55%" stop-color="${LAV}"/>
      <stop offset="100%" stop-color="${LAV_DEEP}"/>
    </radialGradient>
    <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${LAV}"/>
      <stop offset="100%" stop-color="${BLUSH_DEEP}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${INK}" flood-opacity="0.12"/>
    </filter>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${LAV_DEEP}" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="#faf7f2"/>
  <rect width="1800" height="945" fill="url(#dawnA)"/>
  <rect width="1800" height="945" fill="url(#dawnB)"/>

  <!-- title block -->
  <g transform="translate(110,56)">
    <g transform="translate(0,${titleSize * 0.12}) scale(${(titleSize * 0.95) / 64})">
      <rect x="6" y="6" width="52" height="52" rx="14" fill="${LAV}"/>
      <rect x="10" y="10" width="44" height="44" rx="11" fill="#faf7f2"/>
      <circle cx="32" cy="36" r="11" fill="${BLUSH}"/>
      <circle cx="32" cy="36" r="7" fill="${AMBER}"/>
      <rect x="14" y="36" width="36" height="12" rx="2" fill="#faf7f2"/>
      <rect x="16" y="38" width="32" height="2.5" rx="1.25" fill="${LAV}"/>
      <rect x="16" y="43" width="22" height="2.5" rx="1.25" fill="${LINE2}"/>
      <rect x="16" y="48" width="27" height="2.5" rx="1.25" fill="${LINE2}"/>
    </g>
    <text x="${titleSize * 1.15}" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 18}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>
  <!-- sticky note: local only -->
  <g transform="translate(${1690 - badgeW},${66}) rotate(-3)">
    <rect x="0" y="0" width="${badgeW}" height="${badgeSize + 36}" rx="8" fill="${AMBER}"/>
    <text x="${badgeW / 2}" y="${badgeSize + 10}" text-anchor="middle" font-family="${sans(lang)}" font-size="${badgeSize}" font-weight="800" fill="${AMBER_INK}">${esc(badge)}</text>
  </g>

  <!-- the practice stage -->
  <g transform="translate(110,${pageY})" filter="url(#shadow)">
    <rect x="0" y="0" width="1060" height="${pageH}" rx="34" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
  </g>
  <g transform="translate(110,${pageY})">
    <!-- topic pill -->
    <rect x="${530 - topicW / 2}" y="34" width="${topicW}" height="44" rx="22" fill="${LAV_SOFT}"/>
    <circle cx="${530 - topicW / 2 + 24}" cy="56" r="8" fill="${LAV}"/>
    <text x="${530 - topicW / 2 + 42}" y="65" font-family="${sans(lang)}" font-size="26" font-weight="800" fill="${LAV_DEEP}">${esc(topic)}</text>
    <!-- the affirmation -->
    <text x="530" y="${110 + lineSize}" text-anchor="middle" font-family="${sans(lang, "URW Gothic")}" font-size="${lineSize}" font-weight="800" fill="${INK}">${esc(line)}</text>
    <!-- count -->
    <text x="530" y="${130 + lineSize + 96}" text-anchor="middle" font-family="${figures(lang)}" font-size="96" font-weight="800" fill="${LAV_DEEP}">${count}</text>
    <text x="530" y="${130 + lineSize + 132}" text-anchor="middle" font-family="${sans(lang)}" font-size="24" font-weight="800" fill="${MUTED}" letter-spacing="1">${esc(goalLabel)}</text>
    <!-- rail -->
    <rect x="120" y="${130 + lineSize + 152}" width="820" height="16" rx="8" fill="${PAPER2}" stroke="${LINE}" stroke-width="2"/>
    <rect x="120" y="${130 + lineSize + 152}" width="${Math.max(16, 820 * Math.min(1, ratio))}" height="16" rx="8" fill="url(#rail)"/>
    <!-- tap button -->
    <g transform="translate(530,${130 + lineSize + 300})" filter="url(#glow)">
      <circle cx="0" cy="0" r="118" fill="${LAV_SOFT}"/>
      <circle cx="0" cy="0" r="104" fill="url(#tap)"/>
      <text x="0" y="14" text-anchor="middle" font-family="${sans(lang, "URW Gothic")}" font-size="40" font-weight="800" fill="${WHITE}" letter-spacing="1">${esc(tapLabel)}</text>
    </g>
    <!-- undo pill -->
    <g transform="translate(${530 + 150},${130 + lineSize + 270})">
      <rect x="0" y="0" width="${textWidth(undoLabel, 26) + 80}" height="58" rx="16" fill="${PAPER2}" stroke="${LINE2}" stroke-width="2.5"/>
      <path transform="translate(20,17) scale(1.05)" d="M9 14L4 9l5-5" fill="none" stroke="${LAV_DEEP}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path transform="translate(20,17) scale(1.05)" d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="${LAV_DEEP}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="56" y="38" font-family="${sans(lang)}" font-size="26" font-weight="800" fill="${LAV_DEEP}">${esc(undoLabel)}</text>
    </g>
  </g>

  <!-- list of other lines -->
  <g transform="translate(1200,${pageY})">
    ${rows.map((r, i) => row(lang, 0, i * 88, 490, r)).join("")}
  </g>

  ${promises(lang, job.promises, 110, 945 - 40 - 50)}
</svg>`;
}

/** App icon: the sunrise page, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ede7fb"/>
      <stop offset="100%" stop-color="#faf7f2"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <rect x="48" y="48" width="416" height="416" rx="112" fill="${LAV}"/>
    <rect x="80" y="80" width="352" height="352" rx="88" fill="#faf7f2"/>
    <circle cx="256" cy="288" r="88" fill="${BLUSH}"/>
    <circle cx="256" cy="288" r="56" fill="${AMBER}"/>
    <rect x="112" y="288" width="288" height="96" rx="16" fill="#faf7f2"/>
    <rect x="128" y="304" width="256" height="20" rx="10" fill="${LAV}"/>
    <rect x="128" y="344" width="176" height="20" rx="10" fill="${LINE2}"/>
    <rect x="128" y="384" width="216" height="20" rx="10" fill="${LINE2}"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: PAPER })
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
      title: "어펌패드",
      subtitle: "무료 로컬 확언 연습. 맞춤 주제, 전체화면 탭 카운트, 즐겨찾기, 다크 모드, JSON 백업. 계정 없음. 구독 없음.",
      topic: "자신감",
      line: "나는 오늘 충분히 잘하고 있다.",
      count: 7,
      goalLabel: "반복 · 목표 10회",
      tapLabel: "탭",
      undoLabel: "되돌리기",
      badge: "데이터는 이 기기에만",
      rows: [
        { text: "나는 지금 이 순간에 편안히 머문다.", topic: "평온", color: LAV, fav: true },
        { text: "숨을 들이쉬고, 내쉬며, 힘을 뺀다.", topic: "평온", color: LAV, fav: false },
        { text: "나는 내 속도로 나아간다.", topic: "자신감", color: "#f0a6b8", fav: true },
        { text: "오늘 하루에도 감사할 것이 있다.", topic: "감사", color: AMBER, fav: false },
      ],
      promises: ["연 $47 함정 없음", "해지 장벽 없음", "모든 주제 무료", "연습 중 광고 없음", "영원히 무료", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Affirmpad",
      subtitle: "Free local affirmation practice. Custom topics, fullscreen tap count, favorites, dark mode, JSON backup. No account. No subscription.",
      topic: "Confidence",
      line: "I am doing enough today.",
      count: 7,
      goalLabel: "REPS · GOAL 10",
      tapLabel: "TAP",
      undoLabel: "Undo",
      badge: "Data stays on this device",
      rows: [
        { text: "I am at ease in this moment.", topic: "Calm", color: LAV, fav: true },
        { text: "I breathe in, I breathe out, I let go.", topic: "Calm", color: LAV, fav: false },
        { text: "I move forward at my own pace.", topic: "Confidence", color: "#f0a6b8", fav: true },
        { text: "There is something today to be thankful for.", topic: "Gratitude", color: AMBER, fav: false },
      ],
      promises: ["No $47/yr trap", "No cancel wall", "All categories free", "No ads in practice", "Free forever", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "アファームパッド",
      subtitle: "無料のローカルアファメーション練習。カスタムトピック、全画面タップカウント、お気に入り、ダークモード、JSONバックアップ。アカウント不要。",
      topic: "自信",
      line: "私は今日、十分にやれている。",
      count: 7,
      goalLabel: "回 · 目標 10回",
      tapLabel: "タップ",
      undoLabel: "取り消し",
      badge: "データはこの端末だけ",
      rows: [
        { text: "私は今この瞬間に安らいでいる。", topic: "落ち着き", color: LAV, fav: true },
        { text: "息を吸って、吐いて、力を抜く。", topic: "落ち着き", color: LAV, fav: false },
        { text: "私は自分のペースで進む。", topic: "自信", color: "#f0a6b8", fav: true },
        { text: "今日にも感謝できることがある。", topic: "感謝", color: AMBER, fav: false },
      ],
      promises: ["年$47の罠なし", "解約の壁なし", "全カテゴリ無料", "練習中の広告なし", "ずっと無料", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "肯定练习板",
      subtitle: "免费本地肯定语练习。自定义主题、全屏点按计数、收藏、深色模式、JSON 备份。无需账号。无订阅。",
      topic: "自信",
      line: "我今天已经做得足够好。",
      count: 7,
      goalLabel: "次 · 目标 10 次",
      tapLabel: "点按",
      undoLabel: "撤销",
      badge: "数据仅在此设备",
      rows: [
        { text: "此刻的我，安然自在。", topic: "平静", color: LAV, fav: true },
        { text: "吸气，呼气，放下。", topic: "平静", color: LAV, fav: false },
        { text: "我按自己的节奏前进。", topic: "自信", color: "#f0a6b8", fav: true },
        { text: "今天也有值得感谢的事。", topic: "感恩", color: AMBER, fav: false },
      ],
      promises: ["无每年 $47 陷阱", "无取消壁垒", "所有分类免费", "练习中无广告", "永久免费", "ko/en/ja/zh"],
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

  // Maskable art is cropped to a circle on Android, so the page gets its own
  // padded render instead of reusing the edge-to-edge icon.
  const maskBuf = Buffer.from(iconSvg(96));
  await sharp(maskBuf)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
