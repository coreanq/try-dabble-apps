import { useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
    <Card className="tools">
      <CardHeader>
        <CardTitle id="tools-title">{t("tools")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="export-btn"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            onClick={onExport}
          >
            {t("exportJson")}
          </button>
          <label
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "cursor-pointer",
            )}
          >
            <span id="import-label">{t("importJson")}</span>
            <input
              id="import-file"
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
          </label>
        </div>
        <p className="mt-2 mb-0 text-[0.72rem] text-muted-ink" id="tools-hint">
          {t("toolsHint")}
        </p>
      </CardContent>
    </Card>
  );
}
