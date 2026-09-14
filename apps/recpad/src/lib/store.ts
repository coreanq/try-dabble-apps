/**
 * Small preferences in this browser: nothing but the last gain setting and
 * the noise-clean strength. Keys are namespaced so another try-dabble app
 * cannot collide. Audio itself lives in src/lib/drafts.ts.
 */
export const PREFS_KEY = "recpad:prefs:v1";

export interface Prefs {
  gainDb: number;
  noiseStrength: number;
}

export function defaultPrefs(): Prefs {
  return { gainDb: 3, noiseStrength: 0.6 };
}

export function parsePrefs(raw: unknown): Prefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const gainDb = typeof o.gainDb === "number" && Number.isFinite(o.gainDb) ? Math.max(-24, Math.min(24, o.gainDb)) : base.gainDb;
  const noiseStrength =
    typeof o.noiseStrength === "number" && Number.isFinite(o.noiseStrength) ? Math.max(0, Math.min(1, o.noiseStrength)) : base.noiseStrength;
  return { gainDb, noiseStrength };
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
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode or quota — the setting just will not survive a reload */
  }
}

export function stampedName(base: string, ext: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${base}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${ext}`;
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
