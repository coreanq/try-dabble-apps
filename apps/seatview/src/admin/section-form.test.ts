import { describe, it, expect } from 'vitest'
import { buildSection } from './section-form'

const base = {
  id: 'A', label: '', rows: 3, rowDepth: 0.9, riser: 0.3, baseHeight: 0,
  seatsPerRow: '10', rowLabels: '', seatNumbering: 'left-to-right' as const,
  centerX: 0, centerZ: 0, radiusStart: 30, angleStart: -20, angleEnd: 20,
}

describe('buildSection', () => {
  it('polygon: 점 3개 이상이면 구역을 만든다', () => {
    const s = buildSection(base, 'polygon', [[0, 10], [4, 10], [4, 14]])
    expect(s?.shape.type).toBe('polygon')
    expect(s?.seatsPerRow).toBe(10)
    expect(s?.rowLabels).toBe('numeric')
  })
  it('polygon: 점이 부족하면 null', () => {
    expect(buildSection(base, 'polygon', [[0, 10], [4, 10]])).toBeNull()
  })
  it('seatsPerRow 쉼표 목록은 열 수와 같아야 한다', () => {
    expect(buildSection({ ...base, seatsPerRow: '10,11,12' }, 'arc', [])?.seatsPerRow).toEqual([10, 11, 12])
    expect(buildSection({ ...base, seatsPerRow: '10,11' }, 'arc', [])).toBeNull()
    expect(buildSection({ ...base, seatsPerRow: '' }, 'arc', [])).toBeNull()
  })
  it('rowLabels 목록은 열 수와 같아야 한다', () => {
    expect(buildSection({ ...base, rowLabels: 'A,B,C' }, 'arc', [])?.rowLabels).toEqual(['A', 'B', 'C'])
    expect(buildSection({ ...base, rowLabels: 'A,B' }, 'arc', [])).toBeNull()
  })
  it('arc: 각도 범위가 뒤집히면 null', () => {
    expect(buildSection({ ...base, angleEnd: -30 }, 'arc', [])).toBeNull()
  })
  it('id가 비거나 공백/금지문자를 포함하면 null', () => {
    expect(buildSection({ ...base, id: '' }, 'arc', [])).toBeNull()
    expect(buildSection({ ...base, id: 'A B' }, 'arc', [])).toBeNull()
    expect(buildSection({ ...base, id: 'A|1' }, 'arc', [])).toBeNull()
  })
  it('rows가 0이거나 정수가 아니면 null', () => {
    expect(buildSection({ ...base, rows: 0 }, 'arc', [])).toBeNull()
    expect(buildSection({ ...base, rows: 2.5 }, 'arc', [])).toBeNull()
  })
  it('rowDepth가 0 이하이면 null', () => {
    expect(buildSection({ ...base, rowDepth: 0 }, 'arc', [])).toBeNull()
  })
  it('riser가 음수이면 null', () => {
    expect(buildSection({ ...base, riser: -1 }, 'arc', [])).toBeNull()
  })
  it('rowLabels에 중복이 있으면 null', () => {
    expect(buildSection({ ...base, rowLabels: 'A,A,B' }, 'arc', [])).toBeNull()
  })
  it('rowLabels가 금지문자를 포함하면 null', () => {
    expect(buildSection({ ...base, rowLabels: 'A|1,B,C' }, 'arc', [])).toBeNull()
  })
})
