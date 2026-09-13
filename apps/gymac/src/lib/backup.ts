/**
 * The answer to "I reinstalled and every workout was gone": one JSON file with
 * the profile, weigh-ins, exercise catalog, workouts, foods, meals, routines
 * and preferences, restorable on any device. No DOM here so tests cover the
 * round trip.
 */
import {
  countRows,
  normalizeExercises,
  normalizeFoods,
  normalizeMeals,
  normalizeProfile,
  normalizeRoutines,
  normalizeWeighIns,
  normalizeWorkouts,
  reconcile,
  type Store,
} from "./model.ts";
import { parsePrefs, type Prefs } from "./prefs.ts";

export interface Backup extends Store {
  app: "gymac";
  version: 1;
  exportedAt: string;
  prefs: Prefs;
}

export function buildBackup(store: Store, prefs: Prefs, now: Date = new Date()): Backup {
  return {
    app: "gymac",
    version: 1,
    exportedAt: now.toISOString(),
    profile: store.profile,
    weighins: store.weighins,
    exercises: store.exercises,
    workouts: store.workouts,
    foods: store.foods,
    meals: store.meals,
    routines: store.routines,
    prefs,
  };
}

export function toJSON(backup: Backup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export interface ParsedBackup {
  store: Store;
  prefs: Prefs | null;
}

const LISTS = ["weighins", "exercises", "workouts", "foods", "meals", "routines"] as const;

/**
 * Accepts the gymac backup shape. Damaged rows are dropped; a file with
 * nothing usable at all is rejected so a wrong file never wipes the tracker.
 */
export function parseBackup(raw: string): ParsedBackup {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("bad shape");
  const o = data as Record<string, unknown>;
  if (o.app !== undefined && o.app !== "gymac") throw new Error("not a gymac backup");
  const any = LISTS.some((k) => Array.isArray(o[k])) || (o.profile !== undefined && typeof o.profile === "object");
  if (!any) throw new Error("bad shape");
  const store = reconcile({
    profile: normalizeProfile(o.profile),
    weighins: normalizeWeighIns(o.weighins),
    exercises: normalizeExercises(o.exercises),
    workouts: normalizeWorkouts(o.workouts),
    foods: normalizeFoods(o.foods),
    meals: normalizeMeals(o.meals),
    routines: normalizeRoutines(o.routines),
  });
  if (countRows(store) === 0) throw new Error("empty");
  const prefs = o.prefs && typeof o.prefs === "object" ? parsePrefs(o.prefs) : null;
  return { store, prefs };
}

export function backupFilename(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `gymac-backup-${y}-${m}-${day}.json`;
}

export function download(text: string, name: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
