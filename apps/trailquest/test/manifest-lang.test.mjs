import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { COPY, localizeManifest } from "../src/og-lang.ts";
import { I18N } from "../src/lib/i18n.ts";
import { PRESET_ROUTES } from "../src/lib/routes.ts";

const base = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("manifest name / lang / start_url follow the requested language", () => {
  const cases = { en: "Trailquest", ko: "트레일퀘스트", ja: "トレイルクエスト", zh: "步道征途" };
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
    assert.equal(COPY[lang].image, `https://trailquest.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${COPY.ko.title}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${COPY.ko.localOnly}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${COPY.ko.title}</h1>`));
  assert.match(html, new RegExp(`class="tq-tagline">${COPY.ko.tagline}</p>`));
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
});

test("the fail-fix chips exist in every language", () => {
  const keys = ["chipManual", "chipSwitch", "chipNoMembership", "chipBackup", "chipNoAi", "chipLocal", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipManual, "Manual log only (no auto-track spam)");
  assert.equal(I18N.en.chipSwitch, "Switch routes, progress kept");
  assert.equal(I18N.en.chipNoMembership, "No membership lock");
  assert.equal(I18N.en.chipBackup, "JSON backup for reinstall");
  assert.equal(I18N.en.chipNoAi, "No AI art");
  assert.equal(I18N.en.chipLocal, "Data this device only");
  assert.equal(I18N.ko.chipNoAi, "AI 아트 없음");
});

test("index.html carries the Naver Search Advisor meta statically", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
});

test("every preset route has its milestones named in every language, in order, inside the total", () => {
  assert.ok(PRESET_ROUTES.length >= 6);
  const ids = PRESET_ROUTES.map((r) => r.id);
  for (const want of ["pct", "at", "cdt", "camino"]) assert.ok(ids.includes(want), want);
  for (const r of PRESET_ROUTES) {
    assert.ok(r.totalMiles > 0, r.id);
    assert.ok(r.milestones.length >= 8, `${r.id} milestones`);
    let prev = -1;
    for (const m of r.milestones) {
      assert.ok(m.milesFromStart >= prev, `${r.id}/${m.id} order`);
      assert.ok(m.milesFromStart <= r.totalMiles, `${r.id}/${m.id} within total`);
      for (const lang of ["ko", "en", "ja", "zh"]) assert.ok(m.name[lang]?.length > 0, `${r.id}/${m.id} ${lang}`);
      prev = m.milesFromStart;
    }
    assert.equal(r.milestones[0].milesFromStart, 0, `${r.id} starts at 0`);
    assert.equal(r.milestones[r.milestones.length - 1].milesFromStart, r.totalMiles, `${r.id} ends at total`);
  }
});

test("every UI string exists in every language and zh never falls back to English", () => {
  const keys = Object.keys(I18N.en);
  for (const lang of ["ko", "ja", "zh"]) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), [...keys].sort(), `${lang} keys`);
    for (const k of keys) {
      assert.ok(I18N[lang][k].length > 0, `${lang}.${k} empty`);
      if (k === "chipLangs" || k.startsWith("font") || k === "distancePlaceholder" || k === "unitKm") continue;
      assert.notEqual(I18N[lang][k], I18N.en[k], `${lang}.${k} is still English`);
    }
  }
});
