/**
 * gymac:prefs:v1 = { fontSize, restSecondsDefault, unitWeight }
 * Display preferences only. Nothing here is a feature gate.
 */
import { isWeightUnit, type WeightUnit } from "./model.ts";
import { clampRestSeconds, DEFAULT_REST_SECONDS } from "./timer.ts";

export const PREFS_KEY = "gymac:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];

export interface Prefs {
  fontSize: FontSize;
  restSecondsDefault: number;
  unitWeight: WeightUnit;
}

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function defaultPrefs(): Prefs {
  return { fontSize: "md", restSecondsDefault: DEFAULT_REST_SECONDS, unitWeight: "kg" };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
    restSecondsDefault: o.restSecondsDefault === undefined ? base.restSecondsDefault : clampRestSeconds(o.restSecondsDefault),
    unitWeight: isWeightUnit(o.unitWeight) ? o.unitWeight : base.unitWeight,
  };
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
