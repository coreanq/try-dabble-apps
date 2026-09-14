/**
 * Envelope maths. Pure functions over plain rows so node --test can prove
 * the recompute rules without a DOM:
 *
 *   incomeTotal(period) = sum of earnings in the plan currency for the period
 *   percent envelope    = incomeTotal * value / 100
 *   fixed envelope      = value
 *   allocated           = sum of resolved envelopes
 *   buffer              = incomeTotal - allocated (negative = over-allocated)
 *
 * There is deliberately no envelope cap constant anywhere. Earnings in another
 * currency are counted separately and never converted.
 */
import { monthKeyOf, normalizeCurrency, yearKeyOf } from "./money.ts";

export type IncomeMode = "biweekly" | "monthly" | "irregular";
export type EnvelopeKind = "percent" | "fixed";
export type EnvelopeCategory = "savings" | "debt" | "bills" | "sinking" | "flexible";
export type View = "monthly" | "annual";

export const INCOME_MODES: IncomeMode[] = ["biweekly", "monthly", "irregular"];
export const KINDS: EnvelopeKind[] = ["percent", "fixed"];
export const CATEGORIES: EnvelopeCategory[] = ["savings", "debt", "bills", "sinking", "flexible"];
export const VIEWS: View[] = ["monthly", "annual"];

export const CATEGORY_COLOR: Record<EnvelopeCategory, string> = {
  savings: "#0f766e",
  debt: "#e11d48",
  bills: "#1e293b",
  sinking: "#7c3aed",
  flexible: "#ca8a04",
};

export interface Plan {
  id: string;
  name: string;
  incomeMode: IncomeMode;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Earning {
  id: string;
  planId: string;
  amount: number;
  currency?: string;
  date: string;
  label?: string;
  createdAt: string;
}

export interface Envelope {
  id: string;
  planId: string;
  name: string;
  kind: EnvelopeKind;
  value: number;
  category: EnvelopeCategory;
  sortOrder?: number;
  createdAt: string;
}

export type Period = { kind: "month"; key: string } | { kind: "year"; key: string } | { kind: "all" };

export function isIncomeMode(v: unknown): v is IncomeMode {
  return v === "biweekly" || v === "monthly" || v === "irregular";
}
export function isKind(v: unknown): v is EnvelopeKind {
  return v === "percent" || v === "fixed";
}
export function isCategory(v: unknown): v is EnvelopeCategory {
  return v === "savings" || v === "debt" || v === "bills" || v === "sinking" || v === "flexible";
}
export function isView(v: unknown): v is View {
  return v === "monthly" || v === "annual";
}

export function newId(prefix = "x"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function inPeriod(dateKey: string, period: Period): boolean {
  if (period.kind === "all") return true;
  if (period.kind === "month") return monthKeyOf(dateKey) === period.key;
  return yearKeyOf(dateKey) === period.key;
}

export function earningsFor(earnings: Earning[], planId: string, period: Period): Earning[] {
  return earnings.filter((e) => e.planId === planId && inPeriod(e.date, period)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1));
}

export function earningCurrency(e: Earning, planCurrency: string): string {
  return normalizeCurrency(e.currency, planCurrency);
}

export interface IncomeSummary {
  /** Sum in the plan currency: the number envelopes are resolved against. */
  total: number;
  /** Every currency seen, plan currency first. Never merged. */
  byCurrency: { currency: string; total: number; count: number }[];
  count: number;
}

export function incomeSummary(rows: Earning[], planCurrency: string): IncomeSummary {
  const cur = normalizeCurrency(planCurrency);
  const map = new Map<string, { currency: string; total: number; count: number }>();
  for (const e of rows) {
    const c = earningCurrency(e, cur);
    const row = map.get(c) ?? { currency: c, total: 0, count: 0 };
    row.total += Number.isFinite(e.amount) ? e.amount : 0;
    row.count += 1;
    map.set(c, row);
  }
  const byCurrency = [...map.values()].sort((a, b) => (a.currency === cur ? -1 : b.currency === cur ? 1 : a.currency.localeCompare(b.currency)));
  return { total: map.get(cur)?.total ?? 0, byCurrency, count: rows.length };
}

export function incomeTotal(earnings: Earning[], plan: Pick<Plan, "id" | "currency">, period: Period): number {
  return incomeSummary(earningsFor(earnings, plan.id, period), plan.currency).total;
}

export function resolveEnvelope(env: Pick<Envelope, "kind" | "value">, income: number): number {
  const v = Number.isFinite(env.value) ? env.value : 0;
  const base = Number.isFinite(income) ? income : 0;
  return env.kind === "percent" ? (base * v) / 100 : v;
}

export interface ResolvedEnvelope {
  envelope: Envelope;
  amount: number;
  /** Share of income, 0–1, for the bar widths. */
  share: number;
}

export interface Allocation {
  income: number;
  rows: ResolvedEnvelope[];
  allocated: number;
  /** income - allocated; negative when over-allocated. */
  buffer: number;
  over: boolean;
  percentSum: number;
  fixedSum: number;
  byCategory: { category: EnvelopeCategory; amount: number; share: number }[];
}

export function sortEnvelopes(envelopes: Envelope[]): Envelope[] {
  return [...envelopes].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.createdAt < b.createdAt ? -1 : 1));
}

export function allocate(envelopes: Envelope[], income: number): Allocation {
  const base = Number.isFinite(income) ? income : 0;
  const rows = sortEnvelopes(envelopes).map((envelope) => {
    const amount = resolveEnvelope(envelope, base);
    return { envelope, amount, share: base > 0 ? amount / base : 0 };
  });
  const allocated = rows.reduce((s, r) => s + r.amount, 0);
  const percentSum = envelopes.filter((e) => e.kind === "percent").reduce((s, e) => s + e.value, 0);
  const fixedSum = envelopes.filter((e) => e.kind === "fixed").reduce((s, e) => s + e.value, 0);
  const cat = new Map<EnvelopeCategory, number>();
  for (const r of rows) cat.set(r.envelope.category, (cat.get(r.envelope.category) ?? 0) + r.amount);
  const byCategory = CATEGORIES.filter((c) => cat.has(c)).map((category) => {
    const amount = cat.get(category) ?? 0;
    return { category, amount, share: base > 0 ? amount / base : 0 };
  });
  return { income: base, rows, allocated, buffer: base - allocated, over: allocated > base + 1e-9, percentSum, fixedSum, byCategory };
}

/** One row per month of the year, in order, for the annual chart. */
export interface MonthRow {
  month: string;
  income: number;
  allocated: number;
  buffer: number;
  count: number;
}

export function monthlyRows(earnings: Earning[], envelopes: Envelope[], plan: Pick<Plan, "id" | "currency">, year: string): MonthRow[] {
  const out: MonthRow[] = [];
  for (let m = 1; m <= 12; m += 1) {
    const month = `${year}-${String(m).padStart(2, "0")}`;
    const rows = earningsFor(earnings, plan.id, { kind: "month", key: month });
    const income = incomeSummary(rows, plan.currency).total;
    // A month with no income still carries its fixed envelopes; that is the honest number.
    const a = rows.length > 0 ? allocate(envelopes, income) : { allocated: 0, buffer: 0 };
    out.push({ month, income, allocated: a.allocated, buffer: a.buffer, count: rows.length });
  }
  return out;
}

/** Annual totals: income for the year, fixed envelopes counted once per month that had income, percent envelopes on the year's income. */
export function annualAllocation(earnings: Earning[], envelopes: Envelope[], plan: Pick<Plan, "id" | "currency">, year: string): Allocation & { months: MonthRow[] } {
  const months = monthlyRows(earnings, envelopes, plan, year);
  const income = months.reduce((s, r) => s + r.income, 0);
  const activeMonths = months.filter((r) => r.count > 0).length;
  const rows = sortEnvelopes(envelopes).map((envelope) => {
    const amount = envelope.kind === "percent" ? (income * envelope.value) / 100 : envelope.value * activeMonths;
    return { envelope, amount, share: income > 0 ? amount / income : 0 };
  });
  const allocated = rows.reduce((s, r) => s + r.amount, 0);
  const cat = new Map<EnvelopeCategory, number>();
  for (const r of rows) cat.set(r.envelope.category, (cat.get(r.envelope.category) ?? 0) + r.amount);
  const byCategory = CATEGORIES.filter((c) => cat.has(c)).map((category) => {
    const amount = cat.get(category) ?? 0;
    return { category, amount, share: income > 0 ? amount / income : 0 };
  });
  return {
    income,
    rows,
    allocated,
    buffer: income - allocated,
    over: allocated > income + 1e-9,
    percentSum: envelopes.filter((e) => e.kind === "percent").reduce((s, e) => s + e.value, 0),
    fixedSum: envelopes.filter((e) => e.kind === "fixed").reduce((s, e) => s + e.value, 0),
    byCategory,
    months,
  };
}

/* ---------- plan helpers ---------- */

export function makePlan(name: string, currency = "USD", incomeMode: IncomeMode = "monthly", now = new Date()): Plan {
  const iso = now.toISOString();
  return { id: newId("p"), name: name.trim() || "Plan", incomeMode, currency: normalizeCurrency(currency), createdAt: iso, updatedAt: iso };
}

export function renamePlan(plan: Plan, name: string, now = new Date()): Plan {
  const next = name.trim();
  if (!next) return plan;
  return { ...plan, name: next.slice(0, 80), updatedAt: now.toISOString() };
}

/**
 * Duplicate = new plan with the same settings and a fresh copy of every
 * envelope (new ids). Earnings are NOT copied: a copy is a template for the
 * next period, not a second history.
 */
export function duplicatePlan(plan: Plan, envelopes: Envelope[], copySuffix = " (copy)", now = new Date()): { plan: Plan; envelopes: Envelope[] } {
  const iso = now.toISOString();
  const next: Plan = { ...plan, id: newId("p"), name: `${plan.name}${copySuffix}`.slice(0, 80), createdAt: iso, updatedAt: iso };
  const copies = sortEnvelopes(envelopes.filter((e) => e.planId === plan.id)).map((e, i) => ({ ...e, id: newId("e"), planId: next.id, sortOrder: i, createdAt: iso }));
  return { plan: next, envelopes: copies };
}

export function makeEnvelope(planId: string, name: string, kind: EnvelopeKind, value: number, category: EnvelopeCategory, sortOrder = 0, now = new Date()): Envelope {
  return { id: newId("e"), planId, name: name.trim().slice(0, 80) || "Envelope", kind, value, category, sortOrder, createdAt: now.toISOString() };
}

export function makeEarning(planId: string, amount: number, date: string, label?: string, currency?: string, now = new Date()): Earning {
  const e: Earning = { id: newId("i"), planId, amount, date, createdAt: now.toISOString() };
  const l = label?.trim().slice(0, 120);
  if (l) e.label = l;
  if (currency) e.currency = normalizeCurrency(currency);
  return e;
}
