import { forwardRef } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, RotateCcw, Undo2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { progress } from "@/lib/practice";
import type { Affirmation, Category } from "@/lib/store";

/**
 * The practice stage: one sentence set big, the count, the round tap button,
 * undo / reset, previous / next, and the fullscreen switch. The same element
 * is what goes fullscreen (Fullscreen API on this Card, or the CSS immersive
 * fallback via data-immersive), so the count never moves between two trees.
 */
export const PracticeCard = forwardRef<HTMLDivElement, {
  t: Translate;
  affirmation: Affirmation | null;
  category: Category | null;
  taps: number;
  goal: number;
  immersive: boolean;
  fullscreen: boolean;
  canNavigate: boolean;
  onTap: () => void;
  onUndo: () => void;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
}>(function PracticeCard(
  { t, affirmation, category, taps, goal, immersive, fullscreen, canNavigate, onTap, onUndo, onReset, onPrev, onNext, onToggleFullscreen },
  ref,
) {
  const ratio = progress(taps, goal);
  const done = affirmation !== null && goal > 0 && taps >= goal;
  return (
    <Card id="practice" className="ap-stage" size="sm" ref={ref} data-immersive={immersive ? "true" : "false"}>
      <CardContent className="grid gap-3">
        <div className="ap-card-head">
          <h2 className="ap-sheet-title m-0">{t("practiceTitle")}</h2>
          <button type="button" className="ap-btn ap-btn-quiet" id="fullscreen-enter" onClick={onToggleFullscreen} disabled={!affirmation}>
            <Maximize className="size-4" aria-hidden />
            {t("fullscreen")}
          </button>
        </div>
        {affirmation ? (
          <div className="ap-practice">
            {category && (
              <span className="ap-practice-topic" id="practice-topic" style={{ ["--ap-cat-color" as string]: category.color ?? "#a78bfa" }}>
                <span className="ap-badge-dot" aria-hidden />
                {category.name}
              </span>
            )}
            <p className="ap-practice-text" id="practice-text">
              {affirmation.text}
            </p>
            <div className="ap-count" aria-live="polite">
              <span className="ap-count-num" id="tap-count">
                {taps}
              </span>
              <span className="ap-count-label">
                {t("countLabel")} · {t("goalOf", { goal })}
              </span>
            </div>
            <div className="ap-rail" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} aria-label={t("goalOf", { goal })}>
              <div className="ap-rail-fill" data-done={done ? "true" : "false"} style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
            {done && (
              <p className="ap-hint font-extrabold text-lav-deep" id="goal-reached">
                {t("goalReached")}
              </p>
            )}
            <button type="button" className="ap-tap" id="tap" onClick={onTap} aria-label={t("tap")}>
              {t("tap")}
            </button>
            <div className="ap-practice-row">
              <button type="button" className="ap-btn ap-btn-quiet" id="undo" onClick={onUndo} disabled={taps === 0}>
                <Undo2 className="size-4" aria-hidden />
                {t("undo")}
              </button>
              <button type="button" className="ap-btn ap-btn-quiet" id="reset-count" onClick={onReset} disabled={taps === 0}>
                <RotateCcw className="size-4" aria-hidden />
                {t("resetCount")}
              </button>
              {(fullscreen || immersive) && (
                <button type="button" className="ap-btn ap-btn-quiet" id="fullscreen-exit" onClick={onToggleFullscreen}>
                  <Minimize className="size-4" aria-hidden />
                  {t("exitFullscreen")}
                </button>
              )}
            </div>
            <div className="ap-practice-nav">
              <button type="button" className="ap-btn ap-btn-icon" id="prev-affirmation" aria-label={t("prevAffirmation")} onClick={onPrev} disabled={!canNavigate}>
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <span className="ap-practice-meta" id="practice-total">
                {t("practicedTimes", { n: affirmation.practiceCount ?? 0 })}
              </span>
              <button type="button" className="ap-btn ap-btn-icon" id="next-affirmation" aria-label={t("nextAffirmation")} onClick={onNext} disabled={!canNavigate}>
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <div className="ap-empty" id="practice-empty">
            <p className="ap-empty-title">{t("practiceEmptyTitle")}</p>
            <p className="ap-hint">{t("practiceEmptyBody")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
