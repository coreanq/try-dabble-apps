import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { padNum, type Box } from "@/lib/boxes";
import type { Translate } from "@/lib/i18n";

export function DeleteDialog({
  t,
  pending,
  onOpenChange,
  onConfirm,
}: {
  t: Translate;
  pending: Box | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={pending != null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle id="confirm-text">{t("deleteConfirm")}</DialogTitle>
        </DialogHeader>
        {pending && (
          <p className="bq-meta">
            {t("boxNumber", { n: padNum(pending.number) })}
            {pending.room ? ` · ${pending.room}` : ""}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            id="confirm-cancel"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" variant="destructive" id="confirm-ok" onClick={onConfirm}>
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
