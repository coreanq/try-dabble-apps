/**
 * The answer to "new phone, empty passport": one JSON file with every custom
 * route, every log entry, the per-route progress snapshot and preferences,
 * restorable on any device. Built with no DOM so the tests can cover it.
 */
import { normalizeLogs, type LogEntry } from "./logs.ts";
import { parsePrefs, type Prefs } from "./prefs.ts";
import { snapshot, type ProgressMap } from "./progress.ts";
import { allRoutes, normalizeRoutes, type Route } from "./routes.ts";

export interface Backup {
  app: "trailquest";
  version: 1;
  exportedAt: string;
  routes: Route[];
  logs: LogEntry[];
  progress: ProgressMap;
  prefs: Prefs;
}

export function buildBackup(customRoutes: Route[], logs: LogEntry[], prefs: Prefs, now: Date = new Date()): Backup {
  return {
    app: "trailquest",
    version: 1,
    exportedAt: now.toISOString(),
    routes: customRoutes,
    logs,
    progress: snapshot(allRoutes(customRoutes), logs),
    prefs,
  };
}

export function toJSON(backup: Backup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export interface ParsedBackup {
  routes: Route[];
  logs: LogEntry[];
  prefs: Prefs | null;
}

/**
 * Accepts the trailquest backup shape. Damaged rows are dropped; a file with
 * no usable route or entry at all is rejected so a wrong file never wipes the
 * log. Entries pointing at a route that no longer exists are kept: a preset
 * may come back in a later version and the miles were really walked.
 */
export function parseBackup(raw: string): ParsedBackup {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("bad shape");
  const o = data as Record<string, unknown>;
  if (o.app !== undefined && o.app !== "trailquest") throw new Error("not a trailquest backup");
  if (!Array.isArray(o.routes) && !Array.isArray(o.logs)) throw new Error("bad shape");
  const routes = normalizeRoutes(o.routes);
  const logs = normalizeLogs(o.logs);
  if (routes.length === 0 && logs.length === 0) throw new Error("empty");
  const prefs = o.prefs && typeof o.prefs === "object" ? parsePrefs(o.prefs) : null;
  return { routes, logs, prefs };
}

export function backupFilename(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `trailquest-backup-${y}-${m}-${day}.json`;
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
