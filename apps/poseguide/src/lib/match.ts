/**
 * Pose Match: how close the live skeleton is to the selected pose.
 *
 * Both skeletons are translated so the hip centre sits at the origin and
 * scaled by the torso (shoulder centre → hip centre) so distance from the
 * camera does not matter. Each keypoint then contributes 1 − d / TOLERANCE,
 * clipped to [0, 1], weighted by the detector's confidence, and the mean is
 * shown as 0–100. The mirrored reference is scored too and the better of the
 * two wins: a front camera is a mirror, and nobody should have to think
 * about which arm is "left".
 */
import { KEYPOINT_NAMES, type Keypoint, type KeypointName } from "./poses.ts";

export interface LiveKeypoint {
  name: string;
  x: number;
  y: number;
  score?: number;
}

export const MIN_CONFIDENCE = 0.3;
/** Distance (in torso lengths) at which a joint contributes nothing. */
export const TOLERANCE = 1.15;
/** Fewer confident joints than this and we say "no person in view". */
export const MIN_VISIBLE = 6;

/** Joints that matter most for "did you strike the pose". */
const WEIGHT: Partial<Record<KeypointName, number>> = {
  nose: 0.5,
  left_eye: 0.15,
  right_eye: 0.15,
  left_ear: 0.15,
  right_ear: 0.15,
  left_shoulder: 1,
  right_shoulder: 1,
  left_elbow: 1.2,
  right_elbow: 1.2,
  left_wrist: 1.4,
  right_wrist: 1.4,
  left_hip: 0.8,
  right_hip: 0.8,
  left_knee: 0.8,
  right_knee: 0.8,
  left_ankle: 0.6,
  right_ankle: 0.6,
};

type Pt = { x: number; y: number };
type Norm = Map<KeypointName, Pt & { score: number }>;

function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const MIRROR: Record<KeypointName, KeypointName> = {
  nose: "nose",
  left_eye: "right_eye",
  right_eye: "left_eye",
  left_ear: "right_ear",
  right_ear: "left_ear",
  left_shoulder: "right_shoulder",
  right_shoulder: "left_shoulder",
  left_elbow: "right_elbow",
  right_elbow: "left_elbow",
  left_wrist: "right_wrist",
  right_wrist: "left_wrist",
  left_hip: "right_hip",
  right_hip: "left_hip",
  left_knee: "right_knee",
  right_knee: "left_knee",
  left_ankle: "right_ankle",
  right_ankle: "left_ankle",
};

function isName(n: string): n is KeypointName {
  return (KEYPOINT_NAMES as readonly string[]).includes(n);
}

/**
 * Hip-centred, torso-scaled coordinates. Returns null when the torso cannot
 * be established (shoulders or hips missing / not confident).
 */
export function normalize(points: LiveKeypoint[], minConfidence = MIN_CONFIDENCE): Norm | null {
  const map: Norm = new Map();
  for (const p of points) {
    if (!isName(p.name)) continue;
    const score = p.score ?? 1;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    map.set(p.name, { x: p.x, y: p.y, score });
  }
  const ls = map.get("left_shoulder");
  const rs = map.get("right_shoulder");
  const lh = map.get("left_hip");
  const rh = map.get("right_hip");
  if (!ls || !rs || !lh || !rh) return null;
  if ([ls, rs, lh, rh].some((p) => p.score < minConfidence)) return null;
  const hip = mid(lh, rh);
  const shoulder = mid(ls, rs);
  const torso = dist(hip, shoulder);
  if (torso < 1e-6) return null;
  const out: Norm = new Map();
  for (const [name, p] of map) {
    out.set(name, { x: (p.x - hip.x) / torso, y: (p.y - hip.y) / torso, score: p.score });
  }
  return out;
}

export function mirrorKeypoints(points: Keypoint[]): Keypoint[] {
  return points.map((p) => ({ name: MIRROR[p.name], x: 1 - p.x, y: p.y }));
}

export interface MatchResult {
  /** 0–100, or null when there is no usable person in view. */
  score: number | null;
  /** How many live joints were confident enough to count. */
  visible: number;
  /** Per-joint accuracy 0–1 for tinting the live skeleton. */
  perJoint: Partial<Record<KeypointName, number>>;
  /** True when the mirrored reference scored better. */
  mirrored: boolean;
}

function scoreAgainst(live: Norm, ref: Norm): { score: number; perJoint: Partial<Record<KeypointName, number>> } {
  let sum = 0;
  let wsum = 0;
  const perJoint: Partial<Record<KeypointName, number>> = {};
  for (const name of KEYPOINT_NAMES) {
    const a = live.get(name);
    const b = ref.get(name);
    if (!a || !b || a.score < MIN_CONFIDENCE) continue;
    const d = dist(a, b);
    const acc = Math.max(0, Math.min(1, 1 - d / TOLERANCE));
    const w = (WEIGHT[name] ?? 1) * Math.min(1, a.score + 0.3);
    perJoint[name] = acc;
    sum += acc * w;
    wsum += w;
  }
  return { score: wsum > 0 ? sum / wsum : 0, perJoint };
}

export function matchScore(live: LiveKeypoint[], reference: Keypoint[]): MatchResult {
  const liveN = normalize(live);
  if (!liveN) return { score: null, visible: 0, perJoint: {}, mirrored: false };
  let visible = 0;
  for (const p of liveN.values()) if (p.score >= MIN_CONFIDENCE) visible += 1;
  if (visible < MIN_VISIBLE) return { score: null, visible, perJoint: {}, mirrored: false };

  const refN = normalize(reference);
  const refM = normalize(mirrorKeypoints(reference));
  if (!refN || !refM) return { score: null, visible, perJoint: {}, mirrored: false };

  const straight = scoreAgainst(liveN, refN);
  const flipped = scoreAgainst(liveN, refM);
  const best = flipped.score > straight.score ? flipped : straight;
  // Ease the curve so a decent attempt reads as encouraging, not as 40%.
  const eased = Math.pow(best.score, 0.8);
  return {
    score: Math.round(eased * 100),
    visible,
    perJoint: best.perJoint,
    mirrored: best === flipped,
  };
}

/** Exponential smoothing so the ring does not jitter frame to frame. */
export function smoothScore(prev: number | null, next: number | null, alpha = 0.35): number | null {
  if (next === null) return null;
  if (prev === null) return next;
  return Math.round(prev + (next - prev) * alpha);
}

export type MatchBand = "great" | "good" | "adjust";
export function matchBand(score: number): MatchBand {
  if (score >= 85) return "great";
  if (score >= 60) return "good";
  return "adjust";
}

/** Auto-capture: fires only when the score holds at or above the bar. */
export const AUTO_CAPTURE_SCORE = 85;
export const AUTO_CAPTURE_HOLD_MS = 2000;

export interface HoldState {
  since: number | null;
}

/**
 * Feed each scored frame; returns true exactly once when the score has
 * stayed ≥ AUTO_CAPTURE_SCORE for AUTO_CAPTURE_HOLD_MS. Falling below resets.
 */
export function updateHold(state: HoldState, score: number | null, now: number): boolean {
  if (score === null || score < AUTO_CAPTURE_SCORE) {
    state.since = null;
    return false;
  }
  if (state.since === null) {
    state.since = now;
    return false;
  }
  if (now - state.since >= AUTO_CAPTURE_HOLD_MS) {
    state.since = null;
    return true;
  }
  return false;
}
