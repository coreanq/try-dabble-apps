/**
 * Local store: the notes and a few prefs. Everything lives in this browser;
 * the JSON backup is the only way off the device. Import is forgiving: our
 * own `{ app:"dictpad", notes:[...] }`, a bare array of notes, `{ notes | items
 * | documents: [...] }`, or a single `{ text }` / `{ body }` object are all
 * mapped when the fields are obvious. Unknown keys are ignored, never fatal.
 */
export const NOTES_KEY = "dictpad:notes:v1";
export const PREFS_KEY = "dictpad:prefs:v1";

export const BACKUP_APP = "dictpad";
export const BACKUP_VERSION = 1;

export interface Note {
  id: string;
  title?: string;
  body: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Prefs {
  activeNoteId?: string;
  recognitionLang?: string; // BCP-47
  uiLang?: string;
  continuous?: boolean;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  notes: Note[];
  prefs: Prefs;
}

/** Common Web Speech recognition languages, native label first. */
export const SPEECH_LANGS: { code: string; label: string }[] = [
  { code: "ko-KR", label: "한국어 (대한민국)" },
  { code: "en-US", label: "English (United States)" },
  { code: "en-GB", label: "English (United Kingdom)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "en-IN", label: "English (India)" },
  { code: "ja-JP", label: "日本語 (日本)" },
  { code: "zh-CN", label: "中文 (简体, 中国大陆)" },
  { code: "zh-TW", label: "中文 (繁體, 台灣)" },
  { code: "zh-HK", label: "中文 (香港)" },
  { code: "yue-Hant-HK", label: "粵語 (香港)" },
  { code: "es-ES", label: "Español (España)" },
  { code: "es-MX", label: "Español (México)" },
  { code: "fr-FR", label: "Français (France)" },
  { code: "de-DE", label: "Deutsch (Deutschland)" },
  { code: "it-IT", label: "Italiano (Italia)" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "ru-RU", label: "Русский (Россия)" },
  { code: "vi-VN", label: "Tiếng Việt (Việt Nam)" },
  { code: "th-TH", label: "ไทย (ไทย)" },
  { code: "id-ID", label: "Bahasa Indonesia" },
  { code: "ms-MY", label: "Bahasa Melayu" },
  { code: "hi-IN", label: "हिन्दी (भारत)" },
  { code: "ar-SA", label: "العربية (السعودية)" },
  { code: "tr-TR", label: "Türkçe (Türkiye)" },
  { code: "nl-NL", label: "Nederlands (Nederland)" },
  { code: "pl-PL", label: "Polski (Polska)" },
  { code: "sv-SE", label: "Svenska (Sverige)" },
  { code: "uk-UA", label: "Українська (Україна)" },
];

export const DEFAULT_SPEECH_LANG: Record<string, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export function defaultSpeechLang(uiLang: string): string {
  return DEFAULT_SPEECH_LANG[uiLang] ?? "en-US";
}

export function isSpeechLang(v: unknown): v is string {
  return typeof v === "string" && /^[a-z]{2,3}(-[A-Za-z]{2,8})*$/.test(v);
}

export function newId(prefix = "n"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isoOf(v: unknown): string | null {
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return new Date(v).toISOString();
  return null;
}

export function defaultPrefs(): Prefs {
  return {};
}

export function parsePrefs(raw: unknown): Prefs {
  if (!raw || typeof raw !== "object") return defaultPrefs();
  const o = raw as Record<string, unknown>;
  const out: Prefs = {};
  if (typeof o.activeNoteId === "string") out.activeNoteId = o.activeNoteId;
  if (isSpeechLang(o.recognitionLang)) out.recognitionLang = o.recognitionLang;
  else if (isSpeechLang(o.lang)) out.recognitionLang = o.lang;
  if (typeof o.uiLang === "string") out.uiLang = o.uiLang;
  if (typeof o.continuous === "boolean") out.continuous = o.continuous;
  return out;
}

export function normalizeNote(raw: unknown, fallbackNow = new Date().toISOString()): Note | null {
  if (typeof raw === "string") {
    return { id: newId(), body: raw, createdAt: fallbackNow, updatedAt: fallbackNow };
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const bodyRaw = o.body ?? o.text ?? o.content ?? o.note ?? o.transcript;
  const body = typeof bodyRaw === "string" ? bodyRaw : "";
  const titleRaw = o.title ?? o.name;
  const title = typeof titleRaw === "string" && titleRaw.trim() ? titleRaw.trim() : undefined;
  if (!body && !title) return null;
  const created = isoOf(o.createdAt ?? o.created ?? o.date) ?? fallbackNow;
  const updated = isoOf(o.updatedAt ?? o.updated ?? o.modified) ?? created;
  const id = typeof o.id === "string" && o.id ? o.id : newId();
  return { id, ...(title ? { title } : {}), body, createdAt: created, updatedAt: updated };
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

export function clearAll(): void {
  for (const k of [NOTES_KEY, PREFS_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- note helpers (pure) ---------- */

export function createNote(notes: Note[], title?: string, now = new Date().toISOString()): { notes: Note[]; note: Note } {
  const clean = title?.trim();
  const note: Note = { id: newId(), ...(clean ? { title: clean } : {}), body: "", createdAt: now, updatedAt: now };
  return { notes: [note, ...notes], note };
}

export function renameNote(notes: Note[], id: string, title: string, now = new Date().toISOString()): Note[] {
  const t = title.trim();
  return notes.map((n) => {
    if (n.id !== id) return n;
    const { title: _old, ...rest } = n;
    void _old;
    return { ...rest, ...(t ? { title: t } : {}), updatedAt: now };
  });
}

export function updateBody(notes: Note[], id: string, body: string, now = new Date().toISOString()): Note[] {
  const idx = notes.findIndex((n) => n.id === id);
  if (idx < 0 || notes[idx].body === body) return notes;
  const next = notes.slice();
  next[idx] = { ...notes[idx], body, updatedAt: now };
  return next;
}

export function deleteNote(notes: Note[], id: string): Note[] {
  return notes.filter((n) => n.id !== id);
}

/** Title, or the first line of the body, or nothing (the UI shows "Untitled"). */
export function displayTitle(note: Note, max = 40): string {
  if (note.title) return note.title;
  const line = note.body.split(/\r?\n/).find((l) => l.trim())?.trim() ?? "";
  if (!line) return "";
  const chars = [...line];
  return chars.length > max ? chars.slice(0, max).join("").trimEnd() + "…" : line;
}

/** Picks the active note: prefs choice if it exists, else the newest. */
export function pickActive(notes: Note[], activeId?: string): Note | null {
  if (notes.length === 0) return null;
  return notes.find((n) => n.id === activeId) ?? notes[0];
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

/* ---------- backup ---------- */

export function buildBackup(notes: Note[], prefs: Prefs, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), notes, prefs };
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
  return `dictpad-${dateStamp(now)}.json`;
}

export function txtFilename(note: Note, now = new Date()): string {
  const base = (displayTitle(note, 30) || "dictpad").replace(/[\\/:*?"<>|\n\r]+/g, " ").trim() || "dictpad";
  return `${base}-${dateStamp(now)}.txt`;
}

/**
 * Reads our own shape, a bare array of notes, `{ notes | items | documents |
 * entries: [...] }`, or a single note object. Returns null only when no note
 * at all can be found.
 */
export function parseBackup(raw: unknown): Backup | null {
  let list: unknown = null;
  let o: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    o = raw as Record<string, unknown>;
    if (typeof o.app === "string" && o.app !== BACKUP_APP && !Array.isArray(o.notes)) return null;
    list = o.notes ?? o.items ?? o.documents ?? o.entries ?? o.records ?? null;
    if (list === null && o.data && typeof o.data === "object") list = (o.data as Record<string, unknown>).notes ?? null;
    if (list === null) {
      const single = normalizeNote(o);
      if (single) list = [single];
    }
  }
  if (!Array.isArray(list)) return null;
  const notes = parseNotes(list);
  if (notes.length === 0 && list.length > 0) return null;
  const prefs = parsePrefs(o.prefs ?? o.settings ?? {});
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: isoOf(o.exportedAt) ?? new Date(0).toISOString(), notes, prefs };
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
