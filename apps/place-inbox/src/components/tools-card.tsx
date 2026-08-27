import { useRef } from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** JSON in and out. Photos travel as data URLs inside the same file. */
export function ToolsCard({
  t,
  onExport,
  onImport,
}: {
  t: Translate;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle id="tools-title">{t("tools")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button id="export-btn" variant="outline" size="sm" onClick={onExport}>
          <Download />
          {t("exportJson")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload />
          <span id="import-label">{t("importJson")}</span>
        </Button>
        <input
          ref={fileRef}
          id="import-file"
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}
