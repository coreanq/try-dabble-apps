/**
 * Local store: long tasks, each with a target in HOURS or PERCENT and a list
 * of focus logs (date + minutes + optional note) entered by hand, after the
 * fact. Nothing has to be timed live. Everything lives in this browser; the
 * JSON backup is the only way off the device. Import is forgiving: a bare
 * array of tasks, `{ tasks | projects | items: [...] }`, alternate key names
 * such as name / hours / goal / sessions / mins, and unknown keys are ignored
 * rather than fatal.
 *
 * Progress only ever grows from what is logged. There is no streak, no decay
 * and no penalty for a day without a log.
 */
import { dateKeyOfAny, isDateKey, toDateKey } from "./dates.ts";

export const TASKS_KEY = "progresspad:tasks:v1";
export const PREFS_KEY = "progresspad:prefs:v1";
export const TIMER_KEY = "progresspad:timer:v1";

export const BACKUP_APP = "progresspad";
export const BACKUP_VERSION = 1;
export const DEFAULT_MINUTES_PER_PERCENT = 30;
export const MAX_MINUTES_PER_LOG = 24 * 60;
export const MAX_TARGET_HOURS = 100_000;
export const MAX_TARGET_PERCENT = 1000;
export const MAX_TITLE = 120;
export const MAX_NOTE = 200;

export type TargetMode = "hours" | "percent";
export type StageVisual = "plant" | "blocks" | "off";

export interface FocusLog {
  id: string;
  date: string; // local YYYY-MM-DD
  minutes: number; // positive integer
  note?: string;
  createdAt: string; // ISO
}

export interface Task {
  id: string;
  title: string;
  targetMode: TargetMode;
  targetHours?: number; // when targetMode === "hours"
  targetPercent?: number; // when targetMode === "percent" (usually 100)
  createdAt: string; // ISO
  updatedAt: string; // ISO
  archived?: boolean;
  logs: FocusLog[]; // newest first
}

export interface Prefs {
  activeTaskId: string | null;
  stageVisual: StageVisual;
  minutesPerPercent: number;
}

export interface TimerState {
  taskId: string;
  startedAt: number; // epoch ms
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  tasks: Task[];
  prefs: Prefs;
}

export function newId(prefix = "t"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultPrefs(): Prefs {
  return { activeTaskId: null, stageVisual: "plant", minutesPerPercent: DEFAULT_MINUTES_PER_PERCENT };
}

/* ---------- coercion helpers ---------- */

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v.replace(/,/g, "")))) return Number(v.replace(/,/g, ""));
  return null;
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function iso(v: unknown, fallback: string): string {
  if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return v;
  return fallback;
}

function pick(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

export function clampMinutes(n: number): number {
  return Math.max(1, Math.min(MAX_MINUTES_PER_LOG, Math.round(n)));
}

export function clampTargetHours(n: number): number {
  const r = Math.round(n * 10) / 10;
  return Math.max(0.1, Math.min(MAX_TARGET_HOURS, r));
}

export function clampTargetPercent(n: number): number {
  return Math.max(1, Math.min(MAX_TARGET_PERCENT, Math.round(n)));
}

export function clampMinutesPerPercent(n: number): number {
  return Math.max(1, Math.min(MAX_MINUTES_PER_LOG, Math.round(n)));
}

export function isStageVisual(v: unknown): v is StageVisual {
  return v === "plant" || v === "blocks" || v === "off";
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const active = pick(o, ["activeTaskId", "activeId", "active"]);
  const visual = pick(o, ["stageVisual", "visual", "stage"]);
  const mpp = num(pick(o, ["minutesPerPercent", "minutesPerPct", "minPerPercent"]));
  return {
    activeTaskId: typeof active === "string" && active ? active : null,
    stageVisual: isStageVisual(visual) ? visual : visual === false ? "off" : base.stageVisual,
    minutesPerPercent: mpp !== null && mpp > 0 ? clampMinutesPerPercent(mpp) : base.minutesPerPercent,
  };
}

export function normalizeLog(raw: unknown, nowIso = new Date().toISOString()): FocusLog | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const date = dateKeyOfAny(pick(o, ["date", "day", "on", "at"]));
  let minutes = num(pick(o, ["minutes", "mins", "min", "duration", "durationMinutes", "value"]));
  if (minutes === null) {
    const hours = num(pick(o, ["hours", "h"]));
    if (hours !== null) minutes = hours * 60;
  }
  if (!date || minutes === null || minutes <= 0) return null;
  const createdAt = iso(pick(o, ["createdAt", "created"]), nowIso);
  const log: FocusLog = {
    id: typeof o.id === "string" && o.id ? o.id : typeof o.id === "number" ? String(o.id) : newId("l"),
    date,
    minutes: clampMinutes(minutes),
    createdAt,
  };
  const note = str(pick(o, ["note", "memo", "comment", "label"]), MAX_NOTE);
  if (note) log.note = note;
  return log;
}

/** Newest date first; ties broken by createdAt (newest first). Duplicate ids are re-keyed. */
export function sortLogs(list: FocusLog[]): FocusLog[] {
  const seen = new Set<string>();
  const out = list.map((l) => {
    if (seen.has(l.id)) l = { ...l, id: newId("l") };
    seen.add(l.id);
    return l;
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export function normalizeTask(raw: unknown, nowIso = new Date().toISOString()): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = str(pick(o, ["title", "name", "label"]), MAX_TITLE);
  const modeRaw = pick(o, ["targetMode", "mode", "type"]);
  const hoursRaw = num(pick(o, ["targetHours", "hours", "goalHours", "targetH"]));
  const percentRaw = num(pick(o, ["targetPercent", "percent", "goalPercent", "targetPct"]));
  const genericTarget = num(pick(o, ["target", "goal"]));
  let mode: TargetMode | null = modeRaw === "hours" || modeRaw === "percent" ? modeRaw : null;
  if (!mode) {
    if (hoursRaw !== null) mode = "hours";
    else if (percentRaw !== null) mode = "percent";
    else if (genericTarget !== null) mode = "hours";
  }
  if (!title && !mode) return null;
  const rawLogs = pick(o, ["logs", "sessions", "entries", "history", "log"]);
  const logs = sortLogs((Array.isArray(rawLogs) ? rawLogs : []).map((l) => normalizeLog(l, nowIso)).filter((l): l is FocusLog => l !== null));
  const createdAt = iso(pick(o, ["createdAt", "created"]), nowIso);
  const id = typeof o.id === "string" && o.id ? o.id : typeof o.id === "number" ? String(o.id) : newId();
  const task: Task = {
    id,
    title: title || "Untitled",
    targetMode: mode ?? "hours",
    createdAt,
    updatedAt: iso(pick(o, ["updatedAt", "updated"]), createdAt),
    logs,
  };
  if (task.targetMode === "hours") {
    const h = hoursRaw ?? genericTarget;
    task.targetHours = clampTargetHours(h !== null && h > 0 ? h : 1);
  } else {
    const p = percentRaw ?? genericTarget;
    task.targetPercent = clampTargetPercent(p !== null && p > 0 ? p : 100);
  }
  if (o.archived === true) task.archived = true;
  return task;
}

export function parseTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Task[] = [];
  for (const r of raw) {
    const t = normalizeTask(r);
    if (!t) continue;
    if (seen.has(t.id)) t.id = newId();
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

export function parseTimer(raw: unknown): TimerState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const startedAt = num(o.startedAt);
  if (typeof o.taskId !== "string" || !o.taskId || startedAt === null || startedAt <= 0) return null;
  return { taskId: o.taskId, startedAt };
}

/* ---------- persistence ---------- */

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

export const loadTasks = (): Task[] => read(TASKS_KEY, parseTasks, () => []);
export const saveTasks = (v: Task[]): void => write(TASKS_KEY, v);
export const loadPrefs = (): Prefs => read(PREFS_KEY, parsePrefs, defaultPrefs);
export const savePrefs = (v: Prefs): void => write(PREFS_KEY, v);
export const loadTimer = (): TimerState | null => read(TIMER_KEY, parseTimer, () => null);
export const saveTimer = (v: TimerState | null): void => write(TIMER_KEY, v);

export function clearAll(): void {
  for (const k of [TASKS_KEY, PREFS_KEY, TIMER_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- task transitions (pure) ---------- */

export interface TargetInput {
  targetMode: TargetMode;
  targetHours?: number;
  targetPercent?: number;
}

function applyTarget(task: Task, input: TargetInput): Task {
  const next: Task = { ...task, targetMode: input.targetMode };
  delete next.targetHours;
  delete next.targetPercent;
  if (input.targetMode === "hours") next.targetHours = clampTargetHours(input.targetHours ?? 1);
  else next.targetPercent = clampTargetPercent(input.targetPercent ?? 100);
  return next;
}

export function createTask(title: string, target: TargetInput, now: Date = new Date()): Task {
  const t = now.toISOString();
  const base: Task = {
    id: newId(),
    title: str(title, MAX_TITLE) || "Untitled",
    targetMode: target.targetMode,
    createdAt: t,
    updatedAt: t,
    logs: [],
  };
  return applyTarget(base, target);
}

export function updateTask(list: Task[], id: string, patch: { title?: string } & Partial<TargetInput>, now: Date = new Date()): Task[] {
  return list.map((task) => {
    if (task.id !== id) return task;
    let next: Task = { ...task, updatedAt: now.toISOString() };
    if (patch.title !== undefined) next.title = str(patch.title, MAX_TITLE) || task.title;
    if (patch.targetMode !== undefined) {
      next = applyTarget(next, { targetMode: patch.targetMode, targetHours: patch.targetHours ?? task.targetHours, targetPercent: patch.targetPercent ?? task.targetPercent });
    } else if (patch.targetHours !== undefined && next.targetMode === "hours") {
      next.targetHours = clampTargetHours(patch.targetHours);
    } else if (patch.targetPercent !== undefined && next.targetMode === "percent") {
      next.targetPercent = clampTargetPercent(patch.targetPercent);
    }
    return next;
  });
}

/** Adds a focus log (defaults to today). Several logs on the same day are kept separately. */
export function addLog(task: Task, minutes: number, date?: string, note?: string, now: Date = new Date()): Task {
  const log: FocusLog = {
    id: newId("l"),
    date: isDateKey(date) ? date : toDateKey(now),
    minutes: clampMinutes(minutes),
    createdAt: now.toISOString(),
  };
  const n = str(note, MAX_NOTE);
  if (n) log.note = n;
  return { ...task, logs: sortLogs([log, ...task.logs]), updatedAt: now.toISOString() };
}

export function updateLog(task: Task, logId: string, patch: { minutes?: number; date?: string; note?: string }, now: Date = new Date()): Task {
  const logs = task.logs.map((l) => {
    if (l.id !== logId) return l;
    const next: FocusLog = { ...l };
    if (patch.minutes !== undefined) next.minutes = clampMinutes(patch.minutes);
    if (patch.date !== undefined && isDateKey(patch.date)) next.date = patch.date;
    if (patch.note !== undefined) {
      const n = str(patch.note, MAX_NOTE);
      if (n) next.note = n;
      else delete next.note;
    }
    return next;
  });
  return { ...task, logs: sortLogs(logs), updatedAt: now.toISOString() };
}

export function removeLog(task: Task, logId: string, now: Date = new Date()): Task {
  return { ...task, logs: task.logs.filter((l) => l.id !== logId), updatedAt: now.toISOString() };
}

/* ---------- progress math ---------- */

export function totalMinutes(task: Pick<Task, "logs">): number {
  return task.logs.reduce((sum, l) => sum + (Number.isFinite(l.minutes) ? l.minutes : 0), 0);
}

/** 0..4: seed, sprout, leaves, bud, bloom (100%+). Only ever computed from progress; never decays. */
export function stageOf(ratio: number): 0 | 1 | 2 | 3 | 4 {
  if (ratio >= 1) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  if (ratio >= 0.25) return 1;
  return 0;
}

export interface Progress {
  mode: TargetMode;
  totalMinutes: number;
  /** hours mode: targetHours * 60. percent mode: targetPercent * minutesPerPercent. */
  targetMinutes: number;
  ratio: number; // 0..∞, never capped
  percent: number; // Math.round(ratio * 100)
  barPercent: number; // 0..100
  done: boolean; // ratio >= 1
  over: boolean; // ratio > 1
  remainingMinutes: number; // 0 when done
  overMinutes: number; // minutes past the target (0 when not over)
  /** percent mode only: totalMinutes / minutesPerPercent (not rounded). */
  earnedPercent: number;
  targetPercent: number; // percent mode: the target; hours mode: 100
  stage: 0 | 1 | 2 | 3 | 4;
}

export function computeProgress(task: Pick<Task, "targetMode" | "targetHours" | "targetPercent" | "logs">, minutesPerPercent: number = DEFAULT_MINUTES_PER_PERCENT): Progress {
  const total = totalMinutes(task);
  const mpp = clampMinutesPerPercent(minutesPerPercent > 0 ? minutesPerPercent : DEFAULT_MINUTES_PER_PERCENT);
  let targetMinutes: number;
  let earnedPercent: number;
  let targetPercent: number;
  if (task.targetMode === "percent") {
    targetPercent = clampTargetPercent(task.targetPercent ?? 100);
    targetMinutes = targetPercent * mpp;
    earnedPercent = total / mpp;
  } else {
    const hours = clampTargetHours(task.targetHours ?? 1);
    targetMinutes = Math.round(hours * 60);
    targetPercent = 100;
    earnedPercent = (total / targetMinutes) * 100;
  }
  const ratio = targetMinutes > 0 ? total / targetMinutes : 0;
  const percent = Math.round(ratio * 100);
  return {
    mode: task.targetMode,
    totalMinutes: total,
    targetMinutes,
    ratio,
    percent,
    barPercent: Math.max(0, Math.min(100, ratio * 100)),
    done: ratio >= 1,
    over: ratio > 1,
    remainingMinutes: Math.max(0, targetMinutes - total),
    overMinutes: Math.max(0, total - targetMinutes),
    earnedPercent,
    targetPercent,
    stage: stageOf(ratio),
  };
}

/** Whole minutes elapsed on the optional timer, never negative. */
export function elapsedMinutes(startedAt: number, now: number = Date.now()): number {
  if (!Number.isFinite(startedAt) || now <= startedAt) return 0;
  return Math.floor((now - startedAt) / 60_000);
}

/* ---------- backup ---------- */

export function buildBackup(tasks: Task[], prefs: Prefs, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), tasks, prefs };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(now = new Date()): string {
  return `progresspad-${toDateKey(now).replace(/-/g, "")}.json`;
}

/**
 * Reads our own shape, a bare array of tasks, or `{ tasks | projects |
 * items | list: [...] }`. Missing pieces default; unknown keys are ignored.
 * Returns null only when no task list can be found at all.
 */
export function parseBackup(raw: unknown): Backup | null {
  let list: unknown = null;
  let o: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    o = raw as Record<string, unknown>;
    list = pick(o, ["tasks", "projects", "items", "list", "goals", "data"]);
    if (list && typeof list === "object" && !Array.isArray(list)) {
      const inner = list as Record<string, unknown>;
      list = pick(inner, ["tasks", "projects", "items", "list"]) ?? Object.values(inner);
    }
    if (!Array.isArray(list) && (o.title !== undefined || o.targetHours !== undefined || o.targetPercent !== undefined) && normalizeTask(o)) list = [o];
  }
  if (!Array.isArray(list)) return null;
  const tasks = parseTasks(list);
  const prefs = parsePrefs(o.prefs ?? o.settings ?? {});
  if (prefs.activeTaskId && !tasks.some((t) => t.id === prefs.activeTaskId)) prefs.activeTaskId = null;
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: iso(o.exportedAt, new Date().toISOString()), tasks, prefs };
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
