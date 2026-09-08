import assert from "node:assert/strict";
import test from "node:test";

import {
  appendToQueue,
  buildQueue,
  currentId,
  cycleRepeat,
  indexAfterEnded,
  indexAfterSkip,
  indexBeforeSkip,
  pruneQueue,
  removeFromQueue,
  setShuffle,
  shuffled,
} from "../src/lib/queue.ts";

const ids = ["a", "b", "c", "d"];
const fixedRng = () => 0.5;

test("buildQueue keeps list order and starts at the tapped track", () => {
  const q = buildQueue(ids, "c", false, "off");
  assert.deepEqual(q.trackIds, ids);
  assert.equal(q.index, 2);
  assert.equal(currentId(q), "c");
  assert.equal(q.baseIds, undefined);
});

test("buildQueue with shuffle pins the tapped track first and remembers the base order", () => {
  const q = buildQueue(ids, "c", true, "all", fixedRng);
  assert.equal(q.trackIds[0], "c");
  assert.equal(q.index, 0);
  assert.deepEqual([...q.trackIds].sort(), ids);
  assert.deepEqual(q.baseIds, ids);
});

test("buildQueue drops duplicates and handles an unknown start id", () => {
  const q = buildQueue(["a", "a", "b"], "zzz", false, "off");
  assert.deepEqual(q.trackIds, ["a", "b"]);
  assert.equal(q.index, 0);
  assert.equal(buildQueue([], null, false, "off").index, -1);
});

test("repeat off: ended runs to the end then stops; skip wraps anyway", () => {
  const q = buildQueue(ids, "c", false, "off");
  assert.equal(indexAfterEnded(q), 3);
  assert.equal(indexAfterEnded({ ...q, index: 3 }), null);
  assert.equal(indexAfterSkip({ ...q, index: 3 }), 0);
  assert.equal(indexBeforeSkip({ ...q, index: 0 }), 3);
  assert.equal(indexBeforeSkip(q), 1);
});

test("repeat all wraps on ended; repeat one replays the same index", () => {
  const all = buildQueue(ids, "d", false, "all");
  assert.equal(indexAfterEnded(all), 0);
  const one = buildQueue(ids, "b", false, "one");
  assert.equal(indexAfterEnded(one), 1);
});

test("an empty queue never yields an index", () => {
  const q = buildQueue([], null, false, "all");
  assert.equal(indexAfterEnded(q), null);
  assert.equal(indexAfterSkip(q), null);
  assert.equal(indexBeforeSkip(q), null);
});

test("cycleRepeat goes off → all → one → off", () => {
  assert.equal(cycleRepeat("off"), "all");
  assert.equal(cycleRepeat("all"), "one");
  assert.equal(cycleRepeat("one"), "off");
});

test("setShuffle on keeps the current track under the cursor; off restores the base order", () => {
  const q = buildQueue(ids, "c", false, "off");
  const on = setShuffle(q, true, fixedRng);
  assert.equal(on.shuffle, true);
  assert.equal(currentId(on), "c");
  assert.deepEqual([...on.trackIds].sort(), ids);
  const off = setShuffle(on, false);
  assert.equal(off.shuffle, false);
  assert.deepEqual(off.trackIds, ids);
  assert.equal(currentId(off), "c");
  assert.equal(off.baseIds, undefined);
  assert.equal(setShuffle(off, false), off);
});

test("shuffled is a permutation and leaves the input alone", () => {
  const out = shuffled(ids, () => 0.01);
  assert.deepEqual([...out].sort(), ids);
  assert.deepEqual(ids, ["a", "b", "c", "d"]);
});

test("appendToQueue adds only new ids and seeds the cursor on an empty queue", () => {
  const empty = buildQueue([], null, false, "off");
  const q1 = appendToQueue(empty, ["a", "b"]);
  assert.deepEqual(q1.trackIds, ["a", "b"]);
  assert.equal(q1.index, 0);
  const q2 = appendToQueue(q1, ["b", "c", "c"]);
  assert.deepEqual(q2.trackIds, ["a", "b", "c"]);
  assert.equal(q2.index, 0);
  assert.equal(appendToQueue(q2, ["a"]), q2);
});

test("removeFromQueue keeps the cursor on the same track", () => {
  const q = buildQueue(ids, "c", false, "off");
  const r1 = removeFromQueue(q, "a");
  assert.deepEqual(r1.trackIds, ["b", "c", "d"]);
  assert.equal(currentId(r1), "c");
  const r2 = removeFromQueue(r1, "c");
  assert.deepEqual(r2.trackIds, ["b", "d"]);
  assert.equal(r2.index, 1);
  const r3 = removeFromQueue(r2, "d");
  assert.equal(r3.index, 0);
  const r4 = removeFromQueue(r3, "b");
  assert.equal(r4.index, -1);
  assert.equal(removeFromQueue(q, "nope"), q);
});

test("pruneQueue drops ids the library no longer has", () => {
  const q = buildQueue(ids, "b", false, "off");
  const p = pruneQueue(q, new Set(["b", "d"]));
  assert.deepEqual(p.trackIds, ["b", "d"]);
  assert.equal(currentId(p), "b");
});
