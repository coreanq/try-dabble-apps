import assert from "node:assert/strict";
import test from "node:test";

import {
  DEVELOP_WAIT_MS,
  commitFrame,
  countdown,
  developEarly,
  finishRoll,
  framesLeft,
  newRoll,
  phaseOf,
  settle,
} from "../src/lib/rolls.ts";

const H = 60 * 60 * 1000;
const T0 = Date.UTC(2026, 8, 3, 12, 0, 0);

test("a fresh roll reads 24 left and is open", () => {
  const roll = newRoll("full", T0);
  assert.equal(framesLeft(roll), 24);
  assert.equal(phaseOf(roll, T0), "shooting");
  assert.equal(roll.unlockAt, null);
});

test("full mode: the clock starts only when the LAST frame is shot, 72h out", () => {
  let roll = newRoll("full", T0);
  for (let i = 0; i < 23; i++) roll = commitFrame(roll, `f${i}`, T0 + i * 1000);
  assert.equal(framesLeft(roll), 1);
  assert.equal(roll.unlockAt, null);
  assert.equal(phaseOf(roll, T0 + 60 * H), "shooting");

  const last = T0 + 5 * H;
  roll = commitFrame(roll, "f23", last);
  assert.equal(framesLeft(roll), 0);
  assert.equal(roll.finishedAt, last);
  assert.equal(roll.unlockAt, last + DEVELOP_WAIT_MS);
  assert.equal(phaseOf(roll, last), "locked");
  assert.equal(phaseOf(roll, last + 72 * H - 1), "locked");
  assert.equal(phaseOf(roll, last + 72 * H), "developed");
});

test("first mode: the clock starts at the first frame and shooting continues", () => {
  let roll = newRoll("first", T0);
  roll = commitFrame(roll, "f0", T0);
  assert.equal(framesLeft(roll), 23);
  assert.equal(roll.unlockAt, T0 + 72 * H);
  assert.equal(phaseOf(roll, T0 + 1000), "shooting");
  roll = commitFrame(roll, "f1", T0 + 2 * H);
  assert.equal(roll.unlockAt, T0 + 72 * H, "a later frame never moves the unlock");
  const c = countdown(roll.unlockAt, T0 + 5000);
  assert.deepEqual([c.days, c.hours, c.minutes, c.seconds], [2, 23, 59, 55]);
});

test("finish roll now seals the roll and starts the same real 72h wait", () => {
  let roll = newRoll("full", T0);
  roll = commitFrame(roll, "f0", T0);
  roll = finishRoll(roll, T0 + 10 * 1000);
  assert.equal(roll.finishedAt, T0 + 10 * 1000);
  assert.equal(roll.unlockAt, T0 + 10 * 1000 + DEVELOP_WAIT_MS);
  assert.equal(phaseOf(roll, T0 + 20 * 1000), "locked");
  assert.equal(commitFrame(roll, "late", T0 + 30 * 1000), roll, "a sealed roll takes no more frames");
});

test("finish roll now in first mode never shortens a running timer", () => {
  let roll = newRoll("first", T0);
  roll = commitFrame(roll, "f0", T0);
  roll = finishRoll(roll, T0 + 1 * H);
  assert.equal(roll.unlockAt, T0 + 72 * H);
});

test("an empty roll cannot be finished or developed early", () => {
  const roll = newRoll("full", T0);
  assert.equal(finishRoll(roll, T0), roll);
  assert.equal(developEarly(roll, T0), roll);
});

test("the countdown is recomputed from the absolute unlock time, so a reload changes nothing", () => {
  let roll = newRoll("full", T0);
  roll = commitFrame(roll, "f0", T0);
  roll = finishRoll(roll, T0);
  const saved = JSON.parse(JSON.stringify(roll));
  const later = T0 + 30 * H;
  assert.equal(saved.unlockAt, roll.unlockAt);
  const c = countdown(saved.unlockAt, later);
  assert.deepEqual([c.days, c.hours, c.minutes, c.seconds], [1, 18, 0, 0]);
  assert.equal(phaseOf(saved, later), "locked");
});

test("develop early is the only thing that moves unlockAt forward", () => {
  let roll = newRoll("full", T0);
  roll = commitFrame(roll, "f0", T0);
  roll = finishRoll(roll, T0);
  roll = developEarly(roll, T0 + 1000);
  assert.equal(roll.unlockAt, T0 + 1000);
  assert.equal(roll.developedEarly, true);
  assert.equal(phaseOf(roll, T0 + 1000), "developed");
});

test("first mode: when the timer runs out mid-roll the roll seals itself", () => {
  let roll = newRoll("first", T0);
  roll = commitFrame(roll, "f0", T0);
  const after = T0 + 72 * H + 5;
  const settled = settle(roll, after);
  assert.equal(settled.finishedAt, T0 + 72 * H);
  assert.equal(phaseOf(settled, after), "developed");
  assert.equal(settle(roll, T0 + 10 * H), roll, "not before the unlock");
});
