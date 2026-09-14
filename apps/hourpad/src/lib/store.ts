/**
 * Local store: work / break sessions, the open session, weekly prefs, and
 * the settled-week ledger that backs the overtime bank. Everything lives in
 * this browser; the JSON backup is the only way off the device. Import is
 * forgiving: a bare array of sessions, `{ entries: [...] }`, `{ logs: [...] }`
 * or a shift-style row with clockIn / clockOut is mapped when the fields are
 * obvious, and unknown keys are ignored rather than fatal.
 *
 * Bank rule (one rule, shown in the UI): when a calendar week that has work
 * logged ends, that week's work minus its target is added to the bank. Over
 * target grows the bank, under target shrinks it, and it may go negative.
 * Weeks with no work logged at all are left alone. Each week settles once.
 */
import {
  MS_PER_HOUR,
  dateKeyOfIso,
  elapsedMs,
  isDateKey,
  msToHours,
  toDateKey,
  weekKeyOf,
} from "./time.ts";

export const SESSIONS_KEY = "hourpad:sessions:v1";
export const ACTIVE_KEY = "hourpad:active:v1";
export const WEEKS_KEY = "hourpad:weeks:v1";
export const PREFS_KEY = "hourpad:prefs:v1";

export const BACKUP_APP = "hourpad";
export const BACKUP_VERSION = 1;
export const DEFAULT_TARGET_HOURS = 40;
export const MAX_SESSION_MS = 24 * MS_PER_HOUR;

export type Kind = "work" | "break";

export interface Session {
  id: string;
  date: string; // local YYYY-MM-DD of startedAt
  kind: Kind;
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationMs: number;
  label?: string;
}

export interface ActiveSession {
  kind: Kind;
  startedAt: string; // ISO
  label?: string;
}

export interface WeekMeta {
  weekKey: string; // local Monday YYYY-MM-DD
  targetHours: number;
  workHours: number;
  surplusHours: number; // workHours - targetHours
  bankIn: number;
  bankOut: number;
  settledAt: string;
  note?: string;
}

export interface Prefs {
  weeklyTargetHours: number;
  bankHours: number;
  weekStartsOn: 0 | 1;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  sessions: Session[];
  active: ActiveSession | null;
  prefs: Prefs;
  weeks: WeekMeta[];
}

export function newId(prefix = "s"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultPrefs(): Prefs {
  return { weeklyTargetHours: DEFAULT_TARGET_HOURS, bankHours: 0, weekStartsOn: 1 };
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function clampTarget(h: number): number {
  if (!Number.isFinite(h)) return DEFAULT_TARGET_HOURS;
  return Math.min(168, Math.max(0, Math.round(h * 100) / 100));
}

export function clampBank(h: number): number {
  if (!Number.isFinite(h)) return 0;
  return Math.min(10_000, Math.max(-10_000, Math.round(h * 100) / 100));
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const target = num(o.weeklyTargetHours ?? o.targetHours ?? o.weeklyTarget);
  const bank = num(o.bankHours ?? o.bank ?? o.overtimeBank);
  return {
    weeklyTargetHours: target === null ? base.weeklyTargetHours : clampTarget(target),
    bankHours: bank === null ? base.bankHours : clampBank(bank),
    weekStartsOn: o.weekStartsOn === 0 ? 0 : 1,
  };
}

function isoOf(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v > 1e12 ? v : v * 1000).toISOString();
  if (typeof v !== "string" || !v.trim()) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function kindOf(v: unknown): Kind | null {
  if (typeof v !== "string") return null;
  const s = v.toLowerCase();
  if (s === "work" || s === "working" || s === "shift" || s === "task") return "work";
  if (s === "break" || s === "rest" || s === "pause" || s === "lunch") return "break";
  return null;
}

function labelOf(o: Record<string, unknown>): string | undefined {
  const v = o.label ?? o.task ?? o.title ?? o.note ?? o.notes ?? o.project;
  if (typeof v !== "string") return undefined;
  const s = v.trim().slice(0, 120);
  return s ? s : undefined;
}

/** Maps one row from our own export or a reasonable stranger's export. */
export function normalizeSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const startedAt = isoOf(o.startedAt ?? o.start ?? o.startTime ?? o.clockIn ?? o.checkIn ?? o.from ?? o.begin);
  if (!startedAt) return null;
  let endedAt = isoOf(o.endedAt ?? o.end ?? o.endTime ?? o.clockOut ?? o.checkOut ?? o.to ?? o.finish);
  const dur = num(o.durationMs) ?? (num(o.durationMin ?? o.minutes) !== null ? (num(o.durationMin ?? o.minutes) as number) * 60_000 : null);
  if (!endedAt && dur !== null && dur >= 0) endedAt = new Date(Date.parse(startedAt) + dur).toISOString();
  if (!endedAt) return null;
  let durationMs = Date.parse(endedAt) - Date.parse(startedAt);
  if (!Number.isFinite(durationMs) || durationMs < 0) return null;
  if (durationMs > MAX_SESSION_MS) durationMs = MAX_SESSION_MS;
  const kind = kindOf(o.kind ?? o.type ?? o.category) ?? (o.isBreak === true || o.break === true ? "break" : "work");
  const date = isDateKey(o.date) ? o.date : dateKeyOfIso(startedAt);
  if (!date) return null;
  const id = typeof o.id === "string" && o.id ? o.id.slice(0, 64) : newId();
  const label = labelOf(o);
  const s: Session = { id, date, kind, startedAt, endedAt, durationMs };
  if (label) s.label = label;
  return s;
}

export function parseSessions(raw: unknown): Session[] {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const out: Session[] = [];
  for (const r of list) {
    const s = normalizeSession(r);
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out.sort((a, b) => (a.startedAt < b.startedAt ? -1 : a.startedAt > b.startedAt ? 1 : 0));
}

export function parseActive(raw: unknown): ActiveSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const startedAt = isoOf(o.startedAt ?? o.start);
  if (!startedAt) return null;
  const kind = kindOf(o.kind ?? o.type) ?? "work";
  const a: ActiveSession = { kind, startedAt };
  const label = labelOf(o);
  if (label) a.label = label;
  return a;
}

export function normalizeWeek(raw: unknown): WeekMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!isDateKey(o.weekKey)) return null;
  const target = num(o.targetHours);
  const work = num(o.workHours);
  const surplus = num(o.surplusHours ?? o.surplus);
  const bankIn = num(o.bankIn);
  const bankOut = num(o.bankOut);
  if (target === null || work === null) return null;
  const w: WeekMeta = {
    weekKey: weekKeyOf(o.weekKey),
    targetHours: clampTarget(target),
    workHours: Math.max(0, work),
    surplusHours: surplus ?? work - target,
    bankIn: bankIn ?? 0,
    bankOut: bankOut ?? (bankIn ?? 0) + (surplus ?? work - target),
    settledAt: isoOf(o.settledAt) ?? new Date(0).toISOString(),
  };
  if (typeof o.note === "string" && o.note.trim()) w.note = o.note.trim().slice(0, 200);
  return w;
}

export function parseWeeks(raw: unknown): WeekMeta[] {
  const list = Array.isArray(raw) ? raw : [];
  const byKey = new Map<string, WeekMeta>();
  for (const r of list) {
    const w = normalizeWeek(r);
    if (w) byKey.set(w.weekKey, w);
  }
  return [...byKey.values()].sort((a, b) => (a.weekKey < b.weekKey ? -1 : 1));
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
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export const loadSessions = (): Session[] => read(SESSIONS_KEY, parseSessions, () => []);
export const saveSessions = (v: Session[]): void => write(SESSIONS_KEY, v);
export const loadActive = (): ActiveSession | null => read(ACTIVE_KEY, parseActive, () => null);
export const saveActive = (v: ActiveSession | null): void => write(ACTIVE_KEY, v);
export const loadWeeks = (): WeekMeta[] => read(WEEKS_KEY, parseWeeks, () => []);
export const saveWeeks = (v: WeekMeta[]): void => write(WEEKS_KEY, v);
export const loadPrefs = (): Prefs => read(PREFS_KEY, parsePrefs, defaultPrefs);
export const savePrefs = (v: Prefs): void => write(PREFS_KEY, v);

export function clearAll(): void {
  for (const k of [SESSIONS_KEY, ACTIVE_KEY, WEEKS_KEY, PREFS_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- clock transitions (pure) ---------- */

/** Closes the open session into a completed row; null when nothing was open. */
export function closeActive(active: ActiveSession | null, now: number = Date.now()): Session | null {
  if (!active) return null;
  const started = Date.parse(active.startedAt);
  if (Number.isNaN(started)) return null;
  const endMs = Math.max(started, now);
  const date = toDateKey(new Date(started));
  const s: Session = {
    id: newId(active.kind === "work" ? "w" : "b"),
    date,
    kind: active.kind,
    startedAt: new Date(started).toISOString(),
    endedAt: new Date(endMs).toISOString(),
    durationMs: Math.min(MAX_SESSION_MS, endMs - started),
  };
  if (active.label) s.label = active.label;
  return s;
}

export interface ClockState {
  sessions: Session[];
  active: ActiveSession | null;
}

export function checkIn(state: ClockState, label: string | undefined, now: number = Date.now()): ClockState {
  if (state.active?.kind === "work") return state;
  const closed = closeActive(state.active, now);
  const active: ActiveSession = { kind: "work", startedAt: new Date(now).toISOString() };
  const l = (label ?? state.active?.label ?? "").trim();
  if (l) active.label = l.slice(0, 120);
  return { sessions: closed ? [...state.sessions, closed] : state.sessions, active };
}

export function startBreak(state: ClockState, now: number = Date.now()): ClockState {
  if (state.active?.kind !== "work") return state;
  const closed = closeActive(state.active, now);
  const active: ActiveSession = { kind: "break", startedAt: new Date(now).toISOString() };
  if (state.active.label) active.label = state.active.label;
  return { sessions: closed ? [...state.sessions, closed] : state.sessions, active };
}

export function checkOut(state: ClockState, now: number = Date.now()): ClockState {
  if (!state.active) return state;
  const closed = closeActive(state.active, now);
  return { sessions: closed ? [...state.sessions, closed] : state.sessions, active: null };
}

/* ---------- totals ---------- */

export interface Totals {
  workMs: number;
  breakMs: number;
  sessions: number;
}

function activeContribution(active: ActiveSession | null, inRange: (date: string) => boolean, now: number): { workMs: number; breakMs: number } {
  if (!active) return { workMs: 0, breakMs: 0 };
  const date = dateKeyOfIso(active.startedAt);
  if (!date || !inRange(date)) return { workMs: 0, breakMs: 0 };
  const ms = Math.min(MAX_SESSION_MS, elapsedMs(active.startedAt, now));
  return active.kind === "work" ? { workMs: ms, breakMs: 0 } : { workMs: 0, breakMs: ms };
}

export function totalsFor(sessions: Session[], inRange: (date: string) => boolean, active: ActiveSession | null = null, now: number = Date.now()): Totals {
  let workMs = 0;
  let breakMs = 0;
  let count = 0;
  for (const s of sessions) {
    if (!inRange(s.date)) continue;
    count += 1;
    if (s.kind === "work") workMs += s.durationMs;
    else breakMs += s.durationMs;
  }
  const live = activeContribution(active, inRange, now);
  return { workMs: workMs + live.workMs, breakMs: breakMs + live.breakMs, sessions: count + (live.workMs || live.breakMs ? 1 : 0) };
}

export function dayTotals(sessions: Session[], dateKey: string, active: ActiveSession | null = null, now: number = Date.now()): Totals {
  return totalsFor(sessions, (d) => d === dateKey, active, now);
}

export function weekTotals(sessions: Session[], weekKey: string, active: ActiveSession | null = null, now: number = Date.now(), weekStartsOn: 0 | 1 = 1): Totals {
  return totalsFor(sessions, (d) => weekKeyOf(d, weekStartsOn) === weekKey, active, now);
}

/** Completed work only, in hours — the figure the bank settles on. */
export function weekWorkHours(sessions: Session[], weekKey: string, weekStartsOn: 0 | 1 = 1): number {
  return msToHours(weekTotals(sessions, weekKey, null, 0, weekStartsOn).workMs);
}

export function surplusHours(workHours: number, targetHours: number): number {
  return Math.round((workHours - targetHours) * 10_000) / 10_000;
}

/* ---------- bank settlement ---------- */

export interface Settlement {
  prefs: Prefs;
  weeks: WeekMeta[];
  settled: WeekMeta[];
}

/**
 * Rolls every finished week that has work logged and is not yet in the ledger
 * into the bank, oldest first. Idempotent: a week already in `weeks` is never
 * settled twice, and the current week is never touched until it is over.
 */
export function settleWeeks(sessions: Session[], prefs: Prefs, weeks: WeekMeta[], now: number = Date.now()): Settlement {
  const weekStartsOn = prefs.weekStartsOn;
  const currentKey = weekKeyOf(toDateKey(new Date(now)), weekStartsOn);
  const done = new Set(weeks.map((w) => w.weekKey));
  const candidates = new Set<string>();
  for (const s of sessions) {
    if (s.kind !== "work") continue;
    const k = weekKeyOf(s.date, weekStartsOn);
    if (k < currentKey && !done.has(k)) candidates.add(k);
  }
  const keys = [...candidates].sort();
  if (keys.length === 0) return { prefs, weeks, settled: [] };
  let bank = prefs.bankHours;
  const settled: WeekMeta[] = [];
  const stamp = new Date(now).toISOString();
  for (const weekKey of keys) {
    const workHours = weekWorkHours(sessions, weekKey, weekStartsOn);
    const surplus = surplusHours(workHours, prefs.weeklyTargetHours);
    const bankIn = bank;
    bank = clampBank(bank + surplus);
    settled.push({ weekKey, targetHours: prefs.weeklyTargetHours, workHours, surplusHours: surplus, bankIn, bankOut: bank, settledAt: stamp });
  }
  const merged = [...weeks, ...settled].sort((a, b) => (a.weekKey < b.weekKey ? -1 : 1));
  return { prefs: { ...prefs, bankHours: bank }, weeks: merged, settled };
}

export interface WeekRow {
  weekKey: string;
  workMs: number;
  breakMs: number;
  targetHours: number;
  surplusHours: number;
  settled: WeekMeta | null;
  current: boolean;
}

/** Every week that has sessions or a ledger row, newest first. */
export function weekRows(sessions: Session[], weeks: WeekMeta[], prefs: Prefs, now: number = Date.now(), active: ActiveSession | null = null): WeekRow[] {
  const weekStartsOn = prefs.weekStartsOn;
  const currentKey = weekKeyOf(toDateKey(new Date(now)), weekStartsOn);
  const keys = new Set<string>([currentKey]);
  for (const s of sessions) keys.add(weekKeyOf(s.date, weekStartsOn));
  for (const w of weeks) keys.add(w.weekKey);
  const byKey = new Map(weeks.map((w) => [w.weekKey, w] as const));
  return [...keys]
    .sort()
    .reverse()
    .map((weekKey) => {
      const current = weekKey === currentKey;
      const t = weekTotals(sessions, weekKey, current ? active : null, now, weekStartsOn);
      const settled = byKey.get(weekKey) ?? null;
      const targetHours = settled ? settled.targetHours : prefs.weeklyTargetHours;
      const surplus = settled ? settled.surplusHours : surplusHours(msToHours(t.workMs), targetHours);
      return { weekKey, workMs: t.workMs, breakMs: t.breakMs, targetHours, surplusHours: surplus, settled, current };
    });
}

/* ---------- backup ---------- */

export function buildBackup(sessions: Session[], active: ActiveSession | null, prefs: Prefs, weeks: WeekMeta[], now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), sessions, active, prefs, weeks };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(now = new Date()): string {
  return `hourpad-${toDateKey(now).replace(/-/g, "")}.json`;
}

/**
 * Reads our own shape, a bare array of sessions, or `{ sessions | entries |
 * logs | shifts | items: [...] }`. Missing pieces default; unknown keys are
 * ignored. Returns null only when no session list can be found at all.
 */
export function parseBackup(raw: unknown): Backup | null {
  let list: unknown = null;
  let o: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    o = raw as Record<string, unknown>;
    if (o.app !== undefined && o.app !== BACKUP_APP && typeof o.app === "string" && !Array.isArray(o.sessions)) return null;
    list = o.sessions ?? o.entries ?? o.logs ?? o.shifts ?? o.items ?? o.records ?? null;
    if (list === null && (o.data as Record<string, unknown> | undefined)?.sessions) list = (o.data as Record<string, unknown>).sessions;
  }
  if (!Array.isArray(list)) return null;
  const sessions = parseSessions(list);
  const prefs = parsePrefs(o.prefs ?? o.settings ?? o);
  const weeks = parseWeeks(o.weeks);
  const active = parseActive(o.active);
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: isoOf(o.exportedAt) ?? new Date(0).toISOString(), sessions, active, prefs, weeks };
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
