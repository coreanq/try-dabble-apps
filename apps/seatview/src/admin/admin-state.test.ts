import { describe, it, expect, beforeEach } from 'vitest'
import { emptyState, loadState, pxToWorld, saveState, worldToPx, type Calibration } from './admin-state'

const cal: Calibration = { originPx: [100, 100], pxPerMeter: 10, zSign: 1 }

describe('px ↔ world', () => {
  it('원점 기준으로 픽셀을 미터로 바꾼다', () => {
    expect(pxToWorld(cal, [150, 120])).toEqual([5, 2])
  })
  it('zSign이 -1이면 이미지 아래쪽이 -Z', () => {
    expect(pxToWorld({ ...cal, zSign: -1 }, [150, 120])).toEqual([5, -2])
  })
  it('왕복', () => {
    const p = worldToPx(cal, pxToWorld(cal, [37, 250]))
    expect(p[0]).toBeCloseTo(37, 9)
    expect(p[1]).toBeCloseTo(250, 9)
  })
})

describe('emptyState', () => {
  it('유효한 빈 공연장 초안을 만든다', () => {
    const s = emptyState()
    expect(s.venue.units).toBe('m')
    expect(s.venue.sections).toEqual([])
    expect(s.calibration.originPx).toBeNull()
  })
})

describe('loadState', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = new Map<string, string>()
    ;(globalThis as any).localStorage = {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
      clear: () => { store.clear() },
    }
  })

  it('손상된 JSON이면 emptyState()와 같다', () => {
    store.set('seatview-admin-draft', '{not valid json')
    expect(loadState()).toEqual(emptyState())
  })

  it('부분적인 초안은 base와 병합된다', () => {
    store.set('seatview-admin-draft', JSON.stringify({ venue: { id: 'x' } }))
    const s = loadState()
    expect(s.venue.id).toBe('x')
    expect(s.venue.sections).toEqual([])
    expect(s.venue.stage).toEqual(emptyState().venue.stage)
  })

  it('타입이 잘못된 필드는 기본값으로 되돌린다', () => {
    store.set(
      'seatview-admin-draft',
      JSON.stringify({ venue: { sections: null, stage: null }, calibration: { originPx: 5, zSign: 'up' } }),
    )
    const s = loadState()
    expect(s.venue.sections).toEqual([])
    expect(s.venue.stage).toEqual(emptyState().venue.stage)
    expect(s.calibration.originPx).toBeNull()
    expect(s.calibration.zSign).toBe(1)
  })

  it('saveState: 성공하면 true, localStorage가 던지면 false', () => {
    expect(saveState(emptyState())).toBe(true)
    ;(globalThis as any).localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(saveState(emptyState())).toBe(false)
  })
})
