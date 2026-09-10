import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { newId } from "@/lib/logs";
import type { Milestone, Route } from "@/lib/routes";
import { fromMiles, parseNumber, toMiles, type Unit } from "@/lib/units";

export interface RouteDraft {
  name: string;
  totalMiles: number;
  milestones: Milestone[];
}

interface MsRow {
  id: string;
  name: string;
  at: string;
}

function fmt(miles: number, unit: Unit): string {
  return String(Math.round(fromMiles(miles, unit) * 100) / 100);
}

/**
 * Create or edit one of the reader's own routes: a name, the total distance
 * in the chosen unit, and any number of milestones (name + distance from the
 * start). Everything is converted to miles on save.
 */
export function RouteDialog({
  open,
  route,
  unit,
  unitLabel,
  logCount,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  route: Route | null;
  unit: Unit;
  unitLabel: string;
  logCount: number;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: RouteDraft) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [rows, setRows] = useState<MsRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (route) {
      setName(typeof route.name === "string" ? route.name : route.name.en);
      setTotal(fmt(route.totalMiles, unit));
      setRows(
        route.milestones.map((m) => ({
          id: m.id,
          name: typeof m.name === "string" ? m.name : m.name.en,
          at: fmt(m.milesFromStart, unit),
        })),
      );
    } else {
      setName("");
      setTotal("");
      setRows([]);
    }
    setError("");
  }, [open, route, unit]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("invalidRouteName"));
      return;
    }
    const n = parseNumber(total);
    if (Number.isNaN(n) || n <= 0) {
      setError(t("invalidRouteDistance"));
      return;
    }
    const totalMiles = toMiles(n, unit);
    const milestones: Milestone[] = [];
    for (const r of rows) {
      const label = r.name.trim();
      if (!label && !r.at.trim()) continue;
      const at = parseNumber(r.at);
      if (!label || Number.isNaN(at) || at < 0 || toMiles(at, unit) > totalMiles) {
        setError(t("invalidMilestone"));
        return;
      }
      milestones.push({ id: r.id, milesFromStart: toMiles(at, unit), name: label.slice(0, 60) });
    }
    milestones.sort((a, b) => a.milesFromStart - b.milesFromStart);
    onSave({ name: trimmed.slice(0, 60), totalMiles, milestones });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="route-dialog" className="max-h-[92dvh] gap-3 overflow-y-auto">
        <DialogTitle className="tq-sheet-title pr-8">{route ? t("editRouteTitle") : t("newRouteTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("routesHint")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="tq-field-label" htmlFor="route-name">
              {t("routeNameLabel")}
            </label>
            <input
              id="route-name"
              className="tq-input"
              type="text"
              autoComplete="off"
              maxLength={60}
              placeholder={t("routeNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="tq-field-label" htmlFor="route-total">
              {t("totalDistanceLabel")}
            </label>
            <div className="tq-amount-wrap">
              <input
                id="route-total"
                className="tq-input tq-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
              <span className="tq-amount-unit" aria-hidden>
                {unitLabel}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <span className="tq-field-label m-0">{t("milestonesLabel")}</span>
            <p className="tq-hint">{t("milestonesHint")}</p>
            {rows.map((r, i) => (
              <div key={r.id} className="tq-ms-row" data-ms-row={i}>
                <div>
                  <label className="sr-only" htmlFor={`ms-name-${r.id}`}>
                    {t("milestoneNameLabel")}
                  </label>
                  <input
                    id={`ms-name-${r.id}`}
                    className="tq-input"
                    type="text"
                    autoComplete="off"
                    maxLength={60}
                    placeholder={t("milestoneNamePlaceholder")}
                    value={r.name}
                    onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`ms-at-${r.id}`}>
                    {t("milestoneAtLabel")}
                  </label>
                  <input
                    id={`ms-at-${r.id}`}
                    className="tq-input"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={`${t("milestoneAtLabel")} (${unitLabel})`}
                    value={r.at}
                    onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, at: e.target.value } : x)))}
                  />
                </div>
                <button
                  type="button"
                  className="tq-btn tq-btn-icon"
                  aria-label={t("removeMilestone")}
                  onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            <button type="button" className="tq-btn tq-btn-quiet" id="add-milestone" onClick={() => setRows((rs) => [...rs, { id: newId(), name: "", at: "" }])}>
              <Plus className="size-4" aria-hidden />
              {t("addMilestone")}
            </button>
          </div>
          {error && (
            <p className="tq-error" role="alert" id="route-error">
              {error}
            </p>
          )}
          <div className="tq-actions">
            <button type="button" className="tq-btn tq-btn-quiet" id="route-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="tq-btn tq-btn-primary" id="route-save">
              {t("save")}
            </button>
            {route && (
              <button type="button" className="tq-btn tq-btn-danger col-span-2" id="route-delete" onClick={onDelete}>
                {t("deleteRoute")} {logCount > 0 ? `(${logCount})` : ""}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
