import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Camera, Download, ImagePlus, Lock, RotateCcw } from "lucide-react";

import { CameraBody } from "@/components/camera-body";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Countdown } from "@/components/countdown";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PrintsGrid } from "@/components/prints-grid";
import { RollShelf, formatDate } from "@/components/roll-shelf";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCamera } from "@/lib/camera";
import { developRoll, releasePrints, type Print } from "@/lib/develop";
import { printFilename, saveAll, saveBlob } from "@/lib/download";
import { dropFrames, frameId, putFrame } from "@/lib/frames";
import {
  CHIP_KEYS,
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
  DEFAULT_CAPACITY,
  VIEW_KEY,
  commitFrame,
  developEarly,
  finishRoll,
  framesLeft,
  isFull,
  loadRolls,
  newRoll,
  phaseOf,
  readString,
  saveRolls,
  settle,
  writeString,
  type DevelopMode,
  type Roll,
} from "@/lib/rolls";
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

/** "camera" = an empty camera waiting for a roll; otherwise a roll id. */
const CAMERA_VIEW = "camera";
const TOAST_MS = 2600;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [now, setNow] = useState(() => Date.now());
  const [rolls, setRolls] = useState<Roll[]>(() => loadRolls().map((r) => settle(r, Date.now())));
  const [viewId, setViewId] = useState<string | null>(() => readString(VIEW_KEY));
  const [pendingMode, setPendingMode] = useState<DevelopMode>("full");
  const [spinning, setSpinning] = useState(false);
  const [curtain, setCurtain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [prints, setPrints] = useState<{ rollId: string; items: Print[] } | null>(null);
  const [savingAll, setSavingAll] = useState<[number, number] | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const spinTimer = useRef<number | undefined>(undefined);
  const curtainTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(spinTimer.current);
      window.clearTimeout(curtainTimer.current);
    },
    [],
  );

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

  // The clock. Every second, so the darkroom readout visibly runs; every mount
  // recomputes unlockAt - now, so nothing is ever "remembered" as remaining.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // A first-shot roll whose timer ran out while still open seals itself.
  useEffect(() => {
    setRolls((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        const s = settle(r, now);
        if (s !== r) changed = true;
        return s;
      });
      return changed ? next : prev;
    });
  }, [now]);

  useEffect(() => {
    saveRolls(rolls);
  }, [rolls]);

  useEffect(() => {
    writeString(VIEW_KEY, viewId ?? "");
  }, [viewId]);

  const sorted = useMemo(() => [...rolls].sort((a, b) => b.createdAt - a.createdAt), [rolls]);
  const shootingRoll = useMemo(() => sorted.find((r) => phaseOf(r, now) === "shooting") ?? null, [sorted, now]);

  /** What is on the desk: an explicit choice, else the open roll, else the newest roll, else the empty camera. */
  const current: Roll | null = useMemo(() => {
    if (viewId === CAMERA_VIEW) return shootingRoll;
    if (viewId) {
      const picked = rolls.find((r) => r.id === viewId);
      if (picked) return picked;
    }
    return shootingRoll ?? sorted[0] ?? null;
  }, [viewId, rolls, shootingRoll, sorted]);

  const phase = current ? phaseOf(current, now) : null;
  const cameraEmpty = !current || phase !== "shooting";
  const timerRunning = !!current && phase === "shooting" && current.unlockAt !== null;

  // Screen mode: darkroom while sealed (or while a first-shot timer runs), paper once developed.
  const mode = phase === "locked" || timerRunning ? "darkroom" : phase === "developed" ? "paper" : "camera";
  useEffect(() => {
    document.documentElement.dataset.srMode = mode;
    const theme = mode === "darkroom" ? "#1a0604" : mode === "paper" ? "#f4eee2" : "#2b2118";
    setMetaContent('meta[name="theme-color"]', theme);
  }, [mode]);

  const camera = useCamera(!!current && phase === "shooting");

  const updateRoll = useCallback((next: Roll) => {
    setRolls((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  }, []);

  // Develop: only once the unlock moment has passed, and only as a whole.
  useEffect(() => {
    if (!current || phase !== "developed") return;
    if (prints && prints.rollId === current.id) return;
    let cancelled = false;
    const roll = current;
    developRoll(roll.frames).then((items) => {
      if (cancelled) {
        releasePrints(items);
        return;
      }
      setPrints((old) => {
        if (old) releasePrints(old.items);
        return { rollId: roll.id, items };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [current, phase, prints]);

  const printsRef = useRef(prints);
  printsRef.current = prints;
  useEffect(
    () => () => {
      if (printsRef.current) releasePrints(printsRef.current.items);
    },
    [],
  );

  function handleLoadRoll() {
    const roll = newRoll(pendingMode, Date.now(), DEFAULT_CAPACITY);
    setRolls((prev) => [...prev, roll]);
    setViewId(roll.id);
    showToast(t("rollLoaded"));
  }

  function animateShutter() {
    setCurtain(false);
    setSpinning(false);
    window.requestAnimationFrame(() => {
      setCurtain(true);
      setSpinning(true);
      window.clearTimeout(curtainTimer.current);
      window.clearTimeout(spinTimer.current);
      curtainTimer.current = window.setTimeout(() => setCurtain(false), 420);
      spinTimer.current = window.setTimeout(() => setSpinning(false), 460);
    });
  }

  async function handleShutter() {
    if (!current || phase !== "shooting" || busy) return;
    if (camera.status !== "live") return;
    setBusy(true);
    animateShutter();
    try {
      const blob = await camera.capture();
      if (!blob) {
        showToast(t("camError"));
        return;
      }
      const id = frameId();
      const stored = await putFrame(id, blob);
      if (!stored) {
        showToast(t("storeFail"));
        return;
      }
      const wasFirst = current.firstShotAt === null;
      const next = commitFrame(current, id, Date.now());
      updateRoll(next);
      if (isFull(next)) showToast(t("rollFull"));
      else if (wasFirst && next.mode === "first") showToast(t("timerStarted"));
      else showToast(t("shotCommitted", { i: next.frames.length, n: framesLeft(next) }));
    } finally {
      setBusy(false);
    }
  }

  /** Camera fallback: files go straight into the roll, never previewed. */
  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0 || !current || phase !== "shooting" || busy) return;
    const files = Array.from(list);
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      showToast(t("notImage"));
      return;
    }
    setBusy(true);
    animateShutter();
    try {
      let roll = current;
      let added = 0;
      let skipped = 0;
      let failed = false;
      const wasFirst = roll.firstShotAt === null;
      for (const file of images) {
        if (isFull(roll)) {
          skipped += 1;
          continue;
        }
        const id = frameId();
        const stored = await putFrame(id, file);
        if (!stored) {
          failed = true;
          continue;
        }
        roll = commitFrame(roll, id, Date.now());
        added += 1;
      }
      if (added > 0) updateRoll(roll);
      if (failed) showToast(t("storeFail"));
      else if (isFull(roll) && added > 0) showToast(t("rollFull"));
      else if (skipped > 0) showToast(t("filesSkipped", { n: skipped }));
      else if (wasFirst && roll.mode === "first" && added > 0) showToast(t("timerStarted"));
      else if (added > 0) showToast(t("filesAdded", { n: added, left: framesLeft(roll) }));
    } finally {
      setBusy(false);
    }
  }

  function confirmFinish() {
    if (!current) return;
    if (current.frames.length === 0) {
      showToast(t("needOneFrame"));
      setFinishOpen(false);
      return;
    }
    updateRoll(finishRoll(current, Date.now()));
    setFinishOpen(false);
  }

  function confirmDiscard() {
    if (!current) return;
    const victim = current;
    setRolls((prev) => prev.filter((r) => r.id !== victim.id));
    void dropFrames(victim.frames);
    if (prints && prints.rollId === victim.id) {
      releasePrints(prints.items);
      setPrints(null);
    }
    setViewId(CAMERA_VIEW);
    setDiscardOpen(false);
    showToast(t("toastDiscarded"));
  }

  function confirmEarly() {
    if (!current) return;
    updateRoll(developEarly(current, Date.now()));
    setEarlyOpen(false);
    showToast(t("toastDevelopedEarly"));
  }

  function handleDownload(index: number) {
    if (!current || !prints || prints.rollId !== current.id) return;
    const p = prints.items[index];
    if (!p) return;
    saveBlob(p.blob, printFilename(current.firstShotAt ?? current.createdAt, index));
    showToast(t("downloadedOne"));
  }

  async function handleDownloadAll() {
    if (!current || !prints || prints.rollId !== current.id || savingAll) return;
    const stamp = current.firstShotAt ?? current.createdAt;
    const items = prints.items.map((p, i) => ({ blob: p.blob, filename: printFilename(stamp, i) }));
    setSavingAll([0, items.length]);
    const n = await saveAll(items, (done, total) => setSavingAll([done, total]));
    setSavingAll(null);
    showToast(t("downloadedAll", { n }));
  }

  const shelfRolls = sorted.filter((r) => r.id !== current?.id);
  const modeTag = (roll: Roll | null, fallback: DevelopMode) =>
    (roll?.mode ?? fallback) === "first" ? t("modeTagFirst") : t("modeTagFull");

  return (
    <div className="sr-desk">
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
        {CHIP_KEYS.map((key) => (
          <span className="sr-chip" key={key}>
            {t(key)}
          </span>
        ))}
      </div>

      {/* ---------- the camera (empty, or with an open roll) ---------- */}
      {(cameraEmpty && phase !== "locked" && phase !== "developed") || phase === "shooting" ? (
        <CameraBody
          t={t}
          framesLeft={current && phase === "shooting" ? framesLeft(current) : DEFAULT_CAPACITY}
          capacity={current && phase === "shooting" ? current.capacity : DEFAULT_CAPACITY}
          modeTag={
            current && phase === "shooting"
              ? modeTag(current, "full")
              : t("framesPerRoll", { n: DEFAULT_CAPACITY })
          }
          shutterDisabled={!current || phase !== "shooting" || camera.status !== "live" || busy}
          onShutter={() => void handleShutter()}
          spinning={spinning}
        >
          {current && phase === "shooting" ? (
            <>
              <video
                ref={camera.videoRef}
                className="sr-video"
                data-live={camera.status === "live"}
                autoPlay
                muted
                playsInline
              />
              {camera.status === "live" && <div className="sr-brackets" aria-hidden />}
              {camera.status === "starting" && (
                <p className="sr-finder-note">{t("camStarting")}</p>
              )}
              {camera.status === "error" && (
                <div className="sr-notice" role="alert" id="camera-notice">
                  <span>{t("camError")}</span>
                  <span className="flex flex-wrap gap-[0.4rem]">
                    <button type="button" className="sr-key" id="camera-retry" onClick={camera.retry}>
                      <RotateCcw className="size-4" aria-hidden />
                      {t("camRetry")}
                    </button>
                    <button
                      type="button"
                      className="sr-key"
                      id="add-photo"
                      disabled={busy}
                      onClick={() => fileInput.current?.click()}
                    >
                      <ImagePlus className="size-4" aria-hidden />
                      {t("camFallback")}
                    </button>
                  </span>
                  <span className="text-[0.7rem] opacity-80">{t("camFallbackHint")}</span>
                </div>
              )}
              <div className="sr-curtain" data-on={curtain} aria-hidden />
            </>
          ) : (
            <div className="sr-loader" id="loader" role="radiogroup" aria-label={t("modeQuestion")}>
              <p className="sr-loader-q">{t("modeQuestion")}</p>
              {(["full", "first"] as DevelopMode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  className="sr-mode"
                  role="radio"
                  aria-checked={pendingMode === m}
                  id={`mode-${m}`}
                  onClick={() => setPendingMode(m)}
                >
                  <span className="sr-mode-radio" aria-hidden />
                  <span className="min-w-0">
                    <span className="sr-mode-title">
                      {m === "full" ? t("modeFull") : t("modeFirst")}
                      {m === "full" && <span className="sr-mode-default">{t("modeDefault")}</span>}
                    </span>
                    <span className="sr-mode-hint">{m === "full" ? t("modeFullHint") : t("modeFirstHint")}</span>
                  </span>
                </button>
              ))}
              <div className="sr-loader-cta">
                <Button id="load-roll" size="lg" onClick={handleLoadRoll}>
                  <Camera className="size-5" aria-hidden />
                  {t("loadBtn")} · {t("framesPerRoll", { n: DEFAULT_CAPACITY })}
                </Button>
              </div>
            </div>
          )}
        </CameraBody>
      ) : null}

      <input
        ref={fileInput}
        id="file-input"
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        style={{ fontSize: "1rem" }}
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* First-shot timer running while the roll is still open: the safelight strip. */}
      {current && phase === "shooting" && current.unlockAt !== null && (
        <section className="sr-strip" id="darkroom-strip" aria-label={t("darkroomTitle")}>
          <span className="sr-safelight">{t("developsIn")}</span>
          <Countdown unlockAt={current.unlockAt} now={now} t={t} id="countdown" />
          <p className="m-0 text-[0.74rem] text-[#c9865a]">
            {t("opensAt", { date: formatDate(current.unlockAt, lang) })} · {t("stillShooting")}
          </p>
        </section>
      )}

      {/* Under the camera while shooting: finish now, discard whole roll. */}
      {current && phase === "shooting" && (
        <div className="flex flex-wrap items-center justify-between gap-[0.5rem]" id="roll-actions">
          <button
            type="button"
            className="sr-key"
            id="finish-roll"
            disabled={current.frames.length === 0 || busy}
            onClick={() => setFinishOpen(true)}
          >
            <Lock className="size-4" aria-hidden />
            {t("finishRoll")}
          </button>
          <button
            type="button"
            className="sr-key sr-key-ghost"
            id="discard-roll"
            disabled={busy}
            onClick={() => setDiscardOpen(true)}
          >
            {t("discardRoll")}
          </button>
        </div>
      )}
      {current && phase === "shooting" && camera.status === "live" && (
        <p className="m-0 text-center text-[0.72rem] text-[var(--sr-fg-muted)]" id="shutter-hint">
          {t("shutterHint")}
        </p>
      )}

      {/* ---------- darkroom: sealed roll, countdown only ---------- */}
      {current && phase === "locked" && current.unlockAt !== null && (
        <section className="sr-darkroom" id="darkroom" aria-label={t("darkroomTitle")}>
          <div className="flex items-center justify-between gap-2">
            <span className="sr-safelight">{t("darkroomTitle")}</span>
            <span className="sr-slug" style={{ color: "#c9865a" }}>
              {modeTag(current, "full")}
            </span>
          </div>
          <div className="sr-canister">
            <span className="sr-canister-body" aria-hidden />
            <span className="grid min-w-0 gap-[0.1rem]">
              <span className="text-[1.05rem] font-extrabold" id="sealed-count">
                {t("sealedWith", { n: current.frames.length })}
              </span>
              <span className="text-[0.74rem] text-[#c9865a]">
                {t("shotOn", { date: formatDate(current.firstShotAt ?? current.createdAt, lang) })}
              </span>
            </span>
          </div>
          <span className="text-[0.74rem] font-bold tracking-[0.12em] text-[#ff9a4a] uppercase">{t("developsIn")}</span>
          <Countdown unlockAt={current.unlockAt} now={now} t={t} id="countdown" />
          <p className="m-0 text-[0.76rem] text-[#c9865a]" id="opens-at">
            {t("opensAt", { date: formatDate(current.unlockAt, lang) })}
          </p>
          <div className="flex flex-wrap items-center gap-[0.5rem]">
            {shootingRoll ? (
              <Button variant="secondary" id="back-to-camera" onClick={() => setViewId(CAMERA_VIEW)}>
                <Camera className="size-4" aria-hidden />
                {t("backToCamera")}
              </Button>
            ) : (
              <Button variant="secondary" id="load-new-roll" onClick={() => setViewId(CAMERA_VIEW)}>
                <Camera className="size-4" aria-hidden />
                {t("loadNewRoll")}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-[0.5rem] border-t border-[#5a2313] pt-[0.6rem]">
            <button type="button" className="sr-key sr-key-ghost" id="develop-early" onClick={() => setEarlyOpen(true)}>
              {t("developEarly")}
            </button>
            <button type="button" className="sr-key sr-key-ghost" id="discard-roll" onClick={() => setDiscardOpen(true)}>
              {t("discardRoll")}
            </button>
          </div>
        </section>
      )}

      {/* ---------- developed: the whole roll, at once ---------- */}
      {current && phase === "developed" && (
        <Card id="developed">
          <CardHeader>
            <CardTitle>{t("developedTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-[0.7rem]">
            <div className="grid gap-[0.1rem]">
              <span className="text-[0.95rem] font-extrabold text-[var(--sr-fg)]">
                {t("developedOn", { date: formatDate(current.unlockAt ?? now, lang) })}
              </span>
              <span className="text-[0.74rem] text-[var(--sr-fg-muted)]">
                {t("shotOn", { date: formatDate(current.firstShotAt ?? current.createdAt, lang) })} ·{" "}
                {t("sealedWith", { n: current.frames.length })}
              </span>
            </div>

            {prints && prints.rollId === current.id ? (
              <>
                <div className="flex flex-wrap items-center gap-[0.5rem]">
                  <Button id="download-all" disabled={!!savingAll} onClick={() => void handleDownloadAll()}>
                    <Download className="size-4" aria-hidden />
                    {savingAll
                      ? t("downloading", { i: savingAll[0], n: savingAll[1] })
                      : t("downloadAll", { n: prints.items.length })}
                  </Button>
                  <Button
                    variant="secondary"
                    id={shootingRoll ? "back-to-camera" : "new-roll"}
                    onClick={() => setViewId(CAMERA_VIEW)}
                  >
                    <Camera className="size-4" aria-hidden />
                    {shootingRoll ? t("backToCamera") : t("newRoll")}
                  </Button>
                </div>
                <PrintsGrid prints={prints.items} t={t} onDownload={handleDownload} />
              </>
            ) : (
              <p className="m-0 text-[0.86rem] font-bold text-[var(--sr-fg-muted)]" id="developing">
                {t("developing")}
              </p>
            )}

            <div className="flex justify-end border-t border-[var(--sr-line)] pt-[0.5rem]">
              <button type="button" className="sr-key sr-key-ghost" id="discard-roll" onClick={() => setDiscardOpen(true)}>
                {t("discardRoll")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="m-0 text-[0.74rem] leading-5 text-[var(--sr-fg-muted)]" id="about-text">
        {t("about")}
      </p>

      {/* ---------- every other roll ---------- */}
      <Card id="shelf-card" size="sm">
        <CardHeader>
          <CardTitle>{t("shelfTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RollShelf rolls={shelfRolls} now={now} lang={lang} t={t} onOpen={(id) => setViewId(id)} />
        </CardContent>
      </Card>

      <footer className="sr-footer">
        <a href={`https://try-dabble.com/privacy?lang=${lang}`}>{t("privacy")}</a>
        <a href={`https://try-dabble.com/terms?lang=${lang}`}>{t("terms")}</a>
        <a href={`https://try-dabble.com/guides/slowroll?lang=${lang}`}>try-dabble.com</a>
      </footer>

      <ConfirmDialog
        open={finishOpen}
        id="finish-dialog"
        title={t("finishTitle")}
        body={t("finishBody", { n: current ? framesLeft(current) : 0 })}
        cancelLabel={t("cancel")}
        confirmLabel={t("finishBtn")}
        onOpenChange={setFinishOpen}
        onConfirm={confirmFinish}
      />
      <ConfirmDialog
        open={discardOpen}
        id="discard-dialog"
        title={t("discardTitle")}
        body={t("discardBody", { n: current?.frames.length ?? 0 })}
        cancelLabel={t("cancel")}
        confirmLabel={t("discardBtn", { n: current?.frames.length ?? 0 })}
        onOpenChange={setDiscardOpen}
        onConfirm={confirmDiscard}
      />
      <ConfirmDialog
        open={earlyOpen}
        id="early-dialog"
        title={t("developEarlyTitle")}
        body={t("developEarlyBody")}
        cancelLabel={t("cancel")}
        confirmLabel={t("developEarlyBtn")}
        onOpenChange={setEarlyOpen}
        onConfirm={confirmEarly}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
