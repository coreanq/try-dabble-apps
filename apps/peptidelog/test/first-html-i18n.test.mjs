import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.PEPTIDELOG_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Peptidelog",
    tagline: "Free local peptide & injection tracker. Compounds, reconstitution calc, dose log, vial inventory, schedules, site rotation, JSON backup. No account. Not medical advice.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers. Not medical advice.",
    notMedical: "Not medical advice. The calculator does arithmetic only. Discuss dosing with a qualified clinician.",
    ogLocale: "en_US",
    ogImage: "https://peptidelog.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "ペプチドログ",
    tagline: "無料のローカルペプチド・注射記録。化合物、再構成計算、用量ログ、バイアル在庫、スケジュール、部位ローテーション、JSONバックアップ。アカウント不要。医療助言ではありません。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。医療助言ではありません。",
    notMedical: "医療助言ではありません。計算機は算術のみです。用量・用法は医療専門家に相談してください。",
    ogLocale: "ja_JP",
    ogImage: "https://peptidelog.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "肽记录",
    tagline: "免费本地肽类与注射记录。化合物、复溶计算、剂量日志、药瓶库存、日程、部位轮换、JSON 备份。无需账号。非医疗建议。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。非医疗建议。",
    notMedical: "非医疗建议。计算器仅做算术。剂量与用法请咨询合格医护人员。",
    ogLocale: "zh_CN",
    ogImage: "https://peptidelog.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "펩타이드로그",
    tagline: "무료 로컬 펩타이드·주사 기록. 화합물, 재구성 계산, 용량 로그, 바이알 재고, 스케줄, 부위 로테이션, JSON 백업. 계정 없음. 의료 조언 아님.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. 의료 조언이 아닙니다.",
    notMedical: "의료 조언이 아닙니다. 계산기는 산술만 제공합니다. 용량·용법은 의료 전문가와 상의하세요.",
    ogLocale: "ko_KR",
    ogImage: "https://peptidelog.try-dabble.com/og-image-ko.png",
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
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, disclaimer, h1, tagline (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`class="pl-tagline">${esc(c.tagline)}</p>`));
    assert.match(first, new RegExp(`id="not-medical"[^>]*>${esc(c.notMedical)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://peptidelog\\.try-dabble\\.com/\\?lang=${c.lang}"`));
  });
}

test("zh og:image is its own card, never the English file", async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /property="og:image" content="[^"]*og-image-en\.png"/);
  assert.match(html, /property="og:image" content="https:\/\/peptidelog\.try-dabble\.com\/og-image-zh\.png"/);
});

test("the feedback widget is appended with data-app=peptidelog, and nothing else is injected", async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  assert.match(html, /<script src="https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="peptidelog" defer><\/script>/);
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
  assert.equal(en.name, "Peptidelog");
  assert.equal(en.start_url, "/?lang=en");
  const ja = await (await fetch(`${BASE}/manifest.webmanifest`, { headers: { cookie: "td_lang=ja" } })).json();
  assert.equal(ja.name, "ペプチドログ");
  assert.equal(ja.lang, "ja");
});

test("the shell has no login, paywall, trial, subscription pitch or AI dosing", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.doesNotMatch(html, /sign in|log in|premium|paywall|free trial|subscribe now/i);
  assert.doesNotMatch(html, /AI dos|dosing assistant|recommended dose/i);
  assert.match(html, /Not medical advice/);
});

test("static PWA files are served", async () => {
  for (const p of ["/sw.js", "/robots.txt", "/sitemap.xml", "/llms.txt", "/privacy.html", "/terms.html", "/og-image-zh.png", "/icons/icon-192.png"]) {
    const res = await fetch(`${BASE}${p}`);
    assert.equal(res.status, 200, p);
  }
  const sw = await (await fetch(`${BASE}/sw.js`)).text();
  assert.match(sw, /"peptidelog-v1"/);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.match(sitemap, new RegExp(`https://peptidelog\\.try-dabble\\.com/\\?lang=${lang}`));
  }
});
