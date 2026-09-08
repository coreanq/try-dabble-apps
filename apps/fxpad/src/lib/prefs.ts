/**
 * fxpad:prefs:v1 = { from, to, amount, fontSize }
 * What the traveler last typed and picked, plus the A / A+ / A++ size.
 * Missing or damaged prefs fall back to a locale-aware default pair.
 */
import type { Lang } from "@/lib/i18n";

export const PREFS_KEY = "fxpad:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];

export interface Prefs {
  from: string;
  to: string;
  amount: string;
  fontSize: FontSize;
}

/**
 * Travelers headed for Japan (ko / en / zh) get JPY as the target; a Japanese
 * reader is more likely converting yen outwards, so JPY becomes the source.
 */
export function defaultPair(lang: Lang): { from: string; to: string } {
  switch (lang) {
    case "ja":
      return { from: "JPY", to: "USD" };
    case "ko":
      return { from: "KRW", to: "JPY" };
    case "zh":
      return { from: "CNY", to: "JPY" };
    default:
      return { from: "USD", to: "JPY" };
  }
}

export function defaultPrefs(lang: Lang): Prefs {
  return { ...defaultPair(lang), amount: "10000", fontSize: "md" };
}

function isCode(v: unknown): v is string {
  return typeof v === "string" && /^[A-Z]{3}$/.test(v);
}

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function parsePrefs(raw: unknown, lang: Lang): Prefs {
  const base = defaultPrefs(lang);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    from: isCode(o.from) ? o.from : base.from,
    to: isCode(o.to) ? o.to : base.to,
    amount: typeof o.amount === "string" && o.amount.length <= 24 ? o.amount : base.amount,
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
  };
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
