import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { itemLines, padNum, type Box } from "@/lib/boxes";
import type { Translate } from "@/lib/i18n";

function BoxRow({
  t,
  box,
  onOpen,
  onShowQr,
  onEdit,
  onDelete,
}: {
  t: Translate;
  box: Box;
  onOpen: (box: Box) => void;
  onShowQr: (box: Box) => void;
  onEdit: (box: Box) => void;
  onDelete: (box: Box) => void;
}) {
  const lines = itemLines(box.items);
  const number = padNum(box.number);

  return (
    <article className="bq-row flex-col gap-2">
      <button
        type="button"
        className="flex w-full min-w-0 items-start gap-2.5 text-left"
        onClick={() => onOpen(box)}
      >
        <span className="bq-tag">
          <small>BOX</small>
          <b>{number}</b>
        </span>
        <span className="grid min-w-0 gap-1">
          <span className="bq-row-title">{box.room || t("boxNumber", { n: number })}</span>
          <span className="bq-meta">
            {t("itemCount", { n: lines.length })} · {t("photoCount", { n: box.photos.length })}
          </span>
          {lines.length > 0 && (
            <span className="flex flex-wrap gap-1 pt-0.5">
              {lines.slice(0, 6).map((line, i) => (
                <span className="bq-chip" key={`${line}-${i}`}>
                  {line}
                </span>
              ))}
            </span>
          )}
        </span>
      </button>

      {box.photos.length > 0 && (
        <div className="flex gap-1.5 overflow-hidden">
          {box.photos.slice(0, 4).map((photo) => (
            <img
              key={photo.id}
              src={photo.dataUrl}
              alt=""
              loading="lazy"
              className="h-11 w-11 shrink-0 rounded-[2px] border border-kraft-dark object-cover"
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" onClick={() => onOpen(box)}>
          {t("openBox")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onShowQr(box)}>
          {t("showQr")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(box)}>
          {t("edit")}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(box)}>
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}

export function BoxListCard({
  t,
  boxes,
  searching,
  onOpen,
  onShowQr,
  onEdit,
  onDelete,
}: {
  t: Translate;
  boxes: Box[];
  searching: boolean;
  onOpen: (box: Box) => void;
  onShowQr: (box: Box) => void;
  onEdit: (box: Box) => void;
  onDelete: (box: Box) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle id="list-title">{t("listTitle")}</CardTitle>
        <CardAction>
          <span id="list-count" className="bq-count">
            {boxes.length}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        {boxes.length === 0 ? (
          <p className="bq-empty" id="items-empty">
            {searching ? t("emptySearch") : t("empty")}
          </p>
        ) : (
          <div id="box-list" aria-live="polite">
            {boxes.map((box) => (
              <BoxRow
                key={box.id}
                t={t}
                box={box}
                onOpen={onOpen}
                onShowQr={onShowQr}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
