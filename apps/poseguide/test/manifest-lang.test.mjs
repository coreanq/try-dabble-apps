import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { COPY, localizeManifest } from "../src/og-lang.ts";
import { I18N } from "../src/lib/i18n.ts";

const base = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("manifest name / lang / start_url follow the requested language", () => {
  const cases = { en: "Poseguide", ko: "포즈가이드", ja: "ポーズガイド", zh: "姿势指南" };
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
    assert.equal(COPY[lang].image, `https://poseguide.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${COPY.ko.title}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${COPY.ko.localOnly}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${COPY.ko.title}</h1>`));
  assert.match(html, new RegExp(`class="pg-tagline">${COPY.ko.tagline}</p>`));
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
});

test("the fail-fix chips exist in every language", () => {
  const keys = ["chipFreePoses", "chipNoSub", "chipAutoOff", "chipCameraRetry", "chipMaleFemale", "chipLocal", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipFreePoses, "Core poses free (not just 2)");
  assert.equal(I18N.en.chipNoSub, "No subscription");
  assert.equal(I18N.en.chipAutoOff, "Auto-capture off by default");
  assert.equal(I18N.en.chipCameraRetry, "Camera retry help");
  assert.equal(I18N.en.chipMaleFemale, "Male + female poses");
  assert.equal(I18N.ko.chipAutoOff, "자동 촬영 기본 꺼짐");
});

test("no string in zh (or any language) silently falls back to the English copy", () => {
  const skip = new Set(["chipLangs", "fontMd", "fontLg", "fontXl"]);
  for (const lang of ["ko", "ja", "zh"]) {
    for (const [k, v] of Object.entries(I18N[lang])) {
      if (skip.has(k)) continue;
      assert.notEqual(v, I18N.en[k], `${lang}.${k} equals en`);
    }
  }
});

test("every key exists in every language with the same key set", () => {
  const enKeys = Object.keys(I18N.en).sort();
  for (const lang of ["ko", "ja", "zh"]) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), enKeys, lang);
  }
});
