import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** JSON in, JSON out — the only way a box ever leaves this device, and only
 *  because the visitor asked for the file. */
export function ToolsCard({
  t,
  onExport,
  onImport,
}: {
  t: Translate;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <Card size="sm" id="tools-card">
      <CardHeader>
        <CardTitle id="tools-title">{t("tools")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" id="export-btn" onClick={onExport}>
            {t("exportJson")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            id="import-btn"
            onClick={() => input.current?.click()}
          >
            {t("importJson")}
          </Button>
          <input
            ref={input}
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
        </div>
        <p className="bq-hint" id="tools-hint">
          {t("toolsHint")}
        </p>
      </CardContent>
    </Card>
  );
}
