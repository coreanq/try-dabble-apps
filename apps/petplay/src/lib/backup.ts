/**
 * The answer to "I reinstalled and my pet was gone": one JSON file with the
 * pet's look (parts, colours, and the photo sprite as an inline data URL),
 * its name, its needs and the preferences, restorable on any device. No DOM
 * here so tests cover the round trip.
 */
import { normalizeNeeds, type Needs } from "./needs.ts";
import { normalizePet, type Pet } from "./pet.ts";
import { parsePrefs, type Prefs } from "./prefs.ts";

export interface Backup {
  app: "petplay";
  version: 1;
  exportedAt: string;
  pet: Pet;
  needs: Needs;
  prefs: Prefs;
}

export function buildBackup(pet: Pet, needs: Needs, prefs: Prefs, now: Date = new Date()): Backup {
  return { app: "petplay", version: 1, exportedAt: now.toISOString(), pet, needs, prefs };
}

export function toJSON(backup: Backup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export interface ParsedBackup {
  pet: Pet;
  needs: Needs;
  prefs: Prefs | null;
}

/**
 * Accepts the petplay backup shape. Unknown parts fall back to species
 * defaults, a remote photo URL is dropped, and a file with no pet at all is
 * rejected so a wrong file never wipes the current pet.
 */
export function parseBackup(raw: string, now: number = Date.now()): ParsedBackup {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("bad shape");
  const o = data as Record<string, unknown>;
  if (o.app !== undefined && o.app !== "petplay") throw new Error("not a petplay backup");
  const pet = normalizePet(o.pet);
  if (!pet) throw new Error("no pet");
  const needs = normalizeNeeds(o.needs, now);
  const prefs = o.prefs && typeof o.prefs === "object" ? parsePrefs(o.prefs) : null;
  return { pet, needs, prefs };
}

export function backupFilename(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `petplay-backup-${y}-${m}-${day}.json`;
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
