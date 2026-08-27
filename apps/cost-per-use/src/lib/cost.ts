/**
 * Storage and arithmetic ported verbatim from the pre-Vite public/app.js.
 * The keys are unchanged so a returning visitor keeps their ledger:
 *   cost-per-use:items:v2  (migrated from :v1 on first load)
 *   cost-per-use:sort:v1
 */

import type { Lang } from "@/lib/i18n";

/** Money formatting follows the chosen language, exactly as it did before. */
export const LOCALE_INFO: Record<Lang, { locale: string; currency: string }> = {
  en: { locale: "en-US", currency: "USD" },
  ko: { locale: "ko-KR", currency: "KRW" },
  zh: { locale: "zh-CN", currency: "CNY" },
  ja: { locale: "ja-JP", currency: "JPY" },
};

export const STORAGE_KEY = "cost-per-use:items:v2";
export const STORAGE_KEY_V1 = "cost-per-use:items:v1";
export const SORT_KEY = "cost-per-use:sort:v1";

export type LifetimeUnit = "days" | "months" | "years";

export interface Item {
  id: string;
  name: string;
  price: number;
  /** ISO yyyy-mm-dd, read as a local date so "days owned" never drifts. */
  purchaseDate: string;
  timesUsed: number | null;
  lifetimeValue: number | null;
  lifetimeUnit: LifetimeUnit;
  createdAt?: string;
  updatedAt?: string;
}

export const SORT_IDS = ["recent", "perDay", "name"] as const;
export type SortId = (typeof SORT_IDS)[number];

export function isSortId(value: unknown): value is SortId {
  return typeof value === "string" && (SORT_IDS as readonly string[]).includes(value);
}

export function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isLifetimeUnit(value: unknown): value is LifetimeUnit {
  return value === "days" || value === "months" || value === "years";
}

export function normalizeItem(raw: Record<string, unknown>): Item {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
    name: String(raw.name ?? ""),
    price: Number(raw.price) || 0,
    purchaseDate: String(raw.purchaseDate ?? todayISO()),
    timesUsed: toNumberOrNull(raw.timesUsed),
    lifetimeValue: toNumberOrNull(raw.lifetimeValue),
    /* v1 rows had no unit at all; days keeps their old numbers meaning days. */
    lifetimeUnit: isLifetimeUnit(raw.lifetimeUnit) ? raw.lifetimeUnit : "days",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

/** v2 if present, else migrate whatever v1 held and write it forward once. */
export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const v1 = localStorage.getItem(STORAGE_KEY_V1);
      if (v1) {
        const parsed: unknown = JSON.parse(v1);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map((it) =>
            normalizeItem({ ...(it as Record<string, unknown>), lifetimeValue: null, lifetimeUnit: "days" }),
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((it) => normalizeItem(it as Record<string, unknown>))
      : [];
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* private mode — the ledger just won't survive a reload */
  }
}

export function loadSort(): SortId {
  try {
    const saved = localStorage.getItem(SORT_KEY);
    return isSortId(saved) ? saved : "recent";
  } catch {
    return "recent";
  }
}

export function saveSort(sort: SortId): void {
  try {
    localStorage.setItem(SORT_KEY, sort);
  } catch {
    /* ignore */
  }
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function daysSince(iso: string): number {
  const start = parseLocalDate(iso);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(Math.floor((today.getTime() - start.getTime()) / 86400000), 0);
}

/** Calendar-average months and years, same constants as the old app. */
export function lifetimeToDays(value: number | null, unit: LifetimeUnit): number {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (unit === "months") return v * 30.44;
  if (unit === "years") return v * 365.25;
  return v;
}

export interface Metrics {
  ownedDays: number;
  lifetimeDays: number;
  /** Headline daily cost: over the expected life when set, else over days owned. */
  perDay: number;
  /** Price spread over the days owned so far — only interesting beside a life. */
  perDaySoFar: number;
  perUse: number | null;
  /** True when no useful life was given, so perDay fell back to days owned. */
  usesLifetimeFallback: boolean;
}

export interface MetricsInput {
  price: number;
  purchaseDate: string;
  timesUsed: number | null;
  lifetimeValue: number | null;
  lifetimeUnit: LifetimeUnit;
}

export function calcMetrics(item: MetricsInput): Metrics {
  const price = Number(item.price) || 0;
  const ownedDays = daysSince(item.purchaseDate);
  const lifetimeDays = lifetimeToDays(item.lifetimeValue, item.lifetimeUnit);
  const perDaySoFar = price / Math.max(ownedDays, 1);
  const usesLifetimeFallback = !(lifetimeDays > 0);
  const perDay = usesLifetimeFallback ? perDaySoFar : price / lifetimeDays;
  const times = item.timesUsed;
  const perUse = times != null && Number(times) > 0 ? price / Number(times) : null;
  return { ownedDays, lifetimeDays, perDay, perDaySoFar, perUse, usesLifetimeFallback };
}

export function formatMoney(n: number, lang: Lang): string {
  if (!Number.isFinite(n)) return "—";
  const { locale, currency } = LOCALE_INFO[lang] ?? LOCALE_INFO.en;
  const whole = currency === "KRW" || currency === "JPY";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(whole ? Math.round(n) : Math.round(n * 100) / 100);
  } catch {
    return String(Math.round(n));
  }
}

export function formatCount(n: number, lang: Lang): string {
  const { locale } = LOCALE_INFO[lang] ?? LOCALE_INFO.en;
  try {
    return n.toLocaleString(locale);
  } catch {
    return String(n);
  }
}

export function sortItems(items: Item[], sort: SortId, lang: Lang): Item[] {
  const copy = [...items];
  const { locale } = LOCALE_INFO[lang] ?? LOCALE_INFO.en;
  if (sort === "name") {
    copy.sort((a, b) => a.name.localeCompare(b.name, locale));
  } else if (sort === "perDay") {
    copy.sort((a, b) => calcMetrics(b).perDay - calcMetrics(a).perDay);
  } else {
    copy.sort((a, b) => String(b.purchaseDate).localeCompare(String(a.purchaseDate)));
  }
  return copy;
}
