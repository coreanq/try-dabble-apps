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
  const cases = { en: "Essaypad", ko: "에세이패드", ja: "エッセイパッド", zh: "作文进度板" };
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
    assert.equal(COPY[lang].image, `https://essaypad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="ep-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#f7f1e8" \/>/);
});

test("the exact spec taglines and banners are what ships", () => {
  assert.equal(I18N.en.tagline, "Free local essay & project word-progress tracker. Set a target, optional deadline, update words written by hand, see progress and daily pace. Weekend-aware write days. JSON backup. No account. No subscription.");
  assert.equal(I18N.ko.tagline, "무료 로컬 에세이·프로젝트 단어 진행 기록. 목표 단어 수와 선택 마감일을 정하고, 쓴 단어 수를 직접 입력하면 진행률과 하루 목표가 보입니다. 주말 제외 옵션. JSON 백업. 계정 없음. 구독 없음.");
  assert.equal(I18N.ja.tagline, "無料のローカル エッセイ・プロジェクト語数進捗トラッカー。目標語数と任意の締切を決め、書いた語数を手で更新すると進捗と一日のペースが見えます。週末を除く執筆日設定。JSONバックアップ。アカウント不要。サブスクなし。");
  assert.equal(I18N.zh.tagline, "免费本地作文/项目字数进度记录。设定目标字数和可选截止日，手动更新已写字数，查看进度和每日配额。可跳过周末的写作日。JSON 备份。无需账号。无订阅。");
  assert.equal(I18N.en.localOnly, "Your essays stay on this device. No login. No ads. No subscription. Unlimited essays are free.");
  assert.equal(I18N.ko.localOnly, "에세이 데이터는 이 기기에만 저장됩니다. 로그인·광고·구독 없음. 에세이 개수 제한 없이 무료입니다.");
  assert.equal(I18N.ja.localOnly, "エッセイのデータはこの端末にだけ保存されます。ログイン・広告・サブスクなし。エッセイ数は無制限で無料です。");
  assert.equal(I18N.zh.localOnly, "作文数据仅保存在此设备。无登录、无广告、无订阅。作文数量不限，全部免费。");
  assert.equal(I18N.en.tagline, "Free local essay & project word-progress tracker. Set a target, optional deadline, update words written by hand, see progress and daily pace. Weekend-aware write days. JSON backup. No account. No subscription.");
});

test("the fail-fix chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipAndroid", "chipNoLogin", "chipNoAds", "chipNoSub", "chipLocal", "chipBackup", "chipWeekend", "chipBackdate", "chipFree", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipAndroid, "Works on Android & web");
  assert.equal(I18N.en.chipNoLogin, "No login");
  assert.equal(I18N.en.chipNoAds, "No ads on tool");
  assert.equal(I18N.en.chipNoSub, "No subscription");
  assert.equal(I18N.en.chipLocal, "Stays on this device");
  assert.equal(I18N.en.chipBackup, "JSON backup");
  assert.equal(I18N.en.chipWeekend, "Weekend-aware pace");
  assert.equal(I18N.en.chipBackdate, "Back-date history");
  assert.equal(I18N.en.chipFree, "Free forever");
  for (const k of Object.keys(I18N.en)) {
    if (k === "chipLangs" || k === "percentDone") continue;
    assert.notEqual(I18N.zh[k], I18N.en[k], `zh.${k} is English`);
    assert.notEqual(I18N.ja[k], I18N.en[k], `ja.${k} is English`);
    assert.notEqual(I18N.ko[k], I18N.en[k], `ko.${k} is English`);
  }
});
