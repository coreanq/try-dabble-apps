/**
 * Local-date and duration helpers. Everything is keyed by the LOCAL calendar
 * day (YYYY-MM-DD) and the local Monday that starts the week, never by UTC,
 * so a check-in at 23:30 lands on the day the person actually worked.
 *
 * Elapsed time is always wall-clock arithmetic on stored ISO timestamps:
 * Date.now() minus startedAt. Nothing here counts ticks.
 */

export const MS_PER_MIN = 60_000;
export const MS_PER_HOUR = 3_600_000;

/** Local calendar day of a Date as YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDateKey(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseDateKey(v).getTime());
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

/** Accepts ISO or anything Date can parse; returns the local day key or null. */
export function dateKeyOfIso(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return toDateKey(new Date(t));
}

/**
 * Week key = local date of the day the week starts (Monday by default).
 * Stable across time zones for the same person, sortable as a string, and
 * the natural label for "the week of 2026-09-14".
 */
export function weekKeyOf(dateKey: string, weekStartsOn: 0 | 1 = 1): string {
  const d = parseDateKey(dateKey);
  const dow = d.getDay(); // 0 = Sunday
  const diff = (dow - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toDateKey(d);
}

export function weekDaysOf(weekKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekKey, i));
}

export function weekEndOf(weekKey: string): string {
  return addDays(weekKey, 6);
}

export function nextWeekKey(weekKey: string): string {
  return addDays(weekKey, 7);
}

/** Wall-clock elapsed since an ISO start; never negative, never tick-based. */
export function elapsedMs(startedAt: string, now: number = Date.now()): number {
  const t = Date.parse(startedAt);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, now - t);
}

export function hoursToMs(h: number): number {
  return Math.round(h * MS_PER_HOUR);
}

export function msToHours(ms: number): number {
  return ms / MS_PER_HOUR;
}

/** Rounds to whole minutes so a figure the person sees is a figure they can add up. */
export function msToMinutes(ms: number): number {
  return Math.round(ms / MS_PER_MIN);
}

/** "8h 12m", "0m", "45m", with an optional explicit sign for bank deltas. */
export function formatHM(ms: number, opts: { sign?: boolean } = {}): string {
  const neg = ms < 0;
  const total = Math.round(Math.abs(ms) / MS_PER_MIN);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const body = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  if (neg) return `-${body}`;
  return opts.sign && total > 0 ? `+${body}` : body;
}

/** Live clock figure "1:05:09" (hours never padded, minutes and seconds always). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Bank / target figures kept in hours: "+3h 30m" from 3.5. */
export function formatHours(hours: number, opts: { sign?: boolean } = {}): string {
  return formatHM(hoursToMs(hours), opts);
}

export function formatTime(iso: string, locale: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  try {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(t));
  } catch {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}

export function formatDate(key: string, locale: string, style: "short" | "long" = "short"): string {
  const d = parseDateKey(key);
  try {
    return new Intl.DateTimeFormat(
      locale,
      style === "long" ? { month: "short", day: "numeric", weekday: "short" } : { month: "numeric", day: "numeric" },
    ).format(d);
  } catch {
    return key;
  }
}

export function formatWeekRange(weekKey: string, locale: string): string {
  return `${formatDate(weekKey, locale)} – ${formatDate(weekEndOf(weekKey), locale)}`;
}

/** "HH:MM" of a local time on a date key → ISO string; null when unparsable. */
export function combineDateTime(dateKey: string, hhmm: string): string | null {
  if (!isDateKey(dateKey)) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = parseDateKey(dateKey);
  d.setHours(h, min, 0, 0);
  return d.toISOString();
}

export function toHHMM(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Parses "40", "37.5", "37h 30m", "37:30" into hours; null when nonsense. */
export function parseHours(input: string): number | null {
  const s = String(input).trim().toLowerCase().replace(/,/g, ".");
  if (!s) return null;
  let m = /^([+-]?\d+(?:\.\d+)?)\s*h?$/.exec(s);
  if (m) return Number(m[1]);
  m = /^([+-]?)(\d+)\s*[h:]\s*(\d{1,2})\s*m?$/.exec(s);
  if (m) {
    const sign = m[1] === "-" ? -1 : 1;
    return sign * (Number(m[2]) + Number(m[3]) / 60);
  }
  m = /^([+-]?\d+)\s*m$/.exec(s);
  if (m) return Number(m[1]) / 60;
  return null;
}
