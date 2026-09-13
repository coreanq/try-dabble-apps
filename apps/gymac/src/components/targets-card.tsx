import { Calculator } from "lucide-react";

import { NumField } from "@/components/num-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectOption } from "@/components/ui/select";
import { bmr, fmt, kcalFromMacros, kgToLb, lbToKg, round1, suggestedTargets, tdee } from "@/lib/calc";
import type { MsgKey, Translate } from "@/lib/i18n";
import { ACTIVITIES, isActivity, isSex, type Activity, type Profile, type Targets, type WeightUnit } from "@/lib/model";

const ACTIVITY_LABEL: Record<Activity, MsgKey> = {
  sedentary: "activitySedentary",
  light: "activityLight",
  moderate: "activityModerate",
  active: "activityActive",
  very: "activityVery",
};

/**
 * Profile → Mifflin–St Jeor BMR and TDEE → suggested macro split. The
 * targets block underneath is the person's own and can be overwritten one
 * number at a time; "Use suggested" copies the computed set into it.
 */
export function TargetsCard({
  t,
  unit,
  profile,
  latestWeighInKg,
  onProfileChange,
  onTargetsChange,
  onUseSuggested,
}: {
  t: Translate;
  unit: WeightUnit;
  profile: Profile;
  latestWeighInKg: number | null;
  onProfileChange: (next: Profile) => void;
  onTargetsChange: (next: Targets) => void;
  onUseSuggested: (next: Required<Targets>) => void;
}) {
  const b = bmr(profile);
  const d = tdee(profile);
  const suggested = suggestedTargets(profile);
  const targets = profile.targets ?? {};
  const shownWeight = profile.weightKg === undefined ? undefined : round1(unit === "lb" ? kgToLb(profile.weightKg) : profile.weightKg);

  const setField = <K extends keyof Profile>(key: K, value: Profile[K]) => onProfileChange({ ...profile, [key]: value });
  const setTarget = (key: keyof Targets, value: number | undefined) => onTargetsChange({ ...targets, [key]: value });

  return (
    <Card id="targets-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Calculator className="size-4 text-coral-deep" aria-hidden />
        <CardTitle>{t("targetsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="gm-field-label mb-0">{t("profileTitle")}</p>
        <div className="gm-grid-2">
          <div>
            <label className="gm-field-label" htmlFor="profile-sex">
              {t("sexLabel")}
            </label>
            <Select id="profile-sex" value={profile.sex ?? ""} onChange={(e) => setField("sex", isSex(e.target.value) ? e.target.value : undefined)}>
              <SelectOption value="">{t("sexUnset")}</SelectOption>
              <SelectOption value="male">{t("male")}</SelectOption>
              <SelectOption value="female">{t("female")}</SelectOption>
            </Select>
          </div>
          <div>
            <label className="gm-field-label" htmlFor="profile-age">
              {t("ageLabel")}
            </label>
            <NumField id="profile-age" integer value={profile.age} onCommit={(n) => setField("age", n)} placeholder="30" />
          </div>
          <div>
            <label className="gm-field-label" htmlFor="profile-height">
              {t("heightLabel")}
            </label>
            <NumField id="profile-height" value={profile.heightCm} onCommit={(n) => setField("heightCm", n)} placeholder="175" />
          </div>
          <div>
            <label className="gm-field-label" htmlFor="profile-weight">
              {t("bodyWeightLabel")} ({unit})
            </label>
            <NumField
              id="profile-weight"
              value={shownWeight}
              onCommit={(n) => setField("weightKg", n === undefined ? undefined : round1(unit === "lb" ? lbToKg(n) : n))}
              placeholder={unit === "lb" ? "165" : "75"}
            />
          </div>
          <div className="col-span-2">
            <label className="gm-field-label" htmlFor="profile-activity">
              {t("activityLabel")}
            </label>
            <Select id="profile-activity" value={profile.activity ?? "sedentary"} onChange={(e) => setField("activity", isActivity(e.target.value) ? e.target.value : "sedentary")}>
              {ACTIVITIES.map((a) => (
                <SelectOption key={a} value={a}>
                  {t(ACTIVITY_LABEL[a])}
                </SelectOption>
              ))}
            </Select>
          </div>
        </div>
        {latestWeighInKg !== null && latestWeighInKg !== profile.weightKg && (
          <button type="button" className="gm-btn gm-btn-sm gm-btn-quiet" id="use-latest-weighin" onClick={() => setField("weightKg", latestWeighInKg)}>
            {t("useLatestWeighIn")} · {fmt(unit === "lb" ? kgToLb(latestWeighInKg) : latestWeighInKg)} {unit}
          </button>
        )}

        {b === null || d === null || suggested === null ? (
          <p className="gm-hint" id="profile-hint">
            {t("fillProfileHint")}
          </p>
        ) : (
          <>
            <div className="gm-readout" id="energy-readout">
              <div className="gm-stat">
                <span className="gm-stat-label">{t("bmrLabel")}</span>
                <span className="gm-stat-value" id="bmr-value">
                  {b}
                  <span className="gm-stat-unit">kcal</span>
                </span>
              </div>
              <div className="gm-stat" data-tone="teal">
                <span className="gm-stat-label">{t("tdeeLabel")}</span>
                <span className="gm-stat-value" id="tdee-value">
                  {d}
                  <span className="gm-stat-unit">kcal</span>
                </span>
              </div>
            </div>
            <p className="gm-field-label mb-0">{t("suggestedTitle")}</p>
            <div className="gm-grid-4" id="suggested-targets">
              <div className="gm-stat">
                <span className="gm-stat-label">kcal</span>
                <span className="gm-stat-value text-[1em]">{suggested.kcal}</span>
              </div>
              <div className="gm-stat" data-tone="teal">
                <span className="gm-stat-label">P</span>
                <span className="gm-stat-value text-[1em]">{suggested.proteinG}g</span>
              </div>
              <div className="gm-stat" data-tone="orange">
                <span className="gm-stat-label">C</span>
                <span className="gm-stat-value text-[1em]">{suggested.carbsG}g</span>
              </div>
              <div className="gm-stat" data-tone="gold">
                <span className="gm-stat-label">F</span>
                <span className="gm-stat-value text-[1em]">{suggested.fatG}g</span>
              </div>
            </div>
            <button type="button" className="gm-btn gm-btn-primary" id="use-suggested" onClick={() => onUseSuggested(suggested)}>
              {t("useSuggested")}
            </button>
          </>
        )}
        <p className="gm-hint" id="formula-note">
          {t("formulaNote")}
        </p>

        <p className="gm-field-label mb-0">{t("customTargetsTitle")}</p>
        <div className="gm-grid-2" id="custom-targets">
          <div>
            <label className="gm-field-label" htmlFor="target-kcal">
              {t("kcalTarget")}
            </label>
            <NumField id="target-kcal" integer value={targets.kcal} onCommit={(n) => setTarget("kcal", n)} placeholder="2600" />
          </div>
          <div>
            <label className="gm-field-label" htmlFor="target-protein">
              {t("proteinTarget")}
            </label>
            <NumField id="target-protein" integer value={targets.proteinG} onCommit={(n) => setTarget("proteinG", n)} placeholder="150" />
          </div>
          <div>
            <label className="gm-field-label" htmlFor="target-carbs">
              {t("carbsTarget")}
            </label>
            <NumField id="target-carbs" integer value={targets.carbsG} onCommit={(n) => setTarget("carbsG", n)} placeholder="340" />
          </div>
          <div>
            <label className="gm-field-label" htmlFor="target-fat">
              {t("fatTarget")}
            </label>
            <NumField id="target-fat" integer value={targets.fatG} onCommit={(n) => setTarget("fatG", n)} placeholder="70" />
          </div>
        </div>
        {(targets.proteinG || targets.carbsG || targets.fatG) ? (
          <p className="gm-hint" id="macro-kcal-note">
            {t("macroKcalNote", { kcal: kcalFromMacros(targets) })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
