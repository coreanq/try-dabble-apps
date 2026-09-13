/**
 * Short cue tones via Web Audio. We open a context, play a 140 ms beep,
 * then close it. We never keep an AudioContext running and never play
 * looping music, so we do not duck the user's own music permanently.
 */
export type Cue = "start" | "phase" | "done" | "lap";

const FREQ: Record<Cue, number> = { start: 660, phase: 784, done: 523, lap: 880 };

export function playCue(cue: Cue, enabled: boolean): void {
  if (!enabled || typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  let ctx: AudioContext;
  try {
    ctx = new AC();
  } catch {
    return;
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = FREQ[cue];
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
  osc.onended = () => {
    try {
      void ctx.close();
    } catch {
      /* already closed */
    }
  };
  window.setTimeout(() => {
    if (ctx.state !== "closed") {
      try {
        void ctx.close();
      } catch {
        /* ignore */
      }
    }
  }, 220);
}
