/**
 * Storage ported from the pre-Vite public/app.js, keys unchanged so an
 * existing device keeps its boxes: IndexedDB `box-qr` store `boxes` holds the
 * records (photos included, no cap), localStorage `box-qr:boxes:v1` mirrors
 * them as a fallback for browsers that refuse IndexedDB. Nothing leaves the
 * device.
 */

export const LS_KEY = "box-qr:boxes:v1";
export const DB_NAME = "box-qr";
export const STORE = "boxes";

export interface Photo {
  id: string;
  dataUrl: string;
}

export interface Box {
  id: string;
  number: number;
  room: string;
  items: string;
  photos: Photo[];
  createdAt: number;
  updatedAt: number;
}

export function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `b_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function padNum(n: number): string {
  return String(n).padStart(2, "0");
}

/** One item per line, trimmed, blanks dropped — the old itemLines(). */
export function itemLines(text: string): string[] {
  return String(text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function byNumber(a: Box, b: Box): number {
  return (a.number || 0) - (b.number || 0) || String(a.createdAt).localeCompare(String(b.createdAt));
}

export function nextNumber(boxes: Box[]): number {
  let max = 0;
  for (const b of boxes) if (b.number > max) max = b.number;
  return max + 1;
}

/** Search hits item text, room and box number; every token must match. */
export function matchesQuery(box: Box, query: string): boolean {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const hay = [
    String(box.number || ""),
    box.room || "",
    itemLines(box.items).join(" "),
    box.items || "",
  ]
    .join("\n")
    .toLowerCase();
  return q.split(/\s+/).every((token) => hay.includes(token));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("no idb"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(): Promise<Box[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as Box[]) || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(box: Box): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(box);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbReplaceAll(list: Box[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    for (const box of list) store.put(box);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function normalize(raw: unknown, index: number): Box {
  const b = (raw ?? {}) as Partial<Box> & { photos?: unknown };
  const photos = Array.isArray(b.photos)
    ? (b.photos as Partial<Photo>[])
        .filter((p): p is Photo => !!p && typeof p.dataUrl === "string" && p.dataUrl !== "")
        .map((p) => ({ id: p.id || uid(), dataUrl: p.dataUrl }))
    : [];
  return {
    id: b.id || uid(),
    number: Number(b.number) || index + 1,
    room: String(b.room ?? ""),
    items: String(b.items ?? ""),
    photos,
    createdAt: Number(b.createdAt) || Date.now(),
    updatedAt: Number(b.updatedAt) || Date.now(),
  };
}

/** Strips anything an older build may have written alongside the real fields. */
export function metaOnly(b: Box): Box {
  return {
    id: b.id,
    number: b.number,
    room: b.room,
    items: b.items,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    photos: (b.photos || []).map((p) => ({ id: p.id, dataUrl: p.dataUrl })),
  };
}

function lsLoad(): Box[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

/** Photos blow through the ~5MB quota fast; IndexedDB is the real store, so a
 *  failed mirror drops the key rather than leaving a truncated copy behind. */
export function lsSave(list: Box[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.map(metaOnly)));
  } catch {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* nothing else to try */
    }
  }
}

/** IndexedDB first; a localStorage-only device is migrated into it on sight. */
export async function loadBoxes(): Promise<Box[]> {
  try {
    const fromIdb = await idbGetAll();
    if (fromIdb.length) return fromIdb.map(normalize).sort(byNumber);
    const fromLs = lsLoad();
    if (fromLs.length) {
      try {
        await idbReplaceAll(fromLs);
      } catch {
        /* stay on the localStorage copy */
      }
      return fromLs.sort(byNumber);
    }
    return [];
  } catch {
    return lsLoad().sort(byNumber);
  }
}

export async function saveBox(box: Box): Promise<void> {
  try {
    await idbPut(box);
  } catch {
    /* localStorage mirror still gets it */
  }
}

export async function deleteBox(id: string): Promise<void> {
  try {
    await idbDelete(id);
  } catch {
    /* localStorage mirror still gets it */
  }
}

export async function replaceAll(list: Box[]): Promise<void> {
  try {
    await idbReplaceAll(list);
  } catch {
    /* localStorage mirror still gets it */
  }
}

/** Long side capped at 1280px and re-encoded as JPEG so a phone camera roll
 *  does not fill the device — but the photo count itself is never capped. */
export function compressImage(file: File): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1280;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > max || h > max) {
        const r = Math.min(max / w, max / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      } catch {
        dataUrl = canvas.toDataURL("image/png");
      }
      resolve({ id: uid(), dataUrl });
    };
    /* HEIC and anything else the canvas cannot decode is stored as-is. */
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve({ id: uid(), dataUrl: String(reader.result || "") });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

export function isImageFile(file: File): boolean {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name || "");
}

export async function filesToPhotos(files: FileList | File[] | null): Promise<Photo[]> {
  const out: Photo[] = [];
  for (const file of Array.from(files || []).filter(isImageFile)) {
    try {
      const photo = await compressImage(file);
      if (photo.dataUrl) out.push(photo);
    } catch {
      /* skip the one file, keep the rest */
    }
  }
  return out;
}

export function exportJson(boxes: Box[]): void {
  const blob = new Blob([JSON.stringify({ v: 1, boxes: boxes.map(metaOnly) }, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "box-qr.json";
  a.click();
  URL.revokeObjectURL(href);
}

/** Accepts both shapes the app has ever written: a bare array or { boxes }. */
export function parseImport(text: string): Box[] {
  const parsed: unknown = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray((parsed as { boxes?: unknown }).boxes)
      ? ((parsed as { boxes: unknown[] }).boxes)
      : null;
  if (!list) throw new Error("shape");
  return list.map((raw, i) => ({ ...normalize(raw, i), updatedAt: Date.now() }));
}

/** Incoming records win on id collision; the rest of the shelf is untouched. */
export function mergeBoxes(current: Box[], incoming: Box[]): Box[] {
  const byId = new Map(current.map((b) => [b.id, b]));
  for (const b of incoming) byId.set(b.id, b);
  return Array.from(byId.values()).sort(byNumber);
}

/** The URL the QR encodes: /?box=<id>&lang=<lang> on this origin. */
export function boxUrl(box: Box, lang: string): string {
  const u = new URL("/", window.location.origin);
  u.searchParams.set("box", box.id);
  u.searchParams.set("lang", lang);
  return u.toString();
}
