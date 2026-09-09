import { useRef } from "react";
import { Download, FileSpreadsheet, Trash2, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/**
 * The answer to "I reinstalled and it was all gone": one JSON file with every
 * category, expense and setting, plus a CSV of the expense log. Import
 * replaces after a confirm in the parent.
 */
export function BackupCard({
  t,
  hasData,
  onExportJson,
  onExportCsv,
  onImportFile,
  onClearAll,
}: {
  t: Translate;
  hasData: boolean;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportFile: (file: File) => void;
  onClearAll: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  return (
    <Card id="backup-card" size="sm">
      <CardHeader>
        <CardTitle>{t("backupTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <p className="wp-hint" id="backup-body">
          {t("backupBody")}
        </p>
        <div className="wp-actions">
          <button type="button" className="wp-btn wp-btn-quiet" id="export-json" onClick={onExportJson}>
            <Download className="size-4" aria-hidden />
            {t("exportJson")}
          </button>
          <input
            ref={fileRef}
            id="import-file"
            className="wp-file"
            type="file"
            accept="application/json,.json"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="wp-btn wp-btn-quiet" id="import-json" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden />
            {t("importJson")}
          </button>
          <button type="button" className="wp-btn wp-btn-quiet col-span-2" id="export-csv" onClick={onExportCsv}>
            <FileSpreadsheet className="size-4" aria-hidden />
            {t("exportCsv")}
          </button>
          {hasData && (
            <button type="button" className="wp-btn wp-btn-danger col-span-2" id="clear-all" onClick={onClearAll}>
              <Trash2 className="size-4" aria-hidden />
              {t("clearAll")}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
