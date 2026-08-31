import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { SUPPORTED_LOCALES, defaultLocale, isLocale } from "../src/lib/i18n/locales.ts";
import { localizedFaq, messages, t } from "../src/lib/i18n/index.ts";
import {
  HTML_LANG,
  LANG_KEY,
  OG_IMAGE,
  OG_LOCALE,
  SHARE_URL,
} from "../src/lib/i18n/resolve-lang.ts";

test("supports exactly ko, en and ja", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["ko", "en", "ja"]);
  assert.equal(isLocale("ja"), true);
  assert.equal(isLocale("zh"), false);
  assert.equal(defaultLocale(), "ko");
});

test("every locale carries every key the Korean sheet defines", () => {
  const keys = Object.keys(messages.ko);
  for (const locale of SUPPORTED_LOCALES) {
    const sheet = messages[locale];
    for (const key of keys) {
      assert.equal(typeof sheet[key], "string", `${locale}.${key} is missing`);
      assert.notEqual(sheet[key].trim(), "", `${locale}.${key} is blank`);
    }
    assert.deepEqual(Object.keys(sheet).sort(), keys.slice().sort(), `${locale} has extra keys`);
  }
});

test("t reads the requested locale", () => {
  assert.equal(t("ko", "appTitle"), "스도쿠 3D");
  assert.equal(t("en", "appTitle"), "3D Sudoku");
  assert.equal(t("ja", "appTitle"), "3D数独");
});

test("localizedFaq returns three question-answer pairs per locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const faq = localizedFaq(locale);
    assert.equal(faq.length, 3);
    for (const entry of faq) {
      assert.ok(entry.question.length > 0);
      assert.ok(entry.answer.length > 0);
    }
  }
});

test("the language tables cover every locale and never point zh at anything", () => {
  assert.equal(LANG_KEY, "sudoku_lang");
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(typeof HTML_LANG[locale], "string");
    assert.match(OG_LOCALE[locale], /^[a-z]{2}_[A-Z]{2}$/);
    assert.match(OG_IMAGE[locale], /^https:\/\/sudoku\.try-dabble\.com\/og-image/);
  }
  assert.equal(OG_IMAGE.ko, "https://sudoku.try-dabble.com/og-image.png");
  assert.equal(OG_IMAGE.en, "https://sudoku.try-dabble.com/og-image-en.png");
  assert.equal(OG_IMAGE.ja, "https://sudoku.try-dabble.com/og-image-ja.png");
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(SHARE_URL[locale], `https://sudoku.try-dabble.com/?lang=${locale}`);
  }
});

// The client rewrites the head on an in-app language switch (src/routes/home.tsx).
// If it used a different title or description from the one the Worker already
// served, the page would contradict its own first HTML.
test("the head strings the client writes are the ones src/og-lang.ts serves", () => {
  const worker = readFileSync(new URL("../src/og-lang.ts", import.meta.url), "utf8");
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(
      worker.includes(`'${t(locale, "appTitle")}'`),
      `og-lang.ts must serve ${locale} the title ${t(locale, "appTitle")}`,
    );
    assert.ok(
      worker.includes(`'${t(locale, "metaDescription")}'`),
      `og-lang.ts must serve ${locale} the same meta description`,
    );
    assert.ok(
      worker.includes(`'${OG_LOCALE[locale]}'`),
      `og-lang.ts must serve ${locale} the og:locale ${OG_LOCALE[locale]}`,
    );
    assert.ok(
      worker.includes(`'${OG_IMAGE[locale]}'`),
      `og-lang.ts must serve ${locale} the og:image ${OG_IMAGE[locale]}`,
    );
  }
});

// index.html is the ko default the Worker leaves alone on a bare /, so its
// card must say the same thing /?lang=ko does.
test("index.html's default card carries the same Korean strings as ?lang=ko", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const key of ["description", "og:description", "twitter:description"]) {
    const attr = key.startsWith("og:") ? "property" : "name";
    assert.ok(
      html.includes(`<meta ${attr}="${key}" content="${t("ko", "metaDescription")}" />`),
      `index.html ${key} must be the ko meta description`,
    );
  }
  assert.ok(html.includes(`<title>${t("ko", "appTitle")}</title>`));
  assert.ok(html.includes(`content="${t("en", "appTitle")}"`), "og:site_name is the English brand");
});
