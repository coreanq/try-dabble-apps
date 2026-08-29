import type { MsgKey, Translate } from "@/lib/i18n";
import { FILTERS, type Filter } from "@/lib/orders";

/**
 * The four views a DM seller actually needs, cut into the pad like the index
 * tabs on a receipt book: everything, who has not paid, what goes out today,
 * and what is already gone. The count rides on the tab so the two that matter
 * — unpaid and ship-today — can be read without opening them.
 */
const LABELS: Record<Filter, MsgKey> = {
  all: "filterAll",
  unpaid: "filterUnpaid",
  today: "filterToday",
  shipped: "filterShipped",
};

export function FilterTabs({
  t,
  value,
  counts,
  onChange,
}: {
  t: Translate;
  value: Filter;
  counts: Record<Filter, number>;
  onChange: (next: Filter) => void;
}) {
  return (
    <ul className="op-tabs" id="filter-tabs" role="tablist" aria-label={t("filterLabel")}>
      {FILTERS.map((filter) => (
        <li key={filter}>
          <button
            type="button"
            role="tab"
            id={`filter-${filter}`}
            className="op-tab"
            data-on={value === filter}
            aria-selected={value === filter}
            onClick={() => onChange(filter)}
          >
            {t(LABELS[filter])}
            <span className="op-tab-n">{counts[filter]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
