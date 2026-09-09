/**
 * weekpad:categories:v1 — Category[]  (name, planned per week, recurring, archived)
 * weekpad:expenses:v1   — Expense[]   (amount, category, note, YYYY-MM-DD date)
 *
 * Expenses are keyed by calendar date, never by week, so changing the week
 * start day or walking back through past weeks always re-derives the right
 * numbers. Nothing here touches the network.
 */
import { weekStartOf, isDateStr, type WeekStartsOn } from "./week.ts";

export const CATEGORIES_KEY = "weekpad:categories:v1";
export const EXPENSES_KEY = "weekpad:expenses:v1";

export interface Category {
  id: string;
  name: string;
  plannedWeekly: number;
  color?: string;
  /** true: the planned amount applies to every week. false: only the week it was made. */
  recurring: boolean;
  createdAt: string;
  archived?: boolean;
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  note?: string;
  /** YYYY-MM-DD, the day the money was spent. */
  date: string;
  createdAt: string;
}

export interface CategorySummary {
  planned: number;
  spent: number;
  /** planned - spent; negative when over. */
  remaining: number;
  /** spent / planned clamped to [0, 1]; 0 when nothing is planned. */
  ratio: number;
  over: boolean;
  /** Whether the planned amount applies to this week at all. */
  plannedThisWeek: boolean;
}

/** Soft planner palette for progress rails, assigned round-robin on create. */
export const CATEGORY_COLORS = ["#0d9488", "#2f7fb8", "#c4712b", "#8a5cc1", "#b8437a", "#5f8f2f", "#c99a1e", "#3a8a8a"];

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function normalizeCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.name !== "string" || !o.name.trim()) return null;
  const planned = typeof o.plannedWeekly === "string" ? Number(o.plannedWeekly) : o.plannedWeekly;
  if (!isFiniteNumber(planned) || planned < 0) return null;
  const createdAt = typeof o.createdAt === "string" && o.createdAt ? o.createdAt : new Date(0).toISOString();
  const cat: Category = {
    id: o.id,
    name: o.name.trim().slice(0, 60),
    plannedWeekly: roundMoney(planned),
    recurring: o.recurring !== false,
    createdAt,
  };
  if (typeof o.color === "string" && /^#[0-9a-fA-F]{6}$/.test(o.color)) cat.color = o.color;
  if (o.archived === true) cat.archived = true;
  return cat;
}

export function normalizeExpense(raw: unknown): Expense | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.categoryId !== "string") return null;
  const amount = typeof o.amount === "string" ? Number(o.amount) : o.amount;
  if (!isFiniteNumber(amount)) return null;
  if (!isDateStr(o.date)) return null;
  const createdAt = typeof o.createdAt === "string" && o.createdAt ? o.createdAt : new Date(0).toISOString();
  const exp: Expense = {
    id: o.id,
    categoryId: o.categoryId,
    amount: roundMoney(amount),
    date: o.date,
    createdAt,
  };
  if (typeof o.note === "string" && o.note.trim()) exp.note = o.note.trim().slice(0, 140);
  return exp;
}

export function normalizeCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const item of raw) {
    const c = normalizeCategory(item);
    if (c && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

export function normalizeExpenses(raw: unknown): Expense[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Expense[] = [];
  for (const item of raw) {
    const e = normalizeExpense(item);
    if (e && !seen.has(e.id)) {
      seen.add(e.id);
      out.push(e);
    }
  }
  return out;
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full: the session still works, it just will not persist */
  }
}

export function loadCategories(): Category[] {
  return normalizeCategories(readJson(CATEGORIES_KEY));
}
export function saveCategories(list: Category[]): void {
  writeJson(CATEGORIES_KEY, list);
}
export function loadExpenses(): Expense[] {
  return normalizeExpenses(readJson(EXPENSES_KEY));
}
export function saveExpenses(list: Expense[]): void {
  writeJson(EXPENSES_KEY, list);
}
export function clearStore(): void {
  try {
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(EXPENSES_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** The week a category was created in, by its local creation date. */
export function categoryWeek(cat: Category, weekStartsOn: WeekStartsOn): string {
  const d = new Date(cat.createdAt);
  if (Number.isNaN(d.getTime())) return "";
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return weekStartOf(local, weekStartsOn);
}

/**
 * Recurring categories carry their planned amount into every week without
 * being re-entered. A one-off category is planned only for the week it was
 * created in; in any other week it shows spending but no plan.
 */
export function plannedFor(cat: Category, weekStart: string, weekStartsOn: WeekStartsOn): number {
  if (cat.recurring) return cat.plannedWeekly;
  return categoryWeek(cat, weekStartsOn) === weekStart ? cat.plannedWeekly : 0;
}

export function isPlannedThisWeek(cat: Category, weekStart: string, weekStartsOn: WeekStartsOn): boolean {
  return cat.recurring || categoryWeek(cat, weekStartsOn) === weekStart;
}

export function weekExpenses(expenses: Expense[], weekStart: string, weekStartsOn: WeekStartsOn): Expense[] {
  return expenses
    .filter((e) => weekStartOf(e.date, weekStartsOn) === weekStart)
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}

export function spentFor(expenses: Expense[], categoryId: string, weekStart: string, weekStartsOn: WeekStartsOn): number {
  let sum = 0;
  for (const e of expenses) {
    if (e.categoryId === categoryId && weekStartOf(e.date, weekStartsOn) === weekStart) sum += e.amount;
  }
  return roundMoney(sum);
}

export function summarize(cat: Category, expenses: Expense[], weekStart: string, weekStartsOn: WeekStartsOn): CategorySummary {
  const planned = plannedFor(cat, weekStart, weekStartsOn);
  const spent = spentFor(expenses, cat.id, weekStart, weekStartsOn);
  const remaining = roundMoney(planned - spent);
  const ratio = planned > 0 ? Math.min(1, Math.max(0, spent / planned)) : 0;
  return {
    planned,
    spent,
    remaining,
    ratio,
    over: spent > planned,
    plannedThisWeek: isPlannedThisWeek(cat, weekStart, weekStartsOn),
  };
}

export function totals(categories: Category[], expenses: Expense[], weekStart: string, weekStartsOn: WeekStartsOn) {
  let planned = 0;
  let spent = 0;
  const active = new Set<string>();
  for (const c of categories) {
    if (c.archived) continue;
    active.add(c.id);
    planned += plannedFor(c, weekStart, weekStartsOn);
  }
  for (const e of expenses) {
    if (weekStartOf(e.date, weekStartsOn) === weekStart) spent += e.amount;
  }
  planned = roundMoney(planned);
  spent = roundMoney(spent);
  const remaining = roundMoney(planned - spent);
  return { planned, spent, remaining, ratio: planned > 0 ? Math.min(1, Math.max(0, spent / planned)) : 0, over: spent > planned };
}

export function nextColor(categories: Category[]): string {
  return CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
}
