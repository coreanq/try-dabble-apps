import assert from "node:assert/strict";
import test from "node:test";

import { addDays, daysBetween, isDateStr, parseDate, toDateStr } from "../src/lib/dates.ts";
import { formatDistance, fromMiles, kmToMiles, milesToKm, parseNumber, stepsToMiles, toMiles } from "../src/lib/units.ts";
import { logsForRoute, normalizeLogs } from "../src/lib/logs.ts";
import { activeDates, currentStreak, longestStreak, milesFor, newlyUnlocked, progressFor, snapshot, statsFor } from "../src/lib/progress.ts";
import { PRESET_ROUTES, allRoutes, findRoute, normalizeRoute, normalizeRoutes } from "../src/lib/routes.ts";
import { buildBackup, parseBackup, toJSON } from "../src/lib/backup.ts";
import { defaultPrefs, parsePrefs } from "../src/lib/prefs.ts";
import { pointAt } from "../src/lib/trail-path.ts";

const PCT = PRESET_ROUTES.find((r) => r.id === "pct");
const AT = PRESET_ROUTES.find((r) => r.id === "at");

let seq = 0;
function log(routeId, miles, date, extra = {}) {
  seq += 1;
  const createdAt = new Date(Date.UTC(2026, 0, 1, 0, 0, seq)).toISOString();
  return { id: `l${seq}`, routeId, miles, date, source: "manual", createdAt, updatedAt: createdAt, ...extra };
}

// ---- dates ----------------------------------------------------------------

test("date strings: parse, format, add, diff", () => {
  assert.ok(isDateStr("2026-09-11"));
  assert.ok(!isDateStr("2026-02-30"));
  assert.ok(!isDateStr("2026-9-1"));
  assert.equal(toDateStr(parseDate("2026-12-31")), "2026-12-31");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(daysBetween("2026-09-01", "2026-09-11"), 10);
});

// ---- units ------------------------------------------------------------------

test("miles / km conversion round-trips and toMiles rounds to 3 decimals", () => {
  assert.equal(Math.round(milesToKm(1) * 1000) / 1000, 1.609);
  assert.equal(Math.round(kmToMiles(1.609344) * 1000) / 1000, 1);
  assert.equal(toMiles(10, "mi"), 10);
  assert.equal(toMiles(10, "km"), 6.214);
  assert.equal(Math.round(fromMiles(6.214, "km") * 100) / 100, 10);
  assert.equal(formatDistance(10, "mi", "en-US", "mi"), "10 mi");
  assert.equal(formatDistance(10, "km", "en-US", "km"), "16.1 km");
  assert.equal(formatDistance(2650, "mi", "en-US", "mi", 0), "2,650 mi");
});

test("parseNumber accepts thousands marks and decimal commas", () => {
  assert.equal(parseNumber("8,000"), 8000);
  assert.equal(parseNumber("12.5"), 12.5);
  assert.equal(parseNumber("12,5"), 12.5);
  assert.equal(parseNumber("1 234"), 1234);
  assert.ok(Number.isNaN(parseNumber("")));
  assert.ok(Number.isNaN(parseNumber("abc")));
});

test("steps → miles at the reader's stride, default 2,000 steps per mile", () => {
  assert.equal(stepsToMiles(2000), 1);
  assert.equal(stepsToMiles(8000), 4);
  assert.equal(stepsToMiles(8000, 2100), 3.81);
  assert.equal(stepsToMiles(0), 0);
  assert.equal(stepsToMiles(-5), 0);
  assert.equal(stepsToMiles(1000, 0), 0.5); // bad stride falls back to the default
});

// ---- progress and milestones ----------------------------------------------

test("progress % and remaining follow the route's log only", () => {
  const logs = [log("pct", 10, "2026-09-01"), log("at", 50, "2026-09-01")];
  const p = progressFor(PCT, logs);
  assert.equal(p.miles, 10);
  assert.equal(p.totalMiles, 2650);
  assert.equal(p.percent, 0.4);
  assert.equal(p.remaining, 2640);
  assert.equal(p.entries, 1);
  assert.equal(p.done, false);
  assert.equal(milesFor(logs, "at"), 50);
});

test("milestones unlock when the running total crosses them, dated by the crossing entry", () => {
  const logs = [log("pct", 60, "2026-09-01"), log("pct", 60, "2026-09-03")];
  const p = progressFor(PCT, logs);
  const campo = p.milestones.find((m) => m.milestone.id === "pct-campo");
  const warner = p.milestones.find((m) => m.milestone.id === "pct-warner");
  const km = p.milestones.find((m) => m.milestone.id === "pct-km");
  assert.equal(campo.unlocked, true);
  assert.equal(campo.unlockedOn, "2026-09-01");
  assert.equal(warner.unlocked, true, "109 mi crossed by 120 total");
  assert.equal(warner.unlockedOn, "2026-09-03");
  assert.equal(km.unlocked, false);
  assert.equal(p.next.milestone.id, "pct-km");
});

test("unlock dates follow calendar order, not entry order", () => {
  const later = log("pct", 100, "2026-09-05");
  const earlier = log("pct", 20, "2026-09-02");
  const p = progressFor(PCT, [later, earlier]);
  const warner = p.milestones.find((m) => m.milestone.id === "pct-warner");
  assert.equal(warner.unlockedOn, "2026-09-05");
});

test("newlyUnlocked reports only the milestones this change crossed (not the 0-mile start)", () => {
  const before = progressFor(PCT, [log("pct", 50, "2026-09-01")]);
  const after = progressFor(PCT, [log("pct", 50, "2026-09-01"), log("pct", 70, "2026-09-02")]);
  const fresh = newlyUnlocked(before, after);
  assert.deepEqual(fresh.map((m) => m.milestone.id), ["pct-warner"]);
  assert.deepEqual(newlyUnlocked(null, before).map((m) => m.milestone.id), []);
});

test("editing or deleting an entry recalculates and can re-lock a milestone", () => {
  const a = log("pct", 60, "2026-09-01");
  const b = log("pct", 60, "2026-09-02");
  assert.equal(progressFor(PCT, [a, b]).milestones.find((m) => m.milestone.id === "pct-warner").unlocked, true);
  const edited = { ...b, miles: 20 };
  assert.equal(progressFor(PCT, [a, edited]).milestones.find((m) => m.milestone.id === "pct-warner").unlocked, false);
  assert.equal(progressFor(PCT, [a]).miles, 60);
});

test("a route completes when the log reaches its total", () => {
  const p = progressFor(AT, [log("at", 2000, "2026-01-01"), log("at", 200, "2026-01-02")]);
  assert.equal(p.done, true);
  assert.equal(p.ratio, 1);
  assert.equal(p.remaining, 0);
  assert.equal(p.completedOn, "2026-01-02");
  assert.equal(p.next, null);
});

test("multi-route: switching the active route never touches the other route's progress", () => {
  const logs = [log("pct", 30, "2026-09-01"), log("at", 12, "2026-09-02"), log("pct", 5, "2026-09-03")];
  // "Switch" is only a pointer in prefs; the log is shared and keyed by route.
  const prefsOnPct = { ...defaultPrefs(), activeRouteId: "pct" };
  const prefsOnAt = { ...prefsOnPct, activeRouteId: "at" };
  assert.equal(progressFor(findRoute(PRESET_ROUTES, prefsOnPct.activeRouteId), logs).miles, 35);
  assert.equal(progressFor(findRoute(PRESET_ROUTES, prefsOnAt.activeRouteId), logs).miles, 12);
  // Coming back to PCT still shows 35.
  assert.equal(progressFor(findRoute(PRESET_ROUTES, "pct"), logs).miles, 35);
  const snap = snapshot(PRESET_ROUTES, logs);
  assert.ok(snap.pct.unlockedMilestoneIds.includes("pct-campo"));
  assert.ok(snap.at.unlockedMilestoneIds.includes("at-springer"));
  assert.equal(snap.cdt, undefined, "routes with no entries have no snapshot");
});

test("logsForRoute lists that route only, newest first", () => {
  const logs = [log("pct", 1, "2026-09-01"), log("at", 2, "2026-09-05"), log("pct", 3, "2026-09-03")];
  assert.deepEqual(logsForRoute(logs, "pct").map((l) => l.miles), [3, 1]);
});

// ---- stats and streaks ------------------------------------------------------

test("streaks: consecutive days with a log, current survives until the day after a miss", () => {
  const dates = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-06", "2026-09-07"];
  assert.equal(longestStreak(dates), 3);
  assert.equal(currentStreak(dates, "2026-09-07"), 2);
  assert.equal(currentStreak(dates, "2026-09-08"), 2, "yesterday still counts");
  assert.equal(currentStreak(dates, "2026-09-09"), 0);
  assert.equal(longestStreak([]), 0);
  assert.equal(currentStreak([], "2026-09-09"), 0);
});

test("statsFor: total miles across routes, active days, streaks", () => {
  const logs = [
    log("pct", 2, "2026-09-01"),
    log("pct", 3, "2026-09-01"),
    log("at", 4, "2026-09-02"),
    log("cdt", 1.5, "2026-09-03"),
  ];
  const s = statsFor(logs, "2026-09-03");
  assert.equal(s.totalMiles, 10.5);
  assert.equal(s.activeDays, 3);
  assert.equal(s.currentStreak, 3);
  assert.equal(s.longestStreak, 3);
  assert.deepEqual(activeDates(logs), ["2026-09-01", "2026-09-02", "2026-09-03"]);
});

// ---- custom routes ----------------------------------------------------------

test("custom route create: normalized, milestones sorted and clamped to the total", () => {
  const raw = {
    id: "c1",
    kind: "custom",
    name: "Lake loop",
    totalMiles: 62.137,
    milestones: [
      { id: "m2", milesFromStart: 40, name: "Far shore" },
      { id: "m1", milesFromStart: 10, name: "Boathouse" },
      { id: "bad", milesFromStart: 99, name: "Too far" },
      { id: "m3", milesFromStart: "20", name: { en: "Bridge", ko: "다리" } },
    ],
  };
  const r = normalizeRoute(raw);
  assert.equal(r.kind, "custom");
  assert.equal(r.name, "Lake loop");
  assert.deepEqual(r.milestones.map((m) => m.id), ["m1", "m3", "m2"]);
  assert.equal(r.milestones[1].name, "Bridge");
  assert.equal(normalizeRoute({ id: "x", name: "", totalMiles: 5 }), null);
  assert.equal(normalizeRoute({ id: "x", name: "No distance", totalMiles: 0 }), null);
  assert.equal(normalizeRoute({ id: "pct", kind: "preset", name: "PCT", totalMiles: 1 }), null, "presets ship with the code");
  const all = allRoutes([r]);
  assert.equal(all[all.length - 1].id, "c1");
  assert.equal(all.length, PRESET_ROUTES.length + 1);
  // A custom route logs and unlocks like a preset.
  const p = progressFor(r, [log("c1", 25, "2026-09-01")]);
  assert.equal(p.milestones.filter((m) => m.unlocked).length, 2);
  assert.equal(p.next.milestone.id, "m2");
});

test("normalizeRoutes drops ids that collide with a preset and duplicates", () => {
  const out = normalizeRoutes([
    { id: "pct", kind: "custom", name: "fake", totalMiles: 10 },
    { id: "c1", name: "one", totalMiles: 10 },
    { id: "c1", name: "again", totalMiles: 20 },
  ]);
  assert.deepEqual(out.map((r) => r.id), ["c1"]);
});

// ---- backup -----------------------------------------------------------------

test("JSON backup round-trips custom routes, entries, progress snapshot and prefs", () => {
  const custom = [normalizeRoute({ id: "c1", name: "Lake loop", totalMiles: 60, milestones: [{ id: "m1", milesFromStart: 10, name: "Boathouse" }] })];
  const logs = [log("pct", 120, "2026-09-01"), log("c1", 15, "2026-09-02", { source: "steps", steps: 30000, note: "walk" })];
  const prefs = { unit: "km", activeRouteId: "c1", stepsPerMile: 2100, fontSize: "lg" };
  const text = toJSON(buildBackup(custom, logs, prefs, new Date("2026-09-11T00:00:00Z")));
  const data = JSON.parse(text);
  assert.equal(data.app, "trailquest");
  assert.equal(data.version, 1);
  assert.equal(data.exportedAt, "2026-09-11T00:00:00.000Z");
  assert.ok(data.progress.pct.unlockedMilestoneIds.includes("pct-warner"));
  assert.ok(data.progress.c1.unlockedMilestoneIds.includes("m1"));
  const back = parseBackup(text);
  assert.deepEqual(back.routes, custom);
  assert.deepEqual(back.logs, logs);
  assert.deepEqual(back.prefs, prefs);
  // The restored state derives the same progress as before the wipe.
  assert.equal(progressFor(PCT, back.logs).miles, 120);
  assert.equal(progressFor(back.routes[0], back.logs).milestones[0].unlocked, true);
});

test("parseBackup rejects wrong files rather than wiping the log", () => {
  assert.throws(() => parseBackup('{"app":"weekpad","categories":[]}'));
  assert.throws(() => parseBackup('{"hello":1}'));
  assert.throws(() => parseBackup('{"app":"trailquest","routes":[],"logs":[]}'));
  assert.throws(() => parseBackup("not json"));
});

test("normalizeLogs drops damaged rows and duplicates, keeps step metadata", () => {
  const out = normalizeLogs([
    { id: "a", routeId: "pct", miles: 3, date: "2026-09-01", source: "steps", steps: 6000 },
    { id: "a", routeId: "pct", miles: 4, date: "2026-09-01" },
    { id: "b", routeId: "pct", miles: -1, date: "2026-09-01" },
    { id: "c", routeId: "pct", miles: 2, date: "2026-13-01" },
    { id: "d", routeId: "", miles: 2, date: "2026-09-01" },
    { id: "e", routeId: "at", miles: "2.5", date: "2026-09-02", note: "  hi  " },
  ]);
  assert.deepEqual(out.map((l) => l.id), ["a", "e"]);
  assert.equal(out[0].steps, 6000);
  assert.equal(out[1].miles, 2.5);
  assert.equal(out[1].note, "hi");
  assert.equal(out[1].source, "manual");
});

test("prefs parse with safe defaults", () => {
  assert.deepEqual(parsePrefs(null), { unit: "mi", stepsPerMile: 2000, fontSize: "md" });
  assert.deepEqual(parsePrefs({ unit: "km", stepsPerMile: 99999, fontSize: "xl", activeRouteId: "at" }), { unit: "km", stepsPerMile: 2000, fontSize: "xl", activeRouteId: "at" });
});

// ---- trail art ----------------------------------------------------------------

test("the SVG trail marker moves monotonically from the start post to the finish post", () => {
  const p0 = pointAt(0);
  const p1 = pointAt(1);
  assert.deepEqual([p0.x, p0.y], [16, 100]);
  assert.deepEqual([p1.x, p1.y], [304, 30]);
  let prevX = -1;
  for (let r = 0; r <= 1; r += 0.05) {
    const p = pointAt(r);
    assert.ok(p.x >= prevX, `x advances at ${r}`);
    prevX = p.x;
  }
  assert.deepEqual(pointAt(-1), p0);
  assert.deepEqual(pointAt(2), p1);
});
