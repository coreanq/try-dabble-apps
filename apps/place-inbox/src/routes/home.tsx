import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PlaceDialog, type PlaceDraft } from "@/components/place-dialog";
import { PlaceStamp } from "@/components/place-stamp";
import { Toast } from "@/components/toast";
import { ToolsCard } from "@/components/tools-card";
import { TripDialog } from "@/components/trip-dialog";
import { Button } from "@/components/ui/button";
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
  INBOX_FILTER,
  RANKS,
  TAGS,
  buildExport,
  clampRank,
  deletePhoto,
  deletePlace,
  deleteTrip,
  filterPlaces,
  isoDate,
  loadAll,
  loadSettings,
  looksLikeUrl,
  normalizeUrl,
  parseImport,
  parseLatLng,
  replaceAll,
  savePhoto,
  savePlace,
  saveSettings,
  saveTrip,
  tripNameOf,
  uid,
  type Place,
  type Trip,
} from "@/lib/places";
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

const TAG_LABEL: Record<(typeof TAGS)[number], MsgKey> = {
  food: "tagFood",
  hike: "tagHike",
  city: "tagCity",
  beach: "tagBeach",
  stay: "tagStay",
};

// Leaflet is only worth downloading once a place actually has coordinates.
const PinMap = lazy(() =>
  import("@/components/pin-map").then((m) => ({ default: m.PinMap })),
);

const TOAST_MS = 1800;

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

function byName<T extends { name: string }>(a: T, b: T) {
  return (a.name || "").localeCompare(b.name || "");
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [places, setPlaces] = useState<Place[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [query, setQuery] = useState("");
  const [settings, setSettings] = useState(loadSettings);

  const [placeOpen, setPlaceOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [incomingPhoto, setIncomingPhoto] = useState<Blob | null>(null);
  const [incomingUrl, setIncomingUrl] = useState("");
  const [tripOpen, setTripOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; run: () => void } | null>(null);

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

  useEffect(() => {
    let live = true;
    loadAll().then(({ places: p, trips: tr }) => {
      if (!live) return;
      setPlaces(p);
      setTrips(tr);
    });
    return () => {
      live = false;
    };
  }, []);

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

  const patchSettings = useCallback((changes: Partial<typeof settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...changes };
      saveSettings(next);
      return next;
    });
  }, []);

  const sortedTrips = useMemo(() => trips.slice().sort(byName), [trips]);
  const inboxLabel = t("inbox");
  const shown = useMemo(
    () =>
      filterPlaces(
        places,
        trips,
        {
          trip: settings.filterTrip,
          tag: settings.filterTag,
          rank: settings.filterRank,
          query,
        },
        inboxLabel,
      ),
    [places, trips, settings, query, inboxLabel],
  );
  const pinned = useMemo(
    () => shown.filter((p) => p.lat != null && p.lng != null),
    [shown],
  );

  const anyDialogOpen = placeOpen || tripOpen || confirm !== null;

  function openNewPlace(photo: Blob | null, url: string) {
    setEditingPlace(null);
    setIncomingPhoto(photo);
    setIncomingUrl(url);
    setPlaceOpen(true);
  }

  function openEditPlace(place: Place) {
    setEditingPlace(place);
    setIncomingPhoto(null);
    setIncomingUrl("");
    setPlaceOpen(true);
  }

  // Paste anywhere: an image starts a new place with that screenshot, a URL
  // starts one with the link already filled in. The open dialog handles its own
  // paste, so this only fires on the bare page.
  useEffect(() => {
    if (anyDialogOpen) return;
    function onPaste(e: ClipboardEvent) {
      for (const item of e.clipboardData?.items ?? []) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        openNewPlace(file, "");
        return;
      }
      const text = (e.clipboardData?.getData("text") || "").trim();
      if (text && looksLikeUrl(text)) {
        e.preventDefault();
        openNewPlace(null, normalizeUrl(text));
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [anyDialogOpen]);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handlePlaceSubmit(draft: PlaceDraft): boolean {
    const existing = draft.id ? (places.find((p) => p.id === draft.id) ?? null) : null;
    const keptPhotoId = draft.photoCleared ? null : (existing?.photoId ?? null);
    const photoId = draft.photoBlob ? uid() : keptPhotoId;
    if (!draft.name && !draft.url && !photoId) {
      showToast(t("needName"));
      return false;
    }

    const coords = parseLatLng(draft.latlng);
    const now = Date.now();
    const record: Place = {
      id: existing?.id ?? uid(),
      name: draft.name,
      url: draft.url,
      why: draft.why,
      rank: clampRank(draft.rank),
      tags: draft.tags,
      tripId: draft.tripId,
      mapsUrl: draft.mapsUrl,
      igUrl: draft.igUrl,
      pinterestUrl: draft.pinterestUrl,
      lat: coords.lat,
      lng: coords.lng,
      photoId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    setPlaces((prev) =>
      existing ? prev.map((p) => (p.id === record.id ? record : p)) : [...prev, record],
    );
    void (async () => {
      if (draft.photoBlob && photoId) await savePhoto(photoId, draft.photoBlob);
      if (existing?.photoId && existing.photoId !== photoId) await deletePhoto(existing.photoId);
      await savePlace(record);
    })();
    showToast(t("saved"));
    return true;
  }

  function handlePlaceDelete(place: Place) {
    setConfirm({
      message: t("deletePlaceConfirm"),
      run: () => {
        setPlaces((prev) => prev.filter((p) => p.id !== place.id));
        void (async () => {
          await deletePlace(place.id);
          await deletePhoto(place.photoId);
        })();
        setPlaceOpen(false);
        showToast(t("deleted"));
      },
    });
  }

  function handleTripSubmit(id: string | null, name: string): boolean {
    if (!name) {
      showToast(t("needName"));
      return false;
    }
    const existing = id ? (trips.find((tr) => tr.id === id) ?? null) : null;
    const record: Trip = {
      id: existing?.id ?? uid(),
      name,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    setTrips((prev) =>
      existing ? prev.map((tr) => (tr.id === record.id ? record : tr)) : [...prev, record],
    );
    void saveTrip(record);
    showToast(t("saved"));
    return true;
  }

  function handleTripDelete(trip: Trip) {
    setConfirm({
      message: t("deleteTripConfirm", { name: trip.name }),
      run: () => {
        // Deleting a bucket never deletes what is in it — those places fall
        // back to the unassigned inbox.
        const now = Date.now();
        const freed = places
          .filter((p) => p.tripId === trip.id)
          .map((p) => ({ ...p, tripId: "", updatedAt: now }));
        setTrips((prev) => prev.filter((tr) => tr.id !== trip.id));
        setPlaces((prev) =>
          prev.map((p) => freed.find((f) => f.id === p.id) ?? p),
        );
        if (settings.filterTrip === trip.id) patchSettings({ filterTrip: "" });
        void (async () => {
          await deleteTrip(trip.id);
          for (const place of freed) await savePlace(place);
        })();
        setTripOpen(false);
        showToast(t("deleted"));
      },
    });
  }

  async function handleExport() {
    const payload = await buildExport(places, trips);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `place-inbox-${isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(href);
    showToast(payload.photoSkipped ? t("photoSkipped") : t("exported"));
  }

  async function handleImport(file: File) {
    try {
      const parsed = parseImport(JSON.parse(await file.text()));
      if (!parsed) throw new Error("bad file");
      await replaceAll(parsed);
      setPlaces(parsed.places);
      setTrips(parsed.trips);
      showToast(t("imported"));
    } catch {
      showToast(t("importFail"));
    }
  }

  function selectTrip(id: string) {
    // Tapping the trip you are already filtered to opens it for renaming.
    if (id && id !== INBOX_FILTER && settings.filterTrip === id) {
      const trip = trips.find((tr) => tr.id === id);
      if (trip) {
        setEditingTrip(trip);
        setTripOpen(true);
        return;
      }
    }
    patchSettings({ filterTrip: id });
  }

  const filtering = Boolean(
    query || settings.filterTag || settings.filterRank || settings.filterTrip,
  );

  return (
    <div className="pi-shell">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <Card size="sm">
        <CardContent>
          <p id="about-text" className="m-0 text-[0.78rem] leading-5 text-muted-ink">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      <label className="grid min-w-0 gap-1">
        <span className="sr-only" id="search-label">
          {t("search")}
        </span>
        <input
          id="search"
          className="pi-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label={t("search")}
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <Card size="sm" className="pi-leaf-trips">
        <CardHeader>
          <CardTitle id="trips-title">{t("trips")}</CardTitle>
          <CardAction>
            <Button
              id="add-trip-btn"
              variant="secondary"
              size="sm"
              aria-label={t("addTripAria")}
              onClick={() => {
                setEditingTrip(null);
                setTripOpen(true);
              }}
            >
              {t("addTrip")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div id="trip-strip" className="pi-strip" aria-live="polite">
            <button
              type="button"
              className="pi-chip"
              aria-pressed={settings.filterTrip === ""}
              onClick={() => selectTrip("")}
            >
              {t("allTrips")}
            </button>
            <button
              type="button"
              className="pi-chip"
              aria-pressed={settings.filterTrip === INBOX_FILTER}
              onClick={() => selectTrip(INBOX_FILTER)}
            >
              {t("inbox")}
            </button>
            {sortedTrips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                className="pi-chip"
                aria-pressed={settings.filterTrip === trip.id}
                onClick={() => selectTrip(trip.id)}
                onDoubleClick={() => {
                  setEditingTrip(trip);
                  setTripOpen(true);
                }}
              >
                {trip.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle id="places-title">{t("places")}</CardTitle>
          <CardAction>
            <Button
              id="add-place-btn"
              size="sm"
              aria-label={t("addPlaceAria")}
              onClick={() => openNewPlace(null, "")}
            >
              {t("addPlace")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p id="tag-filter-label" className="pi-label m-0">
            {t("tagFilter")}
          </p>
          <div id="tag-filters" className="pi-strip flex-wrap">
            <button
              type="button"
              className="pi-chip"
              aria-pressed={settings.filterTag === ""}
              onClick={() => patchSettings({ filterTag: "" })}
            >
              {t("tagAll")}
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="pi-chip"
                aria-pressed={settings.filterTag === tag}
                onClick={() => patchSettings({ filterTag: tag })}
              >
                {t(TAG_LABEL[tag])}
              </button>
            ))}
          </div>

          <p id="rank-filter-label" className="pi-label m-0 pt-1">
            {t("rankFilter")}
          </p>
          <div id="rank-filters" className="pi-strip flex-wrap">
            <button
              type="button"
              className="pi-chip"
              aria-pressed={settings.filterRank === ""}
              onClick={() => patchSettings({ filterRank: "" })}
            >
              {t("rankAll")}
            </button>
            {RANKS.map((rank) => (
              <button
                key={rank}
                type="button"
                className="pi-chip"
                aria-pressed={settings.filterRank === String(rank)}
                onClick={() => patchSettings({ filterRank: String(rank) })}
              >
                {t("rankN", { n: rank })}
              </button>
            ))}
          </div>

          <p id="sort-hint" className="m-0 pt-1 font-mono text-[0.66rem] tracking-wider text-muted-ink uppercase">
            {t("sortHint")} · {shown.length}
          </p>

          {shown.length === 0 ? (
            <p id="places-empty" className="m-0 py-4 text-center text-[0.8rem] text-muted-ink">
              {filtering ? t("emptySearch") : t("emptyPlaces")}
            </p>
          ) : (
            <ul id="place-grid" className="m-0 grid list-none gap-2 p-0" aria-live="polite">
              {shown.map((place) => (
                <PlaceStamp
                  key={place.id}
                  place={place}
                  tripLabel={tripNameOf(trips, place.tripId, inboxLabel)}
                  t={t}
                  onEdit={openEditPlace}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card size="sm" id="map-section">
        <CardHeader>
          <CardTitle id="map-title">{t("mapTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {pinned.length === 0 ? (
            <p id="map-empty" className="m-0 py-3 text-center text-[0.8rem] text-muted-ink">
              {t("emptyMap")}
            </p>
          ) : (
            <Suspense fallback={<div id="map" className="pi-map" />}>
              <PinMap places={pinned} />
            </Suspense>
          )}
        </CardContent>
      </Card>


      <ToolsCard t={t} onExport={handleExport} onImport={handleImport} />

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 pb-2 font-mono text-[0.68rem] tracking-wide text-muted-ink">
        <a id="link-privacy" href="/privacy.html">
          {t("privacy")}
        </a>
        <a id="link-terms" href="/terms.html">
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      <PlaceDialog
        open={placeOpen}
        place={editingPlace}
        incomingPhoto={incomingPhoto}
        incomingUrl={incomingUrl}
        trips={sortedTrips}
        defaultTripId={
          settings.filterTrip && settings.filterTrip !== INBOX_FILTER ? settings.filterTrip : ""
        }
        t={t}
        onOpenChange={setPlaceOpen}
        onSubmit={handlePlaceSubmit}
        onDelete={handlePlaceDelete}
      />

      <TripDialog
        open={tripOpen}
        trip={editingTrip}
        t={t}
        onOpenChange={setTripOpen}
        onSubmit={handleTripSubmit}
        onDelete={handleTripDelete}
      />

      <ConfirmDialog
        open={confirm !== null}
        message={confirm?.message ?? ""}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          confirm?.run();
          setConfirm(null);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
