import { useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/**
 * The answer to "I reinstalled and it was all gone": one JSON file with every
 * affirmation, topic and setting. Import replaces after a confirm in the parent.
 */
export function BackupCard({
  t,
  hasData,
  onExportJson,
  onImportFile,
  onClearAll,
}: {
  t: Translate;
  hasData: boolean;
  onExportJson: () => void;
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
        <p className="ap-hint" id="backup-body">
          {t("backupBody")}
        </p>
        <div className="ap-actions">
          <button type="button" className="ap-btn ap-btn-quiet" id="export-json" onClick={onExportJson}>
            <Download className="size-4" aria-hidden />
            {t("exportJson")}
          </button>
          <input
            ref={fileRef}
            id="import-file"
            className="ap-file"
            type="file"
            accept="application/json,.json"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="ap-btn ap-btn-quiet" id="import-json" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden />
            {t("importJson")}
          </button>
          {hasData && (
            <button type="button" className="ap-btn ap-btn-danger col-span-2" id="clear-all" onClick={onClearAll}>
              <Trash2 className="size-4" aria-hidden />
              {t("clearAll")}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
