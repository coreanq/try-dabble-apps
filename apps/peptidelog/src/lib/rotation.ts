/**
 * Injection-site rotation helper: plain least-recently-used over a fixed list
 * of common subcutaneous sites. A site never logged comes first (in list
 * order); otherwise the one with the oldest last use. It is a suggestion the
 * person can override with one tap; it is not medical advice.
 */
import type { DoseLog } from "./model.ts";

export const SITES = [
  "abdomen-ul",
  "abdomen-ur",
  "abdomen-ll",
  "abdomen-lr",
  "thigh-l",
  "thigh-r",
  "deltoid-l",
  "deltoid-r",
  "glute-l",
  "glute-r",
] as const;

export type SiteId = (typeof SITES)[number];

export function isSite(v: unknown): v is SiteId {
  return typeof v === "string" && (SITES as readonly string[]).includes(v);
}

/** Last ISO instant each site was used, from the log. */
export function lastUsedBySite(logs: DoseLog[], sites: readonly string[] = SITES): Map<string, string> {
  const m = new Map<string, string>();
  for (const l of logs) {
    if (!l.site || !sites.includes(l.site)) continue;
    const prev = m.get(l.site);
    if (!prev || l.datetime > prev) m.set(l.site, l.datetime);
  }
  return m;
}

export function suggestNextSite(logs: DoseLog[], sites: readonly string[] = SITES): string {
  const last = lastUsedBySite(logs, sites);
  for (const s of sites) if (!last.has(s)) return s;
  let best = sites[0];
  let bestTime = last.get(best) ?? "";
  for (const s of sites) {
    const t = last.get(s) ?? "";
    if (t < bestTime) {
      best = s;
      bestTime = t;
    }
  }
  return best;
}

/** Sites in the order they should be used next: never-used first, then oldest. */
export function rotationOrder(logs: DoseLog[], sites: readonly string[] = SITES): { site: string; lastUsed: string | null }[] {
  const last = lastUsedBySite(logs, sites);
  return [...sites]
    .map((site) => ({ site, lastUsed: last.get(site) ?? null }))
    .sort((a, b) => {
      if (a.lastUsed === null && b.lastUsed === null) return sites.indexOf(a.site) - sites.indexOf(b.site);
      if (a.lastUsed === null) return -1;
      if (b.lastUsed === null) return 1;
      return a.lastUsed.localeCompare(b.lastUsed);
    });
}
