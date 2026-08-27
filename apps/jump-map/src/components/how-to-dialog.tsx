import { useState } from "react";
import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";

/** shadcn's dialog, re-dressed as the cabinet's pause screen. */
export function HowToDialog({ t }: { t: Translate }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="pj-btn">
          <HelpCircle aria-hidden="true" />
          {t("howTo")}
        </Button>
      </DialogTrigger>
      <DialogContent className="pj-dialog" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="pj-dialog-title">{t("howTo")}</DialogTitle>
          <DialogDescription className="pj-prose">{t("howToGoal")}</DialogDescription>
        </DialogHeader>
        <div className="pj-prose">
          <p>{t("howToKeys")}</p>
          <p>{t("howToTouch")}</p>
          <p>{t("howToMenu")}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" className="pj-btn">
              {t("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
