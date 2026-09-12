import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { COPY, localizeManifest } from "../src/og-lang.ts";
import { I18N, SITE_NAMES } from "../src/lib/i18n.ts";
import { SITES } from "../src/lib/rotation.ts";

const base = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("manifest name / lang / start_url follow the requested language", () => {
  const cases = { en: "Peptidelog", ko: "펩타이드로그", ja: "ペプチドログ", zh: "肽记录" };
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
    assert.equal(COPY[lang].notMedical, I18N[lang].notMedical, `${lang} notMedical`);
    assert.equal(COPY[lang].image, `https://peptidelog.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${COPY.ko.title}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${COPY.ko.localOnly}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${COPY.ko.title}</h1>`));
  assert.match(html, new RegExp(`class="pl-tagline">${COPY.ko.tagline}</p>`));
  assert.match(html, new RegExp(`id="not-medical" role="note">${COPY.ko.notMedical}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
});

test("the fail-fix chips exist in every language", () => {
  const keys = ["chipNoWall", "chipAnyDay", "chipEditDoses", "chipUnlimited", "chipArithmetic", "chipLocal", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoWall, "No subscribe wall");
  assert.equal(I18N.en.chipAnyDay, "Log any day (not locked to today)");
  assert.equal(I18N.en.chipEditDoses, "Edit/delete wrong doses");
  assert.equal(I18N.en.chipUnlimited, "Unlimited compounds free");
  assert.equal(I18N.en.chipArithmetic, "Calculator is arithmetic only — not medical advice");
  assert.equal(I18N.en.chipLocal, "Data this device only");
  assert.equal(I18N.ko.chipUnlimited, "화합물 무제한 무료");
});

test("every language carries the not-medical-advice line and the site names", () => {
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.ok(I18N[lang].notMedical.length > 10, `${lang}.notMedical`);
    for (const site of SITES) assert.ok(SITE_NAMES[lang][site]?.length > 0, `${lang} site ${site}`);
  }
  assert.doesNotMatch(JSON.stringify(I18N), /recommended dose|suggested dose|we recommend|dosing assistant/i, "no dosing advice copy anywhere");
});

test("every UI string exists in every language and zh never falls back to English", () => {
  const keys = Object.keys(I18N.en);
  for (const lang of ["ko", "ja", "zh"]) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), [...keys].sort(), `${lang} keys`);
    for (const k of keys) {
      assert.ok(I18N[lang][k].length > 0, `${lang}.${k} empty`);
      if (k === "chipLangs" || k.startsWith("font")) continue;
      assert.notEqual(I18N[lang][k], I18N.en[k], `${lang}.${k} is still English`);
    }
  }
});
