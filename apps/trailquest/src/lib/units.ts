/**
 * Everything is stored in miles. The unit toggle only changes what is typed
 * and what is shown; the log never holds two units side by side.
 */

export type Unit = "mi" | "km";

export const KM_PER_MILE = 1.609344;
export const DEFAULT_STEPS_PER_MILE = 2000;

export function isUnit(v: unknown): v is Unit {
  return v === "mi" || v === "km";
}

export function milesToKm(mi: number): number {
  return mi * KM_PER_MILE;
}

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

/** Typed distance in the chosen unit → miles, rounded to 3 decimals. */
export function toMiles(value: number, unit: Unit): number {
  const mi = unit === "km" ? kmToMiles(value) : value;
  return Math.round(mi * 1000) / 1000;
}

/** Stored miles → the chosen unit, unrounded (formatting rounds). */
export function fromMiles(miles: number, unit: Unit): number {
  return unit === "km" ? milesToKm(miles) : miles;
}

/**
 * "8,000" / "8 000" / "12.5" → number, NaN when nothing usable is left. A
 * comma is treated as a thousands mark when it sits three digits from the
 * end and no dot is present, otherwise as a decimal mark (12,5 → 12.5).
 */
export function parseNumber(raw: string): number {
  let s = raw.trim().replace(/\s+/g, "");
  if (!s) return NaN;
  if (s.includes(",") && !s.includes(".")) {
    s = /,\d{3}(,\d{3})*$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Phone step count → miles at the reader's stride. 0 for bad input. */
export function stepsToMiles(steps: number, stepsPerMile: number = DEFAULT_STEPS_PER_MILE): number {
  if (!Number.isFinite(steps) || steps <= 0) return 0;
  const per = Number.isFinite(stepsPerMile) && stepsPerMile > 0 ? stepsPerMile : DEFAULT_STEPS_PER_MILE;
  return Math.round((steps / per) * 1000) / 1000;
}

/** Locale-aware "12.5 mi" / "20.1 km". */
export function formatDistance(miles: number, unit: Unit, locale: string, unitLabel: string, digits = 1): string {
  const value = fromMiles(miles, unit);
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(
    Math.round(value * 10 ** digits) / 10 ** digits,
  );
  return `${n} ${unitLabel}`;
}
