import { useEffect, useState } from "react";
import { CheckIcon, PencilIcon, TruckIcon, Trash2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import {
  MAX_ADDRESS,
  MAX_CUSTOMER,
  MAX_ITEM,
  MAX_OPTION,
  daysFromToday,
  docketNo,
  dueKind,
  type Order,
} from "@/lib/orders";

export interface OrderPatch {
  customer: string;
  item: string;
  option: string;
  address: string;
  shipBy: string;
}

/** "Ships today", "3 days late", or the date itself in the reader's locale. */
function dueLabel(order: Order, t: Translate, dateLocale: string): string {
  const delta = daysFromToday(order.shipBy);
  if (!order.shipped) {
    if (delta < 0) return t("dueLate", { n: -delta });
    if (delta === 0) return t("dueToday");
    if (delta === 1) return t("dueTomorrow");
  }
  const [y, m, d] = order.shipBy.split("-").map(Number);
  const date = new Intl.DateTimeFormat(dateLocale, { month: "short", day: "numeric" }).format(
    new Date(y, (m || 1) - 1, d || 1),
  );
  return t("dueOn", { date });
}

/**
 * One slip off the pad. Closed it reads like a written docket — customer,
 * item with the option ringed, address, the paid and shipped stamps and the
 * ship-by chip. Opened it becomes the same boxes as the add form, so fixing a
 * size or an address never sends anyone to a different screen.
 *
 * Paid and shipped are the two marks a seller changes all day, so they are
 * one tap each on the closed slip, not buried behind the edit view.
 */
export function OrderDocket({
  order,
  t,
  dateLocale,
  open,
  onToggle,
  onTogglePaid,
  onToggleShipped,
  onPatch,
  onDelete,
}: {
  order: Order;
  t: Translate;
  dateLocale: string;
  open: boolean;
  onToggle: (id: string) => void;
  onTogglePaid: (order: Order) => void;
  onToggleShipped: (order: Order) => void;
  onPatch: (id: string, patch: OrderPatch) => void;
  onDelete: (order: Order) => void;
}) {
  const [customer, setCustomer] = useState(order.customer);
  const [item, setItem] = useState(order.item);
  const [option, setOption] = useState(order.option);
  const [address, setAddress] = useState(order.address);
  const [shipBy, setShipBy] = useState(order.shipBy);

  // Reopening a docket, or an edit landing from elsewhere, refills the boxes.
  useEffect(() => {
    if (!open) return;
    setCustomer(order.customer);
    setItem(order.item);
    setOption(order.option);
    setAddress(order.address);
    setShipBy(order.shipBy);
  }, [open, order.customer, order.item, order.option, order.address, order.shipBy]);

  function save() {
    const clean = customer.trim();
    // A docket with no customer would print as a blank slip, so an emptied
    // name is refused by simply keeping the one already written.
    onPatch(order.id, {
      customer: clean || order.customer,
      item: item.trim(),
      option: option.trim(),
      address: address.trim(),
      shipBy: shipBy || order.shipBy,
    });
  }

  return (
    <article
      className="op-docket"
      data-open={open}
      data-shipped={order.shipped}
      data-paid={order.paid}
      data-order-id={order.id}
    >
      <div className="op-docket-head">
        <h3 className="op-customer">{order.customer}</h3>
        <span className="op-no">
          {t("docketTag")} {docketNo(order.no)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mt-[0.15rem] shrink-0"
          aria-expanded={open}
          aria-label={open ? t("closeEdit") : t("openEdit")}
          title={open ? t("closeEdit") : t("openEdit")}
          onClick={() => onToggle(order.id)}
          data-role="toggle"
        >
          {open ? <XIcon aria-hidden="true" /> : <PencilIcon aria-hidden="true" />}
        </Button>
      </div>

      <div className="op-line">
        <span className="op-line-value" data-empty={order.item ? undefined : "true"}>
          {order.item || t("noItem")}
          {order.option ? <span className="op-option">{order.option}</span> : null}
        </span>
        <span className="op-line-cap">{t("itemTag")}</span>
      </div>

      <div className="op-line">
        <span className="op-line-value" data-empty={order.address ? undefined : "true"}>
          {order.address || t("noAddress")}
        </span>
        <span className="op-line-cap">{t("addressTag")}</span>
      </div>

      <div className="op-stamps">
        <span className="op-stamp" data-kind={order.paid ? "paid" : "unpaid"}>
          {order.paid ? t("stampPaid") : t("stampUnpaid")}
        </span>
        {order.shipped ? (
          <span className="op-stamp" data-kind="shipped">
            {t("stampShipped")}
          </span>
        ) : null}
        <span className="op-due" data-due={dueKind(order)}>
          {dueLabel(order, t, dateLocale)}
        </span>
      </div>

      {/* The two marks that change all day, one tap each. */}
      <div className="mt-[0.45rem] flex flex-wrap gap-[0.35rem]">
        <Button
          variant={order.paid ? "ghost" : "secondary"}
          size="sm"
          onClick={() => onTogglePaid(order)}
          data-role="paid"
        >
          <CheckIcon aria-hidden="true" />
          {order.paid ? t("markUnpaid") : t("markPaid")}
        </Button>
        <Button
          variant={order.shipped ? "ghost" : "secondary"}
          size="sm"
          onClick={() => onToggleShipped(order)}
          data-role="shipped"
        >
          <TruckIcon aria-hidden="true" />
          {order.shipped ? t("markUnshipped") : t("markShipped")}
        </Button>
      </div>

      {open ? (
        <div className="mt-[0.6rem] flex flex-col gap-[0.45rem] border-t border-rule pt-[0.55rem]">
          <div>
            <label className="op-field-label" htmlFor={`edit-customer-${order.id}`}>
              {t("customerLabel")}
            </label>
            <input
              id={`edit-customer-${order.id}`}
              className="op-field mt-[0.2rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_CUSTOMER}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
          <div>
            <label className="op-field-label" htmlFor={`edit-item-${order.id}`}>
              {t("itemLabel")}
              <span className="op-optional">{t("optional")}</span>
            </label>
            <input
              id={`edit-item-${order.id}`}
              className="op-field mt-[0.2rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_ITEM}
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>
          <div>
            <label className="op-field-label" htmlFor={`edit-option-${order.id}`}>
              {t("optionLabel")}
              <span className="op-optional">{t("optional")}</span>
            </label>
            <input
              id={`edit-option-${order.id}`}
              className="op-field mt-[0.2rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_OPTION}
              value={option}
              onChange={(e) => setOption(e.target.value)}
            />
          </div>
          <div>
            <label className="op-field-label" htmlFor={`edit-address-${order.id}`}>
              {t("addressLabel")}
              <span className="op-optional">{t("optional")}</span>
            </label>
            <textarea
              id={`edit-address-${order.id}`}
              className="op-field mt-[0.2rem]"
              rows={2}
              maxLength={MAX_ADDRESS}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="op-field-label" htmlFor={`edit-shipby-${order.id}`}>
              {t("shipByLabel")}
            </label>
            <input
              id={`edit-shipby-${order.id}`}
              className="op-field mt-[0.2rem] h-10 py-0"
              type="date"
              value={shipBy}
              onChange={(e) => setShipBy(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-[0.4rem]">
            <Button size="sm" onClick={save} data-role="save">
              {t("save")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(order)}
              data-role="delete"
            >
              <Trash2Icon aria-hidden="true" />
              {t("deleteOrder")}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
