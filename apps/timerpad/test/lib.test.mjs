import assert from "node:assert/strict";
import test from "node:test";

import {
  addLap,
  applyPhase,
  elapsedMs,
  expandInterval,
  expandPomodoro,
  formatClock,
  idleCountdown,
  idleStopwatch,
  pauseEngine,
  remainingMs,
  resetEngine,
  startEngine,
} from "../src/lib/clock.ts";
import {
  BACKUP_KIND,
  buildBackup,
  defaultPrefs,
  emptyStore,
  parseBackup,
  parsePrefs,
  parseStore,
} from "../src/lib/store.ts";

test("formatClock pads minutes:seconds and adds hours / hundredths", () => {
  assert.equal(formatClock(0), "0:00");
  assert.equal(formatClock(65_000), "1:05");
  assert.equal(formatClock(3_661_000), "1:01:01");
  assert.equal(formatClock(12_340, true), "0:12.34");
});

test("countdown remaining uses remainingAtStart minus elapsed", () => {
  const now = { perf: 1000, wall: 1_000_000 };
  let e = idleCountdown(10);
  e = startEngine(e, now);
  const later = { perf: 3500, wall: 1_002_500 };
  assert.equal(remainingMs(e, false, later), 7500);
  assert.equal(remainingMs(e, true, later), 7500);
});

test("pause freezes remaining; reset restores the original duration", () => {
  const now = { perf: 0, wall: 0 };
  let e = startEngine(idleCountdown(30), now);
  e = pauseEngine(e, false, { perf: 5000, wall: 5000 });
  assert.equal(e.state, "paused");
  assert.equal(e.remainingAtStartMs, 25_000);
  e = resetEngine(e, 30_000);
  assert.equal(e.state, "idle");
  assert.equal(e.remainingAtStartMs, 30_000);
});

test("stopwatch laps stamp elapsed time; pause freezes elapsed", () => {
  const now = { perf: 10, wall: 10 };
  let e = startEngine(idleStopwatch(), now);
  e = addLap(e, false, { perf: 2010, wall: 2010 });
  assert.equal(e.laps.length, 1);
  assert.equal(e.laps[0], 2000);
  e = pauseEngine(e, false, { perf: 5010, wall: 5010 });
  assert.equal(e.state, "paused");
  assert.equal(elapsedMs(e, false, { perf: 9999, wall: 9999 }), 5000);
});

test("pomodoro expands work/rest/long-rest and applyPhase walks them", () => {
  const steps = expandPomodoro({ workSec: 25, restSec: 5, longRestSec: 15, rounds: 4, longEvery: 2 });
  assert.equal(steps.filter((s) => s.kind === "work").length, 4);
  assert.equal(steps[1].kind, "rest");
  assert.equal(steps[3].kind, "longRest");
  let e = idleCountdown(0);
  e = applyPhase({ ...e, mode: "pomodoro" }, steps, 0, { perf: 0, wall: 0 });
  assert.equal(e.phaseKind, "work");
  assert.equal(e.round, 1);
  e = applyPhase(e, steps, 1, { perf: 1, wall: 1 });
  assert.equal(e.phaseKind, "rest");
});

test("interval config is editable: extra steps and rounds expand", () => {
  const steps = expandInterval({
    name: "custom",
    steps: [
      { kind: "work", seconds: 40 },
      { kind: "rest", seconds: 20 },
      { kind: "work", seconds: 15, label: "sprint" },
    ],
    rounds: 2,
  });
  assert.equal(steps.length, 6);
  assert.equal(steps[2].label, "sprint");
});

test("backup round-trips and rejects a foreign file", () => {
  const store = emptyStore();
  const prefs = defaultPrefs();
  const raw = buildBackup(store, prefs);
  assert.equal(raw.kind, BACKUP_KIND);
  const parsed = parseBackup(JSON.parse(JSON.stringify(raw)));
  assert.ok(parsed);
  assert.equal(parsed.store.routines.length, store.routines.length);
  assert.equal(parseBackup({ kind: "nope" }), null);
});

test("parseStore keeps starter routines when given garbage", () => {
  const s = parseStore({ routines: [null, { kind: "countdown", name: "X", seconds: 90 }] });
  assert.ok(s.routines.some((r) => r.kind === "countdown" && r.seconds === 90));
  assert.equal(parsePrefs({ sound: false, fontSize: "xl" }).sound, false);
  assert.equal(parsePrefs({ fontSize: "nope" }).fontSize, "md");
});
