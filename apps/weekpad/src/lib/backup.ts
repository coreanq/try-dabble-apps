/**
 * The answer to "I reinstalled and it was all gone": one JSON file with every
 * category, expense and preference, restorable on any device. CSV is the
 * spreadsheet-friendly twin of the expense log. Both are built here with no
 * DOM so the tests can cover them.
 */
import { parsePrefs, type Prefs } from "./prefs.ts";
import { normalizeCategories, normalizeExpenses, type Category, type Expense } from "./store.ts";
import type { Lang } from "@/lib/i18n";

export interface Backup {
  app: "weekpad";
  version: 1;
  exportedAt: string;
  categories: Category[];
  expenses: Expense[];
  prefs: Prefs;
}

export function buildBackup(categories: Category[], expenses: Expense[], prefs: Prefs, now: Date = new Date()): Backup {
  return { app: "weekpad", version: 1, exportedAt: now.toISOString(), categories, expenses, prefs };
}

export function toJSON(backup: Backup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export interface ParsedBackup {
  categories: Category[];
  expenses: Expense[];
  prefs: Prefs | null;
}

/**
 * Accepts the weekpad backup shape. Damaged rows are dropped; a file with no
 * usable category or expense at all is rejected so a wrong file never wipes
 * the pad.
 */
export function parseBackup(raw: string, lang: Lang): ParsedBackup {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("bad shape");
  const o = data as Record<string, unknown>;
  if (o.app !== undefined && o.app !== "weekpad") throw new Error("not a weekpad backup");
  const categories = normalizeCategories(o.categories);
  const expenses = normalizeExpenses(o.expenses);
  if (!Array.isArray(o.categories) && !Array.isArray(o.expenses)) throw new Error("bad shape");
  if (categories.length === 0 && expenses.length === 0) throw new Error("empty");
  const prefs = o.prefs && typeof o.prefs === "object" ? parsePrefs(o.prefs, lang) : null;
  return { categories, expenses, prefs };
}

export function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** date,category,amount,note,currency — oldest first, one row per expense. */
export function toCSV(expenses: Expense[], categories: Category[], currency: string): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const rows = [...expenses]
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    .map((e) =>
      [csvCell(e.date), csvCell(names.get(e.categoryId) ?? ""), csvCell(e.amount), csvCell(e.note ?? ""), csvCell(currency)].join(","),
    );
  return ["date,category,amount,note,currency", ...rows].join("\r\n") + "\r\n";
}

export function backupFilename(kind: "backup" | "expenses", ext: "json" | "csv", d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `weekpad-${kind}-${y}-${m}-${day}.${ext}`;
}

export function download(text: string, name: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
