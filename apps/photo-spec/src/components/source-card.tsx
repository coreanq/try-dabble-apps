import { useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** Drop, file, camera — the three ways a photo gets onto the bench. Paste
 *  (Ctrl+V) is caught on the document by the route. */
export function SourceCard({
  t,
  hasPhoto,
  onPick,
  onClear,
}: {
  t: Translate;
  hasPhoto: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const [over, setOver] = useState(false);

  function accept(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onPick(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("source")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="ps-drop"
          data-over={over}
          onDragEnter={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setOver(false);
          }}
          onDrop={accept}
        >
          <p className="ps-hint">{t("dropHint")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <label>
                {t("pickFile")}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPick(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
            <Button asChild variant="outline" size="sm">
              <label>
                {t("camera")}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPick(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
            {hasPhoto && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                {t("clearPhoto")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
