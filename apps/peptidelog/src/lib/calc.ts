/**
 * Reconstitution arithmetic. This file multiplies and divides the numbers the
 * person typed; it never suggests what those numbers should be. There is no
 * dosing table, no compound database and no "recommended" anything here or
 * anywhere else in the app. Not medical advice.
 *
 * Default syringe: an insulin syringe where 100 units = 1 mL (U-100). The
 * units-per-mL figure is a preference the person can change.
 */
import type { Vial } from "./model.ts";

export const DEFAULT_UNITS_PER_ML = 100;

export type DoseUnit = "mg" | "mcg";

function ok(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/** mg per mL after adding `diluentMl` of water to a `vialMg` vial. */
export function concentrationMgPerMl(vialMg: number, diluentMl: number): number | null {
  if (!ok(vialMg) || !ok(diluentMl)) return null;
  return vialMg / diluentMl;
}

export function concentrationMcgPerMl(vialMg: number, diluentMl: number): number | null {
  const c = concentrationMgPerMl(vialMg, diluentMl);
  return c === null ? null : c * 1000;
}

export function toMg(amount: number, unit: DoseUnit): number {
  return unit === "mcg" ? amount / 1000 : amount;
}

/** Volume to draw for one dose, in mL. */
export function volumeMlForDose(dose: number, unit: DoseUnit, vialMg: number, diluentMl: number): number | null {
  const c = concentrationMgPerMl(vialMg, diluentMl);
  if (c === null || !ok(dose)) return null;
  return toMg(dose, unit) / c;
}

/** Syringe units to draw for one dose (U-100 by default). */
export function unitsForDose(
  dose: number,
  unit: DoseUnit,
  vialMg: number,
  diluentMl: number,
  unitsPerMl: number = DEFAULT_UNITS_PER_ML,
): number | null {
  const ml = volumeMlForDose(dose, unit, vialMg, diluentMl);
  if (ml === null || !ok(unitsPerMl)) return null;
  return ml * unitsPerMl;
}

/** How many doses of this size one vial holds (fractional, not rounded). */
export function dosesPerVial(dose: number, unit: DoseUnit, vialMg: number): number | null {
  if (!ok(dose) || !ok(vialMg)) return null;
  return vialMg / toMg(dose, unit);
}

/** Round for display without pretending to precision: 2 decimals, trailing zeros trimmed. */
export function fmt(n: number | null, decimals = 2): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const s = n.toFixed(decimals);
  return s.replace(/\.?0+$/, "");
}

// ---- vial inventory ---------------------------------------------------------

/** The figure the low-stock line compares against: mg first, else mL. */
export function remainingOf(vial: Pick<Vial, "remainingMg" | "remainingMl">): { value: number; unit: "mg" | "mL" } | null {
  if (typeof vial.remainingMg === "number" && Number.isFinite(vial.remainingMg)) return { value: vial.remainingMg, unit: "mg" };
  if (typeof vial.remainingMl === "number" && Number.isFinite(vial.remainingMl)) return { value: vial.remainingMl, unit: "mL" };
  return null;
}

export function isLowStock(vial: Pick<Vial, "remainingMg" | "remainingMl" | "lowStockThreshold">): boolean {
  const r = remainingOf(vial);
  if (!r) return false;
  if (typeof vial.lowStockThreshold !== "number" || !Number.isFinite(vial.lowStockThreshold)) return false;
  return r.value <= vial.lowStockThreshold;
}

/**
 * Subtract one logged dose from a vial. Works in mg when the dose is mg/mcg;
 * when the dose was written in syringe units or mL and the vial has a known
 * concentration, the volume is converted first. Unknown units leave the vial
 * untouched rather than guessing.
 */
export function applyDoseToVial(vial: Vial, amount: number, unitLabel: string | undefined, unitsPerMl: number = DEFAULT_UNITS_PER_ML): Vial {
  if (!ok(amount)) return vial;
  const unit = (unitLabel || "").toLowerCase();
  let mg: number | null = null;
  let ml: number | null = null;
  if (unit === "mg") mg = amount;
  else if (unit === "mcg") mg = amount / 1000;
  else if (unit === "ml") ml = amount;
  else if (unit === "units" || unit === "iu") ml = ok(unitsPerMl) ? amount / unitsPerMl : null;
  const conc = typeof vial.diluentMl === "number" ? concentrationMgPerMl(vial.vialMg, vial.diluentMl) : null;
  if (mg === null && ml !== null && conc !== null) mg = ml * conc;
  if (ml === null && mg !== null && conc !== null) ml = mg / conc;
  const next: Vial = { ...vial };
  let changed = false;
  if (mg !== null && typeof vial.remainingMg === "number") {
    next.remainingMg = Math.max(0, round4(vial.remainingMg - mg));
    changed = true;
  }
  if (ml !== null && typeof vial.remainingMl === "number") {
    next.remainingMl = Math.max(0, round4(vial.remainingMl - ml));
    changed = true;
  }
  return changed ? { ...next, updatedAt: new Date().toISOString() } : vial;
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

// ---- half-life estimate (estimate only, not medical advice) -------------------

/**
 * Simple first-order decay: amount × 0.5^(elapsed / halfLife). A toy figure
 * for curiosity, shown only behind an opt-in toggle and always labelled
 * "estimate only". It knows nothing about absorption, accumulation or the
 * person, and it is never used to suggest a dose.
 */
export function halfLifeRemaining(amount: number, halfLifeHours: number, elapsedHours: number): number | null {
  if (!ok(amount) || !ok(halfLifeHours) || typeof elapsedHours !== "number" || !Number.isFinite(elapsedHours) || elapsedHours < 0) return null;
  return amount * Math.pow(0.5, elapsedHours / halfLifeHours);
}
