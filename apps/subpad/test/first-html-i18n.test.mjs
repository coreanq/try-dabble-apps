import assert from "node:assert/strict";
import test from "node:test";

/**
 * Runs against a served build (wrangler dev / preview or production). Set
 * SUBPAD_URL to point elsewhere; when nothing answers, every test here is
 * skipped so `npm test` stays a pure unit run.
 */
const BASE = process.env.SUBPAD_URL || "http://127.0.0.1:8788";

let reachable = false;
try {
  const probe = await fetch(`${BASE}/ads.txt`, { signal: AbortSignal.timeout(2500) });
  reachable = probe.ok;
} catch {
  reachable = false;
}
const skip = reachable ? false : `no server at ${BASE} (set SUBPAD_URL)`;

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Subpad",
    tagline: "Free local subscription tracker. Price, next renewal, monthly and yearly totals, templates, payment history, JSON backup, calendar export. No bank link. No account. No ads.",
    localOnly: "Your data stays on this device. No bank link. No login. No ads. We do not invent exchange rates.",
    ogLocale: "en_US",
    ogImage: "https://subpad.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "サブパッド",
    tagline: "無料のローカルサブスク・請求トラッカー。料金と次回更新、月・年合計、テンプレ、支払い履歴、JSONバックアップ、カレンダー出力。銀行連携なし。アカウント不要。広告なし。",
    localOnly: "データはこの端末にだけ保存されます。銀行連携・ログイン・広告なし。為替レートは作りません。",
    ogLocale: "ja_JP",
    ogImage: "https://subpad.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "续费板",
    tagline: "免费本地订阅/账单记录。价格与下次续费、月/年合计、模板、付款记录、JSON 备份、日历导出。无银行连接。无需账号。无广告。",
    localOnly: "数据仅保存在此设备。无银行连接、无登录、无广告。我们不编造汇率。",
    ogLocale: "zh_CN",
    ogImage: "https://subpad.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "섭패드",
    tagline: "무료 로컬 구독·청구 기록. 가격과 다음 갱신일, 월·연 합계, 템플릿, 결제 기록, JSON 백업, 달력보내기. 은행 연동 없음. 계정 없음. 광고 없음.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 은행 연동·로그인·광고 없음. 환율을 지어내지 않습니다.",
    ogLocale: "ko_KR",
    ogImage: "https://subpad.try-dabble.com/og-image-ko.png",
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
    assert.match(first, new RegExp(`class="sb-tagline">${esc(c.tagline)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://subpad\\.try-dabble\\.com/\\?lang=${c.lang}"`));
  });
}

test("zh og:image is its own card, never the English file", { skip }, async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /property="og:image" content="[^"]*og-image-en\.png"/);
  assert.match(html, /property="og:image" content="https:\/\/subpad\.try-dabble\.com\/og-image-zh\.png"/);
});

test("the feedback widget is appended with data-app=subpad, and nothing else is injected", { skip }, async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  assert.match(html, /<script src="https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="subpad" defer><\/script>/);
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
  assert.equal(en.name, "Subpad");
  assert.equal(en.start_url, "/?lang=en");
  const ja = await (await fetch(`${BASE}/manifest.webmanifest`, { headers: { cookie: "td_lang=ja" } })).json();
  assert.equal(ja.name, "サブパッド");
  assert.equal(ja.lang, "ja");
});

test("the shell has no login, paywall, bank link, Plaid or catalog lock", { skip }, async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.doesNotMatch(html, /sign in|log in|premium plan|paywall|free trial|subscribe now|unlock pro|plaid|connect your bank|open banking/i);
  assert.match(html, /No account\. No ads\./);
  assert.match(html, /No bank link/);
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
  assert.match(sw, /"subpad-v1"/);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.match(sitemap, new RegExp(`https://subpad\\.try-dabble\\.com/\\?lang=${lang}`));
  }
});
