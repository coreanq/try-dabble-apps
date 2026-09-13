/**
 * petplay:needs:v1 — the care loop, as pure arithmetic.
 *
 * Four meters from 0 to 100 (100 = fully satisfied). They drift down with
 * time; Feed / Play / Pet / Clean push them back up. Everything happens in
 * the open tab: no widget, no push, no server tick. On reopen the elapsed
 * time is applied once, capped so a week away leaves a hungry pet, not a
 * dead one.
 */

export const NEEDS_KEY = "petplay:needs:v1";

export interface Needs {
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  lastTickAt: number;
  lastFedAt?: number;
  lastPlayedAt?: number;
}

export type NeedKey = "hunger" | "happiness" | "energy" | "cleanliness";
export const NEED_KEYS: NeedKey[] = ["hunger", "happiness", "energy", "cleanliness"];

/** Points lost per hour while time passes. */
export const DECAY_PER_HOUR: Record<NeedKey, number> = {
  hunger: 40,
  happiness: 30,
  energy: 20,
  cleanliness: 15,
};

export const HOUR_MS = 3_600_000;
/** Time away counts up to this much, so the pet never comes back at zero everything. */
export const MAX_AWAY_MS = 3 * HOUR_MS;
/** Offline decay never pushes a meter below this; in-tab decay can reach 0. */
export const AWAY_FLOOR = 10;
/** How often the open tab applies decay. */
export const TICK_MS = 10_000;
/** Reopening after at least this long shows the "missed you" note. */
export const AWAY_NOTICE_MS = 10 * 60_000;

export const ACTION_DELTAS = {
  feed: { hunger: 30, happiness: 4, energy: 5, cleanliness: -3 },
  play: { hunger: -5, happiness: 25, energy: -10, cleanliness: -4 },
  pet: { hunger: 0, happiness: 10, energy: 15, cleanliness: 0 },
  clean: { hunger: 0, happiness: 3, energy: 0, cleanliness: 45 },
} as const;
export type CareAction = keyof typeof ACTION_DELTAS;
export const CARE_ACTIONS: CareAction[] = ["feed", "play", "pet", "clean"];

export function clamp(v: number, lo = 0, hi = 100): number {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

export function freshNeeds(now: number = Date.now()): Needs {
  return { hunger: 80, happiness: 80, energy: 90, cleanliness: 85, lastTickAt: now };
}

export function normalizeNeeds(raw: unknown, now: number = Date.now()): Needs {
  const base = freshNeeds(now);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? clamp(v) : d);
  const ts = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);
  return {
    hunger: num(o.hunger, base.hunger),
    happiness: num(o.happiness, base.happiness),
    energy: num(o.energy, base.energy),
    cleanliness: num(o.cleanliness, base.cleanliness),
    lastTickAt: ts(o.lastTickAt) ?? now,
    ...(ts(o.lastFedAt) ? { lastFedAt: ts(o.lastFedAt) } : {}),
    ...(ts(o.lastPlayedAt) ? { lastPlayedAt: ts(o.lastPlayedAt) } : {}),
  };
}

/**
 * Applies `elapsedMs` of drift. `floor` is the lowest a meter may reach
 * through this call (0 while the tab is open, AWAY_FLOOR on reopen).
 * A meter already below the floor is left where it is, never raised.
 */
export function decay(needs: Needs, elapsedMs: number, floor = 0): Needs {
  const hours = Math.max(0, elapsedMs) / HOUR_MS;
  const out: Needs = { ...needs };
  for (const k of NEED_KEYS) {
    const lo = Math.min(floor, needs[k]);
    out[k] = clamp(needs[k] - DECAY_PER_HOUR[k] * hours, lo, 100);
  }
  return out;
}

/** The regular in-tab tick: drift by the time since the last tick. */
export function tick(needs: Needs, now: number = Date.now(), paused = false): Needs {
  const elapsed = Math.max(0, now - needs.lastTickAt);
  if (paused || elapsed <= 0) return { ...needs, lastTickAt: now };
  return { ...decay(needs, elapsed, 0), lastTickAt: now };
}

/**
 * On load: apply the time away, capped at MAX_AWAY_MS and floored at
 * AWAY_FLOOR, so the pet is hungry and sad but present. Returns how long the
 * pet was alone so the UI can say so.
 */
export function catchUp(needs: Needs, now: number = Date.now(), paused = false): { needs: Needs; awayMs: number } {
  const awayMs = Math.max(0, now - needs.lastTickAt);
  if (paused) return { needs: { ...needs, lastTickAt: now }, awayMs };
  const applied = Math.min(awayMs, MAX_AWAY_MS);
  return { needs: { ...decay(needs, applied, AWAY_FLOOR), lastTickAt: now }, awayMs };
}

/** Feed / Play / Pet / Clean. Every action is free and never locked. */
export function applyAction(needs: Needs, action: CareAction, now: number = Date.now()): Needs {
  const d = ACTION_DELTAS[action];
  const out: Needs = {
    ...needs,
    hunger: clamp(needs.hunger + d.hunger),
    happiness: clamp(needs.happiness + d.happiness),
    energy: clamp(needs.energy + d.energy),
    cleanliness: clamp(needs.cleanliness + d.cleanliness),
  };
  if (action === "feed") out.lastFedAt = now;
  if (action === "play") out.lastPlayedAt = now;
  return out;
}

/** "Skip 1 hour": the demo fast-forward, same maths as waiting. */
export function skipHours(needs: Needs, hours = 1): Needs {
  return decay(needs, hours * HOUR_MS, 0);
}

export type Mood = "happy" | "okay" | "sad" | "hungry" | "sleepy" | "dirty" | "bored";

/**
 * The face on the sprite. The lowest urgent meter wins so the pet asks for
 * the thing it needs most; otherwise the average sets happy / okay / sad.
 */
export function moodOf(n: Needs): Mood {
  const urgent: Array<[NeedKey, Mood]> = [
    ["hunger", "hungry"],
    ["energy", "sleepy"],
    ["cleanliness", "dirty"],
    ["happiness", "bored"],
  ];
  let worst: { key: NeedKey; mood: Mood; value: number } | null = null;
  for (const [key, mood] of urgent) {
    if (n[key] < 30 && (!worst || n[key] < worst.value)) worst = { key, mood, value: n[key] };
  }
  if (worst) return worst.mood;
  const avg = (n.hunger + n.happiness + n.energy + n.cleanliness) / 4;
  if (avg >= 70) return "happy";
  if (avg >= 45) return "okay";
  return "sad";
}

export function loadNeeds(now: number = Date.now()): Needs {
  try {
    const raw = localStorage.getItem(NEEDS_KEY);
    return normalizeNeeds(raw ? JSON.parse(raw) : null, now);
  } catch {
    return freshNeeds(now);
  }
}

export function saveNeeds(needs: Needs): void {
  try {
    localStorage.setItem(NEEDS_KEY, JSON.stringify(needs));
  } catch {
    /* private mode or quota */
  }
}

export function clearNeeds(): void {
  try {
    localStorage.removeItem(NEEDS_KEY);
  } catch {
    /* ignore */
  }
}
