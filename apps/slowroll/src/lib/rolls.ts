/**
 * Roll state. Pure functions only — no DOM, no storage — so the time lock can
 * be unit-tested with plain node. The unlock moment is stored as an ABSOLUTE
 * epoch timestamp, never as a remaining count: closing the tab, reloading, or
 * leaving the phone in a drawer cannot shorten the wait, and every mount just
 * recomputes unlockAt - now.
 */

export const DEFAULT_CAPACITY = 24;
export const DEVELOP_WAIT_MS = 72 * 60 * 60 * 1000;

/** full: the 72h start when the last frame is shot. first: they start at the first frame. */
export type DevelopMode = "full" | "first";

export type Roll = {
  id: string;
  createdAt: number;
  mode: DevelopMode;
  capacity: number;
  /** Frame ids in shooting order. Append-only: no per-frame delete exists. */
  frames: string[];
  firstShotAt: number | null;
  /** When the roll stopped accepting frames (full, finished, or timer ran out). */
  finishedAt: number | null;
  /** Absolute epoch ms. Null until the timer has a reason to start. */
  unlockAt: number | null;
  developedEarly: boolean;
};

export type RollPhase = "shooting" | "locked" | "developed";

export function uid(): string {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function newRoll(mode: DevelopMode, now: number, capacity = DEFAULT_CAPACITY): Roll {
  return {
    id: uid(),
    createdAt: now,
    mode,
    capacity,
    frames: [],
    firstShotAt: null,
    finishedAt: null,
    unlockAt: null,
    developedEarly: false,
  };
}

export function framesLeft(roll: Roll): number {
  return Math.max(0, roll.capacity - roll.frames.length);
}

export function isFull(roll: Roll): boolean {
  return roll.frames.length >= roll.capacity;
}

/** developed = the unlock moment has passed; locked = sealed and waiting; shooting = still open. */
export function phaseOf(roll: Roll, now: number): RollPhase {
  if (roll.unlockAt !== null && now >= roll.unlockAt) return "developed";
  if (roll.finishedAt !== null) return "locked";
  return "shooting";
}

export function isOpen(roll: Roll, now: number): boolean {
  return phaseOf(roll, now) === "shooting";
}

/**
 * Commits one frame. Never returns a preview of anything; the id is all the
 * UI ever sees. In "first" mode the very first frame starts the clock; in
 * "full" mode the last frame does.
 */
export function commitFrame(roll: Roll, frameId: string, now: number): Roll {
  if (!isOpen(roll, now) || isFull(roll)) return roll;
  const frames = [...roll.frames, frameId];
  let { firstShotAt, unlockAt, finishedAt } = roll;
  if (firstShotAt === null) {
    firstShotAt = now;
    if (roll.mode === "first") unlockAt = now + DEVELOP_WAIT_MS;
  }
  if (frames.length >= roll.capacity) {
    finishedAt = now;
    if (unlockAt === null) unlockAt = now + DEVELOP_WAIT_MS;
  }
  return { ...roll, frames, firstShotAt, unlockAt, finishedAt };
}

/**
 * "Finish roll now": gives up the remaining frames and seals the roll. It
 * starts the same real 72h wait — it never shortens one already running.
 */
export function finishRoll(roll: Roll, now: number): Roll {
  if (!isOpen(roll, now) || roll.frames.length === 0) return roll;
  return {
    ...roll,
    finishedAt: now,
    unlockAt: roll.unlockAt ?? now + DEVELOP_WAIT_MS,
  };
}

/** The one explicit escape hatch. Only ever called after a confirm dialog. */
export function developEarly(roll: Roll, now: number): Roll {
  if (roll.frames.length === 0) return roll;
  return {
    ...roll,
    finishedAt: roll.finishedAt ?? now,
    unlockAt: now,
    developedEarly: true,
  };
}

/** In "first" mode the timer can run out while the roll is still open: it seals itself. */
export function settle(roll: Roll, now: number): Roll {
  if (roll.finishedAt === null && roll.unlockAt !== null && now >= roll.unlockAt) {
    return { ...roll, finishedAt: roll.unlockAt };
  }
  return roll;
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; totalMs: number };

export function countdown(unlockAt: number, now: number): Countdown {
  const totalMs = Math.max(0, unlockAt - now);
  const totalSec = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalMs,
  };
}

/* ---------- persistence (browser only; guarded so node can import this file) ---------- */

export const ROLLS_KEY = "slowroll:rolls:v1";
export const VIEW_KEY = "slowroll:view:v1";

function isRoll(value: unknown): value is Roll {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return typeof r.id === "string" && Array.isArray(r.frames) && typeof r.capacity === "number";
}

export function loadRolls(): Roll[] {
  try {
    const raw = JSON.parse(localStorage.getItem(ROLLS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(isRoll).map((r) => ({
      id: r.id,
      createdAt: Number(r.createdAt) || 0,
      mode: r.mode === "first" ? "first" : "full",
      capacity: Number(r.capacity) || DEFAULT_CAPACITY,
      frames: r.frames.filter((f): f is string => typeof f === "string"),
      firstShotAt: r.firstShotAt === null || r.firstShotAt === undefined ? null : Number(r.firstShotAt),
      finishedAt: r.finishedAt === null || r.finishedAt === undefined ? null : Number(r.finishedAt),
      unlockAt: r.unlockAt === null || r.unlockAt === undefined ? null : Number(r.unlockAt),
      developedEarly: r.developedEarly === true,
    }));
  } catch {
    return [];
  }
}

export function saveRolls(rolls: Roll[]): void {
  try {
    localStorage.setItem(ROLLS_KEY, JSON.stringify(rolls));
  } catch {
    /* private mode — the roll just will not survive the reload */
  }
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  try {
    if (value === "") localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}
