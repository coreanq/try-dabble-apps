import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AddSongForm } from "@/components/add-song-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PromiseChips } from "@/components/promise-chips";
import { SearchBox } from "@/components/search-box";
import { SongStub, type SongPatch } from "@/components/song-stub";
import { Toast } from "@/components/toast";
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
  clampYears,
  isDue,
  isISODate,
  loadDefaultYears,
  loadSongs,
  lovedAgain,
  matchesQuery,
  newSong,
  parseISO,
  saveDefaultYears,
  saveSongs,
  sortSongs,
  todayISO,
  type Song,
} from "@/lib/songs";
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
/** A song can come due while the tab is open — recheck the calendar day. */
const DAY_TICK_MS = 60_000;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [songs, setSongs] = useState<Song[]>(() => loadSongs());
  const [defaultYears, setDefaultYears] = useState<number>(() => loadDefaultYears());
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Song | null>(null);
  const [today, setToday] = useState<string>(() => todayISO());
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

  // Midnight, or coming back to a tab left open for days, must move songs into
  // the "back now" list without a reload.
  useEffect(() => {
    const sync = () => setToday(todayISO());
    const id = window.setInterval(sync, DAY_TICK_MS);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
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

  const dateLabel = useCallback(
    (iso: string) => {
      const d = parseISO(iso);
      return d ? dateFmt.format(d) : "";
    },
    [dateFmt],
  );

  /** Every change goes straight to storage. There is no Save button, and the
   *  shelf is still there after the tab is closed. */
  const commit = useCallback((next: Song[]) => {
    setSongs(next);
    saveSongs(next);
  }, []);

  const ordered = useMemo(() => sortSongs(songs), [songs]);
  const visible = useMemo(
    () => ordered.filter((s) => matchesQuery(s, query)),
    [ordered, query],
  );
  const dueSongs = useMemo(
    () => visible.filter((s) => isDue(s, today)),
    [visible, today],
  );
  const waitingSongs = useMemo(
    () => visible.filter((s) => !isDue(s, today)),
    [visible, today],
  );

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleDefaultYears(years: number) {
    const next = clampYears(years);
    setDefaultYears(next);
    saveDefaultYears(next);
  }

  function handleToggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function handleAdd(title: string, artist: string, lastLoved: string, years: number) {
    const song = newSong(title, artist, lastLoved, years);
    commit([song, ...songs]);
    setQuery("");
    showToast(t("songAdded", { title: song.title, n: song.years }));
  }

  function handlePatch(id: string, patch: SongPatch) {
    commit(
      songs.map((s) => {
        if (s.id !== id) return s;
        const next: Song = { ...s, updatedAt: Date.now() };
        if (patch.lastLoved !== undefined && isISODate(patch.lastLoved)) {
          next.lastLoved = patch.lastLoved;
        }
        if (patch.years !== undefined) next.years = clampYears(patch.years);
        return next;
      }),
    );
  }

  function handleLovedAgain(song: Song) {
    const next = lovedAgain(song, today);
    commit(songs.map((s) => (s.id === song.id ? next : s)));
    showToast(t("lovedAgainDone", { title: next.title, n: next.years }));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    commit(songs.filter((s) => s.id !== id));
    setPendingDelete(null);
    if (openId === id) setOpenId(null);
    showToast(t("songDeleted"));
  }

  const promises: MsgKey[] = [
    "promiseLogin",
    "promiseLock",
    "promiseStream",
    "promiseTitleOnly",
    "promisePersist",
    "promiseFree",
  ];

  const stubProps = (song: Song, due: boolean) => ({
    key: song.id,
    song,
    t,
    due,
    open: openId === song.id,
    dateLabel,
    onToggle: handleToggle,
    onPatch: handlePatch,
    onLovedAgain: handleLovedAgain,
    onDelete: setPendingDelete,
  });

  return (
    <div className="ll-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <PromiseChips t={t} />

      <AddSongForm
        t={t}
        defaultYears={defaultYears}
        onYearsChange={handleDefaultYears}
        onAdd={handleAdd}
      />

      {songs.length === 0 ? <EmptyState t={t} /> : null}

      {songs.length > 0 ? (
        <Card id="shelf-card">
          <CardHeader>
            <CardTitle id="shelf-title">{t("shelfTitle")}</CardTitle>
            <CardAction>
              <span className="ll-meta" id="song-count">
                {t("songCount", { n: songs.length })}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <SearchBox value={query} onChange={setQuery} t={t} />

            {visible.length === 0 ? (
              <p className="mt-3 mb-0 text-[0.8rem] text-muted-ink" id="search-empty">
                {t("searchEmpty", { q: query })}
              </p>
            ) : null}

            {/* Songs whose N years have passed are their own list, above the
                ones still sealed. That separation is the product. */}
            {dueSongs.length > 0 ? (
              <section className="mt-[0.75rem]" id="due-section">
                <div className="ll-side">
                  <span className="ll-side-mark" data-tone="due">
                    {t("stampBack")}
                  </span>
                  <h3 className="m-0 font-heading text-[0.95rem] font-bold text-ink" id="due-title">
                    {t("dueTitle")}
                  </h3>
                  <span className="ll-meta" id="due-count">
                    {t("dueCount", { n: dueSongs.length })}
                  </span>
                </div>
                <p className="mt-[0.2rem] mb-0 text-[0.74rem] text-muted-ink" id="due-sub">
                  {t("dueSub")}
                </p>
                <div className="mt-[0.5rem] flex flex-col gap-[0.5rem]" id="due-list">
                  {dueSongs.map((song) => (
                    <SongStub {...stubProps(song, true)} />
                  ))}
                </div>
              </section>
            ) : null}

            {waitingSongs.length > 0 ? (
              <section className="mt-[0.9rem]" id="waiting-section">
                <div className="ll-side">
                  <span className="ll-side-mark">↺</span>
                  <h3
                    className="m-0 font-heading text-[0.95rem] font-bold text-ink"
                    id="waiting-title"
                  >
                    {t("waitingTitle")}
                  </h3>
                  <span className="ll-meta" id="waiting-count">
                    {t("waitingCount", { n: waitingSongs.length })}
                  </span>
                </div>
                <p className="mt-[0.2rem] mb-0 text-[0.74rem] text-muted-ink" id="waiting-sub">
                  {t("waitingSub")}
                </p>
                <div className="mt-[0.5rem] flex flex-col gap-[0.5rem]" id="waiting-list">
                  {waitingSongs.map((song) => (
                    <SongStub {...stubProps(song, false)} />
                  ))}
                </div>
              </section>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card id="promise-card" className="bg-stub-2/70">
        <CardHeader>
          <CardTitle id="promise-title">{t("promiseTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
            {promises.map((key) => (
              <li className="ll-promise" key={key}>
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
        title={t("deleteConfirmTitle", { title: pendingDelete?.title ?? "" })}
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
