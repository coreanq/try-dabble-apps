/**
 * poseguide:prefs:v1 = { facing, overlayOpacity, voiceOn, autoCapture,
 * composition, strangerMode, genderFilter, category, poseId, fontSize }
 *
 * autoCapture is false by default and stays whatever the user set: the app
 * never flips it back on by itself (that was the Photogenik complaint).
 * Stranger Mode is deliberately NOT persisted — handing the phone to a
 * passer-by is a moment, not a setting.
 */

export const PREFS_KEY = "poseguide:prefs:v1";

export type Facing = "user" | "environment";
export type Composition = "off" | "thirds" | "center";
export type GenderFilter = "all" | "female" | "male";
export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];

export interface Prefs {
  facing: Facing;
  overlayOpacity: number;
  voiceOn: boolean;
  autoCapture: boolean;
  composition: Composition;
  genderFilter: GenderFilter;
  category: string;
  poseId: string;
  fontSize: FontSize;
}

export const DEFAULT_PREFS: Prefs = {
  facing: "user",
  overlayOpacity: 0.55,
  voiceOn: false,
  autoCapture: false,
  composition: "off",
  genderFilter: "all",
  category: "all",
  poseId: "",
  fontSize: "md",
};

export function isFacing(v: unknown): v is Facing {
  return v === "user" || v === "environment";
}
export function isComposition(v: unknown): v is Composition {
  return v === "off" || v === "thirds" || v === "center";
}
export function isGenderFilter(v: unknown): v is GenderFilter {
  return v === "all" || v === "female" || v === "male";
}
export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function clampOpacity(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULT_PREFS.overlayOpacity;
  return Math.min(1, Math.max(0.1, Math.round(n * 100) / 100));
}

export function parsePrefs(raw: unknown): Prefs {
  const base = DEFAULT_PREFS;
  if (!raw || typeof raw !== "object") return { ...base };
  const o = raw as Record<string, unknown>;
  return {
    facing: isFacing(o.facing) ? o.facing : base.facing,
    overlayOpacity: o.overlayOpacity === undefined ? base.overlayOpacity : clampOpacity(o.overlayOpacity),
    voiceOn: o.voiceOn === true,
    autoCapture: o.autoCapture === true,
    composition: isComposition(o.composition) ? o.composition : base.composition,
    genderFilter: isGenderFilter(o.genderFilter) ? o.genderFilter : base.genderFilter,
    category: typeof o.category === "string" && o.category.length <= 24 ? o.category : base.category,
    poseId: typeof o.poseId === "string" && o.poseId.length <= 48 ? o.poseId : base.poseId,
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
  };
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return parsePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode: the session still works, it just will not remember */
  }
}

/**
 * Stranger Mode always looks out of the back of the phone: the passer-by is
 * pointing it at you. Leaving the mode restores the facing saved in prefs.
 */
export function effectiveFacing(prefs: Pick<Prefs, "facing">, strangerMode: boolean): Facing {
  return strangerMode ? "environment" : prefs.facing;
}

/* ---- poseguide:recent:v1 — capture metadata only, never photo bytes ---- */

export const RECENT_KEY = "poseguide:recent:v1";
export const RECENT_MAX = 12;

export interface RecentCapture {
  poseId: string;
  at: string;
  burst?: number;
}

export function parseRecent(raw: unknown): RecentCapture[] {
  if (!Array.isArray(raw)) return [];
  const out: RecentCapture[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.poseId !== "string" || typeof o.at !== "string") continue;
    if (Number.isNaN(new Date(o.at).getTime())) continue;
    const rc: RecentCapture = { poseId: o.poseId, at: o.at };
    if (typeof o.burst === "number" && o.burst > 1) rc.burst = o.burst;
    out.push(rc);
  }
  return out.slice(0, RECENT_MAX);
}

export function loadRecent(): RecentCapture[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return parseRecent(raw ? JSON.parse(raw) : null);
  } catch {
    return [];
  }
}

export function pushRecent(list: RecentCapture[], entry: RecentCapture): RecentCapture[] {
  return [entry, ...list].slice(0, RECENT_MAX);
}

export function saveRecent(list: RecentCapture[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* ignore */
  }
}

/* ---- poseguide:streak:v1 — { lastDay, count } ---- */

export const STREAK_KEY = "poseguide:streak:v1";

export interface Streak {
  lastDay: string;
  count: number;
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseStreak(raw: unknown): Streak | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.lastDay !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.lastDay)) return null;
  if (typeof o.count !== "number" || !Number.isInteger(o.count) || o.count < 0) return null;
  return { lastDay: o.lastDay, count: o.count };
}

/** Same day: unchanged. Yesterday: +1. Anything older: back to 1. */
export function bumpStreak(prev: Streak | null, today: Date): Streak {
  const key = dayKey(today);
  if (!prev) return { lastDay: key, count: 1 };
  if (prev.lastDay === key) return prev;
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (prev.lastDay === dayKey(y)) return { lastDay: key, count: prev.count + 1 };
  return { lastDay: key, count: 1 };
}

export function loadStreak(): Streak | null {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return parseStreak(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

export function saveStreak(s: Streak): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
