// ESM: package.json is "type": "module".
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Kinlog card: a cloth-bound address book lying open on its own board.
 * The right half is the book — navy boards with a brass rule, and a stack of
 * ivory index cards with thumb tabs, the front one filled in: a name in ink, a
 * line about how you met, two lines of memo on the ruling, and the two dates
 * that make this app what it is — LAST CONTACT and NEXT CONTACT, with the
 * overdue stamp hit across the next one.
 * The left column carries the serif title and the four things this app does
 * NOT have, struck through, because "forced to add a credit card", "none of my
 * notes are there" and "settings all restarted" are the complaints it answers.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const BOARD_RGB = { r: 223, g: 230, b: 238, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const serif = (lang) => `Noto Serif CJK ${CJK[lang]}, serif`;
const sans = (lang) => `Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#1f2a44";
const MUTED = "#62708c";
const FAINT = "#93a0b6";
const BOARD = "#dfe6ee";
const IVORY = "#fdfaf2";
const IVORY_2 = "#f5f1e6";
const TABSTOCK = "#cfd9e5";
const RULE = "#c6d1e0";
const RULING = "#dfe0d2";
const MARGIN = "#b8574f";
const STAMP_RED = "#9c3b3b";
const STAMP_RED_BG = "#f6e2e1";
const PEN = "#2c4a7c";
const PEN_BG = "#dfe8f6";
const BRASS = "#a98634";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rough advance width so one layout survives ko/en/ja/zh without clipping. */
function textWidth(text, size) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * 0.55;
  return w;
}

function fitSize(text, maxWidth, sizes) {
  for (const s of sizes) if (textWidth(text, s) <= maxWidth) return s;
  return sizes[sizes.length - 1];
}

/** Book cloth: a fine woven weft over the board. */
function weave() {
  const out = [];
  for (let x = 0; x < 1800; x += 7) {
    out.push(`<rect x="${x}" y="0" width="2" height="945" fill="rgba(31,42,68,0.035)"/>`);
  }
  for (let y = 0; y < 945; y += 7) {
    out.push(`<rect x="0" y="${y}" width="1800" height="2" fill="rgba(31,42,68,0.028)"/>`);
  }
  return out.join("");
}

/** A thumb tab riding the right edge of a card. */
function tab(x, y, fill, letter, lang) {
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="46" height="76" rx="6" fill="${fill}" stroke="${INK}" stroke-width="4"/>
    ${letter ? `<text x="23" y="50" text-anchor="middle" font-family="${serif(lang)}" font-size="30" font-weight="700" fill="${INK}">${esc(letter)}</text>` : ""}
  </g>`;
}

/** A blank card in the stack behind the filled one. */
function blankCard(x, y, w, h, rot) {
  return `
  <g transform="translate(${x},${y}) rotate(${rot})">
    <rect x="6" y="8" width="${w}" height="${h}" rx="6" fill="rgba(31,42,68,0.18)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="${IVORY_2}" stroke="${RULE}" stroke-width="3"/>
    <rect x="0" y="0" width="10" height="${h}" rx="3" fill="${MARGIN}" opacity="0.8"/>
    <rect x="60" y="${h * 0.34}" width="${w * 0.52}" height="7" rx="3" fill="rgba(31,42,68,0.13)"/>
    <rect x="60" y="${h * 0.56}" width="${w * 0.36}" height="7" rx="3" fill="rgba(31,42,68,0.1)"/>
  </g>`;
}

/** The card the reader is meant to actually read. */
function frontCard(job, w, h) {
  const { lang, cardName, cardContext, memo1, memo2, lastLabel, nextLabel, stampWord } = job;
  const nameSize = fitSize(cardName, w - 130, [64, 56, 50, 44]);
  const ctxSize = fitSize(cardContext, w - 130, [28, 26, 24, 22]);
  const memoSize = fitSize(memo1, w - 130, [30, 28, 26, 24]);
  const memo2Size = fitSize(memo2, w - 130, [30, 28, 26, 24]);
  const lastSize = fitSize(`${lastLabel}  2026-08-12`, 330, [26, 24, 22, 20]);
  const nextSize = fitSize(`${nextLabel}  2026-08-25`, 330, [26, 24, 22, 20]);
  const stampSize = fitSize(stampWord, 232, [30, 27, 24, 21]);
  const stampW = Math.round(textWidth(stampWord, stampSize)) + 46;

  return `
  <g>
    <rect x="8" y="10" width="${w}" height="${h}" rx="6" fill="rgba(31,42,68,0.22)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="${IVORY}" stroke="${INK}" stroke-width="3"/>
    <rect x="0" y="0" width="12" height="${h}" rx="3" fill="${MARGIN}"/>
    <rect x="40" y="14" width="2.5" height="${h - 28}" fill="${MARGIN}" opacity="0.34"/>

    <text x="70" y="88" font-family="${serif(lang)}" font-size="${nameSize}" font-weight="700" fill="${INK}">${esc(cardName)}</text>
    <text x="70" y="134" font-family="${sans(lang)}" font-size="${ctxSize}" fill="${MUTED}">${esc(cardContext)}</text>
    <rect x="70" y="160" width="${w - 140}" height="2.5" fill="${RULE}"/>

    <rect x="70" y="222" width="${w - 140}" height="2" fill="${RULING}"/>
    <rect x="70" y="272" width="${w - 140}" height="2" fill="${RULING}"/>
    <rect x="70" y="322" width="${w - 140}" height="2" fill="${RULING}"/>
    <text x="70" y="214" font-family="${sans(lang)}" font-size="${memoSize}" fill="${INK}">${esc(memo1)}</text>
    <text x="70" y="264" font-family="${sans(lang)}" font-size="${memo2Size}" fill="${INK}">${esc(memo2)}</text>

    <g transform="translate(70,${h - 74})">
      <text x="0" y="0" font-family="${mono(lang)}" font-size="${lastSize}" font-weight="700" fill="${MUTED}" letter-spacing="1">${esc(lastLabel)}  2026-08-12</text>
      <text x="0" y="42" font-family="${mono(lang)}" font-size="${nextSize}" font-weight="700" fill="${INK}" letter-spacing="1">${esc(nextLabel)}  2026-08-25</text>
    </g>

    <g transform="translate(${w - stampW - 56},${h - 118}) rotate(-7)">
      <rect x="0" y="0" width="${stampW}" height="60" rx="4" fill="${STAMP_RED_BG}" stroke="${STAMP_RED}" stroke-width="5"/>
      <text x="${stampW / 2}" y="${30 + stampSize * 0.36}" text-anchor="middle" font-family="${sans(lang)}" font-size="${stampSize}" font-weight="800" fill="${STAMP_RED}">${esc(stampWord)}</text>
    </g>
  </g>`;
}

/** The four things this app does not have, struck through. */
function noChips(lang, labels) {
  let x = 0;
  let y = 0;
  const out = [];
  for (const label of labels) {
    const size = fitSize(label, 300, [28, 26, 24, 22]);
    const w = Math.round(textWidth(label, size)) + 48;
    if (x + w > 720) {
      x = 0;
      y += 76;
    }
    out.push(`
    <g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="58" rx="4" fill="${PEN_BG}" stroke="${MUTED}" stroke-width="2.5" opacity="0.95"/>
      <text x="${w / 2}" y="${29 + size * 0.36}" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
      <path d="M4 54 L${w - 4} 4" stroke="${MARGIN}" stroke-width="6" stroke-linecap="round"/>
    </g>`);
    x += w + 18;
  }
  return { svg: out.join(""), height: y + 58 };
}

function svgFor(job) {
  const { lang, title, tagline, noWords, foot, credit } = job;
  const titleSize = fitSize(title, 690, [116, 100, 88, 76, 66]);
  const tagSize = fitSize(tagline, 700, [34, 31, 28, 25, 22]);
  const chips = noChips(lang, noWords);
  const footSize = fitSize(foot, 700, [28, 26, 24, 22]);
  const creditSize = fitSize(credit, 680, [24, 22, 20, 18]);

  const CARD_W = 648;
  const CARD_H = 430;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="board" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#f0f4f9"/>
      <stop offset="52%" stop-color="#dfe6ee"/>
      <stop offset="100%" stop-color="#c9d5e2"/>
    </linearGradient>
    <linearGradient id="cover" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#35558a"/>
      <stop offset="60%" stop-color="#2c4a7c"/>
      <stop offset="100%" stop-color="#213c67"/>
    </linearGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#board)"/>
  ${weave()}

  <!-- the book -->
  <g transform="translate(896,52)">
    <rect x="14" y="16" width="852" height="844" rx="12" fill="rgba(31,42,68,0.2)"/>
    <rect x="0" y="0" width="852" height="844" rx="12" fill="url(#cover)" stroke="${INK}" stroke-width="6"/>
    <!-- the spine, and the brass rule stamped into the board -->
    <rect x="0" y="0" width="52" height="844" rx="12" fill="rgba(0,0,0,0.16)"/>
    <rect x="52" y="0" width="5" height="844" fill="rgba(255,255,255,0.14)"/>
    <rect x="82" y="34" width="736" height="776" rx="6" fill="none" stroke="${BRASS}" stroke-width="5" opacity="0.85"/>
    <rect x="96" y="48" width="708" height="748" rx="4" fill="none" stroke="${BRASS}" stroke-width="2" opacity="0.55"/>

    <!-- the card stack: two blanks behind, the filled one in front -->
    ${blankCard(140, 108, 600, 330, -2.4)}
    ${blankCard(126, 190, 620, 350, 1.4)}
    <g transform="translate(116,276)">
      ${frontCard(job, CARD_W, CARD_H)}
      ${tab(CARD_W - 4, 34, TABSTOCK, job.tabs[0], lang)}
      ${tab(CARD_W - 4, 130, BRASS, job.tabs[1], lang)}
      ${tab(CARD_W - 4, 226, TABSTOCK, job.tabs[2], lang)}
    </g>
  </g>

  <!-- the title block -->
  <g transform="translate(84,166)">
    <text x="0" y="${titleSize}" font-family="${serif(lang)}" font-size="${titleSize}" font-weight="700" fill="${INK}">${esc(title)}</text>
    <rect x="2" y="${titleSize + 28}" width="${Math.min(700, textWidth(title, titleSize))}" height="7" fill="${MARGIN}"/>
    <text x="0" y="${titleSize + 114}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${MUTED}">${esc(tagline)}</text>
    <g transform="translate(0,${titleSize + 172})">${chips.svg}</g>
    <text x="0" y="${titleSize + 172 + chips.height + 68}" font-family="${sans(lang)}" font-size="${footSize}" font-weight="700" fill="${INK}">${esc(foot)}</text>
    <g transform="translate(0,${titleSize + 172 + chips.height + 108})">
      <rect x="0" y="18" width="560" height="3" fill="${RULE}"/>
      <rect x="0" y="14" width="52" height="11" rx="3" fill="${MARGIN}"/>
      <text x="0" y="${66 + creditSize}" font-family="${sans(lang)}" font-size="${creditSize}" font-weight="600" fill="${MUTED}">${esc(credit)}</text>
    </g>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#dfe6ee"/>
  <g transform="translate(28,44)">
    <rect x="24" y="24" width="330" height="330" rx="22" fill="#2c4a7c" stroke="#1f2a44" stroke-width="18"/>
    <rect x="66" y="58" width="256" height="262" rx="12" fill="#fdfaf2" stroke="#1f2a44" stroke-width="14"/>
    <rect x="90" y="66" width="11" height="246" fill="#b8574f"/>
    <rect x="128" y="128" width="160" height="16" rx="8" fill="#62708c"/>
    <rect x="128" y="184" width="182" height="16" rx="8" fill="#62708c"/>
    <rect x="128" y="240" width="120" height="16" rx="8" fill="#62708c"/>
    <rect x="332" y="80" width="78" height="58" rx="10" fill="#cfd9e5" stroke="#1f2a44" stroke-width="14"/>
    <rect x="332" y="164" width="78" height="58" rx="10" fill="#a98634" stroke="#1f2a44" stroke-width="14"/>
    <rect x="332" y="248" width="78" height="58" rx="10" fill="#cfd9e5" stroke="#1f2a44" stroke-width="14"/>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: BOARD_RGB })
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
      title: "인연장",
      tagline: "사람, 메모, 마지막 연락, 다음 연락. 이 기기에만.",
      noWords: ["로그인", "카드 등록", "주소록 접근", "구독·유료 잠금"],
      foot: "메모는 그 사람 카드에 그대로 — 새로고침해도 남습니다",
      credit: "인원·메모 무제한 · 이름은 직접 입력 · 이 기기에만",
      cardName: "이수진",
      cardContext: "2019 회사 동기 · 등산 모임",
      memo1: "둘째 이름 하윤. 이사 얘기 물어보기.",
      memo2: "지난 통화: 이직 준비 중",
      lastLabel: "마지막",
      nextLabel: "다음 연락",
      stampWord: "연락 지남",
      tabs: ["ㄱ", "ㅅ", "ㅇ"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Kinlog",
      tagline: "People, notes, last contact, next contact. On this device only.",
      noWords: ["No login", "No credit card", "No contacts access", "No subscription"],
      foot: "Notes stay on the person's card — a reload never loses them",
      credit: "Unlimited people and notes · you type the names · this device only",
      cardName: "Dana Whitfield",
      cardContext: "2019 team · climbing group",
      memo1: "Second kid is Hana. Ask about the move.",
      memo2: "Last call: job hunting",
      lastLabel: "LAST",
      nextLabel: "NEXT",
      stampWord: "OVERDUE",
      tabs: ["A", "M", "W"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "縁帳",
      tagline: "人、メモ、最後の連絡、次の連絡。この端末だけに。",
      noWords: ["ログインなし", "カード登録なし", "連絡先アクセスなし", "定額課金なし"],
      foot: "メモはその人のカードにそのまま — 再読み込みで消えません",
      credit: "人数・メモ無制限 · 名前は自分で入力 · この端末だけに",
      cardName: "田中 遥",
      cardContext: "2019年の同期 · 山の会",
      memo1: "下の子は はな。引っ越しの話を聞く。",
      memo2: "前回の電話: 転職を検討中",
      lastLabel: "最後",
      nextLabel: "次の連絡",
      stampWord: "連絡が過ぎた",
      tabs: ["あ", "た", "ま"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "亲友录",
      tagline: "人、备注、上次联系、下次联系。只在这台设备。",
      noWords: ["无需登录", "不要信用卡", "不读通讯录", "没有订阅"],
      foot: "备注就留在那个人的卡片上 — 刷新不会丢",
      credit: "人数·备注不限量 · 名字自己输入 · 只在这台设备",
      cardName: "陈立",
      cardContext: "2019 年同事 · 爬山群",
      memo1: "小女儿叫念念。问问搬家的事。",
      memo2: "上次通话：在看新工作",
      lastLabel: "上次",
      nextLabel: "下次联系",
      stampWord: "已过联系日",
      tabs: ["A", "C", "L"],
      files: ["og-image-zh.png"],
    },
  ];
  for (const job of jobs) {
    const buf = Buffer.from(svgFor(job));
    for (const file of job.files) await contain(buf, path.join(OUT, file));
  }
  const iconBuf = Buffer.from(iconSvg());
  await sharp(iconBuf).resize(192, 192, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-192.png"));
  await sharp(iconBuf).resize(512, 512, { fit: "cover" }).png().toFile(path.join(ICONS, "icon-512.png"));
  await sharp(iconBuf).resize(180, 180, { fit: "cover" }).png().toFile(path.join(ICONS, "apple-touch-icon.png"));
  await sharp(iconBuf).resize(32, 32, { fit: "cover" }).png().toFile(path.join(OUT, "favicon.ico"));
  console.log("icons written");
}

main().catch((e) => { console.error(e); process.exit(1); });
