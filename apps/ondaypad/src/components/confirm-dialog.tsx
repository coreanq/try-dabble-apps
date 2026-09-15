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
        <DialogTitle className="od-dialog-title">{title}</DialogTitle>
        <DialogDescription className="od-hint text-[0.95rem]">{body}</DialogDescription>
        <div className="od-actions">
          <button type="button" className="od-btn od-btn-quiet" id="confirm-cancel" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={"od-btn " + (destructive ? "od-btn-danger" : "od-btn-primary")}
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
