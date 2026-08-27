import assert from "node:assert/strict";
import test from "node:test";

import {
  PRESETS,
  PRESET_ORDER,
  captionLine,
  clampInt,
  clampOffset,
  coverCrop,
  downloadName,
  isInRange,
  normalizeProfile,
  normalizeSettings,
  specFor,
} from "../src/lib/spec.ts";

test("the shipped presets keep their exact pixel and KB rules", () => {
  assert.deepEqual(PRESETS["in-ibps-photo"], {
    w: 200,
    h: 230,
    minKB: 20,
    maxKB: 50,
    format: "jpeg",
    labelKey: "presetInIbps",
  });
  assert.deepEqual(PRESETS["in-ssc-photo"], {
    w: 413,
    h: 531,
    minKB: 20,
    maxKB: 50,
    format: "jpeg",
    labelKey: "presetInSsc",
  });
  assert.deepEqual(PRESETS["in-upsc-photo"], {
    w: 472,
    h: 591,
    minKB: 20,
    maxKB: 300,
    format: "jpeg",
    labelKey: "presetInUpsc",
    caption: true,
  });
  assert.deepEqual(PRESETS["in-exam-sign"], {
    w: 140,
    h: 60,
    minKB: 10,
    maxKB: 20,
    format: "jpeg",
    labelKey: "presetInSign",
  });
  assert.deepEqual(PRESETS["passport-2x2"], {
    w: 600,
    h: 600,
    minKB: 50,
    maxKB: 200,
    format: "jpeg",
    labelKey: "presetPassport",
  });
  assert.deepEqual(PRESETS["kr-resume"], {
    w: 300,
    h: 400,
    minKB: 30,
    maxKB: 100,
    format: "jpeg",
    labelKey: "presetKrResume",
  });
  assert.deepEqual(PRESET_ORDER, [
    "in-ibps-photo",
    "in-ssc-photo",
    "in-upsc-photo",
    "in-exam-sign",
    "passport-2x2",
    "kr-resume",
    "custom",
  ]);
});

test("v1 settings written by the old app still load", () => {
  const s = normalizeSettings({ preset: "in-exam-photo", custom: { w: 300, h: 300 } });
  assert.equal(s.preset, "in-ibps-photo");
  assert.equal(s.custom.w, 300);
  assert.equal(s.custom.minKB, 20);
  assert.deepEqual(normalizeSettings(null).preset, "in-ibps-photo");
  assert.equal(normalizeSettings({ preset: "nope" }).preset, "in-ibps-photo");
});

test("a stored profile keeps only the known string fields", () => {
  const p = normalizeProfile({ name: "Mina", nid: "X", bogus: 1, phone: 5 });
  assert.equal(p.name, "Mina");
  assert.equal(p.nid, "X");
  assert.equal(p.phone, "");
  assert.equal(Object.keys(p).length, 8);
  assert.equal("bogus" in p, false);
});

test("custom specs clamp, and a flipped KB range is swapped back", () => {
  const spec = specFor({
    preset: "custom",
    custom: { w: 10, h: 9000, minKB: 90, maxKB: 30, format: "png" },
  });
  assert.deepEqual(spec, { w: 20, h: 4000, minKB: 30, maxKB: 90, format: "png" });
  assert.equal(clampInt("abc", 1, 10, 7), 7);
  assert.equal(clampInt(11.4, 1, 10, 7), 10);
});

test("cover crop fills the target aspect from the centre", () => {
  // Wide source, tall target: full height, centred slice of the width.
  const wide = coverCrop(1000, 500, 200, 230, 0, 0);
  assert.equal(wide.cropH, 500);
  assert.ok(Math.abs(wide.cropW - (500 * 200) / 230) < 1e-9);
  assert.ok(Math.abs(wide.cropX - (1000 - wide.cropW) / 2) < 1e-9);
  assert.equal(wide.cropY, 0);

  // Tall source, wide target: full width, centred slice of the height.
  const tall = coverCrop(500, 1000, 140, 60, 0, 0);
  assert.equal(tall.cropW, 500);
  assert.ok(Math.abs(tall.cropH - (500 * 60) / 140) < 1e-9);
  assert.ok(Math.abs(tall.cropY - (1000 - tall.cropH) / 2) < 1e-9);
});

test("the drag offset never walks the crop off the source", () => {
  const spec = { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg" };
  const wide = clampOffset(1000, 500, spec, 99999, 99999);
  const { cropW } = coverCrop(1000, 500, spec.w, spec.h, 0, 0);
  assert.equal(wide.x, (1000 - cropW) / 2);
  assert.equal(wide.y, 0);

  const crop = coverCrop(1000, 500, spec.w, spec.h, wide.x, wide.y);
  assert.ok(crop.cropX + crop.cropW <= 1000 + 1e-9);
  assert.ok(crop.cropX >= 0);
});

test("the KB verdict is inclusive of both ends", () => {
  const spec = { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg" };
  assert.equal(isInRange(20, spec), true);
  assert.equal(isInRange(50, spec), true);
  assert.equal(isInRange(19.9, spec), false);
  assert.equal(isInRange(50.5, spec), false);
});

test("downloads are named like photo-200x230-32kb.jpg", () => {
  assert.equal(downloadName(200, 230, 32.4, "jpeg"), "photo-200x230-32kb.jpg");
  assert.equal(downloadName(600, 600, 199.6, "png"), "photo-600x600-200kb.png");
  assert.equal(downloadName(140, 60, 0.2, "jpeg"), "photo-140x60-1kb.jpg");
});

test("the UPSC caption prints the applicant name and today's date", () => {
  const day = new Date(2026, 7, 27);
  assert.equal(captionLine("  Mina  ", day), "Mina  27-08-2026");
  assert.equal(captionLine("", day), "27-08-2026");
});
