import { useRef } from "react";
import { DownloadIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/**
 * The visible way out, and back in. Both files are built in this page and
 * handed straight to the browser's download; the import is read here with
 * FileReader. The order book never touches a server in either direction.
 */
export function ExportBar({
  t,
  onExportJson,
  onExportCsv,
  onImportFile,
}: {
  t: Translate;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportFile: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card id="export-card">
      <CardHeader>
        <CardTitle id="export-title">{t("exportTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mt-0 mb-[0.55rem] text-[0.78rem] leading-6 text-muted-ink" id="export-body">
          {t("exportBody")}
        </p>
        <div className="flex flex-wrap gap-[0.45rem]">
          <Button id="export-csv" variant="outline" size="sm" onClick={onExportCsv}>
            <DownloadIcon aria-hidden="true" />
            {t("exportCsv")}
          </Button>
          <Button id="export-json" variant="outline" size="sm" onClick={onExportJson}>
            <DownloadIcon aria-hidden="true" />
            {t("exportJson")}
          </Button>
          <Button
            id="import-json"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon aria-hidden="true" />
            {t("importJson")}
          </Button>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept="application/json,.json"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Cleared so picking the same file twice fires change again.
              e.target.value = "";
              if (file) onImportFile(file);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
