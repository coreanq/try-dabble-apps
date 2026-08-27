import { Bot, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GameMode } from "@/lib/gomoku";
import type { Translate } from "@/lib/i18n";

/**
 * The opening screen. It has no dismiss: a game only starts once a mode is
 * picked, exactly as the pre-Vite overlay behaved, so escape and a click on
 * the paper behind it are both ignored.
 */
export function ModeDialog({
  open,
  t,
  onPick,
}: {
  open: boolean;
  t: Translate;
  onPick: (mode: GameMode) => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="gb-result-title text-center">{t("title")}</DialogTitle>
          <DialogDescription className="text-center">{t("modeSubtitle")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2.5">
          <button type="button" className="gb-mode-key" onClick={() => onPick("ai")}>
            <Bot className="gb-mode-glyph text-walnut" strokeWidth={1.4} />
            <span className="min-w-0">
              <b>{t("vsAi")}</b>
              <small>{t("vsAiDesc")}</small>
            </span>
          </button>
          <button type="button" className="gb-mode-key" onClick={() => onPick("pvp")}>
            <Users className="gb-mode-glyph text-walnut" strokeWidth={1.4} />
            <span className="min-w-0">
              <b>{t("vsPvp")}</b>
              <small>{t("vsPvpDesc")}</small>
            </span>
          </button>
        </div>
        <p className="gb-badge mx-auto">{t("freeBadge")}</p>
      </DialogContent>
    </Dialog>
  );
}
