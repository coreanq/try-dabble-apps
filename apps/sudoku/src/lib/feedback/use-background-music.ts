import { useCallback, useEffect, useState } from "react";

import { applyVolumePercentage } from "./audio-volume";
import {
  createBackgroundMusicController,
  type MusicTrackIndex,
} from "./background-music-controller";

/**
 * Three tracks, about 3MB each. preload="none" plus a src assigned only when
 * the controller asks for a track means a player who never turns music on
 * never downloads them. They are deliberately outside the service worker
 * precache for the same reason.
 */
const MUSIC_SOURCES = [
  "/audio/music-01.m4a",
  "/audio/music-02.m4a",
  "/audio/music-03.m4a",
] as const;

export type StartBackgroundMusic = () => void;

function createBackgroundMusicRuntime() {
  let player: HTMLAudioElement | null = null;
  const controller = createBackgroundMusicController({
    load(track: MusicTrackIndex): void {
      if (!player) {
        throw new Error("Background music player is unavailable");
      }
      player.src = MUSIC_SOURCES[track];
      player.load();
    },
    pause(): void {
      player?.pause();
    },
    play(): void {
      void player?.play().catch(() => undefined);
    },
    random: Math.random,
    subscribeToFinish(listener): () => void {
      const element = player;
      if (!element) {
        return () => {};
      }
      element.addEventListener("ended", listener);
      return () => element.removeEventListener("ended", listener);
    },
  });

  return Object.freeze({
    attach(next: HTMLAudioElement | null): void {
      player = next;
    },
    controller,
    setVolume(volume: number): void {
      if (player) {
        applyVolumePercentage([player], volume);
      }
    },
  });
}

export function useBackgroundMusic(enabled: boolean, volume = 18): StartBackgroundMusic {
  const [runtime] = useState(createBackgroundMusicRuntime);
  const { controller } = runtime;

  useEffect(() => {
    let player: HTMLAudioElement | null = null;
    if (typeof Audio !== "undefined") {
      player = new Audio();
      player.loop = false;
      player.preload = "none";
      runtime.attach(player);
    }

    controller.mount();
    const syncActive = (): void => {
      controller.setActive(document.visibilityState === "visible");
    };
    syncActive();
    document.addEventListener("visibilitychange", syncActive);

    return () => {
      document.removeEventListener("visibilitychange", syncActive);
      controller.dispose();
      runtime.attach(null);
      player?.pause();
      player?.removeAttribute("src");
    };
  }, [controller, runtime]);

  useEffect(() => {
    runtime.setVolume(volume);
  }, [runtime, volume]);

  useEffect(() => {
    controller.setEnabled(enabled);
  }, [controller, enabled]);

  return useCallback(() => controller.startNext(), [controller]);
}
