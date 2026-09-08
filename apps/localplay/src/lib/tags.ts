/**
 * Just enough ID3 to name a track: title, artist, album from an ID3v2 header
 * (v2.2 / v2.3 / v2.4) or an ID3v1 tail. Pure functions over ArrayBuffers so
 * node --test can feed them synthetic tags. Anything unreadable comes back
 * empty and the caller falls back to the file name.
 */

export type Tags = { title: string; artist: string; album: string };

export const EMPTY_TAGS: Tags = { title: "", artist: "", album: "" };

const V23_FRAMES: Record<string, keyof Tags> = { TIT2: "title", TPE1: "artist", TALB: "album" };
const V22_FRAMES: Record<string, keyof Tags> = { TT2: "title", TP1: "artist", TAL: "album" };

function synchsafe(b: Uint8Array, at: number): number {
  return ((b[at] & 0x7f) << 21) | ((b[at + 1] & 0x7f) << 14) | ((b[at + 2] & 0x7f) << 7) | (b[at + 3] & 0x7f);
}

function u32(b: Uint8Array, at: number): number {
  return ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
}

function u24(b: Uint8Array, at: number): number {
  return (b[at] << 16) | (b[at + 1] << 8) | b[at + 2];
}

function decode(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder().decode(bytes);
  }
}

function clean(s: string): string {
  return s.replace(/\0+$/g, "").replace(/\0/g, " ").trim();
}

/** Text frame body: one encoding byte, then the string. */
function textFrame(body: Uint8Array): string {
  if (body.length < 2) return "";
  const enc = body[0];
  const data = body.subarray(1);
  if (enc === 0) return clean(decode(data, "iso-8859-1"));
  if (enc === 3) return clean(decode(data, "utf-8"));
  if (enc === 1) {
    // UTF-16 with BOM. Default to LE when the BOM is missing.
    if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xff) {
      return clean(decode(data.subarray(2), "utf-16be"));
    }
    if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) {
      return clean(decode(data.subarray(2), "utf-16le"));
    }
    return clean(decode(data, "utf-16le"));
  }
  if (enc === 2) return clean(decode(data, "utf-16be"));
  return "";
}

/** Undoes ID3v2 unsynchronisation (FF 00 → FF). */
function unsync(b: Uint8Array): Uint8Array {
  const out = new Uint8Array(b.length);
  let n = 0;
  for (let i = 0; i < b.length; i++) {
    out[n++] = b[i];
    if (b[i] === 0xff && i + 1 < b.length && b[i + 1] === 0x00) i++;
  }
  return out.subarray(0, n);
}

/** Size of the ID3v2 block at the start of the file, or 0 when there is none. */
export function id3v2Size(head: Uint8Array): number {
  if (head.length < 10) return 0;
  if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return 0;
  const major = head[3];
  if (major < 2 || major > 4) return 0;
  const footer = major === 4 && head[5] & 0x10 ? 10 : 0;
  return 10 + synchsafe(head, 6) + footer;
}

export function parseId3v2(buf: ArrayBuffer): Tags {
  const all = new Uint8Array(buf);
  const size = id3v2Size(all);
  if (size === 0) return { ...EMPTY_TAGS };
  const major = all[3];
  const flags = all[5];
  let body: Uint8Array = all.subarray(10, Math.min(all.length, size));
  if (flags & 0x80 && major < 4) body = unsync(body);
  // Extended header: skip it.
  if (flags & 0x40 && major >= 3) {
    const ext = major === 4 ? synchsafe(body, 0) : u32(body, 0) + 4;
    body = body.subarray(Math.min(body.length, ext));
  }

  const out: Tags = { ...EMPTY_TAGS };
  let at = 0;
  const frames = major === 2 ? V22_FRAMES : V23_FRAMES;
  const headLen = major === 2 ? 6 : 10;
  while (at + headLen <= body.length) {
    if (body[at] === 0) break; // padding
    let id: string;
    let len: number;
    let frameFlags = 0;
    if (major === 2) {
      id = String.fromCharCode(body[at], body[at + 1], body[at + 2]);
      len = u24(body, at + 3);
    } else {
      id = String.fromCharCode(body[at], body[at + 1], body[at + 2], body[at + 3]);
      len = major === 4 ? synchsafe(body, at + 4) : u32(body, at + 4);
      frameFlags = body[at + 9];
    }
    if (!/^[A-Z0-9]+$/.test(id) || len < 0) break;
    const start = at + headLen;
    const end = Math.min(body.length, start + len);
    const key = frames[id];
    if (key && !out[key]) {
      let frame: Uint8Array = body.subarray(start, end);
      if (major === 4) {
        if (frameFlags & 0x01) frame = frame.subarray(4); // data length indicator
        if (frameFlags & 0x02) frame = unsync(frame);
      }
      // Compressed / encrypted frames are not worth the bytes; skip them.
      const skip = major === 3 ? frameFlags & 0xc0 : frameFlags & 0x0c;
      if (!skip) out[key] = textFrame(frame);
    }
    at = start + len;
    if (out.title && out.artist && out.album) break;
  }
  return out;
}

/** The 128-byte ID3v1 block at the very end of the file. */
export function parseId3v1(tail: ArrayBuffer): Tags {
  const b = new Uint8Array(tail);
  if (b.length < 128) return { ...EMPTY_TAGS };
  const at = b.length - 128;
  if (b[at] !== 0x54 || b[at + 1] !== 0x41 || b[at + 2] !== 0x47) return { ...EMPTY_TAGS };
  const field = (from: number, len: number) => clean(decode(b.subarray(at + from, at + from + len), "iso-8859-1"));
  return { title: field(3, 30), artist: field(33, 30), album: field(63, 30) };
}

export function mergeTags(...sources: Tags[]): Tags {
  const out: Tags = { ...EMPTY_TAGS };
  for (const s of sources) {
    if (!out.title && s.title) out.title = s.title;
    if (!out.artist && s.artist) out.artist = s.artist;
    if (!out.album && s.album) out.album = s.album;
  }
  return out;
}

/**
 * Reads only the ID3v2 block at the front (and the v1 tail if the front said
 * nothing), never the whole file: a 2 GB folder pick must not read 2 GB.
 */
export async function readTags(file: Blob): Promise<Tags> {
  try {
    const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
    const size = id3v2Size(head);
    let v2: Tags = { ...EMPTY_TAGS };
    if (size > 0) {
      const cap = Math.min(size, 2 * 1024 * 1024);
      v2 = parseId3v2(await file.slice(0, cap).arrayBuffer());
    }
    if (v2.title && v2.artist && v2.album) return v2;
    let v1: Tags = { ...EMPTY_TAGS };
    if (file.size >= 128) {
      v1 = parseId3v1(await file.slice(file.size - 128).arrayBuffer());
    }
    return mergeTags(v2, v1);
  } catch {
    return { ...EMPTY_TAGS };
  }
}
