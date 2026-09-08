import { describe, it, expect } from 'vitest'
import { sectionOutline, sectionCentroid } from './section-outline'
import { pointInPolygon } from './seatmap-math'
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

  it('한 줄짜리 explicit(휜 장애인석)은 경계 상자가 아니라 좌석선을 따라가는 띠를 만든다', () => {
    // 반경 40, 중심 [0, 16], -40°..40°에 5석 한 줄 (장애인석과 같은 모양)
    const seats = [-40, -20, 0, 20, 40].map((deg, i) => {
      const a = (deg * Math.PI) / 180
      return { row: '1', seat: i + 1, position: [40 * Math.sin(a), 0, 16 + 40 * Math.cos(a)] as [number, number, number] }
    })
    const s: ExplicitSection = { id: 'W', shape: { type: 'explicit' }, seats }
    const pts = sectionOutline(s, stage)
    expect(pts.length).toBe(10)
    for (const p of pts) {
      const d = Math.min(...seats.map((q) => Math.hypot(q.position[0] - p[0], q.position[2] - p[1])))
      expect(d).toBeLessThanOrEqual(0.6)
    }
    // 띠의 깊이는 호 자체의 처짐 + 띠 폭 정도여야 한다 (경계 상자면 깊이 = 처짐 그대로 커진 사각형)
    const zs = seats.map((q) => q.position[2])
    const sag = Math.max(...zs) - Math.min(...zs)
    const depth = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]))
    expect(depth).toBeLessThanOrEqual(sag + 1.2)
  })

  it('여러 열 explicit은 앞열과 뒷열을 잇는 띠를 만든다', () => {
    const s: ExplicitSection = {
      id: 'B', shape: { type: 'explicit' },
      seats: [
        { row: '1', seat: 1, position: [0, 0, 10] }, { row: '1', seat: 2, position: [1, 0, 10] }, { row: '1', seat: 3, position: [2, 0, 10] },
        { row: '2', seat: 1, position: [0, 0, 11] }, { row: '2', seat: 2, position: [1, 0, 11] }, { row: '2', seat: 3, position: [2, 0, 11] },
      ],
    }
    // 좌석이 곧 윤곽의 꼭짓점이므로(점-다각형 판정은 경계에서 불안정) 구성으로 확인한다
    expect(sectionOutline(s, stage)).toEqual([[0, 10], [1, 10], [2, 10], [2, 11], [1, 11], [0, 11]])
    expect(pointInPolygon([1, 10.5], sectionOutline(s, stage))).toBe(true)
  })

  it('열마다 폭이 다르면 중간 열의 양 끝도 윤곽에 들어간다', () => {
    const s: ExplicitSection = {
      id: 'C', shape: { type: 'explicit' },
      seats: [
        { row: '1', seat: 1, position: [0, 0, 10] },
        { row: '2', seat: 1, position: [-3, 0, 11] }, { row: '2', seat: 2, position: [3, 0, 11] },
        { row: '3', seat: 1, position: [0, 0, 12] },
      ],
    }
    expect(sectionOutline(s, stage)).toEqual([[0, 10], [3, 11], [0, 12], [-3, 11]])
  })

  it('좌석이 하나뿐인 explicit은 작은 사각형을 돌려준다', () => {
    const s: ExplicitSection = {
      id: 'D', shape: { type: 'explicit' }, seats: [{ row: '1', seat: 1, position: [2, 0, 5] }],
    }
    expect(sectionOutline(s, stage)).toEqual([[1.5, 4.5], [2.5, 4.5], [2.5, 5.5], [1.5, 5.5]])
  })
})

describe('sectionCentroid', () => {
  it('윤곽 점의 평균을 돌려준다', () => {
    expect(sectionCentroid([[0, 0], [4, 0], [4, 4], [0, 4]])).toEqual([2, 2])
  })
})
