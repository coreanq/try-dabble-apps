/**
 * Money formatting and calendar keys. Pure functions, no DOM, so node --test
 * can cover every branch.
 *
 * Totals are always grouped per currency. This file has no exchange rates
 * on purpose: the app never merges two currencies into one figure.
 */

/** ISO 4217 codes the picker offers. Anything else typed in is kept as-is. */
export const CURRENCIES = ["USD", "KRW", "JPY", "EUR", "GBP", "CNY", "TWD", "HKD", "SGD", "AUD", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

const ZERO_DECIMAL = new Set(["KRW", "JPY", "TWD"]);

const LOCALE_BY_LANG: Record<string, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export function normalizeCurrency(v: unknown, fallback = "USD"): string {
  if (typeof v !== "string") return fallback;
  const s = v.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(s)) return s;
  if (s === "₩" || s === "원") return "KRW";
  if (s === "$") return "USD";
  if (s === "€") return "EUR";
  if (s === "¥" || s === "円") return "JPY";
  if (s === "£") return "GBP";
  return fallback;
}

export function roundMoney(amount: number, currency: string): number {
  const digits = ZERO_DECIMAL.has(normalizeCurrency(currency)) ? 0 : 2;
  const f = 10 ** digits;
  return Math.round(amount * f) / f;
}

function toLocale(langOrLocale: string): string {
  return LOCALE_BY_LANG[langOrLocale] ?? langOrLocale;
}

/** `lang` may be a UI language (ko/en/ja/zh) or a full BCP 47 locale. */
export function formatMoney(amount: number, currency: string, lang = "en"): string {
  const cur = normalizeCurrency(currency);
  const digits = ZERO_DECIMAL.has(cur) ? 0 : 2;
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(toLocale(lang), {
      style: "currency",
      currency: cur,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(safe);
  } catch {
    return `${cur} ${safe.toFixed(digits)}`;
  }
}

export function formatPercent(value: number, lang = "en"): string {
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(toLocale(lang), { maximumFractionDigits: 2 }).format(safe) + "%";
  } catch {
    return `${safe}%`;
  }
}

/** Reads "1,234.50", "  80 ", 80 → 80; rejects negatives and NaN. */
function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return NaN;
  const s = v.replace(/[^0-9.-]/g, "");
  return s ? Number(s) : NaN;
}

export function clampAmount(v: unknown, fallback = 0): number {
  const n = toNumber(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, 1_000_000_000_000);
}

/** Percent envelopes are 0–100. Larger values are kept (the UI warns) but capped at 1000. */
export function clampPercent(v: unknown, fallback = 0): number {
  const n = toNumber(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, 1000);
}

/* ---------- calendar keys (local, DST-proof) ---------- */

const pad2 = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function isDateKey(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

/** Accepts YYYY-MM-DD, full ISO strings, epoch ms, or "2026/09/14". */
export function coerceDateKey(v: unknown, fallback: string): string {
  if (isDateKey(v)) return v;
  if (typeof v === "number" && Number.isFinite(v)) return toDateKey(new Date(v));
  if (typeof v === "string") {
    const s = v.trim().replace(/\//g, "-").replace(/\./g, "-");
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}`;
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return toDateKey(new Date(t));
  }
  return fallback;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-09-14" → "2026-09" */
export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** "2026-09-14" → "2026" */
export function yearKeyOf(dateKey: string): string {
  return dateKey.slice(0, 4);
}

export function isMonthKey(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}$/.test(v);
}

export function isYearKey(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}$/.test(v);
}

export function currentMonthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

export function currentYearKey(now: Date = new Date()): string {
  return String(now.getFullYear());
}

export function shiftMonthKey(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const total = m - 1 + n;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  return `${ny}-${pad2(nm + 1)}`;
}

export function shiftYearKey(key: string, n: number): string {
  return String(Number(key) + n);
}

export function formatDate(key: string, lang = "en"): string {
  try {
    return new Intl.DateTimeFormat(toLocale(lang), { year: "numeric", month: "short", day: "numeric" }).format(parseDateKey(key));
  } catch {
    return key;
  }
}

export function formatMonth(monthKey: string, lang = "en"): string {
  const [y, m] = monthKey.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(toLocale(lang), { year: "numeric", month: "long" }).format(new Date(y, m - 1, 1));
  } catch {
    return monthKey;
  }
}

export function formatMonthShort(monthKey: string, lang = "en"): string {
  const [y, m] = monthKey.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(toLocale(lang), { month: "short" }).format(new Date(y, m - 1, 1));
  } catch {
    return monthKey.slice(5);
  }
}
