import { useState } from "react";
import { Calculator } from "lucide-react";

import { InlineDisclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { concentrationMcgPerMl, concentrationMgPerMl, dosesPerVial, fmt, unitsForDose, volumeMlForDose, type DoseUnit } from "@/lib/calc";
import type { Translate } from "@/lib/i18n";

/**
 * Reconstitution calculator: vial mg + water mL → concentration; desired dose
 * → syringe units and volume. It multiplies and divides what was typed and
 * says so on the card. No defaults are pre-filled, so nothing on screen ever
 * looks like a suggestion.
 */
export function CalcCard({ t, unitsPerMl, notMedical }: { t: Translate; unitsPerMl: number; notMedical: string }) {
  const [vialMg, setVialMg] = useState("");
  const [diluent, setDiluent] = useState("");
  const [dose, setDose] = useState("");
  const [doseUnit, setDoseUnit] = useState<DoseUnit>("mcg");

  const mg = Number(vialMg);
  const ml = Number(diluent);
  const d = Number(dose);
  const concMg = concentrationMgPerMl(mg, ml);
  const concMcg = concentrationMcgPerMl(mg, ml);
  const units = unitsForDose(d, doseUnit, mg, ml, unitsPerMl);
  const vol = volumeMlForDose(d, doseUnit, mg, ml);
  const per = dosesPerVial(d, doseUnit, mg);
  const clean = (s: string) => s.replace(/[^\d.]/g, "");

  return (
    <Card id="calc-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Calculator className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("calcTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="pl-hint">{t("calcBody")}</p>
        <div className="pl-grid-2">
          <div>
            <label className="pl-field-label" htmlFor="calc-vial-mg">
              {t("calcVialMg")}
            </label>
            <Input id="calc-vial-mg" inputMode="decimal" autoComplete="off" value={vialMg} onChange={(e) => setVialMg(clean(e.target.value))} />
          </div>
          <div>
            <label className="pl-field-label" htmlFor="calc-diluent">
              {t("calcDiluentMl")}
            </label>
            <Input id="calc-diluent" inputMode="decimal" autoComplete="off" value={diluent} onChange={(e) => setDiluent(clean(e.target.value))} />
          </div>
        </div>
        {concMg === null ? (
          <p className="pl-hint" id="calc-empty">
            {t("calcEmpty")}
          </p>
        ) : (
          <div className="pl-readout" id="calc-concentration">
            <div className="pl-stat">
              <span className="pl-stat-label">{t("calcConcentration")}</span>
              <span className="pl-stat-value">
                {fmt(concMg, 3)}
                <span className="pl-stat-unit">mg/mL</span>
              </span>
            </div>
            <div className="pl-stat">
              <span className="pl-stat-label">{t("calcConcentration")}</span>
              <span className="pl-stat-value">
                {fmt(concMcg, 1)}
                <span className="pl-stat-unit">mcg/mL</span>
              </span>
            </div>
          </div>
        )}
        <div className="pl-grid-2">
          <div>
            <label className="pl-field-label" htmlFor="calc-dose">
              {t("calcDesiredDose")}
            </label>
            <Input id="calc-dose" inputMode="decimal" autoComplete="off" value={dose} onChange={(e) => setDose(clean(e.target.value))} />
          </div>
          <div>
            <label className="pl-field-label" htmlFor="calc-dose-unit">
              {t("calcDoseUnit")}
            </label>
            <Select id="calc-dose-unit" value={doseUnit} onChange={(e) => setDoseUnit(e.target.value as DoseUnit)}>
              <SelectOption value="mcg">mcg</SelectOption>
              <SelectOption value="mg">mg</SelectOption>
            </Select>
          </div>
        </div>
        {units !== null && (
          <div className="pl-readout" id="calc-dose-readout">
            <div className="pl-stat" data-tone="lav">
              <span className="pl-stat-label">{t("calcSyringeUnits")}</span>
              <span className="pl-stat-value" id="calc-units">
                {fmt(units, 1)}
                <span className="pl-stat-unit">U / {unitsPerMl} U·mL</span>
              </span>
            </div>
            <div className="pl-stat" data-tone="lav">
              <span className="pl-stat-label">{t("calcVolume")}</span>
              <span className="pl-stat-value" id="calc-volume">
                {fmt(vol, 3)}
                <span className="pl-stat-unit">mL</span>
              </span>
            </div>
            <div className="pl-stat col-span-2">
              <span className="pl-stat-label">{t("calcDosesPerVial")}</span>
              <span className="pl-stat-value" id="calc-per-vial">
                {fmt(per, 1)}
              </span>
            </div>
          </div>
        )}
        <p className="pl-hint">{t("calcSyringeNote")}</p>
        <InlineDisclaimer id="calc-disclaimer" text={notMedical} />
      </CardContent>
    </Card>
  );
}
