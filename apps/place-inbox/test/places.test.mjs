import assert from "node:assert/strict";
import test from "node:test";

import {
  INBOX_FILTER,
  clampRank,
  filterPlaces,
  parseImport,
  parseLatLng,
  sortByRank,
} from "../src/lib/places.ts";

const NOW = Date.UTC(2026, 7, 27);

function place(over = {}) {
  return {
    id: over.id ?? "id",
    name: over.name ?? "",
    url: over.url ?? "",
    why: over.why ?? "",
    rank: over.rank ?? 3,
    tags: over.tags ?? [],
    tripId: over.tripId ?? "",
    mapsUrl: over.mapsUrl ?? "",
    igUrl: over.igUrl ?? "",
    pinterestUrl: over.pinterestUrl ?? "",
    lat: over.lat ?? null,
    lng: over.lng ?? null,
    photoId: over.photoId ?? null,
    createdAt: over.createdAt ?? NOW,
    updatedAt: over.updatedAt ?? NOW,
  };
}

test("lat,lng is typed by hand and never guessed", () => {
  assert.deepEqual(parseLatLng("35.665, 139.770"), { lat: 35.665, lng: 139.77 });
  assert.deepEqual(parseLatLng("  -33.86 151.21 "), { lat: -33.86, lng: 151.21 });
  assert.deepEqual(parseLatLng(""), { lat: null, lng: null });
  assert.deepEqual(parseLatLng("Tokyo"), { lat: null, lng: null });
  // Out of range is dropped rather than clamped — a typo is not a pin.
  assert.deepEqual(parseLatLng("95, 20"), { lat: null, lng: null });
  assert.deepEqual(parseLatLng("35, 200"), { lat: null, lng: null });
});

test("rank is always 1–5", () => {
  assert.equal(clampRank(4), 4);
  assert.equal(clampRank(9), 5);
  assert.equal(clampRank(0), 1);
  assert.equal(clampRank("nope"), 3);
});

test("places sort by rank, then by most recently touched", () => {
  const list = [
    place({ id: "a", rank: 2, updatedAt: NOW + 5 }),
    place({ id: "b", rank: 5, updatedAt: NOW }),
    place({ id: "c", rank: 5, updatedAt: NOW + 9 }),
  ];
  assert.deepEqual(
    sortByRank(list).map((p) => p.id),
    ["c", "b", "a"],
  );
});

test("filters narrow by trip, tag, rank and free text", () => {
  const trips = [{ id: "t1", name: "Jeju spring", createdAt: NOW }];
  const list = [
    place({ id: "a", name: "Noodle bar", tags: ["food"], rank: 5, tripId: "t1" }),
    place({ id: "b", name: "Ridge walk", tags: ["hike"], rank: 4 }),
    place({ id: "c", name: "Cove", tags: ["beach"], rank: 5, why: "sunset swim" }),
  ];
  const base = { trip: "", tag: "", rank: "", query: "" };

  assert.deepEqual(
    filterPlaces(list, trips, { ...base, trip: "t1" }, "Inbox").map((p) => p.id),
    ["a"],
  );
  assert.deepEqual(
    filterPlaces(list, trips, { ...base, trip: INBOX_FILTER }, "Inbox").map((p) => p.id),
    ["c", "b"],
  );
  assert.deepEqual(
    filterPlaces(list, trips, { ...base, tag: "hike" }, "Inbox").map((p) => p.id),
    ["b"],
  );
  assert.deepEqual(
    filterPlaces(list, trips, { ...base, rank: "5" }, "Inbox").map((p) => p.id),
    ["a", "c"],
  );
  // The why-note and the trip name are searchable, not just the title.
  assert.deepEqual(
    filterPlaces(list, trips, { ...base, query: "sunset" }, "Inbox").map((p) => p.id),
    ["c"],
  );
  assert.deepEqual(
    filterPlaces(list, trips, { ...base, query: "jeju" }, "Inbox").map((p) => p.id),
    ["a"],
  );
});

test("import coerces a hand-edited file back into shape", () => {
  const parsed = parseImport({
    places: [
      {
        id: "a",
        name: "Cove",
        rank: 99,
        tags: ["beach", "nonsense"],
        lat: 33.2,
        lng: 126.5,
        photoId: "p1",
      },
      { name: "no id" },
    ],
    trips: [{ id: "t1", name: "Jeju" }, { id: "t2", name: "" }],
    photos: { p1: "data:image/png;base64,AAAA", bad: 12 },
  });

  assert.equal(parsed.places.length, 2);
  assert.equal(parsed.places[0].rank, 5);
  assert.deepEqual(parsed.places[0].tags, ["beach"]);
  assert.equal(parsed.places[0].url, "");
  assert.ok(parsed.places[1].id);
  // A trip with no name is not a bucket anyone can pick.
  assert.deepEqual(parsed.trips.map((t) => t.name), ["Jeju"]);
  assert.deepEqual(Object.keys(parsed.photos), ["p1"]);
});

test("a lone coordinate is not half a pin", () => {
  const parsed = parseImport({ places: [{ id: "a", lat: 33.2 }] });
  assert.equal(parsed.places[0].lat, null);
  assert.equal(parsed.places[0].lng, null);
});

test("import rejects anything without a places array", () => {
  assert.equal(parseImport(null), null);
  assert.equal(parseImport({}), null);
  assert.equal(parseImport({ places: "nope" }), null);
});
