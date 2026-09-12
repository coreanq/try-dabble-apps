/**
 * affirmpad:session:v1 = { affirmationId, taps }
 *
 * The live practice session: which line is up and how many times it has
 * been tapped. Kept in storage so leaving fullscreen, rotating the phone or
 * a reload never loses the count. Pure functions first, storage after.
 */
export const SESSION_KEY = "affirmpad:session:v1";
export const TAPS_MAX = 9999;

export interface Session {
  affirmationId: string | null;
  taps: number;
}

export function emptySession(): Session {
  return { affirmationId: null, taps: 0 };
}

export function tap(s: Session): Session {
  return { ...s, taps: Math.min(TAPS_MAX, s.taps + 1) };
}

/** One step back, never below zero. */
export function undo(s: Session): Session {
  return { ...s, taps: Math.max(0, s.taps - 1) };
}

export function reset(s: Session): Session {
  return { ...s, taps: 0 };
}

/** Switching lines starts a fresh count; re-selecting the same line keeps it. */
export function select(s: Session, affirmationId: string | null): Session {
  if (s.affirmationId === affirmationId) return s;
  return { affirmationId, taps: 0 };
}

/** 0..1 towards the goal; a goal of 0 or less never fills. */
export function progress(taps: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(1, Math.max(0, taps / goal));
}

export function parseSession(raw: unknown): Session {
  if (!raw || typeof raw !== "object") return emptySession();
  const o = raw as Record<string, unknown>;
  const id = typeof o.affirmationId === "string" && o.affirmationId ? o.affirmationId : null;
  const n = typeof o.taps === "number" && Number.isFinite(o.taps) ? Math.min(TAPS_MAX, Math.max(0, Math.floor(o.taps))) : 0;
  return { affirmationId: id, taps: id ? n : 0 };
}

export function loadSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return parseSession(raw ? JSON.parse(raw) : null);
  } catch {
    return emptySession();
  }
}

export function saveSession(s: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* private mode: the count lives in memory for this visit */
  }
}

/** Ring index helper for previous / next in the practice card. */
export function neighbour(ids: string[], current: string | null, dir: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const i = current ? ids.indexOf(current) : -1;
  if (i < 0) return dir === 1 ? ids[0] : ids[ids.length - 1];
  return ids[(i + dir + ids.length) % ids.length];
}
