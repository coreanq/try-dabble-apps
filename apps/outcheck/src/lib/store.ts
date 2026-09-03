/**
 * localStorage only. Keys:
 *   outcheck:items  — the list (ids, custom labels, order)
 *   outcheck:day    — local YYYY-MM-DD the checks belong to
 *   outcheck:checks — map of item id → ISO timestamp, TODAY only
 * Nothing here talks to a server.
 */
import { localDayKey, pruneChecks, rollover, type Checks, type DayState } from "@/lib/day";

export const ITEMS_KEY = "outcheck:items";
export const DAY_KEY = "outcheck:day";
export const CHECKS_KEY = "outcheck:checks";

export type DefaultId = "door" | "gas" | "garage";
export const DEFAULT_IDS: DefaultId[] = ["door", "gas", "garage"];

export interface Item {
  id: string;
  /** null = still the stock label, shown in the active language. */
  label: string | null;
}

export function isDefaultId(id: string): id is DefaultId {
  return (DEFAULT_IDS as string[]).includes(id);
}

export function defaultItems(): Item[] {
  return DEFAULT_IDS.map((id) => ({ id, label: null }));
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full — the session still works, it just will not stick */
  }
}

export function loadItems(): Item[] {
  const raw = readJson<unknown>(ITEMS_KEY);
  if (!Array.isArray(raw)) return defaultItems();
  const out: Item[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    const label = (row as { label?: unknown }).label;
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label: typeof label === "string" && label.trim() ? label : null });
  }
  return out;
}

export function saveItems(items: Item[]): void {
  writeJson(ITEMS_KEY, items);
}

export function loadDayState(): DayState {
  const day = (() => {
    try {
      return localStorage.getItem(DAY_KEY);
    } catch {
      return null;
    }
  })();
  const checks = readJson<Checks>(CHECKS_KEY);
  const stored: DayState | null =
    day && checks && typeof checks === "object" ? { day, checks } : null;
  const state = rollover(stored, localDayKey());
  if (!stored || stored.day !== state.day) saveDayState(state);
  return state;
}

export function saveDayState(state: DayState): void {
  try {
    localStorage.setItem(DAY_KEY, state.day);
  } catch {
    /* see writeJson */
  }
  writeJson(CHECKS_KEY, state.checks);
}

export function uid(): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `c-${Date.now().toString(36)}-${rnd}`;
}

export function moveItem(items: Item[], id: string, delta: number): Item[] {
  const from = items.findIndex((it) => it.id === id);
  if (from < 0) return items;
  const to = from + delta;
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export { pruneChecks };
