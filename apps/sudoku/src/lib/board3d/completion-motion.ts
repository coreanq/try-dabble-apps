const NORMAL_STAGGER_DURATION = 0.5;
const NORMAL_LIFT_DURATION = 0.32;
const NORMAL_LIFT_HEIGHT = 0.34;
const REDUCED_LIFT_DURATION = 0.16;
const REDUCED_LIFT_HEIGHT = 0.065;

export function completionAnimationDuration(reducedMotion: boolean): number {
  return reducedMotion
    ? REDUCED_LIFT_DURATION
    : NORMAL_STAGGER_DURATION + NORMAL_LIFT_DURATION;
}

export function completionTileLift(
  entryIndex: number,
  entryCount: number,
  elapsed: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion && entryIndex !== 0) {
    return 0;
  }

  const staggerDuration = reducedMotion ? 0 : NORMAL_STAGGER_DURATION;
  const liftDuration = reducedMotion ? REDUCED_LIFT_DURATION : NORMAL_LIFT_DURATION;
  const liftHeight = reducedMotion ? REDUCED_LIFT_HEIGHT : NORMAL_LIFT_HEIGHT;
  const delay = entryCount <= 1 ? 0 : staggerDuration * (entryIndex / (entryCount - 1));
  const progress = Math.min(1, Math.max(0, (elapsed - delay) / liftDuration));

  return progress === 0 || progress === 1
    ? 0
    : Math.sin(progress * Math.PI) * liftHeight;
}
