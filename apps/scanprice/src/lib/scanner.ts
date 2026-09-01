/**
 * Barcode reading, with the fallbacks a real aisle needs.
 *
 *   1. BarcodeDetector on the live camera — the fast path on Android Chrome.
 *   2. BarcodeDetector on a single photo from the camera roll or the shutter,
 *      for browsers that have the API but where the live stream is blocked.
 *   3. Typing the digits under the bars, which always works.
 *
 * Nothing here uploads a frame. The video never leaves the page and the photo
 * is decoded in this tab.
 */

import { SCAN_FORMATS, normalizeCode } from "@/lib/barcode";

interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource | Blob | ImageBitmap): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

export function hasDetector(): boolean {
  return typeof window !== "undefined" && typeof window.BarcodeDetector === "function";
}

export function hasCamera(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

/** Only the three shelf symbologies, so a QR sticker on the same box is
 *  ignored rather than filed as a product code. */
export async function createDetector(): Promise<BarcodeDetectorLike | null> {
  if (!hasDetector()) return null;
  const Ctor = window.BarcodeDetector!;
  try {
    const supported = (await Ctor.getSupportedFormats?.()) ?? [];
    const formats = supported.length
      ? SCAN_FORMATS.filter((f) => supported.includes(f))
      : [...SCAN_FORMATS];
    if (formats.length === 0) return null;
    return new Ctor({ formats: [...formats] });
  } catch {
    return null;
  }
}

/** The first reading that survives the checksum. A blurred half-read frame
 *  fails normalizeCode and is simply skipped, so the loop keeps looking. */
export async function readFrom(
  detector: BarcodeDetectorLike,
  source: CanvasImageSource | Blob | ImageBitmap,
): Promise<string | null> {
  let found: DetectedBarcode[] = [];
  try {
    found = await detector.detect(source);
  } catch {
    return null;
  }
  for (const hit of found) {
    const code = normalizeCode(hit.rawValue);
    if (code) return code;
  }
  return null;
}

/** Reads a picked or freshly shot photo. createImageBitmap keeps the decode
 *  off the main thread where the browser supports it. */
export async function readFile(
  detector: BarcodeDetectorLike,
  file: File,
): Promise<string | null> {
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      const code = await readFrom(detector, bitmap);
      bitmap.close?.();
      return code;
    }
  } catch {
    /* fall through to the Blob path below */
  }
  return readFrom(detector, file);
}

/** Back camera, and as many pixels as the device will give us — a shelf
 *  barcode is small in the frame. */
export async function openCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
}

export function closeCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
