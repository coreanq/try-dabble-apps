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
  const cases = { en: "PetPlay", ko: "펫플레이", ja: "ペットプレイ", zh: "宠玩" };
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
    assert.equal(COPY[lang].image, `https://petplay.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="pp-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#ffd6e0" \/>/);
});

test("the fail-fix chips exist in every language", () => {
  const keys = ["chipFreeCustom", "chipNoAI", "chipCareInTab", "chipBackup", "chipNoLogin", "chipNoAds", "chipLocal", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipFreeCustom, "Free custom");
  assert.equal(I18N.en.chipNoAI, "No generative AI");
  assert.equal(I18N.en.chipCareInTab, "Care loop in-tab");
  assert.equal(I18N.en.chipBackup, "JSON backup");
  assert.equal(I18N.en.chipNoLogin, "No login");
  assert.equal(I18N.en.chipNoAds, "No ads");
  assert.equal(I18N.en.chipLocal, "Data this device only");
  assert.equal(I18N.ko.chipNoAI, "생성형 AI 없음");
});

test("every tagline says no generative AI, no account, no tokens, no ads", () => {
  const want = {
    ko: ["생성형 AI 없는", "계정 없음", "토큰 없음", "광고 없음"],
    en: ["no generative AI", "No account", "No tokens", "No ads"],
    ja: ["生成AIなし", "アカウント不要", "トークンなし", "広告なし"],
    zh: ["无生成式 AI", "无需账号", "无代币", "无广告"],
  };
  for (const [lang, parts] of Object.entries(want)) {
    for (const p of parts) assert.ok(I18N[lang].tagline.includes(p), `${lang} tagline lacks "${p}"`);
    assert.ok(I18N[lang].photoHint.length > 10, `${lang}.photoHint`);
    assert.ok(I18N[lang].freeNote.length > 10, `${lang}.freeNote`);
  }
});

test("every UI string exists in every language and zh never falls back to English", () => {
  const keys = Object.keys(I18N.en);
  const shared = new Set(["chipLangs"]);
  for (const lang of ["ko", "ja", "zh"]) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), [...keys].sort(), `${lang} keys`);
    for (const k of keys) {
      assert.ok(I18N[lang][k].length > 0, `${lang}.${k} empty`);
      if (shared.has(k)) continue;
      assert.notEqual(I18N[lang][k], I18N.en[k], `${lang}.${k} is still English`);
    }
  }
});
