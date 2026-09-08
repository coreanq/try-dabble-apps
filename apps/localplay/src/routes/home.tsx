import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  Disc3,
  Download,
  FolderOpen,
  ListMusic,
  ListPlus,
  Music2,
  Pause,
  Pencil,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  AddToPlaylistDialog,
  EditTrackDialog,
  EqDialog,
  NameDialog,
  TrackActionsDialog,
} from "@/components/dialogs";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { TrackRow } from "@/components/track-row";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadBackup, mergeBackup, parseBackup } from "@/lib/backup-json";
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
  EMPTY_QUEUE,
  SPEEDS,
  dropAudio,
  formatClock,
  getAudio,
  guessFromFileName,
  hasAudio,
  isAudioFile,
  loadPlaylists,
  loadPrefs,
  loadQueue,
  loadRecent,
  loadTracks,
  pickAudioFiles,
  pickDirectoryFiles,
  probeDuration,
  pushRecent,
  putAudio,
  savePlaylists,
  savePrefs,
  saveQueue,
  saveRecent,
  saveTracks,
  storageAvailable,
  uid,
  type EqBands,
  type Playlist,
  type Prefs,
  type QueueState,
  type Track,
  type View,
} from "@/lib/library";
import {
  appendToQueue,
  buildQueue,
  currentId,
  cycleRepeat,
  indexAfterEnded,
  indexAfterSkip,
  indexBeforeSkip,
  pruneQueue,
  removeFromQueue,
  setShuffle,
} from "@/lib/queue";
import { readTags } from "@/lib/tags";
import { usePlayer } from "@/lib/use-player";
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

const VIEWS: { key: View; label: MsgKey }[] = [
  { key: "tracks", label: "viewTracks" },
  { key: "albums", label: "viewAlbums" },
  { key: "artists", label: "viewArtists" },
  { key: "playlists", label: "viewPlaylists" },
  { key: "favorites", label: "viewFavorites" },
  { key: "recent", label: "viewRecent" },
];

const CHIP_KEYS: MsgKey[] = [
  "chipOffline",
  "chipNoSub",
  "chipNoAds",
  "chipJson",
  "chipNoCaps",
  "chipNoLogin",
  "chipLocal",
];

type Drill = { kind: "album" | "artist"; key: string } | { kind: "playlist"; id: string } | null;

const TOAST_MS = 2400;

function byTitle(a: Track, b: Track): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true });
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [tracks, setTracks] = useState<Track[]>(() => loadTracks());
  const [playlists, setPlaylists] = useState<Playlist[]>(() =>
    loadPlaylists(new Set(loadTracks().map((tr) => tr.id))),
  );
  const [queue, setQueue] = useState<QueueState>(() =>
    loadQueue(new Set(loadTracks().map((tr) => tr.id))),
  );
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [recent, setRecent] = useState<string[]>(() =>
    loadRecent(new Set(loadTracks().map((tr) => tr.id))),
  );
  const [missing, setMissing] = useState<Set<string>>(() => new Set());
  const [storageOk, setStorageOk] = useState(true);
  const [view, setView] = useState<View>(() => loadPrefs().view ?? "tracks");
  const [drill, setDrill] = useState<Drill>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [addToPlaylistId, setAddToPlaylistId] = useState<string | null>(null);
  const [nameDialog, setNameDialog] = useState<
    { mode: "create"; withTrack: string | null } | { mode: "rename"; playlistId: string } | null
  >(null);
  const [eqOpen, setEqOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [pendingDeletePlaylist, setPendingDeletePlaylist] = useState<string | null>(null);
  const [pendingClearQueue, setPendingClearQueue] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const dirInput = useRef<HTMLInputElement | null>(null);
  const jsonInput = useRef<HTMLInputElement | null>(null);

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
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  /* ---------- persistence ---------- */

  const commitTracks = useCallback((next: Track[]) => {
    setTracks(next);
    saveTracks(next);
  }, []);
  const commitPlaylists = useCallback((next: Playlist[]) => {
    setPlaylists(next);
    savePlaylists(next);
  }, []);
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const commitQueue = useCallback((next: QueueState) => {
    queueRef.current = next;
    setQueue(next);
    saveQueue(next);
  }, []);
  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);
  const commitRecent = useCallback((next: string[]) => {
    setRecent(next);
    saveRecent(next);
  }, []);

  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const trackById = useMemo(() => new Map(tracks.map((tr) => [tr.id, tr])), [tracks]);

  // Audio that is gone (cleared site data, a browser without OPFS) must say
  // so on the row rather than sit there and refuse to play.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await storageAvailable();
      const gone = new Set<string>();
      for (const tr of loadTracks()) {
        if (!(await hasAudio(tr.opfsKey))) gone.add(tr.id);
      }
      if (!cancelled) {
        setStorageOk(ok);
        setMissing(gone);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- player ---------- */

  const startTrackRef = useRef<(id: string) => Promise<void>>(async () => {});

  const player = usePlayer({
    speed: prefs.speed,
    eqBands: prefs.eqBands,
    onEnded: () => {
      const q = queueRef.current;
      const next = indexAfterEnded(q);
      if (next === null) {
        player.stop();
        return;
      }
      commitQueue({ ...q, index: next });
      void startTrackRef.current(q.trackIds[next]);
    },
    onError: () => {
      showToast(t("toastPlayFail"));
    },
    onLoadedDuration: (seconds) => {
      const id = currentId(queueRef.current);
      if (!id) return;
      const tr = tracksRef.current.find((x) => x.id === id);
      if (!tr || (tr.duration && Math.abs(tr.duration - seconds) < 1)) return;
      commitTracks(tracksRef.current.map((x) => (x.id === id ? { ...x, duration: seconds } : x)));
    },
  });

  const current = useMemo(() => {
    const id = currentId(queue);
    return id ? (trackById.get(id) ?? null) : null;
  }, [queue, trackById]);

  const startTrack = useCallback(
    async (id: string) => {
      const tr = tracksRef.current.find((x) => x.id === id);
      if (!tr) return;
      const file = await getAudio(tr.opfsKey);
      if (!file) {
        setMissing((prev) => new Set(prev).add(id));
        player.stop();
        showToast(t("missingFile"));
        return;
      }
      const ok = await player.load(file, true);
      if (!ok) showToast(t("toastPlayFail"));
      const now = Date.now();
      commitTracks(tracksRef.current.map((x) => (x.id === id ? { ...x, lastPlayedAt: now } : x)));
      commitRecent(pushRecent(recent, id));
    },
    [commitRecent, commitTracks, player, recent, showToast, t],
  );
  startTrackRef.current = startTrack;

  const playFrom = useCallback(
    (ids: string[], startId: string) => {
      const q = buildQueue(ids, startId, queueRef.current.shuffle, queueRef.current.repeat);
      commitQueue(q);
      void startTrack(startId);
    },
    [commitQueue, startTrack],
  );

  const jumpTo = useCallback(
    (index: number) => {
      const q = queueRef.current;
      if (index < 0 || index >= q.trackIds.length) return;
      commitQueue({ ...q, index });
      void startTrack(q.trackIds[index]);
    },
    [commitQueue, startTrack],
  );

  const handleToggle = useCallback(() => {
    if (!current) return;
    if (player.phase === "playing") {
      player.pause();
      return;
    }
    if (player.phase === "paused" && player.duration > 0) {
      void player.play().then((ok) => {
        if (!ok) showToast(t("toastPlayFail"));
      });
      return;
    }
    void startTrack(current.id);
  }, [current, player, showToast, startTrack, t]);

  const handleNext = useCallback(() => {
    const next = indexAfterSkip(queueRef.current);
    if (next !== null) jumpTo(next);
  }, [jumpTo]);

  const handlePrev = useCallback(() => {
    if (player.position > 3) {
      player.seek(0);
      return;
    }
    const prev = indexBeforeSkip(queueRef.current);
    if (prev !== null) jumpTo(prev);
  }, [jumpTo, player]);

  // Lock screen / headset keys.
  useEffect(() => {
    const ms = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession;
    if (!ms) return;
    try {
      ms.metadata = current
        ? new MediaMetadata({
            title: current.title,
            artist: current.artist || t("unknownArtist"),
            album: current.album || "",
          })
        : null;
      ms.setActionHandler("play", () => handleToggle());
      ms.setActionHandler("pause", () => handleToggle());
      ms.setActionHandler("previoustrack", () => handlePrev());
      ms.setActionHandler("nexttrack", () => handleNext());
    } catch {
      /* not every browser accepts every handler */
    }
  }, [current, handleNext, handlePrev, handleToggle, t]);

  /* ---------- adding files ---------- */

  async function addFiles(picked: File[]) {
    const audio = picked.filter(isAudioFile);
    const skipped = picked.length - audio.length;
    if (audio.length === 0) {
      if (skipped > 0) showToast(t("toastSkipped", { n: skipped }));
      return;
    }
    setBusy(true);
    const existing = tracksRef.current.slice();
    const gone = new Set(missing);
    const added: Track[] = [];
    const addedFiles = new Map<string, File>();
    let relinked = 0;
    let storeFailed = false;

    for (const file of audio) {
      const name = file.name.replace(/^.*[\\/]/, "");
      // Same file name on a row whose audio is gone: relink instead of duplicating.
      const orphan = existing.find(
        (tr) => gone.has(tr.id) && tr.fileName === name && (!tr.size || tr.size === file.size),
      );
      if (orphan) {
        if (await putAudio(orphan.opfsKey, file)) {
          gone.delete(orphan.id);
          relinked++;
          const at = existing.indexOf(orphan);
          existing[at] = { ...orphan, size: file.size };
        } else storeFailed = true;
        continue;
      }
      // Already in the library with audio present: skip silently.
      if (existing.some((tr) => tr.fileName === name && tr.size === file.size && !gone.has(tr.id))) {
        continue;
      }
      const id = uid();
      if (!(await putAudio(id, file))) {
        storeFailed = true;
        continue;
      }
      const tags = await readTags(file);
      const guess = guessFromFileName(name);
      added.push({
        id,
        title: tags.title || guess.title,
        artist: tags.artist || guess.artist,
        album: tags.album,
        addedAt: Date.now(),
        opfsKey: id,
        fileName: name,
        size: file.size,
      });
      addedFiles.set(id, file);
    }

    const merged = [...existing, ...added];
    commitTracks(merged);
    setMissing(gone);
    if (added.length > 0) showToast(t("toastAdded", { n: added.length }));
    else if (relinked > 0) showToast(t("toastRelinked", { n: relinked }));
    if (storeFailed) showToast(t("toastStoreFail"));
    else if (skipped > 0 && added.length === 0 && relinked === 0) showToast(t("toastSkipped", { n: skipped }));

    // Runtimes come after the rows are on screen, so a big folder feels quick.
    const durations = new Map<string, number>();
    for (const [id, file] of addedFiles) {
      const secs = await probeDuration(file);
      if (secs > 0) durations.set(id, secs);
    }
    if (durations.size > 0) {
      commitTracks(
        tracksRef.current.map((tr) => (durations.has(tr.id) ? { ...tr, duration: durations.get(tr.id) } : tr)),
      );
    }
    setBusy(false);
  }

  async function handleAddFiles() {
    const files = await pickAudioFiles();
    if (files === null) {
      fileInput.current?.click();
      return;
    }
    await addFiles(files);
  }

  async function handleAddFolder() {
    const files = await pickDirectoryFiles();
    if (files === null) {
      dirInput.current?.click();
      return;
    }
    await addFiles(files);
  }

  /* ---------- track edits ---------- */

  function toggleFavorite(id: string) {
    commitTracks(
      tracks.map((tr) => {
        if (tr.id !== id) return tr;
        const next = { ...tr };
        if (next.favorite) delete next.favorite;
        else next.favorite = true;
        return next;
      }),
    );
  }

  function saveEdit(patch: { title: string; artist: string; album: string }) {
    if (!editingId) return;
    commitTracks(tracks.map((tr) => (tr.id === editingId ? { ...tr, ...patch } : tr)));
    setEditingId(null);
    showToast(t("toastSaved"));
  }

  function confirmRemove() {
    const id = pendingRemove;
    if (!id) return;
    const tr = trackById.get(id);
    if (tr) void dropAudio(tr.opfsKey);
    const remaining = tracks.filter((x) => x.id !== id);
    const known = new Set(remaining.map((x) => x.id));
    if (currentId(queue) === id) player.stop();
    commitTracks(remaining);
    commitPlaylists(
      playlists.map((p) =>
        p.trackIds.includes(id) ? { ...p, trackIds: p.trackIds.filter((x) => x !== id), updatedAt: Date.now() } : p,
      ),
    );
    commitQueue(pruneQueue(queue, known));
    commitRecent(recent.filter((x) => x !== id));
    setMissing((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPendingRemove(null);
    setActionsId(null);
    showToast(t("toastRemoved"));
  }

  /* ---------- playlists ---------- */

  function createPlaylist(name: string) {
    const now = Date.now();
    const withTrack = nameDialog?.mode === "create" ? nameDialog.withTrack : null;
    const p: Playlist = { id: uid(), name, trackIds: withTrack ? [withTrack] : [], createdAt: now, updatedAt: now };
    commitPlaylists([...playlists, p]);
    setNameDialog(null);
    setAddToPlaylistId(null);
    showToast(withTrack ? t("toastAddedToPlaylist") : t("toastPlaylistCreated"));
  }

  function renamePlaylist(name: string) {
    if (nameDialog?.mode !== "rename") return;
    const id = nameDialog.playlistId;
    commitPlaylists(playlists.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p)));
    setNameDialog(null);
    showToast(t("toastSaved"));
  }

  function addToPlaylist(playlistId: string) {
    const trackId = addToPlaylistId;
    if (!trackId) return;
    commitPlaylists(
      playlists.map((p) =>
        p.id === playlistId && !p.trackIds.includes(trackId)
          ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: Date.now() }
          : p,
      ),
    );
    setAddToPlaylistId(null);
    showToast(t("toastAddedToPlaylist"));
  }

  function removeFromPlaylist(playlistId: string, trackId: string) {
    commitPlaylists(
      playlists.map((p) =>
        p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((x) => x !== trackId), updatedAt: Date.now() } : p,
      ),
    );
    setActionsId(null);
  }

  function confirmDeletePlaylist() {
    const id = pendingDeletePlaylist;
    if (!id) return;
    commitPlaylists(playlists.filter((p) => p.id !== id));
    setPendingDeletePlaylist(null);
    if (drill?.kind === "playlist" && drill.id === id) setDrill(null);
    showToast(t("toastPlaylistDeleted"));
  }

  /* ---------- queue ---------- */

  function queueTrack(id: string) {
    commitQueue(appendToQueue(queue, [id]));
    setActionsId(null);
    showToast(t("toastQueued"));
  }

  function confirmClearQueue() {
    player.stop();
    commitQueue({ ...EMPTY_QUEUE, shuffle: queue.shuffle, repeat: queue.repeat });
    setPendingClearQueue(false);
  }

  function handleShuffle() {
    commitQueue(setShuffle(queue, !queue.shuffle));
  }

  function handleRepeat() {
    commitQueue({ ...queue, repeat: cycleRepeat(queue.repeat) });
  }

  /* ---------- backup ---------- */

  function handleExportJson() {
    downloadBackup(tracks, playlists, recent);
    showToast(t("toastExported"));
  }

  async function handleImportJson(file: File | null) {
    if (!file) return;
    let parsed: ReturnType<typeof parseBackup> = null;
    try {
      parsed = parseBackup(await file.text());
    } catch {
      parsed = null;
    }
    if (!parsed) {
      showToast(t("toastImportBad"));
      return;
    }
    const merged = mergeBackup({ tracks, playlists, recent }, parsed);
    commitTracks(merged.tracks);
    commitPlaylists(merged.playlists);
    commitRecent(merged.recent);
    const gone = new Set(missing);
    for (const tr of merged.tracks) {
      if (!trackById.has(tr.id) && !(await hasAudio(tr.opfsKey))) gone.add(tr.id);
    }
    setMissing(gone);
    showToast(t("toastImported", { n: parsed.tracks.length, p: parsed.playlists.length }));
  }

  /* ---------- derived lists ---------- */

  const q = query.trim().toLowerCase();
  const matches = useCallback(
    (tr: Track) =>
      !q ||
      tr.title.toLowerCase().includes(q) ||
      tr.artist.toLowerCase().includes(q) ||
      tr.album.toLowerCase().includes(q) ||
      tr.fileName.toLowerCase().includes(q),
    [q],
  );

  const unknownAlbum = t("unknownAlbum");
  const unknownArtist = t("unknownArtist");

  const albums = useMemo(() => {
    const map = new Map<string, { key: string; name: string; artist: string; tracks: Track[] }>();
    for (const tr of tracks) {
      const key = tr.album || "";
      const row = map.get(key) ?? { key, name: tr.album || unknownAlbum, artist: tr.artist, tracks: [] };
      row.tracks.push(tr);
      if (row.artist && tr.artist && row.artist !== tr.artist) row.artist = "";
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [tracks, unknownAlbum]);

  const artists = useMemo(() => {
    const map = new Map<string, { key: string; name: string; tracks: Track[] }>();
    for (const tr of tracks) {
      const key = tr.artist || "";
      const row = map.get(key) ?? { key, name: tr.artist || unknownArtist, tracks: [] };
      row.tracks.push(tr);
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [tracks, unknownArtist]);

  /** The rows on screen right now, in order: what a tap plays through. */
  const listed: { tracks: Track[]; title: string | null; playlist: Playlist | null } = useMemo(() => {
    if (drill?.kind === "album") {
      const row = albums.find((a) => a.key === drill.key);
      return { tracks: row ? row.tracks.slice().sort(byTitle) : [], title: row?.name ?? null, playlist: null };
    }
    if (drill?.kind === "artist") {
      const row = artists.find((a) => a.key === drill.key);
      return { tracks: row ? row.tracks.slice().sort(byTitle) : [], title: row?.name ?? null, playlist: null };
    }
    if (drill?.kind === "playlist") {
      const p = playlists.find((x) => x.id === drill.id) ?? null;
      const rows = p ? p.trackIds.map((id) => trackById.get(id)).filter((x): x is Track => Boolean(x)) : [];
      return { tracks: rows, title: p?.name ?? null, playlist: p };
    }
    if (view === "favorites") {
      return { tracks: tracks.filter((tr) => tr.favorite).sort(byTitle), title: null, playlist: null };
    }
    if (view === "recent") {
      return {
        tracks: recent.map((id) => trackById.get(id)).filter((x): x is Track => Boolean(x)),
        title: null,
        playlist: null,
      };
    }
    return { tracks: tracks.slice().sort(byTitle), title: null, playlist: null };
  }, [albums, artists, drill, playlists, recent, trackById, tracks, view]);

  const visible = useMemo(() => listed.tracks.filter(matches), [listed, matches]);
  const visibleIds = useMemo(() => visible.map((tr) => tr.id), [visible]);

  const actionsTrack = actionsId ? (trackById.get(actionsId) ?? null) : null;
  const editingTrack = editingId ? (trackById.get(editingId) ?? null) : null;
  const addToPlaylistTrack = addToPlaylistId ? (trackById.get(addToPlaylistId) ?? null) : null;
  const renaming = nameDialog?.mode === "rename" ? playlists.find((p) => p.id === nameDialog.playlistId) : null;

  const isPlaying = player.phase === "playing";
  const progressPct = player.duration > 0 ? Math.min(100, (player.position / player.duration) * 100) : 0;
  const shownDuration = player.duration || current?.duration || 0;

  function chooseView(next: View) {
    setView(next);
    setDrill(null);
    setQuery("");
    commitPrefs({ ...prefs, view: next });
  }

  const showGroups = drill === null && (view === "albums" || view === "artists" || view === "playlists");
  const showList = !showGroups;

  return (
    <div className="lp-room">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
      />

      {/* The deck: what is playing and the keys that move it. */}
      <section className="lp-deck" id="deck" aria-label={t("nowPlaying")}>
        <div className="lp-deck-head">
          <span>{t("nowPlaying")}</span>
          <span id="deck-position">
            {queue.trackIds.length > 0 ? t("queuePosition", { i: queue.index + 1, n: queue.trackIds.length }) : ""}
          </span>
        </div>

        <div className="lp-deck-row">
          <div className={`lp-disc ${isPlaying ? "lp-disc-spin" : ""}`} aria-hidden />
          <div className="min-w-0 flex-1">
            {current ? (
              <>
                <p className="lp-now-title" id="now-title">
                  {current.title}
                </p>
                <p className="lp-now-sub" id="now-sub">
                  {current.artist || t("unknownArtist")}
                  {current.album ? ` · ${current.album}` : ""}
                </p>
                {missing.has(current.id) && <p className="lp-now-hint">{t("missingFile")}</p>}
              </>
            ) : (
              <>
                <p className="lp-now-title" id="now-title">
                  {t("nothingPlaying")}
                </p>
                <p className="lp-now-hint">{t("nothingPlayingHint")}</p>
              </>
            )}
          </div>
        </div>

        <input
          className="lp-seek"
          id="seek"
          type="range"
          min={0}
          max={Math.max(1, Math.floor(shownDuration))}
          step={1}
          value={Math.min(Math.floor(player.position), Math.max(1, Math.floor(shownDuration)))}
          disabled={!current || shownDuration === 0}
          aria-label={t("nowPlaying")}
          style={{ ["--lp-progress" as string]: `${progressPct}%` }}
          onChange={(e) => player.seek(Number(e.target.value))}
        />
        <div className="lp-clock">
          <span id="deck-elapsed">{formatClock(player.position)}</span>
          <span id="deck-total">{shownDuration > 0 ? formatClock(shownDuration) : "--:--"}</span>
        </div>

        <div className="lp-transport">
          <button
            type="button"
            id="shuffle"
            className={`lp-key ${queue.shuffle ? "lp-key-on" : ""}`}
            role="switch"
            aria-checked={queue.shuffle}
            aria-label={t("shuffle")}
            title={t("shuffle")}
            onClick={handleShuffle}
          >
            <Shuffle className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            id="prev"
            className="lp-key"
            aria-label={t("prev")}
            title={t("prev")}
            disabled={queue.trackIds.length === 0}
            onClick={handlePrev}
          >
            <SkipBack className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            id="play-pause"
            className="lp-key lp-key-main"
            aria-label={isPlaying ? t("pause") : t("play")}
            title={isPlaying ? t("pause") : t("play")}
            disabled={!current}
            onClick={handleToggle}
          >
            {isPlaying ? <Pause className="size-7" aria-hidden /> : <Play className="size-7 translate-x-[2px]" aria-hidden />}
          </button>
          <button
            type="button"
            id="next"
            className="lp-key"
            aria-label={t("next")}
            title={t("next")}
            disabled={queue.trackIds.length === 0}
            onClick={handleNext}
          >
            <SkipForward className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            id="repeat"
            className={`lp-key ${queue.repeat !== "off" ? "lp-key-on" : ""}`}
            aria-label={
              queue.repeat === "off" ? t("repeatOff") : queue.repeat === "all" ? t("repeatAll") : t("repeatOne")
            }
            title={queue.repeat === "off" ? t("repeatOff") : queue.repeat === "all" ? t("repeatAll") : t("repeatOne")}
            onClick={handleRepeat}
          >
            {queue.repeat === "one" ? <Repeat1 className="size-5" aria-hidden /> : <Repeat className="size-5" aria-hidden />}
          </button>
        </div>

        <div className="lp-deck-tools">
          <label className="sr-only" htmlFor="speed">
            {t("speed")}
          </label>
          <select
            id="speed"
            className="lp-deck-select"
            aria-label={t("speed")}
            value={prefs.speed}
            onChange={(e) => commitPrefs({ ...prefs, speed: Number(e.target.value) })}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
          <button
            type="button"
            id="eq-open"
            className={`lp-deck-btn ${prefs.eqBands.some((b) => b !== 0) ? "lp-deck-btn-on" : ""}`}
            onClick={() => setEqOpen(true)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            {t("eq")}
          </button>
        </div>
      </section>

      {!storageOk && <p className="lp-warn">{t("storageWarn")}</p>}

      {/* The library. */}
      <Card id="library">
        <CardHeader>
          <CardTitle>{t("libraryTitle")}</CardTitle>
          <CardAction>
            <span className="lp-slug" id="library-count">
              {t("trackCount", { n: tracks.length })}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-[0.55rem]">
          <div className="flex flex-wrap gap-[0.4rem]">
            <button type="button" className="lp-add" id="add-files" disabled={busy} onClick={() => void handleAddFiles()}>
              <Music2 className="size-5" aria-hidden />
              {t("addFiles")}
            </button>
            <button type="button" className="lp-add" id="add-folder" disabled={busy} onClick={() => void handleAddFolder()}>
              <FolderOpen className="size-5" aria-hidden />
              {t("addFolder")}
            </button>
          </div>
          <input
            ref={fileInput}
            id="file-input"
            className="sr-only"
            type="file"
            accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus,.flac"
            multiple
            style={{ fontSize: "1rem" }}
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <input
            ref={dirInput}
            id="dir-input"
            className="sr-only"
            type="file"
            accept="audio/*"
            multiple
            style={{ fontSize: "1rem" }}
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <p className="m-0 text-[0.72rem] leading-5 text-ink-muted">
            {t("addHint")} <span className="lp-slug">{t("formats")}</span>
          </p>

          <div className="lp-tabs" role="tablist" id="views">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={view === v.key}
                className={`lp-tab ${view === v.key ? "lp-tab-on" : ""}`}
                onClick={() => chooseView(v.key)}
              >
                {t(v.label)}
              </button>
            ))}
          </div>

          {tracks.length === 0 ? (
            <div className="lp-empty" id="library-empty">
              <p className="lp-empty-title">{t("emptyLibraryTitle")}</p>
              <p className="lp-empty-hint">{t("emptyLibraryHint")}</p>
            </div>
          ) : (
            <>
              {drill !== null && (
                <div className="flex flex-wrap items-center gap-[0.4rem]">
                  <button type="button" className="lp-file-btn" id="drill-back" onClick={() => setDrill(null)}>
                    <ChevronLeft className="size-4" aria-hidden />
                    {t("back")}
                  </button>
                  <span className="min-w-0 flex-1 truncate font-heading text-[1rem] font-extrabold text-ink" id="drill-title">
                    {listed.title}
                  </span>
                  {listed.playlist && (
                    <>
                      <button
                        type="button"
                        className="lp-icon-btn h-[2.35rem]"
                        aria-label={t("renamePlaylist")}
                        title={t("renamePlaylist")}
                        onClick={() => setNameDialog({ mode: "rename", playlistId: listed.playlist!.id })}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="lp-icon-btn h-[2.35rem]"
                        aria-label={t("deletePlaylist")}
                        title={t("deletePlaylist")}
                        onClick={() => setPendingDeletePlaylist(listed.playlist!.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </>
                  )}
                </div>
              )}

              {showList && (
                <input
                  id="search"
                  className="lp-search"
                  type="search"
                  value={query}
                  placeholder={t("searchPlaceholder")}
                  onChange={(e) => setQuery(e.target.value)}
                />
              )}

              {showList && visible.length > 0 && (
                <div className="lp-file-row">
                  <button type="button" className="lp-file-btn" id="play-all" onClick={() => playFrom(visibleIds, visibleIds[0])}>
                    <Play className="size-4" aria-hidden />
                    {t("playAll")}
                  </button>
                  <button
                    type="button"
                    className="lp-file-btn"
                    id="shuffle-all"
                    onClick={() => {
                      const qq = buildQueue(visibleIds, null, true, queue.repeat);
                      commitQueue(qq);
                      void startTrack(qq.trackIds[0]);
                    }}
                  >
                    <Shuffle className="size-4" aria-hidden />
                    {t("shuffleAll")}
                  </button>
                  <button
                    type="button"
                    className="lp-file-btn"
                    id="queue-all"
                    onClick={() => {
                      commitQueue(appendToQueue(queue, visibleIds));
                      showToast(t("toastQueued"));
                    }}
                  >
                    <ListPlus className="size-4" aria-hidden />
                    {t("addToQueue")}
                  </button>
                </div>
              )}

              {view === "playlists" && drill === null && (
                <>
                  <button
                    type="button"
                    className="lp-add"
                    id="new-playlist"
                    onClick={() => setNameDialog({ mode: "create", withTrack: null })}
                  >
                    <ListPlus className="size-5" aria-hidden />
                    {t("newPlaylist")}
                  </button>
                  {playlists.length === 0 ? (
                    <p className="m-0 text-[0.82rem] text-ink-muted">{t("noPlaylists")}</p>
                  ) : (
                    <ul className="m-0 grid list-none gap-[0.4rem] p-0" id="playlist-list">
                      {playlists.map((p) => (
                        <li key={p.id}>
                          <button type="button" className="lp-group" onClick={() => setDrill({ kind: "playlist", id: p.id })}>
                            <span className="lp-group-art" aria-hidden>
                              <ListMusic className="size-5" />
                            </span>
                            <span className="lp-row-text">
                              <span className="lp-row-title">{p.name}</span>
                              <span className="lp-row-sub">{t("trackCount", { n: p.trackIds.length })}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {view === "albums" && drill === null && (
                <ul className="m-0 grid list-none gap-[0.4rem] p-0" id="album-list">
                  {albums.map((a) => (
                    <li key={a.key || "__"}>
                      <button type="button" className="lp-group" onClick={() => setDrill({ kind: "album", key: a.key })}>
                        <span className="lp-group-art" aria-hidden>
                          <Disc3 className="size-5" />
                        </span>
                        <span className="lp-row-text">
                          <span className="lp-row-title">{a.name}</span>
                          <span className="lp-row-sub">
                            {a.artist || t("unknownArtist")} · {t("trackCount", { n: a.tracks.length })}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {view === "artists" && drill === null && (
                <ul className="m-0 grid list-none gap-[0.4rem] p-0" id="artist-list">
                  {artists.map((a) => (
                    <li key={a.key || "__"}>
                      <button type="button" className="lp-group" onClick={() => setDrill({ kind: "artist", key: a.key })}>
                        <span className="lp-group-art lp-group-art-round" aria-hidden>
                          <User className="size-5" />
                        </span>
                        <span className="lp-row-text">
                          <span className="lp-row-title">{a.name}</span>
                          <span className="lp-row-sub">{t("trackCount", { n: a.tracks.length })}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {showList &&
                (visible.length === 0 ? (
                  <p className="m-0 text-[0.82rem] text-ink-muted" id="list-empty">
                    {q ? t("noResults") : listed.playlist ? t("emptyPlaylist") : t("emptyView")}
                  </p>
                ) : (
                  <ul className="m-0 grid list-none gap-[0.4rem] p-0" id="track-list">
                    {visible.map((tr, i) => (
                      <TrackRow
                        key={tr.id}
                        track={tr}
                        index={i}
                        isCurrent={current?.id === tr.id}
                        isPlaying={isPlaying && current?.id === tr.id}
                        isMissing={missing.has(tr.id)}
                        t={t}
                        onPlay={(id) => playFrom(visibleIds, id)}
                        onFavorite={toggleFavorite}
                        onMore={setActionsId}
                      />
                    ))}
                  </ul>
                ))}

              {missing.size > 0 && showList && visible.some((tr) => missing.has(tr.id)) && (
                <p className="lp-warn" id="missing-hint">
                  {t("missingHint")}
                </p>
              )}
            </>
          )}

          <div className="lp-file-row" id="backup-row">
            <button type="button" id="export-json" className="lp-file-btn" onClick={handleExportJson}>
              <Download className="size-4" aria-hidden />
              {t("exportJson")}
            </button>
            <button type="button" id="import-json" className="lp-file-btn" onClick={() => jsonInput.current?.click()}>
              <Upload className="size-4" aria-hidden />
              {t("importJson")}
            </button>
            <input
              ref={jsonInput}
              id="json-input"
              className="sr-only"
              type="file"
              accept="application/json,.json"
              style={{ fontSize: "1rem" }}
              onChange={(e) => {
                void handleImportJson(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
          <p className="m-0 text-[0.72rem] leading-5 text-ink-muted" id="backup-hint">
            {t("backupHint")}
          </p>
        </CardContent>
      </Card>

      {/* The queue: what plays after this one. */}
      <Card id="queue">
        <CardHeader>
          <CardTitle>{t("queueTitle")}</CardTitle>
          <CardAction>
            <button
              type="button"
              id="clear-queue"
              className="lp-file-btn"
              disabled={queue.trackIds.length === 0}
              onClick={() => setPendingClearQueue(true)}
            >
              <X className="size-4" aria-hidden />
              {t("clearQueue")}
            </button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-[0.4rem]">
          {queue.trackIds.length === 0 ? (
            <p className="m-0 text-[0.82rem] text-ink-muted" id="queue-empty">
              {t("queueEmpty")}
            </p>
          ) : (
            <ul className="m-0 grid list-none gap-[0.4rem] p-0" id="queue-list">
              {queue.trackIds.map((id, i) => {
                const tr = trackById.get(id);
                if (!tr) return null;
                const on = i === queue.index;
                return (
                  <li key={id} className={`lp-row ${on ? "lp-row-on" : ""}`}>
                    <button type="button" className="lp-row-main" onClick={() => jumpTo(i)} aria-current={on ? "true" : undefined}>
                      <span className="lp-row-num" aria-hidden>
                        {on ? <Disc3 className={`size-4 ${isPlaying ? "lp-disc-spin" : ""}`} /> : i + 1}
                      </span>
                      <span className="lp-row-text">
                        <span className="lp-row-title">{tr.title}</span>
                        <span className="lp-row-sub">{tr.artist || t("unknownArtist")}</span>
                      </span>
                      {tr.duration ? <span className="lp-row-time">{formatClock(tr.duration)}</span> : null}
                    </button>
                    <button
                      type="button"
                      className="lp-icon-btn"
                      aria-label={t("removeFromQueue")}
                      title={t("removeFromQueue")}
                      onClick={() => {
                        const wasCurrent = on;
                        const next = removeFromQueue(queue, id);
                        commitQueue(next);
                        if (wasCurrent) {
                          const nid = currentId(next);
                          if (nid && isPlaying) void startTrack(nid);
                          else player.stop();
                        }
                      }}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="m-0 text-[0.76rem] leading-5 text-ink-muted" id="about-text">
        {t("about")}
      </p>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="lp-chip">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.78rem] text-ink-muted">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/localplay`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <TrackActionsDialog
        track={actionsTrack}
        inPlaylist={listed.playlist !== null}
        t={t}
        onOpenChange={(open) => {
          if (!open) setActionsId(null);
        }}
        onQueue={() => actionsId && queueTrack(actionsId)}
        onFavorite={() => {
          if (actionsId) toggleFavorite(actionsId);
        }}
        onAddToPlaylist={() => {
          setAddToPlaylistId(actionsId);
          setActionsId(null);
        }}
        onEdit={() => {
          setEditingId(actionsId);
          setActionsId(null);
        }}
        onRemoveFromPlaylist={() => {
          if (listed.playlist && actionsId) removeFromPlaylist(listed.playlist.id, actionsId);
        }}
        onRemove={() => {
          setPendingRemove(actionsId);
          setActionsId(null);
        }}
      />

      <EditTrackDialog
        track={editingTrack}
        t={t}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        onSave={saveEdit}
      />

      <AddToPlaylistDialog
        track={addToPlaylistTrack}
        playlists={playlists}
        t={t}
        onOpenChange={(open) => {
          if (!open) setAddToPlaylistId(null);
        }}
        onPick={addToPlaylist}
        onCreate={() => setNameDialog({ mode: "create", withTrack: addToPlaylistId })}
      />

      <NameDialog
        open={nameDialog !== null}
        title={nameDialog?.mode === "rename" ? t("renamePlaylist") : t("newPlaylist")}
        initial={renaming?.name ?? ""}
        confirmLabel={nameDialog?.mode === "rename" ? t("save") : t("create")}
        t={t}
        onOpenChange={(open) => {
          if (!open) setNameDialog(null);
        }}
        onSubmit={(name) => (nameDialog?.mode === "rename" ? renamePlaylist(name) : createPlaylist(name))}
      />

      <EqDialog
        open={eqOpen}
        bands={prefs.eqBands}
        supported={player.eqSupported}
        t={t}
        onOpenChange={setEqOpen}
        onChange={(bands: EqBands) => commitPrefs({ ...prefs, eqBands: bands })}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        message={t("removeConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("remove")}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        onConfirm={confirmRemove}
      />

      <ConfirmDialog
        open={pendingDeletePlaylist !== null}
        message={t("deletePlaylistConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("deletePlaylist")}
        onOpenChange={(open) => {
          if (!open) setPendingDeletePlaylist(null);
        }}
        onConfirm={confirmDeletePlaylist}
      />

      <ConfirmDialog
        open={pendingClearQueue}
        message={t("clearQueueConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("clearQueue")}
        onOpenChange={setPendingClearQueue}
        onConfirm={confirmClearQueue}
      />
    </div>
  );
}
