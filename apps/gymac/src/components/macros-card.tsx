import { useState } from "react";
import { Flame, Trash2 } from "lucide-react";

import { NumField } from "@/components/num-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { dayTotals, fmt, progressPct, remainingOf, scaleFood, type MacroTotals } from "@/lib/calc";
import type { MsgKey, Translate } from "@/lib/i18n";
import { NAME_MAX, type Food, type MealLog, type Targets } from "@/lib/model";

export interface MealDraft {
  foodId?: string;
  foodName: string;
  servings: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

type Kind = "kcal" | "protein" | "carbs" | "fat";
const KINDS: { kind: Kind; label: MsgKey; totalKey: keyof MacroTotals; targetKey: keyof Targets; unit: string }[] = [
  { kind: "kcal", label: "kcal", totalKey: "kcal", targetKey: "kcal", unit: "kcal" },
  { kind: "protein", label: "protein", totalKey: "proteinG", targetKey: "proteinG", unit: "g" },
  { kind: "carbs", label: "carbs", totalKey: "carbsG", targetKey: "carbsG", unit: "g" },
  { kind: "fat", label: "fat", totalKey: "fatG", targetKey: "fatG", unit: "g" },
];

/** Day totals vs targets as four bars, the day's entries, and a log form (catalog pick or quick add). */
export function MacrosCard({
  t,
  date,
  meals,
  foods,
  targets,
  onLog,
  onDelete,
}: {
  t: Translate;
  date: string;
  meals: MealLog[];
  foods: Food[];
  targets: Targets;
  onLog: (draft: MealDraft) => void;
  onDelete: (id: string) => void;
}) {
  const [mode, setMode] = useState<"catalog" | "quick">("catalog");
  const [foodId, setFoodId] = useState("");
  const [servings, setServings] = useState<number | undefined>(1);
  const [qName, setQName] = useState("");
  const [qKcal, setQKcal] = useState<number | undefined>(undefined);
  const [qP, setQP] = useState<number | undefined>(undefined);
  const [qC, setQC] = useState<number | undefined>(undefined);
  const [qF, setQF] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");

  const totals = dayTotals(meals, date);
  const dayMeals = meals.filter((m) => m.date === date);
  const hasTargets = Boolean(targets.kcal || targets.proteinG || targets.carbsG || targets.fatG);
  const chosen = foods.find((f) => f.id === foodId) ?? foods[0];
  const effectiveMode = foods.length === 0 ? "quick" : mode;

  function submit() {
    const n = servings ?? 0;
    if (n <= 0) return setError(t("needServings"));
    if (effectiveMode === "catalog") {
      if (!chosen) return setError(t("noFoodsHint"));
      onLog({ foodId: chosen.id, foodName: chosen.name, servings: n, ...scaleFood(chosen, n) });
    } else {
      const name = qName.trim();
      if (!name) return setError(t("needName"));
      if (qKcal === undefined) return setError(t("needKcal"));
      onLog({ foodName: name.slice(0, NAME_MAX), servings: n, ...scaleFood({ kcal: qKcal, proteinG: qP ?? 0, carbsG: qC ?? 0, fatG: qF ?? 0 }, n) });
      setQName("");
      setQKcal(undefined);
      setQP(undefined);
      setQC(undefined);
      setQF(undefined);
    }
    setServings(1);
    setError("");
  }

  return (
    <Card id="macros-card" size="sm" data-tone="orange">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Flame className="size-4 text-orange" aria-hidden />
        <CardTitle>{t("macrosTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2" id="macro-bars">
          {KINDS.map((k) => {
            const value = totals[k.totalKey];
            const target = targets[k.targetKey];
            const { pct, over } = progressPct(value, target);
            const rem = remainingOf(value, target);
            return (
              <div key={k.kind} className="gm-macro" data-kind={k.kind} data-over={over}>
                <div className="gm-macro-head">
                  <span>{t(k.label)}</span>
                  <span className="gm-macro-num" id={`macro-${k.kind}`}>
                    {target ? t("ofTarget", { value: fmt(value), target: fmt(target) }) : fmt(value)} {k.unit}
                  </span>
                </div>
                <div className="gm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t(k.label)}>
                  <div className="gm-bar-fill" style={{ width: `${target ? pct : 0}%` }} />
                </div>
                {rem !== null && <span className="gm-macro-sub">{rem >= 0 ? t("remaining", { n: fmt(rem) }) : t("over", { n: fmt(-rem) })}</span>}
              </div>
            );
          })}
        </div>
        {!hasTargets && (
          <p className="gm-hint" id="no-targets-hint">
            {t("noTargets")}
          </p>
        )}

        <p className="gm-field-label mb-0">{t("logFoodTitle")}</p>
        {foods.length > 0 && (
          <div className="gm-chip-row" role="group" aria-label={t("logFoodTitle")}>
            <button type="button" className="gm-chip" id="mode-catalog" aria-pressed={effectiveMode === "catalog"} onClick={() => setMode("catalog")}>
              {t("fromCatalog")}
            </button>
            <button type="button" className="gm-chip" id="mode-quick" aria-pressed={effectiveMode === "quick"} onClick={() => setMode("quick")}>
              {t("quickAdd")}
            </button>
          </div>
        )}
        <form
          className="grid gap-2"
          id="log-food-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {effectiveMode === "catalog" ? (
            <div>
              <label className="gm-field-label" htmlFor="meal-food">
                {t("pickFood")}
              </label>
              <Select id="meal-food" value={chosen?.id ?? ""} onChange={(e) => setFoodId(e.target.value)}>
                {foods.map((f) => (
                  <SelectOption key={f.id} value={f.id}>
                    {f.name} · {fmt(f.kcal, 0)} kcal
                  </SelectOption>
                ))}
              </Select>
            </div>
          ) : (
            <>
              {foods.length === 0 && <p className="gm-hint">{t("noFoodsHint")}</p>}
              <div>
                <label className="gm-field-label" htmlFor="quick-name">
                  {t("foodName")}
                </label>
                <Input id="quick-name" maxLength={NAME_MAX} autoComplete="off" placeholder={t("quickName")} value={qName} onChange={(e) => { setQName(e.target.value); if (error) setError(""); }} />
              </div>
              <div className="gm-grid-4">
                <div>
                  <label className="gm-field-label" htmlFor="quick-kcal">
                    kcal
                  </label>
                  <NumField id="quick-kcal" value={qKcal} onCommit={setQKcal} placeholder="0" />
                </div>
                <div>
                  <label className="gm-field-label" htmlFor="quick-p">
                    P
                  </label>
                  <NumField id="quick-p" value={qP} onCommit={setQP} placeholder="0" />
                </div>
                <div>
                  <label className="gm-field-label" htmlFor="quick-c">
                    C
                  </label>
                  <NumField id="quick-c" value={qC} onCommit={setQC} placeholder="0" />
                </div>
                <div>
                  <label className="gm-field-label" htmlFor="quick-f">
                    F
                  </label>
                  <NumField id="quick-f" value={qF} onCommit={setQF} placeholder="0" />
                </div>
              </div>
            </>
          )}
          <div className="gm-set-tools">
            <div>
              <label className="gm-field-label" htmlFor="meal-servings">
                {t("servingsLabel")}
              </label>
              <NumField id="meal-servings" value={servings} onCommit={(n) => { setServings(n); if (error) setError(""); }} className="gm-num-input w-full" />
            </div>
            <button type="submit" className="gm-btn gm-btn-primary w-auto self-end" id="log-food">
              {t("logFood")}
            </button>
          </div>
          {error && (
            <p className="gm-error" role="alert" id="meal-error">
              {error}
            </p>
          )}
        </form>

        <p className="gm-field-label mb-0">{t("mealsOnDay")}</p>
        {dayMeals.length === 0 ? (
          <div className="gm-empty" id="meals-empty">
            <p className="gm-hint">{t("noMeals")}</p>
          </div>
        ) : (
          <ul className="gm-list" id="meals-list">
            {dayMeals.map((m) => (
              <li key={m.id} className="gm-row" data-tone="orange" data-meal-id={m.id}>
                <div className="gm-row-main">
                  <p className="gm-row-text">
                    {m.foodName} <span className="gm-badge text-[0.72em]">× {fmt(m.servings, 2)}</span>
                  </p>
                  <div className="gm-row-meta">
                    <span className="gm-badge" data-tone="coral">
                      {fmt(m.kcal, 0)} kcal
                    </span>
                    <span>P {fmt(m.proteinG)}</span>
                    <span>C {fmt(m.carbsG)}</span>
                    <span>F {fmt(m.fatG)}</span>
                  </div>
                </div>
                <div className="gm-row-actions">
                  <button type="button" className="gm-btn gm-btn-icon" aria-label={t("deleteMeal")} onClick={() => onDelete(m.id)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
