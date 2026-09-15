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
  const cases = { en: "Listenpad", ko: "리슨패드", ja: "リッスンパッド", zh: "听力练习板" };
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
    assert.equal(COPY[lang].image, `https://listenpad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="lnp-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#0f172a" \/>/);
  assert.doesNotMatch(html, /adsbygoogle|ca-pub-|googlesyndication/i);
});

test("the exact spec taglines and banners are what ships", () => {
  assert.equal(I18N.en.tagline, "Free local language-listening player. One-tap short rewind, A–B loop, speed control. Pick a file on this device. No account. No subscription.");
  assert.equal(I18N.ko.tagline, "무료 로컬 언어 듣기 플레이어. 한 탭 짧은 되감기, A–B 구간 반복, 배속. 이 기기에서 파일 선택. 계정 없음. 구독 없음.");
  assert.equal(I18N.ja.tagline, "無料のローカル語学リスニングプレーヤー。ワンタップ短戻し、A–Bループ、速度調整。この端末でファイルを選ぶだけ。アカウント不要。サブスクなし。");
  assert.equal(I18N.zh.tagline, "免费本地听力练习播放器。一键短回退、A–B 循环、变速。在本机选择文件。无需账号。无订阅。");
  assert.equal(I18N.en.localOnly, "Audio and notes stay on this device. No upload. No login. No ads. Rewind, A–B loop, and speed are free.");
  assert.equal(I18N.ko.localOnly, "오디오와 메모는 이 기기에만 둡니다. 업로드·로그인·광고 없음. 되감기·구간반복·배속 모두 무료.");
  assert.equal(I18N.ja.localOnly, "音声とメモはこの端末にだけ残ります。アップロード・ログイン・広告なし。戻し・A–Bループ・速度はすべて無料。");
  assert.equal(I18N.zh.localOnly, "音频和笔记仅留在此设备。无上传、无登录、无广告。回退、A–B 循环和变速全部免费。");
});

test("the fail-fix chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipNoLogin", "chipNoUpload", "chipFreeLoop", "chipPhone", "chipShort", "chipSaved", "chipNoAds", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoLogin, "No login");
  assert.equal(I18N.en.chipNoUpload, "No cloud upload");
  assert.equal(I18N.en.chipFreeLoop, "Rewind & loop free");
  assert.equal(I18N.en.chipPhone, "Phone-sized buttons");
  assert.equal(I18N.en.chipShort, "Short 1–4s rewind");
  assert.equal(I18N.en.chipSaved, "Settings saved here");
  assert.equal(I18N.en.chipNoAds, "No ads");
  assert.equal(I18N.en.iosNote, "On iPhone you may need to pick the file again after reload.");
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
