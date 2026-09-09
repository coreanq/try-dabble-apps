/**
 * weekpad:prefs:v1 = { currency, currencySymbol?, weekStartsOn, fontSize, lastSeenWeek? }
 * Display preferences only. The currency is a label on the numbers, never a
 * conversion. lastSeenWeek is how the app notices that a new week has begun
 * since it was last opened.
 */
import { isCurrency, defaultCurrency } from "./currency.ts";
import type { Lang } from "@/lib/i18n";
import { isDateStr, type WeekStartsOn } from "./week.ts";

export const PREFS_KEY = "weekpad:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];

export interface Prefs {
  currency: string;
  currencySymbol?: string;
  weekStartsOn: WeekStartsOn;
  fontSize: FontSize;
  lastSeenWeek?: string;
}

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function isWeekStartsOn(v: unknown): v is WeekStartsOn {
  return v === 0 || v === 1;
}

export function defaultPrefs(lang: Lang): Prefs {
  return { currency: defaultCurrency(lang), weekStartsOn: 1, fontSize: "md" };
}

export function parsePrefs(raw: unknown, lang: Lang): Prefs {
  const base = defaultPrefs(lang);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const prefs: Prefs = {
    currency: isCurrency(o.currency) ? o.currency : base.currency,
    weekStartsOn: isWeekStartsOn(o.weekStartsOn) ? o.weekStartsOn : base.weekStartsOn,
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
  };
  if (typeof o.currencySymbol === "string" && o.currencySymbol.trim() && o.currencySymbol.length <= 6) {
    prefs.currencySymbol = o.currencySymbol.trim();
  }
  if (isDateStr(o.lastSeenWeek)) prefs.lastSeenWeek = o.lastSeenWeek;
  return prefs;
}

export function loadPrefs(lang: Lang): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return parsePrefs(raw ? JSON.parse(raw) : null, lang);
  } catch {
    return defaultPrefs(lang);
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode: the session still works, it just will not remember */
  }
}
