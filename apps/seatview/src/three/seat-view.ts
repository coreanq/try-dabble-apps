import * as THREE from 'three'
import { LookControls } from './look-controls'
import { disposeVenueGroup } from './venue-mesh'
import type { CameraPose } from '../core/seat-camera'
import type { Vec3 } from '../core/seat-engine'

interface CameraAnim {
  from: THREE.Vector3
  to: THREE.Vector3
  target: Vec3
  start: number
  ms: number
}

export class SeatView {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  private controls: LookControls
  private venueGroup: THREE.Object3D | null = null
  private shellGroup: THREE.Object3D | null = null
  private marker: THREE.Mesh
  private anim: CameraAnim | null = null
  private raf = 0
  private observer: ResizeObserver

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)
    this.scene.background = new THREE.Color(0x1b1b20)
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    this.controls = new LookControls(this.camera, this.renderer.domElement)
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffdd33 }),
    )
    this.marker.visible = false
    this.scene.add(this.marker)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(container)
    this.resize()
    this.raf = requestAnimationFrame(this.loop)
  }

  setVenue(group: THREE.Object3D): void {
    if (this.venueGroup) {
      this.scene.remove(this.venueGroup)
      disposeVenueGroup(this.venueGroup)
    }
    this.venueGroup = group
    this.scene.add(group)
  }

  setShell(group: THREE.Object3D | null): void {
    if (this.shellGroup) {
      this.scene.remove(this.shellGroup)
      disposeVenueGroup(this.shellGroup)
    }
    this.shellGroup = group
    if (group) this.scene.add(group)
  }

  /** 공연장 전체가 보이는 부감 위치 */
  showOverview(stageCenter: Vec3): void {
    this.anim = null
    this.marker.visible = false
    this.camera.position.set(stageCenter[0], 70, stageCenter[2] + 110)
    this.controls.lookAt(stageCenter)
  }

  goToSeat(pose: CameraPose, seatPosition: Vec3): void {
    this.marker.position.set(seatPosition[0], seatPosition[1] + 0.3, seatPosition[2])
    this.marker.visible = true
    this.anim = {
      from: this.camera.position.clone(),
      to: new THREE.Vector3(pose.position[0], pose.position[1], pose.position[2]),
      target: pose.target,
      start: performance.now(),
      ms: 700,
    }
  }

  setFov(deg: number): void {
    this.camera.fov = deg
    this.camera.updateProjectionMatrix()
  }

  private resize(): void {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private loop = (t: number): void => {
    this.raf = requestAnimationFrame(this.loop)
    if (this.anim) {
      const k = Math.max(0, Math.min(1, (t - this.anim.start) / this.anim.ms))
      const eased = 1 - Math.pow(1 - k, 3)
      this.camera.position.lerpVectors(this.anim.from, this.anim.to, eased)
      this.controls.lookAt(this.anim.target)
      if (k >= 1) this.anim = null
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.controls.dispose()
    if (this.venueGroup) disposeVenueGroup(this.venueGroup)
    if (this.shellGroup) disposeVenueGroup(this.shellGroup)
    this.marker.geometry.dispose()
    ;(this.marker.material as THREE.Material).dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }
}
