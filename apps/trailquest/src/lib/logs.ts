/**
 * trailquest:logs:v1 — LogEntry[] : one row per distance you typed in, tied
 * to the route it was walked toward. Entries are never auto-generated; the
 * only sources are "manual" (a distance) and "steps" (a pasted step count
 * turned into miles at the reader's stride).
 */
import { isDateStr } from "./dates.ts";

export const LOGS_KEY = "trailquest:logs:v1";

export type LogSource = "manual" | "steps";

export interface LogEntry {
  id: string;
  routeId: string;
  /** Always miles, whatever unit was typed. */
  miles: number;
  /** YYYY-MM-DD, the day it was walked. */
  date: string;
  note?: string;
  source: LogSource;
  /** Present when source is "steps": the pasted count, for the history row. */
  steps?: number;
  createdAt: string;
  updatedAt: string;
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function roundMiles(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function normalizeLog(raw: unknown): LogEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.routeId !== "string" || !o.routeId) return null;
  const miles = typeof o.miles === "string" ? Number(o.miles) : o.miles;
  if (!isFiniteNumber(miles) || miles <= 0) return null;
  if (!isDateStr(o.date)) return null;
  const createdAt = typeof o.createdAt === "string" && o.createdAt ? o.createdAt : new Date(0).toISOString();
  const updatedAt = typeof o.updatedAt === "string" && o.updatedAt ? o.updatedAt : createdAt;
  const entry: LogEntry = {
    id: o.id,
    routeId: o.routeId,
    miles: roundMiles(miles),
    date: o.date,
    source: o.source === "steps" ? "steps" : "manual",
    createdAt,
    updatedAt,
  };
  if (typeof o.note === "string" && o.note.trim()) entry.note = o.note.trim().slice(0, 140);
  if (entry.source === "steps" && isFiniteNumber(o.steps) && o.steps > 0) entry.steps = Math.round(o.steps);
  return entry;
}

export function normalizeLogs(raw: unknown): LogEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: LogEntry[] = [];
  for (const item of raw) {
    const e = normalizeLog(item);
    if (e && !seen.has(e.id)) {
      seen.add(e.id);
      out.push(e);
    }
  }
  return out;
}

export function loadLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? normalizeLogs(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs: LogEntry[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch {
    /* private mode: the session still works, it just will not remember */
  }
}

/** Entries for one route, newest date first (ties: newest created first). */
export function logsForRoute(logs: LogEntry[], routeId: string): LogEntry[] {
  return logs
    .filter((l) => l.routeId === routeId)
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}
