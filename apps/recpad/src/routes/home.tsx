import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { RenameDialog } from "@/components/rename-dialog";
import { Toast } from "@/components/toast";
import { Waveform, type Selection } from "@/components/waveform";
import {
  applyGain,
  cut,
  dbToGain,
  durationMs,
  encodeWav,
  formatTime,
  normalize,
  spectralGate,
  synthTone,
  trim,
  UndoStack,
} from "@/lib/audio";
import { deleteDraft, draftsSupported, getDraft, listDrafts, renameDraft, saveDraft, defaultDraftName, type DraftMeta } from "@/lib/drafts";
import { detectLang, HTML_LANG, isLang, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import { encodeMp3 } from "@/lib/mp3";
import { micSupported, Player, Recorder, type MicError, type Take } from "@/lib/recorder";
import { downloadBlob, loadPrefs, savePrefs, stampedName, type Prefs } from "@/lib/store";
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

const CHIP_KEYS: MsgKey[] = ["chipNoAds", "chipNoAccount", "chipNoiseFree", "chipExportFree", "chipOnDevice", "chipNoUpload", "chipLangs"];
const TOAST_MS = 2200;
const DEMO_RATE = 44100;
const NOISE_LEVELS: { key: MsgKey; value: number }[] = [
  { key: "noiseLight", value: 0.35 },
  { key: "noiseMedium", value: 0.6 },
  { key: "noiseStrong", value: 0.9 },
];

/** Three plucked notes over a soft hiss: enough to try trim, gate and export without a mic. */
function demoTake(): Take {
  const seconds = 4;
  const n = DEMO_RATE * seconds;
  const samples = new Float32Array(n);
  let seed = 7;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    samples[i] = ((seed / 0xffffffff) * 2 - 1) * 0.012;
  }
  const notes: [number, number][] = [
    [0.5, 220],
    [1.5, 277.18],
    [2.5, 329.63],
  ];
  for (const [at, freq] of notes) {
    const tone = synthTone(DEMO_RATE, 1.2, freq, 0.55);
    const start = Math.round(at * DEMO_RATE);
    for (let i = 0; i < tone.length && start + i < n; i++) samples[start + i] += tone[i] + 0.25 * Math.sin((2 * Math.PI * freq * 2 * i) / DEMO_RATE) * Math.exp(-(i / DEMO_RATE) * 3);
  }
  return { samples, sampleRate: DEMO_RATE };
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [take, setTake] = useState<Take | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recMs, setRecMs] = useState(0);
  const [recLevel, setRecLevel] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState<null | "noise" | "mp3">(null);
  const [undoCount, setUndoCount] = useState(0);
  const [micError, setMicError] = useState<MsgKey | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [draftName, setDraftName] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [replaceAction, setReplaceAction] = useState<(() => void) | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const recorderRef = useRef<Recorder | null>(null);
  const playerRef = useRef<Player | null>(null);
  const undoRef = useRef(new UndoStack());
  const canDrafts = useMemo(() => draftsSupported(), []);

  const recorder = () => (recorderRef.current ??= new Recorder());
  const player = () => (playerRef.current ??= new Player());

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);
  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      playerRef.current?.close();
    },
    [],
  );

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
    savePrefs(prefs);
  }, [prefs]);

  const refreshDrafts = useCallback(async () => {
    if (!canDrafts) return;
    try {
      setDrafts(await listDrafts());
    } catch {
      setDrafts([]);
    }
  }, [canDrafts]);
  useEffect(() => {
    void refreshDrafts();
  }, [refreshDrafts]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  const stopPlayback = useCallback(() => {
    if (!playerRef.current?.isPlaying) return;
    const pos = playerRef.current.stop();
    if (take) setPlayhead(Math.round(pos * take.sampleRate));
    setPlaying(false);
  }, [take]);

  /** Swaps in a fresh take and resets everything that pointed into the old one. */
  const installTake = (next: Take, draft?: DraftMeta) => {
    stopPlayback();
    undoRef.current.clear();
    setUndoCount(0);
    setTake(next);
    setSelection(null);
    setPlayhead(0);
    setCurrentDraftId(draft?.id ?? null);
    setDraftName(draft?.name ?? defaultDraftName());
  };

  const guarded = (action: () => void) => {
    if (take && !recording) setReplaceAction(() => action);
    else action();
  };

  const startRecording = async () => {
    setMicError(null);
    if (!micSupported()) {
      setMicError("micUnsupported");
      return;
    }
    stopPlayback();
    try {
      await recorder().start((level, ms) => {
        setRecLevel(level);
        setRecMs(ms);
      });
      setRecMs(0);
      setRecLevel(0);
      setRecording(true);
    } catch (e) {
      const code = ((e as Error).message || "busy") as MicError;
      setMicError(code === "denied" ? "micDenied" : code === "unsupported" ? "micUnsupported" : "micBusy");
    }
  };

  const stopRecording = async () => {
    const result = await recorder().stop();
    setRecording(false);
    installTake(result);
  };

  const togglePlay = async () => {
    if (!take || take.samples.length === 0) return;
    if (playing) {
      stopPlayback();
      return;
    }
    const sr = take.sampleRate;
    const total = take.samples.length;
    const from = selection ? selection[0] : playhead >= total - 1 ? 0 : playhead;
    const to = selection ? selection[1] : total;
    setPlaying(true);
    await player().play(
      take,
      from / sr,
      to / sr,
      (sec) => setPlayhead(Math.round(sec * sr)),
      () => setPlaying(false),
    );
  };

  /** Every destructive edit goes through here so undo always has the previous take. */
  const edit = (next: Float32Array, after: { selection?: Selection | null; playhead?: number }, toastKey: MsgKey) => {
    if (!take) return;
    stopPlayback();
    undoRef.current.push(take.samples);
    setUndoCount(undoRef.current.size);
    setTake({ samples: next, sampleRate: take.sampleRate });
    setSelection(after.selection === undefined ? null : after.selection);
    setPlayhead(Math.max(0, Math.min(next.length, after.playhead ?? 0)));
    showToast(t(toastKey));
  };

  const onTrim = () => {
    if (!take || !selection) return;
    edit(trim(take.samples, selection[0], selection[1]), { playhead: 0 }, "trimDone");
  };
  const onCut = () => {
    if (!take || !selection) return;
    edit(cut(take.samples, selection[0], selection[1]), { playhead: selection[0] }, "cutDone");
  };
  const onUndo = () => {
    if (!take) return;
    const prev = undoRef.current.pop();
    if (!prev) return;
    stopPlayback();
    setUndoCount(undoRef.current.size);
    setTake({ samples: prev, sampleRate: take.sampleRate });
    setSelection(null);
    setPlayhead((p) => Math.min(p, prev.length));
    showToast(t("undoDone"));
  };
  const onNoise = async () => {
    if (!take || busy) return;
    stopPlayback();
    setBusy("noise");
    // Let the busy state paint before the gate takes the thread.
    await new Promise((r) => setTimeout(r, 40));
    try {
      const cleaned = spectralGate(take.samples, take.sampleRate, { strength: prefs.noiseStrength });
      edit(cleaned, { selection, playhead }, "noiseDone");
    } finally {
      setBusy(null);
    }
  };
  const onGain = () => {
    if (!take) return;
    edit(applyGain(take.samples, dbToGain(prefs.gainDb)), { selection, playhead }, "gainDone");
  };
  const onNormalize = () => {
    if (!take) return;
    edit(normalize(take.samples), { selection, playhead }, "normalizeDone");
  };

  const onWav = () => {
    if (!take) return;
    try {
      downloadBlob(stampedName("recpad-take", "wav"), new Blob([encodeWav([take.samples], take.sampleRate)], { type: "audio/wav" }));
      showToast(t("exported"));
    } catch {
      showToast(t("exportFailed"));
    }
  };
  const onMp3 = async () => {
    if (!take || busy) return;
    setBusy("mp3");
    await new Promise((r) => setTimeout(r, 40));
    try {
      downloadBlob(stampedName("recpad-take", "mp3"), await encodeMp3(take.samples, take.sampleRate));
      showToast(t("exported"));
    } catch {
      showToast(t("exportFailed"));
    } finally {
      setBusy(null);
    }
  };

  const onSaveDraft = async () => {
    if (!take || !canDrafts) return;
    try {
      const meta = await saveDraft(draftName, take.samples, take.sampleRate, currentDraftId ?? undefined);
      setCurrentDraftId(meta.id);
      setDraftName(meta.name);
      await refreshDrafts();
      showToast(t("draftSaved"));
    } catch {
      showToast(t("draftFailed"));
    }
  };
  const openDraft = (id: string) =>
    guarded(async () => {
      try {
        const d = await getDraft(id);
        if (!d) return;
        installTake({ samples: d.samples, sampleRate: d.sampleRate }, d.meta);
        showToast(t("draftOpened"));
      } catch {
        showToast(t("draftFailed"));
      }
    });
  const doDelete = async () => {
    if (!deleteId) return;
    await deleteDraft(deleteId);
    if (currentDraftId === deleteId) setCurrentDraftId(null);
    await refreshDrafts();
    showToast(t("draftDeleted"));
  };
  const doRename = async (name: string) => {
    if (!renameId) return;
    await renameDraft(renameId, name);
    if (currentDraftId === renameId) setDraftName(name);
    await refreshDrafts();
    showToast(t("draftRenamed"));
  };

  const loadDemo = () =>
    guarded(() => {
      installTake(demoTake());
      showToast(t("demoLoaded"));
    });

  const sr = take?.sampleRate ?? DEMO_RATE;
  const lengthMs = take ? durationMs(take.samples.length, sr) : 0;
  const hasTake = !!take && take.samples.length > 0;
  const renameTarget = drafts.find((d) => d.id === renameId);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(lang === "en" ? "en-US" : lang === "ja" ? "ja-JP" : lang === "zh" ? "zh-CN" : "ko-KR", { dateStyle: "medium", timeStyle: "short" }), [lang]);

  return (
    <div className="rp-app" data-lang={lang}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <section className="rp-card rp-hero" id="record-card" aria-labelledby="record-title">
        <div className="rp-card-head">
          <h2 id="record-title">{t("recordTitle")}</h2>
          {recording && (
            <span className="rp-rec-live" id="rec-live">
              {t("recording")} {formatTime(recMs)}
            </span>
          )}
        </div>
        <div className="rp-transport" id="transport">
          {recording ? (
            <button type="button" className="rp-btn rp-btn-stop" id="btn-stop" onClick={() => void stopRecording()}>
              <span className="rp-square" aria-hidden="true" />
              {t("stop")}
            </button>
          ) : (
            <button type="button" className="rp-btn rp-btn-record" id="btn-record" onClick={() => guarded(() => void startRecording())} disabled={!!busy}>
              <span className="rp-dot" aria-hidden="true" />
              {t("record")}
            </button>
          )}
          {playing ? (
            <button type="button" className="rp-btn rp-btn-play rp-btn-primary" id="btn-pause" onClick={() => void togglePlay()}>
              {t("pause")}
            </button>
          ) : (
            <button type="button" className="rp-btn rp-btn-play rp-btn-primary" id="btn-play" onClick={() => void togglePlay()} disabled={!hasTake || recording || !!busy}>
              {t("play")}
            </button>
          )}
          <button type="button" className="rp-btn rp-btn-quiet" id="btn-demo" onClick={loadDemo} disabled={recording || !!busy}>
            {t("demoBtn")}
          </button>
        </div>
        {micError && (
          <p className="rp-hint rp-hint-warn" id="mic-error" role="alert">
            {t(micError)}
          </p>
        )}
        <p className="rp-hint">{t("recordHint")}</p>

        <Waveform
          samples={take?.samples ?? null}
          sampleRate={sr}
          selection={selection}
          playhead={playhead}
          recording={recording}
          level={recLevel}
          emptyText={t("waveEmpty")}
          onSelect={setSelection}
          onSeek={(s) => {
            stopPlayback();
            setPlayhead(s);
          }}
        />
        <dl className="rp-times" id="times">
          <div>
            <dt>{t("lengthLabel")}</dt>
            <dd id="time-length">{formatTime(lengthMs)}</dd>
          </div>
          <div>
            <dt>{t("playheadLabel")}</dt>
            <dd id="time-playhead">{formatTime(durationMs(playhead, sr))}</dd>
          </div>
          <div>
            <dt>{t("selectionLabel")}</dt>
            <dd id="time-selection">
              {selection ? `${formatTime(durationMs(selection[0], sr))} – ${formatTime(durationMs(selection[1], sr))}` : t("selectionNone")}
            </dd>
          </div>
        </dl>
        <p className="rp-hint">{t("waveHint")}</p>
        <p className="rp-hint rp-hint-local" id="on-device-note">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span>{t("micNote")}</span>
        </p>
      </section>

      <section className="rp-card" id="edit-card" aria-labelledby="edit-title">
        <h2 id="edit-title">{t("editTitle")}</h2>
        <div className="rp-row wrap">
          <button type="button" className="rp-btn rp-btn-teal" id="btn-trim" onClick={onTrim} disabled={!hasTake || !selection || !!busy || recording}>
            {t("trim")}
          </button>
          <button type="button" className="rp-btn rp-btn-quiet" id="btn-cut" onClick={onCut} disabled={!hasTake || !selection || !!busy || recording}>
            {t("cutSel")}
          </button>
          <button type="button" className="rp-btn rp-btn-quiet" id="btn-clear-sel" onClick={() => setSelection(null)} disabled={!selection}>
            {t("clearSel")}
          </button>
          <button type="button" className="rp-btn rp-btn-quiet" id="btn-undo" onClick={onUndo} disabled={undoCount === 0 || !!busy || recording}>
            {t("undo")} {undoCount > 0 ? `(${undoCount})` : ""}
          </button>
        </div>

        <div className="rp-grid-2">
          <div className="rp-sub" id="noise-sub">
            <h3>{t("noiseTitle")}</h3>
            <p className="rp-hint">{t("noiseHint")}</p>
            <div className="rp-row wrap">
              <label className="rp-label" htmlFor="noise-strength">
                {t("noiseStrength")}
              </label>
              <select
                id="noise-strength"
                className="rp-select"
                value={String(prefs.noiseStrength)}
                onChange={(e) => setPrefs((p) => ({ ...p, noiseStrength: Number(e.target.value) }))}
              >
                {NOISE_LEVELS.map((l) => (
                  <option key={l.key} value={String(l.value)}>
                    {t(l.key)}
                  </option>
                ))}
              </select>
              <button type="button" className="rp-btn rp-btn-primary" id="btn-noise" onClick={() => void onNoise()} disabled={!hasTake || !!busy || recording}>
                {t("noiseBtn")}
              </button>
            </div>
            {busy === "noise" && (
              <span className="rp-busy" id="noise-busy" role="status">
                {t("noiseBusy")}
              </span>
            )}
          </div>

          <div className="rp-sub" id="gain-sub">
            <h3>{t("gainTitle")}</h3>
            <div className="rp-row wrap">
              <label className="rp-label" htmlFor="gain-db">
                {t("gainLabel")}
              </label>
              <input
                id="gain-db"
                className="rp-input rp-input-narrow"
                type="number"
                inputMode="decimal"
                step="1"
                min="-24"
                max="24"
                value={prefs.gainDb}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setPrefs((p) => ({ ...p, gainDb: Math.max(-24, Math.min(24, v)) }));
                }}
              />
              <button type="button" className="rp-btn rp-btn-quiet" id="btn-gain" onClick={onGain} disabled={!hasTake || !!busy || recording}>
                {t("gainApply")}
              </button>
            </div>
            <div className="rp-row wrap">
              <button type="button" className="rp-btn rp-btn-primary" id="btn-normalize" onClick={onNormalize} disabled={!hasTake || !!busy || recording}>
                {t("normalize")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rp-card" id="export-card" aria-labelledby="export-title">
        <h2 id="export-title">{t("exportTitle")}</h2>
        <p className="rp-hint">{t("exportHint")}</p>
        <div className="rp-row wrap">
          <button type="button" className="rp-btn rp-btn-teal" id="btn-wav" onClick={onWav} disabled={!hasTake || !!busy || recording}>
            {t("downloadWav")}
          </button>
          <button type="button" className="rp-btn rp-btn-teal" id="btn-mp3" onClick={() => void onMp3()} disabled={!hasTake || !!busy || recording}>
            {t("downloadMp3")}
          </button>
          {busy === "mp3" && (
            <span className="rp-busy" id="mp3-busy" role="status">
              {t("mp3Busy")}
            </span>
          )}
        </div>
      </section>

      <section className="rp-card" id="drafts-card" aria-labelledby="drafts-title">
        <h2 id="drafts-title">{t("draftsTitle")}</h2>
        <p className="rp-hint">{t("draftsHint")}</p>
        {canDrafts ? (
          <>
            <div className="rp-row wrap">
              <label className="sr-only" htmlFor="draft-name">
                {t("draftNameLabel")}
              </label>
              <input
                id="draft-name"
                className="rp-input"
                value={draftName}
                placeholder={t("draftNamePlaceholder")}
                autoComplete="off"
                onChange={(e) => setDraftName(e.target.value)}
              />
              <button type="button" className="rp-btn rp-btn-primary" id="btn-save-draft" onClick={() => void onSaveDraft()} disabled={!hasTake || recording || !!busy}>
                {currentDraftId ? t("updateDraft") : t("saveDraft")}
              </button>
            </div>
            {drafts.length === 0 ? (
              <p className="rp-hint" id="drafts-empty">
                {t("draftsEmpty")}
              </p>
            ) : (
              <ul className="rp-drafts" id="draft-list">
                {drafts.map((d) => (
                  <li key={d.id} className={"rp-draft " + (d.id === currentDraftId ? "is-current" : "")} data-id={d.id}>
                    <span className="rp-draft-name">{d.name}</span>
                    <span className="rp-draft-meta">
                      {formatTime(d.durationMs)} · {dateFmt.format(d.updatedAt)}
                    </span>
                    <span className="rp-draft-actions">
                      <button type="button" className="rp-btn rp-btn-quiet" onClick={() => openDraft(d.id)} disabled={recording || !!busy} data-action="open">
                        {t("open")}
                      </button>
                      <button type="button" className="rp-btn rp-btn-quiet" onClick={() => setRenameId(d.id)} data-action="rename">
                        {t("rename")}
                      </button>
                      <button type="button" className="rp-btn rp-btn-danger" onClick={() => setDeleteId(d.id)} data-action="delete">
                        {t("deleteDraft")}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="rp-hint" id="drafts-unsupported">
            {t("draftsUnsupported")}
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="rp-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="rp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/recpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <ConfirmDialog
        open={deleteId !== null}
        title={t("deleteTitle")}
        body={t("deleteBody")}
        confirmLabel={t("deleteDraft")}
        cancelLabel={t("cancel")}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => void doDelete()}
      />
      <ConfirmDialog
        open={replaceAction !== null}
        title={t("replaceTitle")}
        body={t("replaceBody")}
        confirmLabel={t("replaceOk")}
        cancelLabel={t("cancel")}
        destructive={false}
        onOpenChange={(open) => {
          if (!open) setReplaceAction(null);
        }}
        onConfirm={() => {
          replaceAction?.();
        }}
      />
      <RenameDialog
        open={renameId !== null}
        title={t("renameTitle")}
        label={t("draftNameLabel")}
        initial={renameTarget?.name ?? ""}
        saveLabel={t("save")}
        cancelLabel={t("cancel")}
        onOpenChange={(open) => {
          if (!open) setRenameId(null);
        }}
        onSave={(name) => void doRename(name)}
      />
      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
