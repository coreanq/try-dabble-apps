import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { DeleteDialog } from "@/components/delete-dialog";
import { EntryFormCard, type Draft, type DraftErrors } from "@/components/entry-form-card";
import { EntryListCard } from "@/components/entry-list-card";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  HTML_LANG,
  OG_IMAGE,
  OG_LOCALE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import {
  SORT_IDS,
  loadItems,
  loadSort,
  saveItems,
  saveSort,
  sortItems,
  todayISO,
  uid,
  type Item,
  type SortId,
} from "@/lib/cost";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    isLang(search.lang) ? { lang: search.lang } : {},
});

const TOAST_MS = 1800;
const ORIGIN = "https://cost-per-use.try-dabble.com";

/** A fresh entry starts on today at a one-year life — the old app's default. */
function emptyDraft(): Draft {
  return {
    id: "",
    name: "",
    price: "",
    purchaseDate: todayISO(),
    lifetimeValue: "1",
    lifetimeUnit: "years",
    timesUsed: "",
  };
}

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

  const [items, setItems] = useState<Item[]>([]);
  const [sort, setSort] = useState<SortId>("recent");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);

  /* localStorage only exists in the browser, and the v1→v2 migration must run
     exactly once, so both reads happen after mount rather than in useState. */
  useEffect(() => {
    setItems(loadItems());
    setSort(loadSort());
  }, []);

  /* Keep ?lang= on the URL so a shared link, and the Worker behind it, agree
     with what the visitor is looking at. */
  useEffect(() => {
    if (search.lang !== lang) {
      void navigate({ search: { lang }, replace: true });
    }
  }, [lang, navigate, search.lang]);

  /* The Worker already localised the first HTML; this keeps the head correct
     after an in-page language change. */
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent(
      'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
      t("metaDescription"),
    );
    setMetaContent(
      'meta[property="og:title"], meta[name="twitter:title"], meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
    setMetaContent('meta[property="og:locale"]', OG_LOCALE[lang]);
    setMetaContent(
      'meta[property="og:image"], meta[name="twitter:image"]',
      OG_IMAGE[lang],
    );
    setMetaContent('meta[property="og:url"]', `${ORIGIN}/?lang=${lang}`);
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", `${ORIGIN}/?lang=${lang}`);
  }, [lang, t]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), TOAST_MS);
  }, []);

  const commit = useCallback((next: Item[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  const setLang = useCallback(
    (next: Lang) => {
      rememberLang(next);
      void navigate({ search: { lang: next }, replace: true });
    },
    [navigate],
  );

  const onChange = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const cleared = { ...prev };
      for (const key of Object.keys(patch) as (keyof Draft)[]) {
        if (key in cleared) delete cleared[key as keyof DraftErrors];
      }
      return cleared;
    });
  }, []);

  const resetForm = useCallback(() => {
    setDraft(emptyDraft());
    setErrors({});
  }, []);

  const onSubmit = useCallback(() => {
    const price = Number(draft.price);
    const uses = draft.timesUsed === "" ? null : Number(draft.timesUsed);
    const life = draft.lifetimeValue === "" ? null : Number(draft.lifetimeValue);
    const next: DraftErrors = {
      name: draft.name.trim() === "",
      price: draft.price.trim() === "" || !Number.isFinite(price) || price < 0,
      purchaseDate: draft.purchaseDate.trim() === "",
      timesUsed: uses != null && (!Number.isFinite(uses) || uses < 0),
      lifetimeValue: life != null && (!Number.isFinite(life) || life < 0),
    };
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      showToast(t("invalid"));
      return;
    }

    const now = new Date().toISOString();
    const payload: Item = {
      id: draft.id || uid(),
      name: draft.name.trim(),
      price,
      purchaseDate: draft.purchaseDate,
      timesUsed: uses,
      lifetimeValue: life,
      lifetimeUnit: draft.lifetimeUnit,
      updatedAt: now,
    };
    const idx = items.findIndex((it) => it.id === payload.id);
    commit(
      idx >= 0
        ? items.map((it, i) => (i === idx ? { ...it, ...payload } : it))
        : [...items, { ...payload, createdAt: now }],
    );
    resetForm();
    showToast(t("saved"));
  }, [commit, draft, items, resetForm, showToast, t]);

  const onEdit = useCallback((item: Item) => {
    setErrors({});
    setDraft({
      id: item.id,
      name: item.name,
      price: String(item.price),
      purchaseDate: item.purchaseDate,
      lifetimeValue: item.lifetimeValue == null ? "" : String(item.lifetimeValue),
      lifetimeUnit: item.lifetimeUnit,
      timesUsed: item.timesUsed == null ? "" : String(item.timesUsed),
    });
    nameRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    commit(items.filter((it) => it.id !== pendingDelete.id));
    /* Deleting the row that is open in the form would leave a ghost edit. */
    if (draft.id === pendingDelete.id) resetForm();
    setPendingDelete(null);
    showToast(t("deleted"));
  }, [commit, draft.id, items, pendingDelete, resetForm, showToast, t]);

  const onCycleSort = useCallback(() => {
    setSort((prev) => {
      const next = SORT_IDS[(SORT_IDS.indexOf(prev) + 1) % SORT_IDS.length];
      saveSort(next);
      return next;
    });
  }, []);

  const ordered = useMemo(() => sortItems(items, sort, lang), [items, lang, sort]);

  return (
    <div className="cpu-shell">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={setLang}
      />

      <Card size="sm">
        <CardContent>
          <p className="cpu-hint" id="about-text">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      <EntryFormCard
        t={t}
        lang={lang}
        draft={draft}
        errors={errors}
        editing={draft.id !== ""}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={resetForm}
        nameRef={nameRef}
      />

      <EntryListCard
        t={t}
        lang={lang}
        items={ordered}
        sort={sort}
        onCycleSort={onCycleSort}
        onEdit={onEdit}
        onDelete={setPendingDelete}
      />


      <footer className="cpu-footer">
        <a href={`https://try-dabble.com/privacy?lang=${lang}`}>{t("privacy")}</a>
        <a href={`https://try-dabble.com/terms?lang=${lang}`}>{t("terms")}</a>
        <span>try-dabble.com</span>
      </footer>

      <DeleteDialog
        t={t}
        pending={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={onConfirmDelete}
      />
      <Toast message={toast} visible={toast !== ""} />
    </div>
  );
}
