import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");
const AD_PATTERN = /adsbygoogle|googlesyndication|doubleclick\.net|ca-pub-\d|AdSlot|pagead2/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|tsx?|jsx?|mjs|css|json|webmanifest|txt|xml)$/.test(name)) out.push(p);
  }
  return out;
}

test("index.html, src/ and public/ carry no ad script or ad slot", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public"))];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    if (/(^|\/)(app-)?ads\.txt$/.test(f)) continue;
    assert.doesNotMatch(text, AD_PATTERN, path.relative(APP, f));
  }
});

test("the production bundle (when built) carries no ad script either", { skip: !existsSync(path.join(APP, "dist")) }, () => {
  for (const f of walk(path.join(APP, "dist"))) {
    if (/(^|\/)(app-)?ads\.txt$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(f, "utf8"), AD_PATTERN, path.relative(APP, f));
  }
});

test("no autofocus anywhere in the app", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src"))];
  for (const f of files) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /autofocus|autoFocus/, path.relative(APP, f));
  }
});

test("public ads.txt files carry the shared publisher line", () => {
  for (const name of ["ads.txt", "app-ads.txt"]) {
    const text = readFileSync(path.join(APP, "public", name), "utf8").trim();
    assert.equal(text, "google.com, pub-1343411537040925, DIRECT, f08c47fec0942fa0");
  }
});

test("no login, paywall, IAP or team wall anywhere in the app copy", () => {
  const text = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.doesNotMatch(text, /sign in|log in|unlock (pro|premium)|start (your )?free trial|upgrade to|in-app purchase|create (a )?workspace|invite your team/i);
});

test("no leftover timesheet / envelope / recorder / subscription product copy, and no weekly fee", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public")), path.join(APP, "contain-og.js"), path.join(APP, "package.json"), path.join(APP, "wrangler.jsonc")];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    if (/lib\.test|no-ads\.test/.test(f)) continue;
    assert.doesNotMatch(text, /아워패드|overtime bank|timesheet|check-in|check out|paypad|페이패드|envelope|recpad|렉패드|waveform|wav export|subpad|섭패드|timerpad|pomodoro|hiit|\bhp-|\bpp-|\brp-|\bsb-/i, path.relative(APP, f));
    assert.doesNotMatch(text, /\$10|per week|\/wk\b|weekly fee|upgrade to plus|premium plan/i, path.relative(APP, f));
  }
});

test("copy never claims to be a system keyboard or IME, and says notepad / in-browser", () => {
  const i18n = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.match(i18n, /not a system keyboard/);
  assert.match(i18n, /시스템 키보드가 아니라/);
  assert.match(i18n, /システムキーボードではなく/);
  assert.match(i18n, /不是系统输入法/);
  assert.doesNotMatch(i18n, /install (this|the) keyboard|enable (this|the) keyboard|input method editor|type in any app/i);
});

test("the app never calls fetch() outside the Worker", () => {
  for (const f of walk(path.join(APP, "src"))) {
    if (f.endsWith("og-lang.ts")) continue; // the Worker fetches its own assets binding only
    assert.doesNotMatch(readFileSync(f, "utf8"), /\bfetch\(|XMLHttpRequest|new Image\(/, path.relative(APP, f));
  }
});

test("fail-fix UI paths exist: record control, speech lang, interim strip, notepad, notes, copy/download/export/import, voice chips, docs, chips, footer ids", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  for (const id of ["deck", "deck-status", "speech-lang", "btn-record", "interim", "pad", "note-select", "btn-new-note", "btn-rename-note", "btn-delete-note", "rename-input", "rename-save", "notepad", "char-count", "btn-copy", "btn-download-txt", "btn-export", "btn-import", "import-file", "btn-clear", "voice", "docs", "promises", "link-privacy", "link-terms", "link-guide", "link-hub"]) {
    assert.match(home, new RegExp(`id="${id}"`), id);
  }
  assert.match(home, /data-action=\{listening \? "stop" : "record"\}/);
  assert.match(home, /data-action="delete"/);
  for (const punct of ["period", "comma", "newline", "paragraph"]) {
    assert.match(home, new RegExp(`punct: "${punct}"`), punct);
  }
  assert.match(home, /docAndroid/);
  assert.match(home, /wakeLock/);
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial|\bpaywall\b/i);
  assert.match(home, /guides\/dictpad/);
  assert.doesNotMatch(home, /widget\/feedback\.js/, "the feedback widget is injected by the Worker, not bundled");
  const speech = readFileSync(path.join(APP, "src", "lib", "speech.ts"), "utf8");
  assert.match(speech, /webkitSpeechRecognition/);
  assert.match(speech, /rec\.onresult = null/);
});

test("the Worker injects exactly one feedback.js tag with data-app=dictpad and no ad script", () => {
  const worker = readFileSync(path.join(APP, "src", "og-lang.ts"), "utf8");
  assert.match(worker, /https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="\$\{SLUG\}" defer/);
  assert.match(worker, /const SLUG = 'dictpad'/);
  assert.match(worker, /NAVER_META_HTML/);
  assert.match(worker, /\.on\('\.dp-tagline'/);
  assert.doesNotMatch(worker, AD_PATTERN);
});

test("wrangler.jsonc and package.json are dictpad's", () => {
  const w = readFileSync(path.join(APP, "wrangler.jsonc"), "utf8");
  assert.match(w, /"name": "dictpad"/);
  assert.match(w, /"pattern": "dictpad\.try-dabble\.com"/);
  assert.match(w, /"main": "src\/og-lang\.ts"/);
  assert.match(w, /"run_worker_first": true/);
  assert.match(w, /"compatibility_date": "2026-08-27"/);
  const p = JSON.parse(readFileSync(path.join(APP, "package.json"), "utf8"));
  assert.equal(p.name, "dictpad");
  for (const s of ["dev", "build", "preview", "test", "deploy", "og", "cf-typegen"]) assert.ok(p.scripts[s], s);
  const sw = readFileSync(path.join(APP, "public", "sw.js"), "utf8");
  assert.match(sw, /"dictpad-v1"/);
});

test("every input, textarea and button gets 16px font and touch-action manipulation from the base sheet", () => {
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /input, textarea, select, button \{[^}]*font-size: 16px;[^}]*touch-action: manipulation;/s);
});
