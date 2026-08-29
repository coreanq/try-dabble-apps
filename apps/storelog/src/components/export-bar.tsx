import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/**
 * The visible way out. Both files are built in this page and handed straight
 * to the browser's download — the list never touches a server on its way out.
 */
export function ExportBar({
  t,
  onExportJson,
  onExportCsv,
}: {
  t: Translate;
  onExportJson: () => void;
  onExportCsv: () => void;
}) {
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
        </div>
      </CardContent>
    </Card>
  );
}
