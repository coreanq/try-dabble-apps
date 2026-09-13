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
        <DialogTitle className="gm-sheet-title">{title}</DialogTitle>
        <DialogDescription className="gm-hint text-[0.95rem]">{body}</DialogDescription>
        <div className="gm-actions">
          <button type="button" className="gm-btn gm-btn-quiet" id="confirm-cancel" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={"gm-btn " + (destructive ? "gm-btn-danger" : "gm-btn-primary")}
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
