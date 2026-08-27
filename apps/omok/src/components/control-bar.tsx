import { RotateCcw, Undo2, Users, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Difficulty, GameMode } from "@/lib/gomoku";
import type { Translate } from "@/lib/i18n";

const LEVELS: Difficulty[] = ["easy", "medium", "hard"];

/**
 * Everything you reach for while playing: the three difficulty grooves in AI
 * mode (a 2-player badge instead), then undo, sound, restart and mode.
 */
export function ControlBar({
  mode,
  difficulty,
  soundEnabled,
  canUndo,
  t,
  onDifficulty,
  onUndo,
  onToggleSound,
  onRestart,
  onChangeMode,
}: {
  mode: GameMode;
  difficulty: Difficulty;
  soundEnabled: boolean;
  canUndo: boolean;
  t: Translate;
  onDifficulty: (next: Difficulty) => void;
  onUndo: () => void;
  onToggleSound: () => void;
  onRestart: () => void;
  onChangeMode: () => void;
}) {
  return (
    <div className="gb-controls">
      {mode === "ai" ? (
        <div className="gb-group">
          <span className="gb-field-label">{t("difficulty")}</span>
          <div className="gb-diff" role="group" aria-label={t("difficulty")}>
            {LEVELS.map((level) => (
              <Button
                key={level}
                size="sm"
                variant={difficulty === level ? "default" : "secondary"}
                aria-pressed={difficulty === level}
                onClick={() => onDifficulty(level)}
              >
                {t(level)}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <span className="gb-badge">
          <Users className="size-3.5" aria-hidden="true" />
          {t("vsPvp")}
        </span>
      )}

      <div className="gb-group">
        <Button size="sm" variant="secondary" onClick={onUndo} disabled={!canUndo} title={t("undo")}>
          <Undo2 aria-hidden="true" />
          {t("undo")}
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          title={soundEnabled ? t("soundOff") : t("soundOn")}
        >
          {soundEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          <span className="sr-only">{soundEnabled ? t("soundOff") : t("soundOn")}</span>
        </Button>
        <Button size="sm" onClick={onRestart} title={t("restart")}>
          <RotateCcw aria-hidden="true" />
          {t("restart")}
        </Button>
        <Button size="sm" variant="outline" onClick={onChangeMode}>
          {t("mode")}
        </Button>
      </div>
    </div>
  );
}
