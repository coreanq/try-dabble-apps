import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { isDateStr } from "@/lib/dates";
import type { Translate } from "@/lib/i18n";
import type { LogEntry } from "@/lib/logs";
import { fromMiles, parseNumber, toMiles, type Unit } from "@/lib/units";

export interface LogDraft {
  miles: number;
  date: string;
  note: string;
}

/** Edit one log entry, or delete it. Distance is shown in the reader's unit. */
export function LogDialog({
  open,
  entry,
  unit,
  unitLabel,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  entry: LogEntry | null;
  unit: Unit;
  unitLabel: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: LogDraft) => void;
  onDelete: () => void;
}) {
  const [distance, setDistance] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !entry) return;
    setDistance(String(Math.round(fromMiles(entry.miles, unit) * 100) / 100));
    setNote(entry.note ?? "");
    setDate(entry.date);
    setError("");
  }, [open, entry, unit]);

  function submit() {
    const n = parseNumber(distance);
    if (Number.isNaN(n) || n <= 0) {
      setError(t("invalidDistance"));
      return;
    }
    if (!isDateStr(date)) {
      setError(t("invalidDate"));
      return;
    }
    onSave({ miles: toMiles(n, unit), date, note: note.trim() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="log-dialog" className="gap-3">
        <DialogTitle className="tq-sheet-title pr-8">{t("editLog")}</DialogTitle>
        <DialogDescription className="sr-only">{t("historyHint")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="tq-field-label" htmlFor="log-distance">
              {t("distanceLabel")}
            </label>
            <div className="tq-amount-wrap">
              <input
                id="log-distance"
                className="tq-input tq-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
              <span className="tq-amount-unit" aria-hidden>
                {unitLabel}
              </span>
            </div>
          </div>
          <div className="tq-two">
            <div>
              <label className="tq-field-label" htmlFor="log-note">
                {t("noteLabel")}
              </label>
              <input
                id="log-note"
                className="tq-input"
                type="text"
                autoComplete="off"
                maxLength={140}
                placeholder={t("notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div>
              <label className="tq-field-label" htmlFor="log-date">
                {t("dateLabel")}
              </label>
              <input id="log-date" className="tq-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {error && (
            <p className="tq-error" role="alert" id="log-error">
              {error}
            </p>
          )}
          <div className="tq-actions">
            <button type="button" className="tq-btn tq-btn-quiet" id="log-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="tq-btn tq-btn-primary" id="log-save">
              {t("save")}
            </button>
            <button type="button" className="tq-btn tq-btn-danger col-span-2" id="log-delete" onClick={onDelete}>
              {t("deleteLog")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
