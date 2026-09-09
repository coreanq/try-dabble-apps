import assert from "node:assert/strict";
import test from "node:test";

import { KEYPOINT_NAMES, POSES, figure, filterPoses, findPose, randomPose, stepPose } from "../src/lib/poses.ts";
import { AUTO_CAPTURE_SCORE, matchBand, matchScore, mirrorKeypoints, normalize, smoothScore, updateHold } from "../src/lib/match.ts";
import { DEFAULT_PREFS, bumpStreak, effectiveFacing, parsePrefs, parseRecent, pushRecent } from "../src/lib/prefs.ts";
import { captureFileName, luminanceIsBlack } from "../src/lib/capture.ts";
import { classifyError, constraintsFor } from "../src/lib/camera.ts";

const LANGS = ["ko", "en", "ja", "zh"];

test("the free library is far bigger than two poses and nothing is locked", () => {
  assert.ok(POSES.length >= 24, `only ${POSES.length} poses`);
  for (const p of POSES) {
    assert.ok(!("premium" in p) && !("locked" in p), `${p.id} has a lock flag`);
  }
  assert.equal(new Set(POSES.map((p) => p.id)).size, POSES.length, "duplicate ids");
});

test("every pose has all four languages for name, tips, hand tip and 3–6 voice steps", () => {
  for (const p of POSES) {
    for (const lang of LANGS) {
      assert.ok(p.name[lang]?.length > 0, `${p.id} name.${lang}`);
      assert.ok(p.handTip[lang]?.length > 0, `${p.id} handTip.${lang}`);
      for (const tip of p.tips) assert.ok(tip[lang]?.length > 0, `${p.id} tip.${lang}`);
      for (const s of p.voiceSteps) assert.ok(s[lang]?.length > 0, `${p.id} voiceStep.${lang}`);
    }
    assert.ok(p.tips.length >= 1, `${p.id} tips`);
    assert.ok(p.voiceSteps.length >= 3 && p.voiceSteps.length <= 6, `${p.id} voiceSteps ${p.voiceSteps.length}`);
    assert.notEqual(p.name.zh, p.name.en, `${p.id} zh name falls back to en`);
  }
});

test("every skeleton has the 17 MoveNet joints inside the 0–1 frame", () => {
  for (const p of POSES) {
    assert.deepEqual(p.keypoints.map((k) => k.name), [...KEYPOINT_NAMES], p.id);
    for (const k of p.keypoints) {
      assert.ok(k.x >= 0 && k.x <= 1 && k.y >= 0 && k.y <= 1, `${p.id} ${k.name} ${k.x},${k.y}`);
    }
    assert.ok(normalize(p.keypoints), `${p.id} has no usable torso`);
  }
});

test("male filter returns real male poses; female likewise; both include 'anyone' poses", () => {
  const male = filterPoses(POSES, { gender: "male" });
  const female = filterPoses(POSES, { gender: "female" });
  assert.ok(male.filter((p) => p.gender === "male").length >= 6, "fewer than 6 male-tagged poses");
  assert.ok(female.filter((p) => p.gender === "female").length >= 6, "fewer than 6 female-tagged poses");
  assert.ok(male.every((p) => p.gender !== "female"));
  assert.ok(female.every((p) => p.gender !== "male"));
  assert.ok(male.some((p) => p.gender === "any"));
});

test("adaptive chip selects seated / wheelchair poses across categories", () => {
  const adaptive = filterPoses(POSES, { category: "adaptive" });
  assert.ok(adaptive.length >= 4, `only ${adaptive.length} adaptive poses`);
  assert.ok(adaptive.every((p) => p.adaptive || p.seated));
  assert.ok(new Set(adaptive.map((p) => p.category)).size >= 2, "adaptive poses should span categories");
  assert.ok(adaptive.some((p) => p.gender === "male"), "an adaptive male pose exists");
});

test("every category has poses, and search works in each language", () => {
  for (const c of ["solo", "couple", "travel", "grad", "casual", "formal"]) {
    assert.ok(filterPoses(POSES, { category: c }).length >= 2, c);
  }
  assert.ok(filterPoses(POSES, { query: "grad", lang: "en" }).length >= 4);
  assert.ok(filterPoses(POSES, { query: "졸업", lang: "ko" }).length >= 4);
  assert.ok(filterPoses(POSES, { query: "卒業", lang: "ja" }).length >= 4);
  assert.ok(filterPoses(POSES, { query: "毕业", lang: "zh" }).length >= 4);
  assert.ok(filterPoses(POSES, { query: "seated", lang: "en" }).length >= 4);
  assert.ok(filterPoses(POSES, { query: "Hand on hip", lang: "en" }).length >= 1);
  assert.equal(filterPoses(POSES, { query: "zzzz-nothing" }).length, 0);
});

test("next / prev wrap around within the filtered list; random never repeats the current", () => {
  const list = filterPoses(POSES, { category: "grad" });
  const first = list[0];
  assert.equal(stepPose(list, first.id, -1).id, list[list.length - 1].id);
  assert.equal(stepPose(list, list[list.length - 1].id, 1).id, first.id);
  assert.equal(stepPose(list, "unknown", 1).id, first.id);
  for (let i = 0; i < 20; i += 1) {
    assert.notEqual(randomPose(list, first.id, () => i / 20).id, first.id);
  }
  assert.equal(randomPose([], "x"), undefined);
  assert.equal(findPose("hands-in-pockets").gender, "male");
});

test("figure() builds a mirror-symmetric skeleton for symmetric limbs", () => {
  const sym = figure({ leftArm: { upper: 40, lower: -115 }, rightArm: { upper: 40, lower: -115 } });
  const pt = (n) => sym.find((k) => k.name === n);
  assert.ok(Math.abs(pt("left_wrist").x - (1 - pt("right_wrist").x)) < 0.01);
  assert.ok(Math.abs(pt("left_wrist").y - pt("right_wrist").y) < 0.01);
  assert.ok(pt("left_shoulder").x > pt("right_shoulder").x, "subject's left is image right");
});

test("match score: identical skeleton ≈ 100, mirrored skeleton ≈ 100, different pose much lower", () => {
  const ref = findPose("arms-up-stretch").keypoints;
  const same = ref.map((k) => ({ ...k, score: 0.9 }));
  const exact = matchScore(same, ref);
  assert.ok(exact.score >= 98, `exact ${exact.score}`);
  const mirrored = mirrorKeypoints(ref).map((k) => ({ ...k, score: 0.9 }));
  const m = matchScore(mirrored, ref);
  assert.ok(m.score >= 98, `mirrored ${m.score}`);
  const other = findPose("hands-in-pockets").keypoints.map((k) => ({ ...k, score: 0.9 }));
  const diff = matchScore(other, ref);
  assert.ok(diff.score !== null && diff.score < 75, `different ${diff.score}`);
  assert.ok(diff.score < exact.score);
});

test("match score is scale and position invariant", () => {
  const ref = findPose("power-stance-m").keypoints;
  const moved = ref.map((k) => ({ name: k.name, x: k.x * 0.4 + 0.3, y: k.y * 0.4 + 0.1, score: 0.8 }));
  assert.ok(matchScore(moved, ref).score >= 98);
});

test("match score is null with no person, low confidence, or missing torso", () => {
  const ref = findPose("hand-on-hip").keypoints;
  assert.equal(matchScore([], ref).score, null);
  const faint = ref.map((k) => ({ ...k, score: 0.05 }));
  assert.equal(matchScore(faint, ref).score, null);
  const noHips = ref.filter((k) => !k.name.includes("hip")).map((k) => ({ ...k, score: 0.9 }));
  assert.equal(matchScore(noHips, ref).score, null);
  assert.equal(matchScore(ref.map((k) => ({ ...k, score: 0.9 })), ref).visible, 17);
});

test("per-joint accuracy is reported for tinting and ranges 0–1", () => {
  const ref = findPose("travel-point").keypoints;
  const live = ref.map((k) => (k.name === "left_wrist" ? { ...k, y: k.y + 0.5, score: 0.9 } : { ...k, score: 0.9 }));
  const r = matchScore(live, ref);
  for (const v of Object.values(r.perJoint)) assert.ok(v >= 0 && v <= 1);
  assert.ok(r.score < 100 && r.score > 60);
});

test("smoothing, bands and the auto-capture hold timer", () => {
  assert.equal(smoothScore(null, 80), 80);
  assert.equal(smoothScore(80, null), null);
  assert.equal(smoothScore(0, 100, 0.5), 50);
  assert.equal(matchBand(90), "great");
  assert.equal(matchBand(70), "good");
  assert.equal(matchBand(20), "adjust");
  const st = { since: null };
  assert.equal(updateHold(st, AUTO_CAPTURE_SCORE, 0), false);
  assert.equal(updateHold(st, AUTO_CAPTURE_SCORE + 5, 1000), false);
  assert.equal(updateHold(st, 40, 1500), false, "dropping below resets");
  assert.equal(st.since, null);
  assert.equal(updateHold(st, 90, 2000), false);
  assert.equal(updateHold(st, 90, 4100), true, "fires after the hold");
  assert.equal(updateHold(st, 90, 4200), false, "fires once");
});

test("prefs: autoCapture defaults to false and only true when explicitly true", () => {
  assert.equal(DEFAULT_PREFS.autoCapture, false);
  assert.equal(parsePrefs(null).autoCapture, false);
  assert.equal(parsePrefs({}).autoCapture, false);
  assert.equal(parsePrefs({ autoCapture: "true" }).autoCapture, false);
  assert.equal(parsePrefs({ autoCapture: 1 }).autoCapture, false);
  assert.equal(parsePrefs({ autoCapture: true }).autoCapture, true);
  assert.equal(parsePrefs({ autoCapture: false }).autoCapture, false);
});

test("prefs JSON round trip keeps every field and repairs damage", () => {
  const p = {
    facing: "environment",
    overlayOpacity: 0.35,
    voiceOn: true,
    autoCapture: true,
    composition: "thirds",
    genderFilter: "male",
    category: "grad",
    poseId: "grad-cap-toss",
    fontSize: "lg",
  };
  assert.deepEqual(parsePrefs(JSON.parse(JSON.stringify(p))), p);
  const fixed = parsePrefs({ facing: "sideways", overlayOpacity: 9, composition: "grid", genderFilter: "x", fontSize: "huge" });
  assert.equal(fixed.facing, "user");
  assert.equal(fixed.overlayOpacity, 1);
  assert.equal(parsePrefs({ overlayOpacity: -2 }).overlayOpacity, 0.1);
  assert.equal(parsePrefs({ overlayOpacity: "abc" }).overlayOpacity, DEFAULT_PREFS.overlayOpacity);
  assert.equal(fixed.composition, "off");
  assert.equal(fixed.genderFilter, "all");
  assert.equal(fixed.fontSize, "md");
});

test("stranger mode forces the rear camera regardless of the saved facing", () => {
  assert.equal(effectiveFacing({ facing: "user" }, true), "environment");
  assert.equal(effectiveFacing({ facing: "environment" }, true), "environment");
  assert.equal(effectiveFacing({ facing: "user" }, false), "user");
  assert.equal(constraintsFor("environment").video.facingMode.ideal, "environment");
  assert.equal(constraintsFor("user").video.facingMode, "user");
});

test("recent captures hold metadata only, newest first, capped", () => {
  let list = [];
  for (let i = 0; i < 15; i += 1) list = pushRecent(list, { poseId: `p${i}`, at: new Date(2026, 8, 10, 12, i).toISOString() });
  assert.equal(list.length, 12);
  assert.equal(list[0].poseId, "p14");
  const parsed = parseRecent(JSON.parse(JSON.stringify([...list, { poseId: 1 }, { poseId: "x", at: "nope" }, { poseId: "b", at: list[0].at, burst: 3 }])));
  assert.equal(parsed.length, 12);
  assert.ok(parsed.every((r) => !("blob" in r) && !("dataUrl" in r)));
});

test("streak: same day holds, next day +1, a gap resets", () => {
  const d1 = new Date(2026, 8, 10);
  const s1 = bumpStreak(null, d1);
  assert.deepEqual(s1, { lastDay: "2026-09-10", count: 1 });
  assert.deepEqual(bumpStreak(s1, d1), s1);
  const s2 = bumpStreak(s1, new Date(2026, 8, 11));
  assert.equal(s2.count, 2);
  assert.equal(bumpStreak(s2, new Date(2026, 8, 14)).count, 1);
});

test("camera errors map to the right recovery screen", () => {
  assert.equal(classifyError({ name: "NotAllowedError" }), "denied");
  assert.equal(classifyError({ name: "SecurityError" }), "denied");
  assert.equal(classifyError({ name: "NotFoundError" }), "error");
  assert.equal(classifyError({ name: "NotReadableError" }), "error");
  assert.equal(classifyError({ name: "NotSupportedError" }), "unsupported");
  assert.equal(classifyError(null), "error");
});

test("black-frame detection and capture file names", () => {
  assert.equal(luminanceIsBlack(new Uint8Array(16 * 16 * 4)), true);
  const bright = new Uint8Array(16 * 16 * 4).fill(180);
  assert.equal(luminanceIsBlack(bright), false);
  assert.equal(luminanceIsBlack([]), true);
  const name = captureFileName("hand-on-hip", new Date("2026-09-10T03:04:05.000Z"), 1);
  assert.match(name, /^poseguide-hand-on-hip-2026-09-10T03-04-05-2\.jpg$/);
  assert.match(captureFileName("", new Date("2026-09-10T03:04:05.000Z")), /^poseguide-pose-.*\.jpg$/);
});
