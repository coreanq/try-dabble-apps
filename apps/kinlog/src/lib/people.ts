/**
 * Kinlog storage. Everything lives in THIS browser — there is no server, no
 * account, no sync and no contacts import.
 *
 * WHERE THINGS GO
 *   people      localStorage  "kinlog:people:v1"  (names, context, notes, dates)
 *   sort choice localStorage  "kinlog:sort:v1"
 *   language    localStorage  "kinlog:lang"  + the shared td_lang cookie
 *
 * EXPIRY RULE (documented once, here, and repeated in the UI):
 *   there is none. A person you are keeping up with is not a temporary note,
 *   so nothing is deleted by a clock, by an app update, or by a free-tier cap.
 *   `updatedAt` records the last edit for ordering only — it never expires
 *   anything. A person disappears only when the user deletes them, or when the
 *   browser's own "clear site data" wipes the origin.
 */

export const PEOPLE_KEY = "kinlog:people:v1";
export const SORT_KEY = "kinlog:sort:v1";
export const OPEN_KEY = "kinlog:open:v1";

/** Generous enough that nobody hits it while writing about a person. */
export const MAX_NAME = 80;
export const MAX_CONTEXT = 140;
export const MAX_NOTES = 8000;

export interface Person {
  id: string;
  /** Required. Typed by hand — the app never reads the device address book. */
  name: string;
  /** Optional "how you met / context" line. */
  context: string;
  /** Free notes. Auto-saved on every keystroke; there is no Save button. */
  notes: string;
  /** "YYYY-MM-DD" or "" when not recorded. */
  lastContact: string;
  /** "YYYY-MM-DD" or "" when no reminder is set. Never reset by the app. */
  nextContact: string;
  createdAt: number;
  /** Last edit. Ordering only — it never expires anything. */
  updatedAt: number;
}

export type SortMode = "next" | "last" | "name" | "added";

export const SORT_MODES: SortMode[] = ["next", "last", "name", "added"];

export function isSortMode(value: unknown): value is SortMode {
  return typeof value === "string" && (SORT_MODES as string[]).includes(value);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

/** Midnight local time for a YYYY-MM-DD, so day maths never crosses a zone. */
export function parseISO(iso: string): Date | null {
  if (!isISODate(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whole days from today to `iso`. Negative means the date has passed. */
export function daysUntil(iso: string, from: string = todayISO()): number | null {
  const target = parseISO(iso);
  const base = parseISO(from);
  if (!target || !base) return null;
  return Math.round((target.getTime() - base.getTime()) / 86400000);
}

export function addDays(iso: string, days: number): string {
  const base = parseISO(iso) ?? new Date();
  base.setDate(base.getDate() + days);
  return todayISO(base);
}

export function addMonths(iso: string, months: number): string {
  const base = parseISO(iso) ?? new Date();
  const day = base.getDate();
  base.setDate(1);
  base.setMonth(base.getMonth() + months);
  // Clamp: "+1 month" from the 31st lands on the last day of the short month.
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(day, lastDay));
  return todayISO(base);
}

/** A next-contact date at or before today is the thing the list surfaces. */
export function isOverdue(person: Person, today: string = todayISO()): boolean {
  const n = daysUntil(person.nextContact, today);
  return n !== null && n <= 0;
}

/* ------------------------------------------------------------------- crud */

export function newPerson(name: string, context: string): Person {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim().slice(0, MAX_NAME),
    context: context.trim().slice(0, MAX_CONTEXT),
    notes: "",
    lastContact: "",
    nextContact: "",
    createdAt: now,
    updatedAt: now,
  };
}

function normalize(raw: unknown): Person | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim().slice(0, MAX_NAME) : "";
  if (!name) return null;
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : Date.now();
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    name,
    context: typeof r.context === "string" ? r.context.slice(0, MAX_CONTEXT) : "",
    notes: typeof r.notes === "string" ? r.notes.slice(0, MAX_NOTES) : "",
    lastContact: isISODate(r.lastContact) ? r.lastContact : "",
    nextContact: isISODate(r.nextContact) ? r.nextContact : "",
    createdAt,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : createdAt,
  };
}

export function loadPeople(): Person[] {
  try {
    const text = localStorage.getItem(PEOPLE_KEY);
    if (!text) return [];
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((p): p is Person => p !== null);
  } catch {
    return [];
  }
}

export function savePeople(people: Person[]): void {
  try {
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
  } catch {
    /* quota or private mode — this session still works in memory */
  }
}

export function loadSort(): SortMode {
  try {
    const saved = localStorage.getItem(SORT_KEY);
    return isSortMode(saved) ? saved : "next";
  } catch {
    return "next";
  }
}

export function saveSort(mode: SortMode): void {
  try {
    localStorage.setItem(SORT_KEY, mode);
  } catch {
    /* private mode — the sort just falls back to next-contact next time */
  }
}

/** Which card was left open, so a reload lands you back on the same person. */
export function loadOpenId(): string | null {
  try {
    return localStorage.getItem(OPEN_KEY) || null;
  } catch {
    return null;
  }
}

export function saveOpenId(id: string | null): void {
  try {
    if (id) localStorage.setItem(OPEN_KEY, id);
    else localStorage.removeItem(OPEN_KEY);
  } catch {
    /* private mode — the list just opens collapsed */
  }
}

/* --------------------------------------------------------------- ordering */

const FAR_FUTURE = 8640000000000;

function nextKey(p: Person): number {
  const d = parseISO(p.nextContact);
  // No date set means "no plan yet" — those sink below everyone who has one,
  // rather than pretending they are due today.
  return d ? d.getTime() : FAR_FUTURE;
}

function lastKey(p: Person): number {
  const d = parseISO(p.lastContact);
  // Never contacted sorts as the longest gap of all, which is the point.
  return d ? d.getTime() : -1;
}

/**
 * "next" is the default: whoever is overdue floats to the top, then the
 * soonest upcoming, then anyone without a plan. Notes typing never reorders
 * the list — updatedAt is only the final tie-break.
 */
export function sortPeople(people: Person[], mode: SortMode): Person[] {
  const out = [...people];
  const byName = (a: Person, b: Person) => a.name.localeCompare(b.name);
  switch (mode) {
    case "next":
      out.sort((a, b) => nextKey(a) - nextKey(b) || byName(a, b));
      break;
    case "last":
      out.sort((a, b) => lastKey(a) - lastKey(b) || byName(a, b));
      break;
    case "name":
      out.sort(byName);
      break;
    case "added":
      out.sort((a, b) => b.createdAt - a.createdAt);
      break;
  }
  return out;
}

/** Substring match over name, context and notes — "what was that guy called
 *  who does the pottery?" is a note search, not a name search. */
export function matchesQuery(person: Person, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    person.name.toLowerCase().includes(q) ||
    person.context.toLowerCase().includes(q) ||
    person.notes.toLowerCase().includes(q)
  );
}

/** Thumb-tab letter for the card edge. CJK names keep their first character. */
export function tabLetter(person: Person): string {
  const ch = person.name.trim().charAt(0);
  return ch ? ch.toUpperCase() : "·";
}

/** First non-empty line of the notes, shown on the collapsed card. */
export function notesPreview(person: Person): string {
  const line = person.notes.split("\n").find((l) => l.trim().length > 0);
  return line ? line.trim() : "";
}
