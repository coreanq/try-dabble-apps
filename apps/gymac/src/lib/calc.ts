/**
 * Pure arithmetic for the tracker, with no DOM so the tests cover all of it:
 * Mifflin–St Jeor energy targets, the default macro split, kg/lb, the Epley
 * estimated one-rep max, personal-record detection and daily macro totals.
 */
import type { Activity, Food, MealLog, Profile, Targets, WeighIn, Workout, WorkoutSet } from "./model.ts";

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}
export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Round to a sensible display precision (0.25 kg is a plate-friendly step, but 0.1 keeps typed values). */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Mifflin–St Jeor resting energy in kcal/day, or null when the profile is incomplete. */
export function bmr(p: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg">): number | null {
  if (!p.sex || p.age === undefined || p.heightCm === undefined || p.weightKg === undefined) return null;
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

export function tdee(p: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg" | "activity">): number | null {
  const b = bmr(p);
  if (b === null) return null;
  return Math.round(b * ACTIVITY_FACTORS[p.activity ?? "sedentary"]);
}

/**
 * Default split from the TDEE: protein 2.0 g per kg of body weight, fat 25 % of
 * calories, carbs take the rest (never below zero). The person can overwrite
 * any of the four afterwards; nothing here is a rule.
 */
export function suggestedTargets(p: Profile): Required<Targets> | null {
  const kcal = tdee(p);
  if (kcal === null || p.weightKg === undefined) return null;
  const proteinG = Math.round(2.0 * p.weightKg);
  const fatG = Math.round((kcal * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));
  return { kcal, proteinG, carbsG, fatG };
}

/** kcal implied by a macro split; shown so a hand-edited target stays honest. */
export function kcalFromMacros(t: Targets): number {
  return Math.round((t.proteinG ?? 0) * 4 + (t.carbsG ?? 0) * 4 + (t.fatG ?? 0) * 9);
}

/** Epley estimated one-rep max. A single rep is the weight itself. */
export function epley(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export interface SetRecord {
  weightKg: number;
  reps: number;
  date: string;
  workoutId: string;
}

export interface ExercisePR {
  name: string;
  heaviest: SetRecord;
  best: SetRecord & { e1rm: number };
  sessions: number;
  sets: number;
  lastDate: string;
}

function keyOf(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Scan every set in every workout and keep, per exercise name, the heaviest
 * set and the set with the highest Epley estimate. Sets with zero weight or
 * zero reps are skipped (bodyweight rows still count as history, not as PRs).
 */
export function personalRecords(workouts: Workout[]): ExercisePR[] {
  const map = new Map<string, ExercisePR>();
  for (const w of workouts) {
    for (const item of w.items) {
      const k = keyOf(item.exerciseName);
      if (!k) continue;
      let pr = map.get(k);
      const seenSession = pr?.lastDate === w.date && pr?.heaviest.workoutId === w.id;
      for (const s of item.sets) {
        if (s.weightKg <= 0 || s.reps <= 0) continue;
        const rec: SetRecord = { weightKg: s.weightKg, reps: s.reps, date: w.date, workoutId: w.id };
        const e = epley(s.weightKg, s.reps);
        if (!pr) {
          pr = { name: item.exerciseName, heaviest: rec, best: { ...rec, e1rm: e }, sessions: 0, sets: 0, lastDate: w.date };
          map.set(k, pr);
        }
        pr.sets += 1;
        if (rec.weightKg > pr.heaviest.weightKg || (rec.weightKg === pr.heaviest.weightKg && rec.reps > pr.heaviest.reps)) pr.heaviest = rec;
        if (e > pr.best.e1rm) pr.best = { ...rec, e1rm: e };
        if (w.date > pr.lastDate) pr.lastDate = w.date;
      }
      if (pr && !seenSession) pr.sessions += 1;
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Sessions counted per exercise, oldest → newest date order is not needed; callers sort. */
export interface HistoryRow {
  date: string;
  workoutId: string;
  sets: WorkoutSet[];
  topWeightKg: number;
  volumeKg: number;
}

export function exerciseHistory(workouts: Workout[], name: string): HistoryRow[] {
  const k = keyOf(name);
  const rows: HistoryRow[] = [];
  for (const w of workouts) {
    for (const item of w.items) {
      if (keyOf(item.exerciseName) !== k) continue;
      const sets = item.sets;
      rows.push({
        date: w.date,
        workoutId: w.id,
        sets,
        topWeightKg: sets.reduce((m, s) => Math.max(m, s.weightKg), 0),
        volumeKg: sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
      });
    }
  }
  return rows.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}

/** Set count and total volume of one workout, for the session header. */
export function workoutSummary(w: Workout): { exercises: number; sets: number; volumeKg: number } {
  let sets = 0;
  let volumeKg = 0;
  for (const i of w.items) {
    for (const s of i.sets) {
      sets += 1;
      volumeKg += s.weightKg * s.reps;
    }
  }
  return { exercises: w.items.length, sets, volumeKg };
}

export interface MacroTotals {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function dayTotals(meals: MealLog[], date: string): MacroTotals {
  const t: MacroTotals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  for (const m of meals) {
    if (m.date !== date) continue;
    t.kcal += m.kcal;
    t.proteinG += m.proteinG;
    t.carbsG += m.carbsG;
    t.fatG += m.fatG;
  }
  return { kcal: Math.round(t.kcal), proteinG: round1(t.proteinG), carbsG: round1(t.carbsG), fatG: round1(t.fatG) };
}

/** Per-serving food × servings → the numbers stored on the meal row. */
export function scaleFood(food: Pick<Food, "kcal" | "proteinG" | "carbsG" | "fatG">, servings: number): MacroTotals {
  return {
    kcal: Math.round(food.kcal * servings),
    proteinG: round1(food.proteinG * servings),
    carbsG: round1(food.carbsG * servings),
    fatG: round1(food.fatG * servings),
  };
}

/** 0–100 for the bar, plus whether the target is exceeded. */
export function progressPct(value: number, target: number | undefined): { pct: number; over: boolean } {
  if (!target || target <= 0) return { pct: 0, over: false };
  const ratio = value / target;
  return { pct: Math.max(0, Math.min(100, Math.round(ratio * 100))), over: ratio > 1 };
}

export function remainingOf(value: number, target: number | undefined): number | null {
  if (!target || target <= 0) return null;
  return Math.round((target - value) * 10) / 10;
}

export function sortWeighIns(list: WeighIn[]): WeighIn[] {
  return [...list].sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1));
}

export function latestWeighIn(list: WeighIn[]): WeighIn | null {
  return sortWeighIns(list)[0] ?? null;
}

/** Change against the previous weigh-in, in kg (null for the oldest row). */
export function weighInDeltas(list: WeighIn[]): Map<string, number | null> {
  const sorted = sortWeighIns(list);
  const out = new Map<string, number | null>();
  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i + 1];
    out.set(sorted[i].id, prev ? round1(sorted[i].weightKg - prev.weightKg) : null);
  }
  return out;
}

/** Display helper: trims trailing zeros. */
export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "0";
  const s = n.toFixed(digits);
  return s.replace(/\.?0+$/, "");
}
