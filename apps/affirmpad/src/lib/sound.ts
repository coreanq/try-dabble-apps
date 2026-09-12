/**
 * A soft click on every tap. Web Audio only, no asset to download, and every
 * call fails quietly: a browser without AudioContext, a muted tab, or a tap
 * before the first user gesture just stays silent. Vibration is the same
 * story: navigator.vibrate where it exists, nothing where it does not.
 */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

export function click(kind: "tap" | "undo" = "tap"): void {
  const ac = context();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(kind === "tap" ? 660 : 440, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch {
    /* silent */
  }
}

export function buzz(ms = 10): boolean {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      return navigator.vibrate(ms) === true;
    }
  } catch {
    /* unsupported or blocked */
  }
  return false;
}

export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}
