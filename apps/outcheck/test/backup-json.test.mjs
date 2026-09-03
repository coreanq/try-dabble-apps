import assert from "node:assert/strict";
import test from "node:test";

import { parseBackup, serializeBackup } from "../src/lib/backup-json.ts";

const ITEMS = [
  { id: "door", label: null },
  { id: "gas", label: null },
  { id: "c-abc-123", label: "Balcony door" },
];
const CHECKS = { door: "2026-09-04T22:42:00.000Z", "c-abc-123": "2026-09-04T22:50:00.000Z" };

test("serialize → parse round-trips items, day and today's checks", () => {
  const text = serializeBackup("2026-09-05", ITEMS, CHECKS);
  const parsed = parseBackup(text);
  assert.ok(parsed);
  assert.equal(parsed.app, "outcheck");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.day, "2026-09-05");
  assert.deepEqual(parsed.items, ITEMS);
  assert.deepEqual(parsed.checks, CHECKS);
});

test("the file is the documented shape and carries nothing else", () => {
  const obj = JSON.parse(serializeBackup("2026-09-05", ITEMS, { ...CHECKS, ghost: "2026-09-04T00:00:00Z" }));
  assert.deepEqual(Object.keys(obj).sort(), ["app", "checks", "day", "items", "version"]);
  assert.deepEqual(Object.keys(obj.checks).sort(), ["c-abc-123", "door"]);
});

test("anything that is not an Outcheck backup is rejected", () => {
  assert.equal(parseBackup("not json"), null);
  assert.equal(parseBackup("[]"), null);
  assert.equal(parseBackup(JSON.stringify({ app: "playcue", version: 1, name: "x", cues: [] })), null);
  assert.equal(parseBackup(JSON.stringify({ app: "outcheck", version: 2, day: "2026-09-05", items: [], checks: {} })), null);
  assert.equal(parseBackup(JSON.stringify({ app: "outcheck", version: 1, day: "yesterday", items: [], checks: {} })), null);
  assert.equal(parseBackup(JSON.stringify({ app: "outcheck", version: 1, day: "2026-09-05", items: [{ id: 3 }], checks: {} })), null);
  assert.equal(parseBackup(JSON.stringify({ app: "outcheck", version: 1, day: "2026-09-05", items: [], checks: [] })), null);
  assert.equal(parseBackup(JSON.stringify({ app: "outcheck", version: 1, day: "2026-09-05", items: [{ id: "door" }], checks: { door: "nope" } })), null);
});
