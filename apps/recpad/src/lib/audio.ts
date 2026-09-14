/**
 * Pure, on-device audio maths for Recpad. Nothing in this file touches the
 * DOM, the network or the Web Audio API, so it runs unchanged under
 * `node --test`. Every function returns a new Float32Array and leaves its
 * input alone; the undo stack relies on that.
 *
 * Samples are mono Float32 PCM in [-1, 1]. Multi-channel input is mixed down
 * when it is captured (src/lib/recorder.ts) so the editor only has to think
 * about one channel.
 */

/** ≈ -1 dBFS. Leaves headroom so the MP3 encoder does not clip on transients. */
export const NORMALIZE_PEAK = 0.89;
export const MAX_UNDO = 8;

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(gain, 1e-9));
}

export function peak(samples: Float32Array): number {
  let p = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > p) p = a;
  }
  return p;
}

export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let acc = 0;
  for (let i = 0; i < samples.length; i++) acc += samples[i] * samples[i];
  return Math.sqrt(acc / samples.length);
}

function clamp1(v: number): number {
  return v > 1 ? 1 : v < -1 ? -1 : v;
}

/** Multiplies every sample by `gain` and clips to [-1, 1]. */
export function applyGain(samples: Float32Array, gain: number): Float32Array {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = clamp1(samples[i] * gain);
  return out;
}

/** Scales the take so its loudest sample sits at `target` (default ≈ -1 dB). */
export function normalize(samples: Float32Array, target = NORMALIZE_PEAK): Float32Array {
  const p = peak(samples);
  if (p === 0) return new Float32Array(samples);
  return applyGain(samples, target / p);
}

/** Orders and clips a [start, end) sample range to the buffer. */
export function clampRange(start: number, end: number, length: number): [number, number] {
  let a = Math.max(0, Math.min(length, Math.round(Math.min(start, end))));
  let b = Math.max(0, Math.min(length, Math.round(Math.max(start, end))));
  if (a > b) [a, b] = [b, a];
  return [a, b];
}

/** Keeps only [start, end). */
export function trim(samples: Float32Array, start: number, end: number): Float32Array {
  const [a, b] = clampRange(start, end, samples.length);
  return samples.slice(a, b);
}

/** Removes [start, end) and joins what is left. */
export function cut(samples: Float32Array, start: number, end: number): Float32Array {
  const [a, b] = clampRange(start, end, samples.length);
  const out = new Float32Array(samples.length - (b - a));
  out.set(samples.subarray(0, a), 0);
  out.set(samples.subarray(b), a);
  return out;
}

/** Per-bucket min/max for drawing. `buckets` is usually the canvas width in px. */
export function peaks(samples: Float32Array, buckets: number): { min: Float32Array; max: Float32Array } {
  const n = Math.max(1, Math.floor(buckets));
  const min = new Float32Array(n);
  const max = new Float32Array(n);
  if (samples.length === 0) return { min, max };
  const per = samples.length / n;
  for (let b = 0; b < n; b++) {
    const from = Math.floor(b * per);
    const to = Math.min(samples.length, Math.max(from + 1, Math.floor((b + 1) * per)));
    let lo = 1;
    let hi = -1;
    for (let i = from; i < to; i++) {
      const v = samples[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    min[b] = lo;
    max[b] = hi;
  }
  return { min, max };
}

export function floatTo16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const v = clamp1(samples[i]);
    out[i] = v < 0 ? Math.round(v * 0x8000) : Math.round(v * 0x7fff);
  }
  return out;
}

/** RIFF/WAVE, 16-bit PCM, interleaved. Accepts 1..n channels of equal length. */
export function encodeWav(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  if (channels.length === 0) throw new Error("encodeWav: no channels");
  const numCh = channels.length;
  const frames = channels[0].length;
  const dataBytes = frames * numCh * 2;
  const buf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);
  const ascii = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, dataBytes, true);
  let off = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < numCh; c++) {
      const v = clamp1(channels[c][i]);
      view.setInt16(off, v < 0 ? Math.round(v * 0x8000) : Math.round(v * 0x7fff), true);
      off += 2;
    }
  }
  return buf;
}

/** Reads the WAV files this app writes (PCM16 or float32). Drafts round-trip through here. */
export function decodeWav(buf: ArrayBuffer): { sampleRate: number; channels: Float32Array[] } {
  const view = new DataView(buf);
  const tag = (off: number) => String.fromCharCode(view.getUint8(off), view.getUint8(off + 1), view.getUint8(off + 2), view.getUint8(off + 3));
  if (buf.byteLength < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("not a WAV file");
  let off = 12;
  let format = 0;
  let numCh = 0;
  let sampleRate = 0;
  let bits = 0;
  let dataOff = -1;
  let dataLen = 0;
  while (off + 8 <= buf.byteLength) {
    const id = tag(off);
    const size = view.getUint32(off + 4, true);
    if (id === "fmt ") {
      format = view.getUint16(off + 8, true);
      numCh = view.getUint16(off + 10, true);
      sampleRate = view.getUint32(off + 12, true);
      bits = view.getUint16(off + 22, true);
    } else if (id === "data") {
      dataOff = off + 8;
      dataLen = Math.min(size, buf.byteLength - dataOff);
      break;
    }
    off += 8 + size + (size & 1);
  }
  if (dataOff < 0 || numCh === 0) throw new Error("WAV has no data chunk");
  const bytesPer = bits / 8;
  const frames = Math.floor(dataLen / (bytesPer * numCh));
  const channels = Array.from({ length: numCh }, () => new Float32Array(frames));
  let p = dataOff;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < numCh; c++) {
      if (format === 3 && bits === 32) channels[c][i] = view.getFloat32(p, true);
      else if (bits === 16) channels[c][i] = view.getInt16(p, true) / 0x8000;
      else if (bits === 8) channels[c][i] = (view.getUint8(p) - 128) / 128;
      else throw new Error(`unsupported WAV: format ${format}, ${bits} bit`);
      p += bytesPer;
    }
  }
  return { sampleRate, channels };
}

/** Averages any number of channels into one. */
export function mixToMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) return new Float32Array(channels[0]);
  const n = channels[0].length;
  const out = new Float32Array(n);
  for (const ch of channels) for (let i = 0; i < n; i++) out[i] += ch[i] / channels.length;
  return out;
}

/* ---------- FFT (radix-2, in place) ---------- */

const fftCache = new Map<number, { rev: Uint32Array; cos: Float64Array; sin: Float64Array }>();

function fftTables(n: number) {
  let t = fftCache.get(n);
  if (t) return t;
  const bits = Math.log2(n);
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r = (r << 1) | ((i >>> b) & 1);
    rev[i] = r;
  }
  const cos = new Float64Array(n / 2);
  const sin = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cos[i] = Math.cos((-2 * Math.PI * i) / n);
    sin[i] = Math.sin((-2 * Math.PI * i) / n);
  }
  t = { rev, cos, sin };
  fftCache.set(n, t);
  return t;
}

/** Forward FFT when inverse=false; inverse (scaled by 1/n) when true. n must be a power of two. */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
  const n = re.length;
  if (n < 2 || (n & (n - 1)) !== 0) throw new Error("fft: length must be a power of two");
  const { rev, cos, sin } = fftTables(n);
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (j > i) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const wr = cos[k * step];
        const wi = inverse ? -sin[k * step] : sin[k * step];
        const a = start + k;
        const b = a + half;
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

export interface GateOptions {
  /** 0..1. 0 leaves the take alone, 1 pushes the noise floor down by about 30 dB. */
  strength?: number;
  frameSize?: number;
  hop?: number;
  /** How far above the measured noise a bin must be to count as signal (dB). */
  thresholdDb?: number;
  /** Share of the quietest frames used as the noise profile (0..1). */
  quietShare?: number;
}

/**
 * Spectral noise gate. Short-time FFT with a Hann window; the noise profile
 * is the mean magnitude of the quietest frames (room tone, the gap before
 * the first strum, the tail after the last one). Bins below the profile
 * plus `thresholdDb` are attenuated towards a floor set by `strength`; bins
 * clearly above it pass untouched. Gains are smoothed across neighbouring
 * bins and released slowly across frames so the result does not "twinkle".
 * Overlap-add rebuilds the take; the Hann sum is divided back out.
 *
 * Pure TypedArray maths, no worker, no server, no network. Runs on the
 * caller's thread; the UI shows a busy state while it works.
 */
export function spectralGate(samples: Float32Array, sampleRate: number, opts: GateOptions = {}): Float32Array {
  const strength = Math.min(1, Math.max(0, opts.strength ?? 0.6));
  const N = opts.frameSize ?? (sampleRate > 60000 ? 4096 : 2048);
  const hop = opts.hop ?? N / 4;
  const thresholdDb = opts.thresholdDb ?? 10;
  const quietShare = Math.min(0.9, Math.max(0.05, opts.quietShare ?? 0.15));
  if (samples.length === 0 || strength === 0) return new Float32Array(samples);

  const floor = dbToGain(-30 * strength);
  const thr = dbToGain(thresholdDb);
  const window = new Float64Array(N);
  for (let i = 0; i < N; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);

  const pad = N;
  const total = samples.length + pad * 2;
  const frameCount = Math.max(1, Math.ceil((total - N) / hop) + 1);
  const half = N / 2 + 1;

  // Pass 1: magnitudes per frame, frame energies.
  const mags: Float32Array[] = new Array(frameCount);
  const energy = new Float64Array(frameCount);
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const load = (f: number) => {
    const base = f * hop - pad;
    for (let i = 0; i < N; i++) {
      const idx = base + i;
      re[i] = (idx >= 0 && idx < samples.length ? samples[idx] : 0) * window[i];
      im[i] = 0;
    }
  };
  for (let f = 0; f < frameCount; f++) {
    load(f);
    fft(re, im);
    const m = new Float32Array(half);
    let e = 0;
    for (let k = 0; k < half; k++) {
      const v = Math.hypot(re[k], im[k]);
      m[k] = v;
      e += v * v;
    }
    mags[f] = m;
    energy[f] = e;
  }

  // Noise profile: mean magnitude of the quietest frames.
  const order = Array.from({ length: frameCount }, (_, i) => i).sort((a, b) => energy[a] - energy[b]);
  const quietCount = Math.max(1, Math.min(frameCount, Math.round(frameCount * quietShare)));
  const noise = new Float64Array(half);
  for (let q = 0; q < quietCount; q++) {
    const m = mags[order[q]];
    for (let k = 0; k < half; k++) noise[k] += m[k] / quietCount;
  }
  // Silence (all-zero frames) must not become a zero profile that lets everything through.
  let noiseFloorRef = 0;
  for (let k = 0; k < half; k++) noiseFloorRef += noise[k];
  noiseFloorRef = Math.max(noiseFloorRef / half, 1e-6);

  // Pass 2: gate, smooth, overlap-add.
  const out = new Float64Array(total);
  const norm = new Float64Array(total);
  const gain = new Float64Array(half);
  const prevGain = new Float64Array(half).fill(1);
  const release = 0.55;
  for (let f = 0; f < frameCount; f++) {
    const m = mags[f];
    for (let k = 0; k < half; k++) {
      const nz = Math.max(noise[k], noiseFloorRef * 0.05) * thr;
      const ratio = m[k] / nz;
      let g: number;
      if (ratio >= 2) g = 1;
      else if (ratio <= 1) g = floor;
      else g = floor + (1 - floor) * (ratio - 1);
      gain[k] = g;
    }
    // Neighbour smoothing (±2 bins) then a slow release from the previous frame.
    const sm = new Float64Array(half);
    for (let k = 0; k < half; k++) {
      let acc = 0;
      let cnt = 0;
      for (let d = -2; d <= 2; d++) {
        const j = k + d;
        if (j >= 0 && j < half) {
          acc += gain[j];
          cnt++;
        }
      }
      const g = acc / cnt;
      const held = prevGain[k] * release + g * (1 - release);
      sm[k] = Math.max(g, held);
      prevGain[k] = sm[k];
    }
    load(f);
    fft(re, im);
    for (let k = 0; k < half; k++) {
      re[k] *= sm[k];
      im[k] *= sm[k];
      const mirror = N - k;
      if (k > 0 && mirror < N) {
        re[mirror] *= sm[k];
        im[mirror] *= sm[k];
      }
    }
    fft(re, im, true);
    const base = f * hop;
    for (let i = 0; i < N; i++) {
      const idx = base + i;
      if (idx >= total) break;
      out[idx] += re[i] * window[i];
      norm[idx] += window[i] * window[i];
    }
  }
  const result = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const n = norm[i + pad];
    result[i] = clamp1(n > 1e-6 ? out[i + pad] / n : 0);
  }
  return result;
}

/** Bounded stack of buffer snapshots for destructive edits. */
export class UndoStack {
  private items: Float32Array[] = [];
  readonly limit: number;

  constructor(limit: number = MAX_UNDO) {
    this.limit = Math.max(1, limit);
  }

  get size(): number {
    return this.items.length;
  }

  /** Stores a copy, so the caller may keep mutating its own reference. */
  push(buf: Float32Array): void {
    this.items.push(new Float32Array(buf));
    while (this.items.length > this.limit) this.items.shift();
  }

  pop(): Float32Array | undefined {
    return this.items.pop();
  }

  clear(): void {
    this.items = [];
  }
}

export function formatTime(ms: number): string {
  const totalSec = Math.max(0, ms) / 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

export function durationMs(samples: number, sampleRate: number): number {
  return sampleRate > 0 ? (samples / sampleRate) * 1000 : 0;
}

/** Test helper and demo take: a decaying tone. */
export function synthTone(sampleRate: number, seconds: number, freq = 220, amp = 0.5): Float32Array {
  const n = Math.round(sampleRate * seconds);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    out[i] = amp * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 1.2);
  }
  return out;
}
