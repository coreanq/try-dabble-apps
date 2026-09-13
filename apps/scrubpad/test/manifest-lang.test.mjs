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
  const cases = { en: "Scrubpad", ko: "스크럽패드", ja: "スクラブパッド", zh: "脱敏板" };
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
    assert.equal(COPY[lang].image, `https://scrubpad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the local-only banner promises on-device processing in every language", () => {
  assert.match(COPY.en.localOnly, /stays on this device/);
  assert.match(COPY.en.localOnly, /Scrubbing runs on this device/);
  assert.match(COPY.ko.localOnly, /이 기기에만 저장/);
  assert.match(COPY.ko.localOnly, /이 기기에서만 이루어지며/);
  assert.match(COPY.ja.localOnly, /この端末にだけ保存/);
  assert.match(COPY.ja.localOnly, /この端末だけで/);
  assert.match(COPY.zh.localOnly, /仅保存在此设备/);
  assert.match(COPY.zh.localOnly, /在此设备完成/);
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="sp-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#f4efe4" \/>/);
  assert.doesNotMatch(html, /timerpad|타이머|HIIT|Pomodoro|tp-/i);
});

test("the fail-fix chips exist in every language", () => {
  const keys = ["chipNoSub", "chipPasteFirst", "chipOnDevice", "chipNoUpload", "chipNoAds", "chipNoAccount", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
    assert.match(I18N[lang].chipNoSub, /9\.99/, `${lang} names the $9.99/mo wall it does not have`);
  }
  assert.equal(I18N.en.chipNoSub, "No $9.99/mo");
  assert.equal(I18N.en.chipPasteFirst, "Large paste up front");
  assert.equal(I18N.en.chipOnDevice, "On-device only");
  assert.equal(I18N.en.chipNoUpload, "No upload");
  assert.equal(I18N.en.chipNoAds, "No ads");
  assert.equal(I18N.en.chipNoAccount, "No account");
});

test("every UI string exists in every language and zh never falls back to English", () => {
  const keys = Object.keys(I18N.en);
  const shared = new Set(["chipLangs", "typeIP", "occurrences"]);
  for (const lang of ["ko", "ja", "zh"]) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), [...keys].sort(), `${lang} keys`);
    for (const k of keys) {
      assert.ok(I18N[lang][k].length > 0, `${lang}.${k} empty`);
      if (shared.has(k)) continue;
      assert.notEqual(I18N[lang][k], I18N.en[k], `${lang}.${k} is still English`);
    }
  }
});
