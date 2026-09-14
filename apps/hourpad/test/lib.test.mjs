import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  addDays,
  combineDateTime,
  elapsedMs,
  formatClock,
  formatHM,
  formatHours,
  hoursToMs,
  parseHours,
  toDateKey,
  weekDaysOf,
  weekKeyOf,
} from "../src/lib/time.ts";
import {
  BACKUP_APP,
  DEFAULT_TARGET_HOURS,
  buildBackup,
  checkIn,
  checkOut,
  clampBank,
  dayTotals,
  defaultPrefs,
  normalizeSession,
  parseBackup,
  parsePrefs,
  settleWeeks,
  startBreak,
  surplusHours,
  toJSON,
  weekRows,
  weekTotals,
  weekWorkHours,
} from "../src/lib/store.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");

/** Local-time ISO for a given day key and HH:MM, so tests are TZ-independent. */
function at(dateKey, hhmm) {
  return combineDateTime(dateKey, hhmm);
}
function ms(h, m = 0) {
  return h * 3_600_000 + m * 60_000;
}
function session(id, dateKey, kind, start, end, label) {
  const s = { id, date: dateKey, kind, startedAt: at(dateKey, start), endedAt: at(dateKey, end), durationMs: Date.parse(at(dateKey, end)) - Date.parse(at(dateKey, start)) };
  if (label) s.label = label;
  return s;
}

/* ---------- time helpers ---------- */

test("weekKeyOf lands on the local Monday and is stable across the week", () => {
  // 2026-09-14 is a Monday.
  assert.equal(weekKeyOf("2026-09-14"), "2026-09-14");
  assert.equal(weekKeyOf("2026-09-17"), "2026-09-14");
  assert.equal(weekKeyOf("2026-09-20"), "2026-09-14"); // Sunday belongs to the Monday week
  assert.equal(weekKeyOf("2026-09-21"), "2026-09-21");
  assert.equal(weekKeyOf("2026-09-20", 0), "2026-09-20"); // Sunday start when asked
  assert.deepEqual(weekDaysOf("2026-09-14"), ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"]);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("toDateKey uses the local calendar day", () => {
  const d = new Date(2026, 8, 14, 23, 45);
  assert.equal(toDateKey(d), "2026-09-14");
});

test("durations format as Hh Mm / H:MM:SS and bank figures carry a sign", () => {
  assert.equal(formatHM(ms(8, 12)), "8h 12m");
  assert.equal(formatHM(ms(0, 45)), "45m");
  assert.equal(formatHM(ms(2)), "2h");
  assert.equal(formatHM(0), "0m");
  assert.equal(formatHM(-ms(1, 10)), "-1h 10m");
  assert.equal(formatHM(ms(3, 20), { sign: true }), "+3h 20m");
  assert.equal(formatClock(ms(1, 5) + 9_000), "1:05:09");
  assert.equal(formatClock(0), "0:00:00");
  assert.equal(formatHours(3.5, { sign: true }), "+3h 30m");
  assert.equal(formatHours(-2), "-2h");
});

test("parseHours reads 40, 37.5, 37h 30m, 37:30, -2 and rejects nonsense", () => {
  assert.equal(parseHours("40"), 40);
  assert.equal(parseHours("37.5"), 37.5);
  assert.equal(parseHours("37h 30m"), 37.5);
  assert.equal(parseHours("37:30"), 37.5);
  assert.equal(parseHours("-2"), -2);
  assert.equal(parseHours("-1h 15m"), -1.25);
  assert.equal(parseHours("90m"), 1.5);
  assert.equal(parseHours("abc"), null);
  assert.equal(parseHours(""), null);
});

/* ---------- elapsed honesty ---------- */

test("elapsed is wall-clock arithmetic on startedAt, not a tick count", () => {
  const started = "2026-09-14T09:00:00.000Z";
  const t0 = Date.parse(started);
  // Pretend the tab was throttled and no ticks fired for 3 hours: the
  // figure still comes straight from the clock.
  assert.equal(elapsedMs(started, t0 + ms(3)), ms(3));
  assert.equal(elapsedMs(started, t0 + 1_500), 1_500);
  assert.equal(elapsedMs(started, t0 - 5_000), 0, "never negative when the clock is behind");
  assert.equal(elapsedMs("not a date", t0), 0);
});

test("the home route recomputes from Date.now() on visibilitychange / focus / pageshow and never accumulates ticks", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  assert.match(home, /visibilitychange/);
  assert.match(home, /addEventListener\("focus"/);
  assert.match(home, /addEventListener\("pageshow"/);
  assert.match(home, /elapsedMs\(active\.startedAt, now\)/);
  assert.doesNotMatch(home, /elapsed\s*\+=|setElapsed\(\s*\(?e\)?\s*=>\s*e\s*\+/, "no tick accumulator");
});

/* ---------- clock transitions ---------- */

test("check in → break → resume → check out produces work and break rows, breaks excluded from work", () => {
  const day = "2026-09-14";
  let state = { sessions: [], active: null };
  state = checkIn(state, "client report", Date.parse(at(day, "09:00")));
  assert.equal(state.active.kind, "work");
  assert.equal(state.active.label, "client report");
  state = startBreak(state, Date.parse(at(day, "12:00")));
  assert.equal(state.active.kind, "break");
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].kind, "work");
  assert.equal(state.sessions[0].durationMs, ms(3));
  assert.equal(state.sessions[0].label, "client report");
  state = checkIn(state, undefined, Date.parse(at(day, "12:45")));
  assert.equal(state.active.kind, "work");
  assert.equal(state.active.label, "client report", "label carries across the break");
  assert.equal(state.sessions[1].kind, "break");
  assert.equal(state.sessions[1].durationMs, ms(0, 45));
  state = checkOut(state, Date.parse(at(day, "17:15")));
  assert.equal(state.active, null);
  assert.equal(state.sessions.length, 3);
  const t = dayTotals(state.sessions, day);
  assert.equal(t.workMs, ms(7, 30));
  assert.equal(t.breakMs, ms(0, 45));
  assert.equal(t.sessions, 3);
});

test("only sensible transitions: break needs an open work session, check-in while working is a no-op", () => {
  const day = "2026-09-14";
  const idle = { sessions: [], active: null };
  assert.equal(startBreak(idle, Date.parse(at(day, "09:00"))), idle);
  assert.equal(checkOut(idle, Date.parse(at(day, "09:00"))), idle);
  const working = checkIn(idle, "", Date.parse(at(day, "09:00")));
  assert.equal(checkIn(working, "x", Date.parse(at(day, "10:00"))), working);
});

test("live totals include the open session from the wall clock", () => {
  const day = "2026-09-14";
  const active = { kind: "work", startedAt: at(day, "09:00") };
  const now = Date.parse(at(day, "10:30"));
  assert.equal(dayTotals([], day, active, now).workMs, ms(1, 30));
  assert.equal(dayTotals([], day, { ...active, kind: "break" }, now).breakMs, ms(1, 30));
  assert.equal(weekTotals([], weekKeyOf(day), active, now).workMs, ms(1, 30));
});

/* ---------- target and bank ---------- */

test("weekly target defaults to 40 and is editable through prefs", () => {
  assert.equal(DEFAULT_TARGET_HOURS, 40);
  assert.equal(defaultPrefs().weeklyTargetHours, 40);
  assert.equal(parsePrefs({}).weeklyTargetHours, 40);
  assert.equal(parsePrefs({ weeklyTargetHours: 37.5 }).weeklyTargetHours, 37.5);
  assert.equal(parsePrefs({ weeklyTargetHours: "32" }).weeklyTargetHours, 32);
  assert.equal(parsePrefs({ weeklyTargetHours: -5 }).weeklyTargetHours, 0);
  assert.equal(parsePrefs({ weeklyTargetHours: "nope" }).weeklyTargetHours, 40);
});

test("bank balance is editable, may be negative and is clamped to something sane", () => {
  assert.equal(parsePrefs({ bankHours: 3.5 }).bankHours, 3.5);
  assert.equal(parsePrefs({ bankHours: -2 }).bankHours, -2);
  assert.equal(clampBank(99_999), 10_000);
  assert.equal(clampBank(Number.NaN), 0);
  assert.equal(parsePrefs({ bank: "1.25" }).bankHours, 1.25);
});

test("weekly work hours exclude breaks and surplus is work minus target", () => {
  const w = "2026-09-07"; // Monday before the current test week
  const sessions = [
    session("a", "2026-09-07", "work", "09:00", "18:00"),
    session("b", "2026-09-07", "break", "12:00", "13:00"),
    session("c", "2026-09-08", "work", "09:00", "17:30"),
    session("d", "2026-09-09", "work", "09:00", "17:00"),
    session("e", "2026-09-10", "work", "09:00", "17:00"),
    session("f", "2026-09-11", "work", "09:00", "18:30"),
    session("g", "2026-09-11", "break", "15:00", "15:30"),
  ];
  assert.equal(weekWorkHours(sessions, w), 9 + 8.5 + 8 + 8 + 9.5);
  assert.equal(surplusHours(43, 40), 3);
  assert.equal(surplusHours(36.5, 40), -3.5);
});

test("overtime bank rolls a finished week's surplus into next week: positive and negative, once", () => {
  const prefs = { ...defaultPrefs(), bankHours: 1 };
  const overWeek = [
    session("a", "2026-08-31", "work", "09:00", "18:00"),
    session("b", "2026-09-01", "work", "09:00", "18:00"),
    session("c", "2026-09-02", "work", "09:00", "18:00"),
    session("d", "2026-09-03", "work", "09:00", "18:00"),
    session("e", "2026-09-04", "work", "09:00", "18:00"),
    session("f", "2026-09-04", "break", "12:00", "13:00"), // ignored by the bank
  ]; // 45h work → +5
  const underWeek = [
    session("g", "2026-09-07", "work", "09:00", "17:00"),
    session("h", "2026-09-08", "work", "09:00", "17:00"),
    session("i", "2026-09-09", "work", "09:00", "17:00"),
    session("j", "2026-09-10", "work", "09:00", "17:00"),
  ]; // 32h → -8
  const current = [session("k", "2026-09-14", "work", "09:00", "12:00")]; // this week, untouched
  const now = Date.parse(at("2026-09-15", "10:00"));

  const first = settleWeeks([...overWeek, ...underWeek, ...current], prefs, [], now);
  assert.equal(first.settled.length, 2);
  assert.deepEqual(first.settled.map((w) => w.weekKey), ["2026-08-31", "2026-09-07"]);
  assert.equal(first.settled[0].surplusHours, 5);
  assert.equal(first.settled[0].bankIn, 1);
  assert.equal(first.settled[0].bankOut, 6);
  assert.equal(first.settled[1].surplusHours, -8);
  assert.equal(first.settled[1].bankIn, 6);
  assert.equal(first.settled[1].bankOut, -2);
  assert.equal(first.prefs.bankHours, -2, "bank can go negative");
  assert.equal(first.weeks.length, 2);

  // Idempotent: running again with the ledger changes nothing.
  const again = settleWeeks([...overWeek, ...underWeek, ...current], first.prefs, first.weeks, now);
  assert.equal(again.settled.length, 0);
  assert.equal(again.prefs.bankHours, -2);

  // The current week is never settled early, and a week with only breaks / nothing is skipped.
  const rows = weekRows([...overWeek, ...underWeek, ...current], first.weeks, first.prefs, now);
  assert.equal(rows[0].weekKey, "2026-09-14");
  assert.equal(rows[0].current, true);
  assert.equal(rows[0].settled, null);
  assert.equal(rows[0].workMs, ms(3));
  assert.equal(rows[1].settled.surplusHours, -8);
  assert.equal(rows[2].settled.surplusHours, 5);
});

test("a week with no work logged is left alone (no phantom -40)", () => {
  const sessions = [session("a", "2026-08-24", "work", "09:00", "17:00")]; // 3 weeks ago, 8h → -32
  const now = Date.parse(at("2026-09-15", "10:00"));
  const r = settleWeeks(sessions, defaultPrefs(), [], now);
  assert.equal(r.settled.length, 1);
  assert.equal(r.settled[0].weekKey, "2026-08-24");
  assert.equal(r.prefs.bankHours, -32);
});

test("edited target applies to weeks settled after the edit", () => {
  const sessions = [
    session("a", "2026-09-07", "work", "09:00", "17:00"),
    session("b", "2026-09-08", "work", "09:00", "17:00"),
    session("c", "2026-09-09", "work", "09:00", "17:00"),
    session("d", "2026-09-10", "work", "09:00", "17:00"),
  ]; // 32h
  const now = Date.parse(at("2026-09-15", "10:00"));
  const r = settleWeeks(sessions, { ...defaultPrefs(), weeklyTargetHours: 32 }, [], now);
  assert.equal(r.settled[0].surplusHours, 0);
  assert.equal(r.settled[0].targetHours, 32);
  assert.equal(r.prefs.bankHours, 0);
});

/* ---------- backup ---------- */

test("JSON export / import round-trips sessions, active, prefs and weeks", () => {
  const sessions = [session("a", "2026-09-14", "work", "09:00", "12:00", "report"), session("b", "2026-09-14", "break", "12:00", "12:30")];
  const active = { kind: "work", startedAt: at("2026-09-14", "12:30"), label: "report" };
  const prefs = { weeklyTargetHours: 37.5, bankHours: 2.25, weekStartsOn: 1 };
  const weeks = [{ weekKey: "2026-09-07", targetHours: 40, workHours: 42, surplusHours: 2, bankIn: 0.25, bankOut: 2.25, settledAt: "2026-09-14T00:00:00.000Z" }];
  const backup = buildBackup(sessions, active, prefs, weeks, new Date("2026-09-14T12:00:00Z"));
  assert.equal(backup.app, BACKUP_APP);
  assert.equal(backup.app, "hourpad");
  assert.equal(backup.version, 1);
  const text = toJSON(backup);
  assert.match(text, /"app": "hourpad"/);
  const parsed = parseBackup(JSON.parse(text));
  assert.deepEqual(parsed.sessions, sessions);
  assert.deepEqual(parsed.active, active);
  assert.deepEqual(parsed.prefs, prefs);
  assert.deepEqual(parsed.weeks, weeks);
  assert.equal(parsed.exportedAt, "2026-09-14T12:00:00.000Z");
});

test("import is forgiving: a bare array, a { entries } list, shift-style rows and unknown keys", () => {
  const bare = parseBackup([{ start: "2026-09-14T09:00:00Z", end: "2026-09-14T11:00:00Z", task: "x", zzz: 1 }]);
  assert.equal(bare.sessions.length, 1);
  assert.equal(bare.sessions[0].kind, "work");
  assert.equal(bare.sessions[0].label, "x");
  assert.equal(bare.sessions[0].durationMs, ms(2));
  assert.equal(bare.prefs.weeklyTargetHours, 40);

  const entries = parseBackup({ entries: [{ clockIn: "2026-09-14T09:00:00Z", clockOut: "2026-09-14T09:30:00Z", type: "break" }], targetHours: 35, whatever: { deep: true } });
  assert.equal(entries.sessions[0].kind, "break");
  assert.equal(entries.prefs.weeklyTargetHours, 35);

  const minutes = normalizeSession({ startedAt: "2026-09-14T09:00:00Z", minutes: 90 });
  assert.equal(minutes.durationMs, ms(1, 30));

  assert.equal(parseBackup({ app: "someoneelse", foo: [] }), null);
  assert.equal(parseBackup("nope"), null);
  assert.equal(parseBackup({ sessions: [{ startedAt: "garbage" }] }).sessions.length, 0);
  assert.equal(normalizeSession({ startedAt: "2026-09-14T10:00:00Z", endedAt: "2026-09-14T09:00:00Z" }), null, "end before start is dropped");
});

/* ---------- product guard ---------- */

test("built index.html (when present) carries no ads, paywall, pomodoro or HIIT copy", { skip: !existsSync(path.join(APP, "dist", "index.html")) }, () => {
  const html = readFileSync(path.join(APP, "dist", "index.html"), "utf8");
  assert.doesNotMatch(html, /adsbygoogle|ca-pub-|googlesyndication|paywall|premium|pomodoro|hiit|tabata|\$\d/i);
  assert.match(html, /아워패드/);
  assert.match(html, /hp-tagline/);
});

test("hoursToMs / weekTotals agree on a 40h target", () => {
  assert.equal(hoursToMs(40), ms(40));
});
