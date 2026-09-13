/**
 * Local store: prefs + the custom dictionary. Everything lives in this
 * browser. Keys are namespaced so another try-dabble app cannot collide.
 * The only ways off the device are the downloads the user asks for.
 */
import { cleanWords } from "./scrub.ts";

export const PREFS_KEY = "scrubpad:prefs:v1";
export const DICT_KEY = "scrubpad:dict:v1";

export interface Prefs {
  showRestoreMap: boolean;
  keepLast: boolean;
  lastText: string;
  lastScrubbed: string;
}

export function defaultPrefs(): Prefs {
  return { showRestoreMap: false, keepLast: true, lastText: "", lastScrubbed: "" };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    showRestoreMap: typeof o.showRestoreMap === "boolean" ? o.showRestoreMap : base.showRestoreMap,
    keepLast: typeof o.keepLast === "boolean" ? o.keepLast : base.keepLast,
    lastText: typeof o.lastText === "string" ? o.lastText : base.lastText,
    lastScrubbed: typeof o.lastScrubbed === "string" ? o.lastScrubbed : base.lastScrubbed,
  };
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return parsePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    const toSave: Prefs = prefs.keepLast ? prefs : { ...prefs, lastText: "", lastScrubbed: "" };
    localStorage.setItem(PREFS_KEY, JSON.stringify(toSave));
  } catch {
    /* private mode or quota — the paste just will not survive a reload */
  }
}

export function parseDict(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return cleanWords(raw.filter((w): w is string => typeof w === "string"));
}

export function loadDict(): string[] {
  try {
    const raw = localStorage.getItem(DICT_KEY);
    return parseDict(raw ? JSON.parse(raw) : null);
  } catch {
    return [];
  }
}

export function saveDict(words: readonly string[]): void {
  try {
    localStorage.setItem(DICT_KEY, JSON.stringify(cleanWords(words)));
  } catch {
    /* private mode */
  }
}

export function clearStore(): void {
  try {
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(DICT_KEY);
  } catch {
    /* nothing to clear */
  }
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

/** Clipboard with a selection fallback for browsers that refuse the async API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the selection path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
