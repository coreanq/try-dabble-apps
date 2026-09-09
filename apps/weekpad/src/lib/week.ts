/**
 * Week math on plain YYYY-MM-DD strings. Every calculation runs in UTC on the
 * calendar date alone, so a DST shift or a timezone change never moves an
 * expense from one week to the next. The only place local time matters is
 * todayStr(), which reads the reader's wall clock once.
 */

export type WeekStartsOn = 0 | 1;

export const DAY_MS = 86_400_000;

export interface WeekInfo {
  /** First day of the week, YYYY-MM-DD. This is the week key. */
  start: string;
  /** Last day of the week, YYYY-MM-DD (inclusive). */
  end: string;
  /** All seven days, start first. */
  days: string[];
  /** ISO 8601 week id such as 2026-W37, taken from the week's Thursday. */
  isoId: string;
}

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

/** 0 = Sunday … 6 = Saturday, from the calendar date alone. */
export function dayOfWeek(dateStr: string): number {
  const ms = parseDate(dateStr);
  return ms === null ? 0 : new Date(ms).getUTCDay();
}

/** The week key: the first day (Monday or Sunday) of the week holding dateStr. */
export function weekStartOf(dateStr: string, weekStartsOn: WeekStartsOn = 1): string {
  const ms = parseDate(dateStr);
  if (ms === null) return dateStr;
  const dow = new Date(ms).getUTCDay();
  const back = (dow - weekStartsOn + 7) % 7;
  return toDateStr(ms - back * DAY_MS);
}

export function addWeeks(weekStart: string, n: number): string {
  return addDays(weekStart, n * 7);
}

/** ISO 8601 week id (YYYY-Www) of the ISO week that holds dateStr. */
export function isoWeekId(dateStr: string): string {
  const ms = parseDate(dateStr);
  if (ms === null) return "";
  const dowMon0 = (new Date(ms).getUTCDay() + 6) % 7;
  const thursday = ms + (3 - dowMon0) * DAY_MS;
  const isoYear = new Date(thursday).getUTCFullYear();
  const jan1 = Date.UTC(isoYear, 0, 1);
  const week = Math.floor((thursday - jan1) / DAY_MS / 7) + 1;
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function weekOf(dateStr: string, weekStartsOn: WeekStartsOn = 1): WeekInfo {
  const start = weekStartOf(dateStr, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  // The Thursday of a Monday-start week is day 3; of a Sunday-start week, day 4.
  const thursday = days[weekStartsOn === 1 ? 3 : 4];
  return { start, end: days[6], days, isoId: isoWeekId(thursday) };
}

export function isInWeek(dateStr: string, weekStart: string, weekStartsOn: WeekStartsOn = 1): boolean {
  return weekStartOf(dateStr, weekStartsOn) === weekStart;
}

/** Clamp a date into [weekStart, weekStart + 6]. Used for the expense date default. */
export function clampToWeek(dateStr: string, weekStart: string): string {
  const ms = parseDate(dateStr);
  const s = parseDate(weekStart);
  if (ms === null || s === null) return weekStart;
  if (ms < s) return weekStart;
  const e = s + 6 * DAY_MS;
  if (ms > e) return toDateStr(e);
  return dateStr;
}
