import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.GYMAC_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Gymac",
    tagline: "Free local gym + macro tracker. Log exercises (sets×reps×weight), daily calories and P/C/F, weigh-ins, PR history, custom foods, JSON backup. No account. No ads.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    ogLocale: "en_US",
    ogImage: "https://gymac.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "ジャイマック",
    tagline: "無料のローカルジム＆マクロ記録。種目（セット×回数×重量）、1日カロリーとP/C/F、体重、PR、カスタム食品、JSONバックアップ。アカウント不要。広告なし。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    ogLocale: "ja_JP",
    ogImage: "https://gymac.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "健身记",
    tagline: "免费本地健身与宏量营养记录。记录动作（组×次数×重量）、每日热量与蛋白/碳/脂、体重、PR、自定义食物、JSON 备份。无需账号。无广告。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    ogLocale: "zh_CN",
    ogImage: "https://gymac.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "자이맥",
    tagline: "무료 로컬 헬스·매크로 기록. 운동(세트×횟수×중량), 하루 칼로리·P/C/F, 체중, PR, 커스텀 음식, JSON 백업. 계정 없음. 광고 없음.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    ogLocale: "ko_KR",
    ogImage: "https://gymac.try-dabble.com/og-image-ko.png",
  },
];

function esc(s) {
  // HTMLRewriter's setInnerContent escapes "&" as "&amp;" in text nodes.
  return String(s).replace(/&/g, "&amp;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1, tagline (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`class="gm-tagline">${esc(c.tagline)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://gymac\\.try-dabble\\.com/\\?lang=${c.lang}"`));
  });
}

test("zh og:image is its own card, never the English file", async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /property="og:image" content="[^"]*og-image-en\.png"/);
  assert.match(html, /property="og:image" content="https:\/\/gymac\.try-dabble\.com\/og-image-zh\.png"/);
});

test("the feedback widget is appended with data-app=gymac, and nothing else is injected", async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  assert.match(html, /<script src="https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="gymac" defer><\/script>/);
  assert.equal(html.match(/widget\/feedback\.js/g).length, 1);
});

test("Naver Search Advisor verification is in the served head", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751"/);
});

test("no ad script anywhere in the served HTML, in any language", async () => {
  for (const lang of ["", "ko", "en", "ja", "zh"]) {
    const res = await fetch(`${BASE}/${lang ? `?lang=${lang}` : ""}`);
    const html = await res.text();
    assert.doesNotMatch(html, /adsbygoogle|googlesyndication|doubleclick\.net|ca-pub-|AdSlot/i, `ads in ?lang=${lang}`);
  }
});

test("/ads.txt and /app-ads.txt are plain text with the publisher id", async () => {
  for (const p of ["/ads.txt", "/app-ads.txt"]) {
    const res = await fetch(`${BASE}${p}`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /^text\/plain/);
    assert.equal((await res.text()).trim(), "google.com, pub-1343411537040925, DIRECT, f08c47fec0942fa0");
  }
});

test("manifest follows ?lang= and the td_lang cookie", async () => {
  const en = await (await fetch(`${BASE}/manifest.webmanifest?lang=en`)).json();
  assert.equal(en.name, "Gymac");
  assert.equal(en.start_url, "/?lang=en");
  const ja = await (await fetch(`${BASE}/manifest.webmanifest`, { headers: { cookie: "td_lang=ja" } })).json();
  assert.equal(ja.name, "ジャイマック");
  assert.equal(ja.lang, "ja");
});

test("the shell has no login, paywall, trial, subscription pitch or catalog lock", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.doesNotMatch(html, /sign in|log in|premium|paywall|free trial|subscribe now|unlock pro/i);
  assert.match(html, /No account\. No ads\./);
});

test("static PWA files are served", async () => {
  for (const p of ["/sw.js", "/robots.txt", "/sitemap.xml", "/llms.txt", "/privacy.html", "/terms.html", "/og-image-zh.png", "/og-image-ko.png", "/icons/icon-192.png"]) {
    const res = await fetch(`${BASE}${p}`);
    assert.equal(res.status, 200, p);
    // The SPA fallback answers 200 with index.html for anything missing, so
    // check the type too: a PNG must really be a PNG.
    const ct = res.headers.get("content-type") || "";
    if (p.endsWith(".png")) assert.match(ct, /^image\/png/, `${p} content-type ${ct}`);
    else if (!p.endsWith(".html")) assert.doesNotMatch(ct, /text\/html/, `${p} fell through to index.html`);
  }
  const sw = await (await fetch(`${BASE}/sw.js`)).text();
  assert.match(sw, /"gymac-v1"/);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.match(sitemap, new RegExp(`https://gymac\\.try-dabble\\.com/\\?lang=${lang}`));
  }
});
