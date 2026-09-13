import { Bone, Droplets, FastForward, Gamepad2, Hand } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import type { CareAction } from "@/lib/needs";

/**
 * The care loop: four big buttons, always enabled, always free. Skip 1 hour
 * is the demo fast-forward so the drift can be seen without waiting.
 */
export function CareCard({
  t,
  decayPaused,
  onAction,
  onSkipHour,
  onTogglePause,
}: {
  t: Translate;
  decayPaused: boolean;
  onAction: (action: CareAction) => void;
  onSkipHour: () => void;
  onTogglePause: (paused: boolean) => void;
}) {
  return (
    <Card id="care-card" size="sm">
      <CardHeader>
        <CardTitle>{t("careTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="pp-care-grid">
          <button type="button" className="pp-care pp-care-feed" id="action-feed" onClick={() => onAction("feed")}>
            <Bone className="size-6" aria-hidden />
            {t("feed")}
          </button>
          <button type="button" className="pp-care pp-care-play" id="action-play" onClick={() => onAction("play")}>
            <Gamepad2 className="size-6" aria-hidden />
            {t("play")}
          </button>
          <button type="button" className="pp-care pp-care-pet" id="action-pet" onClick={() => onAction("pet")}>
            <Hand className="size-6" aria-hidden />
            {t("pet")}
          </button>
          <button type="button" className="pp-care pp-care-clean" id="action-clean" onClick={() => onAction("clean")}>
            <Droplets className="size-6" aria-hidden />
            {t("clean")}
          </button>
        </div>
        <div className="pp-setting-row">
          <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" id="skip-hour" onClick={onSkipHour}>
            <FastForward className="size-4" aria-hidden />
            {t("fastForward")}
          </button>
          <label className="pp-toggle" htmlFor="pause-decay">
            <input id="pause-decay" type="checkbox" checked={decayPaused} onChange={(e) => onTogglePause(e.target.checked)} />
            <span>{t("pauseDecay")}</span>
          </label>
        </div>
        <p className="pp-hint">
          {t("fastForwardHint")} {t("pauseDecayHint")}
        </p>
      </CardContent>
    </Card>
  );
}
