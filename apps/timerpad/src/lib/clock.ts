/**
 * Drift-corrected timer arithmetic.
 *
 * The engine stores a start instant in both performance.now() and Date.now().
 * While the tab is visible we prefer performance.now() (monotonic, not
 * affected by clock adjustments). When the tab is backgrounded browsers
 * throttle rAF and setTimeout, so we fall back to the wall clock so the
 * remaining figure is still right when the user comes back — and we keep a
 * 250 ms interval running so the display keeps ticking as much as the
 * browser allows.
 *
 * Nothing here talks to a server. No notifications. No background push.
 */
export type Mode = "countdown" | "pomodoro" | "interval" | "stopwatch";
export type RunState = "idle" | "running" | "paused" | "done";
export type PhaseKind = "work" | "rest" | "longRest";

export interface IntervalStep {
  kind: PhaseKind;
  seconds: number;
  label?: string;
}

export interface PomodoroConfig {
  workSec: number;
  restSec: number;
  longRestSec: number;
  rounds: number;
  longEvery: number;
}

export interface IntervalConfig {
  name: string;
  steps: IntervalStep[];
  rounds: number;
}

export interface Engine {
  mode: Mode;
  state: RunState;
  /** Remaining ms at the last start/resume (countdown family). */
  remainingAtStartMs: number;
  /** Elapsed ms at the last start/resume (stopwatch). */
  elapsedAtStartMs: number;
  startedAtPerf: number;
  startedAtWall: number;
  /** Current phase index for pomodoro / interval. */
  phaseIndex: number;
  phaseKind: PhaseKind;
  phaseLabel: string;
  /** 1-based round on screen. */
  round: number;
  totalRounds: number;
  /** Laps for stopwatch, each an elapsed-ms stamp. */
  laps: number[];
}

export function nowPair(): { perf: number; wall: number } {
  const wall = Date.now();
  const perf = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : wall;
  return { perf, wall };
}

/** Prefer monotonic clock; if the tab is hidden, prefer wall so a throttled
 *  timer still tracks real time. */
export function elapsedSince(engine: Engine, hidden: boolean, now = nowPair()): number {
  if (engine.state !== "running") return 0;
  if (hidden) return Math.max(0, now.wall - engine.startedAtWall);
  return Math.max(0, now.perf - engine.startedAtPerf);
}

export function remainingMs(engine: Engine, hidden: boolean, now = nowPair()): number {
  if (engine.state === "idle") return engine.remainingAtStartMs;
  if (engine.state === "paused") return engine.remainingAtStartMs;
  if (engine.state === "done") return 0;
  return Math.max(0, engine.remainingAtStartMs - elapsedSince(engine, hidden, now));
}

export function elapsedMs(engine: Engine, hidden: boolean, now = nowPair()): number {
  if (engine.state === "idle") return 0;
  if (engine.state === "paused") return engine.elapsedAtStartMs;
  return engine.elapsedAtStartMs + elapsedSince(engine, hidden, now);
}

export function idleCountdown(totalSec: number): Engine {
  const ms = Math.max(0, Math.round(totalSec * 1000));
  return {
    mode: "countdown",
    state: "idle",
    remainingAtStartMs: ms,
    elapsedAtStartMs: 0,
    startedAtPerf: 0,
    startedAtWall: 0,
    phaseIndex: 0,
    phaseKind: "work",
    phaseLabel: "",
    round: 1,
    totalRounds: 1,
    laps: [],
  };
}

export function idleStopwatch(): Engine {
  return {
    mode: "stopwatch",
    state: "idle",
    remainingAtStartMs: 0,
    elapsedAtStartMs: 0,
    startedAtPerf: 0,
    startedAtWall: 0,
    phaseIndex: 0,
    phaseKind: "work",
    phaseLabel: "",
    round: 1,
    totalRounds: 1,
    laps: [],
  };
}

export function startEngine(engine: Engine, now = nowPair()): Engine {
  return {
    ...engine,
    state: "running",
    startedAtPerf: now.perf,
    startedAtWall: now.wall,
  };
}

export function pauseEngine(engine: Engine, hidden: boolean, now = nowPair()): Engine {
  if (engine.state !== "running") return engine;
  if (engine.mode === "stopwatch") {
    return { ...engine, state: "paused", elapsedAtStartMs: elapsedMs(engine, hidden, now) };
  }
  return { ...engine, state: "paused", remainingAtStartMs: remainingMs(engine, hidden, now) };
}

export function resetEngine(engine: Engine, totalMs: number): Engine {
  return {
    ...engine,
    state: "idle",
    remainingAtStartMs: Math.max(0, totalMs),
    elapsedAtStartMs: 0,
    startedAtPerf: 0,
    startedAtWall: 0,
    phaseIndex: 0,
    laps: [],
  };
}

export function finishEngine(engine: Engine): Engine {
  return { ...engine, state: "done", remainingAtStartMs: 0 };
}

export function addLap(engine: Engine, hidden: boolean, now = nowPair()): Engine {
  if (engine.mode !== "stopwatch") return engine;
  const stamp = elapsedMs(engine, hidden, now);
  return { ...engine, laps: [...engine.laps, stamp] };
}

export function expandPomodoro(cfg: PomodoroConfig): IntervalStep[] {
  const steps: IntervalStep[] = [];
  const rounds = Math.max(1, Math.round(cfg.rounds));
  const every = Math.max(1, Math.round(cfg.longEvery));
  for (let i = 1; i <= rounds; i++) {
    steps.push({ kind: "work", seconds: Math.max(1, Math.round(cfg.workSec)) });
    if (i === rounds) break;
    if (i % every === 0) {
      steps.push({ kind: "longRest", seconds: Math.max(1, Math.round(cfg.longRestSec)) });
    } else {
      steps.push({ kind: "rest", seconds: Math.max(1, Math.round(cfg.restSec)) });
    }
  }
  return steps;
}

export function expandInterval(cfg: IntervalConfig): IntervalStep[] {
  const rounds = Math.max(1, Math.round(cfg.rounds));
  const one = cfg.steps.filter((s) => s.seconds > 0);
  const out: IntervalStep[] = [];
  for (let r = 0; r < rounds; r++) out.push(...one);
  return out;
}

export function phaseRound(steps: IntervalStep[], index: number): { round: number; total: number } {
  const works = steps.filter((s) => s.kind === "work").length || 1;
  let seen = 0;
  for (let i = 0; i <= index && i < steps.length; i++) {
    if (steps[i].kind === "work") seen++;
  }
  return { round: Math.max(1, seen), total: works };
}

export function applyPhase(engine: Engine, steps: IntervalStep[], index: number, now = nowPair()): Engine {
  if (index >= steps.length) return finishEngine(engine);
  const step = steps[index];
  const { round, total } = phaseRound(steps, index);
  return {
    ...engine,
    state: "running",
    remainingAtStartMs: Math.max(0, Math.round(step.seconds * 1000)),
    startedAtPerf: now.perf,
    startedAtWall: now.wall,
    phaseIndex: index,
    phaseKind: step.kind,
    phaseLabel: step.label ?? "",
    round,
    totalRounds: total,
  };
}

/** m:ss, or h:mm:ss above an hour. Hundredths for stopwatch under an hour. */
export function formatClock(ms: number, withHundredths = false): string {
  const total = Math.max(0, Math.floor(ms));
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  const body = h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  return withHundredths && !h ? `${body}.${String(cs).padStart(2, "0")}` : body;
}

export function clampSec(v: unknown, fallback: number, min = 1, max = 24 * 3600): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function parseMmSs(raw: string, fallbackSec: number): number {
  const t = raw.trim();
  if (!t) return fallbackSec;
  if (t.includes(":")) {
    const parts = t.split(":");
    const a = Number(parts[0]);
    const b = Number(parts[1] ?? 0);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return fallbackSec;
    return clampSec(a * 60 + b, fallbackSec);
  }
  return clampSec(Number(t), fallbackSec);
}

export function toMmSs(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
