/**
 * Local store: one prefs object (rewind amount, speed, last file name, A–B
 * points, notes keyed by file name). Everything lives in this browser; the
 * JSON backup is the only way off the device and never contains audio. Import
 * is forgiving: our own `{ app:"listenpad", prefs }`, a bare prefs object, or
 * `{ settings }` are all read. Unknown keys are ignored, never fatal.
 */
import {
  clampRewind,
  clampSpeed,
  DEFAULT_REWIND,
  DEFAULT_SPEED,
  isRewindSec,
  isSpeed,
  NO_LOOP,
  type LoopPoints,
  type RewindSec,
} from "./player.ts";

export const PREFS_KEY = "listenpad:prefs:v1";

export const BACKUP_APP = "listenpad";
export const BACKUP_VERSION = 1;

export interface Prefs {
  rewindSec: RewindSec;
  speed: number;
  lastFileName?: string;
  ab?: LoopPoints;
  notesByFile?: Record<string, string>;
  uiLang?: string;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  prefs: Prefs;
}

function isoOf(v: unknown): string | null {
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return new Date(v).toISOString();
  return null;
}

function timeOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
}

export function defaultPrefs(): Prefs {
  return { rewindSec: DEFAULT_REWIND, speed: DEFAULT_SPEED };
}

export function parseLoop(raw: unknown): LoopPoints | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const a = timeOrNull(o.a ?? o.start ?? o.from);
  const b = timeOrNull(o.b ?? o.end ?? o.to);
  if (a === null && b === null) return undefined;
  if (a !== null && b !== null) {
    if (a === b) return undefined;
    if (b < a) return { a: b, b: a };
  }
  return { a, b };
}

export function parsePrefs(raw: unknown): Prefs {
  const out = defaultPrefs();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;
  const rw = o.rewindSec ?? o.rewind ?? o.skipSec;
  if (isRewindSec(rw)) out.rewindSec = rw;
  else if (typeof rw === "number" && Number.isFinite(rw)) out.rewindSec = clampRewind(rw);
  const sp = o.speed ?? o.playbackRate ?? o.rate;
  if (isSpeed(sp)) out.speed = sp;
  else if (typeof sp === "number" && Number.isFinite(sp)) out.speed = clampSpeed(sp);
  if (typeof o.lastFileName === "string" && o.lastFileName) out.lastFileName = o.lastFileName;
  const ab = parseLoop(o.ab ?? o.loop);
  if (ab) out.ab = ab;
  const notesRaw = o.notesByFile ?? o.notes;
  if (notesRaw && typeof notesRaw === "object" && !Array.isArray(notesRaw)) {
    const notes: Record<string, string> = {};
    for (const [k, v] of Object.entries(notesRaw as Record<string, unknown>)) {
      if (k && typeof v === "string" && v) notes[k] = v;
    }
    if (Object.keys(notes).length) out.notesByFile = notes;
  }
  if (typeof o.uiLang === "string") out.uiLang = o.uiLang;
  return out;
}

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

export const loadPrefs = (): Prefs => read(PREFS_KEY, parsePrefs, defaultPrefs);
export const savePrefs = (v: Prefs): void => write(PREFS_KEY, v);

export function clearAll(): void {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- pure helpers ---------- */

export function noteFor(prefs: Prefs, fileName: string): string {
  return (fileName && prefs.notesByFile?.[fileName]) || "";
}

export function setNoteFor(prefs: Prefs, fileName: string, text: string): Prefs {
  if (!fileName) return prefs;
  const cur = prefs.notesByFile ?? {};
  if ((cur[fileName] ?? "") === text) return prefs;
  const next = { ...cur };
  if (text) next[fileName] = text;
  else delete next[fileName];
  const { notesByFile: _old, ...rest } = prefs;
  void _old;
  return Object.keys(next).length ? { ...rest, notesByFile: next } : rest;
}

/** Loop points only apply to the file they were set on. */
export function abForFile(prefs: Prefs, fileName: string): LoopPoints {
  if (fileName && prefs.lastFileName === fileName && prefs.ab) return prefs.ab;
  return NO_LOOP;
}

export function withLoop(prefs: Prefs, fileName: string, ab: LoopPoints): Prefs {
  const { ab: _old, ...rest } = prefs;
  void _old;
  const next: Prefs = { ...rest, lastFileName: fileName };
  if (ab.a !== null || ab.b !== null) next.ab = ab;
  return next;
}

/** Remembers the open file; A–B from a different file name is dropped. */
export function withFile(prefs: Prefs, fileName: string): Prefs {
  if (prefs.lastFileName === fileName) return prefs;
  const { ab: _old, ...rest } = prefs;
  void _old;
  return { ...rest, lastFileName: fileName };
}

/* ---------- backup ---------- */

export function buildBackup(prefs: Prefs, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), prefs };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

function dateStamp(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function backupFilename(now = new Date()): string {
  return `listenpad-${dateStamp(now)}.json`;
}

const PREF_HINTS = ["rewindSec", "rewind", "speed", "playbackRate", "notesByFile", "notes", "ab", "loop", "lastFileName"];

/**
 * Reads our own shape, `{ settings }`, or a bare prefs object. Returns null
 * only when nothing that looks like Listenpad settings can be found.
 */
export function parseBackup(raw: unknown): Backup | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.app === "string" && o.app !== BACKUP_APP) return null;
  let src: unknown = null;
  if (o.prefs && typeof o.prefs === "object" && !Array.isArray(o.prefs)) src = o.prefs;
  else if (o.settings && typeof o.settings === "object" && !Array.isArray(o.settings)) src = o.settings;
  else if (PREF_HINTS.some((k) => k in o)) src = o;
  if (src === null) return null;
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: isoOf(o.exportedAt) ?? new Date(0).toISOString(), prefs: parsePrefs(src) };
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
