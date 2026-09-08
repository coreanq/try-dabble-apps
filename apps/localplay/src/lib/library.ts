/**
 * The library and where its audio lives.
 *
 * Track metadata, playlists, the queue, prefs and the recent list sit in
 * localStorage under localplay:* keys. The audio bytes themselves go into the
 * Origin Private File System (directory "localplay-audio", one file per track
 * id) so a closed tab can be re-opened days later and still play the same
 * songs without re-picking. A File handle from <input type=file> dies with
 * the page; OPFS is the only place a browser hands back a real file after a
 * reload. Nothing here talks to a server.
 */

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** Seconds. 0 until the browser has read the header. */
  duration?: number;
  favorite?: boolean;
  addedAt: number;
  lastPlayedAt?: number;
  /** Name of the file inside the OPFS audio directory (equals the id). */
  opfsKey: string;
  fileName: string;
  /** Bytes, used to recognise the same file again when relinking. */
  size?: number;
};

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type RepeatMode = "off" | "all" | "one";

export type QueueState = {
  trackIds: string[];
  index: number;
  shuffle: boolean;
  repeat: RepeatMode;
  /** Un-shuffled order, kept so turning shuffle off restores it. */
  baseIds?: string[];
};

export type View = "tracks" | "albums" | "artists" | "playlists" | "favorites" | "recent";

export type EqBands = [number, number, number];

export type Prefs = {
  speed: number;
  eqBands: EqBands;
  view?: View;
};

export const TRACKS_KEY = "localplay:tracks:v1";
export const PLAYLISTS_KEY = "localplay:playlists:v1";
export const QUEUE_KEY = "localplay:queue:v1";
export const PREFS_KEY = "localplay:prefs:v1";
export const RECENT_KEY = "localplay:recent:v1";
export const RECENT_CAP = 50;
const AUDIO_DIR = "localplay-audio";

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const DEFAULT_PREFS: Prefs = { speed: 1, eqBands: [0, 0, 0] };
export const EMPTY_QUEUE: QueueState = { trackIds: [], index: -1, shuffle: false, repeat: "off" };

const AUDIO_EXT = /\.(mp3|m4a|mp4|aac|wav|wave|ogg|oga|opus|flac|weba|webm|aif|aiff)$/i;

export function isAudioFile(file: { type: string; name: string }): boolean {
  return file.type.startsWith("audio/") || AUDIO_EXT.test(file.name);
}

export function uid(): string {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/* ---------- localStorage ---------- */

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full — the session still works, it just will not stick */
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Accepts anything shaped like a track and returns a clean one, or null. */
export function normalizeTrack(raw: unknown): Track | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  if (!id) return null;
  const fileName = str(r.fileName);
  const title = str(r.title).trim() || titleFromFileName(fileName) || id;
  const track: Track = {
    id,
    title,
    artist: str(r.artist).trim(),
    album: str(r.album).trim(),
    addedAt: num(r.addedAt) ?? Date.now(),
    opfsKey: str(r.opfsKey) || id,
    fileName,
  };
  const duration = num(r.duration);
  if (duration && duration > 0) track.duration = duration;
  if (r.favorite === true) track.favorite = true;
  const last = num(r.lastPlayedAt);
  if (last) track.lastPlayedAt = last;
  const size = num(r.size);
  if (size && size > 0) track.size = size;
  return track;
}

export function normalizePlaylist(raw: unknown, knownIds?: Set<string>): Playlist | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const name = str(r.name).trim();
  if (!id || !name) return null;
  const ids = Array.isArray(r.trackIds)
    ? r.trackIds.filter((t): t is string => typeof t === "string" && (!knownIds || knownIds.has(t)))
    : [];
  const now = Date.now();
  return {
    id,
    name,
    trackIds: ids,
    createdAt: num(r.createdAt) ?? now,
    updatedAt: num(r.updatedAt) ?? now,
  };
}

export function loadTracks(): Track[] {
  const raw = readJson<unknown>(TRACKS_KEY);
  if (!Array.isArray(raw)) return [];
  const out: Track[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const t = normalizeTrack(row);
    if (t && !seen.has(t.id)) {
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}

export function saveTracks(tracks: Track[]): void {
  writeJson(TRACKS_KEY, tracks);
}

export function loadPlaylists(knownIds?: Set<string>): Playlist[] {
  const raw = readJson<unknown>(PLAYLISTS_KEY);
  if (!Array.isArray(raw)) return [];
  const out: Playlist[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const p = normalizePlaylist(row, knownIds);
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export function savePlaylists(playlists: Playlist[]): void {
  writeJson(PLAYLISTS_KEY, playlists);
}

export function loadQueue(knownIds: Set<string>): QueueState {
  const raw = readJson<Partial<QueueState>>(QUEUE_KEY);
  if (!raw || typeof raw !== "object") return EMPTY_QUEUE;
  const trackIds = Array.isArray(raw.trackIds)
    ? raw.trackIds.filter((t): t is string => typeof t === "string" && knownIds.has(t))
    : [];
  const baseIds = Array.isArray(raw.baseIds)
    ? raw.baseIds.filter((t): t is string => typeof t === "string" && knownIds.has(t))
    : undefined;
  const idx = num(raw.index) ?? -1;
  return {
    trackIds,
    index: trackIds.length === 0 ? -1 : Math.min(Math.max(0, Math.floor(idx)), trackIds.length - 1),
    shuffle: raw.shuffle === true,
    repeat: raw.repeat === "all" || raw.repeat === "one" ? raw.repeat : "off",
    baseIds: baseIds && baseIds.length > 0 ? baseIds : undefined,
  };
}

export function saveQueue(queue: QueueState): void {
  writeJson(QUEUE_KEY, queue);
}

export function clampDb(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
  return Math.max(-12, Math.min(12, Math.round(n)));
}

export function loadPrefs(): Prefs {
  const raw = readJson<Partial<Prefs>>(PREFS_KEY);
  if (!raw || typeof raw !== "object") return DEFAULT_PREFS;
  const speed = (SPEEDS as readonly number[]).includes(raw.speed as number) ? (raw.speed as number) : 1;
  const bands = Array.isArray(raw.eqBands) ? raw.eqBands : [];
  const eqBands: EqBands = [clampDb(bands[0]), clampDb(bands[1]), clampDb(bands[2])];
  const views: View[] = ["tracks", "albums", "artists", "playlists", "favorites", "recent"];
  const view = views.includes(raw.view as View) ? (raw.view as View) : undefined;
  return { speed, eqBands, view };
}

export function savePrefs(prefs: Prefs): void {
  writeJson(PREFS_KEY, prefs);
}

export function loadRecent(knownIds: Set<string>): string[] {
  const raw = readJson<unknown>(RECENT_KEY);
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id === "string" && knownIds.has(id) && !out.includes(id)) out.push(id);
    if (out.length >= RECENT_CAP) break;
  }
  return out;
}

export function saveRecent(ids: string[]): void {
  writeJson(RECENT_KEY, ids.slice(0, RECENT_CAP));
}

export function pushRecent(recent: string[], id: string): string[] {
  return [id, ...recent.filter((r) => r !== id)].slice(0, RECENT_CAP);
}

/* ---------- names ---------- */

/** "01 - Artist - Song.mp3" reads better as "Song" on a list. */
export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/^.*[\\/]/, "").replace(/\.[a-z0-9]{1,5}$/i, "").trim();
  return base;
}

/**
 * Filename fallback when tags are absent: "Artist - Title" and a leading
 * track number are the two conventions worth recognising.
 */
export function guessFromFileName(fileName: string): { title: string; artist: string } {
  let base = titleFromFileName(fileName);
  base = base.replace(/^\s*\d{1,3}(?:\s*[-._)]\s*|\s+)/, "").trim();
  const dash = base.split(/\s+-\s+/);
  if (dash.length >= 2) {
    const artist = dash[0].trim();
    const title = dash.slice(1).join(" - ").trim();
    if (artist && title) return { title, artist };
  }
  return { title: base || fileName, artist: "" };
}

/* ---------- OPFS ---------- */

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

/**
 * Browsers without OPFS (older Safari, some private windows) keep the picked
 * File objects in memory for this session so the app still plays; the UI says
 * so out loud, because those tracks will come back as missing after a reload.
 */
const sessionFiles = new Map<string, File>();

export async function storageAvailable(): Promise<boolean> {
  return (await audioDir()) !== null;
}

/** Copies the picked file into OPFS under the track's key. */
export async function putAudio(key: string, file: File): Promise<boolean> {
  const dir = await audioDir();
  if (!dir) {
    sessionFiles.set(key, file);
    return true;
  }
  try {
    const handle = await dir.getFileHandle(key, { create: true });
    const w = await handle.createWritable();
    await w.write(file);
    await w.close();
    return true;
  } catch {
    return false;
  }
}

export async function getAudio(key: string): Promise<File | null> {
  const dir = await audioDir();
  if (!dir) return sessionFiles.get(key) ?? null;
  try {
    const handle = await dir.getFileHandle(key);
    return await handle.getFile();
  } catch {
    return null;
  }
}

export async function hasAudio(key: string): Promise<boolean> {
  return (await getAudio(key)) !== null;
}

export async function dropAudio(key: string): Promise<void> {
  sessionFiles.delete(key);
  const dir = await audioDir();
  if (!dir) return;
  try {
    await dir.removeEntry(key);
  } catch {
    /* already gone */
  }
}

/** Reads the header just far enough to show a runtime next to the track. */
export function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = new Audio();
    let settled = false;
    const done = (s: number) => {
      if (settled) return;
      settled = true;
      probe.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(s);
    };
    probe.preload = "metadata";
    probe.onloadedmetadata = () => done(Number.isFinite(probe.duration) ? probe.duration : 0);
    probe.onerror = () => done(0);
    window.setTimeout(() => done(0), 6000);
    probe.src = url;
  });
}

/* ---------- pickers ---------- */

type FsFileHandle = { kind: "file"; name: string; getFile(): Promise<File> };
type FsDirHandle = {
  kind: "directory";
  name: string;
  values(): AsyncIterable<FsFileHandle | FsDirHandle>;
};

export function canPickDirectory(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";
}

export function canPickFiles(): boolean {
  return typeof (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker === "function";
}

/**
 * File System Access directory walk. Returns null when the API is missing or
 * the user cancelled, so the caller can fall back to <input webkitdirectory>.
 */
export async function pickDirectoryFiles(): Promise<File[] | null> {
  const w = window as unknown as { showDirectoryPicker?: (o?: object) => Promise<FsDirHandle> };
  if (typeof w.showDirectoryPicker !== "function") return null;
  let root: FsDirHandle;
  try {
    root = await w.showDirectoryPicker({ mode: "read" });
  } catch (err) {
    // A cancelled picker is an answer, not a missing API: no fallback prompt.
    return isAbort(err) ? [] : null;
  }
  const out: File[] = [];
  const walk = async (dir: FsDirHandle, depth: number) => {
    if (depth > 12) return;
    for await (const entry of dir.values()) {
      if (entry.kind === "file") {
        if (AUDIO_EXT.test(entry.name)) {
          try {
            out.push(await entry.getFile());
          } catch {
            /* unreadable entry */
          }
        }
      } else if (entry.kind === "directory" && !entry.name.startsWith(".")) {
        await walk(entry, depth + 1);
      }
    }
  };
  await walk(root, 0);
  return out;
}

export async function pickAudioFiles(): Promise<File[] | null> {
  const w = window as unknown as {
    showOpenFilePicker?: (o?: object) => Promise<FsFileHandle[]>;
  };
  if (typeof w.showOpenFilePicker !== "function") return null;
  try {
    const handles = await w.showOpenFilePicker({
      multiple: true,
      types: [
        {
          description: "Audio",
          accept: {
            "audio/*": [".mp3", ".m4a", ".aac", ".wav", ".ogg", ".oga", ".opus", ".flac", ".weba"],
          },
        },
      ],
    });
    const out: File[] = [];
    for (const h of handles) {
      try {
        out.push(await h.getFile());
      } catch {
        /* skip */
      }
    }
    return out;
  } catch (err) {
    return isAbort(err) ? [] : null;
  }
}

function isAbort(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { name?: string }).name === "AbortError";
}
