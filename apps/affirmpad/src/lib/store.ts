/**
 * affirmpad:affirmations:v1 — Affirmation[] (text, optional topic, favorite, practiceCount)
 * affirmpad:categories:v1   — Category[]    (name, color, archived)
 *
 * Plain arrays in localStorage. Nothing here touches the network. Every
 * reader goes through normalize* so a damaged row is dropped instead of
 * crashing the pad, and an imported file gets the same treatment.
 */
import type { Lang } from "./i18n.ts";

export const AFFIRMATIONS_KEY = "affirmpad:affirmations:v1";
export const CATEGORIES_KEY = "affirmpad:categories:v1";

export const TEXT_MAX = 280;
export const NAME_MAX = 40;

export interface Affirmation {
  id: string;
  text: string;
  categoryId?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  practiceCount?: number;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  archived?: boolean;
}

/** Dawn palette for topic swatches, assigned round-robin on create. */
export const CATEGORY_COLORS = ["#a78bfa", "#f0a6b8", "#f5c65b", "#7fc8b8", "#8fb4f2", "#e8a07a", "#c9a0e8", "#9bc98a"];

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isoOr(v: unknown, fallback: string): string {
  return typeof v === "string" && v ? v : fallback;
}

export function normalizeAffirmation(raw: unknown): Affirmation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.text !== "string" || !o.text.trim()) return null;
  const epoch = new Date(0).toISOString();
  const createdAt = isoOr(o.createdAt, epoch);
  const a: Affirmation = {
    id: o.id,
    text: o.text.trim().slice(0, TEXT_MAX),
    favorite: o.favorite === true,
    createdAt,
    updatedAt: isoOr(o.updatedAt, createdAt),
  };
  if (typeof o.categoryId === "string" && o.categoryId) a.categoryId = o.categoryId;
  const n = typeof o.practiceCount === "string" ? Number(o.practiceCount) : o.practiceCount;
  if (typeof n === "number" && Number.isFinite(n) && n > 0) a.practiceCount = Math.floor(n);
  return a;
}

export function normalizeCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.name !== "string" || !o.name.trim()) return null;
  const c: Category = {
    id: o.id,
    name: o.name.trim().slice(0, NAME_MAX),
    createdAt: isoOr(o.createdAt, new Date(0).toISOString()),
  };
  if (typeof o.color === "string" && /^#[0-9a-fA-F]{6}$/.test(o.color)) c.color = o.color;
  if (o.archived === true) c.archived = true;
  return c;
}

function dedupe<T extends { id: string }>(raw: unknown, norm: (x: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of raw) {
    const v = norm(item);
    if (v && !seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }
  return out;
}

export function normalizeAffirmations(raw: unknown): Affirmation[] {
  return dedupe(raw, normalizeAffirmation);
}
export function normalizeCategories(raw: unknown): Category[] {
  return dedupe(raw, normalizeCategory);
}

/** Drop topic links that point at a category that no longer exists. */
export function reconcile(affirmations: Affirmation[], categories: Category[]): Affirmation[] {
  const ids = new Set(categories.map((c) => c.id));
  return affirmations.map((a) => (a.categoryId && !ids.has(a.categoryId) ? { ...a, categoryId: undefined } : a));
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full: the session still works, it just will not persist */
  }
}

/** true when the pad has never been written to on this device. */
export function isFirstOpen(): boolean {
  try {
    return localStorage.getItem(AFFIRMATIONS_KEY) === null && localStorage.getItem(CATEGORIES_KEY) === null;
  } catch {
    return false;
  }
}

export function loadAffirmations(): Affirmation[] {
  return normalizeAffirmations(readJson(AFFIRMATIONS_KEY));
}
export function saveAffirmations(list: Affirmation[]): void {
  writeJson(AFFIRMATIONS_KEY, list);
}
export function loadCategories(): Category[] {
  return normalizeCategories(readJson(CATEGORIES_KEY));
}
export function saveCategories(list: Category[]): void {
  writeJson(CATEGORIES_KEY, list);
}
/** Empty arrays, not removed keys, so "Delete all" does not re-seed on reload. */
export function clearStore(): void {
  writeJson(AFFIRMATIONS_KEY, []);
  writeJson(CATEGORIES_KEY, []);
}

export function nextColor(categories: Category[]): string {
  return CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
}

// ---- pure operations (tested without a DOM) ------------------------------

export function toggleFavorite(list: Affirmation[], id: string, now: string = new Date().toISOString()): Affirmation[] {
  return list.map((a) => (a.id === id ? { ...a, favorite: !a.favorite, updatedAt: now } : a));
}

export function upsertAffirmation(
  list: Affirmation[],
  draft: { id?: string | null; text: string; categoryId?: string },
  now: string = new Date().toISOString(),
): { list: Affirmation[]; id: string } {
  const text = draft.text.trim().slice(0, TEXT_MAX);
  const categoryId = draft.categoryId || undefined;
  if (draft.id && list.some((a) => a.id === draft.id)) {
    return { list: list.map((a) => (a.id === draft.id ? { ...a, text, categoryId, updatedAt: now } : a)), id: draft.id };
  }
  const id = newId();
  return { list: [...list, { id, text, categoryId, favorite: false, createdAt: now, updatedAt: now }], id };
}

export function removeAffirmation(list: Affirmation[], id: string): Affirmation[] {
  return list.filter((a) => a.id !== id);
}

export function upsertCategory(
  list: Category[],
  draft: { id?: string | null; name: string },
  now: string = new Date().toISOString(),
): { list: Category[]; id: string } {
  const name = draft.name.trim().slice(0, NAME_MAX);
  if (draft.id && list.some((c) => c.id === draft.id)) {
    return { list: list.map((c) => (c.id === draft.id ? { ...c, name } : c)), id: draft.id };
  }
  const id = newId();
  return { list: [...list, { id, name, color: nextColor(list), createdAt: now }], id };
}

/** Deleting a topic keeps its affirmations and files them under "no topic". */
export function removeCategory(
  categories: Category[],
  affirmations: Affirmation[],
  id: string,
): { categories: Category[]; affirmations: Affirmation[] } {
  return {
    categories: categories.filter((c) => c.id !== id),
    affirmations: affirmations.map((a) => (a.categoryId === id ? { ...a, categoryId: undefined } : a)),
  };
}

export type Filter = "all" | "fav" | { categoryId: string };

export function applyFilter(list: Affirmation[], filter: Filter): Affirmation[] {
  if (filter === "all") return list;
  if (filter === "fav") return list.filter((a) => a.favorite);
  return list.filter((a) => a.categoryId === filter.categoryId);
}

export function bumpPracticeCount(list: Affirmation[], id: string, delta: 1 | -1): Affirmation[] {
  return list.map((a) => {
    if (a.id !== id) return a;
    const next = Math.max(0, (a.practiceCount ?? 0) + delta);
    return { ...a, practiceCount: next > 0 ? next : undefined };
  });
}

// ---- starter content ------------------------------------------------------

const SEEDS: Record<Lang, { categories: string[]; lines: [number, string][] }> = {
  ko: {
    categories: ["평온", "자신감", "감사"],
    lines: [
      [0, "나는 지금 이 순간에 편안히 머문다."],
      [0, "숨을 들이쉬고, 내쉬며, 힘을 뺀다."],
      [1, "나는 오늘 충분히 잘하고 있다."],
      [1, "나는 내 속도로 나아간다."],
      [2, "오늘 하루에도 감사할 것이 있다."],
    ],
  },
  en: {
    categories: ["Calm", "Confidence", "Gratitude"],
    lines: [
      [0, "I am at ease in this moment."],
      [0, "I breathe in, I breathe out, I let go."],
      [1, "I am doing enough today."],
      [1, "I move forward at my own pace."],
      [2, "There is something in today to be thankful for."],
    ],
  },
  ja: {
    categories: ["落ち着き", "自信", "感謝"],
    lines: [
      [0, "私は今この瞬間に安らいでいる。"],
      [0, "息を吸って、吐いて、力を抜く。"],
      [1, "私は今日、十分にやれている。"],
      [1, "私は自分のペースで進む。"],
      [2, "今日にも感謝できることがある。"],
    ],
  },
  zh: {
    categories: ["平静", "自信", "感恩"],
    lines: [
      [0, "此刻的我，安然自在。"],
      [0, "吸气，呼气，放下。"],
      [1, "我今天已经做得足够好。"],
      [1, "我按自己的节奏前进。"],
      [2, "今天也有值得感谢的事。"],
    ],
  },
};

/** A few starter lines in the reader's language so the first open is not a blank page. */
export function seedData(lang: Lang, now: string = new Date().toISOString()): { categories: Category[]; affirmations: Affirmation[] } {
  const seed = SEEDS[lang] ?? SEEDS.en;
  const categories: Category[] = seed.categories.map((name, i) => ({
    id: newId(),
    name,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    createdAt: now,
  }));
  const affirmations: Affirmation[] = seed.lines.map(([ci, text], i) => ({
    id: newId(),
    text,
    categoryId: categories[ci].id,
    favorite: i === 2,
    createdAt: now,
    updatedAt: now,
  }));
  return { categories, affirmations };
}
