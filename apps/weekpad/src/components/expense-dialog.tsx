import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { parseAmount } from "@/lib/currency";
import type { Translate } from "@/lib/i18n";
import type { Category, Expense } from "@/lib/store";
import { isDateStr } from "@/lib/week";

export interface ExpenseDraft {
  amount: number;
  categoryId: string;
  note: string;
  date: string;
}

/** Edit one logged expense, or delete it. */
export function ExpenseDialog({
  open,
  expense,
  categories,
  currencySymbol,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  expense: Expense | null;
  categories: Category[];
  currencySymbol: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: ExpenseDraft) => void;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !expense) return;
    setAmount(String(expense.amount));
    setCategoryId(expense.categoryId);
    setNote(expense.note ?? "");
    setDate(expense.date);
    setError("");
  }, [open, expense]);

  // The picker lists live categories plus the one this expense already uses,
  // even if that one has since been archived.
  const options = categories.filter((c) => !c.archived || c.id === categoryId);

  function submit() {
    const n = parseAmount(amount);
    if (Number.isNaN(n)) {
      setError(t("invalidAmount"));
      return;
    }
    if (!categoryId) {
      setError(t("pickCategory"));
      return;
    }
    if (!isDateStr(date)) {
      setError(t("dateLabel"));
      return;
    }
    onSave({ amount: n, categoryId, note: note.trim(), date });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="expense-dialog" className="gap-3">
        <DialogTitle className="wp-sheet-title pr-8">{t("editExpense")}</DialogTitle>
        <DialogDescription className="sr-only">{t("expensesTitle")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="wp-field-label" htmlFor="exp-amount">
              {t("amountLabel")}
            </label>
            <div className="wp-amount-wrap">
              <span className="wp-amount-sym" aria-hidden>
                {currencySymbol}
              </span>
              <input
                id="exp-amount"
                className="wp-input wp-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="wp-field-label" htmlFor="exp-category">
              {t("categoryLabel")}
            </label>
            <select id="exp-category" className="wp-select-block" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {!options.some((c) => c.id === categoryId) && <option value={categoryId}>{t("unknownCategory")}</option>}
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="wp-two">
            <div>
              <label className="wp-field-label" htmlFor="exp-note">
                {t("noteLabel")}
              </label>
              <input
                id="exp-note"
                className="wp-input"
                type="text"
                autoComplete="off"
                maxLength={140}
                placeholder={t("notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div>
              <label className="wp-field-label" htmlFor="exp-date">
                {t("dateLabel")}
              </label>
              <input id="exp-date" className="wp-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {error && (
            <p className="wp-error" role="alert" id="exp-error">
              {error}
            </p>
          )}
          <div className="wp-actions">
            <button type="button" className="wp-btn wp-btn-quiet" id="exp-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="wp-btn wp-btn-primary" id="exp-save">
              {t("save")}
            </button>
            <button type="button" className="wp-btn wp-btn-danger col-span-2" id="exp-delete" onClick={onDelete}>
              {t("deleteExpense")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
