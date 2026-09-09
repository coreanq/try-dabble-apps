import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Hand,
  Images,
  Shuffle,
  SwitchCamera,
  Users,
  Volume2,
} from "lucide-react";

import { GhostOverlay } from "@/components/ghost-overlay";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PoseLibrary } from "@/components/pose-library";
import { ScoreRing } from "@/components/score-ring";
import { Toast } from "@/components/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cameraSupported, classifyError, openCamera, stopStream, type CameraState } from "@/lib/camera";
import { captureFileName, downloadBlob, frameIsBlack, frameToBlob } from "@/lib/capture";
import { loadDetector, type Detector } from "@/lib/detector";
import {
  HTML_LANG,
  OG_IMAGE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import { matchBand, matchScore, smoothScore, updateHold, type HoldState, type MatchResult } from "@/lib/match";
import { POSES, filterPoses, findPose, randomPose, stepPose, type CategoryFilter, type Pose } from "@/lib/poses";
import {
  bumpStreak,
  effectiveFacing,
  loadPrefs,
  loadRecent,
  loadStreak,
  pushRecent,
  savePrefs,
  saveRecent,
  saveStreak,
  type Composition,
  type Prefs,
  type RecentCapture,
  type Streak,
} from "@/lib/prefs";
import { speak, speechSupported, stopSpeaking } from "@/lib/voice";
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
  "chipFreePoses",
  "chipNoSub",
  "chipAutoOff",
  "chipCameraRetry",
  "chipMaleFemale",
  "chipLocal",
  "chipLangs",
];
const COMPOSITIONS: Composition[] = ["off", "thirds", "center"];
const COMP_KEY: Record<Composition, MsgKey> = { off: "compOff", thirds: "compThirds", center: "compCenter" };
const TOAST_MS = 2200;
const DETECT_INTERVAL_MS = 80;
const BURST_GAP_MS = 450;

type MatchState = "off" | "loading" | "on" | "unavailable";

function CompositionGuide({ mode }: { mode: Composition }) {
  if (mode === "off") return null;
  return (
    <svg className="pg-comp" viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {mode === "thirds" ? (
        <g stroke="rgba(255,247,245,0.75)" strokeWidth="0.4">
          <line x1="33.3" y1="0" x2="33.3" y2="133" />
          <line x1="66.6" y1="0" x2="66.6" y2="133" />
          <line x1="0" y1="44.3" x2="100" y2="44.3" />
          <line x1="0" y1="88.6" x2="100" y2="88.6" />
        </g>
      ) : (
        <g stroke="rgba(255,247,245,0.75)" strokeWidth="0.4">
          <line x1="50" y1="0" x2="50" y2="133" />
          <line x1="0" y1="66.5" x2="100" y2="66.5" />
          <circle cx="50" cy="66.5" r="10" fill="none" />
        </g>
      )}
    </svg>
  );
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [stranger, setStranger] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>(() => (cameraSupported() ? "idle" : "unsupported"));
  const [matchState, setMatchState] = useState<MatchState>("off");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [smooth, setSmooth] = useState<number | null>(null);
  const [live, setLive] = useState<MatchResult["perJoint"] | null>(null);
  const [liveKp, setLiveKp] = useState<{ name: string; x: number; y: number; score?: number }[] | null>(null);
  const [step, setStep] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [recent, setRecent] = useState<RecentCapture[]>(() => loadRecent());
  const [streak, setStreak] = useState<Streak | null>(() => loadStreak());
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const loopRef = useRef<number | undefined>(undefined);
  const holdRef = useRef<HoldState>({ since: null });
  const toastTimer = useRef<number | undefined>(undefined);
  const blackTimer = useRef<number | undefined>(undefined);
  const busyRef = useRef(false);
  const startSeq = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (search.lang !== lang) {
      navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
    }
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  /* ---------------- pose selection ---------------- */

  const filtered = useMemo(
    () => filterPoses(POSES, { category: prefs.category as CategoryFilter, gender: prefs.genderFilter }),
    [prefs.category, prefs.genderFilter],
  );
  const pose: Pose = useMemo(() => findPose(prefs.poseId) ?? filtered[0] ?? POSES[0], [prefs.poseId, filtered]);

  const selectPose = useCallback(
    (p: Pose) => {
      commitPrefs({ ...prefs, poseId: p.id });
      setStep(0);
      holdRef.current.since = null;
      if (prefs.voiceOn) speak(p.voiceSteps[0][lang], lang);
    },
    [commitPrefs, prefs, lang],
  );

  const facing = effectiveFacing(prefs, stranger);
  const mirror = facing === "user";

  /* ---------------- camera ---------------- */

  const stopCamera = useCallback(() => {
    window.clearTimeout(blackTimer.current);
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (nextFacing: typeof facing) => {
      const seq = ++startSeq.current;
      stopCamera();
      setCameraState("starting");
      try {
        const stream = await openCamera(nextFacing);
        if (seq !== startSeq.current) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          try {
            await v.play();
          } catch {
            /* autoplay policies: the user tapped, so this normally resolves */
          }
        }
        setCameraState("live");
        // Some phones hand over a stream that never paints. Check once.
        window.clearTimeout(blackTimer.current);
        blackTimer.current = window.setTimeout(() => {
          if (seq !== startSeq.current || !videoRef.current) return;
          if (frameIsBlack(videoRef.current)) setCameraState("black");
        }, 1800);
      } catch (err) {
        if (seq !== startSeq.current) return;
        setCameraState(classifyError(err));
      }
    },
    [stopCamera],
  );

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Facing changed while live (flip, Stranger Mode on/off): reopen.
  const liveRef = useRef(false);
  liveRef.current = cameraState === "live" || cameraState === "black";
  useEffect(() => {
    if (liveRef.current) void startCamera(facing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const cameraLive = cameraState === "live";

  /* ---------------- match ---------------- */

  const enableMatch = useCallback(async () => {
    if (matchState === "on" || matchState === "loading") return;
    setMatchState("loading");
    try {
      detectorRef.current = await loadDetector();
      setMatchState("on");
    } catch {
      setMatchState("unavailable");
    }
  }, [matchState]);

  const disableMatch = useCallback(() => {
    setMatchState("off");
    setMatch(null);
    setSmooth(null);
    setLive(null);
    setLiveKp(null);
    holdRef.current.since = null;
  }, []);

  const poseRef = useRef(pose);
  poseRef.current = pose;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  /* ---------------- capture ---------------- */

  const doCapture = useCallback(
    async (burst: number) => {
      const v = videoRef.current;
      if (!v || busyRef.current || !liveRef.current) return;
      busyRef.current = true;
      try {
        const at = new Date();
        let saved = 0;
        for (let i = 0; i < burst; i += 1) {
          if (i > 0) await new Promise((r) => window.setTimeout(r, BURST_GAP_MS));
          const blob = await frameToBlob(v, facing);
          if (!blob) continue;
          setFlash(true);
          window.setTimeout(() => setFlash(false), 260);
          downloadBlob(blob, captureFileName(poseRef.current.id, at, burst > 1 ? i : undefined));
          saved += 1;
        }
        if (saved > 0) {
          const entry: RecentCapture = { poseId: poseRef.current.id, at: at.toISOString() };
          if (saved > 1) entry.burst = saved;
          const next = pushRecent(loadRecent(), entry);
          saveRecent(next);
          setRecent(next);
          const s = bumpStreak(loadStreak(), at);
          saveStreak(s);
          setStreak(s);
          showToast(saved > 1 ? t("capturedBurst") : t("captured"));
        }
      } finally {
        busyRef.current = false;
      }
    },
    [facing, showToast, t],
  );

  const doCaptureRef = useRef(doCapture);
  doCaptureRef.current = doCapture;

  const autoFire = useCallback(() => {
    if (countdown !== null || busyRef.current) return;
    let n = 3;
    setCountdown(n);
    const tick = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(tick);
        setCountdown(null);
        void doCaptureRef.current(1);
      } else {
        setCountdown(n);
      }
    }, 700);
  }, [countdown]);
  const autoFireRef = useRef(autoFire);
  autoFireRef.current = autoFire;

  // Detection loop: only while Match is on and the camera is live.
  useEffect(() => {
    if (matchState !== "on" || !cameraLive) return;
    let cancelled = false;
    let prev: number | null = null;
    const run = async () => {
      if (cancelled) return;
      const v = videoRef.current;
      const det = detectorRef.current;
      if (v && det && v.readyState >= 2) {
        try {
          const kp = await det.estimate(v);
          if (cancelled) return;
          const res = matchScore(kp, poseRef.current.keypoints);
          prev = smoothScore(prev, res.score);
          setMatch(res);
          setSmooth(prev);
          setLive(res.perJoint);
          setLiveKp(kp);
          const fire = updateHold(holdRef.current, prev, performance.now());
          if (fire && prefsRef.current.autoCapture) autoFireRef.current();
        } catch {
          /* one bad frame is not a reason to stop */
        }
      }
      if (!cancelled) loopRef.current = window.setTimeout(run, DETECT_INTERVAL_MS);
    };
    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(loopRef.current);
    };
  }, [matchState, cameraLive]);

  /* ---------------- voice ---------------- */

  const steps = pose.voiceSteps;
  const stepText = steps[Math.min(step, steps.length - 1)][lang];

  const goStep = useCallback(
    (dir: 1 | -1) => {
      const next = (step + dir + steps.length) % steps.length;
      setStep(next);
      if (prefs.voiceOn) speak(steps[next][lang], lang);
    },
    [step, steps, prefs.voiceOn, lang],
  );

  const toggleVoice = useCallback(
    (on: boolean) => {
      commitPrefs({ ...prefs, voiceOn: on });
      if (on) speak(stepText, lang);
      else stopSpeaking();
    },
    [commitPrefs, prefs, stepText, lang],
  );

  useEffect(() => () => stopSpeaking(), []);

  /* ---------------- stranger mode ---------------- */

  const toggleStranger = useCallback(
    (on: boolean) => {
      setStranger(on);
      if (on) {
        disableMatch();
        stopSpeaking();
      }
    },
    [disableMatch],
  );

  const band = smooth !== null ? matchBand(smooth) : null;
  const matchLabel =
    matchState === "unavailable"
      ? t("matchUnavailable")
      : matchState === "loading"
        ? t("matchLoading")
        : matchState === "on" && !cameraLive
          ? t("matchNeedsCamera")
          : matchState === "on" && match?.score === null
            ? t("matchNoPerson")
            : band === "great"
              ? t("matchGreat")
              : band === "good"
                ? t("matchGood")
                : band === "adjust"
                  ? t("matchAdjust")
                  : "";

  return (
    <div className="pg-app" data-size={prefs.fontSize} data-stranger={stranger ? "true" : "false"}>
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
      />

      <Card id="studio">
        <CardHeader>
          <CardTitle className="sr-only">{t("title")}</CardTitle>
          <div className="pg-pose-strip" id="pose-strip">
            <button type="button" id="open-library" className="pg-iconbtn" aria-label={t("library")} title={t("library")} onClick={() => setLibraryOpen(true)}>
              <Images className="size-5" aria-hidden />
            </button>
            <div className="pg-pose-name">
              <strong id="pose-name">{pose.name[lang]}</strong>
              <small id="pose-meta">
                {t("currentPose")} · {t(pose.gender === "male" ? "tagMale" : pose.gender === "female" ? "tagFemale" : "tagAny")}
                {(pose.seated || pose.adaptive) && ` · ${t("tagSeated")}`}
              </small>
            </div>
            {!stranger && (
              <>
                <button type="button" id="pose-prev" className="pg-iconbtn" aria-label={t("prev")} title={t("prev")} onClick={() => { const p = stepPose(filtered, pose.id, -1); if (p) selectPose(p); }}>
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button type="button" id="pose-random" className="pg-iconbtn" aria-label={t("random")} title={t("random")} onClick={() => { const p = randomPose(filtered, pose.id); if (p) selectPose(p); }}>
                  <Shuffle className="size-5" aria-hidden />
                </button>
                <button type="button" id="pose-next" className="pg-iconbtn" aria-label={t("next")} title={t("next")} onClick={() => { const p = stepPose(filtered, pose.id, 1); if (p) selectPose(p); }}>
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="grid gap-[0.7rem]">
          <div className="pg-viewfinder" id="viewfinder" data-state={cameraState} data-facing={facing}>
            <video ref={videoRef} playsInline muted autoPlay data-mirror={mirror ? "true" : "false"} aria-label={t("title")} />
            <GhostOverlay keypoints={pose.keypoints} opacity={prefs.overlayOpacity} live={liveKp} perJoint={live ?? undefined} mirror={mirror} />
            <CompositionGuide mode={prefs.composition} />

            {stranger ? (
              <span className="pg-vf-badge" data-tone="leaf" id="stranger-badge">
                <Users className="size-3.5" aria-hidden />
                {t("strangerMode")}
              </span>
            ) : (
              <span className="pg-vf-badge" id="facing-badge">
                <Camera className="size-3.5" aria-hidden />
                {facing === "user" ? t("facingFront") : t("facingRear")}
              </span>
            )}

            {matchState !== "off" && !stranger && (
              <ScoreRing score={matchState === "on" && cameraLive ? smooth : null} band={band} label={t("matchLabel")} />
            )}

            {!stranger && (
              <div className="pg-hand-chip" id="hand-tip">
                <Hand className="size-4" aria-hidden />
                <span>
                  <strong>{t("handTip")}:</strong> {pose.handTip[lang]}
                </span>
              </div>
            )}

            {countdown !== null && <div className="pg-countdown" aria-live="assertive">{countdown}</div>}
            <div className="pg-flash" data-on={flash ? "true" : "false"} />

            {cameraState !== "live" && (
              <div className="pg-camera-state" id="camera-state" role="status">
                {cameraState === "idle" && (
                  <>
                    <p>{t("cameraIdleHint")}</p>
                    <div className="pg-state-actions">
                      <button type="button" id="allow-camera" className="pg-filter" onClick={() => void startCamera(facing)}>
                        {t("allowCamera")}
                      </button>
                    </div>
                  </>
                )}
                {cameraState === "starting" && <p>{t("cameraStarting")}</p>}
                {cameraState === "denied" && (
                  <>
                    <h2>{t("cameraDeniedTitle")}</h2>
                    <p id="camera-help">{t("cameraDeniedBody")}</p>
                    <div className="pg-state-actions">
                      <button type="button" id="retry-camera" className="pg-filter" onClick={() => void startCamera(facing)}>
                        {t("retryCamera")}
                      </button>
                    </div>
                  </>
                )}
                {cameraState === "error" && (
                  <>
                    <h2>{t("cameraErrorTitle")}</h2>
                    <p id="camera-help">{t("cameraErrorBody")}</p>
                    <div className="pg-state-actions">
                      <button type="button" id="retry-camera" className="pg-filter" onClick={() => void startCamera(facing)}>
                        {t("retryCamera")}
                      </button>
                      <button type="button" id="retry-flip" className="pg-filter" onClick={() => commitPrefs({ ...prefs, facing: prefs.facing === "user" ? "environment" : "user" })}>
                        {t("flip")}
                      </button>
                    </div>
                  </>
                )}
                {cameraState === "black" && (
                  <>
                    <h2>{t("cameraBlackTitle")}</h2>
                    <p id="camera-help">{t("cameraBlackBody")}</p>
                    <div className="pg-state-actions">
                      <button type="button" id="retry-camera" className="pg-filter" onClick={() => void startCamera(facing)}>
                        {t("retryCamera")}
                      </button>
                      <button type="button" id="retry-flip" className="pg-filter" onClick={() => commitPrefs({ ...prefs, facing: prefs.facing === "user" ? "environment" : "user" })}>
                        {t("flip")}
                      </button>
                    </div>
                  </>
                )}
                {cameraState === "unsupported" && <p id="camera-help">{t("cameraUnsupported")}</p>}
              </div>
            )}
          </div>

          {stranger ? (
            <>
              <button type="button" id="capture-burst" className="pg-shutter-burst" disabled={!cameraLive} onClick={() => void doCapture(3)}>
                <Camera className="size-6" aria-hidden />
                {t("captureBurst")}
              </button>
              <p className="pg-hint" id="stranger-hint">{t("strangerHint")}</p>
              <button type="button" id="stranger-exit" className="pg-filter" onClick={() => toggleStranger(false)}>
                {t("strangerExit")}
              </button>
            </>
          ) : (
            <>
              <div className="pg-controls" id="controls">
                <div className="pg-side">
                  <button
                    type="button"
                    id="flip-camera"
                    className="pg-iconbtn"
                    aria-label={t("flip")}
                    title={t("flip")}
                    onClick={() => commitPrefs({ ...prefs, facing: prefs.facing === "user" ? "environment" : "user" })}
                  >
                    <SwitchCamera className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    id="toggle-match"
                    className="pg-iconbtn"
                    aria-pressed={matchState === "on" || matchState === "loading"}
                    aria-label={t("matchLabel")}
                    title={t("matchLabel")}
                    onClick={() => (matchState === "on" || matchState === "loading" ? disableMatch() : void enableMatch())}
                  >
                    <span className="text-[0.7em] font-extrabold">%</span>
                  </button>
                </div>
                <button type="button" id="capture" className="pg-shutter" aria-label={t("capture")} title={t("capture")} disabled={!cameraLive} onClick={() => void doCapture(1)}>
                  <Camera className="size-7" aria-hidden />
                </button>
                <div className="pg-side">
                  <button
                    type="button"
                    id="toggle-voice"
                    className="pg-iconbtn"
                    aria-pressed={prefs.voiceOn}
                    aria-label={t("voiceCoach")}
                    title={t("voiceCoach")}
                    onClick={() => toggleVoice(!prefs.voiceOn)}
                  >
                    <Volume2 className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    id="toggle-stranger"
                    className="pg-iconbtn"
                    aria-pressed={stranger}
                    aria-label={t("strangerMode")}
                    title={t("strangerMode")}
                    onClick={() => toggleStranger(true)}
                  >
                    <Users className="size-5" aria-hidden />
                  </button>
                </div>
              </div>

              {cameraLive && cameraState === "live" && (
                <button type="button" id="stop-camera" className="pg-filter justify-self-center" onClick={() => { stopCamera(); setCameraState("idle"); }}>
                  {t("stopCamera")}
                </button>
              )}

              <p className="pg-hint" id="match-status" aria-live="polite">
                {matchState === "off" ? t("matchOn") + " → %" : matchLabel}
              </p>

              <div>
                <div className="flex items-center justify-between">
                  <label className="pg-field-label" htmlFor="opacity">
                    {t("overlayOpacity")}
                  </label>
                  <span className="pg-hint tabular-nums" id="opacity-value">{Math.round(prefs.overlayOpacity * 100)}%</span>
                </div>
                <Slider
                  id="opacity"
                  aria-label={t("overlayOpacity")}
                  min={10}
                  max={100}
                  step={5}
                  value={[Math.round(prefs.overlayOpacity * 100)]}
                  onValueChange={(v) => commitPrefs({ ...prefs, overlayOpacity: v[0] / 100 })}
                />
              </div>

              <div className="pg-voice" id="voice-panel">
                <div className="pg-row">
                  <div className="pg-row-label">
                    <strong>{t("voiceCoach")}</strong>
                    {!speechSupported() && <small id="voice-unavailable">{t("voiceUnavailable")}</small>}
                  </div>
                  <Switch id="voice-switch" checked={prefs.voiceOn} onCheckedChange={toggleVoice} aria-label={t("voiceCoach")} />
                </div>
                <p className="pg-voice-step" id="voice-step">{stepText}</p>
                <div className="pg-voice-nav">
                  <button type="button" id="voice-prev" className="pg-filter" onClick={() => goStep(-1)}>{t("voicePrev")}</button>
                  <button type="button" id="voice-next" className="pg-filter" onClick={() => goStep(1)}>{t("voiceNext")}</button>
                  <button type="button" id="voice-speak" className="pg-filter" disabled={!speechSupported()} onClick={() => speak(stepText, lang)}>{t("voiceSpeak")}</button>
                  <span className="pg-count">{t("voiceStep", { n: step + 1, total: steps.length })}</span>
                </div>
              </div>

              <div className="pg-row" id="auto-capture-row">
                <div className="pg-row-label">
                  <strong>{t("autoCapture")}</strong>
                  <small>{prefs.autoCapture && matchState !== "on" ? t("autoCaptureNeedsMatch") : t("autoCaptureHint")}</small>
                </div>
                <Switch id="auto-capture" checked={prefs.autoCapture} onCheckedChange={(on) => commitPrefs({ ...prefs, autoCapture: on })} aria-label={t("autoCapture")} />
              </div>

              <div className="pg-row" id="composition-row">
                <div className="pg-row-label">
                  <strong>{t("composition")}</strong>
                </div>
                <div className="pg-seg" role="group" aria-label={t("composition")}>
                  {COMPOSITIONS.map((c) => (
                    <button key={c} type="button" id={`comp-${c}`} aria-pressed={prefs.composition === c} onClick={() => commitPrefs({ ...prefs, composition: c })}>
                      {t(COMP_KEY[c])}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="pg-field-label">{t("tips")}</span>
                <ul className="pg-tips" id="pose-tips">
                  {pose.tips.map((tip, i) => (
                    <li key={i}>{tip[lang]}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="pg-field-label">{t("recentCaptures")}{streak && streak.count > 0 ? ` · ${t("streak", { n: streak.count })}` : ""}</span>
                {recent.length === 0 ? (
                  <p className="pg-hint" id="recent-empty">{t("recentEmpty")}</p>
                ) : (
                  <ul className="pg-recent" id="recent-list">
                    {recent.map((r, i) => (
                      <li key={`${r.at}-${i}`}>
                        {findPose(r.poseId)?.name[lang] ?? r.poseId}
                        {r.burst ? ` ×${r.burst}` : ""} · {new Date(r.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="pg-hint mt-1" id="save-hint">{t("saveHint")}</p>
              </div>

              <p className="m-0 text-[0.78em] leading-5 text-ink-muted" id="about-text">{t("about")}</p>
              <p className="m-0 text-[0.72em] leading-5 text-ink-muted" id="not-included">{t("notIncluded")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="pg-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.8em] text-ink-muted">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/poseguide`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <PoseLibrary
        open={libraryOpen}
        lang={lang}
        t={t}
        category={prefs.category}
        gender={prefs.genderFilter}
        selectedId={pose.id}
        onCategory={(c) => commitPrefs({ ...prefs, category: c })}
        onGender={(g) => commitPrefs({ ...prefs, genderFilter: g })}
        onOpenChange={setLibraryOpen}
        onPick={selectPose}
      />
    </div>
  );
}
