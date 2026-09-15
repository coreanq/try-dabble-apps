/**
 * One dictation session around the browser's SpeechRecognition.
 *
 * The lifecycle rule that keeps the mic usable: every start() builds a FRESH
 * recogniser, and stop() detaches every handler before calling stop()/abort()
 * and drops the instance. Chrome ends a continuous session every ~60 s or
 * after silence; while `wanted` is true the onend handler starts a new one,
 * which is how Speechnotes-style "keep listening" works. After stop() the
 * old instance may still fire onend / onerror('aborted') — with the handlers
 * gone those land on nobody, so no zombie ever blocks the next session.
 *
 * Nothing here touches the DOM or fetches anything; the recogniser class is
 * injected so it can be a mock in node --test.
 */
export interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: RecognitionResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface RecognitionResultEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

export type RecognitionCtor = new () => RecognitionLike;

export type SessionState = "idle" | "starting" | "listening";
export type SessionError = "not-allowed" | "network" | "audio" | "generic";

export interface SessionHandlers {
  onFinal: (transcript: string) => void;
  onInterim: (transcript: string) => void;
  onState: (state: SessionState) => void;
  onError: (error: SessionError) => void;
}

const RESTART_DELAY_MS = 120;
const FATAL: Record<string, SessionError> = {
  "not-allowed": "not-allowed",
  "service-not-allowed": "not-allowed",
  network: "network",
  "audio-capture": "audio",
  "language-not-supported": "generic",
  "bad-grammar": "generic",
};

/** window.SpeechRecognition || window.webkitSpeechRecognition, or null. */
export function detectRecognition(scope: unknown = typeof window !== "undefined" ? window : undefined): RecognitionCtor | null {
  const w = scope as Record<string, unknown> | undefined;
  if (!w) return null;
  const ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as RecognitionCtor | undefined;
  return typeof ctor === "function" ? ctor : null;
}

type Timer = ReturnType<typeof setTimeout>;

export class DictationSession {
  private rec: RecognitionLike | null = null;
  private wanted = false;
  private restartTimer: Timer | null = null;
  private generation = 0;
  private readonly Ctor: RecognitionCtor;
  private readonly handlers: SessionHandlers;
  private readonly schedule: (fn: () => void, ms: number) => Timer;
  private readonly cancel: (id: Timer) => void;
  state: SessionState = "idle";
  lang: string;

  constructor(
    Ctor: RecognitionCtor,
    lang: string,
    handlers: SessionHandlers,
    schedule: (fn: () => void, ms: number) => Timer = (fn, ms) => setTimeout(fn, ms),
    cancel: (id: Timer) => void = (id) => clearTimeout(id),
  ) {
    this.Ctor = Ctor;
    this.lang = lang;
    this.handlers = handlers;
    this.schedule = schedule;
    this.cancel = cancel;
  }

  get listening(): boolean {
    return this.wanted;
  }

  /** Changing the language mid-session restarts cleanly with the new one. */
  setLang(lang: string): void {
    this.lang = lang;
    if (this.wanted) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    if (this.wanted && this.rec) return;
    this.wanted = true;
    this.spawn();
  }

  stop(): void {
    this.wanted = false;
    this.generation += 1;
    if (this.restartTimer !== null) {
      this.cancel(this.restartTimer);
      this.restartTimer = null;
    }
    this.teardown(true);
    this.setState("idle");
    this.handlers.onInterim("");
  }

  /** Same as stop() but discards any pending result instead of flushing it. */
  abort(): void {
    this.stop();
  }

  private setState(next: SessionState): void {
    if (this.state === next) return;
    this.state = next;
    this.handlers.onState(next);
  }

  private teardown(useAbort: boolean): void {
    const rec = this.rec;
    this.rec = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onend = null;
    rec.onerror = null;
    rec.onstart = null;
    try {
      if (useAbort) rec.abort();
      else rec.stop();
    } catch {
      /* already stopped */
    }
  }

  private spawn(): void {
    this.teardown(true);
    const gen = this.generation;
    let rec: RecognitionLike;
    try {
      rec = new this.Ctor();
    } catch {
      this.wanted = false;
      this.setState("idle");
      this.handlers.onError("generic");
      return;
    }
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      if (gen !== this.generation) return;
      this.setState("listening");
    };
    rec.onresult = (ev) => {
      if (gen !== this.generation) return;
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const r = ev.results[i];
        const text = r[0]?.transcript ?? "";
        if (r.isFinal) {
          if (text.trim()) this.handlers.onFinal(text);
        } else {
          interim += text;
        }
      }
      this.handlers.onInterim(interim);
    };
    rec.onerror = (ev) => {
      if (gen !== this.generation) return;
      const code = ev?.error ?? "";
      if (code === "aborted" || code === "no-speech") return; // onend follows and restarts
      const fatal = FATAL[code];
      if (fatal) {
        this.wanted = false;
        this.teardown(true);
        this.setState("idle");
        this.handlers.onInterim("");
        this.handlers.onError(fatal);
      }
    };
    rec.onend = () => {
      if (gen !== this.generation) return;
      this.rec = null;
      this.handlers.onInterim("");
      if (!this.wanted) {
        this.setState("idle");
        return;
      }
      // Chrome closes continuous sessions on its own; keep listening.
      this.setState("starting");
      this.restartTimer = this.schedule(() => {
        this.restartTimer = null;
        if (this.wanted && gen === this.generation) this.spawn();
      }, RESTART_DELAY_MS);
    };
    this.rec = rec;
    this.setState("starting");
    try {
      rec.start();
    } catch {
      // "already started" or a browser that refuses — try once more fresh.
      this.rec = null;
      this.restartTimer = this.schedule(() => {
        this.restartTimer = null;
        if (this.wanted && gen === this.generation) this.spawn();
      }, RESTART_DELAY_MS);
    }
  }
}
