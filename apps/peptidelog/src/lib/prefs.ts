/**
 * peptidelog:prefs:v1 = { syringeUnitsPerMl, defaultSite?, fontSize, showHalfLife }
 * Display preferences only. Nothing here is a feature gate: every toggle is
 * free and every value is editable.
 */
import { DEFAULT_UNITS_PER_ML } from "./calc.ts";
import { isSite } from "./rotation.ts";

export const PREFS_KEY = "peptidelog:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];

export interface Prefs {
  syringeUnitsPerMl: number;
  defaultSite?: string;
  fontSize: FontSize;
  showHalfLife: boolean;
}

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function clampUnitsPerMl(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return DEFAULT_UNITS_PER_ML;
  return Math.min(1000, Math.max(1, Math.round(n)));
}

export function defaultPrefs(): Prefs {
  return { syringeUnitsPerMl: DEFAULT_UNITS_PER_ML, fontSize: "md", showHalfLife: false };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const prefs: Prefs = {
    syringeUnitsPerMl: o.syringeUnitsPerMl === undefined ? base.syringeUnitsPerMl : clampUnitsPerMl(o.syringeUnitsPerMl),
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
    showHalfLife: o.showHalfLife === true,
  };
  if (isSite(o.defaultSite)) prefs.defaultSite = o.defaultSite;
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
