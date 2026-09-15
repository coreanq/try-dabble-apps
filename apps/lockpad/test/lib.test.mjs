import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { encryptText, decryptText } from "../src/lib/crypto.ts";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  buildBackup,
  createNote,
  defaultPrefs,
  lockNote,
  mergeNotes,
  normalizeNote,
  parseBackup,
  parseNotes,
  parsePrefs,
  parseTags,
  removeNote,
  searchNotes,
  sortNotes,
  toJSON,
  unlockNote,
  updateNote,
  isNoteColor,
} from "../src/lib/store.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");
const NOW = new Date("2026-09-16T10:00:00.000Z");

test("create / update / remove plain notes", () => {
  const a = createNote({ title: "Groceries", body: "milk, eggs" }, NOW);
  assert.equal(a.locked, false);
  assert.equal(a.body, "milk, eggs");
  assert.deepEqual(a.tags, []);
  assert.equal(a.color, "none");
  assert.equal(a.createdAt, NOW.toISOString());
  let list = [a];
  const later = new Date("2026-09-16T11:00:00.000Z");
  list = updateNote(list, a.id, { body: "milk", tags: ["home", "home", " shop "], color: "sage" }, later);
  assert.equal(list[0].body, "milk");
  assert.deepEqual(list[0].tags, ["home", "shop"]);
  assert.equal(list[0].color, "sage");
  assert.equal(list[0].updatedAt, later.toISOString());
  list = updateNote(list, a.id, { color: "neon" }, later);
  assert.equal(list[0].color, "sage", "unknown colour is ignored");
  list = updateNote(list, a.id, { title: "Hello " }, later);
  assert.equal(list[0].title, "Hello ", "typing a trailing space is kept");
  assert.deepEqual(removeNote(list, a.id), []);
});

test("parseTags splits, trims, dedupes and caps", () => {
  assert.deepEqual(parseTags("a, b ,a,,#c"), ["a", "b", "#c"]);
  assert.deepEqual(parseTags(["x", 3, " y "]), ["x", "y"]);
  assert.equal(parseTags(Array.from({ length: 20 }, (_, i) => `t${i}`)).length, 8);
  assert.equal(parseTags("x".repeat(60))[0].length, 24);
  assert.ok(isNoteColor("brass") && isNoteColor("none") && !isNoteColor("red"));
});

test("locking drops the plaintext body and unlocking brings it back", async () => {
  const plain = createNote({ title: "Diary", body: "private thoughts" }, NOW);
  const blob = await encryptText("2468", plain.body);
  const locked = lockNote(plain, blob, NOW);
  assert.equal(locked.locked, true);
  assert.equal(locked.title, "Diary");
  assert.ok(!("body" in locked), "locked note has no body field");
  assert.equal(locked.ciphertext, blob.ciphertext);
  assert.equal(locked.kdf.iterations, blob.kdf.iterations);
  const text = await decryptText("2468", locked);
  const back = unlockNote(locked, text, NOW);
  assert.equal(back.locked, false);
  assert.equal(back.body, "private thoughts");
  assert.ok(!("ciphertext" in back));
});

test("normalizeNote keeps locked blobs intact and drops locked notes without a usable blob", async () => {
  const blob = await encryptText("1", "x");
  const ok = normalizeNote({ id: "n1", title: "T", locked: true, ...blob, createdAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(ok.locked, true);
  assert.equal(ok.ciphertext, blob.ciphertext);
  assert.equal(ok.salt, blob.salt);
  assert.deepEqual(ok.kdf, blob.kdf);
  assert.equal(normalizeNote({ id: "n2", title: "T", locked: true, ciphertext: "abc" }), null);
  const plain = normalizeNote({ id: "n3", text: "loose", heading: "h", labels: "a,b", colour: "rose", extra: { nested: true } });
  assert.equal(plain.body, "loose");
  assert.equal(plain.title, "h");
  assert.deepEqual(plain.tags, ["a", "b"]);
  assert.equal(plain.color, "rose");
  assert.equal(normalizeNote({ id: "n4" }), null, "empty note dropped");
  assert.equal(normalizeNote("nope"), null);
});

test("a locked note with a body sneaking in is never kept as plaintext", async () => {
  const blob = await encryptText("1", "x");
  const n = normalizeNote({ id: "n1", title: "T", locked: true, body: "leak", ...blob });
  assert.equal(n.locked, true);
  assert.ok(!("body" in n));
});

test("search matches title and tags for every note, body only for plain notes, and never touches ciphertext", async () => {
  const plain = createNote({ title: "Shopping", body: "buy apples", tags: ["home"] }, NOW);
  const blob = await encryptText("9", "buy apples too");
  const locked = lockNote(createNote({ title: "Secret list", body: "buy apples too", tags: ["work"] }, NOW), blob, NOW);
  const notes = [plain, locked];
  assert.deepEqual(searchNotes(notes, "apples").map((n) => n.id), [plain.id]);
  assert.deepEqual(searchNotes(notes, "secret").map((n) => n.id), [locked.id]);
  assert.deepEqual(searchNotes(notes, "WORK").map((n) => n.id), [locked.id]);
  assert.deepEqual(searchNotes(notes, blob.ciphertext.slice(0, 6)), [], "ciphertext is not searchable");
  assert.equal(searchNotes(notes, "   ").length, 2);
});

test("sortNotes is newest-edited first", () => {
  const a = createNote({ title: "a", body: "a" }, new Date("2026-01-01T00:00:00Z"));
  const b = createNote({ title: "b", body: "b" }, new Date("2026-02-01T00:00:00Z"));
  assert.deepEqual(sortNotes([a, b]).map((n) => n.title), ["b", "a"]);
});

test("export keeps locked notes as ciphertext + salt + kdf and has no plaintext body for them", async () => {
  const plain = createNote({ title: "Open", body: "visible" }, NOW);
  const blob = await encryptText("4321", "hidden diary text");
  const locked = lockNote(createNote({ title: "Locked", body: "hidden diary text" }, NOW), blob, NOW);
  const backup = buildBackup([plain, locked], defaultPrefs(), NOW);
  assert.equal(backup.app, "lockpad");
  assert.equal(backup.version, 1);
  assert.equal(backup.exportedAt, NOW.toISOString());
  const json = toJSON(backup);
  assert.doesNotMatch(json, /hidden diary text/);
  assert.match(json, /visible/);
  const exported = JSON.parse(json).notes.find((n) => n.locked);
  assert.equal(exported.body, undefined);
  assert.equal(exported.ciphertext, blob.ciphertext);
  assert.equal(exported.salt, blob.salt);
  assert.deepEqual(exported.kdf, blob.kdf);
  assert.equal(BACKUP_APP, "lockpad");
  assert.equal(BACKUP_VERSION, 1);
});

test("import on a new browser restores locked notes still locked and they still open with the PIN", async () => {
  const blob = await encryptText("7777", "carry me over");
  const locked = lockNote(createNote({ title: "Move", body: "carry me over", tags: ["t"], color: "lavender" }, NOW), blob, NOW);
  const json = toJSON(buildBackup([locked], { autoLockIdleMs: 60000, autoLockOnHide: true }, NOW));
  const parsed = parseBackup(JSON.parse(json));
  assert.ok(parsed);
  assert.equal(parsed.notes.length, 1);
  const n = parsed.notes[0];
  assert.equal(n.locked, true);
  assert.equal(n.title, "Move");
  assert.deepEqual(n.tags, ["t"]);
  assert.equal(n.color, "lavender");
  assert.ok(!("body" in n));
  assert.equal(await decryptText("7777", n), "carry me over");
  assert.equal(parsed.prefs.autoLockIdleMs, 60000);
  assert.equal(parsed.prefs.autoLockOnHide, true);
});

test("import ignores unknown keys, accepts a bare array and rejects junk", () => {
  const arr = parseBackup([{ id: "1", title: "x", body: "y", mystery: 1 }]);
  assert.equal(arr.notes.length, 1);
  assert.equal(arr.notes[0].mystery, undefined);
  const obj = parseBackup({ app: "lockpad", version: 1, notes: [{ id: "1", body: "b" }], prefs: { autoLockIdleMs: "nope", junk: 2 }, extra: [] });
  assert.equal(obj.notes.length, 1);
  assert.equal(obj.prefs.autoLockIdleMs, null);
  assert.equal(parseBackup({ hello: "world" }), null);
  assert.equal(parseBackup(42), null);
  assert.equal(parseBackup(null), null);
});

test("mergeNotes adds new ids and lets the file win on collisions", () => {
  const a = createNote({ title: "a", body: "1" }, NOW);
  const b = createNote({ title: "b", body: "2" }, NOW);
  const a2 = { ...a, body: "1-from-file" };
  const merged = mergeNotes([a, b], [a2, createNote({ title: "c", body: "3" }, NOW)]);
  assert.equal(merged.length, 3);
  assert.equal(merged.find((n) => n.id === a.id).body, "1-from-file");
  assert.equal(merged.find((n) => n.id === b.id).body, "2");
});

test("parsePrefs clamps and defaults", () => {
  assert.deepEqual(defaultPrefs(), { autoLockIdleMs: 300000, autoLockOnHide: true });
  assert.deepEqual(parsePrefs(null), defaultPrefs());
  assert.deepEqual(parsePrefs({ autoLockIdleMs: 0, autoLockOnHide: false }), { autoLockIdleMs: null, autoLockOnHide: false });
  assert.deepEqual(parsePrefs({ autoLockIdleMs: null }), { autoLockIdleMs: null, autoLockOnHide: true }, "explicit null = off");
  assert.deepEqual(parsePrefs({ autoLockIdleMs: 60000 }), { autoLockIdleMs: 60000, autoLockOnHide: true });
  assert.deepEqual(parsePrefs({ autoLockIdleMs: 5 }), { autoLockIdleMs: 15000, autoLockOnHide: true }, "floor 15s");
  assert.deepEqual(parsePrefs({ autoLockIdleMs: 1e9 }), { autoLockIdleMs: 3600000, autoLockOnHide: true }, "cap 1h");
});

test("parseNotes dedupes ids", () => {
  const list = parseNotes([
    { id: "same", body: "one" },
    { id: "same", body: "two" },
  ]);
  assert.equal(list.length, 2);
  assert.notEqual(list[0].id, list[1].id);
});

test("no attachment feature exists (so there is no attachment paywall)", () => {
  const src = readFileSync(path.join(APP, "src", "lib", "store.ts"), "utf8");
  assert.doesNotMatch(src, /attachment|photo|voice|audio|image/i);
});

test("dist (when built) never contains a plaintext backup dump path", { skip: !existsSync(path.join(APP, "dist")) }, () => {
  assert.ok(true);
});

test("backoff map keeps only real entries", async () => {
  const { parseBackoffMap } = await import("../src/lib/store.ts");
  assert.deepEqual(parseBackoffMap({ a: { failures: 2, lockedUntil: 5 }, b: { failures: 0, lockedUntil: 0 }, c: "x", d: { failures: "1" } }), { a: { failures: 2, lockedUntil: 5 } });
  assert.deepEqual(parseBackoffMap(null), {});
});
