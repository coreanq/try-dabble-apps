import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import {
  addLap,
  applyPhase,
  elapsedMs,
  expandInterval,
  expandPomodoro,
  formatClock,
  idleCountdown,
  idleStopwatch,
  pauseEngine,
  remainingMs,
  startEngine,
  type Engine,
  type IntervalStep,
  type Mode,
  type PhaseKind,
} from "@/lib/clock";
import { detectLang, HTML_LANG, isLang, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import { playCue } from "@/lib/sound";
import {
  backupFilename,
  buildBackup,
  clearStore,
  DEFAULT_HIIT,
  DEFAULT_TABATA,
  download,
  loadPrefs,
  loadStore,
  makeRoutineId,
  parseBackup,
  savePrefs,
  saveStore,
  toJSON,
  type Prefs,
  type Routine,
  type Store,
} from "@/lib/store";
import { enterFullscreen, exitFullscreen, isFullscreen, releaseWake, requestWake, type WakeSentinel } from "@/lib/wake";
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

const CHIP_KEYS: MsgKey[] = ["chipNoLogin", "chipNoLock", "chipHistoryFree", "chipBackup", "chipNoAds", "chipLocal", "chipLangs"];
const TOAST_MS = 2200;
const MODES: Mode[] = ["countdown", "pomodoro", "interval", "stopwatch"];

function modeLabelKey(mode: Mode): MsgKey {
  if (mode === "countdown") return "modeCountdown";
  if (mode === "pomodoro") return "modePomodoro";
  if (mode === "interval") return "modeInterval";
  return "modeStopwatch";
}

function phaseKey(kind: PhaseKind): MsgKey {
  if (kind === "rest") return "phaseRest";
  if (kind === "longRest") return "phaseLongRest";
  return "phaseWork";
}

function stepsFor(store: Store, mode: Mode): IntervalStep[] {
  if (mode === "pomodoro") return expandPomodoro(store.pomodoro);
  if (mode === "interval") return expandInterval(store.interval);
  return [];
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [store, setStore] = useState<Store>(() => loadStore());
  const [mode, setMode] = useState<Mode>(() => loadStore().lastMode);
  const [engine, setEngine] = useState<Engine>(() => idleCountdown(loadStore().countdownSec));
  const [hidden, setHidden] = useState(false);
  const [tick, setTick] = useState(0);
  const [fs, setFs] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [confirm, setConfirm] = useState<null | { kind: "import"; parsed: NonNullable<ReturnType<typeof parseBackup>> } | { kind: "clearAll" }>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const wakeRef = useRef<WakeSentinel>(null);
  const engineRef = useRef(engine);
  const hiddenRef = useRef(hidden);
  const storeRef = useRef(store);
  const modeRef = useRef(mode);
  const prefsRef = useRef(prefs);

  engineRef.current = engine;
  hiddenRef.current = hidden;
  storeRef.current = store;
  modeRef.current = mode;
  prefsRef.current = prefs;

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

  useEffect(() => {
    saveStore(store);
  }, [store]);
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    const onFs = () => setFs(isFullscreen());
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    onVis();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (!document.hidden) setTick((n) => n + 1);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // Advance phases when remaining hits 0.
  useEffect(() => {
    const e = engineRef.current;
    if (e.state !== "running") return;
    if (e.mode === "stopwatch") return;
    const left = remainingMs(e, hiddenRef.current);
    if (left > 0) return;
    if (e.mode === "countdown") {
      playCue("done", prefsRef.current.sound);
      setEngine((cur) => ({ ...cur, state: "done", remainingAtStartMs: 0 }));
      return;
    }
    const steps = stepsFor(storeRef.current, e.mode);
    const next = e.phaseIndex + 1;
    if (next >= steps.length) {
      playCue("done", prefsRef.current.sound);
      setEngine((cur) => ({ ...cur, state: "done", remainingAtStartMs: 0 }));
      return;
    }
    playCue("phase", prefsRef.current.sound);
    setEngine((cur) => applyPhase(cur, steps, next));
  }, [tick]);

  useEffect(() => {
    let cancelled = false;
    const syncWake = async () => {
      const want = prefs.wakeLock && engine.state === "running";
      if (!want) {
        await releaseWake(wakeRef.current);
        wakeRef.current = null;
        return;
      }
      if (hidden) return;
      const s = await requestWake();
      if (!cancelled) wakeRef.current = s;
    };
    void syncWake();
    return () => {
      cancelled = true;
    };
  }, [prefs.wakeLock, engine.state, hidden]);

  useEffect(() => () => { void releaseWake(wakeRef.current); }, []);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  const patchStore = (partial: Partial<Store>) => setStore((s) => ({ ...s, ...partial }));

  const switchMode = (next: Mode) => {
    setMode(next);
    patchStore({ lastMode: next });
    if (next === "stopwatch") setEngine(idleStopwatch());
    else if (next === "countdown") setEngine(idleCountdown(store.countdownSec));
    else {
      const steps = stepsFor({ ...store, lastMode: next }, next);
      const first = steps[0];
      setEngine({
        ...idleCountdown(first ? first.seconds : 0),
        mode: next,
        phaseKind: first?.kind ?? "work",
        phaseLabel: first?.label ?? "",
        totalRounds: steps.filter((s) => s.kind === "work").length || 1,
      });
    }
  };

  const onStart = () => {
    playCue("start", prefs.sound);
    if (engine.state === "paused" || engine.state === "running") {
      setEngine((e) => startEngine(e));
      return;
    }
    if (mode === "stopwatch") {
      setEngine(startEngine(idleStopwatch()));
      return;
    }
    if (mode === "countdown") {
      setEngine(startEngine(idleCountdown(store.countdownSec)));
      return;
    }
    const steps = stepsFor(store, mode);
    if (!steps.length) {
      showToast(t("needStep"));
      return;
    }
    setEngine((e) => applyPhase({ ...e, mode, state: "idle" }, steps, 0));
  };

  const onPause = () => setEngine((e) => pauseEngine(e, hidden));
  const onStop = () => {
    if (mode === "stopwatch") setEngine(idleStopwatch());
    else if (mode === "countdown") setEngine(idleCountdown(store.countdownSec));
    else switchMode(mode);
  };
  const onReset = () => onStop();
  const onSkip = () => {
    if (mode !== "pomodoro" && mode !== "interval") return;
    const steps = stepsFor(store, mode);
    const next = engine.phaseIndex + 1;
    if (next >= steps.length) {
      playCue("done", prefs.sound);
      setEngine((e) => ({ ...e, state: "done", remainingAtStartMs: 0 }));
      return;
    }
    playCue("phase", prefs.sound);
    setEngine((e) => applyPhase(e, steps, next));
  };
  const onLap = () => {
    playCue("lap", prefs.sound);
    setEngine((e) => addLap(e, hidden));
  };

  const displayMs = engine.mode === "stopwatch" ? elapsedMs(engine, hidden) : remainingMs(engine, hidden);
  const clock = formatClock(displayMs, engine.mode === "stopwatch");

  const saveCurrentRoutine = () => {
    const name = routineName.trim();
    if (!name) {
      showToast(t("needName"));
      return;
    }
    let routine: Routine;
    if (mode === "countdown") {
      routine = { id: makeRoutineId(), kind: "countdown", name, seconds: store.countdownSec };
    } else if (mode === "pomodoro") {
      routine = { id: makeRoutineId(), kind: "pomodoro", name, config: { ...store.pomodoro } };
    } else if (mode === "interval") {
      routine = { id: makeRoutineId(), kind: "interval", name, config: { ...store.interval, steps: store.interval.steps.map((s) => ({ ...s })) } };
    } else {
      showToast(t("needStep"));
      return;
    }
    setStore((s) => ({ ...s, routines: [routine, ...s.routines] }));
    setRoutineName("");
    showToast(t("routineSaved"));
  };

  const loadRoutine = (r: Routine) => {
    if (r.kind === "countdown") {
      setStore((s) => ({ ...s, countdownSec: r.seconds, lastMode: "countdown" }));
      setMode("countdown");
      setEngine(idleCountdown(r.seconds));
    } else if (r.kind === "pomodoro") {
      setStore((s) => ({ ...s, pomodoro: { ...r.config }, lastMode: "pomodoro" }));
      setMode("pomodoro");
      const steps = expandPomodoro(r.config);
      setEngine({
        ...idleCountdown(steps[0]?.seconds ?? 0),
        mode: "pomodoro",
        phaseKind: steps[0]?.kind ?? "work",
        totalRounds: steps.filter((s) => s.kind === "work").length || 1,
      });
    } else {
      setStore((s) => ({ ...s, interval: { ...r.config, steps: r.config.steps.map((s) => ({ ...s })) }, lastMode: "interval" }));
      setMode("interval");
      const steps = expandInterval(r.config);
      setEngine({
        ...idleCountdown(steps[0]?.seconds ?? 0),
        mode: "interval",
        phaseKind: steps[0]?.kind ?? "work",
        phaseLabel: steps[0]?.label ?? "",
        totalRounds: steps.filter((s) => s.kind === "work").length || 1,
      });
    }
    showToast(t("routineLoaded"));
  };

  const deleteRoutine = (id: string) => {
    setStore((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) }));
    showToast(t("routineDeleted"));
  };

  const applyStarter = (which: "tabata" | "hiit") => {
    const cfg = which === "tabata" ? DEFAULT_TABATA : DEFAULT_HIIT;
    setStore((s) => ({ ...s, interval: { ...cfg, steps: cfg.steps.map((st) => ({ ...st })) }, lastMode: "interval" }));
    setMode("interval");
    const steps = expandInterval(cfg);
    setEngine({
      ...idleCountdown(steps[0]?.seconds ?? 0),
      mode: "interval",
      phaseKind: steps[0]?.kind ?? "work",
      totalRounds: steps.filter((s) => s.kind === "work").length || 1,
    });
  };

  const updateStep = (i: number, patch: Partial<IntervalStep>) => {
    setStore((s) => {
      const steps = s.interval.steps.map((st, idx) => (idx === i ? { ...st, ...patch } : st));
      return { ...s, interval: { ...s.interval, steps } };
    });
  };

  const addStep = () => {
    setStore((s) => ({
      ...s,
      interval: { ...s.interval, steps: [...s.interval.steps, { kind: "work" as const, seconds: 20 }] },
    }));
  };

  const removeStep = (i: number) => {
    setStore((s) => ({
      ...s,
      interval: { ...s.interval, steps: s.interval.steps.filter((_, idx) => idx !== i) },
    }));
  };

  const onExport = () => {
    download(backupFilename(), toJSON(buildBackup(store, prefs)));
    showToast(t("exported"));
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed) {
        showToast(t("importBad"));
        return;
      }
      setConfirm({ kind: "import", parsed });
    } catch {
      showToast(t("importBad"));
    }
  };

  const applyImport = (parsed: NonNullable<ReturnType<typeof parseBackup>>) => {
    setStore(parsed.store);
    setPrefs(parsed.prefs);
    setMode(parsed.store.lastMode);
    if (parsed.store.lastMode === "stopwatch") setEngine(idleStopwatch());
    else setEngine(idleCountdown(parsed.store.countdownSec));
    showToast(t("importOk"));
  };

  const doClear = () => {
    const next = clearStore();
    setStore(next);
    setPrefs({ fontSize: "md", sound: true, wakeLock: true });
    setMode("countdown");
    setEngine(idleCountdown(next.countdownSec));
    showToast(t("cleared"));
  };

  const h = Math.floor(store.countdownSec / 3600);
  const m = Math.floor((store.countdownSec % 3600) / 60);
  const s = store.countdownSec % 60;
  const setCountdown = (hh: number, mm: number, ss: number) => {
    const total = Math.max(1, hh * 3600 + mm * 60 + ss);
    patchStore({ countdownSec: total });
    if (engine.state === "idle" && mode === "countdown") setEngine(idleCountdown(total));
  };

  const busy = engine.state === "running" || engine.state === "paused";

  return (
    <div className="tp-app" data-size={prefs.fontSize} data-phase={engine.phaseKind} data-state={engine.state}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <nav className="tp-modes" id="mode-tabs" aria-label={t("title")}>
        {MODES.map((mkey) => (
          <button
            key={mkey}
            type="button"
            id={`mode-${mkey}`}
            className={"tp-mode" + (mode === mkey ? " is-on" : "")}
            aria-pressed={mode === mkey}
            onClick={() => switchMode(mkey)}
          >
            {t(modeLabelKey(mkey))}
          </button>
        ))}
      </nav>

      <section className="tp-face" id="timer-face" data-mode={mode}>
        <p className="tp-phase" id="phase-label">
          {engine.state === "done"
            ? t("doneLabel")
            : mode === "stopwatch"
              ? t(engine.state === "running" ? "running" : engine.state === "paused" ? "paused" : "idle")
              : mode === "countdown"
                ? t("countdownTitle")
                : `${t(phaseKey(engine.phaseKind))}${engine.phaseLabel ? ` · ${engine.phaseLabel}` : ""}`}
        </p>
        <p className="tp-clock" id="clock-face" aria-live="polite">
          {clock}
        </p>
        {(mode === "pomodoro" || mode === "interval") && (
          <p className="tp-round" id="round-label">
            {t("roundOf", { n: engine.round, total: engine.totalRounds })}
          </p>
        )}
        <div className="tp-controls" id="timer-controls">
          {engine.state === "running" ? (
            <button type="button" className="tp-btn tp-btn-primary" id="btn-pause" onClick={onPause}>
              {t("pause")}
            </button>
          ) : engine.state === "paused" ? (
            <button type="button" className="tp-btn tp-btn-primary" id="btn-resume" onClick={onStart}>
              {t("resume")}
            </button>
          ) : (
            <button type="button" className="tp-btn tp-btn-primary" id="btn-start" onClick={onStart}>
              {t("start")}
            </button>
          )}
          <button type="button" className="tp-btn tp-btn-quiet" id="btn-reset" onClick={onReset}>
            {t("reset")}
          </button>
          <button type="button" className="tp-btn tp-btn-quiet" id="btn-stop" onClick={onStop}>
            {t("stop")}
          </button>
          {(mode === "pomodoro" || mode === "interval") && busy && (
            <button type="button" className="tp-btn tp-btn-quiet" id="btn-skip" onClick={onSkip}>
              {t("skip")}
            </button>
          )}
          {mode === "stopwatch" && engine.state === "running" && (
            <button type="button" className="tp-btn tp-btn-accent" id="btn-lap" onClick={onLap}>
              {t("lap")}
            </button>
          )}
        </div>
        <p className="tp-hint" id="mid-hint">{t("midHint")}</p>
      </section>

      {mode === "countdown" && (
        <section className="tp-card" id="countdown-editor">
          <h2>{t("countdownTitle")}</h2>
          <div className="tp-hms">
            <label>
              {t("hours")}
              <input className="tp-input" id="cd-hours" type="number" inputMode="numeric" min={0} max={23} value={h} onChange={(e) => setCountdown(Number(e.target.value) || 0, m, s)} />
            </label>
            <label>
              {t("minutes")}
              <input className="tp-input" id="cd-mins" type="number" inputMode="numeric" min={0} max={59} value={m} onChange={(e) => setCountdown(h, Number(e.target.value) || 0, s)} />
            </label>
            <label>
              {t("seconds")}
              <input className="tp-input" id="cd-secs" type="number" inputMode="numeric" min={0} max={59} value={s} onChange={(e) => setCountdown(h, m, Number(e.target.value) || 0)} />
            </label>
          </div>
        </section>
      )}

      {mode === "pomodoro" && (
        <section className="tp-card" id="pomodoro-editor">
          <h2>{t("pomodoroTitle")}</h2>
          <p className="tp-hint">{t("presetHint")}</p>
          <div className="tp-grid">
            <label>
              {t("workLabel")} ({t("seconds")})
              <input className="tp-input" id="pomo-work" type="number" inputMode="numeric" min={1} value={store.pomodoro.workSec} onChange={(e) => patchStore({ pomodoro: { ...store.pomodoro, workSec: Math.max(1, Number(e.target.value) || 1) } })} />
            </label>
            <label>
              {t("restLabel")} ({t("seconds")})
              <input className="tp-input" id="pomo-rest" type="number" inputMode="numeric" min={1} value={store.pomodoro.restSec} onChange={(e) => patchStore({ pomodoro: { ...store.pomodoro, restSec: Math.max(1, Number(e.target.value) || 1) } })} />
            </label>
            <label>
              {t("longRestLabel")} ({t("seconds")})
              <input className="tp-input" id="pomo-long" type="number" inputMode="numeric" min={1} value={store.pomodoro.longRestSec} onChange={(e) => patchStore({ pomodoro: { ...store.pomodoro, longRestSec: Math.max(1, Number(e.target.value) || 1) } })} />
            </label>
            <label>
              {t("rounds")}
              <input className="tp-input" id="pomo-rounds" type="number" inputMode="numeric" min={1} max={99} value={store.pomodoro.rounds} onChange={(e) => patchStore({ pomodoro: { ...store.pomodoro, rounds: Math.max(1, Number(e.target.value) || 1) } })} />
            </label>
            <label>
              {t("longEvery")}
              <input className="tp-input" id="pomo-every" type="number" inputMode="numeric" min={1} max={99} value={store.pomodoro.longEvery} onChange={(e) => patchStore({ pomodoro: { ...store.pomodoro, longEvery: Math.max(1, Number(e.target.value) || 1) } })} />
            </label>
          </div>
        </section>
      )}

      {mode === "interval" && (
        <section className="tp-card" id="interval-editor">
          <h2>{t("intervalTitle")}</h2>
          <p className="tp-hint">{t("presetHint")}</p>
          <div className="tp-starter">
            <button type="button" className="tp-btn tp-btn-quiet" id="preset-tabata" onClick={() => applyStarter("tabata")}>
              Tabata 20/10
            </button>
            <button type="button" className="tp-btn tp-btn-quiet" id="preset-hiit" onClick={() => applyStarter("hiit")}>
              HIIT 40/20
            </button>
          </div>
          <label>
            {t("routineName")}
            <input className="tp-input" id="interval-name" value={store.interval.name} onChange={(e) => patchStore({ interval: { ...store.interval, name: e.target.value } })} />
          </label>
          <label>
            {t("rounds")}
            <input className="tp-input" id="interval-rounds" type="number" inputMode="numeric" min={1} max={99} value={store.interval.rounds} onChange={(e) => patchStore({ interval: { ...store.interval, rounds: Math.max(1, Number(e.target.value) || 1) } })} />
          </label>
          <ul className="tp-steps" id="interval-steps">
            {store.interval.steps.map((st, i) => (
              <li key={i} className="tp-step">
                <select className="tp-select-block" aria-label={t("stepKind")} value={st.kind} onChange={(e) => updateStep(i, { kind: e.target.value as PhaseKind })}>
                  <option value="work">{t("workLabel")}</option>
                  <option value="rest">{t("restLabel")}</option>
                  <option value="longRest">{t("longRestLabel")}</option>
                </select>
                <input className="tp-input" aria-label={t("stepSeconds")} type="number" inputMode="numeric" min={1} value={st.seconds} onChange={(e) => updateStep(i, { seconds: Math.max(1, Number(e.target.value) || 1) })} />
                <input className="tp-input" aria-label={t("stepName")} value={st.label ?? ""} placeholder={t("stepName")} onChange={(e) => updateStep(i, { label: e.target.value })} />
                <button type="button" className="tp-btn tp-btn-danger" onClick={() => removeStep(i)}>
                  {t("removeStep")}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="tp-btn tp-btn-quiet" id="add-step" onClick={addStep}>
            {t("addStep")}
          </button>
        </section>
      )}

      {mode === "stopwatch" && (
        <section className="tp-card" id="laps-card">
          <h2>{t("lapsTitle")}</h2>
          {engine.laps.length === 0 ? (
            <p className="tp-hint">{t("noLaps")}</p>
          ) : (
            <ol className="tp-laps" id="lap-list">
              {engine.laps.map((ms, i) => (
                <li key={`${ms}-${i}`}>
                  <span>{t("lapN", { n: i + 1 })}</span>
                  <span>{formatClock(ms, true)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {mode !== "stopwatch" && (
        <section className="tp-card" id="save-routine">
          <h2>{t("saveRoutine")}</h2>
          <div className="tp-row">
            <input className="tp-input" id="routine-name" value={routineName} placeholder={t("routineNamePlaceholder")} onChange={(e) => setRoutineName(e.target.value)} />
            <button type="button" className="tp-btn tp-btn-primary" id="btn-save-routine" onClick={saveCurrentRoutine}>
              {t("save")}
            </button>
          </div>
        </section>
      )}

      <section className="tp-card" id="routines-card">
        <h2>{t("routinesTitle")}</h2>
        {store.routines.length === 0 ? (
          <p className="tp-hint">{t("noRoutines")}</p>
        ) : (
          <ul className="tp-routines">
            {store.routines.map((r) => (
              <li key={r.id} className="tp-routine">
                <div>
                  <strong>{r.name}</strong>
                  <span className="tp-hint">{r.kind === "countdown" ? t("modeCountdown") : r.kind === "pomodoro" ? t("modePomodoro") : t("modeInterval")}</span>
                </div>
                <div className="tp-row">
                  <button type="button" className="tp-btn tp-btn-quiet" onClick={() => loadRoutine(r)}>
                    {t("loadRoutine")}
                  </button>
                  <button type="button" className="tp-btn tp-btn-danger" onClick={() => deleteRoutine(r.id)}>
                    {t("deleteRoutine")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tp-card" id="session-tools">
        <h2>{t("settingsTitle")}</h2>
        <p className="tp-hint" id="keep-ticking">{t("keepTicking")}</p>
        <div className="tp-row wrap">
          <button type="button" className="tp-btn tp-btn-quiet" id="btn-sound" onClick={() => setPrefs((p) => ({ ...p, sound: !p.sound }))}>
            {prefs.sound ? t("soundOn") : t("soundOff")}
          </button>
          <button type="button" className="tp-btn tp-btn-quiet" id="btn-wake" onClick={() => setPrefs((p) => ({ ...p, wakeLock: !p.wakeLock }))}>
            {prefs.wakeLock ? t("wakeOn") : t("wakeOff")}
          </button>
          <button
            type="button"
            className="tp-btn tp-btn-quiet"
            id="btn-fullscreen"
            onClick={() => {
              if (fs) void exitFullscreen();
              else void enterFullscreen(document.documentElement);
            }}
          >
            {fs ? t("exitFullscreen") : t("fullscreen")}
          </button>
        </div>
        <p className="tp-hint">{t("soundHint")}</p>
        <p className="tp-hint">{t("wakeHint")}</p>
        <p className="tp-hint">{t("fullscreenHint")}</p>
        <fieldset className="tp-fonts">
          <legend>{t("fontSizeLabel")}</legend>
          {(["md", "lg", "xl"] as const).map((size) => (
            <label key={size}>
              <input type="radio" name="font" checked={prefs.fontSize === size} onChange={() => setPrefs((p) => ({ ...p, fontSize: size }))} />
              {t(size === "md" ? "fontMd" : size === "lg" ? "fontLg" : "fontXl")}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="tp-card" id="backup-card">
        <h2>{t("backupTitle")}</h2>
        <div className="tp-row wrap">
          <button type="button" className="tp-btn tp-btn-primary" id="btn-export" onClick={onExport}>
            {t("exportJson")}
          </button>
          <button type="button" className="tp-btn tp-btn-quiet" id="btn-import" onClick={() => fileRef.current?.click()}>
            {t("importJson")}
          </button>
          <button type="button" className="tp-btn tp-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>
            {t("clearAll")}
          </button>
        </div>
        <input
          ref={fileRef}
          id="import-file"
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImportFile(f);
            e.target.value = "";
          }}
        />
      </section>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="tp-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="tp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/timerpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "import" ? t("importConfirmTitle") : t("clearAllTitle")}
        body={confirm?.kind === "import" ? t("importConfirmBody") : t("clearAllBody")}
        confirmLabel={confirm?.kind === "import" ? t("importJson") : t("clearAll")}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else doClear();
        }}
      />
      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
