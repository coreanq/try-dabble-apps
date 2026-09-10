/**
 * trailquest:prefs:v1 = { unit, activeRouteId?, stepsPerMile, fontSize }
 * Display and input preferences only. The unit never converts stored miles;
 * it only changes what is typed and what is shown.
 */
import { DEFAULT_STEPS_PER_MILE, isUnit, type Unit } from "./units.ts";

export const PREFS_KEY = "trailquest:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];

export interface Prefs {
  unit: Unit;
  activeRouteId?: string;
  stepsPerMile: number;
  fontSize: FontSize;
}

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function defaultPrefs(): Prefs {
  return { unit: "mi", stepsPerMile: DEFAULT_STEPS_PER_MILE, fontSize: "md" };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const prefs: Prefs = {
    unit: isUnit(o.unit) ? o.unit : base.unit,
    stepsPerMile:
      typeof o.stepsPerMile === "number" && Number.isFinite(o.stepsPerMile) && o.stepsPerMile >= 500 && o.stepsPerMile <= 5000
        ? Math.round(o.stepsPerMile)
        : base.stepsPerMile,
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
  };
  if (typeof o.activeRouteId === "string" && o.activeRouteId) prefs.activeRouteId = o.activeRouteId;
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
