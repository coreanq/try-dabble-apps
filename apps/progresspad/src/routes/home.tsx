import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { StageVisual } from "@/components/stage-visual";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatDecimal, formatInt, formatTime, isDateKey, parseDecimal, parseIntStrict, splitMinutes, toDateKey } from "@/lib/dates";
import { detectLang, HTML_LANG, isLang, LOCALE, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  addLog,
  backupFilename,
  buildBackup,
  clearAll,
  computeProgress,
  createTask,
  download,
  elapsedMinutes,
  loadPrefs,
  loadTasks,
  loadTimer,
  parseBackup,
  removeLog,
  savePrefs,
  saveTasks,
  saveTimer,
  toJSON,
  updateLog,
  updateTask,
  type Backup,
  type Prefs,
  type StageVisual as Visual,
  type TargetMode,
  type Task,
  type TimerState,
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

const CHIP_KEYS: MsgKey[] = ["chipNoTimer", "chipNoDyingTree", "chipNoMidAds", "chipNoUpsell", "chipNoLogin", "chipLocal", "chipBackup", "chipFree", "chipLangs"];
const STAGE_KEYS: MsgKey[] = ["stage0", "stage1", "stage2", "stage3", "stage4"];
const QUICK_MINUTES = [15, 25, 30, 45, 60, 90];
const TOAST_MS = 2400;
type Tab = "history" | "backup";

/** Local "today" that refreshes when the tab comes back, so a page left open overnight rolls over. */
function useToday(): string {
  const [today, setToday] = useState(() => toDateKey(new Date()));
  useEffect(() => {
    const bump = () => setToday(toDateKey(new Date()));
    document.addEventListener("visibilitychange", bump);
    window.addEventListener("focus", bump);
    window.addEventListener("pageshow", bump);
    const id = window.setInterval(bump, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", bump);
      window.removeEventListener("focus", bump);
      window.removeEventListener("pageshow", bump);
      window.clearInterval(id);
    };
  }, []);
  return today;
}

/** Ticks once a minute while the optional timer runs; real clock, so a backgrounded tab stays honest. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const bump = () => setNow(Date.now());
    bump();
    const id = window.setInterval(bump, 15_000);
    document.addEventListener("visibilitychange", bump);
    window.addEventListener("focus", bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
      window.removeEventListener("focus", bump);
    };
  }, [active]);
  return now;
}

interface TaskDraft {
  mode: "new" | "edit";
  title: string;
  targetMode: TargetMode;
  hours: string;
  percent: string;
  minutesPerPercent: string;
  error: MsgKey | null;
}

interface LogDraft {
  logId: string | null; // null = new
  minutes: string;
  date: string;
  note: string;
  error: MsgKey | null;
}

type Confirm =
  | { kind: "import"; parsed: Backup }
  | { kind: "clearAll" }
  | { kind: "deleteTask"; id: string }
  | { kind: "deleteLog"; logId: string }
  | { kind: "timerSave"; minutes: number };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const locale = LOCALE[lang];
  const fmt = useCallback((n: number) => formatInt(n, locale), [locale]);
  const fmtHM = useCallback(
    (minutes: number) => {
      const { h, m } = splitMinutes(minutes);
      return h > 0 ? t("hoursMinutes", { h: fmt(h), m }) : t("minutesN", { n: fmt(m) });
    },
    [t, fmt],
  );

  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [timer, setTimer] = useState<TimerState | null>(() => loadTimer());
  const [tab, setTab] = useState<Tab>("history");
  const today = useToday();
  const now = useNow(timer !== null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [logDraft, setLogDraft] = useState<LogDraft | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => savePrefs(prefs), [prefs]);
  useEffect(() => saveTimer(timer), [timer]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  /* ---------- active task ---------- */
  const active = useMemo(() => tasks.find((task) => task.id === prefs.activeTaskId) ?? tasks[0] ?? null, [tasks, prefs.activeTaskId]);
  const progress = useMemo(() => (active ? computeProgress(active, prefs.minutesPerPercent) : null), [active, prefs.minutesPerPercent]);
  const progressById = useMemo(() => new Map(tasks.map((task) => [task.id, computeProgress(task, prefs.minutesPerPercent)])), [tasks, prefs.minutesPerPercent]);

  const selectTask = (id: string) => setPrefs((p) => ({ ...p, activeTaskId: id }));
  const patchActive = (fn: (task: Task) => Task) => {
    if (!active) return;
    setTasks((list) => list.map((task) => (task.id === active.id ? fn(task) : task)));
  };

  /* ---------- task dialog ---------- */
  const openNew = () =>
    setTaskDraft({ mode: "new", title: "", targetMode: "hours", hours: "", percent: "100", minutesPerPercent: String(prefs.minutesPerPercent), error: null });
  const openEdit = () => {
    if (!active) return;
    setTaskDraft({
      mode: "edit",
      title: active.title,
      targetMode: active.targetMode,
      hours: active.targetHours !== undefined ? String(active.targetHours) : "",
      percent: active.targetPercent !== undefined ? String(active.targetPercent) : "100",
      minutesPerPercent: String(prefs.minutesPerPercent),
      error: null,
    });
  };
  const saveTask = () => {
    if (!taskDraft) return;
    const title = taskDraft.title.trim();
    if (!title) return setTaskDraft({ ...taskDraft, error: "needTitle" });
    let target: { targetMode: TargetMode; targetHours?: number; targetPercent?: number };
    if (taskDraft.targetMode === "hours") {
      const hours = parseDecimal(taskDraft.hours);
      if (hours === null || hours <= 0) return setTaskDraft({ ...taskDraft, error: "needTargetHours" });
      target = { targetMode: "hours", targetHours: hours };
    } else {
      const percent = parseIntStrict(taskDraft.percent);
      if (percent === null || percent < 1) return setTaskDraft({ ...taskDraft, error: "needTargetPercent" });
      target = { targetMode: "percent", targetPercent: percent };
      const mpp = parseIntStrict(taskDraft.minutesPerPercent);
      if (mpp !== null && mpp >= 1) setPrefs((p) => ({ ...p, minutesPerPercent: mpp }));
    }
    if (taskDraft.mode === "new") {
      const task = createTask(title, target);
      setTasks((list) => [...list, task]);
      setPrefs((p) => ({ ...p, activeTaskId: task.id }));
      showToast(t("taskCreated"));
    } else if (active) {
      setTasks((list) => updateTask(list, active.id, { title, ...target }));
      showToast(t("savedToast"));
    }
    setTaskDraft(null);
  };
  const deleteTask = (id: string) => {
    setTasks((list) => list.filter((task) => task.id !== id));
    setPrefs((p) => (p.activeTaskId === id ? { ...p, activeTaskId: null } : p));
    if (timer?.taskId === id) setTimer(null);
    showToast(t("taskDeleted"));
  };

  /* ---------- log focus ---------- */
  const openLog = (preset?: number) => {
    if (!active) return;
    setLogDraft({ logId: null, minutes: preset ? String(preset) : "", date: today, note: "", error: null });
  };
  const openEditLog = (logId: string) => {
    const log = active?.logs.find((l) => l.id === logId);
    if (!log) return;
    setLogDraft({ logId, minutes: String(log.minutes), date: log.date, note: log.note ?? "", error: null });
  };
  const saveLog = () => {
    if (!logDraft || !active) return;
    const minutes = parseIntStrict(logDraft.minutes);
    if (minutes === null || minutes < 1) return setLogDraft({ ...logDraft, error: "needMinutes" });
    if (!isDateKey(logDraft.date)) return setLogDraft({ ...logDraft, error: "needDate" });
    if (logDraft.logId) patchActive((task) => updateLog(task, logDraft.logId!, { minutes, date: logDraft.date, note: logDraft.note }));
    else patchActive((task) => addLog(task, minutes, logDraft.date, logDraft.note));
    setLogDraft(null);
    setTab("history");
    showToast(t("savedToast"));
  };
  const deleteLog = (logId: string) => {
    patchActive((task) => removeLog(task, logId));
    showToast(t("deletedToast"));
  };

  /* ---------- optional timer ---------- */
  const timerMinutes = timer ? elapsedMinutes(timer.startedAt, now) : 0;
  const startTimer = () => {
    if (!active) return;
    setTimer({ taskId: active.id, startedAt: Date.now() });
  };
  const stopTimer = () => {
    if (!timer) return;
    const minutes = elapsedMinutes(timer.startedAt, Date.now());
    setTimer(null);
    if (minutes < 1) return showToast(t("timerTooShort"));
    setConfirm({ kind: "timerSave", minutes });
  };
  const saveTimerMinutes = (minutes: number) => {
    const target = tasks.find((task) => task.id === timer?.taskId) ?? active;
    if (!target) return;
    setTasks((list) => list.map((task) => (task.id === target.id ? addLog(task, minutes, today) : task)));
    setTab("history");
    showToast(t("savedToast"));
  };
  const timerTask = timer ? (tasks.find((task) => task.id === timer.taskId) ?? null) : null;

  /* ---------- backup ---------- */
  const exportJson = () => {
    download(backupFilename(), toJSON(buildBackup(tasks, prefs)));
    showToast(t("exported"));
  };
  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed) throw new Error("bad");
      setConfirm({ kind: "import", parsed });
    } catch {
      showToast(t("importBad"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const applyImport = (parsed: Backup) => {
    setTasks(parsed.tasks);
    setPrefs({ ...parsed.prefs, activeTaskId: parsed.prefs.activeTaskId ?? parsed.tasks[0]?.id ?? null });
    setTimer(null);
    showToast(t("importOk", { n: parsed.tasks.length }));
  };
  const applyClearAll = () => {
    clearAll();
    setTasks([]);
    setTimer(null);
    setPrefs((p) => ({ ...p, activeTaskId: null }));
    showToast(t("cleared"));
  };

  const setVisual = (visual: Visual) => setPrefs((p) => ({ ...p, stageVisual: visual }));

  const confirmCopy = (() => {
    switch (confirm?.kind) {
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody", { n: confirm.parsed.tasks.length }), label: t("importJson"), destructive: false };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), label: t("clearAll"), destructive: true };
      case "deleteTask":
        return { title: t("deleteTaskTitle"), body: t("deleteTaskBody"), label: t("deleteTask"), destructive: true };
      case "deleteLog":
        return { title: t("deleteLogTitle"), body: t("deleteLogBody"), label: t("deleteLog"), destructive: true };
      case "timerSave":
        return { title: t("timerSaveTitle"), body: t("timerSaveBody", { n: fmt(confirm.minutes) }), label: t("timerSave"), destructive: false };
      default:
        return { title: "", body: "", label: "", destructive: false };
    }
  })();

  const stageOn = prefs.stageVisual !== "off";

  return (
    <div className="pp-app" data-lang={lang}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <section className="pp-how" id="how">
        <b>{t("howTitle")}</b>
        <p className="pp-hint">{t("howBody")}</p>
      </section>

      {/* task chips */}
      <section id="tasks" aria-label={t("tasksTitle")}>
        <ul className="pp-tasks" id="task-list">
          {tasks.map((task) => {
            const p = progressById.get(task.id);
            return (
              <li key={task.id}>
                <button type="button" className={"pp-task-tab" + (active?.id === task.id ? " is-on" : "")} data-task={task.id} aria-pressed={active?.id === task.id} onClick={() => selectTask(task.id)}>
                  <span className="pp-mini" aria-hidden="true">
                    <i style={{ width: `${p?.barPercent ?? 0}%` }} />
                  </span>
                  {task.title}
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" className="pp-task-tab is-new" id="btn-new-task" onClick={openNew}>
              + {t("newTask")}
            </button>
          </li>
        </ul>
      </section>

      {!active || !progress ? (
        <section className="pp-empty" id="empty">
          <b>{t("noTasks")}</b>
          <p className="pp-hint">{t("noTasksHint")}</p>
          <div className="pp-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="pp-btn pp-btn-primary" id="btn-first-task" onClick={openNew}>
              {t("newTask")}
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* the bench: active task */}
          <section className={`pp-bench${progress.done ? " is-done" : ""}`} id="task-card" aria-live="polite">
            <div className="pp-bench-head">
              <h2 className="pp-bench-title" id="task-title">{active.title}</h2>
              <span className={"pp-badge" + (active.targetMode === "percent" ? " is-percent" : "")} id="task-target">
                {active.targetMode === "percent" ? t("badgePercent", { n: fmt(active.targetPercent ?? 100) }) : t("badgeHours", { n: formatDecimal(active.targetHours ?? 0, locale) })}
              </span>
            </div>
            <div className={"pp-bench-body" + (stageOn ? "" : " no-stage")}>
              <div className="pp-count">
                <span className="pp-count-label">{t("loggedLabel")}</span>
                <p className="pp-count-big" id="total-logged">{fmtHM(progress.totalMinutes)}</p>
                <span className="pp-count-of" id="target-of">
                  {active.targetMode === "percent" ? t("ofTargetPercent", { n: fmt(progress.targetPercent) }) : t("ofTargetHours", { n: formatDecimal(active.targetHours ?? 0, locale) })}
                </span>
                {active.targetMode === "percent" && (
                  <span className="pp-count-of" id="earned-percent">
                    {t("earnedPercentLine", { n: formatDecimal(Math.floor(progress.earnedPercent * 10) / 10, locale), m: fmt(prefs.minutesPerPercent) })}
                  </span>
                )}
              </div>
              {prefs.stageVisual !== "off" && <StageVisual visual={prefs.stageVisual} stage={progress.stage} name={t(STAGE_KEYS[progress.stage])} />}
            </div>
            <div className={`pp-bar${progress.done ? " is-done" : ""}`} id="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, progress.percent)}>
              <span style={{ width: `${progress.barPercent}%` }} />
            </div>
            <div className="pp-bar-row">
              <span id="progress-pct">{t("percentDone", { pct: fmt(progress.percent) })}</span>
              <span id="remaining" className={progress.done ? "is-leaf" : ""}>
                {progress.done
                  ? t("doneLabel")
                  : active.targetMode === "percent"
                    ? t("remainingPct", { n: formatDecimal(Math.ceil((progress.targetPercent - progress.earnedPercent) * 10) / 10, locale) })
                    : t("remainingHM", { h: fmt(splitMinutes(progress.remainingMinutes).h), m: splitMinutes(progress.remainingMinutes).m })}
              </span>
            </div>
            {progress.over && (
              <p className="pp-over" id="over-target" role="status">
                {t("overTargetMsg", { extra: fmtHM(progress.overMinutes) })}
              </p>
            )}
            <div className="pp-stage-foot">
              <span id="stage-promise">🌱 {t("stageNeverDies")}</span>
              <div className="pp-seg" role="group" aria-label={t("stageLabel")} id="stage-toggle">
                {(["plant", "blocks", "off"] as Visual[]).map((v) => (
                  <button key={v} type="button" id={`btn-stage-${v}`} className={prefs.stageVisual === v ? "is-on" : ""} aria-pressed={prefs.stageVisual === v} onClick={() => setVisual(v)}>
                    {t(v === "plant" ? "stagePlant" : v === "blocks" ? "stageBlocks" : "stageOff")}
                  </button>
                ))}
              </div>
            </div>
            {!stageOn && <p className="pp-hint" id="stage-off-hint">{t("stageOffHint")}</p>}
            <div className="pp-bench-actions">
              <button type="button" className="pp-btn pp-btn-primary pp-btn-big" id="btn-log-focus" data-action="log-focus" onClick={() => openLog()}>
                {t("logFocus")}
              </button>
              <button type="button" className="pp-btn pp-btn-sm" id="btn-edit-task" onClick={openEdit}>
                {t("edit")}
              </button>
              <button type="button" className="pp-btn pp-btn-sm pp-btn-danger" id="btn-delete-task" data-action="delete-task" onClick={() => setConfirm({ kind: "deleteTask", id: active.id })}>
                {t("deleteTask")}
              </button>
            </div>
            <div className="pp-quick" id="quick-add">
              <span>{t("quickAdd")}</span>
              {QUICK_MINUTES.map((m) => (
                <button key={m} type="button" className="pp-btn pp-btn-sm pp-btn-leaf" data-quick={m} onClick={() => openLog(m)}>
                  +{t("minutesN", { n: m })}
                </button>
              ))}
            </div>
          </section>

          {/* optional timer */}
          <section className="pp-timer" id="timer" aria-label={t("timerTitle")}>
            <h2>{t("timerTitle")}</h2>
            <p className="pp-hint">{t("timerHint")}</p>
            <div className="pp-timer-row">
              {timer ? (
                <>
                  <span className="pp-timer-clock" id="timer-clock">
                    {fmtHM(timerMinutes)}
                  </span>
                  <span className="pp-hint" id="timer-status">
                    {timerTask ? `${timerTask.title} · ` : ""}
                    {t("timerRunning", { time: formatTime(timer.startedAt, locale), n: fmt(timerMinutes) })}
                  </span>
                  <button type="button" className="pp-btn pp-btn-sky" id="btn-timer-stop" onClick={stopTimer}>
                    {t("timerStop")}
                  </button>
                </>
              ) : (
                <button type="button" className="pp-btn pp-btn-sky" id="btn-timer-start" onClick={startTimer}>
                  {t("timerStart")}
                </button>
              )}
            </div>
          </section>

          {/* tabs */}
          <nav className="pp-tabs" aria-label="tabs">
            {(["history", "backup"] as Tab[]).map((k) => (
              <button key={k} type="button" className={"pp-tab" + (tab === k ? " is-on" : "")} id={`tab-${k}`} onClick={() => setTab(k)} aria-pressed={tab === k}>
                {t(k === "history" ? "tabHistory" : "tabBackup")}
              </button>
            ))}
          </nav>

          {tab === "history" && (
            <section className="pp-card" id="history">
              <div className="pp-card-head">
                <h2>{t("historyTitle")}</h2>
                <span className="pp-badge is-leaf" id="history-total">{fmtHM(progress.totalMinutes)}</span>
              </div>
              <p className="pp-hint">{t("historyHint")}</p>
              {active.logs.length === 0 ? (
                <div className="pp-empty">
                  <p className="pp-hint">{t("noHistory")}</p>
                </div>
              ) : (
                <ul className="pp-list" id="history-list">
                  {active.logs.map((log) => (
                    <li key={log.id} className="pp-entry" data-log={log.id} data-date={log.date}>
                      <div className="pp-entry-main">
                        <b>{formatDate(log.date, locale, "long")}</b>
                        {log.note && <span>{log.note}</span>}
                      </div>
                      <span className="pp-entry-min">{t("minutesN", { n: fmt(log.minutes) })}</span>
                      <button type="button" className="pp-btn pp-btn-sm" data-action="edit-log" onClick={() => openEditLog(log.id)}>
                        {t("editLog")}
                      </button>
                      <button type="button" className="pp-btn pp-btn-sm pp-btn-danger" data-action="delete-log" onClick={() => setConfirm({ kind: "deleteLog", logId: log.id })}>
                        {t("deleteLog")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "backup" && (
            <section className="pp-card" id="backup">
              <h2>{t("backupTitle")}</h2>
              <p className="pp-hint">{t("backupHint")}</p>
              <div className="pp-actions" style={{ justifyContent: "flex-start" }}>
                <button type="button" className="pp-btn pp-btn-primary" id="btn-export" onClick={exportJson}>
                  {t("exportJson")}
                </button>
                <button type="button" className="pp-btn" id="btn-import" onClick={() => fileRef.current?.click()}>
                  {t("importJson")}
                </button>
                <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => onImportFile(e.target.files?.[0])} />
                <button type="button" className="pp-btn pp-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>
                  {t("clearAll")}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {tasks.length === 0 && (
        <section className="pp-card" id="backup-empty">
          <h2>{t("backupTitle")}</h2>
          <p className="pp-hint">{t("backupHint")}</p>
          <div className="pp-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="pp-btn" id="btn-import-empty" onClick={() => fileRef.current?.click()}>
              {t("importJson")}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file-empty" onChange={(e) => onImportFile(e.target.files?.[0])} />
          </div>
        </section>
      )}

      <section className="pp-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="pp-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="pp-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="pp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/progresspad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* new / edit task */}
      <Dialog open={taskDraft !== null} onOpenChange={(o) => !o && setTaskDraft(null)}>
        <DialogContent id="task-dialog" showCloseButton={false}>
          <DialogTitle className="pp-dialog-title">{t(taskDraft?.mode === "edit" ? "editTaskTitle" : "newTaskTitle")}</DialogTitle>
          <DialogDescription className="pp-hint">{t("targetHint")}</DialogDescription>
          {taskDraft && (
            <>
              <label className="pp-field" htmlFor="task-title-input">
                {t("taskTitleLabel")}
                <input id="task-title-input" className="pp-input" type="text" maxLength={120} placeholder={t("taskTitlePlaceholder")} value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value, error: null })} />
              </label>
              <div className="pp-field">
                {t("targetModeLabel")}
                <div className="pp-seg" role="group" aria-label={t("targetModeLabel")} id="target-mode">
                  <button type="button" id="btn-mode-hours" className={taskDraft.targetMode === "hours" ? "is-on" : ""} aria-pressed={taskDraft.targetMode === "hours"} onClick={() => setTaskDraft({ ...taskDraft, targetMode: "hours", error: null })}>
                    {t("modeHours")}
                  </button>
                  <button type="button" id="btn-mode-percent" className={taskDraft.targetMode === "percent" ? "is-on" : ""} aria-pressed={taskDraft.targetMode === "percent"} onClick={() => setTaskDraft({ ...taskDraft, targetMode: "percent", error: null })}>
                    {t("modePercent")}
                  </button>
                </div>
              </div>
              {taskDraft.targetMode === "hours" ? (
                <label className="pp-field" htmlFor="task-hours-input">
                  {t("targetHoursLabel")}
                  <input id="task-hours-input" className="pp-input is-big" type="text" inputMode="decimal" placeholder={t("targetHoursPlaceholder")} value={taskDraft.hours} onChange={(e) => setTaskDraft({ ...taskDraft, hours: e.target.value, error: null })} onKeyDown={(e) => e.key === "Enter" && saveTask()} />
                </label>
              ) : (
                <div className="pp-grid">
                  <label className="pp-field" htmlFor="task-percent-input">
                    {t("targetPercentLabel")}
                    <input id="task-percent-input" className="pp-input is-big" type="text" inputMode="numeric" placeholder={t("targetPercentPlaceholder")} value={taskDraft.percent} onChange={(e) => setTaskDraft({ ...taskDraft, percent: e.target.value, error: null })} onKeyDown={(e) => e.key === "Enter" && saveTask()} />
                  </label>
                  <label className="pp-field" htmlFor="task-mpp-input">
                    {t("minutesPerPercentLabel")}
                    <input id="task-mpp-input" className="pp-input" type="text" inputMode="numeric" value={taskDraft.minutesPerPercent} onChange={(e) => setTaskDraft({ ...taskDraft, minutesPerPercent: e.target.value, error: null })} />
                    <span className="pp-hint">{t("minutesPerPercentHint")}</span>
                  </label>
                </div>
              )}
              {taskDraft.error && <p className="pp-error">{t(taskDraft.error)}</p>}
              <div className="pp-actions">
                <button type="button" className="pp-btn pp-btn-quiet" onClick={() => setTaskDraft(null)}>
                  {t("cancel")}
                </button>
                <button type="button" className="pp-btn pp-btn-primary" id="task-save" onClick={saveTask}>
                  {t(taskDraft.mode === "new" ? "create" : "save")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* log focus (new or edit) */}
      <Dialog open={logDraft !== null} onOpenChange={(o) => !o && setLogDraft(null)}>
        <DialogContent id="log-dialog" showCloseButton={false}>
          <DialogTitle className="pp-dialog-title">{t(logDraft?.logId ? "editLogTitle" : "logTitle")}</DialogTitle>
          <DialogDescription className="pp-hint">{t("logHint")}</DialogDescription>
          {logDraft && (
            <>
              <label className="pp-field" htmlFor="log-minutes">
                {t("minutesLabel")}
                <input id="log-minutes" className="pp-input is-big" type="text" inputMode="numeric" placeholder={t("minutesPlaceholder")} value={logDraft.minutes} onChange={(e) => setLogDraft({ ...logDraft, minutes: e.target.value, error: null })} onKeyDown={(e) => e.key === "Enter" && saveLog()} />
              </label>
              <div className="pp-quick">
                {QUICK_MINUTES.map((m) => (
                  <button key={m} type="button" className="pp-btn pp-btn-sm pp-btn-leaf" data-quick-dialog={m} onClick={() => setLogDraft({ ...logDraft, minutes: String(m), error: null })}>
                    {t("minutesN", { n: m })}
                  </button>
                ))}
              </div>
              <div className="pp-grid">
                <label className="pp-field" htmlFor="log-date">
                  {t("dateLabel")}
                  <input id="log-date" className="pp-input" type="date" value={logDraft.date} max={today} onChange={(e) => setLogDraft({ ...logDraft, date: e.target.value, error: null })} />
                </label>
                <label className="pp-field" htmlFor="log-note">
                  {t("noteLabel")}
                  <input id="log-note" className="pp-input" type="text" maxLength={200} placeholder={t("notePlaceholder")} value={logDraft.note} onChange={(e) => setLogDraft({ ...logDraft, note: e.target.value })} />
                </label>
              </div>
              {logDraft.error && <p className="pp-error">{t(logDraft.error)}</p>}
              <div className="pp-actions">
                <button type="button" className="pp-btn pp-btn-quiet" onClick={() => setLogDraft(null)}>
                  {t("cancel")}
                </button>
                <button type="button" className="pp-btn pp-btn-primary" id="log-save" onClick={saveLog}>
                  {t("save")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirmCopy.title}
        body={confirmCopy.body}
        confirmLabel={confirmCopy.label}
        cancelLabel={confirm?.kind === "timerSave" ? t("timerDiscard") : t("cancel")}
        destructive={confirmCopy.destructive}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else if (confirm.kind === "clearAll") applyClearAll();
          else if (confirm.kind === "deleteTask") deleteTask(confirm.id);
          else if (confirm.kind === "deleteLog") deleteLog(confirm.logId);
          else saveTimerMinutes(confirm.minutes);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
