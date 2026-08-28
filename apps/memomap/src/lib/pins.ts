/**
 * Memomap storage. Everything lives in THIS browser — there is no server, no
 * account and no sync.
 *
 * WHERE THINGS GO
 *   pins + memos  localStorage  "memomap:pins:v1"   (small JSON, read on boot)
 *   photos        IndexedDB     "memomap" / "photos" (one Blob per pin id)
 *   map view      localStorage  "memomap:view:v1"   (last centre + zoom)
 *
 * EXPIRY RULE (documented once, here, and repeated in the UI):
 *   there is none. A been-there pin is a memory, so nothing is deleted by a
 *   clock, by an app update, or by a photo count. `updatedAt` records the last
 *   edit for ordering only. The only thing that removes a pin is the user
 *   deleting it, or the browser's own "clear site data".
 */

export const PINS_KEY = "memomap:pins:v1";
export const VIEW_KEY = "memomap:view:v1";

export const MAX_MEMO = 500;

/** Downscale target for attached photos. Keeps IndexedDB usable on a phone
 *  without capping HOW MANY photos you may attach — that cap is the thing the
 *  store apps get wrong. */
export const PHOTO_MAX_EDGE = 1400;
export const PHOTO_QUALITY = 0.82;

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  memo: string;
  /** True when a Blob for this id exists in IndexedDB. */
  photo: boolean;
  createdAt: number;
  /** Last edit. Ordering only — it never expires anything. */
  updatedAt: number;
}

export interface MapView {
  lat: number;
  lng: number;
  zoom: number;
}

/** Seoul, wide enough to show a country. Only used before the first pin. */
export const DEFAULT_VIEW: MapView = { lat: 36.5, lng: 127.9, zoom: 6 };

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function newPin(lat: number, lng: number): Pin {
  const now = Date.now();
  return { id: uid(), lat, lng, memo: "", photo: false, createdAt: now, updatedAt: now };
}

function normalize(raw: unknown): Pin | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const lat = Number(r.lat);
  const lng = Number(r.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : Date.now();
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    lat,
    lng,
    memo: typeof r.memo === "string" ? r.memo.slice(0, MAX_MEMO) : "",
    photo: r.photo === true,
    createdAt,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : createdAt,
  };
}

export function loadPins(): Pin[] {
  try {
    const text = localStorage.getItem(PINS_KEY);
    if (!text) return [];
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((p): p is Pin => p !== null);
  } catch {
    return [];
  }
}

export function savePins(pins: Pin[]): void {
  try {
    localStorage.setItem(PINS_KEY, JSON.stringify(pins));
  } catch {
    /* quota or private mode — this session still works in memory */
  }
}

export function loadView(): MapView {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
    if (!raw || typeof raw !== "object") return DEFAULT_VIEW;
    const v = raw as Record<string, unknown>;
    const lat = Number(v.lat);
    const lng = Number(v.lng);
    const zoom = Number(v.zoom);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) {
      return DEFAULT_VIEW;
    }
    return { lat, lng, zoom: Math.min(19, Math.max(2, zoom)) };
  } catch {
    return DEFAULT_VIEW;
  }
}

export function saveView(view: MapView): void {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    /* private mode — the map just opens where it opened last time */
  }
}

/** Newest pin on top. Deliberately NOT by last edit: typing a memo must not
 *  make the entry you are looking at jump up the page. */
export function sortPins(pins: Pin[]): Pin[] {
  return [...pins].sort((a, b) => b.createdAt - a.createdAt || b.updatedAt - a.updatedAt);
}

/** Plain substring match over the memo, case-folded. That is the whole search
 *  the job needs — "where was that ramen place?". */
export function matchesQuery(pin: Pin, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return pin.memo.toLowerCase().includes(q);
}

export function formatCoords(pin: Pin): string {
  const ns = pin.lat >= 0 ? "N" : "S";
  const ew = pin.lng >= 0 ? "E" : "W";
  return `${Math.abs(pin.lat).toFixed(4)}° ${ns}, ${Math.abs(pin.lng).toFixed(4)}° ${ew}`;
}

/** First line of the memo, used as the entry's headline in the list. */
export function memoTitle(pin: Pin): string {
  const line = pin.memo.split("\n").find((l) => l.trim().length > 0);
  return line ? line.trim() : "";
}

/* ------------------------------------------------------------------ photos */

const DB_NAME = "memomap";
const DB_VERSION = 1;
const STORE = "photos";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function getPhoto(id: string): Promise<Blob | null> {
  try {
    const blob = await tx<Blob | undefined>("readonly", (s) => s.get(id));
    return blob instanceof Blob ? blob : null;
  } catch {
    return null;
  }
}

export async function putPhoto(id: string, blob: Blob): Promise<void> {
  await tx("readwrite", (s) => s.put(blob, id));
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {
    /* nothing stored for this pin */
  }
}

/**
 * Re-encode a picked file so a 12MP phone shot does not eat the whole origin
 * quota. Falls back to the original file if the canvas path is unavailable.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY),
    );
    return out && out.size > 0 ? out : file;
  } catch {
    return file;
  }
}
