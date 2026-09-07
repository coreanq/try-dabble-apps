import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'
import { buildVenueGroup, disposeVenueGroup } from './venue-mesh'
import { allSeats } from '../core/seat-engine'
import type { Venue } from '../core/venue-schema'

const venue: Venue = {
  id: 'v', name: 'V', units: 'm',
  stage: { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] },
  sections: [
    {
      id: 'P', shape: { type: 'polygon', points: [[-2, 10], [2, 10], [2, 14], [-2, 14]] },
      rows: 2, rowDepth: 1, riser: 0.4, baseHeight: 3, seatsPerRow: 2, rowLabels: 'numeric', seatNumbering: 'left-to-right',
    },
  ],
  obstacles: [
    { type: 'pillar', position: [5, 0, 5], radius: 0.4, height: 10 },
    { type: 'railing', from: [-3, 3, 9.5], to: [3, 3, 9.5], height: 1 },
  ],
}

describe('buildVenueGroup', () => {
  const seats = allSeats(venue)
  const group = buildVenueGroup(venue, seats)

  it('좌석 수만큼 인스턴스를 가진 InstancedMesh를 만든다', () => {
    const seatMesh = group.getObjectByName('seats') as THREE.InstancedMesh
    expect(seatMesh).toBeInstanceOf(THREE.InstancedMesh)
    expect(seatMesh.count).toBe(seats.length)
  })

  it('첫 좌석 인스턴스는 좌석 위치 위에 놓인다', () => {
    const seatMesh = group.getObjectByName('seats') as THREE.InstancedMesh
    const m = new THREE.Matrix4()
    seatMesh.getMatrixAt(0, m)
    const p = new THREE.Vector3().setFromMatrixPosition(m)
    expect(p.x).toBeCloseTo(seats[0].position[0], 5)
    expect(p.y).toBeGreaterThan(seats[0].position[1])
    expect(p.z).toBeCloseTo(seats[0].position[2], 5)
  })

  it('무대, 방해물, 조명을 포함한다', () => {
    expect(group.getObjectByName('stage')).toBeDefined()
    expect(group.getObjectByName('obstacles')!.children).toHaveLength(2)
    expect(group.children.some((c) => (c as THREE.Light).isLight)).toBe(true)
  })

  it('tiles InstancedMesh도 좌석 수만큼이다', () => {
    const tileMesh = group.getObjectByName('tiles') as THREE.InstancedMesh
    expect(tileMesh.count).toBe(seats.length)
  })

  it('좌석 인스턴스는 무대 중앙을 바라본다', () => {
    const seatMesh = group.getObjectByName('seats') as THREE.InstancedMesh
    const m = new THREE.Matrix4()
    seatMesh.getMatrixAt(0, m)
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    m.decompose(pos, quat, scale)
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat)
    const dx = venue.stage.center[0] - seats[0].position[0]
    const dz = venue.stage.center[2] - seats[0].position[2]
    const len = Math.hypot(dx, dz)
    expect(forward.x).toBeCloseTo(dx / len, 5)
    expect(forward.z).toBeCloseTo(dz / len, 5)
    expect(forward.y).toBeCloseTo(0, 5)
  })

  it('난간은 from→to 길이와 방향을 가진다', () => {
    const obstacles = group.getObjectByName('obstacles')!
    const pillar = obstacles.children[0] as THREE.Mesh
    expect(pillar.position.y).toBe(5)
    const railing = obstacles.children[1] as THREE.Mesh
    const params = (railing.geometry as THREE.BoxGeometry).parameters
    expect(params.depth).toBeCloseTo(6, 5)
    expect(railing.rotation.y).toBeCloseTo(Math.PI / 2, 5)
  })

  it('disposeVenueGroup는 지오메트리와 재질을 dispose한다', () => {
    const fresh = buildVenueGroup(venue, seats)
    const mesh = fresh.getObjectByName('stage')!.children[0] as THREE.Mesh
    const geomSpy = vi.spyOn(mesh.geometry, 'dispose')
    const material = mesh.material as THREE.Material
    const matSpy = vi.spyOn(material, 'dispose')
    const seatMesh = fresh.getObjectByName('seats') as THREE.InstancedMesh
    const instancedSpy = vi.spyOn(seatMesh, 'dispose')
    disposeVenueGroup(fresh)
    expect(geomSpy).toHaveBeenCalled()
    expect(matSpy).toHaveBeenCalled()
    expect(instancedSpy).toHaveBeenCalled()
  })
})
