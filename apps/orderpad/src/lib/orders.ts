/**
 * Orderpad storage. Everything lives in THIS browser — no account, no Meta
 * login, no server, no spreadsheet file at the end of the night.
 *
 * WHERE THINGS GO
 *   orders    localStorage  "orderpad:orders:v1"  (customer, item, option,
 *                                                  address, paid, shipped,
 *                                                  ship-by date)
 *   language  localStorage  "orderpad:lang" + the shared td_lang cookie
 *
 * EXPIRY RULE
 *   nothing expires and nothing is capped. There is no order limit and no paid
 *   tier. A docket disappears only when the seller deletes it, or when the
 *   browser's own "clear site data" wipes the origin. Closing the tab mid-chat,
 *   closing the browser and coming back next week all keep the pad intact.
 */

export const ORDERS_KEY = "orderpad:orders:v1";

/** Long enough for an Instagram handle plus the name they gave in the DM. */
export const MAX_CUSTOMER = 120;
export const MAX_ITEM = 160;
export const MAX_OPTION = 80;
export const MAX_ADDRESS = 500;

export interface Order {
  id: string;
  /** Docket number, printed on the slip. Assigned once, never reused. */
  no: number;
  /** Required. The only field the pad refuses to be without. */
  customer: string;
  /** What they asked for. */
  item: string;
  /** Size, colour, option — whatever the DM haggled over. */
  option: string;
  /** Freeform, because addresses arrive as one blob in a DM. */
  address: string;
  paid: boolean;
  shipped: boolean;
  /** YYYY-MM-DD in the seller's own timezone. Defaults to today. */
  shipBy: string;
  createdAt: number;
  updatedAt: number;
}

export type Filter = "all" | "unpaid" | "today" | "shipped";

export const FILTERS: Filter[] = ["all", "unpaid", "today", "shipped"];

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------------------------------------------- dates */

/** Local YYYY-MM-DD. Never UTC: "ship today" has to mean the seller's today. */
export function isoDay(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function today(): string {
  return isoDay();
}

/** Whole days from today. Negative means the ship-by date is already past. */
export function daysFromToday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const target = new Date(y, m - 1, d).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

export type DueKind = "late" | "today" | "soon" | "later";

/** How loudly the ship-by chip has to shout on a phone screen. */
export function dueKind(order: Order): DueKind {
  if (order.shipped) return "later";
  const delta = daysFromToday(order.shipBy);
  if (delta < 0) return "late";
  if (delta === 0) return "today";
  if (delta <= 2) return "soon";
  return "later";
}

function normalizeDay(raw: unknown): string {
  return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today();
}

/* --------------------------------------------------------------------- crud */

export interface OrderDraft {
  customer: string;
  item: string;
  option: string;
  address: string;
  paid: boolean;
  shipBy: string;
}

/** The next docket number: one past the highest ever written on this pad. */
export function nextNo(orders: Order[]): number {
  return orders.reduce((max, o) => Math.max(max, o.no), 0) + 1;
}

export function newOrder(draft: OrderDraft, no: number): Order {
  const now = Date.now();
  return {
    id: uid(),
    no,
    customer: draft.customer.trim().slice(0, MAX_CUSTOMER),
    item: draft.item.trim().slice(0, MAX_ITEM),
    option: draft.option.trim().slice(0, MAX_OPTION),
    address: draft.address.trim().slice(0, MAX_ADDRESS),
    paid: draft.paid,
    shipped: false,
    shipBy: normalizeDay(draft.shipBy),
    createdAt: now,
    updatedAt: now,
  };
}

function normalize(raw: unknown, fallbackNo: number): Order | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const customer =
    typeof r.customer === "string" ? r.customer.trim().slice(0, MAX_CUSTOMER) : "";
  // A docket with no customer would print as a blank slip, so it is dropped.
  if (!customer) return null;
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : Date.now();
  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    no: typeof r.no === "number" && r.no > 0 ? Math.floor(r.no) : fallbackNo,
    customer,
    item: typeof r.item === "string" ? r.item.trim().slice(0, MAX_ITEM) : "",
    option: typeof r.option === "string" ? r.option.trim().slice(0, MAX_OPTION) : "",
    address: typeof r.address === "string" ? r.address.trim().slice(0, MAX_ADDRESS) : "",
    paid: r.paid === true,
    shipped: r.shipped === true,
    shipBy: normalizeDay(r.shipBy),
    createdAt,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : createdAt,
  };
}

export function loadOrders(): Order[] {
  try {
    const text = localStorage.getItem(ORDERS_KEY);
    if (!text) return [];
    return parseOrders(JSON.parse(text));
  } catch {
    return [];
  }
}

/** Accepts the raw array as stored and the `{ orders: [...] }` export shape,
 *  so a file exported from this app imports back without editing. */
export function parseOrders(parsed: unknown): Order[] {
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { orders?: unknown }).orders)
      ? ((parsed as { orders: unknown[] }).orders as unknown[])
      : null;
  if (!list) return [];
  const out: Order[] = [];
  for (const raw of list) {
    const order = normalize(raw, out.length + 1);
    if (order) out.push(order);
  }
  return out;
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    /* quota or private mode — this session still works in memory */
  }
}

/**
 * Imported dockets that are genuinely new. Same id, or the same customer with
 * the same item on the same ship-by day, counts as one already on the pad.
 */
export function mergeOrders(current: Order[], incoming: Order[]): Order[] {
  const ids = new Set(current.map((o) => o.id));
  const seen = new Set(
    current.map((o) => `${o.customer.toLowerCase()}|${o.item.toLowerCase()}|${o.shipBy}`),
  );
  const merged = [...current];
  let no = nextNo(current);
  for (const order of incoming) {
    const key = `${order.customer.toLowerCase()}|${order.item.toLowerCase()}|${order.shipBy}`;
    if (ids.has(order.id) || seen.has(key)) continue;
    ids.add(order.id);
    seen.add(key);
    merged.push({ ...order, no: no++ });
  }
  return merged;
}

/* ----------------------------------------------------------------- ordering */

/**
 * Open dockets first, most overdue at the top — that is the pile you work
 * through today. Shipped ones sink below, newest first, so the pad reads as a
 * stack of slips rather than a database table. There is no sort control.
 */
export function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    if (a.shipped !== b.shipped) return a.shipped ? 1 : -1;
    if (a.shipBy !== b.shipBy) {
      return a.shipped ? b.shipBy.localeCompare(a.shipBy) : a.shipBy.localeCompare(b.shipBy);
    }
    return b.no - a.no;
  });
}

/* ------------------------------------------------------------------ filters */

/** "Ship today" is everything still unshipped that is due today or already
 *  late — an order you should have posted yesterday belongs in today's pile. */
export function matchesFilter(order: Order, filter: Filter): boolean {
  switch (filter) {
    case "unpaid":
      return !order.paid;
    case "today":
      return !order.shipped && daysFromToday(order.shipBy) <= 0;
    case "shipped":
      return order.shipped;
    default:
      return true;
  }
}

export function countFor(orders: Order[], filter: Filter): number {
  return orders.reduce((n, o) => n + (matchesFilter(o, filter) ? 1 : 0), 0);
}

/* ------------------------------------------------------------------- search */

/** One box over the whole docket — the customer, what they ordered, the
 *  option they picked, the address, and the docket number itself. */
export function matchesQuery(order: Order, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    order.customer.toLowerCase().includes(q) ||
    order.item.toLowerCase().includes(q) ||
    order.option.toLowerCase().includes(q) ||
    order.address.toLowerCase().includes(q) ||
    String(order.no).includes(q)
  );
}

/** Docket number as it is printed on the slip: No. 0007. */
export function docketNo(no: number): string {
  return String(no).padStart(4, "0");
}
