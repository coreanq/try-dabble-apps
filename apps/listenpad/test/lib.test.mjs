import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRewind,
  applySkip,
  clampRewind,
  clampSpeed,
  clampTime,
  fitLoop,
  fmtSpeed,
  fmtTime,
  isAudioFile,
  isRewindSec,
  loopActive,
  NO_LOOP,
  pct,
  REWIND_STEPS,
  setLoopPoint,
  shouldSeekToA,
  SPEEDS,
} from "../src/lib/player.ts";
import {
  abForFile,
  BACKUP_APP,
  BACKUP_VERSION,
  backupFilename,
  buildBackup,
  defaultPrefs,
  noteFor,
  parseBackup,
  parsePrefs,
  PREFS_KEY,
  setNoteFor,
  toJSON,
  withFile,
  withLoop,
} from "../src/lib/store.ts";

/* ---------- rewind / skip ---------- */

test("the rewind steps are exactly 1, 2, 3, 4 seconds — short, never a long skip", () => {
  assert.deepEqual(REWIND_STEPS, [1, 2, 3, 4]);
  for (const n of REWIND_STEPS) assert.ok(n <= 5);
  assert.ok(isRewindSec(3));
  assert.ok(!isRewindSec(5));
  assert.ok(!isRewindSec("2"));
  assert.equal(clampRewind(0), 1);
  assert.equal(clampRewind(9), 4);
  assert.equal(clampRewind(2.4), 2);
});

test("clampTime keeps a position inside [0, duration] and tolerates an unknown duration", () => {
  assert.equal(clampTime(-3, 100), 0);
  assert.equal(clampTime(130, 100), 100);
  assert.equal(clampTime(42.5, 100), 42.5);
  assert.equal(clampTime(NaN, 100), 0);
  assert.equal(clampTime(500, 0), 500);
  assert.equal(clampTime(500, NaN), 500);
});

test("applyRewind clamps at 0 and applySkip clamps at the duration", () => {
  assert.equal(applyRewind(10, 3, 60), 7);
  assert.equal(applyRewind(2, 4, 60), 0);
  assert.equal(applyRewind(0, 1, 60), 0);
  assert.equal(applySkip(10, 3, 60), 13);
  assert.equal(applySkip(58, 4, 60), 60);
  assert.equal(applySkip(60, 1, 60), 60);
  assert.equal(applySkip(10.25, 2, 60), 12.25);
});

/* ---------- A–B loop ---------- */

test("shouldSeekToA only fires when the loop is on, both points exist, B is after A, and playback reached B", () => {
  assert.equal(shouldSeekToA(12, 10, 12, true), true);
  assert.equal(shouldSeekToA(12.4, 10, 12, true), true);
  assert.equal(shouldSeekToA(11.9, 10, 12, true), false);
  assert.equal(shouldSeekToA(12, 10, 12, false), false);
  assert.equal(shouldSeekToA(12, null, 12, true), false);
  assert.equal(shouldSeekToA(12, 10, null, true), false);
  assert.equal(shouldSeekToA(12, 12, 10, true), false, "B before A never loops");
  assert.equal(shouldSeekToA(5, 10, 12, true), false, "scrubbing before A is left alone");
});

test("setLoopPoint keeps A before B, swaps a late A / early B, and re-arms on the same instant", () => {
  const a = setLoopPoint(NO_LOOP, "a", 10);
  assert.deepEqual(a, { a: 10, b: null });
  assert.equal(loopActive(a), false);
  const ab = setLoopPoint(a, "b", 14);
  assert.deepEqual(ab, { a: 10, b: 14 });
  assert.equal(loopActive(ab), true);
  assert.deepEqual(setLoopPoint(ab, "b", 6), { a: 6, b: 10 }, "B tapped before A swaps");
  assert.deepEqual(setLoopPoint(ab, "a", 20), { a: 14, b: 20 }, "A tapped after B swaps");
  assert.deepEqual(setLoopPoint(ab, "b", 10), { a: null, b: 10 }, "same instant keeps only the new point");
  assert.deepEqual(setLoopPoint(NO_LOOP, "b", -1), { a: null, b: 0 });
  assert.deepEqual(setLoopPoint(NO_LOOP, "a", NaN), { a: 0, b: null });
});

test("fitLoop drops points a shorter file cannot hold, keeps them otherwise", () => {
  assert.deepEqual(fitLoop({ a: 10, b: 14 }, 60), { a: 10, b: 14 });
  assert.deepEqual(fitLoop({ a: 10, b: 14 }, 12), NO_LOOP);
  assert.deepEqual(fitLoop({ a: 10, b: 60.2 }, 60), { a: 10, b: 60.2 }, "a hair past the end is tolerated");
  const same = { a: 1, b: 2 };
  assert.equal(fitLoop(same, 0), same, "unknown duration changes nothing");
});

/* ---------- speed ---------- */

test("speed chips include slow drill rates and 1×, and reset is plain 1", () => {
  assert.ok(SPEEDS.includes(0.5));
  assert.ok(SPEEDS.includes(0.75));
  assert.ok(SPEEDS.includes(0.9));
  assert.ok(SPEEDS.includes(1));
  assert.ok(SPEEDS.includes(1.25));
  assert.equal(clampSpeed(0.05), 0.25);
  assert.equal(clampSpeed(9), 3);
  assert.equal(clampSpeed(NaN), 1);
  assert.equal(fmtSpeed(1), "1×");
  assert.equal(fmtSpeed(0.75), "0.75×");
  assert.equal(fmtSpeed(1.1), "1.1×");
});

/* ---------- formatting ---------- */

test("fmtTime and pct", () => {
  assert.equal(fmtTime(0), "0:00");
  assert.equal(fmtTime(65.7), "1:05");
  assert.equal(fmtTime(65.7, true), "1:05.7");
  assert.equal(fmtTime(NaN), "0:00");
  assert.equal(fmtTime(-4), "0:00");
  assert.equal(fmtTime(3600), "60:00");
  assert.equal(pct(30, 60), "50.000%");
  assert.equal(pct(null, 60), "0%");
  assert.equal(pct(30, 0), "0%");
  assert.equal(pct(90, 60), "100.000%");
});

test("isAudioFile accepts audio MIME types and common extensions, rejects the rest", () => {
  assert.ok(isAudioFile({ name: "lesson.mp3", type: "audio/mpeg" }));
  assert.ok(isAudioFile({ name: "lesson.m4a", type: "" }));
  assert.ok(isAudioFile({ name: "LESSON.FLAC", type: "" }));
  assert.ok(isAudioFile({ name: "clip.webm", type: "audio/webm" }));
  assert.ok(!isAudioFile({ name: "notes.pdf", type: "application/pdf" }));
  assert.ok(!isAudioFile({ name: "movie.mkv", type: "video/x-matroska" }));
  assert.ok(!isAudioFile({ name: "", type: "" }));
});

/* ---------- prefs ---------- */

test("prefs key and defaults", () => {
  assert.equal(PREFS_KEY, "listenpad:prefs:v1");
  assert.deepEqual(defaultPrefs(), { rewindSec: 2, speed: 1 });
});

test("parsePrefs reads the documented shape and forgives junk", () => {
  const p = parsePrefs({
    rewindSec: 3,
    speed: 0.75,
    lastFileName: "ep12.mp3",
    ab: { a: 10, b: 14.5 },
    notesByFile: { "ep12.mp3": "gonna = going to", "": "x", "junk.mp3": 5, "empty.mp3": "" },
    uiLang: "en",
    surprise: { deep: true },
  });
  assert.deepEqual(p, {
    rewindSec: 3,
    speed: 0.75,
    lastFileName: "ep12.mp3",
    ab: { a: 10, b: 14.5 },
    notesByFile: { "ep12.mp3": "gonna = going to" },
    uiLang: "en",
  });
  assert.deepEqual(parsePrefs(null), defaultPrefs());
  assert.deepEqual(parsePrefs("nope"), defaultPrefs());
  assert.deepEqual(parsePrefs([1, 2]), defaultPrefs());
  assert.deepEqual(parsePrefs({ rewindSec: "3", speed: "fast", ab: "x", notesByFile: [] }), defaultPrefs());
  assert.equal(parsePrefs({ rewindSec: 7 }).rewindSec, 4, "out-of-range rewind is clamped");
  assert.equal(parsePrefs({ speed: 0 }).speed, 0.25, "silly speed is clamped");
  assert.equal(parsePrefs({ rewind: 1, rate: 1.25 }).speed, 1.25, "legacy key names");
  assert.deepEqual(parsePrefs({ ab: { a: 14, b: 10 } }).ab, { a: 10, b: 14 }, "reversed points are swapped");
  assert.equal(parsePrefs({ ab: { a: 5, b: 5 } }).ab, undefined, "a zero-length loop is dropped");
  assert.deepEqual(parsePrefs({ ab: { a: 5, b: null } }).ab, { a: 5, b: null });
});

test("notes are keyed by file name; empty text removes the key", () => {
  const base = defaultPrefs();
  const one = setNoteFor(base, "a.mp3", "hello");
  assert.equal(noteFor(one, "a.mp3"), "hello");
  assert.equal(noteFor(one, "b.mp3"), "");
  assert.equal(noteFor(one, ""), "");
  const two = setNoteFor(one, "b.mp3", "second");
  assert.deepEqual(two.notesByFile, { "a.mp3": "hello", "b.mp3": "second" });
  assert.equal(setNoteFor(two, "b.mp3", "second"), two, "no change returns the same object");
  const gone = setNoteFor(setNoteFor(two, "b.mp3", ""), "a.mp3", "");
  assert.equal(gone.notesByFile, undefined);
  assert.equal(setNoteFor(base, "", "x"), base);
});

test("A–B points belong to one file name; a different file starts with no loop", () => {
  let p = withFile(defaultPrefs(), "ep1.mp3");
  p = withLoop(p, "ep1.mp3", { a: 3, b: 7 });
  assert.deepEqual(abForFile(p, "ep1.mp3"), { a: 3, b: 7 });
  assert.deepEqual(abForFile(p, "ep2.mp3"), NO_LOOP);
  const switched = withFile(p, "ep2.mp3");
  assert.equal(switched.lastFileName, "ep2.mp3");
  assert.equal(switched.ab, undefined);
  assert.equal(withFile(p, "ep1.mp3"), p, "re-picking the same file keeps its loop");
  const cleared = withLoop(p, "ep1.mp3", NO_LOOP);
  assert.equal(cleared.ab, undefined);
  assert.equal(cleared.lastFileName, "ep1.mp3");
});

/* ---------- backup ---------- */

test("JSON export / import roundtrip keeps settings and notes and carries no audio", () => {
  let prefs = defaultPrefs();
  prefs = { ...prefs, rewindSec: 4, speed: 0.9 };
  prefs = withLoop(withFile(prefs, "ep3.mp3"), "ep3.mp3", { a: 12, b: 18.4 });
  prefs = setNoteFor(prefs, "ep3.mp3", "wanna = want to");
  const backup = buildBackup(prefs, new Date("2026-09-15T09:00:00Z"));
  assert.equal(backup.app, BACKUP_APP);
  assert.equal(backup.version, BACKUP_VERSION);
  assert.equal(backup.exportedAt, "2026-09-15T09:00:00.000Z");
  const text = toJSON(backup);
  assert.doesNotMatch(text, /audio|blob|base64/i);
  const parsed = parseBackup(JSON.parse(text));
  assert.ok(parsed);
  assert.deepEqual(parsed.prefs, prefs);
  assert.equal(parsed.exportedAt, backup.exportedAt);
  assert.equal(backupFilename(new Date("2026-09-15T09:00:00Z")), "listenpad-20260915.json");
});

test("parseBackup is legacy-friendly and never throws on unknown shapes", () => {
  assert.equal(parseBackup(null), null);
  assert.equal(parseBackup("x"), null);
  assert.equal(parseBackup([]), null);
  assert.equal(parseBackup({}), null);
  assert.equal(parseBackup({ app: "dictation-thing", prefs: { speed: 1 } }), null, "another app's backup is refused");
  const bare = parseBackup({ speed: 0.8, notes: { "a.mp3": "hi" }, extra: 1 });
  assert.ok(bare);
  assert.equal(bare.prefs.speed, 0.8);
  assert.deepEqual(bare.prefs.notesByFile, { "a.mp3": "hi" });
  const settings = parseBackup({ settings: { rewindSec: 1 }, exportedAt: "2026-01-01T00:00:00Z" });
  assert.equal(settings.prefs.rewindSec, 1);
  assert.equal(settings.exportedAt, "2026-01-01T00:00:00.000Z");
  const empty = parseBackup({ app: "listenpad", version: 1, prefs: {} });
  assert.deepEqual(empty.prefs, defaultPrefs());
});
