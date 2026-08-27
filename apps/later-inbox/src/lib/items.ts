/**
 * Item model ported from the pre-Vite public/app.js. The localStorage shape is
 * unchanged so an existing later-inbox:items:v1 payload keeps working.
 */

export const ITEMS_KEY = "later-inbox:items:v1";

export const DAY = 86_400_000;
export const THIRTY_DAYS = 30 * DAY;
/** This week holds at most three. Adding a fourth bumps the oldest back. */
export const WEEK_MAX = 3;

export const STATUSES = ["inbox", "week", "done", "expired"] as const;
export type Status = (typeof STATUSES)[number];

export interface Item {
  id: string;
  url: string;
  title: string;
  why: string;
  createdAt: number;
  touchedAt: number;
  status: Status;
  pinned: boolean;
  /** Bookmark imports land as drafts; a why is required before they count. */
  draft?: boolean;
}

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { items?: unknown })?.items)
        ? (parsed as { items: unknown[] }).items
        : [];
    return list.map(normalizeItem).filter((it) => it.url !== "");
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]): void {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch {
    /* quota or private mode — the in-memory list still works this session */
  }
}

export function normalizeItem(raw: unknown): Item {
  const it = (raw ?? {}) as Record<string, unknown>;
  const createdAt = Number(it.createdAt) || Date.now();
  return {
    id: typeof it.id === "string" && it.id ? it.id : uid(),
    url: String(it.url ?? ""),
    title: String(it.title ?? ""),
    why: String(it.why ?? ""),
    createdAt,
    touchedAt: Number(it.touchedAt) || createdAt,
    status: isStatus(it.status) ? it.status : "inbox",
    pinned: Boolean(it.pinned),
    draft: Boolean(it.draft),
  };
}

/** Accepts both a bare array and the {version, items} export envelope. */
export function parseImport(data: unknown): Item[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { items?: unknown })?.items)
      ? (data as { items: unknown[] }).items
      : null;
  if (!list) throw new Error("unrecognised export");
  return list.map(normalizeItem).filter((it) => it.url !== "");
}

export interface ExpireResult {
  items: Item[];
  expired: number;
}

/**
 * On load, unpinned inbox items older than 30 days become expired. A pin is the
 * only thing that survives the sweep — that is the whole point of pinning.
 */
export function expireOld(items: Item[], now = Date.now()): ExpireResult {
  let expired = 0;
  const next = items.map((it) => {
    if (it.draft) return it;
    if (it.status === "inbox" && !it.pinned && now - it.createdAt > THIRTY_DAYS) {
      expired += 1;
      return { ...it, status: "expired" as Status, touchedAt: now };
    }
    return it;
  });
  return expired ? { items: next, expired } : { items, expired: 0 };
}

export function weekItems(items: Item[]): Item[] {
  return items.filter((it) => !it.draft && it.status === "week");
}

/**
 * Move `target` into this week. If the week is already full, the least recently
 * touched week item drops back to the inbox so the cap of three always holds.
 */
export function keepThisWeek(
  items: Item[],
  target: Item,
  now = Date.now(),
): { items: Item[]; bumped: boolean } {
  if (target.status === "week") return { items, bumped: false };

  const current = weekItems(items);
  let bumpedId: string | null = null;
  if (current.length >= WEEK_MAX) {
    const oldest = [...current].sort((a, b) => a.touchedAt - b.touchedAt)[0];
    bumpedId = oldest?.id ?? null;
  }

  const next = items.map((it) => {
    if (it.id === target.id) {
      return { ...it, status: "week" as Status, draft: false, touchedAt: now };
    }
    if (it.id === bumpedId) {
      return { ...it, status: "inbox" as Status, touchedAt: now };
    }
    return it;
  });
  return { items: next, bumped: bumpedId !== null };
}

export function normalizeUrl(raw: string): string {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href;
  } catch {
    return "";
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function ageDays(createdAt: number, now = Date.now()): number {
  return Math.floor((now - (createdAt || now)) / DAY);
}

/** Days left before the 30-day sweep takes an unpinned inbox item. */
export function daysLeft(createdAt: number, now = Date.now()): number {
  return Math.max(0, 30 - ageDays(createdAt, now));
}

export interface BookmarkLink {
  url: string;
  title: string;
}

/** Netscape bookmarks.html — DOMParser first, regex as the offline fallback. */
export function parseBookmarkHtml(html: string): BookmarkLink[] {
  const out: BookmarkLink[] = [];
  const seen = new Set<string>();

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("a[href]").forEach((a) => {
      const url = normalizeUrl(a.getAttribute("href") ?? "");
      if (!url || seen.has(url)) return;
      seen.add(url);
      out.push({ url, title: (a.textContent ?? "").trim() });
    });
  } catch {
    /* fall through to the regex scan */
  }

  if (!out.length) {
    const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const url = normalizeUrl(m[1]);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, title: m[2].replace(/<[^>]+>/g, "").trim() });
    }
  }

  return out;
}

/** Inbox and this-week read oldest first; done and expired read newest first. */
export function sortForStatus(items: Item[], status: Status, query = ""): Item[] {
  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (it) =>
      !it.draft &&
      it.status === status &&
      (!q ||
        [it.title, it.why, it.url].filter(Boolean).join(" ").toLowerCase().includes(q)),
  );

  return shown.sort((a, b) =>
    status === "inbox" || status === "week"
      ? a.createdAt - b.createdAt
      : b.touchedAt - a.touchedAt,
  );
}
