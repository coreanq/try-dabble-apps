import { describe, it, expect } from 'vitest'
import { parseSeatQuery } from './seat-search'

describe('parseSeatQuery', () => {
  it.each([
    ['A구역 12열 7번', { sectionId: 'A', row: '12', seat: 7 }],
    ['A 12 7', { sectionId: 'A', row: '12', seat: 7 }],
    ['A-12-7', { sectionId: 'A', row: '12', seat: 7 }],
    ['2F-201 12 7', { sectionId: '2F-201', row: '12', seat: 7 }],
    ['  BOX-1 구역  B 열  3 번 ', { sectionId: 'BOX-1', row: 'B', seat: 3 }],
    ['A구역12열7번', { sectionId: 'A', row: '12', seat: 7 }],
    ['가구역 나열 3번', { sectionId: '가', row: '나', seat: 3 }],
  ])('%s', (input, expected) => {
    expect(parseSeatQuery(input)).toEqual(expected)
  })

  it('형식이 아니면 null', () => {
    expect(parseSeatQuery('')).toBeNull()
    expect(parseSeatQuery('A구역')).toBeNull()
    expect(parseSeatQuery('A 12 x')).toBeNull()
  })
})
