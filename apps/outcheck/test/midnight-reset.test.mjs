import assert from "node:assert/strict";
import test from "node:test";

import { localDayKey, msUntilMidnight, pruneChecks, rollover } from "../src/lib/day.ts";

test("localDayKey is the device-local calendar date, zero padded", () => {
  assert.equal(localDayKey(new Date(2026, 8, 4, 7, 42)), "2026-09-04");
  assert.equal(localDayKey(new Date(2026, 0, 1, 0, 0, 1)), "2026-01-01");
  // 23:59 still belongs to the same day; 00:00 the next morning does not.
  assert.equal(localDayKey(new Date(2026, 8, 4, 23, 59, 59)), "2026-09-04");
  assert.equal(localDayKey(new Date(2026, 8, 5, 0, 0, 0)), "2026-09-05");
});

test("stored day != today: every check clears, day moves to today", () => {
  const stored = {
    day: "2026-09-03",
    checks: { door: "2026-09-03T07:42:00.000Z", gas: "2026-09-03T07:43:00.000Z" },
  };
  const next = rollover(stored, "2026-09-04");
  assert.deepEqual(next, { day: "2026-09-04", checks: {} });
  // The stored object itself is untouched — the caller persists `next`.
  assert.equal(Object.keys(stored.checks).length, 2);
});

test("stored day == today: checks are kept exactly as they were", () => {
  const stored = { day: "2026-09-04", checks: { door: "2026-09-04T07:42:00.000Z" } };
  const next = rollover(stored, "2026-09-04");
  assert.equal(next, stored);
  assert.equal(next.checks.door, "2026-09-04T07:42:00.000Z");
});

test("nothing stored yet: today with no checks", () => {
  assert.deepEqual(rollover(null, "2026-09-04"), { day: "2026-09-04", checks: {} });
});

test("rollover never touches the item list (it only knows about checks)", () => {
  // The item list is a separate key; rollover has no argument for it and
  // returns only { day, checks }, so labels and order survive midnight.
  const items = [
    { id: "door", label: null },
    { id: "gas", label: "Stove off" },
    { id: "c-1", label: "Windows closed" },
  ];
  const next = rollover({ day: "2026-09-03", checks: { door: "x", gas: "y" } }, "2026-09-04");
  assert.deepEqual(Object.keys(next), ["day", "checks"]);
  assert.equal(items.length, 3);
  assert.equal(items[1].label, "Stove off");
});

test("pruneChecks drops timestamps for items that were removed", () => {
  const checks = { door: "a", gas: "b", "c-1": "c" };
  assert.deepEqual(pruneChecks(checks, ["door", "c-1"]), { door: "a", "c-1": "c" });
  assert.deepEqual(pruneChecks(checks, []), {});
});

test("msUntilMidnight aims just past the next local 00:00", () => {
  const at = new Date(2026, 8, 4, 23, 0, 0);
  const ms = msUntilMidnight(at);
  assert.equal(ms, 60 * 60 * 1000 + 1000);
  const late = new Date(2026, 8, 4, 23, 59, 59, 900);
  assert.ok(msUntilMidnight(late) >= 1000);
});
