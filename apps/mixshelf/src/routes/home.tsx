import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AdSlot } from "@/components/ad-slot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ExportBar } from "@/components/export-bar";
import { FilterBar } from "@/components/filter-bar";
import { ItemCard } from "@/components/item-card";
import { ItemDialog } from "@/components/item-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PromiseChips } from "@/components/promise-chips";
import { SearchBox } from "@/components/search-box";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { download, fileName, toJSON } from "@/lib/export";
import {
  HTML_LANG,
  OG_IMAGE,
  OG_LOCALE,
  detectLang,
  isLang,
  rememberLang,
  t as translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import {
  allTags,
  filterItems,
  loadItems,
  newItem,
  parseImport,
  removeItem,
  saveItems,
  upsertItem,
  type ItemStatus,
  type MediaType,
  type ShelfItem,
} from "@/lib/items";
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
const touch = { fontSize: 16, touchAction: "manipulation" as const };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [items, setItems] = useState<ShelfItem[]>(() => loadItems());
  const [query, setQuery] = useState("");
  const [filterTypes, setFilterTypes] = useState<MediaType[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShelfItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ShelfItem | null>(null);
  const [pendingImport, setPendingImport] = useState<ShelfItem[] | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[name="application-name"]', t("title"));
    setMetaContent('meta[name="apple-mobile-web-app-title"]', t("title"));
    setMetaContent('meta[property="og:title"]', t("title"));
    setMetaContent('meta[property="og:description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"]', OG_IMAGE[lang]);
    setMetaContent('meta[property="og:locale"]', OG_LOCALE[lang]);
    setMetaContent('meta[property="og:url"]', `https://mixshelf.try-dabble.com/?lang=${lang}`);
    setMetaContent('meta[name="twitter:title"]', t("title"));
    setMetaContent('meta[name="twitter:description"]', t("tagline"));
    setMetaContent('meta[name="twitter:image"]', OG_IMAGE[lang]);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `https://mixshelf.try-dabble.com/?lang=${lang}`);
  }, [lang, t]);

  function setLang(next: Lang) {
    rememberLang(next);
    navigate({ search: { lang: next } });
  }

  const availableTags = useMemo(() => allTags(items), [items]);
  const visible = useMemo(
    () => filterItems(items, { types: filterTypes, tags: filterTags, query }),
    [items, filterTypes, filterTags, query],
  );

  function toggleType(mt: MediaType) {
    setFilterTypes((prev) =>
      prev.includes(mt) ? prev.filter((x) => x !== mt) : [...prev, mt],
    );
  }
  function toggleTag(tag: string) {
    setFilterTags((prev) => {
      const has = prev.some((x) => x.toLowerCase() === tag.toLowerCase());
      return has
        ? prev.filter((x) => x.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag];
    });
  }

  function handleSave(draft: {
    title: string;
    type: MediaType;
    tags: string[];
    notes: string;
    status: ItemStatus;
  }) {
    if (editing) {
      const next = upsertItem(items, {
        ...editing,
        ...draft,
        updatedAt: new Date().toISOString(),
      });
      setItems(next);
      toast(t("itemSaved"));
    } else {
      setItems(upsertItem(items, newItem(draft)));
      toast(t("itemAdded"));
    }
    setEditing(null);
  }

  function handleExport() {
    if (items.length === 0) {
      toast(t("exportEmpty"));
      return;
    }
    download(toJSON(items), fileName(), "application/json");
    toast(t("exportDone"));
  }

  function handleImportText(text: string) {
    try {
      const parsed = parseImport(text);
      setPendingImport(parsed);
    } catch {
      toast(t("importFail"));
    }
  }

  return (
    <div className="ms-shell" id="app">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={setLang}
      />
      <PromiseChips t={t} />

      <div className="ms-actions px-3 mt-3">
        <Button
          id="open-add"
          size="default"
          style={touch}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          {t("addButton")}
        </Button>
      </div>

      <SearchBox
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        clearLabel={t("clearSearch")}
        value={query}
        onChange={setQuery}
      />

      <FilterBar
        lang={lang}
        t={t}
        types={filterTypes}
        tags={filterTags}
        availableTags={availableTags}
        onToggleType={toggleType}
        onToggleTag={toggleTag}
        onClear={() => {
          setFilterTypes([]);
          setFilterTags([]);
        }}
      />

      <section className="ms-list" id="shelf-list" aria-label={t("listTitle")}>
        <div className="ms-list-head">
          <h2>{t("listTitle")}</h2>
          <p>{t("itemCount", { n: visible.length })}</p>
        </div>
        {items.length === 0 ? (
          <EmptyState title={t("emptyTitle")} body={t("emptyBody")} body2={t("emptyBody2")} />
        ) : visible.length === 0 ? (
          <p className="ms-filtered-empty" id="filtered-empty">
            {query ? t("searchEmpty", { q: query }) : t("filteredEmpty")}
          </p>
        ) : (
          <ul className="ms-item-list">
            {visible.map((item) => (
              <li key={item.id}>
                <ItemCard
                  item={item}
                  lang={lang}
                  t={t}
                  onEdit={() => {
                    setEditing(item);
                    setDialogOpen(true);
                  }}
                  onDelete={() => setPendingDelete(item)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ExportBar t={t} onExport={handleExport} onImportFile={handleImportText} />
      <AdSlot />

      <footer className="ms-footer">
        <a id="link-privacy" href={`https://try-dabble.com/privacy?lang=${lang}`}>
          {t("privacy")}
        </a>
        <span aria-hidden="true"> · </span>
        <a id="link-terms" href={`https://try-dabble.com/terms?lang=${lang}`}>
          {t("terms")}
        </a>
      </footer>

      <ItemDialog
        open={dialogOpen}
        lang={lang}
        t={t}
        initial={editing}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={t("deleteConfirmTitle")}
        body={t("deleteConfirmBody")}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) {
            setItems(removeItem(items, pendingDelete.id));
            toast(t("itemDeleted"));
          }
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingImport}
        title={t("importConfirmTitle")}
        body={t("importConfirmBody")}
        cancelLabel={t("cancel")}
        confirmLabel={t("importJson")}
        onOpenChange={(o) => {
          if (!o) setPendingImport(null);
        }}
        onConfirm={() => {
          if (pendingImport) {
            setItems(pendingImport);
            toast(t("importDone"));
          }
          setPendingImport(null);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
