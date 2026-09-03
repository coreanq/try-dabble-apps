/**
 * Local calendar day helpers. Pure, no DOM, so node --test can import them.
 *
 * The whole product rule lives here: a check belongs to ONE local calendar
 * day. If the day key in storage is not today's key, every check is stale and
 * must go, while the item list (labels, order) is kept.
 */

export type Checks = Record<string, string>;

export interface DayState {
  day: string;
  checks: Checks;
}

/** YYYY-MM-DD in the device's local time zone, never UTC. */
export function localDayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Milliseconds from `now` until the next local midnight (plus a 1s guard). */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * Given what was stored and what day it is now, decide what today's checks
 * are. Stale day → empty checks and today's key. Same day → untouched.
 */
export function rollover(stored: DayState | null, today: string): DayState {
  if (!stored || stored.day !== today) {
    return { day: today, checks: {} };
  }
  return stored;
}

/** Only the ids in `itemIds` keep their timestamps; removed items drop out. */
export function pruneChecks(checks: Checks, itemIds: string[]): Checks {
  const keep = new Set(itemIds);
  const out: Checks = {};
  for (const [id, at] of Object.entries(checks)) {
    if (keep.has(id) && typeof at === "string" && at) out[id] = at;
  }
  return out;
}
