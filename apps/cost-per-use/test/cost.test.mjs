import assert from "node:assert/strict";
import test from "node:test";

import {
  SORT_IDS,
  calcMetrics,
  daysSince,
  formatMoney,
  lifetimeToDays,
  normalizeItem,
  sortItems,
  todayISO,
} from "../src/lib/cost.ts";

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

test("days owned counts local calendar days and never goes negative", () => {
  assert.equal(daysSince(todayISO()), 0);
  assert.equal(daysSince(isoDaysAgo(10)), 10);
  assert.equal(daysSince(isoDaysAgo(-5)), 0);
});

test("lifetime units keep the pre-Vite calendar averages", () => {
  assert.equal(lifetimeToDays(30, "days"), 30);
  assert.equal(lifetimeToDays(2, "months"), 60.88);
  assert.equal(lifetimeToDays(1, "years"), 365.25);
  // Zero, blank and negative all mean "no expected life".
  assert.equal(lifetimeToDays(0, "years"), 0);
  assert.equal(lifetimeToDays(null, "years"), 0);
  assert.equal(lifetimeToDays(-3, "days"), 0);
});

test("cost per day divides by the expected life when one is given", () => {
  const m = calcMetrics({
    price: 365.25,
    purchaseDate: isoDaysAgo(10),
    timesUsed: null,
    lifetimeValue: 1,
    lifetimeUnit: "years",
  });
  assert.equal(m.usesLifetimeFallback, false);
  assert.equal(m.perDay, 1);
  // …and still reports what it has actually cost per day so far.
  assert.equal(m.ownedDays, 10);
  assert.equal(m.perDaySoFar, 36.525);
});

test("with no expected life it falls back to days owned, never dividing by zero", () => {
  const bought = calcMetrics({
    price: 200,
    purchaseDate: isoDaysAgo(4),
    timesUsed: null,
    lifetimeValue: null,
    lifetimeUnit: "years",
  });
  assert.equal(bought.usesLifetimeFallback, true);
  assert.equal(bought.perDay, 50);

  const today = calcMetrics({
    price: 200,
    purchaseDate: todayISO(),
    timesUsed: null,
    lifetimeValue: null,
    lifetimeUnit: "years",
  });
  assert.equal(today.ownedDays, 0);
  assert.equal(today.perDay, 200);
});

test("cost per use needs a positive times-used", () => {
  const base = {
    price: 120,
    purchaseDate: isoDaysAgo(30),
    lifetimeValue: null,
    lifetimeUnit: "days",
  };
  assert.equal(calcMetrics({ ...base, timesUsed: 12 }).perUse, 10);
  assert.equal(calcMetrics({ ...base, timesUsed: 0 }).perUse, null);
  assert.equal(calcMetrics({ ...base, timesUsed: null }).perUse, null);
});

test("a v1 row normalizes into a v2 row with no lifetime", () => {
  const migrated = normalizeItem({
    id: "abc",
    name: "Winter coat",
    price: "300",
    purchaseDate: "2024-01-02",
    timesUsed: "",
    lifetimeValue: null,
    lifetimeUnit: "days",
  });
  assert.deepEqual(migrated, {
    id: "abc",
    name: "Winter coat",
    price: 300,
    purchaseDate: "2024-01-02",
    timesUsed: null,
    lifetimeValue: null,
    lifetimeUnit: "days",
    createdAt: undefined,
    updatedAt: undefined,
  });
});

test("money formatting drops decimals for KRW and JPY only", () => {
  assert.equal(formatMoney(1234.56, "ko"), "₩1,235");
  assert.equal(formatMoney(1234.56, "ja"), "￥1,235");
  assert.equal(formatMoney(1234.56, "en"), "$1,234.56");
  assert.equal(formatMoney(Number.POSITIVE_INFINITY, "en"), "—");
});

test("the three saved sort orders behave", () => {
  assert.deepEqual([...SORT_IDS], ["recent", "perDay", "name"]);
  const items = [
    { id: "a", name: "Boots", price: 100, purchaseDate: "2024-01-01", timesUsed: null, lifetimeValue: 100, lifetimeUnit: "days" },
    { id: "b", name: "Anorak", price: 100, purchaseDate: "2025-06-01", timesUsed: null, lifetimeValue: 10, lifetimeUnit: "days" },
  ];
  assert.deepEqual(sortItems(items, "recent", "en").map((i) => i.id), ["b", "a"]);
  assert.deepEqual(sortItems(items, "perDay", "en").map((i) => i.id), ["b", "a"]);
  assert.deepEqual(sortItems(items, "name", "en").map((i) => i.id), ["b", "a"]);
  // sortItems must not mutate the caller's array.
  assert.deepEqual(items.map((i) => i.id), ["a", "b"]);
});
