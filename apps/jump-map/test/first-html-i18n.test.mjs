import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.JUMP_MAP_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Block Jumper",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    portraitHint: "Please rotate your device (landscape recommended)",
    noscriptJs: "This game needs JavaScript. Please enable JavaScript in your browser.",
    ogLocale: "en_US",
    ogImage: "https://jump-map.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "ブロックジャンパー",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    portraitHint: "画面を横にしてください（横向き推奨）",
    noscriptJs: "このゲームにはJavaScriptが必要です。ブラウザでJavaScriptを有効にしてください。",
    ogLocale: "ja_JP",
    ogImage: "https://jump-map.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "方块跳跃者",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    portraitHint: "请旋转设备（建议横屏）",
    noscriptJs: "此游戏需要启用 JavaScript。请在浏览器中开启 JavaScript。",
    ogLocale: "zh_CN",
    ogImage: "https://jump-map.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "블록점퍼",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    portraitHint: "회전시켜주세요 (가로 모드 권장)",
    noscriptJs: "이 게임은 자바스크립트가 필요합니다. 브라우저의 자바스크립트를 활성화해 주세요.",
    ogLocale: "ko_KR",
    ogImage: "https://jump-map.try-dabble.com/og-image.png",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} is localised before any JS runs`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`id="portrait-hint-text">${esc(c.portraitHint)}</span>`));
    assert.match(first, new RegExp(`id="noscript-js">${esc(c.noscriptJs)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`name="apple-mobile-web-app-title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`name="twitter:image" content="${esc(c.ogImage)}"`));
    assert.match(
      html,
      new RegExp(`rel="canonical" href="${esc(`https://jump-map.try-dabble.com/?lang=${c.lang}`)}"`),
    );
  });

  test(`?lang=${c.lang} carries the 의견 widget`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    const html = await res.text();
    assert.match(html, /widget\/feedback\.js" data-app="jump-map"/);
  });
}

test("no ?lang= leaves the Korean shell alone, widget still attached", async () => {
  const res = await fetch(BASE);
  const html = await res.text();
  assert.match(html, /<html lang="ko"/);
  assert.match(html, /<title>블록점퍼<\/title>/);
  assert.match(html, /widget\/feedback\.js" data-app="jump-map"/);
});

test("the td_lang cookie localises the first HTML too", async () => {
  const res = await fetch(BASE, { headers: { cookie: "td_lang=en" } });
  const html = await res.text();
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<title>Block Jumper<\/title>/);
});

test("the playable engine bundle is still served, with the save key intact", async () => {
  const res = await fetch(`${BASE}/assets/index-DCoPmObG.js`);
  assert.equal(res.status, 200);
  const js = await res.text();
  assert.match(js, /blockJumper:records/);
  assert.match(js, /jm_lang/);
  assert.match(js, /getElementById\(`game-canvas`\)/);
  assert.match(js, /querySelectorAll\(`\[data-key\]`\)/);
});

test("SPA fallback keeps deep links on the app", async () => {
  const res = await fetch(`${BASE}/anything`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /id="root"/);
});
