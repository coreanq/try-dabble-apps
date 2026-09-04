import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { BoxDetail } from "@/components/box-detail";
import { BoxFormCard, emptyDraft, type Draft } from "@/components/box-form-card";
import { BoxListCard } from "@/components/box-list-card";
import { DeleteDialog } from "@/components/delete-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PrintSticker } from "@/components/print-sticker";
import { QrDialog } from "@/components/qr-dialog";
import { Toast } from "@/components/toast";
import { ToolsCard } from "@/components/tools-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  boxUrl,
  byNumber,
  exportJson,
  filesToPhotos,
  loadBoxes,
  lsSave,
  matchesQuery,
  mergeBoxes,
  nextNumber,
  parseImport,
  replaceAll,
  deleteBox as removeBox,
  saveBox,
  uid,
  type Box,
} from "@/lib/boxes";
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
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
  /** The QR encodes /?box=<id>&lang=, so the id lives in the URL, not a path. */
  box?: string;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    ...(isLang(search.lang) ? { lang: search.lang } : {}),
    ...(typeof search.box === "string" && search.box ? { box: search.box } : {}),
  }),
});

const TOAST_MS = 1800;
const ORIGIN = "https://box-qr.try-dabble.com";

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

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<Box | null>(null);
  const [qrBox, setQrBox] = useState<Box | null>(null);
  const [printing, setPrinting] = useState<Box | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  const roomRef = useRef<HTMLInputElement>(null);

  /* IndexedDB only exists in the browser, and a localStorage-only device is
     migrated into it on the way through, so this runs after mount. */
  useEffect(() => {
    let live = true;
    void loadBoxes().then((list) => {
      if (!live) return;
      setBoxes(list);
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, []);

  /* Keep ?lang= on the URL so a shared link, a printed sticker and the Worker
     behind them all agree with what the visitor is looking at. */
  useEffect(() => {
    if (search.lang !== lang) {
      void navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
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
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    setMetaContent('meta[property="og:url"]', `${ORIGIN}/?lang=${lang}`);
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", `${ORIGIN}/?lang=${lang}`);
  }, [lang, t]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /* Paint the sticker first, then hand the page to the print dialog. */
  useEffect(() => {
    if (!printing) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 60);
    return () => window.clearTimeout(id);
  }, [printing]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), TOAST_MS);
  }, []);

  const commit = useCallback((next: Box[]) => {
    const sorted = [...next].sort(byNumber);
    setBoxes(sorted);
    lsSave(sorted);
    return sorted;
  }, []);

  const openBox = useCallback(
    (id: string | null) => {
      void navigate({
        search: (prev) => {
          const next = { ...prev };
          if (id) next.box = id;
          else delete next.box;
          return next;
        },
      });
    },
    [navigate],
  );

  const setLang = useCallback(
    (next: Lang) => {
      rememberLang(next);
      void navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
    },
    [navigate],
  );

  const currentId = search.box ?? null;
  const current = useMemo(
    () => (currentId ? (boxes.find((b) => b.id === currentId) ?? null) : null),
    [boxes, currentId],
  );

  const onChangeDraft = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetForm = useCallback(() => setDraft(emptyDraft()), []);

  const onAddDraftPhotos = useCallback(async (files: FileList | null) => {
    const photos = await filesToPhotos(files);
    if (photos.length) setDraft((prev) => ({ ...prev, photos: [...prev.photos, ...photos] }));
  }, []);

  const onRemoveDraftPhoto = useCallback((id: string) => {
    setDraft((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== id) }));
  }, []);

  const onSubmit = useCallback(() => {
    const room = draft.room.trim();
    const items = draft.items;
    if (!items.trim() && !draft.photos.length && !room) {
      showToast(t("needItems"));
      return;
    }
    const existing = draft.id ? boxes.find((b) => b.id === draft.id) : undefined;
    const box: Box = {
      id: existing ? existing.id : uid(),
      number: existing ? existing.number : nextNumber(boxes),
      room,
      items,
      photos: draft.photos,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    commit(existing ? boxes.map((b) => (b.id === box.id ? box : b)) : [...boxes, box]);
    void saveBox(box);
    resetForm();
    showToast(t("saved"));
  }, [boxes, commit, draft, resetForm, showToast, t]);

  const onEdit = useCallback(
    (box: Box) => {
      setDraft({ id: box.id, room: box.room, items: box.items, photos: [...box.photos] });
      openBox(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => roomRef.current?.focus(), 60);
    },
    [openBox],
  );

  const onConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    commit(boxes.filter((b) => b.id !== pendingDelete.id));
    void removeBox(pendingDelete.id);
    /* Deleting the box that is open in the form or on screen would leave a
       ghost edit and a dead detail view behind. */
    if (draft.id === pendingDelete.id) resetForm();
    if (currentId === pendingDelete.id) openBox(null);
    setPendingDelete(null);
    showToast(t("deleted"));
  }, [boxes, commit, currentId, draft.id, openBox, pendingDelete, resetForm, showToast, t]);

  /* Photos added or dropped from the open box write straight through. */
  const patchCurrent = useCallback(
    (patch: (box: Box) => Box) => {
      if (!current) return;
      const next = { ...patch(current), updatedAt: Date.now() };
      commit(boxes.map((b) => (b.id === next.id ? next : b)));
      void saveBox(next);
    },
    [boxes, commit, current],
  );

  const onDetailAddPhotos = useCallback(
    async (files: FileList | null) => {
      const photos = await filesToPhotos(files);
      if (!photos.length) return;
      patchCurrent((box) => ({ ...box, photos: [...box.photos, ...photos] }));
      showToast(t("saved"));
    },
    [patchCurrent, showToast, t],
  );

  const onDetailRemovePhoto = useCallback(
    (id: string) => {
      patchCurrent((box) => ({ ...box, photos: box.photos.filter((p) => p.id !== id) }));
    },
    [patchCurrent],
  );

  const onCopyUrl = useCallback(
    (url: string) => {
      void navigator.clipboard?.writeText(url).catch(() => {});
      showToast(t("copied"));
    },
    [showToast, t],
  );

  const onExport = useCallback(() => {
    exportJson(boxes);
    showToast(t("exported"));
  }, [boxes, showToast, t]);

  const onImport = useCallback(
    async (file: File) => {
      try {
        const merged = mergeBoxes(boxes, parseImport(await file.text()));
        commit(merged);
        void replaceAll(merged);
        showToast(t("imported"));
      } catch {
        showToast(t("importFail"));
      }
    },
    [boxes, commit, showToast, t],
  );

  const shown = useMemo(() => boxes.filter((b) => matchesQuery(b, query)), [boxes, query]);
  const detailUrl = current ? boxUrl(current, lang) : window.location.href;

  return (
    <>
      <div className="bq-shell">
        <LocalOnlyBanner text={t("localOnly")} />
        <Masthead
          title={t("title")}
          tagline={t("tagline")}
          langLabel={t("langLabel")}
          lang={lang}
          onLangChange={setLang}
        />
        <p className="bq-stencil-strip" id="unlimited">
          {t("unlimited")}
        </p>

        {currentId ? (
          loaded && (
            <BoxDetail
              t={t}
              box={current}
              url={detailUrl}
              onBack={() => openBox(null)}
              onAddPhotos={onDetailAddPhotos}
              onRemovePhoto={onDetailRemovePhoto}
              onEdit={onEdit}
              onDelete={setPendingDelete}
              onCopyUrl={onCopyUrl}
              onPrint={setPrinting}
            />
          )
        ) : (
          <section className="grid gap-3" id="view-list">
            <Card size="sm">
              <CardContent>
                <p className="bq-hint" id="about-text">
                  {t("about")}
                </p>
              </CardContent>
            </Card>

            <label className="bq-search block">
              <span className="sr-only" id="search-label">
                {t("search")}
              </span>
              <Search aria-hidden="true" />
              <input
                id="search"
                className="bq-field"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder={t("searchPh")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <BoxFormCard
              t={t}
              draft={draft}
              onChange={onChangeDraft}
              onSubmit={onSubmit}
              onCancel={resetForm}
              onAddPhotos={onAddDraftPhotos}
              onRemovePhoto={onRemoveDraftPhoto}
              roomRef={roomRef}
            />

            <BoxListCard
              t={t}
              boxes={shown}
              searching={query.trim() !== ""}
              onOpen={(box) => openBox(box.id)}
              onShowQr={setQrBox}
              onEdit={onEdit}
              onDelete={setPendingDelete}
            />
          </section>
        )}


        <ToolsCard t={t} onExport={onExport} onImport={onImport} />

        <footer className="bq-footer">
          <a href={`https://try-dabble.com/privacy?lang=${lang}`}>{t("privacy")}</a>
          <a href={`https://try-dabble.com/terms?lang=${lang}`}>{t("terms")}</a>
          <span>try-dabble.com</span>
        </footer>

        <QrDialog
          t={t}
          box={qrBox}
          url={qrBox ? boxUrl(qrBox, lang) : ""}
          onOpenChange={(open) => {
            if (!open) setQrBox(null);
          }}
          onCopyUrl={onCopyUrl}
          onPrint={(box) => {
            setQrBox(null);
            setPrinting(box);
          }}
        />
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
      {/* Sibling of .bq-shell, never a child: @media print hides the shell
          outright and leaves only the sticker on the page. */}
      <PrintSticker t={t} box={printing} url={printing ? boxUrl(printing, lang) : ""} />
    </>
  );
}
