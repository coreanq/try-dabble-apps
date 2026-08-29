import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import {
  MAX_ADDRESS,
  MAX_CUSTOMER,
  MAX_ITEM,
  MAX_OPTION,
  today,
  type OrderDraft,
} from "@/lib/orders";

/**
 * The whole way an order gets written up: one screen, six boxes, usable in the
 * seconds between two DMs. Only the customer is required — the item, the size,
 * the address and the money can all be filled in later on the docket itself,
 * because in a real chat they arrive one message at a time.
 */
export function AddOrderForm({
  t,
  onAdd,
}: {
  t: Translate;
  onAdd: (draft: OrderDraft) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [item, setItem] = useState("");
  const [option, setOption] = useState("");
  const [address, setAddress] = useState("");
  const [paid, setPaid] = useState(false);
  // Defaults to today, so the common case — this goes out today — is zero taps.
  const [shipBy, setShipBy] = useState(() => today());
  const [error, setError] = useState(false);
  // Focus returns to the customer box after a submit, but nothing is focused
  // on load — an autofocused field would shove the phone keyboard up on
  // arrival, over the very list the seller came to read.
  const customerRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = customer.trim();
    if (!name) {
      setError(true);
      customerRef.current?.focus();
      return;
    }
    onAdd({ customer: name, item: item.trim(), option: option.trim(), address: address.trim(), paid, shipBy });
    setCustomer("");
    setItem("");
    setOption("");
    setAddress("");
    setPaid(false);
    setShipBy(today());
    setError(false);
    customerRef.current?.focus();
  }

  return (
    <Card id="add-card">
      <CardHeader>
        <CardTitle id="add-title">{t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mt-0 mb-[0.5rem] text-[0.74rem] text-muted-ink" id="add-hint">
          {t("addHint")}
        </p>
        <form className="flex flex-col gap-[0.5rem]" onSubmit={submit} noValidate>
          <div>
            <label className="op-field-label" htmlFor="add-customer">
              {t("customerLabel")}
            </label>
            <input
              id="add-customer"
              ref={customerRef}
              className="op-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_CUSTOMER}
              value={customer}
              placeholder={t("customerPlaceholder")}
              aria-invalid={error || undefined}
              aria-describedby={error ? "add-customer-error" : undefined}
              onChange={(e) => {
                setCustomer(e.target.value);
                if (error) setError(false);
              }}
            />
            {error ? (
              <p
                className="mt-[0.3rem] mb-0 text-[0.72rem] font-bold text-destructive"
                id="add-customer-error"
                role="alert"
              >
                {t("customerRequired")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="op-field-label" htmlFor="add-item">
              {t("itemLabel")}
              <span className="op-optional">{t("optional")}</span>
            </label>
            <input
              id="add-item"
              className="op-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_ITEM}
              value={item}
              placeholder={t("itemPlaceholder")}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>

          <div>
            <label className="op-field-label" htmlFor="add-option">
              {t("optionLabel")}
              <span className="op-optional">{t("optional")}</span>
            </label>
            <input
              id="add-option"
              className="op-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_OPTION}
              value={option}
              placeholder={t("optionPlaceholder")}
              onChange={(e) => setOption(e.target.value)}
            />
          </div>

          <div>
            <label className="op-field-label" htmlFor="add-address">
              {t("addressLabel")}
              <span className="op-optional">{t("optional")}</span>
            </label>
            <textarea
              id="add-address"
              className="op-field mt-[0.25rem]"
              rows={2}
              maxLength={MAX_ADDRESS}
              value={address}
              placeholder={t("addressPlaceholder")}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Money and the ship-by day side by side: the two things a seller
              has to decide before going back to the chat. */}
          <div className="flex flex-wrap items-end gap-[0.5rem]">
            <label className="op-toggle flex-1 basis-[9rem]" data-on={paid} htmlFor="add-paid">
              <input
                id="add-paid"
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
              />
              {t("paidLabel")}
            </label>

            <div className="flex-1 basis-[9rem]">
              <label className="op-field-label" htmlFor="add-shipby">
                {t("shipByLabel")}
              </label>
              <input
                id="add-shipby"
                className="op-field mt-[0.25rem] h-10 py-0"
                type="date"
                value={shipBy}
                onChange={(e) => setShipBy(e.target.value || today())}
              />
            </div>
          </div>
          <p className="mt-0 mb-0 text-[0.7rem] text-faint-ink" id="add-shipby-hint">
            {t("shipByTodayHint")}
          </p>

          <Button id="add-submit" type="submit" size="lg" className="w-full">
            {t("addButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
