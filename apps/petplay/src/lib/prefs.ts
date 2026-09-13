/**
 * petplay:prefs:v1 = { decayPaused }
 * Display / behaviour preferences only. Nothing here is a feature gate.
 */
export const PREFS_KEY = "petplay:prefs:v1";

export interface Prefs {
  decayPaused: boolean;
}

export function defaultPrefs(): Prefs {
  return { decayPaused: false };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return { decayPaused: typeof o.decayPaused === "boolean" ? o.decayPaused : base.decayPaused };
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return parsePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode: the session still works, it just will not remember */
  }
}

export function clearPrefs(): void {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    /* ignore */
  }
}
