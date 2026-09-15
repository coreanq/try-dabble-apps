import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { detectLang, HTML_LANG, isLang, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  ACCEPT,
  applyRewind,
  applySkip,
  clampTime,
  fitLoop,
  fmtSpeed,
  fmtTime,
  isAudioFile,
  loopActive,
  NO_LOOP,
  pct,
  REWIND_STEPS,
  setLoopPoint,
  shouldSeekToA,
  SPEEDS,
  type RewindSec,
} from "@/lib/player";
import {
  abForFile,
  backupFilename,
  buildBackup,
  clearAll,
  defaultPrefs,
  download,
  loadPrefs,
  noteFor,
  parseBackup,
  savePrefs,
  setNoteFor,
  toJSON,
  withFile,
  withLoop,
  type Backup,
  type Prefs,
} from "@/lib/store";
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

const CHIP_KEYS: MsgKey[] = ["chipNoLogin", "chipNoUpload", "chipFreeLoop", "chipPhone", "chipShort", "chipSaved", "chipNoAds", "chipLangs"];
const DOC_KEYS: MsgKey[] = ["docIos", "docMobile", "docNotLibrary", "docFormats", "docKeys"];
const TOAST_MS = 2400;
const SAVE_DEBOUNCE_MS = 250;

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <rect x="6" y="5" width="4.5" height="14" rx="1.5" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1.5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M11 6v12l-8-6zM21 6v12l-8-6z" />
    </svg>
  );
}

function FwdIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M3 6v12l8-6zM13 6v12l8-6z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V6l11-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || el.isContentEditable;
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState<null | { kind: "import"; parsed: Backup } | { kind: "clearAll" }>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const fileNameRef = useRef("");
  const fileName = file?.name ?? "";
  fileNameRef.current = fileName;

  const ab = file ? abForFile(prefs, fileName) : NO_LOOP;
  const loopOn = loopActive(ab);
  const abRef = useRef(ab);
  abRef.current = ab;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (search.lang !== lang) navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
    rememberLang(lang);
  }, [lang, t]);

  /* ---------- persistence ---------- */
  useEffect(() => savePrefs(prefs), [prefs]);

  // Debounced autosave of the note for the open file.
  useEffect(() => {
    const name = fileNameRef.current;
    if (!name) return;
    const timer = window.setTimeout(() => setPrefs((prev) => setNoteFor(prev, name, notes)), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [notes]);

  // Flush on hide so a closed tab keeps the last words.
  useEffect(() => {
    const flush = () => {
      const name = fileNameRef.current;
      if (!name) return;
      savePrefs(setNoteFor(prefsRef.current, name, notesRef.current));
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // Dropping a file anywhere else must not navigate the tab away.
  useEffect(() => {
    const block = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  // Release the object URL when the page goes away.
  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);

  /* ---------- audio element ---------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = prefs.speed;
    (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
  }, [prefs.speed, src]);

  // Tight A–B guard while playing; timeupdate alone is too coarse for a 1s loop.
  useEffect(() => {
    if (!playing || !loopOn) return;
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      const points = abRef.current;
      if (a && shouldSeekToA(a.currentTime, points.a, points.b, true)) {
        a.currentTime = points.a as number;
        setCurrent(a.currentTime);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, loopOn]);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    const points = abRef.current;
    if (shouldSeekToA(a.currentTime, points.a, points.b, loopActive(points))) {
      a.currentTime = points.a as number;
    }
    setCurrent(a.currentTime);
  };

  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (!a) return;
    const d = Number.isFinite(a.duration) ? a.duration : 0;
    setDuration(d);
    const name = fileNameRef.current;
    if (name) {
      setPrefs((prev) => {
        const cur = abForFile(prev, name);
        const fitted = fitLoop(cur, d);
        return fitted === cur ? prev : withLoop(prev, name, fitted);
      });
    }
  };

  const onEnded = () => {
    const a = audioRef.current;
    const points = abRef.current;
    if (a && loopActive(points)) {
      a.currentTime = points.a as number;
      a.play().catch(() => setPlaying(false));
      return;
    }
    setPlaying(false);
  };

  /* ---------- file ---------- */
  const openFile = (f: File) => {
    if (!isAudioFile(f)) {
      showToast(t("badFile"));
      return;
    }
    const prevName = fileNameRef.current;
    const base = prevName ? setNoteFor(prefsRef.current, prevName, notesRef.current) : prefsRef.current;
    const nextPrefs = withFile(base, f.name);
    setPrefs(nextPrefs);
    setNotes(noteFor(nextPrefs, f.name));
    setLoadError(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setSrc(URL.createObjectURL(f));
    setFile(f);
  };

  const onPick = (f: File | undefined) => {
    if (f) openFile(f);
    if (pickRef.current) pickRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) openFile(f);
  };

  /* ---------- transport ---------- */
  const seekTo = (time: number) => {
    const a = audioRef.current;
    if (!a) return;
    const dur = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : duration;
    a.currentTime = clampTime(time, dur);
    setCurrent(a.currentTime);
  };

  const rewind = (n: RewindSec) => {
    const a = audioRef.current;
    if (!a || !file) return;
    seekTo(applyRewind(a.currentTime, n, a.duration || duration));
    setPrefs((p) => (p.rewindSec === n ? p : { ...p, rewindSec: n }));
  };

  const forward = (n: RewindSec) => {
    const a = audioRef.current;
    if (!a || !file) return;
    seekTo(applySkip(a.currentTime, n, a.duration || duration));
    setPrefs((p) => (p.rewindSec === n ? p : { ...p, rewindSec: n }));
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !file) return;
    if (a.paused) {
      a.play().catch(() => {
        setLoadError(true);
        setPlaying(false);
      });
    } else {
      a.pause();
    }
  };

  const setPoint = (which: "a" | "b") => {
    const a = audioRef.current;
    if (!a || !file) return;
    const name = fileNameRef.current;
    setPrefs((p) => withLoop(p, name, setLoopPoint(abForFile(p, name), which, a.currentTime)));
  };

  const clearLoop = () => {
    const name = fileNameRef.current;
    if (!name) return;
    setPrefs((p) => withLoop(p, name, NO_LOOP));
  };

  const setSpeed = (s: number) => setPrefs((p) => (p.speed === s ? p : { ...p, speed: s }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        rewind(prefsRef.current.rewindSec);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        forward(prefsRef.current.rewindSec);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, duration]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  /* ---------- backup ---------- */
  const doExport = () => {
    const name = fileNameRef.current;
    const snapshot = name ? setNoteFor(prefs, name, notesRef.current) : prefs;
    download(backupFilename(), toJSON(buildBackup(snapshot)));
  };

  const onImportFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackup(JSON.parse(String(reader.result)));
        if (!parsed) throw new Error("bad");
        setConfirm({ kind: "import", parsed });
      } catch {
        showToast(t("importBad"));
      }
      if (importRef.current) importRef.current.value = "";
    };
    reader.onerror = () => showToast(t("importBad"));
    reader.readAsText(f);
  };

  const applyImport = (parsed: Backup) => {
    const name = fileNameRef.current;
    setPrefs(parsed.prefs);
    setNotes(name ? noteFor(parsed.prefs, name) : "");
    showToast(t("importDone"));
  };

  const applyClearAll = () => {
    clearAll();
    const fresh = defaultPrefs();
    if (fileNameRef.current) fresh.lastFileName = fileNameRef.current;
    setPrefs(fresh);
    setNotes("");
    showToast(t("cleared"));
  };

  const progress = pct(current, duration);
  const loopStatus = loopOn
    ? t("loopOn", { a: fmtTime(ab.a as number, true), b: fmtTime(ab.b as number, true) })
    : ab.a !== null
      ? t("loopArmed", { a: fmtTime(ab.a, true) })
      : ab.b !== null
        ? t("loopArmed", { a: fmtTime(ab.b, true) })
        : t("loopOff");

  return (
    <div className="lnp-app">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <audio
        ref={audioRef}
        id="player"
        src={src || undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={onLoadedMetadata}
        onEnded={onEnded}
        onError={() => setLoadError(true)}
      />

      {/* file zone */}
      <section
        className={"lnp-file" + (file ? " has-file" : "") + (dragOver ? " is-over" : "")}
        id="file"
        aria-label={t("fileTitle")}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {file ? (
          <p className="lnp-file-name" id="file-name" title={t("currentFile", { name: fileName })}>
            <FileIcon />
            <span>{fileName}</span>
          </p>
        ) : (
          <div className="lnp-empty" id="empty-state">
            <h2>{t("emptyTitle")}</h2>
            <p>{t("emptyBody")}</p>
          </div>
        )}
        <div className="lnp-row wrap">
          <button type="button" className="lnp-btn lnp-btn-primary lnp-btn-big" id="btn-pick" data-action={file ? "change-file" : "pick-file"} onClick={() => pickRef.current?.click()}>
            {file ? t("changeFile") : t("pickFile")}
          </button>
          <span className="lnp-hint">{t("dropHint")}</span>
        </div>
        <input ref={pickRef} type="file" accept={ACCEPT} className="sr-only" id="audio-file" onChange={(e) => onPick(e.target.files?.[0])} />
        <p className="lnp-ios" id="ios-note">{t("iosNote")}</p>
        {loadError && (
          <p className="lnp-error" id="load-error" role="alert">
            {t("loadError")}
          </p>
        )}
      </section>

      {/* transport deck */}
      <section className={"lnp-deck" + (file ? " has-file" : "") + (playing ? " is-playing" : "")} id="deck" aria-label={t("rewindTitle")}>
        <div className="lnp-scrub-wrap">
          <div className="lnp-scrub-track">
            {loopOn && (
              <span
                className="lnp-loop-band"
                id="loop-band"
                aria-hidden="true"
                style={{ left: pct(ab.a, duration), width: `calc(${pct(ab.b, duration)} - ${pct(ab.a, duration)})` }}
              />
            )}
            {ab.a !== null && (
              <span className="lnp-marker lnp-marker-a" id="marker-a" aria-hidden="true" style={{ left: pct(ab.a, duration) }}>
                A
              </span>
            )}
            {ab.b !== null && (
              <span className="lnp-marker lnp-marker-b" id="marker-b" aria-hidden="true" style={{ left: pct(ab.b, duration) }}>
                B
              </span>
            )}
            <input
              id="scrubber"
              className="lnp-scrubber"
              type="range"
              min={0}
              max={duration > 0 ? duration : 0}
              step={0.1}
              value={Math.min(current, duration > 0 ? duration : 0)}
              disabled={!file || duration <= 0}
              aria-label={t("scrubLabel")}
              aria-valuetext={`${fmtTime(current)} / ${fmtTime(duration)}`}
              style={{ "--lnp-progress": progress } as React.CSSProperties}
              onChange={(e) => seekTo(Number(e.target.value))}
            />
          </div>
          <div className="lnp-times">
            <b id="time-current">{fmtTime(current)}</b>
            <span id="time-duration">{fmtTime(duration)}</span>
          </div>
        </div>

        <div className="lnp-transport">
          <div className="lnp-jump-row" role="group" aria-label={t("rewindTitle")}>
            {REWIND_STEPS.map((n) => (
              <button
                key={n}
                type="button"
                id={`btn-rewind-${n}`}
                className={"lnp-jump lnp-jump-back" + (prefs.rewindSec === n ? " is-last" : "")}
                data-action="rewind"
                data-sec={n}
                disabled={!file}
                aria-label={t("rewindN", { n })}
                onClick={() => rewind(n)}
              >
                <BackIcon />
                <span>{n}s</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={"lnp-play" + (playing ? " is-playing" : "")}
            id="btn-play"
            data-action={playing ? "pause" : "play"}
            aria-pressed={playing}
            disabled={!file}
            onClick={togglePlay}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
            <span>{playing ? t("pause") : t("play")}</span>
          </button>
          <div className="lnp-jump-row" role="group" aria-label={t("forwardTitle")}>
            {REWIND_STEPS.map((n) => (
              <button
                key={n}
                type="button"
                id={`btn-forward-${n}`}
                className="lnp-jump lnp-jump-fwd"
                data-action="forward"
                data-sec={n}
                disabled={!file}
                aria-label={t("forwardN", { n })}
                onClick={() => forward(n)}
              >
                <FwdIcon />
                <span>{n}s</span>
              </button>
            ))}
          </div>
        </div>
        <p className="lnp-hint on-dark">{t("rewindHint")}</p>
      </section>

      {/* A–B loop */}
      <section className="lnp-card" id="loop" aria-label={t("loopTitle")}>
        <div className="lnp-card-head">
          <h2>{t("loopTitle")}</h2>
          <span className={"lnp-loop-badge" + (loopOn ? " is-on" : "")} id="loop-state" data-loop={loopOn ? "on" : "off"}>
            {loopOn ? "A–B" : "—"}
          </span>
        </div>
        <div className="lnp-loop-row">
          <button type="button" className={"lnp-btn lnp-btn-amber" + (ab.a !== null ? " is-set" : "")} id="btn-set-a" data-action="set-a" disabled={!file} onClick={() => setPoint("a")}>
            {t("setA")}
            {ab.a !== null && <small>{fmtTime(ab.a, true)}</small>}
          </button>
          <button type="button" className={"lnp-btn lnp-btn-amber" + (ab.b !== null ? " is-set" : "")} id="btn-set-b" data-action="set-b" disabled={!file} onClick={() => setPoint("b")}>
            {t("setB")}
            {ab.b !== null && <small>{fmtTime(ab.b, true)}</small>}
          </button>
          <button type="button" className="lnp-btn" id="btn-clear-loop" data-action="clear-loop" disabled={ab.a === null && ab.b === null} onClick={clearLoop}>
            {t("clearLoop")}
          </button>
        </div>
        <p className={"lnp-loop-status" + (loopOn ? "" : " is-off")} id="loop-status" aria-live="polite">
          {loopStatus}
        </p>
        <p className="lnp-hint">{t("loopHint")}</p>
      </section>

      {/* speed */}
      <section className="lnp-card" id="speed" aria-label={t("speedTitle")}>
        <div className="lnp-card-head">
          <h2>{t("speedTitle")}</h2>
          <span className="lnp-speed-now" id="speed-now">
            {fmtSpeed(prefs.speed)}
          </span>
        </div>
        <div className="lnp-speeds" role="group" aria-label={t("speedTitle")}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              id={`btn-speed-${String(s).replace(".", "-")}`}
              className={"lnp-chip-btn" + (prefs.speed === s ? " is-on" : "")}
              data-action="speed"
              data-speed={s}
              aria-pressed={prefs.speed === s}
              onClick={() => setSpeed(s)}
            >
              {fmtSpeed(s)}
            </button>
          ))}
          <button type="button" className="lnp-btn lnp-btn-sm" id="btn-speed-reset" data-action="speed-reset" disabled={prefs.speed === 1} onClick={() => setSpeed(1)}>
            {t("resetSpeed")}
          </button>
        </div>
        <p className="lnp-hint">{t("speedHint")}</p>
      </section>

      {/* notes */}
      <section className="lnp-card" id="notes" aria-label={t("notesTitle")}>
        <div className="lnp-card-head">
          <h2>{t("notesTitle")}</h2>
        </div>
        <p className="lnp-hint" id="notes-for">
          {file ? t("notesFor", { name: fileName }) : t("notesNoFile")}
        </p>
        <label className="sr-only" htmlFor="notepad">
          {t("notesTitle")}
        </label>
        <textarea
          id="notepad"
          className="lnp-textarea"
          value={notes}
          disabled={!file}
          placeholder={t("notesPlaceholder")}
          spellCheck={false}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="lnp-hint">{t("notesHint")}</p>
        <div className="lnp-row wrap">
          <button type="button" className="lnp-btn" id="btn-export" onClick={doExport}>
            {t("exportJson")}
          </button>
          <button type="button" className="lnp-btn" id="btn-import" onClick={() => importRef.current?.click()}>
            {t("importJson")}
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => onImportFile(e.target.files?.[0])} />
          <button type="button" className="lnp-btn lnp-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>
            {t("clearAll")}
          </button>
        </div>
      </section>

      {/* good to know */}
      <section className="lnp-card" id="docs" aria-label={t("docTitle")}>
        <div className="lnp-card-head">
          <h2>{t("docTitle")}</h2>
        </div>
        <ul className="lnp-docs">
          {DOC_KEYS.map((k) => (
            <li key={k} className="lnp-doc" id={k}>
              <InfoIcon />
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="lnp-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="lnp-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="lnp-promise">
              {t(k)}
            </span>
          ))}
        </div>
      </section>

      <footer className="lnp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/listenpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "import" ? t("importTitle") : t("clearTitle")}
        body={confirm?.kind === "import" ? t("importBody") : t("clearBody")}
        confirmLabel={confirm?.kind === "import" ? t("importJson") : t("clearAll")}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else applyClearAll();
        }}
        onOpenChange={(o) => !o && setConfirm(null)}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
