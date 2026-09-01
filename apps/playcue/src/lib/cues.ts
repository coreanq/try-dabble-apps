/**
 * The cue list and where its audio lives.
 *
 * Names and order sit in localStorage; the audio bytes themselves go into the
 * Origin Private File System so a closed tab can be re-opened hours later and
 * still play the same show without re-picking every file. OPFS is the only
 * place a browser will hand back a real file after a reload — a File handle
 * from <input type=file> dies with the page.
 */

export type Cue = {
  id: string;
  name: string;
  type: string;
  size: number;
  /** 0 until the browser has read the header. */
  durationMs: number;
};

export const CUES_KEY = "playcue:cues:v1";
export const POS_KEY = "playcue:current:v1";
export const LOOP_KEY = "playcue:loop-one:v1";
const AUDIO_DIR = "playcue-audio";

const AUDIO_EXT = /\.(mp3|m4a|mp4|aac|wav|wave|ogg|oga|opus|flac|weba|webm)$/i;

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || AUDIO_EXT.test(file.name);
}

export function uid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** "Rehearsal cut.mp3" reads better as "Rehearsal cut" on a stage deck. */
export function cueName(fileName: string): string {
  const trimmed = fileName.replace(/\.[a-z0-9]{1,5}$/i, "").trim();
  return trimmed || fileName;
}

export function formatClock(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function loadCues(): Cue[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CUES_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((c): c is Cue => !!c && typeof c.id === "string" && typeof c.name === "string")
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: typeof c.type === "string" ? c.type : "",
        size: Number(c.size) || 0,
        durationMs: Number(c.durationMs) || 0,
      }));
  } catch {
    return [];
  }
}

export function saveCues(cues: Cue[]): void {
  try {
    localStorage.setItem(CUES_KEY, JSON.stringify(cues));
  } catch {
    /* private mode — the list just will not survive the reload */
  }
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

type OpfsDir = {
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<{
    getFile(): Promise<File>;
    createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
  }>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
};

let dirPromise: Promise<OpfsDir | null> | null = null;

function audioDir(): Promise<OpfsDir | null> {
  if (dirPromise) return dirPromise;
  dirPromise = (async () => {
    try {
      const storage = navigator.storage as unknown as {
        getDirectory?: () => Promise<{
          getDirectoryHandle(name: string, o?: { create?: boolean }): Promise<OpfsDir>;
        }>;
      };
      if (!storage?.getDirectory) return null;
      const root = await storage.getDirectory();
      return await root.getDirectoryHandle(AUDIO_DIR, { create: true });
    } catch {
      return null;
    }
  })();
  return dirPromise;
}

export async function storageAvailable(): Promise<boolean> {
  return (await audioDir()) !== null;
}

/** Copies the picked file into OPFS under the cue id. */
export async function putAudio(id: string, file: File): Promise<boolean> {
  const dir = await audioDir();
  if (!dir) return false;
  try {
    const handle = await dir.getFileHandle(id, { create: true });
    const w = await handle.createWritable();
    await w.write(file);
    await w.close();
    return true;
  } catch {
    return false;
  }
}

export async function getAudio(id: string): Promise<File | null> {
  const dir = await audioDir();
  if (!dir) return null;
  try {
    const handle = await dir.getFileHandle(id);
    return await handle.getFile();
  } catch {
    return null;
  }
}

export async function dropAudio(id: string): Promise<void> {
  const dir = await audioDir();
  if (!dir) return;
  try {
    await dir.removeEntry(id);
  } catch {
    /* already gone */
  }
}

/** Reads the header just far enough to show a runtime next to the cue. */
export function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = new Audio();
    const done = (ms: number) => {
      probe.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(ms);
    };
    probe.preload = "metadata";
    probe.onloadedmetadata = () =>
      done(Number.isFinite(probe.duration) ? Math.round(probe.duration * 1000) : 0);
    probe.onerror = () => done(0);
    window.setTimeout(() => done(0), 6000);
    probe.src = url;
  });
}

export function moveCue(cues: Cue[], id: string, delta: number): Cue[] {
  const from = cues.findIndex((c) => c.id === id);
  if (from < 0) return cues;
  const to = from + delta;
  if (to < 0 || to >= cues.length) return cues;
  const next = cues.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
