import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = true,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="confirm-dialog" showCloseButton={false}>
        <DialogTitle className="tq-sheet-title">{title}</DialogTitle>
        <DialogDescription className="tq-hint text-[0.95rem]">{body}</DialogDescription>
        <div className="tq-actions">
          <button type="button" className="tq-btn tq-btn-quiet" id="confirm-cancel" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={"tq-btn " + (destructive ? "tq-btn-danger" : "tq-btn-primary")}
            id="confirm-ok"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
