import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function RenameDialog({
  open,
  title,
  label,
  initial,
  saveLabel,
  cancelLabel,
  onSave,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  label: string;
  initial: string;
  saveLabel: string;
  cancelLabel: string;
  onSave: (name: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);
  const submit = () => {
    if (!value.trim()) return;
    onSave(value.trim());
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="rename-dialog" showCloseButton={false}>
        <DialogTitle className="rp-sheet-title">{title}</DialogTitle>
        <DialogDescription className="sr-only">{label}</DialogDescription>
        <label className="rp-label" htmlFor="rename-input">
          {label}
          <input
            id="rename-input"
            className="rp-input"
            value={value}
            autoComplete="off"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </label>
        <div className="rp-actions">
          <button type="button" className="rp-btn rp-btn-quiet" id="rename-cancel" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </button>
          <button type="button" className="rp-btn rp-btn-primary" id="rename-ok" onClick={submit} disabled={!value.trim()}>
            {saveLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
