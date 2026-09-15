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
  assert.doesNotMatch(text, /sign in|log in|unlock (pro|premium|plus)|start (your )?free trial|upgrade to|in-app purchase|create (a )?workspace|invite your team|go premium/i);
});

test("no leftover essay / hour / pay / sub / rec / dict product copy, and no word-count or deadline pace", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public")), path.join(APP, "contain-og.js"), path.join(APP, "package.json"), path.join(APP, "wrangler.jsonc")];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(
      text,
      /essaypad|에세이패드|hourpad|아워패드|paypad|페이패드|subpad|섭패드|recpad|dictpad|timerpad|affirmpad|listenpad|progresspad|프로그레스패드|word count|words to go|targetWords|deadline|weekdaysOnly|check[- ]in|check[- ]out|overtime|timesheet|paycheck|dying tree|forced timer|\bep-|\bhp-|\bpp-|\bsb-|\btp-|\bdp-/i,
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
      assert.match(text, /const SLUG = 'ondaypad'/);
      continue;
    }
    assert.doesNotMatch(text, /widget\/feedback\.js|FeedbackPanel|feedback-dialog/i, path.relative(APP, f));
  }
});
