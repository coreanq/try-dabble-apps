/**
 * getUserMedia wrapper with an explicit state machine so the UI can offer the
 * right recovery: "Allow camera" before the first ask, "Retry camera" plus
 * settings help after a denial, and a black-frame check after the stream
 * starts (some phones hand over a stream with no pixels).
 */
import type { Facing } from "@/lib/prefs";

export type CameraState = "idle" | "starting" | "live" | "denied" | "error" | "black" | "unsupported";

export function cameraSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function";
}

export function constraintsFor(facing: Facing): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode: facing === "environment" ? { ideal: "environment" } : "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };
}

/** Maps a getUserMedia rejection to a UI state. */
export function classifyError(err: unknown): Exclude<CameraState, "idle" | "starting" | "live" | "black"> {
  const name = (err as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotSupportedError") {
    return name === "NotSupportedError" ? "unsupported" : "error";
  }
  return "error";
}

export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  for (const t of stream.getTracks()) {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  }
}

export async function openCamera(facing: Facing): Promise<MediaStream> {
  if (!cameraSupported()) {
    const e = new Error("unsupported");
    (e as { name: string }).name = "NotSupportedError";
    throw e;
  }
  try {
    return await navigator.mediaDevices.getUserMedia(constraintsFor(facing));
  } catch (err) {
    // A phone with one camera rejects the exact facing; fall back to any.
    if ((err as { name?: string })?.name === "OverconstrainedError") {
      return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
    throw err;
  }
}
