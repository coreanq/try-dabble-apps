/**
 * Local store: a nostalgia calendar. Every entry is a Note pinned to a local
 * calendar day (YYYY-MM-DD): an optional title, a body, and its own
 * created/updated timestamps. There is no cloud copy — the JSON backup is
 * the only way off the device. Import is forgiving: a bare array of notes,
 * `{ notes | entries | items | list: [...] }`, alternate key names such as
 * day / heading / text / memo, and unknown keys are ignored rather than
 * fatal.
 *
 * The point of the app is the "this day across years" stack: every note
 * whose date shares the same MM-DD as the day you're looking at, grouped by
 * year. Nothing here ever discards a year just because the note is old.
 */
import { dateKeyOfAny, isDateKey, isMmDd, isMonthKey, mmddOfDateKey, monthKey, toDateKey } from "./dates.ts";

export const NOTES_KEY = "ondaypad:notes:v1";
export const PREFS_KEY = "ondaypad:prefs:v1";
export const LANG_STORAGE_KEY = "ondaypad:lang";

export const BACKUP_APP = "ondaypad";
export const BACKUP_VERSION = 1;
export const MAX_TITLE = 120;
export const MAX_BODY = 4000;

export type ViewMode = "month" | "stack";
export type StackOrder = "newest" | "oldest";

export interface Note {
  id: string;
  date: string; // local YYYY-MM-DD
  title?: string;
  body: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Prefs {
  viewMode: ViewMode;
  stackOrder: StackOrder;
  activeMonth: string; // YYYY-MM
  selectedMmDd: string | null; // MM-DD
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  notes: Note[];
  prefs: Prefs;
}

export interface YearGroup {
  year: number;
  date: string; // YYYY-MM-DD for that year
  notes: Note[];
}

export function newId(prefix = "n"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultPrefs(now: Date = new Date()): Prefs {
  return { viewMode: "month", stackOrder: "newest", activeMonth: monthKey(now), selectedMmDd: null };
}

/* ---------- coercion helpers ---------- */

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function iso(v: unknown, fallback: string): string {
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return v;
  return fallback;
}

function pick(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

export function isViewMode(v: unknown): v is ViewMode {
  return v === "month" || v === "stack";
}

export function isStackOrder(v: unknown): v is StackOrder {
  return v === "newest" || v === "oldest";
}

export function parsePrefs(raw: unknown, now: Date = new Date()): Prefs {
  const base = defaultPrefs(now);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const viewMode = pick(o, ["viewMode", "view", "mode"]);
  const stackOrder = pick(o, ["stackOrder", "order", "sort"]);
  const activeMonth = pick(o, ["activeMonth", "month"]);
  const selectedMmDd = pick(o, ["selectedMmDd", "mmdd", "selected"]);
  return {
    viewMode: isViewMode(viewMode) ? viewMode : base.viewMode,
    stackOrder: isStackOrder(stackOrder) ? stackOrder : base.stackOrder,
    activeMonth: isMonthKey(activeMonth) ? (activeMonth as string) : base.activeMonth,
    selectedMmDd: isMmDd(selectedMmDd) ? (selectedMmDd as string) : null,
  };
}

/* ---------- notes ---------- */

export function normalizeNote(raw: unknown, nowIso = new Date().toISOString()): Note | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const date = dateKeyOfAny(pick(o, ["date", "day", "on", "at"]));
  const body = str(pick(o, ["body", "text", "content", "note", "memo", "entry"]), MAX_BODY);
  const title = str(pick(o, ["title", "heading", "subject", "label"]), MAX_TITLE);
  if (!date || (!body && !title)) return null;
  const createdAt = iso(pick(o, ["createdAt", "created"]), nowIso);
  const note: Note = {
    id: typeof o.id === "string" && o.id ? o.id : typeof o.id === "number" ? String(o.id) : newId(),
    date,
    body,
    createdAt,
    updatedAt: iso(pick(o, ["updatedAt", "updated"]), createdAt),
  };
  if (title) note.title = title;
  return note;
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

/** Notes for one exact calendar day, most recently created first. */
export function notesForDate(notes: Note[], date: string): Note[] {
  return notes.filter((n) => n.date === date).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/**
 * Every note whose date shares this MM-DD, grouped by year. Years are
 * ordered by `order` (default newest first); notes inside a year are newest
 * first by creation time. A year with no note for this MM-DD is simply
 * absent — nothing is padded in.
 */
export function notesForMmDd(notes: Note[], mmdd: string, order: StackOrder = "newest"): YearGroup[] {
  const byYear = new Map<number, Note[]>();
  for (const n of notes) {
    if (mmddOfDateKey(n.date) !== mmdd) continue;
    const year = Number(n.date.slice(0, 4));
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(n);
  }
  const years = [...byYear.keys()].sort((a, b) => (order === "newest" ? b - a : a - b));
  return years.map((year) => ({
    year,
    date: `${year}-${mmdd}`,
    notes: byYear.get(year)!.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)),
  }));
}

export function createNote(date: string, body: string, title?: string, now: Date = new Date()): Note {
  const t = now.toISOString();
  const note: Note = {
    id: newId(),
    date: isDateKey(date) ? date : toDateKey(now),
    body: str(body, MAX_BODY),
    createdAt: t,
    updatedAt: t,
  };
  const ti = str(title, MAX_TITLE);
  if (ti) note.title = ti;
  return note;
}

export function updateNote(list: Note[], id: string, patch: { title?: string; body?: string; date?: string }, now: Date = new Date()): Note[] {
  return list.map((n) => {
    if (n.id !== id) return n;
    const next: Note = { ...n, updatedAt: now.toISOString() };
    if (patch.body !== undefined) next.body = str(patch.body, MAX_BODY);
    if (patch.date !== undefined && isDateKey(patch.date)) next.date = patch.date;
    if (patch.title !== undefined) {
      const ti = str(patch.title, MAX_TITLE);
      if (ti) next.title = ti;
      else delete next.title;
    }
    return next;
  });
}

export function removeNote(list: Note[], id: string): Note[] {
  return list.filter((n) => n.id !== id);
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
export const loadPrefs = (): Prefs => read(PREFS_KEY, (raw) => parsePrefs(raw), defaultPrefs);
export const savePrefs = (v: Prefs): void => write(PREFS_KEY, v);

export function clearAll(): void {
  for (const k of [NOTES_KEY, PREFS_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- backup ---------- */

export function buildBackup(notes: Note[], prefs: Prefs, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), notes, prefs };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(now = new Date()): string {
  return `ondaypad-${toDateKey(now).replace(/-/g, "")}.json`;
}

/**
 * Reads our own shape, a bare array of notes, or `{ notes | entries | items
 * | list: [...] }`. Missing pieces default; unknown keys are ignored.
 * Returns null only when no note list can be found at all.
 */
export function parseBackup(raw: unknown): Backup | null {
  let list: unknown = null;
  let o: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    o = raw as Record<string, unknown>;
    list = pick(o, ["notes", "entries", "items", "list", "data"]);
    if (list && typeof list === "object" && !Array.isArray(list)) {
      const inner = list as Record<string, unknown>;
      list = pick(inner, ["notes", "entries", "items", "list"]) ?? Object.values(inner);
    }
    if (!Array.isArray(list) && (o.date !== undefined || o.body !== undefined || o.title !== undefined) && normalizeNote(o)) list = [o];
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
