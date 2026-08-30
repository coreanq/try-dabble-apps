export type MusicTrackIndex = 0 | 1 | 2;

export interface BackgroundMusicControllerDependencies {
  readonly load: (track: MusicTrackIndex) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly random: () => number;
  readonly subscribeToFinish: (listener: () => void) => () => void;
}

export interface BackgroundMusicController {
  readonly dispose: () => void;
  readonly mount: () => void;
  readonly setActive: (active: boolean) => void;
  readonly setEnabled: (enabled: boolean) => void;
  readonly startNext: () => void;
}

export function chooseNextMusicTrack(
  previous: MusicTrackIndex | null,
  random: () => number,
): MusicTrackIndex {
  const tracks: readonly MusicTrackIndex[] = previous === null
    ? [0, 1, 2]
    : ([0, 1, 2] as const).filter((track) => track !== previous);
  const offset = Math.min(Math.floor(random() * tracks.length), tracks.length - 1);
  return tracks[offset]!;
}

export function createBackgroundMusicController(
  dependencies: BackgroundMusicControllerDependencies,
): BackgroundMusicController {
  let active = true;
  let enabled = true;
  let mounted = true;
  let ready = false;
  let currentTrack: MusicTrackIndex | null = null;
  let removeFinishListener: (() => void) | null = null;

  const pause = (): void => {
    try {
      dependencies.pause();
    } catch {
      // Unsupported playback controls are a background-music no-op.
    }
  };

  const playIfReady = (): void => {
    if (!mounted || !active || !enabled || !ready) {
      return;
    }
    try {
      dependencies.play();
    } catch {
      // Unsupported playback controls are a background-music no-op.
    }
  };

  const repeatCurrent = (): void => {
    if (!mounted || currentTrack === null) {
      return;
    }
    ready = false;
    try {
      dependencies.load(currentTrack);
      ready = true;
      playIfReady();
    } catch {
      // Unsupported or failed audio is a background-music no-op.
    }
  };

  return Object.freeze({
    dispose(): void {
      if (!mounted) {
        return;
      }
      mounted = false;
      removeFinishListener?.();
      removeFinishListener = null;
      pause();
    },
    mount(): void {
      mounted = true;
      removeFinishListener ??= dependencies.subscribeToFinish(repeatCurrent);
    },
    setActive(nextActive: boolean): void {
      if (active === nextActive) {
        return;
      }
      active = nextActive;
      if (active) {
        playIfReady();
      } else {
        pause();
      }
    },
    setEnabled(nextEnabled: boolean): void {
      if (enabled === nextEnabled) {
        return;
      }
      enabled = nextEnabled;
      if (enabled) {
        playIfReady();
      } else {
        pause();
      }
    },
    startNext(): void {
      if (!mounted) {
        return;
      }
      const nextTrack = chooseNextMusicTrack(currentTrack, dependencies.random);
      ready = false;
      try {
        dependencies.load(nextTrack);
        currentTrack = nextTrack;
        ready = true;
        playIfReady();
      } catch {
        // Unsupported or failed audio is a background-music no-op.
      }
    },
  });
}
