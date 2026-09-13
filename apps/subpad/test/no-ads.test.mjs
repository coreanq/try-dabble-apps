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

test("no login, paywall, IAP, bank link, Plaid or catalog lock anywhere in the app copy", () => {
  const text = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.doesNotMatch(text, /sign in|log in|unlock (pro|premium)|start (your )?free trial|upgrade to|plaid|open banking|connect (your )?bank/i);
});

test("no leftover timer / scrub / gym product copy", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public")), ...walk(path.join(APP, "test"))];
  for (const f of files) {
    if (f.endsWith("no-ads.test.mjs")) continue;
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, /timerpad|타이머패드|pomodoro|tabata|scrubpad|gymac|\btp-/i, path.relative(APP, f));
  }
});

test("no remote logo fetch: templates carry only local tiles, and the app never calls fetch()", () => {
  const templates = readFileSync(path.join(APP, "src", "lib", "templates.ts"), "utf8");
  assert.doesNotMatch(templates, /logo\.clearbit|favicon|logo\.dev|brandfetch|icons8|simpleicons\.org|\/logos?\//i);
  for (const f of walk(path.join(APP, "src"))) {
    if (f.endsWith("og-lang.ts")) continue; // the Worker fetches its own assets binding only
    assert.doesNotMatch(readFileSync(f, "utf8"), /\bfetch\(|XMLHttpRequest|new Image\(/, path.relative(APP, f));
  }
});

test("fail-fix UI paths exist: add, template picker, mark paid, skip, export/import, ics, chips, footer ids", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  for (const id of ["btn-add", "btn-add-template", "template-search", "template-list", "sub-search", "filter-category", "filter-currency", "filter-cycle", "filter-window", "sub-list", "btn-export", "btn-import", "btn-export-ics", "btn-clear", "history-list", "totals", "no-fx-note", "promises", "link-privacy", "link-terms", "link-guide", "link-hub", "starter-chips"]) {
    assert.match(home, new RegExp(`id="${id}"`), id);
  }
  for (const action of ["paid", "skip", "edit", "ics", "delete"]) {
    assert.match(home, new RegExp(`data-action="${action}"`), action);
  }
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial|plaid/i);
  assert.match(home, /guides\/subpad/);
});

test("every input, textarea and button gets 16px font and touch-action manipulation from the base sheet", () => {
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /input, textarea, select, button \{[^}]*font-size: 16px;[^}]*touch-action: manipulation;/s);
});
