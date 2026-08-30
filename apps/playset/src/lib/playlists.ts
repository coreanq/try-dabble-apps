/**
 * Playset storage. Everything lives in THIS browser — no account, no server,
 * no subscription check on the way in.
 *
 * WHERE THINGS GO
 *   playlists  localStorage  "playset:playlists:v1"  (name, ordered games, loop)
 *   position   localStorage  "playset:session:v1"    (which list, which step)
 *   language   localStorage  "playset:lang" + the shared td_lang cookie
 *
 * WHAT SURVIVES A TAB CLOSE
 *   both. The saved lists obviously, but also the place in the queue: if the
 *   phone locks or the tab is closed on game four of six, coming back offers
 *   to carry on from game four. Nothing is capped and nothing expires — a list
 *   goes away only when it is deleted, or when the browser clears site data.
 */

import { isGameId, type GameId } from "@/lib/games";

export const PLAYLISTS_KEY = "playset:playlists:v1";
export const SESSION_KEY = "playset:session:v1";

export const MAX_NAME = 60;
/** A guard against a stuck finger, not a paywall. Nothing here is a lock. */
export const MAX_STEPS = 40;

export interface Playlist {
  id: string;
  name: string;
  /** Ordered. Repeats are allowed and deliberate. */
  games: GameId[];
  /** When true the last game rolls back round to the first. */
  loop: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Where the queue got to. Written on every step so a tab close is survivable. */
export interface Session {
  playlistId: string;
  /** Index into the playlist's games. */
  index: number;
  updatedAt: number;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* --------------------------------------------------------------- playlists */

function parsePlaylist(raw: unknown): Playlist | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim().slice(0, MAX_NAME) : "";
  const games = Array.isArray(o.games) ? o.games.filter(isGameId).slice(0, MAX_STEPS) : [];
  if (!name || games.length === 0) return null;
  const created = typeof o.createdAt === "number" ? o.createdAt : Date.now();
  return {
    id: typeof o.id === "string" && o.id ? o.id : uid(),
    name,
    games,
    loop: o.loop === true,
    createdAt: created,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : created,
  };
}

export function parsePlaylists(raw: unknown): Playlist[] {
  if (!Array.isArray(raw)) return [];
  const out: Playlist[] = [];
  for (const item of raw) {
    const p = parsePlaylist(item);
    if (p) out.push(p);
  }
  return out;
}

export function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    return raw ? parsePlaylists(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function savePlaylists(list: Playlist[]): void {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(list));
  } catch {
    /* storage full or private mode — the app keeps working for this session */
  }
}

/** Newest edit first, so the list somebody just touched is under the thumb. */
export function sortPlaylists(list: Playlist[]): Playlist[] {
  return list.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function newPlaylist(name: string, games: GameId[], loop: boolean): Playlist {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim().slice(0, MAX_NAME),
    games: games.slice(0, MAX_STEPS),
    loop,
    createdAt: now,
    updatedAt: now,
  };
}

/* ----------------------------------------------------------------- session */

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (typeof o?.playlistId !== "string") return null;
    const index = typeof o.index === "number" && o.index >= 0 ? Math.floor(o.index) : 0;
    return {
      playlistId: o.playlistId,
      index,
      updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to do — the queue just will not survive this particular close */
  }
}
