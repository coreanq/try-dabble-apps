// Cheap guard: every language the widget claims to support must carry every
// visible label, so no locale silently falls back to a blank button.
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const assert = require("node:assert");

const src = readFileSync(join(__dirname, "..", "src", "feedback.js"), "utf8");

const LANGS = ["ko", "en", "ja", "zh"];
const KEYS = [
  "btn", "idea", "bug", "title", "body", "send", "sent", "err", "close",
  "photo", "drop", "fileEmpty", "fileOne", "fileTwo"
];

// The source is a browser IIFE, so lift the COPY literal out by evaluating
// only that expression rather than loading the whole widget under node.
const start = src.indexOf("var COPY = ");
assert.ok(start !== -1, "COPY table not found in src/feedback.js");
const open = src.indexOf("{", start);
let depth = 0;
let end = -1;
for (let i = open; i < src.length; i += 1) {
  if (src[i] === "{") depth += 1;
  else if (src[i] === "}") {
    depth -= 1;
    if (depth === 0) { end = i + 1; break; }
  }
}
assert.ok(end !== -1, "COPY table is unbalanced in src/feedback.js");
const COPY = new Function("return " + src.slice(open, end))();

for (const lang of LANGS) {
  assert.ok(COPY[lang], `COPY is missing language ${lang}`);
  for (const key of KEYS) {
    assert.ok(
      typeof COPY[lang][key] === "string" && COPY[lang][key].length > 0,
      `COPY.${lang}.${key} is missing or empty`
    );
  }
}

assert.deepStrictEqual(Object.keys(COPY).sort(), [...LANGS].sort(), "unexpected language set");

console.log(`ok - ${LANGS.length} languages x ${KEYS.length} keys`);
