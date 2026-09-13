/**
 * Cycle math, calendar days and money formatting. Pure functions, no DOM,
 * so node --test can cover every branch.
 *
 * Totals are always grouped per currency. This file has no exchange rates
 * on purpose: the app promises never to invent one.
 */
export type Cycle = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubStatus = "active" | "paused" | "cancelled";

export const CYCLES: Cycle[] = ["weekly", "monthly", "quarterly", "yearly"];
export const STATUSES: SubStatus[] = ["active", "paused", "cancelled"];

/** ISO 4217 codes the picker offers. Anything else typed in is kept as-is. */
export const CURRENCIES = ["KRW", "USD", "EUR", "JPY", "CNY", "TWD", "HKD", "GBP", "SGD"] as const;
export type Currency = (typeof CURRENCIES)[number];

const ZERO_DECIMAL = new Set(["KRW", "JPY"]);

export function isCycle(v: unknown): v is Cycle {
  return v === "weekly" || v === "monthly" || v === "quarterly" || v === "yearly";
}

export function isStatus(v: unknown): v is SubStatus {
  return v === "active" || v === "paused" || v === "cancelled";
}

/** Loose reader for legacy backups: "month", "Monthly", "annual", "1y", "week"… */
export function coerceCycle(v: unknown, fallback: Cycle = "monthly"): Cycle {
  if (isCycle(v)) return v;
  if (typeof v === "number") {
    if (v === 7) return "weekly";
    if (v === 1 || v === 30 || v === 31) return "monthly";
    if (v === 3 || v === 90) return "quarterly";
    if (v === 12 || v === 365) return "yearly";
    return fallback;
  }
  if (typeof v !== "string") return fallback;
  const s = v.trim().toLowerCase();
  if (!s) return fallback;
  if (/^(w|week|weekly|1w|주|週|周|每周|매주)/.test(s)) return "weekly";
  if (/^(q|quarter|quarterly|3m|3 ?month|분기|四半期|季度|每季)/.test(s)) return "quarterly";
  if (/^(y|year|yearly|annual|annually|12m|1y|연|年|매년|每年|年度)/.test(s)) return "yearly";
  if (/^(m|month|monthly|1m|월|月|매월|每月)/.test(s)) return "monthly";
  return fallback;
}

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

export function monthlyEquivalent(price: number, cycle: Cycle): number {
  if (!Number.isFinite(price)) return 0;
  switch (cycle) {
    case "weekly":
      return (price * 52) / 12;
    case "monthly":
      return price;
    case "quarterly":
      return price / 3;
    case "yearly":
      return price / 12;
  }
}

export function yearlyEquivalent(price: number, cycle: Cycle): number {
  if (!Number.isFinite(price)) return 0;
  switch (cycle) {
    case "weekly":
      return price * 52;
    case "monthly":
      return price * 12;
    case "quarterly":
      return price * 4;
    case "yearly":
      return price;
  }
}

export interface Totalable {
  price: number;
  currency: string;
  cycle: Cycle;
  status: SubStatus;
}

export interface CurrencyTotal {
  currency: string;
  monthly: number;
  yearly: number;
  count: number;
}

/** Group by currency. Paused and cancelled rows are left out of the money. */
export function totalsByCurrency<T extends Totalable>(subs: T[], onlyActive = true): CurrencyTotal[] {
  const map = new Map<string, CurrencyTotal>();
  for (const s of subs) {
    if (onlyActive && s.status !== "active") continue;
    const cur = normalizeCurrency(s.currency);
    const row = map.get(cur) ?? { currency: cur, monthly: 0, yearly: 0, count: 0 };
    row.monthly += monthlyEquivalent(s.price, s.cycle);
    row.yearly += yearlyEquivalent(s.price, s.cycle);
    row.count += 1;
    map.set(cur, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.currency.localeCompare(b.currency));
}

/* ---------- calendar days (local, DST-proof) ---------- */

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

function parts(key: string): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m, d];
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = parts(key);
  return new Date(y, m - 1, d);
}

export function daysUntil(key: string, today: Date = new Date()): number {
  const [y, m, d] = parts(key);
  const a = Date.UTC(y, m - 1, d);
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86_400_000);
}

function daysInMonth(y: number, m0: number): number {
  return new Date(y, m0 + 1, 0).getDate();
}

/** Adds n cycles, clamping the day to the target month (Jan 31 → Feb 28). */
export function addCycle(key: string, cycle: Cycle, n = 1): string {
  const [y, m, d] = parts(key);
  if (cycle === "weekly") {
    const dt = new Date(y, m - 1, d + 7 * n);
    return toDateKey(dt);
  }
  const months = cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12;
  const total = m - 1 + months * n;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return toDateKey(new Date(ny, nm, nd));
}

/** Rolls a renewal date forward until it is today or later. */
export function nextOnOrAfter(key: string, cycle: Cycle, today: Date = new Date()): string {
  let k = key;
  let guard = 0;
  while (daysUntil(k, today) < 0 && guard < 600) {
    k = addCycle(k, cycle, 1);
    guard += 1;
  }
  return k;
}

/* ---------- formatting ---------- */

export function roundMoney(amount: number, currency: string): number {
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  const f = 10 ** digits;
  return Math.round(amount * f) / f;
}

export function formatMoney(amount: number, currency: string, locale = "en-US"): string {
  const cur = normalizeCurrency(currency);
  const digits = ZERO_DECIMAL.has(cur) ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(digits)}`;
  }
}

export function formatDate(key: string, locale = "en-US"): string {
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(parseDateKey(key));
  } catch {
    return key;
  }
}

export function clampPrice(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^0-9.-]/g, "")) : NaN;
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, 1_000_000_000);
}
