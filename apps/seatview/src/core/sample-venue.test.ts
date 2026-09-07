import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { validateVenue } from './venue-schema'
import { seatCount } from './seat-engine'

function loadJson(rel: string): unknown {
  return JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
}

describe('sample-arena', () => {
  it('index.json에 등록되어 있다', () => {
    const index = loadJson('../../public/venues/index.json') as { id: string; name: string }[]
    expect(index.some((v) => v.id === 'sample-arena')).toBe(true)
  })

  it('스키마를 통과하고 좌석 수가 2888석이다', () => {
    const r = validateVenue(loadJson('../../public/venues/sample-arena/venue.json'))
    expect(r.ok, r.ok ? '' : r.errors.join('\n')).toBe(true)
    if (!r.ok) return
    expect(seatCount(r.venue)).toBe(2888)
  })
})
