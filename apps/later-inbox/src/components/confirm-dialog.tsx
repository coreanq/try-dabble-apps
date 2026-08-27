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
      <DialogContent showCloseButton={false} id="confirm-dialog">
        <DialogHeader>
          <DialogTitle id="confirm-text">{message}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button
            id="confirm-cancel"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
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
