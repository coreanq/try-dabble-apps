import assert from "node:assert/strict";
import test from "node:test";

import { backupFilename, buildBackup, parseBackup, toJSON } from "../src/lib/backup.ts";
import {
  ACTION_DELTAS,
  AWAY_FLOOR,
  DECAY_PER_HOUR,
  HOUR_MS,
  MAX_AWAY_MS,
  applyAction,
  catchUp,
  decay,
  freshNeeds,
  moodOf,
  normalizeNeeds,
  skipHours,
  tick,
} from "../src/lib/needs.ts";
import {
  PALETTE,
  SPECIES_DEFAULTS,
  cleanName,
  isLocalImageDataUrl,
  newPet,
  normalizePet,
  randomLook,
  withColor,
  withPart,
  withPhotoSprite,
  withSpecies,
} from "../src/lib/pet.ts";
import { ZOOM_MAX, cropRect } from "../src/lib/photo.ts";
import { defaultPrefs, parsePrefs } from "../src/lib/prefs.ts";

const T0 = Date.parse("2026-09-13T10:00:00.000Z");
// A 1×1 transparent PNG: the smallest legitimate local sprite.
const PNG_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// ---- needs decay ---------------------------------------------------------------

test("one hour of drift takes each meter down by its hourly rate", () => {
  const n = { ...freshNeeds(T0), hunger: 80, happiness: 80, energy: 90, cleanliness: 85 };
  const d = decay(n, HOUR_MS);
  assert.equal(d.hunger, 80 - DECAY_PER_HOUR.hunger);
  assert.equal(d.happiness, 80 - DECAY_PER_HOUR.happiness);
  assert.equal(d.energy, 90 - DECAY_PER_HOUR.energy);
  assert.equal(d.cleanliness, 85 - DECAY_PER_HOUR.cleanliness);
});

test("in-tab drift bottoms out at 0 and never goes negative; a floor holds it up", () => {
  const n = { ...freshNeeds(T0), hunger: 20 };
  assert.equal(decay(n, 5 * HOUR_MS).hunger, 0);
  assert.equal(decay(n, 5 * HOUR_MS, AWAY_FLOOR).hunger, AWAY_FLOOR);
  // Already below the floor: left alone, never raised.
  const low = { ...freshNeeds(T0), hunger: 4 };
  assert.equal(decay(low, HOUR_MS, AWAY_FLOOR).hunger, 4);
});

test("tick applies the time since lastTickAt and moves the clock; paused only moves the clock", () => {
  const n = { ...freshNeeds(T0), hunger: 80 };
  const later = T0 + 30 * 60_000;
  const t = tick(n, later);
  assert.equal(t.lastTickAt, later);
  assert.equal(t.hunger, 80 - DECAY_PER_HOUR.hunger / 2);
  const p = tick(n, later, true);
  assert.equal(p.hunger, 80);
  assert.equal(p.lastTickAt, later);
});

test("catchUp caps time away at MAX_AWAY_MS and floors at AWAY_FLOOR so the pet survives a week", () => {
  const n = { ...freshNeeds(T0), hunger: 100, happiness: 100, energy: 100, cleanliness: 100 };
  const week = T0 + 7 * 24 * HOUR_MS;
  const { needs, awayMs } = catchUp(n, week);
  assert.equal(awayMs, 7 * 24 * HOUR_MS);
  assert.equal(needs.lastTickAt, week);
  const capHours = MAX_AWAY_MS / HOUR_MS;
  assert.equal(needs.hunger, Math.max(AWAY_FLOOR, 100 - DECAY_PER_HOUR.hunger * capHours));
  assert.equal(needs.cleanliness, 100 - DECAY_PER_HOUR.cleanliness * capHours);
  for (const k of ["hunger", "happiness", "energy", "cleanliness"]) assert.ok(needs[k] >= AWAY_FLOOR, k);
});

test("skipHours is the same maths as waiting", () => {
  const n = { ...freshNeeds(T0), hunger: 50 };
  assert.equal(skipHours(n, 1).hunger, 50 - DECAY_PER_HOUR.hunger);
  assert.equal(skipHours(n, 1).hunger, decay(n, HOUR_MS).hunger);
});

// ---- feed / play deltas ----------------------------------------------------------

test("Feed raises fullness, Play raises happiness and costs a little energy, both clamp at 100", () => {
  const n = { ...freshNeeds(T0), hunger: 50, happiness: 50, energy: 50, cleanliness: 50 };
  const fed = applyAction(n, "feed", T0);
  assert.equal(fed.hunger, 50 + ACTION_DELTAS.feed.hunger);
  assert.equal(fed.lastFedAt, T0);
  const played = applyAction(n, "play", T0);
  assert.equal(played.happiness, 50 + ACTION_DELTAS.play.happiness);
  assert.equal(played.energy, 50 + ACTION_DELTAS.play.energy);
  assert.equal(played.lastPlayedAt, T0);
  const full = applyAction({ ...n, hunger: 95 }, "feed", T0);
  assert.equal(full.hunger, 100);
  const petted = applyAction(n, "pet", T0);
  assert.equal(petted.energy, 50 + ACTION_DELTAS.pet.energy);
  const cleaned = applyAction(n, "clean", T0);
  assert.equal(cleaned.cleanliness, 50 + ACTION_DELTAS.clean.cleanliness);
});

test("the loop closes in-tab: drift, then feed and play bring the meters back up", () => {
  let n = freshNeeds(T0);
  n = tick(n, T0 + 2 * HOUR_MS);
  assert.ok(n.hunger < 80 && n.happiness < 80);
  const before = n;
  n = applyAction(n, "feed", T0 + 2 * HOUR_MS);
  n = applyAction(n, "play", T0 + 2 * HOUR_MS);
  assert.ok(n.hunger > before.hunger);
  assert.ok(n.happiness > before.happiness);
});

test("mood follows the lowest urgent meter, else the average", () => {
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 90, happiness: 90, energy: 90, cleanliness: 90 }), "happy");
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 55, happiness: 55, energy: 55, cleanliness: 55 }), "okay");
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 35, happiness: 35, energy: 35, cleanliness: 35 }), "sad");
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 10, happiness: 90, energy: 90, cleanliness: 90 }), "hungry");
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 90, happiness: 90, energy: 12, cleanliness: 90 }), "sleepy");
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 90, happiness: 90, energy: 90, cleanliness: 5 }), "dirty");
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 90, happiness: 15, energy: 90, cleanliness: 90 }), "bored");
  // Two urgent: the lower one wins.
  assert.equal(moodOf({ ...freshNeeds(T0), hunger: 20, happiness: 90, energy: 90, cleanliness: 8 }), "dirty");
});

test("normalizeNeeds clamps, drops junk and fills a missing clock", () => {
  const n = normalizeNeeds({ hunger: 250, happiness: -4, energy: "x", cleanliness: 40, lastTickAt: -1 }, T0);
  assert.equal(n.hunger, 100);
  assert.equal(n.happiness, 0);
  assert.equal(n.energy, 90);
  assert.equal(n.cleanliness, 40);
  assert.equal(n.lastTickAt, T0);
  assert.deepEqual(normalizeNeeds(null, T0), freshNeeds(T0));
});

// ---- pet parts / palette ------------------------------------------------------------

test("a new pet takes the species defaults; switching species resets parts and colours", () => {
  const cat = newPet("Mochi", "cat", new Date(T0));
  assert.equal(cat.name, "Mochi");
  assert.deepEqual(cat.parts, SPECIES_DEFAULTS.cat.parts);
  assert.deepEqual(cat.colors, SPECIES_DEFAULTS.cat.colors);
  const dog = withSpecies(withColor(cat, "primary", "#123456"), "dog");
  assert.equal(dog.species, "dog");
  assert.deepEqual(dog.parts, SPECIES_DEFAULTS.dog.parts);
  assert.deepEqual(dog.colors, SPECIES_DEFAULTS.dog.colors);
});

test("parts and palette colours apply; a bad colour is ignored", () => {
  const p = newPet("Mochi", "cat");
  const q = withPart(withPart(p, "ears", "floppy"), "accessory", "hat");
  assert.equal(q.parts.ears, "floppy");
  assert.equal(q.parts.accessory, "hat");
  assert.equal(withColor(p, "primary", PALETTE.primary[2]).colors.primary, PALETTE.primary[2]);
  assert.equal(withColor(p, "primary", "#ABCDEF").colors.primary, "#abcdef");
  assert.equal(withColor(p, "primary", "url(javascript:x)").colors.primary, p.colors.primary);
  assert.equal(withColor(p, "accent", "red").colors.accent, p.colors.accent);
});

test("randomLook only ever picks from the fixed lists and the palette (nothing generated)", () => {
  let i = 0;
  const seq = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.4, 0.6];
  const p = randomLook(newPet("Mochi", "fox"), () => seq[i++ % seq.length]);
  assert.ok(["round", "pointy", "floppy", "long", "tuft"].includes(p.parts.ears));
  assert.ok(PALETTE.primary.includes(p.colors.primary));
  assert.ok(PALETTE.secondary.includes(p.colors.secondary));
  assert.ok(PALETTE.accent.includes(p.colors.accent));
});

test("normalizePet repairs unknown parts and drops a remote photo URL, but keeps a local data URL", () => {
  const pet = normalizePet({
    name: "  Mochi   the  cat  ",
    species: "dragon",
    parts: { ears: "wings", eyes: "star" },
    colors: { primary: "#fff", secondary: "blue" },
    photoSprite: { dataUrl: "https://example.com/pet.png" },
  });
  assert.equal(pet.name, "Mochi the cat");
  assert.equal(pet.species, "cat");
  assert.equal(pet.parts.ears, SPECIES_DEFAULTS.cat.parts.ears);
  assert.equal(pet.parts.eyes, "star");
  assert.equal(pet.colors.primary, "#fff");
  assert.equal(pet.colors.secondary, SPECIES_DEFAULTS.cat.colors.secondary);
  assert.equal(pet.photoSprite, undefined);

  const local = normalizePet({ name: "P", species: "dog", photoSprite: { dataUrl: PNG_1PX, tint: "#fb7185" } });
  assert.equal(local.photoSprite.dataUrl, PNG_1PX);
  assert.equal(local.photoSprite.tint, "#fb7185");
  assert.equal(normalizePet(null), null);
  assert.equal(normalizePet("nope"), null);
});

test("the photo sprite only ever stays a local data: URL; remote, blob and javascript URLs are refused", () => {
  assert.ok(isLocalImageDataUrl(PNG_1PX));
  assert.ok(!isLocalImageDataUrl("https://cdn.example.com/x.png"));
  assert.ok(!isLocalImageDataUrl("blob:https://petplay.try-dabble.com/abc"));
  assert.ok(!isLocalImageDataUrl("javascript:alert(1)"));
  assert.ok(!isLocalImageDataUrl("data:text/html;base64,PHNjcmlwdD4="));
  const p = newPet("Mochi", "cat");
  assert.equal(withPhotoSprite(p, { dataUrl: "https://x/y.png" }).photoSprite, undefined);
  const withPhoto = withPhotoSprite(p, { dataUrl: PNG_1PX });
  assert.equal(withPhoto.photoSprite.dataUrl, PNG_1PX);
  assert.equal(withPhotoSprite(withPhoto, null).photoSprite, undefined);
});

test("cleanName trims, collapses spaces, caps length and falls back", () => {
  assert.equal(cleanName("  a   b ", "X"), "a b");
  assert.equal(cleanName("", "X"), "X");
  assert.equal(cleanName(42, "X"), "X");
  assert.equal(cleanName("x".repeat(60), "X").length, 24);
});

// ---- photo crop maths -----------------------------------------------------------------

test("cropRect: zoom 1 is the largest centred square; offsets slide it within the image", () => {
  const c = cropRect(1200, 800, 1, 0, 0);
  assert.deepEqual(c, { sx: 200, sy: 0, sw: 800, sh: 800 });
  const left = cropRect(1200, 800, 1, -1, 0);
  assert.equal(left.sx, 0);
  const right = cropRect(1200, 800, 1, 1, 0);
  assert.equal(right.sx, 400);
  const tall = cropRect(600, 900, 1, 0, 1);
  assert.deepEqual(tall, { sx: 0, sy: 300, sw: 600, sh: 600 });
});

test("cropRect: zoom shrinks the square and clamps out-of-range values", () => {
  const z = cropRect(1000, 1000, 2, 0, 0);
  assert.deepEqual(z, { sx: 250, sy: 250, sw: 500, sh: 500 });
  const over = cropRect(1000, 1000, 99, 5, -5);
  assert.equal(over.sw, 1000 / ZOOM_MAX);
  assert.equal(over.sx, 1000 - 1000 / ZOOM_MAX);
  assert.equal(over.sy, 0);
  const junk = cropRect(0, 0, NaN, NaN, NaN);
  assert.deepEqual(junk, { sx: 0, sy: 0, sw: 1, sh: 1 });
});

// ---- backup round trip ------------------------------------------------------------------

test("JSON backup round-trips the pet (parts, colours, local photo sprite), needs and prefs", () => {
  const pet = withPhotoSprite(withPart(withColor(newPet("Mochi", "bunny", new Date(T0)), "accent", "#60a5fa"), "tail", "fluffy"), { dataUrl: PNG_1PX, tint: "#2dd4bf" });
  const needs = { ...freshNeeds(T0), hunger: 33, happiness: 44, energy: 55, cleanliness: 66, lastFedAt: T0 - 1000 };
  const prefs = { decayPaused: true };
  const text = toJSON(buildBackup(pet, needs, prefs, new Date(T0)));
  const parsed = JSON.parse(text);
  assert.equal(parsed.app, "petplay");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.exportedAt, new Date(T0).toISOString());
  const back = parseBackup(text, T0);
  assert.deepEqual(back.pet, pet);
  assert.deepEqual(back.needs, needs);
  assert.deepEqual(back.prefs, prefs);
  assert.match(backupFilename(new Date(T0)), /^petplay-backup-2026-09-13\.json$/);
});

test("parseBackup rejects another app's file, junk, and a file with no pet", () => {
  assert.throws(() => parseBackup(JSON.stringify({ app: "gymac", pet: { name: "x" } })), /not a petplay backup/);
  assert.throws(() => parseBackup("[]"), /bad shape|no pet/);
  assert.throws(() => parseBackup(JSON.stringify({ app: "petplay", needs: {} })), /no pet/);
  assert.throws(() => parseBackup("{not json"));
});

test("prefs parse with defaults", () => {
  assert.deepEqual(defaultPrefs(), { decayPaused: false });
  assert.deepEqual(parsePrefs({ decayPaused: true }), { decayPaused: true });
  assert.deepEqual(parsePrefs({ decayPaused: "yes" }), { decayPaused: false });
  assert.deepEqual(parsePrefs(null), { decayPaused: false });
});
