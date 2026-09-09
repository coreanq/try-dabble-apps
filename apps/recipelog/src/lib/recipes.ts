/**
 * recipelog:recipes:v1 = Recipe[]  (photos live beside it, see photo-store.ts)
 *
 * The vault itself: one Recipe per saved dish, the search over it, the
 * servings maths, and the JSON backup shape. Pure functions only — nothing in
 * here touches the DOM, so node --test can exercise every branch.
 */

export const RECIPES_KEY = "recipelog:recipes:v1";
export const BACKUP_APP = "recipelog";
export const BACKUP_VERSION = 1;

export interface Ingredient {
  text: string;
  qty?: number;
  unit?: string;
}

export interface Step {
  text: string;
}

export interface Recipe {
  id: string;
  title: string;
  photoDataUrl?: string;
  prepMin?: number;
  cookMin?: number;
  totalMin?: number;
  servingsBase?: number;
  tags: string[];
  notes?: string;
  ingredients: Ingredient[];
  steps: Step[];
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  text: string;
  checked: boolean;
  fromRecipeId?: string;
}

export interface ShoppingList {
  items: ShoppingItem[];
}

export interface BackupPayload {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  recipes: Recipe[];
  shopping?: ShoppingList;
}

/* ------------------------------------------------------------------ ids */

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ------------------------------------------------------- quantity parse */

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join("");

/**
 * A leading amount: "2", "1.5", "1,5", "1/2", "1 1/2", "1½", "½", or a range
 * "2-3" / "2~3". Everything after it is the ingredient text. Returns the
 * matched span so the caller can splice a scaled number back in place.
 */
const NUM_ALT = `\\d+\\s+\\d+\\/\\d+|\\d+\\s*[${FRACTION_CHARS}]|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?|[${FRACTION_CHARS}]`;
const NUMBER_RE = new RegExp(`^\\s*(${NUM_ALT})(?:\\s*[-–~〜]\\s*(${NUM_ALT}))?`);

export function parseNumber(token: string): number | null {
  const s = token.trim();
  if (!s) return null;
  // mixed: "1 1/2" or "1½" or "1 ½"
  const mixed = s.match(new RegExp(`^(\\d+)\\s*(\\d+\\/\\d+|[${FRACTION_CHARS}])$`));
  if (mixed) {
    const whole = Number(mixed[1]);
    const frac = parseNumber(mixed[2]);
    return frac === null ? null : whole + frac;
  }
  if (s in UNICODE_FRACTIONS) return UNICODE_FRACTIONS[s];
  const slash = s.match(/^(\d+)\/(\d+)$/);
  if (slash) {
    const d = Number(slash[2]);
    return d === 0 ? null : Number(slash[1]) / d;
  }
  const dec = Number(s.replace(",", "."));
  return Number.isFinite(dec) ? dec : null;
}

const KNOWN_UNITS = new Set([
  "g", "kg", "mg", "ml", "l", "dl", "cl", "oz", "lb", "lbs", "cup", "cups", "tbsp", "tsp", "tbs",
  "tablespoon", "tablespoons", "teaspoon", "teaspoons", "pinch", "clove", "cloves", "slice", "slices",
  "can", "cans", "stick", "sticks", "piece", "pieces", "pc", "pcs", "bunch", "sprig", "sprigs",
  "컵", "큰술", "작은술", "개", "장", "줌", "꼬집", "티스푼", "테이블스푼", "모", "봉", "통", "쪽", "대", "줄기", "인분",
  "カップ", "大さじ", "小さじ", "個", "枚", "本", "束", "片", "缶", "袋", "丁", "人分", "合",
  "杯", "大勺", "小勺", "克", "千克", "毫升", "升", "个", "只", "片", "根", "瓣", "把", "块", "包", "罚", "勺",
]);

export interface ParsedQty {
  qty: number;
  /** Second number of a range such as "2-3". */
  qtyTo?: number;
  unit?: string;
  /** Index where the numeric span ends inside the original text. */
  end: number;
}

export function parseLeadingQty(text: string): ParsedQty | null {
  const m = text.match(NUMBER_RE);
  if (!m) return null;
  const qty = parseNumber(m[1]);
  if (qty === null) return null;
  const qtyTo = m[2] ? parseNumber(m[2]) : null;
  const end = m[0].length;
  const rest = text.slice(end);
  const unitMatch = rest.match(/^\s*([A-Za-zµ가-힣぀-ヿ一-鿿]+)\.?(?=\s|$|\d)/);
  let unit: string | undefined;
  if (unitMatch) {
    const raw = unitMatch[1];
    if (KNOWN_UNITS.has(raw.toLowerCase()) || KNOWN_UNITS.has(raw)) unit = raw;
  }
  const out: ParsedQty = { qty, end };
  if (qtyTo !== null && qtyTo !== undefined) out.qtyTo = qtyTo;
  if (unit) out.unit = unit;
  return out;
}

/** Ingredient from one typed line: text always kept; qty/unit when parseable. */
export function parseIngredient(line: string): Ingredient {
  const text = line.trim();
  const parsed = parseLeadingQty(text);
  const ing: Ingredient = { text };
  if (parsed) {
    ing.qty = parsed.qty;
    if (parsed.unit) ing.unit = parsed.unit;
  }
  return ing;
}

export function linesToIngredients(block: string): Ingredient[] {
  return block
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*·]\s*/, "").trim())
    .filter(Boolean)
    .map(parseIngredient);
}

export function linesToSteps(block: string): Step[] {
  return block
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-•*·])\s*/, "").trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

export function ingredientsToLines(list: Ingredient[]): string {
  return list.map((i) => i.text).join("\n");
}

export function stepsToLines(list: Step[]): string {
  return list.map((s) => s.text).join("\n");
}

/* ------------------------------------------------------------ scaling */

const NICE_FRACTIONS: Array<[number, string]> = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.375, "⅜"],
  [0.5, "½"],
  [0.625, "⅝"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
  [0.875, "⅞"],
];

/** 1.5 → "1½", 0.333 → "⅓", 2 → "2", 1.37 → "1.37" */
export function formatQty(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const whole = Math.floor(n);
  const frac = n - whole;
  if (frac < 0.01) return String(whole);
  for (const [v, glyph] of NICE_FRACTIONS) {
    if (Math.abs(frac - v) < 0.011) return whole === 0 ? glyph : `${whole}${glyph}`;
  }
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

/**
 * Multiplies the leading quantity by `factor`, leaving the rest of the line
 * untouched. Lines with no leading number come back exactly as written.
 */
export function scaleIngredientText(text: string, factor: number): string {
  if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 1e-9) return text;
  const parsed = parseLeadingQty(text);
  if (!parsed) return text;
  const lead = text.match(/^\s*/)?.[0] ?? "";
  let num = formatQty(parsed.qty * factor);
  if (parsed.qtyTo !== undefined) num += `-${formatQty(parsed.qtyTo * factor)}`;
  return `${lead}${num}${text.slice(parsed.end)}`;
}

export function scaleFactor(base: number | undefined, servings: number): number {
  const b = base && base > 0 ? base : 1;
  return servings > 0 ? servings / b : 1;
}

/* ------------------------------------------------------------- search */

export function normalizeTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of raw.split(/[,\n、，]/)) {
    const tag = piece.trim().replace(/^#/, "");
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = query.trim().toLowerCase();
  if (!q) return recipes;
  const terms = q.split(/\s+/).filter(Boolean);
  return recipes.filter((r) => {
    const hay = [
      r.title,
      r.tags.join(" "),
      r.notes ?? "",
      r.ingredients.map((i) => i.text).join(" "),
    ]
      .join("\n")
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export function allTags(recipes: Recipe[]): string[] {
  const count = new Map<string, number>();
  for (const r of recipes) for (const t of r.tags) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

export function totalMinutes(r: Pick<Recipe, "prepMin" | "cookMin" | "totalMin">): number | undefined {
  if (r.totalMin && r.totalMin > 0) return r.totalMin;
  const sum = (r.prepMin ?? 0) + (r.cookMin ?? 0);
  return sum > 0 ? sum : undefined;
}

/* ----------------------------------------------------------- normalize */

function optStr(v: unknown, max = 20000): string | undefined {
  return typeof v === "string" && v.trim() ? v.slice(0, max) : undefined;
}

function optMin(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

function isoOr(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : v;
}

export function normalizeRecipe(raw: unknown, now = new Date().toISOString()): Recipe | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = optStr(o.title, 300);
  if (!title) return null;

  let ingredients: Ingredient[] = [];
  if (Array.isArray(o.ingredients)) {
    ingredients = o.ingredients
      .map((i) => {
        if (typeof i === "string") return parseIngredient(i);
        if (i && typeof i === "object" && typeof (i as Ingredient).text === "string") {
          const t = (i as Ingredient).text.trim();
          return t ? parseIngredient(t) : null;
        }
        return null;
      })
      .filter((x): x is Ingredient => x !== null);
  }

  let steps: Step[] = [];
  if (Array.isArray(o.steps)) {
    steps = o.steps
      .map((s) => {
        if (typeof s === "string") return s.trim() ? { text: s.trim() } : null;
        if (s && typeof s === "object" && typeof (s as Step).text === "string") {
          const t = (s as Step).text.trim();
          return t ? { text: t } : null;
        }
        return null;
      })
      .filter((x): x is Step => x !== null);
  }

  const tags = Array.isArray(o.tags)
    ? normalizeTags(o.tags.filter((t): t is string => typeof t === "string").join(","))
    : [];

  const createdAt = isoOr(o.createdAt, now);
  const r: Recipe = {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    title,
    tags,
    ingredients,
    steps,
    createdAt,
    updatedAt: isoOr(o.updatedAt, createdAt),
  };
  const photo = optStr(o.photoDataUrl, 4_000_000);
  if (photo && /^data:image\//.test(photo)) r.photoDataUrl = photo;
  const prep = optMin(o.prepMin);
  const cook = optMin(o.cookMin);
  const total = optMin(o.totalMin);
  const servings = optMin(o.servingsBase);
  const notes = optStr(o.notes);
  const source = optStr(o.sourceUrl, 2000);
  if (prep) r.prepMin = prep;
  if (cook) r.cookMin = cook;
  if (total) r.totalMin = total;
  if (servings) r.servingsBase = servings;
  if (notes) r.notes = notes;
  if (source && /^https?:\/\//i.test(source)) r.sourceUrl = source;
  return r;
}

export function normalizeShopping(raw: unknown): ShoppingList {
  if (!raw || typeof raw !== "object") return { items: [] };
  const items = (raw as ShoppingList).items;
  if (!Array.isArray(items)) return { items: [] };
  return {
    items: items
      .map((i) => {
        if (!i || typeof i !== "object" || typeof (i as ShoppingItem).text !== "string") return null;
        const text = (i as ShoppingItem).text.trim();
        if (!text) return null;
        const item: ShoppingItem = { text: text.slice(0, 500), checked: (i as ShoppingItem).checked === true };
        const from = (i as ShoppingItem).fromRecipeId;
        if (typeof from === "string" && from) item.fromRecipeId = from;
        return item;
      })
      .filter((x): x is ShoppingItem => x !== null),
  };
}

/* --------------------------------------------------------- list edits */

export function upsertRecipe(list: Recipe[], recipe: Recipe): Recipe[] {
  const idx = list.findIndex((r) => r.id === recipe.id);
  if (idx === -1) return [recipe, ...list];
  const next = list.slice();
  next[idx] = recipe;
  return next;
}

export function removeRecipe(list: Recipe[], id: string): Recipe[] {
  return list.filter((r) => r.id !== id);
}

/** Newest first by updatedAt. */
export function sortRecipes(list: Recipe[]): Recipe[] {
  return list.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

/** Import merges by id: same id → the imported copy wins; new ids are added. */
export function mergeRecipes(existing: Recipe[], incoming: Recipe[]): Recipe[] {
  let out = existing;
  for (const r of incoming) out = upsertRecipe(out, r);
  return sortRecipes(out);
}

/* ------------------------------------------------------------- backup */

export function exportPayload(recipes: Recipe[], shopping?: ShoppingList, now = new Date()): BackupPayload {
  const payload: BackupPayload = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    recipes,
  };
  if (shopping && shopping.items.length > 0) payload.shopping = shopping;
  return payload;
}

export function parseImport(rawText: string): { recipes: Recipe[]; shopping: ShoppingList } {
  const data = JSON.parse(rawText);
  let list: unknown[] = [];
  let shopping: ShoppingList = { items: [] };
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === "object" && Array.isArray((data as BackupPayload).recipes)) {
    list = (data as BackupPayload).recipes;
    shopping = normalizeShopping((data as BackupPayload).shopping);
  } else {
    throw new Error("bad shape");
  }
  const recipes = list.map((r) => normalizeRecipe(r)).filter((r): r is Recipe => r !== null);
  if (recipes.length === 0 && list.length > 0) throw new Error("empty after normalize");
  return { recipes, shopping };
}

export function backupFilename(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `recipelog-backup-${y}-${m}-${day}.json`;
}

/* ----------------------------------------------------- localStorage io */

/** Photos are stripped here; photo-store.ts keeps them beside the list. */
export function stripPhotos(list: Recipe[]): Recipe[] {
  return list.map((r) => {
    if (!r.photoDataUrl) return r;
    const { photoDataUrl: _drop, ...rest } = r;
    void _drop;
    return rest;
  });
}

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortRecipes(parsed.map((r) => normalizeRecipe(r)).filter((r): r is Recipe => r !== null));
  } catch {
    return [];
  }
}

export function saveRecipes(list: Recipe[], keepPhotos = false): boolean {
  try {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(keepPhotos ? list : stripPhotos(list)));
    return true;
  } catch {
    return false;
  }
}
