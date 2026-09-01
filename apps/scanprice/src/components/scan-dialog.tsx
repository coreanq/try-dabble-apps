import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeCode } from "@/lib/barcode";
import type { Translate } from "@/lib/i18n";
import { closeCamera, createDetector, hasCamera, openCamera, readFile } from "@/lib/scanner";

type Phase = "starting" | "live" | "denied" | "unsupported" | "reading";

/** How often a frame is handed to the detector. Fast enough to feel instant in
 *  the aisle, slow enough not to cook the phone. */
const TICK_MS = 280;

/**
 * The scan window, live. Three ways in, in the order a shopper hits them:
 * the camera reads it, a photo of it is read, or the digits under the bars get
 * typed. The typed field is always on screen — it is the one that never fails.
 */
export function ScanDialog({
  open,
  t,
  onOpenChange,
  onCode,
}: {
  open: boolean;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onCode: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [typed, setTyped] = useState("");
  const [notice, setNotice] = useState("");

  const accept = useCallback(
    (code: string) => {
      closeCamera(streamRef.current);
      streamRef.current = null;
      onCode(code);
    },
    [onCode],
  );

  // The whole camera lifetime hangs off `open`: opened on mount of the dialog,
  // and every track stopped again on close so the phone's light goes out.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let timer: number | undefined;
    setNotice("");
    setPhase("starting");

    (async () => {
      const detector = await createDetector();
      if (cancelled) return;
      if (!detector || !hasCamera()) {
        setPhase("unsupported");
        return;
      }

      let stream: MediaStream;
      try {
        stream = await openCamera();
      } catch {
        if (!cancelled) setPhase("denied");
        return;
      }
      if (cancelled) {
        closeCamera(stream);
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        try {
          await video.play();
        } catch {
          /* autoplay refused — the frames still arrive for the detector */
        }
      }
      if (cancelled) return;
      setPhase("live");

      let busy = false;
      timer = window.setInterval(async () => {
        const el = videoRef.current;
        if (busy || cancelled || !el || el.readyState < 2) return;
        busy = true;
        try {
          const found = await detector.detect(el);
          for (const hit of found) {
            const code = normalizeCode(hit.rawValue);
            if (code && !cancelled) {
              window.clearInterval(timer);
              accept(code);
              return;
            }
          }
        } catch {
          /* one bad frame — the next tick tries again */
        } finally {
          busy = false;
        }
      }, TICK_MS);
    })();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      closeCamera(streamRef.current);
      streamRef.current = null;
    };
  }, [open, accept]);

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    const detector = await createDetector();
    if (!detector) {
      setNotice(t("scanUnsupported"));
      return;
    }
    setPhase("reading");
    const code = await readFile(detector, file);
    if (code) {
      accept(code);
      return;
    }
    setPhase(streamRef.current ? "live" : "unsupported");
    setNotice(t("scanNoRead"));
  }

  function handleTyped() {
    const code = normalizeCode(typed);
    if (!code) {
      setNotice(t("codeBad"));
      return;
    }
    setTyped("");
    accept(code);
  }

  const live = phase === "live";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="scan-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle id="scan-title">{t("scanDialogTitle")}</DialogTitle>
          <DialogDescription id="scan-aim">
            {phase === "unsupported"
              ? t("scanUnsupported")
              : phase === "denied"
                ? t("scanDenied")
                : t("scanAim")}
          </DialogDescription>
        </DialogHeader>

        <div className="sp-scanwin" data-live={live ? "true" : "false"} id="scan-view">
          {/* Kept mounted so the stream has somewhere to land the moment the
              camera answers; the face sits on top until it does. */}
          <video ref={videoRef} muted playsInline id="scan-video" />
          <span className="sp-bracket" data-c="tl" />
          <span className="sp-bracket" data-c="tr" />
          <span className="sp-bracket" data-c="bl" />
          <span className="sp-bracket" data-c="br" />
          {live ? <span className="sp-laser" /> : null}
          {live ? null : (
            <span className="sp-scanwin-face">
              <span className="sp-scanwin-bars" />
              <span className="sp-scanwin-title">
                {phase === "starting"
                  ? t("scanStarting")
                  : phase === "reading"
                    ? t("scanPhotoReading")
                    : t("scanFormats")}
              </span>
              <span className="sp-scanwin-sub">
                {phase === "denied"
                  ? t("scanDenied")
                  : phase === "unsupported"
                    ? t("scanPhotoHint")
                    : ""}
              </span>
            </span>
          )}
        </div>

        {notice ? (
          <p className="m-0 text-[0.76rem] font-semibold text-destructive" id="scan-notice">
            {notice}
          </p>
        ) : null}

        {/* Fallback 1: one photo, read in this tab. */}
        <div>
          <input
            ref={fileRef}
            id="scan-photo"
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              void handlePhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            id="scan-photo-btn"
            onClick={() => fileRef.current?.click()}
          >
            {t("scanPhotoBtn")}
          </Button>
          <p className="mt-1 mb-0 text-[0.7rem] text-muted-ink" id="scan-photo-hint">
            {t("scanPhotoHint")}
          </p>
        </div>

        {/* Fallback 2: the digits under the bars. Always available. */}
        <div>
          <label className="sp-field-label" htmlFor="scan-code">
            {t("codeLabel")}
          </label>
          <input
            id="scan-code"
            className="sp-field mt-1"
            data-role="code"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder={t("codePh")}
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setNotice("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTyped();
              }
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" className="flex-1" id="scan-code-use" onClick={handleTyped}>
              {t("codeUse")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              id="scan-cancel"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
