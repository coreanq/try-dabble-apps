/**
 * Scanprice storage. Everything lives in THIS browser — no account, no server,
 * no crowd-sourced price feed.
 *
 * WHERE THINGS GO
 *   items     localStorage  "scanprice:items:v1"   (one entry per barcode, each
 *                                                   with its dated price rows)
 *   stores    derived from the rows themselves, so the recent-store chips are
 *             always the shops you actually used
 *   language  localStorage  "scanprice:lang" + the shared td_lang cookie
 *
 * EXPIRY RULE
 *   nothing expires. A code disappears only when you delete it, or when the
 *   browser's own "clear site data" wipes the origin. Closing the tab in the
 *   middle of the aisle and coming back next month keeps every row.
 */

import { normalizeCode } from "@/lib/barcode";

export const ITEMS_KEY = "scanprice:items:v1";

export const MAX_NAME = 80;
export const MAX_STORE = 40;
/** Big enough for an unrounded won price, small enough to stay a shelf price. */
export const MAX_PRICE = 99_999_999;
/** How many shops the store field offers as one-tap chips. */
export const RECENT_STORES = 6;

export interface PriceRow {
  id: string;
  /** Plain number. No currency, no unit maths — it is the shelf price. */
  price: number;
  /** Short tag the shopper types or picks. May be empty. */
  store: string;
  /** Local YYYY-MM-DD of the day it was seen. */
  day: string;
  createdAt: number;
}

export interface Item {
  /** Normalised EAN-13 / EAN-8 — the key the whole app files by. */
  code: string;
  /** Optional. A code with no name still works. */
  name: string;
  rows: PriceRow[];
  createdAt: number;
  updatedAt: number;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------------------------------------------- dates */

/** Local YYYY-MM-DD. Never UTC: "today's price" means the shopper's today. */
export function isoDay(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function today(): string {
  return isoDay();
}

function normalizeDay(raw: unknown): string {
  return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today();
}

export function formatDay(day: string, locale: string): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* -------------------------------------------------------------------- money */

/**
 * Accepts what a thumb actually types at the shelf: "3900", "3,900", "3.90",
 * "₩3900". Returns null when there is no number in there at all.
 */
export function parsePrice(raw: string): number | null {
  const cleaned = String(raw ?? "")
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) return null;
  // Two decimals is as fine as a shelf price ever gets.
  return Math.round(n * 100) / 100;
}

/** Grouped by locale, and only showing decimals when the price has them. */
export function formatPrice(price: number, locale: string): string {
  const fractionDigits = Number.isInteger(price) ? 0 : 2;
  return price.toLocaleString(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });
}

/* --------------------------------------------------------------------- crud */

export interface PriceDraft {
  price: number;
  store: string;
  day?: string;
}

export function newRow(draft: PriceDraft): PriceRow {
  return {
    id: uid(),
    price: draft.price,
    store: draft.store.trim().slice(0, MAX_STORE),
    day: normalizeDay(draft.day),
    createdAt: Date.now(),
  };
}

/** Newest row first — the price you are comparing against is the one on top. */
export function sortRows(rows: PriceRow[]): PriceRow[] {
  return [...rows].sort((a, b) => (a.day === b.day ? b.createdAt - a.createdAt : b.day.localeCompare(a.day)));
}

export function latestRow(item: Item): PriceRow | null {
  return sortRows(item.rows)[0] ?? null;
}

/** Codes whose newest row is newest overall sit on top: the shelf you were
 *  just standing at is the one you want to see when you look down. */
export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function findItem(items: Item[], code: string): Item | null {
  return items.find((i) => i.code === code) ?? null;
}

export function addItem(items: Item[], code: string, name: string, draft: PriceDraft): Item[] {
  const now = Date.now();
  const item: Item = {
    code,
    name: name.trim().slice(0, MAX_NAME),
    rows: [newRow(draft)],
    createdAt: now,
    updatedAt: now,
  };
  return [item, ...items];
}

export function addPrice(items: Item[], code: string, draft: PriceDraft): Item[] {
  return items.map((item) =>
    item.code === code
      ? { ...item, rows: [newRow(draft), ...item.rows], updatedAt: Date.now() }
      : item,
  );
}

export function renameItem(items: Item[], code: string, name: string): Item[] {
  return items.map((item) =>
    item.code === code
      ? { ...item, name: name.trim().slice(0, MAX_NAME), updatedAt: Date.now() }
      : item,
  );
}

export function deleteItem(items: Item[], code: string): Item[] {
  return items.filter((item) => item.code !== code);
}

/** Deleting the last row of a code deletes the code with it — an entry with no
 *  price is not a price history, it is a stray number. */
export function deleteRow(items: Item[], code: string, rowId: string): Item[] {
  const out: Item[] = [];
  for (const item of items) {
    if (item.code !== code) {
      out.push(item);
      continue;
    }
    const rows = item.rows.filter((r) => r.id !== rowId);
    if (rows.length > 0) out.push({ ...item, rows, updatedAt: Date.now() });
  }
  return out;
}

/* ------------------------------------------------------------------ stores */

/** The shops used most recently, newest first — the chips under the store box. */
export function recentStores(items: Item[], limit = RECENT_STORES): string[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    for (const row of item.rows) {
      const store = row.store.trim();
      if (!store) continue;
      const key = store.toLowerCase();
      const at = seen.get(key);
      if (at === undefined || row.createdAt > at) seen.set(key, row.createdAt);
    }
  }
  const labels = new Map<string, string>();
  for (const item of items) {
    for (const row of item.rows) {
      const store = row.store.trim();
      if (store) labels.set(store.toLowerCase(), store);
    }
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => labels.get(key) ?? key);
}

/* ---------------------------------------------------------------- persistence */

function normalizeRow(raw: unknown): PriceRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const price = typeof r.price === "number" ? r.price : parsePrice(String(r.price ?? ""));
  if (price === null || !Number.isFinite(price) || price < 0 || price > MAX_PRICE) return null;
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    price: Math.round(price * 100) / 100,
    store: typeof r.store === "string" ? r.store.trim().slice(0, MAX_STORE) : "",
    day: normalizeDay(r.day),
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
  };
}

function normalizeItem(raw: unknown): Item | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const code = normalizeCode(String(r.code ?? ""));
  if (!code) return null;
  const rows: PriceRow[] = [];
  if (Array.isArray(r.rows)) {
    for (const rawRow of r.rows) {
      const row = normalizeRow(rawRow);
      if (row) rows.push(row);
    }
  }
  // A code with no readable price row carries nothing worth keeping.
  if (rows.length === 0) return null;
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : Date.now();
  return {
    code,
    name: typeof r.name === "string" ? r.name.trim().slice(0, MAX_NAME) : "",
    rows: sortRows(rows),
    createdAt,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : createdAt,
  };
}

/** Accepts the stored array and the `{ items: [...] }` export shape, so a file
 *  exported from this app imports straight back. */
export function parseItems(parsed: unknown): Item[] {
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
      ? ((parsed as { items: unknown[] }).items as unknown[])
      : null;
  if (!list) return [];
  const byCode = new Map<string, Item>();
  for (const raw of list) {
    const item = normalizeItem(raw);
    if (!item) continue;
    const existing = byCode.get(item.code);
    // The same code twice in one file is one code with both sets of rows.
    if (existing) byCode.set(item.code, mergeItem(existing, item));
    else byCode.set(item.code, item);
  }
  return [...byCode.values()];
}

export function loadItems(): Item[] {
  try {
    const text = localStorage.getItem(ITEMS_KEY);
    if (!text) return [];
    return parseItems(JSON.parse(text));
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]): void {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch {
    /* quota or private mode — this session still works in memory */
  }
}

/** Same row id, or the same price at the same shop on the same day, counts as
 *  one row already on file. */
function mergeItem(current: Item, incoming: Item): Item {
  const ids = new Set(current.rows.map((r) => r.id));
  const seen = new Set(
    current.rows.map((r) => `${r.day}|${r.store.toLowerCase()}|${r.price}`),
  );
  const rows = [...current.rows];
  for (const row of incoming.rows) {
    const key = `${row.day}|${row.store.toLowerCase()}|${row.price}`;
    if (ids.has(row.id) || seen.has(key)) continue;
    ids.add(row.id);
    seen.add(key);
    rows.push(row);
  }
  return {
    ...current,
    name: current.name || incoming.name,
    rows: sortRows(rows),
    createdAt: Math.min(current.createdAt, incoming.createdAt),
    updatedAt: Math.max(current.updatedAt, incoming.updatedAt),
  };
}

/** Returns the merged list and how many price rows were genuinely new. */
export function mergeItems(current: Item[], incoming: Item[]): { items: Item[]; added: number } {
  const byCode = new Map(current.map((i) => [i.code, i]));
  let added = 0;
  for (const item of incoming) {
    const existing = byCode.get(item.code);
    if (!existing) {
      byCode.set(item.code, item);
      added += item.rows.length;
      continue;
    }
    const merged = mergeItem(existing, item);
    added += merged.rows.length - existing.rows.length;
    byCode.set(item.code, merged);
  }
  return { items: [...byCode.values()], added };
}

/* ------------------------------------------------------------------- search */

/** One box over the name and the code, digits-only so "8801" finds a code the
 *  user only half remembers. */
export function matchesQuery(item: Item, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (item.name.toLowerCase().includes(q)) return true;
  const digits = q.replace(/\D/g, "");
  if (digits && item.code.includes(digits)) return true;
  return item.rows.some((r) => r.store.toLowerCase().includes(q));
}

/* -------------------------------------------------------------------- delta */

export type DeltaKind = "up" | "down" | "same" | "first";

export interface Delta {
  kind: DeltaKind;
  amount: number;
}

/** How this row moved against the row directly below it in time. */
export function deltaFor(rows: PriceRow[], index: number): Delta {
  const previous = rows[index + 1];
  if (!previous) return { kind: "first", amount: 0 };
  const diff = Math.round((rows[index].price - previous.price) * 100) / 100;
  if (diff > 0) return { kind: "up", amount: diff };
  if (diff < 0) return { kind: "down", amount: -diff };
  return { kind: "same", amount: 0 };
}
