import assert from "node:assert/strict";
import test from "node:test";

import { buildBackup, parseBackup, toJSON } from "../src/lib/backup.ts";
import { emptySession, neighbour, parseSession, progress, reset, select, tap, undo } from "../src/lib/practice.ts";
import { clampGoal, defaultPrefs, parsePrefs } from "../src/lib/prefs.ts";
import {
  applyFilter,
  bumpPracticeCount,
  normalizeAffirmations,
  normalizeCategories,
  reconcile,
  removeAffirmation,
  removeCategory,
  seedData,
  toggleFavorite,
  upsertAffirmation,
  upsertCategory,
} from "../src/lib/store.ts";

const NOW = "2026-09-12T00:00:00.000Z";

// ---- practice: tap / undo / reset ---------------------------------------

test("tap increments, undo decrements and never goes below zero", () => {
  let s = select(emptySession(), "a1");
  assert.equal(s.taps, 0);
  s = tap(tap(tap(s)));
  assert.equal(s.taps, 3);
  s = undo(s);
  assert.equal(s.taps, 2);
  s = undo(undo(undo(s)));
  assert.equal(s.taps, 0, "floor at 0");
  s = undo(s);
  assert.equal(s.taps, 0, "still 0 after undo on 0");
  assert.equal(reset(tap(tap(s))).taps, 0);
});

test("selecting another line starts at 0; re-selecting the same line keeps the count", () => {
  let s = tap(tap(select(emptySession(), "a1")));
  assert.equal(select(s, "a1").taps, 2);
  s = select(s, "a2");
  assert.equal(s.affirmationId, "a2");
  assert.equal(s.taps, 0);
});

test("progress is clamped 0..1 and a zero goal never fills", () => {
  assert.equal(progress(5, 10), 0.5);
  assert.equal(progress(15, 10), 1);
  assert.equal(progress(0, 10), 0);
  assert.equal(progress(3, 0), 0);
});

test("a stored session survives a reload (parse) and a bad one is empty", () => {
  assert.deepEqual(parseSession({ affirmationId: "x", taps: 4 }), { affirmationId: "x", taps: 4 });
  assert.deepEqual(parseSession({ affirmationId: "x", taps: -3 }), { affirmationId: "x", taps: 0 });
  assert.deepEqual(parseSession({ taps: 9 }), { affirmationId: null, taps: 0 });
  assert.deepEqual(parseSession("junk"), { affirmationId: null, taps: 0 });
});

test("neighbour wraps around the visible list", () => {
  const ids = ["a", "b", "c"];
  assert.equal(neighbour(ids, "a", 1), "b");
  assert.equal(neighbour(ids, "c", 1), "a");
  assert.equal(neighbour(ids, "a", -1), "c");
  assert.equal(neighbour(ids, null, 1), "a");
  assert.equal(neighbour(ids, "zzz", -1), "c");
  assert.equal(neighbour([], "a", 1), null);
});

test("practiceCount follows taps and undo, floored at 0", () => {
  let list = [{ id: "a", text: "x", favorite: false, createdAt: NOW, updatedAt: NOW }];
  list = bumpPracticeCount(bumpPracticeCount(list, "a", 1), "a", 1);
  assert.equal(list[0].practiceCount, 2);
  list = bumpPracticeCount(bumpPracticeCount(bumpPracticeCount(list, "a", -1), "a", -1), "a", -1);
  assert.equal(list[0].practiceCount, undefined, "0 is stored as absent");
});

// ---- affirmations / favorites -----------------------------------------------

test("favorite toggles on and off and bumps updatedAt", () => {
  const base = [{ id: "a", text: "x", favorite: false, createdAt: NOW, updatedAt: NOW }];
  const on = toggleFavorite(base, "a", "2026-09-13T00:00:00.000Z");
  assert.equal(on[0].favorite, true);
  assert.equal(on[0].updatedAt, "2026-09-13T00:00:00.000Z");
  assert.equal(toggleFavorite(on, "a")[0].favorite, false);
  assert.equal(toggleFavorite(base, "nope")[0].favorite, false);
});

test("filter: all / favorites / by topic", () => {
  const list = [
    { id: "a", text: "1", favorite: true, categoryId: "c1", createdAt: NOW, updatedAt: NOW },
    { id: "b", text: "2", favorite: false, categoryId: "c2", createdAt: NOW, updatedAt: NOW },
    { id: "c", text: "3", favorite: true, createdAt: NOW, updatedAt: NOW },
  ];
  assert.equal(applyFilter(list, "all").length, 3);
  assert.deepEqual(applyFilter(list, "fav").map((a) => a.id), ["a", "c"]);
  assert.deepEqual(applyFilter(list, { categoryId: "c1" }).map((a) => a.id), ["a"]);
  assert.deepEqual(applyFilter(list, { categoryId: "none" }), []);
});

test("upsert creates, then edits in place; remove deletes; text is trimmed and capped", () => {
  const created = upsertAffirmation([], { text: "  I am enough.  ", categoryId: "" }, NOW);
  assert.equal(created.list.length, 1);
  assert.equal(created.list[0].text, "I am enough.");
  assert.equal(created.list[0].categoryId, undefined);
  assert.equal(created.list[0].favorite, false);
  const edited = upsertAffirmation(created.list, { id: created.id, text: "I am calm.", categoryId: "c1" }, "2026-09-13T00:00:00.000Z");
  assert.equal(edited.list.length, 1);
  assert.equal(edited.id, created.id);
  assert.equal(edited.list[0].text, "I am calm.");
  assert.equal(edited.list[0].categoryId, "c1");
  assert.equal(edited.list[0].createdAt, NOW);
  assert.equal(edited.list[0].updatedAt, "2026-09-13T00:00:00.000Z");
  const long = upsertAffirmation([], { text: "x".repeat(500) }, NOW);
  assert.equal(long.list[0].text.length, 280);
  assert.deepEqual(removeAffirmation(edited.list, created.id), []);
});

// ---- categories -----------------------------------------------------------

test("category CRUD: create with a colour, rename, delete keeps its affirmations as no-topic", () => {
  const c1 = upsertCategory([], { name: " Calm " }, NOW);
  assert.equal(c1.list[0].name, "Calm");
  assert.match(c1.list[0].color, /^#[0-9a-f]{6}$/);
  const c2 = upsertCategory(c1.list, { name: "Gratitude" }, NOW);
  assert.notEqual(c2.list[1].color, c1.list[0].color, "round-robin colours");
  const renamed = upsertCategory(c2.list, { id: c1.id, name: "Peace" }, NOW);
  assert.equal(renamed.list[0].name, "Peace");
  assert.equal(renamed.list.length, 2);

  const affirmations = [
    { id: "a", text: "1", favorite: false, categoryId: c1.id, createdAt: NOW, updatedAt: NOW },
    { id: "b", text: "2", favorite: true, categoryId: c2.id, createdAt: NOW, updatedAt: NOW },
  ];
  const after = removeCategory(renamed.list, affirmations, c1.id);
  assert.deepEqual(after.categories.map((c) => c.id), [c2.id]);
  assert.equal(after.affirmations[0].categoryId, undefined, "kept, filed under no topic");
  assert.equal(after.affirmations[1].categoryId, c2.id);
  assert.equal(after.affirmations[1].favorite, true, "favorite untouched");
});

test("reconcile drops links to topics that do not exist", () => {
  const cats = [{ id: "c1", name: "Calm", createdAt: NOW }];
  const list = [
    { id: "a", text: "1", favorite: false, categoryId: "c1", createdAt: NOW, updatedAt: NOW },
    { id: "b", text: "2", favorite: false, categoryId: "ghost", createdAt: NOW, updatedAt: NOW },
  ];
  const out = reconcile(list, cats);
  assert.equal(out[0].categoryId, "c1");
  assert.equal(out[1].categoryId, undefined);
});

test("normalize drops damaged rows and duplicates, keeps favorites and counts", () => {
  const list = normalizeAffirmations([
    { id: "a", text: "ok", favorite: true, practiceCount: "3" },
    { id: "a", text: "dup" },
    { id: "", text: "no id" },
    { id: "b", text: "   " },
    { id: "c", text: "count zero", practiceCount: 0 },
    "junk",
  ]);
  assert.deepEqual(list.map((a) => a.id), ["a", "c"]);
  assert.equal(list[0].favorite, true);
  assert.equal(list[0].practiceCount, 3);
  assert.equal(list[1].practiceCount, undefined);
  assert.equal(list[1].favorite, false);
  const cats = normalizeCategories([{ id: "c", name: "Calm", color: "#a78bfa", archived: true }, { id: "c", name: "dup" }, { id: "d", name: "", }]);
  assert.equal(cats.length, 1);
  assert.equal(cats[0].archived, true);
  assert.equal(cats[0].color, "#a78bfa");
});

test("seed data per language: a few topics and lines, one favorite, every line linked to a topic", () => {
  for (const lang of ["ko", "en", "ja", "zh"]) {
    const seed = seedData(lang, NOW);
    assert.equal(seed.categories.length, 3, lang);
    assert.equal(seed.affirmations.length, 5, lang);
    const ids = new Set(seed.categories.map((c) => c.id));
    for (const a of seed.affirmations) assert.ok(ids.has(a.categoryId), `${lang} seed linked`);
    assert.equal(seed.affirmations.filter((a) => a.favorite).length, 1);
  }
  assert.notEqual(seedData("zh", NOW).affirmations[0].text, seedData("en", NOW).affirmations[0].text, "zh is not English");
});

// ---- prefs ----------------------------------------------------------------

test("dark / sound / vibe prefs round-trip through parse, with defaults for junk", () => {
  const d = defaultPrefs();
  assert.equal(d.darkMode, false);
  assert.equal(d.soundEnabled, true);
  assert.equal(d.vibeEnabled, true);
  assert.equal(d.dailyGoal, 10);
  const p = parsePrefs({ darkMode: true, soundEnabled: false, vibeEnabled: false, fontSize: "xl", dailyGoal: 25, lastPracticedDate: "2026-09-12" });
  assert.deepEqual(p, { darkMode: true, soundEnabled: false, vibeEnabled: false, fontSize: "xl", dailyGoal: 25, lastPracticedDate: "2026-09-12" });
  const q = parsePrefs({ darkMode: "yes", fontSize: "huge", dailyGoal: -4, lastPracticedDate: "nope" });
  assert.equal(q.darkMode, false);
  assert.equal(q.fontSize, "md");
  assert.equal(q.dailyGoal, 1);
  assert.equal(q.lastPracticedDate, undefined);
  assert.equal(clampGoal("abc"), 10);
  assert.equal(clampGoal(5000), 999);
  assert.equal(clampGoal("7"), 7);
});

// ---- backup ------------------------------------------------------------

test("JSON backup round-trips affirmations, topics and prefs", () => {
  const seed = seedData("en", NOW);
  const prefs = { ...defaultPrefs(), darkMode: true, dailyGoal: 21 };
  const withCounts = bumpPracticeCount(toggleFavorite(seed.affirmations, seed.affirmations[0].id, NOW), seed.affirmations[1].id, 1);
  const json = toJSON(buildBackup(withCounts, seed.categories, prefs, new Date(NOW)));
  const parsed = JSON.parse(json);
  assert.equal(parsed.app, "affirmpad");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.exportedAt, NOW);

  const back = parseBackup(json);
  assert.deepEqual(back.affirmations, withCounts);
  assert.deepEqual(back.categories, seed.categories);
  assert.deepEqual(back.prefs, prefs);
});

test("a wrong or empty file is rejected and never wipes the pad", () => {
  assert.throws(() => parseBackup(JSON.stringify({ app: "weekpad", categories: [], expenses: [] })));
  assert.throws(() => parseBackup(JSON.stringify({ app: "affirmpad", affirmations: [], categories: [] })), /empty/);
  assert.throws(() => parseBackup(JSON.stringify({ hello: 1 })), /bad shape/);
  assert.throws(() => parseBackup("not json"));
});

test("import drops links to topics missing from the file", () => {
  const back = parseBackup(
    JSON.stringify({
      app: "affirmpad",
      affirmations: [{ id: "a", text: "x", categoryId: "missing" }],
      categories: [],
    }),
  );
  assert.equal(back.affirmations[0].categoryId, undefined);
  assert.equal(back.prefs, null);
});
