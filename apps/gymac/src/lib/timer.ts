/**
 * Foreground rest timer arithmetic. The UI stores an end instant and asks
 * "how many seconds are left" on every tick, so a throttled background tab
 * still shows the right number when it comes back. No notifications, no
 * background push: when the tab is hidden the timer simply keeps counting
 * from the wall clock.
 */
export const REST_PRESETS = [60, 90, 120, 180] as const;
export const REST_MIN = 5;
export const REST_MAX = 3600;
export const DEFAULT_REST_SECONDS = 90;

export function clampRestSeconds(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return DEFAULT_REST_SECONDS;
  return Math.min(REST_MAX, Math.max(REST_MIN, Math.round(n)));
}

/** Whole seconds left, never negative. */
export function remainingSeconds(endAtMs: number, nowMs: number = Date.now()): number {
  return Math.max(0, Math.ceil((endAtMs - nowMs) / 1000));
}

export function endAtFor(seconds: number, nowMs: number = Date.now()): number {
  return nowMs + seconds * 1000;
}

/** m:ss, or h:mm:ss above an hour. */
export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
