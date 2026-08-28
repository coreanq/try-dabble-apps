// ESM: package.json is "type": "module".
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Lastloved card: a cassette that has gone soft with age, and the ticket stubs
 * torn off it. The stub in front is the whole product — a song title written by
 * hand, the artist stamped under it, the day it was LAST LOVED, and a year
 * punched on the end telling you when it comes back. The stub behind it has
 * already come back, so its stamp is red.
 * The left column carries the title and the four gates this app refuses,
 * struck through, because "needs a library of 100 songs", "log in first" and
 * "connect your streaming account" are exactly the walls it answers.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const DUSK_RGB = { r: 222, g: 209, b: 214, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const serif = (lang) => `Noto Serif CJK ${CJK[lang]}, serif`;
const sans = (lang) => `Noto Sans CJK ${CJK[lang]}, sans-serif`;
const mono = (lang) => `Noto Sans Mono CJK ${CJK[lang]}, monospace`;

const INK = "#2e2733";
const MUTED = "#6f6478";
const FAINT = "#9d92a6";
const DUSK = "#ded1d6";
const STUB = "#fdf8f2";
const STUB_2 = "#f6ece1";
const RULE = "#ddcfd8";
const PERF = "#c6b6c2";
const VIOLET = "#57407f";
const VIOLET_BG = "#e8e0f5";
const DUE = "#a83454";
const DUE_BG = "#f8dfe6";
const REEL = "#7a5a3c";
const SHELL = "#4a3f52";

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

/** Tape hiss: the fine diagonal grain of a sleeve left in a drawer. */
function hiss() {
  const out = [];
  for (let i = -945; i < 1800; i += 9) {
    out.push(
      `<rect x="${i}" y="0" width="2.5" height="1900" fill="rgba(46,39,51,0.035)" transform="rotate(38 ${i} 0)"/>`,
    );
  }
  return out.join("");
}

/** The year punched on the end of a stub. Violet while sealed, red once back. */
function yearStamp(year, word, lang, tone) {
  const color = tone === "due" ? DUE : VIOLET;
  const bg = tone === "due" ? DUE_BG : VIOLET_BG;
  const numSize = 62;
  const wordSize = fitSize(word, 168, [26, 24, 22, 20, 18]);
  const w = Math.max(
    196,
    Math.round(Math.max(textWidth(year, numSize), textWidth(word, wordSize))) + 52,
  );
  return `
  <g>
    <rect x="0" y="0" width="${w}" height="132" rx="4" fill="${bg}" stroke="${color}" stroke-width="7"/>
    <text x="${w / 2}" y="72" text-anchor="middle" font-family="${mono(lang)}" font-size="${numSize}" font-weight="800" fill="${color}" letter-spacing="2">${esc(year)}</text>
    <text x="${w / 2}" y="${104 + wordSize * 0.1}" text-anchor="middle" font-family="${sans(lang)}" font-size="${wordSize}" font-weight="800" fill="${color}" letter-spacing="1.5">${esc(word)}</text>
  </g>`;
}

/** The perforated tear line down the left edge of a stub. */
function perforation(h) {
  const dots = [];
  for (let y = 18; y < h - 10; y += 24) {
    dots.push(`<rect x="46" y="${y}" width="5" height="13" rx="2.5" fill="${PERF}"/>`);
  }
  return dots.join("");
}

/** The stub the reader is meant to actually read. */
function frontStub(job, w, h) {
  const { lang, songTitle, songArtist, lastLabel, lastDate, returnYear, returnWord } = job;
  const titleSize = fitSize(songTitle, w - 350, [62, 54, 48, 42, 38]);
  const artistSize = fitSize(songArtist, w - 350, [34, 31, 28, 25]);
  const lastSize = fitSize(`${lastLabel}  ${lastDate}`, 430, [30, 28, 26, 24]);

  return `
  <g>
    <rect x="10" y="12" width="${w}" height="${h}" rx="6" fill="rgba(46,39,51,0.24)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="${STUB}" stroke="${INK}" stroke-width="4"/>
    ${perforation(h)}
    <!-- the half-moon notches at the ends of the tear -->
    <circle cx="48" cy="0" r="15" fill="${DUSK}" stroke="${INK}" stroke-width="4"/>
    <circle cx="48" cy="${h}" r="15" fill="${DUSK}" stroke="${INK}" stroke-width="4"/>

    <text x="96" y="88" font-family="${serif(lang)}" font-size="${titleSize}" font-style="italic" font-weight="700" fill="${INK}">${esc(songTitle)}</text>
    <text x="96" y="${88 + artistSize + 30}" font-family="${sans(lang)}" font-size="${artistSize}" font-weight="700" fill="${MUTED}" letter-spacing="4">${esc(songArtist)}</text>
    <rect x="96" y="${h - 92}" width="${w - 380}" height="2.5" fill="${RULE}"/>
    <text x="96" y="${h - 40}" font-family="${mono(lang)}" font-size="${lastSize}" font-weight="700" fill="${MUTED}" letter-spacing="1">${esc(lastLabel)}  ${esc(lastDate)}</text>

    <g transform="translate(${w - 246},${h / 2 - 66}) rotate(-4)">${yearStamp(returnYear, returnWord, lang, "waiting")}</g>
  </g>`;
}

/** The stub behind: this one's years are already up, so its stamp is red. */
function backStub(job, w, h) {
  const { lang, backTitle, backYear, backWord } = job;
  const titleSize = fitSize(backTitle, w - 330, [44, 40, 36, 32]);
  return `
  <g>
    <rect x="8" y="10" width="${w}" height="${h}" rx="6" fill="rgba(46,39,51,0.18)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="6" fill="${STUB_2}" stroke="${INK}" stroke-width="3.5"/>
    ${perforation(h)}
    <text x="92" y="${titleSize + 26}" font-family="${serif(lang)}" font-size="${titleSize}" font-style="italic" font-weight="700" fill="${INK}">${esc(backTitle)}</text>
    <rect x="92" y="${titleSize + 54}" width="${Math.round(w * 0.38)}" height="9" rx="4" fill="rgba(46,39,51,0.14)"/>
    <g transform="translate(${w - 288},14) rotate(-7)">${yearStamp(backYear, backWord, lang, "due")}</g>
  </g>`;
}

/** The cassette the stubs were torn from. */
function cassette(job, w, h) {
  const { lang, sideWord } = job;
  const sideSize = fitSize(sideWord, 150, [26, 24, 22, 20]);
  return `
  <g>
    <rect x="12" y="16" width="${w}" height="${h}" rx="16" fill="rgba(46,39,51,0.22)"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="16" fill="${SHELL}" stroke="${INK}" stroke-width="6"/>
    <rect x="16" y="16" width="${w - 32}" height="${h - 32}" rx="10" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="3"/>

    <!-- the printed label -->
    <rect x="44" y="40" width="${w - 88}" height="196" rx="8" fill="${STUB}" stroke="${INK}" stroke-width="4"/>
    <rect x="44" y="40" width="${w - 88}" height="52" rx="8" fill="${VIOLET}"/>
    <rect x="44" y="84" width="${w - 88}" height="8" fill="${DUE}" opacity="0.8"/>
    <text x="76" y="78" font-family="${mono(lang)}" font-size="${sideSize}" font-weight="800" fill="${STUB}" letter-spacing="6">${esc(sideWord)}</text>
    <rect x="76" y="132" width="${Math.round((w - 88) * 0.62)}" height="11" rx="5" fill="rgba(46,39,51,0.2)"/>
    <rect x="76" y="168" width="${Math.round((w - 88) * 0.44)}" height="11" rx="5" fill="rgba(46,39,51,0.14)"/>
    <rect x="76" y="204" width="${Math.round((w - 88) * 0.52)}" height="11" rx="5" fill="rgba(46,39,51,0.14)"/>

    <!-- the reels, half wound -->
    <circle cx="${w * 0.33}" cy="${h - 150}" r="86" fill="#2a2430" stroke="${INK}" stroke-width="5"/>
    <circle cx="${w * 0.67}" cy="${h - 150}" r="86" fill="#2a2430" stroke="${INK}" stroke-width="5"/>
    <circle cx="${w * 0.33}" cy="${h - 150}" r="62" fill="${REEL}"/>
    <circle cx="${w * 0.67}" cy="${h - 150}" r="48" fill="${REEL}"/>
    <circle cx="${w * 0.33}" cy="${h - 150}" r="24" fill="${STUB_2}" stroke="${INK}" stroke-width="4"/>
    <circle cx="${w * 0.67}" cy="${h - 150}" r="24" fill="${STUB_2}" stroke="${INK}" stroke-width="4"/>
    <rect x="${w * 0.33}" y="${h - 216}" width="${w * 0.34}" height="10" fill="${REEL}"/>
  </g>`;
}

/** The four gates this app refuses, struck through. */
function noChips(lang, labels) {
  let x = 0;
  let y = 0;
  const out = [];
  for (const label of labels) {
    const size = fitSize(label, 300, [28, 26, 24, 22]);
    const w = Math.round(textWidth(label, size)) + 48;
    if (x + w > 700) {
      x = 0;
      y += 76;
    }
    out.push(`
    <g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${w}" height="58" rx="4" fill="${VIOLET_BG}" stroke="${MUTED}" stroke-width="2.5" opacity="0.95"/>
      <text x="${w / 2}" y="${29 + size * 0.36}" text-anchor="middle" font-family="${sans(lang)}" font-size="${size}" font-weight="700" fill="${MUTED}">${esc(label)}</text>
      <path d="M4 54 L${w - 4} 4" stroke="${DUE}" stroke-width="6" stroke-linecap="round"/>
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="sleeve" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="#efe4e8"/>
      <stop offset="50%" stop-color="#ded1d6"/>
      <stop offset="100%" stop-color="#c7b6c2"/>
    </linearGradient>
  </defs>

  <rect width="1800" height="945" fill="url(#sleeve)"/>
  ${hiss()}
  <circle cx="1640" cy="70" r="240" fill="rgba(87,64,127,0.07)"/>
  <circle cx="120" cy="900" r="200" fill="rgba(168,52,84,0.06)"/>

  <!-- the cassette, and the stubs torn off it -->
  <g transform="translate(944,64)">
    ${cassette(job, 762, 470)}
  </g>
  <g transform="translate(902,352) rotate(1.8)">
    ${backStub(job, 806, 214)}
  </g>
  <g transform="translate(880,572) rotate(-2.6)">
    ${frontStub(job, 840, 300)}
  </g>

  <!-- the title block -->
  <g transform="translate(84,150)">
    <text x="0" y="${titleSize}" font-family="${serif(lang)}" font-size="${titleSize}" font-weight="700" fill="${INK}">${esc(title)}</text>
    <rect x="2" y="${titleSize + 28}" width="${Math.min(700, textWidth(title, titleSize))}" height="7" fill="${VIOLET}"/>
    <text x="0" y="${titleSize + 114}" font-family="${sans(lang)}" font-size="${tagSize}" font-weight="600" fill="${MUTED}">${esc(tagline)}</text>
    <g transform="translate(0,${titleSize + 172})">${chips.svg}</g>
    <text x="0" y="${titleSize + 172 + chips.height + 68}" font-family="${sans(lang)}" font-size="${footSize}" font-weight="700" fill="${INK}">${esc(foot)}</text>
    <g transform="translate(0,${titleSize + 172 + chips.height + 108})">
      <rect x="0" y="18" width="560" height="3" fill="${FAINT}"/>
      <rect x="0" y="14" width="52" height="11" rx="3" fill="${DUE}"/>
      <text x="0" y="${66 + creditSize}" font-family="${sans(lang)}" font-size="${creditSize}" font-weight="600" fill="${MUTED}">${esc(credit)}</text>
    </g>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#ded1d6"/>
  <g transform="translate(34,74)">
    <rect x="12" y="12" width="420" height="290" rx="26" fill="#4a3f52" stroke="#2e2733" stroke-width="18"/>
    <rect x="48" y="44" width="348" height="104" rx="10" fill="#fdf8f2" stroke="#2e2733" stroke-width="12"/>
    <rect x="48" y="44" width="348" height="34" fill="#57407f"/>
    <rect x="48" y="74" width="348" height="8" fill="#a83454"/>
    <circle cx="152" cy="226" r="56" fill="#2a2430" stroke="#2e2733" stroke-width="12"/>
    <circle cx="292" cy="226" r="56" fill="#2a2430" stroke="#2e2733" stroke-width="12"/>
    <circle cx="152" cy="226" r="34" fill="#7a5a3c"/>
    <circle cx="292" cy="226" r="26" fill="#7a5a3c"/>
    <rect x="152" y="180" width="140" height="10" fill="#7a5a3c"/>
    <g transform="translate(268,264) rotate(-8)">
      <rect x="0" y="0" width="182" height="86" rx="6" fill="#f8dfe6" stroke="#a83454" stroke-width="12"/>
      <text x="91" y="64" text-anchor="middle" font-family="monospace" font-size="54" font-weight="800" fill="#a83454">↺</text>
    </g>
  </g>
</svg>`;
}

async function contain(inputBuf, output) {
  await sharp(inputBuf)
    .resize(1200, 630, { fit: "contain", background: DUSK_RGB })
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
      title: "그때그곡",
      tagline: "제목과 가수만. N년 뒤에 다시 만난다.",
      noWords: ["로그인", "100곡 조건", "스트리밍 연결", "구독·유료 잠금"],
      foot: "탭을 닫아도 그대로 — 그날이 오면 맨 위로 돌아옵니다",
      credit: "곡 수 제한 없음 · 재생 버튼 없음 · 이 기기에만",
      sideWord: "SIDE A",
      songTitle: "밤편지",
      songArtist: "아이유",
      lastLabel: "마지막",
      lastDate: "2026-08-14",
      returnYear: "2031",
      returnWord: "년에 귀환",
      backTitle: "가로수 그늘 아래 서면",
      backYear: "2026",
      backWord: "돌아옴",
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Lastloved",
      tagline: "Title and artist. It comes back in N years.",
      noWords: ["No login", "No 100-song rule", "No streaming account", "No subscription"],
      foot: "Close the tab — it is still here, and it comes back on the day",
      credit: "No song cap · no play button · this device only",
      sideWord: "SIDE A",
      songTitle: "Wildflower",
      songArtist: "The Avalanches",
      lastLabel: "LAST LOVED",
      lastDate: "2026-08-14",
      returnYear: "2031",
      returnWord: "RETURNS",
      backTitle: "This Must Be the Place",
      backYear: "2026",
      backWord: "BACK NOW",
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "あの頃の曲",
      tagline: "タイトルと歌手だけ。N年後にまた会える。",
      noWords: ["ログイン", "100曲の条件", "ストリーミング連携", "定額課金"],
      foot: "タブを閉じても残る — その日が来たら一番上に戻ります",
      credit: "曲数の上限なし · 再生ボタンなし · この端末だけに",
      sideWord: "SIDE A",
      songTitle: "打上花火",
      songArtist: "DAOKO",
      lastLabel: "最後",
      lastDate: "2026-08-14",
      returnYear: "2031",
      returnWord: "年に帰還",
      backTitle: "夜空ノムコウ",
      backYear: "2026",
      backWord: "帰ってきた",
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "当年那首歌",
      tagline: "只要歌名和歌手。N 年后它会回来。",
      noWords: ["登录", "100 首门槛", "绑定流媒体", "订阅付费"],
      foot: "关掉标签页也还在 — 到了那天会回到最上面",
      credit: "不限歌曲数量 · 没有播放键 · 只在这台设备",
      sideWord: "SIDE A",
      songTitle: "晴天",
      songArtist: "周杰伦",
      lastLabel: "上次",
      lastDate: "2026-08-14",
      returnYear: "2031",
      returnWord: "年归来",
      backTitle: "後來",
      backYear: "2026",
      backWord: "已经回来",
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
