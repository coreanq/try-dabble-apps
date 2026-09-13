import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { detectLang, HTML_LANG, isLang, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  buildDictionary,
  buildRestoreMap,
  cleanWords,
  parseDictionary,
  scrub,
  stampedName,
  toJSON,
  type Entity,
  type EntityType,
  type Segment,
} from "@/lib/scrub";
import { clearStore, copyText, defaultPrefs, download, loadDict, loadPrefs, saveDict, savePrefs, type Prefs } from "@/lib/store";
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

const CHIP_KEYS: MsgKey[] = ["chipNoSub", "chipPasteFirst", "chipOnDevice", "chipNoUpload", "chipNoAds", "chipNoAccount", "chipLangs"];
const TOAST_MS = 2200;
const DEBOUNCE_MS = 250;
const SAMPLE =
  "Hi, I'm Ada Lovelace. Email ada@example.com, phone +1 202-555-0147, card 4111 1111 1111 1111, IP 8.8.8.8, key sk-abcDEF1234567890xyz.\n\nAda Lovelace will present Project Phoenix on Monday. Ship the kit to 123 Main St, Apt 4B.";

function typeKey(type: EntityType): MsgKey {
  return `type${type}` as MsgKey;
}

function Runs({ segments, mode }: { segments: Segment[]; mode: "scrubbed" | "original" }) {
  return (
    <>
      {segments.map((s, i) =>
        s.type ? (
          mode === "scrubbed" ? (
            <mark key={i} className={`sp-token sp-token-${s.type}`} data-type={s.type}>
              {s.text}
            </mark>
          ) : (
            <mark key={i} className="sp-redact" data-type={s.type} title={s.token}>
              {s.text}
            </mark>
          )
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [dict, setDict] = useState<string[]>(() => loadDict());
  const [draft, setDraft] = useState<string>(() => loadPrefs().lastText);
  const [source, setSource] = useState<string>(() => loadPrefs().lastText);
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set());
  const [newWord, setNewWord] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const debounceTimer = useRef<number | undefined>(undefined);
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

  // Live scrub: the draft becomes the source a moment after typing stops.
  useEffect(() => {
    window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => setSource(draft), DEBOUNCE_MS);
    return () => window.clearTimeout(debounceTimer.current);
  }, [draft]);

  const result = useMemo(() => scrub(source, { customWords: dict, disabled }), [source, dict, disabled]);

  useEffect(() => {
    savePrefs({ ...prefs, lastText: source, lastScrubbed: result.scrubbed });
  }, [prefs, source, result.scrubbed]);
  useEffect(() => {
    saveDict(dict);
  }, [dict]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  const runScrub = () => {
    window.clearTimeout(debounceTimer.current);
    setSource(draft);
  };

  const toggle = (e: Entity) => {
    setDisabled((cur) => {
      const next = new Set(cur);
      if (next.has(e.key)) next.delete(e.key);
      else next.add(e.key);
      return next;
    });
  };
  const setAll = (on: boolean) => {
    setDisabled(on ? new Set() : new Set(result.entities.map((e) => e.key)));
  };

  const addWord = () => {
    const words = cleanWords([newWord]);
    if (!words.length) return;
    setDict((d) => cleanWords([...d, ...words]));
    setNewWord("");
  };
  const removeWord = (w: string) => setDict((d) => d.filter((x) => x !== w));

  const onCopy = async (text: string) => {
    showToast((await copyText(text)) ? t("copied") : t("copyFailed"));
  };

  const onDownloadScrubbed = () => {
    download(stampedName("scrubpad-scrubbed", "txt"), result.scrubbed, "text/plain;charset=utf-8");
    showToast(t("downloaded"));
  };

  const restoreJson = useMemo(() => toJSON(buildRestoreMap(result.map)), [result.map]);
  const hasMap = Object.keys(result.map).length > 0;

  const onDownloadMap = () => {
    download(stampedName("scrubpad-restore-map", "json"), restoreJson);
    showToast(t("downloaded"));
  };

  const onExportDict = () => {
    download(stampedName("scrubpad-dictionary", "json"), toJSON(buildDictionary(dict)));
    showToast(t("dictExported"));
  };

  const onImportFile = async (file: File) => {
    try {
      const words = parseDictionary(JSON.parse(await file.text()));
      if (!words) throw new Error("bad");
      setDict((d) => cleanWords([...d, ...words]));
      showToast(t("dictImported", { n: words.length }));
    } catch {
      showToast(t("dictImportBad"));
    }
  };

  const doClear = () => {
    clearStore();
    setPrefs(defaultPrefs());
    setDict([]);
    setDraft("");
    setSource("");
    setDisabled(new Set());
    showToast(t("cleared"));
  };

  const enabledCount = result.entities.filter((e) => !disabled.has(e.key)).length;

  return (
    <div className="sp-app" data-lang={lang}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <section className="sp-card sp-hero" id="paste-card" aria-labelledby="paste-label">
        <label className="sp-label" htmlFor="paste">
          <span id="paste-label">{t("pasteLabel")}</span>
          <textarea
            id="paste"
            className="sp-textarea"
            value={draft}
            placeholder={t("pastePlaceholder")}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <div className="sp-row wrap">
          <button type="button" className="sp-btn sp-btn-primary" id="btn-scrub" onClick={runScrub}>
            {t("scrubBtn")}
          </button>
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-sample" onClick={() => { setDraft(SAMPLE); setSource(SAMPLE); }}>
            {t("sampleBtn")}
          </button>
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-clear-text" onClick={() => { setDraft(""); setSource(""); }} disabled={!draft}>
            {t("clearTextBtn")}
          </button>
        </div>
        <p className="sp-hint sp-hint-local" id="on-device-note">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span>{t("onDeviceNote")}</span>
        </p>
      </section>

      <section className="sp-card" id="review-card" aria-labelledby="review-title">
        <div className="sp-card-head">
          <h2 id="review-title">{t("reviewTitle")}</h2>
          {result.entities.length > 0 && (
            <span className="sp-count" id="found-count">
              {t("foundCount", { n: result.entities.length })}
            </span>
          )}
        </div>
        <p className="sp-hint">{t("reviewHint")}</p>
        {source.trim().length === 0 ? (
          <p className="sp-hint" id="review-empty">{t("reviewEmpty")}</p>
        ) : result.entities.length === 0 ? (
          <p className="sp-hint" id="review-none">{t("reviewNone")}</p>
        ) : (
          <>
            <div className="sp-row wrap">
              <button type="button" className="sp-btn sp-btn-quiet" id="btn-check-all" onClick={() => setAll(true)} disabled={enabledCount === result.entities.length}>
                {t("checkAll")}
              </button>
              <button type="button" className="sp-btn sp-btn-quiet" id="btn-uncheck-all" onClick={() => setAll(false)} disabled={enabledCount === 0}>
                {t("uncheckAll")}
              </button>
            </div>
            <ul className="sp-review" id="review-list">
              {result.entities.map((e, i) => {
                const on = !disabled.has(e.key);
                const id = `hit-${i}`;
                return (
                  <li key={e.key} className={"sp-hit " + (on ? "is-on" : "is-off")} data-type={e.type} data-token={e.token}>
                    <input id={id} type="checkbox" checked={on} onChange={() => toggle(e)} aria-label={`${t(typeKey(e.type))}: ${e.original}`} />
                    <span className={`sp-badge sp-badge-${e.type}`}>{t(typeKey(e.type))}</span>
                    <label className="sp-hit-original" htmlFor={id}>{e.original}</label>
                    <span className="sp-hit-token">
                      <span className="sp-token">{e.token}</span>
                      {e.count > 1 && <span>{t("occurrences", { n: e.count })}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <h2 id="custom-title" className="text-[1em]!">{t("customTitle")}</h2>
        <p className="sp-hint">{t("customHint")}</p>
        <div className="sp-row">
          <input
            id="custom-word"
            className="sp-input"
            value={newWord}
            placeholder={t("customPlaceholder")}
            autoComplete="off"
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addWord();
              }
            }}
          />
          <button type="button" className="sp-btn sp-btn-stamp" id="btn-add-word" onClick={addWord} disabled={!newWord.trim()}>
            {t("addWord")}
          </button>
        </div>
        {dict.length === 0 ? (
          <p className="sp-hint" id="dict-empty">{t("dictEmpty")}</p>
        ) : (
          <ul className="sp-words" id="dict-list">
            {dict.map((w) => (
              <li key={w} className="sp-word">
                <span>{w}</span>
                <button type="button" aria-label={t("removeWord", { word: w })} onClick={() => removeWord(w)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="sp-row wrap">
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-dict-export" onClick={onExportDict} disabled={dict.length === 0}>
            {t("dictExport")}
          </button>
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-dict-import" onClick={() => fileRef.current?.click()}>
            {t("dictImport")}
          </button>
        </div>
        <input
          ref={fileRef}
          id="dict-file"
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

      <section className="sp-card" id="compare-card" aria-labelledby="compare-title">
        <h2 id="compare-title">{t("compareTitle")}</h2>
        <div className="sp-compare">
          <div className="sp-pane">
            <p className="sp-pane-title">{t("originalPane")}</p>
            <pre className="sp-pre" id="pane-original">
              {source ? <Runs segments={result.originalSegments} mode="original" /> : null}
            </pre>
          </div>
          <div className="sp-pane">
            <p className="sp-pane-title">{t("scrubbedPane")}</p>
            <pre className="sp-pre" id="pane-scrubbed">
              {source ? <Runs segments={result.segments} mode="scrubbed" /> : <span className="sp-hint">{t("scrubbedEmpty")}</span>}
            </pre>
          </div>
        </div>
        <div className="sp-row wrap">
          <button type="button" className="sp-btn sp-btn-primary" id="btn-copy" onClick={() => void onCopy(result.scrubbed)} disabled={!source}>
            {t("copyScrubbed")}
          </button>
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-download" onClick={onDownloadScrubbed} disabled={!source}>
            {t("downloadScrubbed")}
          </button>
        </div>
      </section>

      <section className="sp-card" id="restore-card" aria-labelledby="restore-title">
        <h2 id="restore-title">{t("restoreTitle")}</h2>
        <p className="sp-hint sp-hint-warn" id="restore-warn">{t("restoreWarn")}</p>
        <div className="sp-row wrap">
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-restore-toggle" onClick={() => setPrefs((p) => ({ ...p, showRestoreMap: !p.showRestoreMap }))}>
            {prefs.showRestoreMap ? t("restoreHide") : t("restoreShow")}
          </button>
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-restore-copy" onClick={() => void onCopy(restoreJson)} disabled={!hasMap}>
            {t("restoreCopy")}
          </button>
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-restore-download" onClick={onDownloadMap} disabled={!hasMap}>
            {t("restoreDownload")}
          </button>
        </div>
        {prefs.showRestoreMap && (hasMap ? <pre className="sp-pre sp-pre-json" id="restore-json">{restoreJson}</pre> : <p className="sp-hint" id="restore-empty">{t("restoreEmpty")}</p>)}
      </section>

      <section className="sp-card" id="settings-card" aria-labelledby="settings-title">
        <h2 id="settings-title">{t("settingsTitle")}</h2>
        <div className="sp-row wrap">
          <button type="button" className="sp-btn sp-btn-quiet" id="btn-keep-last" onClick={() => setPrefs((p) => ({ ...p, keepLast: !p.keepLast }))}>
            {prefs.keepLast ? t("keepLastOn") : t("keepLastOff")}
          </button>
          <button type="button" className="sp-btn sp-btn-danger" id="btn-clear" onClick={() => setConfirmClear(true)}>
            {t("clearAll")}
          </button>
        </div>
        <p className="sp-hint">{t("keepLastHint")}</p>
      </section>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="sp-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="sp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/scrubpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <ConfirmDialog
        open={confirmClear}
        title={t("clearAllTitle")}
        body={t("clearAllBody")}
        confirmLabel={t("clearAll")}
        cancelLabel={t("cancel")}
        onOpenChange={setConfirmClear}
        onConfirm={doClear}
      />
      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
