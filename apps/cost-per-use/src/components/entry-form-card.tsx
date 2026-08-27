import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "@/components/receipt";
import { calcMetrics, formatMoney, type LifetimeUnit } from "@/lib/cost";
import type { Lang, Translate } from "@/lib/i18n";

/** What the form holds while it is being typed — strings, like the inputs. */
export interface Draft {
  id: string;
  name: string;
  price: string;
  purchaseDate: string;
  lifetimeValue: string;
  lifetimeUnit: LifetimeUnit;
  timesUsed: string;
}

export interface DraftErrors {
  name?: boolean;
  price?: boolean;
  purchaseDate?: boolean;
  timesUsed?: boolean;
  lifetimeValue?: boolean;
}

const UNITS: LifetimeUnit[] = ["days", "months", "years"];
const UNIT_KEY = {
  days: "lifetimeDays",
  months: "lifetimeMonths",
  years: "lifetimeYears",
} as const;

export function EntryFormCard({
  t,
  lang,
  draft,
  errors,
  editing,
  onChange,
  onSubmit,
  onCancel,
  nameRef,
}: {
  t: Translate;
  lang: Lang;
  draft: Draft;
  errors: DraftErrors;
  editing: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  nameRef: React.RefObject<HTMLInputElement | null>;
}) {
  const price = Number(draft.price);
  /* The preview only prints once there is a real price and a date to reckon
     from — same gate the pre-Vite app used. */
  const previewable = draft.price !== "" && Number.isFinite(price) && price >= 0 && !!draft.purchaseDate;
  const metrics = previewable
    ? calcMetrics({
        price,
        purchaseDate: draft.purchaseDate,
        timesUsed: draft.timesUsed === "" ? null : Number(draft.timesUsed),
        lifetimeValue: draft.lifetimeValue === "" ? null : Number(draft.lifetimeValue),
        lifetimeUnit: draft.lifetimeUnit,
      })
    : null;

  /* Nudge for a useful life only while the fallback would give a silly number:
     nothing typed, or bought today so "days owned" is 0. */
  const showLifetimeHint =
    !!metrics && metrics.usesLifetimeFallback && (metrics.ownedDays <= 1 || draft.lifetimeValue === "");

  return (
    <Card>
      <CardHeader>
        <CardTitle id="form-title">{editing ? t("editTitle") : t("formTitle")}</CardTitle>
        {editing && (
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {t("cancel")}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          autoComplete="off"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="cpu-label">
            <span>{t("name")}</span>
            <input
              ref={nameRef}
              className="cpu-field"
              type="text"
              maxLength={80}
              value={draft.name}
              placeholder={t("namePh")}
              aria-invalid={errors.name || undefined}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </label>

          <div className="cpu-row-2">
            <label className="cpu-label">
              <span>{t("price")}</span>
              <input
                className="cpu-field"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={draft.price}
                placeholder={t("pricePh")}
                aria-invalid={errors.price || undefined}
                onChange={(e) => onChange({ price: e.target.value })}
              />
            </label>
            <label className="cpu-label">
              <span>{t("date")}</span>
              <input
                className="cpu-field"
                type="date"
                value={draft.purchaseDate}
                aria-invalid={errors.purchaseDate || undefined}
                onChange={(e) => onChange({ purchaseDate: e.target.value })}
              />
            </label>
          </div>
          <p className="cpu-hint">{t("currencyHint")}</p>

          <div className="cpu-row-2">
            <label className="cpu-label">
              <span>{t("lifetime")}</span>
              <input
                className="cpu-field"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={draft.lifetimeValue}
                placeholder={t("lifetimePh")}
                aria-invalid={errors.lifetimeValue || undefined}
                onChange={(e) => onChange({ lifetimeValue: e.target.value })}
              />
            </label>
            <label className="cpu-label">
              <span>{t("lifetimeUnit")}</span>
              <select
                className="cpu-field"
                value={draft.lifetimeUnit}
                onChange={(e) => onChange({ lifetimeUnit: e.target.value as LifetimeUnit })}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {t(UNIT_KEY[unit])}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {showLifetimeHint && (
            <p className="cpu-hint" data-warn="true">
              {t("lifetimeHint")}
            </p>
          )}

          <label className="cpu-label">
            <span>{t("uses")}</span>
            <input
              className="cpu-field"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={draft.timesUsed}
              placeholder={t("usesPh")}
              aria-invalid={errors.timesUsed || undefined}
              onChange={(e) => onChange({ timesUsed: e.target.value })}
            />
          </label>

          {metrics && (
            <Receipt
              title={t("previewTitle")}
              perDayLabel={t("previewDay")}
              perDay={formatMoney(metrics.perDay, lang)}
              perUseLabel={t("previewUse")}
              perUse={metrics.perUse == null ? null : formatMoney(metrics.perUse, lang)}
              perUseEmpty={t("needUse")}
              soFarLabel={metrics.usesLifetimeFallback ? null : t("costPerDaySoFar")}
              soFar={formatMoney(metrics.perDaySoFar, lang)}
              ownedLabel={t("daysOwned", { n: metrics.ownedDays })}
            />
          )}

          <Button type="submit" className="w-full">
            {editing ? t("update") : t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
