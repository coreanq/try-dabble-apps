import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.STORELOG_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Storelog",
    tagline: "Store name, store number, notes. A–Z. On this device only.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    chip: "No 100-store lock",
    ogLocale: "en_US",
    ogImage: "https://storelog.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "店舗帳",
    tagline: "店名、店舗番号、メモ。あいうえお順。この端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    chip: "100件の上限なし",
    ogLocale: "ja_JP",
    ogImage: "https://storelog.try-dabble.com/og-image-ja.png",
  },
  {
    // zh must never fall back to the English card.
    lang: "zh",
    htmlLang: "zh",
    title: "店录",
    tagline: "店名、门店号、备注。按字母排序。仅此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    chip: "不限门店数量",
    ogLocale: "zh_CN",
    ogImage: "https://storelog.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "가게록",
    tagline: "가게 이름, 매장 번호, 메모. 가나다순. 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    chip: "100건 잠금 없음",
    ogLocale: "ko_KR",
    ogImage: "https://storelog.try-dabble.com/og-image.png",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1, chips, og image (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`class="sl-tagline">${esc(c.tagline)}</p>`));
    // The fail-fix has to be in the first HTML, not only after React mounts.
    assert.match(first, new RegExp(`id="chip-nolock"[^>]*>${esc(c.chip)}</li>`));
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
      new RegExp(`rel="canonical" href="https://storelog\\.try-dabble\\.com/\\?lang=${c.lang}"`),
    );
  });
}

test("the feedback widget is appended for every language", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.match(html, /https:\/\/try-dabble\.com\/widget\/feedback\.js/);
  assert.match(html, /data-app="storelog"/);
});

test("zh never points at the English card", async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /og-image-en\.png/);
});
