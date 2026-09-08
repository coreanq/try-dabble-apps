import assert from "node:assert/strict";
import test from "node:test";

import { mergeBackup, parseBackup, serializeBackup } from "../src/lib/backup-json.ts";

const t = (id, extra = {}) => ({
  id,
  title: `Title ${id}`,
  artist: "Artist",
  album: "Album",
  addedAt: 1700000000000,
  opfsKey: id,
  fileName: `${id}.mp3`,
  ...extra,
});

test("round-trips tracks, playlists, favorites and recents; never audio", () => {
  const tracks = [t("a", { favorite: true, duration: 180.5, size: 1234 }), t("b")];
  const playlists = [{ id: "p1", name: "Drive", trackIds: ["a", "b", "ghost"], createdAt: 1, updatedAt: 2 }];
  const text = serializeBackup(tracks, playlists, ["b", "ghost"], new Date("2026-09-09T00:00:00Z"));
  const raw = JSON.parse(text);
  assert.equal(raw.app, "localplay");
  assert.equal(raw.version, 1);
  assert.equal(raw.exportedAt, "2026-09-09T00:00:00.000Z");
  assert.deepEqual(raw.favorites, ["a"]);
  assert.deepEqual(raw.recent, ["b"]);
  assert.deepEqual(raw.playlists[0].trackIds, ["a", "b"]);
  assert.ok(!("bytes" in raw.tracks[0]) && !("blob" in raw.tracks[0]));

  const parsed = parseBackup(text);
  assert.ok(parsed);
  assert.equal(parsed.tracks.length, 2);
  assert.equal(parsed.tracks[0].favorite, true);
  assert.equal(parsed.tracks[0].duration, 180.5);
  assert.equal(parsed.tracks[0].size, 1234);
  assert.deepEqual(parsed.favorites, ["a"]);
  assert.deepEqual(parsed.playlists[0].trackIds, ["a", "b"]);
  assert.deepEqual(parsed.recent, ["b"]);
});

test("rejects other apps, other versions, and junk", () => {
  assert.equal(parseBackup("not json"), null);
  assert.equal(parseBackup("[]"), null);
  assert.equal(parseBackup(JSON.stringify({ app: "outcheck", version: 1, tracks: [] })), null);
  assert.equal(parseBackup(JSON.stringify({ app: "localplay", version: 2, tracks: [] })), null);
  assert.equal(parseBackup(JSON.stringify({ app: "localplay", version: 1 })), null);
});

test("tolerates missing optional sections and broken rows", () => {
  const parsed = parseBackup(
    JSON.stringify({
      app: "localplay",
      version: 1,
      tracks: [t("a"), null, { id: "" }, t("a"), { id: "c", fileName: "Song C.mp3" }],
      playlists: [{ id: "p", name: "  ", trackIds: [] }, { id: "q", name: "Q", trackIds: ["a", 5, "zzz"] }],
    }),
  );
  assert.ok(parsed);
  assert.deepEqual(parsed.tracks.map((x) => x.id), ["a", "c"]);
  assert.equal(parsed.tracks[1].title, "Song C");
  assert.equal(parsed.playlists.length, 1);
  assert.deepEqual(parsed.playlists[0].trackIds, ["a"]);
  assert.deepEqual(parsed.recent, []);
});

test("favorites list marks tracks even when the row itself lacks the flag", () => {
  const parsed = parseBackup(JSON.stringify({ app: "localplay", version: 1, tracks: [t("a")], favorites: ["a"] }));
  assert.equal(parsed.tracks[0].favorite, true);
});

test("mergeBackup relinks imported tracks to local audio by file name and remaps playlists", () => {
  // Fresh device: the user re-picked the folder first, so local ids are new.
  const current = {
    tracks: [t("new1", { fileName: "a.mp3", title: "a", artist: "", album: "" }), t("new2", { fileName: "b.mp3" })],
    playlists: [],
    recent: ["new2"],
  };
  const incoming = parseBackup(
    serializeBackup(
      [t("a", { favorite: true }), t("b"), t("c")],
      [{ id: "p1", name: "Drive", trackIds: ["a", "c", "b"], createdAt: 1, updatedAt: 2 }],
      ["a"],
    ),
  );
  const merged = mergeBackup(current, incoming);
  assert.equal(merged.tracks.length, 3);
  const a = merged.tracks.find((x) => x.id === "new1");
  assert.equal(a.title, "Title a");
  assert.equal(a.favorite, true);
  assert.equal(a.opfsKey, "new1", "keeps the local audio link");
  const c = merged.tracks.find((x) => x.id === "c");
  assert.ok(c, "unknown tracks come in as missing-audio rows");
  assert.deepEqual(merged.playlists[0].trackIds, ["new1", "c", "new2"]);
  assert.deepEqual(merged.recent, ["new1", "new2"]);
  assert.equal(merged.idMap.get("b"), "new2");
});

test("mergeBackup replaces a playlist with the same id and keeps the others", () => {
  const current = {
    tracks: [t("a")],
    playlists: [
      { id: "p1", name: "Old", trackIds: ["a"], createdAt: 1, updatedAt: 1 },
      { id: "p2", name: "Keep", trackIds: ["a"], createdAt: 1, updatedAt: 1 },
    ],
    recent: [],
  };
  const incoming = parseBackup(
    serializeBackup([t("a")], [{ id: "p1", name: "New", trackIds: ["a"], createdAt: 5, updatedAt: 6 }], []),
  );
  const merged = mergeBackup(current, incoming);
  assert.deepEqual(merged.playlists.map((p) => p.name), ["New", "Keep"]);
});
