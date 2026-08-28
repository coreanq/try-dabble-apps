/**
 * Lastloved storage. Everything lives in THIS browser — no account, no
 * streaming service, no audio files, no server.
 *
 * WHERE THINGS GO
 *   songs         localStorage  "lastloved:songs:v1"  (title, artist, date, N)
 *   default years localStorage  "lastloved:years:v1"
 *   language      localStorage  "lastloved:lang"  + the shared td_lang cookie
 *
 * EXPIRY RULE (documented once, here, and repeated in the UI):
 *   nothing expires. `years` is when a song COMES BACK, never when it is
 *   deleted — a song that is due just moves to the top list and waits there
 *   until you play it again. `updatedAt` records the last edit for ordering
 *   only. An entry disappears only when the user deletes it, or when the
 *   browser's own "clear site data" wipes the origin. Closing the tab, closing
 *   the browser, or coming back in three years all keep the shelf intact.
 */

export const SONGS_KEY = "lastloved:songs:v1";
export const YEARS_KEY = "lastloved:years:v1";

/** Generous enough that a long title with a featured artist still fits. */
export const MAX_TITLE = 160;
export const MAX_ARTIST = 160;

/** The wait presets. Anything from 1 to 50 is allowed by hand. */
export const YEAR_PRESETS = [1, 2, 3, 5, 10] as const;
export const MIN_YEARS = 1;
export const MAX_YEARS = 50;
export const DEFAULT_YEARS = 1;

export interface Song {
  id: string;
  /** Required. Typed by hand — the app never reads a music library. */
  title: string;
  /** Required. Title and artist is the whole identity of a song here. */
  artist: string;
  /** "YYYY-MM-DD" — the day you last loved it. Defaults to today, editable. */
  lastLoved: string;
  /** Whole years until it comes back. */
  years: number;
  /** How many times it has already come back and been loved again. */
  returns: number;
  createdAt: number;
  /** Last edit. Ordering tie-break only — it never expires anything. */
  updatedAt: number;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function clampYears(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_YEARS;
  return Math.min(MAX_YEARS, Math.max(MIN_YEARS, n));
}

/* ------------------------------------------------------------------ dates */

/** Local calendar day as YYYY-MM-DD. Deliberately not toISOString(), which
 *  would shift the date for anyone east or west of UTC. */
export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Midnight local time for a YYYY-MM-DD, so year maths never crosses a zone. */
export function parseISO(iso: string): Date | null {
  if (!isISODate(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whole days from `from` to `iso`. Negative means the date has passed. */
export function daysUntil(iso: string, from: string = todayISO()): number | null {
  const target = parseISO(iso);
  const base = parseISO(from);
  if (!target || !base) return null;
  return Math.round((target.getTime() - base.getTime()) / 86400000);
}

function addYearsToDate(date: Date, years: number): Date {
  const out = new Date(date.getTime());
  const day = out.getDate();
  out.setDate(1);
  out.setFullYear(out.getFullYear() + years);
  // Feb 29 + 1 year lands on Feb 28, not March 1.
  const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate();
  out.setDate(Math.min(day, lastDay));
  return out;
}

export function addYears(iso: string, years: number): string {
  const base = parseISO(iso);
  if (!base) return iso;
  return todayISO(addYearsToDate(base, years));
}

/** The day this song comes back around. */
export function returnsOn(song: Song): string {
  return addYears(song.lastLoved, song.years);
}

/** The year stamped on the stub. */
export function returnYear(song: Song): string {
  return returnsOn(song).slice(0, 4);
}

/** Due = the wait is over. Today counts as due: it is back. */
export function isDue(song: Song, today: string = todayISO()): boolean {
  const n = daysUntil(returnsOn(song), today);
  return n !== null && n <= 0;
}

/**
 * Calendar-accurate "N years and M days left". Counting whole years by
 * advancing the cursor keeps a 10-year wait from drifting by the leap days.
 */
export function untilParts(
  iso: string,
  from: string = todayISO(),
): { years: number; days: number } | null {
  const target = parseISO(iso);
  const base = parseISO(from);
  if (!target || !base) return null;
  if (target.getTime() <= base.getTime()) return { years: 0, days: 0 };
  let years = 0;
  let cursor = base;
  for (;;) {
    const next = addYearsToDate(cursor, 1);
    if (next.getTime() > target.getTime()) break;
    cursor = next;
    years += 1;
  }
  return {
    years,
    days: Math.round((target.getTime() - cursor.getTime()) / 86400000),
  };
}

/* ------------------------------------------------------------------- crud */

export function newSong(
  title: string,
  artist: string,
  lastLoved: string,
  years: number,
): Song {
  const now = Date.now();
  return {
    id: uid(),
    title: title.trim().slice(0, MAX_TITLE),
    artist: artist.trim().slice(0, MAX_ARTIST),
    lastLoved: isISODate(lastLoved) ? lastLoved : todayISO(),
    years: clampYears(years),
    returns: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/** Heard it again today: the clock is wound back to zero from today. */
export function lovedAgain(song: Song, today: string = todayISO()): Song {
  return {
    ...song,
    lastLoved: today,
    returns: song.returns + 1,
    updatedAt: Date.now(),
  };
}

function normalize(raw: unknown): Song | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title.trim().slice(0, MAX_TITLE) : "";
  const artist = typeof r.artist === "string" ? r.artist.trim().slice(0, MAX_ARTIST) : "";
  // Title and artist are both required — a half-written row is dropped rather
  // than shown as a blank stub.
  if (!title || !artist) return null;
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : Date.now();
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    title,
    artist,
    lastLoved: isISODate(r.lastLoved) ? r.lastLoved : todayISO(),
    years: clampYears(r.years),
    returns: typeof r.returns === "number" && r.returns > 0 ? Math.floor(r.returns) : 0,
    createdAt,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : createdAt,
  };
}

export function loadSongs(): Song[] {
  try {
    const text = localStorage.getItem(SONGS_KEY);
    if (!text) return [];
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((s): s is Song => s !== null);
  } catch {
    return [];
  }
}

export function saveSongs(songs: Song[]): void {
  try {
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
  } catch {
    /* quota or private mode — this session still works in memory */
  }
}

export function loadDefaultYears(): number {
  try {
    const saved = localStorage.getItem(YEARS_KEY);
    return saved === null ? DEFAULT_YEARS : clampYears(saved);
  } catch {
    return DEFAULT_YEARS;
  }
}

export function saveDefaultYears(years: number): void {
  try {
    localStorage.setItem(YEARS_KEY, String(clampYears(years)));
  } catch {
    /* private mode — the default just falls back to 1 year next time */
  }
}

/* --------------------------------------------------------------- ordering */

function returnKey(song: Song): number {
  return parseISO(returnsOn(song))?.getTime() ?? 0;
}

/** Due songs: the one that has been waiting longest is first. Waiting songs:
 *  the one coming back soonest is first. Editing never reshuffles the list
 *  under your finger — updatedAt is only the final tie-break. */
export function sortSongs(songs: Song[]): Song[] {
  return [...songs].sort(
    (a, b) => returnKey(a) - returnKey(b) || a.title.localeCompare(b.title),
  );
}

/** Substring match over title and artist. That is the whole index. */
export function matchesQuery(song: Song, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q);
}
