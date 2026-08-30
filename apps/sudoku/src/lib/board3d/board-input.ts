import { Plane, Ray, Raycaster, Vector2, Vector3 } from 'three';
import type { Camera } from 'three';

import type { CellIndex, NormalizedPointer } from '@/lib/types';
import { NINE_BY_NINE, type SudokuLayout } from '../sudoku/domain/layout.ts';

import { worldToCell } from './scene-math.ts';

const BOARD_PLANE = new Plane(new Vector3(0, 1, 0), -0.18);
const MAX_TILT_RADIANS = 4 * Math.PI / 180;

export interface BoardRayTarget {
  readonly cell: CellIndex | null;
  readonly x: number;
  readonly z: number;
}

export interface PointerPresentation {
  readonly lift: number;
  readonly rotationX: number;
  readonly rotationZ: number;
}

export interface PointerProjectionSize {
  readonly height: number;
  readonly width: number;
}

export function rayToBoardTarget(
  ray: Ray,
  layout: SudokuLayout = NINE_BY_NINE,
): BoardRayTarget | null {
  const point = ray.intersectPlane(BOARD_PLANE, new Vector3());
  if (!point) {
    return null;
  }

  return {
    cell: worldToCell(point.x, point.z, layout),
    x: point.x,
    z: point.z,
  };
}

export function screenPointerToBoardTarget(
  pointer: NormalizedPointer,
  size: PointerProjectionSize,
  camera: Camera,
  layout: SudokuLayout = NINE_BY_NINE,
): BoardRayTarget | null {
  if (size.width <= 0 || size.height <= 0) {
    return null;
  }

  const normalized = new Vector2(
    pointer.x / size.width * 2 - 1,
    -(pointer.y / size.height) * 2 + 1,
  );
  const raycaster = new Raycaster();
  raycaster.setFromCamera(normalized, camera);
  return rayToBoardTarget(raycaster.ray, layout);
}

export function pointerPresentation(pointer: NormalizedPointer): PointerPresentation {
  const pressure = Math.min(1, Math.max(0, pointer.pressure));
  const tiltX = Math.min(90, Math.max(-90, pointer.tiltX));
  const tiltY = Math.min(90, Math.max(-90, pointer.tiltY));

  return {
    lift: 0.35 + pressure * 0.3,
    rotationX: tiltY / 90 * MAX_TILT_RADIANS,
    rotationZ: -tiltX / 90 * MAX_TILT_RADIANS,
  };
}
