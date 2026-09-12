import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, NOTES_MAX, UNIT_LABELS, type Compound } from "@/lib/model";

export interface CompoundDraft {
  name: string;
  unitLabel: string;
  defaultDose?: number;
  halfLifeHours?: number;
  notes?: string;
}

/** Add or edit one compound. Unlimited, free; the half-life field is optional and only feeds the estimate card. */
export function CompoundDialog({
  open,
  compound,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  compound: Compound | null;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: CompoundDraft) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("mcg");
  const [dose, setDose] = useState("");
  const [halfLife, setHalfLife] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(compound?.name ?? "");
    setUnit(compound?.unitLabel ?? "mcg");
    setDose(compound?.defaultDose !== undefined ? String(compound.defaultDose) : "");
    setHalfLife(compound?.halfLifeHours !== undefined ? String(compound.halfLifeHours) : "");
    setNotes(compound?.notes ?? "");
    setError("");
  }, [open, compound]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return setError(t("needName"));
    const draft: CompoundDraft = { name: trimmed.slice(0, NAME_MAX), unitLabel: unit };
    const d = Number(dose);
    if (dose !== "" && Number.isFinite(d) && d > 0) draft.defaultDose = d;
    const h = Number(halfLife);
    if (halfLife !== "" && Number.isFinite(h) && h > 0) draft.halfLifeHours = h;
    const n = notes.trim();
    if (n) draft.notes = n.slice(0, NOTES_MAX);
    onSave(draft);
    onOpenChange(false);
  }
  const clean = (s: string) => s.replace(/[^\d.]/g, "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="compound-dialog" className="gap-3 max-h-[92dvh] overflow-y-auto">
        <DialogTitle className="pl-sheet-title pr-8">{compound ? t("editCompoundTitle") : t("newCompoundTitle")}</DialogTitle>
        <DialogDescription className="pl-hint">{t("unlimitedHint")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="pl-field-label" htmlFor="cmp-name">
              {t("nameLabel")}
            </label>
            <Input id="cmp-name" maxLength={NAME_MAX} autoComplete="off" enterKeyHint="done" placeholder={t("namePlaceholder")} value={name} onChange={(e) => { setName(e.target.value); if (error) setError(""); }} />
          </div>
          <div className="pl-grid-2">
            <div>
              <label className="pl-field-label" htmlFor="cmp-unit">
                {t("defaultUnitLabel")}
              </label>
              <Select id="cmp-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNIT_LABELS.map((u) => (
                  <SelectOption key={u} value={u}>
                    {u}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <label className="pl-field-label" htmlFor="cmp-dose">
                {t("defaultDoseLabel")}
              </label>
              <Input id="cmp-dose" inputMode="decimal" autoComplete="off" value={dose} onChange={(e) => setDose(clean(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="pl-field-label" htmlFor="cmp-halflife">
              {t("halfLifeLabel")}
            </label>
            <Input id="cmp-halflife" inputMode="decimal" autoComplete="off" value={halfLife} onChange={(e) => setHalfLife(clean(e.target.value))} />
            <p className="pl-hint mt-1">{t("halfLifeFieldHint")}</p>
          </div>
          <div>
            <label className="pl-field-label" htmlFor="cmp-notes">
              {t("compoundNotesLabel")}
            </label>
            <textarea id="cmp-notes" className="pl-textarea" rows={2} maxLength={NOTES_MAX} autoComplete="off" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && (
            <p className="pl-error" role="alert" id="cmp-error">
              {error}
            </p>
          )}
          <div className="pl-actions">
            <button type="button" className="pl-btn pl-btn-quiet" id="cmp-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="pl-btn pl-btn-primary" id="cmp-save">
              {t("save")}
            </button>
            {compound && (
              <button type="button" className="pl-btn pl-btn-danger col-span-2" id="cmp-delete" onClick={onDelete}>
                {t("delete")}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
