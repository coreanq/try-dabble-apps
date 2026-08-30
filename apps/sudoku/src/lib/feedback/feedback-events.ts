export type GameEffect =
  | 'pick'
  | 'place'
  | 'collision'
  | 'note'
  | 'erase'
  | 'undo'
  | 'redo'
  | 'invalid'
  | 'newGame'
  | 'complete';
export type FeedbackSound = GameEffect;
export type FeedbackHaptic = 'selection' | 'light' | 'error' | 'success';

export interface Feedback {
  readonly sound: FeedbackSound;
  readonly haptic: FeedbackHaptic | null;
}

const FEEDBACK_BY_EFFECT: Readonly<Record<GameEffect, Feedback>> = Object.freeze({
  collision: Object.freeze({ haptic: null, sound: 'collision' }),
  complete: Object.freeze({ haptic: 'success', sound: 'complete' }),
  erase: Object.freeze({ haptic: 'light', sound: 'erase' }),
  invalid: Object.freeze({ haptic: 'error', sound: 'invalid' }),
  newGame: Object.freeze({ haptic: 'light', sound: 'newGame' }),
  note: Object.freeze({ haptic: 'selection', sound: 'note' }),
  pick: Object.freeze({ haptic: 'selection', sound: 'pick' }),
  place: Object.freeze({ haptic: 'light', sound: 'place' }),
  redo: Object.freeze({ haptic: 'selection', sound: 'redo' }),
  undo: Object.freeze({ haptic: 'selection', sound: 'undo' }),
});

export function feedbackFor(effect: GameEffect): Feedback {
  return FEEDBACK_BY_EFFECT[effect];
}

export interface FeedbackGate {
  readonly allow: (sound: FeedbackSound, now: number) => boolean;
  readonly reset: () => void;
}

export function createFeedbackGate(intervalMs = 80): FeedbackGate {
  const lastPlayedAt = new Map<FeedbackSound, number>();

  return Object.freeze({
    allow(sound: FeedbackSound, now: number): boolean {
      const previous = lastPlayedAt.get(sound);
      if (previous !== undefined && now - previous < intervalMs) {
        return false;
      }
      lastPlayedAt.set(sound, now);
      return true;
    },
    reset(): void {
      lastPlayedAt.clear();
    },
  });
}

export function isAudibleCollision(relativeImpactVelocity: number): boolean {
  return Math.abs(relativeImpactVelocity) >= 0.35;
}
