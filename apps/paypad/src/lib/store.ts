/**
 * Local store: plans, earnings, envelopes, prefs. Everything lives in this
 * browser. Keys are namespaced so another try-dabble app cannot collide.
 * The JSON backup is the only way off the device, and import is forgiving:
 * a paycheck-planner style export with `incomes` / `buckets`, or a bare
 * `{ envelopes: [...] }`, is mapped when the fields are obvious, and unknown
 * keys are ignored rather than fatal. There is no envelope cap anywhere.
 */
import {
  isCategory,
  isIncomeMode,
  isKind,
  isView,
  newId,
  type Earning,
  type Envelope,
  type EnvelopeCategory,
  type EnvelopeKind,
  type IncomeMode,
  type Plan,
  type View,
} from "./budget.ts";
import { clampAmount, clampPercent, coerceDateKey, normalizeCurrency, toDateKey } from "./money.ts";

export const PLANS_KEY = "paypad:plans:v1";
export const EARNINGS_KEY = "paypad:earnings:v1";
export const ENVELOPES_KEY = "paypad:envelopes:v1";
export const PREFS_KEY = "paypad:prefs:v1";

export interface Prefs {
  activePlanId?: string;
  view: View;
}

export function defaultPrefs(): Prefs {
  return { view: "monthly" };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const out: Prefs = { view: isView(o.view) ? o.view : base.view };
  if (typeof o.activePlanId === "string" && o.activePlanId) out.activePlanId = o.activePlanId.slice(0, 60);
  return out;
}

function read<T>(key: string, parse: (raw: unknown) => T, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : fallback();
  } catch {
    return fallback();
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function pick(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}

function optString(v: unknown, max = 400): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().slice(0, max);
  return s || undefined;
}

export function coerceIncomeMode(v: unknown, fallback: IncomeMode = "monthly"): IncomeMode {
  if (isIncomeMode(v)) return v;
  if (typeof v !== "string") return fallback;
  const s = v.trim().toLowerCase();
  if (/^(bi-?weekly|fortnight|2w|every ?two|격주|隔週|双周|两周)/.test(s)) return "biweekly";
  if (/^(irregular|variable|freelance|gig|비정기|不定期|不规律|不定)/.test(s)) return "irregular";
  if (/^(month|monthly|1m|월|月|매월|每月)/.test(s)) return "monthly";
  return fallback;
}

export function coerceKind(o: Record<string, unknown>): EnvelopeKind {
  const k = pick(o, ["kind", "type", "mode"]);
  if (isKind(k)) return k;
  if (typeof k === "string") {
    const s = k.toLowerCase();
    if (/^(%|pct|percent|percentage|ratio|비율|割合|百分比)/.test(s)) return "percent";
    if (/^(fixed|amount|flat|absolute|고정|定額|固定)/.test(s)) return "fixed";
  }
  if (typeof o.percent === "number" || typeof o.percentage === "number" || typeof o.ratio === "number") return "percent";
  return "fixed";
}

function isKindWord(v: unknown): boolean {
  return typeof v === "string" && /^(%|pct|percent|percentage|ratio|fixed|amount|flat|absolute|비율|고정|割合|定額|百分比|固定)/i.test(v.trim());
}

export function coerceCategory(v: unknown, fallback: EnvelopeCategory = "flexible"): EnvelopeCategory {
  if (isCategory(v)) return v;
  if (typeof v !== "string") return fallback;
  const s = v.trim().toLowerCase();
  if (/sav|emergency|저축|貯金|貯蓄|储蓄|存/.test(s)) return "savings";
  if (/debt|loan|credit|부채|대출|借金|返済|债|贷/.test(s)) return "debt";
  if (/bill|rent|utilit|fixed|고정비|공과금|월세|家賃|光熱|固定費|账单|房租/.test(s)) return "bills";
  if (/sink|goal|fund|annual|적립|목표|積立|目標|沉没|目标|专项/.test(s)) return "sinking";
  return fallback;
}

export function normalizePlan(raw: unknown, now = new Date()): Plan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = optString(pick(o, ["name", "title", "label"]), 80);
  if (!name) return null;
  const iso = now.toISOString();
  return {
    id: optString(o.id, 60) ?? newId("p"),
    name,
    incomeMode: coerceIncomeMode(pick(o, ["incomeMode", "mode", "frequency", "payFrequency", "cycle"])),
    currency: normalizeCurrency(pick(o, ["currency", "cur", "currencyCode"]), "USD"),
    createdAt: optString(o.createdAt, 40) ?? iso,
    updatedAt: optString(o.updatedAt, 40) ?? iso,
  };
}

export function normalizeEarning(raw: unknown, fallbackPlanId: string | undefined, now = new Date()): Earning | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const planId = optString(pick(o, ["planId", "plan", "plan_id"]), 60) ?? fallbackPlanId;
  if (!planId) return null;
  const amountRaw = pick(o, ["amount", "takeHome", "take_home", "net", "value", "income", "total"]);
  if (amountRaw === undefined) return null;
  const e: Earning = {
    id: optString(o.id, 60) ?? newId("i"),
    planId,
    amount: clampAmount(amountRaw),
    date: coerceDateKey(pick(o, ["date", "paidAt", "paid_at", "receivedAt", "received_at", "day", "on"]), toDateKey(now)),
    createdAt: optString(o.createdAt, 40) ?? now.toISOString(),
  };
  const label = optString(pick(o, ["label", "name", "title", "source", "memo", "note"]), 120);
  if (label) e.label = label;
  const cur = pick(o, ["currency", "cur", "currencyCode"]);
  if (typeof cur === "string" && cur.trim()) e.currency = normalizeCurrency(cur);
  return e;
}

export function normalizeEnvelope(raw: unknown, fallbackPlanId: string | undefined, index = 0, now = new Date()): Envelope | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const planId = optString(pick(o, ["planId", "plan", "plan_id"]), 60) ?? fallbackPlanId;
  const name = optString(pick(o, ["name", "title", "label"]), 80);
  if (!planId || !name) return null;
  const kind = coerceKind(o);
  const valueRaw = pick(o, ["value", kind === "percent" ? "percent" : "amount", "percentage", "ratio", "amount", "fixed", "target"]);
  const value = kind === "percent" ? clampPercent(valueRaw) : clampAmount(valueRaw);
  const sortRaw = pick(o, ["sortOrder", "order", "position"]);
  return {
    id: optString(o.id, 60) ?? newId("e"),
    planId,
    name,
    kind,
    value,
    category: coerceCategory(pick(o, ["category", "group", "bucket"]) ?? (isKindWord(o.type) ? undefined : o.type)),
    sortOrder: typeof sortRaw === "number" && Number.isFinite(sortRaw) ? sortRaw : index,
    createdAt: optString(o.createdAt, 40) ?? now.toISOString(),
  };
}

export function parsePlans(raw: unknown): Plan[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Plan[] = [];
  for (const r of raw) {
    const p = normalizePlan(r);
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export function parseEarnings(raw: unknown, planIds?: Set<string>, fallbackPlanId?: string): Earning[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Earning[] = [];
  for (const r of raw) {
    const e = normalizeEarning(r, fallbackPlanId);
    if (!e || seen.has(e.id)) continue;
    if (planIds && !planIds.has(e.planId)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

export function parseEnvelopes(raw: unknown, planIds?: Set<string>, fallbackPlanId?: string): Envelope[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Envelope[] = [];
  raw.forEach((r, i) => {
    const e = normalizeEnvelope(r, fallbackPlanId, i);
    if (!e || seen.has(e.id)) return;
    if (planIds && !planIds.has(e.planId)) return;
    seen.add(e.id);
    out.push(e);
  });
  return out;
}

export function loadPlans(): Plan[] {
  return read(PLANS_KEY, parsePlans, () => []);
}
export function savePlans(p: Plan[]): void {
  write(PLANS_KEY, p);
}
export function loadEarnings(): Earning[] {
  return read(EARNINGS_KEY, (r) => parseEarnings(r), () => []);
}
export function saveEarnings(e: Earning[]): void {
  write(EARNINGS_KEY, e);
}
export function loadEnvelopes(): Envelope[] {
  return read(ENVELOPES_KEY, (r) => parseEnvelopes(r), () => []);
}
export function saveEnvelopes(e: Envelope[]): void {
  write(ENVELOPES_KEY, e);
}
export function loadPrefs(): Prefs {
  return read(PREFS_KEY, parsePrefs, defaultPrefs);
}
export function savePrefs(p: Prefs): void {
  write(PREFS_KEY, p);
}

export function clearAll(): void {
  for (const k of [PLANS_KEY, EARNINGS_KEY, ENVELOPES_KEY, PREFS_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- backup ---------- */

export const BACKUP_APP = "paypad";
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  plans: Plan[];
  earnings: Earning[];
  envelopes: Envelope[];
  prefs: Prefs;
}

export function buildBackup(plans: Plan[], earnings: Earning[], envelopes: Envelope[], prefs: Prefs, now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), plans, earnings, envelopes, prefs };
}

/**
 * Accepts: our backup; `{ plans, earnings, envelopes }`; a paycheck-planner
 * style `{ incomes|paychecks, buckets|categories }` with no plan list (one
 * plan is created to hold them); a bare envelope array; or `{ data: {...} }`
 * wrappers. Returns null only when nothing usable exists.
 */
export function parseBackup(raw: unknown, fallbackPlanName = "Imported plan"): Backup | null {
  if (!raw || typeof raw !== "object") return null;
  let o = raw as Record<string, unknown>;
  if (Array.isArray(raw)) o = { envelopes: raw };
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data) && !o.plans && !o.envelopes) {
    o = { ...o, ...(o.data as Record<string, unknown>) };
  }
  let plans = parsePlans(pick(o, ["plans", "paychecks", "budgets"]));
  const envRaw = pick(o, ["envelopes", "buckets", "categories", "allocations", "items"]);
  const earnRaw = pick(o, ["earnings", "incomes", "income", "entries", "deposits", "payouts"]);
  let fallbackPlanId: string | undefined;
  if (plans.length === 0) {
    if (!Array.isArray(envRaw) && !Array.isArray(earnRaw)) return null;
    const p = normalizePlan({ name: fallbackPlanName, currency: pick(o, ["currency", "defaultCurrency"]), incomeMode: pick(o, ["incomeMode", "frequency"]) });
    if (!p) return null;
    plans = [p];
    fallbackPlanId = p.id;
  } else {
    fallbackPlanId = plans[0].id;
  }
  const ids = new Set(plans.map((p) => p.id));
  const envelopes = parseEnvelopes(envRaw, ids, fallbackPlanId);
  const earnings = parseEarnings(earnRaw, ids, fallbackPlanId);
  const prefs = parsePrefs(o.prefs);
  if (prefs.activePlanId && !ids.has(prefs.activePlanId)) delete prefs.activePlanId;
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : new Date().toISOString(), plans, earnings, envelopes, prefs };
}

export function toJSON(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `paypad-${y}${m}${d}.json`;
}

export function download(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
