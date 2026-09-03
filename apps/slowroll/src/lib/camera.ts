/**
 * The live viewfinder. The stream is drawn to the <video> before the shutter
 * — that is the framing preview a photographer needs — and to a detached
 * canvas at the moment of the shutter, which goes straight to storage. The
 * captured frame is never attached to the DOM, never turned into an object
 * URL, never shown.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "starting" | "live" | "error";

const JPEG_QUALITY = 0.92;
const MAX_EDGE = 2048;

export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [attempt, setAttempt] = useState(0);

  const stop = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      for (const track of s.getTracks()) track.stop();
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("starting");
    (async () => {
      const md = navigator.mediaDevices;
      if (!md?.getUserMedia) {
        if (!cancelled) setStatus("error");
        return;
      }
      try {
        const stream = await md.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          try {
            await v.play();
          } catch {
            /* autoplay policy: the muted, playsInline video still plays on the next gesture */
          }
        }
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [active, attempt, stop]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  /** Grabs the current frame as JPEG bytes. Nothing is displayed. */
  const capture = useCallback(async (): Promise<Blob | null> => {
    const v = videoRef.current;
    if (!v || status !== "live" || v.videoWidth === 0) return null;
    const scale = Math.min(1, MAX_EDGE / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    canvas.width = 0;
    canvas.height = 0;
    return blob;
  }, [status]);

  return { videoRef, status, retry, capture };
}
