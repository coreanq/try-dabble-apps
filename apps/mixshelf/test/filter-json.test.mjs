import assert from "node:assert/strict";
import test from "node:test";

// Lightweight pure copies of filter/import logic for node --test without DOM.
function uniqueTags(tags) {
  const seen = new Set();
  const out = [];
  for (const t of tags) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function filterItems(items, opts) {
  const q = opts.query.trim().toLowerCase();
  const typeSet = new Set(opts.types);
  const tagSet = new Set(opts.tags.map((t) => t.toLowerCase()));
  return items.filter((it) => {
    if (typeSet.size > 0 && !typeSet.has(it.type)) return false;
    if (tagSet.size > 0) {
      const itemTags = new Set(it.tags.map((t) => t.toLowerCase()));
      for (const t of tagSet) if (!itemTags.has(t)) return false;
    }
    if (q && !it.title.toLowerCase().includes(q)) return false;
    return true;
  });
}

const sample = [
  { title: "The Shining", type: "book", tags: ["Author: Stephen King", "Books I've Read"] },
  { title: "Hades", type: "game", tags: ["Roguelike"] },
  { title: "Spirited Away", type: "movie", tags: ["Ghibli"] },
  { title: "The Bear", type: "tv", tags: ["Kitchen"] },
];

test("filter by type", () => {
  const out = filterItems(sample, { types: ["book"], tags: [], query: "" });
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "The Shining");
});

test("filter by tag AND", () => {
  const out = filterItems(sample, {
    types: [],
    tags: ["Author: Stephen King"],
    query: "",
  });
  assert.equal(out.length, 1);
});

test("search by title", () => {
  const out = filterItems(sample, { types: [], tags: [], query: "shin" });
  assert.equal(out.length, 1);
});

test("unique tags", () => {
  assert.deepEqual(uniqueTags(["A", "a", "B"]), ["A", "B"]);
});

test("json round-trip shape", () => {
  const payload = {
    app: "mixshelf",
    version: 1,
    items: sample,
  };
  const again = JSON.parse(JSON.stringify(payload));
  assert.equal(again.app, "mixshelf");
  assert.equal(again.items.length, 4);
});
