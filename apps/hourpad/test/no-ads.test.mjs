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

test("no leftover subscription / timer / scrub / gym product copy, and no Pomodoro or HIIT", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public")), path.join(APP, "contain-og.js"), path.join(APP, "package.json"), path.join(APP, "wrangler.jsonc")];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, /subpad|섭패드|timerpad|타이머패드|pomodoro|tabata|hiit|scrubpad|gymac|netflix|spotify|renewal|\bsb-|\btp-/i, path.relative(APP, f));
  }
});

test("the app never calls fetch() outside the Worker", () => {
  for (const f of walk(path.join(APP, "src"))) {
    if (f.endsWith("og-lang.ts")) continue; // the Worker fetches its own assets binding only
    assert.doesNotMatch(readFileSync(f, "utf8"), /\bfetch\(|XMLHttpRequest|new Image\(/, path.relative(APP, f));
  }
});

test("fail-fix UI paths exist: clock controls, label, totals, bank edit, target edit, day/week history, export/import, chips, footer ids", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  for (const id of ["clock", "clock-status", "clock-elapsed", "session-label", "btn-check-in", "btn-break", "btn-resume", "btn-check-out", "totals", "today-work", "today-break", "week", "week-work", "week-target", "week-delta", "btn-edit-target", "bank", "bank-balance", "btn-edit-bank", "bank-rule", "hours-input", "hours-save", "day-pick", "session-list", "btn-add-entry", "week-list", "btn-export", "btn-import", "import-file", "btn-clear", "promises", "link-privacy", "link-terms", "link-guide", "link-hub"]) {
    assert.match(home, new RegExp(`id="${id}"`), id);
  }
  for (const action of ["check-in", "break", "resume", "check-out", "delete"]) {
    assert.match(home, new RegExp(`data-action="${action}"`), action);
  }
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial|paywall/i);
  assert.match(home, /guides\/hourpad/);
  assert.match(home, /widget\/feedback\.js/.test(home) ? /never/ : /hp-app/, "the feedback widget is injected by the Worker, not bundled");
});

test("the Worker injects exactly one feedback.js tag with data-app=hourpad and no ad script", () => {
  const worker = readFileSync(path.join(APP, "src", "og-lang.ts"), "utf8");
  assert.match(worker, /https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="\$\{SLUG\}" defer/);
  assert.match(worker, /const SLUG = 'hourpad'/);
  assert.match(worker, /NAVER_META_HTML/);
  assert.match(worker, /\.on\('\.hp-tagline'/);
  assert.doesNotMatch(worker, AD_PATTERN);
});

test("wrangler.jsonc and package.json are hourpad's", () => {
  const w = readFileSync(path.join(APP, "wrangler.jsonc"), "utf8");
  assert.match(w, /"name": "hourpad"/);
  assert.match(w, /"pattern": "hourpad\.try-dabble\.com"/);
  assert.match(w, /"main": "src\/og-lang\.ts"/);
  assert.match(w, /"run_worker_first": true/);
  assert.match(w, /"compatibility_date": "2026-08-27"/);
  const p = JSON.parse(readFileSync(path.join(APP, "package.json"), "utf8"));
  assert.equal(p.name, "hourpad");
  for (const s of ["dev", "build", "preview", "test", "deploy", "og", "cf-typegen"]) assert.ok(p.scripts[s], s);
  const sw = readFileSync(path.join(APP, "public", "sw.js"), "utf8");
  assert.match(sw, /"hourpad-v1"/);
});

test("every input, textarea and button gets 16px font and touch-action manipulation from the base sheet", () => {
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /input, textarea, select, button \{[^}]*font-size: 16px;[^}]*touch-action: manipulation;/s);
});
