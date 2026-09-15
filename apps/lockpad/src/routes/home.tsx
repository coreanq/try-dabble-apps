import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { recordFailure, remainingMs, resetBackoff, type BackoffState } from "@/lib/backoff";
import { DEFAULT_KDF, decryptWithKey, deriveKey, encryptWithKey, fromBase64, randomBytes, toBase64 } from "@/lib/crypto";
import { detectLang, HTML_LANG, isLang, LOCALE, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  backupFilename,
  buildBackup,
  clearAll,
  createNote,
  download,
  loadBackoff,
  loadNotes,
  loadOpenId,
  loadPrefs,
  lockNote,
  mergeNotes,
  NOTE_COLORS,
  parseBackup,
  reencryptNote,
  removeNote,
  saveBackoff,
  saveNotes,
  saveOpenId,
  savePrefs,
  searchNotes,
  sortNotes,
  toJSON,
  unlockNote,
  updateNote,
  type Backup,
  type BackoffMap,
  type Note,
  type NoteColor,
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

const CHIP_KEYS: MsgKey[] = [
  "chipAndroidWeb",
  "chipNoLogin",
  "chipNoAds",
  "chipBackup",
  "chipNoAttachPaywall",
  "chipNoWipe",
  "chipLocal",
  "chipPin",
  "chipAutoLock",
  "chipFree",
  "chipLangs",
];
const COLOR_KEYS: Record<NoteColor, MsgKey> = { none: "colorNone", brass: "colorBrass", sage: "colorSage", rose: "colorRose", lavender: "colorLavender", slate: "colorSlate" };
const IDLE_OPTIONS: { value: number | null; key: MsgKey }[] = [
  { value: null, key: "idleOff" },
  { value: 60_000, key: "idle1" },
  { value: 300_000, key: "idle5" },
  { value: 900_000, key: "idle15" },
  { value: 3_600_000, key: "idle60" },
];
const TOAST_MS = 2400;
const MIN_PIN = 4;
const DELETE_ALL_WORD = "lockpad";
const IDLE_POLL_MS = 5000;

/** A locked note that has been opened for this session: its plaintext plus the non-extractable key that re-encrypts edits. The PIN itself is never kept. */
interface SessionEntry {
  body: string;
  key: CryptoKey;
}

interface LockDraft {
  pin: string;
  confirm: string;
  show: boolean;
  error: MsgKey | null;
}

interface UnlockDraft {
  id: string;
  pin: string;
  show: boolean;
  wrong: boolean;
  busy: boolean;
}

type Confirm = { kind: "import"; parsed: Backup } | { kind: "deleteNote"; id: string } | { kind: "removeLock"; id: string };

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} width="1em" height="1em">
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="5" y="11" width="14" height="10" rx="3" fill="currentColor" />
    </svg>
  );
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const locale = LOCALE[lang];

  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [backoff, setBackoff] = useState<BackoffMap>(() => loadBackoff());
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(() => {
    const id = loadOpenId();
    return id && notes.some((n) => n.id === id) ? id : null;
  });
  const sessionRef = useRef<Map<string, SessionEntry>>(new Map());
  const [sessionTick, setSessionTick] = useState(0);
  const bump = useCallback(() => setSessionTick((v) => v + 1), []);
  const encChain = useRef<Map<string, Promise<void>>>(new Map());
  const [lockDraft, setLockDraft] = useState<LockDraft | null>(null);
  const [unlockDraft, setUnlockDraft] = useState<UnlockDraft | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllWord, setDeleteAllWord] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastActivity = useRef(Date.now());

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
  useEffect(() => savePrefs(prefs), [prefs]);
  useEffect(() => saveBackoff(backoff), [backoff]);
  useEffect(() => saveOpenId(openId), [openId]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  /* ---------- derived ---------- */
  const sorted = useMemo(() => sortNotes(notes), [notes]);
  const filtered = useMemo(() => searchNotes(sorted, query), [sorted, query]);
  const lockedCount = useMemo(() => notes.filter((n) => n.locked).length, [notes]);
  const openNote = useMemo(() => notes.find((n) => n.id === openId) ?? null, [notes, openId]);
  // sessionTick is the re-render signal for the mutable session map.
  const openSession = useMemo(() => (openId ? (sessionRef.current.get(openId) ?? null) : null), [openId, sessionTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const sessionSize = sessionRef.current.size;

  /* ---------- session: re-encrypt edits, re-lock ---------- */
  const persistLocked = useCallback((id: string, body: string, key: CryptoKey) => {
    const prev = encChain.current.get(id) ?? Promise.resolve();
    const next = prev
      .then(async () => {
        const blob = await encryptWithKey(key, body);
        setNotes((list) => reencryptNote(list, id, blob));
      })
      .catch(() => {});
    encChain.current.set(id, next);
    return next;
  }, []);

  const relock = useCallback(
    async (ids: string[]) => {
      await Promise.all(ids.map((id) => encChain.current.get(id) ?? Promise.resolve()));
      for (const id of ids) sessionRef.current.delete(id);
      bump();
    },
    [bump],
  );

  const lockAll = useCallback(
    async (reason: "manual" | "auto") => {
      const ids = [...sessionRef.current.keys()];
      if (ids.length === 0) return;
      await relock(ids);
      showToast(t(reason === "auto" ? "autoLockedToast" : "lockedAllToast"));
    },
    [relock, showToast, t],
  );

  /* ---------- auto-lock on idle / hide ---------- */
  useEffect(() => {
    const touch = () => {
      lastActivity.current = Date.now();
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "scroll", "input"];
    for (const ev of events) window.addEventListener(ev, touch, { passive: true, capture: true });
    return () => {
      for (const ev of events) window.removeEventListener(ev, touch, { capture: true });
    };
  }, []);
  useEffect(() => {
    if (!prefs.autoLockIdleMs) return;
    const id = window.setInterval(() => {
      if (sessionRef.current.size === 0) return;
      if (Date.now() - lastActivity.current >= prefs.autoLockIdleMs!) void lockAll("auto");
    }, IDLE_POLL_MS);
    return () => window.clearInterval(id);
  }, [prefs.autoLockIdleMs, lockAll]);
  useEffect(() => {
    if (!prefs.autoLockOnHide) return;
    const onHide = () => {
      if (document.visibilityState === "hidden" && sessionRef.current.size > 0) void lockAll("auto");
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [prefs.autoLockOnHide, lockAll]);

  /* ---------- notes ---------- */
  const createNew = () => {
    const note = createNote({});
    setNotes((list) => [note, ...list]);
    setOpenId(note.id);
    setQuery("");
  };
  const patchOpen = (patch: Parameters<typeof updateNote>[2]) => {
    if (!openId) return;
    setNotes((list) => updateNote(list, openId, patch));
  };
  const onBodyChange = (value: string) => {
    if (!openNote) return;
    if (openNote.locked) {
      const s = sessionRef.current.get(openNote.id);
      if (!s) return;
      s.body = value;
      bump();
      void persistLocked(openNote.id, value, s.key);
    } else {
      patchOpen({ body: value });
    }
  };
  const deleteNote = (id: string) => {
    sessionRef.current.delete(id);
    encChain.current.delete(id);
    setNotes((list) => removeNote(list, id));
    setBackoff((m) => {
      if (!(id in m)) return m;
      const next = { ...m };
      delete next[id];
      return next;
    });
    if (openId === id) setOpenId(null);
    bump();
    showToast(t("deletedToast"));
  };

  /* ---------- lock ---------- */
  const openLockDialog = () => setLockDraft({ pin: "", confirm: "", show: false, error: null });
  const applyLock = async () => {
    if (!lockDraft || !openNote || openNote.locked) return;
    if (lockDraft.pin.length < MIN_PIN) return setLockDraft({ ...lockDraft, error: "pinTooShort" });
    if (lockDraft.pin !== lockDraft.confirm) return setLockDraft({ ...lockDraft, error: "pinMismatch" });
    const salt = randomBytes(16);
    const key = await deriveKey(lockDraft.pin, salt, DEFAULT_KDF);
    const { ciphertext, iv } = await encryptWithKey(key, openNote.body);
    const locked = lockNote(openNote, { ciphertext, iv, salt: toBase64(salt), kdf: { ...DEFAULT_KDF } });
    setNotes((list) => list.map((n) => (n.id === locked.id ? locked : n)));
    setLockDraft(null);
    showToast(t("lockedToast"));
  };

  /* ---------- unlock + backoff ---------- */
  const openUnlockDialog = (id: string) => setUnlockDraft({ id, pin: "", show: false, wrong: false, busy: false });
  const unlockState: BackoffState = unlockDraft ? (backoff[unlockDraft.id] ?? resetBackoff()) : resetBackoff();
  const unlockWait = unlockDraft ? remainingMs(unlockState, now) : 0;
  useEffect(() => {
    if (!unlockDraft) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [unlockDraft]);
  const applyUnlock = async () => {
    if (!unlockDraft || unlockDraft.busy) return;
    const note = notes.find((n) => n.id === unlockDraft.id);
    if (!note || !note.locked) return setUnlockDraft(null);
    if (remainingMs(backoff[note.id] ?? resetBackoff(), Date.now()) > 0) return;
    setUnlockDraft({ ...unlockDraft, busy: true, wrong: false });
    try {
      const key = await deriveKey(unlockDraft.pin, fromBase64(note.salt), note.kdf);
      const body = await decryptWithKey(key, note.ciphertext, note.iv);
      sessionRef.current.set(note.id, { body, key });
      setBackoff((m) => {
        if (!(note.id in m)) return m;
        const next = { ...m };
        delete next[note.id];
        return next;
      });
      bump();
      setUnlockDraft(null);
      setOpenId(note.id);
      showToast(t("unlockedToast"));
    } catch {
      setBackoff((m) => ({ ...m, [note.id]: recordFailure(m[note.id] ?? resetBackoff(), Date.now()) }));
      setNow(Date.now());
      setUnlockDraft((d) => (d ? { ...d, pin: "", busy: false, wrong: true } : d));
    }
  };
  const applyRemoveLock = (id: string) => {
    const note = notes.find((n) => n.id === id);
    const s = sessionRef.current.get(id);
    if (!note || !note.locked || !s) return;
    const plain = unlockNote(note, s.body);
    sessionRef.current.delete(id);
    encChain.current.delete(id);
    setNotes((list) => list.map((n) => (n.id === id ? plain : n)));
    bump();
    showToast(t("removedLockToast"));
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
    setNotes((list) => mergeNotes(list, parsed.notes));
    setPrefs(parsed.prefs);
    showToast(t("importOk", { n: parsed.notes.length, locked: parsed.notes.filter((n) => n.locked).length }));
  };
  const applyDeleteAll = () => {
    if (deleteAllWord.trim().toLowerCase() !== DELETE_ALL_WORD) return;
    clearAll();
    sessionRef.current.clear();
    encChain.current.clear();
    setNotes([]);
    setBackoff({});
    setOpenId(null);
    setDeleteAllOpen(false);
    setDeleteAllWord("");
    bump();
    showToast(t("deletedAll"));
  };

  const confirmCopy = (() => {
    switch (confirm?.kind) {
      case "import": {
        const locked = confirm.parsed.notes.filter((n) => n.locked).length;
        return { title: t("importConfirmTitle"), body: t("importConfirmBody", { n: confirm.parsed.notes.length, locked }), label: t("importJson"), destructive: false };
      }
      case "deleteNote":
        return { title: t("deleteNoteTitle"), body: t("deleteNoteBody"), label: t("deleteNote"), destructive: true };
      case "removeLock":
        return { title: t("removeLockTitle"), body: t("removeLockBody"), label: t("removeLockBtn"), destructive: false };
      default:
        return { title: "", body: "", label: "", destructive: false };
    }
  })();

  const fmtTime = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }), [locale]);
  const editorBody = openNote ? (openNote.locked ? (openSession?.body ?? "") : openNote.body) : "";
  const canEditBody = !!openNote && (!openNote.locked || !!openSession);

  return (
    <div className="lp-app" data-lang={lang}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <section className="lp-how" id="how">
        <b>{t("howTitle")}</b>
        <p className="lp-hint">{t("howBody")}</p>
      </section>

      <div className="lp-workspace" id="workspace" data-open={openId !== null}>
        {/* note list */}
        <section className="lp-pane lp-list-pane lp-card" id="list-pane" aria-label={t("notesTitle")}>
          <div className="lp-card-head">
            <h2>{t("notesTitle")}</h2>
            <div className="lp-actions">
              {sessionSize > 0 && (
                <button type="button" className="lp-btn lp-btn-sm lp-btn-brass" id="btn-lock-all" onClick={() => void lockAll("manual")}>
                  <LockIcon /> {t("lockAllBtn")}
                </button>
              )}
              <button type="button" className="lp-btn lp-btn-sm lp-btn-primary" id="btn-new-note" onClick={createNew}>
                + {t("newNote")}
              </button>
            </div>
          </div>
          <div className="lp-search">
            <label className="sr-only" htmlFor="search-input">
              {t("searchLabel")}
            </label>
            <input id="search-input" className="lp-input" type="search" placeholder={t("searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
            <p className="lp-hint" id="search-hint">{t("searchHint")}</p>
          </div>
          <div className="lp-counts" id="counts">
            <span id="note-count">{t("noteCount", { n: notes.length })}</span>
            <span id="locked-count">{t("lockedCount", { n: lockedCount })}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="lp-empty">
              <p className="lp-hint">{t(notes.length === 0 ? "noNotes" : "noMatches")}</p>
            </div>
          ) : (
            <ul className="lp-list" id="note-list">
              {filtered.map((note) => {
                const inSession = note.locked && sessionRef.current.has(note.id);
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      className={"lp-note" + (note.id === openId ? " is-on" : "")}
                      data-note={note.id}
                      data-color={note.color}
                      data-locked={note.locked}
                      aria-pressed={note.id === openId}
                      onClick={() => setOpenId(note.id)}
                    >
                      <span className={"lp-note-title" + (note.title ? "" : " is-untitled")}>{note.title || t("untitled")}</span>
                      {note.locked ? (
                        <span className={"lp-badge " + (inSession ? "lp-badge-open" : "lp-badge-locked")}>
                          <LockIcon /> {t(inSession ? "openBadge" : "lockedBadge")}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="lp-note-sub">
                        {note.tags.map((tag) => (
                          <span key={tag} className="lp-tag">
                            {tag}
                          </span>
                        ))}
                        {!note.locked && note.body && <span className="lp-note-snippet">{note.body.slice(0, 80)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* editor */}
        <section className="lp-pane lp-editor-pane lp-card" id="editor-pane" aria-label={t("noteBodyLabel")}>
          {!openNote ? (
            <div className="lp-empty">
              <p className="lp-hint">{t("pickNote")}</p>
            </div>
          ) : (
            <div className="lp-editor" data-note={openNote.id} data-locked={openNote.locked}>
              <div className="lp-editor-bar">
                <button type="button" className="lp-btn lp-btn-sm lp-btn-quiet lp-back" id="btn-back" onClick={() => setOpenId(null)}>
                  ‹ {t("backToList")}
                </button>
                {openNote.locked && (
                  <span className={"lp-badge " + (openSession ? "lp-badge-open" : "lp-badge-locked")} id="editor-badge">
                    <LockIcon /> {t(openSession ? "openBadge" : "lockedBadge")}
                  </span>
                )}
                <span className="lp-spacer" />
                {!openNote.locked && (
                  <button type="button" className="lp-btn lp-btn-sm lp-btn-brass" id="btn-lock" onClick={openLockDialog}>
                    <LockIcon /> {t("lockBtn")}
                  </button>
                )}
                {openNote.locked && !openSession && (
                  <button type="button" className="lp-btn lp-btn-sm lp-btn-sage" id="btn-unlock" onClick={() => openUnlockDialog(openNote.id)}>
                    {t("unlockBtn")}
                  </button>
                )}
                {openNote.locked && openSession && (
                  <>
                    <button type="button" className="lp-btn lp-btn-sm lp-btn-brass" id="btn-relock" onClick={() => void relock([openNote.id]).then(() => showToast(t("relockedToast")))}>
                      <LockIcon /> {t("relockBtn")}
                    </button>
                    <button type="button" className="lp-btn lp-btn-sm" id="btn-remove-lock" onClick={() => setConfirm({ kind: "removeLock", id: openNote.id })}>
                      {t("removeLockBtn")}
                    </button>
                  </>
                )}
                <button type="button" className="lp-btn lp-btn-sm lp-btn-danger" id="btn-delete-note" onClick={() => setConfirm({ kind: "deleteNote", id: openNote.id })}>
                  {t("deleteNote")}
                </button>
              </div>

              <label className="sr-only" htmlFor="note-title-input">
                {t("noteTitleLabel")}
              </label>
              <input id="note-title-input" className="lp-title-input" type="text" maxLength={120} placeholder={t("noteTitlePlaceholder")} value={openNote.title} onChange={(e) => patchOpen({ title: e.target.value })} autoComplete="off" />

              {canEditBody ? (
                <>
                  <label className="sr-only" htmlFor="note-body-input">
                    {t("noteBodyLabel")}
                  </label>
                  <textarea id="note-body-input" className="lp-body" maxLength={20000} placeholder={t("noteBodyPlaceholder")} value={editorBody} onChange={(e) => onBodyChange(e.target.value)} />
                </>
              ) : (
                <div className="lp-locked" id="locked-card">
                  <LockIcon className="lp-locked-icon" />
                  <b>{t("lockedCardTitle")}</b>
                  <p className="lp-hint">{t("lockedCardBody")}</p>
                  {openNote.locked && <code className="lp-cipher" aria-hidden="true">{openNote.ciphertext.slice(0, 64)}…</code>}
                  <button type="button" className="lp-btn lp-btn-sage" id="btn-unlock-card" onClick={() => openUnlockDialog(openNote.id)}>
                    {t("unlockBtn")}
                  </button>
                  <p className="lp-hint">{t("lostPinHint")}</p>
                </div>
              )}

              <div className="lp-meta-row">
                <label className="lp-field" htmlFor="note-tags-input">
                  {t("tagsLabel")}
                  <input id="note-tags-input" className="lp-input" type="text" placeholder={t("tagsPlaceholder")} defaultValue={openNote.tags.join(", ")} key={`tags-${openNote.id}`} onBlur={(e) => patchOpen({ tags: e.target.value })} autoComplete="off" />
                </label>
                <div className="lp-field" role="group" aria-label={t("colorLabel")} id="color-picker">
                  {t("colorLabel")}
                  <div className="lp-swatches">
                    {NOTE_COLORS.map((c) => (
                      <button key={c} type="button" className={"lp-swatch" + (openNote.color === c ? " is-on" : "")} data-color={c} aria-label={t(COLOR_KEYS[c])} aria-pressed={openNote.color === c} title={t(COLOR_KEYS[c])} onClick={() => patchOpen({ color: c })} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="lp-editor-foot">
                <span id="edited-at">{t("editedAt", { time: fmtTime.format(new Date(openNote.updatedAt)) })}</span>
                <span>{t("savedHint")}</span>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="lp-card" id="prefs">
        <h2>{t("prefsTitle")}</h2>
        <p className="lp-hint">{t("prefsHint")}</p>
        <label className="lp-field" htmlFor="idle-select">
          {t("idleLockLabel")}
          <select id="idle-select" className="lp-select-block" value={prefs.autoLockIdleMs ?? 0} onChange={(e) => setPrefs((p) => ({ ...p, autoLockIdleMs: Number(e.target.value) || null }))}>
            {IDLE_OPTIONS.map((o) => (
              <option key={o.key} value={o.value ?? 0}>
                {t(o.key)}
              </option>
            ))}
          </select>
        </label>
        <label className="lp-check" htmlFor="hide-lock">
          <input id="hide-lock" type="checkbox" checked={prefs.autoLockOnHide} onChange={(e) => setPrefs((p) => ({ ...p, autoLockOnHide: e.target.checked }))} />
          {t("hideLockLabel")}
        </label>
      </section>

      <section className="lp-card" id="backup">
        <h2>{t("backupTitle")}</h2>
        <p className="lp-hint">{t("backupHint")}</p>
        <div className="lp-actions" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="lp-btn lp-btn-primary" id="btn-export" onClick={exportJson}>
            {t("exportJson")}
          </button>
          <button type="button" className="lp-btn" id="btn-import" onClick={() => fileRef.current?.click()}>
            {t("importJson")}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => onImportFile(e.target.files?.[0])} />
          <button type="button" className="lp-btn lp-btn-danger" id="btn-delete-all" onClick={() => { setDeleteAllWord(""); setDeleteAllOpen(true); }}>
            {t("deleteAllBtn")}
          </button>
        </div>
      </section>

      <section className="lp-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="lp-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="lp-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/lockpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* lock dialog: choose a PIN */}
      <Dialog open={lockDraft !== null} onOpenChange={(o) => !o && setLockDraft(null)}>
        <DialogContent id="lock-dialog" showCloseButton={false}>
          <DialogTitle className="lp-dialog-title">{t("lockDialogTitle")}</DialogTitle>
          <DialogDescription className="lp-hint">{t("lockDialogBody")}</DialogDescription>
          {lockDraft && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void applyLock();
              }}
              className="grid gap-3"
            >
              <div className="lp-pin-row">
                <label className="lp-field" htmlFor="lock-pin">
                  {t("pinLabel")}
                  <input id="lock-pin" className="lp-input" type={lockDraft.show ? "text" : "password"} autoComplete="off" placeholder={t("pinPlaceholder")} value={lockDraft.pin} onChange={(e) => setLockDraft({ ...lockDraft, pin: e.target.value, error: null })} />
                </label>
                <button type="button" className="lp-btn lp-btn-sm lp-btn-quiet" id="lock-pin-toggle" aria-pressed={lockDraft.show} onClick={() => setLockDraft({ ...lockDraft, show: !lockDraft.show })}>
                  {t(lockDraft.show ? "hidePin" : "showPin")}
                </button>
              </div>
              <label className="lp-field" htmlFor="lock-pin-confirm">
                {t("pinConfirmLabel")}
                <input id="lock-pin-confirm" className="lp-input" type={lockDraft.show ? "text" : "password"} autoComplete="off" placeholder={t("pinPlaceholder")} value={lockDraft.confirm} onChange={(e) => setLockDraft({ ...lockDraft, confirm: e.target.value, error: null })} />
              </label>
              <p className="lp-hint">{t("lostPinHint")}</p>
              {lockDraft.error && <p className="lp-error" id="lock-error">{t(lockDraft.error)}</p>}
              <div className="lp-actions">
                <button type="button" className="lp-btn lp-btn-quiet" onClick={() => setLockDraft(null)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="lp-btn lp-btn-brass" id="lock-confirm">
                  <LockIcon /> {t("lockBtn")}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* unlock modal with wrong-PIN backoff */}
      <Dialog open={unlockDraft !== null} onOpenChange={(o) => !o && setUnlockDraft(null)}>
        <DialogContent id="unlock-dialog" showCloseButton={false}>
          <DialogTitle className="lp-dialog-title">{t("unlockDialogTitle")}</DialogTitle>
          <DialogDescription className="lp-hint">{t("unlockDialogBody")}</DialogDescription>
          {unlockDraft && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void applyUnlock();
              }}
              className="grid gap-3"
            >
              <div className="lp-pin-row">
                <label className="lp-field" htmlFor="unlock-pin">
                  {t("pinLabel")}
                  <input id="unlock-pin" className={"lp-input" + (unlockDraft.wrong ? " is-wrong" : "")} type={unlockDraft.show ? "text" : "password"} autoComplete="off" placeholder={t("pinPlaceholder")} value={unlockDraft.pin} disabled={unlockWait > 0 || unlockDraft.busy} onChange={(e) => setUnlockDraft({ ...unlockDraft, pin: e.target.value })} />
                </label>
                <button type="button" className="lp-btn lp-btn-sm lp-btn-quiet" id="unlock-pin-toggle" aria-pressed={unlockDraft.show} onClick={() => setUnlockDraft({ ...unlockDraft, show: !unlockDraft.show })}>
                  {t(unlockDraft.show ? "hidePin" : "showPin")}
                </button>
              </div>
              {unlockWait > 0 ? (
                <p className="lp-error" id="unlock-wait" role="alert">{t("waitSeconds", { s: Math.ceil(unlockWait / 1000) })}</p>
              ) : unlockDraft.wrong ? (
                <p className="lp-error" id="unlock-wrong" role="alert">{t("wrongPin")}</p>
              ) : null}
              <p className="lp-hint">{t("lostPinHint")}</p>
              <div className="lp-actions">
                <button type="button" className="lp-btn lp-btn-quiet" onClick={() => setUnlockDraft(null)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="lp-btn lp-btn-sage" id="unlock-confirm" disabled={unlockWait > 0 || unlockDraft.busy || unlockDraft.pin.length === 0}>
                  {unlockWait > 0 ? `${Math.ceil(unlockWait / 1000)}s` : t("unlockBtn")}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* delete all: typed confirm, never a one-tap wipe */}
      <Dialog open={deleteAllOpen} onOpenChange={(o) => !o && setDeleteAllOpen(false)}>
        <DialogContent id="delete-all-dialog" showCloseButton={false}>
          <DialogTitle className="lp-dialog-title">{t("deleteAllTitle")}</DialogTitle>
          <DialogDescription className="lp-hint">{t("deleteAllBody")}</DialogDescription>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyDeleteAll();
            }}
            className="grid gap-3"
          >
            <label className="lp-field" htmlFor="delete-all-word">
              {t("deleteAllTypeLabel", { word: DELETE_ALL_WORD })}
              <input id="delete-all-word" className="lp-input" type="text" autoComplete="off" value={deleteAllWord} onChange={(e) => setDeleteAllWord(e.target.value)} />
            </label>
            {deleteAllWord.length > 0 && deleteAllWord.trim().toLowerCase() !== DELETE_ALL_WORD && <p className="lp-error">{t("deleteAllMismatch")}</p>}
            <div className="lp-actions">
              <button type="button" className="lp-btn lp-btn-quiet" onClick={() => setDeleteAllOpen(false)}>
                {t("cancel")}
              </button>
              <button type="submit" className="lp-btn lp-btn-danger" id="delete-all-confirm" disabled={deleteAllWord.trim().toLowerCase() !== DELETE_ALL_WORD}>
                {t("deleteAllBtn")}
              </button>
            </div>
          </form>
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
          else if (confirm.kind === "deleteNote") deleteNote(confirm.id);
          else applyRemoveLock(confirm.id);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
