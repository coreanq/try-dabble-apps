/**
 * Everything the tracker stores, one localStorage key per entity, all under
 * the gymac: prefix. Every list is unlimited and free: there is no routine
 * cap, no history window and no premium tier anywhere in this file.
 *
 *   gymac:profile:v1    Profile
 *   gymac:weighins:v1   WeighIn[]
 *   gymac:exercises:v1  ExerciseDef[]   (the person's own catalog)
 *   gymac:workouts:v1   Workout[]       (sessions with exercises and set rows)
 *   gymac:foods:v1      Food[]          (custom foods, no paid database)
 *   gymac:meals:v1      MealLog[]       (servings logged to a day)
 *   gymac:routines:v1   Routine[]       (named exercise lists, unlimited)
 *
 * Weights are always stored in kilograms; the kg / lb preference only changes
 * what the inputs show. Normalizers drop damaged rows instead of throwing so a
 * half-broken backup still restores what it can.
 */
import { DATE_RE } from "./dates.ts";

export const PROFILE_KEY = "gymac:profile:v1";
export const WEIGHINS_KEY = "gymac:weighins:v1";
export const EXERCISES_KEY = "gymac:exercises:v1";
export const WORKOUTS_KEY = "gymac:workouts:v1";
export const FOODS_KEY = "gymac:foods:v1";
export const MEALS_KEY = "gymac:meals:v1";
export const ROUTINES_KEY = "gymac:routines:v1";

export const NAME_MAX = 60;
export const NOTES_MAX = 400;

export const SEXES = ["male", "female"] as const;
export type Sex = (typeof SEXES)[number];

export const ACTIVITIES = ["sedentary", "light", "moderate", "active", "very"] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const WEIGHT_UNITS = ["kg", "lb"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export interface Targets {
  kcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export interface Profile {
  sex?: Sex;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activity?: Activity;
  unitWeight?: WeightUnit;
  targets?: Targets;
  updatedAt?: string;
}

export interface WeighIn {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
  createdAt: string;
}

export interface ExerciseDef {
  id: string;
  name: string;
  muscle?: string;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  weightKg: number;
  reps: number;
  done?: boolean;
}

export interface WorkoutItem {
  id: string;
  exerciseId?: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  name?: string;
  notes?: string;
  items: WorkoutItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Food {
  id: string;
  name: string;
  servingLabel?: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  foodId?: string;
  foodName: string;
  servings: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
}

export interface Routine {
  id: string;
  name: string;
  exerciseNames: string[];
  createdAt: string;
}

export interface Store {
  profile: Profile;
  weighins: WeighIn[];
  exercises: ExerciseDef[];
  workouts: Workout[];
  foods: Food[];
  meals: MealLog[];
  routines: Routine[];
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Finite number or undefined; strings are accepted so old backups and inputs both work. */
export function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

function iso(v: unknown, fallback: string): string {
  if (typeof v === "string" && !Number.isNaN(new Date(v).getTime())) return v;
  return fallback;
}

function nonNeg(v: unknown): number | undefined {
  const n = num(v);
  return n === undefined || n < 0 ? undefined : n;
}

export function isSex(v: unknown): v is Sex {
  return v === "male" || v === "female";
}
export function isActivity(v: unknown): v is Activity {
  return typeof v === "string" && (ACTIVITIES as readonly string[]).includes(v);
}
export function isWeightUnit(v: unknown): v is WeightUnit {
  return v === "kg" || v === "lb";
}

export function normalizeTargets(raw: unknown): Targets | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const t: Targets = {};
  const kcal = nonNeg(o.kcal);
  const p = nonNeg(o.proteinG);
  const c = nonNeg(o.carbsG);
  const f = nonNeg(o.fatG);
  if (kcal !== undefined) t.kcal = Math.round(kcal);
  if (p !== undefined) t.proteinG = Math.round(p);
  if (c !== undefined) t.carbsG = Math.round(c);
  if (f !== undefined) t.fatG = Math.round(f);
  return Object.keys(t).length ? t : undefined;
}

export function normalizeProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const p: Profile = {};
  if (isSex(o.sex)) p.sex = o.sex;
  const age = num(o.age);
  if (age !== undefined && age >= 5 && age <= 120) p.age = Math.round(age);
  const h = num(o.heightCm);
  if (h !== undefined && h >= 50 && h <= 272) p.heightCm = h;
  const w = num(o.weightKg);
  if (w !== undefined && w > 0 && w <= 500) p.weightKg = w;
  if (isActivity(o.activity)) p.activity = o.activity;
  if (isWeightUnit(o.unitWeight)) p.unitWeight = o.unitWeight;
  const t = normalizeTargets(o.targets);
  if (t) p.targets = t;
  if (typeof o.updatedAt === "string") p.updatedAt = o.updatedAt;
  return p;
}

export function normalizeWeighIn(raw: unknown): WeighIn | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id ? o.id : newId();
  if (typeof o.date !== "string" || !DATE_RE.test(o.date)) return null;
  const w = num(o.weightKg);
  if (w === undefined || w <= 0 || w > 500) return null;
  const row: WeighIn = { id, date: o.date, weightKg: w, createdAt: iso(o.createdAt, new Date().toISOString()) };
  const note = str(o.note, NOTES_MAX);
  if (note) row.note = note;
  return row;
}

export function normalizeExercise(raw: unknown): ExerciseDef | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = str(o.name, NAME_MAX);
  if (!name) return null;
  const row: ExerciseDef = {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    name,
    createdAt: iso(o.createdAt, new Date().toISOString()),
  };
  const muscle = str(o.muscle, NAME_MAX);
  if (muscle) row.muscle = muscle;
  return row;
}

export function normalizeSet(raw: unknown): WorkoutSet | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const w = nonNeg(o.weightKg);
  const r = nonNeg(o.reps);
  if (w === undefined || r === undefined) return null;
  const set: WorkoutSet = { id: typeof o.id === "string" && o.id ? o.id : newId(), weightKg: w, reps: Math.round(r) };
  if (o.done === true) set.done = true;
  return set;
}

export function normalizeItem(raw: unknown): WorkoutItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = str(o.exerciseName, NAME_MAX);
  if (!name) return null;
  const item: WorkoutItem = {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    exerciseName: name,
    sets: Array.isArray(o.sets) ? o.sets.map(normalizeSet).filter((s): s is WorkoutSet => s !== null) : [],
  };
  if (typeof o.exerciseId === "string" && o.exerciseId) item.exerciseId = o.exerciseId;
  return item;
}

export function normalizeWorkout(raw: unknown): Workout | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.date !== "string" || !DATE_RE.test(o.date)) return null;
  const now = new Date().toISOString();
  const w: Workout = {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    date: o.date,
    items: Array.isArray(o.items) ? o.items.map(normalizeItem).filter((i): i is WorkoutItem => i !== null) : [],
    createdAt: iso(o.createdAt, now),
    updatedAt: iso(o.updatedAt, iso(o.createdAt, now)),
  };
  const name = str(o.name, NAME_MAX);
  if (name) w.name = name;
  const notes = str(o.notes, NOTES_MAX);
  if (notes) w.notes = notes;
  return w;
}

export function normalizeFood(raw: unknown): Food | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = str(o.name, NAME_MAX);
  if (!name) return null;
  const kcal = nonNeg(o.kcal);
  if (kcal === undefined) return null;
  const food: Food = {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    name,
    kcal,
    proteinG: nonNeg(o.proteinG) ?? 0,
    carbsG: nonNeg(o.carbsG) ?? 0,
    fatG: nonNeg(o.fatG) ?? 0,
    createdAt: iso(o.createdAt, new Date().toISOString()),
  };
  const label = str(o.servingLabel, NAME_MAX);
  if (label) food.servingLabel = label;
  return food;
}

export function normalizeMeal(raw: unknown): MealLog | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.date !== "string" || !DATE_RE.test(o.date)) return null;
  const name = str(o.foodName, NAME_MAX);
  if (!name) return null;
  const servings = num(o.servings);
  if (servings === undefined || servings <= 0) return null;
  const kcal = nonNeg(o.kcal);
  if (kcal === undefined) return null;
  const m: MealLog = {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    date: o.date,
    foodName: name,
    servings,
    kcal,
    proteinG: nonNeg(o.proteinG) ?? 0,
    carbsG: nonNeg(o.carbsG) ?? 0,
    fatG: nonNeg(o.fatG) ?? 0,
    createdAt: iso(o.createdAt, new Date().toISOString()),
  };
  if (typeof o.foodId === "string" && o.foodId) m.foodId = o.foodId;
  return m;
}

export function normalizeRoutine(raw: unknown): Routine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = str(o.name, NAME_MAX);
  if (!name) return null;
  const names = Array.isArray(o.exerciseNames)
    ? o.exerciseNames.map((n) => str(n, NAME_MAX)).filter((n): n is string => n !== undefined)
    : [];
  return { id: typeof o.id === "string" && o.id ? o.id : newId(), name, exerciseNames: names, createdAt: iso(o.createdAt, new Date().toISOString()) };
}

function normalizeList<T>(raw: unknown, one: (r: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of raw) {
    const row = one(r) as (T & { id: string }) | null;
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export function byDateDesc<T extends { date: string; createdAt: string }>(a: T, b: T): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}
export function byCreatedDesc<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}
export function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name);
}

export const normalizeWeighIns = (raw: unknown): WeighIn[] => normalizeList(raw, normalizeWeighIn).sort(byDateDesc);
export const normalizeExercises = (raw: unknown): ExerciseDef[] => normalizeList(raw, normalizeExercise).sort(byName);
export const normalizeWorkouts = (raw: unknown): Workout[] => normalizeList(raw, normalizeWorkout).sort(byDateDesc);
export const normalizeFoods = (raw: unknown): Food[] => normalizeList(raw, normalizeFood).sort(byName);
export const normalizeMeals = (raw: unknown): MealLog[] => normalizeList(raw, normalizeMeal).sort(byDateDesc);
export const normalizeRoutines = (raw: unknown): Routine[] => normalizeList(raw, normalizeRoutine).sort(byCreatedDesc);

export function emptyStore(): Store {
  return { profile: {}, weighins: [], exercises: [], workouts: [], foods: [], meals: [], routines: [] };
}

/** Re-sorts every list and drops dangling ids; cheap enough to run on every commit. */
export function reconcile(store: Store): Store {
  const exerciseIds = new Set(store.exercises.map((e) => e.id));
  const foodIds = new Set(store.foods.map((f) => f.id));
  return {
    profile: normalizeProfile(store.profile),
    weighins: [...store.weighins].sort(byDateDesc),
    exercises: [...store.exercises].sort(byName),
    workouts: [...store.workouts]
      .map((w) => ({
        ...w,
        items: w.items.map((i) => (i.exerciseId && !exerciseIds.has(i.exerciseId) ? { ...i, exerciseId: undefined } : i)),
      }))
      .sort(byDateDesc),
    foods: [...store.foods].sort(byName),
    meals: [...store.meals].map((m) => (m.foodId && !foodIds.has(m.foodId) ? { ...m, foodId: undefined } : m)).sort(byDateDesc),
    routines: [...store.routines].sort(byCreatedDesc),
  };
}

export function countRows(store: Store): number {
  return (
    store.weighins.length +
    store.exercises.length +
    store.workouts.length +
    store.foods.length +
    store.meals.length +
    store.routines.length +
    (Object.keys(store.profile).length ? 1 : 0)
  );
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota: the session keeps working in memory */
  }
}

export function loadStore(): Store {
  return reconcile({
    profile: normalizeProfile(read(PROFILE_KEY)),
    weighins: normalizeWeighIns(read(WEIGHINS_KEY)),
    exercises: normalizeExercises(read(EXERCISES_KEY)),
    workouts: normalizeWorkouts(read(WORKOUTS_KEY)),
    foods: normalizeFoods(read(FOODS_KEY)),
    meals: normalizeMeals(read(MEALS_KEY)),
    routines: normalizeRoutines(read(ROUTINES_KEY)),
  });
}

export function saveStore(store: Store): void {
  write(PROFILE_KEY, store.profile);
  write(WEIGHINS_KEY, store.weighins);
  write(EXERCISES_KEY, store.exercises);
  write(WORKOUTS_KEY, store.workouts);
  write(FOODS_KEY, store.foods);
  write(MEALS_KEY, store.meals);
  write(ROUTINES_KEY, store.routines);
}

export function clearStore(): void {
  for (const k of [PROFILE_KEY, WEIGHINS_KEY, EXERCISES_KEY, WORKOUTS_KEY, FOODS_KEY, MEALS_KEY, ROUTINES_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

/** Replace one row in place, or prepend when the id is new. */
export function putRow<T extends { id: string }>(list: T[], row: T): T[] {
  return list.some((x) => x.id === row.id) ? list.map((x) => (x.id === row.id ? row : x)) : [row, ...list];
}

/** Adds the exercise name to the catalog when it is not there yet (case-insensitive). */
export function ensureExercise(exercises: ExerciseDef[], name: string, now: Date = new Date()): { list: ExerciseDef[]; def: ExerciseDef } {
  const clean = name.trim().slice(0, NAME_MAX);
  const found = exercises.find((e) => e.name.toLowerCase() === clean.toLowerCase());
  if (found) return { list: exercises, def: found };
  const def: ExerciseDef = { id: newId(), name: clean, createdAt: now.toISOString() };
  return { list: [...exercises, def].sort(byName), def };
}

export function newWorkout(date: string, name?: string, now: Date = new Date()): Workout {
  const isoNow = now.toISOString();
  const w: Workout = { id: newId(), date, items: [], createdAt: isoNow, updatedAt: isoNow };
  if (name) w.name = name;
  return w;
}

export function newItem(def: ExerciseDef): WorkoutItem {
  return { id: newId(), exerciseId: def.id, exerciseName: def.name, sets: [] };
}

export function newSet(weightKg = 0, reps = 0): WorkoutSet {
  return { id: newId(), weightKg, reps };
}

/** Touch updatedAt when a workout changes. */
export function touch(w: Workout, now: Date = new Date()): Workout {
  return { ...w, updatedAt: now.toISOString() };
}
