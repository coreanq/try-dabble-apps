import assert from "node:assert/strict";
import test from "node:test";

import { backupFilename, buildBackup, parseBackup, toJSON } from "../src/lib/backup.ts";
import {
  applyDoseToVial,
  concentrationMcgPerMl,
  concentrationMgPerMl,
  dosesPerVial,
  fmt,
  halfLifeRemaining,
  isLowStock,
  remainingOf,
  unitsForDose,
  volumeMlForDose,
} from "../src/lib/calc.ts";
import { daysBetween, fromLocalInput, isoAt, monthGrid, shiftDay, shiftMonth, toLocalInput } from "../src/lib/dates.ts";
import {
  emptyStore,
  normalizeCompound,
  normalizeLog,
  normalizeSchedule,
  normalizeVial,
  reconcile,
  removeById,
  removeCompound,
  upsert,
} from "../src/lib/model.ts";
import { clampUnitsPerMl, defaultPrefs, parsePrefs } from "../src/lib/prefs.ts";
import { SITES, rotationOrder, suggestNextSite } from "../src/lib/rotation.ts";
import { logFromSlot, occursOn, upcomingSlots } from "../src/lib/schedule.ts";

const NOW = new Date("2026-09-12T10:00:00.000Z");

function compound(over = {}) {
  return { id: "c1", name: "Compound A", unitLabel: "mcg", createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(), ...over };
}
function log(over = {}) {
  const datetime = over.datetime ?? "2026-09-12T08:00:00.000Z";
  return { id: `l-${Math.random()}`, compoundId: "c1", amount: 250, unitLabel: "mcg", datetime, date: datetime.slice(0, 10), createdAt: datetime, updatedAt: datetime, ...over };
}

// ---- reconstitution math (arithmetic only) ---------------------------------

test("5 mg + 2 mL → 2.5 mg/mL = 2500 mcg/mL", () => {
  assert.equal(concentrationMgPerMl(5, 2), 2.5);
  assert.equal(concentrationMcgPerMl(5, 2), 2500);
  assert.equal(concentrationMgPerMl(0, 2), null);
  assert.equal(concentrationMgPerMl(5, 0), null);
  assert.equal(concentrationMgPerMl(NaN, 2), null);
});

test("desired dose → syringe units on a U-100 syringe", () => {
  // 250 mcg from 5 mg in 2 mL: 0.25 mg / 2.5 mg/mL = 0.1 mL = 10 units
  assert.equal(volumeMlForDose(250, "mcg", 5, 2), 0.1);
  assert.equal(unitsForDose(250, "mcg", 5, 2), 10);
  // 1 mg from the same vial: 0.4 mL = 40 units; U-50 syringe → 20 units
  assert.equal(unitsForDose(1, "mg", 5, 2), 40);
  assert.equal(unitsForDose(1, "mg", 5, 2, 50), 20);
  assert.equal(unitsForDose(0, "mg", 5, 2), null);
  assert.equal(unitsForDose(1, "mg", 5, 2, 0), null);
});

test("doses per vial and display rounding", () => {
  assert.equal(dosesPerVial(250, "mcg", 5), 20);
  assert.equal(dosesPerVial(2, "mg", 5), 2.5);
  assert.equal(fmt(2.5), "2.5");
  assert.equal(fmt(10), "10");
  assert.equal(fmt(1 / 3), "0.33");
  assert.equal(fmt(null), "—");
});

test("half-life estimate is plain first-order decay and never suggests anything", () => {
  assert.equal(halfLifeRemaining(100, 24, 24), 50);
  assert.equal(halfLifeRemaining(100, 24, 48), 25);
  assert.equal(halfLifeRemaining(100, 24, 0), 100);
  assert.equal(halfLifeRemaining(100, 0, 24), null);
  assert.equal(halfLifeRemaining(100, 24, -1), null);
});

// ---- vial inventory + low stock ---------------------------------------------

test("low stock fires at or below the threshold, in mg first then mL", () => {
  assert.equal(isLowStock({ remainingMg: 1, lowStockThreshold: 1 }), true);
  assert.equal(isLowStock({ remainingMg: 1.5, lowStockThreshold: 1 }), false);
  assert.equal(isLowStock({ remainingMl: 0.3, lowStockThreshold: 0.5 }), true);
  assert.equal(isLowStock({ remainingMg: 0.2 }), false, "no threshold, no warning");
  assert.equal(isLowStock({ lowStockThreshold: 1 }), false, "no remaining figure, no warning");
  assert.deepEqual(remainingOf({ remainingMg: 3, remainingMl: 1 }), { value: 3, unit: "mg" });
  assert.deepEqual(remainingOf({ remainingMl: 1 }), { value: 1, unit: "mL" });
  assert.equal(remainingOf({}), null);
});

test("logging a dose subtracts from the vial (mg, mcg, units via concentration)", () => {
  const vial = { id: "v1", compoundId: "c1", vialMg: 5, diluentMl: 2, remainingMg: 5, remainingMl: 2, createdAt: "", updatedAt: "" };
  assert.equal(applyDoseToVial(vial, 250, "mcg").remainingMg, 4.75);
  assert.equal(applyDoseToVial(vial, 250, "mcg").remainingMl, 1.9);
  assert.equal(applyDoseToVial(vial, 1, "mg").remainingMg, 4);
  assert.equal(applyDoseToVial(vial, 10, "units").remainingMl, 1.9);
  assert.equal(applyDoseToVial(vial, 10, "units").remainingMg, 4.75);
  assert.equal(applyDoseToVial(vial, 100, "mg").remainingMg, 0, "floors at zero");
  const noConc = { ...vial, diluentMl: undefined, remainingMl: undefined };
  assert.equal(applyDoseToVial(noConc, 10, "units"), noConc, "units with unknown concentration: untouched");
  assert.equal(applyDoseToVial(vial, 1, "IU").remainingMl, applyDoseToVial(vial, 1, "units").remainingMl, "IU counted like syringe units");
});

// ---- dates + calendar --------------------------------------------------------

test("local datetime input round-trips and any day can be picked", () => {
  const iso = fromLocalInput("2026-09-11T07:30");
  assert.ok(iso);
  assert.equal(toLocalInput(iso), "2026-09-11T07:30");
  assert.equal(fromLocalInput("junk"), null);
  assert.equal(shiftDay("2026-09-12", -1), "2026-09-11");
  assert.equal(shiftDay("2026-09-30", 1), "2026-10-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(daysBetween("2026-09-10", "2026-09-12"), 2);
  assert.equal(toLocalInput(isoAt("2026-09-11", "20:15")), "2026-09-11T20:15");
});

test("month grid covers the whole month and pads to full weeks", () => {
  const grid = monthGrid("2026-09");
  assert.equal(grid.length % 7, 0);
  assert.equal(grid.filter(Boolean).length, 30);
  assert.equal(grid.filter(Boolean)[0], "2026-09-01");
  assert.equal(grid.filter(Boolean).at(-1), "2026-09-30");
  // 2026-09-01 is a Tuesday: two leading blanks with a Sunday start.
  assert.deepEqual(grid.slice(0, 3), [null, null, "2026-09-01"]);
  assert.equal(monthGrid("2026-02").filter(Boolean).length, 28);
});

// ---- model: unlimited compounds, CRUD, reconcile ------------------------------

test("compounds are unlimited: 50 upserts, 50 rows, all free", () => {
  let list = [];
  for (let i = 0; i < 50; i++) list = upsert(list, { name: `Peptide ${i}`, unitLabel: "mcg" }, NOW).list;
  assert.equal(list.length, 50);
  assert.equal(new Set(list.map((c) => c.id)).size, 50);
});

test("upsert edits in place and keeps createdAt; remove drops by id", () => {
  const a = upsert([], { name: "A" }, NOW);
  const later = new Date("2026-09-13T00:00:00.000Z");
  const b = upsert(a.list, { id: a.id, name: "A renamed" }, later);
  assert.equal(b.list.length, 1);
  assert.equal(b.list[0].name, "A renamed");
  assert.equal(b.list[0].createdAt, NOW.toISOString());
  assert.equal(b.list[0].updatedAt, later.toISOString());
  assert.equal(removeById(b.list, a.id).length, 0);
});

test("normalizers drop damaged rows and coerce numeric strings", () => {
  assert.equal(normalizeCompound({ id: "x" }), null, "no name");
  assert.equal(normalizeCompound({ id: "x", name: "A", halfLifeHours: "24" }).halfLifeHours, 24);
  assert.equal(normalizeVial({ id: "v", compoundId: "c", vialMg: "5", remainingMg: "3" }).remainingMg, 3);
  assert.equal(normalizeVial({ id: "v", compoundId: "c" }), null, "vialMg required");
  const l = normalizeLog({ id: "l", compoundId: "c", amount: 250, datetime: "2026-09-11T22:30:00.000Z" });
  assert.ok(l);
  assert.match(l.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(normalizeLog({ id: "l", compoundId: "c", amount: 250, datetime: "nope" }), null);
  const s = normalizeSchedule({ id: "s", compoundId: "c", name: "MWF", doseAmount: 250, times: ["09:00", "bad", "09:00"], daysOfWeek: [1, 3, 5, 9] });
  assert.deepEqual(s.times, ["09:00"]);
  assert.deepEqual(s.daysOfWeek, [1, 3, 5]);
  assert.equal(s.active, true);
  const daily = normalizeSchedule({ id: "s", compoundId: "c", name: "daily", doseAmount: 1, times: [] });
  assert.deepEqual(daily.daysOfWeek, [0, 1, 2, 3, 4, 5, 6], "no days and no interval → daily");
  assert.deepEqual(daily.times, ["09:00"]);
});

test("removing a compound takes its vials, logs and schedules with it", () => {
  const store = {
    compounds: [compound(), compound({ id: "c2", name: "B" })],
    vials: [{ id: "v1", compoundId: "c1", vialMg: 5, createdAt: "", updatedAt: "" }],
    logs: [log({ compoundId: "c1", vialId: "v1" }), log({ compoundId: "c2", vialId: "v-gone" })],
    schedules: [{ id: "s1", compoundId: "c1", name: "A", doseAmount: 1, times: ["09:00"], daysOfWeek: [1], active: true, createdAt: "", updatedAt: "" }],
    supplies: [],
  };
  const r = reconcile(store);
  assert.equal(r.logs.find((l) => l.compoundId === "c2").vialId, undefined, "dangling vial link dropped");
  const next = removeCompound(store, "c1");
  assert.equal(next.compounds.length, 1);
  assert.equal(next.vials.length, 0);
  assert.equal(next.logs.length, 1);
  assert.equal(next.schedules.length, 0);
});

// ---- calendar: log / edit / delete on any day -----------------------------------

test("a log can be written for yesterday and moved to another day by editing", () => {
  const yesterday = fromLocalInput("2026-09-11T08:00");
  const { list, id } = upsert([], { compoundId: "c1", amount: 250, unitLabel: "mcg", datetime: yesterday, date: "2026-09-11", site: "thigh-l" }, NOW);
  assert.equal(list[0].date, "2026-09-11");
  const moved = upsert(list, { id, compoundId: "c1", amount: 300, datetime: fromLocalInput("2026-09-01T08:00"), date: "2026-09-01" }, NOW);
  assert.equal(moved.list.length, 1, "edit, not duplicate");
  assert.equal(moved.list[0].amount, 300, "wrong dose corrected");
  assert.equal(moved.list[0].date, "2026-09-01");
  assert.equal(removeById(moved.list, id).length, 0, "delete works");
});

// ---- site rotation -------------------------------------------------------------

test("rotation suggests never-used sites first, then the least recently used", () => {
  assert.equal(suggestNextSite([]), SITES[0]);
  const used = SITES.map((site, i) => log({ site, datetime: `2026-09-0${(i % 9) + 1}T08:00:00.000Z` }));
  // every site used once; abdomen-ul on the 1st and glute-r (i=9) on the 1st too — glute-r listed later but same time
  const next = suggestNextSite(used);
  assert.ok(next === "abdomen-ul" || next === "glute-r");
  const someUsed = [log({ site: "abdomen-ul" }), log({ site: "abdomen-ur" })];
  assert.equal(suggestNextSite(someUsed), "abdomen-ll");
  const order = rotationOrder(someUsed);
  assert.equal(order[0].site, "abdomen-ll");
  assert.equal(order.at(-1).site, "abdomen-ur");
  assert.equal(order.at(-1).lastUsed, someUsed[1].datetime);
});

test("after a few logs the suggested site differs from the last one used", () => {
  let logs = [];
  const seen = [];
  for (let i = 0; i < 4; i++) {
    const site = suggestNextSite(logs);
    seen.push(site);
    logs = [log({ site, datetime: `2026-09-1${i}T08:00:00.000Z` }), ...logs];
  }
  assert.equal(new Set(seen).size, 4, "four different sites in a row");
});

// ---- schedules: occurrence + mark done → log --------------------------------------

test("weekday and every-N-day schedules produce the right slots", () => {
  const mwf = { id: "s1", name: "A MWF", compoundId: "c1", doseAmount: 250, unitLabel: "mcg", times: ["08:00"], daysOfWeek: [1, 3, 5], active: true, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "" };
  const every3 = { id: "s2", name: "B q3d", compoundId: "c1", doseAmount: 1, unitLabel: "mg", times: ["21:00"], daysOfWeek: [], intervalDays: 3, active: true, createdAt: "2026-09-10T12:00:00.000Z", updatedAt: "" };
  assert.equal(occursOn(mwf, "2026-09-14"), true, "Monday");
  assert.equal(occursOn(mwf, "2026-09-13"), false, "Sunday");
  assert.equal(occursOn(every3, "2026-09-13"), true);
  assert.equal(occursOn(every3, "2026-09-14"), false);
  assert.equal(occursOn({ ...mwf, active: false }, "2026-09-14"), false, "paused");
  const slots = upcomingSlots([mwf, every3], [], "2026-09-12", 7);
  assert.deepEqual(
    slots.map((s) => `${s.date} ${s.time} ${s.scheduleId}`),
    ["2026-09-13 21:00 s2", "2026-09-14 08:00 s1", "2026-09-16 08:00 s1", "2026-09-16 21:00 s2", "2026-09-18 08:00 s1"],
  );
});

test("mark done creates a DoseLog with the slot's compound, dose, time and site; the slot reads done", () => {
  const s = { id: "s1", name: "A daily", compoundId: "c1", doseAmount: 250, unitLabel: "mcg", times: ["08:00", "20:00"], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], sitePrefer: "thigh-l", active: true, createdAt: "", updatedAt: "" };
  const [first] = upcomingSlots([s], [], "2026-09-12", 1);
  const created = logFromSlot(first, undefined, NOW);
  assert.equal(created.compoundId, "c1");
  assert.equal(created.amount, 250);
  assert.equal(created.unitLabel, "mcg");
  assert.equal(created.date, "2026-09-12");
  assert.equal(toLocalInput(created.datetime), "2026-09-12T08:00");
  assert.equal(created.site, "thigh-l");
  assert.equal(created.scheduleId, "s1");
  assert.equal(created.scheduleTime, "08:00");
  assert.ok(normalizeLog(created), "shape survives the normalizer");
  const after = upcomingSlots([s], [created], "2026-09-12", 1);
  assert.equal(after[0].done, true);
  assert.equal(after[0].logId, created.id);
  assert.equal(after[1].done, false, "the 20:00 slot is still open");
  assert.equal(logFromSlot(first, "glute-r", NOW).site, "glute-r", "override wins over the preferred site");
});

// ---- prefs ------------------------------------------------------------------------

test("prefs default to a U-100 syringe and half-life hidden; bad values fall back", () => {
  assert.deepEqual(defaultPrefs(), { syringeUnitsPerMl: 100, fontSize: "md", showHalfLife: false });
  assert.equal(clampUnitsPerMl("50"), 50);
  assert.equal(clampUnitsPerMl(-3), 100);
  assert.equal(clampUnitsPerMl(99999), 1000);
  const p = parsePrefs({ syringeUnitsPerMl: 50, defaultSite: "thigh-r", fontSize: "xl", showHalfLife: true });
  assert.deepEqual(p, { syringeUnitsPerMl: 50, defaultSite: "thigh-r", fontSize: "xl", showHalfLife: true });
  assert.equal(parsePrefs({ defaultSite: "elbow" }).defaultSite, undefined);
});

// ---- JSON backup round trip ---------------------------------------------------------

test("export → import round-trips every collection and prefs", () => {
  const store = {
    compounds: [compound(), compound({ id: "c2", name: "B", halfLifeHours: 30 })],
    vials: [{ id: "v1", compoundId: "c1", vialMg: 5, diluentMl: 2, remainingMg: 4.75, lowStockThreshold: 1, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() }],
    logs: [log({ id: "l1", vialId: "v1", site: "abdomen-ul", notes: "ok" }), log({ id: "l2", compoundId: "c2", datetime: "2026-09-11T08:00:00.000Z" })],
    schedules: [{ id: "s1", name: "A MWF", compoundId: "c1", doseAmount: 250, unitLabel: "mcg", times: ["08:00"], daysOfWeek: [1, 3, 5], active: true, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() }],
    supplies: [{ id: "u1", name: "Alcohol swabs", qty: 40, lowAt: 10 }],
  };
  const prefs = { syringeUnitsPerMl: 100, defaultSite: "thigh-l", fontSize: "lg", showHalfLife: true };
  const text = toJSON(buildBackup(store, prefs, NOW));
  const parsed = JSON.parse(text);
  assert.equal(parsed.app, "peptidelog");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.exportedAt, NOW.toISOString());
  const back = parseBackup(text);
  assert.deepEqual(back.store.compounds, store.compounds);
  assert.deepEqual(back.store.vials, store.vials);
  assert.deepEqual(back.store.logs, [...store.logs].sort((a, b) => b.datetime.localeCompare(a.datetime)));
  assert.deepEqual(back.store.schedules, store.schedules);
  assert.deepEqual(back.store.supplies, store.supplies);
  assert.deepEqual(back.prefs, prefs);
  assert.equal(backupFilename(NOW), "peptidelog-backup-2026-09-12.json");
});

test("a wrong or empty file is rejected instead of wiping the tracker", () => {
  assert.throws(() => parseBackup('{"app":"weekpad","weeks":[]}'));
  assert.throws(() => parseBackup('{"compounds":[]}'), /empty/);
  assert.throws(() => parseBackup("[]"));
  assert.throws(() => parseBackup("not json"));
  const partial = parseBackup('{"compounds":[{"id":"c1","name":"A"}],"logs":[{"id":"bad"}]}');
  assert.equal(partial.store.compounds.length, 1);
  assert.equal(partial.store.logs.length, 0);
  assert.equal(partial.prefs, null);
  assert.deepEqual(emptyStore().logs, []);
});
