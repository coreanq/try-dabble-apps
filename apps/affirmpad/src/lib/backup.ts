/**
 * The answer to "I reinstalled and it was all gone": one JSON file with every
 * affirmation, topic and preference, restorable on any device. Built with no
 * DOM so the tests can cover the round trip.
 */
import { parsePrefs, type Prefs } from "./prefs.ts";
import { normalizeAffirmations, normalizeCategories, reconcile, type Affirmation, type Category } from "./store.ts";

export interface Backup {
  app: "affirmpad";
  version: 1;
  exportedAt: string;
  affirmations: Affirmation[];
  categories: Category[];
  prefs: Prefs;
}

export function buildBackup(affirmations: Affirmation[], categories: Category[], prefs: Prefs, now: Date = new Date()): Backup {
  return { app: "affirmpad", version: 1, exportedAt: now.toISOString(), affirmations, categories, prefs };
}

export function toJSON(backup: Backup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export interface ParsedBackup {
  affirmations: Affirmation[];
  categories: Category[];
  prefs: Prefs | null;
}

/**
 * Accepts the affirmpad backup shape. Damaged rows are dropped; a file with no
 * usable affirmation or topic at all is rejected so a wrong file never wipes
 * the pad.
 */
export function parseBackup(raw: string): ParsedBackup {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("bad shape");
  const o = data as Record<string, unknown>;
  if (o.app !== undefined && o.app !== "affirmpad") throw new Error("not an affirmpad backup");
  if (!Array.isArray(o.affirmations) && !Array.isArray(o.categories)) throw new Error("bad shape");
  const categories = normalizeCategories(o.categories);
  const affirmations = reconcile(normalizeAffirmations(o.affirmations), categories);
  if (affirmations.length === 0 && categories.length === 0) throw new Error("empty");
  const prefs = o.prefs && typeof o.prefs === "object" ? parsePrefs(o.prefs) : null;
  return { affirmations, categories, prefs };
}

export function backupFilename(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `affirmpad-backup-${y}-${m}-${day}.json`;
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
