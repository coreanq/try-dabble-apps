import assert from "node:assert/strict";
import test from "node:test";

import {
  exportPayload,
  formatQty,
  linesToIngredients,
  linesToSteps,
  mergeRecipes,
  normalizeRecipe,
  normalizeTags,
  parseImport,
  parseIngredient,
  parseLeadingQty,
  scaleFactor,
  scaleIngredientText,
  searchRecipes,
  stripPhotos,
  totalMinutes,
} from "../src/lib/recipes.ts";
import {
  checkExtractUrl,
  extractFromMicrodata,
  extractRecipe,
  flattenInstructions,
  parseIsoDuration,
  parseYield,
} from "../src/lib/extract-parse.ts";
import { addShoppingItems, removeChecked, toggleShoppingItem } from "../src/lib/shopping.ts";
import { parsePrefs } from "../src/lib/prefs.ts";

/* ------------------------------------------------------------ servings */

test("parseLeadingQty reads integers, decimals, fractions, mixed numbers and ranges", () => {
  assert.equal(parseLeadingQty("2 eggs").qty, 2);
  assert.equal(parseLeadingQty("1.5 cups flour").qty, 1.5);
  assert.equal(parseLeadingQty("1,5 dl milk").qty, 1.5);
  assert.equal(parseLeadingQty("1/2 tsp salt").qty, 0.5);
  assert.equal(parseLeadingQty("1 1/2 cups sugar").qty, 1.5);
  assert.equal(parseLeadingQty("½ onion").qty, 0.5);
  assert.equal(parseLeadingQty("1½ cups rice").qty, 1.5);
  assert.equal(parseLeadingQty("200g butter").qty, 200);
  assert.equal(parseLeadingQty("200g butter").unit, "g");
  assert.equal(parseLeadingQty("2 cups flour").unit, "cups");
  assert.equal(parseLeadingQty("2컵 밥").unit, "컵");
  assert.equal(parseLeadingQty("大さじ1 醤油"), null, "unit-first Japanese lines are free text");
  const range = parseLeadingQty("2-3 apples");
  assert.equal(range.qty, 2);
  assert.equal(range.qtyTo, 3);
  assert.equal(parseLeadingQty("salt to taste"), null);
  assert.equal(parseLeadingQty(""), null);
});

test("formatQty prefers whole numbers and kitchen fractions", () => {
  assert.equal(formatQty(2), "2");
  assert.equal(formatQty(1.5), "1½");
  assert.equal(formatQty(0.25), "¼");
  assert.equal(formatQty(2 / 3), "⅔");
  assert.equal(formatQty(0.333), "⅓");
  assert.equal(formatQty(1.3), "1.3");
  assert.equal(formatQty(400), "400");
});

test("scaleIngredientText multiplies only the leading number and leaves free text alone", () => {
  assert.equal(scaleIngredientText("2 eggs", 2), "4 eggs");
  assert.equal(scaleIngredientText("1/2 tsp salt", 2), "1 tsp salt");
  assert.equal(scaleIngredientText("1 1/2 cups sugar", 2), "3 cups sugar");
  assert.equal(scaleIngredientText("200g butter", 1.5), "300g butter");
  assert.equal(scaleIngredientText("2-3 apples", 2), "4-6 apples");
  assert.equal(scaleIngredientText("3 cups flour", 0.5), "1½ cups flour");
  assert.equal(scaleIngredientText("salt to taste", 3), "salt to taste");
  assert.equal(scaleIngredientText("a pinch of nutmeg", 2), "a pinch of nutmeg");
  assert.equal(scaleIngredientText("2 eggs", 1), "2 eggs");
  assert.equal(scaleIngredientText("2 eggs", 0), "2 eggs");
  assert.equal(scaleIngredientText("  2 eggs", 2), "  4 eggs");
});

test("scaleFactor divides by the base servings and treats a missing base as 1", () => {
  assert.equal(scaleFactor(4, 8), 2);
  assert.equal(scaleFactor(4, 2), 0.5);
  assert.equal(scaleFactor(undefined, 3), 3);
  assert.equal(scaleFactor(4, 0), 1);
});

/* ------------------------------------------------------------ durations */

test("parseIsoDuration converts ISO 8601 durations to minutes", () => {
  assert.equal(parseIsoDuration("PT45M"), 45);
  assert.equal(parseIsoDuration("PT1H30M"), 90);
  assert.equal(parseIsoDuration("PT2H"), 120);
  assert.equal(parseIsoDuration("P0DT0H20M"), 20);
  assert.equal(parseIsoDuration("PT1.5H"), 90);
  assert.equal(parseIsoDuration("PT90S"), 2);
  assert.equal(parseIsoDuration("P1D"), 1440);
  assert.equal(parseIsoDuration("1 hour 20 minutes"), 80);
  assert.equal(parseIsoDuration("45 mins"), 45);
  assert.equal(parseIsoDuration("PT0M"), undefined);
  assert.equal(parseIsoDuration(""), undefined);
  assert.equal(parseIsoDuration(null), undefined);
  assert.equal(parseIsoDuration("banana"), undefined);
});

test("parseYield reads servings out of strings, arrays and numbers", () => {
  assert.equal(parseYield("4 servings"), 4);
  assert.equal(parseYield(["6", "6 people"]), 6);
  assert.equal(parseYield(8), 8);
  assert.equal(parseYield("Makes 12 muffins"), 12);
  assert.equal(parseYield("some"), undefined);
});

/* ------------------------------------------------------- input parsing */

test("lines become ingredients and steps, dropping bullets and numbering", () => {
  const ings = linesToIngredients("- 2 cups rice\n• 1/2 cup kimchi\n\n1 tbsp sesame oil\n");
  assert.deepEqual(ings.map((i) => i.text), ["2 cups rice", "1/2 cup kimchi", "1 tbsp sesame oil"]);
  assert.equal(ings[1].qty, 0.5);
  assert.equal(ings[2].unit, "tbsp");
  const steps = linesToSteps("1. Heat the pan\n2) Fry the kimchi\n- Add rice");
  assert.deepEqual(steps, [{ text: "Heat the pan" }, { text: "Fry the kimchi" }, { text: "Add rice" }]);
  assert.deepEqual(parseIngredient("salt"), { text: "salt" });
});

test("normalizeTags splits on commas of every script, trims # and dedupes", () => {
  assert.deepEqual(normalizeTags("한식, 15분，도시락、 #weeknight, Weeknight"), ["한식", "15분", "도시락", "weeknight"]);
  assert.deepEqual(normalizeTags(""), []);
});

test("totalMinutes prefers the stated total, else prep + cook", () => {
  assert.equal(totalMinutes({ totalMin: 40, prepMin: 10, cookMin: 20 }), 40);
  assert.equal(totalMinutes({ prepMin: 10, cookMin: 20 }), 30);
  assert.equal(totalMinutes({}), undefined);
});

/* --------------------------------------------------------------- search */

const R = (over) =>
  normalizeRecipe({
    id: over.id ?? "a",
    title: over.title ?? "Kimchi fried rice",
    tags: over.tags ?? ["korean", "weeknight"],
    notes: over.notes,
    ingredients: over.ingredients ?? ["2 cups rice", "1/2 cup kimchi"],
    steps: over.steps ?? ["Fry"],
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: over.updatedAt ?? "2026-09-01T00:00:00.000Z",
  });

test("searchRecipes matches title, tags, notes and ingredients, all terms required", () => {
  const list = [
    R({ id: "a" }),
    R({ id: "b", title: "Miso soup", tags: ["japanese"], ingredients: ["tofu", "miso"], notes: "mom's version" }),
  ];
  assert.deepEqual(searchRecipes(list, "kimchi").map((r) => r.id), ["a"]);
  assert.deepEqual(searchRecipes(list, "japanese").map((r) => r.id), ["b"]);
  assert.deepEqual(searchRecipes(list, "mom's").map((r) => r.id), ["b"]);
  assert.deepEqual(searchRecipes(list, "TOFU").map((r) => r.id), ["b"]);
  assert.deepEqual(searchRecipes(list, "rice weeknight").map((r) => r.id), ["a"]);
  assert.deepEqual(searchRecipes(list, "rice japanese"), []);
  assert.equal(searchRecipes(list, "  ").length, 2);
});

/* ------------------------------------------------------------- backup */

test("normalizeRecipe repairs shapes and drops junk", () => {
  assert.equal(normalizeRecipe(null), null);
  assert.equal(normalizeRecipe({ title: "" }), null);
  const r = normalizeRecipe({
    title: "Toast",
    prepMin: "5",
    cookMin: -3,
    servingsBase: 2.4,
    tags: ["a", 3, "a"],
    ingredients: ["1 slice bread", { text: "butter" }, 7, { text: "" }],
    steps: ["Toast it", { text: "Butter it" }, ""],
    sourceUrl: "javascript:alert(1)",
    photoDataUrl: "http://evil/x.png",
    createdAt: "nope",
  });
  assert.equal(r.prepMin, 5);
  assert.equal(r.cookMin, undefined);
  assert.equal(r.servingsBase, 2);
  assert.deepEqual(r.tags, ["a"]);
  assert.deepEqual(r.ingredients.map((i) => i.text), ["1 slice bread", "butter"]);
  assert.deepEqual(r.steps.map((s) => s.text), ["Toast it", "Butter it"]);
  assert.equal(r.sourceUrl, undefined);
  assert.equal(r.photoDataUrl, undefined);
  assert.ok(typeof r.id === "string" && r.id.length > 0);
  assert.ok(!Number.isNaN(new Date(r.createdAt).getTime()));
});

test("JSON backup round-trips recipes (photos included) and the shopping list", () => {
  const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";
  const recipes = [R({ id: "a" }), { ...R({ id: "b", title: "Pancakes" }), photoDataUrl: photo, servingsBase: 4 }];
  const shopping = { items: [{ text: "milk", checked: false, fromRecipeId: "b" }, { text: "eggs", checked: true }] };
  const payload = exportPayload(recipes, shopping, new Date("2026-09-09T10:00:00.000Z"));
  assert.equal(payload.app, "recipelog");
  assert.equal(payload.version, 1);
  assert.equal(payload.exportedAt, "2026-09-09T10:00:00.000Z");
  const text = JSON.stringify(payload);
  const back = parseImport(text);
  assert.equal(back.recipes.length, 2);
  const pancakes = back.recipes.find((r) => r.id === "b");
  assert.equal(pancakes.photoDataUrl, photo);
  assert.equal(pancakes.servingsBase, 4);
  assert.deepEqual(back.recipes.find((r) => r.id === "a").ingredients.map((i) => i.text), ["2 cups rice", "1/2 cup kimchi"]);
  assert.deepEqual(back.shopping, shopping);
});

test("parseImport accepts a bare array and rejects other shapes", () => {
  assert.equal(parseImport(JSON.stringify([R({ id: "z" })])).recipes.length, 1);
  assert.throws(() => parseImport('{"hello":1}'));
  assert.throws(() => parseImport("[1,2,3]"));
  assert.throws(() => parseImport("not json"));
});

test("mergeRecipes upserts by id and sorts newest first", () => {
  const existing = [R({ id: "a", updatedAt: "2026-09-01T00:00:00.000Z" })];
  const incoming = [
    R({ id: "a", title: "Kimchi fried rice v2", updatedAt: "2026-09-05T00:00:00.000Z" }),
    R({ id: "c", title: "Curry", updatedAt: "2026-09-03T00:00:00.000Z" }),
  ];
  const merged = mergeRecipes(existing, incoming);
  assert.deepEqual(merged.map((r) => r.id), ["a", "c"]);
  assert.equal(merged[0].title, "Kimchi fried rice v2");
});

test("stripPhotos removes only photoDataUrl", () => {
  const out = stripPhotos([{ ...R({ id: "a" }), photoDataUrl: "data:image/png;base64,AAAA" }, R({ id: "b" })]);
  assert.equal(out[0].photoDataUrl, undefined);
  assert.equal(out[0].title, "Kimchi fried rice");
  assert.equal(out[1].id, "b");
});

/* ---------------------------------------------------------- extraction */

const JSONLD_PAGE = `<!doctype html><html><head><title>x</title>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"Blog"},
{"@type":["Recipe"],"name":"Kimchi Fried Rice &amp; Egg","image":{"@type":"ImageObject","url":"https://img.example.com/k.jpg"},
"prepTime":"PT10M","cookTime":"PT15M","totalTime":"PT25M","recipeYield":["2","2 servings"],
"recipeIngredient":["2 cups cooked rice","&frac12; cup kimchi, chopped","1 tbsp sesame oil"],
"recipeInstructions":[{"@type":"HowToStep","text":"Heat the oil in a pan."},
{"@type":"HowToSection","name":"Finish","itemListElement":[{"@type":"HowToStep","text":"Add rice and <b>toss</b>."},{"@type":"HowToStep","text":"Top with egg."}]}]}]}
</script></head><body></body></html>`;

test("extractRecipe reads a schema.org Recipe out of JSON-LD (@graph, sections, entities)", () => {
  const r = extractRecipe(JSONLD_PAGE, "https://blog.example.com/kfr");
  assert.equal(r.title, "Kimchi Fried Rice & Egg");
  assert.equal(r.photoUrl, "https://img.example.com/k.jpg");
  assert.equal(r.prepMin, 10);
  assert.equal(r.cookMin, 15);
  assert.equal(r.totalMin, 25);
  assert.equal(r.servingsBase, 2);
  assert.deepEqual(r.ingredients, ["2 cups cooked rice", "½ cup kimchi, chopped", "1 tbsp sesame oil"]);
  assert.deepEqual(r.steps, ["Heat the oil in a pan.", "Add rice and toss.", "Top with egg."]);
  assert.equal(r.sourceUrl, "https://blog.example.com/kfr");
});

test("extractRecipe handles a plain string instruction block and array images", () => {
  const html = `<script type="application/ld+json">{"@type":"Recipe","name":"Toast","image":["https://a/x.jpg"],
  "recipeIngredient":["1 slice bread"],"recipeInstructions":"1. Toast.\\n2. Butter."}</script>`;
  const r = extractRecipe(html, "https://a/");
  assert.equal(r.photoUrl, "https://a/x.jpg");
  assert.deepEqual(r.steps, ["Toast.", "Butter."]);
  assert.deepEqual(flattenInstructions("Just cook it."), ["Just cook it."]);
});

test("extractRecipe falls back to microdata and returns null when there is no recipe", () => {
  const micro = `<div itemscope itemtype="https://schema.org/Recipe"><h1 itemprop="name">Miso Soup</h1>
  <meta itemprop="totalTime" content="PT15M"><meta itemprop="recipeYield" content="4 servings">
  <li itemprop="recipeIngredient">2 cups dashi</li><li itemprop="recipeIngredient">2 tbsp miso</li>
  <p itemprop="recipeInstructions">Warm the dashi. Whisk in the miso.</p></div>`;
  const r = extractFromMicrodata(micro, "https://m/");
  assert.equal(r.title, "Miso Soup");
  assert.equal(r.totalMin, 15);
  assert.equal(r.servingsBase, 4);
  assert.deepEqual(r.ingredients, ["2 cups dashi", "2 tbsp miso"]);
  assert.deepEqual(r.steps, ["Warm the dashi. Whisk in the miso."]);
  assert.equal(extractRecipe("<html><body><p>Hello</p></body></html>", "https://n/"), null);
  assert.equal(extractRecipe('<script type="application/ld+json">{"@type":"Article"}</script>', "https://n/"), null);
  assert.equal(extractRecipe('<script type="application/ld+json">{not json</script>', "https://n/"), null);
});

test("checkExtractUrl accepts public http(s) and refuses everything private or odd", () => {
  assert.equal(checkExtractUrl("https://www.example.com/recipe").ok, true);
  assert.equal(checkExtractUrl("http://example.com").ok, true);
  for (const bad of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "ftp://example.com/x",
    "http://localhost/",
    "http://foo.localhost/",
    "http://127.0.0.1/",
    "http://10.0.0.5/",
    "http://172.20.1.1/",
    "http://192.168.1.1/",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "http://[fd00::1]/",
    "http://intranet/",
    "http://user:pw@example.com/",
    "not a url",
    "",
    null,
    42,
  ]) {
    assert.equal(checkExtractUrl(bad).ok, false, String(bad));
  }
});

/* ------------------------------------------------------------ shopping */

test("shopping list adds without doubling, toggles and removes ticked", () => {
  let list = { items: [] };
  let res = addShoppingItems(list, ["2 eggs", "milk", "", "milk"], "a");
  assert.equal(res.added, 2);
  list = res.list;
  assert.deepEqual(list.items, [{ text: "2 eggs", checked: false, fromRecipeId: "a" }, { text: "milk", checked: false, fromRecipeId: "a" }]);
  res = addShoppingItems(list, ["Milk", "flour"]);
  assert.equal(res.added, 1);
  list = toggleShoppingItem(res.list, 1);
  assert.equal(list.items[1].checked, true);
  list = removeChecked(list);
  assert.deepEqual(list.items.map((i) => i.text), ["2 eggs", "flour"]);
});

test("parsePrefs keeps valid fields and repairs the rest", () => {
  assert.deepEqual(parsePrefs(null), { fontSize: "md", view: "grid", cookTimerSec: 300 });
  assert.deepEqual(parsePrefs({ fontSize: "xl", view: "list", cookTimerSec: 600 }), { fontSize: "xl", view: "list", cookTimerSec: 600 });
  assert.equal(parsePrefs({ fontSize: "huge", cookTimerSec: 1 }).fontSize, "md");
  assert.equal(parsePrefs({ cookTimerSec: 1 }).cookTimerSec, 300);
});
