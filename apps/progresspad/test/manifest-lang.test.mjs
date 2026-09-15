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
  const cases = { en: "Progresspad", ko: "프로그레스패드", ja: "プログレスパッド", zh: "进度板" };
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
    assert.equal(COPY[lang].image, `https://progresspad.try-dabble.com/og-image-${lang}.png`);
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
  assert.match(html, /<meta name="theme-color" content="#eef6f0" \/>/);
});

test("the exact spec taglines and banners are what ships", () => {
  assert.equal(I18N.en.tagline, "Free local long-task progress pad. Set a target in hours or percent, log focus minutes by date, watch the bar fill. Optional gentle plant or blocks stage — no forced timer, no dying tree. Multi-task list, JSON backup. No account. No ads.");
  assert.equal(I18N.ko.tagline, "무료 로컬 장기 과제 진행 기록. 시간 또는 % 목표, 날짜별 집중 분 기록, 진행 막대. 선택적 식물·블록 스테이지 — 강제 타이머·시드는 나무 없음. 여러 과제, JSON 백업. 계정 없음. 광고 없음.");
  assert.equal(I18N.ja.tagline, "無料のローカル長期タスク進捗パッド。時間または％の目標、日付ごとの集中分を記録、進捗バー。任意の植物・ブロック演出 — 強制タイマーも枯れる木もなし。複数タスク、JSONバックアップ。アカウント不要。広告なし。");
  assert.equal(I18N.zh.tagline, "免费本地长期任务进度板。按小时或百分比设目标，按日期记录专注分钟，进度条填充。可选温和植物/方块阶段 — 无强制计时器、无枯死树。多任务、JSON 备份。无需账号。无广告。");
  assert.equal(I18N.en.localOnly, "Your data stays on this device. No login. No ads. Log by hand — no forced timer required.");
  assert.equal(I18N.ko.localOnly, "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 강제 타이머 없이 손으로 기록하면 됩니다.");
  assert.equal(I18N.ja.localOnly, "データはこの端末にだけ保存されます。ログイン・広告なし。強制タイマーなしで手入力で記録できます。");
  assert.equal(I18N.zh.localOnly, "数据仅保存在此设备。无登录、无广告。可手记，无需强制计时器。");
  assert.equal(I18N.ko.title, "프로그레스패드");
  assert.equal(I18N.ja.title, "プログレスパッド");
  assert.equal(I18N.zh.title, "进度板");
});

test("the fail-fix chips exist in every language and zh never falls back to English", () => {
  const keys = ["chipNoTimer", "chipNoDyingTree", "chipNoMidAds", "chipNoUpsell", "chipNoLogin", "chipLocal", "chipBackup", "chipFree", "chipLangs"];
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const k of keys) assert.ok(I18N[lang][k]?.length > 0, `${lang}.${k}`);
    assert.equal(I18N[lang].chipLangs, "ko/en/ja/zh");
  }
  assert.equal(I18N.en.chipNoTimer, "No forced timer");
  assert.equal(I18N.en.chipNoDyingTree, "No dying tree");
  assert.equal(I18N.en.chipNoMidAds, "No ads mid-focus");
  assert.equal(I18N.en.chipNoUpsell, "No Plus upsell");
  assert.equal(I18N.en.chipNoLogin, "No login");
  assert.equal(I18N.en.chipLocal, "Stays on this device");
  assert.equal(I18N.en.chipBackup, "JSON backup");
  assert.equal(I18N.en.chipFree, "Free forever");
  assert.equal(I18N.en.stageNeverDies, "Grows with you — never dies");
  const same = new Set(["chipLangs", "percentDone"]);
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

test("copy never threatens the plant: no wilt / die / streak-shame language in any UI string", () => {
  for (const lang of ["ko", "en", "ja", "zh"]) {
    for (const [k, v] of Object.entries(I18N[lang])) {
      if (/^(chip|stage|over|tagline|metaDescription|howBody|localOnly)/.test(k)) continue; // these promise the opposite
      assert.doesNotMatch(v, /streak|wilt|withered|your tree died|시들었|枯れました|枯萎了/i, `${lang}.${k}`);
    }
  }
});
