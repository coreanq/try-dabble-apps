/**
 * Ported from the pre-Vite public/app.js. Every storage key and the IndexedDB
 * name/store are unchanged, so an existing visitor's people, ideas and photos
 * survive the rewrite untouched.
 */

export const PEOPLE_KEY = "gift-stash:people:v1";
export const IDEAS_KEY = "gift-stash:ideas:v1";
export const SETTINGS_KEY = "gift-stash:settings:v1";
export const NOTIFIED_KEY = "gift-stash:notified:v1";

export const DB_NAME = "gift-stash";
export const DB_VERSION = 1;
export const DB_STORE = "photos";

/** How far ahead the upcoming strip looks. */
export const WINDOW_DAYS = 60;

export const STATUSES = ["idea", "bought", "given"] as const;
export type Status = (typeof STATUSES)[number];

/** Sentinel for "no person yet", used only by the filter strip. */
export const UNASSIGNED_FILTER = "__none__";

export interface Occasion {
  id: string;
  label: string;
  date: string;
}

export interface Person {
  id: string;
  name: string;
  birthday: string;
  notes: string;
  photoId: string | null;
  occasions: Occasion[];
  createdAt: number;
}

export interface Idea {
  id: string;
  personId: string;
  title: string;
  url: string;
  price: string;
  note: string;
  status: Status;
  photoId: string | null;
  createdAt: number;
}

export interface Settings {
  remindDays: number;
  notifyEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = { remindDays: 7, notifyEnabled: false };

export function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function clampRemindDays(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.remindDays;
  return Math.max(1, Math.min(60, n));
}

/* ------------------------------------------------------------- local store */

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T | null;
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota — the session still works, it just won't persist */
  }
}

export function loadPeople(): Person[] {
  return readJson<unknown[]>(PEOPLE_KEY, []).map(normalizePerson);
}

export function loadIdeas(): Idea[] {
  return readJson<unknown[]>(IDEAS_KEY, []).map(normalizeIdea);
}

export function loadSettings(): Settings {
  const raw = readJson<Partial<Settings>>(SETTINGS_KEY, {});
  return {
    remindDays: clampRemindDays(raw.remindDays ?? DEFAULT_SETTINGS.remindDays),
    notifyEnabled: raw.notifyEnabled === true,
  };
}

export const savePeople = (people: Person[]) => writeJson(PEOPLE_KEY, people);
export const saveIdeas = (ideas: Idea[]) => writeJson(IDEAS_KEY, ideas);
export const saveSettings = (settings: Settings) => writeJson(SETTINGS_KEY, settings);

export function loadNotified(): Record<string, number> {
  return readJson<Record<string, number>>(NOTIFIED_KEY, {});
}

export const saveNotified = (map: Record<string, number>) => writeJson(NOTIFIED_KEY, map);

/* --------------------------------------------------------------- indexeddb */

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        // Photos are raw Blobs keyed by photoId — never inlined into a record.
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(DB_STORE, "readwrite");
  tx.objectStore(DB_STORE).put(blob, id);
  return txDone(tx);
}

export async function loadPhoto(id: string | null): Promise<Blob | null> {
  if (!id) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get(id);
    return await new Promise<Blob | null>((resolve) => {
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deletePhoto(id: string | null): Promise<void> {
  if (!id) return;
  try {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    await txDone(tx);
  } catch {
    /* already gone */
  }
}

export async function putPhotos(photos: Record<string, string>): Promise<void> {
  const entries = Object.entries(photos);
  if (!entries.length) return;
  const db = await openDb();
  const tx = db.transaction(DB_STORE, "readwrite");
  for (const [id, dataUrl] of entries) {
    const blob = dataUrlToBlob(dataUrl);
    if (blob) tx.objectStore(DB_STORE).put(blob, id);
  }
  return txDone(tx);
}

/* ------------------------------------------------------------- date pieces */

export interface DatePart {
  year: number | null;
  month: number;
  day: number;
}

/** "1994-03-21", "03-21" and "3/21" — the three shapes the old app accepted. */
export function parseDatePart(input: string | null | undefined): DatePart | null {
  if (!input) return null;
  const text = String(input).trim();
  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return valid({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) });
  m = text.match(/^(\d{1,2})-(\d{1,2})$/);
  if (m) return valid({ year: null, month: Number(m[1]), day: Number(m[2]) });
  m = text.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m) return valid({ year: null, month: Number(m[1]), day: Number(m[2]) });
  return null;
}

function valid(part: DatePart): DatePart | null {
  if (part.month < 1 || part.month > 12 || part.day < 1 || part.day > 31) return null;
  return part;
}

/** This year's occurrence if it has not passed, otherwise next year's. */
export function nextOccurrence(part: DatePart, from: Date): Date {
  const year = from.getFullYear();
  const start = new Date(year, from.getMonth(), from.getDate());
  let date = new Date(year, part.month - 1, part.day);
  if (date < start) date = new Date(year + 1, part.month - 1, part.day);
  return date;
}

export function daysUntil(date: Date, from: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export interface UpcomingEntry {
  key: string;
  person: Person;
  label: string;
  date: Date;
  days: number;
  age: number | null;
}

/**
 * Birthdays and custom occasions inside the window, nearest first. A birthday
 * written with a year carries the age the person is turning.
 */
export function upcomingList(
  people: Person[],
  from: Date,
  windowDays: number,
  birthdayLabel: string,
  anniversaryLabel: string,
): UpcomingEntry[] {
  const out: UpcomingEntry[] = [];
  for (const person of people) {
    const birthday = parseDatePart(person.birthday);
    if (birthday) {
      const date = nextOccurrence(birthday, from);
      const days = daysUntil(date, from);
      if (days >= 0 && days <= windowDays) {
        out.push({
          key: `${person.id}:birthday`,
          person,
          label: birthdayLabel,
          date,
          days,
          age: birthday.year ? date.getFullYear() - birthday.year : null,
        });
      }
    }
    for (const occasion of person.occasions ?? []) {
      const part = parseDatePart(occasion.date);
      if (!part) continue;
      const date = nextOccurrence(part, from);
      const days = daysUntil(date, from);
      if (days < 0 || days > windowDays) continue;
      out.push({
        key: `${person.id}:${occasion.id}`,
        person,
        label: occasion.label || anniversaryLabel,
        date,
        days,
        age: null,
      });
    }
  }
  out.sort((a, b) => a.days - b.days || a.person.name.localeCompare(b.person.name));
  return out;
}

/* ------------------------------------------------------------ list shaping */

export interface Filters {
  person: string;
  status: string;
  query: string;
}

/** Newest first, then person / status / free-text — the old app's exact order. */
export function filterIdeas(ideas: Idea[], people: Person[], filters: Filters): Idea[] {
  let shown = ideas.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (filters.person === UNASSIGNED_FILTER) shown = shown.filter((i) => !i.personId);
  else if (filters.person) shown = shown.filter((i) => i.personId === filters.person);
  if (filters.status) shown = shown.filter((i) => (i.status || "idea") === filters.status);
  const q = filters.query.trim().toLowerCase();
  if (q) {
    shown = shown.filter((idea) => {
      const person = people.find((p) => p.id === idea.personId);
      return [idea.title, idea.note, idea.url, idea.price, person?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }
  return shown;
}

export function filterPeople(people: Person[], query: string): Person[] {
  const q = query.trim().toLowerCase();
  if (!q) return people;
  return people.filter((p) => `${p.name} ${p.notes || ""}`.toLowerCase().includes(q));
}

/* --------------------------------------------------------- export / import */

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  people: Person[];
  ideas: Idea[];
  settings: Settings;
  photos: Record<string, string>;
  photoSkipped: boolean;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  try {
    const bin = atob(m[2]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  } catch {
    return null;
  }
}

/** Photos ride along as data URLs. If any one of them cannot be read the
 *  export still goes out, just without photos — flagged by photoSkipped. */
export async function buildExport(
  people: Person[],
  ideas: Idea[],
  settings: Settings,
): Promise<ExportPayload> {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    people,
    ideas,
    settings,
    photos: {},
    photoSkipped: false,
  };
  try {
    for (const record of [...people, ...ideas]) {
      if (!record.photoId) continue;
      const blob = await loadPhoto(record.photoId);
      if (blob) payload.photos[record.photoId] = await blobToDataUrl(blob);
    }
  } catch {
    payload.photoSkipped = true;
    payload.photos = {};
  }
  return payload;
}

export interface ParsedImport {
  people: Person[];
  ideas: Idea[];
  settings: Settings | null;
  photos: Record<string, string>;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizePerson(entry: unknown): Person {
  const p = (entry ?? {}) as Record<string, unknown>;
  const occasions = Array.isArray(p.occasions) ? p.occasions : [];
  return {
    id: str(p.id) || uid(),
    name: str(p.name),
    birthday: str(p.birthday),
    notes: str(p.notes),
    photoId: str(p.photoId) || null,
    occasions: occasions
      .map((raw) => {
        const o = (raw ?? {}) as Record<string, unknown>;
        return { id: str(o.id) || uid(), label: str(o.label), date: str(o.date) };
      })
      .filter((o) => o.date),
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
  };
}

function normalizeIdea(entry: unknown): Idea {
  const i = (entry ?? {}) as Record<string, unknown>;
  return {
    id: str(i.id) || uid(),
    personId: str(i.personId),
    title: str(i.title),
    url: str(i.url),
    price: str(i.price),
    note: str(i.note),
    status: isStatus(i.status) ? i.status : "idea",
    photoId: str(i.photoId) || null,
    createdAt: typeof i.createdAt === "number" ? i.createdAt : Date.now(),
  };
}

/** Accepts anything with people and ideas arrays; every field is coerced back
 *  into the shape the app renders, so a hand-edited file cannot break the list. */
export function parseImport(raw: unknown): ParsedImport | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.people) || !Array.isArray(data.ideas)) return null;

  const photos: Record<string, string> = {};
  if (data.photos && typeof data.photos === "object") {
    for (const [id, value] of Object.entries(data.photos as Record<string, unknown>)) {
      if (typeof value === "string") photos[id] = value;
    }
  }

  const rawSettings = (data.settings ?? null) as Partial<Settings> | null;
  return {
    people: data.people.map(normalizePerson),
    ideas: data.ideas.map(normalizeIdea),
    settings: rawSettings
      ? {
          remindDays: clampRemindDays(rawSettings.remindDays ?? DEFAULT_SETTINGS.remindDays),
          notifyEnabled: rawSettings.notifyEnabled === true,
        }
      : null,
    photos,
  };
}
