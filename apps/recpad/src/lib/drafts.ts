/**
 * Drafts live in this browser's own database on this device. The audio is
 * stored as the same 16-bit WAV bytes the Download button writes, so a
 * draft never needs a decoder the browser might lack. Nothing here has a
 * network path; the only way a draft leaves the device is a download the
 * user asks for.
 */
import { decodeWav, encodeWav, mixToMono } from "./audio.ts";

export const DB_NAME = "recpad";
export const STORE = "recpad-drafts";
const VERSION = 1;

export interface DraftMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  durationMs: number;
  sampleRate: number;
  channels: number;
}

export interface DraftRecord extends DraftMeta {
  wav: ArrayBuffer;
}

export function draftsSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("blocked"));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
        t.onabort = () => {
          db.close();
          reject(t.error);
        };
      }),
  );
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Newest first. Audio bytes are stripped so a long list stays cheap to render. */
export async function listDrafts(): Promise<DraftMeta[]> {
  const all = await tx<DraftRecord[]>("readonly", (s) => s.getAll());
  return all
    .map(({ wav: _wav, ...meta }) => meta)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getDraft(id: string): Promise<{ meta: DraftMeta; samples: Float32Array; sampleRate: number } | null> {
  const rec = await tx<DraftRecord | undefined>("readonly", (s) => s.get(id));
  if (!rec) return null;
  const { wav, ...meta } = rec;
  const decoded = decodeWav(wav);
  return { meta, samples: mixToMono(decoded.channels), sampleRate: decoded.sampleRate };
}

export async function saveDraft(name: string, samples: Float32Array, sampleRate: number, existingId?: string): Promise<DraftMeta> {
  const now = Date.now();
  const prev = existingId ? await tx<DraftRecord | undefined>("readonly", (s) => s.get(existingId)) : undefined;
  const meta: DraftMeta = {
    id: prev?.id ?? existingId ?? newId(),
    name: name.trim() || defaultDraftName(now),
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    durationMs: (samples.length / sampleRate) * 1000,
    sampleRate,
    channels: 1,
  };
  const rec: DraftRecord = { ...meta, wav: encodeWav([samples], sampleRate) };
  await tx("readwrite", (s) => s.put(rec));
  return meta;
}

export async function renameDraft(id: string, name: string): Promise<void> {
  const rec = await tx<DraftRecord | undefined>("readonly", (s) => s.get(id));
  if (!rec) return;
  rec.name = name.trim() || rec.name;
  rec.updatedAt = Date.now();
  await tx("readwrite", (s) => s.put(rec));
}

export async function deleteDraft(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function clearDrafts(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}

export function defaultDraftName(at: number = Date.now()): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `take-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
