import assert from "node:assert/strict";
import test from "node:test";

import { EN_ONE, I18N, translate } from "../src/lib/i18n.ts";

test("English says 'frame' for n=1 and 'frames' otherwise", () => {
  assert.equal(translate("en", "sealedWith", { n: 1 }), "1 frame sealed");
  assert.equal(translate("en", "sealedWith", { n: 24 }), "24 frames sealed");
  assert.equal(translate("en", "discardBtn", { n: 1 }), "Discard 1 frame");
  assert.equal(translate("en", "discardBtn", { n: 3 }), "Discard all 3 frames");
  assert.equal(translate("en", "shelfLocked", { n: 1 }), "Sealed · 1 frame");
  assert.equal(translate("en", "shelfDeveloped", { n: 1 }), "Developed · 1 frame");
  assert.equal(translate("en", "filesAdded", { n: 1, left: 23 }), "1 photo went into the roll. 23 left.");
  assert.equal(translate("en", "filesAdded", { n: 2, left: 22 }), "2 photos went into the roll. 22 left.");
  assert.doesNotMatch(translate("en", "finishBody", { n: 1 }), /1 frames/);
  assert.doesNotMatch(translate("en", "discardBody", { n: 1 }), /frames? in this roll \(1 so far\) are/);
});

test("every English string with {n} and 'frames' or 'photos' has a singular form", () => {
  for (const [key, value] of Object.entries(I18N.en)) {
    if (value.includes("{n}") && /\b(frames|photos)\b/.test(value)) {
      assert.ok(EN_ONE[key], `missing EN_ONE.${key}`);
    }
  }
});

test("other languages are untouched by the singular table", () => {
  for (const lang of ["ko", "ja", "zh"]) {
    assert.equal(translate(lang, "sealedWith", { n: 1 }), I18N[lang].sealedWith.replace("{n}", "1"));
  }
});
