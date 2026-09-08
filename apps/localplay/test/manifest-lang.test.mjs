import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { localizeManifest } from "../src/og-lang.ts";

const base = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("manifest name / lang / start_url follow the requested language", () => {
  const cases = { en: "Localplay", ko: "로컬플레이", ja: "ローカルプレイ", zh: "本地播放" };
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

test("the shipped shell carries no ad script and no autofocus", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /adsbygoogle|ca-pub-|googlesyndication/);
  assert.doesNotMatch(html, /autofocus/i);
  assert.match(html, /id="local-only"/);
  assert.match(html, /<h1 id="brand-title">로컬플레이<\/h1>/);
  assert.match(html, /class="lp-tagline"/);
});
