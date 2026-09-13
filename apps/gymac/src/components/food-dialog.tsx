import { useEffect, useState } from "react";

import { NumField } from "@/components/num-field";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, type Food } from "@/lib/model";

export interface FoodDraft {
  name: string;
  servingLabel?: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Add or edit one custom food. Per serving; unlimited; no paid database anywhere. */
export function FoodDialog({
  open,
  food,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  food: Food | null;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: FoodDraft) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [serving, setServing] = useState("");
  const [kcal, setKcal] = useState<number | undefined>(undefined);
  const [protein, setProtein] = useState<number | undefined>(undefined);
  const [carbs, setCarbs] = useState<number | undefined>(undefined);
  const [fat, setFat] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(food?.name ?? "");
    setServing(food?.servingLabel ?? "");
    setKcal(food?.kcal);
    setProtein(food?.proteinG);
    setCarbs(food?.carbsG);
    setFat(food?.fatG);
    setError("");
  }, [open, food]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return setError(t("needName"));
    if (kcal === undefined || kcal < 0) return setError(t("needKcal"));
    const draft: FoodDraft = { name: trimmed.slice(0, NAME_MAX), kcal, proteinG: protein ?? 0, carbsG: carbs ?? 0, fatG: fat ?? 0 };
    const s = serving.trim();
    if (s) draft.servingLabel = s.slice(0, NAME_MAX);
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="food-dialog" className="gap-3 max-h-[92dvh] overflow-y-auto">
        <DialogTitle className="gm-sheet-title pr-8">{food ? t("editFoodTitle") : t("newFoodTitle")}</DialogTitle>
        <DialogDescription className="gm-hint">{t("foodsHint")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="gm-field-label" htmlFor="food-name">
              {t("foodName")}
            </label>
            <Input id="food-name" maxLength={NAME_MAX} autoComplete="off" enterKeyHint="next" placeholder={t("foodNamePlaceholder")} value={name} onChange={(e) => { setName(e.target.value); if (error) setError(""); }} />
          </div>
          <div>
            <label className="gm-field-label" htmlFor="food-serving">
              {t("servingLabelField")}
            </label>
            <Input id="food-serving" maxLength={NAME_MAX} autoComplete="off" placeholder={t("servingPlaceholder")} value={serving} onChange={(e) => setServing(e.target.value)} />
          </div>
          <p className="gm-hint">{t("perServing")}</p>
          <div className="gm-grid-2">
            <div>
              <label className="gm-field-label" htmlFor="food-kcal">
                kcal
              </label>
              <NumField id="food-kcal" value={kcal} onCommit={(n) => { setKcal(n); if (error) setError(""); }} placeholder="165" />
            </div>
            <div>
              <label className="gm-field-label" htmlFor="food-protein">
                {t("protein")} g
              </label>
              <NumField id="food-protein" value={protein} onCommit={setProtein} placeholder="31" />
            </div>
            <div>
              <label className="gm-field-label" htmlFor="food-carbs">
                {t("carbs")} g
              </label>
              <NumField id="food-carbs" value={carbs} onCommit={setCarbs} placeholder="0" />
            </div>
            <div>
              <label className="gm-field-label" htmlFor="food-fat">
                {t("fat")} g
              </label>
              <NumField id="food-fat" value={fat} onCommit={setFat} placeholder="3.6" />
            </div>
          </div>
          {error && (
            <p className="gm-error" role="alert" id="food-error">
              {error}
            </p>
          )}
          <div className="gm-actions">
            <button type="button" className="gm-btn gm-btn-quiet" id="food-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="gm-btn gm-btn-primary" id="food-save">
              {t("save")}
            </button>
            {food && (
              <button type="button" className="gm-btn gm-btn-danger col-span-2" id="food-delete" onClick={onDelete}>
                {t("delete")}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
