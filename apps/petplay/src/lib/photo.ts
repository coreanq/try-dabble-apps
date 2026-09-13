/**
 * Photo → sprite, the non-AI way: the user picks a local image, frames a
 * square crop with zoom / offset sliders, optionally tints it, and the
 * result is drawn on a canvas in this browser and kept as a data: URL.
 *
 * There is no upload helper in this file or anywhere else in the app. The
 * only inputs are a File from <input type="file"> and numbers from sliders;
 * the only output is a data:image/png URL. No fetch, no XMLHttpRequest, no
 * model call of any kind.
 */

export const SPRITE_SIZE = 256;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Square source rectangle for a given image size, zoom (1 = the largest
 * centred square, 3 = a third of that) and offsets in -1..1 (fraction of
 * the slack on each axis). Pure, so it is unit-tested.
 */
export function cropRect(imageW: number, imageH: number, zoom: number, offsetX: number, offsetY: number): CropRect {
  const w = Math.max(1, imageW);
  const h = Math.max(1, imageH);
  const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number.isFinite(zoom) ? zoom : 1));
  const side = Math.min(w, h) / z;
  const slackX = w - side;
  const slackY = h - side;
  const ox = Math.min(1, Math.max(-1, Number.isFinite(offsetX) ? offsetX : 0));
  const oy = Math.min(1, Math.max(-1, Number.isFinite(offsetY) ? offsetY : 0));
  const sx = slackX / 2 + (ox * slackX) / 2;
  const sy = slackY / 2 + (oy * slackY) / 2;
  return { sx, sy, sw: side, sh: side };
}

export interface RenderOptions {
  zoom: number;
  offsetX: number;
  offsetY: number;
  /** #rrggbb or null for the untouched photo. */
  tint: string | null;
  /** 0..1, how far towards the tint colour. */
  tintStrength: number;
  size?: number;
}

/**
 * Draws the crop into `canvas` (square, rounded corners), optionally tinting
 * it. Works on any CanvasImageSource, so the same call serves the preview
 * and the final export.
 */
export function renderSprite(canvas: HTMLCanvasElement, image: CanvasImageSource, imageW: number, imageH: number, opts: RenderOptions): void {
  const size = opts.size ?? SPRITE_SIZE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const r = cropRect(imageW, imageH, opts.zoom, opts.offsetX, opts.offsetY);
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  const radius = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(size, 0, size, size, radius);
  ctx.arcTo(size, size, 0, size, radius);
  ctx.arcTo(0, size, 0, 0, radius);
  ctx.arcTo(0, 0, size, 0, radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, r.sx, r.sy, r.sw, r.sh, 0, 0, size, size);
  const strength = Math.min(1, Math.max(0, opts.tintStrength));
  if (opts.tint && strength > 0) {
    // Multiply keeps the photo's shading and pushes its hue towards the tint.
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = strength;
    ctx.fillStyle = opts.tint;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

/** Decodes a picked File into a bitmap, on this device. Rejects non-images. */
export async function decodeImage(file: File): Promise<{ image: ImageBitmap | HTMLImageElement; width: number; height: number }> {
  if (!file.type.startsWith("image/")) throw new Error("not an image");
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return { image: bmp, width: bmp.width, height: bmp.height };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return { image: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}
