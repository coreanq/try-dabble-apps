/**
 * Local store: essays / projects, each with a word target, an optional
 * deadline, the current word total and a per-day history of totals. You
 * write somewhere else (Docs, Word, Notion, a notebook) and type the new
 * total here. Everything lives in this browser; the JSON backup is the only
 * way off the device. Import is forgiving: a bare array of essays,
 * `{ essays | projects | items: [...] }`, alternate key names such as
 * name / goal / wordCount / dueDate, and unknown keys are ignored rather than
 * fatal.
 *
 * History stores the ABSOLUTE total at the end of each day; the per-day
 * delta is derived in the UI, so back-dating an entry never corrupts later
 * days. The essay's current total always equals the latest history entry.
 */
import { addDays, dateKeyOfAny, diffDays, isDateKey, isWeekend, toDateKey } from "./dates.ts";

export const ESSAYS_KEY = "essaypad:essays:v1";
export const PREFS_KEY = "essaypad:prefs:v1";

export const BACKUP_APP = "essaypad";
export const BACKUP_VERSION = 1;
export const OVER_LIMIT_RATIO = 1.1;
export const MAX_WORDS = 100_000_000;
export const MAX_TITLE = 120;
export const MAX_NOTE = 200;

export interface HistoryEntry {
  date: string; // local YYYY-MM-DD
  words: number; // absolute total at the end of that day
  note?: string;
}

export interface Essay {
  id: string;
  title: string;
  targetWords: number;
  currentWords: number;
  deadline: string | null; // YYYY-MM-DD
  createdAt: string; // ISO
  updatedAt: string; // ISO
  history: HistoryEntry[]; // sorted by date ascending, one per date
}

export interface Prefs {
  activeEssayId: string | null;
  weekdaysOnly: boolean;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  essays: Essay[];
  prefs: Prefs;
}

export function newId(prefix = "e"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultPrefs(): Prefs {
  return { activeEssayId: null, weekdaysOnly: false };
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v.replace(/,/g, "")))) return Number(v.replace(/,/g, ""));
  return null;
}

function words(v: unknown): number | null {
  const n = num(v);
  if (n === null || n < 0) return null;
  return Math.min(MAX_WORDS, Math.round(n));
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

export function clampTarget(n: number): number {
  return Math.max(1, Math.min(MAX_WORDS, Math.round(n)));
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const active = pick(o, ["activeEssayId", "activeId", "active"]);
  return {
    activeEssayId: typeof active === "string" && active ? active : null,
    weekdaysOnly: o.weekdaysOnly === true || o.weekdaysOnly === "true" || o.writeDays === "weekdays",
  };
}

export function normalizeHistoryEntry(raw: unknown): HistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const date = dateKeyOfAny(pick(o, ["date", "day", "at", "on"]));
  const w = words(pick(o, ["words", "total", "wordCount", "count", "value"]));
  if (!date || w === null) return null;
  const e: HistoryEntry = { date, words: w };
  const note = str(pick(o, ["note", "memo", "comment"]), MAX_NOTE);
  if (note) e.note = note;
  return e;
}

/** Sorts by date and keeps one entry per date (the last one wins). */
export function sortHistory(list: HistoryEntry[]): HistoryEntry[] {
  const byDate = new Map<string, HistoryEntry>();
  for (const e of list) byDate.set(e.date, e);
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function normalizeEssay(raw: unknown, nowIso = new Date().toISOString()): Essay | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = str(pick(o, ["title", "name", "label"]), MAX_TITLE);
  const target = words(pick(o, ["targetWords", "target", "goal", "wordGoal", "goalWords", "targetWordCount"]));
  if (!title && target === null) return null;
  const rawHistory = pick(o, ["history", "log", "entries", "updates", "progress"]);
  const history = sortHistory((Array.isArray(rawHistory) ? rawHistory : []).map(normalizeHistoryEntry).filter((e): e is HistoryEntry => e !== null));
  const currentRaw = words(pick(o, ["currentWords", "current", "words", "wordCount", "count", "written"]));
  const last = history.length ? history[history.length - 1] : null;
  const current = last ? last.words : (currentRaw ?? 0);
  const deadlineRaw = pick(o, ["deadline", "dueDate", "due", "dueOn", "endDate"]);
  const deadline = deadlineRaw === undefined ? null : dateKeyOfAny(deadlineRaw);
  const createdAt = iso(pick(o, ["createdAt", "created"]), nowIso);
  const id = typeof o.id === "string" && o.id ? o.id : typeof o.id === "number" ? String(o.id) : newId();
  return {
    id,
    title: title || "Untitled",
    targetWords: clampTarget(target ?? Math.max(1, current)),
    currentWords: current,
    deadline,
    createdAt,
    updatedAt: iso(pick(o, ["updatedAt", "updated"]), createdAt),
    history,
  };
}

export function parseEssays(raw: unknown): Essay[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Essay[] = [];
  for (const r of raw) {
    const e = normalizeEssay(r);
    if (!e) continue;
    if (seen.has(e.id)) e.id = newId();
    seen.add(e.id);
    out.push(e);
  }
  return out;
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

export const loadEssays = (): Essay[] => read(ESSAYS_KEY, parseEssays, () => []);
export const saveEssays = (v: Essay[]): void => write(ESSAYS_KEY, v);
export const loadPrefs = (): Prefs => read(PREFS_KEY, parsePrefs, defaultPrefs);
export const savePrefs = (v: Prefs): void => write(PREFS_KEY, v);

export function clearAll(): void {
  for (const k of [ESSAYS_KEY, PREFS_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- essay transitions (pure) ---------- */

export function createEssay(title: string, targetWords: number, deadline: string | null, now: Date = new Date()): Essay {
  const t = now.toISOString();
  return {
    id: newId(),
    title: str(title, MAX_TITLE) || "Untitled",
    targetWords: clampTarget(targetWords),
    currentWords: 0,
    deadline: isDateKey(deadline) ? deadline : null,
    createdAt: t,
    updatedAt: t,
    history: [],
  };
}

export function updateEssay(list: Essay[], id: string, patch: Partial<Pick<Essay, "title" | "targetWords" | "deadline">>, now: Date = new Date()): Essay[] {
  return list.map((e) => {
    if (e.id !== id) return e;
    const next: Essay = { ...e, updatedAt: now.toISOString() };
    if (patch.title !== undefined) next.title = str(patch.title, MAX_TITLE) || e.title;
    if (patch.targetWords !== undefined) next.targetWords = clampTarget(patch.targetWords);
    if (patch.deadline !== undefined) next.deadline = isDateKey(patch.deadline) ? patch.deadline : null;
    return next;
  });
}

/**
 * Records the absolute total `total` for `date` (defaults to today) and
 * re-derives currentWords from the latest dated entry, so a back-dated
 * update never overwrites a newer total.
 */
export function recordWords(essay: Essay, total: number, date?: string, note?: string, now: Date = new Date()): Essay {
  const day = isDateKey(date) ? date : toDateKey(now);
  const entry: HistoryEntry = { date: day, words: Math.max(0, Math.min(MAX_WORDS, Math.round(total))) };
  const n = str(note, MAX_NOTE);
  if (n) entry.note = n;
  const history = sortHistory([...essay.history, entry]);
  return { ...essay, history, currentWords: history[history.length - 1].words, updatedAt: now.toISOString() };
}

export function removeHistoryEntry(essay: Essay, date: string, now: Date = new Date()): Essay {
  const history = essay.history.filter((h) => h.date !== date);
  const last = history.length ? history[history.length - 1].words : 0;
  return { ...essay, history, currentWords: last, updatedAt: now.toISOString() };
}

export interface HistoryRow extends HistoryEntry {
  delta: number; // words added that day vs the previous recorded total
}

/** History with the per-day delta derived from the previous entry (0 before the first). */
export function historyRows(essay: Essay): HistoryRow[] {
  let prev = 0;
  return sortHistory(essay.history).map((h) => {
    const row: HistoryRow = { ...h, delta: h.words - prev };
    prev = h.words;
    return row;
  });
}

/* ---------- pace math ---------- */

export function isWriteDay(dateKey: string, weekdaysOnly: boolean): boolean {
  return weekdaysOnly ? !isWeekend(dateKey) : true;
}

/** Write days from `from` through `to` inclusive; 0 when `to` is before `from`. */
export function countWriteDays(from: string, to: string, weekdaysOnly: boolean): number {
  const span = diffDays(from, to);
  if (span < 0) return 0;
  if (!weekdaysOnly) return span + 1;
  let n = 0;
  let d = from;
  for (let i = 0; i <= span; i++) {
    if (!isWeekend(d)) n++;
    d = addDays(d, 1);
  }
  return n;
}

export type PaceStatus = "noDeadline" | "done" | "overdue" | "active";

export interface Pace {
  status: PaceStatus;
  remaining: number;
  percent: number; // 0..∞, not capped
  barPercent: number; // 0..100
  done: boolean;
  overLimit: boolean;
  calendarDaysLeft: number | null; // whole days from today to the deadline (negative when past)
  writeDaysLeft: number | null; // today..deadline write days (0 when past)
  dailyTarget: number | null; // words per write day; remaining when catching up
  overdueDays: number; // days since the deadline (0 when not overdue)
}

export function computePace(essay: Pick<Essay, "targetWords" | "currentWords" | "deadline">, today: string, weekdaysOnly: boolean): Pace {
  const target = Math.max(1, essay.targetWords);
  const current = Math.max(0, essay.currentWords);
  const remaining = Math.max(0, target - current);
  const percent = (current / target) * 100;
  const done = current >= target;
  const overLimit = current > target * OVER_LIMIT_RATIO;
  const base = { remaining, percent, barPercent: Math.min(100, percent), done, overLimit };
  if (!essay.deadline) {
    return { ...base, status: done ? "done" : "noDeadline", calendarDaysLeft: null, writeDaysLeft: null, dailyTarget: done ? 0 : null, overdueDays: 0 };
  }
  const calendarDaysLeft = diffDays(today, essay.deadline);
  const writeDaysLeft = countWriteDays(today, essay.deadline, weekdaysOnly);
  if (done) return { ...base, status: "done", calendarDaysLeft, writeDaysLeft, dailyTarget: 0, overdueDays: Math.max(0, -calendarDaysLeft) };
  if (calendarDaysLeft < 0) return { ...base, status: "overdue", calendarDaysLeft, writeDaysLeft: 0, dailyTarget: remaining, overdueDays: -calendarDaysLeft };
  const dailyTarget = writeDaysLeft > 0 ? Math.ceil(remaining / writeDaysLeft) : remaining;
  return { ...base, status: "active", calendarDaysLeft, writeDaysLeft, dailyTarget, overdueDays: 0 };
}

/* ---------- backup ---------- */

export function buildBackup(essays: Essay[], prefs: Prefs, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), essays, prefs };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(now = new Date()): string {
  return `essaypad-${toDateKey(now).replace(/-/g, "")}.json`;
}

/**
 * Reads our own shape, a bare array of essays, or `{ essays | projects |
 * items | list: [...] }`. Missing pieces default; unknown keys are ignored.
 * Returns null only when no essay list can be found at all.
 */
export function parseBackup(raw: unknown): Backup | null {
  let list: unknown = null;
  let o: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    o = raw as Record<string, unknown>;
    list = pick(o, ["essays", "projects", "items", "list", "data"]);
    if (list && typeof list === "object" && !Array.isArray(list)) {
      const inner = list as Record<string, unknown>;
      list = pick(inner, ["essays", "projects", "items", "list"]) ?? Object.values(inner);
    }
    if (!Array.isArray(list) && (o.title !== undefined || o.targetWords !== undefined) && normalizeEssay(o)) list = [o];
  }
  if (!Array.isArray(list)) return null;
  const essays = parseEssays(list);
  const prefs = parsePrefs(o.prefs ?? o.settings ?? {});
  if (prefs.activeEssayId && !essays.some((e) => e.id === prefs.activeEssayId)) prefs.activeEssayId = null;
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: iso(o.exportedAt, new Date().toISOString()), essays, prefs };
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
