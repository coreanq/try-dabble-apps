import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { COPY } from "../src/og-lang.ts";

const BASE = process.env.ONDAYPAD_URL || "http://127.0.0.1:8788";

let reachable = false;
try {
  const probe = await fetch(`${BASE}/ads.txt`, { signal: AbortSignal.timeout(2500) });
  reachable = probe.ok;
} catch {
  reachable = false;
}
const skip = reachable ? false : `no server at ${BASE} (set ONDAYPAD_URL)`;

const LANGS = ["en", "ja", "zh", "ko"];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const lang of LANGS) {
  test(`?lang=${lang} rewrites title, banner, tagline and og`, { skip }, async () => {
    const res = await fetch(`${BASE}/?lang=${lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const c = COPY[lang];
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(html, new RegExp(`id="brand-title">${esc(c.title)}</h1>`));
    assert.match(html, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(html, new RegExp(`class="od-tagline">${esc(c.tagline)}</p>`));
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${c.locale}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.image)}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://ondaypad\\.try-dabble\\.com/\\?lang=${lang}"`));
    assert.doesNotMatch(html, /ca-pub-|adsbygoogle/i);
  });
}

test("the feedback widget is appended with data-app=ondaypad, and nothing else is injected", { skip }, async () => {
  const html = await (await fetch(`${BASE}/?lang=en`)).text();
  assert.match(html, /<script src="https:\/\/try-dabble\.com\/widget\/feedback\.js" data-app="ondaypad" defer><\/script>/);
  assert.doesNotMatch(html, /ca-pub-/);
});

test("ads.txt is plain text with the shared publisher line", { skip }, async () => {
  const res = await fetch(`${BASE}/ads.txt`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /text\/plain/);
  assert.equal((await res.text()).trim(), "google.com, pub-1343411537040925, DIRECT, f08c47fec0942fa0");
});

test("static assets name ondaypad", () => {
  const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  assert.match(sw, /"ondaypad-v1"/);
  for (const lang of LANGS) {
    assert.match(sitemap, new RegExp(`https://ondaypad\\.try-dabble\\.com/\\?lang=${lang}`));
  }
});
