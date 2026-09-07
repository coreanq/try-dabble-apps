import { describe, it, expect } from 'vitest'
import { sectionOutline, sectionCentroid } from './section-outline'
import type { ArcSection, ExplicitSection, PolygonSection, Stage } from './venue-schema'

const stage: Stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }

describe('sectionOutline', () => {
  it('polygon은 점을 그대로 돌려준다', () => {
    const s: PolygonSection = {
      id: 'P', shape: { type: 'polygon', points: [[0, 10], [4, 10], [4, 14]] },
      rows: 1, rowDepth: 1, riser: 0, baseHeight: 0, seatsPerRow: 1, rowLabels: 'numeric', seatNumbering: 'left-to-right',
    }
    expect(sectionOutline(s, stage)).toEqual([[0, 10], [4, 10], [4, 14]])
  })

  it('arc는 안쪽 호와 바깥쪽 호(반대 방향)를 잇는 닫힌 띠를 만든다', () => {
    const s: ArcSection = {
      id: 'A', shape: { type: 'arc', center: [0, 0], radiusStart: 10, angleStart: 0, angleEnd: 90 },
      rows: 5, rowDepth: 1, riser: 0, baseHeight: 0, seatsPerRow: 1, rowLabels: 'numeric', seatNumbering: 'left-to-right',
    }
    const pts = sectionOutline(s, stage)
    expect(pts.length).toBeGreaterThanOrEqual(8)
    // 첫 점: 안쪽 반경 10, 각도 0 → (0, 10)
    expect(pts[0][0]).toBeCloseTo(0, 5)
    expect(pts[0][1]).toBeCloseTo(10, 5)
    // 마지막 점: 바깥쪽 반경 15, 각도 0 → (0, 15)
    const last = pts[pts.length - 1]
    expect(last[0]).toBeCloseTo(0, 5)
    expect(last[1]).toBeCloseTo(15, 5)
  })

  it('explicit은 좌석 좌표 경계 상자를 0.5m 여유로 돌려준다', () => {
    const s: ExplicitSection = {
      id: 'B', shape: { type: 'explicit' },
      seats: [{ row: '1', seat: 1, position: [1, 0, 2] }, { row: '1', seat: 2, position: [3, 0, 4] }],
    }
    expect(sectionOutline(s, stage)).toEqual([[0.5, 1.5], [3.5, 1.5], [3.5, 4.5], [0.5, 4.5]])
  })
})

describe('sectionCentroid', () => {
  it('윤곽 점의 평균을 돌려준다', () => {
    expect(sectionCentroid([[0, 0], [4, 0], [4, 4], [0, 4]])).toEqual([2, 2])
  })
})
