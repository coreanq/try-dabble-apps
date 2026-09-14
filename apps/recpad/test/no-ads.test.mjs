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

test("the built index.html has no price, paywall or ad strings", { skip: !existsSync(path.join(APP, "dist", "index.html")) }, () => {
  const html = readFileSync(path.join(APP, "dist", "index.html"), "utf8");
  assert.doesNotMatch(html, /\$\d|paywall|premium|subscribe|sign in|log in|adsbygoogle|ca-pub/i);
  assert.match(html, /id="local-only"/);
  assert.match(html, /naver-site-verification/);
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

test("no login, paywall, IAP, subscription pitch anywhere in the app copy", () => {
  const text = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.doesNotMatch(text, /sign in|log in|premium|unlock (pro|premium)|start (your )?free trial|upgrade to/i);
});

test("no scrubber or timer product left behind, no in-app feedback panel, no network call for audio", () => {
  const src = walk(path.join(APP, "src")).map((f) => [path.relative(APP, f), readFileSync(f, "utf8")]);
  for (const [name, text] of src) {
    assert.doesNotMatch(text, /HIIT|Pomodoro|stopwatch|타이머패드|timerpad|스크럽패드|scrubpad|\bsp-/i, name);
    if (name !== "src/og-lang.ts") assert.doesNotMatch(text, /widget\/feedback\.js/, `${name} bundles the widget; the Worker links it instead`);
  }
  for (const lib of ["audio.ts", "recorder.ts", "drafts.ts", "mp3.ts", "store.ts"]) {
    const text = readFileSync(path.join(APP, "src", "lib", lib), "utf8");
    assert.doesNotMatch(text, /fetch\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket/, `${lib} must not touch the network`);
  }
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  assert.doesNotMatch(home, /fetch\(|XMLHttpRequest|sendBeacon|gtag|analytics/i, "home.tsx must not phone home");
  assert.doesNotMatch(home, /IndexedDB|localStorage/i, "user-facing copy never names browser storage");
});

test("user-facing copy never names browser storage in any language", async () => {
  const { I18N } = await import("../src/lib/i18n.ts");
  for (const [lang, table] of Object.entries(I18N)) {
    for (const [key, value] of Object.entries(table)) {
      assert.doesNotMatch(value, /IndexedDB|localStorage|Web Storage/i, `${lang}.${key}`);
    }
  }
});

test("fail-fix UI paths exist: record first, waveform, trim/cut/undo, noise, gain, WAV/MP3, drafts, footer", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  // The record card is the first card after the banner / masthead, not buried.
  const bannerAt = home.indexOf("<LocalOnlyBanner");
  const recordAt = home.indexOf('id="record-card"');
  const editAt = home.indexOf('id="edit-card"');
  const exportAt = home.indexOf('id="export-card"');
  const draftsAt = home.indexOf('id="drafts-card"');
  assert.ok(bannerAt > -1 && recordAt > bannerAt && editAt > recordAt && exportAt > editAt && draftsAt > exportAt, "banner < record < edit < export < drafts");
  for (const id of [
    "btn-record",
    "btn-stop",
    "btn-play",
    "btn-pause",
    "btn-demo",
    "on-device-note",
    "btn-trim",
    "btn-cut",
    "btn-clear-sel",
    "btn-undo",
    "noise-strength",
    "btn-noise",
    "gain-db",
    "btn-gain",
    "btn-normalize",
    "btn-wav",
    "btn-mp3",
    "draft-name",
    "btn-save-draft",
    "draft-list",
    "promise-chips",
    "link-privacy",
    "link-terms",
    "link-guide",
    "link-hub",
  ]) {
    assert.match(home, new RegExp(`id="${id}"`), id);
  }
  const wave = readFileSync(path.join(APP, "src", "components", "waveform.tsx"), "utf8");
  assert.match(wave, /id="waveform"/);
  assert.match(wave, /onPointerDown/);
  assert.match(home, /guides\/recpad/);
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial/i);
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /touch-action: manipulation/);
  assert.match(css, /--rp-teal: #0d9488/);
  assert.match(css, /--rp-coral: #e11d48/);
  assert.match(css, /--rp-plum: #4a1942/);
  assert.doesNotMatch(css, /#111\b|#2f6fed|#1b5e4a|#c23b22/i, "not a dark clone, not timerpad cobalt, not the scrubpad forest/cinnabar twin");
});
