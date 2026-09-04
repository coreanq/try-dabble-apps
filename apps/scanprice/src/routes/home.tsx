import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ExportBar } from "@/components/export-bar";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PriceDialog, type PriceSubmission } from "@/components/price-dialog";
import { PromiseChips } from "@/components/promise-chips";
import { ScanDialog } from "@/components/scan-dialog";
import { ScanWindow } from "@/components/scan-window";
import { SearchBox } from "@/components/search-box";
import { ShelfLabel } from "@/components/shelf-label";
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
  addItem,
  addPrice,
  deleteItem,
  deleteRow,
  findItem,
  formatDay,
  formatPrice,
  loadItems,
  matchesQuery,
  mergeItems,
  parseItems,
  recentStores,
  renameItem,
  saveItems,
  sortItems,
  type Item,
  type PriceRow,
} from "@/lib/prices";
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

type PendingDelete =
  | { kind: "item"; item: Item }
  | { kind: "row"; item: Item; row: PriceRow };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const locale = DATE_LOCALE[lang];

  const [items, setItems] = useState<Item[]>(() => loadItems());
  const [query, setQuery] = useState("");
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
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

  /** Every change goes straight to storage. There is no Save step, and the
   *  aisle notes are still there after the tab is closed. */
  const commit = useCallback((next: Item[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  const ordered = useMemo(() => sortItems(items), [items]);
  const visible = useMemo(
    () => ordered.filter((item) => matchesQuery(item, query)),
    [ordered, query],
  );
  const stores = useMemo(() => recentStores(items), [items]);
  const pendingItem = useMemo(
    () => (pendingCode ? findItem(items, pendingCode) : null),
    [items, pendingCode],
  );

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  /** A read code goes straight from the scan window into the price sheet, so
   *  the shopper never has to find the product again in a list. */
  function handleCode(code: string) {
    setScanOpen(false);
    setPendingCode(code);
  }

  function handleSubmit(submission: PriceSubmission) {
    const code = pendingCode;
    if (!code) return;
    const existing = findItem(items, code);
    if (existing) {
      let next = addPrice(items, code, { price: submission.price, store: submission.store });
      // The name is only offered on a new code, but an import can leave one
      // blank — so a name typed later still lands.
      if (!existing.name && submission.name.trim()) {
        next = renameItem(next, code, submission.name);
      }
      commit(next);
      showToast(t("priceAdded", { price: formatPrice(submission.price, locale) }));
    } else {
      commit(
        addItem(items, code, submission.name, {
          price: submission.price,
          store: submission.store,
        }),
      );
      showToast(t("itemAdded"));
    }
    setPendingCode(null);
    setQuery("");
    setOpenCode(code);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "item") {
      commit(deleteItem(items, pendingDelete.item.code));
      if (openCode === pendingDelete.item.code) setOpenCode(null);
      showToast(t("itemDeleted"));
    } else {
      commit(deleteRow(items, pendingDelete.item.code, pendingDelete.row.id));
      showToast(t("rowDeleted"));
    }
    setPendingDelete(null);
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
      const incoming = parseItems(JSON.parse(await readTextFile(file)));
      if (incoming.length === 0) {
        showToast(t("importNone"));
        return;
      }
      const { items: merged, added } = mergeItems(items, incoming);
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

  const deleteTitle =
    pendingDelete?.kind === "row" ? t("deleteRowTitle") : t("deleteItemTitle");
  const deleteBody =
    pendingDelete?.kind === "row"
      ? t("deleteRowBody", {
          price: formatPrice(pendingDelete.row.price, locale),
          date: formatDay(pendingDelete.row.day, locale),
        })
      : pendingDelete
        ? t("deleteItemBody", {
            name: pendingDelete.item.name || pendingDelete.item.code,
            n: pendingDelete.item.rows.length,
          })
        : "";

  return (
    <div className="sp-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <PromiseChips t={t} />

      <ScanWindow t={t} onOpen={() => setScanOpen(true)} />

      {items.length === 0 ? <EmptyState t={t} /> : null}

      {items.length > 0 ? (
        <Card id="list-card">
          <CardHeader>
            <CardTitle id="list-title">{t("listTitle")}</CardTitle>
            <CardAction>
              <span className="sp-when" id="item-count">
                {t("itemCount", { n: items.length })}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <SearchBox value={query} t={t} onChange={setQuery} />

            {query ? (
              <p className="mt-1.5 mb-0 text-[0.72rem] text-faint-ink" id="search-count">
                {t("searchCount", { n: visible.length })}
              </p>
            ) : null}

            {visible.length === 0 ? (
              <p className="mt-3 mb-0 text-[0.8rem] text-muted-ink" id="list-empty">
                {t("searchEmpty", { q: query })}
              </p>
            ) : null}

            {/* The shelf: the code you last stood in front of on top. */}
            <div className="mt-2.5 flex flex-col gap-2.5" id="label-list">
              {visible.map((item) => (
                <ShelfLabel
                  key={item.code}
                  item={item}
                  open={openCode === item.code}
                  locale={locale}
                  t={t}
                  onToggle={(code) => setOpenCode((prev) => (prev === code ? null : code))}
                  onAddPrice={(target) => setPendingCode(target.code)}
                  onDeleteRow={(target, row) =>
                    setPendingDelete({ kind: "row", item: target, row })
                  }
                  onDeleteItem={(target) => setPendingDelete({ kind: "item", item: target })}
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
        <a id="link-privacy" href="/privacy.html">
          {t("privacy")}
        </a>
        <a id="link-terms" href="/terms.html">
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <ScanDialog
        open={scanOpen}
        t={t}
        onOpenChange={setScanOpen}
        onCode={handleCode}
      />

      <PriceDialog
        open={pendingCode !== null}
        code={pendingCode ?? ""}
        item={pendingItem}
        stores={stores}
        locale={locale}
        t={t}
        onOpenChange={(open) => {
          if (!open) setPendingCode(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={deleteTitle}
        body={deleteBody}
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
