import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  allocate,
  annualAllocation,
  duplicatePlan,
  earningsFor,
  incomeSummary,
  incomeTotal,
  makeEarning,
  makeEnvelope,
  makePlan,
  monthlyRows,
  renamePlan,
  resolveEnvelope,
} from "../src/lib/budget.ts";
import { clampAmount, clampPercent, coerceDateKey, formatMoney, formatPercent, monthKeyOf, roundMoney, shiftMonthKey, shiftYearKey, yearKeyOf } from "../src/lib/money.ts";
import { buildBackup, coerceCategory, coerceIncomeMode, parseBackup, parseEnvelopes, parsePrefs, toJSON } from "../src/lib/store.ts";

const plan = makePlan("Freelance", "USD", "irregular", new Date("2026-09-01T00:00:00Z"));
const env = (name, kind, value, category = "flexible", sortOrder = 0) => makeEnvelope(plan.id, name, kind, value, category, sortOrder);
const earn = (amount, date, label, currency) => makeEarning(plan.id, amount, date, label, currency);

/* ---------- money ---------- */

test("formatMoney picks a sensible locale per UI language and respects zero-decimal currencies", () => {
  assert.equal(formatMoney(1234.5, "USD", "en"), "$1,234.50");
  assert.equal(formatMoney(1234567, "KRW", "ko"), "₩1,234,567");
  assert.equal(formatMoney(980, "JPY", "ja"), "￥980");
  assert.match(formatMoney(68, "CNY", "zh"), /68\.00/);
  assert.equal(formatMoney(NaN, "EUR", "en-US"), "€0.00");
  assert.equal(formatMoney(12, "GBP", "en-US"), "£12.00");
});

test("formatPercent / roundMoney / clamp helpers", () => {
  assert.equal(formatPercent(20, "en"), "20%");
  assert.equal(formatPercent(12.345, "en"), "12.35%");
  assert.equal(roundMoney(10.005, "USD"), 10.01);
  assert.equal(roundMoney(10.4, "KRW"), 10);
  assert.equal(clampAmount("1,250.75"), 1250.75);
  assert.equal(clampAmount(-5, 0), 0);
  assert.equal(clampAmount("abc", 7), 7);
  assert.equal(clampPercent("20"), 20);
  assert.equal(clampPercent(-1, 0), 0);
});

test("calendar keys: month / year extraction and shifting across year edges", () => {
  assert.equal(monthKeyOf("2026-09-14"), "2026-09");
  assert.equal(yearKeyOf("2026-09-14"), "2026");
  assert.equal(shiftMonthKey("2026-12", 1), "2027-01");
  assert.equal(shiftMonthKey("2026-01", -1), "2025-12");
  assert.equal(shiftYearKey("2026", -1), "2025");
  assert.equal(coerceDateKey("2026/9/4", "x"), "2026-09-04");
  assert.equal(coerceDateKey(Date.UTC(2026, 8, 14, 12), "x").slice(0, 7), "2026-09");
  assert.equal(coerceDateKey("nope", "2026-01-01"), "2026-01-01");
});

/* ---------- resolve rules ---------- */

test("percent envelope resolves against income; fixed envelope stays fixed", () => {
  assert.equal(resolveEnvelope({ kind: "percent", value: 20 }, 3000), 600);
  assert.equal(resolveEnvelope({ kind: "fixed", value: 1200 }, 3000), 1200);
  assert.equal(resolveEnvelope({ kind: "percent", value: 20 }, 0), 0);
  assert.equal(resolveEnvelope({ kind: "fixed", value: 1200 }, 0), 1200);
  assert.equal(resolveEnvelope({ kind: "percent", value: NaN }, 100), 0);
});

test("allocate: allocated, buffer, category breakdown and share bars", () => {
  const envelopes = [env("Savings", "percent", 20, "savings", 0), env("Rent", "fixed", 1200, "bills", 1), env("Loan", "percent", 10, "debt", 2)];
  const a = allocate(envelopes, 4000);
  assert.equal(a.income, 4000);
  assert.deepEqual(a.rows.map((r) => r.amount), [800, 1200, 400]);
  assert.equal(a.allocated, 2400);
  assert.equal(a.buffer, 1600);
  assert.equal(a.over, false);
  assert.equal(a.percentSum, 30);
  assert.equal(a.fixedSum, 1200);
  assert.deepEqual(a.byCategory.map((c) => [c.category, c.amount]), [["savings", 800], ["debt", 400], ["bills", 1200]]);
  assert.equal(a.rows[0].share, 0.2);
});

test("adding an earning immediately changes percent envelopes, totals and the buffer", () => {
  const envelopes = [env("Savings", "percent", 25, "savings"), env("Rent", "fixed", 1000, "bills")];
  let earnings = [earn(2000, "2026-09-03", "Client A")];
  const period = { kind: "month", key: "2026-09" };
  const before = allocate(envelopes, incomeTotal(earnings, plan, period));
  assert.equal(before.rows[0].amount, 500);
  assert.equal(before.buffer, 500);

  earnings = [...earnings, earn(1200, "2026-09-20", "Client B")];
  const after = allocate(envelopes, incomeTotal(earnings, plan, period));
  assert.equal(after.income, 3200);
  assert.equal(after.rows[0].amount, 800);
  assert.equal(after.rows[1].amount, 1000);
  assert.equal(after.allocated, 1800);
  assert.equal(after.buffer, 1400);
});

test("over-allocation: fixed envelopes above income give a negative buffer and over=true, no exception", () => {
  const envelopes = [env("Rent", "fixed", 1500, "bills"), env("Savings", "percent", 50, "savings")];
  const a = allocate(envelopes, 1000);
  assert.equal(a.allocated, 2000);
  assert.equal(a.buffer, -1000);
  assert.equal(a.over, true);
  const zero = allocate(envelopes, 0);
  assert.equal(zero.over, true);
  assert.equal(zero.buffer, -1500);
});

test("percent envelopes past 100% are allowed but flagged as over", () => {
  const a = allocate([env("A", "percent", 70), env("B", "percent", 40)], 1000);
  assert.equal(a.percentSum, 110);
  assert.equal(a.allocated, 1100);
  assert.equal(a.over, true);
});

/* ---------- periods ---------- */

test("earningsFor filters by plan and month; other plans and months are left out", () => {
  const other = makePlan("Other", "USD");
  const rows = [earn(100, "2026-09-01"), earn(200, "2026-08-31"), earn(300, "2026-09-30"), makeEarning(other.id, 999, "2026-09-10")];
  const sept = earningsFor(rows, plan.id, { kind: "month", key: "2026-09" });
  assert.deepEqual(sept.map((e) => e.amount), [300, 100]);
  assert.equal(incomeTotal(rows, plan, { kind: "month", key: "2026-09" }), 400);
  assert.equal(incomeTotal(rows, plan, { kind: "month", key: "2026-08" }), 200);
  assert.equal(incomeTotal(rows, plan, { kind: "year", key: "2026" }), 600);
  assert.equal(incomeTotal(rows, plan, { kind: "all" }), 600);
});

test("multi-currency: only the plan currency is allocated; others are totalled separately, never merged", () => {
  const rows = [earn(1000, "2026-09-01"), earn(500000, "2026-09-02", "KR client", "KRW"), earn(200, "2026-09-03", undefined, "usd")];
  const s = incomeSummary(rows, "USD");
  assert.equal(s.total, 1200);
  assert.equal(s.count, 3);
  assert.deepEqual(s.byCurrency.map((r) => [r.currency, r.total, r.count]), [["USD", 1200, 2], ["KRW", 500000, 1]]);
});

test("monthly vs annual aggregation: twelve rows, fixed envelopes once per month with income, percent on the year", () => {
  const envelopes = [env("Savings", "percent", 10, "savings"), env("Rent", "fixed", 1000, "bills")];
  const rows = [earn(3000, "2026-01-15"), earn(2000, "2026-01-30"), earn(4000, "2026-06-10"), earn(100, "2025-12-31")];
  const months = monthlyRows(rows, envelopes, plan, "2026");
  assert.equal(months.length, 12);
  assert.equal(months[0].month, "2026-01");
  assert.equal(months[0].income, 5000);
  assert.equal(months[0].allocated, 1500);
  assert.equal(months[0].buffer, 3500);
  assert.equal(months[5].income, 4000);
  assert.equal(months[1].income, 0);
  assert.equal(months[1].allocated, 0);

  const year = annualAllocation(rows, envelopes, plan, "2026");
  assert.equal(year.income, 9000);
  assert.equal(year.rows[0].amount, 900);
  assert.equal(year.rows[1].amount, 2000);
  assert.equal(year.allocated, 2900);
  assert.equal(year.buffer, 6100);
  assert.equal(year.months.filter((m) => m.count > 0).length, 2);
  assert.equal(year.over, false);
});

/* ---------- plans ---------- */

test("renamePlan trims and keeps the plan on empty names; duplicatePlan copies envelopes with new ids and no earnings", () => {
  const renamed = renamePlan(plan, "  Day job  ");
  assert.equal(renamed.name, "Day job");
  assert.equal(renamed.id, plan.id);
  assert.equal(renamePlan(plan, "   ").name, "Freelance");

  const envelopes = [env("Savings", "percent", 20, "savings", 1), env("Rent", "fixed", 1200, "bills", 0)];
  const { plan: copy, envelopes: copied } = duplicatePlan(plan, [...envelopes, makeEnvelope("someone-else", "x", "fixed", 1, "bills")], " (copy)");
  assert.notEqual(copy.id, plan.id);
  assert.equal(copy.name, "Freelance (copy)");
  assert.equal(copy.currency, "USD");
  assert.equal(copy.incomeMode, "irregular");
  assert.equal(copied.length, 2);
  assert.deepEqual(copied.map((e) => e.name), ["Rent", "Savings"]);
  for (const e of copied) {
    assert.equal(e.planId, copy.id);
    assert.ok(!envelopes.some((o) => o.id === e.id), "new id");
  }
});

/* ---------- unlimited ---------- */

test("unlimited envelopes: 250 envelopes allocate fine and no MAX_ENVELOPES exists in the code", () => {
  const many = Array.from({ length: 250 }, (_, i) => env(`E${i}`, i % 2 ? "percent" : "fixed", i % 2 ? 0.2 : 3, "sinking", i));
  const a = allocate(many, 10000);
  assert.equal(a.rows.length, 250);
  assert.ok(a.allocated > 0);
  for (const f of ["budget.ts", "store.ts", "i18n.ts"]) {
    const src = readFileSync(new URL(`../src/lib/${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /MAX_ENVELOPES|maxEnvelopes|envelopeLimit|ENVELOPE_LIMIT/, f);
  }
  const home = readFileSync(new URL("../src/routes/home.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(home, /MAX_ENVELOPES|maxEnvelopes|envelopeLimit|ENVELOPE_LIMIT|length\s*>=\s*10\b/, "home.tsx");
});

/* ---------- backup ---------- */

test("JSON export/import roundtrip keeps plans, earnings, envelopes and prefs", () => {
  const envelopes = [env("Savings", "percent", 20, "savings", 0), env("Rent", "fixed", 1200, "bills", 1)];
  const earnings = [earn(3000, "2026-09-01", "Client A"), earn(50000, "2026-09-05", "KR", "KRW")];
  const prefs = { activePlanId: plan.id, view: "annual" };
  const b = buildBackup([plan], earnings, envelopes, prefs, new Date("2026-09-15T00:00:00Z"));
  assert.equal(b.app, "paypad");
  assert.equal(b.version, 1);
  const text = toJSON(b);
  const parsed = parseBackup(JSON.parse(text));
  assert.ok(parsed);
  assert.deepEqual(parsed.plans, [plan]);
  assert.deepEqual(parsed.earnings, earnings);
  assert.deepEqual(parsed.envelopes, envelopes);
  assert.deepEqual(parsed.prefs, prefs);
  assert.equal(parsed.exportedAt, "2026-09-15T00:00:00.000Z");
});

test("legacy-friendly import: paycheck-planner style incomes/buckets without a plan list, unknown keys ignored", () => {
  const parsed = parseBackup({
    currency: "GBP",
    frequency: "bi-weekly",
    incomes: [{ takeHome: "1,800", paidAt: "2026-09-05", source: "Job" }, { amount: 300, date: "2026/09/12" }],
    buckets: [
      { name: "Savings", percent: 15, category: "Saving" },
      { title: "Rent", amount: 900, type: "fixed", group: "Bills" },
      { label: "Car loan", type: "%", value: 5, bucket: "loans" },
      { garbage: true },
    ],
    somethingElse: { deep: [1, 2, 3] },
  }, "Imported");
  assert.ok(parsed);
  assert.equal(parsed.plans.length, 1);
  assert.equal(parsed.plans[0].name, "Imported");
  assert.equal(parsed.plans[0].currency, "GBP");
  assert.equal(parsed.plans[0].incomeMode, "biweekly");
  assert.equal(parsed.earnings.length, 2);
  assert.equal(parsed.earnings[0].amount, 1800);
  assert.equal(parsed.earnings[0].label, "Job");
  assert.equal(parsed.earnings[1].date, "2026-09-12");
  assert.deepEqual(parsed.envelopes.map((e) => [e.name, e.kind, e.value, e.category]), [
    ["Savings", "percent", 15, "savings"],
    ["Rent", "fixed", 900, "bills"],
    ["Car loan", "percent", 5, "debt"],
  ]);
  for (const e of parsed.envelopes) assert.equal(e.planId, parsed.plans[0].id);
});

test("parseBackup: bare envelope array, data wrapper, and garbage", () => {
  const bare = parseBackup([{ name: "Fun", kind: "percent", value: 10 }]);
  assert.ok(bare);
  assert.equal(bare.envelopes.length, 1);
  const wrapped = parseBackup({ data: { plans: [{ name: "P", currency: "JPY" }], envelopes: [{ name: "A", kind: "fixed", value: 5 }] } });
  assert.ok(wrapped);
  assert.equal(wrapped.plans[0].currency, "JPY");
  assert.equal(wrapped.envelopes[0].planId, wrapped.plans[0].id);
  assert.equal(parseBackup(null), null);
  assert.equal(parseBackup("nope"), null);
  assert.equal(parseBackup({ hello: "world" }), null);
  assert.equal(parseBackup({ plans: [{ name: "P" }], prefs: { activePlanId: "ghost", view: "weird" } }).prefs.view, "monthly");
  assert.equal(parseBackup({ plans: [{ name: "P" }], prefs: { activePlanId: "ghost" } }).prefs.activePlanId, undefined);
});

test("coercions: income mode, category, prefs and envelope rows", () => {
  assert.equal(coerceIncomeMode("Monthly"), "monthly");
  assert.equal(coerceIncomeMode("격주"), "biweekly");
  assert.equal(coerceIncomeMode("freelance"), "irregular");
  assert.equal(coerceIncomeMode(42), "monthly");
  assert.equal(coerceCategory("Emergency"), "savings");
  assert.equal(coerceCategory("家賃"), "bills");
  assert.equal(coerceCategory("whatever"), "flexible");
  assert.deepEqual(parsePrefs({ view: "annual", activePlanId: "p1" }), { view: "annual", activePlanId: "p1" });
  assert.deepEqual(parsePrefs("x"), { view: "monthly" });
  const rows = parseEnvelopes([{ name: "A", kind: "percent", value: 20 }, { name: "A2", ratio: 5 }, { nope: 1 }], undefined, "plan-1");
  assert.equal(rows.length, 2);
  assert.equal(rows[1].kind, "percent");
  assert.equal(rows[1].value, 5);
  assert.equal(rows[1].sortOrder, 1);
});
