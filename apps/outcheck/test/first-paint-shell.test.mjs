import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function inlineClassicScripts(src) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(src))) {
    const attrs = m[1];
    if (/\bsrc=/.test(attrs)) continue;
    if (/type\s*=\s*"module"/.test(attrs)) continue;
    out.push(m[2]);
  }
  return out;
}

test("source index.html has a visible #checked-at in the first HTML", () => {
  assert.match(html, /<p id="checked-at"[^>]*>/);
  assert.doesNotMatch(html, /id="checked-at"[^>]*sr-only/);
  for (const id of ["door", "gas", "garage"]) {
    assert.match(html, new RegExp(`id="checked-at-${id}"`));
  }
});

test("an inline classic script (not type=module) paints from outcheck:day / outcheck:checks", () => {
  const scripts = inlineClassicScripts(html);
  const painter = scripts.find((s) => s.includes("outcheck:checks"));
  assert.ok(painter, "no inline classic script mentions outcheck:checks");
  assert.match(painter, /outcheck:day/);
  assert.match(painter, /getElementById\("checked-at"\)/);
  // It must be ahead of the module bundle so it runs before React.
  assert.ok(
    html.indexOf("outcheck:checks") < html.indexOf('<script type="module"'),
    "inline painter must precede the module script",
  );
});

test("the inline painter formats today's checks in the requested language", () => {
  const painter = inlineClassicScripts(html).find((s) => s.includes("outcheck:checks"));
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const doorAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 42).toISOString();
  const gasAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 5).toISOString();

  const store = { "outcheck:day": today, "outcheck:checks": JSON.stringify({ door: doorAt, gas: gasAt }) };
  const nodes = {};
  const el = (id) => {
    const li = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
    return (nodes[id] = { textContent: "", parentNode: li });
  };
  el("checked-at");
  el("checked-at-door");
  el("checked-at-gas");
  el("checked-at-garage");

  const fakeWindow = { localStorage: { getItem: (k) => store[k] ?? null } };
  const fakeDocument = {
    cookie: "",
    documentElement: { lang: "ko" },
    getElementById: (id) => nodes[id] ?? null,
  };
  const fakeLocation = { search: "?lang=en" };
  new Function("window", "document", "location", painter)(fakeWindow, fakeDocument, fakeLocation);

  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  assert.equal(nodes["checked-at-door"].textContent, `Checked ${fmt.format(new Date(doorAt))}`);
  assert.equal(nodes["checked-at-gas"].textContent, `Checked ${fmt.format(new Date(gasAt))}`);
  assert.equal(nodes["checked-at-garage"].textContent, "");
  assert.equal(nodes["checked-at"].textContent, `Checked ${fmt.format(new Date(gasAt))}`);
  assert.equal(nodes["checked-at-door"].parentNode.attrs["data-checked-at"], doorAt);
});

test("the inline painter is a no-op for a stale day, bad JSON, or missing storage", () => {
  const painter = inlineClassicScripts(html).find((s) => s.includes("outcheck:checks"));
  const run = (store) => {
    const node = { textContent: "" };
    const win = store ? { localStorage: { getItem: (k) => store[k] ?? null } } : {};
    const doc = { cookie: "", documentElement: { lang: "en" }, getElementById: () => node };
    new Function("window", "document", "location", painter)(win, doc, { search: "" });
    return node.textContent;
  };
  assert.equal(run({ "outcheck:day": "2000-01-01", "outcheck:checks": '{"door":"2000-01-01T07:00:00Z"}' }), "");
  assert.equal(run({ "outcheck:day": "2000-01-01", "outcheck:checks": "{not json" }), "");
  assert.equal(run(null), "");
});
