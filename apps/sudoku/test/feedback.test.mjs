import assert from "node:assert/strict";
import test from "node:test";

import { createAudioFeedbackController } from "../src/lib/feedback/audio-feedback-controller.ts";
import { applyVolumePercentage, normalizeVolumePercentage } from "../src/lib/feedback/audio-volume.ts";
import {
  chooseNextMusicTrack,
  createBackgroundMusicController,
} from "../src/lib/feedback/background-music-controller.ts";
import {
  createFeedbackGate,
  feedbackFor,
  isAudibleCollision,
} from "../src/lib/feedback/feedback-events.ts";

function spy(impl = () => {}) {
  const calls = [];
  const fn = (...args) => {
    calls.push(args);
    return impl(...args);
  };
  fn.calls = calls;
  return fn;
}

function deferred() {
  let resolve;
  const promise = new Promise((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// ---------------------------------------------------------------------------
// audio feedback controller — from audio-feedback-controller.test.ts
// ---------------------------------------------------------------------------

test("audio feedback controller — does not play when disabled during initialization", async () => {
  const initialization = deferred();
  const preload = spy(() => initialization.promise);
  const play = spy();
  const pauseAll = spy();
  const controller = createAudioFeedbackController({
    pauseAll,
    play,
    preload,
    prepare: spy(),
    seek: spy(() => Promise.resolve()),
  });

  const request = controller.request("pick");
  await flushMicrotasks();
  assert.equal(preload.calls.length, 1);
  controller.setEnabled(false);
  initialization.resolve();
  await request;

  assert.equal(play.calls.length, 0);
  assert.equal(pauseAll.calls.length, 1);
});

test("audio feedback controller — does not play when backgrounded during seek", async () => {
  const seek = deferred();
  const seekStarted = deferred();
  const play = spy();
  const pauseAll = spy();
  const seekSound = spy(() => {
    seekStarted.resolve();
    return seek.promise;
  });
  const controller = createAudioFeedbackController({
    pauseAll,
    play,
    preload: spy(() => Promise.resolve()),
    prepare: spy(),
    seek: seekSound,
  });

  const request = controller.request("place");
  await seekStarted.promise;
  assert.equal(seekSound.calls.length, 1);
  controller.setActive(false);
  seek.resolve();
  await request;

  assert.equal(play.calls.length, 0);
  assert.equal(pauseAll.calls.length, 1);
});

test("audio feedback controller — does not prepare or play when unmounted during initialization", async () => {
  const initialization = deferred();
  const preload = spy(() => initialization.promise);
  const prepare = spy();
  const play = spy();
  const pauseAll = spy();
  const controller = createAudioFeedbackController({
    pauseAll,
    play,
    preload,
    prepare,
    seek: spy(() => Promise.resolve()),
  });

  const request = controller.request("invalid");
  await flushMicrotasks();
  assert.equal(preload.calls.length, 1);
  controller.dispose();
  initialization.resolve();
  await request;

  assert.equal(prepare.calls.length, 0);
  assert.equal(play.calls.length, 0);
  assert.equal(pauseAll.calls.length, 1);
});

test("audio feedback controller — allows a later active request after an initialization cancellation", async () => {
  const initialization = deferred();
  const play = spy();
  const controller = createAudioFeedbackController({
    pauseAll: spy(),
    play,
    preload: () => initialization.promise,
    prepare: spy(),
    seek: spy(() => Promise.resolve()),
  });

  const cancelled = controller.request("pick");
  controller.setActive(false);
  initialization.resolve();
  await cancelled;
  controller.setActive(true);
  await controller.request("complete");

  assert.equal(play.calls.length, 1);
  assert.deepEqual(play.calls.at(-1), ["complete"]);
});

// ---------------------------------------------------------------------------
// audio volume — from audio-volume.test.ts
// ---------------------------------------------------------------------------

test("audio volume — clamps percentages and converts them to player gain", () => {
  assert.equal(normalizeVolumePercentage(-10), 0);
  assert.equal(normalizeVolumePercentage(45), 0.45);
  assert.equal(normalizeVolumePercentage(120), 1);
});

test("audio volume — updates every already-created player", () => {
  const players = [{ volume: 1 }, { volume: 1 }, { volume: 1 }];

  applyVolumePercentage(players, 32);

  assert.deepEqual(players.map(({ volume }) => volume), [0.32, 0.32, 0.32]);
});

// ---------------------------------------------------------------------------
// background music controller — from background-music-controller.test.ts
// ---------------------------------------------------------------------------

test("background music controller — chooses among all tracks first and excludes the immediately previous track", () => {
  assert.equal(chooseNextMusicTrack(null, () => 0.99), 2);
  assert.equal(chooseNextMusicTrack(1, () => 0.99), 2);
  assert.equal(chooseNextMusicTrack(2, () => 0.99), 1);
});

test("background music controller — switches tracks on new games and follows app and setting activity", () => {
  const events = [];
  const controller = createBackgroundMusicController({
    load: (track) => events.push(`load:${track}`),
    pause: () => events.push("pause"),
    play: () => events.push("play"),
    random: () => 0.5,
    subscribeToFinish: () => () => {},
  });

  controller.startNext();
  controller.setActive(false);
  controller.setActive(true);
  controller.setEnabled(false);
  controller.startNext();
  controller.setEnabled(true);
  controller.dispose();

  assert.deepEqual(events, [
    "load:1",
    "play",
    "pause",
    "play",
    "pause",
    "load:2",
    "play",
    "pause",
  ]);
});

test("background music controller — restarts the current track when playback finishes", () => {
  const events = [];
  let finishPlayback = () => {};
  const controller = createBackgroundMusicController({
    load: (track) => events.push(`load:${track}`),
    pause: () => events.push("pause"),
    play: () => events.push("play"),
    random: () => 0.99,
    subscribeToFinish: (listener) => {
      finishPlayback = listener;
      return () => {};
    },
  });

  controller.mount();
  controller.startNext();
  finishPlayback();

  assert.deepEqual(events, [
    "load:2",
    "play",
    "load:2",
    "play",
  ]);
});

// ---------------------------------------------------------------------------
// feedback — from feedback-events.test.ts
// ---------------------------------------------------------------------------

const FEEDBACK_CASES = [
  ["pick", { haptic: "selection", sound: "pick" }],
  ["place", { haptic: "light", sound: "place" }],
  ["collision", { haptic: null, sound: "collision" }],
  ["note", { haptic: "selection", sound: "note" }],
  ["erase", { haptic: "light", sound: "erase" }],
  ["undo", { haptic: "selection", sound: "undo" }],
  ["redo", { haptic: "selection", sound: "redo" }],
  ["invalid", { haptic: "error", sound: "invalid" }],
  ["newGame", { haptic: "light", sound: "newGame" }],
  ["complete", { haptic: "success", sound: "complete" }],
];

for (const [effect, expected] of FEEDBACK_CASES) {
  test(`feedback — maps the ${effect} semantic event`, () => {
    assert.deepEqual(feedbackFor(effect), expected);
  });
}

test("feedback — suppresses the same sound within 80ms without suppressing another sound", () => {
  const gate = createFeedbackGate(80);

  assert.equal(gate.allow("invalid", 100), true);
  assert.equal(gate.allow("invalid", 150), false);
  assert.equal(gate.allow("place", 150), true);
  assert.equal(gate.allow("invalid", 181), true);
});

test("feedback — rejects collisions below the minimum relative impact velocity", () => {
  assert.equal(isAudibleCollision(0.349), false);
  assert.equal(isAudibleCollision(0.35), true);
});
