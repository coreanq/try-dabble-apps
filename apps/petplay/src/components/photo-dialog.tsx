import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { PALETTE, type PhotoSprite } from "@/lib/pet";
import { ZOOM_MAX, ZOOM_MIN, canvasToDataUrl, decodeImage, renderSprite } from "@/lib/photo";

interface Loaded {
  image: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
}

/**
 * Photo → sprite without any AI: pick a local file, frame a square with the
 * sliders, tint it, apply. Everything is a canvas in this browser; the
 * result is a data: URL saved with the pet. No upload, ever.
 */
export function PhotoDialog({
  open,
  t,
  onOpenChange,
  onApply,
  onError,
}: {
  open: boolean;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onApply: (sprite: PhotoSprite) => void;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [tint, setTint] = useState<string | null>(null);
  const [tintStrength, setTintStrength] = useState(0.5);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !loaded) return;
    renderSprite(c, loaded.image, loaded.width, loaded.height, { zoom, offsetX, offsetY, tint, tintStrength, size: 224 });
  }, [loaded, zoom, offsetX, offsetY, tint, tintStrength]);

  useEffect(() => {
    if (!open) return;
    setLoaded(null);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setTint(null);
    setTintStrength(0.5);
  }, [open]);

  async function pick(file: File) {
    try {
      setLoaded(await decodeImage(file));
    } catch {
      onError(t("photoBad"));
    }
  }

  function apply() {
    if (!loaded) return;
    const c = document.createElement("canvas");
    renderSprite(c, loaded.image, loaded.width, loaded.height, { zoom, offsetX, offsetY, tint, tintStrength });
    onApply({ dataUrl: canvasToDataUrl(c), ...(tint ? { tint } : {}) });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="photo-dialog" className="pp-sheet" showCloseButton={false}>
        <DialogTitle className="pp-sheet-title">{t("photoTitle")}</DialogTitle>
        <DialogDescription className="pp-hint">{t("photoHint")}</DialogDescription>

        <input
          ref={fileRef}
          id="photo-file"
          className="pp-file"
          type="file"
          accept="image/*"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pick(f);
            e.target.value = "";
          }}
        />
        <button type="button" className="pp-btn pp-btn-teal" id="photo-pick" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="size-4" aria-hidden />
          {t("photoPick")}
        </button>

        <div className="pp-preview">
          {loaded ? <canvas ref={canvasRef} id="photo-canvas" className="pp-photo-canvas" width={224} height={224} /> : <p className="pp-hint">{t("photoNone")}</p>}
        </div>

        <label className="pp-slider">
          <span className="pp-field-label">{t("photoZoom")}</span>
          <input id="photo-zoom" type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.01} value={zoom} disabled={!loaded} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
        <label className="pp-slider">
          <span className="pp-field-label">{t("photoX")}</span>
          <input id="photo-x" type="range" min={-1} max={1} step={0.01} value={offsetX} disabled={!loaded} onChange={(e) => setOffsetX(Number(e.target.value))} />
        </label>
        <label className="pp-slider">
          <span className="pp-field-label">{t("photoY")}</span>
          <input id="photo-y" type="range" min={-1} max={1} step={0.01} value={offsetY} disabled={!loaded} onChange={(e) => setOffsetY(Number(e.target.value))} />
        </label>

        <div className="pp-field">
          <span className="pp-field-label">{t("photoTint")}</span>
          <div className="pp-swatches" id="photo-tints">
            <button type="button" className="pp-swatch pp-swatch-none" aria-pressed={tint === null} aria-label={t("tintNone")} onClick={() => setTint(null)}>
              ×
            </button>
            {PALETTE.accent.map((hex) => (
              <button key={hex} type="button" className="pp-swatch" style={{ background: hex }} data-color={hex} aria-label={hex} aria-pressed={tint === hex} onClick={() => setTint(hex)} />
            ))}
            <label className="pp-swatch pp-swatch-custom">
              <span className="sr-only">{t("photoTint")}</span>
              <input type="color" value={tint ?? "#fb7185"} aria-label={t("photoTint")} onChange={(e) => setTint(e.target.value)} />
            </label>
          </div>
        </div>
        <label className="pp-slider">
          <span className="pp-field-label">{t("photoTintStrength")}</span>
          <input id="photo-tint-strength" type="range" min={0} max={1} step={0.05} value={tintStrength} disabled={!loaded || !tint} onChange={(e) => setTintStrength(Number(e.target.value))} />
        </label>

        <div className="pp-actions">
          <button type="button" className="pp-btn pp-btn-quiet" id="photo-cancel" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </button>
          <button type="button" className="pp-btn pp-btn-primary" id="photo-apply" disabled={!loaded} onClick={apply}>
            {t("photoApply")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
