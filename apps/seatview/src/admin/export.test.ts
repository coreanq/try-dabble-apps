import { describe, it, expect } from 'vitest'
import { serializeVenue } from './export'
import { emptyState } from './admin-state'

describe('serializeVenue', () => {
  it('구역이 없으면 오류 목록을 돌려준다', () => {
    const r = serializeVenue(emptyState().venue)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('sections')
  })

  it('유효하면 들여쓰기된 JSON과 좌석 수를 돌려준다', () => {
    const s = emptyState()
    s.venue.id = 'demo'
    s.venue.name = '데모'
    s.venue.sections.push({
      id: 'A',
      shape: { type: 'polygon', points: [[-2, 10], [2, 10], [2, 14], [-2, 14]] },
      rows: 2, rowDepth: 1, riser: 0.3, baseHeight: 0, seatsPerRow: 3,
      rowLabels: 'numeric', seatNumbering: 'left-to-right',
    })
    const r = serializeVenue(s.venue)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.seatCount).toBe(6)
    expect(JSON.parse(r.json).id).toBe('demo')
    expect(r.json).toContain('\n  ')
  })
})
