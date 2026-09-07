import * as THREE from 'three'
import type { Vec3 } from '../core/seat-engine'

const MAX_PITCH = (85 * Math.PI) / 180

export class LookControls {
  yaw = 0
  pitch = 0
  enabled = true
  private dragging = false
  private lastX = 0
  private lastY = 0
  private pointerId: number | null = null

  constructor(
    private camera: THREE.PerspectiveCamera,
    private dom: HTMLElement,
  ) {
    dom.style.touchAction = 'none'
    dom.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
    window.addEventListener('pointercancel', this.onUp)
  }

  /** 현재 카메라 위치에서 target을 바라보도록 yaw/pitch를 맞춘다 */
  lookAt(target: Vec3): void {
    const d = new THREE.Vector3(target[0], target[1], target[2]).sub(this.camera.position)
    this.yaw = Math.atan2(d.x, d.z)
    this.pitch = Math.asin(THREE.MathUtils.clamp(d.y / d.length(), -1, 1))
    this.apply()
  }

  apply(): void {
    const cp = Math.cos(this.pitch)
    const dir = new THREE.Vector3(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp)
    this.camera.lookAt(this.camera.position.clone().add(dir))
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.enabled || e.button !== 0) return
    this.dragging = true
    this.pointerId = e.pointerId
    this.lastX = e.clientX
    this.lastY = e.clientY
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.dragging || e.pointerId !== this.pointerId) return
    const dx = e.clientX - this.lastX
    const dy = e.clientY - this.lastY
    this.lastX = e.clientX
    this.lastY = e.clientY
    const k = 0.004 * (this.camera.fov / 60)
    this.yaw -= dx * k
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -MAX_PITCH, MAX_PITCH)
    this.apply()
  }

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return
    this.dragging = false
    this.pointerId = null
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerup', this.onUp)
    window.removeEventListener('pointercancel', this.onUp)
  }
}
