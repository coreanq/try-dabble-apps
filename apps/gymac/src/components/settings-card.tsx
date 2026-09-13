import { Settings } from "lucide-react";

import { NumField } from "@/components/num-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsgKey, Translate } from "@/lib/i18n";
import { WEIGHT_UNITS } from "@/lib/model";
import { FONT_SIZES, type FontSize, type Prefs } from "@/lib/prefs";
import { clampRestSeconds } from "@/lib/timer";

const FONT_LABEL: Record<FontSize, MsgKey> = { md: "fontMd", lg: "fontLg", xl: "fontXl" };

/** Display preferences: text size, kg / lb, default rest. Nothing here gates a feature. */
export function SettingsCard({ t, prefs, onChange }: { t: Translate; prefs: Prefs; onChange: (next: Prefs) => void }) {
  return (
    <Card id="settings-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Settings className="size-4 text-ink-muted" aria-hidden />
        <CardTitle>{t("settingsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="gm-setting-row">
          <span className="gm-field-label mb-0">{t("fontSizeLabel")}</span>
          <div className="gm-seg" role="group" aria-label={t("fontSizeLabel")}>
            {FONT_SIZES.map((s) => (
              <button key={s} type="button" className="gm-seg-btn" id={`font-${s}`} aria-pressed={prefs.fontSize === s} onClick={() => onChange({ ...prefs, fontSize: s })}>
                {t(FONT_LABEL[s])}
              </button>
            ))}
          </div>
        </div>
        <div className="gm-setting-row">
          <span className="gm-field-label mb-0">{t("unitPref")}</span>
          <div className="gm-seg" role="group" aria-label={t("unitPref")}>
            {WEIGHT_UNITS.map((u) => (
              <button key={u} type="button" className="gm-seg-btn" id={`unit-${u}`} aria-pressed={prefs.unitWeight === u} onClick={() => onChange({ ...prefs, unitWeight: u })}>
                {t(u)}
              </button>
            ))}
          </div>
        </div>
        <div className="gm-setting-row">
          <label className="gm-field-label mb-0" htmlFor="rest-default">
            {t("restDefault")}
          </label>
          <NumField id="rest-default" integer value={prefs.restSecondsDefault} onCommit={(n) => onChange({ ...prefs, restSecondsDefault: clampRestSeconds(n) })} className="gm-num-input" />
        </div>
      </CardContent>
    </Card>
  );
}
