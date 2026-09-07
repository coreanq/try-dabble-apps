import { describe, it, expect } from 'vitest'
import {
  boundsOf, expandBounds, fitTransform, worldToScreen, screenToWorld, zoomAt, pan, pointInPolygon, nearestSeat,
} from './seatmap-math'
import type { Seat } from './seat-engine'
import { sectionOutline } from './section-outline'
import type { ArcSection, Stage } from './venue-schema'

describe('bounds', () => {
  it('boundsOf/expandBounds', () => {
    const b = boundsOf([[1, 2], [5, -3], [2, 9]])
    expect(b).toEqual({ minX: 1, maxX: 5, minZ: -3, maxZ: 9 })
    expect(expandBounds(b, 1)).toEqual({ minX: 0, maxX: 6, minZ: -4, maxZ: 10 })
  })
})

describe('fitTransform', () => {
  it('경계 중심을 캔버스 중심에 놓고 패딩 안에 들어가게 축소한다', () => {
    const t = fitTransform({ minX: -10, maxX: 10, minZ: 0, maxZ: 40 }, 200, 200, 20)
    expect(t.scale).toBeCloseTo(160 / 40, 5)
    expect(worldToScreen(t, [0, 20])).toEqual([100, 100])
  })

  it('퇴화 경계와 작은 캔버스도 양수 scale', () => {
    const degenerate = fitTransform({ minX: 3, maxX: 3, minZ: 3, maxZ: 3 }, 200, 200)
    expect(degenerate.scale).toBeGreaterThan(0)
    expect(Number.isFinite(degenerate.scale)).toBe(true)

    const small = fitTransform({ minX: 0, maxX: 10, minZ: 0, maxZ: 10 }, 10, 10, 20)
    expect(small.scale).toBeGreaterThan(0)
  })
})

describe('transform roundtrip / zoom / pan', () => {
  const t = { scale: 4, offsetX: 50, offsetY: 30 }
  it('worldToScreen ↔ screenToWorld', () => {
    const w = screenToWorld(t, worldToScreen(t, [3, -7]))
    expect(w[0]).toBeCloseTo(3, 9)
    expect(w[1]).toBeCloseTo(-7, 9)
  })
  it('zoomAt은 커서 아래 월드 점을 고정한다', () => {
    const before = screenToWorld(t, [120, 80])
    const z = zoomAt(t, [120, 80], 2)
    expect(z.scale).toBe(8)
    const after = screenToWorld(z, [120, 80])
    expect(after[0]).toBeCloseTo(before[0], 9)
    expect(after[1]).toBeCloseTo(before[1], 9)
  })
  it('pan은 offset만 옮긴다', () => {
    expect(pan(t, 5, -3)).toEqual({ scale: 4, offsetX: 55, offsetY: 27 })
  })
})

describe('pointInPolygon', () => {
  const sq: [number, number][] = [[0, 0], [4, 0], [4, 4], [0, 4]]
  it('안/밖', () => {
    expect(pointInPolygon([2, 2], sq)).toBe(true)
    expect(pointInPolygon([5, 2], sq)).toBe(false)
  })

  it('arc 띠 안/구멍/각도 밖', () => {
    const section: ArcSection = {
      id: 'a',
      rows: 5,
      rowDepth: 1,
      riser: 0,
      baseHeight: 0,
      seatsPerRow: 1,
      rowLabels: 'numeric',
      seatNumbering: 'left-to-right',
      shape: { type: 'arc', center: [0, 0], radiusStart: 10, angleStart: 0, angleEnd: 90 },
    }
    const stage: Stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }
    const outline = sectionOutline(section, stage)

    const deg45 = (45 * Math.PI) / 180
    const deg135 = (135 * Math.PI) / 180
    const inside: [number, number] = [12 * Math.sin(deg45), 12 * Math.cos(deg45)]
    const insideRadiusTooSmall: [number, number] = [5 * Math.sin(deg45), 5 * Math.cos(deg45)]
    const outsideAngle: [number, number] = [12 * Math.sin(deg135), 12 * Math.cos(deg135)]

    expect(pointInPolygon(inside, outline)).toBe(true)
    expect(pointInPolygon(insideRadiusTooSmall, outline)).toBe(false)
    expect(pointInPolygon(outsideAngle, outline)).toBe(false)
  })
})

describe('nearestSeat', () => {
  const mk = (id: string, x: number, z: number): Seat =>
    ({ id, sectionId: 'A', row: '1', seat: 1, rowIndex: 0, seatIndex: 0, position: [x, 0, z] })
  const seats = [mk('a', 0, 0), mk('b', 1, 0), mk('c', 5, 5)]
  it('최대 거리 안의 가장 가까운 좌석', () => {
    expect(nearestSeat(seats, [0.8, 0.1], 0.5)?.id).toBe('b')
    expect(nearestSeat(seats, [3, 3], 0.5)).toBeUndefined()
  })

  it('정확히 maxDist는 제외', () => {
    const single = [mk('a', 0, 0)]
    expect(nearestSeat(single, [0.5, 0], 0.5)).toBeUndefined()
  })
})
