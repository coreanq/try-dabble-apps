import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Player } from "@/components/player";
import { PlaylistCard } from "@/components/playlist-card";
import { PlaylistEditor } from "@/components/playlist-editor";
import { PromiseChips } from "@/components/promise-chips";
import { Toast } from "@/components/toast";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gameDef, type GameId } from "@/lib/games";
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
  loadPlaylists,
  loadSession,
  newPlaylist,
  savePlaylists,
  saveSession,
  sortPlaylists,
  type Playlist,
} from "@/lib/playlists";
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

const TOAST_MS = 2400;

type View = "list" | "editing" | "playing";

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists());
  const [session, setSession] = useState(() => loadSession());
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [running, setRunning] = useState<{ playlist: Playlist; index: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Playlist | null>(null);
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

  const commit = useCallback((next: Playlist[]) => {
    setPlaylists(next);
    savePlaylists(next);
  }, []);

  const ordered = useMemo(() => sortPlaylists(playlists), [playlists]);

  /** The list the saved session belongs to, if it still exists. */
  const resumable = useMemo(() => {
    if (!session) return null;
    const p = playlists.find((x) => x.id === session.playlistId);
    if (!p) return null;
    if (session.index < 0 || session.index >= p.games.length) return null;
    return { playlist: p, index: session.index };
  }, [session, playlists]);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleSave(name: string, games: GameId[], loop: boolean) {
    const clean = name.trim();
    if (!clean) {
      showToast(t("needName"));
      return;
    }
    if (games.length === 0) {
      showToast(t("needGame"));
      return;
    }
    if (editing) {
      commit(
        playlists.map((p) =>
          p.id === editing.id
            ? { ...p, name: clean, games, loop, updatedAt: Date.now() }
            : p,
        ),
      );
    } else {
      commit([...playlists, newPlaylist(clean, games, loop)]);
    }
    setEditing(null);
    setView("list");
    showToast(t("saved"));
  }

  function startPlaying(playlist: Playlist, index: number) {
    setRunning({ playlist, index });
    setView("playing");
  }

  const rememberProgress = useCallback((playlistId: string, index: number) => {
    const next = { playlistId, index, updatedAt: Date.now() };
    setSession(next);
    saveSession(next);
  }, []);

  const clearProgress = useCallback(() => {
    setSession(null);
    saveSession(null);
  }, []);

  /* Identity has to be stable for as long as one list is running: the Player
     reports its position from an effect, and an arrow rebuilt on every render
     would report, re-render, and report again. */
  const runningId = running?.playlist.id;
  const handleProgress = useCallback(
    (index: number) => {
      if (runningId) rememberProgress(runningId, index);
    },
    [runningId, rememberProgress],
  );

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    commit(playlists.filter((p) => p.id !== id));
    if (session?.playlistId === id) clearProgress();
    setPendingDelete(null);
    showToast(t("deletedMsg"));
  }

  const promises: MsgKey[] = [
    "promiseLogin",
    "promiseLock",
    "promiseSub",
    "promiseAll",
    "promisePersist",
    "promiseCalm",
  ];

  if (view === "playing" && running) {
    return (
      <Player
        playlist={running.playlist}
        startIndex={running.index}
        t={t}
        onProgress={handleProgress}
        onFinish={clearProgress}
        onExit={() => {
          setRunning(null);
          setView("list");
        }}
      />
    );
  }

  return (
    <div className="ps-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <PromiseChips t={t} />

      {view === "editing" ? (
        <PlaylistEditor
          t={t}
          editing={editing}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setView("list");
          }}
        />
      ) : (
        <>
          {/* Somebody stopped part-way through. Offer the same place back
              before anything else on the screen. */}
          {resumable ? (
            <Card id="resume-card" data-tone="mint">
              <CardHeader>
                <CardTitle id="resume-title">{t("resumeTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="ps-note" id="resume-body">
                  {t("resumeBody", {
                    name: resumable.playlist.name,
                    i: resumable.index + 1,
                  })}
                  {" · "}
                  {t(gameDef(resumable.playlist.games[resumable.index]).nameKey)}
                </p>
                <button
                  type="button"
                  className="ps-big mt-3"
                  id="resume-go"
                  onClick={() => startPlaying(resumable.playlist, resumable.index)}
                >
                  ▶ {t("resume")}
                </button>
                <button
                  type="button"
                  className="ps-big mt-2.5"
                  data-tone="calm"
                  id="resume-restart"
                  onClick={() => startPlaying(resumable.playlist, 0)}
                >
                  {t("startOver")}
                </button>
              </CardContent>
            </Card>
          ) : null}

          {playlists.length === 0 ? (
            <EmptyState
              t={t}
              onStart={() => {
                setEditing(null);
                setView("editing");
              }}
            />
          ) : (
            <Card id="lists-card" data-tone="sky">
              <CardHeader>
                <CardTitle id="lists-title">{t("playlistsTitle")}</CardTitle>
                <CardAction>
                  <span className="font-[family-name:var(--stack-tag)] text-[0.74rem] font-extrabold text-muted-ink">
                    {t("playlistsCount", { n: playlists.length })}
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3" id="lists">
                  {ordered.map((p) => (
                    <PlaylistCard
                      key={p.id}
                      playlist={p}
                      t={t}
                      onPlay={(x) => startPlaying(x, 0)}
                      onEdit={(x) => {
                        setEditing(x);
                        setView("editing");
                      }}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <button
            type="button"
            className="ps-big"
            data-tone="calm"
            id="new-playlist"
            onClick={() => {
              setEditing(null);
              setView("editing");
            }}
          >
            + {t("newPlaylist")}
          </button>

          <Card id="how-card" data-tone="lilac">
            <CardHeader>
              <CardTitle id="how-title">{t("howTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="ps-note" id="how-1">
                {t("howStep1")}
              </p>
              <p className="ps-note" id="how-2">
                {t("howStep2")}
              </p>
              <p className="ps-note" id="how-3">
                {t("howStep3")}
              </p>
            </CardContent>
          </Card>

          <Card id="promise-card" className="bg-felt-2/70">
            <CardHeader>
              <CardTitle id="promise-title">{t("promiseTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {promises.map((key) => (
                  <li className="ps-bullet" key={key}>
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <p className="ps-note mt-3" id="about-text">
                {t("about")}
              </p>
            </CardContent>
          </Card>


          <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.8rem] text-muted-ink">
            <a id="link-privacy" href={`https://try-dabble.com/privacy?lang=${lang}`}>
              {t("privacy")}
            </a>
            <a id="link-terms" href={`https://try-dabble.com/terms?lang=${lang}`}>
              {t("terms")}
            </a>
            <span>try-dabble.com</span>
          </footer>
        </>
      )}

      <Toast message={toastMsg} visible={toastOn} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteTitle", { name: pendingDelete?.name ?? "" })}
        body={t("deleteBody")}
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
