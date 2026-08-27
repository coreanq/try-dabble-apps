import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.BOX_QR_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Box QR",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    ogLocale: "en_US",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "箱QR",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    ogLocale: "ja_JP",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "箱子QR",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    ogLocale: "zh_CN",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "상자QR",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    ogLocale: "ko_KR",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1, application-name (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(
      first,
      new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`)
    );
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(
      html,
      new RegExp(`<meta name="application-name" content="${esc(c.title)}"`)
    );
    assert.match(
      html,
      new RegExp(`property="og:title" content="${esc(c.title)}"`)
    );
    assert.match(
      html,
      new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`)
    );
  });
}
