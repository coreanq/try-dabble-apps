import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AdSlot } from "@/components/ad-slot";
import { AddStoreForm } from "@/components/add-store-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ExportBar } from "@/components/export-bar";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PromiseChips } from "@/components/promise-chips";
import { SearchBox } from "@/components/search-box";
import { StoreLabel, type StorePatch } from "@/components/store-label";
import { Toast } from "@/components/toast";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { download, fileName, toCSV, toJSON } from "@/lib/export";
import {
  HTML_LANG,
  OG_IMAGE,
  SORT_LOCALE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import {
  MAX_NAME,
  MAX_NOTES,
  MAX_NUMBER,
  groupStores,
  loadStores,
  matchesQuery,
  newStore,
  saveStores,
  sortStores,
  type Store,
} from "@/lib/stores";
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

  const [stores, setStores] = useState<Store[]>(() => loadStores());
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Store | null>(null);
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

  /** Every change goes straight to storage. There is no Save-the-file step,
   *  and the list is still there after the tab is closed. */
  const commit = useCallback((next: Store[]) => {
    setStores(next);
    saveStores(next);
  }, []);

  // A–Z in the reader's own alphabet, recomputed whenever the list or the
  // language changes. There is no sort control to get out of step with.
  const ordered = useMemo(() => sortStores(stores, SORT_LOCALE[lang]), [stores, lang]);
  const visible = useMemo(
    () => ordered.filter((s) => matchesQuery(s, query)),
    [ordered, query],
  );
  const aisles = useMemo(() => groupStores(visible), [visible]);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleAdd(name: string, number: string, notes: string) {
    const store = newStore(name, number, notes);
    commit([...stores, store]);
    setQuery("");
    showToast(t("storeAdded", { name: store.name }));
  }

  function handlePatch(id: string, patch: StorePatch) {
    commit(
      stores.map((s) =>
        s.id === id
          ? {
              ...s,
              name: patch.name.slice(0, MAX_NAME),
              number: patch.number.slice(0, MAX_NUMBER),
              notes: patch.notes.slice(0, MAX_NOTES),
              updatedAt: Date.now(),
            }
          : s,
      ),
    );
    setOpenId(null);
    showToast(t("saved"));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    commit(stores.filter((s) => s.id !== id));
    setPendingDelete(null);
    if (openId === id) setOpenId(null);
    showToast(t("storeDeleted"));
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

  const promises: MsgKey[] = [
    "promiseLogin",
    "promiseLock",
    "promiseSheet",
    "promiseSort",
    "promisePersist",
    "promiseExport",
  ];

  return (
    <div className="sl-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <PromiseChips t={t} />

      <AddStoreForm t={t} onAdd={handleAdd} />

      {stores.length === 0 ? <EmptyState t={t} /> : null}

      {stores.length > 0 ? (
        <Card id="list-card">
          <CardHeader>
            <CardTitle id="list-title">{t("listTitle")}</CardTitle>
            <CardAction>
              <span className="sl-meta" id="store-count">
                {t("storeCount", { n: stores.length })}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <SearchBox value={query} onChange={setQuery} t={t} />

            <p className="mt-[0.4rem] mb-0 text-[0.72rem] text-faint-ink" id="sort-note">
              {query ? t("searchCount", { n: visible.length }) : t("sortNote")}
            </p>

            {visible.length === 0 ? (
              <p className="mt-3 mb-0 text-[0.8rem] text-muted-ink" id="search-empty">
                {t("searchEmpty", { q: query })}
              </p>
            ) : null}

            {/* One run per index letter, in A–Z order. The letter chips are the
                aisle markers you read along a shelf. */}
            <div id="store-list">
              {aisles.map((aisle) => (
                <section key={aisle.key} data-aisle={aisle.key}>
                  <div className="sl-aisle">
                    <span className="sl-aisle-key">{aisle.key}</span>
                    <span className="sl-aisle-rule" />
                  </div>
                  <div className="flex flex-col gap-[0.5rem]">
                    {aisle.stores.map((store) => (
                      <StoreLabel
                        key={store.id}
                        store={store}
                        t={t}
                        open={openId === store.id}
                        onToggle={(id) => setOpenId((prev) => (prev === id ? null : id))}
                        onPatch={handlePatch}
                        onDelete={setPendingDelete}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ExportBar
        t={t}
        onExportCsv={() => handleExport("csv")}
        onExportJson={() => handleExport("json")}
      />

      <Card id="promise-card" className="bg-label-2/70">
        <CardHeader>
          <CardTitle id="promise-title">{t("promiseTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
            {promises.map((key) => (
              <li className="sl-promise" key={key}>
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

      <AdSlot />

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
        title={t("deleteConfirmTitle", { name: pendingDelete?.name ?? "" })}
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
