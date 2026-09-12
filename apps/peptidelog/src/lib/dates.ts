/**
 * Local-date helpers. A dose log carries both an ISO instant (`datetime`) and
 * the local calendar day (`date`, YYYY-MM-DD) it belongs to, so the calendar
 * groups by the day the person actually injected, not by UTC midnight.
 */

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(now: Date = new Date()): string {
  return dateKeyOf(now);
}

export function timeOf(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Value for an <input type="datetime-local">: local wall clock, minute precision. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${dateKeyOf(d)}T${timeOf(d)}`;
}

/** "YYYY-MM-DDTHH:mm" (local) → ISO instant, or null when unparsable. */
export function fromLocalInput(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** The local calendar day an ISO instant falls on. */
export function dateKeyOfIso(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateKeyOf(d);
}

/** Build an ISO instant from a local day + HH:mm. */
export function isoAt(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = (TIME_RE.test(time) ? time : "09:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function shiftDay(key: string, delta: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + delta);
  return dateKeyOf(d);
}

export function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1, 12);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function yearMonthOf(key: string): string {
  return key.slice(0, 7);
}

/** Whole days between two day keys (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Six-row month grid for a calendar: 42 cells, each a day key or null for
 * padding. `weekStart` 0 = Sunday. Always starts on the week containing the
 * 1st and always covers the whole month.
 */
export function monthGrid(yearMonth: string, weekStart: 0 | 1 = 0): (string | null)[] {
  const [y, m] = yearMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1, 12);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = (first.getDay() - weekStart + 7) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Hours elapsed between an ISO instant and now (never negative). */
export function hoursSince(iso: string, now: Date = new Date()): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (now.getTime() - t) / 3_600_000);
}
