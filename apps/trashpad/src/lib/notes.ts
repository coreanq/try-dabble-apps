/**
 * Trashpad storage. Everything lives in this browser's localStorage — there is
 * no server, no account and no archive.
 *
 * EXPIRY RULE (documented once, here, and repeated in the UI):
 *   a note is deleted when   Date.now() >= note.updatedAt + note.ttlMs
 * `updatedAt` is the LAST EDIT, not the creation time, so typing one more
 * character restarts the countdown from zero. Default ttl is 24 hours.
 */

export const NOTES_KEY = "trashpad:notes:v1";
export const DEFAULT_TTL_KEY = "trashpad:default-ttl:v1";

export const HOUR = 3_600_000;

/** The five presets the fail-fix asks for, in the order they are shown. */
export const TTL_PRESETS = [HOUR, 6 * HOUR, 24 * HOUR, 48 * HOUR, 7 * 24 * HOUR] as const;

export type TtlMs = (typeof TTL_PRESETS)[number];

export const DEFAULT_TTL: TtlMs = 24 * HOUR;

export const MAX_TEXT = 20_000;

export interface Note {
  id: string;
  text: string;
  /** Creation time. Kept for stable ordering only — it never drives expiry. */
  createdAt: number;
  /** Last edit. The countdown is measured from here. */
  updatedAt: number;
  ttlMs: number;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function isTtl(value: unknown): value is TtlMs {
  return typeof value === "number" && (TTL_PRESETS as readonly number[]).includes(value);
}

export function expiresAt(note: Note): number {
  return note.updatedAt + note.ttlMs;
}

export function msLeft(note: Note, now: number): number {
  return Math.max(0, expiresAt(note) - now);
}

export function isExpired(note: Note, now: number): boolean {
  return expiresAt(note) <= now;
}

/** A blank sheet is never written to storage and never expires — it is just the
 *  place the cursor lands, so the pad is typeable with zero clicks. */
export function blankNote(ttlMs: number): Note {
  const now = Date.now();
  return { id: uid(), text: "", createdAt: now, updatedAt: now, ttlMs };
}

export function hasText(note: Note): boolean {
  return note.text.trim().length > 0;
}

function normalize(raw: unknown): Note | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = typeof r.text === "string" ? r.text.slice(0, MAX_TEXT) : "";
  if (!text.trim()) return null;
  const now = Date.now();
  const updatedAt = typeof r.updatedAt === "number" ? r.updatedAt : now;
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    text,
    createdAt: typeof r.createdAt === "number" ? r.createdAt : updatedAt,
    updatedAt,
    ttlMs: isTtl(r.ttlMs) ? r.ttlMs : DEFAULT_TTL,
  };
}

/** Expired notes never come back from storage: the sweep happens on load too. */
export function loadNotes(now = Date.now()): Note[] {
  try {
    const text = localStorage.getItem(NOTES_KEY);
    if (!text) return [];
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalize)
      .filter((n): n is Note => n !== null && !isExpired(n, now));
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes.filter(hasText)));
  } catch {
    /* quota or private mode — this session still works in memory */
  }
}

export function loadDefaultTtl(): TtlMs {
  try {
    const raw = Number(localStorage.getItem(DEFAULT_TTL_KEY));
    return isTtl(raw) ? raw : DEFAULT_TTL;
  } catch {
    return DEFAULT_TTL;
  }
}

export function saveDefaultTtl(ttlMs: TtlMs): void {
  try {
    localStorage.setItem(DEFAULT_TTL_KEY, String(ttlMs));
  } catch {
    /* private mode — the default just won't stick */
  }
}

/** Newest edit on top: the sheet you are typing on stays under your thumb. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt);
}

export interface Countdown {
  d: number;
  h: number;
  m: number;
  s: number;
}

export function breakdown(ms: number): Countdown {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}
