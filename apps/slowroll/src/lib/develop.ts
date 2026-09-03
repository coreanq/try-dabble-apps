/**
 * The darkroom chemistry. Runs only once a roll's unlock moment has passed:
 * every negative is pulled out of IndexedDB, printed with a warm tone, a
 * light grain and a soft vignette, and the whole set is handed back together
 * so the grid appears in one moment — never one frame earlier than another.
 */
import { getDeveloped, getFrame, putDeveloped } from "@/lib/frames";

const MAX_EDGE = 1600;

export type Print = { id: string; url: string; blob: Blob };

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Deterministic per-print seed so a revisit prints the same grain. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export async function printNegative(id: string, negative: Blob): Promise<Blob> {
  const src = await decode(negative);
  const sw = "width" in src ? src.width : 0;
  const sh = "height" in src ? src.height : 0;
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh, 1));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return negative;
  ctx.drawImage(src, 0, 0, w, h);
  if ("close" in src) src.close();

  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  const rand = rng(id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);

  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Warm drugstore print: lifted reds, cooler blues pulled down, faded blacks.
      let r = d[i] * 1.08 + 10;
      let g = d[i + 1] * 1.0 + 6;
      let b = d[i + 2] * 0.86 + 2;
      // Grain: monochrome noise, a touch stronger in the shadows.
      const lum = (r + g + b) / 3;
      const grain = (rand() - 0.5) * (18 + (255 - lum) * 0.08);
      r += grain;
      g += grain;
      b += grain;
      // Vignette.
      const dx = x - cx;
      const v = 1 - 0.22 * Math.pow(Math.hypot(dx, dy) / maxR, 2.2);
      d[i] = r * v < 0 ? 0 : r * v > 255 ? 255 : r * v;
      d[i + 1] = g * v < 0 ? 0 : g * v > 255 ? 255 : g * v;
      d[i + 2] = b * v < 0 ? 0 : b * v > 255 ? 255 : b * v;
    }
  }
  ctx.putImageData(image, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  canvas.width = 0;
  canvas.height = 0;
  return blob ?? negative;
}

/**
 * Develops every frame of a roll and resolves with ALL prints at once. A frame
 * whose bytes are gone (cleared site data) is skipped rather than blocking the
 * rest of the roll.
 */
export async function developRoll(frameIds: string[]): Promise<Print[]> {
  const prints = await Promise.all(
    frameIds.map(async (id): Promise<Print | null> => {
      let blob = await getDeveloped(id);
      if (!blob) {
        const negative = await getFrame(id);
        if (!negative) return null;
        blob = await printNegative(id, negative);
        void putDeveloped(id, blob);
      }
      return { id, url: URL.createObjectURL(blob), blob };
    }),
  );
  return prints.filter((p): p is Print => p !== null);
}

export function releasePrints(prints: Print[]): void {
  for (const p of prints) URL.revokeObjectURL(p.url);
}
