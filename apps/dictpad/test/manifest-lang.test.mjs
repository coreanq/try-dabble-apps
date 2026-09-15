import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { COPY, localizeManifest } from "../src/og-lang.ts";
import { I18N } from "../src/lib/i18n.ts";

function rx(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const base = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("manifest name / lang / start_url follow the requested language", () => {
  const cases = { en: "Dictpad", ko: "딕트패드", ja: "ディクトパッド", zh: "听写板" };
  for (const [lang, name] of Object.entries(cases)) {
    const m = localizeManifest(base, lang);
    assert.equal(m.name, name);
    assert.equal(m.short_name, name);
    assert.equal(m.lang, lang);
    assert.equal(m.start_url, `/?lang=${lang}`);
    assert.ok(typeof m.description === "string" && m.description.length > 0);
    assert.deepEqual(m.icons, base.icons);
  }
});

test("the Worker's first-HTML copy matches what React renders after mount", () => {
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.equal(COPY[lang].title, I18N[lang].title, `${lang} title`);
    assert.equal(COPY[lang].tagline, I18N[lang].tagline, `${lang} tagline`);
    assert.equal(COPY[lang].localOnly, I18N[lang].localOnly, `${lang} localOnly`);
    assert.equal(COPY[lang].description, I18N[lang].metaDescription, `${lang} description`);
    assert.equal(COPY[lang].image, `https://dictpad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="dp-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#faf7f0" \/>/);
});

test("the exact spec taglines and banners are what ships", () => {
  assert.equal(I18N.en.tagline, "Free local talk-to-text notepad. Tap record for live dictation into editable notes. Voice punctuation, language picker, JSON backup. No account. No subscription.");
  assert.equal(I18N.ko.tagline, "무료 로컬 음성 받아쓰기 메모장. 녹음 버튼으로 실시간 받아쓰기, 구두점 음성 명령, 언어 선택, JSON 백업. 계정 없음. 구독 없음.");
  assert.equal(I18N.ja.tagline, "無料のローカル音声入力メモ帳。録音ボタンでリアルタイム書き取り、句読点の音声コマンド、言語選択、JSONバックアップ。アカウント不要。サブスクなし。");
  assert.equal(I18N.zh.tagline, "免费本地听写记事本。点录音即可实时听写到可编辑笔记。语音标点、语言选择、JSON 备份。无需账号。无订阅。");
  assert.equal(I18N.en.localOnly, "Your notes stay on this device. No login. No ads. No paid subscription. This is an in-browser notepad — not a system keyboard.");
  assert.equal(I18N.ko.localOnly, "노트는 이 기기에만 저장됩니다. 로그인·광고·유료 구독 없음. 시스템 키보드가 아니라 브라우저 메모장입니다.");
  assert.equal(I18N.ja.localOnly, "ノートはこの端末にだけ保存されます。ログイン・広告・有料サブスクなし。システムキーボードではなく、ブラウザのメモ帳です。");
  assert.equal(I18N.zh.localOnly, "笔记仅保存在此设备。无登录、无广告、无付费订阅。这是浏览器记事本，不是系统输入法。");
});

test("the fail-fix chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipNoPaywall", "chipNoAds", "chipLocal", "chipBackup", "chipMicSafe", "chipNotKeyboard", "chipFree", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoPaywall, "No paywall");
  assert.equal(I18N.en.chipNoAds, "No ads on tool");
  assert.equal(I18N.en.chipLocal, "Notes stay on device");
  assert.equal(I18N.en.chipBackup, "JSON backup");
  assert.equal(I18N.en.chipMicSafe, "Mic stop does not break next session");
  assert.equal(I18N.en.chipNotKeyboard, "Not a system keyboard");
  assert.equal(I18N.en.chipFree, "Free forever");
  for (const k of Object.keys(I18N.en)) {
    if (k === "chipLangs") continue;
    assert.notEqual(I18N.zh[k], I18N.en[k], `zh.${k} is English`);
    assert.notEqual(I18N.ja[k], I18N.en[k], `ja.${k} is English`);
    assert.notEqual(I18N.ko[k], I18N.en[k], `ko.${k} is English`);
  }
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of Object.keys(I18N.en)) assert.ok(typeof I18N[lang][k] === "string" && I18N[lang][k].length > 0, `${lang}.${k}`);
  }
});
