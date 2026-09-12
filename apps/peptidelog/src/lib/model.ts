/**
 * peptidelog:compounds:v1  Compound[]   name, unit label, notes, default dose, half-life
 * peptidelog:vials:v1      Vial[]       per-compound vial with remaining amount + low-stock line
 * peptidelog:logs:v1       DoseLog[]    one injection: amount, instant, local day, site, notes
 * peptidelog:schedules:v1  Schedule[]   named protocol: compound, dose, times, weekdays or every N days
 * peptidelog:supplies:v1   Supply[]     optional swabs / syringes / water checklist
 *
 * Plain arrays in localStorage. Nothing here touches the network and nothing
 * here recommends a dose: the app stores what the person typed, full stop.
 * Every reader goes through a normalize* so a damaged row is dropped instead
 * of crashing the tracker, and an imported backup gets the same treatment.
 */
import { DATE_RE, TIME_RE, dateKeyOfIso } from "./dates.ts";

export const COMPOUNDS_KEY = "peptidelog:compounds:v1";
export const VIALS_KEY = "peptidelog:vials:v1";
export const LOGS_KEY = "peptidelog:logs:v1";
export const SCHEDULES_KEY = "peptidelog:schedules:v1";
export const SUPPLIES_KEY = "peptidelog:supplies:v1";

export const NAME_MAX = 60;
export const NOTES_MAX = 400;
export const UNIT_LABELS = ["mcg", "mg", "IU", "units", "mL"] as const;
export type UnitLabel = (typeof UNIT_LABELS)[number];

export interface Compound {
  id: string;
  name: string;
  unitLabel?: string;
  notes?: string;
  defaultDose?: number;
  halfLifeHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vial {
  id: string;
  compoundId: string;
  label?: string;
  vialMg: number;
  diluentMl?: number;
  remainingMg?: number;
  remainingMl?: number;
  lowStockThreshold?: number;
  reconstitutedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoseLog {
  id: string;
  compoundId: string;
  vialId?: string;
  amount: number;
  unitLabel?: string;
  datetime: string;
  date: string;
  site?: string;
  notes?: string;
  /** Set when the log was created by "mark done" on a schedule slot. */
  scheduleId?: string;
  scheduleTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  compoundId: string;
  doseAmount: number;
  unitLabel?: string;
  times: string[];
  daysOfWeek: number[];
  intervalDays?: number;
  sitePrefer?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supply {
  id: string;
  name: string;
  qty?: number;
  lowAt?: number;
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const EPOCH = new Date(0).toISOString();

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

function isoOr(v: unknown, fallback: string): string {
  return typeof v === "string" && v && !Number.isNaN(new Date(v).getTime()) ? v : fallback;
}

/** Finite, non-negative number; strings are accepted ("5" → 5). */
export function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v.trim()) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return undefined;
  return n;
}

// ---- normalize ----------------------------------------------------------

export function normalizeCompound(raw: unknown): Compound | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  const name = str(o.name, NAME_MAX);
  if (!name) return null;
  const createdAt = isoOr(o.createdAt, EPOCH);
  const c: Compound = { id: o.id, name, createdAt, updatedAt: isoOr(o.updatedAt, createdAt) };
  const unit = str(o.unitLabel, 12);
  if (unit) c.unitLabel = unit;
  const notes = str(o.notes, NOTES_MAX);
  if (notes) c.notes = notes;
  const dd = num(o.defaultDose);
  if (dd !== undefined && dd > 0) c.defaultDose = dd;
  const hl = num(o.halfLifeHours);
  if (hl !== undefined && hl > 0) c.halfLifeHours = hl;
  return c;
}

export function normalizeVial(raw: unknown): Vial | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.compoundId !== "string" || !o.compoundId) return null;
  const vialMg = num(o.vialMg);
  if (vialMg === undefined) return null;
  const createdAt = isoOr(o.createdAt, EPOCH);
  const v: Vial = { id: o.id, compoundId: o.compoundId, vialMg, createdAt, updatedAt: isoOr(o.updatedAt, createdAt) };
  const label = str(o.label, NAME_MAX);
  if (label) v.label = label;
  const dil = num(o.diluentMl);
  if (dil !== undefined) v.diluentMl = dil;
  const rMg = num(o.remainingMg);
  if (rMg !== undefined) v.remainingMg = rMg;
  const rMl = num(o.remainingMl);
  if (rMl !== undefined) v.remainingMl = rMl;
  const low = num(o.lowStockThreshold);
  if (low !== undefined) v.lowStockThreshold = low;
  if (typeof o.reconstitutedAt === "string" && o.reconstitutedAt && !Number.isNaN(new Date(o.reconstitutedAt).getTime())) v.reconstitutedAt = o.reconstitutedAt;
  const notes = str(o.notes, NOTES_MAX);
  if (notes) v.notes = notes;
  return v;
}

export function normalizeLog(raw: unknown): DoseLog | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.compoundId !== "string" || !o.compoundId) return null;
  const amount = num(o.amount);
  if (amount === undefined) return null;
  const datetime = isoOr(o.datetime, "");
  if (!datetime) return null;
  const date = typeof o.date === "string" && DATE_RE.test(o.date) ? o.date : dateKeyOfIso(datetime);
  const createdAt = isoOr(o.createdAt, datetime);
  const l: DoseLog = { id: o.id, compoundId: o.compoundId, amount, datetime, date, createdAt, updatedAt: isoOr(o.updatedAt, createdAt) };
  const vialId = str(o.vialId, 80);
  if (vialId) l.vialId = vialId;
  const unit = str(o.unitLabel, 12);
  if (unit) l.unitLabel = unit;
  const site = str(o.site, 40);
  if (site) l.site = site;
  const notes = str(o.notes, NOTES_MAX);
  if (notes) l.notes = notes;
  const sid = str(o.scheduleId, 80);
  if (sid) l.scheduleId = sid;
  if (typeof o.scheduleTime === "string" && TIME_RE.test(o.scheduleTime)) l.scheduleTime = o.scheduleTime;
  return l;
}

export function normalizeSchedule(raw: unknown): Schedule | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.compoundId !== "string" || !o.compoundId) return null;
  const name = str(o.name, NAME_MAX);
  if (!name) return null;
  const doseAmount = num(o.doseAmount);
  if (doseAmount === undefined) return null;
  const times = Array.isArray(o.times) ? [...new Set(o.times.filter((t): t is string => typeof t === "string" && TIME_RE.test(t)))].sort() : [];
  const daysOfWeek = Array.isArray(o.daysOfWeek)
    ? [...new Set(o.daysOfWeek.filter((d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b)
    : [];
  const interval = num(o.intervalDays);
  const createdAt = isoOr(o.createdAt, EPOCH);
  const s: Schedule = {
    id: o.id,
    name,
    compoundId: o.compoundId,
    doseAmount,
    times: times.length ? times : ["09:00"],
    daysOfWeek,
    active: o.active !== false,
    createdAt,
    updatedAt: isoOr(o.updatedAt, createdAt),
  };
  if (interval !== undefined && interval >= 1) s.intervalDays = Math.floor(interval);
  if (s.daysOfWeek.length === 0 && s.intervalDays === undefined) s.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
  const unit = str(o.unitLabel, 12);
  if (unit) s.unitLabel = unit;
  const site = str(o.sitePrefer, 40);
  if (site) s.sitePrefer = site;
  return s;
}

export function normalizeSupply(raw: unknown): Supply | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  const name = str(o.name, NAME_MAX);
  if (!name) return null;
  const s: Supply = { id: o.id, name };
  const qty = num(o.qty);
  if (qty !== undefined) s.qty = qty;
  const lowAt = num(o.lowAt);
  if (lowAt !== undefined) s.lowAt = lowAt;
  return s;
}

function normalizeList<T extends { id: string }>(raw: unknown, one: (r: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of raw) {
    const v = one(r);
    if (v && !seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }
  return out;
}

export const normalizeCompounds = (raw: unknown): Compound[] => normalizeList(raw, normalizeCompound);
export const normalizeVials = (raw: unknown): Vial[] => normalizeList(raw, normalizeVial);
export const normalizeLogs = (raw: unknown): DoseLog[] => normalizeList(raw, normalizeLog).sort(byDatetimeDesc);
export const normalizeSchedules = (raw: unknown): Schedule[] => normalizeList(raw, normalizeSchedule);
export const normalizeSupplies = (raw: unknown): Supply[] => normalizeList(raw, normalizeSupply);

export function byDatetimeDesc(a: DoseLog, b: DoseLog): number {
  return b.datetime.localeCompare(a.datetime);
}

/**
 * Drops vials, logs and schedules whose compound no longer exists, and logs
 * pointing at a vanished vial keep the log but lose the vial link. Applied
 * after every load and every import so nothing dangles.
 */
export interface Store {
  compounds: Compound[];
  vials: Vial[];
  logs: DoseLog[];
  schedules: Schedule[];
  supplies: Supply[];
}

export function reconcile(store: Store): Store {
  const cids = new Set(store.compounds.map((c) => c.id));
  const vials = store.vials.filter((v) => cids.has(v.compoundId));
  const vids = new Set(vials.map((v) => v.id));
  const logs = store.logs
    .filter((l) => cids.has(l.compoundId))
    .map((l) => (l.vialId && !vids.has(l.vialId) ? { ...l, vialId: undefined } : l))
    .sort(byDatetimeDesc);
  const schedules = store.schedules.filter((s) => cids.has(s.compoundId));
  return { compounds: store.compounds, vials, logs, schedules, supplies: store.supplies };
}

export function emptyStore(): Store {
  return { compounds: [], vials: [], logs: [], schedules: [], supplies: [] };
}

// ---- storage ------------------------------------------------------------

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the session still works, it just will not remember */
  }
}

export function loadStore(): Store {
  return reconcile({
    compounds: normalizeCompounds(read(COMPOUNDS_KEY)),
    vials: normalizeVials(read(VIALS_KEY)),
    logs: normalizeLogs(read(LOGS_KEY)),
    schedules: normalizeSchedules(read(SCHEDULES_KEY)),
    supplies: normalizeSupplies(read(SUPPLIES_KEY)),
  });
}

export function saveStore(store: Store): void {
  write(COMPOUNDS_KEY, store.compounds);
  write(VIALS_KEY, store.vials);
  write(LOGS_KEY, store.logs);
  write(SCHEDULES_KEY, store.schedules);
  write(SUPPLIES_KEY, store.supplies);
}

export function clearStore(): void {
  for (const k of [COMPOUNDS_KEY, VIALS_KEY, LOGS_KEY, SCHEDULES_KEY, SUPPLIES_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

// ---- generic list edits ---------------------------------------------------

/** Insert or replace by id; a new row gets a fresh id. Returns the new list and the row's id. */
export function upsert<T extends { id: string; createdAt: string; updatedAt: string }>(
  list: T[],
  draft: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string | null },
  now: Date = new Date(),
): { list: T[]; id: string } {
  const iso = now.toISOString();
  const existing = draft.id ? list.find((x) => x.id === draft.id) : undefined;
  if (existing) {
    const next = { ...existing, ...draft, id: existing.id, createdAt: existing.createdAt, updatedAt: iso } as T;
    return { list: list.map((x) => (x.id === existing.id ? next : x)), id: existing.id };
  }
  const id = newId();
  const row = { ...draft, id, createdAt: iso, updatedAt: iso } as T;
  return { list: [row, ...list], id };
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

/**
 * Removing a compound is unlimited-free too: it takes its vials, logs and
 * schedules with it so the calendar never shows an orphan.
 */
export function removeCompound(store: Store, id: string): Store {
  return reconcile({ ...store, compounds: removeById(store.compounds, id) });
}
