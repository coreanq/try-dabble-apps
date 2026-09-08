import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.LOCALPLAY_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Localplay",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    tagline: "Pick local MP3s into a library. Playlists, shuffle, repeat. No login, no subscription, no ads.",
    ogLocale: "en_US",
    ogImage: "https://localplay.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "ローカルプレイ",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    tagline: "端末のMP3を選んでライブラリに。プレイリスト・シャッフル・リピート。ログインも課金も広告もなし。",
    ogLocale: "ja_JP",
    ogImage: "https://localplay.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "本地播放",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    tagline: "把手机里的 MP3 选进曲库。播放列表、随机、循环。无需登录，无订阅，无广告。",
    ogLocale: "zh_CN",
    ogImage: "https://localplay.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "로컬플레이",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    tagline: "내 MP3를 골라 라이브러리로. 재생목록·셔플·반복. 로그인·구독·광고 없음.",
    ogLocale: "ko_KR",
    ogImage: "https://localplay.try-dabble.com/og-image-ko.png",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1, tagline, application-name (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`class="lp-tagline">${esc(c.tagline)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
  });
}

test("zh og:image is its own card, never the English file", async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /property="og:image" content="[^"]*og-image-en\.png"/);
  assert.match(html, /property="og:image" content="https:\/\/localplay\.try-dabble\.com\/og-image-zh\.png"/);
});

test("the feedback widget is appended with data-app=localplay", async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  assert.match(html, /widget\/feedback\.js" data-app="localplay" defer/);
});

test("the tool UI is ad-free: no AdSense, no ca-pub, no ad slots in any language", async () => {
  for (const lang of ["ko", "en", "ja", "zh"]) {
    const html = await (await fetch(`${BASE}/?lang=${lang}`)).text();
    assert.doesNotMatch(html, /adsbygoogle/);
    assert.doesNotMatch(html, /ca-pub-/);
    assert.doesNotMatch(html, /googlesyndication/);
    assert.doesNotMatch(html, /doubleclick/);
  }
});

test("/ads.txt and /app-ads.txt are plain text with the try-dabble publisher id", async () => {
  for (const path of ["/ads.txt", "/app-ads.txt"]) {
    const res = await fetch(`${BASE}${path}`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /^text\/plain/);
    assert.match(await res.text(), /google\.com, pub-1343411537040925, DIRECT, f08c47fec0942fa0/);
  }
});

test("the shared feedback widget is not vendored into the bundle", async () => {
  const html = await (await fetch(`${BASE}/`)).text();
  const srcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  for (const src of srcs) {
    if (src.startsWith("https://try-dabble.com/widget/")) continue;
    const res = await fetch(new URL(src, BASE));
    const js = await res.text();
    assert.doesNotMatch(js, /try-dabble-feedback|data-app="localplay"/);
  }
});
