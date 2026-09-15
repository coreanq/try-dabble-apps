/**
 * Wrong-PIN backoff for the unlock modal: after each failure the next try
 * has to wait 1s, 2s, 4s, 8s … up to a minute. The state is kept per note
 * and persisted so a reload does not reset the clock. A correct PIN resets it.
 */
export const BACKOFF_BASE_MS = 1000;
export const BACKOFF_MAX_MS = 60_000;

export interface BackoffState {
  failures: number;
  lockedUntil: number; // epoch ms; 0 = free to try
}

export function backoffDelayMs(failures: number): number {
  if (!Number.isFinite(failures) || failures <= 0) return 0;
  return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** (Math.min(failures, 30) - 1));
}

export function resetBackoff(): BackoffState {
  return { failures: 0, lockedUntil: 0 };
}

export function recordFailure(state: BackoffState, now = Date.now()): BackoffState {
  const failures = state.failures + 1;
  return { failures, lockedUntil: now + backoffDelayMs(failures) };
}

export function remainingMs(state: BackoffState, now = Date.now()): number {
  return Math.max(0, state.lockedUntil - now);
}

export function isBackoffState(v: unknown): v is BackoffState {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.failures === "number" && typeof o.lockedUntil === "number";
}
