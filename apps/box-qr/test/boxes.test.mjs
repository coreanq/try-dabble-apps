import assert from "node:assert/strict";
import test from "node:test";

import {
  byNumber,
  itemLines,
  matchesQuery,
  mergeBoxes,
  nextNumber,
  padNum,
  parseImport,
} from "../src/lib/boxes.ts";
import { makeQr } from "../src/lib/qr.ts";

function box(over = {}) {
  return {
    id: "a",
    number: 1,
    room: "",
    items: "",
    photos: [],
    createdAt: 1,
    updatedAt: 1,
    ...over,
  };
}

test("contents are one item per line, trimmed, blanks dropped", () => {
  assert.deepEqual(itemLines("  Lego \n\n glass bowls \r\ncables"), [
    "Lego",
    "glass bowls",
    "cables",
  ]);
  assert.deepEqual(itemLines(""), []);
});

test("search matches item text, room and box number", () => {
  const b = box({ number: 12, room: "Kitchen", items: "Lego\nglass bowls" });
  assert.equal(matchesQuery(b, ""), true);
  assert.equal(matchesQuery(b, "lego"), true);
  assert.equal(matchesQuery(b, "KITCHEN"), true);
  assert.equal(matchesQuery(b, "12"), true);
  assert.equal(matchesQuery(b, "glass bowls"), true, "every token must hit");
  assert.equal(matchesQuery(b, "lego kitchen"), true);
  assert.equal(matchesQuery(b, "lego garage"), false);
});

test("numbering continues past the highest box, never reuses one", () => {
  assert.equal(nextNumber([]), 1);
  assert.equal(nextNumber([box({ number: 3 }), box({ number: 7 })]), 8);
  assert.equal(padNum(4), "04");
  assert.equal(padNum(12), "12");
  const sorted = [box({ id: "b", number: 9 }), box({ id: "a", number: 2 })].sort(byNumber);
  assert.deepEqual(
    sorted.map((b) => b.id),
    ["a", "b"],
  );
});

test("import accepts a bare array and the { boxes } wrapper, keeps photos", () => {
  const payload = {
    v: 1,
    boxes: [{ id: "x", number: 2, room: "Attic", items: "skis", photos: [{ dataUrl: "data:," }] }],
  };
  const wrapped = parseImport(JSON.stringify(payload));
  const bare = parseImport(JSON.stringify(payload.boxes));
  for (const list of [wrapped, bare]) {
    assert.equal(list.length, 1);
    assert.equal(list[0].room, "Attic");
    assert.equal(list[0].photos.length, 1);
    assert.ok(list[0].photos[0].id, "a photo missing an id gets one");
  }
  assert.throws(() => parseImport(JSON.stringify({ nope: true })));
});

test("import merges by id and leaves the rest of the shelf alone", () => {
  const merged = mergeBoxes(
    [box({ id: "a", number: 1, room: "old" }), box({ id: "b", number: 2 })],
    [box({ id: "a", number: 1, room: "new" }), box({ id: "c", number: 3 })],
  );
  assert.deepEqual(
    merged.map((b) => b.id),
    ["a", "b", "c"],
  );
  assert.equal(merged[0].room, "new");
});

test("the sticker QR encodes the deep link", () => {
  const qr = makeQr("https://box-qr.try-dabble.com/?box=abc123&lang=ko");
  assert.ok(qr, "encodes without throwing");
  assert.ok(qr.size > 20, "quiet zone included");
  assert.match(qr.path, /^M\d/);
});
