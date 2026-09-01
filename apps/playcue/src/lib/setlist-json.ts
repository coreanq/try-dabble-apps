/**
 * The setlist as a file you can carry.
 *
 * Only the running order travels — names, order, ids and the runtimes already
 * probed. The audio bytes stay where they were dropped, so the file is small
 * enough to mail to yourself and it never turns into an upload. Re-imported on
 * the same device the ids still line up, so every cue plays again; on another
 * device the rows arrive with the file marked missing, which is honest.
 */

import type { Cue } from "@/lib/cues";

export const SETLIST_APP = "playcue";
export const SETLIST_VERSION = 1;

export type SetlistFile = {
  app: typeof SETLIST_APP;
  version: number;
  name: string;
  cues: Cue[];
};

export function serializeSetlist(name: string, cues: Cue[]): string {
  const file: SetlistFile = {
    app: SETLIST_APP,
    version: SETLIST_VERSION,
    name: name.trim(),
    cues: cues.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      size: c.size,
      durationMs: c.durationMs,
    })),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/**
 * A show called "8/12 Act 2: 리허설" has to survive Windows, macOS and a phone
 * download folder, so anything a filesystem argues about becomes a dash.
 */
export function setlistFilename(name: string): string {
  const cleaned = name
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .slice(0, 60)
    .trim();
  return cleaned ? `${cleaned}.json` : "setlist.json";
}

/** null for anything that is not one of our files — the caller says so out loud. */
export function parseSetlist(text: string): SetlistFile | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.app !== SETLIST_APP) return null;
  if (Number(obj.version) !== SETLIST_VERSION) return null;
  if (!Array.isArray(obj.cues)) return null;

  const cues: Cue[] = [];
  for (const entry of obj.cues) {
    if (!entry || typeof entry !== "object") return null;
    const c = entry as Record<string, unknown>;
    if (typeof c.id !== "string" || !c.id) return null;
    if (typeof c.name !== "string") return null;
    cues.push({
      id: c.id,
      name: c.name,
      type: typeof c.type === "string" ? c.type : "",
      size: Number(c.size) || 0,
      durationMs: Number(c.durationMs) || 0,
    });
  }

  return {
    app: SETLIST_APP,
    version: SETLIST_VERSION,
    name: typeof obj.name === "string" ? obj.name : "",
    cues,
  };
}

/** Blob + object URL + a click: the only way a browser writes a file. */
export function downloadSetlist(name: string, cues: Cue[]): void {
  const blob = new Blob([serializeSetlist(name, cues)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = setlistFilename(name);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
