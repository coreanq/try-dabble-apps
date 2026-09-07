import type { Venue } from '../core/venue-schema'
import type { Vec2 } from '../core/section-outline'

export interface Calibration {
  /** 무대 중앙(원점)의 이미지 픽셀 좌표 */
  originPx: Vec2 | null
  pxPerMeter: number | null
  /** 이미지 아래쪽이 +Z(관중석)면 1, 위쪽이 관중석이면 -1 */
  zSign: 1 | -1
}

export interface AdminState {
  imageDataUrl: string | null
  calibration: Calibration
  venue: Venue
}

const STORAGE_KEY = 'seatview-admin-draft'

export function emptyState(): AdminState {
  return {
    imageDataUrl: null,
    calibration: { originPx: null, pxPerMeter: null, zSign: 1 },
    venue: {
      id: 'new-venue',
      name: '새 공연장',
      units: 'm',
      stage: { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] },
      sections: [],
      obstacles: [],
    },
  }
}

export function isCalibrated(c: Calibration): c is Calibration & { originPx: Vec2; pxPerMeter: number } {
  return c.originPx !== null && c.pxPerMeter !== null
}

export function pxToWorld(c: Calibration, px: Vec2): Vec2 {
  if (!isCalibrated(c)) throw new Error('스케일과 원점을 먼저 지정하세요')
  return [(px[0] - c.originPx[0]) / c.pxPerMeter, ((px[1] - c.originPx[1]) / c.pxPerMeter) * c.zSign]
}

export function worldToPx(c: Calibration, w: Vec2): Vec2 {
  if (!isCalibrated(c)) throw new Error('스케일과 원점을 먼저 지정하세요')
  return [w[0] * c.pxPerMeter + c.originPx[0], (w[1] * c.zSign) * c.pxPerMeter + c.originPx[1]]
}

export function loadState(): AdminState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed: unknown = JSON.parse(raw)
    const base = emptyState()
    if (typeof parsed !== 'object' || parsed === null) return emptyState()
    const p = parsed as Record<string, unknown>

    const v: any = { ...base.venue, ...(typeof p.venue === 'object' && p.venue ? p.venue : {}) }
    if (!Array.isArray(v.sections)) v.sections = []
    if (!Array.isArray(v.obstacles)) v.obstacles = []
    if (!v.stage || !Array.isArray(v.stage.center) || !Array.isArray(v.stage.size) || !Array.isArray(v.stage.facing)) v.stage = base.venue.stage
    if (typeof v.id !== 'string') v.id = base.venue.id
    if (typeof v.name !== 'string') v.name = base.venue.name
    v.units = 'm'

    const c: any = { ...base.calibration, ...(typeof p.calibration === 'object' && p.calibration ? p.calibration : {}) }
    if (!Array.isArray(c.originPx) || c.originPx.length !== 2) c.originPx = null
    if (typeof c.pxPerMeter !== 'number' || !(c.pxPerMeter > 0)) c.pxPerMeter = null
    if (c.zSign !== -1) c.zSign = 1

    return {
      imageDataUrl: typeof p.imageDataUrl === 'string' ? p.imageDataUrl : null,
      calibration: c,
      venue: v,
    }
  } catch {
    return emptyState()
  }
}

export function saveState(s: AdminState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return true
  } catch {
    // 용량 초과 등. 자동 저장 실패는 치명적이지 않다.
    return false
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
