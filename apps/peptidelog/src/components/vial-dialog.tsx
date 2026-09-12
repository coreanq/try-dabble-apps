import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, NOTES_MAX, type Compound, type Vial } from "@/lib/model";

export interface VialDraft {
  compoundId: string;
  label?: string;
  vialMg: number;
  diluentMl?: number;
  remainingMg?: number;
  remainingMl?: number;
  lowStockThreshold?: number;
  reconstitutedAt?: string;
  notes?: string;
}

/** Add or edit one vial: size, water, what is left, and the low-stock line. */
export function VialDialog({
  open,
  vial,
  compounds,
  defaultCompoundId,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  vial: Vial | null;
  compounds: Compound[];
  defaultCompoundId: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: VialDraft) => void;
  onDelete: () => void;
}) {
  const [compoundId, setCompoundId] = useState("");
  const [label, setLabel] = useState("");
  const [vialMg, setVialMg] = useState("");
  const [diluent, setDiluent] = useState("");
  const [remMg, setRemMg] = useState("");
  const [remMl, setRemMl] = useState("");
  const [low, setLow] = useState("");
  const [recon, setRecon] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCompoundId(vial?.compoundId ?? defaultCompoundId ?? compounds[0]?.id ?? "");
    setLabel(vial?.label ?? "");
    setVialMg(vial ? String(vial.vialMg) : "");
    setDiluent(vial?.diluentMl !== undefined ? String(vial.diluentMl) : "");
    setRemMg(vial?.remainingMg !== undefined ? String(vial.remainingMg) : "");
    setRemMl(vial?.remainingMl !== undefined ? String(vial.remainingMl) : "");
    setLow(vial?.lowStockThreshold !== undefined ? String(vial.lowStockThreshold) : "");
    setRecon(vial?.reconstitutedAt ? vial.reconstitutedAt.slice(0, 10) : "");
    setNotes(vial?.notes ?? "");
    setError("");
  }, [open, vial, defaultCompoundId, compounds]);

  const numOr = (s: string): number | undefined => {
    if (s.trim() === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const clean = (s: string) => s.replace(/[^\d.]/g, "");

  function submit() {
    if (!compoundId) return setError(t("needCompound"));
    const mg = Number(vialMg);
    if (!Number.isFinite(mg) || mg <= 0) return setError(t("needVialMg"));
    const draft: VialDraft = { compoundId, vialMg: mg };
    const l = label.trim();
    if (l) draft.label = l.slice(0, NAME_MAX);
    const dil = numOr(diluent);
    if (dil !== undefined) draft.diluentMl = dil;
    // A new vial with no "remaining" typed starts full.
    const rMg = numOr(remMg);
    draft.remainingMg = rMg !== undefined ? rMg : vial ? vial.remainingMg : mg;
    const rMl = numOr(remMl);
    if (rMl !== undefined) draft.remainingMl = rMl;
    else if (!vial && dil !== undefined) draft.remainingMl = dil;
    const lo = numOr(low);
    if (lo !== undefined) draft.lowStockThreshold = lo;
    if (/^\d{4}-\d{2}-\d{2}$/.test(recon)) draft.reconstitutedAt = new Date(`${recon}T12:00:00`).toISOString();
    const n = notes.trim();
    if (n) draft.notes = n.slice(0, NOTES_MAX);
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="vial-dialog" className="gap-3 max-h-[92dvh] overflow-y-auto">
        <DialogTitle className="pl-sheet-title pr-8">{vial ? t("editVialTitle") : t("newVialTitle")}</DialogTitle>
        <DialogDescription className="pl-hint">{t("vialAutoDeduct")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="pl-field-label" htmlFor="vial-compound">
              {t("compoundLabel")}
            </label>
            <Select id="vial-compound" value={compoundId} onChange={(e) => setCompoundId(e.target.value)}>
              {compounds.map((c) => (
                <SelectOption key={c.id} value={c.id}>
                  {c.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="pl-grid-2">
            <div>
              <label className="pl-field-label" htmlFor="vial-mg">
                {t("vialMgLabel")}
              </label>
              <Input id="vial-mg" inputMode="decimal" autoComplete="off" value={vialMg} onChange={(e) => { setVialMg(clean(e.target.value)); if (error) setError(""); }} />
            </div>
            <div>
              <label className="pl-field-label" htmlFor="vial-diluent">
                {t("diluentLabel")}
              </label>
              <Input id="vial-diluent" inputMode="decimal" autoComplete="off" value={diluent} onChange={(e) => setDiluent(clean(e.target.value))} />
            </div>
            <div>
              <label className="pl-field-label" htmlFor="vial-rem-mg">
                {t("remainingMgLabel")}
              </label>
              <Input id="vial-rem-mg" inputMode="decimal" autoComplete="off" value={remMg} onChange={(e) => setRemMg(clean(e.target.value))} />
            </div>
            <div>
              <label className="pl-field-label" htmlFor="vial-rem-ml">
                {t("remainingMlLabel")}
              </label>
              <Input id="vial-rem-ml" inputMode="decimal" autoComplete="off" value={remMl} onChange={(e) => setRemMl(clean(e.target.value))} />
            </div>
            <div>
              <label className="pl-field-label" htmlFor="vial-low">
                {t("lowThresholdLabel")}
              </label>
              <Input id="vial-low" inputMode="decimal" autoComplete="off" value={low} onChange={(e) => setLow(clean(e.target.value))} />
            </div>
            <div>
              <label className="pl-field-label" htmlFor="vial-recon">
                {t("reconstitutedAtLabel")}
              </label>
              <Input id="vial-recon" type="date" value={recon} onChange={(e) => setRecon(e.target.value)} />
            </div>
          </div>
          <p className="pl-hint">{t("lowThresholdHint")}</p>
          <div>
            <label className="pl-field-label" htmlFor="vial-label">
              {t("vialLabelField")}
            </label>
            <Input id="vial-label" maxLength={NAME_MAX} autoComplete="off" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <label className="pl-field-label" htmlFor="vial-notes">
              {t("notesLabel")}
            </label>
            <textarea id="vial-notes" className="pl-textarea" rows={2} maxLength={NOTES_MAX} autoComplete="off" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && (
            <p className="pl-error" role="alert" id="vial-error">
              {error}
            </p>
          )}
          <div className="pl-actions">
            <button type="button" className="pl-btn pl-btn-quiet" id="vial-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="pl-btn pl-btn-primary" id="vial-save">
              {t("save")}
            </button>
            {vial && (
              <button type="button" className="pl-btn pl-btn-danger col-span-2" id="vial-delete" onClick={onDelete}>
                {t("delete")}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
