import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  addMonths,
  daysInMonth,
  dateKeyInMonth,
  firstWeekdayOfMonth,
  formatDate,
  formatMmDd,
  formatMonthYear,
  isDateKey,
  isMonthKey,
  mmddOfDateKey,
  monthKey,
  toDateKey,
} from "@/lib/dates";
import { detectLang, HTML_LANG, isLang, LOCALE, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  buildBackup,
  backupFilename,
  clearAll,
  createNote,
  defaultPrefs,
  download,
  loadNotes,
  loadPrefs,
  notesForDate,
  notesForMmDd,
  parseBackup,
  removeNote,
  saveNotes,
  savePrefs,
  toJSON,
  updateNote,
  type Backup,
  type Note,
  type Prefs,
  type StackOrder,
  type ViewMode,
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

const CHIP_KEYS: MsgKey[] = ["chipNoAccount", "chipNoCloud", "chipBackup", "chipNoAds", "chipLocal", "chipFree", "chipLangs"];
const TOAST_MS = 2400;
type Tab = ViewMode; // "month" = this-day notes, "stack" = across-years

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

interface NoteDraft {
  id: string | null; // null = new
  title: string;
  body: string;
  error: MsgKey | null;
}

type Confirm = { kind: "import"; parsed: Backup } | { kind: "clearAll" } | { kind: "deleteNote"; id: string };

function initialActiveMonth(): string {
  const m = loadPrefs().activeMonth;
  return isMonthKey(m) ? m : monthKey(new Date());
}

function initialSelectedDate(): string {
  const p = loadPrefs();
  if (p.selectedMmDd) {
    const day = p.selectedMmDd.slice(3, 5);
    const candidate = `${isMonthKey(p.activeMonth) ? p.activeMonth : monthKey(new Date())}-${day}`;
    if (isDateKey(candidate)) return candidate;
  }
  return toDateKey(new Date());
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const locale = LOCALE[lang];

  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [activeMonth, setActiveMonth] = useState<string>(initialActiveMonth);
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const [tab, setTab] = useState<Tab>(() => (prefs.viewMode === "stack" ? "stack" : "month"));
  const today = useToday();
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
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

  useEffect(() => saveNotes(notes), [notes]);
  useEffect(() => {
    const next: Prefs = { ...prefs, viewMode: tab, activeMonth, selectedMmDd: mmddOfDateKey(selectedDate) };
    setPrefs(next);
    savePrefs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activeMonth, selectedDate]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  /* ---------- calendar grid ---------- */
  const notesByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of notes) m.set(n.date, (m.get(n.date) ?? 0) + 1);
    return m;
  }, [notes]);

  const gridDays = daysInMonth(activeMonth);
  const gridOffset = firstWeekdayOfMonth(activeMonth);
  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2023-01-01 was a Sunday, local time — a safe Sun..Sat reference week.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i)));
  }, [locale]);

  const goMonth = (n: number) => setActiveMonth((m) => addMonths(m, n));
  const goYear = (n: number) => setActiveMonth((m) => addMonths(m, n * 12));
  const goToday = () => {
    const now = new Date();
    setActiveMonth(monthKey(now));
    setSelectedDate(toDateKey(now));
  };
  const onJumpMonth = (value: string) => {
    if (isMonthKey(value)) setActiveMonth(value);
  };
  const selectDay = (dateKey: string) => setSelectedDate(dateKey);

  /* ---------- selected day + across-years stack ---------- */
  const dayNotes = useMemo(() => notesForDate(notes, selectedDate), [notes, selectedDate]);
  const mmdd = mmddOfDateKey(selectedDate);
  const [stackOrder, setStackOrder] = useState<StackOrder>(() => prefs.stackOrder);
  useEffect(() => {
    setPrefs((p) => {
      const next = { ...p, stackOrder };
      savePrefs(next);
      return next;
    });
  }, [stackOrder]);
  const yearGroups = useMemo(() => notesForMmDd(notes, mmdd, stackOrder), [notes, mmdd, stackOrder]);

  /* ---------- note dialog ---------- */
  const openNewNote = () => setNoteDraft({ id: null, title: "", body: "", error: null });
  const openEditNote = (note: Note) => setNoteDraft({ id: note.id, title: note.title ?? "", body: note.body, error: null });
  const saveNote = () => {
    if (!noteDraft) return;
    const body = noteDraft.body.trim();
    const title = noteDraft.title.trim();
    if (!body && !title) return setNoteDraft({ ...noteDraft, error: "needBody" });
    if (noteDraft.id) {
      setNotes((list) => updateNote(list, noteDraft.id!, { title, body }));
      showToast(t("savedToast"));
    } else {
      const note = createNote(selectedDate, body, title);
      setNotes((list) => [...list, note]);
      showToast(t("savedToast"));
    }
    setNoteDraft(null);
  };
  const deleteNote = (id: string) => {
    setNotes((list) => removeNote(list, id));
    showToast(t("deletedToast"));
  };

  /* ---------- backup ---------- */
  const exportJson = () => {
    download(backupFilename(), toJSON(buildBackup(notes, prefs)));
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
    setNotes(parsed.notes);
    const next = { ...defaultPrefs(), ...parsed.prefs, activeMonth, selectedMmDd: mmddOfDateKey(selectedDate) };
    setPrefs(next);
    setStackOrder(next.stackOrder);
    showToast(t("importOk", { n: parsed.notes.length }));
  };
  const applyClearAll = () => {
    clearAll();
    setNotes([]);
    showToast(t("cleared"));
  };

  const confirmCopy = (() => {
    switch (confirm?.kind) {
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody", { n: confirm.parsed.notes.length }), label: t("importJson"), destructive: false };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), label: t("clearAllBtn"), destructive: true };
      case "deleteNote":
        return { title: t("deleteNoteTitle"), body: t("deleteNoteBody"), label: t("deleteNote"), destructive: true };
      default:
        return { title: "", body: "", label: "", destructive: false };
    }
  })();

  return (
    <div className="od-app" data-lang={lang}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <section className="od-how" id="how">
        <b>{t("howTitle")}</b>
        <p className="od-hint">{t("howBody")}</p>
      </section>

      {/* month calendar */}
      <section className="od-card" id="calendar" aria-label={t("calendarTitle")}>
        <div className="od-cal-nav">
          <button type="button" className="od-btn od-btn-sm" id="btn-prev-year" aria-label={t("prevYearAria")} onClick={() => goYear(-1)}>
            «
          </button>
          <button type="button" className="od-btn od-btn-sm" id="btn-prev-month" aria-label={t("prevMonthAria")} onClick={() => goMonth(-1)}>
            ‹
          </button>
          <label className="od-cal-month">
            <span className="sr-only">{t("jumpMonthAria")}</span>
            <span className="od-cal-month-label" id="cal-month-label">{formatMonthYear(activeMonth, locale)}</span>
            <input type="month" id="cal-month-input" className="od-cal-month-input" value={activeMonth} onChange={(e) => onJumpMonth(e.target.value)} aria-label={t("jumpMonthAria")} />
          </label>
          <button type="button" className="od-btn od-btn-sm" id="btn-next-month" aria-label={t("nextMonthAria")} onClick={() => goMonth(1)}>
            ›
          </button>
          <button type="button" className="od-btn od-btn-sm" id="btn-next-year" aria-label={t("nextYearAria")} onClick={() => goYear(1)}>
            »
          </button>
          <button type="button" className="od-btn od-btn-sm od-btn-quiet" id="btn-today" onClick={goToday}>
            {t("todayBtn")}
          </button>
        </div>
        <div className="od-cal-weekdays" aria-hidden="true">
          {weekdayLabels.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="od-cal-grid" id="cal-grid" role="grid">
          {Array.from({ length: gridOffset }, (_, i) => (
            <span key={`pad-${i}`} className="od-cal-pad" aria-hidden="true" />
          ))}
          {Array.from({ length: gridDays }, (_, i) => {
            const day = i + 1;
            const dateKey = dateKeyInMonth(activeMonth, day);
            const count = notesByDate.get(dateKey) ?? 0;
            const isToday = dateKey === today;
            const isSelected = dateKey === selectedDate;
            return (
              <button
                key={dateKey}
                type="button"
                className={"od-cal-day" + (isToday ? " is-today" : "") + (isSelected ? " is-selected" : "") + (count > 0 ? " has-note" : "")}
                data-date={dateKey}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                onClick={() => selectDay(dateKey)}
              >
                {day}
                {count > 0 && <i className="od-cal-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* tabs: this day / across years */}
      <nav className="od-tabs" aria-label="tabs">
        {(["month", "stack"] as Tab[]).map((k) => (
          <button key={k} type="button" className={"od-tab" + (tab === k ? " is-on" : "")} id={`tab-${k}`} onClick={() => setTab(k)} aria-pressed={tab === k}>
            {t(k === "month" ? "tabDay" : "tabStack")}
          </button>
        ))}
      </nav>

      {tab === "month" && (
        <section className="od-card" id="day-panel">
          <div className="od-card-head">
            <h2 id="day-panel-title">{t("dayNotesTitle", { date: formatDate(selectedDate, locale, "long") })}</h2>
            <button type="button" className="od-btn od-btn-primary od-btn-sm" id="btn-add-note" onClick={openNewNote}>
              + {t("addNote")}
            </button>
          </div>
          {dayNotes.length === 0 ? (
            <div className="od-empty">
              <p className="od-hint">{t("noNotesForDay")}</p>
            </div>
          ) : (
            <ul className="od-list" id="day-note-list">
              {dayNotes.map((note) => (
                <li key={note.id} className="od-entry" data-note={note.id}>
                  <div className="od-entry-main">
                    {note.title && <b>{note.title}</b>}
                    <span>{note.body}</span>
                  </div>
                  <button type="button" className="od-btn od-btn-sm" data-action="edit-note" onClick={() => openEditNote(note)}>
                    {t("edit")}
                  </button>
                  <button type="button" className="od-btn od-btn-sm od-btn-danger" data-action="delete-note" onClick={() => setConfirm({ kind: "deleteNote", id: note.id })}>
                    {t("deleteNote")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "stack" && (
        <section className="od-card" id="stack-panel">
          <div className="od-card-head">
            <h2 id="stack-panel-title">{t("stackTitle")}</h2>
            <div className="od-seg" role="group" aria-label={t("stackOrderLabel")} id="stack-order">
              {(["newest", "oldest"] as StackOrder[]).map((o) => (
                <button key={o} type="button" id={`btn-order-${o}`} className={stackOrder === o ? "is-on" : ""} aria-pressed={stackOrder === o} onClick={() => setStackOrder(o)}>
                  {t(o === "newest" ? "orderNewest" : "orderOldest")}
                </button>
              ))}
            </div>
          </div>
          <p className="od-hint">{t("stackHint", { mmdd: formatMmDd(mmdd, locale) })}</p>
          {yearGroups.length === 0 ? (
            <div className="od-empty">
              <p className="od-hint">{t("noStackNotes")}</p>
            </div>
          ) : (
            <ul className="od-stack" id="stack-list">
              {yearGroups.map((group) => (
                <li key={group.year} className="od-stack-year" data-year={group.year}>
                  <div className="od-stack-year-head">
                    <b>{group.year}</b>
                    <button type="button" className="od-btn od-btn-sm od-btn-quiet" data-action="jump-year" onClick={() => setSelectedDate(group.date)}>
                      {t("jumpToYear", { year: group.year })}
                    </button>
                  </div>
                  <ul className="od-list">
                    {group.notes.map((note) => (
                      <li key={note.id} className="od-entry" data-note={note.id}>
                        <div className="od-entry-main">
                          {note.title && <b>{note.title}</b>}
                          <span>{note.body}</span>
                        </div>
                        <button type="button" className="od-btn od-btn-sm" data-action="edit-note" onClick={() => { setSelectedDate(group.date); openEditNote(note); }}>
                          {t("edit")}
                        </button>
                        <button type="button" className="od-btn od-btn-sm od-btn-danger" data-action="delete-note" onClick={() => setConfirm({ kind: "deleteNote", id: note.id })}>
                          {t("deleteNote")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="od-card" id="backup">
        <h2>{t("backupTitle")}</h2>
        <p className="od-hint">{t("backupHint")}</p>
        <div className="od-actions" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="od-btn od-btn-primary" id="btn-export" onClick={exportJson}>
            {t("exportJson")}
          </button>
          <button type="button" className="od-btn" id="btn-import" onClick={() => fileRef.current?.click()}>
            {t("importJson")}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => onImportFile(e.target.files?.[0])} />
          <button type="button" className="od-btn od-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>
            {t("clearAllBtn")}
          </button>
        </div>
      </section>

      <section className="od-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="od-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="od-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="od-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/ondaypad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* new / edit note */}
      <Dialog open={noteDraft !== null} onOpenChange={(o) => !o && setNoteDraft(null)}>
        <DialogContent id="note-dialog" showCloseButton={false}>
          <DialogTitle className="od-dialog-title">{t(noteDraft?.id ? "editNoteTitle" : "newNoteTitle")}</DialogTitle>
          <DialogDescription className="od-hint">{formatDate(selectedDate, locale, "long")}</DialogDescription>
          {noteDraft && (
            <>
              <label className="od-field" htmlFor="note-title-input">
                {t("noteTitleLabel")}
                <input id="note-title-input" className="od-input" type="text" maxLength={120} placeholder={t("noteTitlePlaceholder")} value={noteDraft.title} onChange={(e) => setNoteDraft({ ...noteDraft, title: e.target.value, error: null })} />
              </label>
              <label className="od-field" htmlFor="note-body-input">
                {t("noteBodyLabel")}
                <textarea id="note-body-input" className="od-textarea" rows={5} maxLength={4000} placeholder={t("noteBodyPlaceholder")} value={noteDraft.body} onChange={(e) => setNoteDraft({ ...noteDraft, body: e.target.value, error: null })} />
              </label>
              {noteDraft.error && <p className="od-error">{t(noteDraft.error)}</p>}
              <div className="od-actions">
                <button type="button" className="od-btn od-btn-quiet" onClick={() => setNoteDraft(null)}>
                  {t("cancel")}
                </button>
                <button type="button" className="od-btn od-btn-primary" id="note-save" onClick={saveNote}>
                  {t(noteDraft.id ? "save" : "create")}
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
        cancelLabel={t("cancel")}
        destructive={confirmCopy.destructive}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else if (confirm.kind === "clearAll") applyClearAll();
          else deleteNote(confirm.id);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
