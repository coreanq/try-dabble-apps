/**
 * Storelog storage. Everything lives in THIS browser — no account, no server,
 * no sync, no spreadsheet file.
 *
 * WHERE THINGS GO
 *   stores    localStorage  "storelog:stores:v1"   (name, number, notes)
 *   language  localStorage  "storelog:lang"  + the shared td_lang cookie
 *
 * EXPIRY RULE
 *   nothing expires and nothing is capped. There is no 100-record limit and
 *   no paid tier: a store disappears only when the user removes it, or when
 *   the browser's own "clear site data" wipes the origin. Closing the tab,
 *   closing the browser and coming back next month all keep the list intact.
 */

export const STORES_KEY = "storelog:stores:v1";

/** Long enough for "Northgate Hardware & Builders Merchant (rear yard)". */
export const MAX_NAME = 120;
export const MAX_NUMBER = 40;
export const MAX_NOTES = 500;

export interface Store {
  id: string;
  /** Required. The only field the list refuses to be without. */
  name: string;
  /** Optional. A depot's internal store number, or a phone number. */
  number: string;
  /** Optional freeform note. */
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* --------------------------------------------------------------------- crud */

export function newStore(name: string, number: string, notes: string): Store {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim().slice(0, MAX_NAME),
    number: number.trim().slice(0, MAX_NUMBER),
    notes: notes.trim().slice(0, MAX_NOTES),
    createdAt: now,
    updatedAt: now,
  };
}

function normalize(raw: unknown): Store | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim().slice(0, MAX_NAME) : "";
  // A row without a name would render as a blank label, so it is dropped.
  if (!name) return null;
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : Date.now();
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    name,
    number: typeof r.number === "string" ? r.number.trim().slice(0, MAX_NUMBER) : "",
    notes: typeof r.notes === "string" ? r.notes.trim().slice(0, MAX_NOTES) : "",
    createdAt,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : createdAt,
  };
}

export function loadStores(): Store[] {
  try {
    const text = localStorage.getItem(STORES_KEY);
    if (!text) return [];
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((s): s is Store => s !== null);
  } catch {
    return [];
  }
}

export function saveStores(stores: Store[]): void {
  try {
    localStorage.setItem(STORES_KEY, JSON.stringify(stores));
  } catch {
    /* quota or private mode — this session still works in memory */
  }
}

/* ----------------------------------------------------------------- ordering */

/**
 * A–Z by name, in the reader's own alphabet: 가나다 in Korean, あいうえお in
 * Japanese, pinyin in Chinese. `numeric` keeps "Store 2" ahead of "Store 10".
 * There is no sort control anywhere in the UI — this is the only order.
 */
export function sortStores(stores: Store[], locale: string): Store[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return [...stores].sort(
    (a, b) => collator.compare(a.name, b.name) || a.createdAt - b.createdAt,
  );
}

const HANGUL_LEAD = [
  "ㄱ", "ㄱ", "ㄴ", "ㄷ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅂ", "ㅅ",
  "ㅅ", "ㅇ", "ㅈ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/**
 * The aisle marker a store files under. Hangul syllables collapse to their
 * lead consonant (된소리 folded into the plain one, the way a Korean index
 * reads), Latin to an uppercase letter, digits to "#", and anything else —
 * kana, hanzi — indexes under its own first character.
 */
export function indexKey(name: string): string {
  const ch = name.trim()[0];
  if (!ch) return "#";
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0xac00 && code <= 0xd7a3) {
    return HANGUL_LEAD[Math.floor((code - 0xac00) / 588)];
  }
  if (/[0-9]/.test(ch)) return "#";
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
  if (/[\p{L}]/u.test(ch)) return ch;
  return "#";
}

/** Stores in A–Z order, cut into aisle groups by their index letter. */
export function groupStores(
  stores: Store[],
): { key: string; stores: Store[] }[] {
  const out: { key: string; stores: Store[] }[] = [];
  for (const store of stores) {
    const key = indexKey(store.name);
    const last = out[out.length - 1];
    if (last && last.key === key) last.stores.push(store);
    else out.push({ key, stores: [store] });
  }
  return out;
}

/* ------------------------------------------------------------------- search */

/** Digits only, so "0212345678" finds a number saved as "02-1234-5678". */
function digits(value: string): string {
  return value.replace(/\D+/g, "");
}

/** One box searches all three fields — name, number and notes. */
export function matchesQuery(store: Store, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (store.name.toLowerCase().includes(q)) return true;
  if (store.number.toLowerCase().includes(q)) return true;
  if (store.notes.toLowerCase().includes(q)) return true;
  const qd = digits(q);
  return qd.length > 0 && digits(store.number).includes(qd);
}

/** A number worth offering a tel: link for. A depot code like "1023" is not. */
export function isCallable(number: string): boolean {
  return digits(number).length >= 7;
}

export function telHref(number: string): string {
  return `tel:${number.replace(/[^\d+*#]+/g, "")}`;
}
