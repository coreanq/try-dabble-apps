import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  message,
  cancelLabel,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} id="confirm-dialog" className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle id="confirm-text" className="pr-0 text-ink">
            {message}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="justify-end">
          <Button id="confirm-cancel" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button id="confirm-ok" variant="destructive" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
