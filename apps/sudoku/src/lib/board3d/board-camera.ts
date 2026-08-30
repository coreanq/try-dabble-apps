import type { OrthographicCamera } from 'three';

export const BOARD_CAMERA_POSITION = [0, 10, 4] as const;
export const BOARD_CAMERA_TARGET = [0, 0, 0] as const;
export const BOARD_CAMERA_WORLD_SPAN = 11;

export interface BoardCameraViewport {
  readonly height: number;
  readonly width: number;
}

export function configureBoardCamera(
  camera: OrthographicCamera,
  viewport: BoardCameraViewport,
): void {
  camera.position.set(...BOARD_CAMERA_POSITION);
  camera.lookAt(...BOARD_CAMERA_TARGET);
  camera.zoom = Math.min(viewport.width, viewport.height) / BOARD_CAMERA_WORLD_SPAN;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
