import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.GIFT_STASH_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Gift Stash",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    ogLocale: "en_US",
    ogImage: "https://gift-stash.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "プレゼント引き出し",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    ogLocale: "ja_JP",
    ogImage: "https://gift-stash.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "礼物抽屉",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    ogLocale: "zh_CN",
    ogImage: "https://gift-stash.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "선물 서랍",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    ogLocale: "ko_KR",
    ogImage: "https://gift-stash.try-dabble.com/og-image.png",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The assertions that matter run against HTML with every <script> removed:
 *  a crawler that never executes JS must already see the right language. */
function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} carries lang, title, banner, h1 and share tags (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(first, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(first, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(
      first,
      new RegExp(`<meta name="apple-mobile-web-app-title" content="${esc(c.title)}"`),
    );
    assert.match(first, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(first, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(first, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(first, new RegExp(`name="twitter:title" content="${esc(c.title)}"`));
    assert.match(first, new RegExp(`name="twitter:image" content="${esc(c.ogImage)}"`));
    assert.match(
      first,
      new RegExp(
        `rel="canonical" href="${esc(`https://gift-stash.try-dabble.com/?lang=${c.lang}`)}"`,
      ),
    );
  });
}

test("the shared 의견 feedback widget is appended for gift-stash", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.match(html, /https:\/\/try-dabble\.com\/widget\/feedback\.js/);
  assert.match(html, /data-app="gift-stash"/);
});

test("SPA fallback serves the app shell for an unknown path", async () => {
  const res = await fetch(`${BASE}/does-not-exist`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<div id="root">/);
});
