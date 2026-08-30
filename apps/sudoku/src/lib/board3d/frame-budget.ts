export interface RenderQuality {
  readonly dynamicShadows: boolean;
  readonly maxDpr: 1.25 | 1.75;
}

export interface FrameBudget {
  readonly quality: () => RenderQuality;
  readonly sample: (sampleMs: number, activeMs?: number) => RenderQuality;
}

export interface DemandFrameSample {
  readonly quality: RenderQuality;
  readonly requestFrame: boolean;
}

export interface DemandFrameSampler {
  readonly beginFrame: (startedAtMs: number) => void;
  readonly finishFrame: (finishedAtMs: number) => DemandFrameSample | null;
}

const WINDOW_SIZE = 120;
const SLOW_FRAME_AVERAGE_MS = 20;
const RECOVERY_FRAME_MS = 14;
const RECOVERY_DURATION_MS = 10_000;
const CONTINUOUS_FRAME_GAP_MS = 100;
const RECOVERY_PROBE_WALL_LIMIT_MS = RECOVERY_DURATION_MS + 2_000;

export function createFrameBudget(reducedMotion = false): FrameBudget {
  const samples: number[] = [];
  let sampleTotal = 0;
  let degraded = false;
  let recoveryMs = 0;

  const quality = (): RenderQuality => Object.freeze({
    dynamicShadows: !reducedMotion && !degraded,
    maxDpr: degraded ? 1.25 : 1.75,
  });

  const sample = (sampleMs: number, activeMs = sampleMs): RenderQuality => {
    samples.push(sampleMs);
    sampleTotal += sampleMs;
    if (samples.length > WINDOW_SIZE) {
      sampleTotal -= samples.shift()!;
    }

    if (!degraded && samples.length === WINDOW_SIZE) {
      degraded = sampleTotal / WINDOW_SIZE > SLOW_FRAME_AVERAGE_MS;
    } else if (degraded) {
      recoveryMs = sampleMs < RECOVERY_FRAME_MS ? recoveryMs + activeMs : 0;
      if (recoveryMs >= RECOVERY_DURATION_MS) {
        degraded = false;
        recoveryMs = 0;
      }
    }

    return quality();
  };

  return Object.freeze({ quality, sample });
}

export function createDemandFrameSampler(budget: FrameBudget): DemandFrameSampler {
  let frameStartedAt: number | null = null;
  let previousFrameFinishedAt: number | null = null;
  let probeActive = false;
  let probeStartedAt: number | null = null;

  const beginFrame = (startedAtMs: number): void => {
    frameStartedAt = startedAtMs;
  };

  const finishFrame = (finishedAtMs: number): DemandFrameSample | null => {
    if (frameStartedAt === null) {
      return null;
    }

    const renderMs = finishedAtMs - frameStartedAt;
    const frameGapMs = previousFrameFinishedAt === null
      ? renderMs
      : finishedAtMs - previousFrameFinishedAt;
    const activeMs = frameGapMs <= CONTINUOUS_FRAME_GAP_MS ? frameGapMs : renderMs;
    const wasDegraded = budget.quality().maxDpr < 1.75;
    const quality = budget.sample(renderMs, activeMs);
    const degraded = quality.maxDpr < 1.75;

    frameStartedAt = null;
    previousFrameFinishedAt = finishedAtMs;

    if (!wasDegraded && degraded) {
      probeActive = true;
      probeStartedAt = finishedAtMs;
    } else if (probeActive) {
      if (
        !degraded
        || (probeStartedAt !== null
          && finishedAtMs - probeStartedAt >= RECOVERY_PROBE_WALL_LIMIT_MS)
      ) {
        probeActive = false;
        probeStartedAt = null;
      }
    }

    return Object.freeze({ quality, requestFrame: probeActive });
  };

  return Object.freeze({ beginFrame, finishFrame });
}
