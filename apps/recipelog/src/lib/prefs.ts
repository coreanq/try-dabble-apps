/**
 * recipelog:prefs:v1 = { fontSize, view, cookTimerSec }
 * The A / A+ / A++ size, grid vs list, and the last timer length in cook mode.
 */
export const PREFS_KEY = "recipelog:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];
export type View = "grid" | "list";

export interface Prefs {
  fontSize: FontSize;
  view: View;
  cookTimerSec: number;
}

export const DEFAULT_PREFS: Prefs = { fontSize: "md", view: "grid", cookTimerSec: 300 };

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function parsePrefs(raw: unknown): Prefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const o = raw as Record<string, unknown>;
  const timer = typeof o.cookTimerSec === "number" && o.cookTimerSec >= 10 && o.cookTimerSec <= 24 * 3600
    ? Math.round(o.cookTimerSec)
    : DEFAULT_PREFS.cookTimerSec;
  return {
    fontSize: isFontSize(o.fontSize) ? o.fontSize : DEFAULT_PREFS.fontSize,
    view: o.view === "list" ? "list" : "grid",
    cookTimerSec: timer,
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
    /* private mode: it just will not remember */
  }
}
