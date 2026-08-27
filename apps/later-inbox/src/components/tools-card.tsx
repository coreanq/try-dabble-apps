import { useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ToolsCard({
  t,
  onExport,
  onImportJson,
  onImportBookmarks,
}: {
  t: Translate;
  onExport: () => void;
  onImportJson: (file: File) => void;
  onImportBookmarks: (file: File) => void;
}) {
  const jsonRef = useRef<HTMLInputElement>(null);
  const bookmarksRef = useRef<HTMLInputElement>(null);

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
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "cursor-pointer")}
          >
            <span id="import-label">{t("importJson")}</span>
            <input
              id="import-file"
              ref={jsonRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJson(file);
                if (jsonRef.current) jsonRef.current.value = "";
              }}
            />
          </label>

          <label
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "cursor-pointer")}
          >
            <span id="import-bookmarks-label">{t("importBookmarks")}</span>
            <input
              id="import-bookmarks"
              ref={bookmarksRef}
              type="file"
              accept=".html,text/html"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportBookmarks(file);
                if (bookmarksRef.current) bookmarksRef.current.value = "";
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
