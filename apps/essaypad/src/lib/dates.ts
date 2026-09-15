/**
 * Local-date helpers. Everything is keyed by the LOCAL calendar day
 * (YYYY-MM-DD), never by UTC, so a word count entered at 23:30 lands on the
 * day the person actually wrote.
 */

export const MS_PER_DAY = 86_400_000;

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

/** Whole days from `a` to `b` (positive when b is later). DST-safe. */
export function diffDays(a: string, b: string): number {
  const ua = Date.UTC(...splitKey(a));
  const ub = Date.UTC(...splitKey(b));
  return Math.round((ub - ua) / MS_PER_DAY);
}

function splitKey(key: string): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m - 1, d];
}

/** 0 = Sunday … 6 = Saturday, for a YYYY-MM-DD key. */
export function weekdayOf(key: string): number {
  return parseDateKey(key).getDay();
}

export function isWeekend(key: string): boolean {
  const w = weekdayOf(key);
  return w === 0 || w === 6;
}

/** Accepts ISO / any Date-parsable string / a date key; returns the local day key or null. */
export function dateKeyOfAny(v: unknown): string | null {
  if (isDateKey(v)) return v;
  if (typeof v !== "string" && typeof v !== "number") return null;
  const t = typeof v === "number" ? v : Date.parse(v);
  if (Number.isNaN(t)) return null;
  return toDateKey(new Date(t));
}

/** YYYY-MM of a key. */
export function monthKeyOf(key: string): string {
  return key.slice(0, 7);
}

export function addMonths(monthKey: string, n: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * A month as rows of seven cells starting on Monday. Cells outside the month
 * are null so the grid stays rectangular.
 */
export function monthGrid(monthKey: string): (string | null)[][] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function formatInt(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(n));
  } catch {
    return String(Math.round(n));
  }
}

export function formatDate(key: string, locale: string, style: "short" | "long" | "month" = "short"): string {
  const d = parseDateKey(key + (key.length === 7 ? "-01" : ""));
  try {
    const opts: Intl.DateTimeFormatOptions =
      style === "long"
        ? { year: "numeric", month: "short", day: "numeric", weekday: "short" }
        : style === "month"
          ? { year: "numeric", month: "long" }
          : { month: "short", day: "numeric" };
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    return key;
  }
}

/** Mon..Sun labels for the calendar header, localized. */
export function weekdayLabels(locale: string): string[] {
  const out: string[] = [];
  // 2024-01-01 is a Monday.
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, 1 + i);
    try {
      out.push(new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(d));
    } catch {
      out.push(["M", "T", "W", "T", "F", "S", "S"][i]);
    }
  }
  return out;
}

/** Non-negative integer from free text; null when it is not one. */
export function parseWords(input: string): number | null {
  const cleaned = String(input).replace(/[,\s_]/g, "");
  if (cleaned === "" || !/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isSafeInteger(n) ? n : null;
}
