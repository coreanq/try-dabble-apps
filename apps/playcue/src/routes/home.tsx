import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { ListPlus, Rewind, Square } from "lucide-react";

import { AdSlot } from "@/components/ad-slot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CueRow } from "@/components/cue-row";
import { GoButton, type GoState } from "@/components/go-button";
import { HowDialog } from "@/components/how-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LOOP_KEY,
  POS_KEY,
  cueName,
  dropAudio,
  formatClock,
  getAudio,
  isAudioFile,
  loadCues,
  moveCue,
  probeDuration,
  putAudio,
  readString,
  saveCues,
  uid,
  writeString,
  type Cue,
} from "@/lib/cues";
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

/** idle = a cue is standing by, ended = it finished and nothing followed it. */
type Phase = "idle" | "playing" | "paused" | "ended";

const TOAST_MS = 2400;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [cues, setCues] = useState<Cue[]>(() => loadCues());
  const [currentId, setCurrentId] = useState<string | null>(() => readString(POS_KEY));
  const [phase, setPhase] = useState<Phase>("idle");
  const [loopOne, setLoopOne] = useState<boolean>(() => readString(LOOP_KEY) === "1");
  const [missing, setMissing] = useState<string[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pendingRemove, setPendingRemove] = useState<Cue | null>(null);
  const [clearing, setClearing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string>("");
  // Which cue the <audio> element is actually holding, so a late
  // loadedmetadata never writes its runtime onto whatever became current.
  const loadedId = useRef<string>("");
  const fileInput = useRef<HTMLInputElement | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const index = useMemo(() => {
    const at = cues.findIndex((c) => c.id === currentId);
    return at >= 0 ? at : cues.length > 0 ? 0 : -1;
  }, [cues, currentId]);
  const current = index >= 0 ? cues[index] : null;
  const next = index >= 0 && index + 1 < cues.length ? cues[index + 1] : null;
  const currentMissing = current ? missing.includes(current.id) : false;

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

  // A cue whose bytes are gone (cleared site data, private window) must say so
  // rather than sit there and refuse to play.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gone: string[] = [];
      for (const cue of loadCues()) {
        if (!(await getAudio(cue.id))) gone.push(cue.id);
      }
      if (!cancelled) setMissing(gone);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.loop = loopOne;
  }, [loopOne, currentId]);

  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  const commit = useCallback((nextCues: Cue[]) => {
    setCues(nextCues);
    saveCues(nextCues);
  }, []);

  const pickCurrent = useCallback((id: string | null) => {
    setCurrentId(id);
    writeString(POS_KEY, id ?? "");
  }, []);

  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setElapsedMs(0);
  }, []);

  /**
   * Loads the cue's bytes out of OPFS and starts it. Nothing here ever runs
   * from an "ended" event — a track that finishes leaves the deck silent.
   */
  const startCue = useCallback(
    async (cue: Cue) => {
      const el = audioRef.current;
      if (!el) return;
      const file = await getAudio(cue.id);
      if (!file) {
        setMissing((prev) => (prev.includes(cue.id) ? prev : [...prev, cue.id]));
        setPhase("idle");
        showToast(t("missingFile"));
        return;
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(file);
      loadedId.current = cue.id;
      el.src = objectUrl.current;
      el.loop = loopOne;
      el.currentTime = 0;
      setElapsedMs(0);
      try {
        await el.play();
        setPhase("playing");
      } catch {
        setPhase("idle");
        showToast(t("toastPlayFail"));
      }
    },
    [loopOne, showToast, t],
  );

  function handleGo() {
    const el = audioRef.current;
    if (!el || !current) return;

    if (phase === "playing") {
      el.pause();
      setPhase("paused");
      return;
    }
    if (phase === "paused") {
      void el.play().then(
        () => setPhase("playing"),
        () => showToast(t("toastPlayFail")),
      );
      return;
    }
    if (phase === "ended") {
      if (!next) return;
      pickCurrent(next.id);
      void startCue(next);
      return;
    }
    void startCue(current);
  }

  function handleSelect(id: string) {
    stopAudio();
    setPhase("idle");
    pickCurrent(id);
  }

  function handleStop() {
    stopAudio();
    setPhase("idle");
  }

  function handleBackToFirst() {
    if (cues.length === 0) return;
    handleSelect(cues[0].id);
  }

  function handleLoop() {
    const nextValue = !loopOne;
    setLoopOne(nextValue);
    writeString(LOOP_KEY, nextValue ? "1" : "0");
  }

  function handleMove(id: string, delta: number) {
    commit(moveCue(cues, id, delta));
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    const audio = picked.filter(isAudioFile);
    const skipped = picked.length - audio.length;
    if (audio.length === 0) {
      if (skipped > 0) showToast(t("toastSkipped", { n: skipped }));
      return;
    }

    const added: Cue[] = [];
    let storeFailed = false;
    for (const file of audio) {
      const id = uid();
      const stored = await putAudio(id, file);
      if (!stored) {
        storeFailed = true;
        continue;
      }
      added.push({
        id,
        name: cueName(file.name),
        type: file.type,
        size: file.size,
        durationMs: await probeDuration(file),
      });
    }

    if (added.length > 0) {
      const merged = [...cues, ...added];
      commit(merged);
      if (!currentId) pickCurrent(merged[0].id);
      showToast(t("toastAdded", { n: added.length }));
    }
    if (storeFailed) showToast(t("toastStoreFail"));
    else if (skipped > 0 && added.length === 0) showToast(t("toastSkipped", { n: skipped }));
  }

  function confirmRemove() {
    const victim = pendingRemove;
    if (!victim) return;
    const remaining = cues.filter((c) => c.id !== victim.id);
    if (victim.id === currentId) {
      stopAudio();
      setPhase("idle");
      pickCurrent(remaining[Math.min(index, remaining.length - 1)]?.id ?? null);
    }
    commit(remaining);
    setMissing((prev) => prev.filter((id) => id !== victim.id));
    void dropAudio(victim.id);
    setPendingRemove(null);
    showToast(t("toastRemoved"));
  }

  function confirmClear() {
    stopAudio();
    setPhase("idle");
    for (const cue of cues) void dropAudio(cue.id);
    commit([]);
    setMissing([]);
    pickCurrent(null);
    setClearing(false);
    showToast(t("toastCleared"));
  }

  const goState: GoState =
    cues.length === 0 || !current
      ? "empty"
      : phase === "playing"
        ? "live"
        : phase === "paused"
          ? "held"
          : phase === "ended"
            ? next
              ? "armed"
              : "end"
            : "ready";

  const goLabel =
    goState === "live"
      ? t("goPause")
      : goState === "held"
        ? t("goResume")
        : goState === "armed"
          ? t("goNext")
          : t("goStart");

  const goSub =
    goState === "empty"
      ? t("subEmpty")
      : goState === "live"
        ? t("subPause", { name: current?.name ?? "" })
        : goState === "held"
          ? t("subResume", { time: formatClock(elapsedMs) })
          : goState === "armed"
            ? t("subNext", { name: next?.name ?? "" })
            : goState === "end"
              ? t("subEnd")
              : t("subStart", { name: current?.name ?? "" });

  const lampClass =
    phase === "playing"
      ? "pc-lamp-on-air"
      : phase === "ended"
        ? "pc-lamp-stopped"
        : cues.length > 0
          ? "pc-lamp-standby"
          : "";
  const lampText =
    phase === "playing"
      ? t("lampOnAir")
      : phase === "paused"
        ? t("lampHeld")
        : phase === "ended"
          ? t("lampStopped")
          : t("lampStandby");

  const durationMs = current?.durationMs ?? 0;
  const throwPct = durationMs > 0 ? Math.min(100, (elapsedMs / durationMs) * 100) : 0;

  return (
    <div className="pc-stage">
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

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        <span className="pc-chip">{t("chipStop")}</span>
        <span className="pc-chip">{t("chipTap")}</span>
        <span className="pc-chip">{t("chipNoAuto")}</span>
        <span className="pc-chip">{t("chipNoLogin")}</span>
        <span className="pc-chip">{t("chipLocal")}</span>
      </div>

      {/* The deck: cue light, the name in the largest type on the page, the
          travel bar, and the one key that moves the show forward. */}
      <Card id="deck" aria-label={t("deckTitle")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-[0.45rem]">
            <span className={`pc-lamp ${lampClass}`} aria-hidden />
            <span id="deck-state">{lampText}</span>
          </CardTitle>
          <CardAction>
            <span className="pc-slug" id="deck-position">
              {cues.length > 0
                ? `${t("position", { i: index + 1, n: cues.length })} · ${t("remaining", {
                    n: Math.max(0, cues.length - index - 1),
                  })}`
                : t("noneLoaded")}
            </span>
          </CardAction>
        </CardHeader>

        <CardContent className="grid gap-[0.6rem]">
          <p className="pc-now-name" id="now-name">
            {current ? current.name : t("emptyTitle")}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="pc-clock" id="deck-clock">
              {formatClock(elapsedMs)} / {durationMs > 0 ? formatClock(durationMs) : "--:--"}
            </span>
            <span className="pc-slug" id="deck-next">
              {next ? `${t("nextLabel")} · ${next.name}` : t("endOfList")}
            </span>
          </div>

          <div className="pc-throw" aria-hidden>
            <span className="pc-throw-fill" style={{ width: `${throwPct}%` }} />
          </div>

          {currentMissing && (
            <p className="m-0 text-[0.78rem] font-bold text-[#ff8e9c]">{t("missingFile")}</p>
          )}

          <GoButton state={goState} label={goLabel} sub={goSub} onPress={handleGo} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex gap-[0.35rem]">
              <button
                type="button"
                className="pc-key"
                aria-label={t("stopBtn")}
                title={t("stopBtn")}
                disabled={cues.length === 0}
                onClick={handleStop}
              >
                <Square className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                className="pc-key"
                aria-label={t("backToFirst")}
                title={t("backToFirst")}
                disabled={cues.length === 0}
                onClick={handleBackToFirst}
              >
                <Rewind className="size-4" aria-hidden />
              </button>
            </span>

            <button
              type="button"
              id="loop-one"
              className={`pc-rocker ${loopOne ? "pc-rocker-on" : ""}`}
              role="switch"
              aria-checked={loopOne}
              onClick={handleLoop}
            >
              <span className="pc-rocker-track" aria-hidden>
                <span className="pc-rocker-knob" />
              </span>
              {t("loopOne")}
            </button>
          </div>

          <p className="m-0 text-[0.72rem] leading-5 text-stage-muted" id="about-text">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      <Card id="cue-list-card">
        <CardHeader>
          <CardTitle>{t("cueListTitle")}</CardTitle>
          <CardAction>
            <HowDialog t={t} />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-[0.55rem]">
          <button
            type="button"
            className="pc-add"
            id="add-audio"
            onClick={() => fileInput.current?.click()}
          >
            <ListPlus className="size-5" aria-hidden />
            {cues.length === 0 ? t("addBtn") : t("addMore")}
          </button>
          <input
            ref={fileInput}
            id="file-input"
            className="sr-only"
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.oga,.opus,.flac,.aac"
            multiple
            style={{ fontSize: "1rem" }}
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="m-0 text-[0.72rem] text-stage-muted">
            {t("addHint")} <span className="pc-slug">{t("formats")}</span>
          </p>

          {cues.length === 0 ? (
            <div
              id="cue-empty"
              className="rounded-lg border border-dashed border-rail bg-[#150d22]/70 px-[0.7rem] py-[0.9rem]"
            >
              <p className="font-heading m-0 text-[1rem] font-bold text-stage-ink">
                {t("emptyTitle")}
              </p>
              <ol className="m-0 mt-[0.5rem] grid list-none gap-[0.35rem] p-0 text-[0.84rem] leading-6 text-stage-muted">
                {(["emptyStep1", "emptyStep2", "emptyStep3", "emptyStep4"] as const).map(
                  (key, i) => (
                    <li key={key} className="flex gap-[0.5rem]">
                      <span className="pc-q">{i + 1}</span>
                      <span>{t(key)}</span>
                    </li>
                  ),
                )}
              </ol>
              <p className="m-0 mt-[0.55rem] text-[0.78rem] text-stage-muted">{t("howWho")}</p>
            </div>
          ) : (
            <>
              <ul className="m-0 grid list-none gap-[0.4rem] p-0" id="cue-list">
                {cues.map((cue, i) => (
                  <CueRow
                    key={cue.id}
                    cue={cue}
                    index={i}
                    total={cues.length}
                    isCurrent={i === index}
                    isNext={i === index + 1}
                    isMissing={missing.includes(cue.id)}
                    isLive={i === index && phase === "playing"}
                    t={t}
                    onSelect={handleSelect}
                    onMove={handleMove}
                    onRemove={setPendingRemove}
                  />
                ))}
              </ul>
              <p className="m-0 text-[0.72rem] text-stage-muted">{t("loopOneHint")}</p>
              <div>
                <button
                  type="button"
                  id="clear-all"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[0.76rem] font-bold text-[#ff8e9c] underline-offset-4 hover:underline"
                  onClick={() => setClearing(true)}
                >
                  {t("clearAll")}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AdSlot />

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.78rem] text-stage-muted">
        <a id="link-privacy" href="/privacy.html">
          {t("privacy")}
        </a>
        <a id="link-terms" href="/terms.html">
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      {/*
        The whole product is this element's event handlers: `ended` stops the
        deck and arms the GO key. There is no code path that loads the next cue
        without a tap.
      */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => setElapsedMs(Math.round(e.currentTarget.currentTime * 1000))}
        onLoadedMetadata={(e) => {
          const secs = e.currentTarget.duration;
          const id = loadedId.current;
          const loaded = cues.find((c) => c.id === id);
          if (!loaded || !Number.isFinite(secs) || secs <= 0) return;
          const ms = Math.round(secs * 1000);
          if (Math.abs(ms - loaded.durationMs) < 1000) return;
          commit(cues.map((c) => (c.id === id ? { ...c, durationMs: ms } : c)));
        }}
        onEnded={() => {
          const el = audioRef.current;
          if (el) el.currentTime = 0;
          setElapsedMs(0);
          setPhase("ended");
        }}
        onError={() => {
          if (phase === "playing") setPhase("idle");
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />

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
        open={clearing}
        message={t("clearAllConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("clearAll")}
        onOpenChange={setClearing}
        onConfirm={confirmClear}
      />
    </div>
  );
}
