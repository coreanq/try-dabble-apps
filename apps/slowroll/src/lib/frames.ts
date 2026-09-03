/**
 * Where the frames live: IndexedDB on this device, one Blob per frame id.
 * Nothing here ever creates an <img>, an object URL, or a canvas — that would
 * be a preview. Bytes go in at the shutter and come out only at develop time.
 */

const DB_NAME = "slowroll";
const STORE = "frames";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction(STORE, mode);
          const req = fn(tx.objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}

export function frameId(): string {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Stores the bytes of one frame. Returns false when this browser cannot keep them. */
export async function putFrame(id: string, blob: Blob): Promise<boolean> {
  const ok = await run("readwrite", (s) => s.put(blob, id));
  return ok !== null;
}

/** Only develop.ts calls this, and only once the roll's unlock moment has passed. */
export async function getFrame(id: string): Promise<Blob | null> {
  const value = await run<unknown>("readonly", (s) => s.get(id));
  return value instanceof Blob ? value : null;
}

export async function dropFrames(ids: string[]): Promise<void> {
  for (const id of ids) {
    await run("readwrite", (s) => s.delete(id));
    await run("readwrite", (s) => s.delete(`${id}:dev`));
  }
}

/** The developed print is cached beside the negative so a revisit is instant. */
export async function putDeveloped(id: string, blob: Blob): Promise<boolean> {
  const ok = await run("readwrite", (s) => s.put(blob, `${id}:dev`));
  return ok !== null;
}

export async function getDeveloped(id: string): Promise<Blob | null> {
  const value = await run<unknown>("readonly", (s) => s.get(`${id}:dev`));
  return value instanceof Blob ? value : null;
}
