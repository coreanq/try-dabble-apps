import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { detectLang, HTML_LANG, isLang, LOCALE, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  backupFilename,
  buildBackup,
  checkIn,
  checkOut,
  clampBank,
  clampTarget,
  clearAll,
  dayTotals,
  download,
  loadActive,
  loadPrefs,
  loadSessions,
  loadWeeks,
  MAX_SESSION_MS,
  newId,
  parseBackup,
  saveActive,
  savePrefs,
  saveSessions,
  saveWeeks,
  settleWeeks,
  startBreak,
  surplusHours,
  toJSON,
  weekRows,
  weekTotals,
  type ActiveSession,
  type Backup,
  type Kind,
  type Prefs,
  type Session,
  type WeekMeta,
} from "@/lib/store";
import {
  combineDateTime,
  elapsedMs,
  formatClock,
  formatDate,
  formatHM,
  formatHours,
  formatTime,
  formatWeekRange,
  hoursToMs,
  isDateKey,
  msToHours,
  parseHours,
  toDateKey,
  weekKeyOf,
} from "@/lib/time";
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

const CHIP_KEYS: MsgKey[] = ["chipNoAds", "chipNoAccount", "chipBreaksFree", "chipBankFree", "chipBackup", "chipHonest", "chipFree", "chipLocal", "chipLangs"];
const TOAST_MS = 2400;
type Tab = "day" | "weeks" | "backup";

/**
 * Wall-clock "now" that re-renders once a second while a session is open and
 * is forced fresh whenever the tab comes back (visibilitychange / focus /
 * pageshow). The displayed elapsed time is always Date.now() - startedAt, so
 * a throttled or suspended tab never under-counts.
 */
function useNow(live: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const bump = () => setNow(Date.now());
    bump();
    let id: number | undefined;
    if (live) id = window.setInterval(bump, 1000);
    document.addEventListener("visibilitychange", bump);
    window.addEventListener("focus", bump);
    window.addEventListener("pageshow", bump);
    return () => {
      if (id !== undefined) window.clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
      window.removeEventListener("focus", bump);
      window.removeEventListener("pageshow", bump);
    };
  }, [live]);
  return now;
}

interface EntryDraft {
  date: string;
  kind: Kind;
  start: string;
  end: string;
  label: string;
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const locale = LOCALE[lang];

  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [active, setActive] = useState<ActiveSession | null>(() => loadActive());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [weeks, setWeeks] = useState<WeekMeta[]>(() => loadWeeks());
  const [label, setLabel] = useState(() => loadActive()?.label ?? "");
  const [tab, setTab] = useState<Tab>("day");
  const [day, setDay] = useState(() => toDateKey(new Date()));
  const [entry, setEntry] = useState<EntryDraft | null>(null);
  const [entryError, setEntryError] = useState<MsgKey | null>(null);
  const [hoursDialog, setHoursDialog] = useState<null | { kind: "bank" | "target"; value: string; error: boolean }>(null);
  const [confirm, setConfirm] = useState<null | { kind: "import"; parsed: Backup } | { kind: "clearAll" } | { kind: "deleteEntry"; id: string }>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const now = useNow(active !== null);
  const today = toDateKey(new Date(now));
  const currentWeek = weekKeyOf(today, prefs.weekStartsOn);

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

  useEffect(() => saveSessions(sessions), [sessions]);
  useEffect(() => saveActive(active), [active]);
  useEffect(() => savePrefs(prefs), [prefs]);
  useEffect(() => saveWeeks(weeks), [weeks]);

  /* Roll finished weeks into the bank once. Runs on mount, when the calendar
     week advances while the tab is open, and after an import. Idempotent. */
  useEffect(() => {
    const result = settleWeeks(sessions, prefs, weeks, now);
    if (result.settled.length === 0) return;
    setPrefs(result.prefs);
    setWeeks(result.weeks);
    const last = result.settled[result.settled.length - 1];
    showToast(t("settledToast", { week: formatDate(last.weekKey, locale), delta: formatHours(last.surplusHours, { sign: true }) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, currentWeek]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  /* ---------- clock ---------- */
  const status: "idle" | "work" | "break" = active ? active.kind : "idle";
  const elapsed = active ? elapsedMs(active.startedAt, now) : 0;

  const doCheckIn = () => {
    const next = checkIn({ sessions, active }, label, Date.now());
    setSessions(next.sessions);
    setActive(next.active);
  };
  const doBreak = () => {
    const next = startBreak({ sessions, active }, Date.now());
    setSessions(next.sessions);
    setActive(next.active);
  };
  const doCheckOut = () => {
    const next = checkOut({ sessions, active }, Date.now());
    setSessions(next.sessions);
    setActive(next.active);
  };
  const onLabelChange = (v: string) => {
    setLabel(v);
    if (active) {
      const trimmed = v.trim().slice(0, 120);
      setActive(trimmed ? { ...active, label: trimmed } : { kind: active.kind, startedAt: active.startedAt });
    }
  };

  /* ---------- totals ---------- */
  const todayT = useMemo(() => dayTotals(sessions, today, active, now), [sessions, today, active, now]);
  const weekT = useMemo(() => weekTotals(sessions, currentWeek, active, now, prefs.weekStartsOn), [sessions, currentWeek, active, now, prefs.weekStartsOn]);
  const targetMs = hoursToMs(prefs.weeklyTargetHours);
  const weekWorkH = msToHours(weekT.workMs);
  const surplus = surplusHours(weekWorkH, prefs.weeklyTargetHours);
  const over = weekT.workMs > targetMs;
  const remainingMs = Math.max(0, targetMs - weekT.workMs);
  const pct = targetMs > 0 ? Math.min(100, Math.round((weekT.workMs / targetMs) * 100)) : 100;
  const projectedBank = clampBank(prefs.bankHours + surplus);

  const dayList = useMemo(() => sessions.filter((s) => s.date === day).sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)), [sessions, day]);
  const dayT = useMemo(() => dayTotals(sessions, day, day === today ? active : null, now), [sessions, day, today, active, now]);
  const rows = useMemo(() => weekRows(sessions, weeks, prefs, now, active), [sessions, weeks, prefs, now, active]);

  /* ---------- hours dialog (bank / target) ---------- */
  const openHours = (kind: "bank" | "target") => {
    const v = kind === "bank" ? prefs.bankHours : prefs.weeklyTargetHours;
    setHoursDialog({ kind, value: String(v), error: false });
  };
  const saveHours = () => {
    if (!hoursDialog) return;
    const h = parseHours(hoursDialog.value);
    if (h === null) {
      setHoursDialog({ ...hoursDialog, error: true });
      return;
    }
    if (hoursDialog.kind === "bank") setPrefs((p) => ({ ...p, bankHours: clampBank(h) }));
    else setPrefs((p) => ({ ...p, weeklyTargetHours: clampTarget(h) }));
    setHoursDialog(null);
    showToast(t("savedToast"));
  };

  /* ---------- manual entry ---------- */
  const openEntry = () => {
    setEntryError(null);
    setEntry({ date: day, kind: "work", start: "09:00", end: "12:00", label: "" });
  };
  const saveEntry = () => {
    if (!entry) return;
    const startIso = combineDateTime(entry.date, entry.start);
    const endIso = combineDateTime(entry.date, entry.end);
    if (!startIso || !endIso || !isDateKey(entry.date)) {
      setEntryError("needTimes");
      return;
    }
    const dur = Date.parse(endIso) - Date.parse(startIso);
    if (dur < 0) {
      setEntryError("endBeforeStart");
      return;
    }
    const s: Session = { id: newId(entry.kind === "work" ? "w" : "b"), date: entry.date, kind: entry.kind, startedAt: startIso, endedAt: endIso, durationMs: Math.min(MAX_SESSION_MS, dur) };
    const l = entry.label.trim().slice(0, 120);
    if (l) s.label = l;
    setSessions((list) => [...list, s].sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)));
    setDay(entry.date);
    setEntry(null);
    showToast(t("savedToast"));
  };
  const deleteEntry = (id: string) => {
    setSessions((list) => list.filter((s) => s.id !== id));
    showToast(t("deletedToast"));
  };

  /* ---------- backup ---------- */
  const exportJson = () => {
    download(backupFilename(), toJSON(buildBackup(sessions, active, prefs, weeks)));
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
    setSessions(parsed.sessions);
    setActive(parsed.active);
    setPrefs(parsed.prefs);
    setWeeks(parsed.weeks);
    setLabel(parsed.active?.label ?? "");
    showToast(t("importOk", { n: parsed.sessions.length }));
  };
  const applyClearAll = () => {
    clearAll();
    setSessions([]);
    setActive(null);
    setWeeks([]);
    setPrefs((p) => ({ ...p, bankHours: 0 }));
    setLabel("");
    showToast(t("cleared"));
  };

  const kindLabel = (k: Kind) => t(k === "work" ? "kindWork" : "kindBreak");
  const signed = (h: number) => formatHours(h, { sign: true });

  return (
    <div className="hp-app" data-lang={lang}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      {/* punch clock */}
      <section className={`hp-clock is-${status}`} id="clock" aria-live="polite">
        <p className="hp-status" id="clock-status">
          <span className="hp-dot" aria-hidden="true" />
          {status === "idle" ? t("statusIdle") : status === "work" ? t("statusWorking") : t("statusBreak")}
          {active && <small>· {t("sinceAt", { time: formatTime(active.startedAt, locale) })}</small>}
        </p>
        <p className="hp-elapsed" id="clock-elapsed">{formatClock(elapsed)}</p>
        <label className="hp-field" htmlFor="session-label">
          {t("labelLabel")}
          <input id="session-label" className="hp-input" type="text" maxLength={120} placeholder={t("labelPlaceholder")} value={label} onChange={(e) => onLabelChange(e.target.value)} />
        </label>
        <div className="hp-clock-actions">
          {status === "idle" && (
            <button type="button" className="hp-btn hp-btn-primary is-wide" id="btn-check-in" data-action="check-in" onClick={doCheckIn}>
              {t("checkIn")}
            </button>
          )}
          {status === "work" && (
            <>
              <button type="button" className="hp-btn hp-btn-amber" id="btn-break" data-action="break" onClick={doBreak}>
                {t("startBreak")}
              </button>
              <button type="button" className="hp-btn hp-btn-quiet" id="btn-check-out" data-action="check-out" onClick={doCheckOut}>
                {t("checkOut")}
              </button>
            </>
          )}
          {status === "break" && (
            <>
              <button type="button" className="hp-btn hp-btn-primary" id="btn-resume" data-action="resume" onClick={doCheckIn}>
                {t("resumeWork")}
              </button>
              <button type="button" className="hp-btn hp-btn-quiet" id="btn-check-out" data-action="check-out" onClick={doCheckOut}>
                {t("checkOut")}
              </button>
            </>
          )}
        </div>
        {status === "idle" && <p className="hp-hint">{t("idleHint")}</p>}
      </section>

      {/* today + week */}
      <section className="hp-summary" id="totals" aria-label={t("todayTitle")}>
        <div className="hp-stat" id="today-work">
          <p className="hp-stat-label">{t("todayTitle")} · {t("workLabel")}</p>
          <p className="hp-stat-value is-indigo">{formatHM(todayT.workMs)}</p>
          <p className="hp-stat-sub">{t("sessionsN", { n: todayT.sessions })}</p>
        </div>
        <div className="hp-stat is-amber" id="today-break">
          <p className="hp-stat-label">{t("todayTitle")} · {t("breakLabel")}</p>
          <p className="hp-stat-value is-amber">{formatHM(todayT.breakMs)}</p>
          <p className="hp-stat-sub">{formatDate(today, locale, "long")}</p>
        </div>
      </section>

      <section className="hp-card" id="week" aria-label={t("weekTitle")}>
        <div className="hp-card-head">
          <h2>{t("weekTitle")}</h2>
          <span className="hp-hint">{formatWeekRange(currentWeek, locale)}</span>
        </div>
        <dl className="hp-kv">
          <dt>{t("weekWork")}</dt>
          <dd id="week-work">{formatHM(weekT.workMs)}</dd>
          <dt>{t("breakLabel")}</dt>
          <dd id="week-break">{formatHM(weekT.breakMs)}</dd>
          <dt>{t("targetLabel")}</dt>
          <dd id="week-target">{formatHours(prefs.weeklyTargetHours)}</dd>
          <dt>{over ? t("overLabel") : t("remainingLabel")}</dt>
          <dd id="week-delta" className={over ? "text-teal-deep" : ""}>{over ? formatHM(weekT.workMs - targetMs, { sign: true }) : formatHM(remainingMs)}</dd>
        </dl>
        <div className={`hp-bar${over ? " is-over" : ""}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="hp-actions">
          <button type="button" className="hp-btn hp-btn-sm" id="btn-edit-target" onClick={() => openHours("target")}>
            {t("editTarget")}
          </button>
        </div>
      </section>

      <section className="hp-card is-teal" id="bank" aria-label={t("bankTitle")}>
        <div className="hp-card-head">
          <h2>{t("bankTitle")}</h2>
        </div>
        <div className="hp-bank">
          <div>
            <p className="hp-stat-label">{t("bankLabel")}</p>
            <p className={`hp-bank-value${prefs.bankHours < 0 ? " is-neg" : ""}`} id="bank-balance">{signed(prefs.bankHours) || "0m"}</p>
          </div>
          <button type="button" className="hp-btn hp-btn-teal hp-btn-sm" id="btn-edit-bank" onClick={() => openHours("bank")}>
            {t("editBank")}
          </button>
        </div>
        <dl className="hp-kv">
          <dt>{t("bankProjected")}</dt>
          <dd id="bank-projected">{signed(projectedBank) || "0m"}</dd>
        </dl>
        <p className="hp-hint" id="bank-hint">{t("bankHint", { next: signed(projectedBank) || "0m" })}</p>
        <p className="hp-hint" id="bank-rule">{t("bankRule")}</p>
      </section>

      {/* tabs */}
      <nav className="hp-tabs" aria-label="tabs">
        {(["day", "weeks", "backup"] as Tab[]).map((k) => (
          <button key={k} type="button" className={"hp-tab" + (tab === k ? " is-on" : "")} id={`tab-${k}`} onClick={() => setTab(k)} aria-pressed={tab === k}>
            {t(k === "day" ? "tabDay" : k === "weeks" ? "tabWeeks" : "tabBackup")}
          </button>
        ))}
      </nav>

      {tab === "day" && (
        <section className="hp-card" id="day-history">
          <div className="hp-card-head">
            <h2>{t("dayTitle")}</h2>
            <label className="hp-field" htmlFor="day-pick">
              <span className="sr-only">{t("pickDay")}</span>
              <input id="day-pick" className="hp-input" type="date" value={day} max={today} onChange={(e) => isDateKey(e.target.value) && setDay(e.target.value)} />
            </label>
          </div>
          <dl className="hp-kv">
            <dt>{t("workLabel")}</dt>
            <dd>{formatHM(dayT.workMs)}</dd>
            <dt>{t("breakLabel")}</dt>
            <dd>{formatHM(dayT.breakMs)}</dd>
          </dl>
          {dayList.length === 0 && !(active && day === today) ? (
            <div className="hp-empty">
              <p className="hp-hint">{t("noSessions")}</p>
            </div>
          ) : (
            <ul className="hp-list" id="session-list">
              {dayList.map((s) => (
                <li key={s.id} className={`hp-session is-${s.kind}`} data-kind={s.kind}>
                  <span className="hp-session-bar" aria-hidden="true" />
                  <div className="hp-session-main">
                    <b>{s.label ? `${kindLabel(s.kind)} · ${s.label}` : kindLabel(s.kind)}</b>
                    <span>
                      {formatTime(s.startedAt, locale)} – {formatTime(s.endedAt, locale)}
                    </span>
                  </div>
                  <div className="hp-session-side">
                    <p className="hp-dur">{formatHM(s.durationMs)}</p>
                    <button type="button" className="hp-btn hp-btn-sm" data-action="delete" onClick={() => setConfirm({ kind: "deleteEntry", id: s.id })}>
                      {t("deleteEntry")}
                    </button>
                  </div>
                </li>
              ))}
              {active && day === today && (
                <li className={`hp-session is-${active.kind}`} data-kind={active.kind} data-live="1">
                  <span className="hp-session-bar" aria-hidden="true" />
                  <div className="hp-session-main">
                    <b>{active.label ? `${kindLabel(active.kind)} · ${active.label}` : kindLabel(active.kind)}</b>
                    <span>{formatTime(active.startedAt, locale)} – …</span>
                  </div>
                  <div className="hp-session-side">
                    <p className="hp-dur">{formatHM(elapsed)}</p>
                  </div>
                </li>
              )}
            </ul>
          )}
          <div className="hp-actions">
            <button type="button" className="hp-btn hp-btn-sm" id="btn-add-entry" onClick={openEntry}>
              {t("addEntry")}
            </button>
          </div>
        </section>
      )}

      {tab === "weeks" && (
        <section className="hp-card" id="week-history">
          <h2>{t("weeksTitle")}</h2>
          <p className="hp-hint">{t("weeksHint")}</p>
          <ul className="hp-list" id="week-list">
            {rows.map((r) => (
              <li key={r.weekKey} className={`hp-week${r.current ? " is-current" : ""}`} data-week={r.weekKey}>
                <div className="hp-week-head">
                  <b>{r.current ? t("thisWeek") : formatWeekRange(r.weekKey, locale)}</b>
                  <span className={`hp-badge${r.settled ? "" : " is-pending"}`}>{r.settled ? t("settled") : t("pending")}</span>
                </div>
                <p className={`hp-delta${r.surplusHours < 0 ? " is-neg" : ""}`}>
                  {t("bankDelta")} {signed(r.surplusHours) || "0m"}
                </p>
                <div className="hp-week-meta">
                  {r.current && <span>{formatWeekRange(r.weekKey, locale)}</span>}
                  <span>
                    {t("workLabel")} <b>{formatHM(r.workMs)}</b>
                  </span>
                  <span>
                    {t("breakLabel")} <b>{formatHM(r.breakMs)}</b>
                  </span>
                  <span>
                    {t("targetLabel")} <b>{formatHours(r.targetHours)}</b>
                  </span>
                  {r.settled && (
                    <span>
                      {t("bankLabel")} <b>{signed(r.settled.bankIn) || "0m"} → {signed(r.settled.bankOut) || "0m"}</b>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "backup" && (
        <section className="hp-card" id="backup">
          <h2>{t("backupTitle")}</h2>
          <p className="hp-hint">{t("backupHint")}</p>
          <div className="hp-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="hp-btn hp-btn-primary" id="btn-export" onClick={exportJson}>
              {t("exportJson")}
            </button>
            <button type="button" className="hp-btn" id="btn-import" onClick={() => fileRef.current?.click()}>
              {t("importJson")}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => onImportFile(e.target.files?.[0])} />
            <button type="button" className="hp-btn hp-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>
              {t("clearAll")}
            </button>
          </div>
        </section>
      )}

      <section className="hp-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="hp-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="hp-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="hp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/hourpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* bank / target editor */}
      <Dialog open={hoursDialog !== null} onOpenChange={(o) => !o && setHoursDialog(null)}>
        <DialogContent id="hours-dialog" showCloseButton={false}>
          <DialogTitle className="hp-sheet-title">{t(hoursDialog?.kind === "bank" ? "bankDialogTitle" : "targetDialogTitle")}</DialogTitle>
          <DialogDescription className="hp-hint">{t(hoursDialog?.kind === "bank" ? "bankDialogBody" : "targetDialogBody")}</DialogDescription>
          <label className="hp-field" htmlFor="hours-input">
            {t("hoursUnit")}
            <input id="hours-input" className="hp-input" type="text" inputMode="decimal" value={hoursDialog?.value ?? ""} onChange={(e) => hoursDialog && setHoursDialog({ ...hoursDialog, value: e.target.value, error: false })} onKeyDown={(e) => e.key === "Enter" && saveHours()} />
          </label>
          {hoursDialog?.error && <p className="hp-error">{t("needHours")}</p>}
          <div className="hp-actions">
            <button type="button" className="hp-btn hp-btn-quiet" onClick={() => setHoursDialog(null)}>
              {t("cancel")}
            </button>
            <button type="button" className="hp-btn hp-btn-primary" id="hours-save" onClick={saveHours}>
              {t("save")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* manual entry */}
      <Dialog open={entry !== null} onOpenChange={(o) => !o && setEntry(null)}>
        <DialogContent id="entry-dialog" showCloseButton={false}>
          <DialogTitle className="hp-sheet-title">{t("entryTitle")}</DialogTitle>
          <DialogDescription className="hp-hint">{t("entryHint")}</DialogDescription>
          {entry && (
            <>
              <div className="hp-grid">
                <label className="hp-field" htmlFor="entry-date">
                  {t("fieldDate")}
                  <input id="entry-date" className="hp-input" type="date" value={entry.date} max={today} onChange={(e) => setEntry({ ...entry, date: e.target.value })} />
                </label>
                <label className="hp-field" htmlFor="entry-kind">
                  {t("fieldKind")}
                  <select id="entry-kind" className="hp-select-block" value={entry.kind} onChange={(e) => setEntry({ ...entry, kind: e.target.value === "break" ? "break" : "work" })}>
                    <option value="work">{t("kindWork")}</option>
                    <option value="break">{t("kindBreak")}</option>
                  </select>
                </label>
                <label className="hp-field" htmlFor="entry-start">
                  {t("fieldStart")}
                  <input id="entry-start" className="hp-input" type="time" value={entry.start} onChange={(e) => setEntry({ ...entry, start: e.target.value })} />
                </label>
                <label className="hp-field" htmlFor="entry-end">
                  {t("fieldEnd")}
                  <input id="entry-end" className="hp-input" type="time" value={entry.end} onChange={(e) => setEntry({ ...entry, end: e.target.value })} />
                </label>
              </div>
              <label className="hp-field" htmlFor="entry-label">
                {t("fieldLabel")}
                <input id="entry-label" className="hp-input" type="text" maxLength={120} value={entry.label} onChange={(e) => setEntry({ ...entry, label: e.target.value })} />
              </label>
              {entryError && <p className="hp-error">{t(entryError)}</p>}
              <div className="hp-actions">
                <button type="button" className="hp-btn hp-btn-quiet" onClick={() => setEntry(null)}>
                  {t("cancel")}
                </button>
                <button type="button" className="hp-btn hp-btn-primary" id="entry-save" onClick={saveEntry}>
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
        title={confirm?.kind === "import" ? t("importConfirmTitle") : confirm?.kind === "clearAll" ? t("clearAllTitle") : t("deleteEntryTitle")}
        body={confirm?.kind === "import" ? t("importConfirmBody", { n: confirm.parsed.sessions.length }) : confirm?.kind === "clearAll" ? t("clearAllBody") : t("deleteEntryBody")}
        confirmLabel={confirm?.kind === "import" ? t("importJson") : confirm?.kind === "clearAll" ? t("clearAll") : t("deleteEntry")}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else if (confirm.kind === "clearAll") applyClearAll();
          else deleteEntry(confirm.id);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
