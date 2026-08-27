import assert from "node:assert/strict";
import test from "node:test";

import {
  DAY,
  WEEK_MAX,
  expireOld,
  keepThisWeek,
  normalizeUrl,
  parseBookmarkHtml,
  parseImport,
  sortForStatus,
} from "../src/lib/items.ts";

const NOW = Date.UTC(2026, 7, 27);

function item(over = {}) {
  return {
    id: over.id ?? "id",
    url: over.url ?? "https://example.com/a",
    title: over.title ?? "",
    why: over.why ?? "because",
    createdAt: over.createdAt ?? NOW,
    touchedAt: over.touchedAt ?? NOW,
    status: over.status ?? "inbox",
    pinned: over.pinned ?? false,
    draft: over.draft ?? false,
  };
}

test("unpinned inbox items older than 30 days expire on load", () => {
  const old = item({ id: "old", createdAt: NOW - 31 * DAY });
  const fresh = item({ id: "fresh", createdAt: NOW - 29 * DAY });
  const { items, expired } = expireOld([old, fresh], NOW);

  assert.equal(expired, 1);
  assert.equal(items.find((it) => it.id === "old").status, "expired");
  assert.equal(items.find((it) => it.id === "fresh").status, "inbox");
});

test("a pin survives the 30-day sweep", () => {
  const pinned = item({ id: "p", createdAt: NOW - 400 * DAY, pinned: true });
  const { items, expired } = expireOld([pinned], NOW);

  assert.equal(expired, 0);
  assert.equal(items[0].status, "inbox");
});

test("the sweep leaves drafts, this-week and done alone", () => {
  const stale = NOW - 90 * DAY;
  const untouched = [
    item({ id: "d", createdAt: stale, draft: true }),
    item({ id: "w", createdAt: stale, status: "week" }),
    item({ id: "k", createdAt: stale, status: "done" }),
  ];
  const { items, expired } = expireOld(untouched, NOW);

  assert.equal(expired, 0);
  assert.deepEqual(
    items.map((it) => it.status),
    ["inbox", "week", "done"],
  );
});

test("this week holds at most 3; a fourth bumps the least recently touched", () => {
  const week = [1, 2, 3].map((n) =>
    item({ id: `w${n}`, status: "week", touchedAt: NOW - n * DAY }),
  );
  const incoming = item({ id: "new" });

  const { items, bumped } = keepThisWeek([...week, incoming], incoming, NOW);

  assert.equal(bumped, true);
  assert.equal(items.filter((it) => it.status === "week").length, WEEK_MAX);
  // w3 was touched longest ago, so it is the one that returns to the inbox.
  assert.equal(items.find((it) => it.id === "w3").status, "inbox");
  assert.equal(items.find((it) => it.id === "new").status, "week");
});

test("promoting into a week with room bumps nothing", () => {
  const incoming = item({ id: "new" });
  const { items, bumped } = keepThisWeek(
    [item({ id: "w1", status: "week" }), incoming],
    incoming,
    NOW,
  );

  assert.equal(bumped, false);
  assert.equal(items.filter((it) => it.status === "week").length, 2);
});

test("promoting a draft clears its draft flag", () => {
  const draft = item({ id: "d", draft: true });
  const { items } = keepThisWeek([draft], draft, NOW);

  assert.equal(items[0].draft, false);
  assert.equal(items[0].status, "week");
});

test("search matches title, why and URL", () => {
  const list = [
    item({ id: "a", title: "Rust ownership", why: "revisit", url: "https://x.dev/1" }),
    item({ id: "b", title: "", why: "tax deadline", url: "https://irs.gov/forms" }),
  ];

  assert.deepEqual(sortForStatus(list, "inbox", "rust").map((it) => it.id), ["a"]);
  assert.deepEqual(sortForStatus(list, "inbox", "deadline").map((it) => it.id), ["b"]);
  assert.deepEqual(sortForStatus(list, "inbox", "irs.gov").map((it) => it.id), ["b"]);
  assert.deepEqual(sortForStatus(list, "inbox", "nope").map((it) => it.id), []);
});

test("inbox reads oldest first, done reads most recently touched first", () => {
  const inbox = [
    item({ id: "new", createdAt: NOW }),
    item({ id: "old", createdAt: NOW - 5 * DAY }),
  ];
  assert.deepEqual(sortForStatus(inbox, "inbox").map((it) => it.id), ["old", "new"]);

  const done = [
    item({ id: "then", status: "done", touchedAt: NOW - 5 * DAY }),
    item({ id: "just", status: "done", touchedAt: NOW }),
  ];
  assert.deepEqual(sortForStatus(done, "done").map((it) => it.id), ["just", "then"]);
});

test("drafts never appear in a status list", () => {
  const list = [item({ id: "d", draft: true }), item({ id: "r" })];
  assert.deepEqual(sortForStatus(list, "inbox").map((it) => it.id), ["r"]);
});

test("bare hosts get https, and non-http schemes are rejected", () => {
  assert.equal(normalizeUrl("example.com/x"), "https://example.com/x");
  assert.equal(normalizeUrl("http://example.com/"), "http://example.com/");
  assert.equal(normalizeUrl("javascript:alert(1)"), "");
  assert.equal(normalizeUrl("  "), "");
});

test("Netscape bookmarks.html yields deduplicated links with titles", () => {
  const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p>
    <DT><A HREF="https://a.example/one" ADD_DATE="1">One</A>
    <DT><A HREF="https://a.example/one">Duplicate</A>
    <DT><A HREF="b.example/two">Two</A>
  </DL><p>`;
  const found = parseBookmarkHtml(html);

  assert.deepEqual(found, [
    { url: "https://a.example/one", title: "One" },
    { url: "https://b.example/two", title: "Two" },
  ]);
});

test("JSON import accepts both the export envelope and a bare array", () => {
  const raw = [{ url: "https://x.dev", why: "w", status: "week", pinned: true }];
  for (const payload of [raw, { version: 1, items: raw }]) {
    const parsed = parseImport(payload);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].status, "week");
    assert.equal(parsed[0].pinned, true);
    assert.ok(parsed[0].id, "a missing id is filled in");
  }
});

test("JSON import drops urlless rows, defaults bad statuses and rejects junk", () => {
  const parsed = parseImport([
    { url: "https://x.dev", status: "nonsense" },
    { why: "no url here" },
  ]);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].status, "inbox");

  assert.throws(() => parseImport({ nope: true }));
});
