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

test("no login, paywall, IAP, subscription pitch or catalog lock anywhere in the app copy", () => {
  const text = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.doesNotMatch(text, /sign in|log in|premium|unlock (pro|premium)|start (your )?free trial|upgrade to/i);
});

test("fail-fix UI paths exist: mid-workout stop/reset, editable presets, no interstitial", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  assert.match(home, /id="btn-reset"/);
  assert.match(home, /id="btn-stop"/);
  assert.match(home, /id="interval-editor"/);
  assert.match(home, /id="pomodoro-editor"/);
  assert.match(home, /id="preset-tabata"/);
  assert.match(home, /id="btn-save-routine"/);
  assert.match(home, /id="btn-lap"/);
  assert.match(home, /id="btn-fullscreen"/);
  assert.match(home, /id="btn-wake"/);
  assert.match(home, /id="btn-sound"/);
  assert.match(home, /id="btn-export"/);
  assert.match(home, /id="mid-hint"/);
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial/i);
});
