import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { appendSegments, appendTranscript, applyVoiceCommand, familyOf, markFor, matchCommand, segmentTranscript } from "../src/lib/voice.ts";
import { DictationSession, detectRecognition } from "../src/lib/speech.ts";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  backupFilename,
  buildBackup,
  createNote,
  defaultSpeechLang,
  deleteNote,
  displayTitle,
  normalizeNote,
  parseBackup,
  parsePrefs,
  pickActive,
  renameNote,
  SPEECH_LANGS,
  toJSON,
  txtFilename,
  updateBody,
} from "../src/lib/store.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");

/* ---------- voice commands ---------- */

test("applyVoiceCommand maps period / comma / newline / paragraph in every language", () => {
  const cases = [
    ["period", "en-US", "."],
    ["Period.", "en-US", "."],
    ["full stop", "en-GB", "."],
    ["comma", "en-US", ","],
    ["new line", "en-US", "\n"],
    ["newline", "en-US", "\n"],
    ["new paragraph", "en-US", "\n\n"],
    ["paragraph", "en-US", "\n\n"],
    ["question mark", "en-US", "?"],
    ["마침표", "ko-KR", "."],
    ["쉼표", "ko-KR", ","],
    ["줄바꿈", "ko-KR", "\n"],
    ["줄 바꿈", "ko-KR", "\n"],
    ["단락", "ko-KR", "\n\n"],
    ["새 단락", "ko-KR", "\n\n"],
    ["물음표", "ko-KR", "?"],
    ["句点", "ja-JP", "。"],
    ["読点", "ja-JP", "、"],
    ["改行", "ja-JP", "\n"],
    ["段落", "ja-JP", "\n\n"],
    ["句号", "zh-CN", "。"],
    ["句号。", "zh-CN", "。"],
    ["逗号", "zh-CN", "，"],
    ["换行", "zh-CN", "\n"],
    ["段落", "zh-CN", "\n\n"],
    ["新段落", "zh-TW", "\n\n"],
  ];
  for (const [said, lang, mark] of cases) {
    assert.deepEqual(applyVoiceCommand(said, lang), { kind: "punct", value: mark }, `${lang}: ${said}`);
  }
});

test("plain speech is text, not a command, and 'comma' inside a word never fires", () => {
  assert.deepEqual(applyVoiceCommand("hello world", "en-US"), { kind: "text", value: "hello world" });
  assert.deepEqual(applyVoiceCommand("commander", "en-US"), { kind: "text", value: "commander" });
  assert.deepEqual(applyVoiceCommand("  안녕하세요  ", "ko-KR"), { kind: "text", value: "안녕하세요" });
  assert.equal(matchCommand("", "en-US"), null);
  assert.equal(matchCommand("periodic table", "en-US"), null);
});

test("commands are matched across languages when the recogniser drifts", () => {
  assert.equal(matchCommand("마침표", "en-US"), "period");
  assert.equal(matchCommand("period", "ko-KR"), "period");
  assert.equal(markFor("period", "ko-KR"), ".");
  assert.equal(markFor("comma", "ja-JP"), "、");
  assert.equal(markFor("comma", "zh-CN"), "，");
  assert.equal(familyOf("yue-Hant-HK"), "zh");
  assert.equal(familyOf("fr-FR"), "en");
});

test("segmentTranscript cuts a spoken command out of a longer sentence", () => {
  assert.deepEqual(segmentTranscript("hello world comma how are you question mark", "en-US"), [
    { kind: "text", value: "hello world" },
    { kind: "punct", value: ",", punct: "comma" },
    { kind: "text", value: "how are you" },
    { kind: "punct", value: "?", punct: "question" },
  ]);
  assert.deepEqual(segmentTranscript("the commander said new line go", "en-US"), [
    { kind: "text", value: "the commander said" },
    { kind: "punct", value: "\n", punct: "newline" },
    { kind: "text", value: "go" },
  ]);
  assert.deepEqual(segmentTranscript("오늘 회의 마침표 내일 계속", "ko-KR"), [
    { kind: "text", value: "오늘 회의" },
    { kind: "punct", value: ".", punct: "period" },
    { kind: "text", value: "내일 계속" },
  ]);
  assert.deepEqual(segmentTranscript("今日は晴れ句点明日は雨", "ja-JP"), [
    { kind: "text", value: "今日は晴れ" },
    { kind: "punct", value: "。", punct: "period" },
    { kind: "text", value: "明日は雨" },
  ]);
  assert.deepEqual(segmentTranscript("今天开会逗号明天继续句号", "zh-CN"), [
    { kind: "text", value: "今天开会" },
    { kind: "punct", value: "，", punct: "comma" },
    { kind: "text", value: "明天继续" },
    { kind: "punct", value: "。", punct: "period" },
  ]);
  assert.deepEqual(segmentTranscript("   ", "en-US"), []);
});

test("appendTranscript joins with sensible spacing, glued punctuation and English capitals", () => {
  let body = "";
  body = appendTranscript(body, "hello world", "en-US");
  assert.equal(body, "Hello world");
  body = appendTranscript(body, "period", "en-US");
  assert.equal(body, "Hello world.");
  body = appendTranscript(body, "second sentence comma still going", "en-US");
  assert.equal(body, "Hello world. Second sentence, still going");
  body = appendTranscript(body, "new paragraph", "en-US");
  assert.equal(body, "Hello world. Second sentence, still going\n\n");
  body = appendTranscript(body, "next", "en-US");
  assert.equal(body, "Hello world. Second sentence, still going\n\nNext");

  let ko = appendTranscript("", "오늘 회의", "ko-KR");
  ko = appendTranscript(ko, "마침표", "ko-KR");
  ko = appendTranscript(ko, "내일 계속", "ko-KR");
  assert.equal(ko, "오늘 회의. 내일 계속");

  let ja = appendTranscript("", "今日は晴れ", "ja-JP");
  ja = appendTranscript(ja, "句点", "ja-JP");
  ja = appendTranscript(ja, "明日は雨", "ja-JP");
  assert.equal(ja, "今日は晴れ。明日は雨");

  const zh = appendSegments("你好", [{ kind: "text", value: "世界" }], "zh-CN");
  assert.equal(zh, "你好世界");
});

/* ---------- speech lifecycle ---------- */

class MockRecognition {
  static instances = [];
  constructor() {
    this.lang = "";
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 0;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
    this.onstart = null;
    this.started = 0;
    this.stopped = 0;
    this.aborted = 0;
    MockRecognition.instances.push(this);
  }
  start() {
    this.started += 1;
    if (this.onstart) this.onstart();
  }
  stop() {
    this.stopped += 1;
  }
  abort() {
    this.aborted += 1;
  }
  fire(text, isFinal) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript: text } }] });
  }
}

function makeSession(lang = "en-US") {
  MockRecognition.instances = [];
  const log = { finals: [], interims: [], states: [], errors: [] };
  const timers = [];
  const session = new DictationSession(
    MockRecognition,
    lang,
    {
      onFinal: (t) => log.finals.push(t),
      onInterim: (t) => log.interims.push(t),
      onState: (s) => log.states.push(s),
      onError: (e) => log.errors.push(e),
    },
    (fn) => {
      timers.push(fn);
      return timers.length;
    },
    (id) => {
      timers[id - 1] = null;
    },
  );
  const runTimers = () => {
    const pending = timers.splice(0).filter(Boolean);
    for (const fn of pending) fn();
  };
  return { session, log, runTimers };
}

test("start → stop → start again does not throw and always uses a fresh recogniser", () => {
  const { session, log } = makeSession("ko-KR");
  session.start();
  assert.equal(MockRecognition.instances.length, 1);
  const first = MockRecognition.instances[0];
  assert.equal(first.lang, "ko-KR");
  assert.equal(first.continuous, true);
  assert.equal(first.interimResults, true);
  assert.equal(session.state, "listening");
  first.fire("hello", false);
  first.fire("hello world", true);
  assert.deepEqual(log.finals, ["hello world"]);

  session.stop();
  assert.equal(session.state, "idle");
  assert.equal(session.listening, false);
  assert.equal(first.aborted, 1);
  assert.equal(first.onresult, null);
  assert.equal(first.onend, null);
  assert.equal(first.onerror, null);

  assert.doesNotThrow(() => session.start());
  assert.equal(MockRecognition.instances.length, 2);
  const second = MockRecognition.instances[1];
  assert.notEqual(second, first);
  assert.equal(session.state, "listening");
  second.fire("again", true);
  assert.deepEqual(log.finals, ["hello world", "again"]);
  session.stop();
  assert.doesNotThrow(() => session.stop());
  assert.doesNotThrow(() => session.abort());
});

test("onend while still wanted restarts with a new instance; after stop it never does", () => {
  const { session, log, runTimers } = makeSession();
  session.start();
  const first = MockRecognition.instances[0];
  first.onend();
  assert.equal(session.state, "starting");
  runTimers();
  assert.equal(MockRecognition.instances.length, 2);
  assert.equal(session.state, "listening");
  const second = MockRecognition.instances[1];

  session.stop();
  // A late onend from the old instance is detached; even a manual call cannot respawn.
  assert.equal(second.onend, null);
  runTimers();
  assert.equal(MockRecognition.instances.length, 2);
  assert.equal(session.state, "idle");
  assert.ok(log.states.includes("idle"));
});

test("'no-speech' and 'aborted' are not errors; 'not-allowed' ends the session with a friendly error", () => {
  const { session, log, runTimers } = makeSession();
  session.start();
  const first = MockRecognition.instances[0];
  first.onerror({ error: "no-speech" });
  first.onerror({ error: "aborted" });
  assert.deepEqual(log.errors, []);
  first.onend();
  runTimers();
  assert.equal(MockRecognition.instances.length, 2);

  const second = MockRecognition.instances[1];
  second.onerror({ error: "not-allowed" });
  assert.deepEqual(log.errors, ["not-allowed"]);
  assert.equal(session.state, "idle");
  assert.equal(session.listening, false);
  // and the user can try again after fixing permissions
  assert.doesNotThrow(() => session.start());
  assert.equal(MockRecognition.instances.length, 3);
  session.stop();
});

test("changing the recognition language mid-session restarts cleanly", () => {
  const { session } = makeSession("en-US");
  session.start();
  session.setLang("ja-JP");
  assert.equal(MockRecognition.instances.length, 2);
  assert.equal(MockRecognition.instances[1].lang, "ja-JP");
  assert.equal(MockRecognition.instances[0].aborted, 1);
  session.stop();
  session.setLang("ko-KR");
  assert.equal(MockRecognition.instances.length, 2, "idle session does not spawn on setLang");
});

test("detectRecognition finds the prefixed constructor or returns null", () => {
  assert.equal(detectRecognition({}), null);
  assert.equal(detectRecognition(undefined), null);
  assert.equal(detectRecognition({ webkitSpeechRecognition: MockRecognition }), MockRecognition);
  assert.equal(detectRecognition({ SpeechRecognition: MockRecognition }), MockRecognition);
});

/* ---------- notes ---------- */

test("note create / rename / update / delete helpers are pure and keep order", () => {
  const { notes: n1, note: a } = createNote([], undefined, "2026-09-15T00:00:00.000Z");
  assert.equal(n1.length, 1);
  assert.equal(a.body, "");
  assert.equal(displayTitle(a), "");
  const n2 = renameNote(n1, a.id, "  Meeting  ", "2026-09-15T00:01:00.000Z");
  assert.equal(n2[0].title, "Meeting");
  const n3 = updateBody(n2, a.id, "first line\nsecond", "2026-09-15T00:02:00.000Z");
  assert.equal(n3[0].body, "first line\nsecond");
  assert.equal(n3[0].updatedAt, "2026-09-15T00:02:00.000Z");
  assert.equal(updateBody(n3, a.id, "first line\nsecond"), n3, "unchanged body returns the same array");
  const { notes: n4, note: b } = createNote(n3, "Second");
  assert.equal(n4[0].id, b.id, "new note goes first");
  assert.equal(pickActive(n4, a.id).id, a.id);
  assert.equal(pickActive(n4, "missing").id, b.id);
  assert.equal(pickActive([], "x"), null);
  const n5 = deleteNote(n4, b.id);
  assert.deepEqual(n5.map((n) => n.id), [a.id]);
  assert.equal(displayTitle({ id: "x", body: "  \nA very long first line that goes past forty characters for sure", createdAt: "", updatedAt: "" }), "A very long first line that goes past fo…");
  assert.equal(txtFilename({ id: "x", title: "My: note/1", body: "", createdAt: "", updatedAt: "" }, new Date(2026, 8, 15)), "My  note 1-20260915.txt");
});

test("recognition language defaults follow the UI language and the list covers the four site languages", () => {
  assert.equal(defaultSpeechLang("ko"), "ko-KR");
  assert.equal(defaultSpeechLang("en"), "en-US");
  assert.equal(defaultSpeechLang("ja"), "ja-JP");
  assert.equal(defaultSpeechLang("zh"), "zh-CN");
  assert.equal(defaultSpeechLang("xx"), "en-US");
  const codes = SPEECH_LANGS.map((l) => l.code);
  for (const c of ["ko-KR", "en-US", "en-GB", "ja-JP", "zh-CN", "zh-TW"]) assert.ok(codes.includes(c), c);
  assert.ok(codes.length >= 20);
  assert.equal(new Set(codes).size, codes.length, "no duplicate codes");
});

/* ---------- backup ---------- */

test("JSON export / import round-trips notes and prefs", () => {
  const notes = [
    { id: "n-1", title: "One", body: "hello.\nworld", createdAt: "2026-09-15T00:00:00.000Z", updatedAt: "2026-09-15T00:05:00.000Z" },
    { id: "n-2", body: "두 번째 노트", createdAt: "2026-09-14T00:00:00.000Z", updatedAt: "2026-09-14T00:00:00.000Z" },
  ];
  const prefs = { activeNoteId: "n-2", recognitionLang: "ko-KR" };
  const backup = buildBackup(notes, prefs, new Date("2026-09-15T01:00:00Z"));
  assert.equal(backup.app, BACKUP_APP);
  assert.equal(backup.app, "dictpad");
  assert.equal(backup.version, BACKUP_VERSION);
  const text = toJSON(backup);
  const parsed = parseBackup(JSON.parse(text));
  assert.ok(parsed);
  assert.deepEqual(parsed.notes, notes);
  assert.deepEqual(parsed.prefs, prefs);
  assert.equal(parsed.exportedAt, "2026-09-15T01:00:00.000Z");
  assert.match(backupFilename(new Date(2026, 8, 15)), /^dictpad-20260915\.json$/);
});

test("import is forgiving: bare arrays, alternate keys, single objects, unknown keys; garbage is null", () => {
  const bare = parseBackup([{ text: "a" }, "plain string note", { title: "only title" }]);
  assert.equal(bare.notes.length, 3);
  assert.equal(bare.notes[0].body, "a");
  assert.equal(bare.notes[1].body, "plain string note");
  assert.equal(bare.notes[2].title, "only title");
  assert.ok(bare.notes.every((n) => typeof n.id === "string" && n.id));

  const alt = parseBackup({ documents: [{ id: "d1", name: "Doc", content: "body", created: 1757900000000, mystery: 1 }], settings: { lang: "ja-JP", unknown: true } });
  assert.equal(alt.notes[0].title, "Doc");
  assert.equal(alt.notes[0].body, "body");
  assert.equal(alt.prefs.recognitionLang, "ja-JP");

  const single = parseBackup({ body: "just one" });
  assert.equal(single.notes.length, 1);

  const dup = parseBackup({ notes: [{ id: "same", body: "1" }, { id: "same", body: "2" }] });
  assert.equal(new Set(dup.notes.map((n) => n.id)).size, 2);

  assert.equal(parseBackup(null), null);
  assert.equal(parseBackup(42), null);
  assert.equal(parseBackup({ app: "hourpad", sessions: [] }), null);
  assert.equal(parseBackup([1, 2, 3]), null);
  assert.equal(normalizeNote({ nothing: true }), null);
  assert.deepEqual(parsePrefs({ recognitionLang: "not a lang!" }), {});
  assert.deepEqual(parseBackup({ app: "dictpad", version: 1, notes: [] }).notes, []);
});

/* ---------- shipped bundle ---------- */

test("built index.html (when built) carries no paywall, ads, IME or leftover sibling product copy", { skip: !existsSync(path.join(APP, "dist", "index.html")) }, () => {
  const html = readFileSync(path.join(APP, "dist", "index.html"), "utf8");
  assert.doesNotMatch(html, /\$10|\/wk|per week|weekly fee|paywall|upgrade to plus|premium plan|free trial|subscribe now/i);
  assert.doesNotMatch(html, /adsbygoogle|googlesyndication|ca-pub-|AdSlot/i);
  assert.doesNotMatch(html, /hourpad|아워패드|overtime|timesheet|recpad|waveform|paypad|envelope|subpad/i);
  assert.match(html, /딕트패드/);
  assert.match(html, /id="local-only"/);
});
