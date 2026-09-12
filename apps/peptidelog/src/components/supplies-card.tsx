import { useState } from "react";
import { Package, Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, newId, type Supply } from "@/lib/model";

/** Stretch stub: a tiny checklist (swabs, syringes, water). Not a pharmacy inventory. */
export function SuppliesCard({ t, supplies, onChange }: { t: Translate; supplies: Supply[]; onChange: (next: Supply[]) => void }) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [lowAt, setLowAt] = useState("");

  function add() {
    const n = name.trim();
    if (!n) return;
    const s: Supply = { id: newId(), name: n.slice(0, NAME_MAX) };
    const q = Number(qty);
    if (qty !== "" && Number.isFinite(q) && q >= 0) s.qty = q;
    const l = Number(lowAt);
    if (lowAt !== "" && Number.isFinite(l) && l >= 0) s.lowAt = l;
    onChange([...supplies, s]);
    setName("");
    setQty("");
    setLowAt("");
  }
  function setQtyOf(id: string, value: string) {
    const q = Number(value);
    onChange(supplies.map((s) => (s.id === id ? { ...s, qty: value === "" || !Number.isFinite(q) ? undefined : Math.max(0, q) } : s)));
  }

  return (
    <Card id="supplies-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Package className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("suppliesTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="pl-hint">{t("suppliesBody")}</p>
        {supplies.length === 0 ? (
          <p className="pl-hint" id="supplies-empty">
            {t("noSupplies")}
          </p>
        ) : (
          <ul className="pl-list" id="supplies-list">
            {supplies.map((s) => {
              const low = typeof s.qty === "number" && typeof s.lowAt === "number" && s.qty <= s.lowAt;
              return (
                <li key={s.id} className="pl-row" data-id={s.id} data-tone={low ? "low" : undefined}>
                  <div className="pl-row-main">
                    <p className="pl-row-text">{s.name}</p>
                    <span className="pl-row-meta">
                      {low && (
                        <span className="pl-badge" data-tone="low">
                          {t("supplyLow")}
                        </span>
                      )}
                      {typeof s.lowAt === "number" && (
                        <span>
                          {t("lowAtLabel")} {s.lowAt}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="pl-row-actions">
                    <Input className="pl-num-input" inputMode="numeric" aria-label={t("qtyLabel")} value={s.qty ?? ""} onChange={(e) => setQtyOf(s.id, e.target.value.replace(/[^\d]/g, ""))} />
                    <button type="button" className="pl-btn pl-btn-icon" data-role="delete-supply" aria-label={t("delete")} onClick={() => onChange(supplies.filter((x) => x.id !== s.id))}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <form
          className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_auto] gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <div>
            <label className="pl-field-label" htmlFor="supply-name">
              {t("nameLabel")}
            </label>
            <Input id="supply-name" maxLength={NAME_MAX} autoComplete="off" placeholder={t("supplyNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="pl-field-label" htmlFor="supply-qty">
              {t("qtyLabel")}
            </label>
            <Input id="supply-qty" inputMode="numeric" autoComplete="off" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))} />
          </div>
          <div>
            <label className="pl-field-label" htmlFor="supply-low">
              {t("lowAtLabel")}
            </label>
            <Input id="supply-low" inputMode="numeric" autoComplete="off" value={lowAt} onChange={(e) => setLowAt(e.target.value.replace(/[^\d]/g, ""))} />
          </div>
          <button type="submit" className="pl-btn pl-btn-quiet" id="supply-add" aria-label={t("addSupply")}>
            <Plus className="size-4" aria-hidden />
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
