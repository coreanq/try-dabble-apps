import { Check, Pencil } from "lucide-react";

import type { Translate } from "@/lib/i18n";

/**
 * One line of the leave-home list. The big button IS the row: tap to stamp
 * today's time, tap again to clear it. The pencil beside it opens the edit
 * sheet and never toggles the check.
 */
export function CheckRow({
  id,
  label,
  checkedAt,
  t,
  onToggle,
  onEdit,
}: {
  id: string;
  label: string;
  /** Already formatted for the active locale, or null when unchecked today. */
  checkedAt: string | null;
  t: Translate;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const on = checkedAt !== null;
  return (
    <li className="oc-row" data-item-id={id}>
      <button
        type="button"
        className={`oc-check ${on ? "oc-check-on" : ""}`}
        role="checkbox"
        aria-checked={on}
        data-testid={`check-${id}`}
        onClick={() => onToggle(id)}
      >
        <span className="oc-ring" aria-hidden>
          <Check className="size-5" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="oc-label">{label}</span>
          <span className="oc-when" data-testid={`when-${id}`}>
            {on ? t("checkedAt", { time: checkedAt }) : t("tapToCheck")}
          </span>
        </span>
      </button>
      <button
        type="button"
        className="oc-edit"
        aria-label={`${t("editItem")}: ${label}`}
        title={t("editItem")}
        data-testid={`edit-${id}`}
        onClick={() => onEdit(id)}
      >
        <Pencil className="size-5" aria-hidden />
      </button>
    </li>
  );
}
