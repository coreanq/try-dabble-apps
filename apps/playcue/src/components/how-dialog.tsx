import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";

/** The four-step promise, spelled out: it stops, and only a tap moves on. */
export function HowDialog({ t }: { t: Translate }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" id="how-open">
          <HelpCircle className="size-4" aria-hidden />
          {t("howTitle")}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-heading text-[1.1rem] font-bold text-stage-ink">
            {t("howTitle")}
          </DialogTitle>
        </DialogHeader>
        <ol className="m-0 grid list-none gap-[0.55rem] p-0 text-[0.88rem] leading-6 text-stage-ink">
          {(["how1", "how2", "how3", "how4"] as const).map((key) => (
            <li key={key} className="border-l-2 border-amber/60 pl-[0.6rem]">
              {t(key)}
            </li>
          ))}
        </ol>
        <p className="m-0 text-[0.78rem] text-stage-muted">{t("howWho")}</p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t("close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
