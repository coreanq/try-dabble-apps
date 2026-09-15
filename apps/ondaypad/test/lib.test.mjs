import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  addMonths,
  dateKeyInMonth,
  dateKeyOfAny,
  daysInMonth,
  firstWeekdayOfMonth,
  isDateKey,
  isMmDd,
  isMonthKey,
  mmddOfDateKey,
  monthKey,
  toDateKey,
} from "../src/lib/dates.ts";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  buildBackup,
  createNote,
  defaultPrefs,
  notesForDate,
  notesForMmDd,
  normalizeNote,
  parseBackup,
  parsePrefs,
  removeNote,
  toJSON,
  updateNote,
} from "../src/lib/store.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");
const NOW = new Date(2026, 8, 16, 10, 0, 0); // local 2026-09-16

test("date / month / mmdd helpers", () => {
  assert.equal(toDateKey(NOW), "2026-09-16");
  assert.equal(monthKey(NOW), "2026-09");
  assert.ok(isDateKey("2026-09-16"));
  assert.ok(!isDateKey("2026-02-30"));
  assert.ok(isMonthKey("2026-09"));
  assert.ok(!isMonthKey("2026-13"));
  assert.ok(isMmDd("09-16"));
  assert.ok(!isMmDd("9-16"));
  assert.equal(mmddOfDateKey("2026-09-16"), "09-16");
  assert.equal(addMonths("2026-09", 1), "2026-10");
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(daysInMonth("2026-02"), 28);
  assert.equal(daysInMonth("2024-02"), 29);
  assert.equal(firstWeekdayOfMonth("2026-09"), 2); // Tue
  assert.equal(dateKeyInMonth("2026-09", 5), "2026-09-05");
  assert.equal(dateKeyOfAny("2026-09-16T23:30:00"), "2026-09-16");
});

test("create / update / remove notes", () => {
  let notes = [];
  const a = createNote("2026-09-16", "coffee with mom", "Morning", NOW);
  const b = createNote("2024-09-16", "moved apartments", undefined, NOW);
  const c = createNote("2026-09-15", "other day", undefined, NOW);
  notes = [a, b, c];
  assert.equal(notesForDate(notes, "2026-09-16").length, 1);
  assert.equal(notesForDate(notes, "2026-09-16")[0].title, "Morning");
  notes = updateNote(notes, a.id, { body: "updated body", title: "" }, NOW);
  assert.equal(notes.find((n) => n.id === a.id).body, "updated body");
  assert.equal(notes.find((n) => n.id === a.id).title, undefined);
  notes = removeNote(notes, c.id);
  assert.equal(notes.length, 2);
});

test("this day across years stacks by MM-DD", () => {
  const notes = [
    createNote("2026-09-16", "this year", "2026", NOW),
    createNote("2024-09-16", "two years ago", "2024", NOW),
    createNote("2025-09-16", "last year", "2025", NOW),
    createNote("2025-09-17", "wrong day", undefined, NOW),
  ];
  const newest = notesForMmDd(notes, "09-16", "newest");
  assert.deepEqual(newest.map((g) => g.year), [2026, 2025, 2024]);
  assert.equal(newest[0].notes[0].body, "this year");
  const oldest = notesForMmDd(notes, "09-16", "oldest");
  assert.deepEqual(oldest.map((g) => g.year), [2024, 2025, 2026]);
  assert.equal(notesForMmDd(notes, "01-01").length, 0);
});

test("normalizeNote is forgiving; junk returns null", () => {
  assert.ok(normalizeNote({ date: "2026-09-16", text: "hello" }));
  assert.ok(normalizeNote({ day: "2026-09-16", memo: "x", heading: "H" }));
  assert.equal(normalizeNote({ date: "nope", body: "x" }), null);
  assert.equal(normalizeNote({ date: "2026-09-16" }), null);
});

test("JSON backup round-trip and legacy shapes", () => {
  const notes = [createNote("2026-09-16", "hi", "T", NOW), createNote("2024-09-16", "then", undefined, NOW)];
  const prefs = defaultPrefs(NOW);
  prefs.selectedMmDd = "09-16";
  prefs.stackOrder = "oldest";
  const backup = buildBackup(notes, prefs, NOW);
  assert.equal(backup.app, BACKUP_APP);
  assert.equal(backup.version, BACKUP_VERSION);
  assert.equal(backup.app, "ondaypad");
  const json = toJSON(backup);
  const parsed = parseBackup(JSON.parse(json));
  assert.ok(parsed);
  assert.equal(parsed.notes.length, 2);
  assert.equal(parsed.prefs.stackOrder, "oldest");
  assert.equal(parsed.prefs.selectedMmDd, "09-16");

  const bare = parseBackup([{ date: "2023-09-16", body: "bare" }]);
  assert.ok(bare);
  assert.equal(bare.notes.length, 1);

  const entries = parseBackup({ entries: [{ day: "2022-09-16", content: "legacy" }], settings: { stackOrder: "newest" } });
  assert.ok(entries);
  assert.equal(entries.notes[0].body, "legacy");

  assert.equal(parseBackup({ nope: true }), null);
  assert.equal(parsePrefs({ viewMode: "stack", stackOrder: "oldest", activeMonth: "2026-09", selectedMmDd: "09-16" }).viewMode, "stack");
});

test("static assets name the product and carry ads.txt + naver shell", () => {
  const index = readFileSync(path.join(APP, "index.html"), "utf8");
  assert.match(index, /온데이패드/);
  assert.match(index, /naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751"/);
  assert.match(index, /ondaypad\.try-dabble\.com/);
  const ads = readFileSync(path.join(APP, "public", "ads.txt"), "utf8").trim();
  assert.equal(ads, "google.com, pub-1343411537040925, DIRECT, f08c47fec0942fa0");
  assert.ok(existsSync(path.join(APP, "public", "sw.js")));
  assert.match(readFileSync(path.join(APP, "public", "sw.js"), "utf8"), /ondaypad-v1/);
});
