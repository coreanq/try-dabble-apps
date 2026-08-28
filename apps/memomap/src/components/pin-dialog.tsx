import { useEffect, useRef } from "react";

import { usePhotoUrl } from "@/components/photo-thumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { MAX_MEMO, formatCoords, type Pin } from "@/lib/pins";

/**
 * The memo sheet for one place. Everything here writes straight through to
 * storage as you type — the pin is already saved the moment it lands, so this
 * sheet only ever adds to it.
 */
export function PinDialog({
  pin,
  t,
  dateLabel,
  photoVersion,
  onMemo,
  onPickPhoto,
  onRemovePhoto,
  onDelete,
  onClose,
}: {
  pin: Pin | null;
  t: Translate;
  dateLabel: string;
  photoVersion: number;
  onMemo: (id: string, memo: string) => void;
  onPickPhoto: (id: string, file: File) => void;
  onRemovePhoto: (id: string) => void;
  onDelete: (pin: Pin) => void;
  onClose: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const url = usePhotoUrl(pin?.id ?? "", Boolean(pin?.photo), photoVersion);

  // The picker keeps the previous file selected, so re-choosing the same photo
  // would fire nothing. Clearing on open makes every pick count.
  useEffect(() => {
    if (!pin) return;
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }, [pin, photoVersion]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && pin) onPickPhoto(pin.id, file);
    e.target.value = "";
  }

  return (
    <Dialog
      open={pin !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        id="pin-dialog"
        ref={contentRef}
        showCloseButton={false}
        className="max-h-[86vh] overflow-y-auto"
        // No autofocus into the memo: on a phone that would throw the keyboard
        // over the sheet before you have seen where the pin landed.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          contentRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle id="pin-dialog-title">{t("pinDialogTitle")}</DialogTitle>
          <DialogDescription id="pin-dialog-meta">
            <span className="mm-coords">{pin ? formatCoords(pin) : ""}</span>
            <br />
            <span className="mm-date">
              {t("visitedLabel")} · {dateLabel}
            </span>
          </DialogDescription>
        </DialogHeader>

        {pin ? (
          <>
            <div>
              <label className="mm-label" htmlFor="memo-input">
                {t("memoLabel")}
              </label>
              <textarea
                id="memo-input"
                className="mm-field mt-[0.3rem] block"
                rows={3}
                maxLength={MAX_MEMO}
                value={pin.memo}
                placeholder={t("memoPlaceholder")}
                onChange={(e) => onMemo(pin.id, e.target.value)}
              />
            </div>

            <div>
              <span className="mm-label">{t("photoLabel")}</span>

              {pin.photo && url ? (
                <img
                  id="pin-photo"
                  src={url}
                  alt={t("photoAlt")}
                  className="mt-[0.35rem] block max-h-[42vh] w-full rounded-[2px] border border-line bg-[#fffdf6] object-contain p-[3px]"
                />
              ) : null}

              <div className="mt-[0.4rem] flex flex-wrap gap-[0.35rem]">
                <Button
                  id="pick-photo"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {pin.photo ? t("replacePhoto") : t("choosePhoto")}
                </Button>
                <Button
                  id="take-photo"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraRef.current?.click()}
                >
                  {t("takePhoto")}
                </Button>
                {pin.photo ? (
                  <Button
                    id="remove-photo"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePhoto(pin.id)}
                  >
                    {t("removePhoto")}
                  </Button>
                ) : null}
              </div>

              <p className="mt-[0.35rem] mb-0 text-[0.7rem] leading-5 text-muted-ink">
                {t("photoHint")}
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </>
        ) : null}

        <DialogFooter>
          <Button
            id="delete-pin"
            variant="destructive"
            size="sm"
            onClick={() => pin && onDelete(pin)}
          >
            {t("deletePin")}
          </Button>
          <Button id="close-pin" size="sm" onClick={onClose}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
