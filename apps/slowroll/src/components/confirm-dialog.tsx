import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Every destructive or wait-skipping action goes through this: finish roll,
 * discard the WHOLE roll, develop early. Nothing happens until confirm.
 */
export function ConfirmDialog({
  open,
  id,
  title,
  body,
  cancelLabel,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  id: string;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} id={id}>
        <DialogHeader>
          <DialogTitle className="text-[1.05rem] font-bold text-[var(--sr-fg)]">{title}</DialogTitle>
          <DialogDescription className="text-[0.9rem] leading-6 text-[var(--sr-fg-muted)]">
            {body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{cancelLabel}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} id={`${id}-confirm`}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
