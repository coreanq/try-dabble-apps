/**
 * Capture = draw the current video frame to a canvas and hand the JPEG to the
 * browser's download path. The front camera is mirrored on screen, so the
 * saved photo is mirrored too — that is what the user saw. Nothing is kept in
 * memory beyond the object URL, and nothing goes to a server.
 */
import type { Facing } from "@/lib/prefs";

export function captureFileName(poseId: string, at: Date, index?: number): string {
  const stamp = at.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const suffix = index !== undefined ? `-${index + 1}` : "";
  return `poseguide-${poseId || "pose"}-${stamp}${suffix}.jpg`;
}

export function frameToBlob(video: HTMLVideoElement, facing: Facing, quality = 0.92): Promise<Blob | null> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return Promise.resolve(null);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  if (facing === "user") {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Is the frame effectively black? Samples a small downscale of the video. */
export function frameIsBlack(video: HTMLVideoElement): boolean {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return true;
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  try {
    ctx.drawImage(video, 0, 0, 16, 16);
    const data = ctx.getImageData(0, 0, 16, 16).data;
    return luminanceIsBlack(data);
  } catch {
    return false;
  }
}

/** Pure helper (testable): mean luminance below ~3% counts as black. */
export function luminanceIsBlack(rgba: ArrayLike<number>): boolean {
  let sum = 0;
  let n = 0;
  for (let i = 0; i + 2 < rgba.length; i += 4) {
    sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
    n += 1;
  }
  if (n === 0) return true;
  return sum / n < 8;
}
