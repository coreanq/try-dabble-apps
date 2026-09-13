import { Apple, Pencil, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt } from "@/lib/calc";
import type { Translate } from "@/lib/i18n";
import type { Food } from "@/lib/model";

/** The person's own food catalog. Unlimited rows, edit / delete through the dialog, no marketplace. */
export function FoodsCard({ t, foods, onAdd, onEdit }: { t: Translate; foods: Food[]; onAdd: () => void; onEdit: (id: string) => void }) {
  return (
    <Card id="foods-card" size="sm" data-tone="orange">
      <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-2">
        <Apple className="size-4 text-orange" aria-hidden />
        <CardTitle>{t("foodsTitle")}</CardTitle>
        <button type="button" className="gm-btn gm-btn-sm gm-btn-quiet" id="add-food" onClick={onAdd}>
          <Plus className="size-4" aria-hidden />
          {t("addFood")}
        </button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {foods.length === 0 ? (
          <div className="gm-empty" id="foods-empty">
            <p className="gm-hint">{t("noFoods")}</p>
          </div>
        ) : (
          <ul className="gm-list" id="foods-list">
            {foods.map((f) => (
              <li key={f.id} className="gm-row" data-tone="orange" data-food-id={f.id}>
                <div className="gm-row-main">
                  <p className="gm-row-text">
                    {f.name}
                    {f.servingLabel && <span className="gm-badge ml-2 text-[0.72em]">{f.servingLabel}</span>}
                  </p>
                  <div className="gm-row-meta">
                    <span className="gm-badge" data-tone="coral">
                      {fmt(f.kcal, 0)} kcal
                    </span>
                    <span>P {fmt(f.proteinG)}</span>
                    <span>C {fmt(f.carbsG)}</span>
                    <span>F {fmt(f.fatG)}</span>
                  </div>
                </div>
                <div className="gm-row-actions">
                  <button type="button" className="gm-btn gm-btn-icon" aria-label={t("edit")} onClick={() => onEdit(f.id)}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="gm-hint">{t("foodsHint")}</p>
      </CardContent>
    </Card>
  );
}
