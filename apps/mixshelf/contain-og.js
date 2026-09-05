import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
fs.mkdirSync(ICONS, { recursive: true });

const jobs = [
  {
    lang: "ko",
    file: "og-image-ko.png",
    title: "믹선반",
    line: "책 · 게임 · 영화 · TV",
    sub: "내가 만든 태그로 골라 보기",
    chips: ["로그인 없음", "구독 없음", "수동 제목", "JSON 백업"],
  },
  {
    lang: "en",
    file: "og-image-en.png",
    title: "Mixshelf",
    line: "Books · Games · Movies · TV",
    sub: "Filter by tags you invent",
    chips: ["No login", "No sub/cap", "Manual titles", "JSON backup"],
  },
  {
    lang: "ja",
    file: "og-image-ja.png",
    title: "ミックス棚",
    line: "本 · ゲーム · 映画 · テレビ",
    sub: "自分のタグで絞り込み",
    chips: ["ログインなし", "定額なし", "手入力", "JSONバックアップ"],
  },
  {
    lang: "zh",
    file: "og-image-zh.png",
    title: "混架",
    line: "书 · 游戏 · 电影 · 剧集",
    sub: "用自己的标签筛选",
    chips: ["无需登录", "无订阅上限", "手动标题", "JSON 备份"],
  },
];

const CREAM = "#f6f0e6";
const INK = "#3b2a22";
const PLUM = "#8b3a5c";
const TEAL = "#2f5a52";
const WOOD = "#6b4f3a";

function svgFor(job) {
  const chipEls = job.chips
    .map((c, i) => {
      const y = 430 + i * 42;
      return `<rect x="64" y="${y}" width="420" height="34" rx="8" fill="#fffaf2" stroke="${WOOD}" stroke-width="2"/>
      <text x="84" y="${y + 23}" font-family="Noto Sans CJK KR, Noto Sans CJK JP, Noto Sans CJK SC, sans-serif" font-size="18" fill="${INK}">${escapeXml(c)}</text>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${CREAM}"/>
  <rect x="0" y="0" width="1200" height="18" fill="${WOOD}"/>
  <rect x="560" y="80" width="560" height="470" rx="12" fill="#efe4d4" stroke="${WOOD}" stroke-width="3"/>
  <!-- spines -->
  <rect x="590" y="120" width="48" height="380" fill="${PLUM}"/>
  <rect x="650" y="140" width="42" height="360" fill="${TEAL}"/>
  <rect x="704" y="110" width="55" height="390" fill="#c4a574"/>
  <rect x="771" y="150" width="38" height="350" fill="${WOOD}"/>
  <rect x="821" y="125" width="50" height="375" fill="#4a6fa5"/>
  <rect x="883" y="160" width="44" height="340" fill="${PLUM}"/>
  <rect x="939" y="130" width="60" height="370" fill="${TEAL}"/>
  <rect x="1011" y="145" width="40" height="355" fill="#a65d3f"/>
  <circle cx="1080" cy="280" r="36" fill="#fffaf2" stroke="${INK}" stroke-width="3"/>
  <text x="1068" y="288" font-size="28">🎮</text>
  <rect x="1040" y="360" width="70" height="44" rx="6" fill="#1a1a1a"/>
  <rect x="1050" y="368" width="50" height="28" fill="#6ec6ff"/>
  <text x="64" y="120" font-family="Noto Sans CJK KR, Noto Sans CJK JP, Noto Sans CJK SC, sans-serif" font-size="64" font-weight="700" fill="${INK}">${escapeXml(job.title)}</text>
  <text x="64" y="180" font-family="Noto Sans CJK KR, Noto Sans CJK JP, Noto Sans CJK SC, sans-serif" font-size="28" fill="${TEAL}">${escapeXml(job.line)}</text>
  <text x="64" y="230" font-family="Noto Sans CJK KR, Noto Sans CJK JP, Noto Sans CJK SC, sans-serif" font-size="26" fill="${PLUM}">${escapeXml(job.sub)}</text>
  ${chipEls}
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function render(job) {
  const svg = Buffer.from(svgFor(job));
  const buf = await sharp(svg).png().toBuffer();
  const dest = path.join(OUT, job.file);
  fs.writeFileSync(dest, buf);
  console.log("wrote", job.file, buf.length);
  if (job.lang === "ko") {
    fs.copyFileSync(dest, path.join(OUT, "og-image.png"));
  }
}

async function icons() {
  const mark = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${CREAM}"/>
  <rect x="72" y="96" width="56" height="320" fill="${PLUM}"/>
  <rect x="144" y="120" width="48" height="296" fill="${TEAL}"/>
  <rect x="208" y="88" width="64" height="328" fill="#c4a574"/>
  <rect x="288" y="130" width="44" height="286" fill="${WOOD}"/>
  <rect x="348" y="100" width="58" height="316" fill="#4a6fa5"/>
  <rect x="420" y="140" width="40" height="276" fill="${PLUM}"/>
</svg>`);
  await sharp(mark).png().toFile(path.join(ICONS, "icon-512.png"));
  await sharp(mark).resize(192, 192).png().toFile(path.join(ICONS, "icon-192.png"));
  await sharp(mark).resize(180, 180).png().toFile(path.join(ICONS, "apple-touch-icon.png"));
  fs.copyFileSync(path.join(ICONS, "icon-512.png"), path.join(ICONS, "icon-maskable-512.png"));
  console.log("icons ok");
}

for (const job of jobs) await render(job);
await icons();
