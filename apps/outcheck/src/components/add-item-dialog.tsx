import { useState } from "react";
import { Plus } from "lucide-react";

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

/** Add one custom item. No cap, no upgrade wall, no autofocus on the input. */
export function AddItemDialog({ t, onAdd }: { t: Translate; onAdd: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  function submit() {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setLabel("");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setLabel("");
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="oc-add" id="add-item">
          <Plus className="size-5" aria-hidden />
          {t("addItem")}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[1.05rem] font-bold text-ink">{t("addTitle")}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="oc-field-label" htmlFor="add-item-label">
            {t("labelLabel")}
          </label>
          <input
            id="add-item-label"
            className="oc-input"
            type="text"
            value={label}
            maxLength={80}
            placeholder={t("labelPlaceholder")}
            autoComplete="off"
            onChange={(e) => setLabel(e.target.value)}
          />
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" id="add-item-confirm" disabled={!label.trim()}>
              {t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
