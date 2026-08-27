import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { normalizeUrl, type Item } from "@/lib/items";

export interface ItemEdit {
  url: string;
  why: string;
  title: string;
}

export function EditDialog({
  item,
  t,
  onOpenChange,
  onSave,
  onDelete,
  onError,
}: {
  item: Item | null;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Item, edit: ItemEdit) => void;
  onDelete: (item: Item) => void;
  onError: (message: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [why, setWhy] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!item) return;
    setUrl(item.url);
    setWhy(item.why);
    setTitle(item.title);
  }, [item]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!item) return;
    const raw = url.trim();
    if (!raw) {
      onError(t("needUrl"));
      return;
    }
    const normalized = normalizeUrl(raw);
    if (!normalized) {
      onError(t("badUrl"));
      return;
    }
    if (!why.trim()) {
      onError(t("needWhy"));
      return;
    }
    onSave(item, { url: normalized, why: why.trim(), title: title.trim() });
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} id="edit-dialog">
        <DialogHeader>
          <DialogTitle id="edit-form-title">{t("editTitle")}</DialogTitle>
        </DialogHeader>

        <form id="edit-form" className="grid gap-[0.55rem]" autoComplete="off" onSubmit={handleSubmit}>
          <label className="li-label">
            <span id="label-edit-url">{t("addUrl")}</span>
            <input
              id="edit-url"
              className="li-field"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          <label className="li-label">
            <span id="label-edit-why">{t("addWhy")}</span>
            <input
              id="edit-why"
              className="li-field"
              type="text"
              maxLength={200}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />
          </label>

          <label className="li-label">
            <span id="label-edit-title">{t("addTitleLabel")}</span>
            <input
              id="edit-title"
              className="li-field"
              type="text"
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <DialogFooter className="mt-[0.2rem]">
            <Button
              type="button"
              id="edit-delete"
              variant="destructive"
              size="sm"
              className="mr-auto"
              onClick={() => item && onDelete(item)}
            >
              {t("delete")}
            </Button>
            <Button
              type="button"
              id="edit-cancel"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" id="edit-save" size="sm">
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
