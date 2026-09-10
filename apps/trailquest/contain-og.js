// ESM: package.json is "type": "module", same as the other Vite apps here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Trailquest card: a day-hike map unfolded on cream paper.
 *
 * The product is "your real miles laid onto a long trail", so the picture is
 * a map sheet: a mist ridge and a moss ridge, an ochre trail winding across
 * the meadow with milestone posts along it, a boot-print marker part way,
 * and a route card with the progress rail and the figures. Everything is
 * drawn here as SVG by hand; no image model is involved anywhere. Four real
 * jobs (ko/en/ja/zh), each its own SVG → PNG; zh is never an alias of en.
 */

const OUT = path.join(import.meta.dirname, "public");
const ICONS = path.join(OUT, "icons");
const PAPER = { r: 247, g: 243, b: 232, alpha: 1 };

const CJK = { ko: "KR", ja: "JP", zh: "SC", en: "KR" };
const sans = (lang, latin) => `${latin ? latin + ", " : ""}Noto Sans CJK ${CJK[lang]}, sans-serif`;
const figures = (lang) => `DejaVu Sans, Noto Sans CJK ${CJK[lang]}, sans-serif`;

const INK = "#2b3a2e";
const MUTED = "#5f6f61";
const LINE = "#dcd5c2";
const LINE2 = "#c9c0a8";
const MOSS = "#3f6b4b";
const MOSS_DEEP = "#2f5238";
const MOSS_SOFT = "#dfeadf";
const OCHRE = "#c2883a";
const OCHRE_DEEP = "#9a6a2a";
const PAPER2 = "#efe8d6";
const MIST = "#e4ecf1";
const MIST_DEEP = "#b9cbd6";
const AMBER = "#f2c14e";
const AMBER_INK = "#3b2a05";
const WHITE = "#ffffff";
const CREAM = "#f7f3e8";

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

/** Faint contour grid across the paper. */
function grid() {
  const out = [];
  for (let y = 40; y < 945; y += 48) out.push(`<line x1="0" y1="${y}" x2="1800" y2="${y}" stroke="${MOSS}" stroke-opacity="0.07" stroke-width="2"/>`);
  for (let x = 40; x < 1800; x += 48) out.push(`<line x1="${x}" y1="0" x2="${x}" y2="945" stroke="${MOSS}" stroke-opacity="0.05" stroke-width="2"/>`);
  return out.join("");
}

/** The trail polyline across the map panel (panel is 1580 x 300). */
const TRAIL = [
  [60, 250],
  [230, 232],
  [380, 186],
  [560, 206],
  [740, 160],
  [900, 176],
  [1060, 124],
  [1230, 140],
  [1390, 96],
  [1520, 70],
];
function pathD(points) {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}
function trailLength() {
  let l = 0;
  for (let i = 1; i < TRAIL.length; i++) l += Math.hypot(TRAIL[i][0] - TRAIL[i - 1][0], TRAIL[i][1] - TRAIL[i - 1][1]);
  return l;
}
function pointAt(ratio) {
  let dist = ratio * trailLength();
  for (let i = 1; i < TRAIL.length; i++) {
    const [x0, y0] = TRAIL[i - 1];
    const [x1, y1] = TRAIL[i];
    const l = Math.hypot(x1 - x0, y1 - y0);
    if (dist <= l) {
      const f = dist / l;
      return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
    }
    dist -= l;
  }
  return TRAIL[TRAIL.length - 1];
}

/** The map panel: ridges, meadow, trail, milestone posts and the marker. */
function mapPanel(lang, x, y, job) {
  const len = trailLength();
  const ratio = job.ratio;
  const here = pointAt(ratio);
  const posts = job.milestones
    .map((m, i) => {
      const [px, py] = pointAt(m.at);
      const lit = m.at <= ratio;
      const labelSize = fitSize(m.name, 190, [24, 22, 20, 18]);
      const lw = textWidth(m.name, labelSize) + 28;
      // Alternate above / below, but never let a label fall off the panel;
      // the first one sits to the right of the start post instead.
      const above = i % 2 === 1 || py + 26 + labelSize + 16 > 292;
      const ly = above ? -58 : 26;
      let anchorX = Math.max(-px + lw / 2 + 8, Math.min(1580 - px - lw / 2 - 8, 0));
      if (i === 0) anchorX = lw / 2 + 28;
      return `
    <g transform="translate(${px},${py})">
      <circle r="11" fill="${lit ? MOSS : WHITE}" stroke="${lit ? CREAM : OCHRE_DEEP}" stroke-width="4"/>
      <rect x="${anchorX - lw / 2}" y="${ly}" width="${lw}" height="${labelSize + 16}" rx="${(labelSize + 16) / 2}" fill="${lit ? MOSS_DEEP : WHITE}" fill-opacity="0.92" stroke="${lit ? CREAM : LINE2}" stroke-width="2"/>
      <text x="${anchorX}" y="${ly + labelSize + 3}" text-anchor="middle" font-family="${sans(lang)}" font-size="${labelSize}" font-weight="700" fill="${lit ? CREAM : MUTED}">${esc(m.name)}</text>
    </g>`;
    })
    .join("");
  return `
  <g transform="translate(${x},${y})">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${MIST}"/>
        <stop offset="100%" stop-color="#f4f1e6"/>
      </linearGradient>
      <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${MOSS}"/>
        <stop offset="100%" stop-color="${MOSS_DEEP}"/>
      </linearGradient>
      <clipPath id="panel"><rect x="0" y="0" width="1580" height="300" rx="26"/></clipPath>
    </defs>
    <rect x="0" y="0" width="1580" height="300" rx="26" fill="url(#sky)" stroke="${MIST_DEEP}" stroke-width="3"/>
    <g clip-path="url(#panel)">
      <path d="M0 190 L160 110 L300 150 L470 70 L640 130 L830 50 L1010 110 L1170 60 L1330 100 L1500 40 L1580 70 L1580 300 L0 300 Z" fill="${MIST_DEEP}" opacity="0.55"/>
      <path d="M0 240 L130 170 L250 200 L400 130 L540 180 L720 100 L880 160 L1060 90 L1230 150 L1400 80 L1580 140 L1580 300 L0 300 Z" fill="url(#ridge)"/>
      <path d="M720 100 L740 122 L700 122 Z" fill="${CREAM}" opacity="0.9"/>
      <path d="M1400 80 L1420 102 L1380 102 Z" fill="${CREAM}" opacity="0.9"/>
      <path d="M0 262 Q400 240 800 262 T1580 252 L1580 300 L0 300 Z" fill="#5f8a63" opacity="0.8"/>
      <path d="${pathD(TRAIL)}" fill="none" stroke="${CREAM}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>
      <path d="${pathD(TRAIL)}" fill="none" stroke="${LINE2}" stroke-width="5" stroke-dasharray="10 14" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${pathD(TRAIL)}" fill="none" stroke="${OCHRE}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - ratio)}"/>
      ${posts}
      <g transform="translate(${here[0]},${here[1]})">
        <circle r="22" fill="${WHITE}" stroke="${MOSS}" stroke-width="5"/>
        <g transform="rotate(-18)">
          <ellipse cx="-4.5" cy="2" rx="5" ry="7.5" fill="${MOSS}"/>
          <ellipse cx="5" cy="-2.5" rx="5" ry="7.5" fill="${MOSS}"/>
          <circle cx="-5" cy="-9" r="2.2" fill="${MOSS}"/>
          <circle cx="4.7" cy="-13" r="2.2" fill="${MOSS}"/>
        </g>
      </g>
      <g transform="translate(${TRAIL[0][0]},${TRAIL[0][1]})">
        <rect x="-3" y="-46" width="6" height="40" fill="${MUTED}"/>
        <path d="M3 -46 L30 -36 L3 -26 Z" fill="${MOSS}"/>
      </g>
      <g transform="translate(${TRAIL[TRAIL.length - 1][0]},${TRAIL[TRAIL.length - 1][1]})">
        <rect x="-3" y="-52" width="6" height="46" fill="${MUTED}"/>
        <path d="M3 -52 L36 -40 L3 -28 Z" fill="${OCHRE}"/>
      </g>
    </g>
  </g>`;
}

/** The route card under the map: name, rail, three figures. */
function routeCard(lang, x, y, w, job) {
  const nameSize = fitSize(job.routeName, w * 0.6, [40, 36, 32, 28]);
  const pctSize = 48;
  const railW = w - 80;
  const figW = (w - 80 - 40) / 3;
  const figs = job.figures
    .map((f, i) => {
      const vSize = fitSize(f.value, figW - 40, [36, 32, 28, 24]);
      return `
    <g transform="translate(${40 + i * (figW + 20)},108)">
      <rect x="0" y="0" width="${figW}" height="96" rx="18" fill="${CREAM}" stroke="${LINE}" stroke-width="2.5"/>
      <text x="20" y="34" font-family="${sans(lang)}" font-size="22" font-weight="700" fill="${MUTED}">${esc(f.label)}</text>
      <text x="20" y="78" font-family="${figures(lang)}" font-size="${vSize}" font-weight="700" fill="${f.color}">${esc(f.value)}</text>
    </g>`;
    })
    .join("");
  return `
  <g transform="translate(${x},${y})" filter="url(#shadow)">
    <rect x="0" y="0" width="${w}" height="228" rx="26" fill="${WHITE}" stroke="${LINE}" stroke-width="3"/>
  </g>
  <g transform="translate(${x},${y})">
    <text x="40" y="52" font-family="${sans(lang)}" font-size="${nameSize}" font-weight="800" fill="${INK}">${esc(job.routeName)}</text>
    <text x="${w - 40}" y="56" text-anchor="end" font-family="${figures(lang)}" font-size="${pctSize}" font-weight="700" fill="${OCHRE_DEEP}">${esc(job.percent)}</text>
    <rect x="40" y="70" width="${railW}" height="22" rx="11" fill="${PAPER2}" stroke="${LINE}" stroke-width="2"/>
    <rect x="40" y="70" width="${Math.max(22, railW * job.ratio)}" height="22" rx="11" fill="${OCHRE}"/>
    ${figs}
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
  const { lang, title, subtitle, badge } = job;
  const titleSize = fitSize(title, 900, [88, 80, 72, 64, 56]);
  const subSize = fitSize(subtitle, 1560, [32, 30, 28, 26, 23, 20]);
  const mapY = 50 + titleSize + subSize + 40;
  const cardY = mapY + 300 + 24;
  const badgeSize = fitSize(badge, 380, [30, 27, 24, 22]);
  const badgeW = textWidth(badge, badgeSize) + 56;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="945" viewBox="0 0 1800 945">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ece6d4"/>
      <stop offset="25%" stop-color="${CREAM}"/>
      <stop offset="100%" stop-color="${CREAM}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${INK}" flood-opacity="0.14"/>
    </filter>
  </defs>

  <rect width="1800" height="945" fill="url(#paper)"/>
  ${grid()}
  <rect x="0" y="0" width="1800" height="14" fill="${MOSS}"/>
  <rect x="0" y="14" width="1800" height="5" fill="${OCHRE}"/>

  <!-- title block -->
  <g transform="translate(110,50)">
    <text x="0" y="${titleSize}" font-family="${sans(lang, "URW Gothic")}" font-size="${titleSize}" font-weight="800" fill="${INK}">${esc(title)}</text>
    <text x="4" y="${titleSize + subSize + 16}" font-family="${sans(lang)}" font-size="${subSize}" font-weight="600" fill="${MUTED}">${esc(subtitle)}</text>
  </g>
  <!-- sticky note: local only -->
  <g transform="translate(${1690 - badgeW},${62}) rotate(-3)">
    <rect x="0" y="0" width="${badgeW}" height="${badgeSize + 36}" rx="8" fill="${AMBER}"/>
    <text x="${badgeW / 2}" y="${badgeSize + 10}" text-anchor="middle" font-family="${sans(lang)}" font-size="${badgeSize}" font-weight="800" fill="${AMBER_INK}">${esc(badge)}</text>
  </g>

  ${mapPanel(lang, 110, mapY, job)}
  ${routeCard(lang, 110, cardY, 1580, job)}

  ${promises(lang, job.promises, 110, 945 - 36 - 50)}
</svg>`;
}

/** App icon: the cream disc with a moss ridge and an ochre trail, same as the masthead mark. */
function iconSvg(pad) {
  const s = 512 - pad * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ece6d4"/>
      <stop offset="100%" stop-color="${CREAM}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad}) scale(${s / 512})">
    <circle cx="256" cy="256" r="232" fill="${MOSS_SOFT}"/>
    <path d="M48 352 L160 192 L224 272 L304 144 L416 304 L464 352 Z" fill="${MOSS}"/>
    <path d="M304 144 L336 192 L288 208 Z" fill="${CREAM}"/>
    <path d="M48 352 Q176 320 240 384 T464 352 L464 400 Q320 448 240 416 T48 400 Z" fill="${OCHRE}"/>
    <path d="M64 392 Q176 352 240 408 T448 384" fill="none" stroke="${CREAM}" stroke-width="16" stroke-dasharray="24 24" stroke-linecap="round"/>
    <circle cx="368" cy="360" r="32" fill="${CREAM}" stroke="${MOSS}" stroke-width="16"/>
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
  const ratio = 0.42;
  const jobs = [
    {
      lang: "ko",
      title: "트레일퀘스트",
      subtitle: "무료 로컬 가상 장거리 트레일 트래커. 실제 마일/걸음을 기록해 PCT·AT급 루트를 진행. 계정 없음. AI 아트 없음.",
      badge: "데이터는 이 기기에만",
      ratio,
      routeName: "퍼시픽 크레스트 트레일 (PCT)",
      percent: "42%",
      milestones: [
        { name: "캄포", at: 0 },
        { name: "케네디 메도우스", at: 0.265 },
        { name: "요세미티", at: 0.355 },
        { name: "오리건 경계", at: 0.648 },
        { name: "캐나다 국경", at: 1 },
      ],
      figures: [
        { label: "걸은 거리", value: "1,113 mi", color: OCHRE_DEEP },
        { label: "전체", value: "2,650 mi", color: INK },
        { label: "남은 거리", value: "1,537 mi", color: MOSS_DEEP },
      ],
      promises: ["직접 기록만", "루트 바꿔도 진행 유지", "멤버십 없음", "JSON 백업", "AI 아트 없음", "ko/en/ja/zh"],
      files: ["og-image.png", "og-image-ko.png"],
    },
    {
      lang: "en",
      title: "Trailquest",
      subtitle: "Free local virtual trail tracker. Log real miles toward PCT/AT-class routes. Milestones, streaks, JSON backup. No account. No AI art.",
      badge: "Data stays on this device",
      ratio,
      routeName: "Pacific Crest Trail (PCT)",
      percent: "42%",
      milestones: [
        { name: "Campo", at: 0 },
        { name: "Kennedy Meadows", at: 0.265 },
        { name: "Yosemite", at: 0.355 },
        { name: "Oregon border", at: 0.648 },
        { name: "Canada", at: 1 },
      ],
      figures: [
        { label: "Walked", value: "1,113 mi", color: OCHRE_DEEP },
        { label: "Total", value: "2,650 mi", color: INK },
        { label: "Remaining", value: "1,537 mi", color: MOSS_DEEP },
      ],
      promises: ["Manual log only", "Switch routes, progress kept", "No membership", "JSON backup", "No AI art", "ko/en/ja/zh"],
      files: ["og-image-en.png"],
    },
    {
      lang: "ja",
      title: "トレイルクエスト",
      subtitle: "無料のローカル仮想ロングトレイル記録。実際のマイルや歩数をPCT・AT級ルートの進捗に。アカウント不要。AIアートなし。",
      badge: "データはこの端末だけ",
      ratio,
      routeName: "パシフィック・クレスト・トレイル (PCT)",
      percent: "42%",
      milestones: [
        { name: "カンポ", at: 0 },
        { name: "ケネディ・メドウズ", at: 0.265 },
        { name: "ヨセミテ", at: 0.355 },
        { name: "オレゴン州境", at: 0.648 },
        { name: "カナダ国境", at: 1 },
      ],
      figures: [
        { label: "歩いた距離", value: "1,791 km", color: OCHRE_DEEP },
        { label: "全体", value: "4,265 km", color: INK },
        { label: "残り", value: "2,474 km", color: MOSS_DEEP },
      ],
      promises: ["手入力のみ", "ルート切替でも進捗維持", "会員制なし", "JSONバックアップ", "AIアートなし", "ko/en/ja/zh"],
      files: ["og-image-ja.png"],
    },
    {
      lang: "zh",
      title: "步道征途",
      subtitle: "免费本地虚拟长途步道追踪。把真实里程/步数记到 PCT/AT 级路线进度。无需账号。无 AI 绘图。",
      badge: "数据仅在此设备",
      ratio,
      routeName: "太平洋屋脊步道 (PCT)",
      percent: "42%",
      milestones: [
        { name: "坎波", at: 0 },
        { name: "肯尼迪草甸", at: 0.265 },
        { name: "优胜美地", at: 0.355 },
        { name: "俄勒冈州界", at: 0.648 },
        { name: "加拿大边境", at: 1 },
      ],
      figures: [
        { label: "已走", value: "1,791 km", color: OCHRE_DEEP },
        { label: "总距离", value: "4,265 km", color: INK },
        { label: "剩余", value: "2,474 km", color: MOSS_DEEP },
      ],
      promises: ["仅手动记录", "切换路线保留进度", "无会员制", "JSON 备份", "无 AI 绘图", "ko/en/ja/zh"],
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
