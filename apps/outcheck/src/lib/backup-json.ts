/**
 * The checklist as a file you can carry.
 *
 * Items (ids, custom labels, order), the day the checks belong to and today's
 * timestamps travel together. Nothing else is in the file: no language, no
 * cookies, no account, because there are none. Pure functions only, so
 * node --test can import this module without a DOM.
 */

export const BACKUP_APP = "outcheck";
export const BACKUP_VERSION = 1;
export const BACKUP_FILENAME = "outcheck.json";

export interface BackupItem {
  id: string;
  /** null keeps the stock label (door / gas / garage) in the active language. */
  label: string | null;
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  /** Local YYYY-MM-DD the checks belong to. */
  day: string;
  items: BackupItem[];
  checks: Record<string, string>;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function serializeBackup(
  day: string,
  items: BackupItem[],
  checks: Record<string, string>,
): string {
  const ids = new Set(items.map((it) => it.id));
  const kept: Record<string, string> = {};
  for (const [id, at] of Object.entries(checks)) {
    if (ids.has(id) && typeof at === "string" && at) kept[id] = at;
  }
  const file: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    day,
    items: items.map((it) => ({ id: it.id, label: it.label ?? null })),
    checks: kept,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** null for anything that is not one of our files — the caller says so out loud. */
export function parseBackup(text: string): BackupFile | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.app !== BACKUP_APP) return null;
  if (Number(obj.version) !== BACKUP_VERSION) return null;
  if (typeof obj.day !== "string" || !DAY_RE.test(obj.day)) return null;
  if (!Array.isArray(obj.items)) return null;
  if (!obj.checks || typeof obj.checks !== "object" || Array.isArray(obj.checks)) return null;

  const items: BackupItem[] = [];
  const seen = new Set<string>();
  for (const entry of obj.items) {
    if (!entry || typeof entry !== "object") return null;
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || !row.id || seen.has(row.id)) return null;
    if (row.label !== null && row.label !== undefined && typeof row.label !== "string") return null;
    seen.add(row.id);
    const label = typeof row.label === "string" && row.label.trim() ? row.label : null;
    items.push({ id: row.id, label });
  }

  const checks: Record<string, string> = {};
  for (const [id, at] of Object.entries(obj.checks as Record<string, unknown>)) {
    if (typeof at !== "string" || !at) return null;
    if (Number.isNaN(new Date(at).getTime())) return null;
    if (seen.has(id)) checks[id] = at;
  }

  return { app: BACKUP_APP, version: BACKUP_VERSION, day: obj.day, items, checks };
}

/** Blob + object URL + a click: the only way a browser writes a file. */
export function downloadBackup(
  day: string,
  items: BackupItem[],
  checks: Record<string, string>,
): void {
  const blob = new Blob([serializeBackup(day, items, checks)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = BACKUP_FILENAME;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
