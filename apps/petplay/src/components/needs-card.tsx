import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsgKey, Translate } from "@/lib/i18n";
import { NEED_KEYS, type NeedKey, type Needs } from "@/lib/needs";

const LABEL: Record<NeedKey, MsgKey> = {
  hunger: "needHunger",
  happiness: "needHappiness",
  energy: "needEnergy",
  cleanliness: "needClean",
};

/** Four visible meters. They re-render on every tick and every action. */
export function NeedsCard({ t, needs }: { t: Translate; needs: Needs }) {
  return (
    <Card id="needs-card" size="sm" data-tone="mint">
      <CardHeader>
        <CardTitle>{t("needsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="pp-meters" id="needs-meters">
          {NEED_KEYS.map((key) => {
            const v = Math.round(needs[key]);
            return (
              <div key={key} className="pp-meter" data-need={key} data-low={v < 30 ? "true" : "false"} id={`meter-${key}`}>
                <div className="pp-meter-head">
                  <span>{t(LABEL[key])}</span>
                  <span className="pp-meter-num" data-value={v}>
                    {v}
                  </span>
                </div>
                <div className="pp-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={t(LABEL[key])}>
                  <div className="pp-bar-fill" style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="pp-hint">{t("needsHint")}</p>
      </CardContent>
    </Card>
  );
}
