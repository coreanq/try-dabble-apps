/**
 * Date math on plain YYYY-MM-DD strings, run in UTC on the calendar date
 * alone so a timezone change never moves an entry to another day. The only
 * place local time matters is todayStr(), which reads the wall clock once.
 */

export const DAY_MS = 86_400_000;

export function isDateStr(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && parseDate(v) !== null;
}

/** YYYY-MM-DD → UTC midnight in ms, or null when the string is not a real date. */
export function parseDate(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return ms;
}

export function toDateStr(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** The reader's local calendar date. */
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, n: number): string {
  const ms = parseDate(dateStr);
  if (ms === null) return dateStr;
  return toDateStr(ms + n * DAY_MS);
}

/** Whole days from a to b (b - a). 0 when either is not a date. */
export function daysBetween(a: string, b: string): number {
  const x = parseDate(a);
  const y = parseDate(b);
  if (x === null || y === null) return 0;
  return Math.round((y - x) / DAY_MS);
}
