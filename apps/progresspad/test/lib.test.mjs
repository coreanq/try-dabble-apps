import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { addDays, dateKeyOfAny, formatInt, isDateKey, parseDecimal, parseIntStrict, splitMinutes, toDateKey } from "../src/lib/dates.ts";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  DEFAULT_MINUTES_PER_PERCENT,
  addLog,
  buildBackup,
  computeProgress,
  createTask,
  defaultPrefs,
  elapsedMinutes,
  normalizeTask,
  parseBackup,
  parsePrefs,
  parseTimer,
  removeLog,
  stageOf,
  toJSON,
  totalMinutes,
  updateLog,
  updateTask,
} from "../src/lib/store.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");
const NOW = new Date(2026, 8, 16, 10, 0, 0); // local 2026-09-16 (Wednesday)

/* ---------- dates ---------- */

test("date keys are local and validated; parsers reject junk", () => {
  assert.equal(toDateKey(NOW), "2026-09-16");
  assert.ok(isDateKey("2026-09-16"));
  assert.ok(!isDateKey("2026-02-30"), "impossible day rejected");
  assert.ok(!isDateKey("2026-9-5"));
  assert.ok(!isDateKey(20260916));
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(dateKeyOfAny("2026-09-16T23:30:00"), "2026-09-16");
  assert.equal(dateKeyOfAny("nope"), null);
  assert.equal(parseIntStrict("1,250"), 1250);
  assert.equal(parseIntStrict(" 45 "), 45);
  assert.equal(parseIntStrict("-5"), null);
  assert.equal(parseIntStrict("12.5"), null);
  assert.equal(parseIntStrict(""), null);
  assert.equal(parseDecimal("2.5"), 2.5);
  assert.equal(parseDecimal("40"), 40);
  assert.equal(parseDecimal("abc"), null);
  assert.equal(formatInt(1234567, "en-US"), "1,234,567");
  assert.deepEqual(splitMinutes(1460), { h: 24, m: 20 });
  assert.deepEqual(splitMinutes(59), { h: 0, m: 59 });
});

/* ---------- progress math ---------- */

test("hours mode: ratio = total minutes / (target hours * 60), percent rounded", () => {
  let task = createTask("Thesis", { targetMode: "hours", targetHours: 40 }, NOW);
  task = addLog(task, 90, "2026-09-15", "ch 2", NOW);
  task = addLog(task, 45, "2026-09-14", undefined, NOW);
  task = addLog(task, 120, "2026-09-12", undefined, NOW);
  assert.equal(totalMinutes(task), 255);
  const p = computeProgress(task);
  assert.equal(p.mode, "hours");
  assert.equal(p.targetMinutes, 2400);
  assert.equal(p.totalMinutes, 255);
  assert.ok(Math.abs(p.ratio - 255 / 2400) < 1e-12);
  assert.equal(p.percent, Math.round((255 / 2400) * 100)); // 11
  assert.equal(p.percent, 11);
  assert.equal(p.remainingMinutes, 2145);
  assert.equal(p.done, false);
  assert.equal(p.over, false);
  assert.equal(p.stage, 0);
  // fractional hours target
  const half = computeProgress(addLog(createTask("x", { targetMode: "hours", targetHours: 2.5 }, NOW), 75, "2026-09-16", undefined, NOW));
  assert.equal(half.targetMinutes, 150);
  assert.equal(half.percent, 50);
  assert.equal(half.stage, 2);
});

test("percent mode: earned = minutes / minutesPerPercent, ratio = earned / targetPercent", () => {
  let task = createTask("Exam prep", { targetMode: "percent", targetPercent: 100 }, NOW);
  task = addLog(task, 300, "2026-09-15", undefined, NOW); // 300 / 30 = 10%
  const p = computeProgress(task, 30);
  assert.equal(p.mode, "percent");
  assert.equal(p.earnedPercent, 10);
  assert.equal(p.targetPercent, 100);
  assert.equal(p.targetMinutes, 3000);
  assert.equal(p.ratio, 0.1);
  assert.equal(p.percent, 10);
  assert.equal(p.remainingMinutes, 2700);
  // different rate: 15 min = 1% doubles the earned percent
  const fast = computeProgress(task, 15);
  assert.equal(fast.earnedPercent, 20);
  assert.equal(fast.percent, 20);
  // a 50% target with 30 min = 1%: 900 min = 30% earned = 60% of the target
  const t50 = computeProgress({ ...task, targetPercent: 50, logs: [{ id: "a", date: "2026-09-10", minutes: 900, createdAt: NOW.toISOString() }] }, 30);
  assert.equal(t50.earnedPercent, 30);
  assert.equal(t50.ratio, 0.6);
  assert.equal(t50.percent, 60);
  assert.equal(t50.stage, 2);
  // default rate is 30
  assert.equal(DEFAULT_MINUTES_PER_PERCENT, 30);
  assert.equal(computeProgress(task).earnedPercent, 10);
});

test("over 100%: bar stays full, done and over are set, remaining is 0, nothing is negative", () => {
  let task = createTask("Short", { targetMode: "hours", targetHours: 1 }, NOW);
  task = addLog(task, 90, "2026-09-16", undefined, NOW);
  const p = computeProgress(task);
  assert.equal(p.percent, 150);
  assert.equal(p.barPercent, 100);
  assert.equal(p.done, true);
  assert.equal(p.over, true);
  assert.equal(p.remainingMinutes, 0);
  assert.equal(p.overMinutes, 30);
  assert.equal(p.stage, 4);
  const exact = computeProgress(addLog(createTask("E", { targetMode: "hours", targetHours: 1 }, NOW), 60, "2026-09-16", undefined, NOW));
  assert.equal(exact.done, true);
  assert.equal(exact.over, false, "exactly 100% is done, not over");
  assert.equal(exact.stage, 4);
});

test("stages sit at 0 / 25 / 50 / 75 / 100%+ and only depend on the ratio (no decay)", () => {
  assert.equal(stageOf(0), 0);
  assert.equal(stageOf(0.249), 0);
  assert.equal(stageOf(0.25), 1);
  assert.equal(stageOf(0.5), 2);
  assert.equal(stageOf(0.75), 3);
  assert.equal(stageOf(0.999), 3);
  assert.equal(stageOf(1), 4);
  assert.equal(stageOf(7), 4);
  // an empty task days later is still a seed, never a dead plant
  const old = createTask("Old", { targetMode: "hours", targetHours: 10 }, new Date(2025, 0, 1));
  assert.equal(computeProgress(old).stage, 0);
});

test("editing or deleting a log recomputes immediately", () => {
  let task = createTask("T", { targetMode: "hours", targetHours: 2 }, NOW);
  task = addLog(task, 30, "2026-09-16", undefined, NOW);
  task = addLog(task, 30, "2026-09-15", undefined, NOW);
  assert.equal(computeProgress(task).percent, 50);
  const id = task.logs[0].id;
  task = updateLog(task, id, { minutes: 90, date: "2026-09-10", note: "moved" }, NOW);
  assert.equal(computeProgress(task).percent, 100);
  const moved = task.logs.find((l) => l.id === id);
  assert.equal(moved.date, "2026-09-10");
  assert.equal(moved.note, "moved");
  assert.equal(task.logs[0].date, "2026-09-15", "logs stay newest-first after an edit");
  task = updateLog(task, id, { note: "" }, NOW);
  assert.equal(task.logs.find((l) => l.id === id).note, undefined);
  task = removeLog(task, id, NOW);
  assert.equal(computeProgress(task).percent, 25);
  assert.equal(task.logs.length, 1);
  assert.equal(computeProgress(removeLog(task, task.logs[0].id, NOW)).percent, 0);
});

/* ---------- tasks + logs ---------- */

test("createTask / updateTask clamp and validate; switching mode keeps the logs", () => {
  const h = createTask("  Thesis ch. 3  ", { targetMode: "hours", targetHours: 40 }, NOW);
  assert.equal(h.title, "Thesis ch. 3");
  assert.equal(h.targetMode, "hours");
  assert.equal(h.targetHours, 40);
  assert.equal(h.targetPercent, undefined);
  assert.deepEqual(h.logs, []);
  const p = createTask("Prep", { targetMode: "percent", targetPercent: 100 }, NOW);
  assert.equal(p.targetMode, "percent");
  assert.equal(p.targetPercent, 100);
  assert.equal(p.targetHours, undefined);
  const withLog = addLog(h, 60, "2026-09-16", undefined, NOW);
  const [u] = updateTask([withLog], h.id, { title: "", targetHours: 0 }, NOW);
  assert.equal(u.title, "Thesis ch. 3", "empty title keeps the old one");
  assert.equal(u.targetHours, 0.1, "hours clamp to a minimum of 0.1");
  const [sw] = updateTask([withLog], h.id, { targetMode: "percent", targetPercent: 80 }, NOW);
  assert.equal(sw.targetMode, "percent");
  assert.equal(sw.targetPercent, 80);
  assert.equal(sw.targetHours, undefined);
  assert.equal(sw.logs.length, 1, "logs survive a target-mode change");
  const [back] = updateTask([sw], h.id, { targetMode: "hours", targetHours: 12 }, NOW);
  assert.equal(back.targetHours, 12);
  assert.equal(back.targetPercent, undefined);
  assert.equal(createTask("x", { targetMode: "percent", targetPercent: 0 }, NOW).targetPercent, 1);
});

test("addLog defaults to today, allows past dates, keeps same-day logs separate, sorts newest first", () => {
  let task = createTask("T", { targetMode: "hours", targetHours: 10 }, NOW);
  task = addLog(task, 25, undefined, undefined, NOW);
  assert.equal(task.logs[0].date, "2026-09-16");
  task = addLog(task, 50, "2026-09-01", "back-dated", NOW);
  task = addLog(task, 25, "2026-09-16", undefined, NOW);
  assert.equal(task.logs.length, 3, "two logs on the same day both count");
  assert.deepEqual(task.logs.map((l) => l.date), ["2026-09-16", "2026-09-16", "2026-09-01"]);
  assert.equal(totalMinutes(task), 100);
  assert.equal(task.logs[2].note, "back-dated");
  assert.equal(addLog(task, 0.4, "2026-09-16", undefined, NOW).logs[0].minutes, 1, "minutes clamp to at least 1");
  assert.equal(addLog(task, 99999, "2026-09-16", undefined, NOW).logs[0].minutes, 1440, "minutes clamp to a day");
  assert.equal(addLog(task, 10, "2026-13-40", undefined, NOW).logs[0].date, "2026-09-16", "a bad date falls back to today");
});

test("normalizeTask accepts alternate key names and never throws on junk", () => {
  const t = normalizeTask({ name: "Novel", hours: "50", sessions: [{ day: "2026-09-01", mins: 40, memo: "start" }, { date: "2026-09-02", hours: 1.5 }], extra: { deep: true } });
  assert.equal(t.title, "Novel");
  assert.equal(t.targetMode, "hours");
  assert.equal(t.targetHours, 50);
  assert.equal(t.logs.length, 2);
  assert.equal(t.logs[1].note, "start");
  assert.equal(t.logs[0].minutes, 90, "hours in a log convert to minutes");
  const pct = normalizeTask({ title: "P", targetPercent: 100, logs: [{ date: "2026-09-01", minutes: 30 }] });
  assert.equal(pct.targetMode, "percent");
  assert.equal(pct.targetPercent, 100);
  const generic = normalizeTask({ title: "G", target: 12 });
  assert.equal(generic.targetMode, "hours");
  assert.equal(generic.targetHours, 12);
  assert.equal(normalizeTask(null), null);
  assert.equal(normalizeTask("x"), null);
  assert.equal(normalizeTask({ junk: 1 }), null);
  const bare = normalizeTask({ title: "Only a title" });
  assert.equal(bare.targetMode, "hours");
  assert.equal(bare.targetHours, 1);
  const neg = normalizeTask({ title: "n", targetHours: -5, logs: [{ date: "bad", minutes: 1 }, { date: "2026-09-01", minutes: -3 }, null, 3] });
  assert.equal(neg.targetHours, 1, "a non-positive target falls back to 1h");
  assert.deepEqual(neg.logs, []);
  const explicit = normalizeTask({ title: "m", targetMode: "percent", targetHours: 5 });
  assert.equal(explicit.targetMode, "percent");
  assert.equal(explicit.targetPercent, 100);
});

test("parsePrefs defaults to the plant stage, 30 min per percent and no active task", () => {
  assert.deepEqual(parsePrefs(undefined), defaultPrefs());
  assert.deepEqual(parsePrefs({ stageVisual: "blocks", activeTaskId: "t-1", minutesPerPercent: 20, junk: 1 }), { activeTaskId: "t-1", stageVisual: "blocks", minutesPerPercent: 20 });
  assert.equal(parsePrefs({ stageVisual: "wilted" }).stageVisual, "plant", "unknown visuals fall back to the plant");
  assert.equal(parsePrefs({ stageVisual: false }).stageVisual, "off");
  assert.equal(parsePrefs({ minutesPerPercent: 0 }).minutesPerPercent, 30);
  assert.equal(parsePrefs({ minutesPerPercent: "45" }).minutesPerPercent, 45);
});

test("the optional timer: elapsed minutes are whole and never negative; state parses defensively", () => {
  const start = NOW.getTime();
  assert.equal(elapsedMinutes(start, start + 25 * 60_000 + 59_000), 25);
  assert.equal(elapsedMinutes(start, start + 30_000), 0);
  assert.equal(elapsedMinutes(start, start - 1000), 0);
  assert.equal(elapsedMinutes(NaN, start), 0);
  assert.deepEqual(parseTimer({ taskId: "t-1", startedAt: start }), { taskId: "t-1", startedAt: start });
  assert.equal(parseTimer({ taskId: "", startedAt: start }), null);
  assert.equal(parseTimer({ taskId: "t-1" }), null);
  assert.equal(parseTimer(null), null);
});

/* ---------- backup ---------- */

test("backup round-trips through JSON with app/version/exportedAt/tasks/prefs", () => {
  let task = createTask("Thesis", { targetMode: "hours", targetHours: 40 }, NOW);
  task = addLog(task, 90, "2026-09-15", "ch 2", NOW);
  const pct = createTask("Prep", { targetMode: "percent", targetPercent: 100 }, NOW);
  const prefs = { activeTaskId: pct.id, stageVisual: "blocks", minutesPerPercent: 20 };
  const backup = buildBackup([task, pct], prefs, NOW);
  assert.equal(backup.app, BACKUP_APP);
  assert.equal(backup.app, "progresspad");
  assert.equal(backup.version, BACKUP_VERSION);
  assert.equal(backup.version, 1);
  assert.equal(backup.exportedAt, NOW.toISOString());
  const text = toJSON(backup);
  const parsed = parseBackup(JSON.parse(text));
  assert.deepEqual(parsed.tasks, [task, pct]);
  assert.deepEqual(parsed.prefs, prefs);
  assert.equal(computeProgress(parsed.tasks[0]).totalMinutes, 90);
});

test("parseBackup accepts a bare array, {projects}, alternate keys, and drops a dangling active id", () => {
  const bare = parseBackup([{ title: "A", targetHours: 10 }, { title: "B", percent: 100, sessions: [{ date: "2026-09-01", minutes: 30 }] }]);
  assert.equal(bare.tasks.length, 2);
  assert.equal(bare.tasks[1].targetMode, "percent");
  assert.equal(totalMinutes(bare.tasks[1]), 30);
  assert.equal(bare.prefs.activeTaskId, null);
  const proj = parseBackup({ projects: [{ name: "P", hours: 8 }], settings: { stageVisual: "off", activeTaskId: "missing" } });
  assert.equal(proj.tasks[0].title, "P");
  assert.equal(proj.prefs.stageVisual, "off");
  assert.equal(proj.prefs.activeTaskId, null);
  assert.equal(parseBackup({ nothing: true }), null);
  assert.equal(parseBackup("str"), null);
  assert.equal(parseBackup(null), null);
  const single = parseBackup({ title: "Solo", targetHours: 5 });
  assert.equal(single.tasks.length, 1);
  const dup = parseBackup([{ id: "x", title: "1", targetHours: 1 }, { id: "x", title: "2", targetHours: 1 }]);
  assert.notEqual(dup.tasks[0].id, dup.tasks[1].id, "duplicate ids are re-keyed");
});

test("the lib never touches the network or the DOM outside download()", () => {
  for (const f of ["store.ts", "dates.ts"]) {
    const src = readFileSync(path.join(APP, "src", "lib", f), "utf8");
    assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|navigator\.sendBeacon/);
  }
  assert.ok(existsSync(path.join(APP, "src", "lib", "store.ts")));
});
