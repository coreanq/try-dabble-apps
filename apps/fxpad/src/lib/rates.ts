/**
 * Rates: one Frankfurter snapshot, kept in localStorage so the converter still
 * works in airplane mode. Everything here is pure except load/save/fetch, so
 * the convert math runs under plain node --test without a DOM.
 *
 * Storage: fxpad:rates:v1 = { base, date, rates, fetchedAt }
 *   base      Frankfurter's base ("EUR"); every rate is "1 base = rates[code]"
 *   date      the ECB reference day the rates are for (YYYY-MM-DD)
 *   rates     { USD: 1.16, JPY: 179.8, ... } — never includes the base itself
 *   fetchedAt ISO time this device pulled the snapshot
 */

export const RATES_KEY = "fxpad:rates:v1";
export const RATES_URL = "https://api.frankfurter.app/latest";

export interface RatesSnapshot {
  base: string;
  date: string;
  rates: Record<string, number>;
  fetchedAt: string;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Accepts only a well-formed snapshot; anything else is treated as "no cache". */
export function parseSnapshot(raw: unknown): RatesSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.base !== "string" || !/^[A-Z]{3}$/.test(o.base)) return null;
  if (typeof o.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return null;
  if (typeof o.fetchedAt !== "string" || Number.isNaN(new Date(o.fetchedAt).getTime())) return null;
  if (!o.rates || typeof o.rates !== "object") return null;
  const rates: Record<string, number> = {};
  for (const [code, v] of Object.entries(o.rates as Record<string, unknown>)) {
    if (/^[A-Z]{3}$/.test(code) && isFiniteNumber(v) && v > 0) rates[code] = v;
  }
  if (Object.keys(rates).length === 0) return null;
  return { base: o.base, date: o.date, rates, fetchedAt: o.fetchedAt };
}

/** Turns a Frankfurter /latest body into a snapshot stamped with `now`. */
export function snapshotFromApi(body: unknown, now: Date = new Date()): RatesSnapshot | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  return parseSnapshot({
    base: o.base,
    date: o.date,
    rates: o.rates,
    fetchedAt: now.toISOString(),
  });
}

/** Every code the snapshot can convert between, base included, A→Z. */
export function codesOf(snap: RatesSnapshot | null): string[] {
  if (!snap) return [];
  return Array.from(new Set([snap.base, ...Object.keys(snap.rates)])).sort();
}

/** "1 base = ? code", with the base itself at exactly 1. */
export function perBase(snap: RatesSnapshot, code: string): number | null {
  if (code === snap.base) return 1;
  const r = snap.rates[code];
  return isFiniteNumber(r) && r > 0 ? r : null;
}

/**
 * Cross rate: how many `to` one `from` buys, routed through the base.
 * KRW→JPY with an EUR base is (EUR→JPY) / (EUR→KRW). null when either
 * side is missing from the snapshot.
 */
export function unitRate(snap: RatesSnapshot | null, from: string, to: string): number | null {
  if (!snap) return null;
  const a = perBase(snap, from);
  const b = perBase(snap, to);
  if (a === null || b === null) return null;
  return b / a;
}

export function convert(
  snap: RatesSnapshot | null,
  amount: number,
  from: string,
  to: string,
): number | null {
  if (!Number.isFinite(amount)) return null;
  const rate = unitRate(snap, from, to);
  return rate === null ? null : amount * rate;
}

/**
 * Parses what a traveler types: "1,000", "１０００", "12.5", "3 000". Returns
 * NaN for anything that is not a non-negative number.
 */
export function parseAmount(text: string): number {
  const ascii = String(text)
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[．]/g, ".")
    .replace(/[,\s_']/g, "")
    .trim();
  if (ascii === "" || ascii === ".") return NaN;
  if (!/^\d*\.?\d*$/.test(ascii)) return NaN;
  const n = Number(ascii);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/**
 * Decimal places that make a converted amount readable: yen-sized numbers
 * are whole, small ones keep a couple of digits, tiny unit rates keep more.
 */
export function decimalsFor(value: number): number {
  const v = Math.abs(value);
  if (v === 0) return 0;
  if (v >= 1000) return 0;
  if (v >= 1) return 2;
  if (v >= 0.01) return 4;
  return 6;
}

export function formatNumber(value: number, locale: string, maxDecimals = decimalsFor(value)): string {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    }).format(value);
  } catch {
    return value.toFixed(maxDecimals);
  }
}

/* ---- browser-only below: guarded so node --test can import this module ---- */

export function loadSnapshot(): RatesSnapshot | null {
  try {
    const raw = localStorage.getItem(RATES_KEY);
    return raw ? parseSnapshot(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(snap: RatesSnapshot): void {
  try {
    localStorage.setItem(RATES_KEY, JSON.stringify(snap));
  } catch {
    /* private mode or full storage: the in-memory copy still works this session */
  }
}

export function clearSnapshot(): void {
  try {
    localStorage.removeItem(RATES_KEY);
  } catch {
    /* nothing to clear */
  }
}

export class RatesFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RatesFetchError";
  }
}

/** Pulls /latest. Throws RatesFetchError on any network or shape problem. */
export async function fetchSnapshot(signal?: AbortSignal): Promise<RatesSnapshot> {
  let res: Response;
  try {
    res = await fetch(RATES_URL, { signal, cache: "no-store" });
  } catch (e) {
    throw new RatesFetchError(e instanceof Error ? e.message : "network");
  }
  if (!res.ok) throw new RatesFetchError(`http ${res.status}`);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new RatesFetchError("bad json");
  }
  const snap = snapshotFromApi(body);
  if (!snap) throw new RatesFetchError("bad shape");
  return snap;
}
