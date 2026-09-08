import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { validateVenue } from './venue-schema'
import { allSeats, seatCount } from './seat-engine'

function loadJson(rel: string): unknown {
  return JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
}

describe('kspo-dome', () => {
  it('index.json에 등록되어 있다', () => {
    const index = loadJson('../../public/venues/index.json') as { id: string; name: string }[]
    expect(index.some((v) => v.id === 'kspo-dome')).toBe(true)
  })

  it('스키마를 통과하고 좌석 수가 보고서와 같다', () => {
    const r = validateVenue(loadJson('../../public/venues/kspo-dome/venue.json'))
    expect(r.ok, r.ok ? '' : r.errors.join('\n')).toBe(true)
    if (!r.ok) return
    expect(seatCount(r.venue)).toBe(14160) // tools/kspo-dome/fit-report.txt의 TOTAL
    expect(r.venue.credit).toContain('공공누리')
    expect(r.venue.shell?.glb).toBe('/venues/kspo-dome/shell.glb')
  })

  it('모든 좌석이 아레나 안(무대 중심에서 120 m 이내)에 있고 높이가 -0.5 이상 40 m 미만이다', () => {
    const r = validateVenue(loadJson('../../public/venues/kspo-dome/venue.json'))
    if (!r.ok) throw new Error(r.errors.join('\n'))
    for (const s of allSeats(r.venue)) {
      expect(Math.hypot(s.position[0], s.position[2]), s.id).toBeLessThan(120)
      expect(s.position[1], s.id).toBeGreaterThanOrEqual(-0.5)
      expect(s.position[1], s.id).toBeLessThan(40)
    }
  })
})
