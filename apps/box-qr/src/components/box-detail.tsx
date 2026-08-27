import { ArrowLeft } from "lucide-react";

import { PhotoStrip } from "@/components/photo-strip";
import { QrCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { itemLines, padNum, type Box } from "@/lib/boxes";
import type { Translate } from "@/lib/i18n";

/**
 * One box, opened from its own QR: `/?box=<id>&lang=`. If the id is not on
 * this device there is nothing to fetch — the data never left the phone that
 * logged it — so the card says so instead of spinning.
 */
export function BoxDetail({
  t,
  box,
  url,
  onBack,
  onAddPhotos,
  onRemovePhoto,
  onEdit,
  onDelete,
  onCopyUrl,
  onPrint,
}: {
  t: Translate;
  box: Box | null;
  url: string;
  onBack: () => void;
  onAddPhotos: (files: FileList | null) => void;
  onRemovePhoto: (id: string) => void;
  onEdit: (box: Box) => void;
  onDelete: (box: Box) => void;
  onCopyUrl: (url: string) => void;
  onPrint: (box: Box) => void;
}) {
  const lines = box ? itemLines(box.items) : [];

  return (
    <section className="grid gap-3" id="view-detail">
      <div>
        <Button type="button" variant="secondary" size="sm" id="back-btn" onClick={onBack}>
          <ArrowLeft />
          {t("back")}
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3">
          {!box ? (
            <p className="bq-empty" id="detail-missing">
              {t("boxMissing")}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-stamp pb-2">
                <p className="bq-stencil m-0" id="detail-number">
                  {t("boxNumber", { n: padNum(box.number) })}
                </p>
                <h2 className="bq-row-title m-0" id="detail-room">
                  {box.room}
                </h2>
              </div>

              <PhotoStrip
                photos={box.photos}
                addLabel={t("addMorePhotos")}
                onAdd={onAddPhotos}
                onRemove={onRemovePhoto}
              />

              <div className="grid gap-1.5">
                <h3 className="bq-label-text m-0" id="detail-contents-title">
                  {t("contents")}
                </h3>
                {lines.length === 0 ? (
                  <p className="bq-hint">—</p>
                ) : (
                  <ul className="m-0 flex list-none flex-wrap gap-1 p-0" id="detail-items">
                    {lines.map((line, i) => (
                      <li className="bq-chip" key={`${line}-${i}`}>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bq-sticker" id="detail-qr">
                <span className="bq-stamp">{t("boxNumber", { n: padNum(box.number) })}</span>
                <QrCode value={url} className="bq-sticker-qr" />
                <label className="bq-label-text w-full">
                  <span id="encoded-url-label">{t("encodedUrl")}</span>
                  <input id="detail-url" className="bq-field" type="text" readOnly value={url} />
                </label>
                <div className="flex w-full flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    id="copy-url-btn"
                    onClick={() => onCopyUrl(url)}
                  >
                    {t("copyUrl")}
                  </Button>
                  <Button type="button" size="sm" id="print-btn" onClick={() => onPrint(box)}>
                    {t("printSticker")}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-dashed border-edge pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  id="detail-edit"
                  onClick={() => onEdit(box)}
                >
                  {t("edit")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  id="detail-delete"
                  onClick={() => onDelete(box)}
                >
                  {t("delete")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
