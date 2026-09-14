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
  const cases = { en: "Hourpad", ko: "아워패드", ja: "アワーパッド", zh: "工时板" };
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
    assert.equal(COPY[lang].image, `https://hourpad.try-dabble.com/og-image-${lang}.png`);
  }
});

test("the Korean shell in index.html matches the ko copy and carries the Naver meta", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, new RegExp(`<title>${rx(COPY.ko.title)}</title>`));
  assert.match(html, new RegExp(`id="local-only" role="note">${rx(COPY.ko.localOnly)}</p>`));
  assert.match(html, new RegExp(`<h1 id="brand-title">${rx(COPY.ko.title)}</h1>`));
  assert.match(html, new RegExp(`class="hp-tagline">${rx(COPY.ko.tagline)}</p>`));
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" \/>/);
  assert.equal(base.name, COPY.ko.title);
  assert.equal(base.description, COPY.ko.tagline);
  assert.match(html, /<meta name="theme-color" content="#eef2f7" \/>/);
});

test("the exact spec taglines and banners are what ships", () => {
  assert.equal(I18N.en.tagline, "Free local work-hours tracker. Check in, take breaks, check out. Daily and weekly totals vs your target. Overtime bank rolls into next week. JSON backup. No account. No ads.");
  assert.equal(I18N.ko.tagline, "무료 로컬 근무 시간 기록. 출근·휴식·퇴근. 일·주 합계와 목표 시간. 초과 근무 뱅크가 다음 주로 넘어갑니다. JSON 백업. 계정 없음. 광고 없음.");
  assert.equal(I18N.ja.tagline, "無料のローカル勤務時間トラッカー。出勤・休憩・退勤。日・週合計と目標時間。残業バンクは翌週へ繰り越し。JSONバックアップ。アカウント不要。広告なし。");
  assert.equal(I18N.zh.tagline, "免费本地工时记录。上班、休息、下班。日/周合计与目标工时。加班库滚入下周。JSON 备份。无需账号。无广告。");
  assert.equal(I18N.en.localOnly, "Your data stays on this device. No login. No ads. Breaks and the overtime bank are free.");
  assert.equal(I18N.ko.localOnly, "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 휴식과 초과 근무 뱅크는 무료입니다.");
  assert.equal(I18N.ja.localOnly, "データはこの端末にだけ保存されます。ログイン・広告なし。休憩と残業バンクは無料です。");
  assert.equal(I18N.zh.localOnly, "数据仅保存在此设备。无登录、无广告。休息与加班库免费。");
});

test("the fail-fix chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipNoAds", "chipNoAccount", "chipBreaksFree", "chipBankFree", "chipBackup", "chipHonest", "chipFree", "chipLocal", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoAds, "No ads mid-use");
  assert.equal(I18N.en.chipNoAccount, "No account");
  assert.equal(I18N.en.chipBreaksFree, "Breaks free");
  assert.equal(I18N.en.chipBankFree, "Overtime bank free");
  assert.equal(I18N.en.chipBackup, "JSON backup");
  assert.equal(I18N.en.chipHonest, "Honest after background");
  assert.equal(I18N.en.chipFree, "Free forever");
  assert.equal(I18N.en.chipLocal, "Data this device only");
  for (const k of Object.keys(I18N.en)) {
    if (k === "chipLangs") continue;
    assert.notEqual(I18N.zh[k], I18N.en[k], `zh.${k} is English`);
    assert.notEqual(I18N.ja[k], I18N.en[k], `ja.${k} is English`);
    assert.notEqual(I18N.ko[k], I18N.en[k], `ko.${k} is English`);
  }
});
