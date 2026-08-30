interface VolumeTarget {
  volume: number;
}

export function normalizeVolumePercentage(percentage: number): number {
  if (!Number.isFinite(percentage)) {
    return 0;
  }
  return Math.min(100, Math.max(0, percentage)) / 100;
}

export function applyVolumePercentage(
  targets: readonly VolumeTarget[],
  percentage: number,
): void {
  const volume = normalizeVolumePercentage(percentage);
  targets.forEach((target) => {
    target.volume = volume;
  });
}
