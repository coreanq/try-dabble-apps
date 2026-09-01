import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.SCANPRICE_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Scanprice",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    ogLocale: "en_US",
    ogImage: "https://scanprice.try-dabble.com/og-image-en.png",
    chip: "Camera barcode scan",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "スキャン価格",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    ogLocale: "ja_JP",
    ogImage: "https://scanprice.try-dabble.com/og-image-ja.png",
    chip: "カメラでバーコード読み取り",
  },
  {
    lang: "zh",
    htmlLang: "zh",
    title: "扫码记价",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    ogLocale: "zh_CN",
    ogImage: "https://scanprice.try-dabble.com/og-image-zh.png",
    chip: "摄像头扫条码",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "스캔가격",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    ogLocale: "ko_KR",
    ogImage: "https://scanprice.try-dabble.com/og-image-ko.png",
    chip: "카메라 바코드 스캔",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1, chips (no JS)`, async () => {
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
    assert.match(first, new RegExp(`id="chip-scan">${esc(c.chip)}</li>`));
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
    assert.match(
      html,
      new RegExp(`property="og:image" content="${esc(c.ogImage)}"`)
    );
  });
}

test("the shared feedback widget is appended for scanprice", async () => {
  const res = await fetch(`${BASE}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(
    html,
    /<script src="https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="scanprice" defer><\/script>/
  );
});
