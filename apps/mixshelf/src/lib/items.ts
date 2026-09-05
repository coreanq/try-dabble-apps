/** Mixshelf library items — books, games, movies, TV on one shelf. */

export type MediaType = "book" | "game" | "movie" | "tv";

export type ItemStatus =
  | "unread"
  | "reading"
  | "read"
  | "playing"
  | "finished"
  | "wishlist"
  | "";

export type ShelfItem = {
  id: string;
  title: string;
  type: MediaType;
  tags: string[];
  notes: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
};

export const ITEMS_KEY = "mixshelf:items";
export const MEDIA_TYPES: MediaType[] = ["book", "game", "movie", "tv"];

export function loadItems(): ShelfItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeItem)
      .filter((x): x is ShelfItem => x !== null);
  } catch {
    return [];
  }
}

export function saveItems(items: ShelfItem[]): void {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

function normalizeItem(raw: unknown): ShelfItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title) return null;
  const type = MEDIA_TYPES.includes(o.type as MediaType)
    ? (o.type as MediaType)
    : "book";
  const tags = Array.isArray(o.tags)
    ? o.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const notes = typeof o.notes === "string" ? o.notes : "";
  const status = (typeof o.status === "string" ? o.status : "") as ItemStatus;
  const now = new Date().toISOString();
  return {
    id: typeof o.id === "string" && o.id ? o.id : crypto.randomUUID(),
    title,
    type,
    tags: uniqueTags(tags),
    notes,
    status,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : now,
  };
}

export function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export function newItem(partial: {
  title: string;
  type: MediaType;
  tags?: string[];
  notes?: string;
  status?: ItemStatus;
}): ShelfItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: partial.title.trim(),
    type: partial.type,
    tags: uniqueTags(partial.tags ?? []),
    notes: partial.notes?.trim() ?? "",
    status: partial.status ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertItem(items: ShelfItem[], item: ShelfItem): ShelfItem[] {
  const i = items.findIndex((x) => x.id === item.id);
  if (i < 0) return [item, ...items];
  const next = items.slice();
  next[i] = { ...item, updatedAt: new Date().toISOString() };
  return next;
}

export function removeItem(items: ShelfItem[], id: string): ShelfItem[] {
  return items.filter((x) => x.id !== id);
}

export function allTags(items: ShelfItem[]): string[] {
  const map = new Map<string, string>();
  for (const it of items) {
    for (const t of it.tags) {
      const k = t.toLowerCase();
      if (!map.has(k)) map.set(k, t);
    }
  }
  return [...map.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

/** AND filters: must match every selected type? No — type multi-select is OR
 *  within types, AND with tag multi-select (OR within tags), AND with search. */
export function filterItems(
  items: ShelfItem[],
  opts: {
    types: MediaType[];
    tags: string[];
    query: string;
  },
): ShelfItem[] {
  const q = opts.query.trim().toLowerCase();
  const typeSet = new Set(opts.types);
  const tagSet = new Set(opts.tags.map((t) => t.toLowerCase()));
  return items.filter((it) => {
    if (typeSet.size > 0 && !typeSet.has(it.type)) return false;
    if (tagSet.size > 0) {
      const itemTags = new Set(it.tags.map((t) => t.toLowerCase()));
      for (const t of tagSet) {
        if (!itemTags.has(t)) return false;
      }
    }
    if (q && !it.title.toLowerCase().includes(q)) return false;
    return true;
  });
}

export type BackupPayload = {
  app: "mixshelf";
  version: 1;
  exportedAt: string;
  items: ShelfItem[];
};

export function exportPayload(items: ShelfItem[]): BackupPayload {
  return {
    app: "mixshelf",
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
  };
}

export function parseImport(raw: string): ShelfItem[] {
  const data = JSON.parse(raw);
  let list: unknown[] = [];
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === "object" && Array.isArray(data.items)) {
    list = data.items;
  } else {
    throw new Error("bad shape");
  }
  const items = list
    .map(normalizeItem)
    .filter((x): x is ShelfItem => x !== null);
  if (items.length === 0 && list.length > 0) throw new Error("empty after normalize");
  return items;
}

export function backupFilename(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `mixshelf-backup-${y}-${m}-${day}.json`;
}
