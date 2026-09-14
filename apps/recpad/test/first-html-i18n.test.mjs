import assert from "node:assert/strict";
import test from "node:test";

/**
 * Runs against a served build (wrangler dev / preview or production). Set
 * RECPAD_URL to point elsewhere; when nothing answers, every test here is
 * skipped so `npm test` stays a pure unit run.
 */
const BASE = process.env.RECPAD_URL || "http://127.0.0.1:8788";

let reachable = false;
try {
  const probe = await fetch(`${BASE}/ads.txt`, { signal: AbortSignal.timeout(2500) });
  reachable = probe.ok;
} catch {
  reachable = false;
}
const skip = reachable ? false : `no server at ${BASE} (set RECPAD_URL)`;

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Recpad",
    tagline: "Free local practice recorder. Mic record, noise clean, trim, gain, export WAV or MP3. Drafts stay on this device. No account. No upload.",
    localOnly: "Your recordings stay on this device. Noise clean and export run here — nothing is sent to our servers. No subscription. No ads.",
    ogLocale: "en_US",
    ogImage: "https://recpad.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "レックパッド",
    tagline: "無料のローカル練習レコーダー。マイク録音、ノイズ除去、トリム、ゲイン、WAV/MP3書き出し。下書きはこの端末だけ。アカウント不要。アップロードなし。",
    localOnly: "録音と処理はこの端末だけで、サーバーには送りません。サブスク・広告なし。",
    ogLocale: "ja_JP",
    ogImage: "https://recpad.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "录音板",
    tagline: "免费本地练习录音。麦克风录制、降噪、裁剪、增益，导出 WAV 或 MP3。草稿只留在本机。无需账号。不上传。",
    localOnly: "录音与处理仅在此设备完成，不会上传到服务器。无订阅、无广告。",
    ogLocale: "zh_CN",
    ogImage: "https://recpad.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "렉패드",
    tagline: "무료 로컬 연습 녹음. 마이크 녹음, 노이즈 정리, 자르기, 게인, WAV·MP3 내보내기. 초안은 이 기기에만. 계정 없음. 업로드 없음.",
    localOnly: "이 앱의 녹음과 처리는 이 기기에서만 이루어지며 서버로 보내지 않습니다. 구독·광고 없음.",
    ogLocale: "ko_KR",
    ogImage: "https://recpad.try-dabble.com/og-image-ko.png",
  },
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
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
    assert.match(first, new RegExp(`class="rp-tagline">${esc(c.tagline)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://recpad\\.try-dabble\\.com/\\?lang=${c.lang}"`));
  });
}

test("zh og:image is its own card, never the English file", { skip }, async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /property="og:image" content="[^"]*og-image-en\.png"/);
  assert.match(html, /property="og:image" content="https:\/\/recpad\.try-dabble\.com\/og-image-zh\.png"/);
});

test("the feedback widget is appended with data-app=recpad, and nothing else is injected", { skip }, async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  assert.match(html, /<script src="https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="recpad" defer><\/script>/);
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
  assert.equal(en.name, "Recpad");
  assert.equal(en.start_url, "/?lang=en");
  const ja = await (await fetch(`${BASE}/manifest.webmanifest`, { headers: { cookie: "td_lang=ja" } })).json();
  assert.equal(ja.name, "レックパッド");
  assert.equal(ja.lang, "ja");
});

test("the shell has no login, paywall, trial, subscription pitch or price", { skip }, async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.doesNotMatch(html, /sign in|log in|premium|paywall|free trial|subscribe now|unlock pro|\$\d/i);
  assert.match(html, /No account\. No upload\./);
  assert.match(html, /Noise clean and export run here/);
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
  assert.match(sw, /"recpad-v1"/);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.match(sitemap, new RegExp(`https://recpad\\.try-dabble\\.com/\\?lang=${lang}`));
  }
});
