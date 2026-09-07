import { describe, it, expect } from 'vitest'
import { assetUrl, venueJsonUrl } from './assets'

describe('assetUrl', () => {
  it('BASE_URL 뒤에 경로를 붙이고 슬래시를 하나로 맞춘다', () => {
    // vitest 기본 BASE_URL은 '/'
    expect(assetUrl('/venues/index.json')).toBe('/venues/index.json')
    expect(assetUrl('venues/index.json')).toBe('/venues/index.json')
    expect(venueJsonUrl('sample-arena')).toBe('/venues/sample-arena/venue.json')
  })
})
