import type { Seat } from '../core/seat-engine'
import type { Section, Venue } from '../core/venue-schema'
import { sectionCentroid, sectionOutline, type Vec2 } from '../core/section-outline'
import {
  boundsOf, expandBounds, fitTransform, nearestSeat, pan, pointInPolygon, screenToWorld, worldToScreen, zoomAt,
  type Transform,
} from '../core/seatmap-math'

/** 이 배율(px/m) 이상이면 개별 좌석을 그리고 클릭할 수 있다 */
export const SEAT_ZOOM = 6
const CLICK_TOLERANCE_PX = 4

interface OutlineEntry { section: Section; pts: Vec2[]; center: Vec2 }

export interface SeatMapCallbacks {
  onSeat: (seat: Seat) => void
}

export class SeatMap2D {
  private ctx: CanvasRenderingContext2D
  private t: Transform = { scale: 1, offsetX: 0, offsetY: 0 }
  private outlines: OutlineEntry[]
  private selectedId: string | null = null
  private dragging = false
  private moved = false
  private last: Vec2 = [0, 0]
  private observer: ResizeObserver
  private pointerId: number | null = null
  private lastW = 0
  private lastH = 0
  private fitScale = 1
  private focusedSectionId: string | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private venue: Venue,
    private seats: Seat[],
    private cb: SeatMapCallbacks,
  ) {
    this.ctx = canvas.getContext('2d')!
    this.outlines = venue.sections.map((section) => {
      const pts = sectionOutline(section, venue.stage)
      return { section, pts, center: sectionCentroid(pts) }
    })
    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointercancel', this.onCancel)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.observer = new ResizeObserver(() => this.onResize())
    this.observer.observe(canvas)
    this.syncSize()
    if (this.width > 0 && this.height > 0) {
      this.fitAll()
      this.lastW = this.width
      this.lastH = this.height
    }
  }

  private get width(): number { return this.canvas.clientWidth }
  private get height(): number { return this.canvas.clientHeight }

  private syncSize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.max(1, Math.round(this.width * dpr))
    this.canvas.height = Math.max(1, Math.round(this.height * dpr))
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /** 리사이즈 시 이전 캔버스 중심의 월드 좌표가 화면에서 같은 자리에 남도록 offset을 보정한다 */
  private onResize(): void {
    const newW = this.width
    const newH = this.height
    if (!newW || !newH) return
    if (this.lastW === 0 || this.lastH === 0) {
      this.syncSize()
      this.fitAll()
      this.lastW = newW
      this.lastH = newH
      return
    }
    const [wx, wz] = screenToWorld(this.t, [this.lastW / 2, this.lastH / 2])
    this.syncSize()
    this.t.offsetX = newW / 2 - wx * this.t.scale
    this.t.offsetY = newH / 2 - wz * this.t.scale
    this.draw()
    this.lastW = newW
    this.lastH = newH
  }

  private allPoints(): Vec2[] {
    const [cx, , cz] = this.venue.stage.center
    const [w, , d] = this.venue.stage.size
    const stage: Vec2[] = [[cx - w / 2, cz - d / 2], [cx + w / 2, cz + d / 2]]
    return [...stage, ...this.outlines.flatMap((o) => o.pts)]
  }

  fitAll(): void {
    this.t = fitTransform(expandBounds(boundsOf(this.allPoints()), 2), this.width, this.height)
    this.fitScale = this.t.scale
    this.focusedSectionId = null
    this.draw()
  }

  zoomToSection(id: string): void {
    const o = this.outlines.find((x) => x.section.id === id)
    if (!o) return
    let t = fitTransform(expandBounds(boundsOf(o.pts), 1), this.width, this.height)
    if (t.scale < SEAT_ZOOM) {
      t = { scale: SEAT_ZOOM, offsetX: this.width / 2 - o.center[0] * SEAT_ZOOM, offsetY: this.height / 2 - o.center[1] * SEAT_ZOOM }
    }
    this.t = t
    this.focusedSectionId = id
    this.draw()
  }

  setSelected(seatId: string | null): void {
    this.selectedId = seatId
    this.draw()
  }

  /** 선택 좌석이 화면에 들어오도록 그 구역으로 확대 */
  focusSeat(seat: Seat): void {
    this.selectedId = seat.id
    this.zoomToSection(seat.sectionId)
  }

  draw(): void {
    const { ctx, t } = this
    const W = this.width
    const H = this.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#f4f4f6'
    ctx.fillRect(0, 0, W, H)

    // 무대
    const [cx, , cz] = this.venue.stage.center
    const [w, , d] = this.venue.stage.size
    const s0 = worldToScreen(t, [cx - w / 2, cz - d / 2])
    const s1 = worldToScreen(t, [cx + w / 2, cz + d / 2])
    ctx.fillStyle = '#7c4dff'
    ctx.fillRect(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1])
    ctx.fillStyle = '#fff'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('STAGE', (s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2)

    // 구역
    for (const o of this.outlines) {
      ctx.beginPath()
      o.pts.forEach((p, i) => {
        const s = worldToScreen(t, p)
        if (i === 0) ctx.moveTo(s[0], s[1])
        else ctx.lineTo(s[0], s[1])
      })
      ctx.closePath()
      ctx.fillStyle = 'rgba(80, 110, 200, 0.18)'
      ctx.strokeStyle = '#4a5fa8'
      ctx.lineWidth = 1
      ctx.fill()
      ctx.stroke()
      const c = worldToScreen(t, o.center)
      ctx.fillStyle = '#233'
      ctx.fillText(o.section.label ?? o.section.id, c[0], c[1])
    }

    // 좌석
    if (t.scale >= SEAT_ZOOM) {
      const r = Math.min(t.scale * 0.3, 5)
      ctx.fillStyle = '#c23a4a'
      ctx.beginPath()
      for (const seat of this.seats) {
        const sx = seat.position[0] * t.scale + t.offsetX
        const sy = seat.position[2] * t.scale + t.offsetY
        if (sx < -r || sy < -r || sx > W + r || sy > H + r) continue
        ctx.rect(sx - r, sy - r, r * 2, r * 2)
      }
      ctx.fill()
    }

    // 선택 좌석
    if (this.selectedId) {
      const seat = this.seats.find((x) => x.id === this.selectedId)
      if (seat) {
        const s = worldToScreen(t, [seat.position[0], seat.position[2]])
        ctx.beginPath()
        ctx.arc(s[0], s[1], Math.max(6, t.scale * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = '#ffdd33'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()
      }
    }
  }

  private local(e: PointerEvent | WheelEvent): Vec2 {
    const r = this.canvas.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0) return
    this.dragging = true
    this.pointerId = e.pointerId
    this.moved = false
    this.last = this.local(e)
    try {
      this.canvas.setPointerCapture(e.pointerId)
    } catch {
      // 합성 이벤트 등 활성 포인터가 없는 경우. 캡처 없이도 드래그는 동작한다.
    }
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.dragging || e.pointerId !== this.pointerId) return
    const p = this.local(e)
    const dx = p[0] - this.last[0]
    const dy = p[1] - this.last[1]
    if (Math.abs(dx) + Math.abs(dy) > CLICK_TOLERANCE_PX) this.moved = true
    if (this.moved) {
      this.t = pan(this.t, dx, dy)
      this.last = p
      this.draw()
    }
  }

  private onUp = (e: PointerEvent): void => {
    if (!this.dragging || e.pointerId !== this.pointerId) return
    this.dragging = false
    this.pointerId = null
    if (this.moved) return
    this.click(this.local(e))
  }

  private onCancel = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return
    this.dragging = false
    this.pointerId = null
  }

  private click(s: Vec2): void {
    const w = screenToWorld(this.t, s)
    if (this.t.scale >= SEAT_ZOOM) {
      const seat = nearestSeat(this.seats, w, 0.5)
      if (seat) {
        this.cb.onSeat(seat)
        return
      }
      const hit = this.outlines.find((o) => pointInPolygon(w, o.pts))
      if (hit && hit.section.id !== this.focusedSectionId) this.zoomToSection(hit.section.id)
      return
    }
    const hit = this.outlines.find((o) => pointInPolygon(w, o.pts))
    if (hit) this.zoomToSection(hit.section.id)
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const local = this.local(e)
    const factor = Math.exp(-e.deltaY * 0.002)
    const zoomed = zoomAt(this.t, local, factor)
    const min = this.fitScale * 0.5
    const max = 60
    if (zoomed.scale < min || zoomed.scale > max) {
      const clampedScale = Math.min(max, Math.max(min, zoomed.scale))
      this.t = zoomAt(this.t, local, clampedScale / this.t.scale)
    } else {
      this.t = zoomed
    }
    this.draw()
  }

  dispose(): void {
    this.observer.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointercancel', this.onCancel)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }
}
