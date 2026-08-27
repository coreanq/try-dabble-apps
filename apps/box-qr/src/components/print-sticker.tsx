import { QrCode } from "@/components/qr-code";
import { itemLines, padNum, type Box } from "@/lib/boxes";
import type { Translate } from "@/lib/i18n";

/**
 * The thing that actually gets taped on the box. Hidden on screen and the
 * only element on paper (see the @media print block in index.css), so
 * window.print() lands a die-cut sticker rather than a screenshot of the app.
 */
export function PrintSticker({ t, box, url }: { t: Translate; box: Box | null; url: string }) {
  if (!box) return <div className="bq-print" id="print-root" />;

  const line = itemLines(box.items).slice(0, 8).join(" · ");

  return (
    <div className="bq-print" id="print-root">
      <div className="bq-print-sticker">
        <p className="num">{t("boxNumber", { n: padNum(box.number) })}</p>
        <QrCode value={url} />
        {box.room && <p className="room">{box.room}</p>}
        {line && <p className="items">{line}</p>}
        <p className="url">{url}</p>
      </div>
    </div>
  );
}
