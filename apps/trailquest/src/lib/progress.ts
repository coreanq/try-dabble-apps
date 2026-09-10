/**
 * Progress is derived from the log, never stored as the source of truth, so
 * editing or deleting an entry recalculates everything on the spot. What IS
 * stored (trailquest:progress:v1) is a per-route snapshot of unlocked
 * milestones and dates, kept explicitly so that switching routes never
 * touches another route's state and a backup carries the badges along.
 */
import { addDays, daysBetween } from "./dates.ts";
import type { LogEntry } from "./logs.ts";
import type { Milestone, Route } from "./routes.ts";

export const PROGRESS_KEY = "trailquest:progress:v1";

export interface RouteProgressState {
  unlockedMilestoneIds: string[];
  /** milestone id → YYYY-MM-DD of the entry that crossed it */
  unlockedAt: Record<string, string>;
  completedAt?: string;
}

export type ProgressMap = Record<string, RouteProgressState>;

export interface MilestoneStatus {
  milestone: Milestone;
  unlocked: boolean;
  unlockedOn?: string;
}

export interface RouteProgress {
  routeId: string;
  miles: number;
  totalMiles: number;
  /** 0..1, clamped. */
  ratio: number;
  percent: number;
  remaining: number;
  done: boolean;
  completedOn?: string;
  milestones: MilestoneStatus[];
  next: MilestoneStatus | null;
  entries: number;
}

export function roundMiles(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Miles on one route, from its log entries only. */
export function milesFor(logs: LogEntry[], routeId: string): number {
  let sum = 0;
  for (const l of logs) if (l.routeId === routeId) sum += l.miles;
  return roundMiles(sum);
}

/**
 * Walk the route's entries in date order and note the date on which the
 * running total first reaches each milestone. The start marker (0 miles)
 * unlocks with the first entry, not before it.
 */
export function unlockDates(route: Route, logs: LogEntry[]): Record<string, string> {
  const own = logs
    .filter((l) => l.routeId === route.id)
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
  const dates: Record<string, string> = {};
  let sum = 0;
  for (const entry of own) {
    sum = roundMiles(sum + entry.miles);
    for (const m of route.milestones) {
      if (!(m.id in dates) && sum >= m.milesFromStart) dates[m.id] = entry.date;
    }
  }
  return dates;
}

export function completedOn(route: Route, logs: LogEntry[]): string | undefined {
  const own = logs
    .filter((l) => l.routeId === route.id)
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
  let sum = 0;
  for (const entry of own) {
    sum = roundMiles(sum + entry.miles);
    if (sum >= route.totalMiles) return entry.date;
  }
  return undefined;
}

export function progressFor(route: Route, logs: LogEntry[]): RouteProgress {
  const miles = milesFor(logs, route.id);
  const ratio = route.totalMiles > 0 ? Math.min(1, miles / route.totalMiles) : 0;
  const dates = unlockDates(route, logs);
  const milestones: MilestoneStatus[] = [...route.milestones]
    .sort((a, b) => a.milesFromStart - b.milesFromStart)
    .map((m) => {
      const on = dates[m.id];
      return on ? { milestone: m, unlocked: true, unlockedOn: on } : { milestone: m, unlocked: false };
    });
  const next = milestones.find((m) => !m.unlocked) ?? null;
  const done = route.totalMiles > 0 && miles >= route.totalMiles;
  const out: RouteProgress = {
    routeId: route.id,
    miles,
    totalMiles: route.totalMiles,
    ratio,
    percent: Math.round(ratio * 1000) / 10,
    remaining: roundMiles(Math.max(0, route.totalMiles - miles)),
    done,
    milestones,
    next,
    entries: logs.filter((l) => l.routeId === route.id).length,
  };
  if (done) out.completedOn = completedOn(route, logs);
  return out;
}

/** The explicit per-route snapshot that goes to storage and into backups. */
export function snapshot(routes: Route[], logs: LogEntry[]): ProgressMap {
  const map: ProgressMap = {};
  for (const route of routes) {
    const p = progressFor(route, logs);
    if (p.entries === 0) continue;
    const state: RouteProgressState = {
      unlockedMilestoneIds: p.milestones.filter((m) => m.unlocked).map((m) => m.milestone.id),
      unlockedAt: Object.fromEntries(p.milestones.filter((m) => m.unlocked).map((m) => [m.milestone.id, m.unlockedOn!])),
    };
    if (p.completedOn) state.completedAt = p.completedOn;
    map[route.id] = state;
  }
  return map;
}

export function saveProgress(map: ProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

/** Milestones that are unlocked in `after` but were not in `before`. */
export function newlyUnlocked(before: RouteProgress | null, after: RouteProgress): MilestoneStatus[] {
  const had = new Set((before?.milestones ?? []).filter((m) => m.unlocked).map((m) => m.milestone.id));
  return after.milestones.filter((m) => m.unlocked && m.milestone.milesFromStart > 0 && !had.has(m.milestone.id));
}

// ---- stats and streaks ------------------------------------------------------

export interface Stats {
  totalMiles: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}

/** Distinct YYYY-MM-DD days with at least one entry, ascending. */
export function activeDates(logs: LogEntry[]): string[] {
  return [...new Set(logs.map((l) => l.date))].sort();
}

export function longestStreak(dates: string[]): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    run = prev !== null && daysBetween(prev, d) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/**
 * Consecutive days ending today or yesterday (a streak survives until the
 * day after a missed one). 0 when the last entry is older than yesterday.
 */
export function currentStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : addDays(today, -1);
  if (!set.has(cursor)) return 0;
  let n = 0;
  while (set.has(cursor)) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function statsFor(logs: LogEntry[], today: string): Stats {
  const dates = activeDates(logs);
  let total = 0;
  for (const l of logs) total += l.miles;
  return {
    totalMiles: roundMiles(total),
    activeDays: dates.length,
    currentStreak: currentStreak(dates, today),
    longestStreak: longestStreak(dates),
  };
}
