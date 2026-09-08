/**
 * One <audio> element for the whole app, wrapped in a hook.
 *
 * The element is created once and never rendered; it plays object URLs of
 * files pulled out of OPFS. On the first user-started play a Web Audio graph
 * is spliced in: source → low shelf (200 Hz) → peaking (1 kHz) → high shelf
 * (4 kHz) → speakers. That is the equalizer. Playback speed is the element's
 * own playbackRate (pitch preserved by the browser). Nothing here decides
 * what plays next; the caller listens to `onEnded` and asks the queue.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { EqBands } from "@/lib/library";

export type Phase = "idle" | "playing" | "paused";

type Graph = {
  ctx: AudioContext;
  filters: [BiquadFilterNode, BiquadFilterNode, BiquadFilterNode];
};

export function usePlayer(opts: {
  speed: number;
  eqBands: EqBands;
  onEnded: () => void;
  onError: () => void;
  onLoadedDuration: (seconds: number) => void;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const graph = useRef<Graph | null>(null);
  const objectUrl = useRef<string>("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [eqSupported, setEqSupported] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    typeof (window as unknown as { AudioContext?: unknown }).AudioContext === "function",
  );

  // Latest callbacks without re-binding listeners on every render.
  const cb = useRef(opts);
  cb.current = opts;

  const el = useCallback((): HTMLAudioElement => {
    if (audio.current) return audio.current;
    const a = new Audio();
    a.preload = "metadata";
    a.setAttribute("playsinline", "");
    audio.current = a;
    return a;
  }, []);

  useEffect(() => {
    const a = el();
    const onTime = () => setPosition(a.currentTime);
    const onMeta = () => {
      const d = Number.isFinite(a.duration) ? a.duration : 0;
      setDuration(d);
      if (d > 0) cb.current.onLoadedDuration(d);
    };
    const onPlay = () => setPhase("playing");
    const onPause = () => {
      // stop() pauses and clears src in one go; that pause is not a "paused".
      if (!a.ended && a.getAttribute("src")) setPhase("paused");
    };
    const onEnded = () => {
      setPhase("idle");
      cb.current.onEnded();
    };
    const onError = () => {
      setPhase("idle");
      cb.current.onError();
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      a.pause();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, [el]);

  useEffect(() => {
    const a = el();
    a.defaultPlaybackRate = opts.speed;
    a.playbackRate = opts.speed;
    // Keep pitch when slowing down or speeding up (spoken word, practice).
    (a as unknown as { preservesPitch?: boolean }).preservesPitch = true;
  }, [el, opts.speed]);

  const applyEq = useCallback((bands: EqBands) => {
    const g = graph.current;
    if (!g) return;
    const now = g.ctx.currentTime;
    g.filters.forEach((f, i) => {
      f.gain.setTargetAtTime(bands[i], now, 0.02);
    });
  }, []);

  useEffect(() => {
    applyEq(opts.eqBands);
  }, [applyEq, opts.eqBands]);

  /**
   * Builds the EQ graph on the first play. Must run inside a user gesture on
   * iOS; the caller's tap handler is that gesture. A browser that refuses
   * simply keeps playing through the plain element with no EQ.
   */
  const ensureGraph = useCallback(() => {
    if (graph.current) return;
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
    if (typeof Ctx !== "function") {
      setEqSupported(false);
      return;
    }
    try {
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(el());
      const low = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 200;
      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 1;
      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 4000;
      src.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(ctx.destination);
      graph.current = { ctx, filters: [low, mid, high] };
      applyEq(cb.current.eqBands);
    } catch {
      setEqSupported(false);
    }
  }, [applyEq, el]);

  const resumeGraph = useCallback(async () => {
    const g = graph.current;
    if (g && g.ctx.state === "suspended") {
      try {
        await g.ctx.resume();
      } catch {
        /* keep going; the element still plays */
      }
    }
  }, []);

  /** Loads a file and, if asked, starts it. Resolves false when play was refused. */
  const load = useCallback(
    async (file: File, autoplay: boolean): Promise<boolean> => {
      const a = el();
      ensureGraph();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(file);
      a.src = objectUrl.current;
      a.currentTime = 0;
      setPosition(0);
      setDuration(0);
      if (!autoplay) {
        setPhase("paused");
        return true;
      }
      await resumeGraph();
      try {
        await a.play();
        return true;
      } catch {
        setPhase("paused");
        return false;
      }
    },
    [el, ensureGraph, resumeGraph],
  );

  const play = useCallback(async (): Promise<boolean> => {
    const a = el();
    if (!a.src) return false;
    ensureGraph();
    await resumeGraph();
    try {
      await a.play();
      return true;
    } catch {
      return false;
    }
  }, [el, ensureGraph, resumeGraph]);

  const pause = useCallback(() => {
    el().pause();
  }, [el]);

  const stop = useCallback(() => {
    const a = el();
    a.pause();
    a.removeAttribute("src");
    a.load();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
    setPhase("idle");
    setPosition(0);
    setDuration(0);
  }, [el]);

  const seek = useCallback(
    (seconds: number) => {
      const a = el();
      const max = Number.isFinite(a.duration) ? a.duration : seconds;
      a.currentTime = Math.max(0, Math.min(max, seconds));
      setPosition(a.currentTime);
    },
    [el],
  );

  return { phase, position, duration, eqSupported, load, play, pause, stop, seek };
}
