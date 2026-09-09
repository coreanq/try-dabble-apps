import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { COPY, localizeManifest } from "../src/og-lang.ts";
import { I18N } from "../src/lib/i18n.ts";

const base = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("manifest name / lang / start_url follow the requested language", () => {
  const cases = { en: "Weekpad", ko: "위크패드", ja: "ウィークパッド", zh: "周预算板" };
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
    assert.equal(COPY[lang].image, `https://weekpad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${COPY.ko.title}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${COPY.ko.localOnly}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${COPY.ko.title}</h1>`));
  assert.match(html, new RegExp(`class="wp-tagline">${COPY.ko.tagline}</p>`));
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
});

test("the fail-fix chips exist in every language", () => {
  const keys = ["chipNoAds", "chipNoIap", "chipBackup", "chipNoLogin", "chipFree", "chipLocal", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoAds, "No opening ads");
  assert.equal(I18N.en.chipNoIap, "No weekly IAP");
  assert.equal(I18N.en.chipBackup, "JSON backup (survives reinstall)");
  assert.equal(I18N.en.chipNoLogin, "No login");
  assert.equal(I18N.en.chipFree, "Free");
  assert.equal(I18N.en.chipLocal, "Data this device only");
  assert.equal(I18N.ko.chipNoAds, "여는 광고 없음");
});

test("every UI string exists in every language and zh never falls back to English", () => {
  const keys = Object.keys(I18N.en);
  for (const lang of ["ko", "ja", "zh"]) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), [...keys].sort(), `${lang} keys`);
    for (const k of keys) {
      assert.ok(I18N[lang][k].length > 0, `${lang}.${k} empty`);
      if (k === "chipLangs" || k.startsWith("font") || k === "amountPlaceholder") continue;
      assert.notEqual(I18N[lang][k], I18N.en[k], `${lang}.${k} is still English`);
    }
  }
});
