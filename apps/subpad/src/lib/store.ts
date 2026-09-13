/**
 * Local store: subscriptions, payments, custom categories, prefs.
 * Everything lives in this browser. Keys are namespaced so a reinstall of
 * another try-dabble app cannot collide. The JSON backup is the only way
 * off the device, and import is deliberately forgiving: a plain
 * `{ services: [...] }` list or a Renew404-style export is mapped when the
 * fields are obvious, and unknown keys are ignored rather than fatal.
 */
import {
  addCycle,
  clampPrice,
  coerceCycle,
  coerceDateKey,
  isStatus,
  normalizeCurrency,
  toDateKey,
  type Cycle,
  type SubStatus,
} from "./money.ts";
import { CATEGORY_MAP, TEMPLATE_MAP } from "./templates.ts";

export const SUBS_KEY = "subpad:subs:v1";
export const PAYMENTS_KEY = "subpad:payments:v1";
export const CATEGORIES_KEY = "subpad:categories:v1";
export const PREFS_KEY = "subpad:prefs:v1";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  nextRenewal: string;
  cycle: Cycle;
  categoryId?: string;
  notes?: string;
  website?: string;
  color?: string;
  iconKey?: string;
  status: SubStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  dueDate: string;
  completedAt?: string;
  amount?: number;
  currency?: string;
  status: "paid" | "skipped";
  note?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  color?: string;
}

export type SortKey = "renewal" | "name" | "price";
export type Window = "all" | "7" | "30" | "overdue";

export interface Prefs {
  defaultCurrency: string;
  filterCategory: string;
  filterCurrency: string;
  filterCycle: string;
  search: string;
  sort: SortKey;
  window: Window;
  hideCancelled: boolean;
}

export function defaultPrefs(): Prefs {
  return {
    defaultCurrency: "KRW",
    filterCategory: "",
    filterCurrency: "",
    filterCycle: "",
    search: "",
    sort: "renewal",
    window: "all",
    hideCancelled: true,
  };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const str = (v: unknown, fb: string) => (typeof v === "string" ? v.slice(0, 40) : fb);
  const sort = o.sort === "name" || o.sort === "price" || o.sort === "renewal" ? o.sort : base.sort;
  const window = o.window === "7" || o.window === "30" || o.window === "overdue" || o.window === "all" ? o.window : base.window;
  return {
    defaultCurrency: normalizeCurrency(o.defaultCurrency, base.defaultCurrency),
    filterCategory: str(o.filterCategory, ""),
    filterCurrency: str(o.filterCurrency, ""),
    filterCycle: str(o.filterCycle, ""),
    search: str(o.search, ""),
    sort,
    window,
    hideCancelled: typeof o.hideCancelled === "boolean" ? o.hideCancelled : base.hideCancelled,
  };
}

function read<T>(key: string, parse: (raw: unknown) => T, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : fallback();
  } catch {
    return fallback();
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function newId(prefix = "s"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pick(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}

function optString(v: unknown, max = 400): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().slice(0, max);
  return s || undefined;
}

function coerceStatus(v: unknown): SubStatus {
  if (isStatus(v)) return v;
  if (typeof v === "boolean") return v ? "active" : "cancelled";
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (/cancel|ended|inactive|취소|解約|已取消/.test(s)) return "cancelled";
    if (/pause|hold|일시|停止|暂停/.test(s)) return "paused";
  }
  return "active";
}

function coerceCategory(v: unknown, customs: CustomCategory[]): string | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const s = v.trim();
  if (CATEGORY_MAP[s]) return s;
  const lower = s.toLowerCase();
  for (const c of Object.values(CATEGORY_MAP)) {
    if (c.id === lower || Object.values(c.names).some((n) => n.toLowerCase() === lower)) return c.id;
  }
  if (/video|stream|tv|movie/.test(lower)) return "streaming";
  if (/music|audio/.test(lower)) return "music";
  if (/cloud|storage|backup/.test(lower)) return "cloud";
  if (/ai|gpt|llm/.test(lower)) return "ai";
  if (/game|gaming/.test(lower)) return "gaming";
  if (/work|productivity|tool|software|design/.test(lower)) return "productivity";
  if (/finance|bank|insurance|money/.test(lower)) return "finance";
  if (/edu|learn|course/.test(lower)) return "education";
  if (/domain|hosting|server/.test(lower)) return "domains";
  if (/vpn|network|internet|mobile|phone|telecom/.test(lower)) return "network";
  if (/shop|member/.test(lower)) return "shopping";
  if (/social/.test(lower)) return "social";
  if (/travel|transit|ride/.test(lower)) return "travel";
  if (/health|fitness|gym/.test(lower)) return "fitness";
  if (/news|magazine|book/.test(lower)) return "news";
  if (/util|rent|home|electric/.test(lower)) return "utilities";
  const custom = customs.find((c) => c.id === s || c.name.toLowerCase() === lower);
  return custom?.id;
}

/**
 * Accepts our own rows and the usual foreign spellings:
 * name|title|service, price|amount|cost, currency|cur, nextRenewal|nextBillingDate|
 * next_date|renewalDate|nextPayment|dueDate, cycle|billingCycle|period|frequency.
 */
export function normalizeSubscription(raw: unknown, customs: CustomCategory[] = [], now = new Date()): Subscription | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = optString(pick(o, ["name", "title", "service", "serviceName", "label"]), 80);
  if (!name) return null;
  const today = toDateKey(now);
  const nowIso = now.toISOString();
  const cycle = coerceCycle(pick(o, ["cycle", "billingCycle", "billing_cycle", "period", "frequency", "interval", "renewType"]));
  const templateId = typeof o.iconKey === "string" && TEMPLATE_MAP[o.iconKey] ? o.iconKey : typeof o.templateId === "string" && TEMPLATE_MAP[o.templateId] ? o.templateId : undefined;
  const categoryId = coerceCategory(pick(o, ["categoryId", "category", "category_id", "type", "group"]), customs) ?? (templateId ? TEMPLATE_MAP[templateId].categoryId : undefined);
  return {
    id: optString(o.id, 60) ?? newId("s"),
    name,
    price: clampPrice(pick(o, ["price", "amount", "cost", "fee"])),
    currency: normalizeCurrency(pick(o, ["currency", "cur", "currencyCode"]), "USD"),
    nextRenewal: coerceDateKey(pick(o, ["nextRenewal", "nextBillingDate", "next_billing_date", "nextDate", "next_date", "renewalDate", "renewal_date", "nextPayment", "nextPaymentDate", "dueDate", "date"]), today),
    cycle,
    categoryId,
    notes: optString(pick(o, ["notes", "note", "memo", "description"]), 400),
    website: optString(pick(o, ["website", "url", "link"]), 200),
    color: optString(o.color, 20),
    iconKey: templateId ?? optString(o.iconKey, 40),
    status: coerceStatus(pick(o, ["status", "active", "state"])),
    createdAt: optString(o.createdAt, 40) ?? nowIso,
    updatedAt: optString(o.updatedAt, 40) ?? nowIso,
  };
}

export function normalizePayment(raw: unknown, subIds?: Set<string>): Payment | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const subscriptionId = optString(pick(o, ["subscriptionId", "subId", "serviceId", "service_id"]), 60);
  if (!subscriptionId) return null;
  if (subIds && !subIds.has(subscriptionId)) return null;
  const status = o.status === "skipped" || o.skipped === true ? "skipped" : "paid";
  const dueDate = coerceDateKey(pick(o, ["dueDate", "due", "date", "paidAt", "paid_at"]), toDateKey(new Date()));
  const amount = pick(o, ["amount", "price"]);
  return {
    id: optString(o.id, 60) ?? newId("p"),
    subscriptionId,
    dueDate,
    completedAt: optString(pick(o, ["completedAt", "paidAt", "paid_at", "createdAt"]), 40),
    amount: amount === undefined ? undefined : clampPrice(amount),
    currency: typeof o.currency === "string" ? normalizeCurrency(o.currency) : undefined,
    status,
    note: optString(o.note, 200),
  };
}

export function normalizeCategory(raw: unknown): CustomCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = optString(pick(o, ["name", "label", "title"]), 40);
  if (!name) return null;
  const id = optString(o.id, 60) ?? `c-${name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-")}`;
  if (CATEGORY_MAP[id]) return null;
  return { id, name, color: optString(o.color, 20) };
}

export function parseSubscriptions(raw: unknown, customs: CustomCategory[] = []): Subscription[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Subscription[] = [];
  for (const r of raw) {
    const s = normalizeSubscription(r, customs);
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
}

export function parsePayments(raw: unknown, subIds?: Set<string>): Payment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => normalizePayment(r, subIds)).filter((p): p is Payment => p !== null);
}

export function parseCategories(raw: unknown): CustomCategory[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw
    .map(normalizeCategory)
    .filter((c): c is CustomCategory => c !== null && !seen.has(c.id) && (seen.add(c.id), true));
}

export function loadSubscriptions(customs: CustomCategory[] = []): Subscription[] {
  return read(SUBS_KEY, (r) => parseSubscriptions(r, customs), () => []);
}
export function saveSubscriptions(subs: Subscription[]): void {
  write(SUBS_KEY, subs);
}
export function loadPayments(): Payment[] {
  return read(PAYMENTS_KEY, (r) => parsePayments(r), () => []);
}
export function savePayments(p: Payment[]): void {
  write(PAYMENTS_KEY, p);
}
export function loadCategories(): CustomCategory[] {
  return read(CATEGORIES_KEY, parseCategories, () => []);
}
export function saveCategories(c: CustomCategory[]): void {
  write(CATEGORIES_KEY, c);
}
export function loadPrefs(): Prefs {
  return read(PREFS_KEY, parsePrefs, defaultPrefs);
}
export function savePrefs(p: Prefs): void {
  write(PREFS_KEY, p);
}

export function clearAll(): void {
  for (const k of [SUBS_KEY, PAYMENTS_KEY, CATEGORIES_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- pay / skip ---------- */

export interface PayResult {
  subscription: Subscription;
  payment: Payment;
}

/**
 * Marking a renewal paid (or skipped) records a history row for the due
 * date and moves nextRenewal forward by exactly one cycle. When the date
 * is far overdue it still advances one step at a time so the history is
 * honest; press again for the next one.
 */
export function settleRenewal(sub: Subscription, status: "paid" | "skipped", now = new Date()): PayResult {
  const due = sub.nextRenewal;
  const nowIso = now.toISOString();
  const payment: Payment = {
    id: newId("p"),
    subscriptionId: sub.id,
    dueDate: due,
    completedAt: nowIso,
    amount: status === "paid" ? sub.price : undefined,
    currency: status === "paid" ? sub.currency : undefined,
    status,
  };
  const subscription: Subscription = {
    ...sub,
    nextRenewal: addCycle(due, sub.cycle, 1),
    updatedAt: nowIso,
  };
  return { subscription, payment };
}

/* ---------- backup ---------- */

export const BACKUP_APP = "subpad";
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  subscriptions: Subscription[];
  payments: Payment[];
  categories: CustomCategory[];
  prefs: Prefs;
}

export function buildBackup(subs: Subscription[], payments: Payment[], categories: CustomCategory[], prefs: Prefs, now = new Date()): Backup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    subscriptions: subs,
    payments,
    categories,
    prefs,
  };
}

/**
 * Accepts: our backup; `{ subscriptions: [...] }`; `{ services: [...] }` or
 * `{ items: [...] }` (Renew404-ish and hand-made); a bare array of rows; or
 * `{ data: { ... } }` wrappers. Returns null only when nothing usable exists.
 */
export function parseBackup(raw: unknown): Backup | null {
  if (!raw || typeof raw !== "object") return null;
  let o = raw as Record<string, unknown>;
  if (Array.isArray(raw)) o = { subscriptions: raw };
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data) && !o.subscriptions && !o.services) {
    o = { ...o, ...(o.data as Record<string, unknown>) };
  }
  const categories = parseCategories(pick(o, ["categories", "customCategories"]));
  const rows = pick(o, ["subscriptions", "services", "subs", "items", "list", "entries"]);
  const subscriptions = parseSubscriptions(rows, categories);
  if (subscriptions.length === 0 && !Array.isArray(rows)) return null;
  const ids = new Set(subscriptions.map((s) => s.id));
  const payments = parsePayments(pick(o, ["payments", "history", "paymentHistory"]), ids);
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : new Date().toISOString(),
    subscriptions,
    payments,
    categories,
    prefs: parsePrefs(o.prefs),
  };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `subpad-${y}${m}${d}.json`;
}

export function download(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
