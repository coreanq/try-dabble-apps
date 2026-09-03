import type { ReactNode } from "react";

import type { Translate } from "@/lib/i18n";

/**
 * The plastic body. Sprocket strip down the left, black grip down the right,
 * a small finder window, the embossed name, the round frame counter and the
 * knurled advance wheel across the top plate; the viewfinder in the middle;
 * the frames-left readout and the red shutter under the thumb along the
 * bottom. The counter is always visible — it IS the feedback after a shot.
 */
export function CameraBody({
  t,
  framesLeft,
  capacity,
  modeTag,
  shutterDisabled,
  onShutter,
  spinning,
  children,
}: {
  t: Translate;
  framesLeft: number;
  capacity: number;
  modeTag: string;
  shutterDisabled: boolean;
  onShutter: () => void;
  spinning: boolean;
  children: ReactNode;
}) {
  return (
    <section className="sr-camera" id="camera" aria-label={t("cameraTitle")}>
      <div className="sr-sprocket" aria-hidden />
      <div className="sr-topplate">
        <span className="sr-finder-window" aria-hidden />
        <span className="sr-emboss" aria-hidden>
          Slowroll · {capacity}
        </span>
        <div className="sr-dial" role="status" aria-label={t("counterLabel")} id="frame-dial">
          <span className="sr-dial-num" id="frame-dial-num" data-low={framesLeft <= 3}>
            {framesLeft}
          </span>
        </div>
        <span className="sr-wheel" data-spin={spinning} aria-hidden />
      </div>

      <div className="sr-finder" id="finder">
        {children}
      </div>

      <div className="sr-bottomplate">
        <div className="sr-filminfo">
          <span className="sr-left" id="frames-left">
            {t("framesLeft", { n: framesLeft })}
          </span>
          <span className="sr-modetag" id="mode-tag">
            {modeTag}
          </span>
        </div>
        <button
          type="button"
          className="sr-shutter"
          id="shutter"
          disabled={shutterDisabled}
          aria-disabled={shutterDisabled}
          aria-label={t("shutter")}
          onClick={onShutter}
        >
          <span className="sr-shutter-cap" aria-hidden />
          <span className="sr-shutter-label">{t("shutter")}</span>
        </button>
      </div>
    </section>
  );
}
