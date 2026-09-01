import { useEffect, useState } from "react";

import { BarcodeBars } from "@/components/barcode-bars";
import { StoreField } from "@/components/store-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { prettyCode } from "@/lib/barcode";
import type { Translate } from "@/lib/i18n";
import {
  MAX_NAME,
  formatDay,
  formatPrice,
  latestRow,
  parsePrice,
  type Item,
} from "@/lib/prices";

export interface PriceSubmission {
  name: string;
  price: number;
  store: string;
}

/**
 * What a scan opens. If the code is already on file the dialog leads with what
 * it cost last time and where, then a single big Add-today's-price. If it is
 * new, the name is offered first — and stays optional.
 */
export function PriceDialog({
  open,
  code,
  item,
  stores,
  locale,
  t,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  code: string;
  item: Item | null;
  stores: string[];
  locale: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSubmit: (submission: PriceSubmission) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [error, setError] = useState("");

  // Reopened on a different code: start from that code's own name and the shop
  // its last price came from, because the next scan is usually in the same aisle.
  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setPrice("");
    setStore(item ? (latestRow(item)?.store ?? "") : (stores[0] ?? ""));
    setError("");
  }, [open, code, item, stores]);

  const last = item ? latestRow(item) : null;

  function handleSubmit() {
    const value = parsePrice(price);
    if (value === null) {
      setError(t("needPrice"));
      return;
    }
    onSubmit({ name, price: value, store: store.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="price-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle id="price-title">{item ? t("seenTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription id="price-sub">
            {item && last
              ? t("seenLast", {
                  price: formatPrice(last.price, locale),
                  store: last.store || t("noStore"),
                  date: formatDay(last.day, locale),
                })
              : t("newHint")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[2px] border border-rule bg-label-2 px-2 py-1.5">
          <BarcodeBars code={code} />
          <p className="sp-code m-0" id="price-code">
            {prettyCode(code)}
          </p>
          {item ? (
            <p className="mt-0.5 mb-0 text-[0.7rem] font-bold text-muted-ink" id="price-count">
              {t("seenCount", { n: item.rows.length })}
            </p>
          ) : null}
        </div>

        {item ? null : (
          <div>
            <label className="sp-field-label" htmlFor="price-name">
              {t("nameLabel")}
              <span className="sp-optional">{t("optional")}</span>
            </label>
            <input
              id="price-name"
              className="sp-field mt-1"
              type="text"
              autoComplete="off"
              maxLength={MAX_NAME}
              placeholder={t("namePh")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="sp-field-label" htmlFor="price-value">
            {t("priceLabel")}
          </label>
          <input
            id="price-value"
            className="sp-field mt-1"
            data-role="price"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            maxLength={12}
            placeholder={t("pricePh")}
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        <StoreField id="price-store" value={store} stores={stores} t={t} onChange={setStore} />

        {error ? (
          <p className="m-0 text-[0.76rem] font-semibold text-destructive" id="price-error">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" size="sm" id="price-cancel" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button size="lg" className="flex-1 sm:flex-none" id="price-save" onClick={handleSubmit}>
            {item ? t("addToday") : t("savePrice")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
