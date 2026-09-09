/**
 * Camera and gallery pictures are 3–12 MB; the vault keeps a JPEG no larger
 * than ~1.5 MB (usually far smaller) so dozens of recipes fit on the device
 * and a JSON backup stays portable.
 */
export const PHOTO_MAX_BYTES = 1_500_000;
const MAX_EDGE = 1280;

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  return Math.floor(((dataUrl.length - comma - 1) * 3) / 4);
}

async function decode(blob: Blob): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(blob);
      return {
        width: bmp.width,
        height: bmp.height,
        draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
        close: () => bmp.close(),
      };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/** Resizes to at most 1280px on the long edge and re-encodes as JPEG under the cap. */
export async function compressImage(blob: Blob, maxBytes = PHOTO_MAX_BYTES): Promise<string> {
  const src = await decode(blob);
  try {
    let scale = Math.min(1, MAX_EDGE / Math.max(src.width, src.height));
    let quality = 0.82;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const w = Math.max(1, Math.round(src.width * scale));
      const h = Math.max(1, Math.round(src.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      src.draw(ctx, w, h);
      const out = canvas.toDataURL("image/jpeg", quality);
      if (dataUrlBytes(out) <= maxBytes) return out;
      if (quality > 0.6) quality -= 0.1;
      else scale *= 0.8;
    }
    throw new Error("too-big");
  } finally {
    src.close();
  }
}
