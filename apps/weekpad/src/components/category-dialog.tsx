import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { parseAmount } from "@/lib/currency";
import type { Translate } from "@/lib/i18n";
import type { Category } from "@/lib/store";

export interface CategoryDraft {
  name: string;
  plannedWeekly: number;
  recurring: boolean;
  archived: boolean;
}

/**
 * Add or edit one category: name, weekly amount, the recurring switch and
 * (when editing) archive and delete. Nothing is focused on open: the sheet
 * should be readable before the keyboard covers half of it.
 */
export function CategoryDialog({
  open,
  category,
  expenseCount,
  currencySymbol,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  category: Category | null;
  expenseCount: number;
  currencySymbol: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: CategoryDraft) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [planned, setPlanned] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [archived, setArchived] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setPlanned(category ? String(category.plannedWeekly) : "");
    setRecurring(category?.recurring ?? true);
    setArchived(category?.archived ?? false);
    setError("");
  }, [open, category]);

  function submit() {
    const trimmed = name.trim();
    const amount = planned.trim() === "" ? 0 : parseAmount(planned);
    if (!trimmed) {
      setError(t("nameLabel"));
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      setError(t("invalidAmount"));
      return;
    }
    onSave({ name: trimmed, plannedWeekly: amount, recurring, archived });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="category-dialog" className="gap-3">
        <DialogTitle className="wp-sheet-title pr-8">{category ? t("editCategoryTitle") : t("newCategoryTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("categoriesTitle")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="wp-field-label" htmlFor="cat-name">
              {t("nameLabel")}
            </label>
            <input
              id="cat-name"
              className="wp-input"
              type="text"
              autoComplete="off"
              enterKeyHint="next"
              maxLength={60}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="wp-field-label" htmlFor="cat-planned">
              {t("plannedLabel")}
            </label>
            <div className="wp-amount-wrap">
              <span className="wp-amount-sym" aria-hidden>
                {currencySymbol}
              </span>
              <input
                id="cat-planned"
                className="wp-input wp-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="0"
                value={planned}
                onChange={(e) => setPlanned(e.target.value)}
              />
            </div>
          </div>
          <label className="wp-toggle" htmlFor="cat-recurring">
            <span className="wp-toggle-text">
              <span className="wp-toggle-label">{t("recurringLabel")}</span>
              <span className="wp-toggle-hint">{recurring ? t("recurringHint") : t("oneOffHint")}</span>
            </span>
            <input id="cat-recurring" className="wp-switch" type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          </label>
          {category && (
            <label className="wp-toggle" htmlFor="cat-archived">
              <span className="wp-toggle-text">
                <span className="wp-toggle-label">{t("archivedLabel")}</span>
                <span className="wp-toggle-hint">{t("archivedHint")}</span>
              </span>
              <input id="cat-archived" className="wp-switch" type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            </label>
          )}
          {error && (
            <p className="wp-error" role="alert" id="cat-error">
              {error}
            </p>
          )}
          <div className="wp-actions">
            <button type="button" className="wp-btn wp-btn-quiet" id="cat-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="wp-btn wp-btn-primary" id="cat-save">
              {t("save")}
            </button>
            {category && (
              <button type="button" className="wp-btn wp-btn-danger col-span-2" id="cat-delete" onClick={onDelete}>
                {t("deleteCategory")} ({expenseCount})
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
