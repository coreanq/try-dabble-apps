import { useCallback } from "react";

import { feedbackFor, type GameEffect } from "./feedback-events";

export type PlayHapticFeedback = (effect: GameEffect) => void;

/** Vibration API patterns standing in for the four native haptic styles. */
const PATTERNS = {
  selection: [10],
  light: [15],
  error: [30, 40, 30],
  success: [12, 40, 18],
} as const;

export function useHapticFeedback(enabled: boolean): PlayHapticFeedback {
  return useCallback((effect: GameEffect) => {
    if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) {
      return;
    }
    const { haptic } = feedbackFor(effect);
    if (haptic === null) {
      return;
    }
    try {
      navigator.vibrate(PATTERNS[haptic]);
    } catch {
      // Unsupported vibration is a feedback no-op.
    }
  }, [enabled]);
}
