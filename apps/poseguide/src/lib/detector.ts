/**
 * Lazy MoveNet. TF.js and the pose-detection model are only imported when
 * the user turns Match on, so the camera, overlay, voice and capture never
 * pay for them. Failure is a state, not a crash: the caller shows
 * "Match unavailable on this device" and everything else keeps working.
 */
import type { LiveKeypoint } from "@/lib/match";

export interface Detector {
  estimate(video: HTMLVideoElement): Promise<LiveKeypoint[]>;
  dispose(): void;
}

let loading: Promise<Detector> | null = null;

export function loadDetector(): Promise<Detector> {
  if (loading) return loading;
  loading = (async () => {
    const [tf, pd] = await Promise.all([
      import("@tensorflow/tfjs"),
      import("@tensorflow-models/pose-detection"),
    ]);
    try {
      await tf.setBackend("webgl");
    } catch {
      await tf.setBackend("cpu");
    }
    await tf.ready();
    const det = await pd.createDetector(pd.SupportedModels.MoveNet, {
      modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING,
    });
    return {
      async estimate(video) {
        const poses = await det.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
        const kp = poses[0]?.keypoints ?? [];
        const w = video.videoWidth || 1;
        const h = video.videoHeight || 1;
        return kp.map((k) => ({ name: k.name ?? "", x: k.x / w, y: k.y / h, score: k.score }));
      },
      dispose() {
        det.dispose();
      },
    };
  })();
  loading.catch(() => {
    loading = null;
  });
  return loading;
}
