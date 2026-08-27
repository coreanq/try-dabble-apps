import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GameMode, Outcome } from "@/lib/gomoku";
import type { Translate } from "@/lib/i18n";

/**
 * How a game ends: the winning stone, the result, the move count, and the
 * three ways on from there — study the board, play again, or change mode.
 * Closing it (escape, the X) is the same as choosing to review.
 */
export function ResultDialog({
  open,
  outcome,
  mode,
  moveCount,
  t,
  onReview,
  onRestart,
  onChangeMode,
}: {
  open: boolean;
  outcome: Outcome | null;
  mode: GameMode;
  moveCount: number;
  t: Translate;
  onReview: () => void;
  onRestart: () => void;
  onChangeMode: () => void;
}) {
  if (!outcome) return null;

  const title =
    outcome === "draw" ? t("draw") : outcome === "black" ? t("blackWins") : t("whiteWins");
  const subtitle =
    outcome === "draw"
      ? t("goodGame")
      : outcome === "white" && mode === "ai"
        ? t("tryNextTime")
        : t("congratulations");

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onReview(); }}>
      <DialogContent>
        <DialogHeader className="items-center">
          <div className="mx-auto">
            {outcome === "draw" ? (
              <span className="gb-draw-glyph">引分</span>
            ) : (
              <span className="gb-stone" data-color={outcome} data-size="lg" />
            )}
          </div>
          <DialogTitle className="gb-result-title text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">{subtitle}</DialogDescription>
        </DialogHeader>
        <p className="gb-badge mx-auto">{t("totalMoves", { n: moveCount })}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onChangeMode}>
            {t("changeMode")}
          </Button>
          <Button variant="secondary" onClick={onReview}>
            {t("reviewBoard")}
          </Button>
          <Button onClick={onRestart}>{t("restart")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
