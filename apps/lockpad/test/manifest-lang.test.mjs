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
  const cases = { en: "Lockpad", ko: "락패드", ja: "ロックパッド", zh: "加锁便签" };
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
    assert.equal(COPY[lang].image, `https://lockpad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="lp-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#f5efe6" \/>/);
});

test("the exact spec taglines and banners are what ships", () => {
  assert.equal(I18N.en.tagline, "Simple local notepad with per-note PIN lock. Unlock modal, idle auto-lock, title search (locked bodies stay ciphertext), tags & colors, portable JSON backup of locked blobs. No account. No ads. No IAP.");
  assert.match(I18N.ko.tagline, /메모별 PIN 잠금/);
  assert.match(I18N.ja.tagline, /PINロック/);
  assert.match(I18N.zh.tagline, /PIN 锁/);
  for (const lang of ["ko", "en", "ja", "zh"]) {
    assert.match(I18N[lang].localOnly, /JSON/, `${lang} banner mentions JSON`);
    assert.ok(I18N[lang].localOnly.length < 140, `${lang} banner stays short`);
  }
  assert.equal(I18N.en.localOnly, "Your notes stay on this device. Locked notes are stored as ciphertext only. No login. No ads. Export JSON to keep a copy.");
  assert.equal(I18N.ko.title, "락패드");
  assert.equal(I18N.ja.title, "ロックパッド");
  assert.equal(I18N.zh.title, "加锁便签");
});

test("the fail-fix chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipAndroidWeb", "chipNoLogin", "chipNoAds", "chipBackup", "chipNoAttachPaywall", "chipNoWipe", "chipLocal", "chipPin", "chipAutoLock", "chipFree", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipAndroidWeb, "Works on Android & web");
  assert.equal(I18N.en.chipNoLogin, "No login");
  assert.equal(I18N.en.chipNoAds, "No ads on tool");
  assert.equal(I18N.en.chipBackup, "Portable locked JSON backup");
  assert.equal(I18N.en.chipNoAttachPaywall, "No attachment paywall");
  assert.equal(I18N.en.chipNoWipe, "No wipe");
  assert.equal(I18N.en.chipLocal, "Stays on this device");
  assert.equal(I18N.en.chipPin, "Per-note PIN");
  assert.equal(I18N.en.chipAutoLock, "Idle auto-lock");
  assert.equal(I18N.en.chipFree, "Free forever");
  const same = new Set(["chipLangs", "pinPlaceholder"]);
  for (const k of Object.keys(I18N.en)) {
    if (same.has(k)) continue;
    assert.notEqual(I18N.zh[k], I18N.en[k], `zh.${k} is English`);
    assert.notEqual(I18N.ja[k], I18N.en[k], `ja.${k} is English`);
    assert.notEqual(I18N.ko[k], I18N.en[k], `ko.${k} is English`);
  }
  for (const lang of ["ko", "ja", "zh"]) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), Object.keys(I18N.en).sort(), `${lang} has every key`);
  }
});
