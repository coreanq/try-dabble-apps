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

test("no login, paywall, IAP, Plus tier or team wall anywhere in the app copy", () => {
  const text = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.doesNotMatch(text, /sign in|log in\b|unlock (pro|premium|plus)|start (your )?free trial|upgrade to|create (a )?workspace|invite your team|go premium/i);
});

test("the only file input is the JSON import — no photo / voice attachment picker", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  const inputs = home.match(/type="file"[^>]*/g) || [];
  assert.equal(inputs.length, 1);
  assert.match(inputs[0], /accept="application\/json,\.json"/);
  assert.doesNotMatch(home, /image\/\*|audio\/\*|capture=|getUserMedia|MediaRecorder/);
});

test("delete-all is only reachable through a typed confirmation", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  assert.match(home, /const DELETE_ALL_WORD = "lockpad"/);
  assert.match(home, /if \(deleteAllWord\.trim\(\)\.toLowerCase\(\) !== DELETE_ALL_WORD\) return;/);
  assert.match(home, /id="delete-all-confirm" disabled=\{deleteAllWord/);
});

test("search never reads ciphertext and the unlock modal enforces backoff", () => {
  const store = readFileSync(path.join(APP, "src", "lib", "store.ts"), "utf8");
  const searchFn = store.slice(store.indexOf("export function searchNotes"), store.indexOf("export function mergeNotes"));
  assert.doesNotMatch(searchFn, /ciphertext|decrypt/);
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  assert.match(home, /recordFailure\(/);
  assert.match(home, /remainingMs\(/);
  assert.match(home, /disabled=\{unlockWait > 0/);
});

test("no leftover onday / trash / essay / dict / hour product copy, and no attachment or wipe feature", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public")), path.join(APP, "contain-og.js"), path.join(APP, "package.json"), path.join(APP, "wrangler.jsonc")];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(
      text,
      /ondaypad|온데이패드|trashpad|트래시패드|essaypad|에세이패드|hourpad|아워패드|paypad|페이패드|subpad|섭패드|recpad|dictpad|timerpad|affirmpad|listenpad|progresspad|프로그레스패드|nostalgia|across years|MM-DD|word count|deadline|check-in|timesheet|paycheck|\bod-|\bep-|\bhp-|\bpp-|\bsb-|\btp-|\bdp-|attachment paywall feature|<input[^>]*type="file"[^>]*accept="(image|audio)/i,
      path.relative(APP, f),
    );
  }
});

test("every input, textarea and button is at least 16px and uses touch-action: manipulation", () => {
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /input, textarea, select, button \{\s*font-size: 16px;\s*touch-action: manipulation;/);
});

test("the feedback widget is a link only: nothing bundles it and there is no in-app feedback panel", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src"))];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    if (f.endsWith("og-lang.ts")) {
      assert.match(text, /data-app="\$\{SLUG\}"/);
      assert.match(text, /const SLUG = 'lockpad'/);
      continue;
    }
    assert.doesNotMatch(text, /widget\/feedback\.js|FeedbackPanel|feedback-dialog/i, path.relative(APP, f));
  }
});
