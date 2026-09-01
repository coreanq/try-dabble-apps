import { BarcodeBars } from "@/components/barcode-bars";
import { Button } from "@/components/ui/button";
import { prettyCode } from "@/lib/barcode";
import type { Translate } from "@/lib/i18n";
import {
  deltaFor,
  formatDay,
  formatPrice,
  sortRows,
  type Item,
  type PriceRow,
} from "@/lib/prices";

/**
 * One saved code, drawn as the ticket that clips to the shelf edge: the name,
 * the latest price on a yellow sticker, the code's real bars, and the shop it
 * came from stamped on. Opening it unrolls the dated history underneath, each
 * row carrying how far the price moved from the one before it.
 */
export function ShelfLabel({
  item,
  open,
  locale,
  t,
  onToggle,
  onAddPrice,
  onDeleteRow,
  onDeleteItem,
}: {
  item: Item;
  open: boolean;
  locale: string;
  t: Translate;
  onToggle: (code: string) => void;
  onAddPrice: (item: Item) => void;
  onDeleteRow: (item: Item, row: PriceRow) => void;
  onDeleteItem: (item: Item) => void;
}) {
  const rows = sortRows(item.rows);
  const latest = rows[0];

  return (
    <article className="sp-label" data-code={item.code}>
      <div className="sp-label-head">
        <h3 className="sp-name" data-empty={item.name ? "false" : "true"}>
          {item.name || t("unnamed")}
        </h3>
        <div className="sp-sticker">
          <span className="sp-sticker-cap">{t("lastCap")}</span>
          <span className="sp-sticker-value">{formatPrice(latest.price, locale)}</span>
        </div>
      </div>

      <BarcodeBars code={item.code} />
      <p className="sp-code m-0">{prettyCode(item.code)}</p>

      <div className="sp-metarow">
        <span className="sp-store" data-empty={latest.store ? "false" : "true"}>
          {latest.store || t("noStore")}
        </span>
        <span className="sp-when">{formatDay(latest.day, locale)}</span>
        <span className="sp-when">· {t("priceCount", { n: rows.length })}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button size="sm" className="flex-1" onClick={() => onAddPrice(item)}>
          {t("addToday")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-expanded={open}
          onClick={() => onToggle(item.code)}
        >
          {open ? t("historyClose") : t("historyOpen")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={t("deleteItem")}
          onClick={() => onDeleteItem(item)}
        >
          {t("delete")}
        </Button>
      </div>

      {open ? (
        <div className="sp-hist">
          <p className="m-0 text-[0.7rem] font-extrabold tracking-[0.1em] text-faint-ink uppercase">
            {t("historyTitle")}
          </p>
          {rows.map((row, i) => {
            const delta = deltaFor(rows, i);
            return (
              <div className="sp-row" key={row.id}>
                <span className="sp-row-price">{formatPrice(row.price, locale)}</span>
                <span className="sp-row-mid">
                  <span className="sp-store" data-empty={row.store ? "false" : "true"}>
                    {row.store || t("noStore")}
                  </span>
                  <span className="sp-when">{formatDay(row.day, locale)}</span>
                  <span className="sp-delta" data-kind={delta.kind}>
                    {delta.kind === "first"
                      ? t("firstPrice")
                      : delta.kind === "same"
                        ? t("deltaSame")
                        : t(delta.kind === "up" ? "deltaUp" : "deltaDown", {
                            d: formatPrice(delta.amount, locale),
                          })}
                  </span>
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("deleteRow")}
                  onClick={() => onDeleteRow(item, row)}
                >
                  ✕
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
