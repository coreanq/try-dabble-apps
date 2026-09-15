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

test("the built index.html has no paywall, Plus tier, ad or library-player leftovers", { skip: !existsSync(path.join(APP, "dist", "index.html")) }, () => {
  const html = readFileSync(path.join(APP, "dist", "index.html"), "utf8");
  assert.doesNotMatch(html, AD_PATTERN);
  assert.doesNotMatch(html, /\$\d|\bPlus\b|paywall|premium|in-app purchase|subscribe now/i);
  assert.doesNotMatch(html, /localplay|로컬플레이|playlist|album|queue|shuffle|dictpad|딕트패드|Web Speech|받아쓰기|\bdp-[a-z]|\blp-[a-z]/i);
  assert.match(html, /id="local-only"/);
  assert.match(html, /class="lnp-tagline"/);
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

test("no leftover dictation / library / timesheet / recorder product copy, and no weekly fee", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public")), path.join(APP, "contain-og.js"), path.join(APP, "package.json"), path.join(APP, "wrangler.jsonc")];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, /dictpad|딕트패드|ディクトパッド|听写板|Web Speech|webkitSpeechRecognition|받아쓰기|talk-to-text|voice punctuation|\bdp-[a-z]/i, path.relative(APP, f));
    assert.doesNotMatch(text, /localplay|로컬플레이|\blp-[a-z]|add to playlist|now playing|album art|shuffle|play queue/i, path.relative(APP, f));
    assert.doesNotMatch(text, /아워패드|hourpad|overtime bank|timesheet|paypad|페이패드|envelope|recpad|렉패드|wav export|subpad|섭패드|timerpad|pomodoro|\bhp-[a-z]|\bpp-[a-z]|\brp-[a-z]|\bsb-[a-z]/i, path.relative(APP, f));
    assert.doesNotMatch(text, /\$10|per week|\/wk\b|weekly fee|upgrade to plus|premium plan/i, path.relative(APP, f));
  }
});

test("copy never names browser storage tech and says this device / this browser", async () => {
  const { I18N } = await import("../src/lib/i18n.ts");
  for (const lang of Object.keys(I18N)) {
    for (const [k, v] of Object.entries(I18N[lang])) assert.doesNotMatch(v, /IndexedDB|localStorage|local storage|cache storage/i, `${lang}.${k}`);
  }
  const i18n = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.match(i18n, /stay on this device/);
  assert.match(i18n, /이 기기에만/);
  assert.match(i18n, /この端末にだけ/);
  assert.match(i18n, /仅留在此设备/);
});

test("the app never calls fetch() outside the Worker", () => {
  for (const f of walk(path.join(APP, "src"))) {
    if (f.endsWith("og-lang.ts")) continue; // the Worker fetches its own assets binding only
    assert.doesNotMatch(readFileSync(f, "utf8"), /\bfetch\(|XMLHttpRequest|new Image\(/, path.relative(APP, f));
  }
});

test("fail-fix UI paths exist: file pick + drop, play, 1–4s rewind and skip, A–B, speed, scrubber, notes, backup, docs, chips, footer ids", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  for (const id of ["file", "btn-pick", "audio-file", "ios-note", "deck", "scrubber", "time-current", "time-duration", "btn-play", "loop", "btn-set-a", "btn-set-b", "btn-clear-loop", "loop-status", "speed", "speed-now", "btn-speed-reset", "notes", "notepad", "btn-export", "btn-import", "import-file", "btn-clear", "docs", "promises", "link-privacy", "link-terms", "link-guide", "link-hub"]) {
    assert.match(home, new RegExp(`id="${id}"`), id);
  }
  assert.match(home, /id=\{`btn-rewind-\$\{n\}`\}/);
  assert.match(home, /id=\{`btn-forward-\$\{n\}`\}/);
  assert.match(home, /data-action="rewind"/);
  assert.match(home, /data-action="forward"/);
  assert.match(home, /data-action=\{playing \? "pause" : "play"\}/);
  assert.match(home, /onDrop=\{onDrop\}/);
  assert.match(home, /onDragOver=/);
  assert.match(home, /accept=\{ACCEPT\}/);
  assert.match(home, /type="range"/);
  assert.match(home, /playbackRate = prefs\.speed/);
  assert.match(home, /shouldSeekToA\(/);
  assert.match(home, /URL\.createObjectURL\(f\)/);
  assert.match(home, /docIos/);
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial|\bpaywall\b/i);
  assert.match(home, /guides\/listenpad/);
  assert.doesNotMatch(home, /widget\/feedback\.js/, "the feedback widget is injected by the Worker, not bundled");
  const player = readFileSync(path.join(APP, "src", "lib", "player.ts"), "utf8");
  assert.match(player, /REWIND_STEPS: RewindSec\[\] = \[1, 2, 3, 4\]/);
});

test("the Worker injects exactly one feedback.js tag with data-app=listenpad and no ad script", () => {
  const worker = readFileSync(path.join(APP, "src", "og-lang.ts"), "utf8");
  assert.match(worker, /https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="\$\{SLUG\}" defer/);
  assert.match(worker, /const SLUG = 'listenpad'/);
  assert.match(worker, /NAVER_META_HTML/);
  assert.match(worker, /\.on\('\.lnp-tagline'/);
  assert.doesNotMatch(worker, AD_PATTERN);
});

test("wrangler.jsonc and package.json are listenpad's", () => {
  const w = readFileSync(path.join(APP, "wrangler.jsonc"), "utf8");
  assert.match(w, /"name": "listenpad"/);
  assert.match(w, /"pattern": "listenpad\.try-dabble\.com"/);
  assert.match(w, /"main": "src\/og-lang\.ts"/);
  assert.match(w, /"run_worker_first": true/);
  assert.match(w, /"compatibility_date": "2026-08-27"/);
  const p = JSON.parse(readFileSync(path.join(APP, "package.json"), "utf8"));
  assert.equal(p.name, "listenpad");
  for (const s of ["dev", "build", "preview", "test", "deploy", "og", "cf-typegen"]) assert.ok(p.scripts[s], s);
  const sw = readFileSync(path.join(APP, "public", "sw.js"), "utf8");
  assert.match(sw, /"listenpad-v1"/);
});

test("every input, textarea and button gets 16px font and touch-action manipulation from the base sheet", () => {
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /input, textarea, select, button \{[^}]*font-size: 16px;[^}]*touch-action: manipulation;/s);
  assert.match(css, /\.lnp-jump \{[^}]*min-height: 4rem;/s, "rewind buttons are at least 64px tall");
  assert.match(css, /\.lnp-play \{[^}]*min-height: 4rem;/s);
});
