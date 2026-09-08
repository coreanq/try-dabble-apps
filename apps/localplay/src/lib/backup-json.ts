/**
 * The library as a file you can carry: track info, playlists, favorites and
 * the recent list. Never audio bytes. Pure functions only, so node --test can
 * import this module without a DOM.
 *
 * Why this exists: reinstalling or clearing a browser wipes a local-only app.
 * With this file plus the same music folder, a new device gets the playlists
 * back, and every track relinks to its audio by file name.
 */
import { normalizePlaylist, normalizeTrack, type Playlist, type Track } from "./library.ts";

export const BACKUP_APP = "localplay";
export const BACKUP_VERSION = 1;
export const BACKUP_FILENAME = "localplay.json";

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  tracks: Track[];
  playlists: Playlist[];
  favorites: string[];
  recent: string[];
}

export function serializeBackup(
  tracks: Track[],
  playlists: Playlist[],
  recent: string[],
  now: Date = new Date(),
): string {
  const ids = new Set(tracks.map((t) => t.id));
  const file: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    tracks: tracks.map((t) => {
      const row: Track = {
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        addedAt: t.addedAt,
        opfsKey: t.opfsKey,
        fileName: t.fileName,
      };
      if (t.duration) row.duration = t.duration;
      if (t.favorite) row.favorite = true;
      if (t.lastPlayedAt) row.lastPlayedAt = t.lastPlayedAt;
      if (t.size) row.size = t.size;
      return row;
    }),
    playlists: playlists.map((p) => ({
      id: p.id,
      name: p.name,
      trackIds: p.trackIds.filter((id) => ids.has(id)),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    favorites: tracks.filter((t) => t.favorite).map((t) => t.id),
    recent: recent.filter((id) => ids.has(id)),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** null for anything that is not one of our files — the caller says so out loud. */
export function parseBackup(text: string): BackupFile | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.app !== BACKUP_APP) return null;
  if (Number(obj.version) !== BACKUP_VERSION) return null;
  if (!Array.isArray(obj.tracks)) return null;

  const tracks: Track[] = [];
  const seen = new Set<string>();
  for (const entry of obj.tracks) {
    const t = normalizeTrack(entry);
    if (!t || seen.has(t.id)) continue;
    seen.add(t.id);
    tracks.push(t);
  }

  const favorites = new Set<string>(
    Array.isArray(obj.favorites) ? obj.favorites.filter((f): f is string => typeof f === "string") : [],
  );
  for (const t of tracks) if (favorites.has(t.id)) t.favorite = true;

  const playlists: Playlist[] = [];
  const seenP = new Set<string>();
  if (Array.isArray(obj.playlists)) {
    for (const entry of obj.playlists) {
      const p = normalizePlaylist(entry, seen);
      if (!p || seenP.has(p.id)) continue;
      seenP.add(p.id);
      playlists.push(p);
    }
  }

  const recent: string[] = [];
  if (Array.isArray(obj.recent)) {
    for (const id of obj.recent) {
      if (typeof id === "string" && seen.has(id) && !recent.includes(id)) recent.push(id);
    }
  }

  const exportedAt = typeof obj.exportedAt === "string" ? obj.exportedAt : "";
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt,
    tracks,
    playlists,
    favorites: tracks.filter((t) => t.favorite).map((t) => t.id),
    recent,
  };
}

/**
 * Merges an imported library into the current one. Tracks already present
 * (same id, or same file name) keep their local audio link; imported
 * favorites and metadata win because the user chose to import. Playlists with
 * the same id are replaced, others are appended.
 */
export function mergeBackup(
  current: { tracks: Track[]; playlists: Playlist[]; recent: string[] },
  incoming: BackupFile,
): { tracks: Track[]; playlists: Playlist[]; recent: string[]; idMap: Map<string, string> } {
  const byId = new Map(current.tracks.map((t) => [t.id, t]));
  const byFile = new Map(current.tracks.filter((t) => t.fileName).map((t) => [t.fileName, t]));
  const idMap = new Map<string, string>();
  const tracks = current.tracks.slice();

  for (const inc of incoming.tracks) {
    const local = byId.get(inc.id) ?? (inc.fileName ? byFile.get(inc.fileName) : undefined);
    if (local) {
      idMap.set(inc.id, local.id);
      const merged: Track = {
        ...local,
        title: inc.title || local.title,
        artist: inc.artist || local.artist,
        album: inc.album || local.album,
        favorite: inc.favorite || local.favorite || undefined,
        lastPlayedAt: Math.max(inc.lastPlayedAt ?? 0, local.lastPlayedAt ?? 0) || undefined,
        duration: local.duration || inc.duration,
        size: local.size || inc.size,
      };
      if (!merged.favorite) delete merged.favorite;
      if (!merged.lastPlayedAt) delete merged.lastPlayedAt;
      if (!merged.duration) delete merged.duration;
      if (!merged.size) delete merged.size;
      tracks[tracks.indexOf(local)] = merged;
      byId.set(local.id, merged);
    } else {
      idMap.set(inc.id, inc.id);
      tracks.push({ ...inc, opfsKey: inc.id });
      byId.set(inc.id, inc);
      if (inc.fileName) byFile.set(inc.fileName, inc);
    }
  }

  const remap = (ids: string[]) => {
    const out: string[] = [];
    for (const id of ids) {
      const to = idMap.get(id) ?? id;
      if (byId.has(to) && !out.includes(to)) out.push(to);
    }
    return out;
  };

  const playlists = current.playlists.slice();
  for (const inc of incoming.playlists) {
    const row: Playlist = { ...inc, trackIds: remap(inc.trackIds) };
    const at = playlists.findIndex((p) => p.id === inc.id);
    if (at >= 0) playlists[at] = row;
    else playlists.push(row);
  }

  const recent = [...remap(incoming.recent), ...current.recent.filter((id) => byId.has(id))].filter(
    (id, i, arr) => arr.indexOf(id) === i,
  );

  return { tracks, playlists, recent, idMap };
}

/** Blob + object URL + a click: the only way a browser writes a file. */
export function downloadBackup(tracks: Track[], playlists: Playlist[], recent: string[]): void {
  const blob = new Blob([serializeBackup(tracks, playlists, recent)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = BACKUP_FILENAME;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
