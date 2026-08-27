import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** Reminder window, the on-device notification opt-in, and JSON in/out. */
export function ToolsCard({
  remindDays,
  notifyStatus,
  t,
  onRemindDaysChange,
  onRequestNotify,
  onExport,
  onImport,
}: {
  remindDays: number;
  notifyStatus: string;
  t: Translate;
  onRemindDaysChange: (days: number) => void;
  onRequestNotify: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const importRef = useRef<HTMLInputElement>(null);

  return (
    <Card size="sm" className="tools">
      <CardHeader>
        <CardTitle id="tools-title">{t("tools")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <label className="gs-label max-w-[10rem] grow">
            <span id="label-remind-days">{t("remindDays")}</span>
            <input
              id="remind-days"
              className="gs-field"
              type="number"
              min={1}
              max={60}
              step={1}
              value={remindDays}
              onChange={(e) => onRemindDaysChange(Number(e.target.value))}
            />
          </label>
          <Button type="button" id="notify-btn" variant="outline" size="sm" onClick={onRequestNotify}>
            {t("notifyAllow")}
          </Button>
        </div>
        <p id="notify-status" className="m-0 text-[0.72rem] text-muted-ink">
          {notifyStatus}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" id="export-btn" variant="outline" size="sm" onClick={onExport}>
            {t("exportJson")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => importRef.current?.click()}
          >
            <span id="import-label">{t("importJson")}</span>
          </Button>
          <input
            id="import-file"
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
