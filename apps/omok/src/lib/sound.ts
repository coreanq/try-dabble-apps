/**
 * The four sounds from the pre-Vite page, unchanged in shape: a stone landing
 * on wood (filtered noise plus a low resonance), an ascending chime to open,
 * a fanfare on a win and a falling figure on a loss. One lazily-created
 * AudioContext, because iOS only allows it after a gesture.
 */

let ctx: AudioContext | null = null;

type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A stone seating on the board — black reads a touch duller than white. */
export function playStoneSound(isBlack: boolean): void {
  try {
    const c = audio();
    if (!c) return;

    const bufferSize = Math.floor(c.sampleRate * 0.1);
    const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer;

    // Bandpass for wood-like resonance
    const bandpass = c.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(isBlack ? 1800 : 2200, c.currentTime);
    bandpass.Q.setValueAtTime(5, c.currentTime);

    // Highpass to remove low rumble
    const highpass = c.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(500, c.currentTime);

    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.4, c.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);

    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(c.destination);

    const resonance = c.createOscillator();
    resonance.type = "sine";
    resonance.frequency.setValueAtTime(isBlack ? 280 : 350, c.currentTime);

    const resGain = c.createGain();
    resGain.gain.setValueAtTime(0.15, c.currentTime);
    resGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);

    const resFilter = c.createBiquadFilter();
    resFilter.type = "lowpass";
    resFilter.frequency.setValueAtTime(600, c.currentTime);

    resonance.connect(resFilter);
    resFilter.connect(resGain);
    resGain.connect(c.destination);

    noise.start(c.currentTime);
    resonance.start(c.currentTime);
    noise.stop(c.currentTime + 0.1);
    resonance.stop(c.currentTime + 0.15);
  } catch {
    /* no audio on this device — the game is silent, not broken */
  }
}

/** Gentle ascending chime, C5-E5-G5, when a game opens. */
export function playStartSound(): void {
  try {
    const c = audio();
    if (!c) return;

    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, c.currentTime);

      gain.gain.setValueAtTime(0, c.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, c.currentTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(c.currentTime + i * 0.1);
      osc.stop(c.currentTime + i * 0.1 + 0.5);
    });
  } catch {
    /* no audio */
  }
}

/** Triumphant fanfare, then a sustained chord half a second later. */
export function playVictorySound(): void {
  try {
    const c = audio();
    if (!c) return;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, c.currentTime);

      const startTime = c.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.setValueAtTime(0.2, startTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });

    window.setTimeout(() => {
      [523.25, 659.25, 783.99].forEach((freq) => {
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, c.currentTime);

        gain.gain.setValueAtTime(0.1, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(c.currentTime);
        osc.stop(c.currentTime + 1);
      });
    }, 500);
  } catch {
    /* no audio */
  }
}

/** Descending G4-F4-E4-D4 when the AI takes the game. */
export function playDefeatSound(): void {
  try {
    const c = audio();
    if (!c) return;

    [392, 349.23, 329.63, 293.66].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, c.currentTime);

      const startTime = c.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  } catch {
    /* no audio */
  }
}
