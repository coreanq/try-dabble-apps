import assert from "node:assert/strict";
import test from "node:test";

import { backupFilename, buildBackup, parseBackup, toJSON } from "../src/lib/backup.ts";
import {
  ACTIVITY_FACTORS,
  bmr,
  dayTotals,
  epley,
  exerciseHistory,
  fmt,
  kcalFromMacros,
  kgToLb,
  latestWeighIn,
  lbToKg,
  personalRecords,
  progressPct,
  remainingOf,
  scaleFood,
  sortWeighIns,
  suggestedTargets,
  tdee,
  weighInDeltas,
  workoutSummary,
} from "../src/lib/calc.ts";
import { shiftDay } from "../src/lib/dates.ts";
import {
  countRows,
  emptyStore,
  ensureExercise,
  newItem,
  newSet,
  newWorkout,
  normalizeFood,
  normalizeMeal,
  normalizeProfile,
  normalizeRoutine,
  normalizeWeighIn,
  normalizeWorkout,
  putRow,
  reconcile,
  removeById,
} from "../src/lib/model.ts";
import { defaultPrefs, parsePrefs } from "../src/lib/prefs.ts";
import { clampRestSeconds, endAtFor, formatSeconds, remainingSeconds, REST_PRESETS } from "../src/lib/timer.ts";

const NOW = new Date("2026-09-13T10:00:00.000Z");
const ISO = NOW.toISOString();

function workout(date, items, over = {}) {
  return { id: `w-${date}-${Math.random()}`, date, items, createdAt: ISO, updatedAt: ISO, ...over };
}
function item(name, sets) {
  return { id: `i-${Math.random()}`, exerciseName: name, sets: sets.map(([weightKg, reps]) => ({ id: `s-${Math.random()}`, weightKg, reps })) };
}

// ---- Mifflin–St Jeor ------------------------------------------------------------

test("Mifflin–St Jeor BMR: male 30y 175cm 75kg = 1699, female = 1533", () => {
  const male = { sex: "male", age: 30, heightCm: 175, weightKg: 75 };
  assert.equal(bmr(male), Math.round(10 * 75 + 6.25 * 175 - 5 * 30 + 5));
  assert.equal(bmr(male), 1699);
  assert.equal(bmr({ ...male, sex: "female" }), 1533);
});

test("BMR is null while the profile is incomplete", () => {
  assert.equal(bmr({ sex: "male", age: 30, heightCm: 175 }), null);
  assert.equal(bmr({}), null);
  assert.equal(tdee({ sex: "male", age: 30 }), null);
});

test("TDEE multiplies by the activity factor; unset activity means sedentary", () => {
  const p = { sex: "male", age: 30, heightCm: 175, weightKg: 75 };
  assert.equal(tdee({ ...p, activity: "moderate" }), Math.round(1699 * 1.55));
  assert.equal(tdee({ ...p, activity: "moderate" }), 2633);
  assert.equal(tdee(p), Math.round(1699 * 1.2));
  assert.deepEqual(Object.values(ACTIVITY_FACTORS), [1.2, 1.375, 1.55, 1.725, 1.9]);
});

test("macro split: protein 2 g/kg, fat 25 % kcal, carbs the remainder", () => {
  const t = suggestedTargets({ sex: "male", age: 30, heightCm: 175, weightKg: 75, activity: "moderate" });
  assert.equal(t.kcal, 2633);
  assert.equal(t.proteinG, 150);
  assert.equal(t.fatG, Math.round((2633 * 0.25) / 9)); // 73
  assert.equal(t.carbsG, Math.max(0, Math.round((2633 - 150 * 4 - t.fatG * 9) / 4)));
  assert.ok(Math.abs(kcalFromMacros(t) - t.kcal) <= 8, "macros add back up to the target within rounding");
  assert.equal(suggestedTargets({ sex: "male" }), null);
});

test("carbs never go negative for a very light, very heavy profile", () => {
  const t = suggestedTargets({ sex: "female", age: 80, heightCm: 150, weightKg: 200, activity: "sedentary" });
  assert.ok(t.carbsG >= 0);
});

test("kg / lb conversions round-trip", () => {
  assert.ok(Math.abs(kgToLb(100) - 220.462) < 0.01);
  assert.ok(Math.abs(lbToKg(kgToLb(75)) - 75) < 1e-9);
});

// ---- PR / e1RM ---------------------------------------------------------------------

test("Epley e1RM: 60kg × 8 = 76, single rep is the weight, zero stays zero", () => {
  assert.equal(epley(60, 8), 60 * (1 + 8 / 30));
  assert.equal(epley(100, 1), 100);
  assert.equal(epley(0, 5), 0);
  assert.equal(epley(50, 0), 0);
});

test("personal records: heaviest set and best e1RM can be different sets", () => {
  const ws = [
    workout("2026-09-01", [item("Bench Press", [[60, 8], [60, 8], [60, 8]])]),
    workout("2026-09-05", [item("bench press", [[70, 3], [65, 6]]), item("Squat", [[80, 5]])]),
    workout("2026-09-10", [item("Bench Press", [[62.5, 10]])]),
  ];
  const prs = personalRecords(ws);
  assert.deepEqual(prs.map((p) => p.name), ["Bench Press", "Squat"]);
  const bench = prs[0];
  assert.equal(bench.heaviest.weightKg, 70);
  assert.equal(bench.heaviest.reps, 3);
  assert.equal(bench.heaviest.date, "2026-09-05");
  // 62.5 × 10 → 83.3 beats 70 × 3 → 77 and 60 × 8 → 76
  assert.equal(bench.best.weightKg, 62.5);
  assert.equal(bench.best.reps, 10);
  assert.ok(Math.abs(bench.best.e1rm - 62.5 * (1 + 10 / 30)) < 1e-9);
  assert.equal(bench.sessions, 3);
  assert.equal(bench.sets, 6);
  assert.equal(bench.lastDate, "2026-09-10");
});

test("personal records skip zero-weight / zero-rep sets and exercises with none", () => {
  const ws = [workout("2026-09-01", [item("Plank", [[0, 1]]), item("Pull-up", [[0, 0]])])];
  assert.deepEqual(personalRecords(ws), []);
});

test("exercise history is newest first, case-insensitive, with top weight and volume", () => {
  const ws = [
    workout("2026-09-01", [item("Bench Press", [[60, 8], [60, 8]])]),
    workout("2026-09-05", [item("BENCH PRESS", [[70, 3]])]),
    workout("2026-09-05", [item("Squat", [[80, 5]])]),
  ];
  const h = exerciseHistory(ws, "bench press");
  assert.equal(h.length, 2);
  assert.equal(h[0].date, "2026-09-05");
  assert.equal(h[0].topWeightKg, 70);
  assert.equal(h[1].volumeKg, 960);
});

test("workout summary counts exercises, sets and volume", () => {
  const w = workout("2026-09-01", [item("A", [[60, 8], [60, 8]]), item("B", [[20, 12]])]);
  assert.deepEqual(workoutSummary(w), { exercises: 2, sets: 3, volumeKg: 60 * 8 * 2 + 20 * 12 });
});

// ---- macros ------------------------------------------------------------------------

test("day totals sum only that day and round sensibly", () => {
  const meals = [
    { id: "m1", date: "2026-09-13", foodName: "Chicken", servings: 1.5, kcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4, createdAt: ISO },
    { id: "m2", date: "2026-09-13", foodName: "Rice", servings: 1, kcal: 200, proteinG: 4, carbsG: 45, fatG: 0.4, createdAt: ISO },
    { id: "m3", date: "2026-09-12", foodName: "Old", servings: 1, kcal: 999, proteinG: 99, carbsG: 99, fatG: 99, createdAt: ISO },
  ];
  assert.deepEqual(dayTotals(meals, "2026-09-13"), { kcal: 448, proteinG: 50.5, carbsG: 45, fatG: 5.8 });
  assert.deepEqual(dayTotals(meals, "2026-09-11"), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
});

test("scaleFood: Chicken 100g 165/31/0/3.6 × 1.5 servings", () => {
  assert.deepEqual(scaleFood({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }, 1.5), { kcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4 });
});

test("progress vs target clamps to 100 and flags over; no target means 0", () => {
  assert.deepEqual(progressPct(500, 2000), { pct: 25, over: false });
  assert.deepEqual(progressPct(2500, 2000), { pct: 100, over: true });
  assert.deepEqual(progressPct(10, undefined), { pct: 0, over: false });
  assert.equal(remainingOf(500, 2000), 1500);
  assert.equal(remainingOf(500, undefined), null);
});

// ---- weigh-ins -------------------------------------------------------------------

test("weigh-ins sort newest first and the latest feeds the profile", () => {
  const list = [
    { id: "a", date: "2026-09-01", weightKg: 76, createdAt: "2026-09-01T08:00:00.000Z" },
    { id: "b", date: "2026-09-10", weightKg: 75, createdAt: "2026-09-10T08:00:00.000Z" },
    { id: "c", date: "2026-09-10", weightKg: 75.4, createdAt: "2026-09-10T20:00:00.000Z" },
  ];
  assert.deepEqual(sortWeighIns(list).map((w) => w.id), ["c", "b", "a"]);
  assert.equal(latestWeighIn(list).weightKg, 75.4);
  const d = weighInDeltas(list);
  assert.equal(d.get("c"), 0.4);
  assert.equal(d.get("b"), -1);
  assert.equal(d.get("a"), null);
  assert.equal(latestWeighIn([]), null);
});

// ---- rest timer ----------------------------------------------------------------------

test("rest timer seconds: presets, clamp, remaining, format", () => {
  assert.deepEqual([...REST_PRESETS], [60, 90, 120, 180]);
  assert.equal(clampRestSeconds("90"), 90);
  assert.equal(clampRestSeconds(0), 90);
  assert.equal(clampRestSeconds(999999), 3600);
  assert.equal(clampRestSeconds(1), 5);
  const now = 1_000_000;
  const end = endAtFor(90, now);
  assert.equal(remainingSeconds(end, now), 90);
  assert.equal(remainingSeconds(end, now + 30_000), 60);
  assert.equal(remainingSeconds(end, now + 89_100), 1);
  assert.equal(remainingSeconds(end, now + 200_000), 0);
  assert.equal(formatSeconds(90), "1:30");
  assert.equal(formatSeconds(5), "0:05");
  assert.equal(formatSeconds(3600), "1:00:00");
});

// ---- model -----------------------------------------------------------------------------

test("normalizeProfile keeps sane values and drops nonsense", () => {
  const p = normalizeProfile({ sex: "male", age: "30", heightCm: 175, weightKg: 75, activity: "moderate", unitWeight: "lb", targets: { kcal: 2500.4, proteinG: -5, carbsG: 300, fatG: "70" } });
  assert.equal(p.age, 30);
  assert.equal(p.unitWeight, "lb");
  assert.deepEqual(p.targets, { kcal: 2500, carbsG: 300, fatG: 70 });
  assert.deepEqual(normalizeProfile({ sex: "x", age: 3, heightCm: 10, weightKg: -1, activity: "nope" }), {});
  assert.deepEqual(normalizeProfile(null), {});
});

test("normalizeWorkout keeps valid sets, drops broken ones, and needs a date", () => {
  const w = normalizeWorkout({ id: "w1", date: "2026-09-13", name: "Push", items: [{ exerciseName: "Bench", sets: [{ weightKg: 60, reps: 8 }, { weightKg: "x", reps: 8 }, { weightKg: 60, reps: 7.6 }] }, { exerciseName: "" }] });
  assert.equal(w.items.length, 1);
  assert.equal(w.items[0].sets.length, 2);
  assert.equal(w.items[0].sets[1].reps, 8);
  assert.equal(normalizeWorkout({ items: [] }), null);
  assert.equal(normalizeWorkout({ date: "13/09/2026" }), null);
});

test("normalizeFood / normalizeMeal / normalizeWeighIn / normalizeRoutine", () => {
  assert.equal(normalizeFood({ name: "Chicken", kcal: 165 }).proteinG, 0);
  assert.equal(normalizeFood({ name: "", kcal: 165 }), null);
  assert.equal(normalizeFood({ name: "Bad", kcal: -1 }), null);
  assert.equal(normalizeMeal({ date: "2026-09-13", foodName: "X", servings: 0, kcal: 10 }), null);
  assert.equal(normalizeMeal({ date: "2026-09-13", foodName: "X", servings: 2, kcal: 10 }).kcal, 10);
  assert.equal(normalizeWeighIn({ date: "2026-09-13", weightKg: 0 }), null);
  assert.equal(normalizeWeighIn({ date: "2026-09-13", weightKg: "75.5" }).weightKg, 75.5);
  const r = normalizeRoutine({ name: "Push", exerciseNames: ["Bench", "", 3, "Dips"] });
  assert.deepEqual(r.exerciseNames, ["Bench", "Dips"]);
});

test("reconcile sorts lists, drops dangling exercise / food ids, and never caps anything", () => {
  const store = emptyStore();
  store.exercises = [{ id: "e1", name: "Squat", createdAt: ISO }, { id: "e2", name: "Bench", createdAt: ISO }];
  store.workouts = [
    workout("2026-09-01", [{ id: "i1", exerciseId: "gone", exerciseName: "Row", sets: [] }]),
    workout("2026-09-10", []),
  ];
  for (let i = 0; i < 50; i++) store.routines.push({ id: `r${i}`, name: `R${i}`, exerciseNames: ["Bench"], createdAt: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z` });
  store.meals = [{ id: "m1", date: "2026-09-13", foodId: "nope", foodName: "X", servings: 1, kcal: 1, proteinG: 0, carbsG: 0, fatG: 0, createdAt: ISO }];
  const clean = reconcile(store);
  assert.deepEqual(clean.exercises.map((e) => e.name), ["Bench", "Squat"]);
  assert.equal(clean.workouts[0].date, "2026-09-10");
  assert.equal(clean.workouts[1].items[0].exerciseId, undefined);
  assert.equal(clean.meals[0].foodId, undefined);
  assert.equal(clean.routines.length, 50);
  assert.equal(countRows(clean), 2 + 2 + 50 + 1);
});

test("ensureExercise reuses a catalog row case-insensitively, putRow / removeById / newSet", () => {
  const { list, def } = ensureExercise([], "Bench Press", NOW);
  assert.equal(list.length, 1);
  const again = ensureExercise(list, "bench press", NOW);
  assert.equal(again.list.length, 1);
  assert.equal(again.def.id, def.id);
  const w = newWorkout("2026-09-13", "Push", NOW);
  const it = newItem(def);
  const s = newSet(60, 8);
  const withSet = { ...w, items: [{ ...it, sets: [s] }] };
  const list2 = putRow([w], withSet);
  assert.equal(list2.length, 1);
  assert.equal(list2[0].items[0].sets[0].reps, 8);
  assert.equal(removeById(list2, w.id).length, 0);
  assert.equal(shiftDay("2026-09-13", -1), "2026-09-12");
});

// ---- prefs + backup -----------------------------------------------------------------

test("prefs parse with defaults and clamps", () => {
  assert.deepEqual(parsePrefs(null), defaultPrefs());
  const p = parsePrefs({ fontSize: "xl", restSecondsDefault: 45, unitWeight: "lb" });
  assert.deepEqual(p, { fontSize: "xl", restSecondsDefault: 45, unitWeight: "lb" });
  assert.equal(parsePrefs({ fontSize: "huge", unitWeight: "stone" }).unitWeight, "kg");
});

test("JSON backup round-trips every list, the profile and prefs", () => {
  const store = emptyStore();
  store.profile = { sex: "male", age: 30, heightCm: 175, weightKg: 75, activity: "moderate", targets: { kcal: 2633, proteinG: 150, carbsG: 344, fatG: 73 } };
  store.weighins = [{ id: "wi1", date: "2026-09-13", weightKg: 75, createdAt: ISO }];
  store.exercises = [{ id: "e1", name: "Bench Press", createdAt: ISO }];
  store.workouts = [workout("2026-09-13", [{ id: "i1", exerciseId: "e1", exerciseName: "Bench Press", sets: [{ id: "s1", weightKg: 60, reps: 8 }] }], { id: "w1" })];
  store.foods = [{ id: "f1", name: "Chicken 100g", kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, createdAt: ISO }];
  store.meals = [{ id: "m1", date: "2026-09-13", foodId: "f1", foodName: "Chicken 100g", servings: 1.5, kcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4, createdAt: ISO }];
  store.routines = [{ id: "r1", name: "Push", exerciseNames: ["Bench Press"], createdAt: ISO }];
  const prefs = { fontSize: "lg", restSecondsDefault: 120, unitWeight: "kg" };
  const text = toJSON(buildBackup(store, prefs, NOW));
  const parsed = JSON.parse(text);
  assert.equal(parsed.app, "gymac");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.exportedAt, ISO);
  const back = parseBackup(text);
  assert.deepEqual(back.store, reconcile(store));
  assert.deepEqual(back.prefs, prefs);
  assert.equal(backupFilename(NOW), "gymac-backup-2026-09-13.json");
});

test("parseBackup rejects other apps, junk and empty files", () => {
  assert.throws(() => parseBackup(JSON.stringify({ app: "peptidelog", logs: [] })), /not a gymac/);
  assert.throws(() => parseBackup("[]"), /bad shape/);
  assert.throws(() => parseBackup(JSON.stringify({ workouts: [], meals: [] })), /empty/);
  assert.throws(() => parseBackup("nope"));
});

test("fmt trims trailing zeros", () => {
  assert.equal(fmt(60), "60");
  assert.equal(fmt(62.5), "62.5");
  assert.equal(fmt(83.333, 1), "83.3");
});
