const DAY = 86400000;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayISO(): string {
  return formatISO(new Date());
}

export function parseISO(iso: string | undefined | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function addDaysISO(iso: string, n: number): string {
  const d = parseISO(iso) ?? new Date();
  d.setDate(d.getDate() + n);
  return formatISO(d);
}

/** Whole days from local midnight today to the given date. Negative = overdue. */
export function daysUntil(iso: string | undefined | null): number {
  const target = parseISO(iso);
  if (!target) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / DAY);
}
