import { describe, it, expect } from 'vitest'
import { parseRoute, buildVenueHash } from './router'

describe('parseRoute', () => {
  it('빈 해시나 알 수 없는 경로는 목록', () => {
    expect(parseRoute('')).toEqual({ page: 'list' })
    expect(parseRoute('#/')).toEqual({ page: 'list' })
    expect(parseRoute('#/foo')).toEqual({ page: 'list' })
  })
  it('공연장만', () => {
    expect(parseRoute('#/v/kspo-dome')).toEqual({ page: 'venue', venueId: 'kspo-dome' })
  })
  it('공연장 + 좌석', () => {
    expect(parseRoute('#/v/kspo-dome?s=A&r=12&n=7')).toEqual({
      page: 'venue', venueId: 'kspo-dome', seat: { sectionId: 'A', row: '12', seat: 7 },
    })
  })
  it('좌석 파라미터가 불완전하면 seat 없음', () => {
    expect(parseRoute('#/v/kspo-dome?s=A&r=12')).toEqual({ page: 'venue', venueId: 'kspo-dome' })
    expect(parseRoute('#/v/kspo-dome?s=A&r=12&n=x')).toEqual({ page: 'venue', venueId: 'kspo-dome' })
  })
  it('추가 파라미터는 무시', () => {
    expect(parseRoute('#/v/kspo-dome?s=A&r=12&n=7&foo=bar')).toEqual({
      page: 'venue', venueId: 'kspo-dome', seat: { sectionId: 'A', row: '12', seat: 7 },
    })
  })
})

describe('buildVenueHash', () => {
  it('왕복', () => {
    const h = buildVenueHash('sample-arena', { sectionId: '2F-201', row: 'B', seat: 3 })
    expect(h).toBe('#/v/sample-arena?s=2F-201&r=B&n=3')
    expect(parseRoute(h)).toEqual({ page: 'venue', venueId: 'sample-arena', seat: { sectionId: '2F-201', row: 'B', seat: 3 } })
  })
  it('좌석 없이', () => {
    expect(buildVenueHash('x')).toBe('#/v/x')
  })
  it('한글 왕복', () => {
    const h = buildVenueHash('x', { sectionId: '가구역', row: '나열', seat: 7 })
    expect(h).toContain('%EA%B0%80')
    expect(parseRoute(h)).toEqual({ page: 'venue', venueId: 'x', seat: { sectionId: '가구역', row: '나열', seat: 7 } })
  })
  it('예약 문자 왕복', () => {
    const h = buildVenueHash('x', { sectionId: 'A&B', row: '1+2', seat: 3 })
    expect(parseRoute(h)).toEqual({ page: 'venue', venueId: 'x', seat: { sectionId: 'A&B', row: '1+2', seat: 3 } })
  })
})
