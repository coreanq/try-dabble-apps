import type { PointerEvent, RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import type { Spec } from "@/lib/spec";

export interface Readout {
  w: number;
  h: number;
  kb: number;
  inRange: boolean;
  spec: Spec;
}

/** The light box: the fitted print inside a crop frame, its exact W×H and KB
 *  read out underneath — green inside the window, safelight red outside it. */
export function PreviewCard({
  t,
  canvasRef,
  ready,
  dragging,
  readout,
  onDownload,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  t: Translate;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ready: boolean;
  dragging: boolean;
  readout: Readout | null;
  onDownload: () => void;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("preview")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <div
          className="ps-lightbox"
          data-ready={ready}
          data-drag={dragging}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {!ready && <p className="ps-empty">{t("previewEmpty")}</p>}
          <canvas ref={canvasRef} className="ps-print" hidden={!ready} />
        </div>

        {readout && (
          <p className="ps-readout">
            <span>
              {t("sizeLine", { w: readout.w, h: readout.h, kb: readout.kb.toFixed(1) })}
            </span>
            <span className="ps-verdict" data-in={readout.inRange}>
              {readout.inRange
                ? t("inRange", { min: readout.spec.minKB, max: readout.spec.maxKB })
                : t("outRange", { min: readout.spec.minKB, max: readout.spec.maxKB })}
            </span>
          </p>
        )}

        {ready && <p className="ps-hint">{t("dragHint")}</p>}

        <div>
          <Button onClick={onDownload} disabled={!readout}>
            {t("download")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
