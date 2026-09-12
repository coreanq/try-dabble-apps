import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { TEXT_MAX, type Affirmation, type Category } from "@/lib/store";

export interface AffirmationDraft {
  text: string;
  categoryId: string;
}

/**
 * Add or edit one affirmation: the sentence and an optional topic. Nothing
 * is focused on open: the sheet should be readable before the keyboard
 * covers half of it.
 */
export function AffirmationDialog({
  open,
  affirmation,
  categories,
  defaultCategoryId,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  affirmation: Affirmation | null;
  categories: Category[];
  defaultCategoryId: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: AffirmationDraft) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setText(affirmation?.text ?? "");
    setCategoryId(affirmation?.categoryId ?? defaultCategoryId);
    setError("");
  }, [open, affirmation, defaultCategoryId]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t("needText"));
      return;
    }
    onSave({ text: trimmed.slice(0, TEXT_MAX), categoryId });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="affirmation-dialog" className="gap-3">
        <DialogTitle className="ap-sheet-title pr-8">{affirmation ? t("editAffirmationTitle") : t("newAffirmationTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("listTitle")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="ap-field-label" htmlFor="aff-text">
              {t("textLabel")}
            </label>
            <textarea
              id="aff-text"
              className="ap-textarea"
              rows={3}
              maxLength={TEXT_MAX}
              autoComplete="off"
              enterKeyHint="done"
              placeholder={t("textPlaceholder")}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError("");
              }}
            />
          </div>
          <div>
            <label className="ap-field-label" htmlFor="aff-category">
              {t("categoryLabel")}
            </label>
            <select id="aff-category" className="ap-select-block" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t("noCategory")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="ap-error" role="alert" id="aff-error">
              {error}
            </p>
          )}
          <div className="ap-actions">
            <button type="button" className="ap-btn ap-btn-quiet" id="aff-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="ap-btn ap-btn-primary" id="aff-save">
              {t("save")}
            </button>
            {affirmation && (
              <button type="button" className="ap-btn ap-btn-danger col-span-2" id="aff-delete" onClick={onDelete}>
                {t("delete")}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
