import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** JSON and CSV out, JSON back in. Every file is built in this page. */
export function ExportBar({
  t,
  onExportCsv,
  onExportJson,
  onImportFile,
}: {
  t: Translate;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportFile: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card id="export-card" size="sm" className="bg-label-2">
      <CardHeader>
        <CardTitle id="export-title">{t("exportTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" id="export-json" onClick={onExportJson}>
            {t("exportJson")}
          </Button>
          <Button size="sm" variant="outline" id="export-csv" onClick={onExportCsv}>
            {t("exportCsv")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            id="import-json"
            onClick={() => fileRef.current?.click()}
          >
            {t("importJson")}
          </Button>
          <input
            ref={fileRef}
            className="sr-only"
            id="import-file"
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 mb-0 text-[0.72rem] text-muted-ink" id="export-hint">
          {t("exportHint")}
        </p>
      </CardContent>
    </Card>
  );
}
