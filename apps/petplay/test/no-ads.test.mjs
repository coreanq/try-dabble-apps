import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, "..");
// "doubleclick" alone would trip on React's onDoubleClick handler name.
const AD_PATTERN = /adsbygoogle|googlesyndication|doubleclick\.net|ca-pub-\d|AdSlot|pagead2/i;
// Any generative-image / LLM endpoint or SDK. The product promise is that no
// such call exists, so the source and the bundle must not even name one.
const GENAI_PATTERN = /api\.openai\.com|openai|stability\.ai|stabilityai|replicate\.com|midjourney|dall-?e|huggingface|@google\/generative-ai|generativelanguage\.googleapis|anthropic\.com|gemini-|imagen|leonardo\.ai|runwayml|clipdrop|removebg|remove\.bg/i;

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
    // ads.txt / app-ads.txt legitimately name the publisher id; everything else must not.
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

test("no generative-AI / image-generation endpoint or SDK anywhere in the source, index.html or public/", () => {
  const files = [path.join(APP, "index.html"), ...walk(path.join(APP, "src")), ...walk(path.join(APP, "public"))];
  for (const f of files) {
    // robots.txt allows AI *crawlers* by user-agent name; that is not a model call.
    if (/(^|\/)robots\.txt$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(f, "utf8"), GENAI_PATTERN, path.relative(APP, f));
  }
});

test("the production bundle (when built) names no generative-AI endpoint either", { skip: !existsSync(path.join(APP, "dist")) }, () => {
  for (const f of walk(path.join(APP, "dist"))) {
    if (/(^|\/)robots\.txt$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(f, "utf8"), GENAI_PATTERN, path.relative(APP, f));
  }
});

test("the photo path has no upload helper: no fetch / XHR / FormData / WebSocket in src/lib or the photo dialog", () => {
  // i18n.ts is excluded only because it holds the og-image URLs as plain strings.
  const files = [
    ...["photo.ts", "pet.ts", "needs.ts", "backup.ts", "prefs.ts"].map((f) => path.join(APP, "src", "lib", f)),
    path.join(APP, "src", "components", "photo-dialog.tsx"),
    path.join(APP, "src", "components", "pet-sprite.tsx"),
    path.join(APP, "src", "components", "customize-dialog.tsx"),
  ];
  for (const f of files) {
    const text = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|new FormData|WebSocket|navigator\.sendBeacon|https?:\/\//, path.relative(APP, f));
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

test("no login, paywall, IAP, token shop or subscription pitch anywhere in the app copy", () => {
  const text = readFileSync(path.join(APP, "src", "lib", "i18n.ts"), "utf8");
  // Each language names the fail-cases only to promise their absence.
  assert.doesNotMatch(text, /sign in|log in|premium|unlock (pro|premium)|start (your )?free trial|upgrade to|buy tokens|ai portrait/i);
});
