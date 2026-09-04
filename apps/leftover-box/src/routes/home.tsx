import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LeftoverForm, type LeftoverDraft } from "@/components/leftover-form";
import { LeftoverNote } from "@/components/leftover-note";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { ToolsCard } from "@/components/tools-card";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { todayISO } from "@/lib/dates";
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
  loadItems,
  mergeImported,
  saveItems,
  sortForStatus,
  uid,
  type Leftover,
  type Status,
} from "@/lib/leftovers";
import { cn } from "@/lib/utils";
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
    // "open" is the default view, so it never needs to sit in the URL.
    if (search.filter === "eaten") next.filter = "eaten";
    return next;
  },
});

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

const TOAST_MS = 1800;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const filter: Status = search.filter ?? "open";

  const [items, setItems] = useState<Leftover[]>(() => loadItems());
  const [editingId, setEditingId] = useState<string | null>(null);
  // Bumped after every save so the form remounts empty for the next dish.
  const [formSeq, setFormSeq] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Leftover | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const editing = useMemo(
    () => items.find((it) => it.id === editingId) ?? null,
    [items, editingId],
  );
  const shown = useMemo(() => sortForStatus(items, filter), [items, filter]);

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
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
  }, [lang, t]);

  const commit = useCallback((next: Leftover[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleFilter(next: Status) {
    navigate({
      search: (prev) => ({ ...prev, filter: next === "eaten" ? "eaten" : undefined }),
      replace: true,
    });
  }

  function handleSave(draft: LeftoverDraft) {
    if (!draft.name) {
      showToast(t("needName"));
      return;
    }
    const now = Date.now();
    if (editing) {
      commit(
        items.map((it) =>
          it.id === editing.id ? { ...it, ...draft, updatedAt: now } : it,
        ),
      );
    } else {
      commit([
        ...items,
        {
          id: uid(),
          ...draft,
          status: "open" as Status,
          createdAt: now,
          updatedAt: now,
          eatenAt: null,
          eatenOn: "",
        },
      ]);
    }
    setEditingId(null);
    setFormSeq((n) => n + 1);
    showToast(t("saved"));
  }

  function handleEaten(item: Leftover) {
    const now = Date.now();
    commit(
      items.map((it) =>
        it.id === item.id
          ? { ...it, status: "eaten" as Status, eatenAt: now, eatenOn: todayISO(), updatedAt: now }
          : it,
      ),
    );
    showToast(t("eaten"));
  }

  function handleEdit(item: Leftover) {
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    commit(items.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
    setPendingDelete(null);
    showToast(t("deleted"));
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify({ v: 1, items }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leftover-box.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t("exported"));
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onerror = () => showToast(t("importFail"));
    reader.onload = () => {
      try {
        commit(mergeImported(items, JSON.parse(String(reader.result ?? ""))));
        showToast(t("imported"));
      } catch {
        showToast(t("importFail"));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="lb-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <Card className="bg-[#f8f1e2]" aria-label="About">
        <CardContent>
          <p className="m-0 text-[0.82rem] text-muted-ink" id="about-text">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      <LeftoverForm
        key={editingId ?? `new-${formSeq}`}
        t={t}
        editing={editing}
        onSave={handleSave}
        onCancel={() => {
          setEditingId(null);
          setFormSeq((n) => n + 1);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle id="list-title">
            {filter === "eaten" ? t("listEaten") : t("listOpen")}
          </CardTitle>
          <CardAction>
            <span
              id="list-count"
              className="rounded-[3px] border-[1.5px] border-sage bg-sage-bg px-[0.45rem] py-[0.12rem] text-[0.7rem] font-extrabold tracking-[0.04em] text-sage"
            >
              {shown.length}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="mb-[0.55rem] flex flex-wrap gap-[0.4rem]" id="status-filters">
            {(["open", "eaten"] as Status[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => handleFilter(value)}
                className={cn(
                  "cursor-pointer appearance-none rounded-full border-[1.5px] px-[0.7rem] py-[0.26rem] text-[0.75rem] font-bold",
                  filter === value
                    ? "border-sage bg-sage-bg text-sage"
                    : "border-kraft bg-kraft-2 text-muted-ink",
                )}
              >
                {value === "eaten" ? t("listEaten") : t("listOpen")}
              </button>
            ))}
          </div>

          <p className="mb-2 text-[0.72rem] text-muted-ink" id="sort-hint">
            {filter === "eaten" ? t("sortHintEaten") : t("sortHintOpen")}
          </p>

          {shown.length === 0 ? (
            <div
              id="items-empty"
              className="font-heading px-[0.4rem] py-[0.85rem] text-center text-[0.88rem] text-muted-ink"
            >
              {filter === "eaten" ? t("emptyEaten") : t("emptyOpen")}
            </div>
          ) : (
            <div id="item-list" className="grid gap-[0.7rem]" aria-live="polite">
              {shown.map((item) => (
                <LeftoverNote
                  key={item.id}
                  item={item}
                  status={filter}
                  t={t}
                  onEaten={handleEaten}
                  onEdit={handleEdit}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      <ToolsCard t={t} onExport={handleExport} onImport={handleImport} />

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
