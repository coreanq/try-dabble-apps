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

test("the built index.html has no paywall, Plus tier, login or weekly-spend leftovers", { skip: !existsSync(path.join(APP, "dist", "index.html")) }, () => {
  const html = readFileSync(path.join(APP, "dist", "index.html"), "utf8");
  assert.doesNotMatch(html, /upgrade to plus|go plus|premium plan|paywall\b|sign in|log in|free trial|\$\d+\/(mo|month|yr|year)/i);
  assert.doesNotMatch(html, /weekpad|위크패드|weekly spend|spend cap|hourpad|아워패드|timesheet|subpad|섭패드/i);
  assert.match(html, /페이패드/);
  assert.match(html, /<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751"/);
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

test("no login, paywall, Plus tier, IAP or bank link anywhere in the app copy", () => {
  const text = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  assert.doesNotMatch(text, /sign in|log in|unlock (pro|premium|plus)|start (your )?free trial|upgrade to|plaid|open banking|connect (your )?bank/i);
});

test("no leftover subscription / timesheet / weekly-spend product copy", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public")), ...walk(path.join(APP, "test"))];
  for (const f of files) {
    if (f.endsWith("no-ads.test.mjs")) continue;
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, /subpad|섭패드|hourpad|아워패드|weekpad|위크패드|timerpad|scrubpad|gymac|\bsb-|\bhp-|\bwp-|nextRenewal|check-?in|overtime|weekly spend/i, path.relative(APP, f));
  }
});

test("the app never calls fetch() outside the Worker", () => {
  for (const f of walk(path.join(APP, "src"))) {
    if (f.endsWith("og-lang.ts")) continue; // the Worker fetches its own assets binding only
    assert.doesNotMatch(readFileSync(f, "utf8"), /\bfetch\(|XMLHttpRequest|new Image\(/, path.relative(APP, f));
  }
});

test("fail-fix UI paths exist: plans, mode, earnings, envelopes, totals, chart, views, backup, chips, footer ids", () => {
  const home = readFileSync(path.join(APP, "src", "routes", "home.tsx"), "utf8");
  for (const id of [
    "plan-select", "btn-plan-new", "btn-plan-rename", "btn-plan-duplicate", "btn-plan-delete", "plan-mode", "plan-currency",
    "view-monthly", "view-annual", "period-prev", "period-next", "period-label",
    "totals", "total-income", "total-allocated", "total-buffer", "over-warn", "chart-bar", "chart-categories", "annual-months",
    "btn-earning-add", "earnings-list", "f-amount", "f-date", "f-label", "f-currency",
    "btn-envelope-add", "envelope-list", "unlimited-hint", "f-env-name", "f-kind-percent", "f-kind-fixed", "f-env-value", "f-env-category",
    "btn-export", "btn-import", "import-file", "btn-clear",
    "promises", "link-privacy", "link-terms", "link-guide", "link-hub",
  ]) {
    assert.match(home, new RegExp(`id="${id}"`), id);
  }
  for (const action of ["edit-earning", "delete-earning", "edit-envelope", "delete-envelope", "move-up", "move-down"]) {
    assert.match(home, new RegExp(`data-action="${action}"`), action);
  }
  assert.doesNotMatch(home, /adsbygoogle|AdSlot|interstitial|plaid|MAX_ENVELOPES/i);
  assert.match(home, /guides\/paypad/);
  assert.match(home, /try-dabble\.com\/\$\{lang\}\/privacy/);
});

test("every input, textarea and button gets 16px font and touch-action manipulation from the base sheet", () => {
  const css = readFileSync(path.join(APP, "src", "index.css"), "utf8");
  assert.match(css, /input, textarea, select, button \{[^}]*font-size: 16px;[^}]*touch-action: manipulation;/s);
});

test("wrangler.jsonc carries the mandatory fields", () => {
  const raw = readFileSync(path.join(APP, "wrangler.jsonc"), "utf8").replace(/^\s*\/\/.*$/gm, "");
  const cfg = JSON.parse(raw);
  assert.equal(cfg.name, "paypad");
  assert.equal(cfg.main, "src/og-lang.ts");
  assert.equal(cfg.compatibility_date, "2026-08-27");
  assert.deepEqual(cfg.assets, { directory: "./dist", not_found_handling: "single-page-application", binding: "ASSETS", run_worker_first: true });
  assert.deepEqual(cfg.routes, [{ pattern: "paypad.try-dabble.com", custom_domain: true }]);
  assert.equal(cfg.observability.enabled, true);
});
