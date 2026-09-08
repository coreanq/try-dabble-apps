import assert from "node:assert/strict";
import test from "node:test";

import {
  codesOf,
  convert,
  decimalsFor,
  formatNumber,
  parseAmount,
  parseSnapshot,
  snapshotFromApi,
  unitRate,
} from "../src/lib/rates.ts";
import { defaultPair, parsePrefs } from "../src/lib/prefs.ts";
import { matchesQuery, pickerList } from "../src/lib/currencies.ts";

const SNAP = {
  base: "EUR",
  date: "2026-09-07",
  rates: { JPY: 179.85, KRW: 1566.56, USD: 1.1622, CNY: 7.7995 },
  fetchedAt: "2026-09-08T01:02:03.000Z",
};

function close(a, b, eps = 1e-9) {
  assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);
}

test("unit rate routes through the base: KRW→JPY = (EUR→JPY)/(EUR→KRW)", () => {
  close(unitRate(SNAP, "KRW", "JPY"), 179.85 / 1566.56);
  close(unitRate(SNAP, "JPY", "KRW"), 1566.56 / 179.85);
  close(unitRate(SNAP, "EUR", "JPY"), 179.85);
  close(unitRate(SNAP, "JPY", "EUR"), 1 / 179.85);
  assert.equal(unitRate(SNAP, "JPY", "JPY"), 1);
});

test("convert multiplies the amount by the cross rate", () => {
  close(convert(SNAP, 10000, "KRW", "JPY"), 10000 * (179.85 / 1566.56));
  close(convert(SNAP, 100, "USD", "JPY"), 100 * (179.85 / 1.1622));
  assert.equal(convert(SNAP, 0, "USD", "JPY"), 0);
});

test("a round trip A→B→A returns the original amount", () => {
  const there = convert(SNAP, 12345.67, "USD", "KRW");
  const back = convert(SNAP, there, "KRW", "USD");
  close(back, 12345.67, 1e-6);
});

test("missing codes, no snapshot, or a bad amount give null", () => {
  assert.equal(convert(SNAP, 1, "XXX", "JPY"), null);
  assert.equal(convert(SNAP, 1, "JPY", "XXX"), null);
  assert.equal(convert(null, 1, "USD", "JPY"), null);
  assert.equal(convert(SNAP, NaN, "USD", "JPY"), null);
  assert.equal(unitRate(null, "USD", "JPY"), null);
});

test("codesOf lists the base plus every rate, sorted", () => {
  assert.deepEqual(codesOf(SNAP), ["CNY", "EUR", "JPY", "KRW", "USD"]);
  assert.deepEqual(codesOf(null), []);
});

test("snapshotFromApi stamps fetchedAt and keeps Frankfurter's base/date/rates", () => {
  const now = new Date("2026-09-08T09:00:00.000Z");
  const snap = snapshotFromApi({ amount: 1, base: "EUR", date: "2026-09-07", rates: { JPY: 179.85 } }, now);
  assert.deepEqual(snap, {
    base: "EUR",
    date: "2026-09-07",
    rates: { JPY: 179.85 },
    fetchedAt: "2026-09-08T09:00:00.000Z",
  });
});

test("parseSnapshot rejects damaged cache and drops non-positive rates", () => {
  assert.equal(parseSnapshot(null), null);
  assert.equal(parseSnapshot("x"), null);
  assert.equal(parseSnapshot({ base: "EUR", date: "2026-09-07", rates: {}, fetchedAt: SNAP.fetchedAt }), null);
  assert.equal(parseSnapshot({ ...SNAP, date: "yesterday" }), null);
  assert.equal(parseSnapshot({ ...SNAP, fetchedAt: "not a date" }), null);
  const cleaned = parseSnapshot({ ...SNAP, rates: { JPY: 179.85, BAD: -1, WORSE: "1", ok: 2 } });
  assert.deepEqual(cleaned.rates, { JPY: 179.85 });
});

test("parseAmount accepts traveler input: commas, spaces, full-width digits", () => {
  assert.equal(parseAmount("10,000"), 10000);
  assert.equal(parseAmount("１０００"), 1000);
  assert.equal(parseAmount("12.5"), 12.5);
  assert.equal(parseAmount("3 000"), 3000);
  assert.equal(parseAmount(".5"), 0.5);
  assert.ok(Number.isNaN(parseAmount("")));
  assert.ok(Number.isNaN(parseAmount("abc")));
  assert.ok(Number.isNaN(parseAmount("-5")));
  assert.ok(Number.isNaN(parseAmount("1.2.3")));
});

test("decimals shrink as the number grows; formatNumber follows the locale", () => {
  assert.equal(decimalsFor(150000), 0);
  assert.equal(decimalsFor(12.3456), 2);
  assert.equal(decimalsFor(0.1148), 4);
  assert.equal(decimalsFor(0.0009), 6);
  assert.equal(formatNumber(1148.09, "en-US"), "1,148");
  assert.equal(formatNumber(0.114799, "en-US"), "0.1148");
  assert.equal(formatNumber(12.5, "en-US"), "12.5");
});

test("default pairs favor JPY for ko/en/zh and start from JPY for ja", () => {
  assert.deepEqual(defaultPair("ko"), { from: "KRW", to: "JPY" });
  assert.deepEqual(defaultPair("en"), { from: "USD", to: "JPY" });
  assert.deepEqual(defaultPair("zh"), { from: "CNY", to: "JPY" });
  assert.deepEqual(defaultPair("ja"), { from: "JPY", to: "USD" });
});

test("parsePrefs keeps valid fields and repairs the rest", () => {
  const p = parsePrefs({ from: "JPY", to: "bad", amount: "5000", fontSize: "xl" }, "en");
  assert.deepEqual(p, { from: "JPY", to: "JPY", amount: "5000", fontSize: "xl" });
  assert.deepEqual(parsePrefs(null, "ko"), { from: "KRW", to: "JPY", amount: "10000", fontSize: "md" });
  assert.equal(parsePrefs({ fontSize: "huge" }, "en").fontSize, "md");
});

test("picker lists JPY first, only synced codes once a snapshot exists, and searches names", () => {
  const all = pickerList([]);
  assert.equal(all[0].code, "JPY");
  assert.ok(all.length >= 30);
  const synced = pickerList(codesOf(SNAP));
  assert.deepEqual(synced.map((c) => c.code), ["JPY", "KRW", "USD", "EUR", "CNY"]);
  const withExtra = pickerList(["JPY", "XYZ"]);
  assert.deepEqual(withExtra.map((c) => c.code), ["JPY", "XYZ"]);
  assert.equal(withExtra[1].flag, "💱");
  const jpy = synced[0];
  assert.ok(matchesQuery(jpy, "en", "yen"));
  assert.ok(matchesQuery(jpy, "ko", "엔"));
  assert.ok(matchesQuery(jpy, "ja", "円"));
  assert.ok(matchesQuery(jpy, "zh", "jpy"));
  assert.ok(!matchesQuery(jpy, "en", "won"));
});
