import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { addMonths, formatDate, formatInt, isDateKey, isWeekend, monthGrid, monthKeyOf, parseWords, toDateKey, weekdayLabels } from "@/lib/dates";
import { detectLang, HTML_LANG, isLang, LOCALE, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  backupFilename,
  buildBackup,
  clearAll,
  computePace,
  createEssay,
  download,
  historyRows,
  loadEssays,
  loadPrefs,
  parseBackup,
  recordWords,
  removeHistoryEntry,
  saveEssays,
  savePrefs,
  toJSON,
  updateEssay,
  type Backup,
  type Essay,
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

const CHIP_KEYS: MsgKey[] = ["chipAndroid", "chipNoLogin", "chipNoAds", "chipNoSub", "chipLocal", "chipBackup", "chipWeekend", "chipBackdate", "chipFree", "chipLangs"];
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

interface EssayDraft {
  mode: "new" | "edit";
  title: string;
  target: string;
  deadline: string;
  error: MsgKey | null;
}

interface UpdateDraft {
  total: string;
  date: string;
  note: string;
  error: MsgKey | null;
}

type Confirm = { kind: "import"; parsed: Backup } | { kind: "clearAll" } | { kind: "deleteEssay"; id: string } | { kind: "deleteEntry"; date: string };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const locale = LOCALE[lang];
  const fmt = useCallback((n: number) => formatInt(n, locale), [locale]);

  const [essays, setEssays] = useState<Essay[]>(() => loadEssays());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [tab, setTab] = useState<Tab>("history");
  const today = useToday();
  const [month, setMonth] = useState(() => monthKeyOf(toDateKey(new Date())));
  const [essayDraft, setEssayDraft] = useState<EssayDraft | null>(null);
  const [updateDraft, setUpdateDraft] = useState<UpdateDraft | null>(null);
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

  useEffect(() => saveEssays(essays), [essays]);
  useEffect(() => savePrefs(prefs), [prefs]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  /* ---------- active essay ---------- */
  const active = useMemo(() => essays.find((e) => e.id === prefs.activeEssayId) ?? essays[0] ?? null, [essays, prefs.activeEssayId]);
  const pace = useMemo(() => (active ? computePace(active, today, prefs.weekdaysOnly) : null), [active, today, prefs.weekdaysOnly]);
  const rows = useMemo(() => (active ? historyRows(active) : []), [active]);
  const rowsByDate = useMemo(() => new Map(rows.map((r) => [r.date, r])), [rows]);
  const grid = useMemo(() => monthGrid(month), [month]);
  const dows = useMemo(() => weekdayLabels(locale), [locale]);

  const selectEssay = (id: string) => setPrefs((p) => ({ ...p, activeEssayId: id }));
  const patchActive = (fn: (e: Essay) => Essay) => {
    if (!active) return;
    setEssays((list) => list.map((e) => (e.id === active.id ? fn(e) : e)));
  };

  /* ---------- essay dialog ---------- */
  const openNew = () => setEssayDraft({ mode: "new", title: "", target: "", deadline: "", error: null });
  const openEdit = () => {
    if (!active) return;
    setEssayDraft({ mode: "edit", title: active.title, target: String(active.targetWords), deadline: active.deadline ?? "", error: null });
  };
  const saveEssay = () => {
    if (!essayDraft) return;
    const title = essayDraft.title.trim();
    if (!title) return setEssayDraft({ ...essayDraft, error: "needTitle" });
    const target = parseWords(essayDraft.target);
    if (target === null || target < 1) return setEssayDraft({ ...essayDraft, error: "needTarget" });
    const deadline = isDateKey(essayDraft.deadline) ? essayDraft.deadline : null;
    if (essayDraft.mode === "new") {
      const e = createEssay(title, target, deadline);
      setEssays((list) => [...list, e]);
      setPrefs((p) => ({ ...p, activeEssayId: e.id }));
      showToast(t("essayCreated"));
    } else if (active) {
      setEssays((list) => updateEssay(list, active.id, { title, targetWords: target, deadline }));
      showToast(t("savedToast"));
    }
    setEssayDraft(null);
  };
  const deleteEssay = (id: string) => {
    setEssays((list) => list.filter((e) => e.id !== id));
    setPrefs((p) => (p.activeEssayId === id ? { ...p, activeEssayId: null } : p));
    showToast(t("essayDeleted"));
  };

  /* ---------- update words ---------- */
  const openUpdate = () => {
    if (!active) return;
    setUpdateDraft({ total: String(active.currentWords), date: today, note: "", error: null });
  };
  const saveUpdate = () => {
    if (!updateDraft || !active) return;
    const total = parseWords(updateDraft.total);
    if (total === null) return setUpdateDraft({ ...updateDraft, error: "needWords" });
    const date = isDateKey(updateDraft.date) && updateDraft.date <= today ? updateDraft.date : today;
    patchActive((e) => recordWords(e, total, date, updateDraft.note));
    setMonth(monthKeyOf(date));
    setUpdateDraft(null);
    showToast(t("savedToast"));
  };
  const deleteEntry = (date: string) => {
    patchActive((e) => removeHistoryEntry(e, date));
    showToast(t("deletedToast"));
  };

  /* ---------- backup ---------- */
  const exportJson = () => {
    download(backupFilename(), toJSON(buildBackup(essays, prefs)));
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
    setEssays(parsed.essays);
    setPrefs({ ...parsed.prefs, activeEssayId: parsed.prefs.activeEssayId ?? parsed.essays[0]?.id ?? null });
    showToast(t("importOk", { n: parsed.essays.length }));
  };
  const applyClearAll = () => {
    clearAll();
    setEssays([]);
    setPrefs((p) => ({ ...p, activeEssayId: null }));
    showToast(t("cleared"));
  };

  const confirmTitle = confirm?.kind === "import" ? t("importConfirmTitle") : confirm?.kind === "clearAll" ? t("clearAllTitle") : confirm?.kind === "deleteEssay" ? t("deleteEssayTitle") : t("deleteEntryTitle");
  const confirmBody = confirm?.kind === "import" ? t("importConfirmBody", { n: confirm.parsed.essays.length }) : confirm?.kind === "clearAll" ? t("clearAllBody") : confirm?.kind === "deleteEssay" ? t("deleteEssayBody") : t("deleteEntryBody");
  const confirmLabel = confirm?.kind === "import" ? t("importJson") : confirm?.kind === "clearAll" ? t("clearAll") : confirm?.kind === "deleteEssay" ? t("deleteEssay") : t("deleteEntry");

  const sheetState = pace ? (pace.overLimit ? " is-over" : pace.done ? " is-done" : "") : "";
  const pct = pace ? Math.round(pace.percent) : 0;

  return (
    <div className="ep-app" data-lang={lang}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <section className="ep-how" id="how">
        <b>{t("howTitle")}</b>
        <p className="ep-hint">{t("howBody")}</p>
      </section>

      {/* essays row */}
      <section id="essays" aria-label={t("essaysTitle")}>
        <ul className="ep-essays" id="essay-list">
          {essays.map((e) => (
            <li key={e.id}>
              <button type="button" className={"ep-essay-tab" + (active?.id === e.id ? " is-on" : "")} data-essay={e.id} aria-pressed={active?.id === e.id} onClick={() => selectEssay(e.id)}>
                {e.title}
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="ep-essay-tab is-new" id="btn-new-essay" onClick={openNew}>
              + {t("newEssay")}
            </button>
          </li>
        </ul>
      </section>

      {!active || !pace ? (
        <section className="ep-empty" id="empty">
          <b>{t("noEssays")}</b>
          <p className="ep-hint">{t("noEssaysHint")}</p>
          <div className="ep-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="ep-btn ep-btn-primary" id="btn-first-essay" onClick={openNew}>
              {t("newEssay")}
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* the manuscript sheet */}
          <section className={`ep-sheet${sheetState}`} id="essay-card" aria-live="polite">
            <h2 className="ep-sheet-title" id="essay-title">{active.title}</h2>
            <div className="ep-meta">
              <span id="essay-target">{t("targetLabel")} {fmt(active.targetWords)}</span>
              {active.deadline && (
                <span className="is-amber" id="essay-deadline">
                  {t("deadlineOn", { date: formatDate(active.deadline, locale, "long") })}
                </span>
              )}
            </div>
            <div className="ep-count">
              <p className="ep-count-big" id="current-words">{fmt(active.currentWords)}</p>
              <span className="ep-count-of">{t("ofTarget", { n: fmt(active.targetWords) })}</span>
            </div>
            <div className={`ep-bar${pace.overLimit ? " is-over" : pace.done ? " is-done" : ""}`} id="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, pct)}>
              <span style={{ width: `${pace.barPercent}%` }} />
            </div>
            <div className="ep-bar-row">
              <span id="progress-pct">{t("percentDone", { pct: fmt(pct) })}</span>
              <span id="remaining" className={pace.done ? "is-sage" : ""}>{pace.done ? t("doneLabel") : t("remainingN", { n: fmt(pace.remaining) })}</span>
            </div>
            {pace.overLimit && (
              <p className="ep-warn" id="over-limit" role="alert">
                {t("overLimitWarn", { current: fmt(active.currentWords), target: fmt(active.targetWords) })}
              </p>
            )}
            <div className="ep-sheet-actions">
              <button type="button" className="ep-btn ep-btn-primary ep-btn-big" id="btn-update-words" data-action="update-words" onClick={openUpdate}>
                {t("updateWords")}
              </button>
              <button type="button" className="ep-btn ep-btn-sm" id="btn-edit-essay" onClick={openEdit}>
                {t("edit")}
              </button>
              <button type="button" className="ep-btn ep-btn-sm ep-btn-danger" id="btn-delete-essay" data-action="delete-essay" onClick={() => setConfirm({ kind: "deleteEssay", id: active.id })}>
                {t("deleteEssay")}
              </button>
            </div>
          </section>

          {/* daily pace */}
          <section className="ep-card" id="pace" aria-label={t("paceTitle")}>
            <div className="ep-card-head">
              <h2>{t("paceTitle")}</h2>
              <div className="ep-seg" role="group" aria-label={t("writeDaysLabel")} id="write-days">
                <button type="button" id="btn-all-days" className={prefs.weekdaysOnly ? "" : "is-on"} aria-pressed={!prefs.weekdaysOnly} onClick={() => setPrefs((p) => ({ ...p, weekdaysOnly: false }))}>
                  {t("allDays")}
                </button>
                <button type="button" id="btn-weekdays-only" className={prefs.weekdaysOnly ? "is-on" : ""} aria-pressed={prefs.weekdaysOnly} onClick={() => setPrefs((p) => ({ ...p, weekdaysOnly: true }))}>
                  {t("weekdaysOnly")}
                </button>
              </div>
            </div>
            <div className="ep-pace">
              {pace.status === "noDeadline" && (
                <p className="ep-hint" id="pace-msg">{t("noDeadlineMsg")}</p>
              )}
              {pace.status === "done" && (
                <>
                  <div className="ep-pace-big">
                    <p className="ep-pace-num is-sage" id="daily-target">0</p>
                    <span className="ep-pace-unit">{t("perDay")}</span>
                  </div>
                  <p className="ep-hint" id="pace-msg">{t("doneMsg")}</p>
                </>
              )}
              {pace.status === "overdue" && (
                <>
                  <div className="ep-pace-big">
                    <p className="ep-pace-num is-amber" id="daily-target">{fmt(pace.dailyTarget ?? 0)}</p>
                    <span className="ep-pace-unit">{t("perDay")}</span>
                  </div>
                  <p className="ep-warn" id="pace-msg" role="alert" style={{ background: "var(--ep-amber-soft)", borderColor: "#fde68a", color: "var(--ep-amber-ink)" }}>
                    {t("overdueMsg", { n: fmt(pace.overdueDays), remaining: fmt(pace.remaining) })} {t("catchUpMsg", { n: fmt(pace.remaining) })}
                  </p>
                </>
              )}
              {pace.status === "active" && (
                <>
                  <p className="ep-hint">{t("dailyTargetLabel")}</p>
                  <div className="ep-pace-big">
                    <p className="ep-pace-num" id="daily-target">{fmt(pace.dailyTarget ?? 0)}</p>
                    <span className="ep-pace-unit">{t("perDay")}</span>
                  </div>
                  <div className="ep-pace-meta">
                    <span id="days-left">{t("writeDaysLeftN", { n: fmt(pace.writeDaysLeft ?? 0) })}</span>
                    <span className="is-amber" id="calendar-days-left">{pace.calendarDaysLeft === 0 ? t("deadlineToday") : t("calendarDaysLeftN", { n: fmt(pace.calendarDaysLeft ?? 0) })}</span>
                  </div>
                  {pace.writeDaysLeft === 0 && <p className="ep-hint" id="pace-msg">{t("catchUpMsg", { n: fmt(pace.remaining) })}</p>}
                </>
              )}
              {prefs.weekdaysOnly && <p className="ep-hint" id="weekend-note">{t("weekendSkipped")}</p>}
            </div>
          </section>

          {/* tabs */}
          <nav className="ep-tabs" aria-label="tabs">
            {(["history", "backup"] as Tab[]).map((k) => (
              <button key={k} type="button" className={"ep-tab" + (tab === k ? " is-on" : "")} id={`tab-${k}`} onClick={() => setTab(k)} aria-pressed={tab === k}>
                {t(k === "history" ? "tabHistory" : "tabBackup")}
              </button>
            ))}
          </nav>

          {tab === "history" && (
            <section className="ep-card" id="history">
              <div className="ep-card-head">
                <h2>{t("historyTitle")}</h2>
              </div>
              <p className="ep-hint">{t("historyHint")}</p>
              <div className="ep-cal-head">
                <button type="button" className="ep-btn ep-btn-sm" id="btn-prev-month" aria-label={t("prevMonth")} onClick={() => setMonth((m) => addMonths(m, -1))}>
                  ‹
                </button>
                <b id="calendar-month">{formatDate(month, locale, "month")}</b>
                <button type="button" className="ep-btn ep-btn-sm" id="btn-next-month" aria-label={t("nextMonth")} onClick={() => setMonth((m) => addMonths(m, 1))}>
                  ›
                </button>
              </div>
              <div className="ep-cal" id="calendar" role="grid">
                {dows.map((d, i) => (
                  <div key={i} className={"ep-cal-dow" + (i >= 5 ? " is-weekend" : "")} role="columnheader">
                    {d}
                  </div>
                ))}
                {grid.flat().map((key, i) => {
                  if (!key) return <div key={`x${i}`} className="ep-cal-cell is-empty" aria-hidden="true" />;
                  const row = rowsByDate.get(key);
                  const cls =
                    "ep-cal-cell" +
                    (row ? " has-entry" : "") +
                    (key === today ? " is-today" : "") +
                    (active.deadline === key ? " is-deadline" : "") +
                    (prefs.weekdaysOnly && isWeekend(key) ? " is-skip" : "");
                  return (
                    <div key={key} className={cls} role="gridcell" data-date={key} title={row ? `${fmt(row.words)} (${row.delta >= 0 ? "+" : ""}${fmt(row.delta)})` : undefined}>
                      <span>{Number(key.slice(8))}</span>
                      {row && <span className={"ep-cal-delta" + (row.delta < 0 ? " is-neg" : "")}>{row.delta >= 0 ? "+" : ""}{fmt(row.delta)}</span>}
                    </div>
                  );
                })}
              </div>
              {rows.length === 0 ? (
                <div className="ep-empty">
                  <p className="ep-hint">{t("noHistory")}</p>
                </div>
              ) : (
                <ul className="ep-list" id="history-list">
                  {[...rows].reverse().map((r) => (
                    <li key={r.date} className="ep-entry" data-date={r.date}>
                      <div className="ep-entry-main">
                        <b>{formatDate(r.date, locale, "long")}</b>
                        {r.note && <span>{r.note}</span>}
                      </div>
                      <div className="ep-entry-nums">
                        <b>{fmt(r.words)}</b>
                        <span className={r.delta < 0 ? "is-neg" : ""}>
                          {r.delta >= 0 ? "+" : ""}
                          {fmt(r.delta)}
                        </span>
                      </div>
                      <button type="button" className="ep-btn ep-btn-sm" data-action="delete-entry" onClick={() => setConfirm({ kind: "deleteEntry", date: r.date })}>
                        {t("deleteEntry")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "backup" && (
            <section className="ep-card" id="backup">
              <h2>{t("backupTitle")}</h2>
              <p className="ep-hint">{t("backupHint")}</p>
              <div className="ep-actions" style={{ justifyContent: "flex-start" }}>
                <button type="button" className="ep-btn ep-btn-primary" id="btn-export" onClick={exportJson}>
                  {t("exportJson")}
                </button>
                <button type="button" className="ep-btn" id="btn-import" onClick={() => fileRef.current?.click()}>
                  {t("importJson")}
                </button>
                <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => onImportFile(e.target.files?.[0])} />
                <button type="button" className="ep-btn ep-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>
                  {t("clearAll")}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {essays.length === 0 && (
        <section className="ep-card" id="backup-empty">
          <h2>{t("backupTitle")}</h2>
          <p className="ep-hint">{t("backupHint")}</p>
          <div className="ep-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="ep-btn" id="btn-import-empty" onClick={() => fileRef.current?.click()}>
              {t("importJson")}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file-empty" onChange={(e) => onImportFile(e.target.files?.[0])} />
          </div>
        </section>
      )}

      <section className="ep-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="ep-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="ep-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="ep-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/essaypad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* new / edit essay */}
      <Dialog open={essayDraft !== null} onOpenChange={(o) => !o && setEssayDraft(null)}>
        <DialogContent id="essay-dialog" showCloseButton={false}>
          <DialogTitle className="ep-dialog-title">{t(essayDraft?.mode === "edit" ? "editTitle" : "newTitle")}</DialogTitle>
          <DialogDescription className="ep-hint">{t("deadlineHint")}</DialogDescription>
          {essayDraft && (
            <>
              <label className="ep-field" htmlFor="essay-title-input">
                {t("essayTitleLabel")}
                <input id="essay-title-input" className="ep-input" type="text" maxLength={120} placeholder={t("essayTitlePlaceholder")} value={essayDraft.title} onChange={(e) => setEssayDraft({ ...essayDraft, title: e.target.value, error: null })} />
              </label>
              <label className="ep-field" htmlFor="essay-target-input">
                {t("targetLabel")}
                <input id="essay-target-input" className="ep-input" type="text" inputMode="numeric" placeholder={t("targetPlaceholder")} value={essayDraft.target} onChange={(e) => setEssayDraft({ ...essayDraft, target: e.target.value, error: null })} />
              </label>
              <label className="ep-field" htmlFor="essay-deadline-input">
                {t("deadlineLabel")}
                <div className="ep-row">
                  <input id="essay-deadline-input" className="ep-input" type="date" value={essayDraft.deadline} onChange={(e) => setEssayDraft({ ...essayDraft, deadline: e.target.value })} />
                  {essayDraft.deadline && (
                    <button type="button" className="ep-btn ep-btn-sm" id="btn-clear-deadline" onClick={() => setEssayDraft({ ...essayDraft, deadline: "" })}>
                      {t("clearDeadline")}
                    </button>
                  )}
                </div>
              </label>
              {essayDraft.error && <p className="ep-error">{t(essayDraft.error)}</p>}
              <div className="ep-actions">
                <button type="button" className="ep-btn ep-btn-quiet" onClick={() => setEssayDraft(null)}>
                  {t("cancel")}
                </button>
                <button type="button" className="ep-btn ep-btn-primary" id="essay-save" onClick={saveEssay}>
                  {t(essayDraft.mode === "new" ? "create" : "save")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* update words */}
      <Dialog open={updateDraft !== null} onOpenChange={(o) => !o && setUpdateDraft(null)}>
        <DialogContent id="update-dialog" showCloseButton={false}>
          <DialogTitle className="ep-dialog-title">{t("updateTitle")}</DialogTitle>
          <DialogDescription className="ep-hint">{t("updateHint")}</DialogDescription>
          {updateDraft && (
            <>
              <label className="ep-field" htmlFor="update-total">
                {t("newTotalLabel")}
                <input id="update-total" className="ep-input is-big" type="text" inputMode="numeric" value={updateDraft.total} onChange={(e) => setUpdateDraft({ ...updateDraft, total: e.target.value, error: null })} onKeyDown={(e) => e.key === "Enter" && saveUpdate()} />
              </label>
              <div className="ep-grid">
                <label className="ep-field" htmlFor="update-date">
                  {t("dateLabel")}
                  <input id="update-date" className="ep-input" type="date" value={updateDraft.date} max={today} onChange={(e) => setUpdateDraft({ ...updateDraft, date: e.target.value })} />
                </label>
                <label className="ep-field" htmlFor="update-note">
                  {t("noteLabel")}
                  <input id="update-note" className="ep-input" type="text" maxLength={200} placeholder={t("notePlaceholder")} value={updateDraft.note} onChange={(e) => setUpdateDraft({ ...updateDraft, note: e.target.value })} />
                </label>
              </div>
              {updateDraft.error && <p className="ep-error">{t(updateDraft.error)}</p>}
              <div className="ep-actions">
                <button type="button" className="ep-btn ep-btn-quiet" onClick={() => setUpdateDraft(null)}>
                  {t("cancel")}
                </button>
                <button type="button" className="ep-btn ep-btn-primary" id="update-save" onClick={saveUpdate}>
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
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={confirmLabel}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else if (confirm.kind === "clearAll") applyClearAll();
          else if (confirm.kind === "deleteEssay") deleteEssay(confirm.id);
          else deleteEntry(confirm.date);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
