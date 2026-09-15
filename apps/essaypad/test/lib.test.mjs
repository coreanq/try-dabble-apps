import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { addDays, diffDays, formatInt, isDateKey, isWeekend, monthGrid, parseWords, toDateKey, weekdayOf } from "../src/lib/dates.ts";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  OVER_LIMIT_RATIO,
  buildBackup,
  computePace,
  countWriteDays,
  createEssay,
  defaultPrefs,
  historyRows,
  isWriteDay,
  normalizeEssay,
  parseBackup,
  parsePrefs,
  recordWords,
  removeHistoryEntry,
  toJSON,
  updateEssay,
} from "../src/lib/store.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");
const NOW = new Date(2026, 8, 15, 10, 0, 0); // local 2026-09-15 (Tuesday)

/* ---------- dates ---------- */

test("date keys are local, validated, and arithmetic is calendar-based", () => {
  assert.equal(toDateKey(NOW), "2026-09-15");
  assert.ok(isDateKey("2026-09-15"));
  assert.ok(!isDateKey("2026-02-30"), "impossible day rejected");
  assert.ok(!isDateKey("2026-9-5"));
  assert.ok(!isDateKey(20260915));
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(diffDays("2026-09-15", "2026-09-20"), 5);
  assert.equal(diffDays("2026-09-20", "2026-09-15"), -5);
  assert.equal(diffDays("2026-03-28", "2026-03-30"), 2, "DST weekend still two days");
  assert.equal(weekdayOf("2026-09-15"), 2);
  assert.ok(isWeekend("2026-09-19") && isWeekend("2026-09-20"));
  assert.ok(!isWeekend("2026-09-18") && !isWeekend("2026-09-21"));
});

test("monthGrid starts on Monday and covers the whole month", () => {
  const rows = monthGrid("2026-09"); // Sept 1 2026 is a Tuesday
  assert.equal(rows[0][0], null);
  assert.equal(rows[0][1], "2026-09-01");
  const flat = rows.flat().filter(Boolean);
  assert.equal(flat.length, 30);
  assert.equal(flat.at(-1), "2026-09-30");
  for (const r of rows) assert.equal(r.length, 7);
});

test("parseWords accepts thousands separators and rejects junk, formatInt rounds", () => {
  assert.equal(parseWords("1,250"), 1250);
  assert.equal(parseWords(" 3 000 "), 3000);
  assert.equal(parseWords("0"), 0);
  assert.equal(parseWords("-5"), null);
  assert.equal(parseWords("12.5"), null);
  assert.equal(parseWords(""), null);
  assert.equal(parseWords("abc"), null);
  assert.equal(formatInt(1234567, "en-US"), "1,234,567");
});

/* ---------- write days ---------- */

test("write days: all calendar days vs Mon–Fri only, inclusive of both ends", () => {
  // 2026-09-15 (Tue) .. 2026-09-21 (Mon): 7 calendar days, 5 weekdays
  assert.equal(countWriteDays("2026-09-15", "2026-09-21", false), 7);
  assert.equal(countWriteDays("2026-09-15", "2026-09-21", true), 5);
  assert.equal(countWriteDays("2026-09-15", "2026-09-15", false), 1);
  assert.equal(countWriteDays("2026-09-19", "2026-09-20", true), 0, "a weekend-only span has no write days");
  assert.equal(countWriteDays("2026-09-21", "2026-09-15", true), 0, "deadline before today");
  assert.ok(isWriteDay("2026-09-19", false));
  assert.ok(!isWriteDay("2026-09-19", true));
});

/* ---------- pace ---------- */

test("pace: daily target = ceil(remaining / write days left), today through deadline", () => {
  const e = { targetWords: 3000, currentWords: 1240, deadline: "2026-09-21" };
  const all = computePace(e, "2026-09-15", false);
  assert.equal(all.status, "active");
  assert.equal(all.remaining, 1760);
  assert.equal(all.writeDaysLeft, 7);
  assert.equal(all.dailyTarget, Math.ceil(1760 / 7)); // 252
  assert.equal(all.calendarDaysLeft, 6);
  assert.equal(Math.round(all.percent), 41);
  assert.equal(all.done, false);
  assert.equal(all.overLimit, false);

  const wk = computePace(e, "2026-09-15", true);
  assert.equal(wk.writeDaysLeft, 5);
  assert.equal(wk.dailyTarget, 352);
  assert.ok(wk.dailyTarget > all.dailyTarget, "skipping weekends raises the daily target");
});

test("pace: no deadline shows progress but no daily target", () => {
  const p = computePace({ targetWords: 2000, currentWords: 500, deadline: null }, "2026-09-15", false);
  assert.equal(p.status, "noDeadline");
  assert.equal(p.dailyTarget, null);
  assert.equal(p.writeDaysLeft, null);
  assert.equal(p.remaining, 1500);
  assert.equal(p.percent, 25);
});

test("pace: done at or past target, over-limit above 110%", () => {
  const done = computePace({ targetWords: 2000, currentWords: 2000, deadline: "2026-09-30" }, "2026-09-15", false);
  assert.equal(done.status, "done");
  assert.equal(done.dailyTarget, 0);
  assert.equal(done.remaining, 0);
  assert.equal(done.overLimit, false);
  const over = computePace({ targetWords: 2000, currentWords: 2201, deadline: null }, "2026-09-15", false);
  assert.equal(over.status, "done");
  assert.ok(over.overLimit, "2201 > 2000 * 1.1");
  assert.equal(over.barPercent, 100);
  assert.ok(over.percent > 110);
  const edge = computePace({ targetWords: 2000, currentWords: 2200, deadline: null }, "2026-09-15", false);
  assert.equal(edge.overLimit, false, "exactly 110% is not over the limit");
  assert.equal(OVER_LIMIT_RATIO, 1.1);
});

test("pace: past deadline is overdue and the daily target becomes the whole remainder", () => {
  const p = computePace({ targetWords: 3000, currentWords: 1000, deadline: "2026-09-10" }, "2026-09-15", true);
  assert.equal(p.status, "overdue");
  assert.equal(p.overdueDays, 5);
  assert.equal(p.writeDaysLeft, 0);
  assert.equal(p.dailyTarget, 2000);
  assert.equal(p.calendarDaysLeft, -5);
});

test("pace: deadline today, or a weekend-only span with weekdays-only, asks for the remainder today", () => {
  const today = computePace({ targetWords: 1000, currentWords: 400, deadline: "2026-09-15" }, "2026-09-15", false);
  assert.equal(today.status, "active");
  assert.equal(today.writeDaysLeft, 1);
  assert.equal(today.dailyTarget, 600);
  const sat = computePace({ targetWords: 1000, currentWords: 400, deadline: "2026-09-20" }, "2026-09-19", true);
  assert.equal(sat.status, "active");
  assert.equal(sat.writeDaysLeft, 0);
  assert.equal(sat.dailyTarget, 600);
});

/* ---------- essays + history ---------- */

test("createEssay / updateEssay clamp and validate", () => {
  const e = createEssay("  Thesis ch. 2  ", 4000, "2026-10-01", NOW);
  assert.equal(e.title, "Thesis ch. 2");
  assert.equal(e.targetWords, 4000);
  assert.equal(e.deadline, "2026-10-01");
  assert.equal(e.currentWords, 0);
  assert.deepEqual(e.history, []);
  const [u] = updateEssay([e], e.id, { title: "", targetWords: 0, deadline: "nope" }, NOW);
  assert.equal(u.title, "Thesis ch. 2", "empty title keeps the old one");
  assert.equal(u.targetWords, 1);
  assert.equal(u.deadline, null, "clearable deadline");
  const [v] = updateEssay([e], e.id, { deadline: "2026-12-24" }, NOW);
  assert.equal(v.deadline, "2026-12-24");
  assert.equal(createEssay("x", 10, null, NOW).deadline, null);
});

test("recordWords stores the absolute total per day, sorts, merges same-day, and back-dating keeps the newer total", () => {
  let e = createEssay("Essay", 3000, null, NOW);
  e = recordWords(e, 500, "2026-09-12", undefined, NOW);
  e = recordWords(e, 1200, "2026-09-15", "good day", NOW);
  assert.equal(e.currentWords, 1200);
  // back-date an entry between them
  e = recordWords(e, 800, "2026-09-13", undefined, NOW);
  assert.deepEqual(e.history.map((h) => h.date), ["2026-09-12", "2026-09-13", "2026-09-15"]);
  assert.equal(e.currentWords, 1200, "current stays at the latest dated total");
  // same-day overwrite
  e = recordWords(e, 1300, "2026-09-15", undefined, NOW);
  assert.equal(e.history.length, 3);
  assert.equal(e.currentWords, 1300);
  assert.equal(e.history[2].note, undefined, "the newer same-day entry replaces the note");
  // default date is today
  const t = recordWords(createEssay("x", 10, null, NOW), 5, undefined, undefined, NOW);
  assert.equal(t.history[0].date, "2026-09-15");
  // deltas
  const rows = historyRows(e);
  assert.deepEqual(rows.map((r) => r.delta), [500, 300, 500]);
  // removing the last entry rolls current back
  const r = removeHistoryEntry(e, "2026-09-15", NOW);
  assert.equal(r.currentWords, 800);
  assert.equal(removeHistoryEntry(removeHistoryEntry(r, "2026-09-13"), "2026-09-12").currentWords, 0);
});

test("normalizeEssay accepts alternate key names and never throws on junk", () => {
  const e = normalizeEssay({ name: "Novel", goal: "50,000", wordCount: 1200, dueDate: "2026-11-30T00:00:00", log: [{ day: "2026-09-01", total: 1200, memo: "start" }], extra: { deep: true } });
  assert.equal(e.title, "Novel");
  assert.equal(e.targetWords, 50000);
  assert.equal(e.deadline, "2026-11-30");
  assert.equal(e.currentWords, 1200);
  assert.equal(e.history[0].note, "start");
  assert.equal(normalizeEssay(null), null);
  assert.equal(normalizeEssay("x"), null);
  assert.equal(normalizeEssay({ junk: 1 }), null);
  const bare = normalizeEssay({ title: "Only a title" });
  assert.equal(bare.targetWords, 1);
  assert.equal(bare.currentWords, 0);
  const neg = normalizeEssay({ title: "n", targetWords: -5, currentWords: -3, history: [{ date: "bad", words: 1 }, null, 3] });
  assert.equal(neg.targetWords, 1);
  assert.equal(neg.currentWords, 0);
  assert.deepEqual(neg.history, []);
});

test("parsePrefs defaults to all days and no active essay", () => {
  assert.deepEqual(parsePrefs(undefined), defaultPrefs());
  assert.deepEqual(parsePrefs({ weekdaysOnly: true, activeEssayId: "e-1", junk: 1 }), { activeEssayId: "e-1", weekdaysOnly: true });
  assert.equal(parsePrefs({ writeDays: "weekdays" }).weekdaysOnly, true);
});

/* ---------- backup ---------- */

test("backup round-trips through JSON with app/version/exportedAt/essays/prefs", () => {
  let e = createEssay("Essay", 3000, "2026-09-30", NOW);
  e = recordWords(e, 900, "2026-09-14", undefined, NOW);
  const prefs = { activeEssayId: e.id, weekdaysOnly: true };
  const backup = buildBackup([e], prefs, NOW);
  assert.equal(backup.app, BACKUP_APP);
  assert.equal(backup.app, "essaypad");
  assert.equal(backup.version, BACKUP_VERSION);
  assert.equal(backup.version, 1);
  assert.equal(backup.exportedAt, NOW.toISOString());
  const text = toJSON(backup);
  const parsed = parseBackup(JSON.parse(text));
  assert.deepEqual(parsed.essays, [e]);
  assert.deepEqual(parsed.prefs, prefs);
});

test("parseBackup accepts a bare array, {projects}, alternate keys, and drops a dangling active id", () => {
  const bare = parseBackup([{ title: "A", targetWords: 100 }, { title: "B", target: 200, current: 50 }]);
  assert.equal(bare.essays.length, 2);
  assert.equal(bare.essays[1].currentWords, 50);
  assert.equal(bare.prefs.activeEssayId, null);
  const proj = parseBackup({ projects: [{ name: "P", goal: 1000 }], settings: { weekdaysOnly: true, activeEssayId: "missing" } });
  assert.equal(proj.essays[0].title, "P");
  assert.equal(proj.prefs.weekdaysOnly, true);
  assert.equal(proj.prefs.activeEssayId, null);
  assert.equal(parseBackup({ nothing: true }), null);
  assert.equal(parseBackup("str"), null);
  assert.equal(parseBackup(null), null);
  const single = parseBackup({ title: "Solo", targetWords: 500 });
  assert.equal(single.essays.length, 1);
  const dup = parseBackup([{ id: "x", title: "1", targetWords: 1 }, { id: "x", title: "2", targetWords: 1 }]);
  assert.notEqual(dup.essays[0].id, dup.essays[1].id, "duplicate ids are re-keyed");
});

test("the lib never touches the network or the DOM outside download()", () => {
  for (const f of ["store.ts", "dates.ts"]) {
    const src = readFileSync(path.join(APP, "src", "lib", f), "utf8");
    assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|navigator\.sendBeacon/);
  }
  assert.ok(existsSync(path.join(APP, "src", "lib", "store.ts")));
});
