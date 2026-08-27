import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import type { Spec } from "@/lib/spec";

/** The numbers the current preset is being fitted to, read off the bench. */
export function SpecSheetDialog({
  open,
  onOpenChange,
  spec,
  label,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spec: Spec;
  label: string;
  t: Translate;
}) {
  const ext = spec.format === "png" ? "png" : "jpg";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("specSheet")}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        <dl className="ps-sheet">
          <dt>{t("sheetTarget")}</dt>
          <dd>
            {spec.w}×{spec.h} px
          </dd>
          <dt>{t("sheetRange")}</dt>
          <dd>
            {spec.minKB}–{spec.maxKB} KB
          </dd>
          <dt>{t("sheetFormat")}</dt>
          <dd>{spec.format === "png" ? "PNG" : "JPEG"}</dd>
          <dt>{t("sheetFile")}</dt>
          <dd>
            photo-{spec.w}x{spec.h}-…kb.{ext}
          </dd>
        </dl>
        {spec.caption && <p className="ps-hint">{t("captionHint")}</p>}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
