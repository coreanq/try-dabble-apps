/**
 * The answer to "I reinstalled and it was all gone": one JSON file with every
 * compound, vial, log, schedule, supply and preference, restorable on any
 * device. Built with no DOM so the tests can cover the round trip.
 */
import {
  normalizeCompounds,
  normalizeLogs,
  normalizeSchedules,
  normalizeSupplies,
  normalizeVials,
  reconcile,
  type Store,
} from "./model.ts";
import { parsePrefs, type Prefs } from "./prefs.ts";

export interface Backup extends Store {
  app: "peptidelog";
  version: 1;
  exportedAt: string;
  prefs: Prefs;
}

export function buildBackup(store: Store, prefs: Prefs, now: Date = new Date()): Backup {
  return {
    app: "peptidelog",
    version: 1,
    exportedAt: now.toISOString(),
    compounds: store.compounds,
    vials: store.vials,
    logs: store.logs,
    schedules: store.schedules,
    supplies: store.supplies,
    prefs,
  };
}

export function toJSON(backup: Backup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export interface ParsedBackup {
  store: Store;
  prefs: Prefs | null;
}

/**
 * Accepts the peptidelog backup shape. Damaged rows are dropped; a file with
 * nothing usable at all is rejected so a wrong file never wipes the tracker.
 */
export function parseBackup(raw: string): ParsedBackup {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("bad shape");
  const o = data as Record<string, unknown>;
  if (o.app !== undefined && o.app !== "peptidelog") throw new Error("not a peptidelog backup");
  const any = ["compounds", "vials", "logs", "schedules", "supplies"].some((k) => Array.isArray(o[k]));
  if (!any) throw new Error("bad shape");
  const store = reconcile({
    compounds: normalizeCompounds(o.compounds),
    vials: normalizeVials(o.vials),
    logs: normalizeLogs(o.logs),
    schedules: normalizeSchedules(o.schedules),
    supplies: normalizeSupplies(o.supplies),
  });
  const total = store.compounds.length + store.vials.length + store.logs.length + store.schedules.length + store.supplies.length;
  if (total === 0) throw new Error("empty");
  const prefs = o.prefs && typeof o.prefs === "object" ? parsePrefs(o.prefs) : null;
  return { store, prefs };
}

export function backupFilename(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `peptidelog-backup-${y}-${m}-${day}.json`;
}

export function download(text: string, name: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
