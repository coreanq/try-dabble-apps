import { useState } from "react";

import { SpecSheetDialog } from "@/components/spec-sheet-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import {
  PRESETS,
  PRESET_ORDER,
  clampInt,
  specFor,
  type CustomSpec,
  type PresetId,
  type Settings,
} from "@/lib/spec";

/** The size printed under each tab name, so a tab reads like an index card. */
function tabSize(id: PresetId, settings: Settings): string {
  const p = id === "custom" ? settings.custom : PRESETS[id];
  return `${p.w}×${p.h} · ${p.minKB}–${p.maxKB}KB`;
}

export function SpecCard({
  settings,
  onSelect,
  onCustomChange,
  t,
}: {
  settings: Settings;
  onSelect: (preset: PresetId) => void;
  onCustomChange: (patch: Partial<CustomSpec>) => void;
  t: Translate;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const spec = specFor(settings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("presets")}</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
            {t("specSheet")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="ps-tabs" role="group" aria-label={t("presets")}>
          {PRESET_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              className="ps-tab"
              aria-pressed={settings.preset === id}
              onClick={() => onSelect(id)}
            >
              <span>{t(PRESETS[id].labelKey)}</span>
              <span className="ps-tab-size">{tabSize(id, settings)}</span>
            </button>
          ))}
        </div>

        {settings.preset === "in-upsc-photo" && <p className="ps-hint">{t("captionHint")}</p>}

        {settings.preset === "custom" && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <label className="ps-label">
              <span>{t("width")}</span>
              <input
                className="ps-field"
                type="number"
                min={20}
                max={4000}
                step={1}
                value={settings.custom.w}
                onChange={(e) => onCustomChange({ w: clampInt(e.target.value, 20, 4000, 200) })}
              />
            </label>
            <label className="ps-label">
              <span>{t("height")}</span>
              <input
                className="ps-field"
                type="number"
                min={20}
                max={4000}
                step={1}
                value={settings.custom.h}
                onChange={(e) => onCustomChange({ h: clampInt(e.target.value, 20, 4000, 230) })}
              />
            </label>
            <label className="ps-label">
              <span>{t("minKb")}</span>
              <input
                className="ps-field"
                type="number"
                min={1}
                max={5000}
                step={1}
                value={settings.custom.minKB}
                onChange={(e) => onCustomChange({ minKB: clampInt(e.target.value, 1, 5000, 20) })}
              />
            </label>
            <label className="ps-label">
              <span>{t("maxKb")}</span>
              <input
                className="ps-field"
                type="number"
                min={1}
                max={5000}
                step={1}
                value={settings.custom.maxKB}
                onChange={(e) => onCustomChange({ maxKB: clampInt(e.target.value, 1, 5000, 50) })}
              />
            </label>
            <label className="ps-label sm:col-span-2">
              <span>{t("format")}</span>
              <select
                className="ps-field"
                value={settings.custom.format}
                onChange={(e) =>
                  onCustomChange({ format: e.target.value === "png" ? "png" : "jpeg" })
                }
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
              </select>
            </label>
          </div>
        )}
      </CardContent>

      <SpecSheetDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        spec={spec}
        label={t(PRESETS[settings.preset].labelKey)}
        t={t}
      />
    </Card>
  );
}
