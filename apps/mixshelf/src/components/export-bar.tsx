import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { MsgKey } from "@/lib/i18n";

const touch = { fontSize: 16, touchAction: "manipulation" as const };

export function ExportBar({
  t,
  onExport,
  onImportFile,
}: {
  t: (key: MsgKey) => string;
  onExport: () => void;
  onImportFile: (text: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <section className="ms-export" id="export-bar">
      <h2>{t("exportTitle")}</h2>
      <p>{t("exportBody")}</p>
      <div className="flex flex-wrap gap-2">
        <Button id="export-json" size="sm" onClick={onExport} style={touch}>
          {t("exportJson")}
        </Button>
        <Button
          id="import-json"
          size="sm"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          style={touch}
        >
          {t("importJson")}
        </Button>
        <input
          ref={fileRef}
          id="import-file"
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              onImportFile(await f.text());
            } catch {
              /* parent toasts */
            }
          }}
        />
      </div>
    </section>
  );
}
