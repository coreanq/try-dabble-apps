import { useCallback, useEffect, useState } from "react";

import { createAudioFeedbackController } from "./audio-feedback-controller";
import { applyVolumePercentage } from "./audio-volume";
import {
  createFeedbackGate,
  feedbackFor,
  isAudibleCollision,
  type FeedbackSound,
  type GameEffect,
} from "./feedback-events";

/**
 * Served from public/audio. The wavs the native app shipped are aac here —
 * a tenth of the bytes, and every browser that runs WebGL plays aac.
 */
const AUDIO_SOURCES: Readonly<Record<FeedbackSound, string>> = {
  collision: "/audio/collision.m4a",
  complete: "/audio/complete.m4a",
  erase: "/audio/erase.m4a",
  invalid: "/audio/invalid.m4a",
  newGame: "/audio/new-game.m4a",
  note: "/audio/note.m4a",
  pick: "/audio/pick.m4a",
  place: "/audio/place.m4a",
  redo: "/audio/redo.m4a",
  undo: "/audio/undo.m4a",
};

export type PlayAudioFeedback = (
  effect: GameEffect,
  relativeImpactVelocity?: number,
) => void;

type Players = Readonly<Record<FeedbackSound, HTMLAudioElement>>;

function createPlayers(): Players | null {
  if (typeof Audio === "undefined") {
    return null;
  }
  const sounds = Object.keys(AUDIO_SOURCES) as FeedbackSound[];
  const entries = sounds.map((sound) => {
    const element = new Audio();
    element.preload = "auto";
    return [sound, element] as const;
  });
  return Object.fromEntries(entries) as Players;
}

function createAudioFeedbackRuntime() {
  let players: Players | null = null;
  const gate = createFeedbackGate(80);
  const controller = createAudioFeedbackController({
    pauseAll(): void {
      Object.values(players ?? {}).forEach((element) => element.pause());
    },
    play(sound): void {
      // A play() before the first gesture rejects; that is a feedback no-op.
      void players?.[sound].play().catch(() => undefined);
    },
    preload(): Promise<void> {
      const elements = Object.values(players ?? {});
      if (elements.length === 0) {
        return Promise.resolve();
      }
      elements.forEach((element) => element.load());
      return Promise.resolve();
    },
    prepare(): void {
      if (!players) {
        return;
      }
      (Object.keys(AUDIO_SOURCES) as FeedbackSound[]).forEach((sound) => {
        const element = players![sound];
        if (element.getAttribute("src") !== AUDIO_SOURCES[sound]) {
          element.src = AUDIO_SOURCES[sound];
        }
      });
    },
    seek(sound): Promise<void> {
      const element = players?.[sound];
      if (!element) {
        return Promise.resolve();
      }
      element.pause();
      try {
        element.currentTime = 0;
      } catch {
        // Seeking before metadata lands is a no-op, not a failure.
      }
      return Promise.resolve();
    },
  });

  return Object.freeze({
    attachPlayers(next: Players | null): void {
      players = next;
    },
    controller,
    gate,
    setVolume(volume: number): void {
      applyVolumePercentage(Object.values(players ?? {}), volume);
    },
  });
}

export function useAudioFeedback(enabled: boolean, volume = 100): PlayAudioFeedback {
  const [runtime] = useState(createAudioFeedbackRuntime);
  const { controller, gate } = runtime;

  useEffect(() => {
    const players = createPlayers();
    runtime.attachPlayers(players);

    controller.mount();
    const syncActive = (): void => {
      controller.setActive(document.visibilityState === "visible");
    };
    syncActive();
    document.addEventListener("visibilitychange", syncActive);

    return () => {
      document.removeEventListener("visibilitychange", syncActive);
      controller.dispose();
      runtime.attachPlayers(null);
      Object.values(players ?? {}).forEach((element) => {
        element.pause();
        element.removeAttribute("src");
      });
    };
  }, [controller, runtime]);

  useEffect(() => {
    runtime.setVolume(volume);
  }, [runtime, volume]);

  useEffect(() => {
    controller.setEnabled(enabled);
    if (!enabled) {
      gate.reset();
    }
  }, [controller, enabled, gate]);

  return useCallback((effect, relativeImpactVelocity) => {
    if (
      !enabled
      || (relativeImpactVelocity !== undefined && !isAudibleCollision(relativeImpactVelocity))
    ) {
      return;
    }

    const { sound } = feedbackFor(effect);
    if (!gate.allow(sound, Date.now())) {
      return;
    }

    void controller.request(sound);
  }, [controller, enabled, gate]);
}
