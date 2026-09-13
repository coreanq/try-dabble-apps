/**
 * Local store: routines + prefs. Everything lives in this browser.
 * Keys are namespaced so a reinstall of another try-dabble app cannot
 * collide. The JSON backup is the only way off the device.
 */
import {
  clampSec,
  type IntervalConfig,
  type IntervalStep,
  type Mode,
  type PhaseKind,
  type PomodoroConfig,
} from "./clock.ts";

export const STORE_KEY = "timerpad:store:v1";
export const PREFS_KEY = "timerpad:prefs:v1";

export type FontSize = "md" | "lg" | "xl";
export const FONT_SIZES: FontSize[] = ["md", "lg", "xl"];

export interface Prefs {
  fontSize: FontSize;
  sound: boolean;
  wakeLock: boolean;
}

export function isFontSize(v: unknown): v is FontSize {
  return v === "md" || v === "lg" || v === "xl";
}

export function defaultPrefs(): Prefs {
  return { fontSize: "md", sound: true, wakeLock: true };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    fontSize: isFontSize(o.fontSize) ? o.fontSize : base.fontSize,
    sound: typeof o.sound === "boolean" ? o.sound : base.sound,
    wakeLock: typeof o.wakeLock === "boolean" ? o.wakeLock : base.wakeLock,
  };
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return parsePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
}

export type RoutineKind = "countdown" | "pomodoro" | "interval";

export interface CountdownRoutine {
  id: string;
  kind: "countdown";
  name: string;
  seconds: number;
}

export interface PomodoroRoutine {
  id: string;
  kind: "pomodoro";
  name: string;
  config: PomodoroConfig;
}

export interface IntervalRoutine {
  id: string;
  kind: "interval";
  name: string;
  config: IntervalConfig;
}

export type Routine = CountdownRoutine | PomodoroRoutine | IntervalRoutine;

export interface Store {
  routines: Routine[];
  countdownSec: number;
  pomodoro: PomodoroConfig;
  interval: IntervalConfig;
  lastMode: Mode;
}

export const DEFAULT_POMO: PomodoroConfig = {
  workSec: 25 * 60,
  restSec: 5 * 60,
  longRestSec: 15 * 60,
  rounds: 4,
  longEvery: 4,
};

export const DEFAULT_TABATA: IntervalConfig = {
  name: "Tabata",
  steps: [
    { kind: "work", seconds: 20 },
    { kind: "rest", seconds: 10 },
  ],
  rounds: 8,
};

export const DEFAULT_HIIT: IntervalConfig = {
  name: "HIIT 40/20",
  steps: [
    { kind: "work", seconds: 40 },
    { kind: "rest", seconds: 20 },
  ],
  rounds: 8,
};

export const STARTER_ROUTINES: Routine[] = [
  { id: "starter-pomo", kind: "pomodoro", name: "Pomodoro 25/5", config: { ...DEFAULT_POMO } },
  { id: "starter-tabata", kind: "interval", name: "Tabata 20/10 × 8", config: { ...DEFAULT_TABATA, steps: DEFAULT_TABATA.steps.map((s) => ({ ...s })) } },
  { id: "starter-hiit", kind: "interval", name: "HIIT 40/20 × 8", config: { ...DEFAULT_HIIT, steps: DEFAULT_HIIT.steps.map((s) => ({ ...s })) } },
  {
    id: "starter-50",
    kind: "countdown",
    name: "50:00",
    seconds: 50 * 60,
  },
];

export function emptyStore(): Store {
  return {
    routines: STARTER_ROUTINES.map((r) => structuredClone(r)),
    countdownSec: 10 * 60,
    pomodoro: { ...DEFAULT_POMO },
    interval: { ...DEFAULT_TABATA, steps: DEFAULT_TABATA.steps.map((s) => ({ ...s })) },
    lastMode: "countdown",
  };
}

function isPhaseKind(v: unknown): v is PhaseKind {
  return v === "work" || v === "rest" || v === "longRest";
}

function normalizeStep(raw: unknown): IntervalStep | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const seconds = clampSec(o.seconds, 0, 0, 24 * 3600);
  if (seconds <= 0) return null;
  return {
    kind: isPhaseKind(o.kind) ? o.kind : "work",
    seconds,
    label: typeof o.label === "string" ? o.label.slice(0, 40) : undefined,
  };
}

function normalizePomo(raw: unknown): PomodoroConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    workSec: clampSec(o.workSec, DEFAULT_POMO.workSec),
    restSec: clampSec(o.restSec, DEFAULT_POMO.restSec),
    longRestSec: clampSec(o.longRestSec, DEFAULT_POMO.longRestSec),
    rounds: clampSec(o.rounds, DEFAULT_POMO.rounds, 1, 99),
    longEvery: clampSec(o.longEvery, DEFAULT_POMO.longEvery, 1, 99),
  };
}

function normalizeInterval(raw: unknown): IntervalConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const steps = Array.isArray(o.steps) ? o.steps.map(normalizeStep).filter((s): s is IntervalStep => s !== null) : [];
  return {
    name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 40) : "HIIT",
    steps: steps.length ? steps : DEFAULT_TABATA.steps.map((s) => ({ ...s })),
    rounds: clampSec(o.rounds, 8, 1, 99),
  };
}

function newId(): string {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeRoutine(raw: unknown): Routine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 40) : "Routine";
  const id = typeof o.id === "string" && o.id ? o.id : newId();
  if (o.kind === "countdown") {
    return { id, kind: "countdown", name, seconds: clampSec(o.seconds, 600) };
  }
  if (o.kind === "pomodoro") {
    return { id, kind: "pomodoro", name, config: normalizePomo(o.config) };
  }
  if (o.kind === "interval") {
    return { id, kind: "interval", name, config: normalizeInterval(o.config) };
  }
  return null;
}

export function parseStore(raw: unknown): Store {
  const base = emptyStore();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const routines = Array.isArray(o.routines)
    ? o.routines.map(normalizeRoutine).filter((r): r is Routine => r !== null)
    : base.routines;
  const lastMode: Mode =
    o.lastMode === "countdown" || o.lastMode === "pomodoro" || o.lastMode === "interval" || o.lastMode === "stopwatch"
      ? o.lastMode
      : base.lastMode;
  return {
    routines: routines.length ? routines : base.routines,
    countdownSec: clampSec(o.countdownSec, base.countdownSec),
    pomodoro: normalizePomo(o.pomodoro),
    interval: normalizeInterval(o.interval),
    lastMode,
  };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return parseStore(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* private mode */
  }
}

export function clearStore(): Store {
  const next = emptyStore();
  saveStore(next);
  return next;
}

export const BACKUP_KIND = "try-dabble/timerpad";
export const BACKUP_VERSION = 1;

export interface Backup {
  kind: typeof BACKUP_KIND;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  store: Store;
  prefs: Prefs;
}

export function buildBackup(store: Store, prefs: Prefs): Backup {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    store,
    prefs,
  };
}

export function parseBackup(raw: unknown): Backup | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== BACKUP_KIND) return null;
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : new Date().toISOString(),
    store: parseStore(o.store),
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
  return `timerpad-${y}${m}${d}.json`;
}

export function download(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function makeRoutineId(): string {
  return newId();
}
