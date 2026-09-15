/**
 * Local-date helpers. Everything is keyed by the LOCAL calendar day
 * (YYYY-MM-DD), never by UTC, so focus minutes logged at 23:30 land on the
 * day the person actually worked.
 */

/** Local calendar day of a Date as YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDateKey(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = parseDateKey(v);
  return !Number.isNaN(d.getTime()) && toDateKey(d) === v;
}

/** Local midnight of a YYYY-MM-DD key. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/** Accepts ISO / any Date-parsable string / a date key; returns the local day key or null. */
export function dateKeyOfAny(v: unknown): string | null {
  if (isDateKey(v)) return v;
  if (typeof v !== "string" && typeof v !== "number") return null;
  const t = typeof v === "number" ? v : Date.parse(v);
  if (Number.isNaN(t)) return null;
  return toDateKey(new Date(t));
}

export function formatInt(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(n));
  } catch {
    return String(Math.round(n));
  }
}

/** Up to one decimal, no trailing ".0". */
export function formatDecimal(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
  } catch {
    return String(Math.round(n * 10) / 10);
  }
}

export function formatDate(key: string, locale: string, style: "short" | "long" = "short"): string {
  const d = parseDateKey(key);
  try {
    const opts: Intl.DateTimeFormatOptions =
      style === "long" ? { year: "numeric", month: "short", day: "numeric", weekday: "short" } : { month: "short", day: "numeric" };
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    return key;
  }
}

export function formatTime(ms: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
  } catch {
    return new Date(ms).toTimeString().slice(0, 5);
  }
}

/** Non-negative integer from free text; null when it is not one. */
export function parseIntStrict(input: string): number | null {
  const cleaned = String(input).replace(/[,\s_]/g, "");
  if (cleaned === "" || !/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isSafeInteger(n) ? n : null;
}

/** Non-negative decimal (e.g. "2.5" hours) from free text; null when it is not one. */
export function parseDecimal(input: string): number | null {
  const cleaned = String(input).replace(/[,\s_]/g, "");
  if (cleaned === "" || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Splits minutes into whole hours and remaining minutes. */
export function splitMinutes(total: number): { h: number; m: number } {
  const t = Math.max(0, Math.round(total));
  return { h: Math.floor(t / 60), m: t % 60 };
}
