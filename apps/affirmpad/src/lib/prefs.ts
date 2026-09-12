/**
 * affirmpad:prefs:v1 = { darkMode, soundEnabled, vibeEnabled, fontSize, dailyGoal, lastPracticedDate? }
 * Display and feedback preferences only. Nothing here is a feature gate:
 * every toggle is free and every value is editable.
 */
export const PREFS_KEY = "affirmpad:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];
export const GOAL_MIN = 1;
export const GOAL_MAX = 999;
export const GOAL_DEFAULT = 10;

export interface Prefs {
  darkMode: boolean;
  soundEnabled: boolean;
  vibeEnabled: boolean;
  fontSize: FontSize;
  dailyGoal: number;
  lastPracticedDate?: string;
}

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function clampGoal(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return GOAL_DEFAULT;
  return Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.floor(n)));
}

export function defaultPrefs(): Prefs {
  return { darkMode: false, soundEnabled: true, vibeEnabled: true, fontSize: "md", dailyGoal: GOAL_DEFAULT };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const prefs: Prefs = {
    darkMode: typeof o.darkMode === "boolean" ? o.darkMode : base.darkMode,
    soundEnabled: typeof o.soundEnabled === "boolean" ? o.soundEnabled : base.soundEnabled,
    vibeEnabled: typeof o.vibeEnabled === "boolean" ? o.vibeEnabled : base.vibeEnabled,
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
    dailyGoal: o.dailyGoal === undefined ? base.dailyGoal : clampGoal(o.dailyGoal),
  };
  if (typeof o.lastPracticedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.lastPracticedDate)) {
    prefs.lastPracticedDate = o.lastPracticedDate;
  }
  return prefs;
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

export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
