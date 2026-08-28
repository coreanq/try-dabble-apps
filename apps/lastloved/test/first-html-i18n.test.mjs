import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.LASTLOVED_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "Lastloved",
    tagline: "Title and artist. It comes back in N years.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    chip: "No song-count lock",
    ogLocale: "en_US",
    ogImage: "https://lastloved.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "あの頃の曲",
    tagline: "タイトルと歌手だけ。N年後にまた会える。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    chip: "曲数の制限なし",
    ogLocale: "ja_JP",
    ogImage: "https://lastloved.try-dabble.com/og-image-ja.png",
  },
  {
    // zh must never fall back to the English card.
    lang: "zh",
    htmlLang: "zh",
    title: "当年那首歌",
    tagline: "只要歌名和歌手。N 年后它会回来。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    chip: "不限歌曲数量",
    ogLocale: "zh_CN",
    ogImage: "https://lastloved.try-dabble.com/og-image-zh.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "그때그곡",
    tagline: "제목과 가수만. N년 뒤에 다시 만난다.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    chip: "곡 수 잠금 없음",
    ogLocale: "ko_KR",
    ogImage: "https://lastloved.try-dabble.com/og-image.png",
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
    assert.match(first, new RegExp(`class="ll-tagline">${esc(c.tagline)}</p>`));
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
      new RegExp(`rel="canonical" href="https://lastloved\\.try-dabble\\.com/\\?lang=${c.lang}"`),
    );
  });
}

test("the feedback widget is appended for every language", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.match(html, /https:\/\/try-dabble\.com\/widget\/feedback\.js/);
  assert.match(html, /data-app="lastloved"/);
});

test("zh never points at the English card", async () => {
  const res = await fetch(`${BASE}/?lang=zh`);
  const html = await res.text();
  assert.doesNotMatch(html, /og-image-en\.png/);
});
