import { useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/**
 * The answer to "I logged out and everything was gone": one file, every
 * recipe, photos included, on your own storage. Import merges by id.
 */
export function BackupCard({
  t,
  count,
  onExport,
  onImportFile,
  onClearAll,
}: {
  t: Translate;
  count: number;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onClearAll: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  return (
    <Card id="backup-card" size="sm">
      <CardHeader>
        <CardTitle>{t("backup")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <p className="rl-hint" id="backup-body">
          {t("backupBody")}
        </p>
        <div className="rl-detail-actions">
          <button type="button" className="rl-btn rl-btn-quiet" id="export-json" onClick={onExport}>
            <Download className="size-4" aria-hidden />
            {t("exportJson")}
          </button>
          <input
            ref={fileRef}
            id="import-file"
            className="rl-file"
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="rl-btn rl-btn-quiet" id="import-json" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden />
            {t("importJson")}
          </button>
          {count > 0 && (
            <button type="button" className="rl-btn rl-btn-danger col-span-2" id="clear-all" onClick={onClearAll}>
              <Trash2 className="size-4" aria-hidden />
              {t("clearAll")}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
