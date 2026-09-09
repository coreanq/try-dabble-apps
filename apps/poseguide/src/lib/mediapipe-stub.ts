/**
 * @tensorflow-models/pose-detection imports `Pose` from @mediapipe/pose for
 * its BlazePose-MediaPipe runtime. Poseguide only ever creates a MoveNet
 * detector, so that path is dead code here; @mediapipe/pose ships as a UMD
 * global without a real ESM export and breaks the bundle. vite.config.ts
 * aliases the package to this stub.
 */
export class Pose {
  constructor() {
    throw new Error("MediaPipe runtime is not bundled in Poseguide");
  }
}
