import { useState } from "react";
import { Scale, Trash2 } from "lucide-react";

import { NumField } from "@/components/num-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fmt, kgToLb, lbToKg, round1, weighInDeltas } from "@/lib/calc";
import { DATE_RE, todayStr } from "@/lib/dates";
import { formatRelativeDay } from "@/lib/format";
import type { Lang, Translate } from "@/lib/i18n";
import { NOTES_MAX, type WeighIn, type WeightUnit } from "@/lib/model";

export interface WeighInDraft {
  date: string;
  weightKg: number;
  note?: string;
}

const SHOW = 12;

/** Date + weight in the preferred unit; newest first with the change vs the previous row and a small range bar. */
export function WeighInCard({
  t,
  lang,
  unit,
  weighins,
  onAdd,
  onDelete,
}: {
  t: Translate;
  lang: Lang;
  unit: WeightUnit;
  weighins: WeighIn[];
  onAdd: (draft: WeighInDraft) => void;
  onDelete: (id: string) => void;
}) {
  const [date, setDate] = useState(() => todayStr());
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const show = (kg: number) => fmt(unit === "lb" ? kgToLb(kg) : kg);
  const deltas = weighInDeltas(weighins);
  const min = weighins.reduce((m, w) => Math.min(m, w.weightKg), Infinity);
  const max = weighins.reduce((m, w) => Math.max(m, w.weightKg), -Infinity);
  const range = max - min;
  const rows = showAll ? weighins : weighins.slice(0, SHOW);

  function submit() {
    if (!DATE_RE.test(date)) return setError(t("needWeight"));
    if (weight === undefined || weight <= 0) return setError(t("needWeight"));
    const kg = round1(unit === "lb" ? lbToKg(weight) : weight);
    const draft: WeighInDraft = { date, weightKg: kg };
    const n = note.trim();
    if (n) draft.note = n.slice(0, NOTES_MAX);
    onAdd(draft);
    setWeight(undefined);
    setNote("");
    setError("");
  }

  return (
    <Card id="weighin-card" size="sm" data-tone="teal">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Scale className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("weighInTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="gm-grid-2">
            <div>
              <label className="gm-field-label" htmlFor="weighin-date">
                {t("weighInDate")}
              </label>
              <Input id="weighin-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="gm-field-label" htmlFor="weighin-weight">
                {t("weighInWeight")} ({unit})
              </label>
              <NumField id="weighin-weight" value={weight} onCommit={(n) => { setWeight(n); if (error) setError(""); }} placeholder={unit === "lb" ? "165" : "75"} className="gm-num-input w-full" />
            </div>
          </div>
          <div>
            <label className="gm-field-label" htmlFor="weighin-note">
              {t("weighInNote")}
            </label>
            <Input id="weighin-note" maxLength={NOTES_MAX} autoComplete="off" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && (
            <p className="gm-error" role="alert" id="weighin-error">
              {error}
            </p>
          )}
          <button type="submit" className="gm-btn gm-btn-teal" id="log-weighin">
            {t("logWeighIn")}
          </button>
        </form>
        {weighins.length === 0 ? (
          <div className="gm-empty" id="weighins-empty">
            <p className="gm-hint">{t("noWeighIns")}</p>
          </div>
        ) : (
          <ul className="gm-list" id="weighins-list">
            {rows.map((w, i) => {
              const d = deltas.get(w.id) ?? null;
              const pct = range > 0 ? Math.round(((w.weightKg - min) / range) * 100) : 100;
              return (
                <li key={w.id} className="gm-row" data-tone="teal" data-weighin-id={w.id}>
                  <div className="gm-row-main">
                    <p className="gm-row-text">
                      {show(w.weightKg)} {unit}
                      {i === 0 && (
                        <span className="gm-badge ml-2 text-[0.72em]" data-tone="teal">
                          {t("latestLabel")}
                        </span>
                      )}
                    </p>
                    <div className="gm-row-meta">
                      <span>{formatRelativeDay(lang, w.date)}</span>
                      {d !== null && (
                        <span className="gm-badge" data-tone={d > 0 ? "orange" : d < 0 ? "teal" : undefined}>
                          {d > 0 ? "+" : ""}
                          {show(d)} {unit}
                        </span>
                      )}
                      {w.note && <span>{w.note}</span>}
                    </div>
                    <div className="gm-weight-bar" aria-hidden>
                      <div style={{ width: `${Math.max(6, pct)}%` }} />
                    </div>
                  </div>
                  <div className="gm-row-actions">
                    <button type="button" className="gm-btn gm-btn-icon" aria-label={t("deleteWeighIn")} onClick={() => onDelete(w.id)}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {weighins.length > SHOW && (
          <button type="button" className="gm-btn gm-btn-sm gm-btn-quiet" id="weighins-more" onClick={() => setShowAll((v) => !v)}>
            {showAll ? t("hideHistory") : t("showHistory")}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
