/**
 * Canvas side of the fit, ported 1:1 from the pre-Vite public/app.js: cover
 * crop, optional printed caption, binary-search JPEG quality, and a slight
 * downscale when even the lowest quality is still over the max KB.
 */

import { captionLine, coverCrop, type Spec } from "@/lib/spec";

export type ImageSource = ImageBitmap | HTMLImageElement;

export async function loadImage(file: Blob): Promise<ImageSource> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* Safari < 17 and some HEIC files — fall back to an <img>. */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export function closeImage(source: ImageSource | null): void {
  if (source && "close" in source) {
    try {
      source.close();
    } catch {
      /* already closed */
    }
  }
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  outW: number,
  outH: number,
  name: string,
): void {
  const barH = Math.max(22, Math.round(outH * 0.12));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, outH - barH, outW, barH);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const line = captionLine(name);
  let font = Math.max(10, Math.round(barH * 0.42));
  ctx.font = `600 ${font}px system-ui, sans-serif`;
  while (font > 8 && ctx.measureText(line).width > outW - 8) {
    font -= 1;
    ctx.font = `600 ${font}px system-ui, sans-serif`;
  }
  ctx.fillText(line, outW / 2, outH - barH / 2);
}

export function drawToCanvas(
  source: ImageSource,
  sourceW: number,
  sourceH: number,
  outW: number,
  outH: number,
  spec: Spec,
  offsetX: number,
  offsetY: number,
  captionName: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const crop = coverCrop(sourceW, sourceH, spec.w, spec.h, offsetX, offsetY);
  ctx.drawImage(source, crop.cropX, crop.cropY, crop.cropW, crop.cropH, 0, 0, outW, outH);
  if (spec.caption) drawCaption(ctx, outW, outH, captionName);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

/** Forms reject files under the minimum too, so pad the tail to reach it. */
async function padBlob(blob: Blob, minBytes: number): Promise<Blob> {
  if (blob.size >= minBytes) return blob;
  const src = new Uint8Array(await blob.arrayBuffer());
  const buf = new Uint8Array(minBytes);
  buf.set(src);
  return new Blob([buf], { type: blob.type });
}

async function encodeJpegAtSize(
  canvas: HTMLCanvasElement,
  minBytes: number,
  maxBytes: number,
): Promise<Blob | null> {
  let lo = 0.08;
  let hi = 0.95;
  let bestUnder: Blob | null = null;
  let bestIn: Blob | null = null;
  for (let i = 0; i < 14; i++) {
    const q = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, "image/jpeg", q);
    if (!blob) break;
    if (blob.size > maxBytes) {
      hi = q;
    } else if (blob.size < minBytes) {
      lo = q;
      if (!bestUnder || blob.size > bestUnder.size) bestUnder = blob;
    } else {
      if (!bestIn || blob.size > bestIn.size) bestIn = blob;
      lo = q;
    }
  }
  if (bestIn) return bestIn;
  const high = await canvasToBlob(canvas, "image/jpeg", 0.95);
  if (high && high.size < minBytes) return padBlob(high, minBytes);
  const low = await canvasToBlob(canvas, "image/jpeg", 0.08);
  if (low && low.size <= maxBytes) {
    if (low.size < minBytes) return padBlob(low, minBytes);
    return low;
  }
  return low || high;
}

async function encodePngAtSize(
  canvas: HTMLCanvasElement,
  minBytes: number,
): Promise<Blob | null> {
  const blob = await canvasToBlob(canvas, "image/png");
  if (!blob) return null;
  if (blob.size < minBytes) return padBlob(blob, minBytes);
  return blob;
}

export interface FitResult {
  blob: Blob;
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  kb: number;
  mime: string;
}

/** Fit the source to the spec, shrinking a little if the max KB is stubborn. */
export async function fitToSpec(
  source: ImageSource,
  sourceW: number,
  sourceH: number,
  spec: Spec,
  offsetX: number,
  offsetY: number,
  captionName: string,
): Promise<FitResult | null> {
  const mime = spec.format === "png" ? "image/png" : "image/jpeg";
  const minBytes = spec.minKB * 1024;
  const maxBytes = spec.maxKB * 1024;

  let scale = 1;
  let blob: Blob | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let outW = spec.w;
  let outH = spec.h;

  while (scale >= 0.78) {
    outW = Math.max(20, Math.round(spec.w * scale));
    outH = Math.max(20, Math.round(spec.h * scale));
    canvas = drawToCanvas(source, sourceW, sourceH, outW, outH, spec, offsetX, offsetY, captionName);
    blob =
      spec.format === "png"
        ? await encodePngAtSize(canvas, minBytes)
        : await encodeJpegAtSize(canvas, minBytes, maxBytes);
    if (blob && blob.size <= maxBytes) break;
    scale *= 0.96;
  }

  if (!blob || !canvas) return null;
  return { blob, canvas, w: outW, h: outH, kb: blob.size / 1024, mime };
}
