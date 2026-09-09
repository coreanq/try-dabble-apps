import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { COPY, localizeManifest } from "../src/og-lang.ts";
import { I18N } from "../src/lib/i18n.ts";

const base = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("manifest name / lang / start_url follow the requested language", () => {
  const cases = { en: "Recipelog", ko: "레시피로그", ja: "レシピログ", zh: "食谱日志" };
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
    assert.equal(COPY[lang].image, `https://recipelog.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${COPY.ko.title}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${COPY.ko.localOnly}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${COPY.ko.title}</h1>`));
  assert.match(html, new RegExp(`class="rl-tagline">${COPY.ko.tagline}</p>`));
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
});

test("the fail-case chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipNoWipe", "chipNoCatalog", "chipNoAds", "chipManual", "chipFree", "chipLocal", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoWipe, "No login wipe (JSON export)");
  assert.equal(I18N.en.chipManual, "Manual+URL+photo (no IG/TikTok auto)");
  assert.equal(I18N.ko.chipFree, "무료");
  // Every zh string differs from en except deliberate shared tokens (A, A+, ko/en/ja/zh, …).
  const shared = new Set(["fontMd", "fontLg", "fontXl", "chipLangs", "urlPlaceholder", "minutesShort"]);
  for (const key of Object.keys(I18N.en)) {
    if (shared.has(key)) continue;
    assert.notEqual(I18N.zh[key], I18N.en[key], `zh.${key} falls back to English`);
    assert.notEqual(I18N.ja[key], I18N.en[key], `ja.${key} falls back to English`);
    assert.notEqual(I18N.ko[key], I18N.en[key], `ko.${key} falls back to English`);
  }
});

test("the URL-extract fallback is documented in every language", () => {
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.ok(I18N[lang].extractFailBlocked.length > 10, lang);
    assert.ok(I18N[lang].noSocialImport.length > 10, lang);
    assert.ok(/NYT/.test(I18N[lang].extractFailBlocked), `${lang} names a blocked site`);
    assert.ok(/Instagram|인스타그램|IG/.test(I18N[lang].noSocialImport), `${lang} says no Instagram import`);
  }
});
