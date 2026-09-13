import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  addCycle,
  coerceCycle,
  coerceDateKey,
  daysUntil,
  formatMoney,
  monthlyEquivalent,
  nextOnOrAfter,
  normalizeCurrency,
  roundMoney,
  totalsByCurrency,
  yearlyEquivalent,
} from "../src/lib/money.ts";
import { foldLine, icsEscape, icsFilename, icsForSubscriptions, rruleFor } from "../src/lib/ics.ts";
import {
  BACKUP_APP,
  buildBackup,
  defaultPrefs,
  normalizeSubscription,
  parseBackup,
  parsePrefs,
  settleRenewal,
  toJSON,
} from "../src/lib/store.ts";
import { CATEGORIES, CATEGORY_MAP, colorFor, initialsFor, searchTemplates, STARTER_TEMPLATE_IDS, TEMPLATE_MAP, TEMPLATES } from "../src/lib/templates.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");

function sub(overrides = {}) {
  return {
    id: "s-1",
    name: "Netflix",
    price: 15.49,
    currency: "USD",
    nextRenewal: "2026-09-20",
    cycle: "monthly",
    status: "active",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

/* ---------- cycle math ---------- */

test("monthly equivalent: weekly*52/12, monthly*1, quarterly/3, yearly/12", () => {
  assert.equal(monthlyEquivalent(12, "weekly"), 52);
  assert.equal(monthlyEquivalent(10, "monthly"), 10);
  assert.equal(monthlyEquivalent(30, "quarterly"), 10);
  assert.equal(monthlyEquivalent(120, "yearly"), 10);
});

test("yearly equivalent is the inverse", () => {
  assert.equal(yearlyEquivalent(1, "weekly"), 52);
  assert.equal(yearlyEquivalent(10, "monthly"), 120);
  assert.equal(yearlyEquivalent(30, "quarterly"), 120);
  assert.equal(yearlyEquivalent(120, "yearly"), 120);
});

test("totals group by currency and never merge across currencies", () => {
  const rows = totalsByCurrency([
    sub({ id: "a", price: 10, currency: "USD", cycle: "monthly" }),
    sub({ id: "b", price: 120, currency: "USD", cycle: "yearly" }),
    sub({ id: "c", price: 17000, currency: "KRW", cycle: "monthly" }),
    sub({ id: "d", price: 99, currency: "USD", cycle: "monthly", status: "cancelled" }),
    sub({ id: "e", price: 5, currency: "EUR", cycle: "monthly", status: "paused" }),
  ]);
  const usd = rows.find((r) => r.currency === "USD");
  const krw = rows.find((r) => r.currency === "KRW");
  assert.equal(rows.length, 2, "paused/cancelled currencies do not appear");
  assert.equal(usd.monthly, 20);
  assert.equal(usd.yearly, 240);
  assert.equal(usd.count, 2);
  assert.equal(krw.monthly, 17000);
  assert.equal(krw.yearly, 204000);
  assert.ok(!rows.some((r) => r.currency === "TOTAL"), "no fake merged row");
});

test("roundMoney respects zero-decimal currencies", () => {
  assert.equal(roundMoney(1234.567, "KRW"), 1235);
  assert.equal(roundMoney(1234.567, "USD"), 1234.57);
  assert.match(formatMoney(15.49, "USD", "en-US"), /\$15\.49/);
  assert.match(formatMoney(17000, "KRW", "ko-KR"), /17,000/);
});

/* ---------- days ---------- */

test("daysUntil counts calendar days; negative means overdue", () => {
  const today = new Date(2026, 8, 14, 23, 50);
  assert.equal(daysUntil("2026-09-14", today), 0);
  assert.equal(daysUntil("2026-09-15", today), 1);
  assert.equal(daysUntil("2026-09-21", today), 7);
  assert.equal(daysUntil("2026-09-10", today), -4);
  assert.equal(daysUntil("2027-09-14", today), 365);
});

test("addCycle clamps to month end and handles year rollover", () => {
  assert.equal(addCycle("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(addCycle("2026-12-15", "monthly"), "2027-01-15");
  assert.equal(addCycle("2026-11-30", "quarterly"), "2027-02-28");
  assert.equal(addCycle("2028-02-29", "yearly"), "2029-02-28");
  assert.equal(addCycle("2026-09-14", "weekly"), "2026-09-21");
  assert.equal(addCycle("2026-09-14", "monthly", 3), "2026-12-14");
});

test("nextOnOrAfter rolls an old date forward to today or later", () => {
  const today = new Date(2026, 8, 14);
  assert.equal(nextOnOrAfter("2026-01-05", "monthly", today), "2026-10-05");
  assert.equal(nextOnOrAfter("2026-09-14", "monthly", today), "2026-09-14");
  assert.equal(nextOnOrAfter("2020-03-01", "yearly", today), "2027-03-01");
});

test("coerceCycle and coerceDateKey read foreign spellings", () => {
  assert.equal(coerceCycle("Monthly"), "monthly");
  assert.equal(coerceCycle("annual"), "yearly");
  assert.equal(coerceCycle("week"), "weekly");
  assert.equal(coerceCycle("quarter"), "quarterly");
  assert.equal(coerceCycle("매월"), "monthly");
  assert.equal(coerceCycle("garbage"), "monthly");
  assert.equal(coerceCycle(12), "yearly");
  assert.equal(coerceDateKey("2026-09-14T10:00:00.000Z", "x"), "2026-09-14");
  assert.equal(coerceDateKey("2026/9/4", "x"), "2026-09-04");
  assert.equal(coerceDateKey("nonsense", "2026-01-01"), "2026-01-01");
  assert.equal(normalizeCurrency("usd"), "USD");
  assert.equal(normalizeCurrency("₩"), "KRW");
  assert.equal(normalizeCurrency(undefined, "JPY"), "JPY");
});

/* ---------- mark paid ---------- */

test("settleRenewal(paid) records a payment and advances nextRenewal by one cycle", () => {
  const now = new Date("2026-09-14T09:00:00.000Z");
  const r = settleRenewal(sub({ nextRenewal: "2026-09-20", cycle: "monthly" }), "paid", now);
  assert.equal(r.subscription.nextRenewal, "2026-10-20");
  assert.equal(r.payment.subscriptionId, "s-1");
  assert.equal(r.payment.dueDate, "2026-09-20");
  assert.equal(r.payment.status, "paid");
  assert.equal(r.payment.amount, 15.49);
  assert.equal(r.payment.currency, "USD");
  assert.equal(r.subscription.updatedAt, now.toISOString());
});

test("settleRenewal(skipped) advances too, without an amount", () => {
  const r = settleRenewal(sub({ nextRenewal: "2026-09-20", cycle: "yearly" }), "skipped");
  assert.equal(r.subscription.nextRenewal, "2027-09-20");
  assert.equal(r.payment.status, "skipped");
  assert.equal(r.payment.amount, undefined);
});

/* ---------- backup ---------- */

test("JSON export carries app/version and round-trips", () => {
  const subs = [sub(), sub({ id: "s-2", name: "도메인", price: 15000, currency: "KRW", cycle: "yearly", categoryId: "domains" })];
  const payments = [{ id: "p-1", subscriptionId: "s-1", dueDate: "2026-08-20", completedAt: "2026-08-20T00:00:00.000Z", amount: 15.49, currency: "USD", status: "paid" }];
  const cats = [{ id: "c-x", name: "Kids", color: "#123456" }];
  const json = toJSON(buildBackup(subs, payments, cats, defaultPrefs(), new Date("2026-09-14T00:00:00.000Z")));
  const raw = JSON.parse(json);
  assert.equal(raw.app, "subpad");
  assert.equal(raw.version, 1);
  assert.equal(raw.exportedAt, "2026-09-14T00:00:00.000Z");
  const back = parseBackup(raw);
  assert.equal(back.app, BACKUP_APP);
  assert.deepEqual(JSON.parse(JSON.stringify(back.subscriptions)), subs);
  assert.deepEqual(JSON.parse(JSON.stringify(back.payments)), payments);
  assert.deepEqual(JSON.parse(JSON.stringify(back.categories)), cats);
  assert.deepEqual(back.prefs, defaultPrefs());
});

test("legacy-friendly import: { services: [...] } with foreign field names maps cleanly", () => {
  const back = parseBackup({
    services: [
      { title: "Spotify", amount: "9.99", cur: "usd", nextBillingDate: "2026-10-01T00:00:00Z", billingCycle: "month", category: "Music", url: "https://spotify.com" },
      { name: "Domain", cost: 12, currency: "EUR", renewalDate: "2027/01/05", period: "annual", active: false },
      { name: "", price: 1 },
      "junk",
      null,
    ],
    somethingUnknown: { deeply: [1, 2, 3] },
  });
  assert.ok(back);
  assert.equal(back.subscriptions.length, 2);
  const [sp, dom] = back.subscriptions;
  assert.equal(sp.name, "Spotify");
  assert.equal(sp.price, 9.99);
  assert.equal(sp.currency, "USD");
  assert.equal(sp.nextRenewal, "2026-10-01");
  assert.equal(sp.cycle, "monthly");
  assert.equal(sp.categoryId, "music");
  assert.equal(sp.website, "https://spotify.com");
  assert.equal(sp.status, "active");
  assert.ok(sp.id);
  assert.equal(dom.cycle, "yearly");
  assert.equal(dom.nextRenewal, "2027-01-05");
  assert.equal(dom.status, "cancelled");
  assert.equal(back.payments.length, 0);
});

test("import accepts a bare array, a { data: {...} } wrapper, and rejects nonsense", () => {
  assert.equal(parseBackup([{ name: "A", price: 1 }]).subscriptions.length, 1);
  assert.equal(parseBackup({ data: { subscriptions: [{ name: "B", price: 2 }] } }).subscriptions.length, 1);
  assert.equal(parseBackup({ hello: "world" }), null);
  assert.equal(parseBackup("nope"), null);
  assert.equal(parseBackup(null), null);
  const empty = parseBackup({ app: "subpad", version: 1, subscriptions: [] });
  assert.ok(empty, "an empty but well-formed backup is still valid");
  assert.equal(empty.subscriptions.length, 0);
});

test("payments that point at unknown subscriptions are dropped on import", () => {
  const back = parseBackup({
    subscriptions: [{ id: "keep", name: "Keep", price: 1 }],
    payments: [
      { subscriptionId: "keep", dueDate: "2026-09-01", status: "paid" },
      { subscriptionId: "gone", dueDate: "2026-09-01", status: "paid" },
    ],
  });
  assert.equal(back.payments.length, 1);
  assert.equal(back.payments[0].subscriptionId, "keep");
});

test("normalizeSubscription never throws on strange input and clamps sizes", () => {
  assert.equal(normalizeSubscription(42), null);
  assert.equal(normalizeSubscription({}), null);
  const s = normalizeSubscription({ name: "x".repeat(500), price: -5, currency: 7, cycle: {}, nextRenewal: "??", iconKey: "netflix" });
  assert.equal(s.name.length, 80);
  assert.equal(s.price, 0);
  assert.equal(s.currency, "USD");
  assert.equal(s.cycle, "monthly");
  assert.match(s.nextRenewal, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(s.categoryId, "streaming", "template icon implies its category");
});

test("prefs parse with defaults and reject unknown sort/window", () => {
  const p = parsePrefs({ sort: "weird", window: "9", hideCancelled: "yes", defaultCurrency: "jpy" });
  assert.equal(p.sort, "renewal");
  assert.equal(p.window, "all");
  assert.equal(p.hideCancelled, true);
  assert.equal(p.defaultCurrency, "JPY");
});

/* ---------- ics ---------- */

test("ics export is a VCALENDAR with one VEVENT per subscription, summary, RRULE and alarm", () => {
  const now = new Date("2026-09-14T08:00:00.000Z");
  const ics = icsForSubscriptions(
    [sub({ nextRenewal: "2026-09-20", cycle: "monthly" }), sub({ id: "s-2", name: "Domain, yearly; test", nextRenewal: "2026-01-05", cycle: "yearly", currency: "EUR", price: 9.99 })],
    { now, locale: "en-US" },
  );
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(ics, /SUMMARY:Netflix/);
  assert.match(ics, /SUMMARY:Domain\\, yearly\\; test/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260920/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270105/, "old yearly date rolled forward");
  assert.match(ics, /RRULE:FREQ=MONTHLY\r\n/);
  assert.match(ics, /RRULE:FREQ=YEARLY\r\n/);
  assert.match(ics, /UID:s-1@subpad\.try-dabble\.com/);
  assert.match(ics, /BEGIN:VALARM[\s\S]*TRIGGER:-P1D[\s\S]*END:VALARM/);
  assert.match(ics, /DESCRIPTION:\$15\.49/);
  assert.doesNotMatch(ics, /http/, "no remote fetch, no logo URLs");
});

test("ics helpers: rrule per cycle, escaping, folding, filenames", () => {
  assert.equal(rruleFor("weekly"), "FREQ=WEEKLY");
  assert.equal(rruleFor("quarterly"), "FREQ=MONTHLY;INTERVAL=3");
  assert.equal(icsEscape("a,b;c\\d\nline"), "a\\,b\\;c\\\\d\\nline");
  const folded = foldLine("X:" + "y".repeat(200));
  assert.ok(folded.split("\r\n ").every((l) => Buffer.byteLength(l) <= 75));
  assert.equal(folded.replace(/\r\n /g, ""), "X:" + "y".repeat(200));
  assert.equal(icsFilename(null), "subpad-all.ics");
  assert.equal(icsFilename(sub({ name: "YouTube Premium" })), "subpad-youtube-premium.ics");
  assert.equal(icsFilename(sub({ name: "넷플릭스" })), "subpad-넷플릭스.ics");
});

/* ---------- templates ---------- */

test("templates: solid set, every one has 4 names, a real category and a local tile", () => {
  assert.ok(TEMPLATES.length >= 25, `only ${TEMPLATES.length} templates`);
  for (const tpl of TEMPLATES) {
    for (const lang of ["ko", "en", "ja", "zh"]) assert.ok(tpl.names[lang], `${tpl.id} ${lang}`);
    assert.ok(CATEGORY_MAP[tpl.categoryId], `${tpl.id} category ${tpl.categoryId}`);
    assert.ok(tpl.tile.label && /^#[0-9a-f]{6}$/i.test(tpl.tile.color), `${tpl.id} tile`);
    assert.doesNotMatch(tpl.tile.label, /https?:/, "tile is never a URL");
  }
  for (const id of ["netflix", "spotify", "youtube-premium", "icloud", "adobe-cc", "chatgpt-plus", "claude-pro", "domain", "mobile-plan", "github-copilot", "steam", "duolingo", "gym", "broadband"]) {
    assert.ok(TEMPLATE_MAP[id], `missing template ${id}`);
  }
  for (const id of STARTER_TEMPLATE_IDS) assert.ok(TEMPLATE_MAP[id], `starter ${id}`);
  const ids = new Set(TEMPLATES.map((x) => x.id));
  assert.equal(ids.size, TEMPLATES.length, "template ids unique");
});

test("categories cover the Renew404-ish set and have 4 names", () => {
  for (const id of ["streaming", "music", "cloud", "productivity", "ai", "gaming", "finance", "education", "domains", "network", "shopping", "social", "travel", "other"]) {
    assert.ok(CATEGORY_MAP[id], id);
  }
  for (const c of CATEGORIES) for (const lang of ["ko", "en", "ja", "zh"]) assert.ok(c.names[lang], `${c.id} ${lang}`);
});

test("template search matches localized names, aliases and categories", () => {
  assert.ok(searchTemplates("netf", "en").some((x) => x.id === "netflix"));
  assert.ok(searchTemplates("넷플", "ko").some((x) => x.id === "netflix"));
  assert.ok(searchTemplates("vpn", "en").some((x) => x.id === "nordvpn"));
  assert.ok(searchTemplates("openai", "en").some((x) => x.id === "chatgpt-plus"));
  assert.ok(searchTemplates("", "en", "gaming").every((x) => x.categoryId === "gaming"));
  assert.equal(searchTemplates("zzzz-nothing", "en").length, 0);
});

test("initials and colours are deterministic and local", () => {
  assert.equal(initialsFor("YouTube Premium"), "YP");
  assert.equal(initialsFor("넷플릭스"), "넷");
  assert.equal(initialsFor("x"), "X");
  assert.equal(colorFor("Anything", "music"), CATEGORY_MAP.music.color);
  assert.equal(colorFor("Same name"), colorFor("Same name"));
  assert.match(colorFor("Whatever"), /^#[0-9a-f]{6}$/);
});

/* ---------- built shell ---------- */

test("built index.html (when built) has no paywall / bank / plaid / ad strings", { skip: !existsSync(path.join(APP, "dist", "index.html")) }, () => {
  const html = readFileSync(path.join(APP, "dist", "index.html"), "utf8");
  assert.doesNotMatch(html, /adsbygoogle|googlesyndication|ca-pub-|AdSlot|doubleclick/i);
  assert.doesNotMatch(html, /plaid|open banking|connect (your )?bank|link (your )?bank|paywall|\$9\.99|upgrade to pro|sign in|log in/i);
  assert.match(html, /naver-site-verification/);
  assert.match(html, /id="local-only"/);
  assert.match(html, /class="sb-tagline"/);
});
