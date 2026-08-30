import type { FeedbackSound } from './feedback-events';

export interface AudioFeedbackControllerDependencies {
  readonly pauseAll: () => void;
  readonly play: (sound: FeedbackSound) => void;
  readonly preload: () => Promise<void> | void;
  readonly prepare: () => void;
  readonly seek: (sound: FeedbackSound) => Promise<void>;
}

export interface AudioFeedbackController {
  readonly mount: () => void;
  readonly request: (sound: FeedbackSound) => Promise<void>;
  readonly setActive: (active: boolean) => void;
  readonly setEnabled: (enabled: boolean) => void;
  readonly dispose: () => void;
}

export function createAudioFeedbackController(
  dependencies: AudioFeedbackControllerDependencies,
): AudioFeedbackController {
  let enabled = true;
  let active = true;
  let mounted = true;
  let generation = 0;
  let prepared = false;
  let preloadPromise: Promise<void> | null = null;

  const isCurrent = (token: number): boolean =>
    mounted && enabled && active && token === generation;

  const invalidate = (): void => {
    generation += 1;
    try {
      dependencies.pauseAll();
    } catch {
      // Unsupported playback controls are a feedback no-op.
    }
  };

  const initialize = async (token: number): Promise<boolean> => {
    if (!preloadPromise) {
      preloadPromise = Promise.resolve()
        .then(() => dependencies.preload())
        .then(() => undefined)
        .catch((error: unknown) => {
          preloadPromise = null;
          throw error;
        });
    }

    await preloadPromise;
    if (!isCurrent(token)) {
      return false;
    }
    if (!prepared) {
      dependencies.prepare();
      prepared = true;
    }
    return isCurrent(token);
  };

  return Object.freeze({
    mount(): void {
      mounted = true;
    },

    async request(sound: FeedbackSound): Promise<void> {
      if (!mounted || !enabled || !active) {
        return;
      }

      generation += 1;
      const token = generation;
      try {
        const initialized = await initialize(token);
        if (!initialized || !isCurrent(token)) {
          return;
        }
        await dependencies.seek(sound);
        if (!isCurrent(token)) {
          return;
        }
        if (isCurrent(token)) {
          dependencies.play(sound);
        }
      } catch {
        // Unsupported or failed audio is a feedback no-op.
      }
    },

    setActive(nextActive: boolean): void {
      active = nextActive;
      if (!active) {
        invalidate();
      }
    },

    setEnabled(nextEnabled: boolean): void {
      enabled = nextEnabled;
      if (!enabled) {
        invalidate();
      }
    },

    dispose(): void {
      if (!mounted) {
        return;
      }
      mounted = false;
      invalidate();
    },
  });
}
