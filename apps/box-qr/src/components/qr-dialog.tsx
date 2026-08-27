import { QrCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { padNum, type Box } from "@/lib/boxes";
import type { Translate } from "@/lib/i18n";

export function QrDialog({
  t,
  box,
  url,
  onOpenChange,
  onCopyUrl,
  onPrint,
}: {
  t: Translate;
  box: Box | null;
  url: string;
  onOpenChange: (open: boolean) => void;
  onCopyUrl: (url: string) => void;
  onPrint: (box: Box) => void;
}) {
  return (
    <Dialog open={box != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle id="qr-dialog-title">{t("qrTitle")}</DialogTitle>
          <DialogDescription id="qr-dialog-hint">{t("qrHint")}</DialogDescription>
        </DialogHeader>

        {box && (
          <div className="bq-sticker">
            <p className="bq-stencil m-0" id="qr-dialog-number">
              {t("boxNumber", { n: padNum(box.number) })}
            </p>
            <QrCode value={url} className="bq-sticker-qr" />
            <label className="bq-label-text w-full">
              <span id="qr-encoded-label">{t("encodedUrl")}</span>
              <input id="qr-dialog-url" className="bq-field" type="text" readOnly value={url} />
            </label>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            id="qr-copy"
            onClick={() => onCopyUrl(url)}
          >
            {t("copyUrl")}
          </Button>
          <Button
            type="button"
            size="sm"
            id="qr-print"
            onClick={() => {
              if (box) onPrint(box);
            }}
          >
            {t("printSticker")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
