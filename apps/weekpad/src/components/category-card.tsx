import { Pencil } from "lucide-react";

import type { Translate } from "@/lib/i18n";
import type { Category, CategorySummary } from "@/lib/store";

/**
 * One line of the planner: the category name, its weekly badge, a progress
 * rail and the three figures. Overspend turns the rail and remaining coral.
 */
export function CategoryCard({
  cat,
  sum,
  money,
  t,
  onEdit,
}: {
  cat: Category;
  sum: CategorySummary;
  money: (n: number) => string;
  t: Translate;
  onEdit: () => void;
}) {
  const pct = Math.round(sum.ratio * 100);
  return (
    <article
      className="wp-cat"
      id={`cat-${cat.id}`}
      data-category={cat.id}
      data-over={sum.over ? "true" : "false"}
      style={{ "--wp-cat-color": cat.color ?? "#0d9488" } as React.CSSProperties}
    >
      <div className="wp-cat-head">
        <h3 className="wp-cat-name">{cat.name}</h3>
        <span className={"wp-badge " + (cat.recurring ? "" : "wp-badge-muted")}>
          {cat.recurring ? t("badgeRecurring") : t("badgeOneOff")}
        </span>
        <button type="button" className="wp-btn wp-btn-icon" aria-label={`${t("editCategory")}: ${cat.name}`} title={t("editCategory")} onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </button>
      </div>
      <div
        className="wp-rail"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${cat.name} ${pct}%`}
      >
        <div className="wp-rail-fill" data-over={sum.over ? "true" : "false"} style={{ width: `${pct}%` }} />
      </div>
      <div className="wp-cat-nums">
        <span>
          {t("spent")} <b className="wp-spent">{money(sum.spent)}</b>
        </span>
        <span>
          {t("planned")} <b className="wp-planned">{sum.plannedThisWeek ? money(sum.planned) : "—"}</b>
        </span>
      </div>
      <div className="wp-remaining" data-over={sum.over ? "true" : "false"}>
        {sum.plannedThisWeek ? (
          sum.over ? (
            <span className="wp-over">{t("overBy", { amount: money(-sum.remaining) })}</span>
          ) : (
            <>
              <span className="wp-remaining-label">{t("remaining")}</span>
              <span className="wp-remaining-value">{money(sum.remaining)}</span>
            </>
          )
        ) : (
          <span className="wp-remaining-label">{t("notPlannedThisWeek")}</span>
        )}
      </div>
    </article>
  );
}
