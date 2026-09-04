import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AddForm, type NewLink } from "@/components/add-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DraftsCard } from "@/components/drafts-card";
import { EditDialog, type ItemEdit } from "@/components/edit-dialog";
import { ItemSlip } from "@/components/item-slip";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { ToolsCard } from "@/components/tools-card";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
  STATUSES,
  expireOld,
  keepThisWeek,
  loadItems,
  parseBookmarkHtml,
  parseImport,
  saveItems,
  sortForStatus,
  uid,
  type Item,
  type Status,
} from "@/lib/items";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
  filter?: Status;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (isLang(search.lang)) next.lang = search.lang;
    // "inbox" is the default view, so it never needs to sit in the URL.
    const filter = search.filter;
    if (typeof filter === "string" && filter !== "inbox") {
      const match = (STATUSES as readonly string[]).includes(filter);
      if (match) next.filter = filter as Status;
    }
    return next;
  },
});

const STATUS_LABEL: Record<Status, MsgKey> = {
  inbox: "listInbox",
  week: "listWeek",
  done: "listDone",
  expired: "listExpired",
};

const SORT_HINT: Record<Status, MsgKey> = {
  inbox: "sortHintInbox",
  week: "sortHintWeek",
  done: "sortHintDone",
  expired: "sortHintExpired",
};

const EMPTY_TEXT: Record<Status, MsgKey> = {
  inbox: "emptyInbox",
  week: "emptyWeek",
  done: "emptyDone",
  expired: "emptyExpired",
};

const TOAST_MS = 1800;

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const filter: Status = search.filter ?? "inbox";

  const [items, setItems] = useState<Item[]>(() => loadItems());
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const sweptRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const commit = useCallback((next: Item[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  // On load, unpinned inbox items older than 30 days become expired. Runs once
  // per mount — StrictMode double-invokes effects in dev, and a second sweep
  // would re-announce a count that has already been applied.
  useEffect(() => {
    if (sweptRef.current) return;
    sweptRef.current = true;
    setItems((prev) => {
      const { items: next, expired } = expireOld(prev);
      if (!expired) return prev;
      saveItems(next);
      showToast(t("expiredN", { n: expired }));
      return next;
    });
  }, [showToast, t]);

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
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
  }, [lang, t]);

  const drafts = useMemo(() => items.filter((it) => it.draft), [items]);
  const shown = useMemo(() => sortForStatus(items, filter, query), [items, filter, query]);
  const counts = useMemo(() => {
    const out: Record<Status, number> = { inbox: 0, week: 0, done: 0, expired: 0 };
    for (const it of items) if (!it.draft) out[it.status] += 1;
    return out;
  }, [items]);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleFilter(next: Status) {
    navigate({
      search: (prev) => ({ ...prev, filter: next === "inbox" ? undefined : next }),
      replace: true,
    });
  }

  function handleAdd(link: NewLink) {
    const now = Date.now();
    commit([
      ...items,
      {
        id: uid(),
        url: link.url,
        title: link.title,
        why: link.why,
        createdAt: now,
        touchedAt: now,
        status: "inbox",
        pinned: false,
      },
    ]);
    if (filter !== "inbox") handleFilter("inbox");
    showToast(t("saved"));
  }

  const patch = useCallback(
    (target: Item, changes: Partial<Item>) => {
      commit(
        items.map((it) =>
          it.id === target.id ? { ...it, ...changes, touchedAt: Date.now() } : it,
        ),
      );
    },
    [commit, items],
  );

  function handleOpen(item: Item) {
    if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
  }

  function handleWeek(item: Item) {
    const { items: next, bumped } = keepThisWeek(items, item);
    commit(next);
    showToast(bumped ? t("weekBumped") : t("saved"));
  }

  function handleDone(item: Item) {
    patch(item, { status: "done", draft: false });
    showToast(t("saved"));
  }

  function handleExpire(item: Item) {
    patch(item, { status: "expired" });
    showToast(t("saved"));
  }

  function handlePin(item: Item) {
    patch(item, { pinned: !item.pinned });
  }

  function handleEditSave(item: Item, edit: ItemEdit) {
    patch(item, edit);
    setEditing(null);
    showToast(t("saved"));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    commit(items.filter((it) => it.id !== id));
    if (editing?.id === id) setEditing(null);
    setPendingDelete(null);
    showToast(t("deleted"));
  }

  function handleDraftSave(item: Item, why: string) {
    patch(item, { why, status: "inbox", draft: false });
    showToast(t("saved"));
  }

  function handleDraftSkip(item: Item) {
    commit(items.filter((it) => it.id !== item.id));
    showToast(t("deleted"));
  }

  function handleExport() {
    const blob = new Blob(
      [JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `later-inbox-${iso}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t("exported"));
  }

  function handleImportJson(file: File) {
    const reader = new FileReader();
    reader.onerror = () => showToast(t("importFail"));
    reader.onload = () => {
      try {
        const imported = parseImport(JSON.parse(String(reader.result ?? "")));
        commit(expireOld(imported).items);
        showToast(t("imported"));
      } catch {
        showToast(t("importFail"));
      }
    };
    reader.readAsText(file);
  }

  function handleImportBookmarks(file: File) {
    const reader = new FileReader();
    reader.onerror = () => showToast(t("importFail"));
    reader.onload = () => {
      try {
        const found = parseBookmarkHtml(String(reader.result ?? ""));
        if (!found.length) {
          showToast(t("bookmarksNone"));
          return;
        }
        const existing = new Set(items.map((it) => it.url));
        const now = Date.now();
        const fresh: Item[] = [];
        for (const row of found) {
          if (existing.has(row.url)) continue;
          existing.add(row.url);
          fresh.push({
            id: uid(),
            url: row.url,
            title: row.title,
            why: "",
            createdAt: now,
            touchedAt: now,
            status: "inbox",
            pinned: false,
            draft: true,
          });
        }
        commit([...items, ...fresh]);
        showToast(t("bookmarksImported", { n: fresh.length }));
      } catch {
        showToast(t("importFail"));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="li-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <Card className="bg-manila-2/70" aria-label="About">
        <CardContent>
          <p className="m-0 text-[0.82rem] text-muted-ink" id="about-text">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      {counts.inbox > 0 ? (
        <p className="li-triage" id="triage-banner">
          {t("triage")}
        </p>
      ) : null}

      <AddForm t={t} onSave={handleAdd} onError={showToast} />

      <label className="grid min-w-0 gap-1">
        <span className="sr-only" id="search-label">
          {t("search")}
        </span>
        <input
          id="search"
          className="li-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label={t("search")}
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <DraftsCard
        drafts={drafts}
        t={t}
        onSave={handleDraftSave}
        onSkip={handleDraftSkip}
        onError={showToast}
      />

      <div>
        {/* Manila tabs sit on the folder lip; the active one joins the board. */}
        <div className="li-tabs" id="status-filters" role="group" aria-label={t("listInbox")}>
          {STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              className="li-tab"
              aria-pressed={filter === value}
              data-status={value}
              onClick={() => handleFilter(value)}
            >
              {t(STATUS_LABEL[value])}
              <span className="li-tab-count">{counts[value]}</span>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle id="list-title">{t(STATUS_LABEL[filter])}</CardTitle>
            <CardAction>
              <span id="list-count" className="li-count">
                {shown.length}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="mt-0 mb-[0.55rem] text-[0.72rem] text-muted-ink" id="sort-hint">
              {t(SORT_HINT[filter])}
            </p>

            {shown.length === 0 ? (
              <div
                id="items-empty"
                className="font-heading px-[0.4rem] py-[0.85rem] text-center text-[0.88rem] text-muted-ink"
              >
                {query ? t("emptySearch") : t(EMPTY_TEXT[filter])}
              </div>
            ) : (
              <div id="item-list" className="grid gap-[0.7rem]" aria-live="polite">
                {shown.map((item) => (
                  <ItemSlip
                    key={item.id}
                    item={item}
                    t={t}
                    onOpen={handleOpen}
                    onWeek={handleWeek}
                    onDone={handleDone}
                    onExpire={handleExpire}
                    onPin={handlePin}
                    onEdit={setEditing}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      <ToolsCard
        t={t}
        onExport={handleExport}
        onImportJson={handleImportJson}
        onImportBookmarks={handleImportBookmarks}
      />

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

      <EditDialog
        item={editing}
        t={t}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={handleEditSave}
        onDelete={(item) => {
          setEditing(null);
          setPendingDelete(item);
        }}
        onError={showToast}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        message={t("deleteConfirm")}
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
