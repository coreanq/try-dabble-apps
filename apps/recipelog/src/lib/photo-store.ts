/**
 * Photos are the heavy part of a recipe, so they live in an IndexedDB store
 * keyed by recipe id while the light JSON list stays in localStorage. When
 * IndexedDB is missing (old WebView, locked-down private mode) the data URL
 * simply rides along inside the localStorage list instead.
 */
const DB_NAME = "recipelog-photos";
const STORE = "photos";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const t = db.transaction(STORE, mode);
          const req = run(t.objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
          t.oncomplete = () => db.close();
        } catch {
          resolve(null);
        }
      }),
  );
}

export async function putPhoto(id: string, dataUrl: string): Promise<boolean> {
  const r = await tx("readwrite", (s) => s.put(dataUrl, id));
  return r !== null;
}

export async function deletePhoto(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function clearPhotos(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}

/** Every stored photo as id → data URL. Empty map when IndexedDB is unavailable. */
export async function loadAllPhotos(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const db = await openDb();
  if (!db) return out;
  return new Promise((resolve) => {
    try {
      const t = db.transaction(STORE, "readonly");
      const store = t.objectStore(STORE);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return;
        if (typeof cur.key === "string" && typeof cur.value === "string") out.set(cur.key, cur.value);
        cur.continue();
      };
      req.onerror = () => resolve(out);
      t.oncomplete = () => {
        db.close();
        resolve(out);
      };
      t.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}
