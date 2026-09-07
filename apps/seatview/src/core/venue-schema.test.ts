import { describe, it, expect } from 'vitest'
import { validateVenue } from './venue-schema'

const stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }

const arcSection = {
  id: 'A',
  shape: { type: 'arc', center: [0, 0], radiusStart: 25, angleStart: -30, angleEnd: 30 },
  rows: 3,
  rowDepth: 0.9,
  riser: 0.35,
  baseHeight: 0,
  seatsPerRow: 10,
}

function venue(overrides: Record<string, unknown> = {}) {
  return { id: 'test-venue', name: '테스트', units: 'm', stage, sections: [arcSection], ...overrides }
}

describe('validateVenue', () => {
  it('유효한 최소 공연장을 통과시키고 기본값을 채운다', () => {
    const r = validateVenue(venue())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.venue.obstacles).toEqual([])
    const s = r.venue.sections[0]
    if (!('rows' in s)) throw new Error('grid section expected')
    expect(s.rowLabels).toBe('numeric')
    expect(s.seatNumbering).toBe('left-to-right')
  })

  it('stage가 없으면 실패한다', () => {
    const r = validateVenue(venue({ stage: undefined }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.some((e) => e.startsWith('stage'))).toBe(true)
  })

  it('seatsPerRow 배열 길이가 rows와 다르면 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, seatsPerRow: [10, 10] }] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('seatsPerRow')
  })

  it('rowLabels 배열 길이가 rows와 다르면 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, rowLabels: ['A'] }] }))
    expect(r.ok).toBe(false)
  })

  it('arc의 angleEnd가 angleStart 이하이면 실패한다', () => {
    const bad = { ...arcSection, shape: { ...arcSection.shape, angleEnd: -30 } }
    const r = validateVenue(venue({ sections: [bad] }))
    expect(r.ok).toBe(false)
  })

  it('구역 id가 중복되면 실패한다', () => {
    const r = validateVenue(venue({ sections: [arcSection, { ...arcSection }] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('중복')
  })

  it('polygon 구역은 점 3개 이상이어야 한다', () => {
    const poly = { ...arcSection, id: 'P', shape: { type: 'polygon', points: [[0, 10], [5, 10]] } }
    const r = validateVenue(venue({ sections: [poly] }))
    expect(r.ok).toBe(false)
  })

  it('explicit 구역은 seats 배열로 통과한다', () => {
    const ex = { id: 'BOX', shape: { type: 'explicit' }, seats: [{ row: '1', seat: 1, position: [1, 2, 3] }] }
    const r = validateVenue(venue({ sections: [ex] }))
    expect(r.ok).toBe(true)
  })

  it('지원하지 않는 shape type은 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, shape: { type: 'circle' } }] }))
    expect(r.ok).toBe(false)
  })

  it('obstacles를 검증한다', () => {
    const ok = validateVenue(venue({ obstacles: [{ type: 'pillar', position: [0, 0, 5], radius: 0.4, height: 10 }] }))
    expect(ok.ok).toBe(true)
    const bad = validateVenue(venue({ obstacles: [{ type: 'pillar', position: [0, 0, 5] }] }))
    expect(bad.ok).toBe(false)
  })

  it('알 수 없는 키가 있으면 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, rowLabel: ['a', 'b', 'c'] }] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('rowLabel')
  })

  it('rowLabels에 중복된 열 이름이 있으면 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, rowLabels: ['A', 'A', 'B'] }] }))
    expect(r.ok).toBe(false)
  })

  it('explicit 구역에 중복된 좌석이 있으면 실패한다', () => {
    const ex = {
      id: 'BOX',
      shape: { type: 'explicit' },
      seats: [
        { row: '1', seat: 1, position: [1, 2, 3] },
        { row: '1', seat: 1, position: [4, 5, 6] },
      ],
    }
    const r = validateVenue(venue({ sections: [ex] }))
    expect(r.ok).toBe(false)
  })

  it('seatsPerRow 오류 메시지에 경로 접두사가 포함된다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, seatsPerRow: [10, 10] }] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors).toEqual(['sections.0.seatsPerRow: seatsPerRow 배열 길이(2)가 rows(3)와 다릅니다'])
  })

  it('seatsPerRow 배열 길이가 rows와 같으면 통과한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, seatsPerRow: [10, 11, 12] }] }))
    expect(r.ok).toBe(true)
  })

  it('구역 id에 공백이 있으면 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, id: 'A B' }] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('id')
  })

  it('polygon 앞변(첫 두 점)의 길이가 0이면 실패한다', () => {
    const poly = {
      ...arcSection,
      id: 'P',
      shape: { type: 'polygon', points: [[0, 10], [0, 10], [4, 14], [0, 14]] },
    }
    const r = validateVenue(venue({ sections: [poly] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('points')
  })
})
