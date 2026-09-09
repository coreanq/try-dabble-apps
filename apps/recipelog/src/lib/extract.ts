/**
 * Client side of URL import. The Worker does the fetch + schema.org parse
 * (browsers cannot read third-party pages); the photo comes back through the
 * same-origin image proxy so the canvas can compress it without a tainted
 * bitmap. Instagram / TikTok are never attempted — see the UI note.
 */
import type { ExtractedRecipe } from "./extract-parse.ts";
import { compressImage } from "./photo.ts";

export type ExtractFailReason = "blocked" | "no-recipe" | "bad-url" | "fetch-failed";

export type ExtractResult =
  | { ok: true; recipe: ExtractedRecipe }
  | { ok: false; reason: ExtractFailReason; detail?: string };

export async function extractFromUrl(url: string, signal?: AbortSignal): Promise<ExtractResult> {
  try {
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });
    const data = (await res.json()) as ExtractResult;
    if (data && typeof data === "object" && "ok" in data) return data;
    return { ok: false, reason: "fetch-failed" };
  } catch {
    return { ok: false, reason: "fetch-failed" };
  }
}

/** Pulls the recipe photo through /api/image and compresses it; null on any failure. */
export async function fetchPhotoDataUrl(photoUrl: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`/api/image?url=${encodeURIComponent(photoUrl)}`, { signal });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await compressImage(blob);
  } catch {
    return null;
  }
}
