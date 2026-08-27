import { ArrowDownUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcMetrics, formatCount, formatMoney, type Item, type SortId } from "@/lib/cost";
import type { Lang, MsgKey, Translate } from "@/lib/i18n";

const SORT_LABEL: Record<SortId, MsgKey> = {
  recent: "sortRecent",
  perDay: "sortPerDay",
  name: "sortName",
};

const UNIT_KEY = {
  days: "lifetimeDays",
  months: "lifetimeMonths",
  years: "lifetimeYears",
} as const;

export function EntryListCard({
  t,
  lang,
  items,
  sort,
  onCycleSort,
  onEdit,
  onDelete,
}: {
  t: Translate;
  lang: Lang;
  items: Item[];
  sort: SortId;
  onCycleSort: () => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle id="list-title">{t("listTitle")}</CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <span id="item-count" className="cpu-folio">
              {t("itemsCount", { n: formatCount(items.length, lang) })}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCycleSort}
              aria-label={`${t("sortLabel")}: ${t(SORT_LABEL[sort])}`}
              title={t("sortLabel")}
            >
              <ArrowDownUp />
              {t(SORT_LABEL[sort])}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="cpu-empty" id="empty-state">
            {t("empty")}
          </p>
        ) : (
          <div id="item-list" aria-live="polite">
            {items.map((item) => (
              <Entry key={item.id} t={t} lang={lang} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Entry({
  t,
  lang,
  item,
  onEdit,
  onDelete,
}: {
  t: Translate;
  lang: Lang;
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}) {
  const m = calcMetrics(item);
  const lifePart =
    item.lifetimeValue != null && item.lifetimeValue > 0
      ? t("lifetimeLabel", { n: item.lifetimeValue, unit: t(UNIT_KEY[item.lifetimeUnit]) })
      : m.usesLifetimeFallback
        ? t("lifetimeHintShort")
        : "";
  const metaBits = [
    formatMoney(item.price, lang),
    item.purchaseDate,
    t("daysOwned", { n: m.ownedDays }),
    lifePart,
    item.timesUsed != null
      ? t("usesCount", { n: formatCount(item.timesUsed, lang) })
      : t("noUses"),
  ].filter(Boolean);

  return (
    <article className="cpu-entry" data-id={item.id}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="cpu-entry-name">{item.name}</div>
          <div className="cpu-entry-meta">{metaBits.join(" · ")}</div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item)}>
            {t("edit")}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(item)}>
            {t("delete")}
          </Button>
        </div>
      </div>
      <div className="mt-2 grid gap-1">
        <div className="cpu-line">
          <span className="cpu-line-label">{t("costPerDay")}</span>
          <span className="cpu-leader" aria-hidden="true" />
          <span className="cpu-amount">{formatMoney(m.perDay, lang)}</span>
        </div>
        {!m.usesLifetimeFallback && (
          <div className="cpu-line">
            <span className="cpu-line-label">{t("costPerDaySoFar")}</span>
            <span className="cpu-leader" aria-hidden="true" />
            <span className="cpu-amount">{formatMoney(m.perDaySoFar, lang)}</span>
          </div>
        )}
        <div className="cpu-line">
          <span className="cpu-line-label">{t("costPerUse")}</span>
          <span className="cpu-leader" aria-hidden="true" />
          <span className="cpu-amount" data-empty={m.perUse == null || undefined}>
            {m.perUse == null ? "—" : formatMoney(m.perUse, lang)}
          </span>
        </div>
      </div>
    </article>
  );
}
