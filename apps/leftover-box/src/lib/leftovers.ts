import { addDaysISO, todayISO } from "@/lib/dates";

export const ITEMS_KEY = "leftover-box:items:v1";

/** Days between "cooked on" and the default "eat by". */
export const DEFAULT_SHELF_DAYS = 3;
export const MAX_NAME = 120;
export const MAX_NOTE = 200;

export type Status = "open" | "eaten";
export type StoredLocation = "" | "fridge" | "freezer" | "other";

export const LOCATIONS: StoredLocation[] = ["fridge", "freezer", "other"];

export interface Leftover {
  id: string;
  name: string;
  cookedOn: string;
  eatBy: string;
  location: StoredLocation;
  note: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
  eatenAt: number | null;
  eatenOn: string;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isLocation(value: unknown): value is StoredLocation {
  return typeof value === "string" && (LOCATIONS as string[]).includes(value);
}

/** Accepts both the bare array and the { v, items } export envelope. */
function toArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)) {
    return (parsed as { items: unknown[] }).items;
  }
  return [];
}

export function normalize(raw: unknown): Leftover | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!r.name) return null;
  const now = Date.now();
  const cookedOn = typeof r.cookedOn === "string" && r.cookedOn ? r.cookedOn : todayISO();
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    name: String(r.name).slice(0, MAX_NAME),
    cookedOn,
    eatBy:
      typeof r.eatBy === "string" && r.eatBy
        ? r.eatBy
        : addDaysISO(cookedOn, DEFAULT_SHELF_DAYS),
    location: isLocation(r.location) ? r.location : "",
    note: r.note ? String(r.note).slice(0, MAX_NOTE) : "",
    status: r.status === "eaten" ? "eaten" : "open",
    createdAt: typeof r.createdAt === "number" ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : now,
    eatenAt: typeof r.eatenAt === "number" ? r.eatenAt : null,
    eatenOn: typeof r.eatenOn === "string" ? r.eatenOn : "",
  };
}

export function loadItems(): Leftover[] {
  try {
    const rawText = localStorage.getItem(ITEMS_KEY);
    if (!rawText) return [];
    return toArray(JSON.parse(rawText))
      .map(normalize)
      .filter((it): it is Leftover => it !== null);
  } catch {
    return [];
  }
}

export function saveItems(items: Leftover[]): void {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch {
    /* quota or private mode — the in-memory list still works this session */
  }
}

/** Merge imported records over existing ones, matching on id. */
export function mergeImported(current: Leftover[], parsed: unknown): Leftover[] {
  const list = toArray(parsed);
  if (list.length === 0) throw new Error("no items");
  const byId = new Map(current.map((it) => [it.id, it]));
  for (const raw of list) {
    const next = normalize(raw);
    if (next) byId.set(next.id, next);
  }
  return Array.from(byId.values());
}

export function sortForStatus(items: Leftover[], status: Status): Leftover[] {
  const shown = items.filter((it) => it.status === status);
  if (status === "open") {
    return shown.sort(
      (a, b) => a.eatBy.localeCompare(b.eatBy) || a.createdAt - b.createdAt,
    );
  }
  return shown.sort(
    (a, b) => (b.eatenAt ?? b.updatedAt) - (a.eatenAt ?? a.updatedAt),
  );
}
