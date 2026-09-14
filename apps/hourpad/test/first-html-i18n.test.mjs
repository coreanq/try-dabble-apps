import assert from "node:assert/strict";
import test from "node:test";

/**
 * Runs against a served build (wrangler dev / preview or production). Set
 * HOURPAD_URL to point elsewhere; when nothing answers, every test here is
 * skipped so `npm test` stays a pure unit run.
 */
const BASE = process.env.HOURPAD_URL || "http://127.0.0.1:8788";

let reachable = false;
try {
  const probe = await fetch(`${BASE}/ads.txt`, { signal: AbortSignal.timeout(2500) });
  reachable = probe.ok;
} catch {
  reachable = false;
}
const skip = reachable ? false : `no server at ${BASE} (set HOURPAD_URL)`;

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Hourpad",
    tagline: "Free local work-hours tracker. Check in, take breaks, check out. Daily and weekly totals vs your target. Overtime bank rolls into next week. JSON backup. No account. No ads.",
    localOnly: "Your data stays on this device. No login. No ads. Breaks and the overtime bank are free.",
    ogLocale: "en_US",
    ogImage: "https://hourpad.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "アワーパッド",
    tagline: "無料のローカル勤務時間トラッカー。出勤・休憩・退勤。日・週合計と目標時間。残業バンクは翌週へ繰り越し。JSONバックアップ。アカウント不要。広告なし。",
    localOnly: "データはこの端末にだけ保存されます。ログイン・広告なし。休憩と残業バンクは無料です。",
    ogLocale: "ja_JP",
    ogImage: "https://hourpad.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "工时板",
    tagline: "免费本地工时记录。上班、休息、下班。日/周合计与目标工时。加班库滚入下周。JSON 备份。无需账号。无广告。",
    localOnly: "数据仅保存在此设备。无登录、无广告。休息与加班库免费。",
    ogLocale: "zh_CN",
    ogImage: "https://hourpad.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "아워패드",
    tagline: "무료 로컬 근무 시간 기록. 출근·휴식·퇴근. 일·주 합계와 목표 시간. 초과 근무 뱅크가 다음 주로 넘어갑니다. JSON 백업. 계정 없음. 광고 없음.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 휴식과 초과 근무 뱅크는 무료입니다.",
    ogLocale: "ko_KR",
    ogImage: "https://hourpad.try-dabble.com/og-image-ko.png",
  },
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1, tagline (no JS)`, { skip }, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`class="hp-tagline">${esc(c.tagline)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://hourpad\\.try-dabble\\.com/\\?lang=${c.lang}"`));
  });
}

test("zh og:image is its own card, never the English file", { skip }, async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /property="og:image" content="[^"]*og-image-en\.png"/);
  assert.match(html, /property="og:image" content="https:\/\/hourpad\.try-dabble\.com\/og-image-zh\.png"/);
});

test("the feedback widget is appended with data-app=hourpad, and nothing else is injected", { skip }, async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  assert.match(html, /<script src="https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="hourpad" defer><\/script>/);
  assert.equal(html.match(/widget\/feedback\.js/g).length, 1);
});

test("Naver Search Advisor verification is in the served head", { skip }, async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751"/);
});

test("no ad script anywhere in the served HTML, in any language", { skip }, async () => {
  for (const lang of ["", "ko", "en", "ja", "zh"]) {
    const res = await fetch(`${BASE}/${lang ? `?lang=${lang}` : ""}`);
    const html = await res.text();
    assert.doesNotMatch(html, /adsbygoogle|googlesyndication|doubleclick\.net|ca-pub-|AdSlot/i, `ads in ?lang=${lang}`);
  }
});

test("/ads.txt and /app-ads.txt are plain text with the publisher id", { skip }, async () => {
  for (const p of ["/ads.txt", "/app-ads.txt"]) {
    const res = await fetch(`${BASE}${p}`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /^text\/plain/);
    assert.equal((await res.text()).trim(), "google.com, pub-1343411537040925, DIRECT, f08c47fec0942fa0");
  }
});

test("manifest follows ?lang= and the td_lang cookie", { skip }, async () => {
  const en = await (await fetch(`${BASE}/manifest.webmanifest?lang=en`)).json();
  assert.equal(en.name, "Hourpad");
  assert.equal(en.start_url, "/?lang=en");
  const ja = await (await fetch(`${BASE}/manifest.webmanifest`, { headers: { cookie: "td_lang=ja" } })).json();
  assert.equal(ja.name, "アワーパッド");
  assert.equal(ja.lang, "ja");
});

test("the shell has no login, paywall, IAP, team wall, Pomodoro or HIIT", { skip }, async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.doesNotMatch(html, /sign in|log in|premium plan|paywall|free trial|subscribe now|unlock pro|in-app purchase|pomodoro|hiit|tabata/i);
  assert.match(html, /No account\. No ads\./);
  assert.match(html, /overtime bank are free/);
});

test("static PWA files are served", { skip }, async () => {
  for (const p of ["/sw.js", "/robots.txt", "/sitemap.xml", "/llms.txt", "/privacy.html", "/terms.html", "/og-image-zh.png", "/og-image-ko.png", "/icons/icon-192.png"]) {
    const res = await fetch(`${BASE}${p}`);
    assert.equal(res.status, 200, p);
    const ct = res.headers.get("content-type") || "";
    if (p.endsWith(".png")) assert.match(ct, /^image\/png/, `${p} content-type ${ct}`);
    else if (!p.endsWith(".html")) assert.doesNotMatch(ct, /text\/html/, `${p} fell through to index.html`);
  }
  const sw = await (await fetch(`${BASE}/sw.js`)).text();
  assert.match(sw, /"hourpad-v1"/);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.match(sitemap, new RegExp(`https://hourpad\\.try-dabble\\.com/\\?lang=${lang}`));
  }
});
