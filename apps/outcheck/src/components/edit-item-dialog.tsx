import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";

/**
 * Rename, move up / down, remove. Works the same for the three starter rows
 * and for anything the user added; nothing here is gated.
 */
export function EditItemDialog({
  open,
  label,
  canMoveUp,
  canMoveDown,
  t,
  onOpenChange,
  onRename,
  onMove,
  onRemove,
}: {
  open: boolean;
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onRename: (label: string) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(label);

  useEffect(() => {
    if (open) setDraft(label);
  }, [open, label]);

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed !== label) onRename(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[1.05rem] font-bold text-ink">{t("editTitle")}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="oc-field-label" htmlFor="edit-item-label">
            {t("rename")}
          </label>
          <input
            id="edit-item-label"
            className="oc-input"
            type="text"
            value={draft}
            maxLength={80}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
          />

          <div className="mt-1 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              id="edit-move-up"
              disabled={!canMoveUp}
              onClick={() => onMove(-1)}
            >
              <ArrowUp aria-hidden />
              {t("moveUp")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              id="edit-move-down"
              disabled={!canMoveDown}
              onClick={() => onMove(1)}
            >
              <ArrowDown aria-hidden />
              {t("moveDown")}
            </Button>
            <Button type="button" variant="destructive" id="edit-remove" onClick={onRemove}>
              <Trash2 aria-hidden />
              {t("remove")}
            </Button>
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" id="edit-save" disabled={!draft.trim()}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
