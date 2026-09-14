/**
 * Mic capture and playback. Audio is pulled straight out of the Web Audio
 * graph as Float32 PCM, so there is no compressed intermediate to decode and
 * nothing ever leaves the tab. Browser-side echo cancellation, noise
 * suppression and auto gain are switched off on purpose: they are tuned for
 * speech and chew up a guitar or a room. Recpad's own noise gate runs later,
 * on the take, when the user asks for it.
 */
import { mixToMono } from "./audio.ts";

export type MicError = "unsupported" | "denied" | "busy";

export interface Take {
  samples: Float32Array;
  sampleRate: number;
}

export function micSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== "undefined";
}

const CHUNK = 4096;

export class Recorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private tap: ScriptProcessorNode | null = null;
  private sink: GainNode | null = null;
  private chunks: Float32Array[] = [];
  private frames = 0;
  private onLevel: ((peak: number, ms: number) => void) | null = null;

  get isRecording(): boolean {
    return this.tap !== null;
  }

  async start(onLevel?: (peak: number, ms: number) => void): Promise<void> {
    if (!micSupported()) throw new Error("unsupported" satisfies MicError);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
        video: false,
      });
    } catch (e) {
      const name = (e as { name?: string })?.name ?? "";
      throw new Error((name === "NotAllowedError" || name === "SecurityError" ? "denied" : "busy") satisfies MicError);
    }
    const ctx = new AudioContext();
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    const source = ctx.createMediaStreamSource(stream);
    const tap = ctx.createScriptProcessor(CHUNK, source.channelCount || 1, 1);
    // The tap must be connected to the destination to keep ticking; a muted
    // gain node stops the mic being heard through the speakers.
    const sink = ctx.createGain();
    sink.gain.value = 0;
    this.chunks = [];
    this.frames = 0;
    this.onLevel = onLevel ?? null;
    tap.onaudioprocess = (ev) => {
      const input = ev.inputBuffer;
      const chans: Float32Array[] = [];
      for (let c = 0; c < input.numberOfChannels; c++) chans.push(input.getChannelData(c));
      const mono = mixToMono(chans);
      this.chunks.push(mono);
      this.frames += mono.length;
      if (this.onLevel) {
        let p = 0;
        for (let i = 0; i < mono.length; i++) {
          const a = Math.abs(mono[i]);
          if (a > p) p = a;
        }
        this.onLevel(p, (this.frames / ctx.sampleRate) * 1000);
      }
    };
    source.connect(tap);
    tap.connect(sink);
    sink.connect(ctx.destination);
    this.ctx = ctx;
    this.stream = stream;
    this.source = source;
    this.tap = tap;
    this.sink = sink;
  }

  async stop(): Promise<Take> {
    const ctx = this.ctx;
    const sampleRate = ctx?.sampleRate ?? 44100;
    if (this.tap) {
      this.tap.onaudioprocess = null;
      this.tap.disconnect();
    }
    this.source?.disconnect();
    this.sink?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (ctx) await ctx.close().catch(() => {});
    const samples = new Float32Array(this.frames);
    let off = 0;
    for (const c of this.chunks) {
      samples.set(c, off);
      off += c.length;
    }
    this.chunks = [];
    this.frames = 0;
    this.ctx = null;
    this.stream = null;
    this.source = null;
    this.tap = null;
    this.sink = null;
    this.onLevel = null;
    return { samples, sampleRate };
  }
}

/** One-shot playback of a Float32 take, with a live position callback. */
export class Player {
  private ctx: AudioContext | null = null;
  private node: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private offsetSec = 0;
  private endSec = 0;
  private raf = 0;
  private onTick: ((sec: number) => void) | null = null;
  private onEnd: (() => void) | null = null;

  get isPlaying(): boolean {
    return this.node !== null;
  }

  /** Plays [fromSec, toSec) of the take. */
  async play(take: Take, fromSec: number, toSec: number, onTick: (sec: number) => void, onEnd: () => void): Promise<void> {
    this.stop();
    if (!this.ctx) this.ctx = new AudioContext();
    const ctx = this.ctx;
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    const buffer = ctx.createBuffer(1, Math.max(1, take.samples.length), take.sampleRate);
    buffer.copyToChannel(new Float32Array(take.samples), 0);
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(ctx.destination);
    const total = take.samples.length / take.sampleRate;
    const from = Math.max(0, Math.min(fromSec, total));
    const to = Math.max(from, Math.min(toSec, total));
    this.offsetSec = from;
    this.endSec = to;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.startedAt = ctx.currentTime;
    node.onended = () => {
      if (this.node !== node) return;
      this.node = null;
      cancelAnimationFrame(this.raf);
      this.onTick?.(this.endSec);
      this.onEnd?.();
    };
    this.node = node;
    node.start(0, from, Math.max(0.001, to - from));
    const tick = () => {
      if (this.node !== node) return;
      const pos = Math.min(this.endSec, this.offsetSec + (ctx.currentTime - this.startedAt));
      this.onTick?.(pos);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Stops and returns the position in seconds where playback was. */
  stop(): number {
    cancelAnimationFrame(this.raf);
    const node = this.node;
    if (!node || !this.ctx) return this.offsetSec;
    const pos = Math.min(this.endSec, this.offsetSec + (this.ctx.currentTime - this.startedAt));
    this.node = null;
    node.onended = null;
    try {
      node.stop();
    } catch {
      /* already stopped */
    }
    node.disconnect();
    return pos;
  }

  close(): void {
    this.stop();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
