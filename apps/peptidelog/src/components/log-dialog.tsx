import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LogForm, type LogDraft } from "@/components/log-form";
import type { Lang, Translate } from "@/lib/i18n";
import type { Compound, DoseLog, Vial } from "@/lib/model";

/**
 * Edit an existing log, or add one for a day picked on the calendar. Wrong
 * dose? Change the amount and save. Wrong day? Change the date. Delete sits
 * at the bottom for logs that should not exist at all.
 */
export function LogDialog({
  open,
  log,
  forDate,
  compounds,
  vials,
  suggestedSite,
  defaultSite,
  t,
  lang,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  log: DoseLog | null;
  forDate?: string;
  compounds: Compound[];
  vials: Vial[];
  suggestedSite: string;
  defaultSite?: string;
  t: Translate;
  lang: Lang;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: LogDraft) => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="log-dialog" className="gap-3 max-h-[92dvh] overflow-y-auto">
        <DialogTitle className="pl-sheet-title pr-8">{log ? t("editLogTitle") : t("addLogForDay")}</DialogTitle>
        <DialogDescription className="sr-only">{t("quickLogTitle")}</DialogDescription>
        <LogForm
          t={t}
          lang={lang}
          compounds={compounds}
          vials={vials}
          initial={log}
          defaultDate={forDate}
          suggestedSite={suggestedSite}
          defaultSite={defaultSite}
          submitLabel={t("save")}
          idPrefix="edit"
          resetKey={`${open}-${log?.id ?? ""}-${forDate ?? ""}`}
          onSave={(d) => {
            onSave(d);
            onOpenChange(false);
          }}
        />
        {log && (
          <button type="button" className="pl-btn pl-btn-danger" id="edit-delete" onClick={onDelete}>
            {t("delete")}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
