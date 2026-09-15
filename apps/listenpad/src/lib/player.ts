/**
 * Pure transport maths for the drill player. No DOM here so node --test can
 * check every edge: rewinding past 0, skipping past the end, a B point that
 * lands before A, a loop that has only one point.
 */
export type RewindSec = 1 | 2 | 3 | 4;
export const REWIND_STEPS: RewindSec[] = [1, 2, 3, 4];
export const DEFAULT_REWIND: RewindSec = 2;

export const SPEEDS: number[] = [0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5];
export const DEFAULT_SPEED = 1;
export const MIN_SPEED = 0.25;
export const MAX_SPEED = 3;

export interface LoopPoints {
  a: number | null;
  b: number | null;
}

export const NO_LOOP: LoopPoints = { a: null, b: null };

export function isRewindSec(v: unknown): v is RewindSec {
  return v === 1 || v === 2 || v === 3 || v === 4;
}

export function clampRewind(n: number): RewindSec {
  const r = Math.round(n);
  return (r < 1 ? 1 : r > 4 ? 4 : r) as RewindSec;
}

export function isSpeed(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= MIN_SPEED && v <= MAX_SPEED;
}

export function clampSpeed(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SPEED;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, n));
}

/** Keeps a time inside [0, duration]. An unknown duration only clamps at 0. */
export function clampTime(t: number, duration: number): number {
  if (!Number.isFinite(t) || t < 0) return 0;
  if (Number.isFinite(duration) && duration > 0 && t > duration) return duration;
  return t;
}

export function applyRewind(current: number, sec: number, duration: number): number {
  return clampTime(current - sec, duration);
}

export function applySkip(current: number, sec: number, duration: number): number {
  return clampTime(current + sec, duration);
}

export function loopActive(ab: LoopPoints): boolean {
  return ab.a !== null && ab.b !== null && ab.b > ab.a;
}

/** True when playback has reached B and must jump back to A. Scrubbing to
 *  before A is left alone: the loop only guards the far end. */
export function shouldSeekToA(current: number, a: number | null, b: number | null, loopOn: boolean): boolean {
  if (!loopOn || a === null || b === null) return false;
  if (!(b > a)) return false;
  return current >= b;
}

/**
 * Sets A or B at time t. If the second point lands before the first, the two
 * are swapped so A is always the earlier one; the same instant twice keeps
 * only the point just set so the user can tap the other one again.
 */
export function setLoopPoint(ab: LoopPoints, which: "a" | "b", t: number): LoopPoints {
  const v = Number.isFinite(t) && t > 0 ? t : 0;
  const next: LoopPoints = which === "a" ? { a: v, b: ab.b } : { a: ab.a, b: v };
  if (next.a !== null && next.b !== null) {
    if (next.a === next.b) return which === "a" ? { a: v, b: null } : { a: null, b: v };
    if (next.b < next.a) return { a: next.b, b: next.a };
  }
  return next;
}

/** Drops loop points that a newly loaded file cannot hold. */
export function fitLoop(ab: LoopPoints, duration: number): LoopPoints {
  if (!Number.isFinite(duration) || duration <= 0) return ab;
  const slack = duration + 0.25;
  if ((ab.a !== null && ab.a > slack) || (ab.b !== null && ab.b > slack)) return NO_LOOP;
  return ab;
}

export function fmtTime(sec: number, tenths = false): string {
  const s = Number.isFinite(sec) && sec > 0 ? sec : 0;
  const whole = Math.floor(s);
  const m = Math.floor(whole / 60);
  const r = whole % 60;
  const base = `${m}:${String(r).padStart(2, "0")}`;
  return tenths ? `${base}.${Math.floor((s - whole) * 10)}` : base;
}

export function fmtSpeed(speed: number): string {
  return `${Number(speed.toFixed(2))}×`;
}

/** Marker position along the scrubber, as a CSS percentage. */
export function pct(t: number | null, duration: number): string {
  if (t === null || !Number.isFinite(duration) || duration <= 0) return "0%";
  const p = Math.min(100, Math.max(0, (t / duration) * 100));
  return `${p.toFixed(3)}%`;
}

export const AUDIO_EXT: string[] = [
  ".mp3", ".m4a", ".m4b", ".aac", ".wav", ".ogg", ".oga", ".opus", ".flac", ".webm", ".mp4", ".wma", ".aiff", ".aif", ".caf", ".amr", ".3gp",
];
export const ACCEPT = "audio/*," + AUDIO_EXT.join(",");

/** MIME first (audio/*), then the extension for files the OS leaves untyped. */
export function isAudioFile(f: { name: string; type?: string }): boolean {
  if (typeof f.type === "string" && f.type.startsWith("audio/")) return true;
  const lower = (f.name || "").toLowerCase();
  return AUDIO_EXT.some((ext) => lower.endsWith(ext));
}
