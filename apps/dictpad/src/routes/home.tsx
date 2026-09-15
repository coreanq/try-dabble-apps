import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { detectLang, HTML_LANG, isLang, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import { DictationSession, detectRecognition, type SessionError, type SessionState } from "@/lib/speech";
import {
  backupFilename,
  buildBackup,
  clearAll,
  createNote,
  defaultSpeechLang,
  deleteNote,
  displayTitle,
  download,
  loadNotes,
  loadPrefs,
  parseBackup,
  pickActive,
  renameNote,
  saveNotes,
  savePrefs,
  SPEECH_LANGS,
  toJSON,
  txtFilename,
  updateBody,
  type Backup,
  type Note,
  type Prefs,
} from "@/lib/store";
import { appendTranscript, markFor, type Punct } from "@/lib/voice";
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

const CHIP_KEYS: MsgKey[] = ["chipNoPaywall", "chipNoAds", "chipLocal", "chipBackup", "chipMicSafe", "chipNotKeyboard", "chipFree", "chipLangs"];
const VOICE_ROWS: { punct: Punct; key: MsgKey }[] = [
  { punct: "period", key: "voicePeriod" },
  { punct: "comma", key: "voiceComma" },
  { punct: "newline", key: "voiceNewline" },
  { punct: "paragraph", key: "voiceParagraph" },
  { punct: "question", key: "voiceQuestion" },
];
const ERROR_KEY: Record<SessionError, MsgKey> = { "not-allowed": "errNotAllowed", network: "errNetwork", audio: "errAudio", generic: "errGeneric" };
const TOAST_MS = 2400;
const SAVE_DEBOUNCE_MS = 250;

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
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

function markLabel(punct: Punct, lang: string): string {
  if (punct === "newline") return "↵";
  if (punct === "paragraph") return "¶";
  return markFor(punct, lang);
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [notes, setNotes] = useState<Note[]>(() => {
    const loaded = loadNotes();
    return loaded.length ? loaded : createNote([]).notes;
  });
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const active = useMemo(() => pickActive(notes, prefs.activeNoteId), [notes, prefs.activeNoteId]);
  const [draft, setDraft] = useState<string>(() => active?.body ?? "");
  const draftNoteId = useRef<string | null>(active?.id ?? null);

  const speechLang = prefs.recognitionLang ?? defaultSpeechLang(lang);
  const Recognition = useMemo(() => detectRecognition(), []);
  const supported = Recognition !== null;

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [interim, setInterim] = useState("");
  const [speechError, setSpeechError] = useState<SessionError | null>(null);
  const sessionRef = useRef<DictationSession | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const speechLangRef = useRef(speechLang);
  speechLangRef.current = speechLang;

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirm, setConfirm] = useState<null | { kind: "import"; parsed: Backup } | { kind: "clearAll" } | { kind: "deleteNote"; id: string }>(null);
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

  /* ---------- persistence ---------- */
  useEffect(() => saveNotes(notes), [notes]);
  useEffect(() => savePrefs(prefs), [prefs]);

  // Make sure prefs always point at a real note.
  useEffect(() => {
    if (active && prefs.activeNoteId !== active.id) setPrefs((p) => ({ ...p, activeNoteId: active.id }));
  }, [active, prefs.activeNoteId]);

  // Switching notes loads that note's body into the editor.
  useEffect(() => {
    if (!active) return;
    if (draftNoteId.current !== active.id) {
      draftNoteId.current = active.id;
      setDraft(active.body);
    }
  }, [active]);

  // Debounced autosave of the editor body into the note list.
  useEffect(() => {
    const id = draftNoteId.current;
    if (!id) return;
    const timer = window.setTimeout(() => setNotes((prev) => updateBody(prev, id, draft)), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft]);

  // Flush on hide so a closed tab keeps the last words.
  useEffect(() => {
    const flush = () => {
      const id = draftNoteId.current;
      if (!id) return;
      saveNotes(updateBody(loadNotes(), id, draftRef.current));
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  /* ---------- speech session ---------- */
  const appendFinal = useCallback((transcript: string) => {
    setDraft((prev) => appendTranscript(prev, transcript, speechLangRef.current));
  }, []);

  const releaseWakeLock = useCallback(() => {
    const lock = wakeLockRef.current;
    wakeLockRef.current = null;
    if (lock) lock.release().catch(() => {});
  }, []);

  const requestWakeLock = useCallback(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (!nav.wakeLock || wakeLockRef.current) return;
    nav.wakeLock
      .request("screen")
      .then((lock) => {
        wakeLockRef.current = lock;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!Recognition) return;
    const session = new DictationSession(Recognition, speechLangRef.current, {
      onFinal: appendFinal,
      onInterim: setInterim,
      onState: setSessionState,
      onError: (err) => setSpeechError(err),
    });
    sessionRef.current = session;
    return () => {
      session.stop();
      sessionRef.current = null;
    };
  }, [Recognition, appendFinal]);

  useEffect(() => {
    sessionRef.current?.setLang(speechLang);
  }, [speechLang]);

  useEffect(() => {
    if (sessionState === "idle") releaseWakeLock();
    else requestWakeLock();
  }, [sessionState, releaseWakeLock, requestWakeLock]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && sessionRef.current?.listening) requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [requestWakeLock]);

  const listening = sessionState !== "idle";

  const toggleRecording = () => {
    const session = sessionRef.current;
    if (!session) return;
    if (session.listening) {
      session.stop();
    } else {
      setSpeechError(null);
      session.start();
    }
  };

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  const onSpeechLangChange = (code: string) => {
    setPrefs((p) => ({ ...p, recognitionLang: code }));
  };

  /* ---------- notes ---------- */
  const selectNote = (id: string) => {
    if (!id || id === active?.id) return;
    // Save the current draft synchronously before switching.
    const cur = draftNoteId.current;
    setNotes((prev) => (cur ? updateBody(prev, cur, draftRef.current) : prev));
    setPrefs((p) => ({ ...p, activeNoteId: id }));
  };

  const addNote = () => {
    const cur = draftNoteId.current;
    const base = cur ? updateBody(notes, cur, draftRef.current) : notes;
    const { notes: next, note } = createNote(base);
    setNotes(next);
    setPrefs((p) => ({ ...p, activeNoteId: note.id }));
  };

  const openRename = () => {
    if (!active) return;
    setRenameValue(active.title ?? "");
    setRenameOpen(true);
  };

  const saveRename = () => {
    if (!active) return;
    setNotes((prev) => renameNote(prev, active.id, renameValue));
    setRenameOpen(false);
  };

  const doDeleteNote = (id: string) => {
    const remaining = deleteNote(notes, id);
    const next = remaining.length ? remaining : createNote([]).notes;
    setNotes(next);
    setPrefs((p) => ({ ...p, activeNoteId: next[0].id }));
  };

  /* ---------- actions ---------- */
  const doCopy = async () => {
    const text = draftRef.current;
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("copied"));
    } catch {
      showToast(t("copyFailed"));
    }
  };

  const doDownloadTxt = () => {
    if (!active) return;
    download(txtFilename({ ...active, body: draftRef.current }), draftRef.current, "text/plain;charset=utf-8");
  };

  const doExport = () => {
    const cur = draftNoteId.current;
    const snapshot = cur ? updateBody(notes, cur, draftRef.current) : notes;
    download(backupFilename(), toJSON(buildBackup(snapshot, prefs)));
  };

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackup(JSON.parse(String(reader.result)));
        if (!parsed) throw new Error("bad");
        setConfirm({ kind: "import", parsed });
      } catch {
        showToast(t("importBad"));
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.onerror = () => showToast(t("importBad"));
    reader.readAsText(file);
  };

  const applyImport = (parsed: Backup) => {
    sessionRef.current?.stop();
    const next = parsed.notes.length ? parsed.notes : createNote([]).notes;
    const activeId = next.find((n) => n.id === parsed.prefs.activeNoteId)?.id ?? next[0].id;
    draftNoteId.current = activeId;
    setDraft(next.find((n) => n.id === activeId)?.body ?? "");
    setNotes(next);
    setPrefs((p) => ({ ...p, ...parsed.prefs, activeNoteId: activeId }));
    showToast(t("importDone", { n: parsed.notes.length }));
  };

  const applyClearAll = () => {
    sessionRef.current?.stop();
    clearAll();
    const fresh = createNote([]).notes;
    draftNoteId.current = fresh[0].id;
    setDraft("");
    setNotes(fresh);
    setPrefs({ recognitionLang: prefs.recognitionLang, activeNoteId: fresh[0].id });
    showToast(t("cleared"));
  };

  const charCount = [...draft].length;
  const activeTitle = active ? displayTitle(active) || t("untitled") : t("untitled");
  const statusKey: MsgKey = sessionState === "listening" ? "statusListening" : sessionState === "starting" ? "statusStarting" : "statusIdle";
  const speechLangKnown = SPEECH_LANGS.some((l) => l.code === speechLang);

  return (
    <div className="dp-app">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      {/* mic deck */}
      <section className={"dp-deck is-" + sessionState + (listening ? " is-on" : "")} id="deck" aria-label={t("record")}>
        <p className="dp-status" id="deck-status">
          <span className="dp-dot" aria-hidden="true" />
          <span>{t(statusKey)}</span>
          <small>· {speechLang}</small>
        </p>
        <div className="dp-deck-row">
          <label className="dp-field" htmlFor="speech-lang">
            {t("speechLangLabel")}
            <select id="speech-lang" className="dp-select-block" value={speechLang} onChange={(e) => onSpeechLangChange(e.target.value)}>
              {!speechLangKnown && <option value={speechLang}>{speechLang}</option>}
              {SPEECH_LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} · {l.code}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="dp-hint">{t("speechLangHint")}</p>
        {supported ? (
          <button type="button" className={"dp-mic" + (listening ? " is-stop" : "")} id="btn-record" data-action={listening ? "stop" : "record"} aria-pressed={listening} onClick={toggleRecording}>
            {listening ? <StopIcon /> : <MicIcon />}
            <span>{listening ? t("stop") : t("record")}</span>
          </button>
        ) : (
          <>
            <button type="button" className="dp-mic" id="btn-record" data-action="record" disabled>
              <MicIcon />
              <span>{t("record")}</span>
            </button>
            <p className="dp-unsupported" id="speech-unsupported">{t("unsupported")}</p>
          </>
        )}
        {speechError && (
          <p className="dp-error" id="speech-error" role="alert">
            {t(ERROR_KEY[speechError])}
          </p>
        )}
        <p className={"dp-interim " + (interim ? "is-live" : "is-empty")} id="interim" aria-live="polite">
          {interim || t("interimEmpty")}
        </p>
      </section>

      {/* notepad */}
      <section className="dp-pad" id="pad" aria-label={t("notepadLabel")}>
        <div className="dp-pad-head">
          <h2>{t("notesTitle")}</h2>
          <div className="dp-row">
            <button type="button" className="dp-btn dp-btn-sm dp-btn-sky" id="btn-new-note" onClick={addNote}>
              {t("newNote")}
            </button>
            <button type="button" className="dp-btn dp-btn-sm" id="btn-rename-note" onClick={openRename} disabled={!active}>
              {t("rename")}
            </button>
            <button type="button" className="dp-btn dp-btn-sm dp-btn-danger" id="btn-delete-note" data-action="delete" onClick={() => active && setConfirm({ kind: "deleteNote", id: active.id })} disabled={!active}>
              {t("delete")}
            </button>
          </div>
        </div>
        <div className="dp-notes-row">
          <label className="sr-only" htmlFor="note-select">
            {t("noteSelectLabel")}
          </label>
          <select id="note-select" className="dp-select-block" value={active?.id ?? ""} onChange={(e) => selectNote(e.target.value)}>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id === active?.id ? (displayTitle({ ...n, body: draft }) || t("untitled")) : displayTitle(n) || t("untitled")}
              </option>
            ))}
          </select>
        </div>
        <label className="sr-only" htmlFor="notepad">
          {t("notepadLabel")}
        </label>
        <textarea
          id="notepad"
          className="dp-textarea"
          value={draft}
          placeholder={t("notepadPlaceholder")}
          spellCheck={false}
          aria-label={activeTitle}
          onChange={(e) => setDraft(e.target.value)}
        />
        <p className="dp-pad-meta">
          <b>{t("savedLocally")}</b>
          <span id="char-count">{t("charsN", { n: charCount })}</span>
        </p>
        <div className="dp-row wrap">
          <button type="button" className="dp-btn dp-btn-primary" id="btn-copy" onClick={doCopy}>
            {t("copy")}
          </button>
          <button type="button" className="dp-btn" id="btn-download-txt" onClick={doDownloadTxt}>
            {t("downloadTxt")}
          </button>
          <button type="button" className="dp-btn" id="btn-export" onClick={doExport}>
            {t("exportJson")}
          </button>
          <button type="button" className="dp-btn" id="btn-import" onClick={() => fileRef.current?.click()}>
            {t("importJson")}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => onImportFile(e.target.files?.[0])} />
          <button type="button" className="dp-btn dp-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>
            {t("clearAll")}
          </button>
        </div>
      </section>

      {/* voice punctuation */}
      <section className="dp-card" id="voice" aria-label={t("voiceTitle")}>
        <div className="dp-card-head">
          <h2>{t("voiceTitle")}</h2>
        </div>
        <ul className="dp-commands">
          {VOICE_ROWS.map((row) => (
            <li key={row.punct} className="dp-command" data-punct={row.punct}>
              <span className="dp-command-mark" aria-hidden="true">{markLabel(row.punct, speechLang)}</span>
              <span className="dp-command-say">{t("sayPrefix", { w: t(row.key) })}</span>
            </li>
          ))}
        </ul>
        <p className="dp-hint">{t("voiceHint")}</p>
      </section>

      {/* good to know */}
      <section className="dp-card" id="docs" aria-label={t("docTitle")}>
        <div className="dp-card-head">
          <h2>{t("docTitle")}</h2>
        </div>
        <ul className="dp-docs">
          {(["docAndroid", "docNetwork", "docNotKeyboard", "docEdit"] as MsgKey[]).map((k) => (
            <li key={k} className="dp-doc" id={k}>
              <InfoIcon />
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="dp-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="dp-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="dp-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="dp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/dictpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* rename */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent id="rename-dialog" showCloseButton={false}>
          <DialogTitle className="dp-sheet-title">{t("renameTitle")}</DialogTitle>
          <DialogDescription className="dp-hint">{t("renameBody")}</DialogDescription>
          <label className="dp-field" htmlFor="rename-input">
            {t("noteTitleLabel")}
            <input id="rename-input" className="dp-input" type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveRename()} />
          </label>
          <div className="dp-actions">
            <button type="button" className="dp-btn dp-btn-quiet" onClick={() => setRenameOpen(false)}>
              {t("cancel")}
            </button>
            <button type="button" className="dp-btn dp-btn-primary" id="rename-save" onClick={saveRename}>
              {t("save")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "import" ? t("importTitle") : confirm?.kind === "deleteNote" ? t("deleteNoteTitle") : t("clearTitle")}
        body={confirm?.kind === "import" ? t("importBody", { n: confirm.parsed.notes.length }) : confirm?.kind === "deleteNote" ? t("deleteNoteBody") : t("clearBody")}
        confirmLabel={confirm?.kind === "import" ? t("importJson") : confirm?.kind === "deleteNote" ? t("delete") : t("clearAll")}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else if (confirm.kind === "deleteNote") doDeleteNote(confirm.id);
          else applyClearAll();
        }}
        onOpenChange={(o) => !o && setConfirm(null)}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
