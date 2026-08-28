import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.TRASHPAD_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Trashpad",
    tagline: "Type it. It stays. Then it disappears.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    ogLocale: "en_US",
    ogImage: "https://trashpad.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "消えるメモ",
    tagline: "書けば残る。時間が来たら消える。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    ogLocale: "ja_JP",
    ogImage: "https://trashpad.try-dabble.com/og-image-ja.png",
  },
  {
    // zh must never fall back to the English card.
    lang: "zh",
    htmlLang: "zh",
    title: "废纸便签",
    tagline: "写下来会留下，时间到了就消失。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    ogLocale: "zh_CN",
    ogImage: "https://trashpad.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "휴지패드",
    tagline: "적으면 남고, 시간이 지나면 지워집니다",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    ogLocale: "ko_KR",
    ogImage: "https://trashpad.try-dabble.com/og-image.png",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1, og image (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`class="tp-tagline">${esc(c.tagline)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(
      html,
      new RegExp(`<meta name="apple-mobile-web-app-title" content="${esc(c.title)}"`),
    );
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`name="twitter:image" content="${esc(c.ogImage)}"`));
    assert.match(
      html,
      new RegExp(`rel="canonical" href="https://trashpad\\.try-dabble\\.com/\\?lang=${c.lang}"`),
    );
  });
}

test("the feedback widget is appended for every language", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.match(html, /https:\/\/try-dabble\.com\/widget\/feedback\.js/);
  assert.match(html, /data-app="trashpad"/);
});

test("zh never points at the English card", async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /og-image-en\.png/);
});
