import { describe, it, expect } from 'vitest'
import { cameraForSeat, distanceToStage, neighborSeat } from './seat-camera'
import { generateSeats } from './seat-engine'
import type { PolygonSection, Stage } from './venue-schema'

const stage: Stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }

const poly: PolygonSection = {
  id: 'P',
  shape: { type: 'polygon', points: [[-3, 10], [3, 10], [3, 20], [-3, 20]] },
  rows: 3, rowDepth: 1, riser: 0.4, baseHeight: 0,
  seatsPerRow: [3, 3, 2], rowLabels: 'numeric', seatNumbering: 'left-to-right',
}
const seats = generateSeats(poly, stage)
const at = (r: number, s: number) => seats.find((x) => x.rowIndex === r && x.seatIndex === s)!

describe('cameraForSeat', () => {
  it('좌석 위치에서 눈높이만큼 올리고 무대 바닥면 중앙을 본다', () => {
    const pose = cameraForSeat(at(1, 0), stage)
    expect(pose.position[0]).toEqual(at(1, 0).position[0])
    expect(pose.position[1]).toBeCloseTo(1.6, 9)
    expect(pose.position[2]).toEqual(at(1, 0).position[2])
    expect(pose.target).toEqual([0, 1.2, 0])
  })
})

describe('distanceToStage', () => {
  it('무대 중앙까지 수평 거리', () => {
    expect(distanceToStage(at(0, 1), stage)).toBeCloseTo(10.5, 5)
  })
})

describe('neighborSeat', () => {
  it('front는 무대 쪽(rowIndex-1), back은 반대', () => {
    expect(neighborSeat(seats, at(1, 1), 'front')?.id).toBe(at(0, 1).id)
    expect(neighborSeat(seats, at(1, 1), 'back')?.id).toBe(at(2, 1).id)
  })
  it('left/right는 seatIndex ±1', () => {
    expect(neighborSeat(seats, at(1, 1), 'left')?.id).toBe(at(1, 0).id)
    expect(neighborSeat(seats, at(1, 1), 'right')?.id).toBe(at(1, 2).id)
  })
  it('경계를 넘으면 undefined', () => {
    expect(neighborSeat(seats, at(0, 0), 'front')).toBeUndefined()
    expect(neighborSeat(seats, at(1, 2), 'back')).toBeUndefined() // 3열은 2석뿐
    expect(neighborSeat(seats, at(1, 0), 'left')).toBeUndefined()
  })
})
