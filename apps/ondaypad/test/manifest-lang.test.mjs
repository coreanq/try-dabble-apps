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
  const cases = { en: "Ondaypad", ko: "온데이패드", ja: "オンデイパッド", zh: "当日记事板" };
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
    assert.equal(COPY[lang].image, `https://ondaypad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="od-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#fff7ed" \/>/);
});

test("the exact spec taglines and banners are what ships", () => {
  assert.equal(I18N.en.tagline, 'Free local nostalgia calendar. Month grid, notes per day, and a "this day across years" stack for any MM-DD. JSON backup. No account. No ads.');
  assert.equal(I18N.ko.tagline, "무료 로컬 향수 캘린더. 월 그리드, 날짜별 메모, 같은 MM-DD의 여러 해 메모를 쌓아 보기. JSON 백업. 계정 없음. 광고 없음.");
  assert.equal(I18N.ja.tagline, "無料のローカル懐かしさカレンダー。月グリッド、日付メモ、同じMM-DDの年ごとのメモを積み重ね表示。JSONバックアップ。アカウント不要。広告なし。");
  assert.equal(I18N.zh.tagline, "免费本地怀旧日历。月网格、每日笔记，以及任意 MM-DD 的跨年笔记堆叠。JSON 备份。无需账号。无广告。");
  assert.equal(I18N.en.localOnly, "Your data stays on this device. No login. No ads. Export JSON so a lost phone is not the end.");
  assert.equal(I18N.ko.localOnly, "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. JSON으로 백업하세요.");
  assert.equal(I18N.ja.localOnly, "データはこの端末にだけ保存されます。ログイン・広告なし。JSONでバックアップしてください。");
  assert.equal(I18N.zh.localOnly, "数据仅保存在此设备。无登录、无广告。请用 JSON 备份，以免丢手机丢数据。");
  assert.equal(I18N.ko.title, "온데이패드");
  assert.equal(I18N.ja.title, "オンデイパッド");
  assert.equal(I18N.zh.title, "当日记事板");
});

test("the fail-fix chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipNoAccount", "chipNoCloud", "chipBackup", "chipNoAds", "chipLocal", "chipFree", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoAccount, "No account");
  assert.equal(I18N.en.chipNoCloud, "No forced cloud");
  assert.equal(I18N.en.chipNoAds, "No ads on tool");
  assert.equal(I18N.en.chipLocal, "Stays on this device");
  assert.equal(I18N.en.chipBackup, "JSON backup");
  assert.equal(I18N.en.chipFree, "Free forever");
  const same = new Set(["chipLangs"]);
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
