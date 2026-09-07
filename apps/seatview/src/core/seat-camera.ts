import type { Seat, Vec3 } from './seat-engine'
import type { Stage } from './venue-schema'

export const EYE_HEIGHT = 1.2

export interface CameraPose {
  position: Vec3
  target: Vec3
}

export function stageFocus(stage: Stage): Vec3 {
  return [stage.center[0], stage.center[1] + stage.size[1], stage.center[2]]
}

export function cameraForSeat(seat: Seat, stage: Stage): CameraPose {
  const [x, y, z] = seat.position
  return { position: [x, y + EYE_HEIGHT, z], target: stageFocus(stage) }
}

export function distanceToStage(seat: Seat, stage: Stage): number {
  return Math.hypot(seat.position[0] - stage.center[0], seat.position[2] - stage.center[2])
}

export type Direction = 'front' | 'back' | 'left' | 'right'

export function neighborSeat(seats: Seat[], seat: Seat, dir: Direction): Seat | undefined {
  const dr = dir === 'front' ? -1 : dir === 'back' ? 1 : 0
  const ds = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
  return seats.find(
    (s) => s.sectionId === seat.sectionId && s.rowIndex === seat.rowIndex + dr && s.seatIndex === seat.seatIndex + ds,
  )
}
