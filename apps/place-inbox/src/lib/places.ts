/**
 * Ported from the pre-Vite public/app.js. The IndexedDB name and version and
 * the settings key are unchanged, so an existing visitor's places, trips and
 * photos survive the rewrite untouched.
 */

export const DB_NAME = "place-inbox";
export const DB_VERSION = 1;
export const SETTINGS_KEY = "place-inbox:settings:v1";

export const TAGS = ["food", "hike", "city", "beach", "stay"] as const;
export type Tag = (typeof TAGS)[number];

export const RANKS = [5, 4, 3, 2, 1] as const;
export type Rank = 1 | 2 | 3 | 4 | 5;

/** Sentinel for "no trip yet", used only by the filter strip. */
export const INBOX_FILTER = "__inbox__";

export interface Place {
  id: string;
  name: string;
  url: string;
  why: string;
  rank: Rank;
  tags: Tag[];
  tripId: string;
  mapsUrl: string;
  igUrl: string;
  pinterestUrl: string;
  lat: number | null;
  lng: number | null;
  photoId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: number;
}

export interface Settings {
  filterTrip: string;
  filterTag: string;
  filterRank: string;
}

export const DEFAULT_SETTINGS: Settings = { filterTrip: "", filterTag: "", filterRank: "" };

export function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function clampRank(value: unknown): Rank {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, n)) as Rank;
}

export function isTag(value: unknown): value is Tag {
  return typeof value === "string" && (TAGS as readonly string[]).includes(value);
}

/** "35.665, 139.770" — a comma or a space, and never geocoded for the user. */
export function parseLatLng(input: string): { lat: number | null; lng: number | null } {
  const m = String(input ?? "")
    .trim()
    .match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return { lat: null, lng: null };
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { lat: null, lng: null };
  return { lat, lng };
}

export function formatLatLng(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return "";
  return `${lat}, ${lng}`;
}

export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^www\./i.test(value);
}

export function normalizeUrl(value: string): string {
  const text = value.trim();
  if (!text) return "";
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

/* ---------------------------------------------------------------- settings */

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings> | null;
    return { ...DEFAULT_SETTINGS, ...(parsed ?? {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* private mode — filters just won't stick */
  }
}

/* --------------------------------------------------------------- indexeddb */

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("places")) {
          db.createObjectStore("places", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("trips")) {
          db.createObjectStore("trips", { keyPath: "id" });
        }
        // Photos are raw Blobs keyed by photoId — never inlined into a record.
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos");
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

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(store: string, value: unknown, key?: IDBValidKey): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, "readwrite");
  if (key === undefined) tx.objectStore(store).put(value);
  else tx.objectStore(store).put(value, key);
  return txDone(tx);
}

async function remove(store: string, key: IDBValidKey): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(key);
  return txDone(tx);
}

export async function loadAll(): Promise<{ places: Place[]; trips: Trip[] }> {
  try {
    const db = await openDb();
    const tx = db.transaction(["places", "trips"], "readonly");
    const places = await request<Place[]>(tx.objectStore("places").getAll());
    const trips = await request<Trip[]>(tx.objectStore("trips").getAll());
    return { places: places ?? [], trips: trips ?? [] };
  } catch {
    return { places: [], trips: [] };
  }
}

export const savePlace = (place: Place) => put("places", place);
export const saveTrip = (trip: Trip) => put("trips", trip);
export const deletePlace = (id: string) => remove("places", id);
export const deleteTrip = (id: string) => remove("trips", id);

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  await put("photos", blob, id);
}

export async function loadPhoto(id: string | null): Promise<Blob | null> {
  if (!id) return null;
  try {
    const db = await openDb();
    const tx = db.transaction("photos", "readonly");
    return (await request<Blob | undefined>(tx.objectStore("photos").get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function deletePhoto(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await remove("photos", id);
  } catch {
    /* already gone */
  }
}

/* ------------------------------------------------------------ list shaping */

export function tripNameOf(trips: Trip[], id: string, inboxLabel: string): string {
  if (!id) return inboxLabel;
  return trips.find((t) => t.id === id)?.name ?? inboxLabel;
}

export interface Filters {
  trip: string;
  tag: string;
  rank: string;
  query: string;
}

/** Rank first, then most recently touched — the old app's exact order. */
export function sortByRank(places: Place[]): Place[] {
  return places
    .slice()
    .sort((a, b) => (b.rank || 0) - (a.rank || 0) || (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function filterPlaces(
  places: Place[],
  trips: Trip[],
  filters: Filters,
  inboxLabel: string,
): Place[] {
  let shown = sortByRank(places);
  if (filters.trip === INBOX_FILTER) shown = shown.filter((p) => !p.tripId);
  else if (filters.trip) shown = shown.filter((p) => p.tripId === filters.trip);
  if (filters.tag) shown = shown.filter((p) => (p.tags || []).includes(filters.tag as Tag));
  if (filters.rank) shown = shown.filter((p) => String(p.rank) === filters.rank);
  const q = filters.query.trim().toLowerCase();
  if (q) {
    shown = shown.filter((p) =>
      [
        p.name,
        p.why,
        p.url,
        p.mapsUrl,
        p.igUrl,
        p.pinterestUrl,
        tripNameOf(trips, p.tripId, inboxLabel),
        (p.tags || []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return shown;
}

/* --------------------------------------------------------- export / import */

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  places: Place[];
  trips: Trip[];
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

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Photos ride along as data URLs. If any one of them cannot be read the
 *  export still goes out, just without photos — flagged by photoSkipped. */
export async function buildExport(places: Place[], trips: Trip[]): Promise<ExportPayload> {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    places,
    trips,
    photos: {},
    photoSkipped: false,
  };
  try {
    for (const place of places) {
      if (!place.photoId) continue;
      const blob = await loadPhoto(place.photoId);
      if (blob) payload.photos[place.photoId] = await blobToDataUrl(blob);
    }
  } catch {
    payload.photoSkipped = true;
    payload.photos = {};
  }
  return payload;
}

export interface ParsedImport {
  places: Place[];
  trips: Trip[];
  photos: Record<string, string>;
}

/** Accepts anything with a places array; every field is coerced back into the
 *  shape the app renders, so a hand-edited file cannot break the list. */
export function parseImport(raw: unknown): ParsedImport | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.places)) return null;

  const now = Date.now();
  const places: Place[] = data.places.map((entry) => {
    const p = (entry ?? {}) as Record<string, unknown>;
    const lat = typeof p.lat === "number" && Number.isFinite(p.lat) ? p.lat : null;
    const lng = typeof p.lng === "number" && Number.isFinite(p.lng) ? p.lng : null;
    return {
      id: typeof p.id === "string" && p.id ? p.id : uid(),
      name: typeof p.name === "string" ? p.name : "",
      url: typeof p.url === "string" ? p.url : "",
      why: typeof p.why === "string" ? p.why : "",
      rank: clampRank(p.rank),
      tags: Array.isArray(p.tags) ? p.tags.filter(isTag) : [],
      tripId: typeof p.tripId === "string" ? p.tripId : "",
      mapsUrl: typeof p.mapsUrl === "string" ? p.mapsUrl : "",
      igUrl: typeof p.igUrl === "string" ? p.igUrl : "",
      pinterestUrl: typeof p.pinterestUrl === "string" ? p.pinterestUrl : "",
      lat: lat != null && lng != null ? lat : null,
      lng: lat != null && lng != null ? lng : null,
      photoId: typeof p.photoId === "string" && p.photoId ? p.photoId : null,
      createdAt: typeof p.createdAt === "number" ? p.createdAt : now,
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : now,
    };
  });

  const trips: Trip[] = Array.isArray(data.trips)
    ? data.trips
        .map((entry) => {
          const t = (entry ?? {}) as Record<string, unknown>;
          return {
            id: typeof t.id === "string" && t.id ? t.id : uid(),
            name: typeof t.name === "string" ? t.name : "",
            createdAt: typeof t.createdAt === "number" ? t.createdAt : now,
          };
        })
        .filter((t) => t.name)
    : [];

  const photos: Record<string, string> = {};
  if (data.photos && typeof data.photos === "object") {
    for (const [id, value] of Object.entries(data.photos as Record<string, unknown>)) {
      if (typeof value === "string") photos[id] = value;
    }
  }

  return { places, trips, photos };
}

/** Replaces every store in one transaction, the way the old app did. */
export async function replaceAll(parsed: ParsedImport): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["places", "trips", "photos"], "readwrite");
  tx.objectStore("places").clear();
  tx.objectStore("trips").clear();
  parsed.places.forEach((p) => tx.objectStore("places").put(p));
  parsed.trips.forEach((t) => tx.objectStore("trips").put(t));
  for (const [id, dataUrl] of Object.entries(parsed.photos)) {
    const blob = dataUrlToBlob(dataUrl);
    if (blob) tx.objectStore("photos").put(blob, id);
  }
  return txDone(tx);
}
