import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  addWeeks,
  clampToWeek,
  isDateStr,
  isInWeek,
  isoWeekId,
  parseDate,
  weekOf,
  weekStartOf,
} from "../src/lib/week.ts";
import {
  normalizeCategories,
  normalizeExpenses,
  plannedFor,
  spentFor,
  summarize,
  totals,
  weekExpenses,
} from "../src/lib/store.ts";
import { buildBackup, csvCell, parseBackup, toCSV, toJSON } from "../src/lib/backup.ts";
import { defaultPrefs, parsePrefs } from "../src/lib/prefs.ts";
import { formatMoney, parseAmount } from "../src/lib/currency.ts";

// ---- week key math -------------------------------------------------------

test("weekStartOf: Monday-start weeks (ISO) and Sunday-start weeks", () => {
  // 2026-09-09 is a Wednesday.
  assert.equal(weekStartOf("2026-09-09", 1), "2026-09-07");
  assert.equal(weekStartOf("2026-09-07", 1), "2026-09-07");
  assert.equal(weekStartOf("2026-09-13", 1), "2026-09-07");
  assert.equal(weekStartOf("2026-09-14", 1), "2026-09-14");
  assert.equal(weekStartOf("2026-09-09", 0), "2026-09-06");
  assert.equal(weekStartOf("2026-09-06", 0), "2026-09-06");
  assert.equal(weekStartOf("2026-09-12", 0), "2026-09-06");
  assert.equal(weekStartOf("2026-09-13", 0), "2026-09-13");
});

test("week keys cross month and year boundaries on the calendar alone", () => {
  assert.equal(weekStartOf("2026-01-01", 1), "2025-12-29");
  assert.equal(weekStartOf("2026-03-01", 1), "2026-02-23");
  assert.equal(addWeeks("2025-12-29", 1), "2026-01-05");
  assert.equal(addWeeks("2026-01-05", -1), "2025-12-29");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
});

test("isoWeekId follows ISO 8601", () => {
  assert.equal(isoWeekId("2026-09-09"), "2026-W37");
  assert.equal(isoWeekId("2026-01-01"), "2026-W01");
  assert.equal(isoWeekId("2025-12-29"), "2026-W01");
  assert.equal(isoWeekId("2024-12-30"), "2025-W01");
  assert.equal(isoWeekId("2021-01-03"), "2020-W53");
  assert.equal(isoWeekId("2026-12-31"), "2026-W53");
});

test("weekOf returns seven days, the end and the ISO label", () => {
  const w = weekOf("2026-09-09", 1);
  assert.equal(w.start, "2026-09-07");
  assert.equal(w.end, "2026-09-13");
  assert.equal(w.days.length, 7);
  assert.equal(w.days[6], "2026-09-13");
  assert.equal(w.isoId, "2026-W37");
  const s = weekOf("2026-09-09", 0);
  assert.equal(s.start, "2026-09-06");
  assert.equal(s.end, "2026-09-12");
  assert.equal(s.isoId, "2026-W37");
});

test("isInWeek and clampToWeek", () => {
  assert.equal(isInWeek("2026-09-13", "2026-09-07", 1), true);
  assert.equal(isInWeek("2026-09-14", "2026-09-07", 1), false);
  assert.equal(clampToWeek("2026-09-20", "2026-09-07"), "2026-09-13");
  assert.equal(clampToWeek("2026-09-01", "2026-09-07"), "2026-09-07");
  assert.equal(clampToWeek("2026-09-10", "2026-09-07"), "2026-09-10");
});

test("date strings are validated strictly", () => {
  assert.equal(isDateStr("2026-02-29"), false);
  assert.equal(isDateStr("2024-02-29"), true);
  assert.equal(isDateStr("2026-13-01"), false);
  assert.equal(isDateStr("2026-9-9"), false);
  assert.equal(parseDate("nope"), null);
});

// ---- remaining / progress ------------------------------------------------

const WEEK = "2026-09-07";
const CATS = [
  { id: "g", name: "Groceries", plannedWeekly: 80, recurring: true, createdAt: "2026-08-20T10:00:00.000Z" },
  { id: "c", name: "Coffee", plannedWeekly: 15, recurring: true, createdAt: "2026-08-20T10:00:00.000Z" },
  // One-off made in the week of 2026-09-07 (local time of the test runner is irrelevant: mid-day UTC).
  { id: "o", name: "Gift", plannedWeekly: 40, recurring: false, createdAt: "2026-09-08T12:00:00.000Z" },
];
const EXPS = [
  { id: "1", categoryId: "g", amount: 12.5, date: "2026-09-08", createdAt: "2026-09-08T10:00:00.000Z" },
  { id: "2", categoryId: "g", amount: 30.25, date: "2026-09-10", note: "market", createdAt: "2026-09-10T10:00:00.000Z" },
  { id: "3", categoryId: "c", amount: 20, date: "2026-09-09", createdAt: "2026-09-09T10:00:00.000Z" },
  { id: "4", categoryId: "g", amount: 99, date: "2026-09-01", createdAt: "2026-09-01T10:00:00.000Z" },
  { id: "5", categoryId: "o", amount: 10, date: "2026-09-15", createdAt: "2026-09-15T10:00:00.000Z" },
];

test("spent sums only the selected week; remaining = planned - spent", () => {
  assert.equal(spentFor(EXPS, "g", WEEK, 1), 42.75);
  assert.equal(spentFor(EXPS, "g", "2026-08-31", 1), 99);
  const g = summarize(CATS[0], EXPS, WEEK, 1);
  assert.equal(g.planned, 80);
  assert.equal(g.spent, 42.75);
  assert.equal(g.remaining, 37.25);
  assert.ok(Math.abs(g.ratio - 42.75 / 80) < 1e-9);
  assert.equal(g.over, false);
});

test("overspend flips over, remaining goes negative and the bar clamps at 1", () => {
  const c = summarize(CATS[1], EXPS, WEEK, 1);
  assert.equal(c.planned, 15);
  assert.equal(c.spent, 20);
  assert.equal(c.remaining, -5);
  assert.equal(c.ratio, 1);
  assert.equal(c.over, true);
});

test("floating sums are rounded to cents", () => {
  const exps = [
    { id: "a", categoryId: "g", amount: 0.1, date: "2026-09-08", createdAt: "" },
    { id: "b", categoryId: "g", amount: 0.2, date: "2026-09-08", createdAt: "" },
  ];
  assert.equal(spentFor(exps, "g", WEEK, 1), 0.3);
  assert.equal(summarize(CATS[0], exps, WEEK, 1).remaining, 79.7);
});

test("a fresh week starts at zero for a recurring category", () => {
  const next = summarize(CATS[0], EXPS, "2026-09-14", 1);
  assert.equal(next.planned, 80);
  assert.equal(next.spent, 0);
  assert.equal(next.remaining, 80);
  assert.equal(next.ratio, 0);
});

// ---- recurring carry -----------------------------------------------------

test("recurring categories carry the planned amount into every week", () => {
  assert.equal(plannedFor(CATS[0], "2026-09-14", 1), 80);
  assert.equal(plannedFor(CATS[0], "2026-08-31", 1), 80);
  assert.equal(plannedFor(CATS[0], "2027-01-04", 1), 80);
});

test("a one-off category is planned only in the week it was created", () => {
  assert.equal(plannedFor(CATS[2], WEEK, 1), 40);
  assert.equal(plannedFor(CATS[2], "2026-09-14", 1), 0);
  const later = summarize(CATS[2], EXPS, "2026-09-14", 1);
  assert.equal(later.plannedThisWeek, false);
  assert.equal(later.spent, 10);
  assert.equal(summarize(CATS[2], EXPS, WEEK, 1).plannedThisWeek, true);
  const flipped = { ...CATS[2], recurring: true };
  assert.equal(plannedFor(flipped, "2026-09-14", 1), 40);
});

test("totals skip archived categories but count every expense in the week", () => {
  const t = totals(CATS, EXPS, WEEK, 1);
  assert.equal(t.planned, 135);
  assert.equal(t.spent, 62.75);
  assert.equal(t.remaining, 72.25);
  const archived = totals([{ ...CATS[0], archived: true }, CATS[1], CATS[2]], EXPS, WEEK, 1);
  assert.equal(archived.planned, 55);
  assert.equal(archived.spent, 62.75);
  assert.equal(archived.over, true);
});

test("weekExpenses filters to the week and sorts newest first", () => {
  const list = weekExpenses(EXPS, WEEK, 1);
  assert.deepEqual(list.map((e) => e.id), ["2", "3", "1"]);
  assert.deepEqual(weekExpenses(EXPS, "2026-09-14", 1).map((e) => e.id), ["5"]);
});

// ---- JSON backup roundtrip -----------------------------------------------

test("JSON backup roundtrip returns the same categories, expenses and prefs", () => {
  const prefs = { ...defaultPrefs("en"), currency: "EUR", weekStartsOn: 0, fontSize: "lg" };
  const backup = buildBackup(CATS, EXPS, prefs, new Date("2026-09-09T00:00:00.000Z"));
  assert.equal(backup.app, "weekpad");
  assert.equal(backup.version, 1);
  assert.equal(backup.exportedAt, "2026-09-09T00:00:00.000Z");
  const text = toJSON(backup);
  const back = parseBackup(text, "en");
  assert.deepEqual(back.categories, normalizeCategories(CATS));
  assert.deepEqual(back.expenses, normalizeExpenses(EXPS));
  assert.equal(back.prefs.currency, "EUR");
  assert.equal(back.prefs.weekStartsOn, 0);
  assert.equal(back.prefs.fontSize, "lg");
});

test("backup import drops damaged rows and rejects foreign or empty files", () => {
  const messy = JSON.stringify({
    app: "weekpad",
    version: 1,
    categories: [CATS[0], { id: "", name: "x", plannedWeekly: 1 }, { id: "dup", name: "A", plannedWeekly: "5" }, { id: "dup", name: "B", plannedWeekly: 6 }],
    expenses: [EXPS[0], { id: "bad", categoryId: "g", amount: "abc", date: "2026-09-08" }, { id: "nodate", categoryId: "g", amount: 1, date: "2026-2-2" }],
  });
  const parsed = parseBackup(messy, "en");
  assert.deepEqual(parsed.categories.map((c) => c.id), ["g", "dup"]);
  assert.equal(parsed.categories[1].plannedWeekly, 5);
  assert.deepEqual(parsed.expenses.map((e) => e.id), ["1"]);
  assert.equal(parsed.prefs, null);
  assert.throws(() => parseBackup(JSON.stringify({ app: "mixshelf", items: [] }), "en"));
  assert.throws(() => parseBackup(JSON.stringify({ app: "weekpad", categories: [], expenses: [] }), "en"));
  assert.throws(() => parseBackup(JSON.stringify([1, 2, 3]), "en"));
  assert.throws(() => parseBackup("not json", "en"));
});

// ---- CSV -----------------------------------------------------------------

test("CSV rows are date,category,amount,note,currency oldest first with quoting", () => {
  const exps = [
    ...EXPS.slice(0, 2),
    { id: "q", categoryId: "c", amount: 3, date: "2026-09-08", note: 'latte, "large"', createdAt: "2026-09-08T11:00:00.000Z" },
  ];
  const csv = toCSV(exps, CATS, "USD");
  const lines = csv.split("\r\n");
  assert.equal(lines[0], "date,category,amount,note,currency");
  assert.equal(lines[1], "2026-09-08,Groceries,12.5,,USD");
  assert.equal(lines[2], '2026-09-08,Coffee,3,"latte, ""large""",USD');
  assert.equal(lines[3], "2026-09-10,Groceries,30.25,market,USD");
  assert.equal(lines[4], "");
  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
});

// ---- prefs and money -----------------------------------------------------

test("prefs default by language and reject junk", () => {
  assert.equal(defaultPrefs("ko").currency, "KRW");
  assert.equal(defaultPrefs("ja").currency, "JPY");
  assert.equal(defaultPrefs("zh").currency, "CNY");
  assert.equal(defaultPrefs("en").currency, "USD");
  assert.equal(defaultPrefs("en").weekStartsOn, 1);
  const p = parsePrefs({ currency: "XXX", weekStartsOn: 5, fontSize: "huge", lastSeenWeek: "bad", currencySymbol: "  " }, "en");
  assert.deepEqual(p, { currency: "USD", weekStartsOn: 1, fontSize: "md" });
  const q = parsePrefs({ currency: "KRW", weekStartsOn: 0, fontSize: "xl", lastSeenWeek: "2026-09-07", currencySymbol: "원" }, "en");
  assert.deepEqual(q, { currency: "KRW", weekStartsOn: 0, fontSize: "xl", lastSeenWeek: "2026-09-07", currencySymbol: "원" });
});

test("formatMoney uses the currency symbol and decimals, never converts", () => {
  assert.equal(formatMoney(12.5, "USD", "en-US"), "$12.50");
  assert.equal(formatMoney(12000, "KRW", "ko-KR"), "₩12,000");
  assert.equal(formatMoney(1200, "JPY", "ja-JP"), "¥1,200");
  assert.equal(formatMoney(-3, "EUR", "en-US"), "-€3.00");
  assert.equal(formatMoney(5, "USD", "en-US", "US$"), "US$5.00");
  assert.equal(formatMoney(12.345, "KRW", "en-US"), "₩12.35");
});

test("parseAmount accepts commas and full-width digits, rejects words", () => {
  assert.equal(parseAmount("12.50"), 12.5);
  assert.equal(parseAmount("1,234"), 1234);
  assert.equal(parseAmount("１２３"), 123);
  assert.equal(parseAmount(" 8 "), 8);
  assert.ok(Number.isNaN(parseAmount("abc")));
  assert.ok(Number.isNaN(parseAmount("")));
  assert.ok(Number.isNaN(parseAmount("1.2.3")));
});
