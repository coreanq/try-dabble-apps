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

test("no timer product left behind, no in-app feedback panel, no network call for scrubbing", () => {
  const src = walk(path.join(APP, "src")).map((f) => [path.relative(APP, f), readFileSync(f, "utf8")]);
  for (const [name, text] of src) {
    assert.doesNotMatch(text, /HIIT|Pomodoro|stopwatch|타이머패드|timerpad|tp-/i, name);
    if (name !== "src/og-lang.ts") assert.doesNotMatch(text, /widget\/feedback\.js/, `${name} bundles the widget; the Worker links it instead`);
  }
  const scrubLib = readFileSync(path.join(APP, "src", "lib", "scrub.ts"), "utf8");
  assert.doesNotMatch(scrubLib, /fetch\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket/, "scrub.ts must be pure");
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  assert.doesNotMatch(home, /fetch\(|XMLHttpRequest|sendBeacon|gtag|analytics/i, "home.tsx must not phone home");
});

test("fail-fix UI paths exist: paste first, review list, custom words, copy/download, restore map, dictionary JSON", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  const order = ['id="local-only"', 'id="paste-card"', 'id="review-card"', 'id="compare-card"'];
  // The paste box is the first card after the banner / masthead, not buried.
  const bannerAt = home.indexOf("<LocalOnlyBanner");
  const pasteAt = home.indexOf('id="paste-card"');
  const reviewAt = home.indexOf('id="review-card"');
  assert.ok(bannerAt > -1 && pasteAt > bannerAt && reviewAt > pasteAt, order.join(" < "));
  for (const id of [
    "paste",
    "btn-scrub",
    "on-device-note",
    "review-list",
    "custom-word",
    "btn-add-word",
    "pane-original",
    "pane-scrubbed",
    "btn-copy",
    "btn-download",
    "btn-restore-toggle",
    "btn-restore-copy",
    "btn-restore-download",
    "restore-warn",
    "btn-dict-export",
    "btn-dict-import",
    "promise-chips",
    "link-privacy",
    "link-terms",
    "link-guide",
    "link-hub",
  ]) {
    assert.match(home, new RegExp(`id="${id}"`), id);
  }
  assert.match(home, /guides\/scrubpad/);
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial/i);
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /\.sp-textarea \{[^}]*min-height: 8rem/);
  assert.match(css, /\.sp-textarea \{ min-height: 12rem; \}/);
  assert.match(css, /touch-action: manipulation/);
  assert.doesNotMatch(css, /#111\b|#2f6fed/i, "not a dark clone, not timerpad cobalt");
});
