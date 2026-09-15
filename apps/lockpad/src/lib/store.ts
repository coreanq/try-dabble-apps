/**
 * Local store for a small notepad where any note can be locked. A plain note
 * keeps its body in the clear; a locked note keeps ONLY { ciphertext, iv,
 * salt, kdf } — the body is never written to storage or to the JSON backup
 * while the note is locked. Titles, tags and colours stay in the clear on
 * purpose so the list and the search still work without a PIN.
 *
 * There is no cloud copy. The JSON backup (`{ app: "lockpad", version: 1 }`)
 * is the only way off the device, and it carries locked notes exactly as
 * they are stored, so importing on a new browser restores them still locked
 * and still openable with the same PIN. Import is forgiving: a bare array,
 * `{ notes | items | list: [...] }`, alternate key names, and unknown keys
 * are ignored rather than fatal.
 */
import { isBackoffState, type BackoffState } from "./backoff.ts";
import { isLockedBlob, type KdfParams, type LockedBlob } from "./crypto.ts";

export const NOTES_KEY = "lockpad:notes:v1";
export const PREFS_KEY = "lockpad:prefs:v1";
export const BACKOFF_KEY = "lockpad:backoff:v1";
export const OPEN_KEY = "lockpad:open:v1";
export const LANG_STORAGE_KEY = "lockpad:lang";

export const BACKUP_APP = "lockpad";
export const BACKUP_VERSION = 1;
export const MAX_TITLE = 120;
export const MAX_BODY = 20_000;
export const MAX_TAGS = 8;
export const MAX_TAG = 24;
export const MIN_IDLE_MS = 15_000;
export const MAX_IDLE_MS = 3_600_000;
export const DEFAULT_IDLE_MS = 300_000;

export const NOTE_COLORS = ["none", "brass", "sage", "rose", "lavender", "slate"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

interface NoteBase {
  id: string;
  title: string;
  tags: string[];
  color: NoteColor;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface PlainNote extends NoteBase {
  locked: false;
  body: string;
}

export interface LockedNote extends NoteBase, LockedBlob {
  locked: true;
}

export type Note = PlainNote | LockedNote;

export interface Prefs {
  /** Re-lock every open note after this much idle time; null = off. */
  autoLockIdleMs: number | null;
  /** Re-lock every open note when the tab is hidden. */
  autoLockOnHide: boolean;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  notes: Note[];
  prefs: Prefs;
}

export function newId(prefix = "n"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultPrefs(): Prefs {
  return { autoLockIdleMs: DEFAULT_IDLE_MS, autoLockOnHide: true };
}

/* ---------- coercion helpers ---------- */

function str(v: unknown, max: number, trim = true): string {
  if (typeof v !== "string") return "";
  return (trim ? v.trim() : v).slice(0, max);
}

function iso(v: unknown, fallback: string): string {
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return v;
  return fallback;
}

function pick(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

export function isNoteColor(v: unknown): v is NoteColor {
  return typeof v === "string" && (NOTE_COLORS as readonly string[]).includes(v);
}

/** "a, b ,a" or ["a","b"] -> ["a","b"]; trimmed, deduped, capped. */
export function parseTags(raw: unknown): string[] {
  const parts: unknown[] = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[,\n]/) : [];
  const out: string[] = [];
  for (const p of parts) {
    const t = str(p, MAX_TAG);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  let idle: number | null = base.autoLockIdleMs;
  // An explicit null means "off", so look for the key rather than a value.
  const idleKey = ["autoLockIdleMs", "idleMs", "autoLock"].find((k) => k in o);
  if (idleKey) {
    const rawIdle = o[idleKey];
    if (typeof rawIdle === "number" && Number.isFinite(rawIdle) && rawIdle > 0) idle = Math.min(MAX_IDLE_MS, Math.max(MIN_IDLE_MS, Math.round(rawIdle)));
    else idle = null;
  }
  const rawHide = pick(o, ["autoLockOnHide", "lockOnHide"]);
  return { autoLockIdleMs: idle, autoLockOnHide: typeof rawHide === "boolean" ? rawHide : base.autoLockOnHide };
}

/* ---------- notes ---------- */

function baseOf(o: Record<string, unknown>, nowIso: string): NoteBase {
  const createdAt = iso(pick(o, ["createdAt", "created"]), nowIso);
  return {
    id: typeof o.id === "string" && o.id ? o.id : typeof o.id === "number" ? String(o.id) : newId(),
    title: str(pick(o, ["title", "heading", "subject", "name"]), MAX_TITLE),
    tags: parseTags(pick(o, ["tags", "labels"])),
    color: (() => {
      const c = pick(o, ["color", "colour"]);
      return isNoteColor(c) ? c : "none";
    })(),
    createdAt,
    updatedAt: iso(pick(o, ["updatedAt", "updated"]), createdAt),
  };
}

/**
 * A locked note is kept only if its blob is complete; a `body` riding along
 * with `locked: true` is dropped, never stored. A locked note without a
 * usable blob is unreadable anyway, so it is skipped rather than turned
 * into an empty plain note.
 */
export function normalizeNote(raw: unknown, nowIso = new Date().toISOString()): Note | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const base = baseOf(o, nowIso);
  if (o.locked === true || (o.locked === undefined && isLockedBlob(o))) {
    if (!isLockedBlob(o)) return null;
    const kdf: KdfParams = { name: "PBKDF2", hash: "SHA-256", iterations: o.kdf.iterations };
    return { ...base, locked: true, ciphertext: o.ciphertext, iv: o.iv, salt: o.salt, kdf };
  }
  const body = str(pick(o, ["body", "text", "content", "note", "memo"]), MAX_BODY, false);
  if (!body && !base.title) return null;
  return { ...base, locked: false, body };
}

export function parseNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Note[] = [];
  for (const r of raw) {
    const n = normalizeNote(r);
    if (!n) continue;
    if (seen.has(n.id)) n.id = newId();
    seen.add(n.id);
    out.push(n);
  }
  return out;
}

export function createNote(input: { title?: string; body?: string; tags?: string[] | string; color?: string }, now: Date = new Date()): PlainNote {
  const t = now.toISOString();
  return {
    id: newId(),
    title: str(input.title, MAX_TITLE),
    body: str(input.body, MAX_BODY, false),
    tags: parseTags(input.tags),
    color: isNoteColor(input.color) ? input.color : "none",
    locked: false,
    createdAt: t,
    updatedAt: t,
  };
}

export interface NotePatch {
  title?: string;
  body?: string;
  tags?: string[] | string;
  color?: string;
}

/** Patch metadata on any note; `body` only lands on a plain note (locked bodies go through re-encryption). */
export function updateNote(list: Note[], id: string, patch: NotePatch, now: Date = new Date()): Note[] {
  return list.map((n) => {
    if (n.id !== id) return n;
    const next: Note = { ...n, updatedAt: now.toISOString() };
    // Not trimmed while typing, or a space could never be entered; import / reload trims.
    if (patch.title !== undefined) next.title = str(patch.title, MAX_TITLE, false);
    if (patch.tags !== undefined) next.tags = parseTags(patch.tags);
    if (patch.color !== undefined && isNoteColor(patch.color)) next.color = patch.color;
    if (patch.body !== undefined && next.locked === false) next.body = str(patch.body, MAX_BODY, false);
    return next;
  });
}

/** Swap fresh ciphertext into a locked note after an edit. */
export function reencryptNote(list: Note[], id: string, blob: { ciphertext: string; iv: string }, now: Date = new Date()): Note[] {
  return list.map((n) => (n.id === id && n.locked ? { ...n, ciphertext: blob.ciphertext, iv: blob.iv, updatedAt: now.toISOString() } : n));
}

export function removeNote(list: Note[], id: string): Note[] {
  return list.filter((n) => n.id !== id);
}

/** Plain -> locked. The body is gone from the returned note; only the blob remains. */
export function lockNote(note: Note, blob: LockedBlob, now: Date = new Date()): LockedNote {
  const { id, title, tags, color, createdAt } = note;
  return { id, title, tags, color, createdAt, updatedAt: now.toISOString(), locked: true, ciphertext: blob.ciphertext, iv: blob.iv, salt: blob.salt, kdf: { ...blob.kdf } };
}

/** Locked -> plain, once the body has been decrypted by the caller. */
export function unlockNote(note: Note, body: string, now: Date = new Date()): PlainNote {
  const { id, title, tags, color, createdAt } = note;
  return { id, title, tags, color, createdAt, updatedAt: now.toISOString(), locked: false, body: str(body, MAX_BODY, false) };
}

export function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

/**
 * Title and tags match for every note; the body only for plain notes. A
 * locked note's ciphertext is never inspected, so a search cannot leak
 * what is inside one.
 */
export function searchNotes(list: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((n) => {
    if (n.title.toLowerCase().includes(q)) return true;
    if (n.tags.some((t) => t.toLowerCase().includes(q))) return true;
    return n.locked === false && n.body.toLowerCase().includes(q);
  });
}

/** Import never wipes: the file's notes are added, and a same-id note from the file replaces the local one. */
export function mergeNotes(local: Note[], incoming: Note[]): Note[] {
  const byId = new Map<string, Note>();
  for (const n of local) byId.set(n.id, n);
  for (const n of incoming) byId.set(n.id, n);
  return [...byId.values()];
}

/* ---------- persistence ---------- */

function read<T>(key: string, parse: (raw: unknown) => T, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : fallback();
  } catch {
    return fallback();
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export const loadNotes = (): Note[] => read(NOTES_KEY, parseNotes, () => []);
export const saveNotes = (v: Note[]): void => write(NOTES_KEY, v);
export const loadPrefs = (): Prefs => read(PREFS_KEY, parsePrefs, defaultPrefs);
export const savePrefs = (v: Prefs): void => write(PREFS_KEY, v);
/** Which note was open last, so a reload lands on it (a locked one just shows its locked card). */
export const loadOpenId = (): string | null => read(OPEN_KEY, (raw) => (typeof raw === "string" && raw ? raw : null), () => null);
export const saveOpenId = (v: string | null): void => write(OPEN_KEY, v);

export function clearAll(): void {
  for (const k of [NOTES_KEY, PREFS_KEY, BACKOFF_KEY, OPEN_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- backup ---------- */

/** Locked notes go out exactly as stored: ciphertext + salt + kdf, no body. */
export function buildBackup(notes: Note[], prefs: Prefs, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), notes, prefs };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `lockpad-${y}${m}${d}.json`;
}

/**
 * Reads our own shape, a bare array of notes, or `{ notes | items | list:
 * [...] }`. Missing pieces default; unknown keys are ignored. Returns null
 * only when no note list can be found at all.
 */
export function parseBackup(raw: unknown): Backup | null {
  let list: unknown = null;
  let o: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    o = raw as Record<string, unknown>;
    list = pick(o, ["notes", "items", "list", "entries", "data"]);
    if (list && typeof list === "object" && !Array.isArray(list)) {
      const inner = list as Record<string, unknown>;
      list = pick(inner, ["notes", "items", "list"]) ?? Object.values(inner);
    }
    if (!Array.isArray(list) && (o.body !== undefined || o.title !== undefined || o.ciphertext !== undefined) && normalizeNote(o)) list = [o];
  }
  if (!Array.isArray(list)) return null;
  const notes = parseNotes(list);
  const prefs = parsePrefs(o.prefs ?? o.settings ?? {});
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: iso(o.exportedAt, new Date().toISOString()), notes, prefs };
}

export function download(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- wrong-PIN backoff, per note, persisted so a reload does not reset it ---------- */


export type BackoffMap = Record<string, BackoffState>;

export function parseBackoffMap(raw: unknown): BackoffMap {
  const out: BackoffMap = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (isBackoffState(v) && (v.failures > 0 || v.lockedUntil > 0)) out[id] = { failures: v.failures, lockedUntil: v.lockedUntil };
  }
  return out;
}

export const loadBackoff = (): BackoffMap => read(BACKOFF_KEY, parseBackoffMap, () => ({}));
export const saveBackoff = (v: BackoffMap): void => write(BACKOFF_KEY, Object.keys(v).length ? v : null);
