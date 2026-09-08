import assert from "node:assert/strict";
import test from "node:test";

import { id3v2Size, mergeTags, parseId3v1, parseId3v2, readTags } from "../src/lib/tags.ts";
import { guessFromFileName, titleFromFileName } from "../src/lib/library.ts";

function synchsafe(n) {
  return [(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f];
}

function latin1(s) {
  return Array.from(s, (c) => c.charCodeAt(0) & 0xff);
}

/** ID3v2.3 / v2.4 tag with text frames. Body encoded per `enc`. */
function v2(major, frames, enc = 3) {
  const body = [];
  for (const [id, text] of frames) {
    let data;
    if (enc === 3) data = Array.from(new TextEncoder().encode(text));
    else if (enc === 0) data = latin1(text);
    else if (enc === 1) {
      data = [0xff, 0xfe];
      for (const ch of text) {
        const code = ch.charCodeAt(0);
        data.push(code & 0xff, code >> 8);
      }
    }
    const payload = [enc, ...data];
    const size = major === 4 ? synchsafe(payload.length) : [
      (payload.length >>> 24) & 0xff,
      (payload.length >>> 16) & 0xff,
      (payload.length >>> 8) & 0xff,
      payload.length & 0xff,
    ];
    body.push(...latin1(id), ...size, 0, 0, ...payload);
  }
  const padding = new Array(32).fill(0);
  const total = body.length + padding.length;
  const head = [0x49, 0x44, 0x33, major, 0, 0, ...synchsafe(total)];
  return new Uint8Array([...head, ...body, ...padding, ...latin1("FAKEAUDIO")]).buffer;
}

/** ID3v2.2 tag: three-byte ids, three-byte sizes. */
function v22(frames) {
  const body = [];
  for (const [id, text] of frames) {
    const payload = [0, ...latin1(text)];
    body.push(...latin1(id), (payload.length >> 16) & 0xff, (payload.length >> 8) & 0xff, payload.length & 0xff, ...payload);
  }
  const head = [0x49, 0x44, 0x33, 2, 0, 0, ...synchsafe(body.length)];
  return new Uint8Array([...head, ...body]).buffer;
}

function v1(title, artist, album) {
  const pad = (s) => {
    const b = latin1(s).slice(0, 30);
    while (b.length < 30) b.push(0);
    return b;
  };
  const bytes = [...latin1("TAG"), ...pad(title), ...pad(artist), ...pad(album), ...new Array(35).fill(0)];
  assert.equal(bytes.length, 128);
  return new Uint8Array([...latin1("AUDIOBYTES"), ...bytes]).buffer;
}

test("id3v2Size reads the synchsafe header size and rejects non-tags", () => {
  const buf = v2(3, [["TIT2", "x"]]);
  const size = id3v2Size(new Uint8Array(buf));
  assert.ok(size > 10);
  assert.equal(id3v2Size(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])), 0);
  assert.equal(id3v2Size(new Uint8Array(4)), 0);
});

test("parses v2.3 UTF-8 title / artist / album", () => {
  const tags = parseId3v2(v2(3, [["TIT2", "Blue Train"], ["TPE1", "John Coltrane"], ["TALB", "Blue Train"], ["TYER", "1958"]]));
  assert.deepEqual(tags, { title: "Blue Train", artist: "John Coltrane", album: "Blue Train" });
});

test("parses v2.4 synchsafe frame sizes and CJK text", () => {
  const tags = parseId3v2(v2(4, [["TPE1", "아이유"], ["TIT2", "밤편지"], ["TALB", "Palette"]]));
  assert.deepEqual(tags, { title: "밤편지", artist: "아이유", album: "Palette" });
});

test("parses ISO-8859-1 and UTF-16 (BOM) encodings", () => {
  const latin = parseId3v2(v2(3, [["TIT2", "Café"]], 0));
  assert.equal(latin.title, "Café");
  const utf16 = parseId3v2(v2(3, [["TIT2", "夜に駆ける"], ["TPE1", "YOASOBI"]], 1));
  assert.equal(utf16.title, "夜に駆ける");
  assert.equal(utf16.artist, "YOASOBI");
});

test("parses v2.2 three-letter frames", () => {
  const tags = parseId3v2(v22([["TT2", "Song"], ["TP1", "Band"], ["TAL", "Record"]]));
  assert.deepEqual(tags, { title: "Song", artist: "Band", album: "Record" });
});

test("missing frames come back empty, never undefined", () => {
  const tags = parseId3v2(v2(3, [["TIT2", "Only a title"]]));
  assert.deepEqual(tags, { title: "Only a title", artist: "", album: "" });
  assert.deepEqual(parseId3v2(new Uint8Array([0, 0, 0]).buffer), { title: "", artist: "", album: "" });
});

test("parses the ID3v1 tail and trims the padding", () => {
  const tags = parseId3v1(v1("Old Song", "Old Band", "Old Album"));
  assert.deepEqual(tags, { title: "Old Song", artist: "Old Band", album: "Old Album" });
  assert.deepEqual(parseId3v1(new Uint8Array(10).buffer), { title: "", artist: "", album: "" });
});

test("mergeTags fills gaps from later sources without overriding earlier ones", () => {
  const merged = mergeTags({ title: "A", artist: "", album: "" }, { title: "B", artist: "Z", album: "Y" });
  assert.deepEqual(merged, { title: "A", artist: "Z", album: "Y" });
});

test("readTags reads only the head and tail of a Blob and merges v2 with v1", async () => {
  const v2buf = new Uint8Array(v2(3, [["TIT2", "Head Title"]]));
  const v1buf = new Uint8Array(v1("Tail Title", "Tail Artist", "Tail Album"));
  const blob = new Blob([v2buf, v1buf]);
  const tags = await readTags(blob);
  assert.deepEqual(tags, { title: "Head Title", artist: "Tail Artist", album: "Tail Album" });
});

test("file name fallback strips the extension, a leading track number and splits Artist - Title", () => {
  assert.equal(titleFromFileName("Music/01 - Song.mp3"), "01 - Song");
  assert.deepEqual(guessFromFileName("03. Artist Name - Song Title.mp3"), { title: "Song Title", artist: "Artist Name" });
  assert.deepEqual(guessFromFileName("plain.flac"), { title: "plain", artist: "" });
  assert.deepEqual(guessFromFileName("12 Twelve.m4a"), { title: "Twelve", artist: "" });
});
