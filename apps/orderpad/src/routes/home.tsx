import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AddOrderForm } from "@/components/add-order-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ExportBar } from "@/components/export-bar";
import { FilterTabs } from "@/components/filter-tabs";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { OrderDocket, type OrderPatch } from "@/components/order-docket";
import { PromiseChips } from "@/components/promise-chips";
import { SearchBox } from "@/components/search-box";
import { Toast } from "@/components/toast";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { download, fileName, readTextFile, toCSV, toJSON } from "@/lib/export";
import {
  DATE_LOCALE,
  HTML_LANG,
  OG_IMAGE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import {
  FILTERS,
  MAX_ADDRESS,
  MAX_CUSTOMER,
  MAX_ITEM,
  MAX_OPTION,
  countFor,
  docketNo,
  loadOrders,
  matchesFilter,
  matchesQuery,
  mergeOrders,
  newOrder,
  nextNo,
  parseOrders,
  saveOrders,
  sortOrders,
  type Filter,
  type Order,
  type OrderDraft,
} from "@/lib/orders";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (isLang(search.lang)) next.lang = search.lang;
    return next;
  },
});

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

const TOAST_MS = 2600;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Keep ?lang= on the URL so a reload, a share or a crawler hit resolves the
  // same language the Worker already baked into the first HTML.
  useEffect(() => {
    if (search.lang !== lang) {
      navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
    }
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
    setMetaContent('meta[property="og:title"], meta[name="twitter:title"]', t("title"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
  }, [lang, t]);

  /** Every change goes straight to storage. There is no Save-the-book step,
   *  and the pad is still there after the tab is closed mid-chat. */
  const commit = useCallback((next: Order[]) => {
    setOrders(next);
    saveOrders(next);
  }, []);

  const ordered = useMemo(() => sortOrders(orders), [orders]);
  const counts = useMemo(() => {
    const out = {} as Record<Filter, number>;
    for (const f of FILTERS) out[f] = countFor(orders, f);
    return out;
  }, [orders]);
  const visible = useMemo(
    () => ordered.filter((o) => matchesFilter(o, filter) && matchesQuery(o, query)),
    [ordered, filter, query],
  );

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleAdd(draft: OrderDraft) {
    const order = newOrder(draft, nextNo(orders));
    commit([...orders, order]);
    setQuery("");
    // A new docket has to be visible where the seller is standing, so a view
    // it cannot appear in drops back to the whole book.
    if (!matchesFilter(order, filter)) setFilter("all");
    showToast(t("orderAdded", { name: order.customer, no: docketNo(order.no) }));
  }

  function handlePatch(id: string, patch: OrderPatch) {
    commit(
      orders.map((o) =>
        o.id === id
          ? {
              ...o,
              customer: patch.customer.slice(0, MAX_CUSTOMER),
              item: patch.item.slice(0, MAX_ITEM),
              option: patch.option.slice(0, MAX_OPTION),
              address: patch.address.slice(0, MAX_ADDRESS),
              shipBy: patch.shipBy,
              updatedAt: Date.now(),
            }
          : o,
      ),
    );
    setOpenId(null);
    showToast(t("saved"));
  }

  function togglePaid(order: Order) {
    const paid = !order.paid;
    commit(
      orders.map((o) => (o.id === order.id ? { ...o, paid, updatedAt: Date.now() } : o)),
    );
    showToast(t(paid ? "paidOn" : "unpaidOn"));
  }

  function toggleShipped(order: Order) {
    const shipped = !order.shipped;
    commit(
      orders.map((o) => (o.id === order.id ? { ...o, shipped, updatedAt: Date.now() } : o)),
    );
    showToast(t(shipped ? "shippedOn" : "unshippedOn"));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    commit(orders.filter((o) => o.id !== id));
    setPendingDelete(null);
    if (openId === id) setOpenId(null);
    showToast(t("orderDeleted"));
  }

  function handleExport(kind: "json" | "csv") {
    if (ordered.length === 0) {
      showToast(t("exportEmpty"));
      return;
    }
    const name = fileName(kind);
    if (kind === "csv") download(toCSV(ordered), name, "text/csv");
    else download(toJSON(ordered), name, "application/json");
    showToast(t("exportDone", { file: name }));
  }

  async function handleImport(file: File) {
    try {
      const incoming = parseOrders(JSON.parse(await readTextFile(file)));
      if (incoming.length === 0) {
        showToast(t("importNone"));
        return;
      }
      const merged = mergeOrders(orders, incoming);
      const added = merged.length - orders.length;
      if (added === 0) {
        showToast(t("importNone"));
        return;
      }
      commit(merged);
      showToast(t("importDone", { n: added }));
    } catch {
      showToast(t("importFailed"));
    }
  }

  const promises: MsgKey[] = [
    "promiseMeta",
    "promiseLogin",
    "promiseUnlimited",
    "promiseFast",
    "promisePersist",
    "promiseExport",
  ];

  return (
    <div className="op-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <PromiseChips t={t} />

      <AddOrderForm t={t} onAdd={handleAdd} />

      {orders.length === 0 ? <EmptyState t={t} /> : null}

      {orders.length > 0 ? (
        <Card id="list-card">
          <CardHeader>
            <CardTitle id="list-title">{t("listTitle")}</CardTitle>
            <CardAction>
              <span className="op-meta" id="order-count">
                {t("orderCount", { n: orders.length })}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <FilterTabs t={t} value={filter} counts={counts} onChange={setFilter} />

            <div className="mt-[0.55rem]">
              <SearchBox value={query} onChange={setQuery} t={t} />
            </div>

            <p className="mt-[0.4rem] mb-0 text-[0.72rem] text-faint-ink" id="list-note">
              {query ? t("searchCount", { n: visible.length }) : t("listNote")}
            </p>

            {visible.length === 0 ? (
              <p className="mt-3 mb-0 text-[0.8rem] text-muted-ink" id="list-empty">
                {query ? t("searchEmpty", { q: query }) : t("filterEmpty")}
              </p>
            ) : null}

            {/* The stack of slips: still to go out first, most overdue on top,
                shipped ones settled underneath. */}
            <div className="mt-[0.6rem] flex flex-col gap-[0.65rem]" id="order-list">
              {visible.map((order) => (
                <OrderDocket
                  key={order.id}
                  order={order}
                  t={t}
                  dateLocale={DATE_LOCALE[lang]}
                  open={openId === order.id}
                  onToggle={(id) => setOpenId((prev) => (prev === id ? null : id))}
                  onTogglePaid={togglePaid}
                  onToggleShipped={toggleShipped}
                  onPatch={handlePatch}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ExportBar
        t={t}
        onExportCsv={() => handleExport("csv")}
        onExportJson={() => handleExport("json")}
        onImportFile={handleImport}
      />

      <Card id="promise-card" className="bg-sheet-2/70">
        <CardHeader>
          <CardTitle id="promise-title">{t("promiseTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
            {promises.map((key) => (
              <li className="op-promise" key={key}>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card id="how-card">
        <CardHeader>
          <CardTitle id="how-title">{t("howTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-[0.8rem] leading-6 text-muted-ink" id="how-body">
            {t("howBody")}
          </p>
          <p className="mt-2 mb-0 text-[0.8rem] leading-6 text-muted-ink" id="about-text">
            {t("about")}
          </p>
        </CardContent>
      </Card>


      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.78rem] text-muted-ink">
        <a id="link-privacy" href={`https://try-dabble.com/privacy?lang=${lang}`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/terms?lang=${lang}`}>
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteConfirmTitle", { name: pendingDelete?.customer ?? "" })}
        body={t("deleteConfirmBody")}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
