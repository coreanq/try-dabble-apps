import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PinDialog } from "@/components/pin-dialog";
import { PinEntry } from "@/components/pin-entry";
import { PinMap, type MapApi } from "@/components/pin-map";
import { SearchBox } from "@/components/search-box";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  deletePhoto,
  loadPins,
  loadView,
  matchesQuery,
  newPin,
  putPhoto,
  savePins,
  saveView,
  shrinkImage,
  sortPins,
  type MapView,
  type Pin,
} from "@/lib/pins";
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

const TOAST_MS = 2200;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [pins, setPins] = useState<Pin[]>(() => sortPins(loadPins()));
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pin | null>(null);
  // Bumped whenever a photo is written or removed, so every open object URL
  // for that pin is rebuilt from IndexedDB.
  const [photoVersion, setPhotoVersion] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const mapApi = useRef<MapApi | null>(null);
  // Read once: later re-renders must not reset the camera the user panned.
  const initialView = useMemo<MapView>(() => loadView(), []);

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

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(DATE_LOCALE[lang], {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [lang],
  );

  const visible = useMemo(
    () => pins.filter((p) => matchesQuery(p, query)),
    [pins, query],
  );
  const openPin = useMemo(
    () => pins.find((p) => p.id === openId) ?? null,
    [pins, openId],
  );

  const commit = useCallback((next: Pin[]) => {
    const sorted = sortPins(next);
    setPins(sorted);
    savePins(sorted);
  }, []);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  /** Tap the map, get a pin. It is stored before the memo sheet even opens, so
   *  nothing is lost if the sheet is dismissed. */
  const dropPin = useCallback(
    (lat: number, lng: number) => {
      const pin = newPin(lat, lng);
      commit([pin, ...pins]);
      setQuery("");
      setOpenId(pin.id);
      showToast(t("pinAdded"));
    },
    [commit, pins, showToast, t],
  );

  function handlePinCentre() {
    const centre = mapApi.current?.center();
    if (!centre) return;
    dropPin(centre.lat, centre.lng);
  }

  function handleMemo(id: string, memo: string) {
    commit(pins.map((p) => (p.id === id ? { ...p, memo, updatedAt: Date.now() } : p)));
  }

  async function handlePickPhoto(id: string, file: File) {
    try {
      const blob = await shrinkImage(file);
      await putPhoto(id, blob);
      commit(pins.map((p) => (p.id === id ? { ...p, photo: true, updatedAt: Date.now() } : p)));
      setPhotoVersion((v) => v + 1);
    } catch {
      showToast(t("photoFailed"));
    }
  }

  async function handleRemovePhoto(id: string) {
    await deletePhoto(id);
    commit(pins.map((p) => (p.id === id ? { ...p, photo: false, updatedAt: Date.now() } : p)));
    setPhotoVersion((v) => v + 1);
  }

  const openFromList = useCallback((id: string) => {
    const pin = pins.find((p) => p.id === id);
    if (pin) mapApi.current?.focus(pin.lat, pin.lng);
    setOpenId(id);
  }, [pins]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    await deletePhoto(id);
    commit(pins.filter((p) => p.id !== id));
    setPendingDelete(null);
    setOpenId(null);
    showToast(t("pinDeleted"));
  }

  const promises: MsgKey[] = [
    "promiseLogin",
    "promiseStamina",
    "promisePhoto",
    "promiseSub",
    "promisePrivate",
  ];

  return (
    <div className="mm-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <section className="mm-sheet" aria-label={t("mapAria")}>
        <PinMap
          pins={visible}
          selectedId={openId}
          initialView={initialView}
          ariaLabel={t("mapAria")}
          apiRef={mapApi}
          onDrop={dropPin}
          onOpen={setOpenId}
          onViewChange={saveView}
        />
        <p className="mm-maphint" id="map-hint">
          {t("mapHint")}
        </p>
        <div className="mt-[0.35rem] flex flex-wrap items-center gap-[0.4rem]">
          <span className="mm-stamp" id="pin-count">
            {t("pinCount", { n: pins.length })}
          </span>
          <Button
            id="pin-centre"
            className="ml-auto"
            variant="outline"
            size="sm"
            onClick={handlePinCentre}
          >
            {t("addHere")}
          </Button>
        </div>
      </section>

      {pins.length === 0 ? <EmptyState t={t} onPinCentre={handlePinCentre} /> : null}

      {pins.length > 0 ? (
        <Card id="list-card">
          <CardHeader>
            <CardTitle id="list-title">{t("listTitle")}</CardTitle>
            <CardAction>
              <span className="mm-date">{t("pinCount", { n: visible.length })}</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <SearchBox value={query} onChange={setQuery} t={t} />

            {visible.length === 0 ? (
              <p className="mt-3 mb-0 text-[0.8rem] text-muted-ink" id="search-empty">
                {t("searchEmpty", { q: query })}
              </p>
            ) : (
              <div className="mt-[0.6rem] flex flex-col gap-[0.5rem]" id="pin-list">
                {visible.map((pin) => (
                  <PinEntry
                    key={pin.id}
                    pin={pin}
                    t={t}
                    dateLabel={dateFmt.format(new Date(pin.createdAt))}
                    onOpen={openFromList}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card id="promise-card" className="bg-paper-2/70">
        <CardHeader>
          <CardTitle id="promise-title">{t("promiseTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
            {promises.map((key) => (
              <li className="mm-promise" key={key}>
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
        <a id="link-privacy" href="/privacy.html">
          {t("privacy")}
        </a>
        <a id="link-terms" href="/terms.html">
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <PinDialog
        pin={openPin}
        t={t}
        dateLabel={openPin ? dateFmt.format(new Date(openPin.createdAt)) : ""}
        photoVersion={photoVersion}
        onMemo={handleMemo}
        onPickPhoto={handlePickPhoto}
        onRemovePhoto={handleRemovePhoto}
        onDelete={setPendingDelete}
        onClose={() => setOpenId(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteConfirmTitle")}
        body={t("deleteConfirmBody")}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
