import { Card } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/**
 * shadcn's card, re-dressed as the cabinet bezel. The canvas keeps its
 * id and its 960x540 backing store: the engine grabs #game-canvas the moment
 * it evaluates and paints at that resolution, and CSS scales it up with
 * pixelated rendering.
 */
export function GameCabinet({ t, ready }: { t: Translate; ready: boolean }) {
  return (
    <div className="pj-stage">
      <Card className="pj-cabinet">
        <span className="pj-rivet pj-rivet-tl" aria-hidden="true" />
        <span className="pj-rivet pj-rivet-tr" aria-hidden="true" />
        <span className="pj-rivet pj-rivet-bl" aria-hidden="true" />
        <span className="pj-rivet pj-rivet-br" aria-hidden="true" />
        <div className="pj-screen">
          <canvas id="game-canvas" width={960} height={540} aria-label={t("title")} />
          {ready ? null : <div className="pj-loading">{t("loading")}</div>}
        </div>
        <div className="pj-deck">
          <span className="pj-deck-item">
            <kbd className="pj-cap">←</kbd>
            <kbd className="pj-cap">→</kbd>
            {t("keyMove")}
          </span>
          <span className="pj-deck-item">
            <kbd className="pj-cap">SPACE</kbd>
            {t("keyJump")}
          </span>
          <span className="pj-deck-item">
            <kbd className="pj-cap">M</kbd>
            {t("keyMenu")}
          </span>
          <span className="pj-deck-item">
            <kbd className="pj-cap">S</kbd>
            {t("keyShop")}
          </span>
        </div>
      </Card>
    </div>
  );
}
