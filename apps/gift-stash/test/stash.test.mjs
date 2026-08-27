import assert from "node:assert/strict";
import test from "node:test";

import {
  UNASSIGNED_FILTER,
  clampRemindDays,
  daysUntil,
  filterIdeas,
  filterPeople,
  nextOccurrence,
  parseDatePart,
  parseImport,
  upcomingList,
} from "../src/lib/stash.ts";

const NOW = new Date(2026, 7, 27); // 2026-08-27, local time like the app uses

function person(over = {}) {
  return {
    id: over.id ?? "p1",
    name: over.name ?? "Mina",
    birthday: over.birthday ?? "",
    notes: over.notes ?? "",
    photoId: over.photoId ?? null,
    occasions: over.occasions ?? [],
    createdAt: over.createdAt ?? NOW.getTime(),
  };
}

function idea(over = {}) {
  return {
    id: over.id ?? "i1",
    personId: over.personId ?? "",
    title: over.title ?? "",
    url: over.url ?? "",
    price: over.price ?? "",
    note: over.note ?? "",
    status: over.status ?? "idea",
    photoId: over.photoId ?? null,
    createdAt: over.createdAt ?? NOW.getTime(),
  };
}

test("parseDatePart reads full dates, MM-DD and M/D", () => {
  assert.deepEqual(parseDatePart("1994-03-21"), { year: 1994, month: 3, day: 21 });
  assert.deepEqual(parseDatePart("03-21"), { year: null, month: 3, day: 21 });
  assert.deepEqual(parseDatePart("3/21"), { year: null, month: 3, day: 21 });
  assert.equal(parseDatePart("nope"), null);
  assert.equal(parseDatePart("13-40"), null);
  assert.equal(parseDatePart(""), null);
});

test("nextOccurrence rolls a passed date into next year", () => {
  const passed = nextOccurrence({ year: null, month: 3, day: 21 }, NOW);
  assert.equal(passed.getFullYear(), 2027);
  const ahead = nextOccurrence({ year: null, month: 9, day: 2 }, NOW);
  assert.equal(ahead.getFullYear(), 2026);
  assert.equal(daysUntil(ahead, NOW), 6);
  // Today still counts as today, never as a year away.
  assert.equal(daysUntil(nextOccurrence({ year: null, month: 8, day: 27 }, NOW), NOW), 0);
});

test("upcomingList covers birthdays and occasions inside the window, nearest first", () => {
  const people = [
    person({ id: "a", name: "Ada", birthday: "1994-09-02" }),
    person({ id: "b", name: "Bo", birthday: "03-21" }), // outside the 60 day window
    person({
      id: "c",
      name: "Cy",
      occasions: [{ id: "o1", label: "", date: "08-30" }],
    }),
  ];
  const out = upcomingList(people, NOW, 60, "Birthday", "Anniversary");
  assert.deepEqual(
    out.map((e) => [e.person.name, e.label, e.days, e.age]),
    [
      ["Cy", "Anniversary", 3, null],
      ["Ada", "Birthday", 6, 32],
    ],
  );
});

test("filterIdeas applies person, status and free text; newest first", () => {
  const people = [person({ id: "p1", name: "Mina" })];
  const ideas = [
    idea({ id: "old", title: "Mug", personId: "p1", createdAt: 1 }),
    idea({ id: "new", title: "Scarf", status: "bought", createdAt: 2 }),
  ];
  assert.deepEqual(
    filterIdeas(ideas, people, { person: "", status: "", query: "" }).map((i) => i.id),
    ["new", "old"],
  );
  assert.deepEqual(
    filterIdeas(ideas, people, { person: "p1", status: "", query: "" }).map((i) => i.id),
    ["old"],
  );
  assert.deepEqual(
    filterIdeas(ideas, people, { person: UNASSIGNED_FILTER, status: "", query: "" }).map((i) => i.id),
    ["new"],
  );
  assert.deepEqual(
    filterIdeas(ideas, people, { person: "", status: "bought", query: "" }).map((i) => i.id),
    ["new"],
  );
  // The person's name is searchable from the idea, not just the idea's own text.
  assert.deepEqual(
    filterIdeas(ideas, people, { person: "", status: "", query: "mina" }).map((i) => i.id),
    ["old"],
  );
});

test("filterPeople searches names and notes", () => {
  const people = [
    person({ id: "a", name: "Ada", notes: "shoe 255" }),
    person({ id: "b", name: "Bo" }),
  ];
  assert.deepEqual(filterPeople(people, "255").map((p) => p.id), ["a"]);
  assert.deepEqual(filterPeople(people, "").map((p) => p.id), ["a", "b"]);
});

test("clampRemindDays keeps the reminder window inside 1–60", () => {
  assert.equal(clampRemindDays(0), 1);
  assert.equal(clampRemindDays(900), 60);
  assert.equal(clampRemindDays("14"), 14);
  assert.equal(clampRemindDays("nonsense"), 7);
});

test("parseImport coerces a hand-edited file back into shape", () => {
  const parsed = parseImport({
    people: [{ name: "Ada", occasions: [{ label: "Wedding", date: "05-05" }, { label: "x" }] }],
    ideas: [{ title: "Mug", status: "wat" }],
    settings: { remindDays: 999, notifyEnabled: true },
    photos: { p1: "data:image/png;base64,AAA", bad: 12 },
  });
  assert.equal(parsed.people[0].name, "Ada");
  assert.equal(parsed.people[0].occasions.length, 1); // the dateless one is dropped
  assert.ok(parsed.people[0].id);
  assert.equal(parsed.ideas[0].status, "idea"); // unknown status falls back
  assert.deepEqual(parsed.settings, { remindDays: 60, notifyEnabled: true });
  assert.deepEqual(parsed.photos, { p1: "data:image/png;base64,AAA" });
  assert.equal(parseImport({ people: [] }), null);
  assert.equal(parseImport(null), null);
});
