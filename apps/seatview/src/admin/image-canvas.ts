import type { Vec2 } from '../core/section-outline'
import { sectionOutline } from '../core/section-outline'
import { fitTransform, pan, screenToWorld, worldToScreen, zoomAt, type Transform } from '../core/seatmap-math'
import { isCalibrated, worldToPx, type AdminState } from './admin-state'

export interface ImageCanvasCallbacks {
  /** 드래그가 아닌 클릭. 이미지 픽셀 좌표 */
  onClick: (px: Vec2) => void
}

export class ImageCanvas {
  private ctx: CanvasRenderingContext2D
  private img: HTMLImageElement | null = null
  private t: Transform = { scale: 1, offsetX: 0, offsetY: 0 }
  private dragging = false
  private moved = false
  private pointerId: number | null = null
  private last: Vec2 = [0, 0]
  private observer: ResizeObserver
  private needsFit = false
  /** 작업 중인 임시 점들(픽셀). 폴리곤 그리는 중, 난간 첫 점 등 */
  pendingPx: Vec2[] = []
  private state: AdminState

  constructor(
    private canvas: HTMLCanvasElement,
    state: AdminState,
    private cb: ImageCanvasCallbacks,
  ) {
    this.state = state
    this.ctx = canvas.getContext('2d')!
    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointercancel', this.onCancel)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.observer = new ResizeObserver(() => { this.syncSize(); if (this.needsFit) this.fit(); else this.draw() })
    this.observer.observe(canvas)
    this.syncSize()
  }

  setState(state: AdminState): void {
    this.state = state
    this.draw()
  }

  async setImage(dataUrl: string | null): Promise<void> {
    if (!dataUrl) {
      this.img = null
      this.draw()
      return
    }
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다'))
      img.src = dataUrl
    })
    this.img = img
    this.needsFit = true
    this.fit()
  }

  fit(): void {
    if (!this.img) return
    if (!this.width || !this.height) return
    this.needsFit = false
    this.t = fitTransform({ minX: 0, maxX: this.img.width, minZ: 0, maxZ: this.img.height }, this.width, this.height, 10)
    this.draw()
  }

  private get width(): number { return this.canvas.clientWidth }
  private get height(): number { return this.canvas.clientHeight }

  private syncSize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.max(1, Math.round(this.width * dpr))
    this.canvas.height = Math.max(1, Math.round(this.height * dpr))
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private dot(px: Vec2, color: string, r = 5): void {
    const s = worldToScreen(this.t, px)
    this.ctx.beginPath()
    this.ctx.arc(s[0], s[1], r, 0, Math.PI * 2)
    this.ctx.fillStyle = color
    this.ctx.fill()
  }

  private path(pxs: Vec2[], close: boolean): void {
    this.ctx.beginPath()
    pxs.forEach((p, i) => {
      const s = worldToScreen(this.t, p)
      if (i === 0) this.ctx.moveTo(s[0], s[1])
      else this.ctx.lineTo(s[0], s[1])
    })
    if (close) this.ctx.closePath()
  }

  draw(): void {
    const { ctx } = this
    const W = this.width
    const H = this.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#e9e9ee'
    ctx.fillRect(0, 0, W, H)
    if (this.img) {
      const s = worldToScreen(this.t, [0, 0])
      ctx.drawImage(this.img, s[0], s[1], this.img.width * this.t.scale, this.img.height * this.t.scale)
    }

    const cal = this.state.calibration
    if (cal.originPx) this.dot(cal.originPx, '#7c4dff', 6)

    if (isCalibrated(cal)) {
      const { stage, sections, obstacles } = this.state.venue
      // 무대
      const [cx, , cz] = stage.center
      const [w, , d] = stage.size
      const corners: Vec2[] = [[cx - w / 2, cz - d / 2], [cx + w / 2, cz - d / 2], [cx + w / 2, cz + d / 2], [cx - w / 2, cz + d / 2]]
      this.path(corners.map((p) => worldToPx(cal, p)), true)
      ctx.fillStyle = 'rgba(124, 77, 255, 0.35)'
      ctx.fill()
      // 구역
      ctx.lineWidth = 1.5
      for (const section of sections) {
        let outline: Vec2[]
        try {
          outline = sectionOutline(section, stage)
        } catch {
          continue
        }
        this.path(outline.map((p) => worldToPx(cal, p)), true)
        ctx.fillStyle = 'rgba(80, 110, 200, 0.25)'
        ctx.strokeStyle = '#2f3f8f'
        ctx.fill()
        ctx.stroke()
      }
      // 방해물
      for (const o of obstacles) {
        if (o.type === 'pillar') this.dot(worldToPx(cal, [o.position[0], o.position[2]]), '#333', 5)
        else {
          this.path([worldToPx(cal, [o.from[0], o.from[2]]), worldToPx(cal, [o.to[0], o.to[2]])], false)
          ctx.strokeStyle = '#333'
          ctx.lineWidth = 3
          ctx.stroke()
        }
      }
    }

    // 작업 중인 점
    if (this.pendingPx.length) {
      this.path(this.pendingPx, false)
      ctx.strokeStyle = '#e53935'
      ctx.lineWidth = 1.5
      ctx.stroke()
      for (const p of this.pendingPx) this.dot(p, '#e53935', 4)
    }
  }

  private local(e: PointerEvent | WheelEvent): Vec2 {
    const r = this.canvas.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0 || this.dragging) return
    this.dragging = true
    this.moved = false
    this.pointerId = e.pointerId
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
    if (Math.abs(dx) + Math.abs(dy) > 4) this.moved = true
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
    const px = screenToWorld(this.t, this.local(e))
    this.cb.onClick([Math.round(px[0] * 10) / 10, Math.round(px[1] * 10) / 10])
  }

  private onCancel = (): void => {
    this.dragging = false
    this.pointerId = null
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    this.t = zoomAt(this.t, this.local(e), Math.exp(-e.deltaY * 0.002))
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
